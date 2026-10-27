"use client";

import { useCallback } from "react";
import { workspaceFetch } from "@/lib/workspace-fetch";
import { useAdminSession } from "@/contexts/AdminSessionContext";
import {
  CustomerSupportDashboard,
  type ActivityRow,
  type TicketRow,
} from "@/components/customer-support/CustomerSupportDashboard";

export default function DashboardPage() {
  const { canAccessWorkspaceTimesheets } = useAdminSession();

  const loadTickets = useCallback(async () => {
    const res = await workspaceFetch("/tickets");
    const data = await res.json();
    return (data.data as TicketRow[]) ?? [];
  }, []);

  const loadActivity = useCallback(async () => {
    const res = await workspaceFetch("/tickets/activity/recent");
    const data = await res.json();
    return (data.data as ActivityRow[]) ?? [];
  }, []);

  const timesheetsHref = canAccessWorkspaceTimesheets
    ? "/workspace/timesheets/submitted"
    : "/timesheets";

  return (
    <CustomerSupportDashboard
      ticketDetailHref={(id) => `/workspace/tickets/${id}`}
      ticketsListHref="/workspace/tickets"
      timesheetsHref={timesheetsHref}
      loadTickets={loadTickets}
      loadActivity={loadActivity}
      showTimesheetsWidget={false}
    />
  );
}
