import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { Download, Trash2, Globe, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function Reports() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => api.get("/scans").then(r => setScans(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    if (!window.confirm("Delete this scan?")) return;
    await api.delete(`/scans/${id}`);
    toast.success("Deleted");
    load();
  };

  const exportAll = () => {
    const blob = new Blob([JSON.stringify(scans, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `growthlens-reports.json`;
    a.click();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Reports</div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mt-1">All saved scans</h1>
        </div>
        <Button variant="outline" onClick={exportAll} data-testid="reports-export-all"><Download className="w-4 h-4 mr-2"/>Export all</Button>
      </div>

      {loading ? <Skeleton className="h-40"/> : scans.length === 0 ? (
        <div className="border border-dashed border-border rounded p-10 text-center text-muted-foreground bg-card" data-testid="reports-empty">No scans yet.</div>
      ) : (
        <div className="border border-border rounded bg-card divide-y divide-border" data-testid="reports-list">
          {scans.map(s => (
            <div key={s.id} className="p-4 flex items-center justify-between gap-3 flex-wrap" data-testid={`report-row-${s.id}`}>
              <Link to={`/scan/${s.id}`} className="flex items-center gap-3 min-w-0 flex-1 hover:underline">
                {s.mode === "business" ? <Globe className="w-4 h-4 text-primary shrink-0"/> : <Sparkles className="w-4 h-4 text-accent shrink-0"/>}
                <div className="min-w-0">
                  <div className="font-medium truncate">{s.target}</div>
                  <div className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleString()} · <span className="capitalize">{s.mode}</span></div>
                </div>
              </Link>
              <div className="flex items-center gap-2">
                {s.status === "complete"
                  ? <Badge variant="outline" className="font-mono">{s.score ?? 0}/100</Badge>
                  : <Badge variant="secondary" className="capitalize">{s.status}</Badge>}
                <Button variant="ghost" size="icon" onClick={()=>remove(s.id)} data-testid={`delete-${s.id}`}><Trash2 className="w-4 h-4 text-accent"/></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
