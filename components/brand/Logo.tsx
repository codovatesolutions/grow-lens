import React from "react";

export default function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
        <div className="w-4 h-4 rounded bg-primary animate-pulse" />
      </div>
      <span className="font-display font-bold text-lg tracking-tight">
        GrowthLens<span className="text-primary">.</span>
      </span>
    </div>
  );
}
