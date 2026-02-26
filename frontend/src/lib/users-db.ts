import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

export type UserType = "admin" | "vip" | "user";

export type StoredUser = {
  username: string;
  /** Plain password (current format) */
  password?: string;
  /** Legacy: hashed password; used only for old records */
  passwordHash?: string;
  type: UserType;
  registeredAt: string;
};

async function ensureDataDir(): Promise<void> {
  try {
    await mkdir(DATA_DIR, { recursive: true });
  } catch {
    // already exists
  }
}

export async function readUsers(): Promise<StoredUser[]> {
  await ensureDataDir();
  try {
    const raw = await readFile(USERS_FILE, "utf-8");
    const data = JSON.parse(raw);
    const list = Array.isArray(data) ? data : [];
    return list.map((u: Record<string, unknown>) => ({
      username: u.username as string,
      password: u.password as string | undefined,
      passwordHash: u.passwordHash as string | undefined,
      type: (u.type as StoredUser["type"]) || "user",
      registeredAt: (u.registeredAt as string) || new Date(0).toISOString(),
    }));
  } catch {
    return [];
  }
}

export async function writeUsers(users: StoredUser[]): Promise<void> {
  await ensureDataDir();
  await writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
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
