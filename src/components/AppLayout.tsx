import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import WorkoutPage from "@/pages/WorkoutPage";
import ChatPage from "@/pages/ChatPage";
import DashboardPage from "@/pages/DashboardPage";
import ProfilePage from "@/pages/ProfilePage";

type Page = "workout" | "chat" | "dashboard" | "profile";

const NAV_ITEMS: { id: Page; label: string; icon: string }[] = [
  { id: "workout", label: "Workout", icon: "🏋️" },
  { id: "chat", label: "AI Coach", icon: "💬" },
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "profile", label: "Profile", icon: "👤" },
];

export default function AppLayout() {
  const { signOut } = useAuth();
  const { data: profile } = useProfile();
  const [activePage, setActivePage] = useState<Page>("workout");

  const initial = (profile?.name || "U").charAt(0).toUpperCase();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Nav */}
      <nav className="sticky top-0 z-50 h-[60px] flex items-center justify-between px-6 bg-card border-b border-border">
        <div className="font-display text-3xl tracking-[2px] text-primary">FitSense</div>
        <div className="flex gap-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`px-4 py-1.5 rounded-lg text-sm transition-all ${
                activePage === item.id
                  ? "bg-secondary text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-[34px] h-[34px] rounded-full bg-gradient-to-br from-primary to-info flex items-center justify-center font-bold text-sm text-primary-foreground">
            {initial}
          </div>
          <span className="text-sm text-muted-foreground hidden md:inline">{profile?.name || "Loading..."}</span>
          <button onClick={signOut}
            className="px-3 py-1.5 rounded-lg text-sm border border-border text-foreground hover:bg-secondary transition-all">
            Logout
          </button>
        </div>
      </nav>

      {/* Pages */}
      <main className="flex-1">
        {activePage === "workout" && <WorkoutPage />}
        {activePage === "chat" && <ChatPage />}
        {activePage === "dashboard" && <DashboardPage />}
        {activePage === "profile" && <ProfilePage />}
      </main>
    </div>
  );
}
