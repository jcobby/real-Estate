import type { Role, Session, User } from "@/types";
import { delay, getDb, mutateDb, uid } from "@/lib/mock/db";
import { LIVE, http, one, setAuthToken } from "./http";
import { normalizeUser } from "./normalize";

export interface RegisterInput {
  name: string;
  email: string;
  phone: string;
  role: Role;
  region: string;
  company?: string;
  /** Required by the real backend; ignored by the mock. */
  password?: string;
}

/* ----------------------------------------------------------------- live impl */

async function liveSession(json: unknown): Promise<Session> {
  const data = (json as { data?: { user?: User; accessToken?: string } }).data ?? {};
  const user = normalizeUser(data.user as User);
  const token = data.accessToken ?? "";
  setAuthToken(token);
  return { user, token, createdAt: new Date().toISOString() };
}

/* --------------------------------------------------------------------- login */

export async function login(email: string, password: string): Promise<Session> {
  if (LIVE) return liveSession(await http.post("/v1/auth/login", { email, password }));

  await delay(600);
  const db = getDb();
  const existing = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  const user =
    existing ??
    createUser({
      name: email
        .split("@")[0]
        .replace(/[._-]+/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      email,
      role: "buyer",
      phone: "+233 20 000 0000",
      region: "Greater Accra",
    });
  return mintSession(user);
}

export async function register(input: RegisterInput): Promise<Session> {
  if (LIVE) {
    return liveSession(
      await http.post("/v1/auth/register", {
        name: input.name,
        email: input.email,
        password: input.password ?? "Password123!",
        phone: input.phone,
        role: input.role,
        region: input.region,
        company: input.company,
      }),
    );
  }
  await delay(700);
  const user = createUser(input);
  return mintSession(user);
}

/** Refresh the current user from the API (used after nullable fields change). */
export async function getCurrentUser(): Promise<User | null> {
  if (LIVE) {
    const u = one<User>(await http.get("/v1/auth/me"), "user");
    return u ? normalizeUser(u) : null;
  }
  return null;
}

/* ----------------------------------------------------------------- mock impl */

function createUser(input: RegisterInput): User {
  const user: User = {
    id: uid("u"),
    name: input.name,
    email: input.email,
    phone: input.phone,
    role: input.role,
    region: input.region,
    company: input.company,
    avatarUrl: `https://i.pravatar.cc/150?img=${(input.name.length * 7) % 70}`,
    verified: false,
    joinedAt: new Date().toISOString(),
  };
  mutateDb((db) => db.users.push(user));
  return user;
}

function mintSession(user: User): Session {
  return {
    user,
    token: `mock-${Math.random().toString(36).slice(2)}`,
    createdAt: new Date().toISOString(),
  };
}
