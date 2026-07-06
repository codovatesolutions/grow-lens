import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Globe, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function NewScan() {
  const nav = useNavigate();
  const [mode, setMode] = useState("business");
  const [target, setTarget] = useState("");
  const [notes, setNotes] = useState("");
  const [industry, setIndustry] = useState("auto");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!target.trim()) { toast.error("Enter a URL or profile link"); return; }
    setBusy(true);
    try {
      const payload = { mode, target: target.trim(), notes };
      if (mode === "business") payload.industry = industry;
      const { data } = await api.post("/scans", payload);
      toast.success("Scan complete");
      nav(`/scan/${data.id}`);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Scan failed");
    } finally { setBusy(false); }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">New scan</div>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mt-1">What should we analyze?</h1>
        <p className="text-muted-foreground mt-2">Pick a mode, paste a link, and we'll do the rest.</p>
      </div>

      <Tabs value={mode} onValueChange={setMode}>
        <TabsList className="grid grid-cols-2 w-full" data-testid="scan-mode-tabs">
          <TabsTrigger value="business" data-testid="scan-tab-business"><Globe className="w-4 h-4 mr-2"/>Business website</TabsTrigger>
          <TabsTrigger value="creator" data-testid="scan-tab-creator"><Sparkles className="w-4 h-4 mr-2"/>Creator profile</TabsTrigger>
        </TabsList>

        <TabsContent value="business" className="mt-6 space-y-5">
          <div className="space-y-2">
            <Label>Website URL</Label>
            <Input placeholder="https://acme.com" value={target} onChange={(e)=>setTarget(e.target.value)} data-testid="scan-business-url"/>
            <p className="text-xs text-muted-foreground">We'll read your homepage, CTAs, trust elements, and contact paths. Public data only.</p>
          </div>
          <div className="space-y-2">
            <Label>Industry</Label>
            <Select value={industry} onValueChange={setIndustry}>
              <SelectTrigger data-testid="scan-industry-select"><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto-detect</SelectItem>
                <SelectItem value="saas">SaaS / Software</SelectItem>
                <SelectItem value="ecommerce">E-commerce</SelectItem>
                <SelectItem value="restaurant">Restaurant / Food</SelectItem>
                <SelectItem value="portfolio">Portfolio / Personal</SelectItem>
                <SelectItem value="agency">Agency / Services</SelectItem>
                <SelectItem value="hospital">Hospital / Clinic</SelectItem>
                <SelectItem value="school">School / Education</SelectItem>
                <SelectItem value="realestate">Real estate</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Get industry-specific fixes tuned to your vertical.</p>
          </div>
          <div className="space-y-2">
            <Label>Anything we should know? (optional)</Label>
            <Textarea placeholder="e.g., We're a B2B SaaS targeting HR teams." rows={3} value={notes} onChange={(e)=>setNotes(e.target.value)} data-testid="scan-business-notes"/>
          </div>
        </TabsContent>

        <TabsContent value="creator" className="mt-6 space-y-5">
          <div className="space-y-2">
            <Label>Profile link(s)</Label>
            <Textarea placeholder="https://instagram.com/yourhandle, https://linkedin.com/in/you" rows={3} value={target} onChange={(e)=>setTarget(e.target.value)} data-testid="scan-creator-target"/>
            <p className="text-xs text-muted-foreground">Add one or several. We score positioning, content pillars, and engagement style.</p>
          </div>
          <div className="space-y-2">
            <Label>Niche / goal (optional)</Label>
            <Textarea placeholder="e.g., Personal finance for Gen Z, monetize via courses." rows={3} value={notes} onChange={(e)=>setNotes(e.target.value)} data-testid="scan-creator-notes"/>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button size="lg" onClick={submit} disabled={busy} className="gap-2" data-testid="scan-submit-btn">
          {busy ? <><Loader2 className="w-4 h-4 animate-spin"/>Analyzing... (15-30s)</> : <>Run scan</>}
        </Button>
      </div>
    </div>
  );
}
