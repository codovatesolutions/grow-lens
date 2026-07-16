"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import Shell from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Plus, Globe, Sparkles, ArrowUpRight, ArrowUp, ArrowDown, MessageSquare,
  ListChecks, Activity, AlertTriangle, TrendingUp, History, Lightbulb,
  DollarSign, Send, CheckCircle2, Circle, User,
} from "lucide-react";
import {
  LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
} from "recharts";

// ---------- Reusable widget shell ----------
interface WidgetProps {
  title: string;
  icon?: any;
  action?: React.ReactNode;
  className?: string;
  tid?: string;
  children: React.ReactNode;
}

const Widget = ({ title, icon: Icon, action, className = "", tid, children }: WidgetProps) => (
  <div className={`bg-card border border-border rounded-xl p-5 flex flex-col ${className}`} data-testid={tid}>
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-primary" />}
        <h3 className="font-display text-sm font-semibold tracking-tight uppercase">{title}</h3>
      </div>
      {action}
    </div>
    <div className="flex-1 min-h-0">{children}</div>
  </div>
);

// ---------- Score gauge (0-100) ----------
interface ScoreGaugeProps {
  value?: number;
  label?: string;
  color?: string;
}

const ScoreGauge = ({ value = 0, label, color = "primary" }: ScoreGaugeProps) => {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  const stroke = color === "primary" ? "hsl(var(--primary))" : "hsl(var(--foreground))";
  const bgStroke = "hsl(var(--muted))";
  const r = 42;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="flex flex-col items-center justify-center gap-1">
      <div className="relative w-24 h-24">
        <svg viewBox="0 0 100 100" className="w-24 h-24 -rotate-90">
          <circle cx="50" cy="50" r={r} stroke={bgStroke} strokeWidth="8" fill="none" />
          <circle
            cx="50" cy="50" r={r} stroke={stroke} strokeWidth="8" fill="none"
            strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.8s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl font-black">{pct.toFixed(0)}</span>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">/100</span>
        </div>
      </div>
      {label && <div className="text-xs text-muted-foreground">{label}</div>}
    </div>
  );
};

const Delta = ({ value }: { value?: number }) => {
  const v = Number(value) || 0;
  if (v === 0) return <span className="text-xs text-muted-foreground">&ndash;</span>;
  const up = v > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-mono font-semibold ${up ? "text-emerald-600" : "text-red-600"}`}>
      {up ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
      {up ? "+" : ""}{v.toFixed(1)}
    </span>
  );
};

// ---------- AI Assistant Widget ----------
function AIAssistantWidget() {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi! I'm your GrowthLens AI Assistant. Ask me anything about your scans, growth strategy, or what to fix first." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, busy]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    const next = [...messages, { role: "user", text }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const { data } = await api.post("/assistant/chat", { message: text, history: next.slice(-6) });
      setMessages([...next, { role: "assistant", text: data.reply || "(no reply)" }]);
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Assistant unavailable");
      setMessages([...next, { role: "assistant", text: "Sorry, I hit an error. Try again in a moment." }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Widget title="AI Assistant" icon={MessageSquare} tid="widget-ai-assistant" className="col-span-12 lg:col-span-4 lg:row-span-2 min-h-[420px]">
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto pr-1 mb-3 max-h-[280px]">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`w-7 h-7 rounded-full grid place-items-center shrink-0 ${m.role === "user" ? "bg-foreground text-background" : "bg-primary/20 text-primary"}`}>
              {m.role === "user" ? <User className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
            </div>
            <div className={`text-sm leading-relaxed rounded-lg px-3 py-2 max-w-[85%] ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
              {m.text}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/20 grid place-items-center"><Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" /></div>
            <div className="text-sm rounded-lg px-3 py-2 bg-muted animate-pulse">Thinking...</div>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 h-10 px-3 rounded-md bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          placeholder="Ask about your scans, fixes, growth..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          disabled={busy}
          data-testid="assistant-input"
        />
        <Button size="icon" onClick={send} disabled={busy || !input.trim()} data-testid="assistant-send">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </Widget>
  );
}

// ---------- Growth Trend Widget ----------
function GrowthTrendWidget({ trend }: { trend?: any[] }) {
  const data = (trend || []).map((t, i) => ({ i: i + 1, score: t.score, date: t.date }));
  return (
    <Widget title="Growth Trend" icon={TrendingUp} tid="widget-growth-trend" className="col-span-12 lg:col-span-8 min-h-[220px]">
      {data.length === 0 ? (
        <div className="h-full min-h-[160px] grid place-items-center text-sm text-muted-foreground">
          Run a few scans to see your growth trend.
        </div>
      ) : (
        <div className="h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="100%" stopColor="#FCDA60" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Line type="monotone" dataKey="score" stroke="url(#lineGrad)" strokeWidth={3} dot={{ r: 3, fill: "hsl(var(--primary))" }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Widget>
  );
}

// ---------- Main dashboard page ----------
export default function Dashboard() {
  const [d, setD] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const load = async () => {
    try {
      const { data } = await api.get("/dashboard");
      setD(data);
    } catch (e) {
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleTask = async (t: any) => {
    try {
      await api.patch(`/tasks/${t.id}`, { done: !t.done });
      load();
    } catch {
      toast.error("Couldn't update task");
    }
  };

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  if (loading) {
    return (
      <Shell>
        <div className="space-y-6 max-w-7xl mx-auto">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-12 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={`col-span-12 md:col-span-6 lg:col-span-${i === 0 ? 4 : i < 3 ? 4 : 3}`}>
                <Skeleton className="h-40 w-full" />
              </div>
            ))}
          </div>
        </div>
      </Shell>
    );
  }

  const {
    user, totals, growth_score, revenue_score,
    open_tasks = [], tasks_summary = {},
    activity = [], competitor_alerts = [],
    weekly = {}, recent_scans = [],
    growth_trend = [], ai_recommendations = [],
  } = d || {};

  return (
    <Shell>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Home</div>
            <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mt-1">
              {greeting}, {user?.name?.split(" ")[0] || "there"} <span className="text-primary">&bull;</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {totals?.complete_scans ?? 0} scans &bull; {totals?.leads ?? 0} leads &bull; {tasks_summary?.open ?? 0} open tasks
            </p>
          </div>
          <Link href="/scan/new">
            <Button className="gap-2" data-testid="dashboard-new-scan-btn">
              <Plus className="w-4 h-4" />New scan
            </Button>
          </Link>
        </div>

        {/* Widget grid */}
        <div className="grid grid-cols-12 gap-4">
          {/* Row 1: Revenue Score + Growth Score + AI Assistant (spans 2 rows) */}
          <Widget title="Revenue Score" icon={DollarSign} tid="widget-revenue-score" className="col-span-6 lg:col-span-4">
            <div className="flex items-center gap-5">
              <ScoreGauge value={revenue_score} />
              <div className="flex-1">
                <div className="text-xs text-muted-foreground">Economic-impact index derived from your business scans.</div>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">vs last week</span>
                  <Delta value={weekly?.delta} />
                </div>
              </div>
            </div>
          </Widget>

          <Widget title="Growth Score" icon={TrendingUp} tid="widget-growth-score" className="col-span-6 lg:col-span-4">
            <div className="flex items-center gap-5">
              <ScoreGauge value={growth_score} />
              <div className="flex-1">
                <div className="text-xs text-muted-foreground">Average score across all your completed scans.</div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="text-muted-foreground">Biz</div>
                    <div className="font-mono font-semibold">{totals?.business_scans ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Creator</div>
                    <div className="font-mono font-semibold">{totals?.creator_scans ?? 0}</div>
                  </div>
                </div>
              </div>
            </div>
          </Widget>

          <AIAssistantWidget />

          {/* Row 2: Growth Trend (spans 8) - assistant occupies right column via row-span-2 */}
          <GrowthTrendWidget trend={growth_trend} />

          {/* Row 3: Recent scans + Open tasks + Weekly improvements */}
          <Widget title="Recent Scans" icon={History} tid="widget-recent-scans"
            action={<Link href="/reports" className="text-xs text-primary hover:underline">View all</Link>}
            className="col-span-12 lg:col-span-5">
            {recent_scans.length === 0 ? (
              <div className="text-sm text-muted-foreground py-6 text-center">No scans yet.</div>
            ) : (
              <div className="divide-y divide-border -mx-1">
                {recent_scans.slice(0, 5).map((s: any) => (
                  <Link key={s.id} href={`/results/${s.id}`}
                    className="flex items-center justify-between gap-2 px-1 py-2 rounded hover:bg-muted/40 transition"
                    data-testid={`recent-scan-${s.id}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      {s.mode === "business"
                        ? <Globe className="w-3.5 h-3.5 text-primary shrink-0" />
                        : <Sparkles className="w-3.5 h-3.5 text-accent-foreground shrink-0" />}
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{s.target}</div>
                        <div className="text-[11px] text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                    {s.status === "complete"
                      ? <Badge variant="outline" className="font-mono text-xs">{s.score}/100</Badge>
                      : <Badge variant="secondary" className="capitalize text-xs">{s.status}</Badge>}
                  </Link>
                ))}
              </div>
            )}
          </Widget>

          <Widget title="Open Tasks" icon={ListChecks} tid="widget-open-tasks"
            action={<span className="text-xs text-muted-foreground font-mono">{tasks_summary?.done ?? 0}/{tasks_summary?.total ?? 0}</span>}
            className="col-span-12 lg:col-span-4">
            {open_tasks.length === 0 ? (
              <div className="text-sm text-muted-foreground py-6 text-center">All caught up!</div>
            ) : (
              <div className="space-y-2">
                {open_tasks.map((t: any) => (
                  <button key={t.id}
                    onClick={() => toggleTask(t)}
                    className="w-full flex items-start gap-2 text-left group py-1"
                    data-testid={`task-${t.id}`}>
                    {t.done
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                      : <Circle className="w-4 h-4 text-muted-foreground group-hover:text-primary mt-0.5 shrink-0" />}
                    <span className={`text-sm ${t.done ? "line-through text-muted-foreground" : ""}`}>{t.title}</span>
                  </button>
                ))}
              </div>
            )}
          </Widget>

          <Widget title="Weekly Improvements" icon={Activity} tid="widget-weekly" className="col-span-12 lg:col-span-3">
            <div className="space-y-3">
              <div>
                <div className="text-xs text-muted-foreground">Scans this week</div>
                <div className="font-display text-2xl font-black">{weekly?.this_week_scans ?? 0}</div>
                <div className="text-[11px] text-muted-foreground">was {weekly?.last_week_scans ?? 0} last week</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground flex items-center justify-between">
                  <span>Avg score</span>
                  <Delta value={weekly?.delta} />
                </div>
                <Progress value={weekly?.this_week_avg_score ?? 0} className="h-1.5 mt-1" />
                <div className="text-[11px] text-muted-foreground mt-1">
                  {weekly?.this_week_avg_score ?? 0} vs {weekly?.last_week_avg_score ?? 0}
                </div>
              </div>
            </div>
          </Widget>

          {/* Row 4: Team activity + Competitor alerts + AI recommendations */}
          <Widget title="Team Activity" icon={Activity} tid="widget-activity" className="col-span-12 lg:col-span-4">
            {activity.length === 0 ? (
              <div className="text-sm text-muted-foreground py-6 text-center">No activity yet.</div>
            ) : (
              <div className="space-y-3">
                {activity.slice(0, 5).map((a: any) => (
                  <div key={a.id} className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/15 grid place-items-center shrink-0 mt-0.5">
                      {a.type === "task_done"
                        ? <CheckCircle2 className="w-3 h-3 text-primary" />
                        : <Sparkles className="w-3 h-3 text-primary" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm truncate">{a.description}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {a.created_at ? new Date(a.created_at).toLocaleString() : ""}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Widget>

          <Widget title="Competitor Alerts" icon={AlertTriangle} tid="widget-competitor-alerts" className="col-span-12 lg:col-span-4">
            {competitor_alerts.length === 0 ? (
              <div className="text-sm text-muted-foreground py-6 text-center">
                No competitor gaps yet.<br />
                <span className="text-[11px]">Run a Compare on any business scan.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {competitor_alerts.map((a: any) => (
                  <Link key={a.scan_id} href={`/results/${a.scan_id}`} className="block p-2 rounded-md hover:bg-muted/40 transition">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium truncate">{a.competitor_url}</div>
                      <Badge variant="destructive" className="font-mono text-[10px]">-{a.diff}</Badge>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      You: {a.my_score} &bull; Them: {a.their_score}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Widget>

          <Widget title="AI Recommendations" icon={Lightbulb} tid="widget-ai-recs" className="col-span-12 lg:col-span-4">
            {ai_recommendations.length === 0 ? (
              <div className="text-sm text-muted-foreground py-6 text-center">Run a scan for AI recommendations.</div>
            ) : (
              <div className="space-y-3">
                {ai_recommendations.slice(0, 4).map((r: any, i: number) => (
                  <Link key={i} href={`/results/${r.scan_id}`} className="block group">
                    <div className="flex items-start gap-2">
                      <Badge variant={r.priority === "high" ? "destructive" : r.priority === "low" ? "outline" : "secondary"} className="text-[10px] capitalize shrink-0 mt-0.5">
                        {r.priority}
                      </Badge>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium group-hover:text-primary truncate">{r.title}</div>
                        <div className="text-[11px] text-muted-foreground line-clamp-2">{r.why}</div>
                      </div>
                      <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Widget>

          {/* Full-width scan history table at bottom */}
          <Widget title="Scan History" icon={History} tid="widget-scan-history"
            action={<Link href="/reports" className="text-xs text-primary hover:underline">Open reports</Link>}
            className="col-span-12">
            {(recent_scans || []).length === 0 ? (
              <div className="text-sm text-muted-foreground py-6 text-center">No scans in history yet.</div>
            ) : (
              <div className="overflow-x-auto -mx-1">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-widest text-muted-foreground">
                      <th className="py-2 px-2 font-normal">Target</th>
                      <th className="py-2 px-2 font-normal">Mode</th>
                      <th className="py-2 px-2 font-normal">Date</th>
                      <th className="py-2 px-2 font-normal">Score</th>
                      <th className="py-2 px-2 font-normal">Status</th>
                      <th className="py-2 px-2 font-normal"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recent_scans.map((s: any) => (
                      <tr key={s.id} className="hover:bg-muted/30 transition" data-testid={`history-row-${s.id}`}>
                        <td className="py-2 px-2 font-medium truncate max-w-[280px]">{s.target}</td>
                        <td className="py-2 px-2 capitalize">
                          <span className="inline-flex items-center gap-1">
                            {s.mode === "business" ? <Globe className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                            {s.mode}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</td>
                        <td className="py-2 px-2 font-mono">{s.status === "complete" ? `${s.score}/100` : "-"}</td>
                        <td className="py-2 px-2">
                          <Badge variant={s.status === "complete" ? "outline" : "secondary"} className="text-[10px] capitalize">{s.status}</Badge>
                        </td>
                        <td className="py-2 px-2 text-right">
                          <Link href={`/results/${s.id}`} className="text-primary hover:underline text-xs">Open &rarr;</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Widget>
        </div>
      </div>
    </Shell>
  );
}
