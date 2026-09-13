import React from 'react';
import { STRINGS } from '../../constants/marathiStrings';

/**
 * PWA Install Prompt Banner for Mobile Remote Control
 */
export function ControlPwaBanner({
  isInstallable,
  showIOSHint,
  installedSuccess,
  onInstall,
  onDismiss
}) {
  if (installedSuccess) {
    return (
      <div className="pwa-install-banner pwa-install-success glass-card">
        <div className="pwa-banner-content">
          <span className="pwa-icon">🎉</span>
          <div className="pwa-text-group">
            <h4 className="pwa-title">{STRINGS.PWA_INSTALLED_SUCCESS}</h4>
          </div>
        </div>
      </div>
    );
  }

  if (isInstallable) {
    return (
      <div className="pwa-install-banner glass-card">
        <div className="pwa-banner-content">
          <img
            src="/icons/icon-192.png"
            alt="App Icon"
            className="pwa-app-icon"
            width={40}
            height={40}
          />
          <div className="pwa-text-group">
            <h4 className="pwa-title">{STRINGS.PWA_INSTALL_TITLE}</h4>
            <p className="pwa-subtitle">{STRINGS.PWA_INSTALL_DESC}</p>
          </div>
        </div>
        <div className="pwa-actions">
          <button
            className="btn btn-primary pwa-install-btn"
            onClick={onInstall}
            aria-label="Install App"
          >
            {STRINGS.PWA_INSTALL_BTN}
          </button>
          <button
            className="pwa-dismiss-btn"
            onClick={onDismiss}
            aria-label="Dismiss banner"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  if (showIOSHint) {
    return (
      <div className="pwa-install-banner pwa-ios-banner glass-card">
        <div className="pwa-banner-content">
          <span className="pwa-icon">📲</span>
          <div className="pwa-text-group">
            <p className="pwa-ios-text">{STRINGS.PWA_IOS_HINT}</p>
          </div>
        </div>
        <button
          className="pwa-dismiss-btn"
          onClick={onDismiss}
          aria-label="Dismiss banner"
        >
          ✕
        </button>
      </div>
    );
  }

  return null;
}
