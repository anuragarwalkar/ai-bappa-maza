import React from 'react';
import { STRINGS } from '../../constants/marathiStrings';

/**
 * Mobile Control Header with OM emblem, connection pill, and back button
 */
export function ControlHeader({ connectionStatus }) {
  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'CONNECTED':
        return { text: STRINGS.CONNECTION_CONNECTED, className: 'status-connected' };
      case 'CONNECTING':
        return { text: STRINGS.CONNECTION_CONNECTING, className: 'status-connecting' };
      case 'DISCONNECTED':
      default:
        return { text: STRINGS.CONNECTION_DISCONNECTED, className: 'status-disconnected' };
    }
  };

  const badge = getStatusBadge();

  return (
    <header className="control-header">
      <div className="control-header-top">
        <a href="/" className="control-back-link" title={STRINGS.BACK_TO_HOME}>
          <span>🏠</span>
        </a>

        <div className="control-title-group">
          <div className="om-symbol-small">{STRINGS.OM}</div>
          <div>
            <h1 className="control-main-title">{STRINGS.CONTROL_PAGE_TITLE}</h1>
            <p className="control-subtitle">{STRINGS.CONTROL_PAGE_SUBTITLE}</p>
          </div>
        </div>

        <div className={`control-status-pill ${badge.className}`}>
          {badge.text}
        </div>
      </div>
    </header>
  );
}
