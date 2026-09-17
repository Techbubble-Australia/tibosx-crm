import type { ContractStatus } from "@/lib/contract-status";
import { CONTRACT_ACTIVE_STATUSES } from "@/lib/contract-groups";

export function contractsListPathForStatus(status: ContractStatus): string {
  return (CONTRACT_ACTIVE_STATUSES as readonly string[]).includes(status)
    ? "/contracts/active"
    : "/contracts/inactive";
}
