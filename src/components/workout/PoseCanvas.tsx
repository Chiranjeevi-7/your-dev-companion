import { EXERCISES } from "@/lib/exercises";

interface PoseCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  videoRef: React.RefObject<HTMLVideoElement>;
  exercise: string;
  onChangeExercise: (ex: string) => void;
  onLogSet: () => void;
  isWebcamActive: boolean;
  isModelLoaded: boolean;
  onToggleCamera: () => void;
  feedback: string;
  feedbackType: "good" | "warning" | "error";
  fps: number;
  error: string | null;
}

export default function PoseCanvas({
  canvasRef, videoRef, exercise, onChangeExercise, onLogSet,
  isWebcamActive, isModelLoaded, onToggleCamera,
  feedback, feedbackType, fps, error,
}: PoseCanvasProps) {
  const feedbackBg = feedbackType === "good"
    ? "bg-primary/10 border-primary/20"
    : feedbackType === "warning"
      ? "bg-warn/10 border-warn/20"
      : "bg-destructive/10 border-destructive/20";

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="font-display text-2xl tracking-wider">
          Pose Detection
          {isWebcamActive && (
            <span className="ml-3 text-sm font-mono text-primary animate-pulse">● LIVE</span>
          )}
        </h2>
        <div className="flex gap-2">
          <button onClick={onToggleCamera}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              isWebcamActive
                ? "bg-destructive text-destructive-foreground"
                : "bg-primary text-primary-foreground"
            }`}>
            {isWebcamActive ? "⏹ Stop Camera" : isModelLoaded ? "📷 Start Camera" : "📷 Load AI + Camera"}
          </button>
        </div>
      </div>

      <div className="flex gap-2.5 items-center p-3.5 border-b border-border bg-secondary flex-wrap">
        <select value={exercise} onChange={e => onChangeExercise(e.target.value)}
          className="flex-1 min-w-[160px] px-3 py-2 bg-muted border border-border rounded-lg text-foreground text-sm outline-none">
          {Object.entries(EXERCISES).map(([key, ex]) => (
            <option key={key} value={key}>{ex.name}</option>
          ))}
        </select>
        <button onClick={onLogSet} className="px-3.5 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-all">
          ✓ Log Set
        </button>
      </div>

      <div className="relative bg-[hsl(240,50%,3%)] aspect-[4/3] flex items-center justify-center">
        <video ref={videoRef} className="hidden" playsInline muted />
        <canvas ref={canvasRef} width={640} height={480} className="absolute inset-0 w-full h-full" />
        {!isWebcamActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground text-sm z-10">
            <span className="text-5xl">🎥</span>
            <span>Click <strong>"Load AI + Camera"</strong> to start BlazePose detection</span>
            <span className="text-xs text-muted-foreground/60">33 keypoints • Real-time joint angles • Auto rep counting</span>
          </div>
        )}
        {isWebcamActive && (
          <div className="absolute top-3 right-3 bg-card/80 backdrop-blur-sm rounded-lg px-2.5 py-1 text-xs font-mono text-primary z-10">
            {fps} FPS
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 border-t border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">AI Form Feedback</div>
        <div className={`rounded-lg p-3 text-sm min-h-[60px] leading-relaxed border ${feedbackBg}`}>
          {feedback}
        </div>
      </div>
    </div>
  );
}
