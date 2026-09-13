import React from 'react';
import { CONFIG } from '../constants/config';
import { STRINGS } from '../constants/marathiStrings';

/**
 * Presentational component for the Camera Feed, HUD and Gesture Progress Hold Meter
 */
export function CameraCard({
  videoRef,
  canvasRef,
  cameraStatus,
  isCameraLive,
  handsCount,
  gestureInstruction,
  holdProgress,
  isDetectionEnabled = false,
  cameras = [],
  selectedCameraId = '',
  onSelectCamera
}) {
  const offset = CONFIG.HOLD_CIRCUMFERENCE - (holdProgress * CONFIG.HOLD_CIRCUMFERENCE);

  return (
    <div className="camera-card-wrapper">
      <div className="camera-wrapper">
        {/* Hidden Video element */}
        <video ref={videoRef} id="webcam-video" playsInline autoPlay muted />

        {/* Output Landmark Canvas */}
        <canvas
          ref={canvasRef}
          id="output-canvas"
          width={CONFIG.CAMERA_WIDTH}
          height={CONFIG.CAMERA_HEIGHT}
        />

        {/* Top Camera HUD */}
        <div className="camera-hud">
          <div className="hud-pill">
            <span
              className="live-dot"
              id="live-indicator"
              style={{ background: isCameraLive ? 'var(--accent-green)' : '#FF5252' }}
            />
            <span id="camera-status-text">{cameraStatus}</span>
          </div>
          <div className="hud-pill" id="hands-badge">
            <span>{isDetectionEnabled ? STRINGS.HANDS_LABEL : '🚫 '}</span>
            <span
              id="hands-count"
              style={{
                color: isDetectionEnabled ? 'var(--gold-primary)' : 'var(--text-muted)',
                fontWeight: 700
              }}
            >
              {isDetectionEnabled ? handsCount : STRINGS.DETECTION_OFF}
            </span>
          </div>
        </div>

        {/* Gesture Hold Meter Overlay */}
        <div className="gesture-indicator-overlay" id="gesture-overlay">
          <div className="hold-meter-container">
            <svg className="hold-meter-svg" viewBox="0 0 90 90">
              <defs>
                <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFD700" />
                  <stop offset="100%" stopColor="#FF6600" />
                </linearGradient>
              </defs>
              <circle
                className="hold-meter-bg"
                cx="45"
                cy="45"
                r={CONFIG.HOLD_CIRCLE_RADIUS}
              />
              <circle
                className="hold-meter-bar"
                id="hold-progress-circle"
                cx="45"
                cy="45"
                r={CONFIG.HOLD_CIRCLE_RADIUS}
                style={{
                  strokeDasharray: `${CONFIG.HOLD_CIRCUMFERENCE} ${CONFIG.HOLD_CIRCUMFERENCE}`,
                  strokeDashoffset: offset
                }}
              />
            </svg>
            <div className="hold-meter-icon" id="gesture-icon">
              {isDetectionEnabled ? '🙏' : '🚫'}
            </div>
          </div>
          <div className="hold-status-text" id="gesture-instruction">
            {gestureInstruction}
          </div>
        </div>
      </div>

      {/* Camera Device Selection Bar */}
      <div className="camera-select-bar">
        <label htmlFor="camera-select-dropdown" className="camera-select-label">
          <span className="camera-select-icon">📷</span>
          <span className="camera-select-title">{STRINGS.CAMERA_SELECT_TITLE}</span>
        </label>
        <div className="camera-select-control">
          <select
            id="camera-select-dropdown"
            className="camera-select-dropdown"
            value={selectedCameraId}
            onChange={(e) => onSelectCamera?.(e.target.value)}
            disabled={!isCameraLive && cameras.length === 0}
            title={STRINGS.CAMERA_SELECT_LABEL}
          >
            {cameras.length === 0 ? (
              <option value="">{selectedCameraId ? STRINGS.WEBCAM_LIVE : STRINGS.NO_CAMERAS_FOUND}</option>
            ) : (
              cameras.map((cam, idx) => (
                <option key={cam.deviceId || idx} value={cam.deviceId}>
                  {cam.label || `${STRINGS.CAMERA_DEFAULT_NAME} ${idx + 1}`}
                </option>
              ))
            )}
          </select>
          <span className="camera-select-arrow" aria-hidden="true">▾</span>
        </div>
      </div>
    </div>
  );
}
