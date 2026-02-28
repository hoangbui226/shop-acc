/**
 * Shared user types and constants. Safe to import in client components (no Node.js).
 * Server-only code (fs, etc.) lives in users-db.ts.
 */

export type UserType = "admin" | "user";

/** Feature keys: what a user can be allowed to do. */
export const USER_FEATURES = [
  "check_info",
  "spam_login",
  "remove_mail",
  "attach_mail",
  "get_otp",
] as const;
export type UserFeature = (typeof USER_FEATURES)[number];

/** Features that are free for everyone; no admin allowance needed. */
export const FREE_FEATURES: readonly UserFeature[] = ["get_otp"];

/** Features that admin can set allowance for (excludes free features). */
export const FEATURES_WITH_ALLOWANCE = (USER_FEATURES as readonly UserFeature[]).filter(
  (f) => !FREE_FEATURES.includes(f)
);

/** Per-feature job allowance: how many jobs the user can use. 0 or omit = no access. */
export type JobAllowance = Partial<Record<UserFeature, number>>;

/** Default duration in days for one spam_login job. */
export const SPAM_LOGIN_JOB_DAYS = 15;

export type StoredUser = {
  username: string;
  password?: string;
  passwordHash?: string;
  type: UserType;
  registeredAt: string;
  /** Per-feature job allowance. Replaces time-based limits. */
  jobAllowance?: JobAllowance;
  /** If true, user cannot log in (admin can set via admin panel). */
  banned?: boolean;
};
