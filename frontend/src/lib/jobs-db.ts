import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import type { UserFeature, StoredUser } from "@/lib/users-types";
import { SPAM_LOGIN_JOB_DAYS, USER_FEATURES } from "@/lib/users-types";
import { findUserByUsername } from "@/lib/users-db";
import { readServiceGrants, getGrantRemaining } from "@/lib/service-grants-db";

const DATA_DIR = path.join(process.cwd(), "data");
const JOBS_FILE = path.join(DATA_DIR, "jobs.json");

export type StoredJob = {
  id: string;
  username: string;
  feature: UserFeature;
  startedAt: string; // ISO
  expiresAt: string | null; // ISO; null for instant (1-time) jobs
  status: "active" | "completed" | "expired" | "cancelled" | "paused";
  /** Optional metadata (bannerUrl for display; accessToken for pause/resume, server-only). */
  meta?: { bannerUrl?: string; accessToken?: string };
  /** If true, this job used a service grant and does not count toward user's normal allowance. */
  fromServiceGrant?: boolean;
};

async function ensureDataDir(): Promise<void> {
  try {
    await mkdir(DATA_DIR, { recursive: true });
  } catch {
    // already exists
  }
}

export async function readJobs(): Promise<StoredJob[]> {
  await ensureDataDir();
  try {
    const raw = await readFile(JOBS_FILE, "utf-8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function writeJobs(jobs: StoredJob[]): Promise<void> {
  await ensureDataDir();
  await writeFile(JOBS_FILE, JSON.stringify(jobs, null, 2), "utf-8");
}

function generateId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/** Count how many jobs count as "used" for remaining: spam_login = active only (not expired); others = all jobs. Excludes jobs with fromServiceGrant (they use grant quota, not allowance). */
export function countJobsUsed(jobs: StoredJob[], username: string, feature: UserFeature, now: Date): number {
  const userJobs = jobs.filter(
    (j) =>
      j.username.toLowerCase() === username.toLowerCase() &&
      j.feature === feature &&
      !j.fromServiceGrant
  );
  if (feature === "spam_login") {
    return userJobs.filter((j) => j.status === "active" && j.expiresAt && new Date(j.expiresAt).getTime() > now.getTime()).length;
  }
  return userJobs.length;
}

/** Spam login: fixed 15-day pool per user. Used = elapsed time (so far) of active+paused spam jobs; decreases over time as jobs run. */
const SPAM_LOGIN_POOL_DAYS = 15;

export function getSpamLoginLimitRemainingMinutes(user: StoredUser, jobs: StoredJob[], now: Date = new Date()): number {
  const limitMinutes = user.type === "admin" ? 3650 * 24 * 60 : SPAM_LOGIN_POOL_DAYS * 24 * 60;
  const userSpam = jobs.filter(
    (j) =>
      j.username.toLowerCase() === user.username.toLowerCase() &&
      j.feature === "spam_login" &&
      (j.status === "active" || j.status === "paused") &&
      j.startedAt &&
      j.expiresAt
  );
  let usedMinutes = 0;
  const nowMs = now.getTime();
  for (const j of userSpam) {
    const start = new Date(j.startedAt).getTime();
    const end = new Date(j.expiresAt!).getTime();
    const elapsedEnd = Math.min(nowMs, end);
    usedMinutes += Math.max(0, Math.round((elapsedEnd - start) / 60000));
  }
  return Math.max(0, limitMinutes - usedMinutes);
}

/** Options when creating a job (e.g. spam_login duration and meta). */
export type CreateJobOptions = {
  spamLoginDays?: number;
  spamLoginDurationMinutes?: number;
  /** Optional metadata (bannerUrl, accessToken for pause/resume). */
  meta?: { bannerUrl?: string; accessToken?: string };
  /** If true, job does not count toward user's normal allowance (uses service grant). */
  fromServiceGrant?: boolean;
};

const SPAM_LOGIN_MAX_MINUTES = 365 * 24 * 60;
const SPAM_LOGIN_DEFAULT_MINUTES = SPAM_LOGIN_JOB_DAYS * 24 * 60;

/** Create a new job. For spam_login sets expiresAt = now + duration (minutes or days); others are instant (completed). */
export async function createJob(
  username: string,
  feature: UserFeature,
  options?: CreateJobOptions
): Promise<StoredJob | null> {
  const jobs = await readJobs();
  const now = new Date();
  const id = generateId();
  let expiresAt: string | null = null;
  let status: StoredJob["status"] = "completed";
  if (feature === "spam_login") {
    const requestedMinutes =
      typeof options?.spamLoginDurationMinutes === "number"
        ? Math.max(1, Math.min(SPAM_LOGIN_MAX_MINUTES, options.spamLoginDurationMinutes))
        : (options?.spamLoginDays ?? SPAM_LOGIN_JOB_DAYS) * 24 * 60;
    const user = await findUserByUsername(username);
    if (user) {
      const remaining = getSpamLoginLimitRemainingMinutes(user, jobs);
      if (requestedMinutes > remaining) return null;
    }
    const minutes = requestedMinutes;
    const end = new Date(now.getTime() + minutes * 60 * 1000);
    expiresAt = end.toISOString();
    status = "active";
  }
  const job: StoredJob = {
    id,
    username: username.trim(),
    feature,
    startedAt: now.toISOString(),
    expiresAt,
    status,
    ...(options?.meta && Object.keys(options.meta).length > 0 ? { meta: options.meta } : {}),
    ...(options?.fromServiceGrant ? { fromServiceGrant: true } : {}),
  };
  jobs.push(job);
  await writeJobs(jobs);
  return job;
}

/** Get currently running jobs for a user (admin dashboard, profile). Excludes expired, cancelled, completed. */
export async function getActiveJobsByUser(username: string): Promise<StoredJob[]> {
  await markExpiredJobs();
  const jobs = await readJobs();
  const now = new Date();
  const nowMs = now.getTime();
  return jobs.filter((j) => {
    if (j.username.toLowerCase() !== username.toLowerCase()) return false;
    if (j.status !== "active" && j.status !== "paused") return false;
    if (j.expiresAt && new Date(j.expiresAt).getTime() <= nowMs) return false;
    return true;
  });
}

/** Get all jobs for a user (for profile History), newest first. */
export async function getJobsByUser(username: string): Promise<StoredJob[]> {
  await markExpiredJobs();
  const jobs = await readJobs();
  return jobs
    .filter((j) => j.username.toLowerCase() === username.toLowerCase())
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
}

const XOABOT_API = "http://103.139.155.35:9090/xoabot";
const ADDBOT_API = "http://103.139.155.35:9090/addbot";

/** Pause an active spam_login job (calls xoabot). Returns { ok, error? }. */
export async function pauseJob(jobId: string, username: string): Promise<{ ok: boolean; error?: string }> {
  const jobs = await readJobs();
  const job = jobs.find((j) => j.id === jobId && j.username.toLowerCase() === username.toLowerCase());
  if (!job || job.feature !== "spam_login" || job.status !== "active") {
    return { ok: false, error: "Không tìm thấy công việc hoặc không thể tạm dừng." };
  }
  const token = job.meta?.accessToken?.trim();
  if (!token) return { ok: false, error: "Thiếu token." };
  try {
    const res = await fetch(`${XOABOT_API}?accs=${encodeURIComponent(token)}`);
    const data = await res.json().catch(() => ({}));
    if (data["1"] !== true) {
      return { ok: false, error: (data["0"] as string) || "Không gỡ được bot." };
    }
    job.status = "paused";
    await writeJobs(jobs);
    return { ok: true };
  } catch (err) {
    console.error("pauseJob error:", err);
    return { ok: false, error: "Lỗi kết nối." };
  }
}

/** Resume a paused spam_login job (calls addbot). Returns { ok, error? }. */
export async function resumeJob(jobId: string, username: string): Promise<{ ok: boolean; error?: string }> {
  const jobs = await readJobs();
  const job = jobs.find((j) => j.id === jobId && j.username.toLowerCase() === username.toLowerCase());
  if (!job || job.feature !== "spam_login" || job.status !== "paused") {
    return { ok: false, error: "Không tìm thấy công việc hoặc không thể tiếp tục." };
  }
  const token = job.meta?.accessToken?.trim();
  if (!token) return { ok: false, error: "Thiếu token." };
  try {
    const res = await fetch(`${ADDBOT_API}?accs=${encodeURIComponent(token)}`);
    const data = await res.json().catch(() => ({}));
    if (data["1"] !== true) {
      return { ok: false, error: (data["0"] as string) || "Không thêm được bot." };
    }
    job.status = "active";
    await writeJobs(jobs);
    return { ok: true };
  } catch (err) {
    console.error("resumeJob error:", err);
    return { ok: false, error: "Lỗi kết nối." };
  }
}

/** Cancel a spam_login job (active or paused). Returns true if cancelled. */
export async function cancelJob(jobId: string, username: string): Promise<boolean> {
  const jobs = await readJobs();
  const job = jobs.find((j) => j.id === jobId && j.username.toLowerCase() === username.toLowerCase());
  if (!job || job.feature !== "spam_login" || (job.status !== "active" && job.status !== "paused")) return false;
  job.status = "cancelled";
  if (job.meta?.accessToken) job.meta.accessToken = "";
  await writeJobs(jobs);
  return true;
}

/** Remove a job from the store (admin or owner). Returns true if removed. */
export async function deleteJob(jobId: string, username: string): Promise<boolean> {
  const jobs = await readJobs();
  const idx = jobs.findIndex((j) => j.id === jobId && j.username.toLowerCase() === username.toLowerCase());
  if (idx === -1) return false;
  jobs.splice(idx, 1);
  await writeJobs(jobs);
  return true;
}

/** Remove all jobs for a user (e.g. when admin deletes the user). */
export async function deleteJobsByUser(username: string): Promise<number> {
  const jobs = await readJobs();
  const normalized = username.trim().toLowerCase();
  const filtered = jobs.filter((j) => j.username.toLowerCase() !== normalized);
  if (filtered.length === jobs.length) return 0;
  await writeJobs(filtered);
  return jobs.length - filtered.length;
}

/** Mark expired spam_login jobs as expired (cleanup). Active or paused jobs past expiresAt become "expired". */
export async function markExpiredJobs(): Promise<void> {
  const jobs = await readJobs();
  const now = new Date();
  const nowMs = now.getTime();
  let changed = false;
  for (const j of jobs) {
    if (j.feature === "spam_login" && (j.status === "active" || j.status === "paused") && j.expiresAt && new Date(j.expiresAt).getTime() <= nowMs) {
      j.status = "expired";
      changed = true;
    }
  }
  if (changed) await writeJobs(jobs);
}

const UNLIMITED = 999999;

/** Get remaining job counts per feature for a user (includes normal allowance + service grant). */
export async function getRemainingByUser(user: StoredUser): Promise<Partial<Record<UserFeature, number>>> {
  await markExpiredJobs();
  const jobs = await readJobs();
  const now = new Date();
  const serviceData = await readServiceGrants();
  const result: Partial<Record<UserFeature, number>> = {};
  for (const feature of USER_FEATURES as readonly UserFeature[]) {
    const isFree = feature === "get_otp";
    const allowance =
      user.type === "admin" || isFree
        ? UNLIMITED
        : Math.max(0, user.jobAllowance?.[feature] ?? 0);
    const used = user.type === "admin" ? 0 : countJobsUsed(jobs, user.username, feature, now);
    const fromAllowance = Math.max(0, allowance - used);
    const fromGrant = user.type === "admin" ? 0 : getGrantRemaining(user.username, feature, serviceData, now);
    result[feature] = fromAllowance + fromGrant;
  }
  return result;
}
