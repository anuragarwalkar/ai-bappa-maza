import React from 'react';
import { STRINGS } from '../constants/marathiStrings';

/**
 * Presentational component for Lord Ganesha Darshan Hero card
 */
export function BappaHero({ isProcessing }) {
  return (
    <div className={`bappa-hero ${isProcessing ? 'processing' : ''}`} id="bappa-hero">
      <div className="bappa-aura" />
      <div className="bappa-icon">🐘</div>
      <h2 className="bappa-title">{STRINGS.BAPPA_TITLE}</h2>
      <p className="bappa-shloka">{STRINGS.BAPPA_SHLOKA}</p>
    </div>
  );
}
