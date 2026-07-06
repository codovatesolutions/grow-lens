import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import ScoreRing from "../components/ScoreRing";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import {
  ArrowLeft, Download, Mail, AlertTriangle, CheckCircle2, Sparkles,
  Globe, Copy, Calendar,
} from "lucide-react";
import { toast } from "sonner";

const Section = ({ title, children, tid }) => (
  <section data-testid={tid} className="border border-border bg-card rounded-md">
    <div className="px-5 py-3 border-b border-border">
      <div className="font-display text-sm uppercase tracking-[0.2em] text-muted-foreground">{title}</div>
    </div>
    <div className="p-5">{children}</div>
  </section>
);

const PRIO = {
  high: "bg-accent/15 text-accent border-accent/30",
  medium: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30",
  low: "bg-primary/15 text-primary border-primary/30",
};

export default function Results() {
  const { id } = useParams();
  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="max-w-6xl mx-auto"><Skeleton className="h-40 w-full"/></div>;
  if (!scan) return <div>Scan not found.</div>;

  const r = scan.result || {};
  const isBiz = scan.mode === "business";

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1" data-testid="results-back">
          <ArrowLeft className="w-4 h-4"/>Back
        </Link>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportJson} data-testid="results-export-btn"><Download className="w-4 h-4 mr-2"/>Export JSON</Button>
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

      {isBiz ? (
        <div className="grid md:grid-cols-2 gap-4">
          <Section title="Top fixes (ranked)" tid="results-top-fixes">
            <ol className="space-y-4">
              {(r.top_fixes || []).map((f, i) => (
                <li key={i} className="border-l-2 border-primary pl-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-display font-semibold">{i+1}. {f.title}</div>
                    <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded border ${PRIO[f.priority] || PRIO.medium}`}>{f.priority}</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1"><span className="font-medium text-foreground">Why:</span> {f.why}</div>
                  <div className="text-sm mt-1"><span className="font-medium">Do this:</span> {f.action}</div>
                </li>
              ))}
            </ol>
          </Section>
          <Section title="Strengths" tid="results-strengths">
            <ul className="space-y-2">{(r.strengths || []).map((s,i)=><li key={i} className="flex gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0"/>{s}</li>)}</ul>
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
