import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { ArrowUpRight, Plus, Globe, Sparkles } from "lucide-react";
import { Skeleton } from "../components/ui/skeleton";

const StatCard = ({ label, value, hint, tid }) => (
  <div className="p-6 bg-card" data-testid={tid}>
    <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
    <div className="font-display text-4xl font-black mt-2">{value}</div>
    {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
  </div>
);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/stats"), api.get("/scans")])
      .then(([s, sc]) => { setStats(s.data); setScans(sc.data); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Dashboard</div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mt-1">Your growth lens</h1>
        </div>
        <Link to="/scan/new"><Button className="gap-2" data-testid="dashboard-new-scan-btn"><Plus className="w-4 h-4" />New scan</Button></Link>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-4 gap-px bg-border border border-border">
          {[1,2,3,4].map(i => <div key={i} className="p-6 bg-card"><Skeleton className="h-4 w-24"/><Skeleton className="h-10 w-16 mt-3"/></div>)}
        </div>
      ) : (
        <div className="grid md:grid-cols-4 gap-px bg-border border border-border">
          <StatCard tid="stat-total-scans" label="Total scans" value={stats?.total_scans ?? 0} />
          <StatCard tid="stat-avg-business" label="Avg business score" value={stats?.avg_business_score ?? 0} hint={`${stats?.business_scans ?? 0} business scans`} />
          <StatCard tid="stat-avg-creator" label="Avg creator score" value={stats?.avg_creator_score ?? 0} hint={`${stats?.creator_scans ?? 0} creator scans`} />
          <StatCard tid="stat-leads" label="Leads surfaced" value={stats?.total_leads ?? 0} hint={`${stats?.total_action_items ?? 0} action items`} />
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold tracking-tight">Recent scans</h2>
          <Link to="/reports" className="text-sm text-primary hover:underline" data-testid="dashboard-view-all">View all</Link>
        </div>
        {scans.length === 0 ? (
          <div className="border border-dashed border-border rounded-md p-10 text-center bg-card">
            <p className="text-muted-foreground mb-4">No scans yet. Run your first one in under a minute.</p>
            <Link to="/scan/new"><Button data-testid="dashboard-empty-cta"><Plus className="w-4 h-4 mr-2"/>Start a scan</Button></Link>
          </div>
        ) : (
          <div className="border border-border rounded-md overflow-hidden bg-card divide-y divide-border" data-testid="dashboard-scans-list">
            {scans.slice(0,8).map((s) => (
              <Link key={s.id} to={`/scan/${s.id}`} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors" data-testid={`scan-row-${s.id}`}>
                <div className="flex items-center gap-3 min-w-0">
                  {s.mode === "business" ? <Globe className="w-4 h-4 text-primary shrink-0"/> : <Sparkles className="w-4 h-4 text-accent shrink-0"/>}
                  <div className="min-w-0">
                    <div className="font-medium truncate">{s.target}</div>
                    <div className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleString()} · <span className="capitalize">{s.mode}</span></div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {s.status === "complete" ? (
                    <Badge variant="outline" className="font-mono">{s.score ?? 0}/100</Badge>
                  ) : (
                    <Badge variant="secondary" className="capitalize">{s.status}</Badge>
                  )}
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground"/>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
