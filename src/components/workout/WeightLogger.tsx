interface WeightLoggerProps {
  weightUsed: string;
  onWeightChange: (val: string) => void;
  reps: number;
  onSave: () => void;
}

export default function WeightLogger({ weightUsed, onWeightChange, reps, onSave }: WeightLoggerProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Log Weight Used</h3>
      <div className="flex gap-2 items-center">
        <input type="number" value={weightUsed} onChange={e => onWeightChange(e.target.value)}
          placeholder="kg" className="w-20 px-3 py-2 bg-secondary border border-border rounded-lg text-foreground outline-none text-sm" />
        <span className="text-sm text-muted-foreground">kg × {reps} reps</span>
        <button onClick={onSave} className="ml-auto px-3 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground">Save</button>
      </div>
    </div>
  );
}
