"use client";

import { useCallback, useEffect, useState } from "react";
import { workspaceFetch } from "@/lib/workspace-fetch";
import {
  CustomerSupportDashboard,
  type ActivityRow,
  type TicketRow,
  type TimesheetSummary,
} from "@/components/customer-support/CustomerSupportDashboard";

export default function DashboardPage() {
  const [role, setRole] = useState<string>("CLIENT");

  useEffect(() => {
    void workspaceFetch("/auth/me")
      .then((res) => res.json())
      .then((data) => setRole((data.data as { role: string }).role));
  }, []);

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

  const loadTimesheetSummary = useCallback(async () => {
    const res = await workspaceFetch("/timesheets/summary");
    const data = await res.json();
    return (data.data as TimesheetSummary) ?? { total: 0, pendingApproval: 0 };
  }, []);

  const showTimesheetSummary = role === "CLIENT" || role === "CONSULTANT";

  return (
    <CustomerSupportDashboard
      ticketDetailHref={(id) => `/workspace/tickets/${id}`}
      ticketsListHref="/workspace/tickets"
      timesheetsHref="/workspace/timesheets"
      loadTickets={loadTickets}
      loadActivity={loadActivity}
      loadTimesheetSummary={loadTimesheetSummary}
      showTimesheetSummary={showTimesheetSummary}
    />
  );
}
