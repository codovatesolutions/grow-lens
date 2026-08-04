import React from "react";

export default function Logo() {
  return (
    <div className="flex items-center gap-2">
      <img
        src="/logolensgrowth.jpeg"
        alt="LensGrowth Logo"
        className="w-8 h-8 rounded-lg object-cover border border-border"
      />
      <span className="font-display font-bold text-lg tracking-tight">
        LensGrowth<span className="text-primary">.</span>
      </span>
    </div>
  );
}
