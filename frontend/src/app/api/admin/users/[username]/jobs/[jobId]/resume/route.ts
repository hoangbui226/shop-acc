import { NextRequest, NextResponse } from "next/server";
import { resumeJob } from "@/lib/jobs-db";
import { requireAdmin } from "@/lib/admin-auth";

type RouteParams = { params: Promise<{ username: string; jobId: string }> };

/** POST /api/admin/users/[username]/jobs/[jobId]/resume - resume a user's paused job (admin only). */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const adminError = await requireAdmin(request);
  if (adminError) return adminError;

  const { username, jobId } = await params;
  if (!username?.trim() || !jobId?.trim()) {
    return NextResponse.json({ error: "Thiếu username hoặc jobId." }, { status: 400 });
  }

  const result = await resumeJob(jobId.trim(), username.trim());
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? "Không thể tiếp tục công việc." },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true });
}
