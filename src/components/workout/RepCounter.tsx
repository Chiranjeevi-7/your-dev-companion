interface RepCounterProps {
  reps: number;
  targetReps: number;
  targetSets: number;
  completedSets: number[];
  isTimed: boolean;
  isAuto: boolean;
  isActive: boolean;
}

export default function RepCounter({ reps, targetReps, targetSets, completedSets, isTimed, isAuto, isActive }: RepCounterProps) {
  const pct = Math.min(100, (reps / targetReps) * 100);
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs text-muted-foreground uppercase tracking-wider">Rep Counter</h3>
        {isAuto && (
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
            isActive
              ? "text-primary bg-primary/10 border-primary/30 animate-pulse"
              : "text-muted-foreground bg-muted border-border"
          }`}>
            {isActive ? "● AUTO TRACKING" : "○ AUTO PAUSED"}
          </span>
        )}
      </div>
      <div className={`font-display text-7xl leading-none tabular-nums ${
        reps >= targetReps ? "text-primary" : "text-foreground"
      }`}>
        {reps}
        <span className="text-2xl text-muted-foreground"> / {targetReps}</span>
      </div>
      <div className="text-sm text-muted-foreground mt-1">
        {isTimed ? "Hold time mode" : `Target reps`}
        <span className="ml-2 text-primary">Set {Math.min(completedSets.length + 1, targetSets)}/{targetSets}</span>
      </div>
      <div className="mt-2.5 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-primary to-info transition-all"
          style={{ width: `${pct}%` }} />
      </div>
      <div className="flex gap-2 flex-wrap mt-3">
        {Array.from({ length: targetSets }, (_, i) => (
          <div key={i} className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
            i < completedSets.length
              ? "bg-primary border-primary text-primary-foreground"
              : i === completedSets.length && isActive
                ? "border-primary bg-primary/10 text-primary animate-pulse"
                : "border-border bg-muted text-muted-foreground"
          }`}>{i < completedSets.length ? "✓" : i + 1}</div>
        ))}
      </div>
    </div>
  );
}
