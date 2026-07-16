"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Shell from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Globe, Sparkles, Loader2, ArrowRight } from "lucide-react";

export default function NewScanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"business" | "creator">("business");
  const [target, setTarget] = useState("");
  const [industry, setIndustry] = useState("auto");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedTarget = target.trim();
    if (!trimmedTarget) {
      toast.error("Please enter a target URL or profile handle");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/scans", {
        mode,
        target: trimmedTarget,
        industry: mode === "business" ? industry : undefined,
        notes: notes.trim(),
      });

      toast.success("Scan initiated successfully!");
      
      // Redirect to the scan results page which will poll for progress
      router.push(`/results/${response.data.id}`);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.detail || "Failed to start scan. Please check the URL and try again.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Analyst</div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mt-1">
            New Scan <span className="text-primary">&bull;</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure and launch a new AI evaluation of your digital presence.
          </p>
        </div>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Scan Configuration</CardTitle>
            <CardDescription>
              Choose what to scan and customize the context for our AI conversion engines.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Scan Mode Toggle */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">Audit Target Type</label>
                <Tabs value={mode} onValueChange={(val: any) => setMode(val)} className="w-full">
                  <TabsList className="grid grid-cols-2 w-full">
                    <TabsTrigger value="business" className="gap-2">
                      <Globe className="w-4 h-4" />
                      Business Website
                    </TabsTrigger>
                    <TabsTrigger value="creator" className="gap-2">
                      <Sparkles className="w-4 h-4" />
                      Creator Profile
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Target Input */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">
                  {mode === "business" ? "Website URL" : "Social Profile URL / Handle"}
                </label>
                <Input
                  type="text"
                  placeholder={
                    mode === "business"
                      ? "https://yourcompany.com"
                      : "https://instagram.com/yourprofile or @yourhandle"
                  }
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  disabled={loading}
                  required
                  className="bg-background border-border"
                />
                <p className="text-xs text-muted-foreground">
                  {mode === "business"
                    ? "Enter a clean company or business landing page."
                    : "Enter a public social link from Instagram, TikTok, YouTube, etc."}
                </p>
              </div>

              {/* Industry Hint - Only for Business mode */}
              {mode === "business" && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Industry Focus</label>
                  <Select value={industry} onValueChange={setIndustry} disabled={loading}>
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue placeholder="Auto-detect" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto-detect industry</SelectItem>
                      <SelectItem value="saas">SaaS / Software</SelectItem>
                      <SelectItem value="ecommerce">E-commerce / Retail</SelectItem>
                      <SelectItem value="agency">Professional Services / Agency</SelectItem>
                      <SelectItem value="restaurant">Restaurant / Food</SelectItem>
                      <SelectItem value="realestate">Real Estate</SelectItem>
                      <SelectItem value="hospital">Health / Medical</SelectItem>
                      <SelectItem value="school">Education / E-learning</SelectItem>
                      <SelectItem value="blog">Blog / Content site</SelectItem>
                      <SelectItem value="other">Other / General</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Helps tailor recommendations and benchmarks to your industry standards.
                  </p>
                </div>
              )}

              {/* Custom Notes */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">
                  Goal & Context <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
                </label>
                <Textarea
                  placeholder="e.g. We want to improve our CTA click-through rate, our target audience is B2B sales leads, or we recently updated our styling."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={loading}
                  rows={3}
                  className="bg-background border-border resize-none"
                />
              </div>

              <div className="pt-2">
                <Button type="submit" size="lg" className="w-full gap-2" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing Page & Running AI Audit...
                    </>
                  ) : (
                    <>
                      Run Growth Audit
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}
