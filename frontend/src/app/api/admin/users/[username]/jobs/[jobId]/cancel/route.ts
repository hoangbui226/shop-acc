import { NextRequest, NextResponse } from "next/server";
import { cancelJob } from "@/lib/jobs-db";
import { requireAdmin } from "@/lib/admin-auth";

type RouteParams = { params: Promise<{ username: string; jobId: string }> };

/** POST /api/admin/users/[username]/jobs/[jobId]/cancel - cancel a user's job (admin only). */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const adminError = await requireAdmin(request);
  if (adminError) return adminError;

  const { username, jobId } = await params;
  if (!username?.trim() || !jobId?.trim()) {
    return NextResponse.json({ error: "Thiếu username hoặc jobId." }, { status: 400 });
  }

  const ok = await cancelJob(jobId.trim(), username.trim());
  if (!ok) {
    return NextResponse.json(
      { error: "Không tìm thấy công việc hoặc không thể dừng." },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true });
}
