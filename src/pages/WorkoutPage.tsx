import { useState, useRef, useEffect } from "react";
import { EXERCISES, TIMED_EXERCISES, SIDE_EXERCISES, FORM_FEEDBACK } from "@/lib/exercises";
import { useProfile } from "@/hooks/useProfile";
import { useAddWorkoutLog } from "@/hooks/useWorkoutLogs";
import { toast } from "sonner";

export default function WorkoutPage() {
  const { data: profile } = useProfile();
  const addLog = useAddWorkoutLog();
  const [exercise, setExercise] = useState("squat");
  const [reps, setReps] = useState(0);
  const [completedSets, setCompletedSets] = useState<number[]>([]);
  const [weightUsed, setWeightUsed] = useState("");
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [fatigue, setFatigue] = useState(10);
  const [feedback, setFeedback] = useState("Start a set to receive real-time posture corrections...");
  const [demoRunning, setDemoRunning] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const demoRef = useRef<NodeJS.Timeout | null>(null);
  const animFrame = useRef(0);

  const info = EXERCISES[exercise];
  const isTimed = TIMED_EXERCISES.includes(exercise);
  const targetReps = info?.defaultReps || 12;
  const targetSets = info?.defaultSets || 3;

  // Timer
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => setTimerSeconds(s => s + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerRunning]);

  // Demo mode
  useEffect(() => {
    if (!demoRunning || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    let repCounted = false;
    let fbIdx = 0;
    
    demoRef.current = setInterval(() => {
      animFrame.current++;
      const phase = (Math.sin(animFrame.current * 0.04) + 1) / 2;
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = "rgba(255,255,255,0.03)";
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      drawDemoSkeleton(ctx, phase, exercise, W, H);

      if (phase > 0.95 && !repCounted) {
        repCounted = true;
        if (!isTimed) setReps(r => r + 1);
        const fbs = FORM_FEEDBACK[exercise] || FORM_FEEDBACK.default;
        setFeedback(fbs[fbIdx % fbs.length]);
        fbIdx++;
        setFatigue(f => Math.min(100, f + 3));
      }
      if (phase < 0.1) repCounted = false;
    }, 50);

    return () => { if (demoRef.current) clearInterval(demoRef.current); };
  }, [demoRunning, exercise, isTimed]);

  const changeExercise = (ex: string) => {
    setExercise(ex);
    setReps(0);
    setCompletedSets([]);
    setTimerSeconds(0);
    setTimerRunning(false);
    setFeedback(`Loaded: ${EXERCISES[ex].name} — ${EXERCISES[ex].timed ? "Hold for time" : `${EXERCISES[ex].defaultReps} reps × ${EXERCISES[ex].defaultSets} sets`}. ${EXERCISES[ex].muscle} focused exercise.`);
  };

  const logSet = () => {
    if (!profile) return;
    const weight = parseFloat(weightUsed) || 0;
    addLog.mutate({
      exercise: info.name,
      muscle: info.muscle,
      reps: isTimed ? `${timerSeconds}s hold` : String(reps),
      weight,
      set_number: completedSets.length + 1,
    });
    setCompletedSets([...completedSets, reps]);
    toast.success(`Set ${completedSets.length + 1} logged! ${isTimed ? timerSeconds + "s" : reps + " reps"} ${weight ? "@ " + weight + "kg" : ""}`);
    setReps(0);
    if (isTimed) { setTimerSeconds(0); setTimerRunning(false); }
    if (completedSets.length + 1 >= targetSets) {
      toast.success(`💪 ${info.name} complete! All ${targetSets} sets done!`);
    }
  };

  const levelMultiplier = { beginner: 0.7, intermediate: 1.0, advanced: 1.3 }[profile?.fitness_level || "beginner"] || 0.7;
  const recWeight = Math.round((profile?.weight || 70) * 0.7 * levelMultiplier);

  const fatigueLabel = fatigue < 30 ? "Low" : fatigue < 60 ? "Moderate" : fatigue < 80 ? "High" : "🚨 CRITICAL";
  const fatigueColor = fatigue < 30 ? "text-primary" : fatigue < 60 ? "text-warn" : fatigue < 80 ? "text-accent" : "text-destructive";

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5">
        {/* Left: Pose Detection */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-display text-2xl tracking-wider">Pose Detection</h2>
            <div className="flex gap-2">
              <button onClick={() => setDemoRunning(!demoRunning)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${demoRunning ? "bg-accent text-accent-foreground" : "border border-border text-foreground hover:bg-secondary"}`}>
                {demoRunning ? "⏹ Stop Demo" : "▶ Demo Mode"}
              </button>
            </div>
          </div>

          <div className="flex gap-2.5 items-center p-3.5 border-b border-border bg-secondary flex-wrap">
            <select value={exercise} onChange={e => changeExercise(e.target.value)}
              className="flex-1 min-w-[160px] px-3 py-2 bg-muted border border-border rounded-lg text-foreground text-sm outline-none">
              {Object.entries(EXERCISES).map(([key, ex]) => (
                <option key={key} value={key}>{ex.name}</option>
              ))}
            </select>
            <button onClick={logSet} className="px-3.5 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-all">
              ✓ Log Set
            </button>
          </div>

          <div className="relative bg-[hsl(240,50%,3%)] aspect-[4/3] flex items-center justify-center">
            <canvas ref={canvasRef} width={640} height={480} className="absolute inset-0 w-full h-full" />
            {!demoRunning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground text-sm z-10">
                <span className="text-5xl">🎥</span>
                <span>Click <strong>"Demo Mode"</strong> to simulate pose detection</span>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-border">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">AI Form Feedback</div>
            <div className="bg-secondary rounded-lg p-3 text-sm text-muted-foreground min-h-[60px] leading-relaxed">
              {feedback}
            </div>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex flex-col gap-3.5">
          {/* Rep Counter */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Rep Counter</h3>
            <div className={`font-display text-7xl leading-none ${reps >= targetReps * 1.5 ? "text-destructive" : reps >= targetReps ? "text-warn" : "text-primary"}`}>
              {reps}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              of {targetReps} target reps
              <span className="ml-2 text-primary">Set {completedSets.length + 1}/{targetSets}</span>
            </div>
            <div className="mt-2.5 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-primary to-info transition-all"
                style={{ width: `${Math.min(100, (reps / targetReps) * 100)}%` }} />
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => !isTimed && setReps(r => r + 1)} className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground">+ Rep</button>
              <button onClick={() => setReps(r => Math.max(0, r - 1))} className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold border border-border">- Rep</button>
              <button onClick={() => setReps(0)} className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold bg-accent text-accent-foreground">Reset</button>
            </div>
            <div className="flex gap-2 flex-wrap mt-2.5">
              {Array.from({ length: targetSets }, (_, i) => (
                <div key={i} className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                  i < completedSets.length ? "bg-primary border-primary text-primary-foreground" : "border-border bg-muted"
                }`}>{i < completedSets.length ? "✓" : i + 1}</div>
              ))}
            </div>
          </div>

          {/* Timer */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
              Timer <span className="text-info">(Plank)</span>
            </h3>
            <div className="font-mono text-5xl text-info tracking-wider leading-none">
              {String(Math.floor(timerSeconds / 60)).padStart(2, "0")}:{String(timerSeconds % 60).padStart(2, "0")}
            </div>
            <div className="flex gap-2 mt-2.5">
              <button onClick={() => setTimerRunning(true)} className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground">▶ Start</button>
              <button onClick={() => setTimerRunning(false)} className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold border border-border">⏸ Pause</button>
              <button onClick={() => { setTimerRunning(false); setTimerSeconds(0); }} className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold bg-accent text-accent-foreground">↺ Reset</button>
            </div>
          </div>

          {/* Safety Monitor */}
          <div className="rounded-xl border border-border bg-card p-5" style={{ borderColor: "hsla(352, 100%, 56%, 0.3)" }}>
            <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-2">⚠️ Safety Monitor</h3>
            <div className="flex justify-between text-sm mb-1.5">
              <span>Fatigue Level</span>
              <span className={fatigueColor}>{fatigueLabel}</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{
                width: `${fatigue}%`,
                background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--destructive)))"
              }} />
            </div>
          </div>

          {/* AI Recommendation */}
          <div className="rounded-xl p-3.5 text-sm leading-relaxed border"
            style={{
              background: "linear-gradient(135deg, hsla(153,100%,50%,0.08), hsla(217,91%,60%,0.08))",
              borderColor: "hsla(153,100%,50%,0.2)"
            }}>
            <strong className="text-primary">🤖 AI Recommendation for {info?.name}</strong><br />
            Weight: <strong>{recWeight}kg</strong> for {profile?.fitness_level || "beginner"}<br />
            Reps: <strong>{targetReps}</strong> per set
          </div>

          {/* Weight Logger */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Log Weight Used</h3>
            <div className="flex gap-2 items-center">
              <input type="number" value={weightUsed} onChange={e => setWeightUsed(e.target.value)}
                placeholder="kg" className="w-20 px-3 py-2 bg-secondary border border-border rounded-lg text-foreground outline-none text-sm" />
              <span className="text-sm text-muted-foreground">kg × {reps} reps</span>
              <button onClick={logSet} className="ml-auto px-3 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground">Save</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function drawDemoSkeleton(ctx: CanvasRenderingContext2D, phase: number, exercise: string, W: number, H: number) {
  const cx = W / 2, cy = H / 2;
  let kp: Record<string, [number, number]> = {};

  if (exercise === "squat") {
    const d = phase * 80;
    kp = {
      nose: [cx, cy - 160 + d * 0.3], neck: [cx, cy - 130 + d * 0.3],
      lShoulder: [cx - 40, cy - 110 + d * 0.2], rShoulder: [cx + 40, cy - 110 + d * 0.2],
      lElbow: [cx - 55, cy - 65], rElbow: [cx + 55, cy - 65],
      lWrist: [cx - 50, cy - 25], rWrist: [cx + 50, cy - 25],
      lHip: [cx - 25, cy - 10 + d * 0.5], rHip: [cx + 25, cy - 10 + d * 0.5],
      lKnee: [cx - 35, cy + 70 + d * 0.15], rKnee: [cx + 35, cy + 70 + d * 0.15],
      lAnkle: [cx - 30, cy + 145], rAnkle: [cx + 30, cy + 145],
    };
  } else {
    const bend = phase * 55;
    kp = {
      nose: [cx, cy - 160], neck: [cx, cy - 130],
      lShoulder: [cx - 45, cy - 110], rShoulder: [cx + 45, cy - 110],
      lElbow: [cx - 65 - bend * 0.3, cy - 65 + bend * 0.2], rElbow: [cx + 65 + bend * 0.3, cy - 65 + bend * 0.2],
      lWrist: [cx - 55, cy - 20 - bend * 0.3], rWrist: [cx + 55, cy - 20 - bend * 0.3],
      lHip: [cx - 25, cy - 10], rHip: [cx + 25, cy - 10],
      lKnee: [cx - 30, cy + 75], rKnee: [cx + 30, cy + 75],
      lAnkle: [cx - 28, cy + 148], rAnkle: [cx + 28, cy + 148],
    };
  }

  const bones: [string, string][] = [
    ["neck", "lShoulder"], ["neck", "rShoulder"],
    ["lShoulder", "lElbow"], ["lElbow", "lWrist"],
    ["rShoulder", "rElbow"], ["rElbow", "rWrist"],
    ["lShoulder", "lHip"], ["rShoulder", "rHip"], ["lHip", "rHip"],
    ["lHip", "lKnee"], ["lKnee", "lAnkle"],
    ["rHip", "rKnee"], ["rKnee", "rAnkle"],
  ];

  ctx.lineCap = "round";
  bones.forEach(([a, b]) => {
    if (!kp[a] || !kp[b]) return;
    ctx.beginPath();
    ctx.moveTo(kp[a][0], kp[a][1]);
    ctx.lineTo(kp[b][0], kp[b][1]);
    const isLeg = a.includes("Hip") || a.includes("Knee") || b.includes("Knee") || b.includes("Ankle");
    ctx.strokeStyle = isLeg ? "#3b82f6" : "#00ff88";
    ctx.lineWidth = 4;
    ctx.globalAlpha = 0.9;
    ctx.stroke();
  });

  Object.values(kp).forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.globalAlpha = 1;
    ctx.fill();
    ctx.strokeStyle = "#00ff88";
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  if (kp.nose) {
    ctx.beginPath();
    ctx.arc(kp.nose[0], kp.nose[1], 20, 0, Math.PI * 2);
    ctx.strokeStyle = "#00ff88";
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.8;
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  ctx.font = "bold 12px monospace";
  ctx.fillStyle = "rgba(0,255,136,0.9)";
  ctx.fillText(phase > 0.55 ? "CONCENTRIC ↑" : "ECCENTRIC ↓", 12, 22);
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.font = "11px monospace";
  ctx.fillText(`DEMO MODE  |  CONF: ${Math.round(85 + phase * 12)}%`, 12, H - 12);
}
