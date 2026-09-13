import { useState, useRef, useEffect, useCallback } from 'react';
import { CONFIG } from '../constants/config';
import { playTempleBellHarmonics } from '../utils/sound';
import { fetchForegroundMusicList } from '../services/api';

/**
 * Custom hook to manage temple bells, foreground devotional playlist, and ambient audio
 */
export function useAudioEngine() {
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [isFgMusicEnabled, setIsFgMusicEnabled] = useState(true);
  const [isFgPlaying, setIsFgPlaying] = useState(false);
  const [fgPlaylist, setFgPlaylist] = useState(['/forground_music/first.mp3']);
  const [fgTrackIndex, setFgTrackIndex] = useState(0);

  const audioCtxRef = useRef(null);
  const fgMusicRef = useRef(null);
  const bgMusicRef = useRef(null);
  const fgFadeIntervalRef = useRef(null);
  const bgFadeIntervalRef = useRef(null);
  const isSoundMutedRef = useRef(isSoundMuted);
  const isFgMusicEnabledRef = useRef(isFgMusicEnabled);
  const isVoiceActiveRef = useRef(false);
  const fgTrackIndexRef = useRef(fgTrackIndex);
  const fgPlaylistRef = useRef(fgPlaylist);

  // Sync refs with state
  useEffect(() => {
    isSoundMutedRef.current = isSoundMuted;
  }, [isSoundMuted]);

  useEffect(() => {
    isFgMusicEnabledRef.current = isFgMusicEnabled;
  }, [isFgMusicEnabled]);

  useEffect(() => {
    fgTrackIndexRef.current = fgTrackIndex;
  }, [fgTrackIndex]);

  useEffect(() => {
    fgPlaylistRef.current = fgPlaylist;
  }, [fgPlaylist]);

  // Lazy AudioContext initializer
  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        audioCtxRef.current = new AudioCtxClass();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  // Temple bell player
  const playTempleBell = useCallback(() => {
    if (isSoundMutedRef.current) return;
    const ctx = getAudioContext();
    if (ctx) {
      playTempleBellHarmonics(ctx);
    }
  }, [getAudioContext]);

  // Load a foreground track
  const loadForegroundTrack = useCallback((index) => {
    const list = fgPlaylistRef.current;
    if (!list || list.length === 0 || !fgMusicRef.current) return;
    const safeIndex = ((index % list.length) + list.length) % list.length;
    setFgTrackIndex(safeIndex);
    fgTrackIndexRef.current = safeIndex;
    fgMusicRef.current.src = list[safeIndex];
    fgMusicRef.current.load();
    console.log(`🎵 [Foreground Music] Loaded track ${safeIndex + 1}/${list.length}: ${list[safeIndex]}`);
  }, []);

  // Play foreground playlist music with fade-in
  const playForegroundMusic = useCallback((forceInstant = false) => {
    if (isSoundMutedRef.current || isVoiceActiveRef.current || !isFgMusicEnabledRef.current || !fgMusicRef.current) return;
    try {
      if (fgFadeIntervalRef.current) {
        clearInterval(fgFadeIntervalRef.current);
        fgFadeIntervalRef.current = null;
      }

      const fg = fgMusicRef.current;
      if (!fg.src || fg.src === '' || fg.src.endsWith('/')) {
        loadForegroundTrack(fgTrackIndexRef.current);
      }

      const playPromise = fg.play();
      if (playPromise) {
        playPromise
          .then(() => {
            if (isVoiceActiveRef.current || !isFgMusicEnabledRef.current) {
              fg.pause();
              setIsFgPlaying(false);
              return;
            }
            setIsFgPlaying(true);
            if (forceInstant) {
              fg.volume = CONFIG.TARGET_FG_VOLUME;
            } else {
              let vol = fg.volume;
              fgFadeIntervalRef.current = setInterval(() => {
                if (isVoiceActiveRef.current || !isFgMusicEnabledRef.current) {
                  clearInterval(fgFadeIntervalRef.current);
                  fgFadeIntervalRef.current = null;
                  fg.pause();
                  setIsFgPlaying(false);
                  return;
                }
                vol = Math.min(CONFIG.TARGET_FG_VOLUME, vol + 0.05);
                fg.volume = vol;
                if (vol >= CONFIG.TARGET_FG_VOLUME) {
                  clearInterval(fgFadeIntervalRef.current);
                  fgFadeIntervalRef.current = null;
                }
              }, 50);
            }
          })
          .catch(err => {
            console.log('🔇 [Foreground Music] Autoplay waiting for user gesture:', err.message);
            setIsFgPlaying(false);
          });
      }
    } catch (e) {
      console.warn('playForegroundMusic error:', e);
    }
  }, [loadForegroundTrack]);

  // Pause foreground playlist music with fade-out
  const pauseForegroundMusic = useCallback((fadeDuration = 0.2) => {
    isVoiceActiveRef.current = true;
    if (!fgMusicRef.current) return;
    try {
      if (fgFadeIntervalRef.current) {
        clearInterval(fgFadeIntervalRef.current);
        fgFadeIntervalRef.current = null;
      }
      const fg = fgMusicRef.current;
      if (fadeDuration <= 0.05) {
        fg.pause();
        fg.volume = 0;
        setIsFgPlaying(false);
        return;
      }
      const steps = 8;
      const stepTime = (fadeDuration * 1000) / steps;
      const volStep = (fg.volume || CONFIG.TARGET_FG_VOLUME) / steps;

      fgFadeIntervalRef.current = setInterval(() => {
        const newVol = Math.max(0, fg.volume - volStep);
        fg.volume = newVol;
        if (newVol <= 0.01) {
          clearInterval(fgFadeIntervalRef.current);
          fgFadeIntervalRef.current = null;
          fg.pause();
          fg.volume = 0;
          setIsFgPlaying(false);
        }
      }, stepTime);
    } catch (e) {
      console.warn('pauseForegroundMusic error:', e);
      try {
        fgMusicRef.current.pause();
        fgMusicRef.current.volume = 0;
        setIsFgPlaying(false);
      } catch (_) {}
    }
  }, []);

  // Resume foreground music after divine blessing ends
  const resumeForegroundMusic = useCallback(() => {
    isVoiceActiveRef.current = false;
    if (isSoundMutedRef.current || !isFgMusicEnabledRef.current) return;
    setTimeout(() => {
      if (!isVoiceActiveRef.current && !isSoundMutedRef.current && isFgMusicEnabledRef.current) {
        playForegroundMusic();
      }
    }, 400);
  }, [playForegroundMusic]);

  // Ambient chime player (during Gemini API processing)
  const startDevotionalAmbience = useCallback(() => {
    if (isSoundMutedRef.current || !bgMusicRef.current) return;
    try {
      if (bgFadeIntervalRef.current) {
        clearInterval(bgFadeIntervalRef.current);
        bgFadeIntervalRef.current = null;
      }
      const bg = bgMusicRef.current;
      bg.currentTime = 0;
      bg.volume = 0;
      const p = bg.play();
      if (p) p.catch(() => {});

      let vol = 0;
      bgFadeIntervalRef.current = setInterval(() => {
        vol = Math.min(CONFIG.TARGET_BG_AMBIENCE_VOL, vol + 0.04);
        bg.volume = vol;
        if (vol >= CONFIG.TARGET_BG_AMBIENCE_VOL) {
          clearInterval(bgFadeIntervalRef.current);
          bgFadeIntervalRef.current = null;
        }
      }, 50);
    } catch (e) {}
  }, []);

  const stopDevotionalAmbience = useCallback((fadeDuration = 0.5) => {
    if (!bgMusicRef.current) return;
    try {
      if (bgFadeIntervalRef.current) {
        clearInterval(bgFadeIntervalRef.current);
        bgFadeIntervalRef.current = null;
      }
      const bg = bgMusicRef.current;
      const steps = 10;
      const stepTime = (fadeDuration * 1000) / steps;
      const volStep = (bg.volume || CONFIG.TARGET_BG_AMBIENCE_VOL) / steps;
      bgFadeIntervalRef.current = setInterval(() => {
        const newVol = Math.max(0, bg.volume - volStep);
        bg.volume = newVol;
        if (newVol <= 0.01) {
          clearInterval(bgFadeIntervalRef.current);
          bgFadeIntervalRef.current = null;
          bg.pause();
          bg.volume = 0;
        }
      }, stepTime);
    } catch (e) {
      try { bgMusicRef.current.pause(); } catch (_) {}
    }
  }, []);

  // Toggle foreground music explicitly
  const setForegroundMusicEnabled = useCallback((enabled) => {
    const nextEnabled = Boolean(enabled);
    isFgMusicEnabledRef.current = nextEnabled;
    setIsFgMusicEnabled(nextEnabled);

    if (!nextEnabled) {
      if (fgFadeIntervalRef.current) {
        clearInterval(fgFadeIntervalRef.current);
        fgFadeIntervalRef.current = null;
      }
      if (fgMusicRef.current) {
        fgMusicRef.current.pause();
      }
      setIsFgPlaying(false);
    } else {
      if (!isSoundMutedRef.current && !isVoiceActiveRef.current) {
        playForegroundMusic();
      }
    }
  }, [playForegroundMusic]);

  const toggleForegroundMusic = useCallback(() => {
    setForegroundMusicEnabled(!isFgMusicEnabledRef.current);
  }, [setForegroundMusicEnabled]);

  // Toggle master sound mute/unmute
  const setSoundMuted = useCallback((muted) => {
    const nextMuted = Boolean(muted);
    isSoundMutedRef.current = nextMuted;
    setIsSoundMuted(nextMuted);

    if (fgMusicRef.current) {
      fgMusicRef.current.muted = nextMuted;
    }
    if (bgMusicRef.current) {
      bgMusicRef.current.muted = nextMuted;
    }

    if (nextMuted) {
      // Mute: Pause fg and bg audio immediately, clear any fade intervals
      if (fgFadeIntervalRef.current) {
        clearInterval(fgFadeIntervalRef.current);
        fgFadeIntervalRef.current = null;
      }
      if (bgFadeIntervalRef.current) {
        clearInterval(bgFadeIntervalRef.current);
        bgFadeIntervalRef.current = null;
      }
      if (fgMusicRef.current) {
        fgMusicRef.current.pause();
      }
      if (bgMusicRef.current) {
        bgMusicRef.current.pause();
      }
      setIsFgPlaying(false);
    } else {
      // Unmute: Restore audio and play temple bell chime
      if (!isVoiceActiveRef.current) {
        const ctx = getAudioContext();
        if (ctx) {
          playTempleBellHarmonics(ctx);
        }
        if (fgMusicRef.current && isFgMusicEnabledRef.current) {
          const fg = fgMusicRef.current;
          if (!fg.src || fg.src === '' || fg.src.endsWith('/')) {
            loadForegroundTrack(fgTrackIndexRef.current);
          }
          fg.volume = CONFIG.TARGET_FG_VOLUME;
          const p = fg.play();
          if (p) {
            p.then(() => setIsFgPlaying(true))
             .catch(err => console.log('🔇 [Audio Engine] Unmute autoplay waiting for interaction:', err.message));
          }
        }
      }
    }
  }, [getAudioContext, loadForegroundTrack]);

  const toggleSound = useCallback(() => {
    setSoundMuted(!isSoundMutedRef.current);
  }, [setSoundMuted]);

  // Initialize audio elements & playlist listener
  useEffect(() => {
    const fg = new Audio();
    fg.preload = 'auto';
    fg.volume = 0;
    fgMusicRef.current = fg;

    const bg = new Audio();
    bg.src = '/background_music.mp3';
    bg.loop = true;
    bg.volume = 0;
    bg.preload = 'auto';
    bgMusicRef.current = bg;

    // Handle track ended -> advance in infinite loop
    const handleEnded = () => {
      const list = fgPlaylistRef.current;
      const nextIndex = (fgTrackIndexRef.current + 1) % list.length;
      loadForegroundTrack(nextIndex);
      if (!isSoundMutedRef.current && !isVoiceActiveRef.current && isFgMusicEnabledRef.current) {
        playForegroundMusic(true);
      }
    };

    const handleError = (e) => {
      console.warn('⚠️ Foreground music error, loading next track:', e);
      const list = fgPlaylistRef.current;
      if (list.length > 1) {
        const nextIndex = (fgTrackIndexRef.current + 1) % list.length;
        loadForegroundTrack(nextIndex);
      }
    };

    fg.addEventListener('ended', handleEnded);
    fg.addEventListener('error', handleError);

    // Fetch dynamic track list
    fetchForegroundMusicList()
      .then(data => {
        if (data.success && Array.isArray(data.tracks) && data.tracks.length > 0) {
          setFgPlaylist(data.tracks);
          fgPlaylistRef.current = data.tracks;
        }
      })
      .catch(err => console.warn('Using fallback playlist:', err.message))
      .finally(() => {
        loadForegroundTrack(0);
        if (!isVoiceActiveRef.current && !isSoundMutedRef.current && isFgMusicEnabledRef.current) {
          playForegroundMusic();
        }
      });

    // Browser audio unlock on first interaction
    const unlock = () => {
      getAudioContext();
      if (!isSoundMutedRef.current && !isVoiceActiveRef.current && !isFgPlaying && isFgMusicEnabledRef.current) {
        playForegroundMusic();
      }
    };
    window.addEventListener('click', unlock);
    window.addEventListener('touchstart', unlock);

    return () => {
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
      fg.removeEventListener('ended', handleEnded);
      fg.removeEventListener('error', handleError);
      fg.pause();
      bg.pause();
      if (fgFadeIntervalRef.current) clearInterval(fgFadeIntervalRef.current);
      if (bgFadeIntervalRef.current) clearInterval(bgFadeIntervalRef.current);
    };
  }, [loadForegroundTrack, playForegroundMusic, getAudioContext]);

  return {
    isSoundMuted,
    isFgMusicEnabled,
    isFgPlaying,
    fgTrackIndex,
    fgPlaylist,
    setSoundMuted,
    toggleSound,
    setForegroundMusicEnabled,
    toggleForegroundMusic,
    playTempleBell,
    playForegroundMusic,
    pauseForegroundMusic,
    resumeForegroundMusic,
    startDevotionalAmbience,
    stopDevotionalAmbience,
    getAudioContext
  };
}
