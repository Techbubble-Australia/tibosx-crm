import type { ReactNode } from "react";
import Link from "next/link";

type Props = {
  title: string;
  description?: string;
  action?: ReactNode;
  backHref?: string;
  backLabel?: string;
};

export function PageHeader({ title, description, action, backHref, backLabel = "Back" }: Props) {
  return (
    <div className="space-y-4">
      {backHref ? (
        <Link href={backHref} className="dp-btn-ghost -ml-3 inline-flex w-fit text-slate-600">
          ← {backLabel}
        </Link>
      ) : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
          {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}
