"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BarChart2, TrendingUp, Send, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { socialApi, SocialAnalytics, Platform, PLATFORM_CONFIG } from "@/lib/social";
import { Button } from "@/components/ui/button";

export default function AnalyticsDashboard() {
  const [data,    setData]    = useState<SocialAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      setData(await socialApi.getAnalytics());
    } catch { toast.error("Failed to load analytics"); }
    finally   { setLoading(false); }
  };

  useEffect(() => { fetchAnalytics(); }, []);

  if (loading) return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />)}
      </div>
      <div className="h-64 rounded-2xl bg-muted animate-pulse" />
    </div>
  );

  if (!data) return null;

  const { totalPosts, publishedPosts, platformBreakdown } = data;
  const failedPosts  = totalPosts - publishedPosts;
  const successRate  = totalPosts > 0 ? Math.round((publishedPosts / totalPosts) * 100) : 0;

  const statCards = [
    { label: "Total Posts",    value: totalPosts,     icon: Send,          color: "from-violet-500 to-purple-600" },
    { label: "Published",      value: publishedPosts, icon: CheckCircle,   color: "from-emerald-500 to-green-600" },
    { label: "Failed",         value: failedPosts,    icon: XCircle,       color: "from-red-500 to-rose-600"     },
    { label: "Success Rate",   value: `${successRate}%`, icon: TrendingUp, color: "from-blue-500 to-indigo-600"  },
  ];

  const chartData = Object.entries(platformBreakdown).map(([platform, stats]) => ({
    platform: PLATFORM_CONFIG[platform as Platform]?.name || platform,
    published: stats.published,
    failed:    stats.failed,
    color:     PLATFORM_CONFIG[platform as Platform]?.color || "#6366f1",
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Analytics</h2>
          <p className="text-sm text-muted-foreground">Publishing performance overview</p>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchAnalytics} id="btn-refresh-analytics">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-2xl border border-border bg-card p-5 space-y-3"
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}>
              <card.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Platform breakdown chart */}
      {chartData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-border bg-card p-6"
        >
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-primary" />
            Posts by Platform
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barGap={4}>
              <XAxis dataKey="platform" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
              />
              <Bar dataKey="published" name="Published" radius={[6,6,0,0]}>
                {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
              <Bar dataKey="failed" name="Failed" fill="#ef4444" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Platform table */}
      {Object.keys(platformBreakdown).length > 0 && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-sm">Platform Breakdown</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Platform</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground">Total</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground">Published</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground">Failed</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground">Success</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(platformBreakdown).map(([platform, stats]) => {
                const cfg = PLATFORM_CONFIG[platform as Platform];
                const rate = stats.posts > 0 ? Math.round((stats.published / stats.posts) * 100) : 0;
                return (
                  <tr key={platform} className="border-b border-border/50 last:border-b-0 hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium" style={{ color: cfg?.color }}>{cfg?.name || platform}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{stats.posts}</td>
                    <td className="px-4 py-3 text-right text-emerald-500">{stats.published}</td>
                    <td className="px-4 py-3 text-right text-destructive">{stats.failed}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${rate >= 80 ? "bg-emerald-500/15 text-emerald-500" : rate >= 50 ? "bg-yellow-500/15 text-yellow-500" : "bg-destructive/15 text-destructive"}`}>
                        {rate}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPosts === 0 && (
        <div className="rounded-2xl border border-border bg-card py-16 text-center">
          <BarChart2 className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No data yet</p>
          <p className="text-xs text-muted-foreground mt-1">Publish your first post to see analytics</p>
        </div>
      )}
    </div>
  );
}
