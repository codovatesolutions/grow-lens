"use client";

import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Swords, ShieldAlert, Zap, Target, TrendingUp, Sparkles, ExternalLink } from "lucide-react";

export default function WarRoomPage() {
  const [matrix, setMatrix] = useState<any[]>([]);
  const [strategy, setStrategy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    async function loadWarRoom() {
      try {
        const { data } = await api.get("/war-room");
        setMatrix(data.matrix || []);
      } catch (err: any) {
        toast.error("Failed to load competitor war room");
      } finally {
        setLoading(false);
      }
    }
    loadWarRoom();
  }, []);

  const generateStrategy = async () => {
    setGenerating(true);
    try {
      const targets = matrix.map((m) => m.target);
      const { data } = await api.post("/war-room/strategy", { targets });
      setStrategy(data);
      toast.success("Generated winning competitive counter-strategy!");
    } catch (err: any) {
      toast.error("Failed to generate counter-strategy");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Shell>
      <div className="space-y-6 max-w-6xl mx-auto" data-testid="war-room-page">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Swords className="w-6 h-6 text-primary" /> Competitor War Room
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Multi-competitor comparison matrix and AI winning counter-strategy engine.
            </p>
          </div>
          <Button onClick={generateStrategy} disabled={generating} className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> {generating ? "Analyzing Matrix..." : "Generate Winning Strategy"}
          </Button>
        </div>

        {/* Competitor Matrix Table */}
        <Card className="p-6 space-y-4">
          <h2 className="font-display font-bold text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" /> Multi-Competitor Audit Matrix
          </h2>

          {loading ? (
            <Skeleton className="h-40 w-full" />
          ) : matrix.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Run scans on your site and competitor URLs to populate the War Room matrix.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-left uppercase tracking-wider text-muted-foreground">
                    <th className="py-2.5 px-3">Target Domain</th>
                    <th className="py-2.5 px-3">Score</th>
                    <th className="py-2.5 px-3">Trust</th>
                    <th className="py-2.5 px-3">Conversions</th>
                    <th className="py-2.5 px-3">Security</th>
                    <th className="py-2.5 px-3">Vulnerabilities</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-mono">
                  {matrix.map((row) => (
                    <tr key={row.id} className="hover:bg-muted/40 transition">
                      <td className="py-3 px-3 font-semibold font-sans">{row.target}</td>
                      <td className="py-3 px-3">
                        <Badge variant="outline" className="font-bold">{row.score}/100</Badge>
                      </td>
                      <td className="py-3 px-3">{row.subscores?.trust || 65}/100</td>
                      <td className="py-3 px-3">{row.subscores?.conversion || 60}/100</td>
                      <td className="py-3 px-3">
                        <span className={row.has_https ? "text-emerald-500 font-bold" : "text-red-500 font-bold"}>
                          {row.has_https ? "✓ SSL" : "✗ HTTP"}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={row.vuln_count > 0 ? "text-amber-500 font-bold" : "text-emerald-500"}>
                          {row.vuln_count} Vulnerability Risks
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Strategy Breakdown Card */}
        {strategy && (
          <div className="space-y-6">
            <Card className="p-6 space-y-4 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
              <div className="flex justify-between items-center border-b border-border pb-3">
                <h3 className="font-display text-xl font-bold text-primary flex items-center gap-2">
                  <Zap className="w-5 h-5" /> Winning Counter-Strategy
                </h3>
                <Badge className="bg-primary text-primary-foreground font-mono text-xs">AI Generated</Badge>
              </div>

              {strategy.market_position && (
                <div className="text-sm font-semibold">{strategy.market_position}</div>
              )}

              <div className="grid md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-muted/40 rounded border border-border space-y-2">
                  <h4 className="font-display font-bold text-sm text-foreground">Pricing Counter-Attack</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{strategy.pricing_counter_attack}</p>
                </div>
                <div className="p-4 bg-muted/40 rounded border border-border space-y-2">
                  <h4 className="font-display font-bold text-sm text-foreground">Messaging Hook Advantage</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{strategy.messaging_hook}</p>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <h4 className="font-display font-bold text-sm uppercase tracking-wider text-muted-foreground">Aggressive Market Attack Tactics</h4>
                <div className="space-y-2">
                  {(strategy.winning_strategy || []).map((tactic: string, idx: number) => (
                    <div key={idx} className="p-3 bg-card rounded border border-border text-xs flex items-center gap-2 font-medium">
                      <span className="text-primary font-bold">{idx + 1}.</span> {tactic}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </Shell>
  );
}
