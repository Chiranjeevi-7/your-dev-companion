interface RepCounterProps {
  reps: number;
  targetReps: number;
  targetSets: number;
  completedSets: number[];
  isTimed: boolean;
  onAddRep: () => void;
  onSubRep: () => void;
  onResetReps: () => void;
}

export default function RepCounter({ reps, targetReps, targetSets, completedSets, isTimed, onAddRep, onSubRep, onResetReps }: RepCounterProps) {
  return (
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
        <button onClick={onAddRep} className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground">+ Rep</button>
        <button onClick={onSubRep} className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold border border-border">- Rep</button>
        <button onClick={onResetReps} className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold bg-accent text-accent-foreground">Reset</button>
      </div>
      <div className="flex gap-2 flex-wrap mt-2.5">
        {Array.from({ length: targetSets }, (_, i) => (
          <div key={i} className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
            i < completedSets.length ? "bg-primary border-primary text-primary-foreground" : "border-border bg-muted"
          }`}>{i < completedSets.length ? "✓" : i + 1}</div>
        ))}
      </div>
    </div>
  );
}
