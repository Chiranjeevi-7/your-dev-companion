interface SafetyMonitorProps {
  fatigue: number;
  fatigueLabel: string;
  fatigueColor: string;
}

export default function SafetyMonitor({ fatigue, fatigueLabel, fatigueColor }: SafetyMonitorProps) {
  return (
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
  );
}
