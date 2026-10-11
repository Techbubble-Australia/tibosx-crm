"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, LogOut, UserCircle } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";

type Props = {
  name: string | null;
  email: string;
  photoUrl?: string | null;
  profileHref: string;
  onSignOut: () => void;
};

export function UserAccountMenu({ name, email, photoUrl, profileHref, onSignOut }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const displayName = name?.trim() || email;

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex max-w-[240px] items-center gap-2 rounded-lg border border-gray-200 px-2 py-1.5 text-left text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <UserAvatar name={name} email={email} photoUrl={photoUrl} size="sm" />
        <span className="hidden min-w-0 truncate font-medium text-gray-900 dark:text-gray-100 sm:inline">
          {displayName}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-gray-500" />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-1 w-52 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900"
        >
          <Link
            href={profileHref}
            role="menuitem"
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
            onClick={() => setOpen(false)}
          >
            <UserCircle className="h-4 w-4" />
            My profile
          </Link>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
            onClick={() => {
              setOpen(false);
              onSignOut();
            }}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
