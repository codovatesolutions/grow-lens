"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import {
  Globe, Sparkles, CheckCircle2, AlertCircle, RefreshCw, BarChart2,
  Lock, TrendingUp, HelpCircle, ArrowLeft, Terminal, FileCode, Users,
  Bot, Download, Share2, Calendar, AlertTriangle, Loader2, Wand2, Crown,
  TrendingDown, Smartphone
} from "lucide-react";
import Shell from "@/components/Shell";
import ScoreRing from "@/components/ScoreRing";
import { toast } from "sonner";

const SUBSCORE_KEYS = [
  ["trust", "Trust & Security"],
  ["conversion", "Conversions"],
  ["ux", "UX & Accessibility"],
  ["copywriting", "Copywriting"],
  ["brand", "Brand Identity"],
  ["seo", "SEO & Visibility"]
] as const;

const barColor = (score: number) => {
  if (score >= 75) return "bg-emerald-500";
  if (score >= 50) return "bg-yellow-500";
  return "bg-accent";
};

interface SectionProps {
  title: string;
  tid?: string;
  children: React.ReactNode;
}

const Section = ({ title, tid, children }: SectionProps) => (
  <div className="space-y-3" data-testid={tid}>
    <h3 className="font-display text-sm font-bold tracking-widest uppercase text-muted-foreground">{title}</h3>
    {children}
  </div>
);

function ExpertCard({ e }: { e: any }) {
  const p = e.priority === "high" ? "text-primary border-primary/20 bg-primary/5" : e.priority === "low" ? "text-muted-foreground border-border" : "text-amber-500 border-amber-500/20 bg-amber-500/5";
  return (
    <div className={`border rounded-lg p-4 space-y-2 bg-card ${p}`} data-testid={`expert-${e.agent_key}`}>
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm text-foreground">{e.agent_name}</h4>
        <span className="font-mono text-xs">{e.confidence}% confidence</span>
      </div>
      <p className="text-xs text-muted-foreground italic">&ldquo;{e.opinion}&rdquo;</p>
      <div className="text-xs space-y-1">
        <div><span className="font-medium text-foreground">Rec:</span> <span className="text-muted-foreground">{e.recommendation}</span></div>
        <div className="flex justify-between text-[11px] text-muted-foreground pt-1">
          <span>Impact: {e.impact}/100</span>
          <span>Lift: +{e.estimated_revenue_gain_pct}%</span>
        </div>
      </div>
    </div>
  );
}

interface BusinessResultsProps {
  result: any;
  growthTeam: any;
  runTeam: () => Promise<void>;
  running: boolean;
}

function BusinessResults({ result, growthTeam, runTeam, running }: BusinessResultsProps) {
  const [activeTab, setActiveTab] = useState("fixes");
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <TabsList className="flex overflow-x-auto w-full md:grid md:grid-cols-5 h-auto p-1 gap-1 whitespace-nowrap scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden justify-start">
        <TabsTrigger value="fixes" className="flex-1 md:flex-initial" data-testid="tab-fixes">Top Fixes</TabsTrigger>
        <TabsTrigger value="outreach" className="flex-1 md:flex-initial" data-testid="tab-outreach">Outreach</TabsTrigger>
        <TabsTrigger value="leads" className="flex-1 md:flex-initial" data-testid="tab-leads">Leads</TabsTrigger>
        <TabsTrigger value="board" className="flex-1 md:flex-initial" data-testid="tab-board">Growth Board</TabsTrigger>
        <TabsTrigger value="code" className="flex-1 md:flex-initial" data-testid="tab-code">Code Fixes</TabsTrigger>
      </TabsList>

      <TabsContent value="fixes" className="space-y-4">
        {(result.top_fixes || []).map((f: any, i: number) => (
          <Card key={i} className="p-5 flex flex-col md:flex-row gap-4 justify-between items-start" data-testid={`fix-${i}`}>
            <div className="space-y-2 max-w-3xl">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-widest font-mono text-primary font-bold">Fix {i+1} &bull; {f.priority}</span>
              </div>
              <h3 className="font-display text-lg font-bold">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.why}</p>
              <div className="text-xs bg-muted/50 p-3 rounded border border-border/50">
                <span className="font-semibold block text-foreground mb-1">Recommended action:</span>
                <span className="text-muted-foreground leading-relaxed">{f.action}</span>
              </div>
            </div>
          </Card>
        ))}
      </TabsContent>

      <TabsContent value="outreach" className="space-y-4">
        {(result.outreach_emails || []).map((m: any, i: number) => (
          <Card key={i} className="p-5 space-y-3" data-testid={`email-${i}`}>
            <div className="flex justify-between items-center">
              <span className="text-xs uppercase tracking-widest font-mono font-bold text-muted-foreground">Draft {i+1} &bull; {m.angle} angle</span>
            </div>
            <div className="text-sm font-semibold border-b border-border pb-2">Subject: {m.subject}</div>
            <div className="text-xs text-muted-foreground font-mono whitespace-pre-wrap leading-relaxed bg-muted/30 p-3 rounded border border-border/50">{m.body}</div>
          </Card>
        ))}
      </TabsContent>

      <TabsContent value="leads" className="space-y-4">
        <Card className="p-5">
          {(!result.leads || result.leads.length === 0) ? (
            <div className="text-sm text-muted-foreground text-center py-6">No contact info or leads extracted from pages.</div>
          ) : (
            <div className="divide-y divide-border">
              {result.leads.map((l: any, i: number) => (
                <div key={i} className="py-3 first:pt-0 last:pb-0 flex justify-between items-center gap-3" data-testid={`lead-${i}`}>
                  <div>
                    <div className="text-sm font-medium">{l.name} {l.role ? `(${l.role})` : ""}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{l.notes} &bull; Source: {l.source}</div>
                  </div>
                  <div className="text-right space-y-1">
                    {l.email && <div className="text-xs font-mono font-semibold">{l.email}</div>}
                    {l.phone && <div className="text-xs text-muted-foreground">{l.phone}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </TabsContent>

      <TabsContent value="board" className="space-y-4">
        {(!growthTeam || !growthTeam.executive_summary) ? (
          <Card className="p-8 text-center space-y-4">
            <h3 className="font-display text-lg font-bold">Convene the Board of 13 Experts</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Simulate 13 specialist agents (UX, SEO, Pricing, Analytics, Copywriting, etc.) analyzing this report in parallel. They debate and calculate exact revenue leaks.
            </p>
            <Button onClick={runTeam} disabled={running} data-testid="convene-board-btn">
              {running ? "Convening..." : "Convene Growth Board"}
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              {/* Board Consensus Card */}
              <Card className="p-5 space-y-3">
                <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Consensus Verdict</div>
                <div className="font-display text-lg font-bold leading-tight">{growthTeam.executive_summary.verdict}</div>
                <div className="text-xs text-muted-foreground">Consensus score: {growthTeam.executive_summary.consensus_score}% &bull; Board confidence: {growthTeam.executive_summary.board_confidence}%</div>
              </Card>

              {/* Opportunity / Risk */}
              <Card className="p-5 space-y-3">
                <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Biggest Move</div>
                <div className="text-sm font-semibold text-primary">Opportunity: {growthTeam.executive_summary.biggest_opportunity}</div>
                <div className="text-xs text-muted-foreground">Risk if not fixed: {growthTeam.executive_summary.biggest_risk}</div>
              </Card>

              {/* Revenue Leak Overview */}
              {growthTeam.revenue_leak && (
                <Card className="p-5 border-red-500/20 bg-gradient-to-br from-red-500/5 to-transparent">
                  <div className="text-xs uppercase tracking-widest text-red-600 font-bold mb-2">Estimated Revenue Leak</div>
                  <div className="font-display text-2xl font-black text-red-600">${(growthTeam.revenue_leak.monthly_revenue_lost_usd ?? 0).toLocaleString()} /mo</div>
                  <div className="text-xs text-muted-foreground mt-1">Lead loss: {growthTeam.revenue_leak.lead_loss_pct}% &bull; Bounce: {growthTeam.revenue_leak.bounce_increase_pct}%</div>
                </Card>
              )}
            </div>

            {/* Specialist grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {(growthTeam.experts || []).map((e: any) => (
                <ExpertCard key={e.agent_key} e={e} />
              ))}
            </div>
          </div>
        )}
      </TabsContent>

      <TabsContent value="code" className="space-y-4">
        {(result.top_fixes || []).map((f: any, i: number) => (
          <Card key={i} className="p-5 space-y-3" data-testid={`code-fix-${i}`}>
            <h3 className="font-display text-sm font-semibold tracking-tight uppercase border-b border-border pb-2">Fix {i+1} &bull; {f.title}</h3>
            <Tabs defaultValue="react">
              <TabsList className="grid grid-cols-4 w-64 h-8 p-0 bg-muted">
                <TabsTrigger value="react" className="text-xs h-7">React</TabsTrigger>
                <TabsTrigger value="tailwind" className="text-xs h-7">Tailwind</TabsTrigger>
                <TabsTrigger value="before" className="text-xs h-7">Before</TabsTrigger>
                <TabsTrigger value="after" className="text-xs h-7">After</TabsTrigger>
              </TabsList>
              <TabsContent value="react" className="pt-2">
                <div className="text-xs font-mono bg-muted/50 p-3 rounded border border-border/50 overflow-x-auto whitespace-pre">{f.code_react || "N/A"}</div>
              </TabsContent>
              <TabsContent value="tailwind" className="pt-2">
                <div className="text-xs font-mono bg-muted/50 p-3 rounded border border-border/50 overflow-x-auto whitespace-pre">{f.code_tailwind || "N/A"}</div>
              </TabsContent>
              <TabsContent value="before" className="pt-2">
                <div className="text-xs font-mono bg-muted/50 p-3 rounded border border-border/50 overflow-x-auto whitespace-pre">{f.code_before || "N/A"}</div>
              </TabsContent>
              <TabsContent value="after" className="pt-2">
                <div className="text-xs font-mono bg-muted/50 p-3 rounded border border-border/50 overflow-x-auto whitespace-pre">{f.code_after || "N/A"}</div>
              </TabsContent>
            </Tabs>
          </Card>
        ))}
      </TabsContent>
    </Tabs>
  );
}

function CreatorResults({ result }: { result: any }) {
  const [activeTab, setActiveTab] = useState("ideas");
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <TabsList className="flex overflow-x-auto w-full md:grid md:grid-cols-4 h-auto p-1 gap-1 whitespace-nowrap scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden justify-start">
        <TabsTrigger value="ideas" className="flex-1 md:flex-initial" data-testid="tab-ideas">Post Ideas</TabsTrigger>
        <TabsTrigger value="captions" className="flex-1 md:flex-initial" data-testid="tab-captions">Captions</TabsTrigger>
        <TabsTrigger value="hooks" className="flex-1 md:flex-initial" data-testid="tab-hooks">Hooks</TabsTrigger>
        <TabsTrigger value="pillars" className="flex-1 md:flex-initial" data-testid="tab-pillars">Positioning</TabsTrigger>
      </TabsList>

      <TabsContent value="ideas" className="space-y-4">
        {(result.post_ideas || []).map((idea: any, i: number) => (
          <Card key={i} className="p-5 space-y-2 animate-fade-in" data-testid={`idea-${i}`}>
            <div className="flex justify-between items-center">
              <span className="text-xs uppercase tracking-widest font-mono text-primary font-bold">{idea.format} &bull; Hook angle</span>
            </div>
            <h3 className="font-display text-lg font-bold">{idea.title}</h3>
            <p className="text-sm text-muted-foreground">{idea.why}</p>
            <div className="text-xs bg-muted/50 p-3 rounded border border-border/50">
              <span className="font-semibold block text-foreground mb-1">Suggested Hook:</span>
              <span className="text-muted-foreground leading-relaxed italic">&ldquo;{idea.hook}&rdquo;</span>
            </div>
          </Card>
        ))}
      </TabsContent>

      <TabsContent value="captions" className="space-y-4">
        {(result.captions || []).map((c: any, i: number) => (
          <Card key={i} className="p-5 space-y-3 animate-fade-in" data-testid={`caption-${i}`}>
            <span className="text-xs uppercase tracking-widest font-mono font-bold text-muted-foreground">Draft {i+1}</span>
            <p className="text-sm leading-relaxed whitespace-pre-wrap bg-muted/30 p-4 rounded border border-border/50">{c.caption}</p>
            <div className="flex flex-wrap gap-1.5 pt-2">
              {(c.hashtags || []).map((tag: string, j: number) => <Badge key={j} variant="secondary">#{tag}</Badge>)}
            </div>
          </Card>
        ))}
      </TabsContent>

      <TabsContent value="hooks" className="space-y-4">
        <Card className="p-5">
          <ul className="divide-y divide-border">
            {(result.hooks || []).map((h: string, i: number) => (
              <li key={i} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4 font-display text-base font-semibold italic" data-testid={`hook-${i}`}>
                &ldquo;{h}&rdquo;
              </li>
            ))}
          </ul>
        </Card>
      </TabsContent>

      <TabsContent value="pillars" className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-5 space-y-3">
            <h3 className="font-display text-sm font-semibold tracking-tight uppercase border-b border-border pb-2">Content Pillars</h3>
            <ul className="space-y-2">
              {(result.content_pillars || []).map((p: string, i: number) => (
                <li key={i} className="flex gap-2 items-center text-sm"><CheckCircle2 className="w-4 h-4 text-accent shrink-0"/> {p}</li>
              ))}
            </ul>
          </Card>

          <Card className="p-5 space-y-3">
            <h3 className="font-display text-sm font-semibold tracking-tight uppercase border-b border-border pb-2">Audience Signals</h3>
            <ul className="space-y-2">
              {(result.audience_signals || []).map((s: string, i: number) => (
                <li key={i} className="flex gap-2 items-center text-sm"><CheckCircle2 className="w-4 h-4 text-accent shrink-0"/> {s}</li>
              ))}
            </ul>
          </Card>

          <Card className="p-5 space-y-3">
            <h3 className="font-display text-sm font-semibold tracking-tight uppercase border-b border-border pb-2">Layout Improvements</h3>
            <ul className="space-y-2">
              {(result.profile_layout_improvements || []).map((imp: string, i: number) => (
                <li key={i} className="flex gap-2 items-center text-sm"><CheckCircle2 className="w-4 h-4 text-accent shrink-0"/> {imp}</li>
              ))}
            </ul>
          </Card>

          <Card className="p-5 space-y-3">
            <h3 className="font-display text-sm font-semibold tracking-tight uppercase border-b border-border pb-2">CTA Improvements</h3>
            <ul className="space-y-2">
              {(result.cta_improvements || []).map((imp: string, i: number) => (
                <li key={i} className="flex gap-2 items-center text-sm"><CheckCircle2 className="w-4 h-4 text-accent shrink-0"/> {imp}</li>
              ))}
            </ul>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}

export default function Results() {
  const { id } = useParams() as { id: string };
  const [scan, setScan] = useState<any>(null);
  const [growthTeamData, setGrowthTeamData] = useState<any>(null);
  const [runningTeam, setRunningTeam] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    let intervalId: any;
    let isMounted = true;

    const fetchScan = async (showToastOnFail = true) => {
      try {
        const r = await api.get(`/scans/${id}`);
        if (!isMounted) return;
        
        setScan(r.data);
        
        if (r.data.status === "complete") {
          setLoading(false);
          if (intervalId) clearInterval(intervalId);
          if (r.data.mode === "business") {
            api.get(`/scans/${id}/growth-team`)
              .then((gt) => {
                if (isMounted) setGrowthTeamData(gt.data);
              })
              .catch(() => console.log("Growth team not convened yet"));
          }
        } else if (r.data.status === "failed") {
          setLoading(false);
          if (intervalId) clearInterval(intervalId);
        } else {
          // If status is still processing, stop loading skeleton to show the custom processing screen
          setLoading(false);
        }
      } catch (e) {
        if (!isMounted) return;
        if (showToastOnFail) {
          toast.error("Failed to load report");
        }
        setLoading(false);
        if (intervalId) clearInterval(intervalId);
      }
    };

    fetchScan(true);

    // Poll every 3 seconds
    intervalId = setInterval(() => {
      fetchScan(false);
    }, 3000);

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [id]);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(scan, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `scan-${id}.json`;
    a.click();
  };

  const copy = (t: string) => {
    navigator.clipboard.writeText(t);
    toast.success("Copied to clipboard");
  };

  const runGrowthTeam = async () => {
    setRunningTeam(true);
    try {
      const res = await api.post(`/scans/${id}/growth-team`);
      setGrowthTeamData(res.data);
      toast.success("Growth Board successfully convened!");
      // Refresh scan data
      const r = await api.get(`/scans/${id}`);
      setScan(r.data);
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Growth Board failed");
    } finally {
      setRunningTeam(false);
    }
  };

  const aiExport = (tool: "chatgpt" | "claude" | "cursor") => {
    const r = scan?.result || {};
    const fixes = (r.top_fixes || []).map((f: any, i: number) => `${i+1}. [${f.priority}] ${f.title}\n   Why: ${f.why}\n   Do: ${f.action}${f.code_after ? `\n   Code (after):\n${f.code_after}` : ""}`).join("\n\n");
    const wrap = {
      chatgpt: `I'm auditing my website ${scan.target}. Please help me implement these prioritized conversion fixes in a modern React + Tailwind stack. For each fix, produce the exact JSX/CSS change and explain the tradeoff.\n\n${fixes}`,
      claude: `<task>Implement these website conversion fixes for ${scan.target} using React + Tailwind. Return a plan and code for each.</task>\n\n<issues>\n${fixes}\n</issues>`,
      cursor: `# ${scan.target} &ndash; GrowthLens fixes\n\nApply these fixes to the current file. Prefer Tailwind + shadcn/ui.\n\n${fixes}`,
    }[tool];
    copy(wrap);
    toast.success(`Copied prompt for ${tool}`);
  };

  if (loading) {
    return (
      <Shell>
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-40 w-full" />
        </div>
      </Shell>
    );
  }

  if (!scan) {
    return (
      <Shell>
        <div className="max-w-2xl mx-auto py-10 text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold">Report not found</h2>
          <Link href="/dashboard" className="inline-block mt-6">
            <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard</Button>
          </Link>
        </div>
      </Shell>
    );
  }

  if (scan.status === "processing") {
    return (
      <Shell>
        <div className="max-w-2xl mx-auto py-16 text-center space-y-6">
          <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full animate-pulse" />
            <div className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin animate-duration-1000" />
            <Sparkles className="w-8 h-8 text-primary animate-bounce" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold font-display">Analyzing digital footprint...</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              Our AI conversion analyst is crawling <code className="bg-muted px-1.5 py-0.5 rounded text-primary break-all">{scan.target}</code>, scanning UX layout, detecting trust markers, and auditing SEO configurations.
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 max-w-md mx-auto space-y-3 text-left">
            <div className="flex items-center gap-3 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="font-semibold text-muted-foreground">Active Tasks:</span>
            </div>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex items-center gap-2">✓ Connecting to target URL</li>
              <li className="flex items-center gap-2">✓ Scraping HTML structure & copy</li>
              <li className="flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary shrink-0" />
                Evaluating landing page copywriting with LLM
              </li>
              <li className="flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary shrink-0" />
                Determining subscores & key revenue leaks
              </li>
            </ul>
          </div>
        </div>
      </Shell>
    );
  }

  if (scan.status === "failed") {
    return (
      <Shell>
        <div className="max-w-2xl mx-auto py-16 text-center space-y-6">
          <AlertTriangle className="w-16 h-16 text-destructive mx-auto" />
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold font-display text-destructive">Scan Analysis Failed</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              We encountered an issue while trying to analyze <code className="bg-muted px-1.5 py-0.5 rounded break-all">{scan.target}</code>.
            </p>
          </div>

          {scan.error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-4 max-w-md mx-auto text-sm text-left font-mono break-all">
              <strong>Error details:</strong> {scan.error}
            </div>
          )}

          <div className="flex justify-center gap-3">
            <Link href="/scan/new">
              <Button className="gap-2">
                Try Another Scan
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  const r = scan.result || {};
  const isBiz = scan.mode === "business";
  const subs = r.subscores || {};
  const publicUrl = typeof window !== "undefined" ? `${window.location.origin}/results/${scan.id}` : "";

  return (
    <Shell>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1" data-testid="results-back">
            <ArrowLeft className="w-4 h-4"/>Back
          </Link>
          <div className="flex gap-2 flex-wrap">
            {isBiz && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" data-testid="ai-export-trigger">
                    <Bot className="w-4 h-4 mr-2"/>Copy for AI
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => aiExport("chatgpt")} data-testid="ai-export-chatgpt">Copy for ChatGPT</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => aiExport("claude")} data-testid="ai-export-claude">Copy for Claude</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => aiExport("cursor")} data-testid="ai-export-cursor">Copy for Cursor</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Button variant="outline" size="sm" onClick={exportJson} data-testid="results-export-btn">
              <Download className="w-4 h-4 mr-2"/>Export JSON
            </Button>
            {isBiz && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" data-testid="share-trigger">
                    <Share2 className="w-4 h-4 mr-2"/>Share
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => { copy(publicUrl); }} data-testid="share-copy-link">Copy public link</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {!isBiz && (
              <Link href={`/planner?scan=${id}`}>
                <Button size="sm" data-testid="results-plan-btn">
                  <Calendar className="w-4 h-4 mr-2"/>Build content plan
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="border border-border bg-card rounded-md p-6 md:p-8 grid md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-3 flex md:block justify-center">
            <ScoreRing score={r.score || 0} />
          </div>
          <div className="md:col-span-9 space-y-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {isBiz ? <><Globe className="w-3 h-3"/>Business scan</> : <><Sparkles className="w-3 h-3"/>Creator scan</>}
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight break-all">{scan.target}</h1>
            <p className="text-muted-foreground leading-relaxed">{r.summary}</p>
          </div>
        </div>

        {r.screenshots && (r.screenshots.desktop || r.screenshots.mobile) && (
          <div className="space-y-4" data-testid="scanned-visuals">
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold flex items-center justify-between">
              <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5"/> Scanned Visuals</span>
            </div>
            
            {/* Desktop view side-by-side grid */}
            <div className="hidden md:grid md:grid-cols-12 gap-6">
              {r.screenshots.desktop && (
                <div className="md:col-span-8 space-y-2">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Desktop view</div>
                  <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm aspect-[16/10] relative group flex flex-col">
                    <div className="bg-muted px-4 py-2 border-b border-border flex items-center gap-1.5 shrink-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
                      <div className="flex-1 bg-background text-[10px] text-muted-foreground px-2 py-0.5 rounded border border-border/40 truncate text-center font-mono max-w-sm mx-auto">
                        {scan.target}
                      </div>
                    </div>
                    <div className="flex-1 min-h-0 bg-muted/20">
                      <img
                        src={r.screenshots.desktop}
                        alt="Desktop View"
                        className="w-full h-full object-cover object-top"
                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                      />
                    </div>
                  </div>
                </div>
              )}
              {r.screenshots.mobile && (
                <div className="md:col-span-4 space-y-2 flex flex-col">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Mobile view</div>
                  <div className="border border-border rounded-[2.5rem] bg-card overflow-hidden shadow-sm flex-1 relative group max-w-[280px] mx-auto border-8 border-muted flex flex-col aspect-[9/18]">
                    <div className="bg-muted h-6 flex items-center justify-center border-b border-border font-mono text-[9px] text-muted-foreground shrink-0 select-none">
                      12:00
                    </div>
                    <div className="flex-1 min-h-0 bg-muted/20">
                      <img
                        src={r.screenshots.mobile}
                        alt="Mobile View"
                        className="w-full h-full object-cover object-top"
                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile/Tablet tab switcher */}
            <div className="block md:hidden">
              <Tabs defaultValue="desktop" className="w-full">
                <TabsList className="grid grid-cols-2 w-full mb-3">
                  <TabsTrigger value="desktop">Desktop Preview</TabsTrigger>
                  <TabsTrigger value="mobile">Mobile Preview</TabsTrigger>
                </TabsList>
                <TabsContent value="desktop" className="mt-0">
                  {r.screenshots.desktop ? (
                    <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm aspect-[16/10] relative flex flex-col">
                      <div className="bg-muted px-4 py-2 border-b border-border flex items-center gap-1.5 shrink-0">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                        <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
                        <span className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
                        <div className="flex-1 bg-background text-[10px] text-muted-foreground px-2 py-0.5 rounded border border-border/40 truncate text-center font-mono">
                          {scan.target}
                        </div>
                      </div>
                      <div className="flex-1 min-h-0 bg-muted/20">
                        <img
                          src={r.screenshots.desktop}
                          alt="Desktop View"
                          className="w-full h-full object-cover object-top"
                          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-xs text-muted-foreground border border-dashed rounded-xl">Desktop screenshot not available.</div>
                  )}
                </TabsContent>
                <TabsContent value="mobile" className="mt-0">
                  {r.screenshots.mobile ? (
                    <div className="border border-border rounded-[2.5rem] bg-card overflow-hidden shadow-sm relative max-w-[260px] mx-auto border-8 border-muted flex flex-col aspect-[9/18]">
                      <div className="bg-muted h-6 flex items-center justify-center border-b border-border font-mono text-[9px] text-muted-foreground shrink-0 select-none">
                        12:00
                      </div>
                      <div className="flex-1 min-h-0 bg-muted/20">
                        <img
                          src={r.screenshots.mobile}
                          alt="Mobile View"
                          className="w-full h-full object-cover object-top"
                          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-xs text-muted-foreground border border-dashed rounded-xl">Mobile screenshot not available.</div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}

        {isBiz && Object.keys(subs).length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-px bg-border border border-border" data-testid="subscores">
            {SUBSCORE_KEYS.map(([k, label]) => {
              const v = subs[k] ?? 0;
              return (
                <div key={k} className="bg-card p-4" data-testid={`subscore-${k}`}>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
                  <div className="font-display text-3xl font-black mt-1">{v}</div>
                  <div className="mt-2 h-1 bg-muted rounded">
                    <div className={`h-1 rounded ${barColor(v)}`} style={{ width: `${v}%` }}/>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Audited Gaps (2x2 Grid) */}
        {isBiz && (
          <div className="grid md:grid-cols-2 gap-6 animate-fade-in" data-testid="audited-gaps">
            {/* Trust & Security Gaps */}
            <Card className="p-5 space-y-3 bg-gradient-to-br from-red-500/5 to-transparent border-red-500/20">
              <h3 className="font-display text-xs font-bold tracking-widest uppercase text-red-500 flex items-center gap-2">
                <Lock className="w-4 h-4 text-red-500"/> Trust & Security Gaps
              </h3>
              {(!r.trust_gaps || r.trust_gaps.length === 0) ? (
                <p className="text-xs text-muted-foreground">No critical trust or security issues detected.</p>
              ) : (
                <ul className="space-y-2">
                  {r.trust_gaps.map((gap: string, i: number) => (
                    <li key={i} className="text-xs text-muted-foreground flex gap-2 items-start leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                      <span>{gap}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* SEO & Visibility Issues */}
            <Card className="p-5 space-y-3 bg-gradient-to-br from-amber-500/5 to-transparent border-amber-500/20">
              <h3 className="font-display text-xs font-bold tracking-widest uppercase text-amber-500 flex items-center gap-2">
                <Globe className="w-4 h-4 text-amber-500"/> SEO & Visibility Issues
              </h3>
              {(!r.seo_issues || r.seo_issues.length === 0) ? (
                <p className="text-xs text-muted-foreground">No critical SEO issues detected.</p>
              ) : (
                <ul className="space-y-2">
                  {r.seo_issues.map((issue: string, i: number) => (
                    <li key={i} className="text-xs text-muted-foreground flex gap-2 items-start leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* Mobile & Responsiveness */}
            <Card className="p-5 space-y-3 bg-gradient-to-br from-indigo-500/5 to-transparent border-indigo-500/20">
              <h3 className="font-display text-xs font-bold tracking-widest uppercase text-indigo-500 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-indigo-500"/> Mobile & Responsive Issues
              </h3>
              {(!r.mobile_issues || r.mobile_issues.length === 0) ? (
                <p className="text-xs text-muted-foreground">No responsiveness issues detected.</p>
              ) : (
                <ul className="space-y-2">
                  {r.mobile_issues.map((issue: string, i: number) => (
                    <li key={i} className="text-xs text-muted-foreground flex gap-2 items-start leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* Conversion & CTA Issues */}
            <Card className="p-5 space-y-3 bg-gradient-to-br from-emerald-500/5 to-transparent border-emerald-500/20">
              <h3 className="font-display text-xs font-bold tracking-widest uppercase text-emerald-500 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-emerald-500"/> Conversion & CTA Issues
              </h3>
              {(!r.cta_issues || r.cta_issues.length === 0) ? (
                <p className="text-xs text-muted-foreground">No call-to-action issues detected.</p>
              ) : (
                <ul className="space-y-2">
                  {r.cta_issues.map((issue: string, i: number) => (
                    <li key={i} className="text-xs text-muted-foreground flex gap-2 items-start leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        )}

        {/* ===== PHASE 2: AI GROWTH TEAM + REVENUE LEAK ENGINE ===== */}
        {isBiz && (
          <div data-testid="growth-team-block">
            <BusinessResults
              result={r}
              growthTeam={
                growthTeamData?.growth_team
                  ? {
                      ...growthTeamData.growth_team,
                      revenue_leak: growthTeamData.revenue_leak,
                    }
                  : null
              }
              runTeam={runGrowthTeam}
              running={runningTeam}
            />
          </div>
        )}

        {/* ===== CREATOR RESULTS ===== */}
        {!isBiz && (
          <CreatorResults result={r} />
        )}
      </div>
    </Shell>
  );
}
