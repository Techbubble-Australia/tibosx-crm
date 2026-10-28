"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, LogOut, UserCircle, VenetianMask } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";

type Props = {
  name: string | null;
  email: string;
  photoUrl?: string | null;
  profileHref: string;
  onSignOut: () => void;
  canImpersonate?: boolean;
  onImpersonate?: () => void;
  /** e.g. "Project member", "Administrator" */
  accessLabel?: string | null;
};

export function UserAccountMenu({
  name,
  email,
  photoUrl,
  profileHref,
  onSignOut,
  canImpersonate,
  onImpersonate,
  accessLabel,
}: Props) {
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
        <span className="hidden min-w-0 flex-col truncate sm:flex">
          <span className="truncate font-medium text-gray-900 dark:text-gray-100">{displayName}</span>
          {accessLabel ? (
            <span className="truncate text-xs font-normal text-gray-500 dark:text-gray-400">{accessLabel}</span>
          ) : null}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-gray-500" />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-1 w-52 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900"
        >
          <div className="border-b border-gray-100 px-3 py-2 dark:border-gray-800">
            <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{displayName}</p>
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">{email}</p>
            {accessLabel ? (
              <p className="mt-1 text-xs font-medium text-sky-700 dark:text-sky-300">{accessLabel}</p>
            ) : null}
          </div>
          <Link
            href={profileHref}
            role="menuitem"
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
            onClick={() => setOpen(false)}
          >
            <UserCircle className="h-4 w-4" />
            My profile
          </Link>
          {canImpersonate && onImpersonate ? (
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
              onClick={() => {
                setOpen(false);
                onImpersonate();
              }}
            >
              <VenetianMask className="h-4 w-4" />
              Impersonate user
            </button>
          ) : null}
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
