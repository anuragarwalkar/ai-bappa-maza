import React from 'react';
import { STRINGS } from '../../constants/marathiStrings';

/**
 * Live Status & Blessing Feed card on mobile remote
 */
export function ControlStatusCard({
  blessingStatus,
  blessingText,
  isProcessing,
  isPlayingAudio,
  handsCount,
  fps,
  gestureInstruction
}) {
  return (
    <div className="control-status-card glass-card">
      <div className="status-header">
        <span className="status-title">{STRINGS.STATUS_TITLE}</span>
        <span className={`status-badge ${isProcessing ? 'badge-processing' : isPlayingAudio ? 'badge-playing' : ''}`}>
          {isProcessing ? STRINGS.STATUS_PROCESSING : isPlayingAudio ? '🔊 आशीर्वाद बोलत आहेत...' : blessingStatus || STRINGS.STATUS_WAITING}
        </span>
      </div>

      {/* Devotee Instruction / Prompt */}
      {gestureInstruction && (
        <div className="status-instruction">
          <span>{gestureInstruction}</span>
        </div>
      )}

      {/* Blessing Text Box */}
      <div className="blessing-text-box">
        <div className="blessing-box-header">
          <span>{STRINGS.LATEST_BLESSING_TITLE}</span>
        </div>
        <p className="blessing-content-text">
          {blessingText ? `"${blessingText}"` : STRINGS.NO_BLESSING_YET}
        </p>
      </div>
    </div>
  );
}
