"use client";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error: _error, reset }: GlobalErrorProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-white font-sans text-[#111111] antialiased dark:bg-neutral-950 dark:text-neutral-100">
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 py-16 text-center">
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p className="max-w-md text-sm text-neutral-600 dark:text-neutral-400">
            The application failed to load. Please try again.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-full bg-[#111111] px-6 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-neutral-900"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
