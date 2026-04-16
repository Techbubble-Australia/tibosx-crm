"use client";

import { X } from "lucide-react";
import { useState } from "react";

export function AnnouncementBar() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="relative bg-[#0a0a0a] px-4 py-2 text-sm text-white">
      <div className="tb-container flex items-center justify-center gap-2">
        <span className="bg-white/10 px-2 py-0.5 rounded text-xs font-medium">NEW</span>
        <span>TechBubble now offers AI-matched talent onboarding in under 24 hours —</span>
        <a href="#" className="underline hover:no-underline">See how it works →</a>
      </div>
      <button
        onClick={() => setIsVisible(false)}
        className="absolute right-4 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
