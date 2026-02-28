import { NextRequest, NextResponse } from "next/server";
import { pauseJob } from "@/lib/jobs-db";

/** POST /api/jobs/pause - pause an active spam_login job (calls xoabot). Body: { jobId }. Header: X-Username. */
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

  const result = await pauseJob(jobId, username);
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "Không thể tạm dừng." }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
