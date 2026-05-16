import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";

export default function Auth() {
  const { user, signUp, signIn, signInWithGoogle } = useAuth();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");

  // Register form
  const [regName, setRegName] = useState("");
  const [regAge, setRegAge] = useState("");
  const [regWeight, setRegWeight] = useState("");
  const [regHeight, setRegHeight] = useState("");
  const [regLevel, setRegLevel] = useState("beginner");
  const [regGoal, setRegGoal] = useState("Build Muscle");
  const [regEmail, setRegEmail] = useState("");
  const [regPass, setRegPass] = useState("");

  if (user) return <Navigate to="/" replace />;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(loginEmail, loginPass);
    if (error) toast.error(error.message);
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail || !regPass) {
      toast.error("Please fill in email and password");
      return;
    }
    setLoading(true);
    const { error } = await signUp(regEmail, regPass, {
      name: regName || "User",
      age: parseInt(regAge) || 25,
      weight: parseFloat(regWeight) || 70,
      height: parseFloat(regHeight) || 170,
      fitness_level: regLevel,
      goal: regGoal,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Account created! Check your email to confirm.");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background"
      style={{
        backgroundImage: "radial-gradient(ellipse at 20% 50%, hsla(153, 100%, 50%, 0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, hsla(217, 91%, 60%, 0.06) 0%, transparent 50%)"
      }}>
      <div className="w-[420px] max-w-[95vw] rounded-[20px] border border-border bg-card p-10 relative overflow-hidden">
        {/* Top gradient line */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary via-info to-accent" />

        <h1 className="font-display text-[2.8rem] leading-none tracking-[3px] bg-gradient-to-br from-primary to-info bg-clip-text text-transparent mb-1">
          FitSense
        </h1>
        <p className="text-muted-foreground text-sm mb-9">
          Your intelligent fitness companion powered by AI
        </p>

        {/* Tabs */}
        <div className="flex gap-1 bg-secondary rounded-[10px] p-1 mb-7">
          <button
            onClick={() => setTab("login")}
            className={`flex-1 py-2 rounded-[7px] text-sm transition-all ${tab === "login" ? "bg-muted text-foreground" : "text-muted-foreground"}`}
          >
            Login
          </button>
          <button
            onClick={() => setTab("register")}
            className={`flex-1 py-2 rounded-[7px] text-sm transition-all ${tab === "register" ? "bg-muted text-foreground" : "text-muted-foreground"}`}
          >
            Sign Up
          </button>
        </div>

        {tab === "login" ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Email</Label>
              <Input value={loginEmail} onChange={e => setLoginEmail(e.target.value)} type="email" placeholder="you@example.com"
                className="bg-secondary border-border rounded-[10px] h-11" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Password</Label>
              <Input value={loginPass} onChange={e => setLoginPass(e.target.value)} type="password" placeholder="••••••••"
                className="bg-secondary border-border rounded-[10px] h-11" />
            </div>
            <Button type="submit" disabled={loading}
              className="w-full h-12 rounded-[10px] bg-gradient-to-br from-primary to-[hsl(153,100%,40%)] text-primary-foreground font-bold text-sm tracking-wide hover:shadow-[0_8px_24px_hsla(153,100%,50%,0.3)] hover:-translate-y-0.5 transition-all">
              {loading ? "Signing in..." : "LOGIN →"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">First Name</Label>
                <Input value={regName} onChange={e => setRegName(e.target.value)} placeholder="Alex"
                  className="bg-secondary border-border rounded-[10px] h-11" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Age</Label>
                <Input value={regAge} onChange={e => setRegAge(e.target.value)} type="number" placeholder="25"
                  className="bg-secondary border-border rounded-[10px] h-11" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Weight (kg)</Label>
                <Input value={regWeight} onChange={e => setRegWeight(e.target.value)} type="number" placeholder="70"
                  className="bg-secondary border-border rounded-[10px] h-11" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Height (cm)</Label>
                <Input value={regHeight} onChange={e => setRegHeight(e.target.value)} type="number" placeholder="175"
                  className="bg-secondary border-border rounded-[10px] h-11" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Fitness Level</Label>
              <select value={regLevel} onChange={e => setRegLevel(e.target.value)}
                className="w-full h-11 px-4 bg-secondary border border-border rounded-[10px] text-foreground text-sm outline-none">
                <option value="beginner">Beginner (0-6 months)</option>
                <option value="intermediate">Intermediate (6-24 months)</option>
                <option value="advanced">Advanced (2+ years)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Goal</Label>
              <select value={regGoal} onChange={e => setRegGoal(e.target.value)}
                className="w-full h-11 px-4 bg-secondary border border-border rounded-[10px] text-foreground text-sm outline-none">
                <option>Build Muscle</option>
                <option>Lose Weight</option>
                <option>Improve Strength</option>
                <option>General Fitness</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Email</Label>
              <Input value={regEmail} onChange={e => setRegEmail(e.target.value)} type="email" placeholder="you@example.com"
                className="bg-secondary border-border rounded-[10px] h-11" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Password</Label>
              <Input value={regPass} onChange={e => setRegPass(e.target.value)} type="password" placeholder="••••••••"
                className="bg-secondary border-border rounded-[10px] h-11" />
            </div>
            <Button type="submit" disabled={loading}
              className="w-full h-12 rounded-[10px] bg-gradient-to-br from-primary to-[hsl(153,100%,40%)] text-primary-foreground font-bold text-sm tracking-wide hover:shadow-[0_8px_24px_hsla(153,100%,50%,0.3)] hover:-translate-y-0.5 transition-all">
              {loading ? "Creating account..." : "CREATE ACCOUNT →"}
            </Button>
          </form>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Google sign-in */}
        <Button variant="outline" onClick={signInWithGoogle}
          className="w-full h-12 rounded-[10px] border-border bg-secondary hover:bg-muted gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Sign in with Google
        </Button>
      </div>
    </div>
  );
}
