export const CONFIG = {
  COOLDOWN_DURATION_MS: 100000, // 10 seconds cooldown between blessings
  HOLD_TARGET_TIME_MS: 250,    // 0.25s hold for instant responsive detection
  HOLD_DECAY_RATE_MS: 250,     // Decay rate when gesture breaks
  HOLD_CIRCLE_RADIUS: 38,
  HOLD_CIRCUMFERENCE: 2 * Math.PI * 38, // ≈ 238.76px
  TARGET_FG_VOLUME: 0.65,      // Target foreground playlist volume
  TARGET_BG_AMBIENCE_VOL: 0.4, // Target background processing chime volume
  CAMERA_WIDTH: 640,
  CAMERA_HEIGHT: 480,
  HANDS_MAX_NUM: 2,
  HANDS_MODEL_COMPLEXITY: 0,   // Lite model for minimal inference latency
  HANDS_MIN_DETECTION_CONFIDENCE: 0.25,
  HANDS_MIN_TRACKING_CONFIDENCE: 0.25,
};
