import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface WorkoutSetupDialogProps {
  open: boolean;
  onClose: () => void;
  exerciseName: string;
  defaultReps: number;
  defaultSets: number;
  isTimed: boolean;
  onConfirm: (reps: number, sets: number) => void;
}

export default function WorkoutSetupDialog({
  open, onClose, exerciseName, defaultReps, defaultSets, isTimed, onConfirm,
}: WorkoutSetupDialogProps) {
  const [reps, setReps] = useState(defaultReps);
  const [sets, setSets] = useState(defaultSets);

  useEffect(() => {
    setReps(defaultReps);
    setSets(defaultSets);
  }, [defaultReps, defaultSets, open]);

  const handleStart = () => {
    const r = Math.max(1, Math.min(100, Number(reps) || defaultReps));
    const s = Math.max(1, Math.min(20, Number(sets) || defaultSets));
    onConfirm(r, s);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display tracking-wider">
            🏋️ Configure Workout
          </DialogTitle>
          <DialogDescription>
            Set your target for <span className="text-primary font-semibold">{exerciseName}</span>.
            Reps will be auto-counted by the AI camera.
          </DialogDescription>
        </DialogHeader>

        {isTimed ? (
          <div className="rounded-lg bg-secondary p-4 text-sm text-muted-foreground">
            This is a timed exercise (e.g. plank). The timer will auto-start when you hold position.
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="target-reps">Target reps per set</Label>
              <Input
                id="target-reps" type="number" min={1} max={100}
                value={reps}
                onChange={(e) => setReps(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Recommended: {defaultReps} for {exerciseName}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="target-sets">Number of sets</Label>
              <Input
                id="target-sets" type="number" min={1} max={20}
                value={sets}
                onChange={(e) => setSets(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                30-second cooldown between sets
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleStart}>▶ Start Workout</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
