interface CooldownPanelProps {
  secondsLeft: number;
  totalSeconds: number;
  nextSetNumber: number;
  totalSets: number;
  onSkip: () => void;
}

export default function CooldownPanel({ secondsLeft, totalSeconds, nextSetNumber, totalSets, onSkip }: CooldownPanelProps) {
  const pct = ((totalSeconds - secondsLeft) / totalSeconds) * 100;
  return (
    <div className="rounded-xl border p-5 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, hsla(217,91%,60%,0.10), hsla(153,100%,50%,0.10))",
        borderColor: "hsla(217,91%,60%,0.30)",
      }}>
      <div className="flex items-center justify-between">
        <h3 className="text-xs uppercase tracking-wider font-semibold text-info">
          🧘 Rest Time
        </h3>
        <span className="text-[10px] font-mono text-muted-foreground">
          Next: Set {nextSetNumber}/{totalSets}
        </span>
      </div>
      <div className="font-display text-7xl leading-none mt-2 text-info tabular-nums">
        {secondsLeft}s
      </div>
      <div className="text-sm text-muted-foreground mt-1">
        Recovering — rep counting paused
      </div>
      <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-info to-primary"
          style={{ width: `${pct}%` }} />
      </div>
      <button
        onClick={onSkip}
        className="mt-3 w-full px-3 py-2 rounded-lg text-sm font-semibold border border-border bg-card hover:bg-muted transition-all">
        ⏭ Skip rest
      </button>
    </div>
  );
}
