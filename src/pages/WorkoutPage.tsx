import { useState, useRef, useEffect, useCallback } from "react";
import { EXERCISES, TIMED_EXERCISES } from "@/lib/exercises";
import { useProfile } from "@/hooks/useProfile";
import { useAddWorkoutLog } from "@/hooks/useWorkoutLogs";
import { usePoseDetection, getJointAngles } from "@/hooks/usePoseDetection";
import { analyzeForm, detectRepPhase, detectPlankHold } from "@/lib/formAnalysis";
import { toast } from "sonner";
import PoseCanvas from "@/components/workout/PoseCanvas";
import RepCounter from "@/components/workout/RepCounter";
import TimerPanel from "@/components/workout/TimerPanel";
import SafetyMonitor from "@/components/workout/SafetyMonitor";
import WeightLogger from "@/components/workout/WeightLogger";

export default function WorkoutPage() {
  const { data: profile } = useProfile();
  const addLog = useAddWorkoutLog();
  const [exercise, setExercise] = useState("squat");
  const [reps, setReps] = useState(0);
  const [completedSets, setCompletedSets] = useState<number[]>([]);
  const [weightUsed, setWeightUsed] = useState("");
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [autoTimerActive, setAutoTimerActive] = useState(false);
  const [fatigue, setFatigue] = useState(10);
  const [feedback, setFeedback] = useState("Start a set to receive real-time posture corrections...");
  const [feedbackType, setFeedbackType] = useState<"good" | "warning" | "error">("good");
  const [lastPhase, setLastPhase] = useState<"up" | "down" | "neutral">("neutral");
  const plankHoldFrames = useRef(0);
  const plankLostFrames = useRef(0);
  const phaseFrameCount = useRef(0);
  const stablePhase = useRef<"up" | "down" | "neutral">("neutral");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const pose = usePoseDetection(canvasRef, videoRef);

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

  // Process landmarks for form analysis & rep counting
  useEffect(() => {
    if (!pose.landmarks) return;
    const angles = getJointAngles(pose.landmarks);
    if (!angles) return;

    // Form feedback
    const check = analyzeForm(exercise, angles);
    setFeedback(check.message);
    setFeedbackType(check.type);

    // Rep counting with stability filter (not for timed exercises)
    if (!isTimed) {
      const phase = detectRepPhase(exercise, angles);
      if (phase !== "neutral") {
        if (phase === stablePhase.current) {
          phaseFrameCount.current++;
        } else {
          stablePhase.current = phase;
          phaseFrameCount.current = 1;
        }
        // Require 3 consecutive frames in same phase to confirm
        if (phaseFrameCount.current >= 3) {
          if (lastPhase === "down" && phase === "up") {
            setReps(r => r + 1);
            setFatigue(f => Math.min(100, f + 3));
          }
          if (phase !== lastPhase) setLastPhase(phase);
        }
      }
    }
  }, [pose.landmarks, exercise, isTimed, lastPhase]);

  const changeExercise = (ex: string) => {
    setExercise(ex);
    setReps(0);
    setCompletedSets([]);
    setTimerSeconds(0);
    setTimerRunning(false);
    setLastPhase("neutral");
    const e = EXERCISES[ex];
    setFeedback(`Loaded: ${e.name} — ${e.timed ? "Hold for time" : `${e.defaultReps} reps × ${e.defaultSets} sets`}. ${e.muscle} focused.`);
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

  const handleToggleCamera = useCallback(async () => {
    if (pose.isWebcamActive) {
      pose.stopWebcam();
    } else {
      if (!pose.isModelLoaded) await pose.loadModel();
      await pose.startWebcam();
    }
  }, [pose]);

  const levelMultiplier = { beginner: 0.7, intermediate: 1.0, advanced: 1.3 }[profile?.fitness_level || "beginner"] || 0.7;
  const recWeight = Math.round((profile?.weight || 70) * 0.7 * levelMultiplier);
  const fatigueLabel = fatigue < 30 ? "Low" : fatigue < 60 ? "Moderate" : fatigue < 80 ? "High" : "🚨 CRITICAL";
  const fatigueColor = fatigue < 30 ? "text-primary" : fatigue < 60 ? "text-warn" : fatigue < 80 ? "text-accent" : "text-destructive";

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5">
        {/* Left: Pose Detection */}
        <PoseCanvas
          canvasRef={canvasRef}
          videoRef={videoRef}
          exercise={exercise}
          onChangeExercise={changeExercise}
          onLogSet={logSet}
          isWebcamActive={pose.isWebcamActive}
          isModelLoaded={pose.isModelLoaded}
          onToggleCamera={handleToggleCamera}
          feedback={feedback}
          feedbackType={feedbackType}
          fps={pose.fps}
          error={pose.error}
        />

        {/* Right: Controls */}
        <div className="flex flex-col gap-3.5">
          <RepCounter
            reps={reps}
            targetReps={targetReps}
            targetSets={targetSets}
            completedSets={completedSets}
            isTimed={isTimed}
            onAddRep={() => !isTimed && setReps(r => r + 1)}
            onSubRep={() => setReps(r => Math.max(0, r - 1))}
            onResetReps={() => setReps(0)}
          />
          <TimerPanel
            timerSeconds={timerSeconds}
            onStart={() => setTimerRunning(true)}
            onPause={() => setTimerRunning(false)}
            onReset={() => { setTimerRunning(false); setTimerSeconds(0); }}
          />
          <SafetyMonitor fatigue={fatigue} fatigueLabel={fatigueLabel} fatigueColor={fatigueColor} />
          
          {/* AI Recommendation */}
          <div className="rounded-xl p-3.5 text-sm leading-relaxed border"
            style={{
              background: "linear-gradient(135deg, hsla(153,100%,50%,0.08), hsla(217,91%,60%,0.08))",
              borderColor: "hsla(153,100%,50%,0.2)"
            }}>
            <strong className="text-primary">🤖 AI Recommendation for {info?.name}</strong><br />
            Weight: <strong>{recWeight}kg</strong> for {profile?.fitness_level || "beginner"}<br />
            Reps: <strong>{targetReps}</strong> per set
            {pose.isWebcamActive && <><br /><span className="text-info">📷 BlazePose active — 33 keypoints tracked</span></>}
          </div>

          <WeightLogger
            weightUsed={weightUsed}
            onWeightChange={setWeightUsed}
            reps={reps}
            onSave={logSet}
          />
        </div>
      </div>
    </div>
  );
}
