import type { StoredUser, UserFeature } from "@/lib/users-types";

/** True if user has any job allowance for this feature (admin or jobAllowance[feature] > 0). */
export function hasFeature(user: StoredUser, feature: UserFeature): boolean {
  if (user.type === "admin") return true;
  const allowance = user.jobAllowance?.[feature] ?? 0;
  return Number.isFinite(allowance) && allowance > 0;
}

/** Get job allowance for a feature (admin = unlimited, so we return Infinity for UI). */
export function getAllowance(user: StoredUser, feature: UserFeature): number {
  if (user.type === "admin") return Infinity;
  const n = user.jobAllowance?.[feature] ?? 0;
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

/** True if user can use this feature: has allowance and remaining > 0. Pass remaining from API. */
export function canUseFeature(user: StoredUser, feature: UserFeature, remaining: number): boolean {
  if (user.type === "admin") return true;
  if (!hasFeature(user, feature)) return false;
  return remaining > 0;
}

export function canUseCheckInfo(user: StoredUser, remaining: number): boolean {
  return canUseFeature(user, "check_info", remaining);
}
