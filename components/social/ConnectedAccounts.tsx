"use client";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import PlatformCard from "./PlatformCard";
import { socialApi, SocialAccount, Platform, ALL_PLATFORMS, PLATFORM_CONFIG } from "@/lib/social";

export default function ConnectedAccounts() {
  const [accounts, setAccounts]   = useState<SocialAccount[]>([]);
  const [loading, setLoading]     = useState(true);
  const [connecting, setConnecting] = useState<Platform | null>(null);
  const searchParams = useSearchParams();

  const fetchAccounts = useCallback(async () => {
    try {
      const data = await socialApi.getAccounts();
      setAccounts(data);
    } catch {
      toast.error("Failed to load connected accounts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Handle OAuth callback redirect
  useEffect(() => {
    const connected = searchParams.get("connected");
    const name      = searchParams.get("name");
    const error     = searchParams.get("error");

    if (connected) {
      const cfg = PLATFORM_CONFIG[connected as Platform];
      toast.success(`✅ ${cfg?.name || connected} connected${name ? ` as ${decodeURIComponent(name)}` : ""}!`);
      fetchAccounts();
      // Clean URL
      window.history.replaceState({}, "", "/social");
    }
    if (error) {
      toast.error(`OAuth failed: ${decodeURIComponent(error)}`);
      window.history.replaceState({}, "", "/social");
    }
  }, [searchParams, fetchAccounts]);

  const handleConnect = async (platform: Platform) => {
    try {
      setConnecting(platform);
      const { authUrl } = await socialApi.getOAuthUrl(platform);
      window.open(authUrl, "_self");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to initiate OAuth");
      setConnecting(null);
    }
  };

  const handleConnectDemo = async (platform: Platform) => {
    try {
      setConnecting(platform);
      await socialApi.connectDemo(platform);
      await fetchAccounts();
      toast.success(`${PLATFORM_CONFIG[platform].name} connected via demo`);
    } catch {
      toast.error("Failed to connect demo");
    } finally {
      setConnecting(null);
    }
  };

  const handleConnectAllDemo = async () => {
    try {
      setLoading(true);
      await socialApi.connectAllDemo();
      await fetchAccounts();
      toast.success("⚡ All platforms connected in demo mode!");
    } catch {
      toast.error("Failed to connect demo accounts");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (platform: Platform) => {
    try {
      await socialApi.disconnect(platform);
      setAccounts(prev => prev.map(a => a.platform === platform ? { ...a, is_connected: false } : a));
      toast.success(`${PLATFORM_CONFIG[platform].name} disconnected`);
    } catch {
      toast.error("Failed to disconnect");
    }
  };

  const connectedCount = accounts.filter(a => a.is_connected).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Connected Accounts</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {connectedCount} of {ALL_PLATFORMS.length} platforms connected
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleConnectAllDemo}
            disabled={loading}
            className="text-xs bg-gradient-to-r from-violet-500/10 to-pink-500/10 border-primary/30 text-primary hover:bg-primary/10"
            id="btn-connect-all-demo"
          >
            ⚡ Connect All (Demo)
          </Button>
          {/* Connection progress */}
          <div className="hidden sm:flex items-center gap-1.5 bg-muted rounded-full px-3 py-1.5">
            <Wifi className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium">
              {connectedCount}/{ALL_PLATFORMS.length} active
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={fetchAccounts} disabled={loading} id="btn-refresh-accounts">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-violet-500 to-pink-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${(connectedCount / ALL_PLATFORMS.length) * 100}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>

      {/* Platform grid */}
      <AnimatePresence>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {ALL_PLATFORMS.map(p => (
              <div key={p} className="rounded-2xl border border-border bg-card h-44 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {ALL_PLATFORMS.map((platform, i) => {
              const account = accounts.find(a => a.platform === platform);
              return (
                <motion.div
                  key={platform}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <PlatformCard
                    platform={platform}
                    account={account}
                    onConnect={handleConnect}
                    onConnectDemo={handleConnectDemo}
                    onDisconnect={handleDisconnect}
                    loading={connecting === platform}
                  />
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* Tips */}
      <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">💡 Getting started</p>
        <p>Connect your social accounts using OAuth — your passwords are never stored. Tokens are encrypted with AES-256 and can be revoked anytime.</p>
      </div>
    </div>
  );
}
