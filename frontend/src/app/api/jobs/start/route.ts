import { NextRequest, NextResponse } from "next/server";
import { findUserByUsername } from "@/lib/users-db";
import { USER_FEATURES, type UserFeature } from "@/lib/users-types";
import { createJob, type CreateJobOptions, getRemainingByUser, getSpamLoginLimitRemainingMinutes, readJobs } from "@/lib/jobs-db";
import { consumeGrant, readServiceGrants, getGrantRemaining } from "@/lib/service-grants-db";

/** POST /api/jobs/start - start a job for the current user. Body: { feature }. Header: X-Username. */
export async function POST(request: NextRequest) {
  const username = request.headers.get("X-Username")?.trim();
  if (!username) {
    return NextResponse.json({ error: "Thiếu đăng nhập." }, { status: 401 });
  }

  let body: { feature?: string; spamLoginDays?: number; spamLoginDurationMinutes?: number; bannerUrl?: string; accessToken?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON không hợp lệ." }, { status: 400 });
  }

  const feature = body.feature;
  if (!feature || !(USER_FEATURES as readonly string[]).includes(feature)) {
    return NextResponse.json({ error: "Tính năng không hợp lệ." }, { status: 400 });
  }

  let options: CreateJobOptions | undefined;
  if (feature === "spam_login") {
    if (typeof body.spamLoginDurationMinutes === "number") {
      options = { spamLoginDurationMinutes: body.spamLoginDurationMinutes };
    } else if (typeof body.spamLoginDays === "number") {
      options = { spamLoginDays: body.spamLoginDays };
    }
    const bannerUrl = typeof body.bannerUrl === "string" && body.bannerUrl.trim() ? body.bannerUrl.trim() : undefined;
    const accessToken = typeof body.accessToken === "string" && body.accessToken.trim() ? body.accessToken.trim() : undefined;
    if (bannerUrl || accessToken) {
      options = { ...options, meta: { ...options?.meta, bannerUrl, accessToken } };
    }
  }

  const user = await findUserByUsername(username);
  if (!user) {
    return NextResponse.json({ error: "Không tìm thấy tài khoản." }, { status: 404 });
  }

  const remainingBefore = await getRemainingByUser(user);
  const rem = remainingBefore[feature as UserFeature] ?? 0;
  if (rem <= 0 && user.type !== "admin") {
    return NextResponse.json(
      { error: "Bạn đã hết số lần sử dụng tính năng này." },
      { status: 403 }
    );
  }

  if (feature === "spam_login" && options?.spamLoginDurationMinutes != null) {
    const jobs = await readJobs();
    const limitRemaining = getSpamLoginLimitRemainingMinutes(user, jobs);
    if (options.spamLoginDurationMinutes > limitRemaining) {
      return NextResponse.json(
        { error: "Vượt quá giới hạn spam login. Giới hạn còn lại không đủ cho thời gian bạn chọn." },
        { status: 400 }
      );
    }
  }

  const serviceData = await readServiceGrants();
  const grantRem = getGrantRemaining(username, feature as UserFeature, serviceData);
  const useGrant = user.type !== "admin" && grantRem > 0;
  if (useGrant) {
    const consumed = await consumeGrant(username, feature as UserFeature);
    if (consumed) {
      options = options ? { ...options, fromServiceGrant: true } : { fromServiceGrant: true };
    }
  }

  const job = await createJob(username, feature as UserFeature, options);
  if (!job) {
    return NextResponse.json(
      { error: "Vượt quá giới hạn spam login hoặc không tạo được job." },
      { status: 400 }
    );
  }

  const remainingAfter = await getRemainingByUser(user);
  const payload: { ok: boolean; job: object; remaining: Record<string, number>; spamLoginLimitRemainingMinutes?: number } = {
    ok: true,
    job: {
      id: job.id,
      feature: job.feature,
      startedAt: job.startedAt,
      expiresAt: job.expiresAt,
      status: job.status,
    },
    remaining: remainingAfter,
  };
  if (feature === "spam_login") {
    const jobsAfter = await readJobs();
    payload.spamLoginLimitRemainingMinutes = getSpamLoginLimitRemainingMinutes(user, jobsAfter);
  }
  return NextResponse.json(payload);
}
