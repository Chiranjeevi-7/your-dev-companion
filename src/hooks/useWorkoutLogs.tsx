import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type WorkoutLog = {
  id: string;
  user_id: string;
  exercise: string;
  muscle: string;
  reps: string;
  weight: number;
  set_number: number;
  logged_at: string;
};

export function useWorkoutLogs() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["workout-logs", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("workout_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("logged_at", { ascending: false });
      if (error) throw error;
      return data as WorkoutLog[];
    },
    enabled: !!user,
  });
}

export function useAddWorkoutLog() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (log: { exercise: string; muscle: string; reps: string; weight: number; set_number: number }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("workout_logs")
        .insert({ ...log, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workout-logs"] });
    },
  });
}

export function useClearWorkoutLogs() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("workout_logs")
        .delete()
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workout-logs"] });
    },
  });
}
