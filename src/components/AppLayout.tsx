import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dumbbell, MessageSquare, LayoutDashboard, User, LogOut, Zap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import WorkoutPage from "@/pages/WorkoutPage";
import ChatPage from "@/pages/ChatPage";
import DashboardPage from "@/pages/DashboardPage";
import ProfilePage from "@/pages/ProfilePage";

type Page = "workout" | "chat" | "dashboard" | "profile";

const NAV_ITEMS: { id: Page; label: string; Icon: typeof Dumbbell }[] = [
  { id: "workout", label: "Workout", Icon: Dumbbell },
  { id: "chat", label: "AI Coach", Icon: MessageSquare },
  { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { id: "profile", label: "Profile", Icon: User },
];

export default function AppLayout() {
  const { signOut } = useAuth();
  const { data: profile } = useProfile();
  const [activePage, setActivePage] = useState<Page>("workout");

  const initial = (profile?.name || "U").charAt(0).toUpperCase();

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Ambient background orbs */}
      <div className="ambient-orb w-[520px] h-[520px] -top-40 -left-40 bg-primary/25" />
      <div className="ambient-orb w-[620px] h-[620px] -top-32 right-[-180px] bg-accent/25" />
      <div className="ambient-orb w-[480px] h-[480px] bottom-[-200px] left-1/3 bg-primary/15" />
      <div className="absolute inset-0 bg-grid opacity-[0.25] pointer-events-none" />

      <div className="relative flex min-h-screen">
        {/* ===== Floating Glass Sidebar ===== */}
        <aside className="hidden md:flex sticky top-0 h-screen w-[92px] flex-col items-center py-5 z-40">
          <div className="glass-strong flex flex-col items-center justify-between py-5 px-2 h-full w-[72px] rounded-3xl">
            {/* Logo */}
            <div className="flex flex-col items-center gap-1">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-neon-green animate-glow-pulse">
                <Zap className="w-5 h-5 text-black" strokeWidth={2.5} />
              </div>
              <span className="font-display text-[11px] tracking-[2px] text-gradient-neon">FIT</span>
            </div>

            {/* Nav */}
            <nav className="flex flex-col gap-3">
              {NAV_ITEMS.map(({ id, label, Icon }) => {
                const active = activePage === id;
                return (
                  <button
                    key={id}
                    onClick={() => setActivePage(id)}
                    title={label}
                    className={`relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300
                      ${active
                        ? "bg-primary/15 neon-border text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent"}`}
                  >
                    <Icon className="w-5 h-5" strokeWidth={active ? 2.4 : 1.8} />
                    {active && (
                      <motion.span
                        layoutId="sidebar-active-dot"
                        className="absolute -right-[14px] w-1.5 h-6 rounded-full bg-primary shadow-neon-green"
                      />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Level badge */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/30 to-primary/20 border border-white/10 flex items-center justify-center">
                <span className="font-display text-sm text-primary">L3</span>
              </div>
              <span className="text-[9px] uppercase tracking-widest text-muted-foreground">Advanced</span>
            </div>
          </div>
        </aside>

        {/* ===== Main column ===== */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top floating pill nav */}
          <header className="sticky top-0 z-30 px-4 md:px-6 pt-4 pb-3">
            <div className="glass flex items-center justify-between gap-4 px-4 py-2.5 rounded-2xl">
              {/* Brand (mobile) */}
              <div className="flex items-center gap-2 md:hidden">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Zap className="w-4 h-4 text-black" strokeWidth={2.5} />
                </div>
                <span className="font-display text-xl tracking-[2px] text-gradient-neon">FITSENSE</span>
              </div>
              <div className="hidden md:flex items-center gap-2">
                <span className="font-display text-2xl tracking-[3px] text-gradient-neon">FITSENSE</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-widest bg-primary/10 text-primary border border-primary/30">AI</span>
              </div>

              {/* Pill tabs */}
              <nav className="hidden sm:flex items-center gap-1 p-1 rounded-full bg-white/[0.03] border border-white/[0.06]">
                {NAV_ITEMS.map(({ id, label, Icon }) => {
                  const active = activePage === id;
                  return (
                    <button
                      key={id}
                      onClick={() => setActivePage(id)}
                      className={`relative px-4 py-1.5 rounded-full text-xs md:text-sm font-medium flex items-center gap-2 transition-colors
                        ${active ? "text-black" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      {active && (
                        <motion.span
                          layoutId="top-pill-active"
                          className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-primary/80 shadow-neon-green"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                      <Icon className="w-4 h-4 relative z-10" />
                      <span className="relative z-10">{label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* User */}
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center font-bold text-sm text-black border border-white/20 shadow-neon-purple">
                  {initial}
                </div>
                <span className="text-sm text-foreground/90 hidden lg:inline truncate max-w-[140px]">
                  {profile?.name || "Athlete"}
                </span>
                <button
                  onClick={signOut}
                  title="Logout"
                  className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-white/[0.08] transition-all"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mobile tab strip */}
            <div className="sm:hidden mt-2 glass flex items-center gap-1 p-1 rounded-full overflow-x-auto">
              {NAV_ITEMS.map(({ id, label, Icon }) => {
                const active = activePage === id;
                return (
                  <button
                    key={id}
                    onClick={() => setActivePage(id)}
                    className={`flex-1 px-3 py-1.5 rounded-full text-xs flex items-center justify-center gap-1.5
                      ${active ? "bg-primary text-black shadow-neon-green" : "text-muted-foreground"}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                );
              })}
            </div>
          </header>

          {/* Page area */}
          <main className="flex-1 px-4 md:px-6 pb-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activePage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
              >
                {activePage === "workout" && <WorkoutPage />}
                {activePage === "chat" && <ChatPage />}
                {activePage === "dashboard" && <DashboardPage />}
                {activePage === "profile" && <ProfilePage />}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}
