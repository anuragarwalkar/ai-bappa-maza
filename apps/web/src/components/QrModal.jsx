import React, { useState, useEffect } from 'react';
import { STRINGS } from '../constants/marathiStrings';
import { fetchServerInfo } from '../services/api';

/**
 * QR Code Modal on PC Screen for easy mobile connection
 */
export function QrModal({ isOpen, onClose }) {
  const [serverInfo, setServerInfo] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchServerInfo()
        .then(info => setServerInfo(info))
        .catch(err => {
          console.warn('Could not fetch server info:', err);
          const port = window.location.port || '5173';
          const host = window.location.hostname;
          setServerInfo({
            localIp: host,
            port,
            controlUrl: `${window.location.origin}/control`,
            viteControlUrl: `${window.location.origin}/control`
          });
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Determine active control URL based on whether in dev or production
  const activeUrl = serverInfo
    ? (window.location.port === '5173' && serverInfo.viteControlUrl
        ? serverInfo.viteControlUrl
        : serverInfo.controlUrl || `${window.location.origin}/control`)
    : `${window.location.origin}/control`;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(activeUrl)}&bgcolor=0f0709&color=FFD700&margin=2`;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {});
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            <span>{STRINGS.OM}</span> {STRINGS.QR_MODAL_TITLE}
          </h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-desc">{STRINGS.QR_MODAL_DESC}</p>

          <div className="qr-container">
            <img
              src={qrImageUrl}
              alt="QR Code for Mobile Control"
              className="qr-image"
              width={220}
              height={220}
            />
          </div>

          <div className="url-copy-box">
            <input
              type="text"
              readOnly
              value={activeUrl}
              className="url-input"
              onClick={e => e.target.select()}
            />
            <button className="btn btn-secondary copy-btn" onClick={handleCopy}>
              {copied ? STRINGS.QR_MODAL_COPIED : STRINGS.QR_MODAL_COPY}
            </button>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>
            {STRINGS.QR_MODAL_CLOSE}
          </button>
        </div>
      </div>
    </div>
  );
}
