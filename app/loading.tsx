import React from "react";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-md transition-all duration-300">
      <div className="flex flex-col items-center space-y-5 text-center animate-in fade-in zoom-in-95 duration-200">
        {/* Animated Brand Logo Container */}
        <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-card border border-border shadow-2xl p-2.5 group">
          <div className="absolute inset-0 rounded-2xl bg-primary/20 animate-ping opacity-25" />
          <img
            src="/logolensgrowth.jpeg"
            alt="LensGrowth Logo"
            className="w-full h-full rounded-xl object-cover shadow-sm transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        {/* Brand Name & Loading Status */}
        <div className="space-y-1.5">
          <h1 className="font-display font-black text-2xl tracking-tight text-foreground">
            LensGrowth<span className="text-primary">.</span>
          </h1>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-mono">
            by Codovate Solutions
          </p>
        </div>

        {/* Loading Spinner / Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/60 border border-border text-xs text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="font-medium">Loading application...</span>
        </div>
      </div>
    </div>
  );
}
