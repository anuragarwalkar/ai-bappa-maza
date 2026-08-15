import { useState, useRef, useCallback, useEffect } from 'react';
import { CONFIG } from '../constants/config';
import { STRINGS } from '../constants/marathiStrings';
import { postBlessing } from '../services/api';

/**
 * Custom hook to manage blessing API request flow, devotee snapshot, TTS audio playback, waveform, and cooldown countdown
 */
export function useBlessing({
  videoRef,
  onStartBlessingAudio,
  onEndBlessingAudio,
  onPlayBell,
  onStartAmbience,
  onStopAmbience,
  onSpawnPetals
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [blessingText, setBlessingText] = useState('');
  const [blessingStatus, setBlessingStatus] = useState(STRINGS.STATUS_WAITING);
  const [isCooldownActive, setIsCooldownActive] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [processingMsg, setProcessingMsg] = useState(STRINGS.DEVOTIONAL_PROCESSING_MSGS[0]);
  const [lastBlessingData, setLastBlessingData] = useState(null);

  const audioRef = useRef(null);
  const cooldownIntervalRef = useRef(null);
  const msgTimerRef = useRef(null);
  const isProcessingRef = useRef(isProcessing);
  const isPlayingAudioRef = useRef(isPlayingAudio);

  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);

  useEffect(() => {
    isPlayingAudioRef.current = isPlayingAudio;
  }, [isPlayingAudio]);

  // Capture clean devotee snapshot from webcam
  const captureDevoteeSnapshot = useCallback(() => {
    try {
      const video = videoRef?.current;
      if (!video || !video.videoWidth || !video.videoHeight) {
        return null;
      }
      const snapCanvas = document.createElement('canvas');
      const maxDim = 640;
      let w = video.videoWidth;
      let h = video.videoHeight;
      if (w > maxDim || h > maxDim) {
        const ratio = Math.min(maxDim / w, maxDim / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }
      snapCanvas.width = w;
      snapCanvas.height = h;
      const snapCtx = snapCanvas.getContext('2d');
      if (snapCtx) {
        snapCtx.drawImage(video, 0, 0, w, h);
        return snapCanvas.toDataURL('image/jpeg', 0.85);
      }
      return null;
    } catch (err) {
      console.warn('Could not capture devotee snapshot:', err);
      return null;
    }
  }, [videoRef]);

  // Start 10-second cooldown countdown
  const startCooldownCountdown = useCallback(() => {
    setIsCooldownActive(true);
    let remaining = Math.ceil(CONFIG.COOLDOWN_DURATION_MS / 1000);
    setCooldownRemaining(remaining);

    if (cooldownIntervalRef.current) {
      clearInterval(cooldownIntervalRef.current);
    }

    cooldownIntervalRef.current = setInterval(() => {
      remaining -= 1;
      setCooldownRemaining(remaining);
      if (remaining <= 0) {
        clearInterval(cooldownIntervalRef.current);
        setIsCooldownActive(false);
      }
    }, 1000);
  }, []);

  // Web Speech API Marathi fallback synthesizer
  const fallbackSpeechSynthesis = useCallback((text) => {
    if (!('speechSynthesis' in window)) {
      onEndBlessingAudio?.();
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'mr-IN';
    utterance.rate = 0.9;
    utterance.pitch = 0.85;

    setIsPlayingAudio(true);
    onStartBlessingAudio?.();

    utterance.onend = () => {
      setIsPlayingAudio(false);
      onEndBlessingAudio?.();
    };
    utterance.onerror = () => {
      setIsPlayingAudio(false);
      onEndBlessingAudio?.();
    };
    window.speechSynthesis.speak(utterance);
  }, [onStartBlessingAudio, onEndBlessingAudio]);

  // Play audio blessing
  const playAudioBlessing = useCallback((audioBase64) => {
    if (!audioRef.current) return;
    setIsPlayingAudio(true);
    onStartBlessingAudio?.();

    const audio = audioRef.current;
    audio.src = audioBase64;

    audio.onplay = () => {
      onStartBlessingAudio?.();
    };

    audio.play().catch(e => {
      console.warn('Auto-play blocked by browser. User can click replay button:', e);
      setIsPlayingAudio(false);
      onEndBlessingAudio?.();
    });

    audio.onended = () => {
      setIsPlayingAudio(false);
      onEndBlessingAudio?.();
    };

    audio.onerror = () => {
      setIsPlayingAudio(false);
      onEndBlessingAudio?.();
    };
  }, [onStartBlessingAudio, onEndBlessingAudio]);

  // Trigger divine blessing flow
  const triggerDivineBlessing = useCallback(async () => {
    if (isProcessingRef.current || isPlayingAudioRef.current || isCooldownActive) return;

    setIsProcessing(true);

    // 1. Pause foreground music & play bell
    onStartBlessingAudio?.();
    onPlayBell?.();

    // 2. Start ambience chime & flower petals
    onStartAmbience?.();
    onSpawnPetals?.(40);

    setBlessingStatus(STRINGS.STATUS_PROCESSING);

    // 3. Rotating devotional messages
    let msgIdx = 0;
    setProcessingMsg(STRINGS.DEVOTIONAL_PROCESSING_MSGS[0]);
    if (msgTimerRef.current) clearInterval(msgTimerRef.current);
    msgTimerRef.current = setInterval(() => {
      msgIdx = (msgIdx + 1) % STRINGS.DEVOTIONAL_PROCESSING_MSGS.length;
      setProcessingMsg(STRINGS.DEVOTIONAL_PROCESSING_MSGS[msgIdx]);
    }, 1600);

    // 4. Devotee photo capture
    const devoteePhoto = captureDevoteeSnapshot();

    try {
      const data = await postBlessing({
        image: devoteePhoto,
        timestamp: new Date().toISOString()
      });

      onStopAmbience?.(0.5);
      if (msgTimerRef.current) clearInterval(msgTimerRef.current);
      setIsProcessing(false);

      if (data && data.blessing) {
        setLastBlessingData(data);
        setBlessingText(data.blessing);
        setBlessingStatus(STRINGS.STATUS_RECEIVED);

        if (data.audio) {
          playAudioBlessing(data.audio);
        } else {
          fallbackSpeechSynthesis(data.blessing);
        }
      } else {
        setBlessingText(STRINGS.DEFAULT_BLESSING);
        onEndBlessingAudio?.();
      }
    } catch (err) {
      console.error('Error fetching blessing:', err);
      onStopAmbience?.(0.5);
      if (msgTimerRef.current) clearInterval(msgTimerRef.current);
      setIsProcessing(false);

      setBlessingText(STRINGS.OFFLINE_FALLBACK_BLESSING);
      setBlessingStatus(STRINGS.STATUS_OFFLINE);
      onEndBlessingAudio?.();
    } finally {
      startCooldownCountdown();
    }
  }, [
    isCooldownActive,
    onStartBlessingAudio,
    onPlayBell,
    onStartAmbience,
    onSpawnPetals,
    onStopAmbience,
    onEndBlessingAudio,
    captureDevoteeSnapshot,
    playAudioBlessing,
    fallbackSpeechSynthesis,
    startCooldownCountdown
  ]);

  // Replay last audio
  const replayAudio = useCallback(() => {
    if (!lastBlessingData) return;
    onStartBlessingAudio?.();
    if (lastBlessingData.audio) {
      playAudioBlessing(lastBlessingData.audio);
    } else if (lastBlessingData.blessing) {
      fallbackSpeechSynthesis(lastBlessingData.blessing);
    }
  }, [lastBlessingData, onStartBlessingAudio, playAudioBlessing, fallbackSpeechSynthesis]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
      if (msgTimerRef.current) clearInterval(msgTimerRef.current);
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  return {
    audioRef,
    isProcessing,
    isPlayingAudio,
    blessingText,
    blessingStatus,
    isCooldownActive,
    cooldownRemaining,
    processingMsg,
    hasLastBlessing: !!lastBlessingData,
    triggerDivineBlessing,
    replayAudio
  };
}
