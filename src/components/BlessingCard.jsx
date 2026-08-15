import React from 'react';
import { STRINGS } from '../constants/marathiStrings';

/**
 * Presentational component for Blessing Output card, Processing HUD & Waveform Visualizer
 */
export function BlessingCard({
  isProcessing,
  isPlayingAudio,
  blessingText,
  blessingStatus,
  processingMsg
}) {
  const isGlowActive = isProcessing || isPlayingAudio;

  return (
    <div className={`blessing-card ${isGlowActive ? 'active-glow' : ''} ${isProcessing ? 'is-processing' : ''}`} id="blessing-container">
      {/* Header */}
      <div className="blessing-header">
        <div className="blessing-tag">
          <span className="blessing-flower-icon">🌺</span>
          <span>{STRINGS.BLESSING_TAG}</span>
        </div>
        <div id="blessing-status" className="blessing-status-badge">
          {blessingStatus}
        </div>
      </div>

      {/* Processing Loader HUD */}
      {isProcessing ? (
        <div className="processing-hud" id="processing-hud">
          <div className="divine-spinner">
            <div className="spinner-ring" />
            <div className="spinner-ring-inner" />
            <div className="spinner-icon">🪔</div>
          </div>
          <div className="processing-msg" id="processing-msg-text">
            {processingMsg}
          </div>
        </div>
      ) : (
        /* Blessing text */
        <div className="blessing-content-wrapper">
          <div
            className={`blessing-text ${!blessingText ? 'placeholder' : ''}`}
            id="blessing-text-box"
          >
            {blessingText ? (
              <>
                <span className="quote-mark quote-open">❝</span>
                <span className="quote-content">{blessingText}</span>
                <span className="quote-mark quote-close">❞</span>
              </>
            ) : (
              STRINGS.BLESSING_PLACEHOLDER
            )}
          </div>
        </div>
      )}

      {/* Audio Waveform Section */}
      <div className="audio-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{STRINGS.VOICE_LABEL}</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--gold-primary)' }}>
            {STRINGS.VOICE_NAME}
          </span>
        </div>
        <div className="waveform-visualizer" id="waveform-visualizer">
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className={`wave-bar ${isPlayingAudio ? 'animating' : ''}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
