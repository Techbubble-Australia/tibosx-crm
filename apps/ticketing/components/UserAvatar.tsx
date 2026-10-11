"use client";

import { User } from "lucide-react";

type Props = {
  name?: string | null;
  email?: string | null;
  photoUrl?: string | null;
  size?: "sm" | "md";
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

export function UserAvatar({ name, email, photoUrl, size = "md" }: Props) {
  const dim = size === "sm" ? "h-8 w-8 text-xs" : "h-9 w-9 text-sm";
  const src = photoUrl?.trim() || "";

  if (src) {
    const href = src.startsWith("http") || src.startsWith("/") ? src : `/${src}`;
    return <img src={href} alt="" className={`${dim} shrink-0 rounded-full object-cover`} />;
  }

  const label = initials(name, email);
  return (
    <span
      className={`${dim} inline-flex shrink-0 items-center justify-center rounded-full bg-sky-100 font-medium text-sky-800`}
      aria-hidden
    >
      {label || <User className="h-4 w-4" />}
    </span>
  );
}
