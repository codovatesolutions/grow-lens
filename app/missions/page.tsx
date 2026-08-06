"use client";

import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Trophy, CheckCircle2, Circle, Zap, DollarSign, Award, ArrowUpRight } from "lucide-react";

export default function MissionsPage() {
  const [missions, setMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMissions = async () => {
    try {
      const { data } = await api.get("/missions");
      setMissions(data || []);
    } catch (err: any) {
      toast.error("Failed to load growth missions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMissions();
  }, []);

  const toggleMission = async (id: string, currentDone: boolean) => {
    try {
      await api.patch(`/missions/${id}`, { done: !currentDone });
      toast.success(!currentDone ? "Mission completed! +Reward Points Claimed" : "Mission uncompleted");
      loadMissions();
    } catch (err: any) {
      toast.error("Could not update mission");
    }
  };

  const completedCount = missions.filter((m) => m.done).length;
  const totalScoreReward = missions.filter((m) => m.done).reduce((acc, m) => acc + (m.reward_score || 0), 0);
  const totalDollarImpact = missions.filter((m) => m.done).reduce((acc, m) => acc + (m.impact_usd || 0), 0);

  return (
    <Shell>
      <div className="space-y-6 max-w-5xl mx-auto" data-testid="missions-page">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Trophy className="w-6 h-6 text-primary" /> Growth Missions & Gamified Milestones
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gamified weekly action items. Complete missions to increase scores and boost site conversion.
            </p>
          </div>
          <Badge variant="outline" className="font-mono text-sm px-3 py-1.5 border-emerald-500/40 bg-emerald-500/10 text-emerald-600">
            <Award className="w-4 h-4 mr-1 text-emerald-500" /> +{totalScoreReward} Score Points Unlocked
          </Badge>
        </div>

        {/* Gamified Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card className="p-5 space-y-2">
            <div className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Missions Progress</div>
            <div className="font-display text-2xl font-black">{completedCount} / {missions.length}</div>
            <Progress value={missions.length > 0 ? (completedCount / missions.length) * 100 : 0} className="h-2" />
          </Card>
          <Card className="p-5 space-y-2">
            <div className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Score Lift Unlocked</div>
            <div className="font-display text-2xl font-black text-primary">+{totalScoreReward} Points</div>
          </Card>
          <Card className="p-5 space-y-2 col-span-2 md:col-span-1">
            <div className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Conversion Lift</div>
            <div className="font-display text-2xl font-black text-emerald-600">+{(completedCount * 3.5).toFixed(1)}% Estimated Lift</div>
          </Card>
        </div>

        {/* Missions List */}
        <div className="space-y-4">
          <h2 className="font-display font-bold text-lg">Active Weekly Missions</h2>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <div className="grid gap-3">
              {missions.map((m) => (
                <Card
                  key={m.id}
                  className={`p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all ${
                    m.done ? "opacity-60 bg-muted/30 border-muted" : "bg-card border-border hover:border-primary/50"
                  }`}
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="uppercase font-mono text-[10px]">
                        {m.category || "CRO"}
                      </Badge>
                      <Badge className="bg-primary/10 text-primary font-mono text-[11px] border border-primary/20">
                        +{m.reward_score} Score Lift
                      </Badge>
                    </div>
                    <h3 className={`font-display text-base font-bold ${m.done ? "line-through" : ""}`}>
                      {m.title}
                    </h3>
                  </div>

                  <Button
                    variant={m.done ? "outline" : "default"}
                    onClick={() => toggleMission(m.id, m.done)}
                    className="flex items-center gap-2 shrink-0 self-start sm:self-center"
                  >
                    {m.done ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Completed
                      </>
                    ) : (
                      <>
                        <Circle className="w-4 h-4" /> Complete Mission
                      </>
                    )}
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
