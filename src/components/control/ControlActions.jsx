import React from 'react';
import { STRINGS } from '../../constants/marathiStrings';

/**
 * Mobile Control Action Buttons (Large touch-friendly buttons with active states)
 */
export function ControlActions({
  onManualTrigger,
  onToggleDetection,
  isDetectionEnabled,
  onToggleCamera,
  isCameraLive,
  onReplayAudio,
  hasLastBlessing,
  onToggleSound,
  isSoundMuted,
  onToggleFgMusic,
  isFgMusicEnabled = true,
  onRequestRestart,
  isRestarting,
  isProcessing,
  isPlayingAudio,
  isCooldownActive,
  cooldownRemaining,
  connectionStatus
}) {
  const isConnected = connectionStatus === 'CONNECTED';
  const isBusy = isProcessing || isPlayingAudio || isRestarting;
  const isManualDisabled = !isConnected || isBusy || isCooldownActive;

  return (
    <div className="control-actions-container">
      {/* 1. Main Primary Action: Manual Blessing Trigger */}
      <button
        className={`btn-primary-trigger ${isManualDisabled ? 'disabled' : ''} ${isProcessing ? 'processing' : ''}`}
        onClick={onManualTrigger}
        disabled={isManualDisabled}
      >
        <div className="trigger-icon-wrap">
          <span className="trigger-icon">{isProcessing ? '🕉️' : '🙏'}</span>
        </div>
        <div className="trigger-text-wrap">
          <span className="trigger-main-text">
            {isProcessing
              ? STRINGS.STATUS_PROCESSING
              : isCooldownActive
              ? `${STRINGS.COOLDOWN_TEXT} ${cooldownRemaining}s`
              : STRINGS.MANUAL_TRIGGER_PROMPT}
          </span>
          <span className="trigger-sub-text">
            {isProcessing
              ? STRINGS.MANUAL_TRIGGER_TRIGGERING
              : isCooldownActive
              ? 'कृपया क्षणभर प्रतीक्षा करा'
              : 'PC स्क्रीनवर थेट आशीर्वाद सुरू करा'}
          </span>
        </div>
      </button>

      {/* 2. Quick Action Grid (Touch Tiles) */}
      <div className="control-tiles-grid">
        {/* Tile 1: Gesture Detection Toggle */}
        <button
          className={`control-tile ${isDetectionEnabled ? 'tile-active' : 'tile-inactive'}`}
          onClick={onToggleDetection}
          disabled={!isConnected || isRestarting}
        >
          <div className="tile-icon-row">
            <span className="tile-icon">{isDetectionEnabled ? '✋' : '🚫'}</span>
            <div className={`tile-switch-indicator ${isDetectionEnabled ? 'on' : 'off'}`}>
              <div className="switch-knob"></div>
            </div>
          </div>
          <div className="tile-info">
            <span className="tile-label">{STRINGS.CONTROL_DETECTION_TITLE}</span>
            <span className="tile-status">
              {isDetectionEnabled ? STRINGS.DETECTION_ON : STRINGS.DETECTION_OFF}
            </span>
          </div>
        </button>

        {/* Tile 2: Camera Toggle */}
        <button
          className={`control-tile ${isCameraLive ? 'tile-active' : 'tile-inactive'}`}
          onClick={onToggleCamera}
          disabled={!isConnected || isRestarting}
        >
          <div className="tile-icon-row">
            <span className="tile-icon">{isCameraLive ? '📷' : '🚫'}</span>
            <div className={`tile-switch-indicator ${isCameraLive ? 'on' : 'off'}`}>
              <div className="switch-knob"></div>
            </div>
          </div>
          <div className="tile-info">
            <span className="tile-label">{STRINGS.CONTROL_CAMERA_TITLE}</span>
            <span className="tile-status">
              {isCameraLive ? STRINGS.CAMERA_ON : STRINGS.CAMERA_OFF}
            </span>
          </div>
        </button>

        {/* Tile 3: Master Sound Toggle */}
        <button
          className={`control-tile ${!isSoundMuted ? 'tile-active' : 'tile-inactive'}`}
          onClick={onToggleSound}
          disabled={!isConnected || isRestarting}
        >
          <div className="tile-icon-row">
            <span className="tile-icon">{isSoundMuted ? '🔇' : '🔔'}</span>
            <div className={`tile-switch-indicator ${!isSoundMuted ? 'on' : 'off'}`}>
              <div className="switch-knob"></div>
            </div>
          </div>
          <div className="tile-info">
            <span className="tile-label">{STRINGS.CONTROL_SOUND_TITLE}</span>
            <span className="tile-status">
              {isSoundMuted ? STRINGS.SOUND_MUTED : STRINGS.SOUND_ON}
            </span>
          </div>
        </button>

        {/* Tile 4: Foreground Devotional Music Toggle */}
        <button
          className={`control-tile ${isFgMusicEnabled ? 'tile-active' : 'tile-inactive'}`}
          onClick={onToggleFgMusic}
          disabled={!isConnected || isRestarting}
        >
          <div className="tile-icon-row">
            <span className="tile-icon">{isFgMusicEnabled ? '🎵' : '🔇'}</span>
            <div className={`tile-switch-indicator ${isFgMusicEnabled ? 'on' : 'off'}`}>
              <div className="switch-knob"></div>
            </div>
          </div>
          <div className="tile-info">
            <span className="tile-label">{STRINGS.CONTROL_FG_MUSIC_TITLE}</span>
            <span className="tile-status">
              {isFgMusicEnabled ? STRINGS.FG_MUSIC_ON : STRINGS.FG_MUSIC_OFF}
            </span>
          </div>
        </button>

        {/* Tile 5: Replay Audio */}
        <button
          className="control-tile tile-secondary"
          onClick={onReplayAudio}
          disabled={!isConnected || !hasLastBlessing || isBusy}
        >
          <div className="tile-icon-row">
            <span className="tile-icon">🔊</span>
          </div>
          <div className="tile-info">
            <span className="tile-label">{STRINGS.CONTROL_REPLAY_TITLE}</span>
            <span className="tile-status">
              {hasLastBlessing ? 'मागील आशीर्वाद ऐका' : 'उपलब्ध नाही'}
            </span>
          </div>
        </button>

        {/* Tile 6: Restart Server */}
        <button
          className={`control-tile tile-restart ${isRestarting ? 'restarting' : ''}`}
          onClick={onRequestRestart}
          disabled={isRestarting}
        >
          <div className="tile-icon-row">
            <span className={`tile-icon ${isRestarting ? 'spinning' : ''}`}>🔄</span>
          </div>
          <div className="tile-info">
            <span className="tile-label">{STRINGS.CONTROL_RESTART_TITLE}</span>
            <span className="tile-status">
              {isRestarting ? STRINGS.CONTROL_RESTARTING : STRINGS.CONTROL_RESTART_DESC}
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
