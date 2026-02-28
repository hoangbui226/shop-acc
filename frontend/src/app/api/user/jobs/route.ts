import { NextRequest, NextResponse } from "next/server";
import { getJobsByUser } from "@/lib/jobs-db";

/** GET /api/user/jobs?username=xxx — returns job history for the user. Header X-Username must match. */
export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username")?.trim();
  const headerUser = request.headers.get("X-Username")?.trim();

  if (!username) {
    return NextResponse.json(
      { error: "Thiếu username." },
      { status: 400 }
    );
  }

  if (headerUser && headerUser.toLowerCase() !== username.toLowerCase()) {
    return NextResponse.json(
      { error: "Không được xem lịch sử của tài khoản khác." },
      { status: 403 }
    );
  }

  try {
    const jobs = await getJobsByUser(username);
    return NextResponse.json({
      jobs: jobs.map((j) => ({
        id: j.id,
        feature: j.feature,
        startedAt: j.startedAt,
        expiresAt: j.expiresAt,
        status: j.status,
        meta: j.meta ? { bannerUrl: j.meta.bannerUrl } : undefined,
      })),
    });
  } catch (e) {
    console.error("User jobs API error:", e);
    return NextResponse.json(
      { error: "Lỗi server. Vui lòng thử lại." },
      { status: 500 }
    );
  }
}
