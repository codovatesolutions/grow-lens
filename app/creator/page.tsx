"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Shell from "@/components/Shell";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Sparkles, Plus, ExternalLink, Video, Lightbulb, Target, Hash } from "lucide-react";

export default function CreatorPage() {
  const [scans, setScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCreatorScans() {
      try {
        const { data } = await api.get("/scans");
        const creatorScans = (data || []).filter((s: any) => s.mode === "creator");
        setScans(creatorScans);
      } catch (err: any) {
        toast.error("Failed to load creator scans");
      } finally {
        setLoading(false);
      }
    }
    loadCreatorScans();
  }, []);

  const latestScan = scans.find((s) => s.status === "complete");
  const result = latestScan?.result || {};

  return (
    <Shell>
      <div className="space-y-6" data-testid="creator-page">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" /> Creator Insights & Strategy
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Viral hooks, post calendars, and niche positioning for creator profiles.
            </p>
          </div>
          <Button asChild className="flex items-center gap-2">
            <Link href="/scan/new">
              <Plus className="w-4 h-4" /> New Creator Scan
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : scans.length === 0 ? (
          <Card className="p-10 text-center space-y-3">
            <Sparkles className="w-10 h-10 text-muted-foreground mx-auto" />
            <h3 className="font-display font-bold text-lg">No Creator Scans Yet</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Scan your Instagram, TikTok, YouTube, or Twitter/X profile link to generate instant content pillars, post ideas, and bio improvements.
            </p>
            <Button asChild className="mt-2">
              <Link href="/scan/new">Run Creator Scan</Link>
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Active Creator Summary */}
            {latestScan && (
              <Card className="p-6 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <div>
                    <span className="text-xs font-mono uppercase tracking-widest text-primary font-bold">Latest Profile Scan</span>
                    <h3 className="font-display text-xl font-bold mt-1">{latestScan.target}</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="font-mono text-sm px-3 py-1">
                      Score: {result.score || latestScan.score || 0}/100
                    </Badge>
                    <Button variant="secondary" size="sm" asChild>
                      <Link href={`/results/${latestScan.id}`}>Full Breakdown &rarr;</Link>
                    </Button>
                  </div>
                </div>
                {result.summary && <p className="text-sm text-muted-foreground">{result.summary}</p>}
                {result.niche_clarity && (
                  <div className="text-xs bg-muted/60 p-3 rounded border border-border/50">
                    <span className="font-semibold text-foreground">Niche Clarity Read: </span>
                    <span className="text-muted-foreground">{result.niche_clarity}</span>
                  </div>
                )}
              </Card>
            )}

            {/* Post Ideas & Hooks Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Content Pillars */}
              <Card className="p-5 space-y-3">
                <h3 className="font-display font-bold text-base flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" /> Content Pillars
                </h3>
                {(!result.content_pillars || result.content_pillars.length === 0) ? (
                  <p className="text-xs text-muted-foreground">Run a creator scan to extract strategic content pillars.</p>
                ) : (
                  <div className="space-y-2">
                    {result.content_pillars.map((pillar: string, i: number) => (
                      <div key={i} className="text-xs p-2.5 rounded bg-muted/50 border border-border/50 font-medium">
                        {i + 1}. {pillar}
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Viral Hooks */}
              <Card className="p-5 space-y-3">
                <h3 className="font-display font-bold text-base flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-primary" /> High-Performing Hooks
                </h3>
                {(!result.hooks || result.hooks.length === 0) ? (
                  <p className="text-xs text-muted-foreground">Hooks will appear here after scanning a creator profile.</p>
                ) : (
                  <div className="space-y-2">
                    {result.hooks.map((hook: string, i: number) => (
                      <div key={i} className="text-xs p-2.5 rounded bg-muted/50 border border-border/50 font-mono italic">
                        &ldquo;{hook}&rdquo;
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Post Ideas Calendar Preview */}
            <Card className="p-5 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-display font-bold text-base flex items-center gap-2">
                  <Video className="w-4 h-4 text-primary" /> Suggested Post Ideas
                </h3>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/planner">View Full Calendar &rarr;</Link>
                </Button>
              </div>

              {(!result.post_ideas || result.post_ideas.length === 0) ? (
                <p className="text-xs text-muted-foreground">No post ideas generated yet. Start a new scan above.</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {result.post_ideas.slice(0, 6).map((post: any, i: number) => (
                    <div key={i} className="p-3.5 rounded border border-border bg-card space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <Badge variant="outline" className="uppercase tracking-wider font-mono text-[10px]">
                          {post.format || "Reel / Short"}
                        </Badge>
                      </div>
                      <h4 className="font-semibold text-sm">{post.title}</h4>
                      <p className="text-xs text-muted-foreground italic">&ldquo;{post.hook}&rdquo;</p>
                      <p className="text-[11px] text-muted-foreground">{post.why}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </Shell>
  );
}
