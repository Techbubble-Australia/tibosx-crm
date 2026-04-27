"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useState } from "react";

export type AnnouncementBarContent = {
  badge: string;
  message: string;
  linkText: string;
  linkHref: string;
};

const DEFAULT_CONTENT: AnnouncementBarContent = {
  badge: "NEW",
  message: "TechBubble now offers AI-matched talent onboarding in under 24 hours —",
  linkText: "See how it works →",
  linkHref: "/contact",
};

export function AnnouncementBar({ content }: { content?: AnnouncementBarContent | null }) {
  const [isVisible, setIsVisible] = useState(true);
  const c = content ?? DEFAULT_CONTENT;

  if (!isVisible) return null;

  return (
    <div className="relative bg-[#0a0a0a] px-4 py-2 text-sm text-white">
      <div className="tb-container flex items-center justify-center gap-2">
        <span className="rounded bg-white/10 px-2 py-0.5 text-xs font-medium">{c.badge}</span>
        <span>{c.message}</span>
        <Link href={c.linkHref} className="underline hover:no-underline">
          {c.linkText}
        </Link>
      </div>
      <button
        type="button"
        onClick={() => setIsVisible(false)}
        className="absolute right-4 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
        aria-label="Dismiss announcement"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
