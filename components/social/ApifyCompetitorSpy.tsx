"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Eye, Heart, MessageSquare, Sparkles, TrendingUp, 
  ShieldAlert, Lightbulb, Zap, ArrowRight, RefreshCw, CheckCircle2,
  ExternalLink, UserCheck, Flame
} from "lucide-react";
import { socialApi } from "@/lib/social";
import { toast } from "sonner";

interface TopPost {
  id: string;
  caption: string;
  likes: number;
  comments: number;
  views?: number;
  postedAt?: string;
  url?: string;
  mediaUrl?: string;
  type?: string;
}

interface CompetitorData {
  competitor: {
    platform: string;
    handle: string;
    accountName?: string;
    avatarUrl?: string;
    followersCount?: number;
    engagementRate?: string;
    bio?: string;
    topPosts: TopPost[];
    scrapedAt: string;
  };
  summary: string;
  viralHooks: string[];
  stealThisTactics: string[];
  contentGaps: string[];
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  recommendedCounterPosts: Array<{
    title: string;
    angle: string;
    suggestedHook: string;
    targetPlatform: string;
  }>;
}

const PLATFORMS = [
  { id: "instagram", name: "Instagram", icon: "📸", color: "from-pink-500 to-rose-600" },
  { id: "tiktok",    name: "TikTok",    icon: "🎵", color: "from-slate-900 to-teal-500" },
  { id: "twitter",   name: "X (Twitter)",icon: "🐦", color: "from-blue-600 to-cyan-500" },
  { id: "youtube",   name: "YouTube",   icon: "▶️", color: "from-red-600 to-rose-700" },
];

export default function ApifyCompetitorSpy() {
  const [platform, setPlatform] = useState<string>("instagram");
  const [handle, setHandle] = useState<string>("growth_hacker");
  const [loading, setLoading] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<CompetitorData | null>(null);
  const [activeTab, setActiveTab] = useState<"teardown" | "posts">("teardown");

  const handleRunSpy = async () => {
    if (!handle.trim()) {
      toast.error("Please enter a competitor social handle");
      return;
    }

    setLoading(true);
    toast.info(`Connecting to Apify Actor for @${handle}...`);

    try {
      const res = await socialApi.analyzeCompetitorApify(platform, handle);
      setAnalysis(res);
      toast.success("Apify scrape and AI competitor teardown completed!");
    } catch (err: any) {
      console.error("Apify spy error:", err);
      toast.error(err?.response?.data?.error || "Failed to analyze competitor profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="relative rounded-2xl bg-card border border-border p-6 shadow-sm overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                <Sparkles className="w-3.5 h-3.5" /> Powered by Apify & Gemini AI
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight mt-2">Competitor Intelligence Spy</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Extract real-time public social data, viral hooks, top performing posts, and AI counter-strategies for any competitor handle across social platforms.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-muted-foreground">Apify Engine Active</span>
          </div>
        </div>

        {/* Input Bar */}
        <div className="mt-6 flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Platform selector */}
          <div className="flex gap-1.5 bg-muted/60 p-1 rounded-xl border border-border">
            {PLATFORMS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPlatform(p.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  platform === p.id
                    ? "bg-background text-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>{p.icon}</span>
                <span className="hidden sm:inline">{p.name}</span>
              </button>
            ))}
          </div>

          {/* Handle input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder={`Enter handle (e.g. @openai or competitor_name)`}
              className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              onKeyDown={(e) => e.key === "Enter" && handleRunSpy()}
            />
          </div>

          {/* Action Button */}
          <button
            onClick={handleRunSpy}
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-medium px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 text-sm whitespace-nowrap"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Scrape & Analyze...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-amber-300" /> Run Competitor Spy
              </>
            )}
          </button>
        </div>
      </div>

      {/* Analysis Display */}
      {analysis && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Competitor Overview Profile Card */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 p-0.5 shadow-md flex-shrink-0">
                  <div className="w-full h-full rounded-[14px] bg-background flex items-center justify-center overflow-hidden">
                    {analysis.competitor.avatarUrl ? (
                      <img src={analysis.competitor.avatarUrl} alt={analysis.competitor.handle} className="w-full h-full object-cover" />
                    ) : (
                      <UserCheck className="w-7 h-7 text-primary" />
                    )}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-foreground">
                      {analysis.competitor.accountName || `@${analysis.competitor.handle}`}
                    </h3>
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full font-medium text-muted-foreground uppercase">
                      {analysis.competitor.platform}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">@{analysis.competitor.handle}</p>
                  {analysis.competitor.bio && (
                    <p className="text-xs text-foreground/80 mt-1 max-w-xl line-clamp-2">{analysis.competitor.bio}</p>
                  )}
                </div>
              </div>

              {/* Stat badges */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="bg-muted/50 border border-border rounded-xl px-4 py-2 text-center">
                  <div className="text-xs text-muted-foreground font-medium">Est. Followers</div>
                  <div className="text-base font-bold text-foreground">
                    {(analysis.competitor.followersCount || 25000).toLocaleString()}
                  </div>
                </div>
                <div className="bg-muted/50 border border-border rounded-xl px-4 py-2 text-center">
                  <div className="text-xs text-muted-foreground font-medium">Avg Engagement</div>
                  <div className="text-base font-bold text-emerald-500">
                    {analysis.competitor.engagementRate || "5.2%"}
                  </div>
                </div>
                <div className="bg-muted/50 border border-border rounded-xl px-4 py-2 text-center">
                  <div className="text-xs text-muted-foreground font-medium">Positive Sentiment</div>
                  <div className="text-base font-bold text-violet-500">
                    {analysis.sentimentBreakdown.positive}%
                  </div>
                </div>
              </div>
            </div>

            {/* Strategic Summary */}
            <div className="mt-4 bg-primary/5 border border-primary/10 rounded-xl p-4 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-primary uppercase tracking-wider">AI Executive Teardown</h4>
                <p className="text-sm text-foreground/90 mt-0.5 leading-relaxed">{analysis.summary}</p>
              </div>
            </div>
          </div>

          {/* Sub Tab Navigation */}
          <div className="flex border-b border-border">
            <button
              onClick={() => setActiveTab("teardown")}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
                activeTab === "teardown"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Lightbulb className="w-4 h-4" /> AI Strategy Teardown
            </button>
            <button
              onClick={() => setActiveTab("posts")}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
                activeTab === "posts"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Flame className="w-4 h-4 text-orange-500" /> Top Scraped Posts ({analysis.competitor.topPosts.length})
            </button>
          </div>

          {/* Tab Content 1: AI Strategy Teardown */}
          {activeTab === "teardown" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Steal This Tactic */}
              <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-emerald-500 font-bold text-base">
                  <CheckCircle2 className="w-5 h-5" /> Steal These Tactics
                </div>
                <div className="space-y-2.5">
                  {analysis.stealThisTactics.map((tactic, i) => (
                    <div key={i} className="flex items-start gap-2.5 bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-xs font-medium text-foreground/90 leading-relaxed">{tactic}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Viral Hooks Breakdown */}
              <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-violet-500 font-bold text-base">
                  <Zap className="w-5 h-5" /> Viral Opening Hooks
                </div>
                <div className="space-y-2.5">
                  {analysis.viralHooks.map((hook, i) => (
                    <div key={i} className="flex items-center justify-between bg-violet-500/5 border border-violet-500/10 p-3 rounded-xl">
                      <p className="text-xs font-medium text-foreground/90 italic">"{hook}"</p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(hook);
                          toast.success("Hook copied to clipboard!");
                        }}
                        className="text-[11px] font-semibold text-violet-500 hover:text-violet-600 bg-violet-500/10 px-2.5 py-1 rounded-lg transition-all"
                      >
                        Copy
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Content Gaps & Vulnerabilities */}
              <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-amber-500 font-bold text-base">
                  <ShieldAlert className="w-5 h-5" /> Content Gaps to Exploit
                </div>
                <div className="space-y-2.5">
                  {analysis.contentGaps.map((gap, i) => (
                    <div key={i} className="flex items-start gap-2.5 bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl">
                      <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0 mt-1.5" />
                      <p className="text-xs font-medium text-foreground/90 leading-relaxed">{gap}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended AI Counter-Posts */}
              <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-indigo-500 font-bold text-base">
                  <TrendingUp className="w-5 h-5" /> Suggested Counter-Posts
                </div>
                <div className="space-y-3">
                  {analysis.recommendedCounterPosts.map((post, i) => (
                    <div key={i} className="bg-muted/40 border border-border rounded-xl p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">{post.title}</span>
                        <span className="text-[10px] font-semibold bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded-full uppercase">
                          {post.targetPlatform}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        <strong className="text-foreground">Angle:</strong> {post.angle}
                      </p>
                      <div className="bg-background p-2 rounded-lg text-xs font-medium border border-border/60 text-foreground/90">
                        <span className="text-indigo-400 font-semibold">Hook:</span> "{post.suggestedHook}"
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab Content 2: Top Scraped Posts */}
          {activeTab === "posts" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {analysis.competitor.topPosts.map((post, i) => (
                <div key={post.id || i} className="bg-card border border-border rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-3">
                  <div>
                    {post.mediaUrl && (
                      <div className="w-full h-40 rounded-xl overflow-hidden mb-3 bg-muted">
                        <img src={post.mediaUrl} alt="Post media" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <p className="text-xs text-foreground/90 line-clamp-3 leading-relaxed font-medium">
                      {post.caption || "No caption text"}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 text-rose-500" /> {post.likes.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5 text-blue-500" /> {post.comments.toLocaleString()}
                      </span>
                      {post.views !== undefined && post.views > 0 && (
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5 text-purple-500" /> {post.views.toLocaleString()}
                        </span>
                      )}
                    </div>

                    {post.url && (
                      <a
                        href={post.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline flex items-center gap-1 text-[11px] font-semibold"
                      >
                        Link <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
