import { useState, useRef, useEffect } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useWorkoutLogs } from "@/hooks/useWorkoutLogs";
import ReactMarkdown from "react-markdown";

type Message = { role: "assistant" | "user"; content: string; time: string };

const OLLAMA_BASE = "https://0e3b8c7167324e.lhr.life/v1";
const OLLAMA_MODEL = "phi4-mini";
const OLLAMA_KEY = "ollama";

const SYSTEM_PROMPT = `You are FitCoach Pro — a friendly personal trainer. 
Use the user's Supabase profile and workout logs when available.
Give safe, practical fitness advice. 
Always say "consult a doctor" for injuries or health questions.
Be encouraging.`;

const QUICK_QUESTIONS = [
  "How much protein do I need?",
  "Best exercise for fat loss?",
  "How to improve my squat form?",
  "What should I eat pre-workout?",
  "Create a workout plan for me",
];

function buildContext(profile: any, logs: any[]) {
  let ctx = "";
  if (profile) {
    ctx += `\n\nUser Profile:\n- Name: ${profile.name}\n- Age: ${profile.age ?? "unknown"}\n- Weight: ${profile.weight ?? "unknown"}kg\n- Height: ${profile.height ?? "unknown"}cm\n- Fitness Level: ${profile.fitness_level}\n- Goal: ${profile.goal}\n- Calorie Target: ${profile.calorie_target}\n- Protein Target: ${profile.protein_target}g\n- Injuries: ${profile.injuries || "none"}\n- Streak: ${profile.streak} days`;
  }
  if (logs?.length) {
    const recent = logs.slice(0, 20);
    ctx += `\n\nRecent Workout Logs (last ${recent.length}):\n`;
    recent.forEach(l => {
      ctx += `- ${l.exercise} (${l.muscle}): ${l.reps} reps × ${l.weight}kg, set ${l.set_number} on ${new Date(l.logged_at).toLocaleDateString()}\n`;
    });
  }
  return ctx;
}

export default function ChatPage() {
  const { data: profile } = useProfile();
  const { data: logs } = useWorkoutLogs();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || streaming) return;
    setInput("");

    const userMsg: Message = { role: "user", content: msg, time: new Date().toLocaleTimeString() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setStreaming(true);

    const contextInfo = buildContext(profile, logs || []);
    const apiMessages = [
      { role: "system", content: SYSTEM_PROMPT + contextInfo },
      ...newMessages.map(m => ({ role: m.role, content: m.content })),
    ];

    const botMsg: Message = { role: "assistant", content: "", time: new Date().toLocaleTimeString() };

    try {
      abortRef.current = new AbortController();
      const res = await fetch(`${OLLAMA_BASE}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OLLAMA_KEY}`,
        },
        body: JSON.stringify({ model: OLLAMA_MODEL, messages: apiMessages, stream: true }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter(l => l.startsWith("data: "));

        for (const line of lines) {
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content || "";
            accumulated += delta;
            setMessages([...newMessages, { ...botMsg, content: accumulated }]);
          } catch {}
        }
      }

      if (!accumulated) {
        accumulated = "Sorry, I couldn't generate a response. Please try again.";
      }
      setMessages([...newMessages, { ...botMsg, content: accumulated }]);
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setMessages([...newMessages, { ...botMsg, content: `⚠️ Connection error: ${err.message}. Make sure Ollama is running.` }]);
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
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
          <div className="border-t border-border pt-4">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Model Info</h3>
            <p className="text-xs text-muted-foreground">🧠 phi4-mini via Ollama</p>
            <p className="text-xs text-muted-foreground mt-1">📡 Streaming enabled</p>
          </div>
        </div>

        {/* Chat main */}
        <div className="rounded-2xl border border-border bg-card flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-info flex items-center justify-center text-lg">🤖</div>
            <div>
              <h3 className="text-sm font-medium">FitCoach Pro</h3>
              <div className="text-xs text-primary">● phi4-mini • Streaming</div>
            </div>
          </div>

          <div ref={chatRef} className="flex-1 overflow-y-auto p-5 flex flex-col gap-3.5">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground text-sm py-12">
                <p className="text-3xl mb-3">💪</p>
                <p className="font-medium">Welcome to FitCoach Pro</p>
                <p className="text-xs mt-1">Powered by phi4-mini • Ask me anything about fitness</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`max-w-[78%] px-4 py-3 rounded-xl text-sm leading-relaxed ${
                msg.role === "assistant"
                  ? "bg-secondary rounded-bl-sm self-start"
                  : "bg-gradient-to-br from-primary/15 to-info/15 border border-primary/20 rounded-br-sm self-end"
              }`}>
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:my-1">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : msg.content}
                <div className="text-[10px] text-muted-foreground mt-1">{msg.time}</div>
              </div>
            ))}
            {streaming && messages[messages.length - 1]?.role !== "assistant" && (
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
              placeholder="Ask about workouts, nutrition, form tips..."
              rows={1} className="flex-1 px-3.5 py-2.5 bg-secondary border border-border rounded-lg text-foreground text-sm outline-none resize-none min-h-[40px] max-h-[120px] focus:border-primary transition-colors" />
            <button onClick={() => sendMessage()} disabled={streaming}
              className="w-[42px] h-[42px] rounded-lg bg-primary flex items-center justify-center text-lg hover:opacity-90 transition-all disabled:opacity-50">
              ➤
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
