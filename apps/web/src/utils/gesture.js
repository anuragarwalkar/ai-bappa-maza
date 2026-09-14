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
 * MediaPipe Pose Landmark Indices Reference
 */
export const POSE_LANDMARKS = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24
};

/**
 * Calculates 2D Euclidean distance between two landmarks
 * @param {{x: number, y: number}} p1
 * @param {{x: number, y: number}} p2
 * @returns {number}
 */
export function distance2D(p1, p2) {
  if (!p1 || !p2) return 999;
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

/**
 * Evaluates Namaskar (Pranam / Anjali Mudra) posture strictly from 33 MediaPipe Pose landmarks.
 * Scale-invariant: distances are normalized by the devotee's shoulder span, making detection
 * work consistently whether standing 1m or 4m from the camera.
 * 
 * @param {Array<{x: number, y: number, z: number, visibility?: number}>} poseLandmarks
 * @returns {{isNamaskar: boolean, confidence: number, distance: number | string, verticalOk: boolean, mode: string, metrics?: object}}
 */
export function evaluateNamaskarPose(poseLandmarks) {
  if (!poseLandmarks || poseLandmarks.length < 25) {
    return {
      isNamaskar: false,
      confidence: 0,
      distance: '--',
      verticalOk: false,
      mode: 'भक्त शोधत आहे...'
    };
  }

  const nose = poseLandmarks[POSE_LANDMARKS.NOSE];
  const lShoulder = poseLandmarks[POSE_LANDMARKS.LEFT_SHOULDER];
  const rShoulder = poseLandmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
  const lElbow = poseLandmarks[POSE_LANDMARKS.LEFT_ELBOW];
  const rElbow = poseLandmarks[POSE_LANDMARKS.RIGHT_ELBOW];
  const lWrist = poseLandmarks[POSE_LANDMARKS.LEFT_WRIST];
  const rWrist = poseLandmarks[POSE_LANDMARKS.RIGHT_WRIST];
  const lIndex = poseLandmarks[POSE_LANDMARKS.LEFT_INDEX];
  const rIndex = poseLandmarks[POSE_LANDMARKS.RIGHT_INDEX];
  const lHip = poseLandmarks[POSE_LANDMARKS.LEFT_HIP];
  const rHip = poseLandmarks[POSE_LANDMARKS.RIGHT_HIP];

  // 1. Landmark visibility check
  const visLWr = lWrist.visibility !== undefined ? lWrist.visibility : 1.0;
  const visRWr = rWrist.visibility !== undefined ? rWrist.visibility : 1.0;
  const visLSh = lShoulder.visibility !== undefined ? lShoulder.visibility : 1.0;
  const visRSh = rShoulder.visibility !== undefined ? rShoulder.visibility : 1.0;

  if (visLSh < 0.35 || visRSh < 0.35) {
    return {
      isNamaskar: false,
      confidence: 0.1,
      distance: '--',
      verticalOk: false,
      mode: 'कॅमेऱ्यासमोर या...'
    };
  }

  if (visLWr < 0.25 || visRWr < 0.25) {
    return {
      isNamaskar: false,
      confidence: 0.2,
      distance: '--',
      verticalOk: false,
      mode: 'हात दाखवा...'
    };
  }

  // 2. Scale factor: Devotee's shoulder width in image space
  const shoulderSpan = distance2D(lShoulder, rShoulder);
  const safeShoulderSpan = Math.max(0.08, shoulderSpan);

  // 3. Wrist & Fingertip Proximity
  const wristDist2D = distance2D(lWrist, rWrist);
  const normalizedWristRatio = wristDist2D / safeShoulderSpan;

  // If index fingers are clearly visible, incorporate fingertip proximity
  let normalizedIndexRatio = normalizedWristRatio;
  if (lIndex && rIndex && (lIndex.visibility || 1) > 0.3 && (rIndex.visibility || 1) > 0.3) {
    const indexDist2D = distance2D(lIndex, rIndex);
    normalizedIndexRatio = indexDist2D / safeShoulderSpan;
  }

  // Both wrists must be close together for folded prayer hands
  const effectiveHandRatio = Math.max(normalizedWristRatio, (normalizedWristRatio + normalizedIndexRatio) / 2);

  // 4. Vertical positioning
  const midShoulderY = (lShoulder.y + rShoulder.y) / 2;
  const midWristY = (lWrist.y + rWrist.y) / 2;
  const midElbowY = (lElbow.y + rElbow.y) / 2;
  const noseY = nose ? nose.y : (midShoulderY - 0.25);
  const hipY = (lHip && rHip) ? (lHip.y + rHip.y) / 2 : (midShoulderY + safeShoulderSpan * 1.6);

  // Wrists must be at similar vertical level (symmetric hands)
  const wristVerticalDelta = Math.abs(lWrist.y - rWrist.y);
  const verticalOk = wristVerticalDelta < (safeShoulderSpan * 0.40);

  // Hands must be held in front of chest / chin area:
  // - Below nose/eyes: midWristY > noseY + 0.01
  // - Above hips: midWristY < hipY
  // - Raised up relative to elbows: midWristY <= midElbowY + 0.14
  const isChestChinHeight = midWristY > (noseY + 0.01) &&
                            midWristY < hipY &&
                            midWristY <= (midElbowY + 0.14);

  // 5. Torso horizontal centering
  const midWristX = (lWrist.x + rWrist.x) / 2;
  const minTorsoX = Math.min(lShoulder.x, rShoulder.x) - safeShoulderSpan * 0.35;
  const maxTorsoX = Math.max(lShoulder.x, rShoulder.x) + safeShoulderSpan * 0.35;
  const isTorsoCentered = midWristX >= minTorsoX && midWristX <= maxTorsoX;

  // 6. Elbow flare check (prayer triangle shape: elbows are wider than wrists)
  const elbowDist2D = distance2D(lElbow, rElbow);
  const isElbowFlared = elbowDist2D > (wristDist2D * 1.2);

  // 7. Namaskar evaluation
  // When hands touch in Namaskar, effectiveHandRatio is typically < 0.38
  const isTouchingOrNear = effectiveHandRatio < 0.38;

  if (isTouchingOrNear && verticalOk && isChestChinHeight && isTorsoCentered) {
    const rawConfidence = 1.0 - (effectiveHandRatio * 0.6);
    const confidence = Math.min(0.99, Math.max(0.85, rawConfidence));

    return {
      isNamaskar: true,
      confidence,
      distance: (effectiveHandRatio * 10).toFixed(1),
      verticalOk: true,
      mode: '🙏 नमस्कार मान्य!',
      metrics: {
        shoulderSpan,
        effectiveHandRatio,
        midWristY,
        midShoulderY
      }
    };
  }

  // Not yet Namaskar: Provide helpful guidance
  let promptMode = 'दोन्ही हात जोडून नमस्कार करा';
  if (!isChestChinHeight) {
    if (midWristY > midElbowY + 0.14) {
      promptMode = 'हात वर करून जोडा';
    } else {
      promptMode = 'हात छातीसमोर आणा';
    }
  } else if (!isTouchingOrNear) {
    promptMode = 'दोन्ही हात जवळ आणा';
  } else if (!verticalOk) {
    promptMode = 'दोन्ही हात समोरासमोर ठेवा';
  }

  const partialConfidence = Math.max(0.15, Math.min(0.65, 0.75 - normalizedWristRatio * 0.4));

  return {
    isNamaskar: false,
    confidence: partialConfidence,
    distance: (normalizedWristRatio * 10).toFixed(1),
    verticalOk,
    mode: promptMode,
    metrics: {
      shoulderSpan,
      normalizedWristRatio,
      midWristY,
      midShoulderY
    }
  };
}

/**
 * Universal evaluator: computes Namaskar pose confidence from either Pose landmarks
 * (33 landmarks array) or legacy multiHandLandmarks.
 * @param {Array} input
 * @returns {{isNamaskar: boolean, confidence: number, distance: number | string, verticalOk: boolean, mode: string}}
 */
export function evaluateNamaskarGesture(input) {
  if (!input || input.length === 0) {
    return { isNamaskar: false, confidence: 0, distance: 999, verticalOk: false, mode: 'शोधत आहे...' };
  }

  // Check if input is MediaPipe Pose landmarks (flat array of 33 landmarks)
  if (Array.isArray(input) && input.length >= 25 && input[0] && typeof input[0].x === 'number') {
    return evaluateNamaskarPose(input);
  }

  // Legacy fallback: multiHandLandmarks (array of hand arrays)
  const candidateHands = input.filter(isAnatomicalHand);

  if (candidateHands.length === 0) {
    return { isNamaskar: false, confidence: 0, distance: 999, verticalOk: false, mode: 'हात शोधत आहे...' };
  }

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
    return {
      isNamaskar: false,
      confidence: twoHandResult.confidence,
      distance: twoHandResult.distance,
      verticalOk: twoHandResult.verticalOk,
      mode: 'दोन्ही हात जवळ आणा'
    };
  }

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

  return {
    isNamaskar: false,
    confidence: 0.35,
    distance: 999,
    verticalOk: false,
    mode: 'दोन्ही हात जोडून नमस्कार करा'
  };
}
