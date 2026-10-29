import type { ReadonlyURLSearchParams } from "next/navigation";
import type { SortDir } from "@/components/ui/SortableTh";

export type TimesheetListSortKey = "period" | "project" | "member" | "status";

const SORT_KEYS: TimesheetListSortKey[] = ["period", "project", "member", "status"];

export type TimesheetListQueryState = {
  status: string;
  member: string;
  clientId: string;
  periodFrom: string;
  periodTo: string;
  sortKey: TimesheetListSortKey;
  sortDir: SortDir;
  page: number;
  pageSize: number;
};

export const DEFAULT_TIMESHEET_LIST_QUERY: TimesheetListQueryState = {
  status: "",
  member: "",
  clientId: "",
  periodFrom: "",
  periodTo: "",
  sortKey: "period",
  sortDir: "desc",
  page: 1,
  pageSize: 20,
};

function parseSortKey(raw: string | null): TimesheetListSortKey {
  if (raw && SORT_KEYS.includes(raw as TimesheetListSortKey)) {
    return raw as TimesheetListSortKey;
  }
  return DEFAULT_TIMESHEET_LIST_QUERY.sortKey;
}

function parseSortDir(raw: string | null): SortDir {
  return raw === "asc" ? "asc" : "desc";
}

function parsePage(raw: string | null): number {
  const n = raw ? Number.parseInt(raw, 10) : DEFAULT_TIMESHEET_LIST_QUERY.page;
  return Number.isFinite(n) && n >= 1 ? n : DEFAULT_TIMESHEET_LIST_QUERY.page;
}

function parsePageSize(raw: string | null): number {
  const n = raw ? Number.parseInt(raw, 10) : DEFAULT_TIMESHEET_LIST_QUERY.pageSize;
  if (!Number.isFinite(n)) return DEFAULT_TIMESHEET_LIST_QUERY.pageSize;
  return [10, 20, 50, 100].includes(n) ? n : DEFAULT_TIMESHEET_LIST_QUERY.pageSize;
}

export function timesheetListQueryFromSearchParams(
  searchParams: ReadonlyURLSearchParams,
): TimesheetListQueryState {
  return {
    status: searchParams.get("status")?.trim() ?? "",
    member: searchParams.get("member")?.trim() ?? "",
    clientId: searchParams.get("clientId")?.trim() ?? "",
    periodFrom: searchParams.get("periodFrom")?.trim() ?? "",
    periodTo: searchParams.get("periodTo")?.trim() ?? "",
    sortKey: parseSortKey(searchParams.get("sort")),
    sortDir: parseSortDir(searchParams.get("dir")),
    page: parsePage(searchParams.get("page")),
    pageSize: parsePageSize(searchParams.get("pageSize")),
  };
}

export function timesheetListQueryToSearchParams(state: TimesheetListQueryState): URLSearchParams {
  const params = new URLSearchParams();
  if (state.status) params.set("status", state.status);
  if (state.member) params.set("member", state.member);
  if (state.clientId) params.set("clientId", state.clientId);
  if (state.periodFrom) params.set("periodFrom", state.periodFrom);
  if (state.periodTo) params.set("periodTo", state.periodTo);
  if (state.sortKey !== DEFAULT_TIMESHEET_LIST_QUERY.sortKey) params.set("sort", state.sortKey);
  if (state.sortDir !== DEFAULT_TIMESHEET_LIST_QUERY.sortDir) params.set("dir", state.sortDir);
  if (state.page !== DEFAULT_TIMESHEET_LIST_QUERY.page) params.set("page", String(state.page));
  if (state.pageSize !== DEFAULT_TIMESHEET_LIST_QUERY.pageSize) {
    params.set("pageSize", String(state.pageSize));
  }
  return params;
}

export function timesheetDetailHref(timesheetId: string, listQuery: URLSearchParams): string {
  const qs = listQuery.toString();
  if (!qs) return `/timesheets/${timesheetId}`;
  return `/timesheets/${timesheetId}?list=${encodeURIComponent(qs)}`;
}

export function timesheetsListHref(listEncoded: string | null): string {
  if (!listEncoded) return "/timesheets";
  return `/timesheets?${listEncoded}`;
}
