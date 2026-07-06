import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { Sparkles, ArrowUpRight } from "lucide-react";

export default function CreatorInsights() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get("/scans").then(r => setScans(r.data.filter(s => s.mode === "creator"))).finally(() => setLoading(false)); }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Creator insights</div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mt-1">Your creator scans</h1>
        </div>
        <Link to="/scan/new"><Button data-testid="creator-new-scan-btn"><Sparkles className="w-4 h-4 mr-2"/>New creator scan</Button></Link>
      </div>

      {loading ? <Skeleton className="h-40 w-full"/> : scans.length === 0 ? (
        <div className="border border-dashed border-border rounded p-10 text-center bg-card text-muted-foreground" data-testid="creator-empty">
          No creator scans yet.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4" data-testid="creator-scans-grid">
          {scans.map(s => (
            <Link key={s.id} to={`/scan/${s.id}`} className="border border-border bg-card rounded p-5 hover:bg-muted/30 transition-colors" data-testid={`creator-card-${s.id}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="font-display text-lg font-semibold break-all">{s.target}</div>
                <Badge variant="outline" className="font-mono shrink-0">{s.score ?? 0}/100</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{s.result?.summary}</p>
              <div className="flex flex-wrap gap-1 mt-3">{(s.result?.content_pillars||[]).slice(0,4).map((p,i)=><Badge key={i} variant="secondary" className="text-xs">{p}</Badge>)}</div>
              <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
                <span>{new Date(s.created_at).toLocaleDateString()}</span>
                <ArrowUpRight className="w-4 h-4"/>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
