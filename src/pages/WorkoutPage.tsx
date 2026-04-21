import { useState, useRef, useEffect, useCallback } from "react";
import { EXERCISES, TIMED_EXERCISES } from "@/lib/exercises";
import { useProfile } from "@/hooks/useProfile";
import { useAddWorkoutLog } from "@/hooks/useWorkoutLogs";
import { usePoseDetection, getJointAngles } from "@/hooks/usePoseDetection";
import { analyzeForm, detectRepPhase, detectPlankHold, detectMovementType, isMovementMatchingExercise } from "@/lib/formAnalysis";
import { mlAnalyzer, MLFormResult } from "@/lib/mlFormAnalyzer";
import { useVoiceFeedback } from "@/hooks/useVoiceFeedback";
import { usePersonLock } from "@/hooks/usePersonLock";
import { toast } from "sonner";
import PoseCanvas from "@/components/workout/PoseCanvas";
import RepCounter from "@/components/workout/RepCounter";
import TimerPanel from "@/components/workout/TimerPanel";
import SafetyMonitor from "@/components/workout/SafetyMonitor";
import WeightLogger from "@/components/workout/WeightLogger";
import WorkoutSetupDialog from "@/components/workout/WorkoutSetupDialog";
import CooldownPanel from "@/components/workout/CooldownPanel";

const COOLDOWN_SECONDS = 30;

export default function WorkoutPage() {
  const { data: profile } = useProfile();
  const addLog = useAddWorkoutLog();

  // Exercise + workout config
  const [exercise, setExercise] = useState("squat");
  const [targetReps, setTargetReps] = useState(12);
  const [targetSets, setTargetSets] = useState(3);
  const [setupOpen, setSetupOpen] = useState(false);
  const [workoutActive, setWorkoutActive] = useState(false);

  // Reps + sets state
  const [reps, setReps] = useState(0);
  const [completedSets, setCompletedSets] = useState<number[]>([]);
  const [weightUsed, setWeightUsed] = useState("");

  // Timer (for plank-style timed exercises)
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [autoTimerActive, setAutoTimerActive] = useState(false);

  // Cooldown
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const inCooldown = cooldownLeft > 0;

  // Fatigue + feedback
  const [fatigue, setFatigue] = useState(10);
  const [feedback, setFeedback] = useState("Click ‘Configure & Start’ to begin an automated workout. Reps will be auto-counted by the camera.");
  const [feedbackType, setFeedbackType] = useState<"good" | "warning" | "error">("good");

  // ML / voice / lock
  const [mlResult, setMlResult] = useState<MLFormResult | null>(null);
  const [mlModelReady, setMlModelReady] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  // Refs
  const lastPhase = useRef<"up" | "down" | "neutral">("neutral");
  const stablePhase = useRef<"up" | "down" | "neutral">("neutral");
  const phaseFrameCount = useRef(0);
  const plankHoldFrames = useRef(0);
  const plankLostFrames = useRef(0);
  const autoLockedRef = useRef(false);
  const lastRepTimeRef = useRef<number>(0);
  const repDurationsRef = useRef<number[]>([]);
  const setStartFatigueRef = useRef(10);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const cooldownRef = useRef<NodeJS.Timeout | null>(null);

  const pose = usePoseDetection(canvasRef, videoRef);
  const voiceCoach = useVoiceFeedback(voiceEnabled, pose.isWebcamActive);
  const personLock = usePersonLock();

  const info = EXERCISES[exercise];
  const isTimed = TIMED_EXERCISES.includes(exercise);

  // Load ML model
  useEffect(() => {
    mlAnalyzer.loadModel().then(() => setMlModelReady(mlAnalyzer.ready));
  }, []);

  // Auto-lock person
  useEffect(() => {
    if (pose.isWebcamActive && pose.landmarks && personLock.lockEnabled && !personLock.isLocked && !autoLockedRef.current) {
      personLock.lockPerson(pose.landmarks);
      autoLockedRef.current = true;
      toast.info("🔒 Person locked — tracking you only");
    }
    if (!pose.isWebcamActive) {
      autoLockedRef.current = false;
      if (personLock.isLocked) personLock.unlock();
    }
  }, [pose.isWebcamActive, pose.landmarks, personLock]);

  // Plank manual timer (for isTimed exercises)
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => setTimerSeconds(s => s + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerRunning]);

  // Auto-log a completed set
  const finishSet = useCallback((finalReps: number, holdSeconds = 0) => {
    if (!profile) return;
    const weight = parseFloat(weightUsed) || 0;
    addLog.mutate({
      exercise: info.name,
      muscle: info.muscle,
      reps: isTimed ? `${holdSeconds}s hold` : String(finalReps),
      weight,
      set_number: completedSets.length + 1,
    });
    const newCompleted = [...completedSets, finalReps];
    setCompletedSets(newCompleted);

    // Voice + toast
    toast.success(`Set ${newCompleted.length} complete — ${isTimed ? holdSeconds + "s" : finalReps + " reps"}`);
    try {
      if (voiceEnabled && "speechSynthesis" in window) {
        const u = new SpeechSynthesisUtterance(`Set ${newCompleted.length} done. Great work — rest now.`);
        u.rate = 1.0; u.pitch = 1.0; u.volume = 0.9;
        window.speechSynthesis.speak(u);
      }
    } catch {}

    // Reset reps + start cooldown OR finish workout
    setReps(0);
    if (isTimed) { setTimerSeconds(0); setTimerRunning(false); setAutoTimerActive(false); }
    lastPhase.current = "neutral";
    stablePhase.current = "neutral";
    phaseFrameCount.current = 0;
    repDurationsRef.current = [];

    // Bump fatigue per set finish (5–15 based on form/speed)
    setFatigue(f => Math.min(100, f + 8));

    if (newCompleted.length >= targetSets) {
      setWorkoutActive(false);
      setFeedback(`🎉 Workout complete! All ${targetSets} sets of ${info.name} done.`);
      setFeedbackType("good");
      toast.success(`💪 ${info.name} complete! ${targetSets}/${targetSets} sets`);
      try {
        if (voiceEnabled && "speechSynthesis" in window) {
          const u = new SpeechSynthesisUtterance("Workout complete. Awesome session!");
          window.speechSynthesis.speak(u);
        }
      } catch {}
    } else {
      // Start cooldown
      setCooldownLeft(COOLDOWN_SECONDS);
      setFeedback(`✓ Set ${newCompleted.length}/${targetSets} done — 30s rest before next set.`);
      setFeedbackType("good");
    }
  }, [profile, weightUsed, addLog, info, isTimed, completedSets, targetSets, voiceEnabled]);

  // Cooldown ticker
  useEffect(() => {
    if (cooldownLeft > 0) {
      cooldownRef.current = setTimeout(() => {
        setCooldownLeft(s => s - 1);
        // Recovery during rest
        setFatigue(f => Math.max(0, f - 0.6));
      }, 1000);
    } else if (cooldownLeft === 0 && cooldownRef.current) {
      // Cooldown just ended
      cooldownRef.current = null;
      if (workoutActive) {
        setFeedback(`▶ Rest over — Set ${completedSets.length + 1}/${targetSets} starting now. Get into position!`);
        setFeedbackType("good");
        try {
          if (voiceEnabled && "speechSynthesis" in window) {
            const u = new SpeechSynthesisUtterance(`Rest over. Set ${completedSets.length + 1}, let's go!`);
            window.speechSynthesis.speak(u);
          }
        } catch {}
        setStartFatigueRef.current = fatigue;
        lastRepTimeRef.current = 0;
      }
    }
    return () => { if (cooldownRef.current) { clearTimeout(cooldownRef.current); cooldownRef.current = null; } };
  }, [cooldownLeft, workoutActive, completedSets.length, targetSets, voiceEnabled, fatigue]);

  // Process landmarks
  useEffect(() => {
    if (!pose.landmarks) {
      if (isTimed && autoTimerActive) {
        plankLostFrames.current++;
        if (plankLostFrames.current >= 15) {
          setTimerRunning(false);
          setAutoTimerActive(false);
          plankHoldFrames.current = 0;
          plankLostFrames.current = 0;
          setFeedback("⏸ Plank pose lost — timer paused. Get back into position.");
          setFeedbackType("warning");
        }
      }
      return;
    }

    if (!personLock.validatePerson(pose.landmarks)) {
      setFeedback("⚠ Different person detected — ignoring. Move back into frame or re-lock.");
      setFeedbackType("warning");
      return;
    }

    const angles = getJointAngles(pose.landmarks);
    if (!angles) return;

    const check = analyzeForm(exercise, angles);
    setFeedback(check.message);
    setFeedbackType(check.type);

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

    // Don't count anything if not in active workout, or in cooldown
    if (!workoutActive || inCooldown) return;

    // Plank/timed exercise auto-handling
    if (isTimed) {
      const isHolding = detectPlankHold(angles);
      if (isHolding) {
        plankLostFrames.current = 0;
        plankHoldFrames.current++;
        if (plankHoldFrames.current >= 10 && !autoTimerActive) {
          setTimerRunning(true);
          setAutoTimerActive(true);
          setFeedback("✓ Plank detected — timer started!");
          setFeedbackType("good");
        }
        // Auto-finish "set" when target hold reached (use targetReps as hold seconds target)
        if (autoTimerActive && timerSeconds >= targetReps) {
          finishSet(0, timerSeconds);
        }
      } else {
        plankHoldFrames.current = 0;
        plankLostFrames.current++;
        if (plankLostFrames.current >= 15 && autoTimerActive) {
          setTimerRunning(false);
          setAutoTimerActive(false);
          setFeedback("⏸ Plank broken — timer paused. Resume to continue.");
          setFeedbackType("warning");
        }
      }
      return;
    }

    // Wrong-movement guard
    const detectedMovement = detectMovementType(angles);
    const movementMatches = isMovementMatchingExercise(exercise, detectedMovement);
    if (!movementMatches && detectedMovement) {
      const movementLabels: Record<string, string> = {
        shoulder_press: "Shoulder Press", bicep_curl: "Bicep Curl",
        squat_or_lunge: "Squat/Lunge", pushup: "Push-up", deadlift: "Deadlift",
      };
      setFeedback(`⚠ Wrong movement detected: looks like ${movementLabels[detectedMovement] || detectedMovement}. You selected ${info.name}.`);
      setFeedbackType("error");
      return;
    }

    // Auto rep counting with stability filter
    const phase = detectRepPhase(exercise, angles);
    if (phase !== "neutral") {
      if (phase === stablePhase.current) {
        phaseFrameCount.current++;
      } else {
        stablePhase.current = phase;
        phaseFrameCount.current = 1;
      }
      if (phaseFrameCount.current >= 3) {
        if (lastPhase.current === "down" && phase === "up") {
          // Completed one rep
          const now = performance.now();
          let speedFatigue = 0;
          if (lastRepTimeRef.current > 0) {
            const dt = (now - lastRepTimeRef.current) / 1000; // sec
            repDurationsRef.current.push(dt);
            // Slow rep (>5s) → extra fatigue
            if (dt > 5) speedFatigue = 1.5;
            else if (dt > 3.5) speedFatigue = 0.8;
          }
          lastRepTimeRef.current = now;

          // Form-based fatigue bump
          const formPenalty = result.errorClass !== "good_form"
            ? (result.injuryRisk === "high" ? 2.5 : result.injuryRisk === "medium" ? 1.5 : 1.0)
            : 0.4;

          setFatigue(f => Math.min(100, f + formPenalty + speedFatigue));

          setReps(prev => {
            const next = prev + 1;
            // Auto-complete set when target reached
            if (next >= targetReps) {
              // Defer to avoid setState-in-setState weirdness
              setTimeout(() => finishSet(next), 0);
            }
            return next;
          });
        }
        if (phase !== lastPhase.current) lastPhase.current = phase;
      }
    }
  }, [pose.landmarks, exercise, isTimed, autoTimerActive, fatigue, profile, personLock, workoutActive, inCooldown, voiceCoach, targetReps, timerSeconds, finishSet, info.name]);

  const changeExercise = (ex: string) => {
    if (workoutActive) return;
    setExercise(ex);
    setReps(0);
    setCompletedSets([]);
    setTimerSeconds(0);
    setTimerRunning(false);
    setAutoTimerActive(false);
    plankHoldFrames.current = 0;
    plankLostFrames.current = 0;
    lastPhase.current = "neutral";
    stablePhase.current = "neutral";
    phaseFrameCount.current = 0;
    setMlResult(null);
    const e = EXERCISES[ex];
    setTargetReps(e.defaultReps || 12);
    setTargetSets(e.defaultSets || 3);
    setFeedback(`Loaded: ${e.name} — ${e.timed ? "Hold for time" : `${e.defaultReps} reps × ${e.defaultSets} sets`}.`);
  };

  const handleConfigureClick = () => {
    if (workoutActive) {
      // Allow user to abort workout
      if (confirm("End current workout?")) {
        setWorkoutActive(false);
        setCooldownLeft(0);
        setReps(0);
        setCompletedSets([]);
        setFatigue(10);
        setFeedback("Workout ended. Click ‘Configure & Start’ to begin again.");
      }
      return;
    }
    setSetupOpen(true);
  };

  const handleStartWorkout = async (r: number, s: number) => {
    setTargetReps(r);
    setTargetSets(s);
    setSetupOpen(false);
    setReps(0);
    setCompletedSets([]);
    setCooldownLeft(0);
    setFatigue(10);
    lastPhase.current = "neutral";
    stablePhase.current = "neutral";
    phaseFrameCount.current = 0;
    repDurationsRef.current = [];
    lastRepTimeRef.current = 0;

    // Auto-start camera if not running
    if (!pose.isWebcamActive) {
      if (!pose.isModelLoaded) await pose.loadModel();
      await pose.startWebcam();
    }
    setWorkoutActive(true);
    setFeedback(`▶ Workout started! ${isTimed ? `Hold for ${r}s × ${s} sets` : `${r} reps × ${s} sets`}. Get into position!`);
    setFeedbackType("good");
    try {
      if (voiceEnabled && "speechSynthesis" in window) {
        const u = new SpeechSynthesisUtterance(`Workout started. ${isTimed ? `Hold for ${r} seconds.` : `${r} reps per set.`} Let's go!`);
        window.speechSynthesis.speak(u);
      }
    } catch {}
  };

  const handleToggleCamera = useCallback(async () => {
    if (pose.isWebcamActive) {
      pose.stopWebcam();
      // Stopping camera mid-workout pauses it
      if (workoutActive) {
        setWorkoutActive(false);
        setCooldownLeft(0);
        setFeedback("⏹ Camera stopped — workout paused. Click ‘Configure & Start’ to resume.");
      }
    } else {
      if (!pose.isModelLoaded) await pose.loadModel();
      await pose.startWebcam();
    }
  }, [pose, workoutActive]);

  const handleLockPerson = useCallback(() => {
    if (personLock.isLocked) personLock.unlock();
    else if (pose.landmarks) {
      personLock.lockPerson(pose.landmarks);
      toast.info("🔒 Person locked");
    }
  }, [personLock, pose.landmarks]);

  const skipCooldown = () => {
    setCooldownLeft(0);
  };

  const levelMultiplier = { beginner: 0.7, intermediate: 1.0, advanced: 1.3 }[profile?.fitness_level || "beginner"] || 0.7;
  const recWeight = Math.round((profile?.weight || 70) * 0.7 * levelMultiplier);
  const fatigueLabel = fatigue < 30 ? "Low" : fatigue < 60 ? "Medium" : fatigue < 80 ? "High" : "🚨 CRITICAL";
  const fatigueColor = fatigue < 30 ? "text-primary" : fatigue < 60 ? "text-warn" : fatigue < 80 ? "text-accent" : "text-destructive";

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <WorkoutSetupDialog
        open={setupOpen}
        onClose={() => setSetupOpen(false)}
        exerciseName={info.name}
        defaultReps={info.defaultReps || 12}
        defaultSets={info.defaultSets || 3}
        isTimed={isTimed}
        onConfirm={handleStartWorkout}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5">
        <PoseCanvas
          canvasRef={canvasRef}
          videoRef={videoRef}
          exercise={exercise}
          onChangeExercise={changeExercise}
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
          personLocked={personLock.isLocked}
          lockEnabled={personLock.lockEnabled}
          personLost={personLock.personLost}
          onToggleLock={handleLockPerson}
          onToggleLockMode={personLock.toggleLockEnabled}
          workoutActive={workoutActive}
          inCooldown={inCooldown}
          onConfigure={handleConfigureClick}
        />

        <div className="flex flex-col gap-3.5">
          {inCooldown ? (
            <CooldownPanel
              secondsLeft={cooldownLeft}
              totalSeconds={COOLDOWN_SECONDS}
              nextSetNumber={completedSets.length + 1}
              totalSets={targetSets}
              onSkip={skipCooldown}
            />
          ) : (
            <RepCounter
              reps={reps}
              targetReps={targetReps}
              targetSets={targetSets}
              completedSets={completedSets}
              isTimed={isTimed}
              isAuto
              isActive={workoutActive && !inCooldown}
            />
          )}
          {isTimed && (
            <TimerPanel
              timerSeconds={timerSeconds}
              onStart={() => setTimerRunning(true)}
              onPause={() => { setTimerRunning(false); setAutoTimerActive(false); }}
              onReset={() => { setTimerRunning(false); setTimerSeconds(0); setAutoTimerActive(false); plankHoldFrames.current = 0; plankLostFrames.current = 0; }}
              isAutoMode={autoTimerActive}
              isTimed={isTimed}
            />
          )}
          <SafetyMonitor
            fatigue={fatigue}
            fatigueLabel={fatigueLabel}
            fatigueColor={fatigueColor}
            mlResult={mlResult}
          />

          <div className="rounded-xl p-3.5 text-sm leading-relaxed border"
            style={{
              background: "linear-gradient(135deg, hsla(153,100%,50%,0.08), hsla(217,91%,60%,0.08))",
              borderColor: "hsla(153,100%,50%,0.2)"
            }}>
            <strong className="text-primary">🤖 AI Recommendation for {info?.name}</strong><br />
            Weight: <strong>{recWeight}kg</strong> for {profile?.fitness_level || "beginner"}<br />
            Reps: <strong>{targetReps}</strong> per set × <strong>{targetSets}</strong> sets
            {workoutActive && <><br /><span className="text-info text-xs">⚙ Auto-mode: reps & sets tracked by camera</span></>}
            {mlModelReady && <><br /><span className="text-info text-xs">🧠 TensorFlow.js neural network active</span></>}
          </div>

          <WeightLogger
            weightUsed={weightUsed}
            onWeightChange={setWeightUsed}
            reps={reps}
            onSave={() => toast.info("Weight saved — will apply to next logged set")}
          />
        </div>
      </div>
    </div>
  );
}
