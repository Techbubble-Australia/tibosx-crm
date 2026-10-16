import type { NotificationEvent, NotificationPayloads } from "./types";
import { notificationHandlers } from "./handlers";

export { getNotificationCatalog, NOTIFICATION_CATALOG } from "./catalog";
export type { NotificationCatalogEntry } from "./catalog";
export type { NotificationEvent, NotificationPayloads } from "./types";

/** Send a transactional notification. Errors are logged and not thrown to callers. */
export async function notify<E extends NotificationEvent>(
  event: E,
  payload: NotificationPayloads[E],
): Promise<void> {
  const handler = notificationHandlers[event];
  if (!handler) {
    console.warn(`[notification] No handler for event: ${event}`);
    return;
  }
  try {
    await handler(payload);
  } catch (err) {
    console.error(`[notification] Failed ${event}`, payload, err);
  }
}

/** Fire-and-forget wrapper for route handlers. */
export function notifyAsync<E extends NotificationEvent>(event: E, payload: NotificationPayloads[E]): void {
  void notify(event, payload);
}
