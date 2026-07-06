import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import ScoreRing from "../components/ScoreRing";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { Input } from "../components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "../components/ui/dropdown-menu";
import {
  ArrowLeft, Download, Mail, AlertTriangle, CheckCircle2, Sparkles,
  Globe, Copy, Calendar, Wand2, Bot, Loader2, Swords, Trophy, Share2, Monitor, Smartphone,
} from "lucide-react";
import { toast } from "sonner";

const Section = ({ title, children, tid, action }) => (
  <section data-testid={tid} className="border border-border bg-card rounded-md">
    <div className="px-5 py-3 border-b border-border flex items-center justify-between">
      <div className="font-display text-sm uppercase tracking-[0.2em] text-muted-foreground">{title}</div>
      {action}
    </div>
    <div className="p-5">{children}</div>
  </section>
);

const PRIO = {
  high: "bg-accent/15 text-accent border-accent/30",
  medium: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30",
  low: "bg-primary/15 text-primary border-primary/30",
};

const SUBSCORE_KEYS = [
  ["trust", "Trust"], ["conversion", "Conversion"], ["ux", "UX"],
  ["copywriting", "Copy"], ["brand", "Brand"], ["seo", "SEO"],
];

const barColor = (v) => v >= 75 ? "bg-primary" : v >= 50 ? "bg-yellow-500" : "bg-accent";

function CodeBlock({ label, code, testId }) {
  if (!code) return null;
  const copy = () => { navigator.clipboard.writeText(code); toast.success(`${label} copied`); };
  return (
    <div className="border border-border rounded bg-background/60">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
        <Button size="sm" variant="ghost" onClick={copy} data-testid={testId}><Copy className="w-3 h-3 mr-1"/>Copy</Button>
      </div>
      <pre className="p-3 text-xs font-mono overflow-x-auto whitespace-pre">{code}</pre>
    </div>
  );
}

function FixCard({ fix, i }) {
  const hasCode = fix.code_before || fix.code_after || fix.code_tailwind || fix.code_react;
  return (
    <div className="border-l-2 border-primary pl-4 py-2" data-testid={`fix-${i}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="font-display font-semibold">{i+1}. {fix.title}</div>
        <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded border ${PRIO[fix.priority] || PRIO.medium}`}>{fix.priority}</span>
      </div>
      <div className="text-sm text-muted-foreground mt-1"><span className="font-medium text-foreground">Why:</span> {fix.why}</div>
      <div className="text-sm mt-1"><span className="font-medium">Do this:</span> {fix.action}</div>
      {hasCode && (
        <Tabs defaultValue="after" className="mt-3">
          <TabsList className="h-8">
            {fix.code_before && <TabsTrigger value="before" className="text-xs" data-testid={`fix-${i}-tab-before`}>Before</TabsTrigger>}
            {fix.code_after && <TabsTrigger value="after" className="text-xs" data-testid={`fix-${i}-tab-after`}>After ({fix.code_language || "css"})</TabsTrigger>}
            {fix.code_tailwind && <TabsTrigger value="tw" className="text-xs" data-testid={`fix-${i}-tab-tw`}>Tailwind</TabsTrigger>}
            {fix.code_react && <TabsTrigger value="rx" className="text-xs" data-testid={`fix-${i}-tab-rx`}>React</TabsTrigger>}
          </TabsList>
          {fix.code_before && <TabsContent value="before"><CodeBlock label="Before" code={fix.code_before} testId={`fix-${i}-copy-before`}/></TabsContent>}
          {fix.code_after && <TabsContent value="after"><CodeBlock label={`After (${fix.code_language || "css"})`} code={fix.code_after} testId={`fix-${i}-copy-after`}/></TabsContent>}
          {fix.code_tailwind && <TabsContent value="tw"><CodeBlock label="Tailwind" code={fix.code_tailwind} testId={`fix-${i}-copy-tw`}/></TabsContent>}
          {fix.code_react && <TabsContent value="rx"><CodeBlock label="React" code={fix.code_react} testId={`fix-${i}-copy-rx`}/></TabsContent>}
        </Tabs>
      )}
    </div>
  );
}

export default function Results() {
  const { id } = useParams();
  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [compUrl, setCompUrl] = useState("");
  const [comparing, setComparing] = useState(false);

  useEffect(() => {
    api.get(`/scans/${id}`).then(r => setScan(r.data)).finally(() => setLoading(false));
  }, [id]);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(scan, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `scan-${id}.json`;
    a.click();
  };

  const copy = (t) => { navigator.clipboard.writeText(t); toast.success("Copied"); };

  const runCompare = async () => {
    if (!compUrl.trim()) { toast.error("Enter a competitor URL"); return; }
    setComparing(true);
    try {
      const { data } = await api.post(`/scans/${id}/compare`, { competitor_url: compUrl.trim() });
      setScan((s) => ({ ...s, comparison: data }));
      toast.success("Comparison ready");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Compare failed");
    } finally { setComparing(false); }
  };

  const aiExport = (tool) => {
    const r = scan?.result || {};
    const fixes = (r.top_fixes || []).map((f, i) => `${i+1}. [${f.priority}] ${f.title}\n   Why: ${f.why}\n   Do: ${f.action}${f.code_after ? `\n   Code (after):\n${f.code_after}` : ""}`).join("\n\n");
    const wrap = {
      chatgpt: `I'm auditing my website ${scan.target}. Please help me implement these prioritized conversion fixes in a modern React + Tailwind stack. For each fix, produce the exact JSX/CSS change and explain the tradeoff.\n\n${fixes}`,
      claude: `<task>Implement these website conversion fixes for ${scan.target} using React + Tailwind. Return a plan and code for each.</task>\n\n<issues>\n${fixes}\n</issues>`,
      cursor: `# ${scan.target} — GrowthLens fixes\n\nApply these fixes to the current file. Prefer Tailwind + shadcn/ui.\n\n${fixes}`,
    }[tool];
    copy(wrap);
    toast.success(`Copied prompt for ${tool}`);
  };

  const API = process.env.REACT_APP_BACKEND_URL;
  const publicUrl = scan ? `${window.location.origin}/public/scan/${scan.id}` : "";
  const badgeUrl = scan ? `${API}/api/public/scans/${scan.id}/badge.svg` : "";
  const embedCode = scan
    ? `<a href="${publicUrl}" target="_blank" rel="noopener"><img src="${badgeUrl}" alt="GrowthLens Score ${scan.score ?? 0}/100" height="56"/></a>`
    : "";

  if (loading) return <div className="max-w-6xl mx-auto"><Skeleton className="h-40 w-full"/></div>;
  if (!scan) return <div>Scan not found.</div>;

  const r = scan.result || {};
  const isBiz = scan.mode === "business";
  const subs = r.subscores || {};
  const cmp = scan.comparison;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1" data-testid="results-back">
          <ArrowLeft className="w-4 h-4"/>Back
        </Link>
        <div className="flex gap-2 flex-wrap">
          {isBiz && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" data-testid="ai-export-trigger"><Bot className="w-4 h-4 mr-2"/>Copy for AI</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => aiExport("chatgpt")} data-testid="ai-export-chatgpt">Copy for ChatGPT</DropdownMenuItem>
                <DropdownMenuItem onClick={() => aiExport("claude")} data-testid="ai-export-claude">Copy for Claude</DropdownMenuItem>
                <DropdownMenuItem onClick={() => aiExport("cursor")} data-testid="ai-export-cursor">Copy for Cursor</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button variant="outline" size="sm" onClick={exportJson} data-testid="results-export-btn"><Download className="w-4 h-4 mr-2"/>Export JSON</Button>
          {isBiz && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" data-testid="share-trigger"><Share2 className="w-4 h-4 mr-2"/>Share</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => { copy(publicUrl); }} data-testid="share-copy-link">Copy public link</DropdownMenuItem>
                <DropdownMenuItem onClick={() => { copy(embedCode); }} data-testid="share-copy-embed">Copy embed code</DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open(badgeUrl, "_blank")} data-testid="share-open-badge">Open badge SVG</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {!isBiz && <Link to={`/planner?scan=${id}`}><Button size="sm" data-testid="results-plan-btn"><Calendar className="w-4 h-4 mr-2"/>Build content plan</Button></Link>}
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
          {r.scraped && (
            <div className="flex flex-wrap gap-2 pt-2">
              {r.scraped.has_https ? <Badge variant="outline" className="gap-1"><CheckCircle2 className="w-3 h-3 text-primary"/>HTTPS</Badge> : <Badge variant="outline" className="gap-1"><AlertTriangle className="w-3 h-3 text-accent"/>No HTTPS</Badge>}
              {r.scraped.has_viewport ? <Badge variant="outline" className="gap-1"><CheckCircle2 className="w-3 h-3 text-primary"/>Mobile viewport</Badge> : <Badge variant="outline" className="gap-1"><AlertTriangle className="w-3 h-3 text-accent"/>No viewport</Badge>}
              {r.scraped.emails_found?.length > 0 && <Badge variant="outline">{r.scraped.emails_found.length} emails</Badge>}
            </div>
          )}
        </div>
      </div>

      {isBiz && Object.keys(subs).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-px bg-border border border-border" data-testid="subscores">
          {SUBSCORE_KEYS.map(([k, label]) => {
            const v = subs[k] ?? 0;
            return (
              <div key={k} className="bg-card p-4" data-testid={`subscore-${k}`}>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
                <div className="font-display text-3xl font-black mt-1">{v}</div>
                <div className="mt-2 h-1 bg-muted rounded"><div className={`h-1 rounded ${barColor(v)}`} style={{ width: `${v}%` }}/></div>
              </div>
            );
          })}
        </div>
      )}

      {isBiz ? (
        <div className="grid md:grid-cols-2 gap-4">
          {r.screenshots?.desktop && (
            <div className="md:col-span-2">
              <Section title="Annotated screenshots" tid="results-screenshots">
                <Tabs defaultValue="desktop">
                  <TabsList>
                    <TabsTrigger value="desktop" data-testid="ss-tab-desktop"><Monitor className="w-3 h-3 mr-1"/>Desktop</TabsTrigger>
                    <TabsTrigger value="mobile" data-testid="ss-tab-mobile"><Smartphone className="w-3 h-3 mr-1"/>Mobile</TabsTrigger>
                  </TabsList>
                  {["desktop", "mobile"].map(view => (
                    <TabsContent key={view} value={view}>
                      <div className="relative border border-border rounded overflow-hidden bg-muted/30" style={{ aspectRatio: view === "desktop" ? "4/3" : "1/2" }}>
                        <img src={r.screenshots[view]} alt={`${view} screenshot`} className="absolute inset-0 w-full h-full object-cover object-top" onError={(e)=>{e.currentTarget.style.opacity="0.15";}}/>
                        {(r.screenshot_annotations || []).map((a, i) => (
                          <div
                            key={i}
                            className="absolute -translate-x-1/2 -translate-y-1/2 group"
                            style={{ left: `${a.x_pct}%`, top: `${a.y_pct}%` }}
                            data-testid={`annotation-${i}`}
                          >
                            <div className={`w-7 h-7 rounded-full grid place-items-center font-mono text-xs font-bold text-white ring-4 ring-background ${
                              a.color === "red" ? "bg-accent" : a.color === "yellow" ? "bg-yellow-500" : "bg-primary"
                            }`}>{i+1}</div>
                            <div className="hidden group-hover:block absolute left-8 top-0 bg-background border border-border rounded p-2 text-xs w-56 shadow-lg z-10">
                              <div className="font-semibold">{a.label}</div>
                              <div className="text-muted-foreground mt-1">{a.note}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 grid md:grid-cols-2 gap-2">
                        {(r.screenshot_annotations || []).map((a, i) => (
                          <div key={i} className="flex gap-2 items-start text-sm border border-border rounded p-2 bg-background">
                            <span className={`shrink-0 w-6 h-6 rounded-full grid place-items-center text-xs font-bold text-white ${
                              a.color === "red" ? "bg-accent" : a.color === "yellow" ? "bg-yellow-500" : "bg-primary"
                            }`}>{i+1}</span>
                            <div><div className="font-medium">{a.label}</div><div className="text-xs text-muted-foreground">{a.note}</div></div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </Section>
            </div>
          )}
          {(r.industry_insights || []).length > 0 && (
            <div className="md:col-span-2">
              <Section title={`Industry insights${r.industry_detected ? ` · ${r.industry_detected}` : ""}`} tid="results-industry">
                <ul className="grid md:grid-cols-2 gap-2">
                  {(r.industry_insights || []).map((x, i) => (
                    <li key={i} className="flex gap-2 text-sm border border-border rounded p-3 bg-background"><Wand2 className="w-4 h-4 text-primary mt-0.5 shrink-0"/>{x}</li>
                  ))}
                </ul>
              </Section>
            </div>
          )}
          <Section title="Top fixes (with copyable code)" tid="results-top-fixes">
            <div className="space-y-5">
              {(r.top_fixes || []).map((f, i) => <FixCard key={i} fix={f} i={i}/>)}
            </div>
          </Section>
          <Section title="Strengths" tid="results-strengths">
            <ul className="space-y-2">{(r.strengths || []).map((s,i)=><li key={i} className="flex gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0"/>{s}</li>)}</ul>
          </Section>

          <Section title="AI copywriting rewrites" tid="results-copy-rewrites">
            <div className="space-y-4">
              {(r.copywriting_rewrites || []).map((c, i) => (
                <div key={i} className="border border-border rounded p-3 bg-background" data-testid={`rewrite-${i}`}>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="capitalize">{(c.section || "").replaceAll("_", " ")}</Badge>
                    <Button size="sm" variant="ghost" onClick={()=>copy(c.after)} data-testid={`rewrite-${i}-copy`}><Copy className="w-3 h-3 mr-1"/>Copy new</Button>
                  </div>
                  <div className="text-xs text-muted-foreground">Before</div>
                  <div className="text-sm line-through decoration-accent/60 mb-2">{c.before}</div>
                  <div className="text-xs text-muted-foreground">After</div>
                  <div className="text-sm font-medium text-primary">{c.after}</div>
                  <div className="text-xs text-muted-foreground mt-2">{c.why}</div>
                </div>
              ))}
              {(!r.copywriting_rewrites || r.copywriting_rewrites.length === 0) && <p className="text-sm text-muted-foreground">Re-run this scan to generate copywriting rewrites.</p>}
            </div>
          </Section>

          <Section title="Trust & CTA gaps" tid="results-trust">
            <div className="space-y-3">
              <div><div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Trust</div><ul className="space-y-1 text-sm">{(r.trust_gaps||[]).map((x,i)=><li key={i}>· {x}</li>)}</ul></div>
              <div><div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">CTAs</div><ul className="space-y-1 text-sm">{(r.cta_issues||[]).map((x,i)=><li key={i}>· {x}</li>)}</ul></div>
            </div>
          </Section>
          <Section title="SEO & Mobile" tid="results-seo">
            <div className="space-y-3">
              <div><div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">SEO</div><ul className="space-y-1 text-sm">{(r.seo_issues||[]).map((x,i)=><li key={i}>· {x}</li>)}</ul></div>
              <div><div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Mobile</div><ul className="space-y-1 text-sm">{(r.mobile_issues||[]).map((x,i)=><li key={i}>· {x}</li>)}</ul></div>
            </div>
          </Section>

          <Section title="Outreach email drafts" tid="results-emails">
            <div className="space-y-4">
              {(r.outreach_emails||[]).map((em, i) => (
                <div key={i} className="border border-border rounded p-4 bg-background">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{em.angle}</div>
                      <div className="font-medium">{em.subject}</div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={()=>copy(`Subject: ${em.subject}\n\n${em.body}`)} data-testid={`copy-email-${i}`}><Copy className="w-3 h-3"/></Button>
                  </div>
                  <p className="text-sm mt-2 whitespace-pre-line text-muted-foreground">{em.body}</p>
                </div>
              ))}
            </div>
          </Section>
          <Section title="Sales pitch angles" tid="results-pitches">
            <ul className="space-y-3">
              {(r.sales_pitches||[]).map((p,i)=>(
                <li key={i}><div className="font-medium">{p.angle}</div><div className="text-sm text-muted-foreground mt-1">{p.pitch}</div></li>
              ))}
            </ul>
          </Section>

          <Section title="Leads found" tid="results-leads">
            {(r.leads||[]).length === 0 ? <p className="text-sm text-muted-foreground">No public leads surfaced for this site.</p> : (
              <div className="divide-y divide-border -m-5">
                {(r.leads||[]).map((l,i)=>(
                  <div key={i} className="p-4 flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{l.name}</div>
                      <div className="text-xs text-muted-foreground">{l.role}</div>
                      <div className="text-xs text-muted-foreground mt-1">{l.email} {l.phone && `· ${l.phone}`}</div>
                    </div>
                    {l.email && <Button size="sm" variant="outline" onClick={()=>copy(l.email)}><Mail className="w-3 h-3 mr-1"/>Copy</Button>}
                  </div>
                ))}
              </div>
            )}
          </Section>
          <Section title="Next-step checklist" tid="results-checklist">
            <ul className="space-y-2">{(r.checklist||[]).map((x,i)=><li key={i} className="flex gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0"/>{x}</li>)}</ul>
          </Section>

          {/* Competitor comparison — spans both cols */}
          <div className="md:col-span-2">
            <Section title="Competitor comparison" tid="results-compare" action={
              <div className="flex gap-2">
                <Input placeholder="https://competitor.com" value={compUrl} onChange={(e)=>setCompUrl(e.target.value)} className="h-8 w-56" data-testid="compare-input"/>
                <Button size="sm" onClick={runCompare} disabled={comparing} data-testid="compare-run-btn">
                  {comparing ? <Loader2 className="w-3 h-3 animate-spin mr-1"/> : <Swords className="w-3 h-3 mr-1"/>}Compare
                </Button>
              </div>
            }>
              {!cmp ? (
                <p className="text-sm text-muted-foreground">Paste a competitor URL to see a side-by-side scorecard.</p>
              ) : (
                <div className="space-y-4" data-testid="compare-output">
                  <div className="flex items-center gap-3">
                    <Trophy className={`w-5 h-5 ${cmp.winner === "mine" ? "text-primary" : cmp.winner === "competitor" ? "text-accent" : "text-muted-foreground"}`}/>
                    <div className="text-sm">{cmp.verdict}</div>
                  </div>
                  <div className="border border-border rounded overflow-hidden">
                    <div className="grid grid-cols-3 text-xs uppercase tracking-widest bg-muted/40 p-2">
                      <div>Metric</div><div className="text-center">You</div><div className="text-center break-all">{cmp.competitor_url}</div>
                    </div>
                    {SUBSCORE_KEYS.map(([k, label]) => {
                      const m = cmp.subscores?.[k]?.mine ?? 0;
                      const c = cmp.subscores?.[k]?.competitor ?? 0;
                      return (
                        <div key={k} className="grid grid-cols-3 items-center p-2 border-t border-border text-sm" data-testid={`compare-row-${k}`}>
                          <div>{label}</div>
                          <div className={`text-center font-mono font-semibold ${m >= c ? "text-primary" : "text-muted-foreground"}`}>{m}</div>
                          <div className={`text-center font-mono font-semibold ${c > m ? "text-accent" : "text-muted-foreground"}`}>{c}</div>
                        </div>
                      );
                    })}
                    <div className="grid grid-cols-3 items-center p-2 border-t border-border bg-muted/20 font-semibold">
                      <div>Overall</div>
                      <div className="text-center font-mono">{cmp.overall?.mine ?? 0}</div>
                      <div className="text-center font-mono">{cmp.overall?.competitor ?? 0}</div>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-3 gap-3">
                    <div><div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Where they win</div><ul className="space-y-1 text-sm">{(cmp.where_they_win||[]).map((x,i)=><li key={i}>· {x}</li>)}</ul></div>
                    <div><div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Where you win</div><ul className="space-y-1 text-sm">{(cmp.where_you_win||[]).map((x,i)=><li key={i}>· {x}</li>)}</ul></div>
                    <div><div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Steal this</div><ul className="space-y-1 text-sm">{(cmp.steal_this||[]).map((x,i)=><li key={i} className="flex gap-1"><Wand2 className="w-3 h-3 text-primary mt-1 shrink-0"/>{x}</li>)}</ul></div>
                  </div>
                </div>
              )}
            </Section>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          <Section title="Niche clarity & pillars" tid="creator-niche">
            <p className="text-sm text-muted-foreground mb-3">{r.niche_clarity}</p>
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Pillars</div>
            <div className="flex flex-wrap gap-2">{(r.content_pillars||[]).map((p,i)=><Badge key={i} variant="outline">{p}</Badge>)}</div>
          </Section>
          <Section title="Audience signals" tid="creator-audience">
            <ul className="space-y-1 text-sm">{(r.audience_signals||[]).map((x,i)=><li key={i}>· {x}</li>)}</ul>
          </Section>
          <Section title="Strengths" tid="creator-strengths">
            <ul className="space-y-2">{(r.strengths||[]).map((s,i)=><li key={i} className="flex gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0"/>{s}</li>)}</ul>
          </Section>
          <Section title="What to fix" tid="creator-weaknesses">
            <ul className="space-y-2">{(r.weaknesses||[]).map((s,i)=><li key={i} className="flex gap-2 text-sm"><AlertTriangle className="w-4 h-4 text-accent mt-0.5 shrink-0"/>{s}</li>)}</ul>
          </Section>
          <Section title="Bio / CTA / Layout improvements" tid="creator-bio">
            <div className="space-y-3 text-sm">
              <div><div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Bio</div><ul className="space-y-1">{(r.bio_improvements||[]).map((x,i)=><li key={i}>· {x}</li>)}</ul></div>
              <div><div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">CTA</div><ul className="space-y-1">{(r.cta_improvements||[]).map((x,i)=><li key={i}>· {x}</li>)}</ul></div>
              <div><div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Profile layout</div><ul className="space-y-1">{(r.profile_layout_improvements||[]).map((x,i)=><li key={i}>· {x}</li>)}</ul></div>
            </div>
          </Section>
          <Section title="Hooks to test" tid="creator-hooks">
            <ul className="space-y-2 text-sm">{(r.hooks||[]).map((h,i)=><li key={i} className="border-l-2 border-accent pl-3">{h}</li>)}</ul>
          </Section>
          <Section title="10 post ideas" tid="creator-posts">
            <div className="space-y-3">
              {(r.post_ideas||[]).map((p,i)=>(
                <div key={i} className="border border-border rounded p-3 bg-background">
                  <div className="flex items-center gap-2 mb-1"><Badge variant="outline" className="capitalize">{p.format}</Badge><div className="font-medium">{p.title}</div></div>
                  <div className="text-sm"><span className="font-medium">Hook:</span> {p.hook}</div>
                  <div className="text-xs text-muted-foreground mt-1">{p.why}</div>
                </div>
              ))}
            </div>
          </Section>
          <Section title="Captions & hashtags" tid="creator-captions">
            <div className="space-y-3">
              {(r.captions||[]).map((c,i)=>(
                <div key={i} className="border border-border rounded p-3 bg-background">
                  <p className="text-sm whitespace-pre-line">{c.caption}</p>
                  <div className="flex flex-wrap gap-1 mt-2">{(c.hashtags||[]).map((h,j)=><span key={j} className="text-xs font-mono text-primary">#{h.replace(/^#/, "")}</span>)}</div>
                  <Button size="sm" variant="ghost" className="mt-2" onClick={()=>copy(`${c.caption}\n\n${(c.hashtags||[]).map(h=>`#${h.replace(/^#/,"")}`).join(" ")}`)} data-testid={`copy-caption-${i}`}><Copy className="w-3 h-3 mr-1"/>Copy</Button>
                </div>
              ))}
            </div>
          </Section>
          <Section title="Next-step checklist" tid="creator-checklist">
            <ul className="space-y-2">{(r.checklist||[]).map((x,i)=><li key={i} className="flex gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0"/>{x}</li>)}</ul>
          </Section>
        </div>
      )}
    </div>
  );
}
