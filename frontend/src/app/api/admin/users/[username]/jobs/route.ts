import { NextRequest, NextResponse } from "next/server";
import { getActiveJobsByUser } from "@/lib/jobs-db";
import { requireAdmin } from "@/lib/admin-auth";

type RouteParams = { params: Promise<{ username: string }> };

/** GET /api/admin/users/[username]/jobs - list active jobs for a user (admin only). */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const adminError = await requireAdmin(request);
  if (adminError) return adminError;

  const { username } = await params;
  if (!username?.trim()) {
    return NextResponse.json({ error: "Thiếu username." }, { status: 400 });
  }

  const jobs = await getActiveJobsByUser(username.trim());
  return NextResponse.json({
    jobs: jobs.map((j) => ({
      id: j.id,
      feature: j.feature,
      startedAt: j.startedAt,
      expiresAt: j.expiresAt,
      status: j.status,
      meta: j.meta?.bannerUrl ? { bannerUrl: j.meta.bannerUrl } : undefined,
    })),
  });
}
