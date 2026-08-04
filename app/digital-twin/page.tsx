"use client";

import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Brain, Sparkles, Send, User, RefreshCw, CheckCircle2, ShieldCheck, Zap } from "lucide-react";

export default function DigitalTwinPage() {
  const [profile, setProfile] = useState<any>({
    brand_voice: "Professional, direct, and value-oriented",
    target_audience: "B2B Founders, marketing leads, and growth agencies",
    products_json: ["LensGrowth OS", "AI Audit Suite"],
    pricing_model: "$49/mo SaaS Freemium",
    memory_context: "Focusing on scaling conversion optimization and security header compliance.",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [history, setHistory] = useState<Array<{ q: string; a: string }>>([
    {
      q: "How would Apple improve my homepage copy?",
      a: "Apple would simplify your headline to 4 bold words focusing on benefit over features, move the primary CTA above the fold with zero distractions, and replace dense text with high-resolution visual proof of results.",
    },
  ]);

  useEffect(() => {
    async function loadTwin() {
      try {
        const { data } = await api.get("/digital-twin");
        if (data && data.brand_voice) setProfile(data);
      } catch (err: any) {
        console.log("Using default twin profile");
      } finally {
        setLoading(false);
      }
    }
    loadTwin();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/digital-twin", profile);
      toast.success("AI Digital Twin memory updated!");
    } catch (err: any) {
      toast.error("Failed to save digital twin memory");
    } finally {
      setSaving(false);
    }
  };

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || asking) return;
    const qText = question.trim();
    setQuestion("");
    setAsking(true);
    try {
      const { data } = await api.post("/digital-twin/ask", { question: qText });
      setHistory((prev) => [{ q: qText, a: data.answer || "No response generated." }, ...prev]);
    } catch (err: any) {
      toast.error("AI Business Brain failed to respond");
    } finally {
      setAsking(false);
    }
  };

  return (
    <Shell>
      <div className="space-y-6 max-w-6xl mx-auto" data-testid="digital-twin-page">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Brain className="w-6 h-6 text-primary" /> AI Digital Twin & Business Brain
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Your business&apos;s persistent AI memory model. Answers strategy questions specifically for your brand.
            </p>
          </div>
          <Badge variant="outline" className="font-mono text-xs px-3 py-1.5 border-primary/40 bg-primary/5 text-primary">
            <Zap className="w-3.5 h-3.5 mr-1 animate-pulse" /> Memory Synced
          </Badge>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Twin Profile Memory Config */}
          <Card className="lg:col-span-5 p-6 space-y-4 h-fit">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <h2 className="font-display font-bold text-lg">Persistent Memory</h2>
            </div>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label>Brand Voice & Persona</Label>
                  <Input
                    value={profile.brand_voice || ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile({ ...profile, brand_voice: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Target Audience</Label>
                  <Input
                    value={profile.target_audience || ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile({ ...profile, target_audience: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pricing Model</Label>
                  <Input
                    value={profile.pricing_model || ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile({ ...profile, pricing_model: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Core Business Memory & Goals</Label>
                  <Textarea
                    rows={3}
                    value={profile.memory_context || ""}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setProfile({ ...profile, memory_context: e.target.value })}
                  />
                </div>
                <Button type="submit" disabled={saving} className="w-full">
                  {saving ? "Updating Memory..." : "Save Memory Profile"}
                </Button>
              </form>
            )}
          </Card>

          {/* AI Business Brain Q&A */}
          <Card className="lg:col-span-7 p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h2 className="font-display font-bold text-lg">Ask Your Business Brain</h2>
                </div>
                <span className="text-xs text-muted-foreground font-mono">Tuned to your brand</span>
              </div>

              {/* Suggestions */}
              <div className="flex flex-wrap gap-2 text-xs">
                {[
                  "How would Apple improve my homepage?",
                  "Rewrite my pricing page headline.",
                  "How do I reach $100k MRR?",
                  "What should I post tomorrow?",
                ].map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setQuestion(s)}
                    className="px-2.5 py-1 rounded-full bg-muted/60 hover:bg-muted border border-border text-muted-foreground hover:text-foreground transition text-left"
                  >
                    &ldquo;{s}&rdquo;
                  </button>
                ))}
              </div>

              {/* Chat History */}
              <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                {history.map((h, i) => (
                  <div key={i} className="space-y-2 border-b border-border/50 pb-3 last:border-0">
                    <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                      <User className="w-3.5 h-3.5" /> You asked: &ldquo;{h.q}&rdquo;
                    </div>
                    <div className="text-xs text-foreground leading-relaxed bg-muted/40 p-3 rounded-lg border border-border/40 whitespace-pre-wrap">
                      {h.a}
                    </div>
                  </div>
                ))}
                {asking && (
                  <div className="text-xs text-muted-foreground flex items-center gap-2 italic">
                    <Sparkles className="w-3.5 h-3.5 text-primary animate-spin" /> Thinking using your Digital Twin memory...
                  </div>
                )}
              </div>
            </div>

            {/* Input Form */}
            <form onSubmit={handleAsk} className="flex gap-2 pt-3 border-t border-border">
              <Input
                placeholder="Ask your AI Business Brain anything..."
                value={question}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuestion(e.target.value)}
                disabled={asking}
              />
              <Button type="submit" disabled={asking || !question.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </Shell>
  );
}
