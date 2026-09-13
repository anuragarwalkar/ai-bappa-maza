import React from 'react';

/**
 * Presentational canvas component for spiritual background particles & flower petals
 */
export function ParticlesBackground({ canvasRef }) {
  return <canvas id="particles-canvas" ref={canvasRef} />;
}
