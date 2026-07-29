import type { User } from "@/types";
import { delay, getDb } from "@/lib/mock/db";
import { LIVE, http, one } from "./http";
import { normalizeUser } from "./normalize";

export async function getUser(id: string): Promise<User | null> {
  if (LIVE) {
    const u = one<User>(await http.get(`/v1/users/${id}`), "user");
    return u ? normalizeUser(u) : null;
  }
  await delay(150);
  return getDb().users.find((u) => u.id === id) ?? null;
}
