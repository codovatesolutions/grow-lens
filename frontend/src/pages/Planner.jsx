import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { CalendarDays, Loader2, Copy } from "lucide-react";
import { toast } from "sonner";

export default function Planner() {
  const [params] = useSearchParams();
  const preset = params.get("scan") || "";
  const [scans, setScans] = useState([]);
  const [scanId, setScanId] = useState(preset);
  const [days, setDays] = useState("7");
  const [plan, setPlan] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { api.get("/scans").then(r => setScans(r.data.filter(s => s.mode === "creator" && s.status === "complete"))); }, []);

  const run = async () => {
    if (!scanId) { toast.error("Pick a creator scan"); return; }
    setBusy(true); setPlan(null);
    try {
      const { data } = await api.post("/content-plan", { scan_id: scanId, days: parseInt(days) });
      setPlan(data.plan);
      toast.success("Plan ready");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Plan failed");
    } finally { setBusy(false); }
  };

  const copy = (t) => { navigator.clipboard.writeText(t); toast.success("Copied"); };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Content planner</div>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mt-1">Plan the next 7 or 30 days</h1>
        <p className="text-muted-foreground mt-2">Pick a creator scan and we'll generate a daily plan with hooks, formats, and best post times.</p>
      </div>

      <div className="border border-border bg-card rounded p-5 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Creator scan</div>
          <Select value={scanId} onValueChange={setScanId}>
            <SelectTrigger data-testid="planner-scan-select"><SelectValue placeholder="Choose a creator scan"/></SelectTrigger>
            <SelectContent>
              {scans.map(s => <SelectItem key={s.id} value={s.id}>{s.target}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Days</div>
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-28" data-testid="planner-days-select"><SelectValue/></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={run} disabled={busy} className="gap-2" data-testid="planner-run-btn">
          {busy ? <><Loader2 className="w-4 h-4 animate-spin"/>Building...</> : <><CalendarDays className="w-4 h-4"/>Generate</>}
        </Button>
      </div>

      {plan && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3" data-testid="planner-output">
          {(plan.days || []).map((d, i) => (
            <div key={i} className="border border-border bg-card rounded p-4">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className="font-mono">{d.date_label || `Day ${d.day || i+1}`}</Badge>
                <Badge variant="secondary" className="capitalize text-xs">{d.platform} · {d.format}</Badge>
              </div>
              <div className="font-display font-semibold">{d.title}</div>
              <div className="text-sm mt-2"><span className="font-medium">Hook:</span> {d.hook}</div>
              <div className="text-xs text-muted-foreground mt-2 whitespace-pre-line">{d.caption}</div>
              <div className="text-xs mt-2"><span className="font-medium">CTA:</span> {d.cta}</div>
              <div className="text-xs text-muted-foreground mt-1">Best time: {d.best_time}</div>
              <Button variant="ghost" size="sm" className="mt-3" onClick={()=>copy(`${d.title}\n\n${d.hook}\n\n${d.caption}\n\nCTA: ${d.cta}`)}><Copy className="w-3 h-3 mr-1"/>Copy</Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
