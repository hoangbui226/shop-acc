import { NextRequest, NextResponse } from "next/server";
import { findUserByUsername } from "@/lib/users-db";

export function getUsernameFromRequest(request: NextRequest): string | null {
  const header = request.headers.get("x-username")?.trim();
  if (header) return header;
  return request.nextUrl.searchParams.get("username")?.trim() ?? null;
}

export async function requireAdmin(request: NextRequest): Promise<NextResponse | null> {
  const username = getUsernameFromRequest(request);
  if (!username) {
    return NextResponse.json(
      { error: "Thiếu xác thực. Vui lòng đăng nhập." },
      { status: 401 }
    );
  }
  const user = await findUserByUsername(username);
  if (!user || user.type !== "admin") {
    return NextResponse.json(
      { error: "Bạn không có quyền truy cập." },
      { status: 403 }
    );
  }
  return null;
}
