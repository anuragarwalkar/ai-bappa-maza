import React from 'react';
import { STRINGS } from '../constants/marathiStrings';

/**
 * Confirmation modal for triggering a server restart (used on both main dashboard and /control)
 */
export function RestartConfirmModal({ isOpen, onClose, onConfirm, isRestarting }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={isRestarting ? undefined : onClose}>
      <div className="modal-content restart-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <span>🔄</span>
            <span>{STRINGS.RESTART_CONFIRM_TITLE}</span>
          </h2>
          {!isRestarting && (
            <button className="modal-close-btn" onClick={onClose} aria-label="Close">
              ✕
            </button>
          )}
        </div>

        <div className="modal-body restart-modal-body">
          <div className="restart-icon-wrap">
            <span className={`restart-big-icon ${isRestarting ? 'spinning' : ''}`}>
              🔄
            </span>
          </div>

          <p className="modal-desc restart-desc">
            {STRINGS.RESTART_CONFIRM_DESC}
          </p>

          {isRestarting && (
            <div className="restart-status-indicator">
              <span className="pulsing-dot"></span>
              <span>{STRINGS.RESTARTING_SUBTEXT}</span>
            </div>
          )}
        </div>

        <div className="modal-footer restart-modal-footer">
          {!isRestarting ? (
            <>
              <button
                type="button"
                className="btn-cancel"
                onClick={onClose}
              >
                {STRINGS.RESTART_CANCEL_BTN}
              </button>
              <button
                type="button"
                className="btn-confirm-restart"
                onClick={onConfirm}
              >
                <span>🔄</span>
                <span>{STRINGS.RESTART_CONFIRM_BTN}</span>
              </button>
            </>
          ) : (
            <div className="restart-in-progress-badge">
              <span>{STRINGS.RESTART_IN_PROGRESS}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
