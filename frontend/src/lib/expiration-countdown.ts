/**
 * Returns a countdown string for expiration date (hours and minutes).
 * - null/empty: "Không giới hạn"
 * - past: "Đã hết hạn"
 * - future: "X ngày Y giờ Z phút" or "X giờ Y phút" (includes minutes)
 */
export function getExpirationCountdown(expiresAt: string | null, now: Date = new Date()): string {
  if (!expiresAt?.trim()) return "Không giới hạn";
  try {
    const end = new Date(expiresAt.trim());
    if (Number.isNaN(end.getTime())) return expiresAt;
    const diffMs = end.getTime() - now.getTime();
    if (diffMs <= 0) return "Đã hết hạn";
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const totalHours = Math.floor(totalMinutes / 60);
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    const minutes = totalMinutes % 60;
    const pad = (n: number) => String(n).padStart(2, "0");
    if (days > 0) {
      return `${days} ngày ${pad(hours)} giờ ${pad(minutes)} phút`;
    }
    if (totalHours > 0) {
      return `${totalHours} giờ ${pad(minutes)} phút`;
    }
    return `${minutes} phút`;
  } catch {
    return expiresAt;
  }
}

/** Format expiry as exact date/time for display (dd/MM/yyyy, HH:mm). */
export function formatExpiryDateTime(expiresAt: string | null): string {
  if (!expiresAt?.trim()) return "—";
  try {
    const d = new Date(expiresAt.trim());
    if (Number.isNaN(d.getTime())) return expiresAt;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const h = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year}, ${h}:${min}`;
  } catch {
    return expiresAt ?? "—";
  }
}
