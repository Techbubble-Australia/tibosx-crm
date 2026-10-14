"use client";

import { useCallback } from "react";
import { adminFetch } from "@/lib/admin-api";
import {
  CustomerSupportDashboard,
  type ActivityRow,
  type TicketRow,
  type TimesheetSummary,
} from "@/components/customer-support/CustomerSupportDashboard";

export default function CustomerSupportDashboardPage() {
  const loadTickets = useCallback(async () => {
    const res = await adminFetch("/api/admin/ticketing/tickets");
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to load tickets");
    return (data.data as TicketRow[]) ?? [];
  }, []);

  const loadActivity = useCallback(async () => {
    const res = await adminFetch("/api/admin/ticketing/tickets/activity/recent");
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to load activity");
    return (data.data as ActivityRow[]) ?? [];
  }, []);

  const loadTimesheetSummary = useCallback(async () => {
    const res = await adminFetch("/api/admin/ticketing/timesheets/summary");
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to load timesheets");
    return (data.data as TimesheetSummary) ?? { total: 0, pendingApproval: 0 };
  }, []);

  return (
    <CustomerSupportDashboard
      ticketDetailHref={(id) => `/support-tickets/${id}`}
      ticketsListHref="/support-tickets"
      timesheetsHref="/timesheets"
      loadTickets={loadTickets}
      loadActivity={loadActivity}
      loadTimesheetSummary={loadTimesheetSummary}
      showTimesheetSummary
    />
  );
}
