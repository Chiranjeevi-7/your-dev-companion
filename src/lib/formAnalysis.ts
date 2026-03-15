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

// Rep detection based on angle thresholds
export function detectRepPhase(
  exercise: string,
  angles: JointAngles
): "up" | "down" | "neutral" {
  switch (exercise) {
    case "squat":
    case "lunge": {
      const kneeAvg = (angles.leftKnee + angles.rightKnee) / 2;
      if (kneeAvg < 110) return "down";
      if (kneeAvg > 155) return "up";
      return "neutral";
    }
    case "pushup": {
      const elbowAvg = (angles.leftElbow + angles.rightElbow) / 2;
      if (elbowAvg < 90) return "down";
      if (elbowAvg > 155) return "up";
      return "neutral";
    }
    case "bicep_curl": {
      const elbowAvg = (angles.leftElbow + angles.rightElbow) / 2;
      if (elbowAvg < 50) return "up";
      if (elbowAvg > 140) return "down";
      return "neutral";
    }
    case "shoulder_press":
    case "lat_pulldown": {
      const elbowAvg = (angles.leftElbow + angles.rightElbow) / 2;
      if (elbowAvg > 160) return "up";
      if (elbowAvg < 95) return "down";
      return "neutral";
    }
    case "deadlift": {
      const hipAvg = (angles.leftHip + angles.rightHip) / 2;
      if (hipAvg > 165) return "up";
      if (hipAvg < 100) return "down";
      return "neutral";
    }
    default:
      return "neutral";
  }
}
