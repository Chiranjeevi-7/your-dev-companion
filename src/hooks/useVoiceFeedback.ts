import { useRef, useCallback, useEffect } from "react";
import { MLFormResult, ERROR_LABELS } from "@/lib/mlFormAnalyzer";

const ERROR_MESSAGES: Record<string, string[]> = {
  knee_valgus: ["Watch your knees, keep them over your toes", "Knees are caving in, push them out", "Drive your knees outward"],
  rounded_back: ["Straighten your back, chest up", "Keep your spine neutral", "Don't round your back"],
  hip_sag: ["Lift your hips up, keep them level", "Hips are dropping, tighten your core", "Engage your core, hips up"],
  elbow_flare: ["Tuck your elbows in closer", "Elbows are flaring out", "Keep elbows tight to your body"],
  shallow_rom: ["Go deeper, full range of motion", "A little deeper on that rep", "Try to get more depth"],
  asymmetry: ["Even it out, both sides equal", "One side is doing more work", "Balance your movement"],
  hyperextension: ["Don't lock out your joints", "Ease up at the top, no hyperextension", "Control the lockout"],
};

const POSITIVE_MESSAGES = [
  "Great form, keep it up!",
  "Looking strong!",
  "Perfect technique!",
  "Nice work, stay focused!",
  "That's it, solid form!",
  "You're crushing it!",
];


export function useVoiceFeedback(enabled: boolean, active: boolean) {
  const lastSpoke = useRef(0);
  const lastPositive = useRef(0);
  
  const synthRef = useRef(typeof window !== "undefined" ? window.speechSynthesis : null);

  const speak = useCallback((text: string) => {
    const synth = synthRef.current;
    if (!synth || !enabled || !active) return;
    synth.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 1.05;
    utt.pitch = 1.0;
    utt.volume = 0.85;
    synth.speak(utt);
  }, [enabled, active]);

  const processWrongMovement = useCallback((_detectedMovement: string, _selectedExercise: string) => {
    // No-op: wrong exercise voice warnings removed
  }, []);

  const process = useCallback((mlResult: MLFormResult | null) => {
    if (!mlResult || !enabled || !active) return;
    const now = Date.now();

    if (mlResult.errorClass !== "good_form") {
      if (now - lastSpoke.current < 5000) return;
      const msgs = ERROR_MESSAGES[mlResult.errorClass];
      if (!msgs) return;
      const prefix = mlResult.injuryRisk === "high" ? "Careful! " : "";
      speak(prefix + msgs[Math.floor(Math.random() * msgs.length)]);
      lastSpoke.current = now;
      lastPositive.current = now;
    } else {
      const posInterval = 15000 + Math.random() * 5000;
      if (now - lastPositive.current >= posInterval && now - lastSpoke.current >= 5000) {
        speak(POSITIVE_MESSAGES[Math.floor(Math.random() * POSITIVE_MESSAGES.length)]);
        lastSpoke.current = now;
        lastPositive.current = now;
      }
    }
  }, [enabled, active, speak]);

  useEffect(() => {
    if (!active) synthRef.current?.cancel();
  }, [active]);

  useEffect(() => () => { synthRef.current?.cancel(); }, []);

  return { process, processWrongMovement };
}
