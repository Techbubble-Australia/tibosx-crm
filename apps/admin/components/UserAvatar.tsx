"use client";

import { User } from "lucide-react";
import { resolveAdminMediaPreviewUrl } from "@/lib/public-media-url";

type Props = {
  name?: string | null;
  email?: string | null;
  photoUrl?: string | null;
  size?: "sm" | "md";
  className?: string;
};

function initials(name: string | null | undefined, email: string | null | undefined): string {
  const source = (name?.trim() || email?.trim() || "").trim();
  if (!source) return "";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function UserAvatar({ name, email, photoUrl, size = "md", className = "" }: Props) {
  const dim = size === "sm" ? "h-8 w-8 text-xs" : "h-9 w-9 text-sm";
  const src = photoUrl ? resolveAdminMediaPreviewUrl(photoUrl) : "";

  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={`${dim} shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }

  const label = initials(name, email);
  return (
    <span
      className={`${dim} inline-flex shrink-0 items-center justify-center rounded-full bg-gray-200 font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200 ${className}`}
      aria-hidden
    >
      {label || <User className="h-4 w-4" />}
    </span>
  );
}
