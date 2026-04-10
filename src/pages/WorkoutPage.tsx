import { useState, useRef, useEffect, useCallback } from "react";
import { EXERCISES, TIMED_EXERCISES } from "@/lib/exercises";
import { useProfile } from "@/hooks/useProfile";
import { useAddWorkoutLog } from "@/hooks/useWorkoutLogs";
import { usePoseDetection, getJointAngles } from "@/hooks/usePoseDetection";
import { analyzeForm, detectRepPhase, detectPlankHold, detectMovementType, isMovementMatchingExercise } from "@/lib/formAnalysis";
import { mlAnalyzer, MLFormResult } from "@/lib/mlFormAnalyzer";
import { useVoiceFeedback } from "@/hooks/useVoiceFeedback";
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
  const [mlResult, setMlResult] = useState<MLFormResult | null>(null);
  const [mlModelReady, setMlModelReady] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const plankHoldFrames = useRef(0);
  const plankLostFrames = useRef(0);
  const phaseFrameCount = useRef(0);
  const stablePhase = useRef<"up" | "down" | "neutral">("neutral");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const pose = usePoseDetection(canvasRef, videoRef);
  const voiceCoach = useVoiceFeedback(voiceEnabled, pose.isWebcamActive);

  const info = EXERCISES[exercise];
  const isTimed = TIMED_EXERCISES.includes(exercise);
  const targetReps = info?.defaultReps || 12;
  const targetSets = info?.defaultSets || 3;

  // Load ML model on mount
  useEffect(() => {
    mlAnalyzer.loadModel().then(() => {
      setMlModelReady(mlAnalyzer.ready);
      if (mlAnalyzer.ready) console.log("[WorkoutPage] TF.js ML model ready");
    });
  }, []);

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
    if (!pose.landmarks) {
      if (isTimed && autoTimerActive) {
        plankLostFrames.current++;
        if (plankLostFrames.current >= 15) {
          setTimerRunning(false);
          setAutoTimerActive(false);
          plankHoldFrames.current = 0;
          plankLostFrames.current = 0;
          setFeedback("⏸ Plank pose lost — timer paused. Get back into position to resume.");
          setFeedbackType("warning");
        }
      }
      return;
    }
    const angles = getJointAngles(pose.landmarks);
    if (!angles) return;

    // Rule-based feedback (for display message)
    const check = analyzeForm(exercise, angles);
    setFeedback(check.message);
    setFeedbackType(check.type);

    // ML inference (runs every frame, TF.js is fast enough)
    const fitnessLevelNum = { beginner: 0, intermediate: 0.5, advanced: 1 }[profile?.fitness_level || "beginner"] ?? 0;
    const result = mlAnalyzer.analyze({
      ...angles,
      fatigue,
      weight: profile?.weight || 70,
      height: profile?.height || 170,
      fitnessLevel: fitnessLevelNum,
      exercise,
    });
    setMlResult(result);
    voiceCoach.process(result);

    // Auto timer for timed exercises (plank)
    if (isTimed) {
      const isHolding = detectPlankHold(angles);
      if (isHolding) {
        plankLostFrames.current = 0;
        plankHoldFrames.current++;
        if (plankHoldFrames.current >= 10 && !autoTimerActive) {
          setTimerRunning(true);
          setAutoTimerActive(true);
          setFeedback("✓ Plank detected — timer started automatically!");
          setFeedbackType("good");
        }
      } else {
        plankHoldFrames.current = 0;
        plankLostFrames.current++;
        if (plankLostFrames.current >= 15 && autoTimerActive) {
          setTimerRunning(false);
          setAutoTimerActive(false);
          setFeedback("⏸ Plank broken — timer paused. Resume your hold to continue.");
          setFeedbackType("warning");
        }
      }
      return;
    }

    // Wrong movement detection
    const detectedMovement = detectMovementType(angles);
    const movementMatches = isMovementMatchingExercise(exercise, detectedMovement);

    if (!movementMatches && detectedMovement) {
      const movementLabels: Record<string, string> = {
        shoulder_press: "Shoulder Press", bicep_curl: "Bicep Curl",
        squat_or_lunge: "Squat/Lunge", pushup: "Push-up", deadlift: "Deadlift",
      };
      setFeedback(`⚠ Wrong movement detected: looks like ${movementLabels[detectedMovement] || detectedMovement}. You selected ${info.name}.`);
      setFeedbackType("error");
      return; // Don't count reps for wrong movement
    }

    // Rep counting with stability filter
    const phase = detectRepPhase(exercise, angles);
    if (phase !== "neutral") {
      if (phase === stablePhase.current) {
        phaseFrameCount.current++;
      } else {
        stablePhase.current = phase;
        phaseFrameCount.current = 1;
      }
      if (phaseFrameCount.current >= 3) {
        if (lastPhase === "down" && phase === "up") {
          setReps(r => r + 1);
          setFatigue(f => Math.min(100, f + 1));
        }
        if (phase !== lastPhase) setLastPhase(phase);
      }
    }
  }, [pose.landmarks, exercise, isTimed, lastPhase, autoTimerActive, fatigue, profile]);

  const changeExercise = (ex: string) => {
    setExercise(ex);
    setReps(0);
    setCompletedSets([]);
    setTimerSeconds(0);
    setTimerRunning(false);
    setAutoTimerActive(false);
    plankHoldFrames.current = 0;
    plankLostFrames.current = 0;
    setLastPhase("neutral");
    setMlResult(null);
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
          mlResult={mlResult}
          mlModelReady={mlModelReady}
          voiceEnabled={voiceEnabled}
          onToggleVoice={() => setVoiceEnabled(v => !v)}
        />

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
            onPause={() => { setTimerRunning(false); setAutoTimerActive(false); }}
            onReset={() => { setTimerRunning(false); setTimerSeconds(0); setAutoTimerActive(false); plankHoldFrames.current = 0; plankLostFrames.current = 0; }}
            isAutoMode={autoTimerActive}
            isTimed={isTimed}
          />
          <SafetyMonitor
            fatigue={fatigue}
            fatigueLabel={fatigueLabel}
            fatigueColor={fatigueColor}
            mlResult={mlResult}
          />
          
          {/* AI Recommendation */}
          <div className="rounded-xl p-3.5 text-sm leading-relaxed border"
            style={{
              background: "linear-gradient(135deg, hsla(153,100%,50%,0.08), hsla(217,91%,60%,0.08))",
              borderColor: "hsla(153,100%,50%,0.2)"
            }}>
            <strong className="text-primary">🤖 AI Recommendation for {info?.name}</strong><br />
            Weight: <strong>{recWeight}kg</strong> for {profile?.fitness_level || "beginner"}<br />
            Reps: <strong>{targetReps}</strong> per set
            {mlModelReady && <><br /><span className="text-info text-xs">🧠 TensorFlow.js neural network active — hybrid ML + biomechanical analysis</span></>}
            {pose.isWebcamActive && <><br /><span className="text-info text-xs">📷 BlazePose active — 33 keypoints tracked</span></>}
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
