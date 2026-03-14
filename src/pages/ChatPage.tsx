import { useState, useRef, useEffect } from "react";
import { useProfile } from "@/hooks/useProfile";

type Message = { role: "bot" | "user"; text: string; time: string };

const QUICK_QUESTIONS = [
  "How much protein do I need?",
  "Best exercise for fat loss?",
  "How to improve my squat form?",
  "What should I eat pre-workout?",
  "How many rest days do I need?",
];

export default function ChatPage() {
  const { data: profile } = useProfile();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (profile && messages.length === 0) {
      setMessages([{
        role: "bot",
        text: `Hey ${(profile.name || "User").split(" ")[0]}! 💪 I'm your FitAI coach. I know you're ${profile.age || "?"}y/o, ${profile.weight || "?"}kg, goal: <strong>${profile.goal}</strong>. Ready to crush today's session? Ask me anything!`,
        time: new Date().toLocaleTimeString(),
      }]);
    }
  }, [profile]);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput("");

    setMessages(m => [...m, { role: "user", text: msg, time: new Date().toLocaleTimeString() }]);
    setTyping(true);

    await new Promise(r => setTimeout(r, 800 + Math.random() * 600));

    const answer = generateAnswer(msg, profile);
    setTyping(false);
    setMessages(m => [...m, { role: "bot", text: answer, time: new Date().toLocaleTimeString() }]);
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto h-[calc(100vh-108px)]">
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-5 h-full">
        {/* Sidebar */}
        <div className="hidden md:block rounded-2xl border border-border bg-card p-5 overflow-y-auto">
          <div className="mb-6">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Quick Questions</h3>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_QUESTIONS.map(q => (
                <button key={q} onClick={() => sendMessage(q)}
                  className="px-2.5 py-1 bg-secondary border border-border rounded-full text-xs text-muted-foreground hover:border-primary hover:text-primary transition-all">
                  {q.length > 25 ? q.slice(0, 25) + "..." : q}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chat main */}
        <div className="rounded-2xl border border-border bg-card flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-info flex items-center justify-center text-lg">🤖</div>
            <div>
              <h3 className="text-sm font-medium">FitAI Coach</h3>
              <div className="text-xs text-primary">● Online</div>
            </div>
          </div>

          <div ref={chatRef} className="flex-1 overflow-y-auto p-5 flex flex-col gap-3.5">
            {messages.map((msg, i) => (
              <div key={i} className={`max-w-[72%] px-4 py-3 rounded-xl text-sm leading-relaxed animate-msg-in ${
                msg.role === "bot"
                  ? "bg-secondary rounded-bl-sm self-start"
                  : "bg-gradient-to-br from-primary/15 to-info/15 border border-primary/20 rounded-br-sm self-end"
              }`}>
                {msg.role === "bot" ? <span dangerouslySetInnerHTML={{ __html: msg.text }} /> : msg.text}
                <div className="text-[10px] text-muted-foreground mt-1">{msg.time}</div>
              </div>
            ))}
            {typing && (
              <div className="flex gap-1 px-4 py-3 bg-secondary rounded-xl rounded-bl-sm w-fit self-start">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-border flex gap-2.5 items-end">
            <textarea value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Ask me anything about fitness, nutrition, or your progress..."
              rows={1} className="flex-1 px-3.5 py-2.5 bg-secondary border border-border rounded-lg text-foreground text-sm outline-none resize-none min-h-[40px] max-h-[120px] focus:border-primary transition-colors" />
            <button onClick={() => sendMessage()}
              className="w-[42px] h-[42px] rounded-lg bg-primary flex items-center justify-center text-lg hover:opacity-90 transition-all">
              ➤
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function generateAnswer(question: string, profile: any): string {
  const q = question.toLowerCase();
  const weight = profile?.weight || 70;
  const level = profile?.fitness_level || "beginner";

  if (q.includes("protein")) {
    const g = Math.round(weight * (level === "advanced" ? 2.2 : level === "intermediate" ? 2.0 : 1.8));
    return `Based on your profile (${weight}kg, ${level}), you should target <strong>${g}g of protein per day</strong>. Spread it across 4-5 meals. Top sources: chicken breast, eggs, Greek yogurt, whey protein.`;
  }
  if (q.includes("fat loss") || q.includes("lose weight")) {
    return `For fat loss: Create a <strong>300-500 calorie deficit</strong> from your TDEE (~${Math.round(weight * 25)} kcal). Keep protein HIGH — ${Math.round(weight * 2)}g/day. Do <strong>3-4 resistance + 2 cardio</strong> sessions weekly.`;
  }
  if (q.includes("squat")) {
    return `For a stronger squat: 1) Shoulder-width stance, toes ~30° out. 2) Break parallel if mobility allows. 3) "Spread the floor with your feet" to activate glutes. 4) Practice <strong>goblet squats</strong> for motor pattern.`;
  }
  if (q.includes("pre-workout") || q.includes("eat before")) {
    return `<strong>Pre-workout (1-2h before):</strong><br>• 30-50g complex carbs (oats, banana)<br>• 20-30g lean protein<br>• Keep fats low<br>• Hydrate 400-600ml water<br>🍌 30min before: banana + coffee = quick energy!`;
  }
  if (q.includes("rest day")) {
    return `For a ${level}, take <strong>${level === "beginner" ? "2-3" : level === "intermediate" ? "1-2" : "1"} rest days per week</strong>. Active recovery (walking, yoga) beats complete rest. Sleep 7-9 hours for peak recovery.`;
  }
  return `Great question! As your FitAI coach, here's my advice for your ${level} level and ${profile?.goal || "fitness"} goal:<br><br>Focus on progressive overload. At ${weight}kg, prioritize compound movements. Keep protein high (${Math.round(weight * 1.8)}g+/day) and get 7-9 hours sleep. Consistency beats perfection! 💪`;
}
