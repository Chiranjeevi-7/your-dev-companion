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

export function analyzeForm(exercise: string, angles: JointAngles): FormCheck {
  switch (exercise) {
    case "squat":
      return analyzeSquat(angles);
    case "pushup":
      return analyzePushup(angles);
    case "deadlift":
      return analyzeDeadlift(angles);
    case "lunge":
      return analyzeLunge(angles);
    case "plank":
      return analyzePlank(angles);
    case "bicep_curl":
      return analyzeBicepCurl(angles);
    case "shoulder_press":
      return analyzeShoulderPress(angles);
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

function analyzePushup(a: JointAngles): FormCheck {
  const elbowAvg = (a.leftElbow + a.rightElbow) / 2;
  const hipAvg = (a.leftHip + a.rightHip) / 2;

  if (hipAvg < 150) return { message: "⚠ Hips sagging — engage core, straighten body", type: "warning" };
  if (hipAvg > 190) return { message: "⚠ Hips too high — lower them into a straight line", type: "warning" };
  if (elbowAvg < 70) return { message: "✓ Full range of motion — great depth!", type: "good" };
  if (elbowAvg > 160) return { message: "✓ Arms fully extended at the top", type: "good" };
  return { message: "✓ Good push-up form — elbows at 45°", type: "good" };
}

function analyzeDeadlift(a: JointAngles): FormCheck {
  const hipAvg = (a.leftHip + a.rightHip) / 2;
  const kneeAvg = (a.leftKnee + a.rightKnee) / 2;

  if (hipAvg < 80) return { message: "⚠ Lower back rounding detected — keep spine neutral!", type: "error" };
  if (kneeAvg < 90) return { message: "⚠ Too much knee bend — this isn't a squat", type: "warning" };
  if (hipAvg > 170) return { message: "✓ Lockout looks good — squeeze glutes at top", type: "good" };
  return { message: "✓ Hip hinge pattern correct — bar close to body", type: "good" };
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
  const elbowAvg = (a.leftElbow + a.rightElbow) / 2;
  const shoulderAvg = (a.leftShoulder + a.rightShoulder) / 2;

  if (shoulderAvg > 50) return { message: "⚠ Elbows flaring — keep them pinned to sides", type: "warning" };
  if (elbowAvg < 40) return { message: "✓ Full contraction — squeeze at the top!", type: "good" };
  if (elbowAvg > 160) return { message: "✓ Full extension — controlled eccentric", type: "good" };
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

// Plank hold detection — returns true when body is in valid plank position
export function detectPlankHold(angles: JointAngles): boolean {
  const hipAvg = (angles.leftHip + angles.rightHip) / 2;
  const shoulderAvg = (angles.leftShoulder + angles.rightShoulder) / 2;
  // Valid plank: hips between 150-190 (straight line) and shoulders not collapsed
  return hipAvg >= 150 && hipAvg <= 190 && shoulderAvg >= 70;
}

// Movement signature detection — returns which exercise the movement looks like
export function detectMovementType(angles: JointAngles): string | null {
  const elbowAvg = (angles.leftElbow + angles.rightElbow) / 2;
  const shoulderAvg = (angles.leftShoulder + angles.rightShoulder) / 2;
  const kneeAvg = (angles.leftKnee + angles.rightKnee) / 2;
  const hipAvg = (angles.leftHip + angles.rightHip) / 2;

  // Shoulder press: shoulders elevated (angle > 90) AND elbows extending overhead
  if (shoulderAvg > 90 && elbowAvg > 80) return "shoulder_press";
  // Bicep curl: shoulders low/pinned (< 60) AND elbows flexing
  if (shoulderAvg < 60 && elbowAvg < 120) return "bicep_curl";
  // Squat/lunge: knees bending significantly
  if (kneeAvg < 140) return "squat_or_lunge";
  // Pushup: elbows bending with hips roughly straight
  if (elbowAvg < 140 && hipAvg > 140 && hipAvg < 200) return "pushup";
  // Deadlift: hip hinge with relatively straight knees
  if (hipAvg < 140 && kneeAvg > 140) return "deadlift";

  return null;
}

// Check if detected movement matches selected exercise
export function isMovementMatchingExercise(exercise: string, detectedMovement: string | null): boolean {
  if (!detectedMovement) return true; // no clear movement = don't warn
  switch (exercise) {
    case "squat":
    case "lunge":
      return detectedMovement === "squat_or_lunge";
    case "shoulder_press":
      return detectedMovement === "shoulder_press";
    case "bicep_curl":
      return detectedMovement === "bicep_curl";
    case "pushup":
      return detectedMovement === "pushup";
    case "deadlift":
      return detectedMovement === "deadlift";
    default:
      return true;
  }
}

// Rep detection — strictly exercise-specific movement patterns
export function detectRepPhase(
  exercise: string,
  angles: JointAngles
): "up" | "down" | "neutral" {
  const elbowAvg = (angles.leftElbow + angles.rightElbow) / 2;
  const shoulderAvg = (angles.leftShoulder + angles.rightShoulder) / 2;
  const kneeAvg = (angles.leftKnee + angles.rightKnee) / 2;
  const hipAvg = (angles.leftHip + angles.rightHip) / 2;

  switch (exercise) {
    case "squat":
    case "lunge": {
      // Only count if knees are actually bending (not just elbow movement)
      if (kneeAvg < 110 && hipAvg < 140) return "down";
      if (kneeAvg > 155 && hipAvg > 155) return "up";
      return "neutral";
    }
    case "pushup": {
      // Require hips to stay straight (150-195) — distinguishes from other movements
      if (hipAvg < 145 || hipAvg > 200) return "neutral";
      if (elbowAvg < 90) return "down";
      if (elbowAvg > 155) return "up";
      return "neutral";
    }
    case "bicep_curl": {
      // Strict: shoulders must stay LOW (pinned to sides, < 50) — this prevents
      // shoulder press from being counted as curls
      if (shoulderAvg > 55) return "neutral";
      if (elbowAvg < 50) return "up";
      if (elbowAvg > 140) return "down";
      return "neutral";
    }
    case "shoulder_press": {
      // Strict: shoulders must be ELEVATED (> 80) — arms going overhead
      // This prevents bicep curls from being counted as presses
      if (shoulderAvg < 75) return "neutral";
      if (elbowAvg > 160 && shoulderAvg > 140) return "up";
      if (elbowAvg < 95 && shoulderAvg > 75) return "down";
      return "neutral";
    }
    case "lat_pulldown": {
      // Similar to shoulder press but inverted — pulling down
      if (shoulderAvg < 70) return "neutral";
      if (elbowAvg > 160) return "up";
      if (elbowAvg < 95) return "down";
      return "neutral";
    }
    case "deadlift": {
      // Strict: require knees to stay relatively straight (> 130)
      if (kneeAvg < 120) return "neutral";
      if (hipAvg > 165) return "up";
      if (hipAvg < 100) return "down";
      return "neutral";
    }
    default:
      return "neutral";
  }
}
