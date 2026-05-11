import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-white px-4 py-16 text-center dark:bg-neutral-950">
      <p className="text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">404</p>
      <h1 className="text-2xl font-bold text-[#111111] dark:text-neutral-100">Page not found</h1>
      <p className="max-w-md text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
        The page you requested does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-full bg-[#111111] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
      >
        Back to home
      </Link>
    </div>
  );
}
