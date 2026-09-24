"use client";

import type { ClientStatus } from "@/lib/client-status";

type Props = {
  defaultProspect?: boolean;
  defaultInactive?: boolean;
  inputClass: string;
};

export function resolveClientStatus(prospect: boolean, inactive: boolean): ClientStatus {
  if (inactive) return "INACTIVE";
  return prospect ? "PROSPECT" : "ACTIVE";
}

export function clientListPathForStatus(status: ClientStatus): string {
  if (status === "PROSPECT") return "/clients/prospect";
  if (status === "INACTIVE") return "/clients/inactive";
  return "/clients/active";
}

export function ClientStatusFields({ defaultProspect = false, defaultInactive = false, inputClass }: Props) {
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100">
        <input
          type="checkbox"
          name="prospect"
          defaultChecked={defaultProspect}
          disabled={defaultInactive}
          className="h-4 w-4 rounded border-gray-300"
        />
        Prospect
      </label>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Check to save as a prospect. Unchecked records are active clients.
      </p>
      <label className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100">
        <input type="checkbox" name="inactive" defaultChecked={defaultInactive} className="h-4 w-4 rounded border-gray-300" />
        Inactive
      </label>
    </div>
  );
}

export function readClientStatusFromForm(formData: FormData): ClientStatus {
  const inactive = formData.get("inactive") === "on";
  const prospect = formData.get("prospect") === "on";
  return resolveClientStatus(prospect, inactive);
}
