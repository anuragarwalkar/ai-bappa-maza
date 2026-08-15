import { useState, useRef, useEffect, useCallback } from 'react';
import { CONFIG } from '../constants/config';
import { STRINGS } from '../constants/marathiStrings';
import { evaluateNamaskarGesture } from '../utils/gesture';

/**
 * Custom hook to initialize MediaPipe Hands, webcam stream, canvas rendering, and gesture detection
 */
export function useMediaPipeHands({
  onTriggerBlessing,
  isCooldownActive,
  isBlessingActive,
  isDetectionEnabled = true
}) {
  const [cameraStatus, setCameraStatus] = useState(STRINGS.WEBCAM_LIVE);
  const [isCameraLive, setIsCameraLive] = useState(true);
  const [handsCount, setHandsCount] = useState(0);
  const [gestureInstruction, setGestureInstruction] = useState(STRINGS.GESTURE_PROMPT_INITIAL);
  const [holdProgress, setHoldProgress] = useState(0);
  const [fps, setFps] = useState(30);
  const [diagnostics, setDiagnostics] = useState({
    distance: '--',
    verticalAlign: '--',
    verticalOk: false,
    confidence: '0%',
    status: STRINGS.DIAG_SEARCHING
  });

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const handsRef = useRef(null);
  const cameraRef = useRef(null);
  const lastFrameTimeRef = useRef(performance.now());
  const holdProgressRef = useRef(0);
  const isCooldownActiveRef = useRef(isCooldownActive);
  const isBlessingActiveRef = useRef(isBlessingActive);
  const isDetectionEnabledRef = useRef(isDetectionEnabled);
  const onTriggerBlessingRef = useRef(onTriggerBlessing);

  // Sync refs with latest state/props
  useEffect(() => {
    isCooldownActiveRef.current = isCooldownActive;
  }, [isCooldownActive]);

  useEffect(() => {
    isBlessingActiveRef.current = isBlessingActive;
  }, [isBlessingActive]);

  useEffect(() => {
    isDetectionEnabledRef.current = isDetectionEnabled;
    if (!isDetectionEnabled) {
      holdProgressRef.current = 0;
      setHoldProgress(0);
      setGestureInstruction(STRINGS.GESTURE_PROMPT_DISABLED);
      setDiagnostics(prev => ({
        ...prev,
        distance: '--',
        verticalAlign: '--',
        verticalOk: false,
        confidence: '0%',
        status: STRINGS.DIAG_DETECTION_DISABLED
      }));
    } else {
      setGestureInstruction(STRINGS.GESTURE_PROMPT_INITIAL);
    }
  }, [isDetectionEnabled]);

  useEffect(() => {
    onTriggerBlessingRef.current = onTriggerBlessing;
  }, [onTriggerBlessing]);

  // Handle gesture state progression frame by frame
  const handleGestureProgression = useCallback((evalResult, deltaMs) => {
    if (!isDetectionEnabledRef.current) {
      holdProgressRef.current = 0;
      setHoldProgress(0);
      setDiagnostics(prev => ({
        ...prev,
        distance: '--',
        verticalAlign: '--',
        verticalOk: false,
        confidence: '0%',
        status: STRINGS.DIAG_DETECTION_DISABLED
      }));
      setGestureInstruction(STRINGS.GESTURE_PROMPT_DISABLED);
      return;
    }

    if (isCooldownActiveRef.current) {
      setDiagnostics(prev => ({
        ...prev,
        status: STRINGS.DIAG_COOLDOWN
      }));
      holdProgressRef.current = 0;
      setHoldProgress(0);
      return;
    }

    if (isBlessingActiveRef.current) {
      setDiagnostics(prev => ({
        ...prev,
        status: STRINGS.DIAG_ACTIVE
      }));
      return;
    }

    if (evalResult.isNamaskar) {
      holdProgressRef.current += deltaMs / CONFIG.HOLD_TARGET_TIME_MS;
      setDiagnostics(prev => ({
        ...prev,
        status: `${evalResult.mode || 'हात'} मान्य!`
      }));
      setGestureInstruction(STRINGS.GESTURE_PROMPT_HOLDING);

      if (holdProgressRef.current >= 1.0) {
        holdProgressRef.current = 1.0;
        setHoldProgress(1.0);
        if (onTriggerBlessingRef.current) {
          onTriggerBlessingRef.current();
        }
      } else {
        setHoldProgress(holdProgressRef.current);
      }
    } else {
      // Decay progress smoothly if gesture breaks
      holdProgressRef.current = Math.max(0, holdProgressRef.current - (deltaMs / CONFIG.HOLD_DECAY_RATE_MS));
      setHoldProgress(holdProgressRef.current);

      if (holdProgressRef.current === 0) {
        setDiagnostics(prev => ({
          ...prev,
          status: evalResult.mode || STRINGS.DIAG_SEARCHING
        }));
        setGestureInstruction(STRINGS.GESTURE_PROMPT_INITIAL);
      }
    }
  }, []);

  // Frame processing callback
  const onResults = useCallback((results) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    // Calculate FPS
    const now = performance.now();
    const delta = now - lastFrameTimeRef.current;
    lastFrameTimeRef.current = now;
    if (delta > 0) {
      setFps(Math.round(1000 / delta));
    }

    // Clear and draw video feed onto canvas
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    canvasCtx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    const handsPresent = results.multiHandLandmarks ? results.multiHandLandmarks.length : 0;
    setHandsCount(handsPresent);

    // Evaluate gesture pose
    const evalResult = evaluateNamaskarGesture(results.multiHandLandmarks);

    // Update Telemetry Diagnostics
    if (isDetectionEnabledRef.current) {
      setDiagnostics(prev => ({
        ...prev,
        distance: evalResult.distance < 10 ? (evalResult.isNamaskar ? STRINGS.DIAG_VALID_POSTURE : evalResult.distance.toFixed(2)) : '--',
        verticalAlign: evalResult.verticalOk ? STRINGS.DIAG_ALIGNED : STRINGS.DIAG_NOT_ALIGNED,
        verticalOk: evalResult.verticalOk,
        confidence: `${Math.round(evalResult.confidence * 100)}%`
      }));
    } else {
      setDiagnostics(prev => ({
        ...prev,
        distance: '--',
        verticalAlign: '--',
        verticalOk: false,
        confidence: '0%',
        status: STRINGS.DIAG_DETECTION_DISABLED
      }));
    }

    // Draw landmark joints & connectors
    if (results.multiHandLandmarks && window.drawConnectors && window.drawLandmarks && window.HAND_CONNECTIONS) {
      const isEnabled = isDetectionEnabledRef.current;
      for (const landmarks of results.multiHandLandmarks) {
        window.drawConnectors(canvasCtx, landmarks, window.HAND_CONNECTIONS, {
          color: isEnabled
            ? (evalResult.isNamaskar ? '#00E676' : 'rgba(255, 180, 0, 0.85)')
            : 'rgba(255, 255, 255, 0.25)',
          lineWidth: isEnabled ? (evalResult.isNamaskar ? 4 : 2.5) : 1.5
        });

        window.drawLandmarks(canvasCtx, landmarks, {
          color: isEnabled ? (evalResult.isNamaskar ? '#FFD700' : '#FF6600') : 'rgba(255, 255, 255, 0.4)',
          fillColor: isEnabled ? (evalResult.isNamaskar ? '#FFF' : '#FFD700') : 'rgba(255, 255, 255, 0.6)',
          lineWidth: 1.5,
          radius: isEnabled ? (evalResult.isNamaskar ? 5 : 3) : 2.5
        });
      }
    }

    canvasCtx.restore();

    // Advance Gesture State Machine
    handleGestureProgression(evalResult, delta);
  }, [handleGestureProgression]);

  // Start webcam camera
  const startCamera = useCallback(() => {
    if (!videoRef.current || typeof window.Camera === 'undefined') return;

    if (cameraRef.current) {
      try { cameraRef.current.stop(); } catch(e) {}
    }

    const camera = new window.Camera(videoRef.current, {
      onFrame: async () => {
        if (handsRef.current && videoRef.current) {
          await handsRef.current.send({ image: videoRef.current });
        }
      },
      width: CONFIG.CAMERA_WIDTH,
      height: CONFIG.CAMERA_HEIGHT
    });

    cameraRef.current = camera;

    camera.start()
      .then(() => {
        setCameraStatus(STRINGS.WEBCAM_LIVE);
        setIsCameraLive(true);
      })
      .catch(err => {
        console.error('Camera access failed:', err);
        setCameraStatus(STRINGS.WEBCAM_ERROR);
        setIsCameraLive(false);
        setGestureInstruction(STRINGS.CAMERA_PERMISSION_PROMPT);
      });
  }, []);

  // Initialize MediaPipe Hands instance
  useEffect(() => {
    if (typeof window.Hands === 'undefined') {
      console.warn('MediaPipe Hands script not loaded from CDN yet.');
      return;
    }

    const hands = new window.Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    hands.setOptions({
      maxNumHands: CONFIG.HANDS_MAX_NUM,
      modelComplexity: CONFIG.HANDS_MODEL_COMPLEXITY,
      minDetectionConfidence: CONFIG.HANDS_MIN_DETECTION_CONFIDENCE,
      minTrackingConfidence: CONFIG.HANDS_MIN_TRACKING_CONFIDENCE
    });

    hands.onResults(onResults);
    handsRef.current = hands;

    startCamera();

    return () => {
      if (cameraRef.current) {
        try { cameraRef.current.stop(); } catch(e) {}
      }
      if (handsRef.current) {
        try { handsRef.current.close(); } catch(e) {}
      }
    };
  }, [onResults, startCamera]);

  return {
    videoRef,
    canvasRef,
    cameraStatus,
    isCameraLive,
    handsCount,
    gestureInstruction,
    holdProgress,
    fps,
    diagnostics,
    startCamera
  };
}
