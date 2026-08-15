import React from 'react';
import { STRINGS } from '../constants/marathiStrings';

/**
 * Presentational component for Lord Ganesha Darshan Hero card
 */
export function BappaHero({ isProcessing }) {
  return (
    <div className={`bappa-hero ${isProcessing ? 'processing' : ''}`} id="bappa-hero">
      <div className="bappa-aura" />
      <div className="bappa-content-row">
        <img
          src="/images/ganpati_bappa.jpg"
          alt="श्री गणपती बाप्पा"
          className="bappa-image-avatar"
        />
        <div className="bappa-text-wrap">
          <h2 className="bappa-title">{STRINGS.BAPPA_TITLE}</h2>
          <p className="bappa-shloka">{STRINGS.BAPPA_SHLOKA}</p>
        </div>
      </div>
    </div>
  );
}
