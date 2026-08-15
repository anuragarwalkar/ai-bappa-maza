import React from 'react';
import { STRINGS } from '../constants/marathiStrings';

/**
 * Presentational Header Component
 */
export function Header() {
  return (
    <header>
      <div className="om-symbol">{STRINGS.OM}</div>
      <h1>{STRINGS.APP_TITLE}</h1>
      <div className="subtitle">
        <span>{STRINGS.APP_SUBTITLE}</span>
        <span className="badge">AI Powered</span>
      </div>
    </header>
  );
}
