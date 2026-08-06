import React from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  loading?: boolean;
  showSubtitle?: boolean;
}

export default function Logo({ size = "md", className = "", loading = false, showSubtitle = false }: LogoProps) {
  const imgSizeMap = {
    sm: "w-6 h-6 rounded-md",
    md: "w-8 h-8 rounded-lg",
    lg: "w-12 h-12 rounded-xl",
  };

  const textContainerMap = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-2xl",
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className={`relative flex items-center justify-center ${loading ? "animate-pulse" : ""}`}>
        <img
          src="/logolensgrowth.jpeg"
          alt="LensGrowth Logo"
          loading="eager"
          decoding="async"
          // @ts-ignore
          fetchPriority="high"
          className={`${imgSizeMap[size]} object-cover border border-border shadow-sm flex-shrink-0`}
        />
        {loading && (
          <div className="absolute inset-0 rounded-lg bg-primary/20 animate-ping opacity-30" />
        )}
      </div>
      <div className="flex flex-col">
        <span className={`font-display font-bold tracking-tight text-foreground ${textContainerMap[size]}`}>
          LensGrowth<span className="text-primary">.</span>
        </span>
        {showSubtitle && (
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-mono -mt-1">
            by Codovate Solutions
          </span>
        )}
      </div>
    </div>
  );
}

