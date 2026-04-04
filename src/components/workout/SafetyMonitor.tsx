import { MLFormResult, ERROR_LABELS, InjuryLevel } from "@/lib/mlFormAnalyzer";

interface SafetyMonitorProps {
  fatigue: number;
  fatigueLabel: string;
  fatigueColor: string;
  mlResult?: MLFormResult | null;
}

const injuryColors: Record<InjuryLevel, string> = {
  low: "text-primary",
  medium: "text-warn",
  high: "text-destructive",
};

const injuryBg: Record<InjuryLevel, string> = {
  low: "from-primary/80 to-primary",
  medium: "from-warn/80 to-warn",
  high: "from-destructive/80 to-destructive",
};

export default function SafetyMonitor({ fatigue, fatigueLabel, fatigueColor, mlResult }: SafetyMonitorProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3" style={{ borderColor: "hsla(352, 100%, 56%, 0.3)" }}>
      <h3 className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">⚠️ Safety Monitor</h3>

      {/* Fatigue */}
      <div>
        <div className="flex justify-between text-sm mb-1">
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

      {mlResult && (
        <>
          {/* Form Quality Score */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>ML Form Score</span>
              <span className={mlResult.formScore > 70 ? "text-primary" : mlResult.formScore > 40 ? "text-warn" : "text-destructive"}>
                {mlResult.formScore}%
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-300" style={{
                width: `${mlResult.formScore}%`,
                background: mlResult.formScore > 70
                  ? "hsl(var(--primary))"
                  : mlResult.formScore > 40
                    ? "hsl(var(--warn))"
                    : "hsl(var(--destructive))"
              }} />
            </div>
          </div>

          {/* AI Error Detection */}
          <div className="rounded-lg bg-secondary/50 p-2.5 space-y-1.5">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">AI Detected Error</div>
            <div className="flex items-center justify-between">
              <span className={`text-sm font-bold ${mlResult.errorClass === "good_form" ? "text-primary" : "text-destructive"}`}>
                {mlResult.errorClass === "good_form" ? "✓ " : "⚠ "}
                {ERROR_LABELS[mlResult.errorClass]}
              </span>
              <span className="text-xs font-mono bg-card px-2 py-0.5 rounded-full border border-border">
                {mlResult.errorConfidence}% conf
              </span>
            </div>
            {mlResult.errorClass !== "good_form" && mlResult.corrections.length > 0 && (
              <ul className="text-xs text-muted-foreground space-y-0.5 mt-1">
                {mlResult.corrections.slice(0, 2).map((c, i) => (
                  <li key={i}>→ {c}</li>
                ))}
              </ul>
            )}
          </div>

          {/* Injury Risk Meter */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Injury Risk</span>
              <span className={`font-bold uppercase text-xs ${injuryColors[mlResult.injuryRisk]}`}>
                {mlResult.injuryRisk} ({mlResult.injuryConfidence}%)
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-300 bg-gradient-to-r ${injuryBg[mlResult.injuryRisk]}`}
                style={{
                  width: `${mlResult.injuryRisk === "high" ? 100 : mlResult.injuryRisk === "medium" ? 60 : 25}%`,
                }} />
            </div>
          </div>

          {/* Model Confidence */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border">
            <span>🧠 TF.js Model Confidence</span>
            <span className="font-mono">{mlResult.modelConfidence}%</span>
          </div>
        </>
      )}
    </div>
  );
}
