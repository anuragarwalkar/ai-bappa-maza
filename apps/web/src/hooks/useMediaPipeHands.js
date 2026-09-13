import { useState, useRef, useEffect, useCallback } from 'react';
import { CONFIG } from '../constants/config';
import { STRINGS } from '../constants/marathiStrings';
import { evaluateNamaskarGesture, isAnatomicalHand } from '../utils/gesture';

/**
 * Custom hook to initialize MediaPipe Hands, webcam stream, canvas rendering, and gesture detection
 */
export function useMediaPipeHands({
  onTriggerBlessing,
  isCooldownActive,
  isBlessingActive,
  isDetectionEnabled = false
}) {
  const [cameraStatus, setCameraStatus] = useState(STRINGS.WEBCAM_LIVE);
  const [isCameraLive, setIsCameraLive] = useState(true);
  const [handsCount, setHandsCount] = useState(0);
  const [gestureInstruction, setGestureInstruction] = useState(
    isDetectionEnabled ? STRINGS.GESTURE_PROMPT_INITIAL : STRINGS.GESTURE_PROMPT_DISABLED
  );
  const [holdProgress, setHoldProgress] = useState(0);
  const [fps, setFps] = useState(30);
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState(() => {
    try {
      return localStorage.getItem('ai_bappa_preferred_camera') || '';
    } catch (e) {
      return '';
    }
  });
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
  const streamRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const isStreamRunningRef = useRef(false);
  const selectedCameraIdRef = useRef(selectedCameraId);
  const lastFrameTimeRef = useRef(performance.now());
  const holdProgressRef = useRef(0);
  const isCooldownActiveRef = useRef(isCooldownActive);
  const isBlessingActiveRef = useRef(isBlessingActive);
  const isDetectionEnabledRef = useRef(isDetectionEnabled);
  const onTriggerBlessingRef = useRef(onTriggerBlessing);

  useEffect(() => {
    selectedCameraIdRef.current = selectedCameraId;
  }, [selectedCameraId]);

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

    // Filter out false detections (such as human faces or background clutter)
    const validHandLandmarks = [];
    if (results.multiHandLandmarks) {
      for (let i = 0; i < results.multiHandLandmarks.length; i++) {
        const landmarks = results.multiHandLandmarks[i];
        const handedness = results.multiHandedness && results.multiHandedness[i];
        const score = handedness ? handedness.score : 1.0;
        if (score >= 0.60 && isAnatomicalHand(landmarks)) {
          validHandLandmarks.push(landmarks);
        }
      }
    }

    setHandsCount(validHandLandmarks.length);

    // Evaluate gesture pose strictly on genuine hands
    const evalResult = evaluateNamaskarGesture(validHandLandmarks);

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

    // Draw landmark joints & connectors ONLY on valid hands (never on faces)
    if (validHandLandmarks.length > 0 && window.drawConnectors && window.drawLandmarks && window.HAND_CONNECTIONS) {
      const isEnabled = isDetectionEnabledRef.current;
      for (const landmarks of validHandLandmarks) {
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

  // Update available cameras list via navigator.mediaDevices.enumerateDevices
  const updateAvailableCameras = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return [];
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter(d => d.kind === 'videoinput');
      const formatted = videoInputs.map((d, idx) => ({
        deviceId: d.deviceId,
        label: d.label || `${STRINGS.CAMERA_DEFAULT_NAME} ${idx + 1}`
      }));
      setCameras(formatted);
      return formatted;
    } catch (err) {
      console.warn('Failed to enumerate video devices:', err);
      return [];
    }
  }, []);

  // Listen for device changes (e.g. plugging/unplugging a USB webcam)
  useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.addEventListener) return;
    const handleDeviceChange = () => {
      updateAvailableCameras();
    };
    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [updateAvailableCameras]);

  // Stop webcam camera
  const stopCamera = useCallback(() => {
    isStreamRunningRef.current = false;
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (cameraRef.current) {
      try { cameraRef.current.stop(); } catch(e) {}
      cameraRef.current = null;
    }
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach(track => track.stop());
      } catch (e) {}
      streamRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      try {
        const stream = videoRef.current.srcObject;
        if (stream && stream.getTracks) {
          stream.getTracks().forEach(track => track.stop());
        }
        videoRef.current.srcObject = null;
      } catch (e) {
        console.warn('Error stopping video stream tracks:', e);
      }
    }
    setIsCameraLive(false);
    setCameraStatus(STRINGS.STREAM_CAMERA_OFF);
    setGestureInstruction(STRINGS.STREAM_CAMERA_OFF);
    setHandsCount(0);
    setDiagnostics(prev => ({
      ...prev,
      distance: '--',
      verticalAlign: '--',
      verticalOk: false,
      confidence: '0%',
      status: STRINGS.STREAM_CAMERA_OFF
    }));

    // Clear canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#0f0709';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#FFA500';
        ctx.font = '20px "Tiro Devanagari Marathi", serif';
        ctx.textAlign = 'center';
        ctx.fillText(STRINGS.STREAM_CAMERA_OFF, canvas.width / 2, canvas.height / 2);
      }
    }
  }, []);

  // Start webcam camera with target deviceId support
  const startCamera = useCallback(async (targetDeviceId) => {
    const deviceId = targetDeviceId || selectedCameraIdRef.current;
    if (!videoRef.current) return;

    // Stop existing stream if any
    isStreamRunningRef.current = false;
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach(track => track.stop());
      } catch (e) {}
      streamRef.current = null;
    }

    setCameraStatus(STRINGS.SWITCHING_CAMERA);

    try {
      let stream;
      if (deviceId) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              deviceId: { exact: deviceId },
              width: { ideal: CONFIG.CAMERA_WIDTH },
              height: { ideal: CONFIG.CAMERA_HEIGHT }
            },
            audio: false
          });
        } catch (exactErr) {
          console.warn(`Exact camera (${deviceId}) failed, falling back to ideal:`, exactErr);
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              deviceId: { ideal: deviceId },
              width: { ideal: CONFIG.CAMERA_WIDTH },
              height: { ideal: CONFIG.CAMERA_HEIGHT }
            },
            audio: false
          });
        }
      } else {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: CONFIG.CAMERA_WIDTH },
            height: { ideal: CONFIG.CAMERA_HEIGHT }
          },
          audio: false
        });
      }

      streamRef.current = stream;
      const video = videoRef.current;
      video.srcObject = stream;

      await new Promise((resolve) => {
        if (video.readyState >= 1) {
          resolve();
        } else {
          video.onloadedmetadata = () => resolve();
        }
      });

      try {
        await video.play();
      } catch (playErr) {
        console.warn('Video play interrupted:', playErr);
      }

      // Update selected device ID based on active track
      const activeTrack = stream.getVideoTracks()[0];
      const activeDeviceId = activeTrack?.getSettings()?.deviceId || deviceId;
      if (activeDeviceId) {
        setSelectedCameraId(activeDeviceId);
        selectedCameraIdRef.current = activeDeviceId;
        try {
          localStorage.setItem('ai_bappa_preferred_camera', activeDeviceId);
        } catch (e) {}
      }

      // Refresh camera list with full labels now that permission is active
      await updateAvailableCameras();

      setIsCameraLive(true);
      setCameraStatus(STRINGS.WEBCAM_LIVE);
      setGestureInstruction(STRINGS.GESTURE_PROMPT_INITIAL);

      // Start processing loop
      isStreamRunningRef.current = true;
      let lastVideoTime = -1;
      let isProcessingFrame = false;

      const processLoop = async () => {
        if (!isStreamRunningRef.current) return;
        const vid = videoRef.current;
        if (
          vid &&
          !vid.paused &&
          !vid.ended &&
          vid.readyState >= 2 &&
          vid.currentTime !== lastVideoTime &&
          !isProcessingFrame
        ) {
          lastVideoTime = vid.currentTime;
          isProcessingFrame = true;
          try {
            if (handsRef.current) {
              await handsRef.current.send({ image: vid });
            }
          } catch (e) {
            // Drop frame on transient inference error
          } finally {
            isProcessingFrame = false;
          }
        }

        if (isStreamRunningRef.current) {
          animFrameIdRef.current = requestAnimationFrame(processLoop);
        }
      };

      animFrameIdRef.current = requestAnimationFrame(processLoop);
    } catch (err) {
      console.error('Camera access failed:', err);
      setCameraStatus(STRINGS.WEBCAM_ERROR);
      setIsCameraLive(false);
      setGestureInstruction(STRINGS.CAMERA_PERMISSION_PROMPT);
    }
  }, [updateAvailableCameras]);

  // Select camera from dropdown
  const selectCamera = useCallback((deviceId) => {
    setSelectedCameraId(deviceId);
    selectedCameraIdRef.current = deviceId;
    try {
      localStorage.setItem('ai_bappa_preferred_camera', deviceId);
    } catch (e) {}
    startCamera(deviceId);
  }, [startCamera]);

  // Toggle camera on/off
  const toggleCamera = useCallback(() => {
    if (isCameraLive) {
      stopCamera();
    } else {
      startCamera();
    }
  }, [isCameraLive, startCamera, stopCamera]);

  const setCameraEnabled = useCallback((enable) => {
    if (enable) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [startCamera, stopCamera]);

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
      isStreamRunningRef.current = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      if (streamRef.current) {
        try { streamRef.current.getTracks().forEach(t => t.stop()); } catch (e) {}
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
    cameras,
    selectedCameraId,
    selectCamera,
    startCamera,
    stopCamera,
    toggleCamera,
    setCameraEnabled
  };
}
