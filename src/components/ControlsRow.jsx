import React from 'react';
import { STRINGS } from '../constants/marathiStrings';

/**
 * Presentational component for the user control buttons and cooldown banner
 */
export function ControlsRow({
  onManualTrigger,
  onToggleSound,
  isSoundMuted,
  onToggleCam,
  onReplayAudio,
  hasLastBlessing,
  isCooldownActive,
  cooldownRemaining,
  isProcessing,
  isPlayingAudio
}) {
  const isActionsDisabled = isProcessing || isPlayingAudio;

  return (
    <>
      <div className="controls-row">
        {/* Manual Trigger Button */}
        <button
          className="btn"
          id="btn-trigger-manual"
          onClick={onManualTrigger}
          disabled={isActionsDisabled || isCooldownActive}
        >
          <span>🙏</span>
          <span>{STRINGS.MANUAL_BLESSING_BTN}</span>
        </button>

        {/* Action Button Group */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {/* Mute Toggle */}
          <button
            className="btn btn-secondary"
            id="btn-toggle-sound"
            onClick={onToggleSound}
            title={STRINGS.SOUND_ON}
          >
            <span id="sound-btn-icon">{isSoundMuted ? '🔇' : '🔔'}</span>
            <span id="sound-btn-text">
              {isSoundMuted ? STRINGS.SOUND_MUTED : STRINGS.SOUND_ON}
            </span>
          </button>

          {/* Camera Restart */}
          <button
            className="btn btn-secondary"
            id="btn-toggle-cam"
            onClick={onToggleCam}
          >
            <span id="cam-btn-icon">📷</span>
            <span id="cam-btn-text">{STRINGS.CAMERA_BTN}</span>
          </button>

          {/* Audio Replay */}
          <button
            className="btn btn-secondary"
            id="btn-audio-replay"
            onClick={onReplayAudio}
            title={STRINGS.REPLAY_BTN}
            disabled={!hasLastBlessing || isProcessing || isPlayingAudio}
          >
            <span>{STRINGS.REPLAY_BTN}</span>
          </button>
        </div>
      </div>

      {/* Cooldown Countdown Banner */}
      {isCooldownActive && (
        <div className="cooldown-banner" id="cooldown-banner">
          <span>{STRINGS.COOLDOWN_TEXT}</span>
          <span id="cooldown-timer" style={{ fontWeight: 700 }}>
            {cooldownRemaining}s
          </span>
        </div>
      )}
    </>
  );
}
