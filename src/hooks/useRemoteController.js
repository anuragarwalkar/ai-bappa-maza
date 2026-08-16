import { useState, useEffect, useRef, useCallback } from 'react';
import { STRINGS } from '../constants/marathiStrings';
import { sendControlCommand } from '../services/api';

const DEFAULT_STATE = {
  isCameraLive: true,
  isDetectionEnabled: true,
  isProcessing: false,
  isPlayingAudio: false,
  isCooldownActive: false,
  cooldownRemaining: 0,
  handsCount: 0,
  fps: 30,
  gestureInstruction: STRINGS.GESTURE_PROMPT_INITIAL,
  blessingStatus: STRINGS.STATUS_WAITING,
  blessingText: '',
  hasLastBlessing: false,
  isSoundMuted: false,
  isFgMusicEnabled: true,
  lastUpdated: null
};

/**
 * Custom hook for Mobile Remote Controller (/control)
 */
export function useRemoteController() {
  const [connectionStatus, setConnectionStatus] = useState('CONNECTING'); // 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED'
  const [state, setState] = useState(DEFAULT_STATE);
  const [liveFrame, setLiveFrame] = useState(null);
  const [lastFrameTime, setLastFrameTime] = useState(null);
  const [latencyMs, setLatencyMs] = useState(0);

  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const pollTimerRef = useRef(null);

  // Send a command to the PC (via WS first, with REST fallback)
  const sendCommand = useCallback(async (command, payload = null) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify({
          type: 'COMMAND',
          role: 'CONTROLLER',
          command,
          payload,
          timestamp: Date.now()
        }));
        return true;
      } catch (err) {
        console.warn('WS send failed, attempting REST fallback:', err);
      }
    }

    // REST fallback
    try {
      await sendControlCommand(command, payload);
      return true;
    } catch (e) {
      console.error('REST command failed:', e);
      return false;
    }
  }, []);

  // Dedicated command helpers
  const triggerBlessing = useCallback(() => {
    return sendCommand('CMD_TRIGGER_BLESSING');
  }, [sendCommand]);

  const toggleDetection = useCallback(() => {
    return sendCommand('CMD_TOGGLE_DETECTION');
  }, [sendCommand]);

  const toggleCamera = useCallback(() => {
    return sendCommand('CMD_TOGGLE_CAMERA');
  }, [sendCommand]);

  const replayAudio = useCallback(() => {
    return sendCommand('CMD_REPLAY_AUDIO');
  }, [sendCommand]);

  const toggleSound = useCallback(() => {
    return sendCommand('CMD_TOGGLE_SOUND');
  }, [sendCommand]);

  const setSound = useCallback((muted) => {
    return sendCommand('CMD_SET_SOUND', Boolean(muted));
  }, [sendCommand]);

  const toggleFgMusic = useCallback(() => {
    return sendCommand('CMD_TOGGLE_FG_MUSIC');
  }, [sendCommand]);

  const setFgMusic = useCallback((enabled) => {
    return sendCommand('CMD_SET_FG_MUSIC', Boolean(enabled));
  }, [sendCommand]);

  // Connect WebSocket
  useEffect(() => {
    let isUnmounted = false;

    function connect() {
      if (isUnmounted) return;
      setConnectionStatus('CONNECTING');

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (isUnmounted) return;
          setConnectionStatus('CONNECTED');
          ws.send(JSON.stringify({ type: 'REGISTER', role: 'CONTROLLER' }));
        };

        ws.onmessage = (event) => {
          if (isUnmounted) return;
          try {
            const message = JSON.parse(event.data);

            if (message.type === 'REGISTER_ACK') {
              if (message.state) {
                setState(prev => ({ ...prev, ...message.state }));
              }
            } else if (message.type === 'STATE_UPDATE') {
              if (message.state) {
                setState(prev => ({ ...prev, ...message.state }));
              }
            } else if (message.type === 'STREAM_FRAME') {
              if (message.frame) {
                setLiveFrame(message.frame);
                setLastFrameTime(Date.now());
                if (message.timestamp) {
                  setLatencyMs(Math.max(0, Date.now() - message.timestamp));
                }
              }
            }
          } catch (e) {
            console.error('Error handling controller WS message:', e);
          }
        };

        ws.onclose = () => {
          if (isUnmounted) return;
          setConnectionStatus('DISCONNECTED');
          reconnectTimerRef.current = setTimeout(connect, 2000);
        };

        ws.onerror = () => {
          try { ws.close(); } catch(e) {}
        };
      } catch (err) {
        if (!isUnmounted) {
          setConnectionStatus('DISCONNECTED');
          reconnectTimerRef.current = setTimeout(connect, 2500);
        }
      }
    }

    connect();

    // Initial state fetch via REST
    fetch('/api/control/state')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.state && !isUnmounted) {
          setState(prev => ({ ...prev, ...data.state }));
        }
      })
      .catch(() => {});

    return () => {
      isUnmounted = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      if (wsRef.current) {
        try { wsRef.current.close(); } catch(e) {}
      }
    };
  }, []);

  return {
    connectionStatus,
    state,
    liveFrame,
    lastFrameTime,
    latencyMs,
    triggerBlessing,
    toggleDetection,
    toggleCamera,
    replayAudio,
    toggleSound,
    setSound,
    toggleFgMusic,
    setFgMusic
  };
}
