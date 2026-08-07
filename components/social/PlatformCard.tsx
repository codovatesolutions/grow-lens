"use client";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, RefreshCw, Unlink, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SocialAccount, Platform, PLATFORM_CONFIG } from "@/lib/social";
import {
  FaFacebook, FaInstagram, FaLinkedin, FaXTwitter,
  FaPinterest, FaTiktok, FaYoutube,
} from "react-icons/fa6";

const PLATFORM_ICONS: Record<Platform, React.ElementType> = {
  facebook:  FaFacebook,
  instagram: FaInstagram,
  linkedin:  FaLinkedin,
  twitter:   FaXTwitter,
  pinterest: FaPinterest,
  tiktok:    FaTiktok,
  youtube:   FaYoutube,
};

interface PlatformCardProps {
  platform:     Platform;
  account?:     SocialAccount;
  onConnect:    (p: Platform) => void;
  onDisconnect: (p: Platform) => void;
  loading?:     boolean;
}

export default function PlatformCard({
  platform, account, onConnect, onDisconnect, loading = false,
}: PlatformCardProps) {
  const cfg     = PLATFORM_CONFIG[platform];
  const Icon    = PLATFORM_ICONS[platform];
  const connected = account?.is_connected;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative rounded-2xl border border-border bg-card overflow-hidden group flex flex-col justify-between"
    >
      {/* Gradient top bar */}
      <div className={`h-1 w-full bg-gradient-to-r ${cfg.bgGradient}`} />

      <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div
            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cfg.bgGradient} flex items-center justify-center shadow-lg`}
          >
            <Icon className="w-6 h-6 text-white" />
          </div>

          {/* Status badge */}
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
              connected
                ? "bg-emerald-500/15 text-emerald-500"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {connected ? (
              <><CheckCircle2 className="w-3 h-3" /> Connected</>
            ) : (
              <><XCircle className="w-3 h-3" /> Not connected</>
            )}
          </span>
        </div>

        {/* Platform name & account */}
        <div>
          <p className="font-semibold text-foreground">{cfg.name}</p>
          {connected && account?.account_name ? (
            <p className="text-sm text-muted-foreground mt-0.5 truncate">
              {account.account_name}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground mt-0.5">
              Not connected
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="pt-2">
          {connected ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => onConnect(platform)}
                disabled={loading}
                id={`btn-reconnect-${platform}`}
              >
                <RefreshCw className="w-3 h-3 mr-1.5" />
                Reconnect
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-destructive hover:text-destructive"
                onClick={() => onDisconnect(platform)}
                disabled={loading}
                id={`btn-disconnect-${platform}`}
              >
                <Unlink className="w-3 h-3 mr-1.5" />
                Disconnect
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              className={`w-full bg-gradient-to-r ${cfg.bgGradient} text-white border-0 hover:opacity-90 transition-opacity font-medium`}
              onClick={() => onConnect(platform)}
              disabled={loading}
              id={`btn-connect-${platform}`}
            >
              Connect {cfg.name}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
