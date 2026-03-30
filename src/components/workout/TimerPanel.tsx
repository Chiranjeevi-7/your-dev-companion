interface TimerPanelProps {
  timerSeconds: number;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  isAutoMode?: boolean;
  isTimed?: boolean;
}

export default function TimerPanel({ timerSeconds, onStart, onPause, onReset, isAutoMode, isTimed }: TimerPanelProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
        Timer <span className="text-info">(Plank)</span>
        {isAutoMode && (
          <span className="ml-2 text-primary animate-pulse">● AUTO</span>
        )}
      </h3>
      <div className="font-mono text-5xl text-info tracking-wider leading-none">
        {String(Math.floor(timerSeconds / 60)).padStart(2, "0")}:{String(timerSeconds % 60).padStart(2, "0")}
      </div>
      {isTimed && (
        <div className="mt-2 text-xs text-muted-foreground">
          {isAutoMode
            ? "⏱ Timer running automatically — hold your plank!"
            : "📷 Get into plank position with camera on to auto-start, or use manual controls below."}
        </div>
      )}
      <div className="flex gap-2 mt-2.5">
        <button onClick={onStart} className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground">▶ Start</button>
        <button onClick={onPause} className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold border border-border">⏸ Pause</button>
        <button onClick={onReset} className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold bg-accent text-accent-foreground">↺ Reset</button>
      </div>
    </div>
  );
}
