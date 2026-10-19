import { Resend } from "resend";

export type CareerApplicationEmailData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  country: string;
  visaStatus: string;
  salaryExpectationLabel: string;
  documentUrls: string[];
  message?: string | null;
};

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return null;
  return new Resend(apiKey);
}

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export function requireResendClient(): Resend {
  const resend = getResendClient();
  if (!resend) {
    throw new Error(
      "Email is not configured on the API server. Set RESEND_API_KEY (and MAIL_FROM) on the API service, then restart.",
    );
  }
  return resend;
}

function getMailFrom(): string {
  return process.env.MAIL_FROM?.trim() || "TechBubble Careers <careers@techbubble.com.au>";
}

function getTbosMailFrom(): string {
  return (
    process.env.TBOS_MAIL_FROM?.trim() ||
    process.env.MAIL_FROM?.trim() ||
    "TIBOSX <noreply@techbubble.com.au>"
  );
}

function getHrEmail(): string {
  return process.env.CAREERS_HR_EMAIL?.trim() || "hr@techbubble.com.au";
}

export function buildResumeAbsoluteUrl(resumePath: string): string {
  const base = (process.env.PUBLIC_WEB_URL || "http://localhost:3000").replace(/\/$/, "");
  const path = resumePath.startsWith("/") ? resumePath : `/${resumePath}`;
  return `${base}${path}`;
}

function buildEmailHtml(data: CareerApplicationEmailData): string {
  const documentLinks = data.documentUrls
    .map((url, index) => {
      const absolute = buildResumeAbsoluteUrl(url);
      return `<li><a href="${escapeHtml(absolute)}">Document ${index + 1}</a></li>`;
    })
    .join("");

  const lines = [
    `<p><strong>Name:</strong> ${escapeHtml(data.firstName)} ${escapeHtml(data.lastName)}</p>`,
    `<p><strong>Email:</strong> <a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></p>`,
    `<p><strong>Phone:</strong> ${escapeHtml(data.phone)}</p>`,
    `<p><strong>Position:</strong> ${escapeHtml(data.position)}</p>`,
    `<p><strong>Country:</strong> ${escapeHtml(data.country)}</p>`,
    `<p><strong>Visa status:</strong> ${escapeHtml(data.visaStatus)}</p>`,
    `<p><strong>Salary expectation:</strong> ${escapeHtml(data.salaryExpectationLabel)}</p>`,
    `<p><strong>Documents:</strong></p><ul>${documentLinks}</ul>`,
  ];
  if (data.message?.trim()) {
    lines.push(`<p><strong>Message:</strong></p><p>${escapeHtml(data.message.trim())}</p>`);
  }
  return `<!DOCTYPE html><html><body>${lines.join("")}</body></html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendTimesheetApprovalRequestEmail(input: {
  to: string;
  memberName: string;
  targetLabel: string;
  portalUrl: string;
}): Promise<void> {
  const resend = getResendClient();
  const subject = `Timesheet awaiting your approval — ${input.memberName}`;
  const body = `${input.memberName} submitted a timesheet for ${input.targetLabel || "a support project"}.\n\nSign in to TBOS to approve or reject:\n${input.portalUrl}\n`;
  if (!resend) {
    console.info("[timesheet-approval-email] RESEND not configured; would send to", input.to, subject);
    return;
  }
  const { error } = await resend.emails.send({
    from: getMailFrom(),
    to: [input.to],
    subject,
    text: body,
  });
  if (error) {
    throw new Error(error.message || "Failed to send timesheet approval email");
  }
}

export async function sendTimesheetPmApprovalRequestEmail(input: {
  to: string;
  memberName: string;
  targetLabel: string;
  reviewUrl: string;
}): Promise<void> {
  const subject = `Timesheet to review — ${input.memberName}`;
  const text = `${input.memberName} submitted a timesheet for ${input.targetLabel || "a project"}.\n\nReview and approve in TBOS:\n${input.reviewUrl}\n`;
  await sendSupportTicketNotificationEmail({ to: input.to, subject, body: text });
}

export async function sendTimesheetMemberDecisionEmail(input: {
  to: string;
  memberName: string;
  targetLabel: string;
  reviewUrl: string;
  decision: "approved" | "rejected";
  reason?: string;
}): Promise<void> {
  const verb = input.decision === "approved" ? "approved" : "rejected";
  const subject = `Your timesheet was ${verb}`;
  const lines = [
    `Hello ${input.memberName},`,
    "",
    `Your timesheet for ${input.targetLabel || "your project"} was ${verb}.`,
  ];
  if (input.decision === "rejected" && input.reason?.trim()) {
    lines.push("", `Reason: ${input.reason.trim()}`);
  }
  lines.push("", `Open timesheet: ${input.reviewUrl}`);
  await sendSupportTicketNotificationEmail({
    to: input.to,
    subject,
    body: lines.join("\n"),
  });
}

export type ContactFormEmailData = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  interest?: string | null;
  country?: string | null;
  message: string;
};

export async function sendContactFormNotificationEmail(input: {
  to: string;
  submission: ContactFormEmailData;
}): Promise<void> {
  const s = input.submission;
  const name = `${s.firstName} ${s.lastName}`.trim();
  const subject = `Contact form: ${name}`;
  const text = [
    `Name: ${name}`,
    `Email: ${s.email}`,
    s.phone ? `Phone: ${s.phone}` : null,
    s.company ? `Company: ${s.company}` : null,
    s.interest ? `Interest: ${s.interest}` : null,
    s.country ? `Country: ${s.country}` : null,
    "",
    "Message:",
    s.message,
  ]
    .filter(Boolean)
    .join("\n");
  await sendSupportTicketNotificationEmail({ to: input.to, subject, body: text });
}

export async function sendSupportTicketNotificationEmail(input: {
  to: string;
  subject: string;
  body: string;
}): Promise<void> {
  const resend = getResendClient();
  if (!resend) {
    console.info("[support-ticket-email] RESEND not configured; would send to", input.to, input.subject);
    return;
  }

  const { error } = await resend.emails.send({
    from: getMailFrom(),
    to: [input.to],
    subject: input.subject,
    text: input.body,
  });

  if (error) {
    throw new Error(error.message || "Failed to send support ticket email");
  }
}

export async function sendPasswordResetEmail(input: {
  to: string;
  name: string;
  resetUrl: string;
}): Promise<void> {
  const resend = getResendClient();
  const subject = "Reset your TIBOSX.AI password";
  const greeting = input.name.trim() ? `Hello ${input.name.trim()},` : "Hello,";
  const text = `${greeting}

We received a request to reset the password for your TechBubble Business Operating System (TIBOSX.AI) account.

Reset your password here (link expires in 1 hour):
${input.resetUrl}

If you did not request this, you can ignore this email. Your password will not change until you use the link above.

If you need help, contact your administrator.`;

  if (!resend) {
    console.info("[password-reset-email] RESEND not configured; would send to", input.to, subject, input.resetUrl);
    return;
  }

  const { error } = await resend.emails.send({
    from: getMailFrom(),
    to: [input.to],
    subject,
    text,
  });
  if (error) {
    throw new Error(error.message || "Failed to send password reset email");
  }
}

export async function sendUserInviteEmail(input: {
  to: string;
  name: string;
  temporaryPassword: string;
  loginUrl: string;
  extraText?: string;
}): Promise<void> {
  const resend = requireResendClient();
  const subject = "Your TechBubble account invitation";
  const text = `Hello ${input.name},

An account has been created for you on TechBubble Business Operating System (TBOS).

Sign-in email: ${input.to}
Temporary password: ${input.temporaryPassword}

Sign in here: ${input.loginUrl}

You will be asked to set a new password and enroll in multi-factor authentication (MFA) on first sign-in.
${input.extraText ?? ""}

If you did not expect this email, please contact your administrator.`;

  const { error } = await resend.emails.send({
    from: getTbosMailFrom(),
    to: [input.to],
    subject,
    text,
  });
  if (error) {
    throw new Error(error.message || "Failed to send invite email");
  }
}

export async function sendCareerApplicationEmail(data: CareerApplicationEmailData): Promise<void> {
  const resend = getResendClient();
  if (!resend) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const applicantName = `${data.firstName} ${data.lastName}`.trim();

  const { error } = await resend.emails.send({
    from: getMailFrom(),
    to: [getHrEmail()],
    replyTo: data.email,
    subject: `New career application: ${data.position} — ${applicantName}`,
    html: buildEmailHtml(data),
  });

  if (error) {
    throw new Error(error.message || "Failed to send career application email");
  }
}
