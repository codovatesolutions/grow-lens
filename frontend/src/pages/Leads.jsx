import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import { Mail, Phone, Copy } from "lucide-react";
import { toast } from "sonner";

export default function Leads() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get("/scans").then(r => setScans(r.data)).finally(() => setLoading(false)); }, []);

  const allLeads = scans.filter(s => s.mode === "business" && s.status === "complete")
    .flatMap(s => ((s.result?.leads) || []).map(l => ({ ...l, source_url: s.target, scan_id: s.id })));

  const copy = (t) => { navigator.clipboard.writeText(t); toast.success("Copied"); };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Lead list</div>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mt-1">Public leads from your scans</h1>
        <p className="text-muted-foreground mt-2">Extracted from publicly available business pages. {allLeads.length} total.</p>
      </div>

      {loading ? <Skeleton className="h-40 w-full"/> : allLeads.length === 0 ? (
        <div className="border border-dashed border-border rounded p-10 text-center bg-card text-muted-foreground" data-testid="leads-empty">
          No leads yet. Run a business scan to surface contacts.
        </div>
      ) : (
        <div className="border border-border rounded bg-card divide-y divide-border" data-testid="leads-list">
          {allLeads.map((l, i) => (
            <div key={i} className="p-4 flex flex-wrap items-start justify-between gap-3" data-testid={`lead-row-${i}`}>
              <div className="min-w-0">
                <div className="font-medium">{l.name || "Unknown"}</div>
                <div className="text-xs text-muted-foreground">{l.role}</div>
                <div className="text-xs text-muted-foreground mt-1 truncate">From: {l.source_url}</div>
                {l.notes && <div className="text-sm mt-2 text-muted-foreground">{l.notes}</div>}
              </div>
              <div className="flex gap-2 flex-wrap">
                {l.email && <Button size="sm" variant="outline" onClick={()=>copy(l.email)}><Mail className="w-3 h-3 mr-1"/>{l.email}</Button>}
                {l.phone && <Button size="sm" variant="outline" onClick={()=>copy(l.phone)}><Phone className="w-3 h-3 mr-1"/>{l.phone}</Button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
