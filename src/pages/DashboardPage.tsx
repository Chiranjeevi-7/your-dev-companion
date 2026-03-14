import { useProfile } from "@/hooks/useProfile";
import { useWorkoutLogs, useClearWorkoutLogs } from "@/hooks/useWorkoutLogs";
import { toast } from "sonner";

export default function DashboardPage() {
  const { data: profile } = useProfile();
  const { data: logs = [] } = useWorkoutLogs();
  const clearLogs = useClearWorkoutLogs();

  const totalSets = logs.length;
  const totalReps = logs.reduce((sum, e) => {
    const n = parseInt(e.reps);
    return sum + (isNaN(n) ? 0 : n);
  }, 0);
  const totalWorkouts = Math.ceil(totalSets / 3) || 0;

  const muscleGroups: Record<string, number> = {};
  logs.forEach(l => { muscleGroups[l.muscle] = (muscleGroups[l.muscle] || 0) + 1; });

  const recentLogs = logs.slice(0, 10);

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <KpiCard label="Total Workouts" value={String(totalWorkouts)} sub={`↑ ${totalWorkouts} this week`} color="primary" />
        <KpiCard label="Total Sets" value={String(totalSets)} sub="↑ Today's sets" color="info" />
        <KpiCard label="Total Reps" value={String(totalReps)} sub="across all sessions" color="accent" />
        <KpiCard label="Streak" value={`${profile?.streak || 0}d`} sub="Keep it up!" color="warn" />
      </div>

      {/* Muscle Group Distribution */}
      {Object.keys(muscleGroups).length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 mb-5">
          <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-4">Muscle Group Distribution</h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(muscleGroups).map(([muscle, count]) => (
              <div key={muscle} className="px-4 py-2 rounded-lg bg-secondary text-sm">
                <span className="text-foreground font-medium">{muscle}</span>
                <span className="text-muted-foreground ml-2">{count} sets</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Workout Log */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs text-muted-foreground uppercase tracking-wider">Recent Workout Log</h3>
          <button onClick={() => { clearLogs.mutate(); toast.success("Log cleared"); }}
            className="px-3 py-1.5 rounded-lg text-sm border border-border text-foreground hover:bg-secondary transition-all">
            Clear Log
          </button>
        </div>
        {recentLogs.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-5">No workouts logged yet. Start training!</div>
        ) : (
          <div className="space-y-0">
            {recentLogs.map(entry => (
              <div key={entry.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center py-2.5 border-b border-border last:border-0 text-sm">
                <div>
                  <div className="font-semibold text-foreground">{entry.exercise}</div>
                  <div className="text-xs text-muted-foreground">{entry.muscle} · {new Date(entry.logged_at).toLocaleDateString()}</div>
                </div>
                <div className="font-mono text-xs text-muted-foreground">{entry.reps} reps</div>
                <div className="font-mono text-xs text-muted-foreground">{entry.weight ? entry.weight + "kg" : "BW"}</div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/15 text-primary">Done</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  const borderColors: Record<string, string> = {
    primary: "hsl(var(--primary))",
    info: "hsl(var(--info))",
    accent: "hsl(var(--accent))",
    warn: "hsl(var(--warn))",
  };
  return (
    <div className="rounded-xl border border-border bg-card p-5 relative overflow-hidden">
      <div className="absolute bottom-0 left-0 right-0 h-[3px] rounded-b-xl" style={{ background: borderColors[color] }} />
      <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className="font-display text-4xl leading-tight mt-1">{value}</div>
      <div className="text-xs text-primary mt-0.5">{sub}</div>
    </div>
  );
}
