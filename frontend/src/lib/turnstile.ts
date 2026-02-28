/**
 * Verify Cloudflare Turnstile token server-side.
 * If TURNSTILE_SECRET_KEY is not set, returns true (skip verification for dev).
 */

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

type SiteverifyResponse = {
  success: boolean;
  "error-codes"?: string[];
};

export async function verifyTurnstileToken(
  token: string | undefined,
  remoteip?: string
): Promise<{ ok: boolean; error?: string }> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret?.trim()) {
    // Dev: skip verification when secret not configured
    return { ok: true };
  }
  if (!token?.trim()) {
    return { ok: false, error: "Thiếu xác minh CAPTCHA. Vui lòng thử lại." };
  }
  try {
    const body = new URLSearchParams({
      secret,
      response: token.trim(),
    });
    if (remoteip?.trim()) body.set("remoteip", remoteip.trim());
    const res = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    const data: SiteverifyResponse = await res.json().catch(() => ({ success: false }));
    if (data.success) return { ok: true };
    const codes = data["error-codes"] ?? [];
    const msg = codes.includes("timeout-or-duplicate")
      ? "Mã xác minh đã hết hạn hoặc đã dùng. Vui lòng thử lại."
      : "Xác minh CAPTCHA thất bại. Vui lòng thử lại.";
    return { ok: false, error: msg };
  } catch (e) {
    console.error("Turnstile verify error:", e);
    return { ok: false, error: "Không thể xác minh. Vui lòng thử lại." };
  }
}
