/**
 * Plays heavy brass temple bell harmonics using Web Audio API
 * @param {AudioContext} ctx 
 */
export function playTempleBellHarmonics(ctx) {
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const bellHarmonics = [
      { freq: 420,  vol: 0.70, decay: 3.5 },
      { freq: 840,  vol: 0.45, decay: 2.8 },
      { freq: 1260, vol: 0.30, decay: 2.2 },
      { freq: 1680, vol: 0.18, decay: 1.6 },
      { freq: 2520, vol: 0.10, decay: 1.2 },
      { freq: 210,  vol: 0.35, decay: 4.0 },
    ];

    bellHarmonics.forEach(({ freq, vol, decay }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.setValueAtTime(vol * 0.85, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + decay + 0.1);
    });
  } catch (e) {
    console.warn('Temple bell synthesis error:', e);
  }
}
