import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { readServiceGrants, setServiceGrants } from "@/lib/service-grants-db";
import type { UserFeature } from "@/lib/users-types";
import { USER_FEATURES } from "@/lib/users-types";

type ServiceGrantBody = { perUser: number; expiresAt: string | null };

/** GET /api/admin/service-settings - return current service grants (admin only). */
export async function GET(request: NextRequest) {
  const adminError = await requireAdmin(request);
  if (adminError) return adminError;

  const data = await readServiceGrants();
  return NextResponse.json({
    grants: data.grants,
    usageCount: Object.keys(data.usage).length,
  });
}

/** POST /api/admin/service-settings - set service grants (admin only). Body: { grants: Record<feature, { perUser, expiresAt }> }. */
export async function POST(request: NextRequest) {
  const adminError = await requireAdmin(request);
  if (adminError) return adminError;

  let body: { grants?: Record<string, ServiceGrantBody> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON không hợp lệ." }, { status: 400 });
  }

  const raw = body.grants;
  if (!raw || typeof raw !== "object") {
    return NextResponse.json({ error: "Thiếu grants." }, { status: 400 });
  }

  const grants: Partial<Record<UserFeature, { perUser: number; expiresAt: string | null }>> = {};
  const featureSet = new Set(USER_FEATURES as unknown as string[]);
  for (const key of Object.keys(raw)) {
    if (!featureSet.has(key)) continue;
    const g = raw[key];
    if (!g || typeof g !== "object") continue;
    const perUser = typeof g.perUser === "number" && g.perUser >= 0 ? Math.floor(g.perUser) : 0;
    if (perUser === 0) continue;
    const expiresAt =
      g.expiresAt === null || g.expiresAt === ""
        ? null
        : typeof g.expiresAt === "string" && g.expiresAt.trim()
          ? new Date(g.expiresAt.trim()).toISOString()
          : null;
    grants[key as UserFeature] = { perUser, expiresAt };
  }

  await setServiceGrants(grants);
  return NextResponse.json({ ok: true, grants });
}
