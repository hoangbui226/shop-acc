import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { findUserByUsername } from "@/lib/users-db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const username = typeof body.username === "string" ? body.username.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!username || !password) {
      return NextResponse.json(
        { error: "invalid_credentials", message: "Vui lòng điền tên đăng nhập và mật khẩu." },
        { status: 400 }
      );
    }

    const user = await findUserByUsername(username);
    if (!user) {
      return NextResponse.json(
        { error: "invalid_credentials", message: "Tên đăng nhập hoặc mật khẩu không đúng." },
        { status: 401 }
      );
    }
    if (user.banned) {
      return NextResponse.json(
        { error: "account_banned", message: "Tài khoản đã bị khóa. Liên hệ quản trị viên." },
        { status: 403 }
      );
    }

    const match = user.password !== undefined
      ? user.password === password
      : user.passwordHash !== undefined && await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return NextResponse.json(
        { error: "invalid_credentials", message: "Tên đăng nhập hoặc mật khẩu không đúng." },
        { status: 401 }
      );
    }

    return NextResponse.json({ ok: true, username: user.username, type: user.type });
  } catch (e) {
    console.error("Login error:", e);
    return NextResponse.json(
      { error: "Lỗi server. Vui lòng thử lại." },
      { status: 500 }
    );
  }
}
