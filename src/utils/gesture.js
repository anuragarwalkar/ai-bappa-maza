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
 * Checks if a single hand is in upright posture (pranam / greeting / blessing)
 * @param {Array<{x: number, y: number, z: number}>} hand - Array of 21 MediaPipe hand landmarks
 * @returns {{isValid: boolean, handSize: number}}
 */
export function isHandUprightAndOpen(hand) {
  // 0: Wrist, 5: Index MCP, 8: Index Tip, 9: Middle MCP, 12: Middle Tip, 13: Ring MCP, 16: Ring Tip, 17: Pinky MCP, 20: Pinky Tip
  const wrist = hand[0];
  const middleTip = hand[12];
  const indexTip = hand[8];
  const ringTip = hand[16];
  const pinkyTip = hand[20];

  // Hand size reference
  const handSize = distance3D(wrist, hand[9]) || 0.15;

  // 1. Fingertips must be higher than wrist (smaller Y = higher up on screen)
  const isUpright = (middleTip.y < wrist.y) || (indexTip.y < wrist.y) || (ringTip.y < wrist.y) || (pinkyTip.y < wrist.y);

  // 2. Fingers extended: Main fingertips higher than their base knuckle (MCP)
  const fingersExtended = (
    (middleTip.y < hand[9].y) ||
    (indexTip.y < hand[5].y) ||
    (ringTip.y < hand[13].y)
  );

  // 3. Hand is within visible frame
  const isVisibleInFrame = wrist.y < 1.02 && wrist.y > 0.05;

  return {
    isValid: isUpright && fingersExtended && isVisibleInFrame,
    handSize
  };
}

/**
 * Computes Pranam / Namaskar pose confidence (0.0 to 1.0)
 * Triggers immediately on 1 hand upright OR 2 hands namaskar.
 * @param {Array<Array<{x: number, y: number, z: number}>>} multiHandLandmarks
 * @returns {{isNamaskar: boolean, confidence: number, distance: number, verticalOk: boolean, mode: string}}
 */
export function evaluateNamaskarGesture(multiHandLandmarks) {
  if (!multiHandLandmarks || multiHandLandmarks.length === 0) {
    return { isNamaskar: false, confidence: 0, distance: 999, verticalOk: false, mode: 'हात शोधत आहे...' };
  }

  // Case 1: 1 Hand detected
  if (multiHandLandmarks.length === 1) {
    const h1 = multiHandLandmarks[0];
    const check = isHandUprightAndOpen(h1);

    if (check.isValid) {
      return {
        isNamaskar: true,
        confidence: 0.96,
        distance: 0.15,
        verticalOk: true,
        mode: '१ हात नमन'
      };
    } else {
      const isPointingUp = (h1[12].y < h1[0].y) || (h1[8].y < h1[0].y);
      return {
        isNamaskar: isPointingUp,
        confidence: isPointingUp ? 0.85 : 0.20,
        distance: 0.35,
        verticalOk: isPointingUp,
        mode: isPointingUp ? '१ हात नमन' : 'हात वर करा'
      };
    }
  }

  // Case 2: 2 Hands detected (both hands raised or folded together)
  const h1 = multiHandLandmarks[0];
  const h2 = multiHandLandmarks[1];
  const check1 = isHandUprightAndOpen(h1);
  const check2 = isHandUprightAndOpen(h2);
  const wristDist = distance3D(h1[0], h2[0]);
  const handsClose = wristDist < 0.45;
  const eitherUpright = check1.isValid || check2.isValid || (h1[12].y < h1[0].y) || (h2[12].y < h2[0].y);

  if (eitherUpright) {
    return {
      isNamaskar: true,
      confidence: 0.98,
      distance: wristDist,
      verticalOk: true,
      mode: handsClose ? '२ हात नमस्कार' : 'हात नमन'
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
