import { NextRequest, NextResponse } from "next/server";
import { readUsers, writeUsers, usernameExists, type StoredUser } from "@/lib/users-db";
import { getClientIp } from "@/lib/get-client-ip";
import { isIpBanned } from "@/lib/banned-ips";
import { checkRegisterRateLimit, recordRegisterSuccess } from "@/lib/register-rate-limit";
import { verifyTurnstileToken } from "@/lib/turnstile";

/** Format date as year-month-day hour:min:sec GMT+7 (Asia/Ho_Chi_Minh). */
function formatRegisteredAt(date: Date): string {
  const s = date.toLocaleString("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  return s.replace(", ", " ") + " GMT+7";
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    if (await isIpBanned(ip)) {
      return NextResponse.json(
        { error: "Đăng ký bị chặn từ địa chỉ này." },
        { status: 403 }
      );
    }
    const rateLimitError = checkRegisterRateLimit(ip);
    if (rateLimitError) {
      return NextResponse.json(
        { error: rateLimitError },
        { status: 429 }
      );
    }

    const body = await request.json();
    const username = typeof body.username === "string" ? body.username.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const turnstileToken = typeof body.turnstileToken === "string" ? body.turnstileToken : undefined;

    const captcha = await verifyTurnstileToken(turnstileToken, ip);
    if (!captcha.ok) {
      return NextResponse.json(
        { error: captcha.error ?? "Xác minh thất bại." },
        { status: 400 }
      );
    }

    if (!username || !password) {
      return NextResponse.json(
        { error: "Vui lòng điền tên đăng nhập và mật khẩu." },
        { status: 400 }
      );
    }

    if (await usernameExists(username)) {
      return NextResponse.json(
        { error: "username_taken", message: "Tên đăng nhập đã được sử dụng." },
        { status: 409 }
      );
    }

    const newUser: StoredUser = {
      username,
      password,
      type: "user",
      registeredAt: formatRegisteredAt(new Date()),
    };
    const users = await readUsers();
    users.push(newUser);
    await writeUsers(users);
    recordRegisterSuccess(ip);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Register error:", e);
    return NextResponse.json(
      { error: "Lỗi server. Vui lòng thử lại." },
      { status: 500 }
    );
  }
}
