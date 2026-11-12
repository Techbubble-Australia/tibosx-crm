"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { anyEffectiveRole } from "@/lib/admin-roles";
import { workspaceFetch } from "@/lib/workspace-fetch";
import { useAdminSession } from "@/contexts/AdminSessionContext";
import {
  CustomerSupportDashboard,
  type ActivityRow,
  type TicketRow,
} from "@/components/customer-support/CustomerSupportDashboard";

export default function DashboardPage() {
  const {
    canAccessWorkspaceTimesheets,
    canAccessClientWorkspace,
    canAccessClientTickets,
    role,
    additionalRoles,
    sessionLoaded,
  } = useAdminSession();
  const router = useRouter();
  const clientWithoutTickets =
    anyEffectiveRole(role, additionalRoles, ["client"]) &&
    !anyEffectiveRole(role, additionalRoles, ["customer_support"]) &&
    !canAccessClientTickets;

  // Clients on timesheet-only projects have no support tickets; send them to their projects instead.
  useEffect(() => {
    if (!sessionLoaded || !clientWithoutTickets) return;
    router.replace(canAccessClientWorkspace ? "/workspace/client" : "/workspace/timesheets/submitted");
  }, [sessionLoaded, clientWithoutTickets, canAccessClientWorkspace, router]);

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

  if (clientWithoutTickets) return null;

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
