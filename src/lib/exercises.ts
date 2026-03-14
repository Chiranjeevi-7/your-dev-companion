export const EXERCISES: Record<string, { name: string; muscle: string; defaultReps?: number; defaultSets?: number; timed?: boolean; side?: boolean }> = {
  squat: { name: "Squat", muscle: "Legs", defaultReps: 12, defaultSets: 3 },
  pushup: { name: "Push-up", muscle: "Chest", defaultReps: 15, defaultSets: 3 },
  deadlift: { name: "Deadlift", muscle: "Back", defaultReps: 8, defaultSets: 4 },
  lunge: { name: "Lunge", muscle: "Legs", defaultReps: 12, defaultSets: 3, side: true },
  plank: { name: "Plank", muscle: "Core", timed: true },
  bicep_curl: { name: "Bicep Curl", muscle: "Arms", defaultReps: 12, defaultSets: 3, side: true },
  shoulder_press: { name: "Shoulder Press", muscle: "Shoulders", defaultReps: 10, defaultSets: 3 },
  lat_pulldown: { name: "Lat Pulldown", muscle: "Back", defaultReps: 10, defaultSets: 3 },
};

export const TIMED_EXERCISES = ["plank"];
export const SIDE_EXERCISES = ["lunge", "bicep_curl"];

export const FORM_FEEDBACK: Record<string, string[]> = {
  squat: [
    "✓ Knees tracking over toes — excellent!",
    "⚠ Keep your chest up, avoid rounding your back",
    "✓ Good depth — hitting parallel",
    "✗ Heels lifting — try wider stance",
  ],
  pushup: [
    "✓ Core engaged, body in straight line",
    "⚠ Elbows flaring too wide — tuck 45°",
    "✓ Full range of motion detected",
  ],
  deadlift: [
    "✓ Bar path close to body — great technique",
    "⚠ Neutral spine — avoid rounding lower back",
    "✓ Hip hinge pattern correct",
  ],
  plank: [
    "✓ Neutral spine — perfect position",
    "⚠ Hips rising — lower them down",
    "✓ Solid hold — breathe steadily",
  ],
  default: [
    "✓ Good form detected",
    "⚠ Maintain controlled movement",
    "✓ Full range of motion",
  ],
};
