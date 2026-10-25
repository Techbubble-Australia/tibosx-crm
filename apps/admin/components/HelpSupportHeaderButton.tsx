"use client";

import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { HelpSupportDialog } from "@/components/HelpSupportDialog";

export function HelpSupportHeaderButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
        aria-label="Help and Support"
        title="Help and Support"
      >
        <HelpCircle className="h-5 w-5" />
      </button>
      <HelpSupportDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
