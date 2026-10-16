import { isNotificationEnabledForEmail } from "./preferences";

export async function sendEmailIfEnabled(
  notificationId: string,
  to: string,
  send: () => Promise<void>,
): Promise<void> {
  if (!(await isNotificationEnabledForEmail(notificationId, to))) return;
  await send();
}
