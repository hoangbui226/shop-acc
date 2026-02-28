import { NextRequest, NextResponse } from "next/server";
import { findUserByUsername, updateUserPassword } from "@/lib/users-db";
import { requireAdmin } from "@/lib/admin-auth";

type RouteParams = { params: Promise<{ username: string }> };

/** GET /api/admin/users/[username]/password - return plaintext password if stored (admin only). */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const adminError = await requireAdmin(request);
  if (adminError) return adminError;

  const { username: targetUsername } = await params;
  if (!targetUsername?.trim()) {
    return NextResponse.json({ error: "Thiếu username." }, { status: 400 });
  }

  const user = await findUserByUsername(targetUsername.trim());
  if (!user) {
    return NextResponse.json({ error: "Không tìm thấy tài khoản." }, { status: 404 });
  }

  return NextResponse.json({
    password: typeof user.password === "string" ? user.password : null,
  });
}

/** POST /api/admin/users/[username]/password - set new password (admin only). */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const adminError = await requireAdmin(request);
  if (adminError) return adminError;

  const { username: targetUsername } = await params;
  if (!targetUsername?.trim()) {
    return NextResponse.json({ error: "Thiếu username." }, { status: 400 });
  }

  let body: { newPassword?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON không hợp lệ." }, { status: 400 });
  }

  const newPassword = typeof body.newPassword === "string" ? body.newPassword.trim() : "";
  if (!newPassword) {
    return NextResponse.json({ error: "Vui lòng nhập mật khẩu mới." }, { status: 400 });
  }

  const ok = await updateUserPassword(targetUsername.trim(), newPassword);
  if (!ok) {
    return NextResponse.json({ error: "Không tìm thấy tài khoản." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
