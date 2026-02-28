import { NextRequest, NextResponse } from "next/server";
import { pauseJob } from "@/lib/jobs-db";
import { requireAdmin } from "@/lib/admin-auth";

type RouteParams = { params: Promise<{ username: string; jobId: string }> };

/** POST /api/admin/users/[username]/jobs/[jobId]/pause - pause a user's job temporarily (admin only). Same as client-side "Tạm Dừng". */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const adminError = await requireAdmin(request);
  if (adminError) return adminError;

  const { username, jobId } = await params;
  if (!username?.trim() || !jobId?.trim()) {
    return NextResponse.json({ error: "Thiếu username hoặc jobId." }, { status: 400 });
  }

  const result = await pauseJob(jobId.trim(), username.trim());
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? "Không thể tạm dừng công việc." },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true });
}
