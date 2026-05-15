// Angle-based real-time form analysis for each exercise

interface FormCheck {
  message: string;
  type: "good" | "warning" | "error";
}

interface JointAngles {
  leftKnee: number;
  rightKnee: number;
  leftElbow: number;
  rightElbow: number;
  leftHip: number;
  rightHip: number;
  leftShoulder: number;
  rightShoulder: number;
}

// Pick the most visible side for single-side exercises (push-ups, curls).
// Returns "left" | "right" based on average visibility of shoulder/elbow/wrist.
export function pickWorkingSide(landmarks: any[] | null): "left" | "right" {
  if (!landmarks || landmarks.length < 33) return "left";
  const leftVis =
    ((landmarks[11]?.visibility ?? 0) +
      (landmarks[13]?.visibility ?? 0) +
      (landmarks[15]?.visibility ?? 0)) / 3;
  const rightVis =
    ((landmarks[12]?.visibility ?? 0) +
      (landmarks[14]?.visibility ?? 0) +
      (landmarks[16]?.visibility ?? 0)) / 3;
  return rightVis > leftVis ? "right" : "left";
}

// Check torso (shoulder→hip line) is roughly horizontal — i.e. user is in plank
// orientation, not standing. Used to validate a real push-up.
export function isPushupOrientation(landmarks: any[] | null): boolean {
  if (!landmarks || landmarks.length < 33) return false;
  const ls = landmarks[11], rs = landmarks[12];
  const lh = landmarks[23], rh = landmarks[24];
  if (!ls || !rs || !lh || !rh) return false;
  // Average shoulder/hip Y in normalized coords (0=top, 1=bottom)
  const shoulderY = (ls.y + rs.y) / 2;
  const hipY = (lh.y + rh.y) / 2;
  // In a push-up, shoulders and hips are roughly at the same height (small Y delta).
  // In standing, hips are far below shoulders (large Y delta).
  return Math.abs(shoulderY - hipY) < 0.18;
}

export function analyzeForm(exercise: string, angles: JointAngles, landmarks?: any[] | null): FormCheck {
  switch (exercise) {
    case "squat":
      return analyzeSquat(angles);
    case "pushup":
      return analyzePushup(angles, landmarks ?? null);
    case "lunge":
      return analyzeLunge(angles);
    case "plank":
      return analyzePlank(angles);
    case "bicep_curl":
      return analyzeBicepCurl(angles);
    case "shoulder_press":
      return analyzeShoulderPress(angles);
    case "shoulder_front_raise":
      return analyzeFrontRaise(angles);
    case "lateral_raise":
      return analyzeLateralRaise(angles);
    case "hammer_curl":
      return analyzeHammerCurl(angles);
    case "overhead_tricep_extension":
      return analyzeOverheadTricep(angles);
    default:
      return { message: "✓ Tracking your movement — maintain control", type: "good" };
  }
}

function analyzeSquat(a: JointAngles): FormCheck {
  const kneeAvg = (a.leftKnee + a.rightKnee) / 2;
  const hipAvg = (a.leftHip + a.rightHip) / 2;

  if (kneeAvg < 70) return { message: "⚠ Too deep — risk of knee strain. Stop at parallel.", type: "warning" };
  if (kneeAvg < 100 && hipAvg < 100) return { message: "✓ Great depth! Knees tracking well over toes.", type: "good" };
  if (Math.abs(a.leftKnee - a.rightKnee) > 20) return { message: "⚠ Uneven knee bend — check weight distribution", type: "warning" };
  if (hipAvg > 160) return { message: "✗ Stand taller at the top — fully extend hips", type: "error" };
  return { message: "✓ Good squat form — keep chest up", type: "good" };
}

function analyzePushup(a: JointAngles, landmarks: any[] | null): FormCheck {
  // Single-side detection — pick whichever arm is more visible.
  const side = pickWorkingSide(landmarks);
  const elbow = side === "left" ? a.leftElbow : a.rightElbow;
  const hipAvg = (a.leftHip + a.rightHip) / 2;
  const inPlank = landmarks ? isPushupOrientation(landmarks) : true;

  if (!inPlank) return { message: "⚠ Get into push-up position — torso must be horizontal", type: "warning" };
  if (hipAvg < 145) return { message: "⚠ Hips sagging — engage core, straighten body", type: "warning" };
  if (hipAvg > 195) return { message: "⚠ Hips too high — lower them into a straight line", type: "warning" };
  if (elbow < 100) return { message: "✓ Full range of motion — great depth!", type: "good" };
  if (elbow > 155) return { message: "✓ Arms fully extended at the top", type: "good" };
  return { message: "✓ Good push-up form — controlled tempo", type: "good" };
}

function analyzeLunge(a: JointAngles): FormCheck {
  if (a.leftKnee < 80 || a.rightKnee < 80) return { message: "⚠ Front knee too far forward — keep it over ankle", type: "warning" };
  if (Math.abs(a.leftKnee - a.rightKnee) > 40) return { message: "✓ Good lunge depth — back knee approaching floor", type: "good" };
  return { message: "✓ Steady lunge — keep torso upright", type: "good" };
}

function analyzePlank(a: JointAngles): FormCheck {
  const hipAvg = (a.leftHip + a.rightHip) / 2;
  const shoulderAvg = (a.leftShoulder + a.rightShoulder) / 2;

  if (hipAvg < 150) return { message: "⚠ Hips dropping — tighten core, lift hips", type: "warning" };
  if (hipAvg > 190) return { message: "⚠ Hips too high — lower into straight line", type: "warning" };
  if (shoulderAvg < 70) return { message: "⚠ Shoulders collapsing — push floor away", type: "warning" };
  return { message: "✓ Perfect plank — neutral spine, core engaged", type: "good" };
}

function analyzeBicepCurl(a: JointAngles): FormCheck {
  const workingElbow = Math.min(a.leftElbow, a.rightElbow);
  const workingShoulder = Math.min(a.leftShoulder, a.rightShoulder);

  if (workingShoulder > 55) return { message: "⚠ Elbow drifting forward — pin it to your side", type: "warning" };
  if (workingElbow < 55) return { message: "✓ Full contraction — squeeze at the top!", type: "good" };
  if (workingElbow > 150) return { message: "✓ Full extension — controlled eccentric", type: "good" };
  return { message: "✓ Good curl form — steady tempo", type: "good" };
}

function analyzeShoulderPress(a: JointAngles): FormCheck {
  const elbowAvg = (a.leftElbow + a.rightElbow) / 2;
  const shoulderAvg = (a.leftShoulder + a.rightShoulder) / 2;

  if (shoulderAvg > 170) return { message: "✓ Full lockout — arms straight overhead", type: "good" };
  if (elbowAvg < 80) return { message: "⚠ Too low — stop when elbows are at 90°", type: "warning" };
  if (Math.abs(a.leftElbow - a.rightElbow) > 20) return { message: "⚠ Uneven press — balance both arms", type: "warning" };
  return { message: "✓ Good press — keep core braced", type: "good" };
}

function analyzeFrontRaise(a: JointAngles): FormCheck {
  const shoulderAvg = (a.leftShoulder + a.rightShoulder) / 2;
  const elbowAvg = (a.leftElbow + a.rightElbow) / 2;
  if (shoulderAvg > 110) return { message: "⚠ Raising too high — stop at shoulder level (~90°)", type: "warning" };
  if (elbowAvg < 140) return { message: "⚠ Bending elbows too much — keep arms nearly straight", type: "warning" };
  if (Math.abs(a.leftShoulder - a.rightShoulder) > 18) return { message: "⚠ Asymmetric raise — match both arm heights", type: "warning" };
  if (shoulderAvg > 75 && shoulderAvg < 100) return { message: "✓ Perfect height — arms parallel to floor", type: "good" };
  if (shoulderAvg < 25) return { message: "✓ Controlled return — reset for next rep", type: "good" };
  return { message: "✓ Good front raise — slow and controlled", type: "good" };
}

function analyzeLateralRaise(a: JointAngles): FormCheck {
  const shoulderAvg = (a.leftShoulder + a.rightShoulder) / 2;
  const elbowAvg = (a.leftElbow + a.rightElbow) / 2;
  if (shoulderAvg > 110) return { message: "⚠ Raising above shoulder — risk of impingement", type: "warning" };
  if (elbowAvg < 130) return { message: "⚠ Elbows bending too much — keep slight bend only", type: "warning" };
  if (Math.abs(a.leftShoulder - a.rightShoulder) > 18) return { message: "⚠ Uneven raise — balance both arms", type: "warning" };
  if (shoulderAvg > 75 && shoulderAvg < 100) return { message: "✓ Arms at shoulder height — perfect lateral raise", type: "good" };
  return { message: "✓ Good lateral raise — keep traps relaxed", type: "good" };
}

function analyzeHammerCurl(a: JointAngles): FormCheck {
  const workingElbow = Math.min(a.leftElbow, a.rightElbow);
  const workingShoulder = Math.min(a.leftShoulder, a.rightShoulder);
  if (workingShoulder > 50) return { message: "⚠ Elbow drifting forward — pin it at your side", type: "warning" };
  if (workingElbow < 65) return { message: "✓ Full contraction — squeeze biceps!", type: "good" };
  if (workingElbow > 145) return { message: "✓ Full extension — controlled eccentric", type: "good" };
  return { message: "✓ Good hammer curl — neutral grip, steady tempo", type: "good" };
}

function analyzeOverheadTricep(a: JointAngles): FormCheck {
  const elbowAvg = (a.leftElbow + a.rightElbow) / 2;
  const shoulderAvg = (a.leftShoulder + a.rightShoulder) / 2;
  if (shoulderAvg < 130) return { message: "⚠ Upper arms dropping — keep them vertical overhead", type: "warning" };
  if (Math.abs(a.leftElbow - a.rightElbow) > 20) return { message: "⚠ Uneven extension — balance both arms", type: "warning" };
  if (elbowAvg < 70) return { message: "✓ Deep stretch — full ROM behind head", type: "good" };
  if (elbowAvg > 160) return { message: "✓ Full lockout — squeeze triceps!", type: "good" };
  return { message: "✓ Good tricep extension — only forearms move", type: "good" };
}

export function detectPlankHold(angles: JointAngles): boolean {
  const hipAvg = (angles.leftHip + angles.rightHip) / 2;
  const shoulderAvg = (angles.leftShoulder + angles.rightShoulder) / 2;
  return hipAvg >= 150 && hipAvg <= 190 && shoulderAvg >= 70;
}

export function detectMovementType(angles: JointAngles): string | null {
  const elbowAvg = (angles.leftElbow + angles.rightElbow) / 2;
  const shoulderAvg = (angles.leftShoulder + angles.rightShoulder) / 2;
  const kneeAvg = (angles.leftKnee + angles.rightKnee) / 2;
  const hipAvg = (angles.leftHip + angles.rightHip) / 2;

  if (shoulderAvg > 90 && elbowAvg > 80) return "shoulder_press";
  if (shoulderAvg < 60 && elbowAvg < 120) return "bicep_curl";
  if (kneeAvg < 140) return "squat_or_lunge";
  if (elbowAvg < 140 && hipAvg > 140 && hipAvg < 200) return "pushup";
  return null;
}

export function isMovementMatchingExercise(exercise: string, detectedMovement: string | null): boolean {
  if (!detectedMovement) return true;
  switch (exercise) {
    case "squat":
    case "lunge":
      return detectedMovement === "squat_or_lunge";
    case "shoulder_press":
      return detectedMovement === "shoulder_press";
    case "bicep_curl":
    case "hammer_curl":
      return detectedMovement === "bicep_curl";
    case "pushup":
      return detectedMovement === "pushup";
    default:
      return true;
  }
}

/**
 * Rep phase detection — strictly exercise-specific.
 * Accepts optional landmarks so single-side exercises (push-up, curls) can
 * pick the more-visible side, enabling reliable side-view tracking.
 */
export function detectRepPhase(
  exercise: string,
  angles: JointAngles,
  landmarks?: any[] | null
): "up" | "down" | "neutral" {
  const elbowAvg = (angles.leftElbow + angles.rightElbow) / 2;
  const shoulderAvg = (angles.leftShoulder + angles.rightShoulder) / 2;
  const kneeAvg = (angles.leftKnee + angles.rightKnee) / 2;
  const hipAvg = (angles.leftHip + angles.rightHip) / 2;

  switch (exercise) {
    case "squat":
    case "lunge": {
      if (kneeAvg < 110 && hipAvg < 140) return "down";
      if (kneeAvg > 155 && hipAvg > 155) return "up";
      return "neutral";
    }
    case "pushup": {
      // Body alignment: must be in horizontal/plank orientation (not standing)
      if (landmarks && !isPushupOrientation(landmarks)) return "neutral";
      // Shoulder–hip horizontality through hip angle (allow generous range)
      if (hipAvg < 140 || hipAvg > 205) return "neutral";

      // Pick most visible arm — supports side-view detection
      const side = landmarks ? pickWorkingSide(landmarks) : (angles.leftElbow <= angles.rightElbow ? "left" : "right");
      const elbow = side === "left" ? angles.leftElbow : angles.rightElbow;

      if (elbow < 110) return "down";
      if (elbow > 155) return "up";
      return "neutral";
    }
    case "bicep_curl": {
      const side = landmarks
        ? pickWorkingSide(landmarks)
        : (angles.leftElbow <= angles.rightElbow ? "left" : "right");
      const workingElbow = side === "left" ? angles.leftElbow : angles.rightElbow;
      const workingShoulder = side === "left" ? angles.leftShoulder : angles.rightShoulder;
      if (workingShoulder > 55) return "neutral";
      if (workingElbow < 55) return "up";    // closed
      if (workingElbow > 150) return "down"; // open
      return "neutral";
    }
    case "hammer_curl": {
      const side = landmarks
        ? pickWorkingSide(landmarks)
        : (angles.leftElbow <= angles.rightElbow ? "left" : "right");
      const workingElbow = side === "left" ? angles.leftElbow : angles.rightElbow;
      const workingShoulder = side === "left" ? angles.leftShoulder : angles.rightShoulder;
      if (workingShoulder > 55) return "neutral";
      if (workingElbow < 65) return "up";
      if (workingElbow > 145) return "down";
      return "neutral";
    }
    case "shoulder_press": {
      if (shoulderAvg < 75) return "neutral";
      if (elbowAvg > 160 && shoulderAvg > 140) return "up";
      if (elbowAvg < 95 && shoulderAvg > 75) return "down";
      return "neutral";
    }
    case "shoulder_front_raise": {
      if (elbowAvg < 130) return "neutral";
      if (shoulderAvg > 75 && shoulderAvg < 110) return "up";
      if (shoulderAvg < 30) return "down";
      return "neutral";
    }
    case "lateral_raise": {
      if (elbowAvg < 120) return "neutral";
      if (shoulderAvg > 75 && shoulderAvg < 110) return "up";
      if (shoulderAvg < 30) return "down";
      return "neutral";
    }
    case "overhead_tricep_extension": {
      if (shoulderAvg < 130) return "neutral";
      if (elbowAvg < 80) return "down";
      if (elbowAvg > 155) return "up";
      return "neutral";
    }
    default:
      return "neutral";
  }
}
