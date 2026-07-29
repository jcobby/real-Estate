import type { AppNotification } from "@/types";
import { delay, getDb, mutateDb, uid } from "@/lib/mock/db";
import { LIVE, http, many } from "./http";

export async function getNotifications(userId: string): Promise<AppNotification[]> {
  if (LIVE) return many<AppNotification>(await http.get("/v1/notifications"));
  await delay(150);
  return getDb()
    .notifications.filter((n) => n.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function markNotificationRead(id: string): Promise<void> {
  if (LIVE) {
    await http.post(`/v1/notifications/${id}/read`).catch(() => {});
    return;
  }
  mutateDb((db) => {
    const n = db.notifications.find((x) => x.id === id);
    if (n) n.read = true;
  });
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  if (LIVE) {
    await http.post("/v1/notifications/read-all").catch(() => {});
    return;
  }
  await delay(150);
  mutateDb((db) => {
    for (const n of db.notifications) if (n.userId === userId) n.read = true;
  });
}

/**
 * Fire-and-forget helper the mock modules use to emit notifications. With a real
 * backend these are created server-side by the originating action, so this is a
 * no-op in live mode.
 */
export function pushNotification(input: Omit<AppNotification, "id" | "read" | "createdAt">) {
  if (LIVE) return;
  mutateDb((db) => {
    db.notifications.unshift({
      ...input,
      id: uid("ntf"),
      read: false,
      createdAt: new Date().toISOString(),
    });
  });
}
