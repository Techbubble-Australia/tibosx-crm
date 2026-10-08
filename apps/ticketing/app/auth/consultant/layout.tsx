import { Suspense } from "react";

export default function ConsultantAuthLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sm">Loading…</div>}>{children}</Suspense>;
}
