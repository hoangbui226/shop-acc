import { NextRequest, NextResponse } from "next/server";
import {
  readUsers,
  writeUsers,
  deleteUser,
  USER_FEATURES,
  type UserFeature,
  type UserType,
  type JobAllowance,
} from "@/lib/users-db";
import { deleteJobsByUser } from "@/lib/jobs-db";
import { requireAdmin } from "@/lib/admin-auth";

type RouteParams = { params: Promise<{ username: string }> };

const FEATURE_SET = new Set(USER_FEATURES as unknown as string[]);

function parseJobAllowance(raw: unknown): JobAllowance | undefined {
  if (raw === null || raw === undefined) return undefined;
  if (typeof raw !== "object") return undefined;
  const out: JobAllowance = {};
  for (const k of Object.keys(raw as Record<string, unknown>)) {
    if (!FEATURE_SET.has(k)) continue;
    const v = (raw as Record<string, unknown>)[k];
    const num = typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.floor(v)) : undefined;
    if (num !== undefined) out[k as UserFeature] = num;
  }
  return Object.keys(out).length ? out : undefined;
}

/** PATCH /api/admin/users/[username] - update user (admin only). */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const adminError = await requireAdmin(request);
  if (adminError) return adminError;

  const { username: targetUsername } = await params;
  if (!targetUsername?.trim()) {
    return NextResponse.json({ error: "Thiếu username." }, { status: 400 });
  }

  let body: { type?: UserType; jobAllowance?: Record<string, number>; banned?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON không hợp lệ." }, { status: 400 });
  }

  const users = await readUsers();
  const normalized = targetUsername.trim().toLowerCase();
  const index = users.findIndex((u) => u.username.toLowerCase() === normalized);
  if (index === -1) {
    return NextResponse.json({ error: "Không tìm thấy tài khoản." }, { status: 404 });
  }

  const user = users[index];

  if (body.type !== undefined && (body.type === "admin" || body.type === "user")) {
    user.type = body.type;
  }

  if (Object.prototype.hasOwnProperty.call(body, "jobAllowance")) {
    user.jobAllowance = parseJobAllowance(body.jobAllowance);
  }

  if (typeof body.banned === "boolean") {
    user.banned = body.banned;
  }

  await writeUsers(users);
  return NextResponse.json({
    ok: true,
    user: {
      username: user.username,
      type: user.type,
      banned: user.banned ?? false,
      jobAllowance: user.jobAllowance ?? undefined,
    },
  });
}

/** DELETE /api/admin/users/[username] - delete user and their jobs (admin only). */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const adminError = await requireAdmin(request);
  if (adminError) return adminError;

  const { username: targetUsername } = await params;
  if (!targetUsername?.trim()) {
    return NextResponse.json({ error: "Thiếu username." }, { status: 400 });
  }

  const deleted = await deleteUser(targetUsername.trim());
  if (!deleted) {
    return NextResponse.json({ error: "Không tìm thấy tài khoản." }, { status: 404 });
  }
  await deleteJobsByUser(targetUsername.trim());
  return NextResponse.json({ ok: true });
}
