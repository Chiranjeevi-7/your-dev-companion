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
  pushup: {
    name: "Push-up", muscle: "Chest", defaultReps: 15, defaultSets: 3, side: true,
    camera: { angle: "side", distance: "6–8 ft (2–2.5m)", height: "Ground level (place on floor)", tip: "Side OR front view both work — AI auto-detects whichever side is more visible. Place camera on the floor angled slightly up." },
  },
  squat: {
    name: "Squat", muscle: "Legs", defaultReps: 12, defaultSets: 3,
    camera: { angle: "side", distance: "8–10 ft (2.5–3m)", height: "Waist height (3 ft / 90cm)", tip: "Side view lets the AI track knee-over-toe alignment, hip depth, and back angle. Avoid front view — knees overlap and depth is invisible." },
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
    camera: { angle: "front", distance: "5–7 ft (1.5–2m)", height: "Chest height (4 ft / 120cm)", tip: "Front OR side view both work. Curl with one OR both arms — AI tracks whichever arm is moving. Keep elbow(s) pinned to your side." },
  },
  shoulder_press: {
    name: "Shoulder Press", muscle: "Shoulders", defaultReps: 10, defaultSets: 3,
    camera: { angle: "front", distance: "6–8 ft (2–2.5m)", height: "Chest height (4 ft / 120cm)", tip: "Front view lets the AI check arm symmetry and lockout. Ensure full arms are visible overhead." },
  },
  shoulder_front_raise: {
    name: "Shoulder Front Raise", muscle: "Shoulders", defaultReps: 12, defaultSets: 3,
    camera: { angle: "side", distance: "6–8 ft (2–2.5m)", height: "Chest height (4 ft / 120cm)", tip: "Side view detects shoulder flexion height and prevents swinging. Raise arms straight forward to shoulder level — no higher." },
  },
  lateral_raise: {
    name: "Shoulder Lateral Raise", muscle: "Shoulders", defaultReps: 12, defaultSets: 3,
    camera: { angle: "front", distance: "6–8 ft (2–2.5m)", height: "Chest height (4 ft / 120cm)", tip: "Front view captures arm symmetry and shoulder abduction. Lift arms out to sides to shoulder height — keep slight elbow bend." },
  },
  hammer_curl: {
    name: "Hammer Curl", muscle: "Arms", defaultReps: 12, defaultSets: 3, side: true,
    camera: { angle: "front", distance: "5–7 ft (1.5–2m)", height: "Chest height (4 ft / 120cm)", tip: "Neutral grip (thumbs up). Works with one OR both arms — AI tracks whichever arm is curling. Keep elbow(s) pinned to your side." },
  },
  overhead_tricep_extension: {
    name: "Overhead Tricep Extension", muscle: "Arms", defaultReps: 12, defaultSets: 3,
    camera: { angle: "side", distance: "6–8 ft (2–2.5m)", height: "Chest height (4 ft / 120cm)", tip: "Side view detects elbow flare and full extension overhead. Keep upper arms vertical — only forearms move." },
  },
};

export const TIMED_EXERCISES = ["plank"];
export const SIDE_EXERCISES = ["lunge", "bicep_curl", "hammer_curl", "pushup"];

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
