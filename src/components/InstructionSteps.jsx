import React from 'react';
import { STRINGS } from '../constants/marathiStrings';

/**
 * Presentational component for 3-step Marathi instruction cards
 */
export function InstructionSteps() {
  return (
    <div className="instruction-steps">
      {STRINGS.STEPS.map((step, idx) => (
        <div className="step-card" key={idx}>
          <div className="step-num">{step.num}</div>
          <div className="step-text">
            <h4>{step.title}</h4>
            <p>{step.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
