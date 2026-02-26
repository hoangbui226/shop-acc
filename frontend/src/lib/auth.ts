const AUTH_KEY = "shop_acc_user";
const REMEMBERED_USERNAME_KEY = "shop_acc_remembered_username";
const USERS_KEY = "shop_acc_registered_users";

function getAuthRaw(): string | null {
  if (typeof window === "undefined") return null;
  // Session first (no "remember") then localStorage (remember me)
  return sessionStorage.getItem(AUTH_KEY) ?? localStorage.getItem(AUTH_KEY);
}

export function isLoggedIn(): boolean {
  try {
    const raw = getAuthRaw();
    if (!raw) return false;
    const data = JSON.parse(raw);
    return !!data?.user;
  } catch {
    return false;
  }
}

export function getLoggedInUser(): string | null {
  try {
    const raw = getAuthRaw();
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data?.user ?? null;
  } catch {
    return null;
  }
}

/**
 * Call after successful login.
 * @param username - Logged-in username
 * @param remember - If true, persist in localStorage and remember username for next visit; if false, use sessionStorage (logout when tab closes) and clear remembered username
 */
export function setLoggedIn(username: string, remember?: boolean): void {
  if (typeof window === "undefined") return;
  const payload = JSON.stringify({ user: username });
  if (remember) {
    localStorage.setItem(AUTH_KEY, payload);
    localStorage.setItem(REMEMBERED_USERNAME_KEY, username);
    sessionStorage.removeItem(AUTH_KEY);
  } else {
    sessionStorage.setItem(AUTH_KEY, payload);
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(REMEMBERED_USERNAME_KEY);
  }
}

export function logout(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(AUTH_KEY);
  // Keep REMEMBERED_USERNAME_KEY so next time they can still see pre-filled username
}

/** Username to pre-fill on login page when user had "Ghi nhớ tài khoản" checked. */
export function getRememberedUsername(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REMEMBERED_USERNAME_KEY);
}

export type RegisteredUser = { username: string; password: string };

export function getRegisteredUsers(): RegisteredUser[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function registerUser(username: string, password: string): void {
  if (typeof window === "undefined") return;
  const users = getRegisteredUsers();
  users.push({ username: username.trim(), password });
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function verifyCredentials(username: string, password: string): boolean {
  const users = getRegisteredUsers();
  const user = users.find(
    (u) => u.username === username.trim() && u.password === password
  );
  return !!user;
}
