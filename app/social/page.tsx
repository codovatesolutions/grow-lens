"use client";
import { Suspense, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Wifi, PenSquare, Calendar, Clock, BarChart2, Eye } from "lucide-react";
import ConnectedAccounts    from "@/components/social/ConnectedAccounts";
import CreatePost           from "@/components/social/CreatePost";
import ContentCalendar      from "@/components/social/ContentCalendar";
import PublishHistory       from "@/components/social/PublishHistory";
import AnalyticsDashboard   from "@/components/social/AnalyticsDashboard";
import ApifyCompetitorSpy   from "@/components/social/ApifyCompetitorSpy";

const TABS = [
  { id: "accounts",  label: "Accounts",       icon: Wifi,       description: "Manage connected social accounts" },
  { id: "compose",   label: "Compose",        icon: PenSquare,  description: "Create and publish posts"         },
  { id: "spy",       label: "Competitor Spy", icon: Eye,        description: "Scrape and analyze competitors with Apify" },
  { id: "calendar",  label: "Calendar",       icon: Calendar,   description: "View scheduled posts"             },
  { id: "history",   label: "History",        icon: Clock,      description: "Publish activity log"             },
  { id: "analytics", label: "Analytics",      icon: BarChart2,  description: "Performance metrics"              },
] as const;

type TabId = typeof TABS[number]["id"];

export default function SocialPage() {
  const [activeTab, setActiveTab] = useState<TabId>("accounts");
  const [refreshKey, setRefreshKey] = useState(0);

  const currentTab = TABS.find(t => t.id === activeTab)!;

  return (
    <div className="min-h-full space-y-6">
      {/* Hero header */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600 p-6 md:p-8 text-white">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />

        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Social Publisher</h1>
          </div>
          <p className="text-violet-100 text-sm md:text-base max-w-xl">
            Connect your accounts and publish to all platforms in one click. Schedule posts, manage content, and track performance — all from one dashboard.
          </p>
        </div>

        {/* Floating platform icons */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-2 opacity-30">
          {["f","in","X","▶","📌"].map((icon, i) => (
            <motion.div
              key={i}
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 2 + i * 0.3, ease: "easeInOut" }}
              className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-xs font-bold"
            >
              {icon}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Tab navigation */}
      <div className="border border-border rounded-2xl bg-card overflow-hidden">
        <div className="flex overflow-x-auto scrollbar-hide border-b border-border">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium whitespace-nowrap transition-all relative flex-shrink-0 ${
                activeTab === tab.id
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              id={`tab-${tab.id}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-4 md:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <Suspense fallback={<div className="h-64 flex items-center justify-center text-muted-foreground">Loading...</div>}>
                {activeTab === "accounts"  && <ConnectedAccounts />}
                {activeTab === "compose"   && (
                  <CreatePost onPublished={() => { setRefreshKey(k => k + 1); setActiveTab("history"); }} />
                )}
                {activeTab === "spy"       && <ApifyCompetitorSpy />}
                {activeTab === "calendar"  && <ContentCalendar key={refreshKey} />}
                {activeTab === "history"   && <PublishHistory key={refreshKey} onRetry={() => setActiveTab("compose")} />}
                {activeTab === "analytics" && <AnalyticsDashboard key={refreshKey} />}
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
