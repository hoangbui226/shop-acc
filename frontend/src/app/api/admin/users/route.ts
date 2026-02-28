import { NextRequest, NextResponse } from "next/server";
import { readUsers } from "@/lib/users-db";
import { requireAdmin } from "@/lib/admin-auth";
import { getActiveJobsByUser, getRemainingByUser } from "@/lib/jobs-db";

/** GET /api/admin/users - list all users (admin only). Send X-Username header. */
export async function GET(request: NextRequest) {
  const adminError = await requireAdmin(request);
  if (adminError) return adminError;

  try {
    const users = await readUsers();
    // Newest first for monitoring recent signups
    const sorted = [...users].sort((a, b) => {
      const tA = new Date(a.registeredAt).getTime();
      const tB = new Date(b.registeredAt).getTime();
      return tB - tA;
    });
    const list = await Promise.all(
      sorted.map(async (u) => {
        const [activeJobs, remaining] = await Promise.all([
          getActiveJobsByUser(u.username),
          getRemainingByUser(u),
        ]);
        return {
          username: u.username,
          type: u.type,
          registeredAt: u.registeredAt,
          banned: u.banned ?? false,
          jobAllowance: u.jobAllowance ?? undefined,
          activeJobsCount: activeJobs.length,
          remaining: remaining ?? undefined,
        };
      })
    );
    return NextResponse.json({ users: list });
  } catch (e) {
    console.error("Admin users list error:", e);
    return NextResponse.json({ error: "Lỗi server." }, { status: 500 });
  }
}
