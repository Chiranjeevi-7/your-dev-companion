export interface CameraSetup {
  angle: "side" | "front" | "45-degree";
  distance: string;
  height: string;
  tip: string;
}

export const EXERCISES: Record<string, {
  name: string; muscle: string; defaultReps?: number; defaultSets?: number;
  timed?: boolean; side?: boolean; camera: CameraSetup;
}> = {
  squat: {
    name: "Squat", muscle: "Legs", defaultReps: 12, defaultSets: 3,
    camera: { angle: "side", distance: "8–10 ft (2.5–3m)", height: "Waist height (3 ft / 90cm)", tip: "Side view lets the AI track knee-over-toe alignment, hip depth, and back angle. Avoid front view — knees overlap and depth is invisible." },
  },
  pushup: {
    name: "Push-up", muscle: "Chest", defaultReps: 15, defaultSets: 3,
    camera: { angle: "side", distance: "6–8 ft (2–2.5m)", height: "Ground level (place on floor)", tip: "Side profile captures elbow bend, hip sag, and full ROM. Place camera on the floor angled slightly up." },
  },
  deadlift: {
    name: "Deadlift", muscle: "Back", defaultReps: 8, defaultSets: 4,
    camera: { angle: "side", distance: "8–10 ft (2.5–3m)", height: "Waist height (3 ft / 90cm)", tip: "Side view is critical to detect back rounding and hip hinge. The AI needs to see your full spine from head to hips." },
  },
  lunge: {
    name: "Lunge", muscle: "Legs", defaultReps: 12, defaultSets: 3, side: true,
    camera: { angle: "45-degree", distance: "7–9 ft (2–2.7m)", height: "Waist height (3 ft / 90cm)", tip: "A 45° angle captures both front knee tracking and rear leg extension. Fully side-on can lose the back leg." },
  },
  plank: {
    name: "Plank", muscle: "Core", timed: true,
    camera: { angle: "side", distance: "6–8 ft (2–2.5m)", height: "Ground level (place on floor)", tip: "Side view detects hip sag or pike. Place the camera on the floor so the AI can see your full body line." },
  },
  bicep_curl: {
    name: "Bicep Curl", muscle: "Arms", defaultReps: 12, defaultSets: 3, side: true,
    camera: { angle: "front", distance: "5–7 ft (1.5–2m)", height: "Chest height (4 ft / 120cm)", tip: "Front view tracks elbow flare and symmetry between arms. Stand far enough for head-to-waist framing." },
  },
  shoulder_press: {
    name: "Shoulder Press", muscle: "Shoulders", defaultReps: 10, defaultSets: 3,
    camera: { angle: "front", distance: "6–8 ft (2–2.5m)", height: "Chest height (4 ft / 120cm)", tip: "Front view lets the AI check arm symmetry and lockout. Ensure full arms are visible overhead." },
  },
  lat_pulldown: {
    name: "Lat Pulldown", muscle: "Back", defaultReps: 10, defaultSets: 3,
    camera: { angle: "front", distance: "6–8 ft (2–2.5m)", height: "Chest height (4 ft / 120cm)", tip: "Front view captures elbow tuck and bar path. Ensure upper body and arms are fully in frame." },
  },
  shoulder_front_raise: {
    name: "Shoulder Front Raise", muscle: "Shoulders", defaultReps: 12, defaultSets: 3,
    camera: { angle: "side", distance: "6–8 ft (2–2.5m)", height: "Chest height (4 ft / 120cm)", tip: "Side view detects shoulder flexion height and prevents swinging. Raise arms straight forward to shoulder level — no higher." },
  },
  lateral_raise: {
    name: "Shoulder Lateral Raise", muscle: "Shoulders", defaultReps: 12, defaultSets: 3,
    camera: { angle: "front", distance: "6–8 ft (2–2.5m)", height: "Chest height (4 ft / 120cm)", tip: "Front view captures arm symmetry and shoulder abduction. Lift arms out to sides to shoulder height — keep slight elbow bend." },
  },
  double_arm_row: {
    name: "Double Arm Row", muscle: "Back", defaultReps: 10, defaultSets: 3,
    camera: { angle: "side", distance: "7–9 ft (2–2.7m)", height: "Waist height (3 ft / 90cm)", tip: "Side view tracks hip hinge angle and elbow drive. Keep torso roughly 45° forward — pull elbows back past torso." },
  },
  single_arm_row: {
    name: "Single Arm Row", muscle: "Back", defaultReps: 10, defaultSets: 3, side: true,
    camera: { angle: "side", distance: "6–8 ft (2–2.5m)", height: "Waist height (3 ft / 90cm)", tip: "Side view tracks rowing arm path. Brace with opposite hand on bench — pull elbow tight along ribs." },
  },
  hammer_curl: {
    name: "Hammer Curl", muscle: "Arms", defaultReps: 12, defaultSets: 3,
    camera: { angle: "front", distance: "5–7 ft (1.5–2m)", height: "Chest height (4 ft / 120cm)", tip: "Front view tracks neutral grip path and elbow pinning. Palms face inward (thumbs up) throughout the curl." },
  },
  overhead_tricep_extension: {
    name: "Overhead Tricep Extension", muscle: "Arms", defaultReps: 12, defaultSets: 3,
    camera: { angle: "side", distance: "6–8 ft (2–2.5m)", height: "Chest height (4 ft / 120cm)", tip: "Side view detects elbow flare and full extension overhead. Keep upper arms vertical — only forearms move." },
  },
};

export const TIMED_EXERCISES = ["plank"];
export const SIDE_EXERCISES = ["lunge", "bicep_curl", "single_arm_row"];

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
  shoulder_front_raise: [
    "✓ Arms parallel to floor — perfect height",
    "⚠ Raising too high — stop at shoulder level",
    "⚠ Using momentum — slow the tempo",
  ],
  lateral_raise: [
    "✓ Symmetric raise — both arms aligned",
    "⚠ Elbows bending too much — keep slight bend only",
    "⚠ Shrugging shoulders — keep traps relaxed",
  ],
  double_arm_row: [
    "✓ Strong elbow drive — squeezing shoulder blades",
    "⚠ Torso rising — maintain hip hinge",
    "⚠ Rounded back — chest up, neutral spine",
  ],
  single_arm_row: [
    "✓ Elbow tracking tight to ribs — great form",
    "⚠ Twisting torso — keep shoulders square",
    "✓ Full retraction at the top",
  ],
  hammer_curl: [
    "✓ Elbows pinned — pure bicep work",
    "⚠ Swinging the weight — control the eccentric",
    "✓ Full contraction at the top",
  ],
  overhead_tricep_extension: [
    "✓ Upper arms vertical — isolating triceps",
    "⚠ Elbows flaring out — tuck them in",
    "⚠ Lower the weight further behind head",
  ],
  default: [
    "✓ Good form detected",
    "⚠ Maintain controlled movement",
    "✓ Full range of motion",
  ],
};
