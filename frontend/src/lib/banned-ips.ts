import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const BANNED_IPS_FILE = path.join(DATA_DIR, "banned-ips.json");

async function ensureDataDir(): Promise<void> {
  try {
    await mkdir(DATA_DIR, { recursive: true });
  } catch {
    // ignore
  }
}

export async function readBannedIps(): Promise<string[]> {
  await ensureDataDir();
  try {
    const raw = await readFile(BANNED_IPS_FILE, "utf-8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data.filter((ip: unknown) => typeof ip === "string" && ip.trim() !== "") : [];
  } catch {
    return [];
  }
}

export async function isIpBanned(ip: string): Promise<boolean> {
  if (!ip || ip === "unknown") return false;
  const normalized = ip.trim().toLowerCase();
  const list = await readBannedIps();
  return list.some((b) => b.trim().toLowerCase() === normalized);
}

export async function addBannedIp(ip: string): Promise<void> {
  const list = await readBannedIps();
  const n = ip.trim();
  if (!n || list.some((b) => b.trim().toLowerCase() === n.toLowerCase())) return;
  list.push(n);
  await ensureDataDir();
  await writeFile(BANNED_IPS_FILE, JSON.stringify(list, null, 2), "utf-8");
}

export async function removeBannedIp(ip: string): Promise<void> {
  const list = await readBannedIps();
  const normalized = ip.trim().toLowerCase();
  const filtered = list.filter((b) => b.trim().toLowerCase() !== normalized);
  if (filtered.length === list.length) return;
  await ensureDataDir();
  await writeFile(BANNED_IPS_FILE, JSON.stringify(filtered, null, 2), "utf-8");
}
