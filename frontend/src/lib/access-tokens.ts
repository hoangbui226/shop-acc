import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const DEFAULT_DIR = path.join(process.cwd(), "data");
const FILE_NAME = "access.json";

/**
 * Directory where access.json is stored.
 * Set env ACCESS_TOKENS_DIR to override (absolute or relative to cwd).
 */
function getAccessTokensDir(): string {
  const env = process.env.ACCESS_TOKENS_DIR;
  if (env && typeof env === "string" && env.trim()) {
    const trimmed = env.trim();
    return path.isAbsolute(trimmed) ? trimmed : path.join(process.cwd(), trimmed);
  }
  return DEFAULT_DIR;
}

function getAccessFilePath(): string {
  return path.join(getAccessTokensDir(), FILE_NAME);
}

async function ensureDir(dir: string): Promise<void> {
  try {
    await mkdir(dir, { recursive: true });
  } catch {
    // already exists
  }
}

/**
 * Read all stored access tokens (no duplicates in file).
 */
export async function readAccessTokens(): Promise<string[]> {
  const dir = getAccessTokensDir();
  await ensureDir(dir);
  const filePath = getAccessFilePath();
  try {
    const raw = await readFile(filePath, "utf-8");
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.filter((t): t is string => typeof t === "string");
  } catch {
    return [];
  }
}

/**
 * Append a valid access token to access.json if not already present.
 * Does not save duplicates.
 */
export async function addAccessToken(token: string): Promise<void> {
  const s = typeof token === "string" ? token.trim() : "";
  if (!s) return;
  const dir = getAccessTokensDir();
  await ensureDir(dir);
  const filePath = getAccessFilePath();
  const existing = await readAccessTokens();
  if (existing.includes(s)) return;
  existing.push(s);
  await writeFile(filePath, JSON.stringify(existing, null, 2), "utf-8");
}
