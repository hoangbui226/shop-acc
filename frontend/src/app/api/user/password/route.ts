import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { findUserByUsername, updateUserPassword } from "@/lib/users-db";

/** GET /api/user/password?username=xxx — return password for self only (X-Username must match). Plain only; if hashed returns { hashed: true }. */
export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username")?.trim();
  const headerUser = request.headers.get("X-Username")?.trim();

  if (!username) {
    return NextResponse.json({ error: "Thiếu username." }, { status: 400 });
  }
  if (!headerUser || headerUser.toLowerCase() !== username.toLowerCase()) {
    return NextResponse.json({ error: "Không được xem mật khẩu tài khoản khác." }, { status: 403 });
  }

  try {
    const user = await findUserByUsername(username);
    if (!user) {
      return NextResponse.json({ error: "Không tìm thấy tài khoản." }, { status: 404 });
    }
    if (user.password !== undefined && user.password !== "") {
      return NextResponse.json({ password: user.password });
    }
    if (user.passwordHash !== undefined) {
      return NextResponse.json({ hashed: true });
    }
    return NextResponse.json({ password: "" });
  } catch (e) {
    console.error("User password GET error:", e);
    return NextResponse.json({ error: "Lỗi server." }, { status: 500 });
  }
}

/** PATCH /api/user/password — body: { currentPassword, newPassword }. Header: X-Username. */
export async function PATCH(request: NextRequest) {
  const username = request.headers.get("X-Username")?.trim();
  if (!username) {
    return NextResponse.json({ error: "Thiếu đăng nhập." }, { status: 401 });
  }

  let body: { currentPassword?: string; newPassword?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON không hợp lệ." }, { status: 400 });
  }

  const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body.newPassword === "string" ? body.newPassword.trim() : "";

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: "Vui lòng điền mật khẩu hiện tại và mật khẩu mới." },
      { status: 400 }
    );
  }

  try {
    const user = await findUserByUsername(username);
    if (!user) {
      return NextResponse.json({ error: "Không tìm thấy tài khoản." }, { status: 404 });
    }

    const match =
      user.password !== undefined
        ? user.password === currentPassword
        : user.passwordHash !== undefined &&
          (await bcrypt.compare(currentPassword, user.passwordHash));

    if (!match) {
      return NextResponse.json(
        { error: "Mật khẩu hiện tại không đúng." },
        { status: 401 }
      );
    }

    const ok = await updateUserPassword(username, newPassword);
    if (!ok) {
      return NextResponse.json({ error: "Không cập nhật được mật khẩu." }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("User password PATCH error:", e);
    return NextResponse.json({ error: "Lỗi server." }, { status: 500 });
  }
}
