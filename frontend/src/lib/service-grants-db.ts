import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import type { UserFeature } from "@/lib/users-types";
import { USER_FEATURES } from "@/lib/users-types";

const DATA_DIR = path.join(process.cwd(), "data");
const SERVICE_GRANTS_FILE = path.join(DATA_DIR, "service-grants.json");

export type ServiceGrant = {
  perUser: number;
  /** ISO date string or null = no expiry */
  expiresAt: string | null;
};

export type ServiceGrantsData = {
  /** One grant per feature. If present, every user gets up to perUser uses (until expiry). */
  grants: Partial<Record<UserFeature, ServiceGrant>>;
  /** usage[username][feature] = number of times this user has used the grant for that feature */
  usage: Record<string, Record<string, number>>;
};

async function ensureDataDir(): Promise<void> {
  try {
    await mkdir(DATA_DIR, { recursive: true });
  } catch {
    // already exists
  }
}

export async function readServiceGrants(): Promise<ServiceGrantsData> {
  await ensureDataDir();
  try {
    const raw = await readFile(SERVICE_GRANTS_FILE, "utf-8");
    const data = JSON.parse(raw) as Partial<ServiceGrantsData>;
    const grants = data.grants ?? {};
    const usage = data.usage && typeof data.usage === "object" ? data.usage : {};
    return { grants, usage };
  } catch {
    return { grants: {}, usage: {} };
  }
}

export async function writeServiceGrants(data: ServiceGrantsData): Promise<void> {
  await ensureDataDir();
  await writeFile(SERVICE_GRANTS_FILE, JSON.stringify(data, null, 2), "utf-8");
}

/** Get how many grant uses this user has left for a feature. 0 if no grant or expired or used up. */
export function getGrantRemaining(
  username: string,
  feature: UserFeature,
  data: ServiceGrantsData,
  now: Date = new Date()
): number {
  const grant = data.grants[feature];
  if (!grant || grant.perUser <= 0) return 0;
  if (grant.expiresAt && new Date(grant.expiresAt).getTime() <= now.getTime()) return 0;
  const used = data.usage[username?.trim().toLowerCase()]?.[feature] ?? 0;
  return Math.max(0, grant.perUser - used);
}

/** Consume one grant use for this user/feature. Returns true if consumed. */
export async function consumeGrant(username: string, feature: UserFeature): Promise<boolean> {
  const data = await readServiceGrants();
  const remaining = getGrantRemaining(username, feature, data);
  if (remaining <= 0) return false;
  const key = username.trim().toLowerCase();
  if (!data.usage[key]) data.usage[key] = {};
  const current = data.usage[key][feature] ?? 0;
  data.usage[key][feature] = current + 1;
  await writeServiceGrants(data);
  return true;
}

/** Set or clear grants (admin). Replaces entire grants map. */
export async function setServiceGrants(grants: Partial<Record<UserFeature, ServiceGrant>>): Promise<void> {
  const data = await readServiceGrants();
  data.grants = grants;
  await writeServiceGrants(data);
}
