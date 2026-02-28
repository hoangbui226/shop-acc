import { NextRequest, NextResponse } from "next/server";
import { findUserByUsername } from "@/lib/users-db";
import { USER_FEATURES, FREE_FEATURES, type UserFeature } from "@/lib/users-types";
import { getRemainingByUser, getSpamLoginLimitRemainingMinutes, readJobs } from "@/lib/jobs-db";

/** GET /api/user/info?username=xxx - returns public profile, job allowance and remaining. */
export async function GET(request: NextRequest) {
  try {
    const username = request.nextUrl.searchParams.get("username");
    if (!username?.trim()) {
      return NextResponse.json(
        { error: "Thiếu tên đăng nhập." },
        { status: 400 }
      );
    }

    const user = await findUserByUsername(username.trim());
    if (!user) {
      return NextResponse.json(
        { error: "Không tìm thấy tài khoản." },
        { status: 404 }
      );
    }

    const permissions: UserFeature[] =
      user.type === "admin"
        ? [...USER_FEATURES]
        : (USER_FEATURES as readonly UserFeature[]).filter(
            (f) => FREE_FEATURES.includes(f) || (user.jobAllowance?.[f] ?? 0) > 0
          );
    const remaining = await getRemainingByUser(user);
    const jobs = await readJobs();
    const spamLoginLimitRemainingMinutes = getSpamLoginLimitRemainingMinutes(user, jobs);

    return NextResponse.json({
      username: user.username,
      type: user.type,
      registeredAt: user.registeredAt,
      permissions,
      jobAllowance: user.jobAllowance ?? undefined,
      remaining,
      spamLoginLimitRemainingMinutes,
    });
  } catch (e) {
    console.error("User info API error:", e);
    return NextResponse.json(
      { error: "Lỗi server. Vui lòng thử lại." },
      { status: 500 }
    );
  }
}
