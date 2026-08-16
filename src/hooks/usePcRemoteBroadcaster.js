import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Custom hook running on the PC Main View (/)
 * Broadcasts state & live camera stream frames to connected mobile controllers,
 * and receives & executes incoming remote commands.
 */
export function usePcRemoteBroadcaster({
  canvasRef,
  videoRef,
  isCameraLive,
  isDetectionEnabled,
  isProcessing,
  isPlayingAudio,
  isCooldownActive,
  cooldownRemaining,
  handsCount,
  fps,
  blessingText,
  blessingStatus,
  hasLastBlessing,
  isSoundMuted,
  onTriggerBlessing,
  onToggleDetection,
  onSetDetection,
  onToggleCamera,
  onSetCamera,
  onReplayAudio,
  onToggleSound,
  onSetSound
}) {
  const [isConnected, setIsConnected] = useState(false);
  const [controllerCount, setControllerCount] = useState(0);

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const frameIntervalRef = useRef(null);
  const offscreenCanvasRef = useRef(null);

  // Keep latest callbacks and states in refs for WebSocket handlers
  const handlersRef = useRef({
    onTriggerBlessing,
    onToggleDetection,
    onSetDetection,
    onToggleCamera,
    onSetCamera,
    onReplayAudio,
    onToggleSound,
    onSetSound
  });

  useEffect(() => {
    handlersRef.current = {
      onTriggerBlessing,
      onToggleDetection,
      onSetDetection,
      onToggleCamera,
      onSetCamera,
      onReplayAudio,
      onToggleSound,
      onSetSound
    };
  }, [
    onTriggerBlessing,
    onToggleDetection,
    onSetDetection,
    onToggleCamera,
    onSetCamera,
    onReplayAudio,
    onToggleSound,
    onSetSound
  ]);

  // Keep latest state in ref as well
  const currentStateRef = useRef({
    isCameraLive,
    isDetectionEnabled,
    isProcessing,
    isPlayingAudio,
    isCooldownActive,
    cooldownRemaining,
    handsCount,
    fps,
    blessingText,
    blessingStatus,
    hasLastBlessing,
    isSoundMuted
  });

  useEffect(() => {
    currentStateRef.current = {
      isCameraLive,
      isDetectionEnabled,
      isProcessing,
      isPlayingAudio,
      isCooldownActive,
      cooldownRemaining,
      handsCount,
      fps,
      blessingText,
      blessingStatus,
      hasLastBlessing,
      isSoundMuted
    };
  }, [
    isCameraLive,
    isDetectionEnabled,
    isProcessing,
    isPlayingAudio,
    isCooldownActive,
    cooldownRemaining,
    handsCount,
    fps,
    blessingText,
    blessingStatus,
    hasLastBlessing,
    isSoundMuted
  ]);

  // Send state update whenever any state variable changes
  useEffect(() => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'STATE_UPDATE',
        role: 'PC',
        state: {
          isCameraLive,
          isDetectionEnabled,
          isProcessing,
          isPlayingAudio,
          isCooldownActive,
          cooldownRemaining,
          handsCount,
          fps,
          blessingText,
          blessingStatus,
          hasLastBlessing,
          isSoundMuted
        }
      }));
    }
  }, [
    isCameraLive,
    isDetectionEnabled,
    isProcessing,
    isPlayingAudio,
    isCooldownActive,
    cooldownRemaining,
    handsCount,
    fps,
    blessingText,
    blessingStatus,
    hasLastBlessing,
    isSoundMuted
  ]);

  // Initialize and maintain WebSocket connection
  useEffect(() => {
    let isUnmounted = false;

    function connect() {
      if (isUnmounted) return;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (isUnmounted) return;
          setIsConnected(true);
          // Register as PC
          ws.send(JSON.stringify({ type: 'REGISTER', role: 'PC' }));
          // Send initial state snapshot
          ws.send(JSON.stringify({
            type: 'STATE_UPDATE',
            role: 'PC',
            state: currentStateRef.current
          }));
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);

            if (message.type === 'REGISTER_ACK') {
              if (typeof message.controllerCount === 'number') {
                setControllerCount(message.controllerCount);
              }
            } else if (message.type === 'CONTROLLER_COUNT') {
              setControllerCount(message.count);
            } else if (message.type === 'COMMAND') {
              const h = handlersRef.current;
              switch (message.command) {
                case 'CMD_TRIGGER_BLESSING':
                  h.onTriggerBlessing?.();
                  break;
                case 'CMD_TOGGLE_DETECTION':
                  h.onToggleDetection?.();
                  break;
                case 'CMD_SET_DETECTION':
                  h.onSetDetection?.(message.payload);
                  break;
                case 'CMD_TOGGLE_CAMERA':
                  h.onToggleCamera?.();
                  break;
                case 'CMD_SET_CAMERA':
                  h.onSetCamera?.(message.payload);
                  break;
                case 'CMD_REPLAY_AUDIO':
                  h.onReplayAudio?.();
                  break;
                case 'CMD_TOGGLE_SOUND':
                  h.onToggleSound?.();
                  break;
                case 'CMD_SET_SOUND':
                  h.onSetSound?.(message.payload);
                  break;
                default:
                  console.warn('Unknown command received:', message.command);
              }
            }
          } catch (e) {
            console.error('Error handling WebSocket message on PC:', e);
          }
        };

        ws.onclose = () => {
          if (isUnmounted) return;
          setIsConnected(false);
          setControllerCount(0);
          reconnectTimeoutRef.current = setTimeout(connect, 2000);
        };

        ws.onerror = () => {
          try { ws.close(); } catch(e) {}
        };
      } catch (err) {
        if (!isUnmounted) {
          reconnectTimeoutRef.current = setTimeout(connect, 2500);
        }
      }
    }

    connect();

    return () => {
      isUnmounted = true;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        try { wsRef.current.close(); } catch(e) {}
      }
    };
  }, []);

  // Frame Capture & Streaming Loop (active when controllers connected and camera is live)
  useEffect(() => {
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }

    if (!isConnected || controllerCount <= 0 || !isCameraLive) {
      return;
    }

    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement('canvas');
    }

    const offCanvas = offscreenCanvasRef.current;
    const offCtx = offCanvas.getContext('2d', { alpha: false });

    // Target width for mobile streaming (360px width for fast 12-15fps streaming)
    const targetWidth = 360;

    frameIntervalRef.current = setInterval(() => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) return;

      const sourceCanvas = canvasRef?.current;
      const sourceVideo = videoRef?.current;
      const source = sourceCanvas && sourceCanvas.width > 0 ? sourceCanvas : sourceVideo;

      if (!source) return;

      const srcW = source.videoWidth || source.width || 640;
      const srcH = source.videoHeight || source.height || 480;

      if (srcW === 0 || srcH === 0) return;

      const scale = targetWidth / srcW;
      const targetHeight = Math.round(srcH * scale);

      if (offCanvas.width !== targetWidth || offCanvas.height !== targetHeight) {
        offCanvas.width = targetWidth;
        offCanvas.height = targetHeight;
      }

      if (offCtx) {
        offCtx.drawImage(source, 0, 0, targetWidth, targetHeight);
        const jpegData = offCanvas.toDataURL('image/jpeg', 0.55);

        ws.send(JSON.stringify({
          type: 'STREAM_FRAME',
          role: 'PC',
          frame: jpegData,
          timestamp: Date.now()
        }));
      }
    }, 75); // ~13.3 FPS

    return () => {
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
        frameIntervalRef.current = null;
      }
    };
  }, [isConnected, controllerCount, isCameraLive, canvasRef, videoRef]);

  return {
    isWsConnected: isConnected,
    controllerCount
  };
}
