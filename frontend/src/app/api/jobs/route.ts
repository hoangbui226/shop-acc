import { NextRequest, NextResponse } from "next/server";
import { getActiveJobsByUser } from "@/lib/jobs-db";

/** GET /api/jobs - list active jobs for current user. Header: X-Username. */
export async function GET(request: NextRequest) {
  const username = request.headers.get("X-Username")?.trim();
  if (!username) {
    return NextResponse.json({ error: "Thiếu đăng nhập." }, { status: 401 });
  }

  const jobs = await getActiveJobsByUser(username);
  return NextResponse.json({
    jobs: jobs.map((j) => ({
      id: j.id,
      feature: j.feature,
      startedAt: j.startedAt,
      expiresAt: j.expiresAt,
      status: j.status,
    })),
  });
}
