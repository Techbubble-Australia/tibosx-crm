import { isDevelopmentAppEnv } from "@/lib/app-env";

/** Shown when `ENV=development` on the admin service. */
export function DevelopmentModeBanner() {
  if (!isDevelopmentAppEnv()) return null;

  return (
    <div
      role="status"
      className="sticky top-0 z-[200] border-b border-amber-600/40 bg-amber-400 px-3 py-1.5 text-center text-xs font-medium text-amber-950 dark:border-amber-500/30 dark:bg-amber-500 dark:text-amber-950"
    >
      Development mode — you are not on production. Changes here do not affect live TBOS data unless
      this environment points at a production database.
    </div>
  );
}
