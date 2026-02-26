const AUTH_KEY = "shop_acc_user";
const USERS_KEY = "shop_acc_registered_users";

export function isLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    return !!data?.user;
  } catch {
    return false;
  }
}

export function getLoggedInUser(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data?.user ?? null;
  } catch {
    return null;
  }
}

export function setLoggedIn(username: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_KEY, JSON.stringify({ user: username }));
}

export function logout(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_KEY);
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
