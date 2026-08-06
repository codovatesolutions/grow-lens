"use client";
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Filter, CheckCircle2, XCircle, Clock, AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { socialApi, PublishHistoryItem, Platform, PLATFORM_CONFIG, ALL_PLATFORMS } from "@/lib/social";
import {
  FaFacebook, FaInstagram, FaLinkedin, FaXTwitter,
  FaPinterest, FaTiktok, FaYoutube,
} from "react-icons/fa6";

const ICONS: Record<Platform, React.ElementType> = {
  facebook: FaFacebook, instagram: FaInstagram, linkedin: FaLinkedin,
  twitter: FaXTwitter, pinterest: FaPinterest, tiktok: FaTiktok, youtube: FaYoutube,
};

const STATUS_STYLES: Record<string, { icon: React.ElementType; class: string; label: string }> = {
  published: { icon: CheckCircle2, class: "text-emerald-500 bg-emerald-500/10", label: "Published" },
  failed:    { icon: XCircle,      class: "text-destructive bg-destructive/10",  label: "Failed"     },
  scheduled: { icon: Clock,        class: "text-blue-500 bg-blue-500/10",        label: "Scheduled"  },
  pending:   { icon: Clock,        class: "text-yellow-500 bg-yellow-500/10",    label: "Pending"    },
  cancelled: { icon: AlertCircle,  class: "text-muted-foreground bg-muted",      label: "Cancelled"  },
};

const DATE_FILTERS = ["all", "today", "week", "month"] as const;

export default function PublishHistory({ onRetry }: { onRetry?: () => void }) {
  const [items,      setItems]      = useState<PublishHistoryItem[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [platform,   setPlatform]   = useState("");
  const [status,     setStatus]     = useState("");
  const [dateRange,  setDateRange]  = useState("all");
  const [expanded,   setExpanded]   = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const data = await socialApi.getHistory({
        platform:  platform  || undefined,
        status:    status    || undefined,
        dateRange: dateRange === "all" ? undefined : dateRange,
      });
      setItems(data);
    } catch { toast.error("Failed to load history"); }
    finally   { setLoading(false); }
  }, [platform, status, dateRange]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  return (
    <div className="space-y-4">
      {/* Header + Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Publish History</h2>
          <p className="text-sm text-muted-foreground">{items.length} records</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Date range */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            {DATE_FILTERS.map(d => (
              <button
                key={d}
                onClick={() => setDateRange(d)}
                className={`px-3 py-1.5 text-xs capitalize transition-colors ${dateRange === d ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                id={`filter-date-${d}`}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Platform filter */}
          <select
            value={platform}
            onChange={e => setPlatform(e.target.value)}
            className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs focus:outline-none"
            id="filter-platform"
          >
            <option value="">All platforms</option>
            {ALL_PLATFORMS.map(p => <option key={p} value={p}>{PLATFORM_CONFIG[p].name}</option>)}
          </select>

          {/* Status filter */}
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs focus:outline-none"
            id="filter-status"
          >
            <option value="">All statuses</option>
            {Object.keys(STATUS_STYLES).map(s => <option key={s} value={s}>{STATUS_STYLES[s].label}</option>)}
          </select>

          <Button variant="ghost" size="icon" onClick={fetchHistory} disabled={loading} id="btn-refresh-history">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="space-y-px">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted/30 animate-pulse border-b border-border" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No publish history yet</p>
            <p className="text-xs mt-1">Posts will appear here after publishing</p>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-border bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <div className="col-span-5">Post</div>
              <div className="col-span-2">Platform</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-3">Time</div>
            </div>

            {items.map((item, i) => {
              const st   = STATUS_STYLES[item.status] || STATUS_STYLES.pending;
              const Icon = st.icon;
              const PIcon = ICONS[item.platform];
              const cfg  = PLATFORM_CONFIG[item.platform];

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-border last:border-b-0"
                >
                  <div
                    className="grid grid-cols-12 gap-2 px-4 py-3 hover:bg-muted/20 cursor-pointer transition-colors"
                    onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                  >
                    {/* Thumbnail + caption */}
                    <div className="col-span-5 flex items-center gap-3 min-w-0">
                      {item.thumbnail_url || item.media_url ? (
                        <img
                          src={item.thumbnail_url || item.media_url}
                          alt=""
                          className="w-9 h-9 rounded-lg object-cover flex-shrink-0 bg-muted"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-muted flex-shrink-0" />
                      )}
                      <p className="text-sm truncate">{item.caption || "No caption"}</p>
                    </div>

                    {/* Platform */}
                    <div className="col-span-2 flex items-center gap-1.5">
                      {PIcon && <PIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: cfg?.color }} />}
                      <span className="text-xs text-muted-foreground truncate">{cfg?.name}</span>
                    </div>

                    {/* Status */}
                    <div className="col-span-2 flex items-center">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${st.class}`}>
                        <Icon className="w-2.5 h-2.5" />
                        {st.label}
                      </span>
                    </div>

                    {/* Time */}
                    <div className="col-span-3 flex items-center text-xs text-muted-foreground">
                      {item.published_at
                        ? new Date(item.published_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                        : new Date(item.created_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>

                  {/* Expanded error details */}
                  {expanded === item.id && item.error_message && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      className="px-4 pb-3 border-t border-border/50 bg-destructive/5"
                    >
                      <p className="text-xs text-destructive mt-2 font-medium">Error Details</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.error_message}</p>
                      {onRetry && (
                        <Button variant="outline" size="sm" className="mt-2 text-xs h-7 gap-1" onClick={onRetry} id={`btn-retry-${item.id}`}>
                          <RotateCcw className="w-3 h-3" /> Retry
                        </Button>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
