import React from 'react';
import { STRINGS } from '../constants/marathiStrings';

/**
 * Presentational Header Component with Remote Connect and Server Restart actions
 */
export function Header({
  onOpenRemoteModal,
  controllerCount = 0,
  onOpenRestartModal,
  isRestarting = false
}) {
  return (
    <header className="header-container">
      <div className="header-title-group">
        <div className="om-symbol">{STRINGS.OM}</div>
        <h1>{STRINGS.APP_TITLE}</h1>
      </div>

      <div className="header-actions">
        {onOpenRestartModal && (
          <button
            className={`btn-header-restart ${isRestarting ? 'restarting' : ''}`}
            onClick={onOpenRestartModal}
            disabled={isRestarting}
            title={STRINGS.CONTROL_RESTART_DESC}
          >
            <span className={isRestarting ? 'spinning' : ''}>🔄</span>
            <span>{isRestarting ? STRINGS.CONTROL_RESTARTING : STRINGS.CONTROL_RESTART_TITLE}</span>
          </button>
        )}

        {onOpenRemoteModal && (
          <button
            className={`btn-remote-connect ${controllerCount > 0 ? 'connected' : ''}`}
            onClick={onOpenRemoteModal}
            title="मोबाईल रिमोट कनेक्ट करा"
          >
            <span>📱</span>
            <span>{STRINGS.REMOTE_CONNECT_BTN}</span>
            {controllerCount > 0 && (
              <span className="controller-badge" title="सक्रिय रिमोट्स">{controllerCount}</span>
            )}
          </button>
        )}
      </div>
    </header>
  );
}
