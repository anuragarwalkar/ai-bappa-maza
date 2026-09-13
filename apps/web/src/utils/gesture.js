/**
 * Calculates Euclidean distance between two 3D landmarks
 * @param {{x: number, y: number, z: number}} p1
 * @param {{x: number, y: number, z: number}} p2
 * @returns {number}
 */
export function distance3D(p1, p2) {
  return Math.sqrt(
    Math.pow(p1.x - p2.x, 2) +
    Math.pow(p1.y - p2.y, 2) +
    Math.pow(p1.z - p2.z, 2)
  );
}

/**
 * Validates anatomical proportions of a human hand to reject false positive
 * detections on faces, ears, clothing folds, or background patterns.
 * Supports both front-facing palms and edge-on palms (folded hands).
 * @param {Array<{x: number, y: number, z: number}>} hand - 21 MediaPipe landmarks
 * @returns {boolean}
 */
export function isAnatomicalHand(hand) {
  if (!hand || hand.length < 21) return false;

  const wrist = hand[0];
  const indexMcp = hand[5];
  const middleMcp = hand[9];
  const ringMcp = hand[13];
  const pinkyMcp = hand[17];
  const middleTip = hand[12];
  const indexTip = hand[8];

  // 1. Palm Length (wrist to middle MCP)
  const palmLength = distance3D(wrist, middleMcp);
  if (palmLength < 0.04 || palmLength > 0.65) return false;

  // 2. Palm Width (index MCP to pinky MCP)
  // For edge-on hands (palms pressed together in prayer), index and pinky MCPs
  // are stacked in depth, so palmAspect can be small (~0.08).
  // For faces, palmAspect is large (> 1.35).
  const palmWidth = distance3D(indexMcp, pinkyMcp);
  const palmAspect = palmWidth / palmLength;
  if (palmAspect < 0.06 || palmAspect > 1.35) return false;

  // 3. Middle finger length (middle MCP to middle Tip)
  const middleFingerLength = distance3D(middleMcp, middleTip);
  const fingerPalmRatio = middleFingerLength / palmLength;
  if (fingerPalmRatio < 0.35 || fingerPalmRatio > 1.80) return false;

  // 4. Knuckles must not be completely collapsed into a single coordinate
  const d5_9 = distance3D(indexMcp, middleMcp);
  const d9_13 = distance3D(middleMcp, ringMcp);
  if (d5_9 < 0.003 || d9_13 < 0.003) return false;

  return true;
}

/**
 * Checks if a hand is in an upright posture (palm facing camera or edge-on).
 * @param {Array<{x: number, y: number, z: number}>} hand - Array of 21 MediaPipe hand landmarks
 * @returns {{isValid: boolean, extendedCount: number, handSize: number}}
 */
export function isHandUprightAndOpen(hand) {
  if (!isAnatomicalHand(hand)) {
    return { isValid: false, extendedCount: 0, handSize: 0 };
  }

  const wrist = hand[0];
  const indexMcp = hand[5];
  const middleMcp = hand[9];
  const ringMcp = hand[13];

  const indexPip = hand[6];
  const middlePip = hand[10];
  const ringPip = hand[14];
  const pinkyPip = hand[18];

  const indexTip = hand[8];
  const middleTip = hand[12];
  const ringTip = hand[16];
  const pinkyTip = hand[20];

  const handSize = distance3D(wrist, middleMcp) || 0.15;

  // 1. Wrist must be lower on screen than middle knuckle (smaller Y = higher up)
  if (wrist.y <= middleMcp.y + 0.02) {
    return { isValid: false, extendedCount: 0, handSize };
  }

  // 2. Count extended fingers pointing upward (tip.y < pip.y && pip.y < mcp.y)
  let extendedCount = 0;
  if (indexTip.y < indexPip.y && indexPip.y < indexMcp.y) extendedCount++;
  if (middleTip.y < middlePip.y && middlePip.y < middleMcp.y) extendedCount++;
  if (ringTip.y < ringPip.y && ringPip.y < ringMcp.y) extendedCount++;
  if (pinkyTip.y < pinkyPip.y) extendedCount++;

  // Tips must be higher than wrist
  const middleHighEnough = middleTip.y < wrist.y - 0.06;
  const indexHighEnough = indexTip.y < wrist.y - 0.06;

  // For upright hand (including edge-on prayer hand), at least 2 fingers extended and above wrist
  const isValid = extendedCount >= 2 && (middleHighEnough || indexHighEnough);

  return {
    isValid,
    extendedCount,
    handSize
  };
}

/**
 * Detects folded prayer hands (Namaskar / Anjali Mudra) when both hands
 * are pressed tightly palm-to-palm and tracked by MediaPipe as a combined single hand silhouette.
 * Specifically handles the classic prayer position where palms touch and fingers point straight up.
 * @param {Array<{x: number, y: number, z: number}>} hand - 21 MediaPipe landmarks
 * @returns {boolean}
 */
export function isFoldedPrayerHands(hand) {
  if (!hand || hand.length < 21) return false;

  const wrist = hand[0];
  const indexMcp = hand[5];
  const middleMcp = hand[9];
  const pinkyMcp = hand[17];

  const indexPip = hand[6];
  const middlePip = hand[10];
  const ringPip = hand[14];

  const indexTip = hand[8];
  const middleTip = hand[12];
  const ringTip = hand[16];
  const pinkyTip = hand[20];

  // 1. Vertical height: Fingertips must be significantly above wrist
  const verticalSpan = wrist.y - middleTip.y;
  if (verticalSpan < 0.12 || verticalSpan > 0.75) return false;

  // 2. Knuckles must be above wrist
  if (middleMcp.y >= wrist.y - 0.02) return false;

  // 3. Middle finger and index/ring extended upward
  const middleExt = middleTip.y < middlePip.y && middlePip.y < middleMcp.y;
  const indexExt = indexTip.y < indexPip.y;
  const ringExt = ringTip.y < ringPip.y;
  if (!middleExt || (!indexExt && !ringExt)) return false;

  // 4. Narrow horizontal profile:
  // When hands are pressed together palm-to-palm, the fingertips touch and form
  // a narrow point, unlike an open spread hand or a wide face.
  const tipSpreadX = Math.abs(indexTip.x - ringTip.x);
  const mcpSpreadX = Math.abs(indexMcp.x - pinkyMcp.x);
  if (tipSpreadX > 0.14) return false;
  if (mcpSpreadX > 0.26) return false;

  // 5. Wrist is horizontally centered beneath fingertips
  const tipToWristDeltaX = Math.abs(wrist.x - middleTip.x);
  if (tipToWristDeltaX > 0.16) return false;

  // 6. Steeple shape: Middle finger is at the apex
  if (middleTip.y > indexTip.y + 0.05 || middleTip.y > ringTip.y + 0.05) return false;

  return true;
}

/**
 * Detects two hands brought together into Namaskar / Pranam pose.
 * Both hands must be upright, and the two hands must be near each other.
 * @param {Array<{x: number, y: number, z: number}>} h1 - First hand landmarks
 * @param {Array<{x: number, y: number, z: number}>} h2 - Second hand landmarks
 * @returns {{isNamaskar: boolean, confidence: number, distance: number, verticalOk: boolean}}
 */
export function isTwoHandsNamaskar(h1, h2) {
  if (!h1 || !h2 || h1.length < 21 || h2.length < 21) {
    return { isNamaskar: false, confidence: 0, distance: 999, verticalOk: false };
  }

  // 1. Both hands must point upward
  const h1Span = h1[0].y - h1[12].y;
  const h2Span = h2[0].y - h2[12].y;
  if (h1Span < 0.06 || h2Span < 0.06) {
    return { isNamaskar: false, confidence: 0.1, distance: 999, verticalOk: false };
  }

  // 2. Both hands must have fingers extended upward
  const h1Ext = (h1[12].y < h1[10].y ? 1 : 0) + (h1[8].y < h1[6].y ? 1 : 0) + (h1[16].y < h1[14].y ? 1 : 0);
  const h2Ext = (h2[12].y < h2[10].y ? 1 : 0) + (h2[8].y < h2[6].y ? 1 : 0) + (h2[16].y < h2[14].y ? 1 : 0);
  if (h1Ext < 1 || h2Ext < 1) {
    return { isNamaskar: false, confidence: 0.2, distance: 999, verticalOk: false };
  }

  // 3. Proximity between the two hands:
  const wristDist = distance3D(h1[0], h2[0]);
  const palmDist = distance3D(h1[9], h2[9]);
  const tipDist = distance3D(h1[12], h2[12]);

  // Vertical alignment between tips and wrists
  const tipVerticalDelta = Math.abs(h1[12].y - h2[12].y);
  const wristVerticalDelta = Math.abs(h1[0].y - h2[0].y);
  const verticalOk = tipVerticalDelta < 0.22 && wristVerticalDelta < 0.26;

  // Effective distance between the two hands
  const effectiveDistance = Math.min(palmDist, (wristDist + tipDist) / 2);

  // Hands are near each other (touching or close in front of chest)
  const isNear = (effectiveDistance < 0.35 || (palmDist < 0.30 && tipDist < 0.30)) && verticalOk;

  if (isNear) {
    const confidence = Math.min(0.99, Math.max(0.85, 1.0 - effectiveDistance * 0.4));
    return {
      isNamaskar: true,
      confidence,
      distance: effectiveDistance,
      verticalOk: true
    };
  }

  return {
    isNamaskar: false,
    confidence: 0.45,
    distance: effectiveDistance,
    verticalOk
  };
}

/**
 * Computes Pranam / Namaskar pose confidence (0.0 to 1.0)
 * Triggers when two hands are brought near each other in Namaskar,
 * OR when hands are pressed tightly palm-to-palm in folded prayer position.
 * @param {Array<Array<{x: number, y: number, z: number}>>} multiHandLandmarks
 * @returns {{isNamaskar: boolean, confidence: number, distance: number, verticalOk: boolean, mode: string}}
 */
export function evaluateNamaskarGesture(multiHandLandmarks) {
  if (!multiHandLandmarks || multiHandLandmarks.length === 0) {
    return { isNamaskar: false, confidence: 0, distance: 999, verticalOk: false, mode: 'हात शोधत आहे...' };
  }

  // Filter for valid hand candidates
  const candidateHands = multiHandLandmarks.filter(isAnatomicalHand);

  if (candidateHands.length === 0) {
    return { isNamaskar: false, confidence: 0, distance: 999, verticalOk: false, mode: 'हात शोधत आहे...' };
  }

  // Case 1: 2 or more hands detected
  if (candidateHands.length >= 2) {
    const twoHandResult = isTwoHandsNamaskar(candidateHands[0], candidateHands[1]);
    if (twoHandResult.isNamaskar) {
      return {
        isNamaskar: true,
        confidence: twoHandResult.confidence,
        distance: twoHandResult.distance,
        verticalOk: true,
        mode: '२ हात नमस्कार'
      };
    }

    // Two hands present, but not near each other
    return {
      isNamaskar: false,
      confidence: twoHandResult.confidence,
      distance: twoHandResult.distance,
      verticalOk: twoHandResult.verticalOk,
      mode: 'दोन्ही हात जवळ आणा'
    };
  }

  // Case 2: Exactly 1 hand detected
  // When hands are pressed tightly palm-to-palm (as in user's photo), MediaPipe
  // tracks them as a single combined folded prayer hand silhouette.
  const singleHand = candidateHands[0];
  if (isFoldedPrayerHands(singleHand)) {
    return {
      isNamaskar: true,
      confidence: 0.96,
      distance: 0.05,
      verticalOk: true,
      mode: '२ हात नमस्कार'
    };
  }

  // 1 single hand alone (not folded hands)
  return {
    isNamaskar: false,
    confidence: 0.35,
    distance: 999,
    verticalOk: false,
    mode: 'दोन्ही हात जोडून नमस्कार करा'
  };
}
