"use client";

import { useCallback, useEffect, useState } from "react";
import { Heart, Share2, Check } from "lucide-react";

const LIKED_JOBS_KEY = "tb_liked_jobs";
const VISITOR_KEY = "tb_visitor_key";

function getVisitorKey(): string {
  if (typeof window === "undefined") return "";
  let key = localStorage.getItem(VISITOR_KEY);
  if (!key) {
    key =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `v-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(VISITOR_KEY, key);
  }
  return key;
}

function readLikedSlugs(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(LIKED_JOBS_KEY);
    const arr = raw ? (JSON.parse(raw) as string[]) : [];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

function persistLiked(slug: string) {
  const set = readLikedSlugs();
  set.add(slug);
  localStorage.setItem(LIKED_JOBS_KEY, JSON.stringify([...set]));
}

type Props = {
  slug: string;
  title: string;
  initialLikeCount: number;
};

export function JobDetailActions({ slug, title, initialLikeCount }: Props) {
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [liked, setLiked] = useState(false);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const [liking, setLiking] = useState(false);

  useEffect(() => {
    setLiked(readLikedSlugs().has(slug));
  }, [slug]);

  const handleLike = useCallback(async () => {
    if (liked || liking) return;
    setLiking(true);
    try {
      const res = await fetch(`/api/jobs/${encodeURIComponent(slug)}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorKey: getVisitorKey() }),
      });
      const json = await res.json();
      if (res.ok && json?.data) {
        setLikeCount(json.data.likeCount ?? likeCount + 1);
        if (!json.data.alreadyLiked) {
          persistLiked(slug);
        }
        setLiked(true);
      }
    } catch (e) {
      console.error("Like failed", e);
    } finally {
      setLiking(false);
    }
  }, [slug, liked, liking, likeCount]);

  const handleShare = useCallback(async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({ title, text: `Check out this role at TechBubble: ${title}`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareMsg("Link copied!");
      setTimeout(() => setShareMsg(null), 2500);
    } catch {
      /* user cancelled share */
    }
  }, [title]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => void handleLike()}
        disabled={liked || liking}
        className="inline-flex h-11 items-center gap-2 rounded-[18px] border border-[#e5e5e5] bg-white px-4 text-[14px] font-semibold text-[#111111] transition-colors hover:bg-[#fafafa] disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
        aria-pressed={liked}
      >
        <Heart className={`h-4 w-4 ${liked ? "fill-red-500 text-red-500" : ""}`} aria-hidden />
        {liked ? "Liked" : "Like"}
        <span className="text-[#666666] dark:text-zinc-400">({likeCount})</span>
      </button>
      <button
        type="button"
        onClick={() => void handleShare()}
        className="inline-flex h-11 items-center gap-2 rounded-[18px] border border-[#e5e5e5] bg-white px-4 text-[14px] font-semibold text-[#111111] transition-colors hover:bg-[#fafafa] dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
      >
        {shareMsg ? <Check className="h-4 w-4 text-green-600" /> : <Share2 className="h-4 w-4" aria-hidden />}
        {shareMsg ?? "Share"}
      </button>
    </div>
  );
}
