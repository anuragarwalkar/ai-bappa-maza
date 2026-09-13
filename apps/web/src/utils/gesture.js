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
  // Realistic hand in camera view (between 5% and 60% of frame)
  if (palmLength < 0.05 || palmLength > 0.60) return false;

  // 2. Palm Width (index MCP to pinky MCP)
  const palmWidth = distance3D(indexMcp, pinkyMcp);
  // Ratio of palm width to palm length for human hand is ~0.35 to 1.35
  const palmAspect = palmWidth / palmLength;
  if (palmAspect < 0.35 || palmAspect > 1.35) return false;

  // 3. Middle finger length (middle MCP to middle Tip)
  const middleFingerLength = distance3D(middleMcp, middleTip);
  const fingerPalmRatio = middleFingerLength / palmLength;
  // A real human finger is 0.40 to 1.6x the palm length
  // Faces falsely detected as hands have tiny or distorted "finger" ratios
  if (fingerPalmRatio < 0.40 || fingerPalmRatio > 1.60) return false;

  // 4. Knuckle alignment: knuckles (5, 9, 13, 17) should not be collapsed into a single point
  const d5_9 = distance3D(indexMcp, middleMcp);
  const d9_13 = distance3D(middleMcp, ringMcp);
  const d13_17 = distance3D(ringMcp, pinkyMcp);
  if (d5_9 < 0.005 || d9_13 < 0.005 || d13_17 < 0.005) return false;

  // 5. Total finger joint segment length vs direct displacement
  const indexPip = hand[6];
  const indexDip = hand[7];
  const segIndex = distance3D(indexMcp, indexPip) + distance3D(indexPip, indexDip) + distance3D(indexDip, indexTip);
  const directIndex = distance3D(indexMcp, indexTip);
  if (segIndex < directIndex * 0.95) return false;

  return true;
}

/**
 * Checks if a hand is in an upright, open Pranam / Namaskar posture.
 * Requires that the hand is a valid anatomical hand, wrist is below knuckles,
 * and at least 3 fingers are sequentially extended upwards.
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
  const pinkyMcp = hand[17];

  const indexPip = hand[6];
  const middlePip = hand[10];
  const ringPip = hand[14];
  const pinkyPip = hand[18];

  const indexTip = hand[8];
  const middleTip = hand[12];
  const ringTip = hand[16];
  const pinkyTip = hand[20];

  const handSize = distance3D(wrist, middleMcp) || 0.15;

  // 1. Wrist must be clearly below the middle knuckle (smaller Y = higher up on screen)
  if (wrist.y <= middleMcp.y + 0.03) {
    return { isValid: false, extendedCount: 0, handSize };
  }

  // 2. Count sequentially extended fingers:
  // An extended upright finger requires: tip.y < pip.y && pip.y < mcp.y
  let extendedCount = 0;

  // Index finger extended upward
  if (indexTip.y < indexPip.y && indexPip.y < indexMcp.y) {
    extendedCount++;
  }
  // Middle finger extended upward
  if (middleTip.y < middlePip.y && middlePip.y < middleMcp.y) {
    extendedCount++;
  }
  // Ring finger extended upward
  if (ringTip.y < ringPip.y && ringPip.y < ringMcp.y) {
    extendedCount++;
  }
  // Pinky finger extended upward
  if (pinkyTip.y < pinkyPip.y && pinkyPip.y < pinkyMcp.y) {
    extendedCount++;
  }

  // Fingertips must be distinctly higher than the wrist
  const middleHighEnough = middleTip.y < wrist.y - 0.08;
  const indexHighEnough = indexTip.y < wrist.y - 0.08;

  // At least 3 fingers extended upward and raised high enough above wrist
  const isValid = extendedCount >= 3 && (middleHighEnough || indexHighEnough);

  return {
    isValid,
    extendedCount,
    handSize
  };
}

/**
 * Computes Pranam / Namaskar pose confidence (0.0 to 1.0)
 * Only triggers on real human hands, rejecting faces and non-upright hands.
 * @param {Array<Array<{x: number, y: number, z: number}>>} multiHandLandmarks
 * @returns {{isNamaskar: boolean, confidence: number, distance: number, verticalOk: boolean, mode: string}}
 */
export function evaluateNamaskarGesture(multiHandLandmarks) {
  if (!multiHandLandmarks || multiHandLandmarks.length === 0) {
    return { isNamaskar: false, confidence: 0, distance: 999, verticalOk: false, mode: 'हात शोधत आहे...' };
  }

  // Filter for valid anatomical hands only
  const validHands = multiHandLandmarks.filter(isAnatomicalHand);

  if (validHands.length === 0) {
    return { isNamaskar: false, confidence: 0, distance: 999, verticalOk: false, mode: 'हात शोधत आहे...' };
  }

  // Case 1: 1 Valid Hand detected
  if (validHands.length === 1) {
    const h1 = validHands[0];
    const check = isHandUprightAndOpen(h1);

    if (check.isValid) {
      return {
        isNamaskar: true,
        confidence: 0.96,
        distance: 0.15,
        verticalOk: true,
        mode: '१ हात नमन'
      };
    }

    // Hand detected but fingers are not upright/extended
    return {
      isNamaskar: false,
      confidence: 0.20,
      distance: 0.35,
      verticalOk: false,
      mode: 'हात वर करा'
    };
  }

  // Case 2: 2 Valid Hands detected (Namaskar / Pranam)
  const h1 = validHands[0];
  const h2 = validHands[1];
  const check1 = isHandUprightAndOpen(h1);
  const check2 = isHandUprightAndOpen(h2);
  const wristDist = distance3D(h1[0], h2[0]);
  const palmsClose = wristDist < 0.35;

  // Both hands upright and open -> High confidence two-hand Namaskar!
  if (check1.isValid && check2.isValid) {
    return {
      isNamaskar: true,
      confidence: 0.99,
      distance: wristDist,
      verticalOk: true,
      mode: palmsClose ? '२ हात नमस्कार' : '२ हात नमन'
    };
  }

  // If at least one hand is upright and open, and hands are held together in front
  if ((check1.isValid || check2.isValid) && palmsClose) {
    return {
      isNamaskar: true,
      confidence: 0.92,
      distance: wristDist,
      verticalOk: true,
      mode: '२ हात नमस्कार'
    };
  }

  // If one hand is clearly upright and extended
  if (check1.isValid || check2.isValid) {
    return {
      isNamaskar: true,
      confidence: 0.90,
      distance: wristDist,
      verticalOk: true,
      mode: '१ हात नमन'
    };
  }

  return {
    isNamaskar: false,
    confidence: 0.25,
    distance: wristDist,
    verticalOk: false,
    mode: 'हात वर करा'
  };
}
