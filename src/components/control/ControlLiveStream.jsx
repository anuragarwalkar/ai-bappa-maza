import React from 'react';
import { STRINGS } from '../../constants/marathiStrings';

/**
 * Mobile Live Stream Video Display with HUD overlays
 */
export function ControlLiveStream({
  liveFrame,
  isCameraLive,
  isDetectionEnabled,
  handsCount,
  fps,
  latencyMs,
  connectionStatus
}) {
  const isConnected = connectionStatus === 'CONNECTED';

  return (
    <div className="control-stream-card glass-card">
      <div className="stream-viewport-container">
        {/* Live Video Frame or Fallback Overlay */}
        {isCameraLive && isConnected && liveFrame ? (
          <img
            src={liveFrame}
            alt="PC Live Stream"
            className="control-live-img"
          />
        ) : (
          <div className="stream-placeholder">
            <div className="placeholder-icon">
              {!isConnected ? '📡' : !isCameraLive ? '📷' : '⏳'}
            </div>
            <div className="placeholder-text">
              {!isConnected
                ? STRINGS.STREAM_PC_DISCONNECTED
                : !isCameraLive
                ? STRINGS.STREAM_CAMERA_OFF
                : STRINGS.STREAM_WAITING}
            </div>
          </div>
        )}

        {/* Top HUD Badges */}
        <div className="stream-hud-top">
          <div className="hud-badge hud-live">
            <span className="live-dot"></span>
            <span>{STRINGS.STREAM_LIVE_BADGE}</span>
          </div>

          <div className="hud-badge-group">
            <div className={`hud-badge ${isDetectionEnabled ? 'hud-active' : 'hud-inactive'}`}>
              <span>{isDetectionEnabled ? '✋ ओळख चालू' : '🚫 ओळख बंद'}</span>
            </div>

            {handsCount > 0 && (
              <div className="hud-badge hud-hands">
                <span>✋ {handsCount}</span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom HUD Bar */}
        <div className="stream-hud-bottom">
          <span className="hud-stat">{fps} FPS</span>
          {latencyMs > 0 && <span className="hud-stat">{latencyMs}ms {STRINGS.TELEMETRY_LATENCY}</span>}
          <span className={`hud-stat ${isCameraLive ? 'stat-on' : 'stat-off'}`}>
            {isCameraLive ? '📷 कॅमेरा ऑन' : '📷 कॅमेरा ऑफ'}
          </span>
        </div>
      </div>
    </div>
  );
}
