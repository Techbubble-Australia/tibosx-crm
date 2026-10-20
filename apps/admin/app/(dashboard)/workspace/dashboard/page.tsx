"use client";

import { useCallback } from "react";
import { workspaceFetch } from "@/lib/workspace-fetch";
import { useAdminSession } from "@/contexts/AdminSessionContext";
import { getEffectiveRoles } from "@/lib/admin-roles";
import {
  CustomerSupportDashboard,
  type ActivityRow,
  type TicketRow,
  type TimesheetSummary,
} from "@/components/customer-support/CustomerSupportDashboard";

export default function DashboardPage() {
  const { role, additionalRoles, canAccessWorkspaceTimesheets } = useAdminSession();
  const effectiveRoles = getEffectiveRoles(role, additionalRoles);
  const isCustomerSupport = effectiveRoles.includes("customer_support");

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

  const showTimesheetSummary = canAccessWorkspaceTimesheets && !isCustomerSupport;
  const timesheetsHref = showTimesheetSummary ? "/workspace/timesheets/submitted" : "/timesheets";

  return (
    <CustomerSupportDashboard
      ticketDetailHref={(id) => `/workspace/tickets/${id}`}
      ticketsListHref="/workspace/tickets"
      timesheetsHref={timesheetsHref}
      loadTickets={loadTickets}
      loadActivity={loadActivity}
      loadTimesheetSummary={loadTimesheetSummary}
      showTimesheetSummary={showTimesheetSummary}
    />
  );
}
