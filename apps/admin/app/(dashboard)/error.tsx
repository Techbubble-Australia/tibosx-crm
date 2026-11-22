"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const message = error.message || "Something went wrong";
  const looksLikeChunkError =
    /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module/i.test(message);

  function handleRetry() {
    if (looksLikeChunkError) {
      window.location.reload();
      return;
    }
    reset();
  }

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Something went wrong</h2>
      <p className="max-w-md text-sm text-gray-600 dark:text-gray-400">
        {looksLikeChunkError
          ? "The page may be out of date after an update. Refresh to load the latest version."
          : message}
      </p>
      <button
        type="button"
        onClick={handleRetry}
        className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
      >
        {looksLikeChunkError ? "Refresh page" : "Try again"}
      </button>
    </div>
  );
}
