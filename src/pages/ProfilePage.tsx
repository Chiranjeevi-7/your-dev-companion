import { useState, useEffect } from "react";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useWorkoutLogs } from "@/hooks/useWorkoutLogs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ProfilePage() {
  const { data: profile } = useProfile();
  const { data: logs = [] } = useWorkoutLogs();
  const updateProfile = useUpdateProfile();

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [level, setLevel] = useState("beginner");
  const [goal, setGoal] = useState("Build Muscle");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [injuries, setInjuries] = useState("");

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setAge(String(profile.age || ""));
      setWeight(String(profile.weight || ""));
      setHeight(String(profile.height || ""));
      setLevel(profile.fitness_level || "beginner");
      setGoal(profile.goal || "Build Muscle");
      setCalories(String(profile.calorie_target || ""));
      setProtein(String(profile.protein_target || ""));
      setInjuries(profile.injuries || "");
    }
  }, [profile]);

  const handleSave = () => {
    updateProfile.mutate({
      name: name || profile?.name || "User",
      age: parseInt(age) || profile?.age || null,
      weight: parseFloat(weight) || profile?.weight || null,
      height: parseFloat(height) || profile?.height || null,
      fitness_level: level,
      goal,
      calorie_target: parseInt(calories) || 2200,
      protein_target: parseInt(protein) || 160,
      injuries,
    });
    toast.success("Profile saved!");
  };

  const initial = (profile?.name || "U").charAt(0).toUpperCase();
  const levelLabel = { beginner: "🟢 Beginner", intermediate: "🟡 Intermediate", advanced: "🔴 Advanced" }[profile?.fitness_level || "beginner"];
  const totalWorkouts = Math.ceil(logs.length / 3) || 0;

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-5">
        {/* Profile Card */}
        <div>
          <div className="rounded-2xl border border-border bg-card p-7 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-info flex items-center justify-center font-display text-4xl text-primary-foreground mx-auto mb-4">
              {initial}
            </div>
            <div className="font-display text-2xl tracking-wider">{profile?.name || "User"}</div>
            <div className="text-primary text-sm mt-1 mb-5">{levelLabel}</div>
            <div className="grid grid-cols-2 gap-2.5">
              <MiniStat label="Workouts" value={String(totalWorkouts)} />
              <MiniStat label="Day Streak" value={String(profile?.streak || 0)} />
              <MiniStat label="Weight (kg)" value={profile?.weight ? `${profile.weight}kg` : "—"} />
              <MiniStat label="Goal" value={(profile?.goal || "—").split(" ")[0]} />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 mt-3.5">
            <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-2">📋 Daily Targets</h3>
            <div className="text-sm text-muted-foreground leading-8">
              🔥 Calories: {profile?.calorie_target || 2200} kcal<br />
              💪 Protein: {profile?.protein_target || 160}g<br />
              🏋️ Workouts: {level === "beginner" ? 3 : level === "intermediate" ? 4 : 5}x/week<br />
              💧 Water: {Math.round((profile?.weight || 70) * 0.035)}L/day
            </div>
          </div>
        </div>

        {/* Edit Profile */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-4">Edit Profile</h3>
          <div className="grid grid-cols-2 gap-3.5">
            <Field label="Name" value={name} onChange={setName} />
            <Field label="Age" value={age} onChange={setAge} type="number" />
            <Field label="Weight (kg)" value={weight} onChange={setWeight} type="number" />
            <Field label="Height (cm)" value={height} onChange={setHeight} type="number" />
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Fitness Level</Label>
              <select value={level} onChange={e => setLevel(e.target.value)}
                className="w-full h-11 px-4 bg-secondary border border-border rounded-[10px] text-foreground text-sm outline-none">
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Goal</Label>
              <select value={goal} onChange={e => setGoal(e.target.value)}
                className="w-full h-11 px-4 bg-secondary border border-border rounded-[10px] text-foreground text-sm outline-none">
                <option>Build Muscle</option>
                <option>Lose Weight</option>
                <option>Improve Strength</option>
                <option>General Fitness</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3.5 mt-3.5">
            <Field label="Calorie Target" value={calories} onChange={setCalories} type="number" placeholder="e.g. 2200" />
            <Field label="Protein Target (g)" value={protein} onChange={setProtein} type="number" placeholder="e.g. 160" />
          </div>
          <div className="mt-3.5">
            <Field label="Injuries / Limitations" value={injuries} onChange={setInjuries} placeholder="e.g. bad knees" />
          </div>
          <button onClick={handleSave} disabled={updateProfile.isPending}
            className="w-full mt-4 py-3 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-all">
            {updateProfile.isPending ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </div>

      {/* Download original HTML */}
      <div className="mt-6 rounded-xl border border-border bg-card p-5">
        <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-3">📥 Download Original App</h3>
        <a href="/fitness-app.html" download="fitness-app.html"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-info text-info-foreground text-sm font-semibold hover:opacity-90 transition-all">
          ⬇ Download fitness-app.html
        </a>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      <Input value={value} onChange={e => onChange(e.target.value)} type={type} placeholder={placeholder}
        className="bg-secondary border-border rounded-[10px] h-11" />
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-secondary rounded-lg p-3 text-center">
      <div className="font-mono text-lg text-primary">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}
