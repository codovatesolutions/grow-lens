"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { socialApi, ScheduledPost, Platform, PLATFORM_CONFIG } from "@/lib/social";
import {
  FaFacebook, FaInstagram, FaLinkedin, FaXTwitter,
  FaPinterest, FaTiktok, FaYoutube,
} from "react-icons/fa6";

const PLATFORM_ICONS: Record<Platform, React.ElementType> = {
  facebook: FaFacebook, instagram: FaInstagram, linkedin: FaLinkedin,
  twitter: FaXTwitter, pinterest: FaPinterest, tiktok: FaTiktok, youtube: FaYoutube,
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function ContentCalendar() {
  const [today]    = useState(new Date());
  const [current,  setCurrent]  = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [posts,    setPosts]    = useState<ScheduledPost[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState<ScheduledPost[] | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    socialApi.getScheduled().then(data => { setPosts(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const year  = current.getFullYear();
  const month = current.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prev = () => setCurrent(new Date(year, month - 1, 1));
  const next = () => setCurrent(new Date(year, month + 1, 1));

  const postsForDay = (day: number): ScheduledPost[] => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return posts.filter(p => p.scheduled_at.startsWith(dateStr));
  };

  const handleCancel = async (jobId: string) => {
    try {
      await socialApi.cancelSchedule(jobId);
      setPosts(prev => prev.filter(p => p.job_id !== jobId));
      setSelected(prev => prev?.filter(p => p.job_id !== jobId) || null);
      toast.success("Scheduled post cancelled");
    } catch {
      toast.error("Failed to cancel");
    }
  };

  return (
    <div className="space-y-4">
      {/* Calendar header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{MONTHS[month]} {year}</h2>
          <p className="text-sm text-muted-foreground">{posts.length} scheduled post{posts.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={prev} id="btn-cal-prev"><ChevronLeft className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" onClick={next} id="btn-cal-next"><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Grid */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {DAYS.map(d => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-muted-foreground">{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {/* Empty cells for first week */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-20 border-b border-r border-border/50 bg-muted/10 last:border-r-0" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayPosts = postsForDay(day);
            const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;

            return (
              <div
                key={day}
                onClick={() => {
                  if (dayPosts.length > 0) {
                    setSelected(dayPosts);
                    setSelectedDate(`${MONTHS[month]} ${day}`);
                  }
                }}
                className={`min-h-20 p-1.5 border-b border-r border-border/50 last:border-r-0 transition-colors
                  ${dayPosts.length > 0 ? "cursor-pointer hover:bg-muted/30" : ""}
                  ${isToday ? "bg-primary/5" : ""}`}
              >
                <span className={`text-xs font-semibold block mb-1 w-6 h-6 flex items-center justify-center rounded-full
                  ${isToday ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                  {day}
                </span>
                <div className="space-y-0.5">
                  {dayPosts.slice(0, 3).map((post, idx) => (
                    <div key={idx} className="flex items-center gap-1 overflow-hidden">
                      {post.platforms?.slice(0, 2).map((p: Platform) => {
                        const Icon = PLATFORM_ICONS[p];
                        const cfg  = PLATFORM_CONFIG[p];
                        return <Icon key={p} className="w-2.5 h-2.5 flex-shrink-0" style={{ color: cfg.color }} />;
                      })}
                      <span className="text-[9px] text-muted-foreground truncate">
                        {post.caption?.slice(0, 15) || "Post"}
                      </span>
                    </div>
                  ))}
                  {dayPosts.length > 3 && (
                    <span className="text-[9px] text-primary">+{dayPosts.length - 3} more</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day detail drawer */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="rounded-2xl border border-border bg-card p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                {selectedDate}
              </h3>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            {selected.map(post => (
              <div key={post.job_id} className="rounded-lg border border-border p-3 space-y-2">
                <p className="text-sm line-clamp-2">{post.caption || "No caption"}</p>
                <div className="flex items-center gap-1.5">
                  {post.platforms?.map((p: Platform) => {
                    const Icon = PLATFORM_ICONS[p];
                    const cfg  = PLATFORM_CONFIG[p];
                    return <Icon key={p} className="w-3.5 h-3.5" style={{ color: cfg.color }} />;
                  })}
                  <span className="text-xs text-muted-foreground ml-1">
                    {new Date(post.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => handleCancel(post.job_id)}
                  id={`btn-cancel-${post.job_id}`}
                >
                  Cancel
                </Button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
