"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Hash, Clock, Pen, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { socialApi, Platform, PLATFORM_CONFIG } from "@/lib/social";

const TONES = [
  { value: "professional", label: "Professional", emoji: "👔" },
  { value: "startup",      label: "Startup",      emoji: "🚀" },
  { value: "corporate",    label: "Corporate",    emoji: "🏢" },
  { value: "friendly",     label: "Friendly",     emoji: "😊" },
  { value: "marketing",    label: "Marketing",    emoji: "📣" },
];

interface AIAssistantProps {
  caption:          string;
  selectedPlatforms: Platform[];
  onCaptionChange:  (c: string) => void;
  onHashtagsAdd:    (tags: string[]) => void;
}

export default function AIAssistant({ caption, selectedPlatforms, onCaptionChange, onHashtagsAdd }: AIAssistantProps) {
  const [tone,      setTone]      = useState("professional");
  const [prompt,    setPrompt]    = useState("");
  const [bestTime,  setBestTime]  = useState<{ time: string; reason: string } | null>(null);
  const [loading,   setLoading]   = useState<string | null>(null);
  const [toneOpen,  setToneOpen]  = useState(false);

  const primary = selectedPlatforms[0] || "instagram";
  const cfg     = PLATFORM_CONFIG[primary];

  const generateCaption = async () => {
    if (!prompt.trim() && !caption.trim()) {
      toast.error("Enter a topic or some caption text first");
      return;
    }
    setLoading("caption");
    try {
      const { caption: generated } = await socialApi.generateCaption(prompt || caption, tone, primary);
      onCaptionChange(generated);
      toast.success("Caption generated!");
    } catch {
      toast.error("Caption generation failed");
    } finally {
      setLoading(null);
    }
  };

  const generateHashtags = async () => {
    if (!caption.trim()) { toast.error("Write a caption first"); return; }
    setLoading("hashtags");
    try {
      const { hashtags } = await socialApi.generateHashtags(caption, primary);
      onHashtagsAdd(hashtags);
      toast.success(`${hashtags.length} hashtags added`);
    } catch {
      toast.error("Hashtag generation failed");
    } finally {
      setLoading(null);
    }
  };

  const getBestTime = async () => {
    setLoading("besttime");
    try {
      const result = await socialApi.getBestTime(primary);
      setBestTime(result);
    } catch {
      toast.error("Failed to get best time");
    } finally {
      setLoading(null);
    }
  };

  const rewriteForPlatform = async (platform: Platform) => {
    if (!caption.trim()) { toast.error("Write a caption first"); return; }
    setLoading(`rewrite-${platform}`);
    try {
      const { caption: rewritten } = await socialApi.rewrite(caption, platform);
      onCaptionChange(rewritten);
      toast.success(`Rewritten for ${PLATFORM_CONFIG[platform].name}`);
    } catch {
      toast.error("Rewrite failed");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-gradient-to-r from-violet-500/10 to-pink-500/10 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-violet-500" />
        <span className="font-semibold text-sm">AI Assistant</span>
      </div>

      <div className="p-4 space-y-4">
        {/* Topic input */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Topic / Prompt</label>
          <input
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="e.g. product launch, industry insight..."
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            id="ai-prompt-input"
          />
        </div>

        {/* Tone selector */}
        <div className="relative">
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tone</label>
          <button
            onClick={() => setToneOpen(!toneOpen)}
            className="w-full flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm"
            id="tone-selector"
          >
            <span>{TONES.find(t => t.value === tone)?.emoji} {TONES.find(t => t.value === tone)?.label}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${toneOpen ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence>
            {toneOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute z-20 top-full mt-1 w-full rounded-lg border border-border bg-popover shadow-lg overflow-hidden"
              >
                {TONES.map(t => (
                  <button
                    key={t.value}
                    onClick={() => { setTone(t.value); setToneOpen(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors ${tone === t.value ? "bg-muted font-medium" : ""}`}
                    id={`tone-option-${t.value}`}
                  >
                    {t.emoji} {t.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action buttons */}
        <div className="space-y-2">
          <Button
            className="w-full justify-start gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:opacity-90 border-0"
            size="sm"
            onClick={generateCaption}
            disabled={!!loading}
            id="btn-generate-caption"
          >
            {loading === "caption" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Generate Caption
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            size="sm"
            onClick={generateHashtags}
            disabled={!!loading}
            id="btn-generate-hashtags"
          >
            {loading === "hashtags" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Hash className="w-3.5 h-3.5" />}
            Suggest Hashtags
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            size="sm"
            onClick={getBestTime}
            disabled={!!loading}
            id="btn-best-time"
          >
            {loading === "besttime" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
            Best Posting Time
          </Button>
        </div>

        {/* Best time result */}
        <AnimatePresence>
          {bestTime && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-lg bg-muted/50 border border-border p-3 space-y-1"
            >
              <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-primary" />
                Best time for {cfg.name}
              </p>
              <p className="text-sm font-bold text-primary">{bestTime.time}</p>
              <p className="text-xs text-muted-foreground">{bestTime.reason}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rewrite for platforms */}
        {selectedPlatforms.length > 1 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
              <Pen className="w-3 h-3" /> Rewrite for platform
            </p>
            <div className="flex flex-wrap gap-1.5">
              {selectedPlatforms.map(p => (
                <button
                  key={p}
                  onClick={() => rewriteForPlatform(p)}
                  disabled={!!loading}
                  className={`text-xs px-2.5 py-1 rounded-full border border-border bg-muted hover:bg-primary hover:text-white hover:border-primary transition-colors ${loading === `rewrite-${p}` ? "opacity-50" : ""}`}
                  id={`btn-rewrite-${p}`}
                >
                  {PLATFORM_CONFIG[p].name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
