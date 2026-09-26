"use client";

import type { ClientStatus } from "@/lib/client-status";

type Props = {
  defaultProspect?: boolean;
  defaultActive?: boolean;
  inputClass: string;
};

export function resolveClientStatus(prospect: boolean, active: boolean): ClientStatus {
  if (!active) return "INACTIVE";
  return prospect ? "PROSPECT" : "ACTIVE";
}

export function clientListPathForStatus(status: ClientStatus): string {
  if (status === "PROSPECT") return "/clients/prospect";
  if (status === "INACTIVE") return "/clients/inactive";
  return "/clients/active";
}

export function ClientStatusFields({ defaultProspect = false, defaultActive = true, inputClass }: Props) {
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100">
        <input
          type="checkbox"
          name="prospect"
          defaultChecked={defaultProspect}
          disabled={!defaultActive}
          className="h-4 w-4 rounded border-gray-300"
        />
        Prospect
      </label>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Check to save as a prospect. Unchecked records are active clients.
      </p>
      <label className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100">
        <input
          type="checkbox"
          name="active"
          defaultChecked={defaultActive}
          className="h-4 w-4 rounded border-gray-300"
        />
        Active
      </label>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Uncheck to mark this client as inactive.
      </p>
    </div>
  );
}

export function readClientStatusFromForm(formData: FormData): ClientStatus {
  const active = formData.get("active") === "on";
  const prospect = formData.get("prospect") === "on";
  return resolveClientStatus(prospect, active);
}
