import { NextRequest, NextResponse } from "next/server";
import { resumeJob } from "@/lib/jobs-db";

/** POST /api/jobs/resume - resume a paused spam_login job (calls addbot). Body: { jobId }. Header: X-Username. */
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

  const result = await resumeJob(jobId, username);
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "Không thể tiếp tục." }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
