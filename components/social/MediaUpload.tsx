"use client";
import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, Film, ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { socialApi, MediaItem } from "@/lib/social";

interface MediaUploadProps {
  value:    MediaItem[];
  onChange: (items: MediaItem[]) => void;
}

const ACCEPTED = ["image/jpeg","image/png","image/webp","image/gif","video/mp4","video/webm","video/mov"];
const MAX_IMAGE = 10 * 1024 * 1024;
const MAX_VIDEO = 100 * 1024 * 1024;

export default function MediaUpload({ value, onChange }: MediaUploadProps) {
  const [dragging,  setDragging]  = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress,  setProgress]  = useState(0);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArr = Array.from(files);
    const invalid = fileArr.filter(f => !ACCEPTED.includes(f.type));
    if (invalid.length) {
      toast.error(`Unsupported file type: ${invalid.map(f => f.name).join(", ")}`);
      return;
    }
    for (const file of fileArr) {
      const isVideo = file.type.startsWith("video/");
      if (!isVideo && file.size > MAX_IMAGE) { toast.error(`${file.name} exceeds 10 MB image limit`); return; }
      if (isVideo  && file.size > MAX_VIDEO) { toast.error(`${file.name} exceeds 100 MB video limit`); return; }
    }

    setUploading(true);
    setProgress(10);
    try {
      const uploaded: MediaItem[] = [];
      for (let i = 0; i < fileArr.length; i++) {
        const item = await socialApi.uploadMedia(fileArr[i]);
        uploaded.push(item);
        setProgress(Math.round(((i + 1) / fileArr.length) * 90) + 10);
      }
      onChange([...value, ...uploaded]);
      toast.success(`${uploaded.length} file(s) uploaded`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [value, onChange]);

  const remove = (idx: number) => onChange(value.filter((_, i) => i !== idx));

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
          dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"
        }`}
        onClick={() => document.getElementById("media-file-input")?.click()}
        id="media-dropzone"
      >
        <input
          id="media-file-input"
          type="file"
          multiple
          accept={ACCEPTED.join(",")}
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />

        {uploading ? (
          <div className="space-y-3">
            <Loader2 className="w-8 h-8 mx-auto text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Uploading...</p>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        ) : (
          <>
            <Upload className={`w-8 h-8 mx-auto mb-2 ${dragging ? "text-primary" : "text-muted-foreground"}`} />
            <p className="text-sm font-medium">
              {dragging ? "Drop files here" : "Drag & drop or click to upload"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              JPEG, PNG, WEBP, GIF, MP4, MOV · Images ≤10 MB · Videos ≤100 MB
            </p>
          </>
        )}
      </div>

      {/* Preview grid */}
      <AnimatePresence>
        {value.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {value.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative rounded-lg overflow-hidden aspect-square bg-muted group"
              >
                {item.type === "image" ? (
                  <img src={item.url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-muted gap-1">
                    {item.thumbnailUrl ? (
                      <img src={item.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Film className="w-8 h-8 text-muted-foreground" />
                    )}
                    <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded">VIDEO</span>
                  </div>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); remove(idx); }}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  id={`btn-remove-media-${idx}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
