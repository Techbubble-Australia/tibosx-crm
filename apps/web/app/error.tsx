"use client";

import { useEffect } from "react";

type AppErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AppError({ error, reset }: AppErrorProps) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console -- dev-only diagnostics
      console.error(error);
    }
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 bg-white px-4 py-16 text-center dark:bg-neutral-950">
      <h1 className="text-xl font-semibold text-[#111111] dark:text-neutral-100">Something went wrong</h1>
      <p className="max-w-md text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
        This page hit an unexpected error. Try again, or go back to the home page.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-full bg-[#111111] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          Try again
        </button>
        <a
          href="/"
          className="rounded-full border border-neutral-300 bg-white px-6 py-2.5 text-sm font-semibold text-[#111111] transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
        >
          Home
        </a>
      </div>
    </div>
  );
}
