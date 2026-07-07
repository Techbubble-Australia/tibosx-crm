import { Resend } from "resend";

export type CareerApplicationEmailData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  salaryExpectation: number;
  resumeUrl: string;
  message?: string | null;
};

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return null;
  return new Resend(apiKey);
}

function getMailFrom(): string {
  return process.env.MAIL_FROM?.trim() || "TechBubble Careers <careers@techbubble.com.au>";
}

function getHrEmail(): string {
  return process.env.CAREERS_HR_EMAIL?.trim() || "hr@techbubble.com.au";
}

export function buildResumeAbsoluteUrl(resumePath: string): string {
  const base = (process.env.PUBLIC_WEB_URL || "http://localhost:3000").replace(/\/$/, "");
  const path = resumePath.startsWith("/") ? resumePath : `/${resumePath}`;
  return `${base}${path}`;
}

function formatSalaryAud(amount: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function buildEmailHtml(data: CareerApplicationEmailData, resumeAbsoluteUrl: string): string {
  const lines = [
    `<p><strong>Name:</strong> ${escapeHtml(data.firstName)} ${escapeHtml(data.lastName)}</p>`,
    `<p><strong>Email:</strong> <a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></p>`,
    `<p><strong>Phone:</strong> ${escapeHtml(data.phone)}</p>`,
    `<p><strong>Position:</strong> ${escapeHtml(data.position)}</p>`,
    `<p><strong>Salary expectation:</strong> ${escapeHtml(formatSalaryAud(data.salaryExpectation))}</p>`,
    `<p><strong>Resume:</strong> <a href="${escapeHtml(resumeAbsoluteUrl)}">${escapeHtml(resumeAbsoluteUrl)}</a></p>`,
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

export async function sendCareerApplicationEmail(data: CareerApplicationEmailData): Promise<void> {
  const resend = getResendClient();
  if (!resend) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const resumeAbsoluteUrl = buildResumeAbsoluteUrl(data.resumeUrl);
  const applicantName = `${data.firstName} ${data.lastName}`.trim();

  const { error } = await resend.emails.send({
    from: getMailFrom(),
    to: [getHrEmail()],
    replyTo: data.email,
    subject: `New career application: ${data.position} — ${applicantName}`,
    html: buildEmailHtml(data, resumeAbsoluteUrl),
  });

  if (error) {
    throw new Error(error.message || "Failed to send career application email");
  }
}
