import { sendUserInviteEmail } from "./mail.js";

export function tbosLoginUrl(): string {
  return (process.env.ADMIN_PUBLIC_URL || process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3002").replace(
    /\/$/,
    "",
  );
}

export async function emailTbosUserInvite(input: {
  to: string;
  name: string;
  temporaryPassword: string;
  context?: "project_member" | "client";
}): Promise<void> {
  const loginUrl = tbosLoginUrl();
  const portalHint =
    input.context === "client"
      ? `\n\nYou can also use the client support portal once your organization is set up.`
      : "";
  await sendUserInviteEmail({
    to: input.to,
    name: input.name,
    temporaryPassword: input.temporaryPassword,
    loginUrl,
    extraText: portalHint,
  });
}
