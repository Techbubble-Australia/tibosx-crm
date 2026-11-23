"use client";

import { useEffect } from "react";

/** Catches errors outside the dashboard segment (root layout / providers). */
export default function GlobalError({
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
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-6 text-center">
        <h2 className="text-lg font-semibold text-gray-900">Something went wrong</h2>
        <p className="max-w-md text-sm text-gray-600">
          {looksLikeChunkError
            ? "The page may be out of date after an update. Refresh to load the latest version."
            : message}
        </p>
        <button
          type="button"
          onClick={handleRetry}
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          {looksLikeChunkError ? "Refresh page" : "Try again"}
        </button>
      </body>
    </html>
  );
}
