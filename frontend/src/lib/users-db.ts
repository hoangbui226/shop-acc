import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import type { StoredUser, UserFeature, JobAllowance } from "@/lib/users-types";
import { USER_FEATURES } from "@/lib/users-types";

const FEATURE_KEYS = new Set<string>(USER_FEATURES as unknown as string[]);
const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

export type { StoredUser, UserType, UserFeature, JobAllowance } from "@/lib/users-types";
export { USER_FEATURES } from "@/lib/users-types";

async function ensureDataDir(): Promise<void> {
  try {
    await mkdir(DATA_DIR, { recursive: true });
  } catch {
    // already exists
  }
}

function parseJobAllowance(raw: unknown): JobAllowance | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const out: JobAllowance = {};
  for (const k of Object.keys(raw as Record<string, unknown>)) {
    if (!FEATURE_KEYS.has(k)) continue;
    const v = (raw as Record<string, unknown>)[k];
    const num = typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.floor(v)) : undefined;
    if (num !== undefined) out[k as UserFeature] = num;
  }
  return Object.keys(out).length ? out : undefined;
}

export async function readUsers(): Promise<StoredUser[]> {
  await ensureDataDir();
  try {
    const raw = await readFile(USERS_FILE, "utf-8");
    const data = JSON.parse(raw);
    const list = Array.isArray(data) ? data : [];
    return list.map((u: Record<string, unknown>) => {
      const jobAllowance = parseJobAllowance(u.jobAllowance);
      const legacyPermissions = Array.isArray(u.permissions)
        ? (u.permissions as UserFeature[]).filter((p) => (USER_FEATURES as readonly string[]).includes(p))
        : [];
      const migratedAllowance =
        jobAllowance ??
        (legacyPermissions.length
          ? Object.fromEntries(legacyPermissions.map((p) => [p, 1])) as JobAllowance
          : undefined);
      return {
        username: u.username as string,
        password: u.password as string | undefined,
        passwordHash: u.passwordHash as string | undefined,
        type: ((u.type as string) === "admin" || (u.type as string) === "user" ? u.type : "user") as StoredUser["type"],
        registeredAt: (u.registeredAt as string) || new Date(0).toISOString(),
        jobAllowance: migratedAllowance,
        banned: typeof u.banned === "boolean" ? u.banned : undefined,
      };
    });
  } catch {
    return [];
  }
}

export async function writeUsers(users: StoredUser[]): Promise<void> {
  await ensureDataDir();
  const toWrite = users.map((u) => ({
    username: u.username,
    password: u.password,
    passwordHash: u.passwordHash,
    type: u.type,
    registeredAt: u.registeredAt,
    jobAllowance: u.jobAllowance ?? undefined,
    banned: u.banned ?? undefined,
  }));
  await writeFile(USERS_FILE, JSON.stringify(toWrite, null, 2), "utf-8");
}

export async function findUserByUsername(username: string): Promise<StoredUser | null> {
  const users = await readUsers();
  const normalized = username.trim().toLowerCase();
  return users.find((u) => u.username.toLowerCase() === normalized) ?? null;
}

export async function usernameExists(username: string): Promise<boolean> {
  const user = await findUserByUsername(username);
  return user !== null;
}

/** Delete a user by username. Returns true if found and removed. */
export async function deleteUser(username: string): Promise<boolean> {
  const users = await readUsers();
  const normalized = username.trim().toLowerCase();
  const idx = users.findIndex((u) => u.username.toLowerCase() === normalized);
  if (idx === -1) return false;
  users.splice(idx, 1);
  await writeUsers(users);
  return true;
}

/** Update a user's password (plain). Clears passwordHash so login uses plain password. */
export async function updateUserPassword(username: string, newPassword: string): Promise<boolean> {
  const users = await readUsers();
  const normalized = username.trim().toLowerCase();
  const idx = users.findIndex((u) => u.username.toLowerCase() === normalized);
  if (idx === -1) return false;
  users[idx] = {
    ...users[idx],
    password: newPassword,
    passwordHash: undefined,
  };
  await writeUsers(users);
  return true;
}
