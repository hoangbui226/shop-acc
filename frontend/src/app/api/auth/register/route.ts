import { NextRequest, NextResponse } from "next/server";
import { readUsers, writeUsers, usernameExists, type StoredUser } from "@/lib/users-db";

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
    const body = await request.json();
    const username = typeof body.username === "string" ? body.username.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

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

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Register error:", e);
    return NextResponse.json(
      { error: "Lỗi server. Vui lòng thử lại." },
      { status: 500 }
    );
  }
}
