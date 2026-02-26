import { NextRequest, NextResponse } from "next/server";
import { findUserByUsername } from "@/lib/users-db";

/** GET /api/user/info?username=xxx - returns public profile (no password). */
export async function GET(request: NextRequest) {
  try {
    const username = request.nextUrl.searchParams.get("username");
    if (!username?.trim()) {
      return NextResponse.json(
        { error: "Thiếu tên đăng nhập." },
        { status: 400 }
      );
    }

    const user = await findUserByUsername(username.trim());
    if (!user) {
      return NextResponse.json(
        { error: "Không tìm thấy tài khoản." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      username: user.username,
      type: user.type,
      registeredAt: user.registeredAt,
      expiresAt: user.expiresAt ?? null,
    });
  } catch (e) {
    console.error("User info API error:", e);
    return NextResponse.json(
      { error: "Lỗi server. Vui lòng thử lại." },
      { status: 500 }
    );
  }
}
