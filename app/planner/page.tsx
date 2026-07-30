"use client";

import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { CalendarDays, CheckCircle2, Circle, Sparkles, Filter, Plus, RefreshCw } from "lucide-react";

interface PlanItem {
  day: number;
  title: string;
  format: string;
  hook: string;
  caption: string;
  hashtags: string[];
  done?: boolean;
}

export default function PlannerPage() {
  const [items, setItems] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterFormat, setFilterFormat] = useState<string>("all");

  useEffect(() => {
    async function loadPlanner() {
      try {
        const { data: scans } = await api.get("/scans");
        const completedScan = scans.find((s: any) => s.status === "complete");
        if (completedScan) {
          const res = completedScan.result || {};
          const postIdeas = res.post_ideas || [];
          const captions = res.captions || [];
          const plan: PlanItem[] = postIdeas.map((idea: any, idx: number) => ({
            day: idx + 1,
            title: idea.title || `Content Post #${idx + 1}`,
            format: idea.format || (idx % 2 === 0 ? "Reel" : "Carousel"),
            hook: idea.hook || "Attention grabbing hook...",
            caption: captions[idx % Math.max(1, captions.length)]?.caption || "Engaging caption copy...",
            hashtags: captions[idx % Math.max(1, captions.length)]?.hashtags || ["#growth", "#creator", "#content"],
            done: false,
          }));
          setItems(plan);
        } else {
          // Default template
          setItems([
            { day: 1, title: "Industry Myth Buster", format: "Reel", hook: "Stop making this mistake if you want to grow...", caption: "Here is the breakdown of the top industry myth...", hashtags: ["#growth", "#tips"], done: true },
            { day: 2, title: "3 Quick Wins Carousel", format: "Carousel", hook: "Swipe to steal these 3 proven templates...", caption: "Full actionable guide inside...", hashtags: ["#productivity", "#guide"], done: false },
            { day: 3, title: "Behind The Scenes", format: "Short Video", hook: "Here is what no one shows you...", caption: "A raw look at our process...", hashtags: ["#bts", "#buildinpublic"], done: false },
            { day: 4, title: "Client Result Breakdown", format: "Case Study", hook: "How we increased conversions by 42% in 14 days...", caption: "Complete step-by-step breakdown...", hashtags: ["#results", "#conversion"], done: false },
          ]);
        }
      } catch (err: any) {
        toast.error("Failed to load content plan");
      } finally {
        setLoading(false);
      }
    }
    loadPlanner();
  }, []);

  const toggleDone = (index: number) => {
    setItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, done: !item.done } : item))
    );
    toast.success("Updated post status");
  };

  const filtered = filterFormat === "all" ? items : items.filter((i) => i.format.toLowerCase().includes(filterFormat.toLowerCase()));

  return (
    <Shell>
      <div className="space-y-6" data-testid="planner-page">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold flex items-center gap-2">
              <CalendarDays className="w-6 h-6 text-primary" /> Content Calendar & Planner
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Scheduled post calendar derived automatically from your profile and site audits.
            </p>
          </div>
          <Button onClick={() => toast.success("Refreshed content calendar")} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh Calendar
          </Button>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Filter className="w-4 h-4 text-muted-foreground mr-1" />
          {["all", "Reel", "Carousel", "Short Video", "Case Study"].map((fmt) => (
            <Button
              key={fmt}
              variant={filterFormat === fmt ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterFormat(fmt)}
              className="capitalize text-xs"
            >
              {fmt}
            </Button>
          ))}
        </div>

        {/* Plan Grid */}
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-10 text-center space-y-3">
            <CalendarDays className="w-10 h-10 text-muted-foreground mx-auto" />
            <h3 className="font-display font-bold text-lg">No posts matching filter</h3>
            <p className="text-sm text-muted-foreground">Select &lsquo;All&rsquo; to view all scheduled items.</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filtered.map((item, i) => (
              <Card
                key={i}
                className={`p-5 transition-colors ${
                  item.done ? "opacity-60 bg-muted/30 border-muted" : "bg-card border-border"
                }`}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        Day {item.day}
                      </Badge>
                      <Badge variant="secondary" className="uppercase text-[10px] font-bold">
                        {item.format}
                      </Badge>
                      {item.done && (
                        <Badge className="bg-emerald-500 text-white text-[10px]">Completed</Badge>
                      )}
                    </div>
                    <h3 className={`font-display text-base font-bold ${item.done ? "line-through" : ""}`}>
                      {item.title}
                    </h3>
                    <p className="text-xs text-muted-foreground italic font-mono">&ldquo;{item.hook}&rdquo;</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.caption}</p>
                    {item.hashtags && item.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {item.hashtags.map((tag, tIdx) => (
                          <span key={tIdx} className="text-[11px] font-mono text-primary">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    variant={item.done ? "outline" : "default"}
                    size="sm"
                    onClick={() => toggleDone(i)}
                    className="flex items-center gap-2 self-start sm:self-center"
                  >
                    {item.done ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Done
                      </>
                    ) : (
                      <>
                        <Circle className="w-4 h-4" /> Mark Done
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}
