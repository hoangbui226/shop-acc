import { NextRequest, NextResponse } from "next/server";
import { cancelJob, getRemainingByUser } from "@/lib/jobs-db";
import { findUserByUsername } from "@/lib/users-db";

/** POST /api/jobs/cancel - cancel an active spam_login job. Body: { jobId }. Header: X-Username. */
export async function POST(request: NextRequest) {
  const username = request.headers.get("X-Username")?.trim();
  if (!username) {
    return NextResponse.json({ error: "Thiếu đăng nhập." }, { status: 401 });
  }

  let body: { jobId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON không hợp lệ." }, { status: 400 });
  }

  const jobId = typeof body.jobId === "string" ? body.jobId.trim() : "";
  if (!jobId) {
    return NextResponse.json({ error: "Thiếu jobId." }, { status: 400 });
  }

  const ok = await cancelJob(jobId, username);
  if (!ok) {
    return NextResponse.json(
      { error: "Không tìm thấy công việc hoặc không thể hủy." },
      { status: 404 }
    );
  }

  const user = await findUserByUsername(username);
  const remaining = user ? await getRemainingByUser(user) : undefined;

  return NextResponse.json({ ok: true, remaining });
}
