import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import ScoreRing from "../components/ScoreRing";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import { Telescope, ArrowRight, CheckCircle2 } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const SUBS = [["trust","Trust"],["conversion","Conversion"],["ux","UX"],["copywriting","Copy"],["brand","Brand"],["seo","SEO"]];
const bar = (v) => v >= 75 ? "bg-primary" : v >= 50 ? "bg-yellow-500" : "bg-accent";

export default function PublicScan() {
  const { id } = useParams();
  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/public/scans/${id}`).then(r => setScan(r.data)).catch(()=>{}).finally(()=>setLoading(false));
  }, [id]);

  if (loading) return <div className="min-h-screen grid place-items-center"><Skeleton className="h-40 w-96"/></div>;
  if (!scan) return <div className="min-h-screen grid place-items-center text-muted-foreground">Public scan not found or still processing.</div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2"><Telescope className="w-5 h-5 text-primary"/><span className="font-display text-lg font-bold">GrowthLens<span className="text-primary">.</span></span></Link>
          <Link to="/signup"><Button size="sm" data-testid="public-signup-btn">Scan your site <ArrowRight className="w-3 h-3 ml-1"/></Button></Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-12 space-y-8">
        <div className="border border-border bg-card rounded p-6 md:p-8 grid md:grid-cols-12 gap-6 items-center" data-testid="public-scan-card">
          <div className="md:col-span-3 flex md:block justify-center">
            <ScoreRing score={scan.score || 0}/>
          </div>
          <div className="md:col-span-9 space-y-3">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Public scan report</div>
            <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight break-all">{scan.target}</h1>
            <p className="text-muted-foreground leading-relaxed">{scan.summary}</p>
          </div>
        </div>

        {scan.subscores && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-px bg-border border border-border">
            {SUBS.map(([k, label])=>{
              const v = scan.subscores[k] ?? 0;
              return (
                <div key={k} className="bg-card p-4">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
                  <div className="font-display text-3xl font-black mt-1">{v}</div>
                  <div className="mt-2 h-1 bg-muted rounded"><div className={`h-1 rounded ${bar(v)}`} style={{ width: `${v}%` }}/></div>
                </div>
              );
            })}
          </div>
        )}

        {scan.screenshots?.desktop && (
          <div className="border border-border rounded overflow-hidden bg-muted/30" style={{ aspectRatio: "4/3" }}>
            <img src={scan.screenshots.desktop} alt="site preview" className="w-full h-full object-cover object-top"/>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          <div className="border border-border bg-card rounded p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Strengths</div>
            <ul className="space-y-2 text-sm">
              {(scan.strengths || []).map((s,i)=><li key={i} className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0"/>{s}</li>)}
            </ul>
          </div>
          <div className="border border-border bg-card rounded p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Top issues</div>
            <ol className="space-y-2 text-sm">
              {(scan.top_fixes_titles || []).map((t,i)=><li key={i}>{i+1}. {t}</li>)}
            </ol>
            <p className="text-xs text-muted-foreground mt-4">Sign up to see the "why", the code fix, and the full outreach + content plan.</p>
          </div>
        </div>

        <div className="text-center py-6">
          <Badge variant="outline" className="mb-3">Verified by GrowthLens</Badge>
          <div className="font-display text-2xl font-bold">{scan.score}/100</div>
          <Link to="/signup" className="inline-block mt-4"><Button size="lg" data-testid="public-cta-btn">Scan my site free <ArrowRight className="w-4 h-4 ml-2"/></Button></Link>
        </div>
      </div>
    </div>
  );
}
