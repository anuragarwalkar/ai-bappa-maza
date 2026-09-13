import React from 'react';
import { STRINGS } from '../constants/marathiStrings';

/**
 * Presentational component for real-time telemetry and gesture diagnostics
 */
export function DiagnosticsPanel({ fps, diagnostics }) {
  return (
    <div className="diagnostics-panel">
      <div className="diagnostics-title">
        <span>{STRINGS.DIAGNOSTICS_TITLE}</span>
        <span id="fps-counter" style={{ color: 'var(--accent-green)', fontWeight: 700 }}>
          {fps} FPS
        </span>
      </div>

      <div className="diag-grid">
        {/* Hand Posture */}
        <div className="diag-item">
          <span className="diag-label">{STRINGS.DIAG_HAND_POSTURE}</span>
          <span className="diag-value" id="diag-distance">
            {diagnostics.distance}
          </span>
        </div>

        {/* Vertical Align */}
        <div className="diag-item">
          <span className="diag-label">{STRINGS.DIAG_VERTICAL_ALIGN}</span>
          <span
            className="diag-value"
            id="diag-vertical"
            style={{ color: diagnostics.verticalOk ? 'var(--accent-green)' : '#FFA726' }}
          >
            {diagnostics.verticalAlign}
          </span>
        </div>

        {/* Confidence */}
        <div className="diag-item">
          <span className="diag-label">{STRINGS.DIAG_CONFIDENCE}</span>
          <span className="diag-value" id="diag-confidence">
            {diagnostics.confidence}
          </span>
        </div>

        {/* Status */}
        <div className="diag-item">
          <span className="diag-label">{STRINGS.DIAG_STATUS}</span>
          <span
            className="diag-value"
            id="diag-state"
            style={{ color: 'var(--gold-primary)' }}
          >
            {diagnostics.status}
          </span>
        </div>
      </div>
    </div>
  );
}
