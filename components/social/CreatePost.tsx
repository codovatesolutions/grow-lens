"use client";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Calendar, Hash, X, Loader2, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import MediaUpload from "./MediaUpload";
import AIAssistant from "./AIAssistant";
import { socialApi, Platform, ALL_PLATFORMS, PLATFORM_CONFIG, MediaItem, CreatePostPayload } from "@/lib/social";
import {
  FaFacebook, FaInstagram, FaLinkedin, FaXTwitter,
  FaPinterest, FaTiktok, FaYoutube,
} from "react-icons/fa6";

const PLATFORM_ICONS: Record<Platform, React.ElementType> = {
  facebook: FaFacebook, instagram: FaInstagram, linkedin: FaLinkedin,
  twitter: FaXTwitter, pinterest: FaPinterest, tiktok: FaTiktok, youtube: FaYoutube,
};

const CHAR_LIMITS: Record<Platform, number> = {
  facebook: 63206, instagram: 2200, linkedin: 3000,
  twitter: 280, pinterest: 500, tiktok: 2200, youtube: 5000,
};

export default function CreatePost({ onPublished }: { onPublished?: () => void }) {
  const [caption,    setCaption]    = useState("");
  const [media,      setMedia]      = useState<MediaItem[]>([]);
  const [hashtags,   setHashtags]   = useState<string[]>([]);
  const [hashInput,  setHashInput]  = useState("");
  const [platforms,  setPlatforms]  = useState<Platform[]>([]);
  const [scheduling, setScheduling] = useState(false);
  const [schedDate,  setSchedDate]  = useState("");
  const [schedTime,  setSchedTime]  = useState("");
  const [timezone,   setTimezone]   = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [publishing, setPublishing] = useState(false);
  const [results,    setResults]    = useState<Record<string, { success: boolean; error?: string }> | null>(null);

  const togglePlatform = (p: Platform) =>
    setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

  const addHashtag = () => {
    const tag = hashInput.replace(/^#/, "").trim();
    if (tag && !hashtags.includes(tag)) setHashtags(prev => [...prev, tag]);
    setHashInput("");
  };

  const removeHashtag = (tag: string) => setHashtags(prev => prev.filter(t => t !== tag));

  const reset = () => {
    setCaption(""); setMedia([]); setHashtags([]); setPlatforms([]);
    setScheduling(false); setSchedDate(""); setSchedTime(""); setResults(null);
  };

  const smallestLimit = platforms.length > 0
    ? Math.min(...platforms.map(p => CHAR_LIMITS[p]))
    : 2200;
  const charCount  = caption.length;
  const charPct    = (charCount / smallestLimit) * 100;
  const charOk     = charCount <= smallestLimit;

  const handlePublish = async () => {
    if (!platforms.length) { toast.error("Select at least one platform"); return; }
    if (!caption.trim() && media.length === 0) { toast.error("Add a caption or media"); return; }
    if (!charOk) { toast.error(`Caption too long for selected platforms`); return; }

    const payload: CreatePostPayload = { caption, mediaUrls: media, hashtags, platforms };

    setPublishing(true);
    setResults(null);
    try {
      if (scheduling) {
        if (!schedDate || !schedTime) { toast.error("Set date and time for scheduling"); return; }
        const scheduledAt = new Date(`${schedDate}T${schedTime}`).toISOString();
        await socialApi.schedule({ ...payload, scheduledAt });
        toast.success("Post scheduled successfully! 📅");
        reset();
        onPublished?.();
      } else {
        const result = await socialApi.publish(payload);
        setResults(result.results as any);
        const successCount = Object.values(result.results).filter((r: any) => r.success).length;
        if (successCount === platforms.length) {
          toast.success(`Published to ${successCount} platform${successCount > 1 ? "s" : ""}! 🎉`);
          setTimeout(reset, 3000);
          onPublished?.();
        } else if (successCount > 0) {
          toast.warning(`Published to ${successCount}/${platforms.length} platforms`);
        } else {
          toast.error("Publishing failed on all platforms");
        }
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Publishing failed");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* ── Left: Composer ── */}
      <div className="xl:col-span-2 space-y-5">
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {/* Caption */}
          <div className="p-4 border-b border-border">
            <label className="text-xs font-medium text-muted-foreground block mb-2">Caption</label>
            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              rows={5}
              placeholder="What's on your mind? Write something engaging..."
              className="w-full resize-none bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground/50"
              id="caption-textarea"
            />
            {/* Character counter */}
            <div className="flex items-center justify-between mt-2">
              <div className="h-1 flex-1 mr-3 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full transition-colors ${charPct > 100 ? "bg-destructive" : charPct > 80 ? "bg-yellow-500" : "bg-primary"}`}
                  animate={{ width: `${Math.min(charPct, 100)}%` }}
                  transition={{ duration: 0.2 }}
                />
              </div>
              <span className={`text-xs font-mono ${!charOk ? "text-destructive" : "text-muted-foreground"}`}>
                {charCount}/{smallestLimit}
              </span>
            </div>
          </div>

          {/* Media */}
          <div className="p-4 border-b border-border">
            <label className="text-xs font-medium text-muted-foreground block mb-2">Media</label>
            <MediaUpload value={media} onChange={setMedia} />
          </div>

          {/* Hashtags */}
          <div className="p-4 border-b border-border">
            <label className="text-xs font-medium text-muted-foreground block mb-2 flex items-center gap-1">
              <Hash className="w-3 h-3" /> Hashtags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                value={hashInput}
                onChange={e => setHashInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addHashtag(); } }}
                placeholder="Add hashtag..."
                className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                id="hashtag-input"
              />
              <Button variant="outline" size="sm" onClick={addHashtag} id="btn-add-hashtag">Add</Button>
            </div>
            {hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {hashtags.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-full">
                    #{tag}
                    <button onClick={() => removeHashtag(tag)} className="hover:text-destructive">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Platform selector */}
          <div className="p-4 border-b border-border">
            <label className="text-xs font-medium text-muted-foreground block mb-3">Publish to</label>
            <div className="flex flex-wrap gap-2">
              {ALL_PLATFORMS.map(p => {
                const cfg     = PLATFORM_CONFIG[p];
                const Icon    = PLATFORM_ICONS[p];
                const active  = platforms.includes(p);
                return (
                  <button
                    key={p}
                    onClick={() => togglePlatform(p)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                      active
                        ? `bg-gradient-to-r ${cfg.bgGradient} text-white border-transparent shadow-sm`
                        : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
                    }`}
                    id={`platform-toggle-${p}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {cfg.name}
                  </button>
                );
              })}
            </div>
            {platforms.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">{platforms.length} platform{platforms.length > 1 ? "s" : ""} selected</p>
            )}
          </div>

          {/* Schedule toggle */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                Schedule for later
              </label>
              <button
                onClick={() => setScheduling(!scheduling)}
                className={`relative w-10 h-5 rounded-full transition-colors ${scheduling ? "bg-primary" : "bg-muted"}`}
                id="schedule-toggle"
              >
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${scheduling ? "translate-x-5" : ""}`} />
              </button>
            </div>
            <AnimatePresence>
              {scheduling && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 grid grid-cols-2 gap-2"
                >
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Date</label>
                    <input
                      type="date"
                      value={schedDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={e => setSchedDate(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      id="schedule-date"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Time</label>
                    <input
                      type="time"
                      value={schedTime}
                      onChange={e => setSchedTime(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      id="schedule-time"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-muted-foreground mb-1 block">Timezone</label>
                    <input
                      value={timezone}
                      readOnly
                      className="w-full rounded-lg border border-border bg-muted px-3 py-1.5 text-sm text-muted-foreground"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Publish buttons */}
          <div className="p-4 flex gap-3">
            <Button variant="outline" onClick={reset} disabled={publishing} className="flex-shrink-0" id="btn-reset-post">
              Clear
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-violet-600 to-pink-600 text-white border-0 hover:opacity-90 gap-2"
              onClick={handlePublish}
              disabled={publishing || !platforms.length}
              id="btn-publish-post"
            >
              {publishing ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> {scheduling ? "Scheduling..." : "Publishing..."}</>
              ) : scheduling ? (
                <><Calendar className="w-4 h-4" /> Schedule Post</>
              ) : (
                <><Send className="w-4 h-4" /> Publish Now</>
              )}
            </Button>
          </div>
        </div>

        {/* Publish results */}
        <AnimatePresence>
          {results && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="rounded-2xl border border-border bg-card p-4 space-y-2"
            >
              <p className="font-semibold text-sm mb-3">Publish Results</p>
              {Object.entries(results).map(([platform, r]) => (
                <div key={platform} className="flex items-start gap-2.5 text-sm">
                  {r.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-medium">{PLATFORM_CONFIG[platform as Platform]?.name || platform}</span>
                    {!r.success && r.error && <p className="text-xs text-muted-foreground">{r.error}</p>}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Right: AI Assistant ── */}
      <div className="space-y-4">
        <AIAssistant
          caption={caption}
          selectedPlatforms={platforms}
          onCaptionChange={setCaption}
          onHashtagsAdd={(tags) => setHashtags(prev => [...new Set([...prev, ...tags])])}
        />

        {/* Platform limits reference */}
        {platforms.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Platform Limits
            </p>
            {platforms.map(p => (
              <div key={p} className="flex items-center justify-between py-1 text-xs">
                <span className="text-muted-foreground">{PLATFORM_CONFIG[p].name}</span>
                <span className={caption.length > CHAR_LIMITS[p] ? "text-destructive font-medium" : "text-foreground"}>
                  {caption.length}/{CHAR_LIMITS[p]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
