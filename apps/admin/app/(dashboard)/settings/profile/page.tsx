"use client";

import { Suspense } from "react";
import ProfileSettingsPageInner from "./ProfileSettingsPageInner";

export default function ProfileSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white" />
        </div>
      }
    >
      <ProfileSettingsPageInner />
    </Suspense>
  );
}
