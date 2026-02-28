"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import NavBar from "@/components/NavBar";
import { isLoggedIn, getLoggedInUser } from "@/lib/auth";
import { USER_FEATURES, FEATURES_WITH_ALLOWANCE, type UserFeature, type JobAllowance } from "@/lib/users-types";

const TYPE_LABELS: Record<string, string> = {
  admin: "Admin",
  user: "User",
};

const FEATURE_LABELS: Record<string, string> = {
  check_info: "Tra cứu thông tin (mail + liên kết)",
  spam_login: "Spam login",
  remove_mail: "Gỡ mail xác thực",
  attach_mail: "Gắn mail xác thực",
  get_otp: "Nhận mã OTP",
};

type UserRow = {
  username: string;
  type: string;
  registeredAt: string;
  banned?: boolean;
  jobAllowance?: JobAllowance;
  activeJobsCount?: number;
  /** Remaining uses per feature (from getRemainingByUser). Used to hide used-up/expired features in Quyền column. */
  remaining?: Record<string, number>;
};

type AdminJobRow = {
  id: string;
  feature: string;
  startedAt: string;
  expiresAt: string | null;
  status: string;
  meta?: { bannerUrl?: string };
};

/** Per-feature expiry (ISO date string or null). Used in edit-user save payload. */
type ExpiresAtByFeature = Partial<Record<UserFeature, string | null>>;

/** True if user has access to tools (admin or at least one feature with job allowance > 0). */
function hasAccessToTools(u: UserRow): boolean {
  if (u.type === "admin") return true;
  const allowance = u.jobAllowance ?? {};
  return Object.values(allowance).some((n) => typeof n === "number" && n > 0);
}

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [expandedJobs, setExpandedJobs] = useState<AdminJobRow[]>([]);
  const [expandedJobsLoading, setExpandedJobsLoading] = useState(false);
  const [stoppingJobId, setStoppingJobId] = useState<string | null>(null);
  const [resumingJobId, setResumingJobId] = useState<string | null>(null);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [serviceGrants, setServiceGrants] = useState<Record<string, { perUser: number; expiresAt: string | null }>>({});
  const [serviceSettingsLoading, setServiceSettingsLoading] = useState(true);
  const [serviceGrantFeature, setServiceGrantFeature] = useState<UserFeature>("check_info");
  const [serviceGrantPerUser, setServiceGrantPerUser] = useState(1);
  const [serviceGrantExpiresAt, setServiceGrantExpiresAt] = useState("");
  const [serviceSaving, setServiceSaving] = useState(false);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [banningUser, setBanningUser] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const BATCH_OPTIONS = [10, 25, 50, 100] as const;

  const filteredUsers = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => u.username.toLowerCase().includes(q));
  }, [users, searchQuery]);

  const totalCount = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedUsers = React.useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, safePage, pageSize]);

  // Reset to page 1 when search or page size changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, pageSize]);

  // Clamp current page when total shrinks
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages >= 1) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const fetchUsers = useCallback(async () => {
    const username = getLoggedInUser();
    if (!username) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", {
        headers: { "X-Username": username },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 403) {
          setError("Bạn không có quyền truy cập trang quản trị.");
          setUsers([]);
          return;
        }
        setError(data.error || "Không tải được danh sách.");
        setUsers([]);
        return;
      }
      setUsers(data.users ?? []);
    } catch {
      setError("Lỗi kết nối.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchServiceSettings = useCallback(async () => {
    const username = getLoggedInUser();
    if (!username) return;
    setServiceSettingsLoading(true);
    try {
      const res = await fetch("/api/admin/service-settings", {
        headers: { "X-Username": username },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.grants) {
        setServiceGrants(data.grants);
      } else {
        setServiceGrants({});
      }
    } catch {
      setServiceGrants({});
    } finally {
      setServiceSettingsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServiceSettings();
  }, [fetchServiceSettings]);

  const applyServiceGrant = async () => {
    const username = getLoggedInUser();
    if (!username) return;
    setServiceError(null);
    setServiceSaving(true);
    try {
      const expiresAt = serviceGrantExpiresAt.trim() ? serviceGrantExpiresAt.trim() : null;
      const next = { ...serviceGrants, [serviceGrantFeature]: { perUser: serviceGrantPerUser, expiresAt } };
      const res = await fetch("/api/admin/service-settings", {
        method: "POST",
        headers: { "X-Username": username, "Content-Type": "application/json" },
        body: JSON.stringify({ grants: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setServiceError((data.error as string) || "Không lưu được.");
        return;
      }
      setServiceGrants(data.grants ?? next);
    } catch {
      setServiceError("Lỗi kết nối.");
    } finally {
      setServiceSaving(false);
    }
  };

  const removeServiceGrant = async (feature: string) => {
    const username = getLoggedInUser();
    if (!username) return;
    setServiceError(null);
    setServiceSaving(true);
    try {
      const next = { ...serviceGrants };
      delete next[feature];
      const res = await fetch("/api/admin/service-settings", {
        method: "POST",
        headers: { "X-Username": username, "Content-Type": "application/json" },
        body: JSON.stringify({ grants: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setServiceError((data.error as string) || "Không xóa được.");
        return;
      }
      setServiceGrants(data.grants ?? next);
    } catch {
      setServiceError("Lỗi kết nối.");
    } finally {
      setServiceSaving(false);
    }
  };

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }
    fetchUsers();
  }, [router, fetchUsers]);

  const [progressTick, setProgressTick] = useState(0);

  useEffect(() => {
    if (!expandedUser) {
      setExpandedJobs([]);
      return;
    }
    let cancelled = false;
    setExpandedJobsLoading(true);
    const adminUsername = getLoggedInUser();
    fetch(`/api/admin/users/${encodeURIComponent(expandedUser)}/jobs`, {
      headers: adminUsername ? { "X-Username": adminUsername } : undefined,
    })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data.jobs)) setExpandedJobs(data.jobs);
      })
      .catch(() => {
        if (!cancelled) setExpandedJobs([]);
      })
      .finally(() => {
        if (!cancelled) setExpandedJobsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [expandedUser]);

  useEffect(() => {
    if (!expandedUser || expandedJobs.length === 0) return;
    const interval = setInterval(() => setProgressTick((t) => t + 1), 2000);
    return () => clearInterval(interval);
  }, [expandedUser, expandedJobs.length]);

  const refetchExpandedJobs = useCallback(() => {
    if (!expandedUser) return;
    const adminUsername = getLoggedInUser();
    fetch(`/api/admin/users/${encodeURIComponent(expandedUser)}/jobs`, {
      headers: adminUsername ? { "X-Username": adminUsername } : undefined,
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.jobs)) setExpandedJobs(data.jobs);
      })
      .catch(() => {});
    fetchUsers();
  }, [expandedUser, fetchUsers]);

  const handleBan = async (targetUsername: string, banned: boolean) => {
    const username = getLoggedInUser();
    if (!username) return;
    if (username.toLowerCase() === targetUsername.toLowerCase()) return;
    setBanningUser(targetUsername);
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(targetUsername)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-Username": username },
        body: JSON.stringify({ banned }),
      });
      if (res.ok) await fetchUsers();
    } finally {
      setBanningUser(null);
    }
  };

  const handleDeleteUser = async (targetUsername: string) => {
    const username = getLoggedInUser();
    if (!username) return;
    if (username.toLowerCase() === targetUsername.toLowerCase()) return;
    if (!confirm(`Xóa tài khoản "${targetUsername}"? Công việc của user cũng sẽ bị xóa.`)) return;
    setDeletingUser(targetUsername);
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(targetUsername)}`, {
        method: "DELETE",
        headers: { "X-Username": username },
      });
      if (res.ok) {
        if (expandedUser === targetUsername) setExpandedUser(null);
        await fetchUsers();
      }
    } finally {
      setDeletingUser(null);
    }
  };

  const handleSave = async (updates: {
    type?: string;
    permissions?: UserFeature[];
    expiresAtByFeature?: ExpiresAtByFeature;
  }) => {
    if (!editing) return;
    const username = getLoggedInUser();
    if (!username) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(
        `/api/admin/users/${encodeURIComponent(editing.username)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "X-Username": username,
          },
          body: JSON.stringify(updates as { type?: string; jobAllowance?: Record<string, number>; banned?: boolean }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaveError(data.error || "Không lưu được.");
        return;
      }
      setEditing(null);
      await fetchUsers();
    } catch {
      setSaveError("Lỗi kết nối.");
    } finally {
      setSaving(false);
    }
  };

  if (!isLoggedIn()) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500&display=swap');
        .admin-root { min-height: 100vh; background: #070710; font-family: 'DM Sans', sans-serif; padding: 96px 16px 64px; position: relative; }
        .admin-root::before, .admin-root::after { content: ''; position: fixed; border-radius: 50%; filter: blur(90px); pointer-events: none; z-index: 0; }
        .admin-root::before { width: 500px; height: 500px; top: -120px; right: -100px; background: radial-gradient(circle, rgba(124, 106, 245, 0.12) 0%, transparent 70%); }
        .admin-root::after { width: 400px; height: 400px; bottom: -80px; left: -80px; background: radial-gradient(circle, rgba(32, 180, 160, 0.08) 0%, transparent 70%); }
        .admin-inner { position: relative; z-index: 1; max-width: 1100px; margin: 0 auto; }
        .admin-title { font-family: 'Syne', sans-serif; font-size: 1.75rem; font-weight: 700; color: rgba(255,255,255,0.95); margin-bottom: 8px; }
        .admin-subtitle { font-size: 0.9rem; color: rgba(255,255,255,0.5); margin-bottom: 24px; }
        .admin-search-wrap { margin-bottom: 16px; }
        .admin-search-input { width: 100%; max-width: 320px; padding: 10px 14px 10px 36px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.04); color: #fff; font-size: 0.9rem; font-family: inherit; }
        .admin-search-input::placeholder { color: rgba(255,255,255,0.4); }
        .admin-search-input:focus { outline: none; border-color: rgba(124, 106, 245, 0.5); }
        .admin-search-box { position: relative; display: inline-block; }
        .admin-search-box svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; color: rgba(255,255,255,0.4); pointer-events: none; }
        .admin-back { display: inline-flex; align-items: center; gap: 6px; color: #7c6af5; text-decoration: none; font-size: 0.9rem; margin-bottom: 20px; }
        .admin-back:hover { color: #8f7ef7; }
        .admin-table-wrap { overflow-x: auto; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; background: rgba(255,255,255,0.02); }
        .admin-table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
        .admin-table th, .admin-table td { padding: 12px 16px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .admin-table th { color: rgba(255,255,255,0.5); font-weight: 500; }
        .admin-table td { color: rgba(255,255,255,0.9); }
        .admin-table tr:last-child td { border-bottom: none; }
        .admin-badge { display: inline-block; padding: 4px 10px; border-radius: 100px; font-size: 0.75rem; font-weight: 500; }
        .admin-badge.admin { background: rgba(167, 139, 250, 0.2); color: #a78bfa; }
        .admin-badge.user { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.8); }
        .admin-badge.admin-badge-banned { background: rgba(239, 68, 68, 0.2); color: #f87171; }
        .admin-btn-ban { background: rgba(251, 146, 60, 0.2); color: #fb923c; }
        .admin-btn-ban:hover:not(:disabled) { background: rgba(251, 146, 60, 0.35); }
        .admin-btn-unban { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
        .admin-btn-unban:hover:not(:disabled) { background: rgba(34, 197, 94, 0.35); }
        .admin-btn-delete { background: rgba(239, 68, 68, 0.2); color: #f87171; }
        .admin-btn-delete:hover:not(:disabled) { background: rgba(239, 68, 68, 0.35); }
        .admin-perms { display: flex; flex-wrap: wrap; gap: 6px; }
        .admin-perm-tag { font-size: 0.7rem; padding: 2px 8px; border-radius: 6px; background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.7); }
        .admin-btn { padding: 8px 14px; border-radius: 8px; font-size: 0.85rem; font-weight: 500; cursor: pointer; border: none; transition: background 0.2s; }
        .admin-btn-edit { background: rgba(124, 106, 245, 0.2); color: #a5a0f0; }
        .admin-btn-edit:hover { background: rgba(124, 106, 245, 0.35); }
        .admin-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .admin-modal { background: #12121a; border: 1px solid rgba(255,255,255,0.1); border-radius: 22px; max-width: 820px; width: 100%; max-height: 90vh; display: flex; flex-direction: column; }
        .admin-modal-header { flex-shrink: 0; padding: 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-between; align-items: center; }
        .admin-modal-title { font-family: 'Syne', sans-serif; font-size: 1.2rem; font-weight: 700; color: #fff; }
        .admin-modal-close { background: none; border: none; color: rgba(255,255,255,0.5); cursor: pointer; padding: 4px; }
        .admin-modal-close:hover { color: #fff; }
        .admin-modal-body { flex: 1 1 auto; min-height: 0; overflow-y: auto; padding: 24px; }
        .admin-field { margin-bottom: 18px; }
        .admin-field label { display: block; font-size: 0.8rem; color: rgba(255,255,255,0.5); margin-bottom: 6px; }
        .admin-field select, .admin-field input { width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.04); color: #fff; font-size: 0.9rem; }
        .admin-check-group { margin-top: 8px; }
        .admin-check-item { display: flex; align-items: center; gap: 10px; padding: 8px 0; }
        .admin-check-item input { width: auto; accent-color: #7c6af5; }
        .admin-check-item span { font-size: 0.88rem; color: rgba(255,255,255,0.85); }
        .admin-modal-actions { flex-shrink: 0; display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; padding: 16px 24px 24px; border-top: 1px solid rgba(255,255,255,0.08); }
        .admin-btn-cancel { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.8); }
        .admin-btn-cancel:hover { background: rgba(255,255,255,0.12); }
        .admin-btn-save { background: #7c6af5; color: #fff; }
        .admin-btn-save:hover:not(:disabled) { background: #8f7ef7; }
        .admin-btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
        .admin-msg { padding: 12px 16px; border-radius: 10px; margin-bottom: 16px; font-size: 0.9rem; }
        .admin-msg-error { background: rgba(239, 68, 68, 0.15); color: #f87171; }
        .admin-expiry-hint { font-size: 0.8rem; color: rgba(255,255,255,0.55); margin-top: 6px; margin-bottom: 0; line-height: 1.4; }
        .admin-password-dropdown { width: 100%; margin-bottom: 18px; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; background: transparent; overflow: hidden; }
        .admin-password-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; cursor: pointer; transition: background 0.2s; width: 100%; border: none; background: transparent; color: inherit; text-align: left; font: inherit; }
        .admin-password-header:hover { background: rgba(255,255,255,0.04); }
        .admin-password-header .admin-password-label { font-size: 0.8rem; color: #fff; margin: 0; }
        .admin-password-header .admin-password-arrow { display: inline-flex; transition: transform 0.2s; color: rgba(255,255,255,0.6); flex-shrink: 0; }
        .admin-password-header .admin-password-arrow.expanded { transform: rotate(90deg); }
        .admin-password-body { padding: 8px 14px 16px 14px; width: 100%; }
        .admin-password-dots-row { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; width: 100%; }
        .admin-password-dots-box { flex: 1; min-width: 0; width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.04); font-family: monospace; font-size: 0.9rem; color: rgba(255,255,255,0.85); letter-spacing: 1px; box-sizing: border-box; }
        .admin-password-unblur-btn { flex-shrink: 0; width: 36px; height: 36px; padding: 0; border: none; border-radius: 8px; background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.6); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: background 0.2s, color 0.2s; }
        .admin-password-unblur-btn:hover { background: rgba(255,255,255,0.12); color: rgba(255,255,255,0.9); }
        .admin-password-dropdown .admin-field { margin-bottom: 16px; }
        .admin-password-dropdown .admin-field:last-child { margin-bottom: 0; }
        .admin-expiry-preview { font-size: 0.75rem; color: rgba(255,255,255,0.6); margin-top: 6px; margin-bottom: 0; }
        .admin-field-expiry { margin-bottom: 12px; }
        .admin-expiry-line { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .admin-field-expiry .admin-expiry-label-inline { margin: 0; font-size: 0.88rem; color: rgba(255,255,255,0.85); }
        .admin-expiry-row { display: flex; align-items: center; gap: 6px; }
        .admin-expiry-hours-input, .admin-expiry-minutes-input { width: 52px; padding: 5px 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.06); color: #fff; font-size: 0.8rem; }
        .admin-expiry-sep { font-size: 0.78rem; color: rgba(255,255,255,0.5); }
        .admin-expiry-clear { width: 22px; height: 22px; padding: 0; border: none; border-radius: 4px; background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7); font-size: 1rem; line-height: 1; cursor: pointer; }
        .admin-expiry-clear:hover { background: rgba(239,68,68,0.3); color: #f87171; }
        .admin-expiry-cell { display: flex; flex-direction: column; gap: 2px; }
        .admin-expiry-exact { font-size: 0.75rem; color: rgba(255,255,255,0.5); }
        .admin-perm-buttons { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
        .admin-perm-toggle { padding: 8px 14px; border-radius: 8px; font-size: 0.85rem; font-weight: 500; cursor: pointer; border: 1px solid rgba(255,255,255,0.12); transition: background 0.2s, color 0.2s, border-color 0.2s; background: transparent; color: rgba(255,255,255,0.5); }
        .admin-perm-toggle:hover { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.7); }
        .admin-perm-toggle.admin-perm-toggle-on { background: #7c6af5; color: #fff; border-color: rgba(124, 106, 245, 0.6); }
        .admin-perm-toggle.admin-perm-toggle-on:hover { background: #8f7ef7; border-color: rgba(143, 126, 247, 0.6); }
        .admin-feature-rows { display: flex; flex-direction: column; gap: 12px; margin-top: 10px; }
        .admin-feature-row { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; padding: 10px 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; }
        .admin-feature-row .admin-perm-toggle { flex-shrink: 0; }
        .admin-job-label { font-size: 0.85rem; color: rgba(255,255,255,0.85); min-width: 180px; }
        .admin-job-input { width: 72px; padding: 8px 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.04); color: #fff; font-size: 0.9rem; }
        .admin-status-online { color: #22c55e; font-weight: 500; }
        .admin-status-na { color: rgba(255,255,255,0.4); }
        .admin-cell-expand { padding: 8px 12px; vertical-align: middle; }
        .admin-row-expand-btn { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; padding: 0; border: none; border-radius: 6px; background: transparent; color: rgba(255,255,255,0.5); cursor: pointer; transition: color 0.2s, background 0.2s; }
        .admin-row-expand-btn:hover { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.8); }
        .admin-row-expand-icon { display: inline-flex; transition: transform 0.2s; }
        .admin-row-expand-icon.expanded { transform: rotate(90deg); }
        .admin-row-detail td { border-bottom: 1px solid rgba(255,255,255,0.06); background: rgba(0,0,0,0.2); vertical-align: top; }
        .admin-detail-cell { padding: 0; }
        .admin-detail-inner { padding: 16px 16px 16px 52px; }
        .admin-detail-title { font-size: 0.85rem; font-weight: 600; color: rgba(255,255,255,0.7); margin: 0 0 10px 0; }
        .admin-jobs-list { font-size: 0.85rem; color: rgba(255,255,255,0.6); }
        .admin-jobs-empty { margin: 0; font-style: italic; }
        .admin-jobs-ul { margin: 0; padding-left: 20px; }
        .admin-jobs-ul li { margin-bottom: 6px; }
        .admin-job-expiry { font-size: 0.8rem; color: rgba(255,255,255,0.5); margin-left: 8px; }
        .admin-running-jobs { display: flex; flex-direction: column; gap: 16px; }
        .admin-running-job { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; overflow: hidden; }
        .admin-running-job-banner { display: block; width: 100%; max-width: 280px; height: auto; border-radius: 8px; margin: 16px 16px 12px 16px; }
        .admin-running-job-body { padding: 14px 16px; }
        .admin-running-job-feature { font-size: 0.9rem; font-weight: 600; color: rgba(255,255,255,0.9); margin-bottom: 8px; }
        .admin-running-job-progress-wrap { height: 8px; background: rgba(255,255,255,0.08); border-radius: 4px; overflow: hidden; margin-bottom: 8px; }
        .admin-running-job-progress-fill { height: 100%; background: linear-gradient(90deg, #7c6af5, #a78bfa); border-radius: 4px; transition: width 0.2s; }
        .admin-running-job-meta { font-size: 0.78rem; color: rgba(255,255,255,0.5); }
        .admin-running-job-meta span { margin-right: 12px; }
        .admin-running-job-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
        .admin-running-job-btn { padding: 6px 12px; border-radius: 8px; font-size: 0.8rem; font-weight: 500; cursor: pointer; border: none; transition: background 0.2s, opacity 0.2s; }
        .admin-running-job-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .admin-running-job-btn-stop { background: rgba(251, 146, 60, 0.25); color: #fb923c; }
        .admin-running-job-btn-stop:hover:not(:disabled) { background: rgba(251, 146, 60, 0.4); }
        .admin-running-job-btn-delete { background: rgba(239, 68, 68, 0.2); color: #f87171; }
        .admin-running-job-btn-delete:hover:not(:disabled) { background: rgba(239, 68, 68, 0.35); }
        .admin-running-job-btn-resume { background: rgba(34, 197, 94, 0.25); color: #22c55e; }
        .admin-running-job-btn-resume:hover:not(:disabled) { background: rgba(34, 197, 94, 0.4); }
        .admin-service-section { margin-bottom: 32px; padding-bottom: 28px; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .admin-service-title { font-family: 'Syne', sans-serif; font-size: 1.2rem; font-weight: 700; color: #fff; margin: 0 0 6px 0; }
        .admin-service-subtitle { font-size: 0.85rem; color: rgba(255,255,255,0.55); margin: 0 0 16px 0; line-height: 1.45; }
        .admin-service-form { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 12px 16px; margin-bottom: 16px; }
        .admin-service-field { display: flex; flex-direction: column; gap: 4px; }
        .admin-service-field label { font-size: 0.75rem; color: rgba(255,255,255,0.5); }
        .admin-service-field select, .admin-service-field input { padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.15); background: rgba(0,0,0,0.3); color: #fff; font-size: 0.88rem; min-width: 140px; appearance: none; -webkit-appearance: none; }
        .admin-service-field select { cursor: pointer; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.6)' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; padding-right: 32px; }
        .admin-service-field select option { background: #1a1a24; color: #fff; }
        .admin-service-list { display: flex; flex-direction: column; gap: 8px; }
        .admin-service-item { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 14px; padding: 10px 14px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; }
        .admin-service-item-name { font-weight: 500; color: rgba(255,255,255,0.9); }
        .admin-service-item-meta { font-size: 0.8rem; color: rgba(255,255,255,0.5); }
        .admin-service-item-btn { padding: 6px 12px; border-radius: 8px; font-size: 0.8rem; background: rgba(239, 68, 68, 0.2); color: #f87171; border: none; cursor: pointer; }
        .admin-service-item-btn:hover { background: rgba(239, 68, 68, 0.35); }
        .admin-count-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 16px 24px; margin-bottom: 16px; }
        .admin-count-text { font-size: 0.9rem; color: rgba(255,255,255,0.7); }
        .admin-count-text strong { color: #fff; }
        .admin-batch-wrap { display: flex; align-items: center; gap: 8px; }
        .admin-batch-wrap label { font-size: 0.85rem; color: rgba(255,255,255,0.55); }
        .admin-batch-select { padding: 6px 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.04); color: #fff; font-size: 0.88rem; cursor: pointer; }
        .admin-batch-select:focus { outline: none; border-color: rgba(124, 106, 245, 0.5); }
        .admin-showing { font-size: 0.85rem; color: rgba(255,255,255,0.5); }
        .admin-pagination { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-top: 16px; }
        .admin-page-btn { min-width: 36px; height: 36px; padding: 0 10px; border: none; border-radius: 8px; font-size: 0.88rem; font-weight: 500; cursor: pointer; transition: background 0.2s, color 0.2s; background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.85); }
        .admin-page-btn:hover:not(:disabled) { background: rgba(255,255,255,0.12); color: #fff; }
        .admin-page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .admin-page-btn.current { background: #7c6af5; color: #fff; }
        .admin-page-btn.current:hover { background: #8f7ef7; }
        .admin-page-ellipsis { min-width: 36px; height: 36px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.88rem; color: rgba(255,255,255,0.4); }
      `}</style>

      <div className="admin-root">
        <NavBar />
        <div className="admin-inner">
          <Link href="/" className="admin-back">← Trang chủ</Link>

          <section className="admin-service-section" aria-labelledby="admin-service-heading">
            <h2 id="admin-service-heading" className="admin-service-title">Cài đặt dịch vụ</h2>
            <p className="admin-service-subtitle">
              Cho phép mọi người dùng tạm thời một tính năng (số lần/người). Khi dùng hết lượt, tài khoản trở lại bình thường; không nhận thêm lượt cho đến khi bạn bật lại.
            </p>
            {serviceError && <div className="admin-msg admin-msg-error">{serviceError}</div>}
            {serviceSettingsLoading ? (
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.9rem" }}>Đang tải…</p>
            ) : (
              <>
                <div className="admin-service-form">
                  <div className="admin-service-field">
                    <label>Tính năng</label>
                    <select
                      value={serviceGrantFeature}
                      onChange={(e) => setServiceGrantFeature(e.target.value as UserFeature)}
                    >
                      {(USER_FEATURES as readonly UserFeature[]).map((f) => (
                        <option key={f} value={f}>{FEATURE_LABELS[f] || f}</option>
                      ))}
                    </select>
                  </div>
                  <div className="admin-service-field">
                    <label>Số lần mỗi user</label>
                    <input
                      type="number"
                      min={1}
                      max={999}
                      value={serviceGrantPerUser}
                      onChange={(e) => setServiceGrantPerUser(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    />
                  </div>
                  <div className="admin-service-field">
                    <label>Hết hạn (tùy chọn)</label>
                    <input
                      type="datetime-local"
                      value={serviceGrantExpiresAt}
                      onChange={(e) => setServiceGrantExpiresAt(e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    className="admin-btn admin-btn-save"
                    disabled={serviceSaving}
                    onClick={applyServiceGrant}
                  >
                    {serviceSaving ? "Đang lưu…" : "Áp dụng"}
                  </button>
                </div>
                <div className="admin-service-list">
                  {Object.entries(serviceGrants).length === 0 ? (
                    <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.85rem" }}>Chưa có cài đặt nào. Chọn tính năng, số lần và bấm Áp dụng.</p>
                  ) : (
                    Object.entries(serviceGrants).map(([feature, g]) => (
                      <div key={feature} className="admin-service-item">
                        <span className="admin-service-item-name">{FEATURE_LABELS[feature] || feature}</span>
                        <span className="admin-service-item-meta">
                          {g.perUser} lần/user · {g.expiresAt ? `Hết hạn: ${new Date(g.expiresAt).toLocaleString("vi-VN")}` : "Không hết hạn"}
                        </span>
                        <button
                          type="button"
                          className="admin-service-item-btn"
                          onClick={() => removeServiceGrant(feature)}
                          disabled={serviceSaving}
                        >
                          Gỡ
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </section>

          <h1 className="admin-title">Quản trị người dùng</h1>
          <p className="admin-subtitle">Quản lý quyền và thời hạn sử dụng tài khoản.</p>

          {error && <div className="admin-msg admin-msg-error">{error}</div>}

          {loading ? (
            <p style={{ color: "rgba(255,255,255,0.5)" }}>Đang tải…</p>
          ) : (
            <>
              <div className="admin-search-wrap">
                <div className="admin-search-box">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                  <input
                    type="search"
                    className="admin-search-input"
                    placeholder="Tìm theo tên đăng nhập…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="Tìm khách hàng theo tên đăng nhập"
                  />
                </div>
              </div>

              <div className="admin-count-bar">
                <span className="admin-count-text">
                  Tổng: <strong>{totalCount}</strong> khách hàng
                </span>
                <div className="admin-batch-wrap">
                  <label htmlFor="admin-batch-select">Hiển thị:</label>
                  <select
                    id="admin-batch-select"
                    className="admin-batch-select"
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value) as 10 | 25 | 50 | 100)}
                    aria-label="Số khách hàng mỗi trang"
                  >
                    {BATCH_OPTIONS.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                {totalCount > 0 && (
                  <span className="admin-showing">
                    Đang hiển thị {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, totalCount)} trong tổng {totalCount}
                  </span>
                )}
              </div>

              <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: 36 }} aria-label="Mở rộng" />
                    <th>Tên đăng nhập</th>
                    <th>Loại</th>
                    <th>Đăng ký</th>
                    <th>Trạng Thái</th>
                    <th>Quyền</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((u) => {
                    const isExpanded = expandedUser === u.username;
                    const access = hasAccessToTools(u);
                    return (
                      <React.Fragment key={u.username}>
                        <tr className="admin-row-main">
                          <td className="admin-cell-expand">
                            <button
                              type="button"
                              className="admin-row-expand-btn"
                              onClick={() => setExpandedUser((prev) => (prev === u.username ? null : u.username))}
                              aria-expanded={isExpanded}
                              aria-label={isExpanded ? "Thu gọn" : "Mở rộng"}
                            >
                              <span className={`admin-row-expand-icon ${isExpanded ? "expanded" : ""}`}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M9 18l6-6-6-6" />
                                </svg>
                              </span>
                            </button>
                          </td>
                          <td>{u.username}</td>
                          <td>
                            <span className={`admin-badge ${u.type}`}>
                              {TYPE_LABELS[u.type] ?? u.type}
                            </span>
                          </td>
                          <td>{new Date(u.registeredAt).toLocaleDateString("vi-VN")}</td>
                          <td>
                            {u.banned ? (
                              <span className="admin-badge admin-badge-banned">Khóa</span>
                            ) : access ? (
                              <span className="admin-status-online">Online ({(u.activeJobsCount ?? 0)})</span>
                            ) : (
                              <span className="admin-status-na">N/A</span>
                            )}
                          </td>
                          <td>
                            <div className="admin-perms">
                              {(() => {
                                const remaining = u.remaining ?? {};
                                const withRemaining = (USER_FEATURES as readonly UserFeature[]).filter(
                                  (p) => (remaining[p] ?? 0) > 0
                                );
                                const UNLIMITED_THRESHOLD = 999999;
                                const formatRemaining = (val: number | undefined, isAdmin: boolean) =>
                                  isAdmin || (val ?? 0) >= UNLIMITED_THRESHOLD ? "-" : String(val ?? 0);
                                return withRemaining.length === 0 ? (
                                  <span style={{ color: "rgba(255,255,255,0.4)" }}>Chưa gán</span>
                                ) : (
                                  withRemaining.map((p) => (
                                    <span key={p} className="admin-perm-tag">
                                      {FEATURE_LABELS[p] || p} ({formatRemaining(remaining[p], u.type === "admin")})
                                    </span>
                                  ))
                                );
                              })()}
                            </div>
                          </td>
                          <td>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
                              <button
                                type="button"
                                className="admin-btn admin-btn-edit"
                                onClick={() => setEditing(u)}
                              >
                                Sửa
                              </button>
                              {getLoggedInUser()?.toLowerCase() !== u.username.toLowerCase() && (
                                <>
                                  {u.banned ? (
                                    <button
                                      type="button"
                                      className="admin-btn admin-btn-unban"
                                      disabled={banningUser !== null}
                                      onClick={() => handleBan(u.username, false)}
                                    >
                                      {banningUser === u.username ? "Đang xử lý…" : "Bỏ khóa"}
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      className="admin-btn admin-btn-ban"
                                      disabled={banningUser !== null}
                                      onClick={() => handleBan(u.username, true)}
                                    >
                                      {banningUser === u.username ? "Đang xử lý…" : "Khóa"}
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    className="admin-btn admin-btn-delete"
                                    disabled={deletingUser !== null}
                                    onClick={() => handleDeleteUser(u.username)}
                                  >
                                    {deletingUser === u.username ? "Đang xóa…" : "Xóa"}
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${u.username}-jobs`} className="admin-row-detail">
                            <td colSpan={7} className="admin-detail-cell">
                              <div className="admin-detail-inner">
                                <h4 className="admin-detail-title">Công việc đang chạy</h4>
                                {expandedUser === u.username && expandedJobsLoading && (
                                  <p className="admin-jobs-empty">Đang tải…</p>
                                )}
                                {expandedUser === u.username && !expandedJobsLoading && expandedJobs.length === 0 && (
                                  <p className="admin-jobs-empty">Không có công việc đang chạy.</p>
                                )}
                                {expandedUser === u.username && !expandedJobsLoading && expandedJobs.length > 0 && (
                                  <div className="admin-running-jobs">
                                    {expandedJobs.map((j) => {
                                      const isSpam = j.feature === "spam_login" && j.expiresAt;
                                      const startMs = new Date(j.startedAt).getTime();
                                      const endMs = j.expiresAt ? new Date(j.expiresAt).getTime() : startMs;
                                      const progress = endMs > startMs
                                        ? Math.min(100, Math.max(0, ((Date.now() - startMs) / (endMs - startMs)) * 100))
                                        : 100;
                                      const startedLabel = new Date(j.startedAt).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
                                      const endsLabel = j.expiresAt ? new Date(j.expiresAt).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" }) : null;
                                      return (
                                        <div key={j.id} className="admin-running-job">
                                          {j.meta?.bannerUrl && (
                                            <img src={j.meta.bannerUrl} alt="" className="admin-running-job-banner" />
                                          )}
                                          <div className="admin-running-job-body">
                                            <div className="admin-running-job-feature">
                                              {FEATURE_LABELS[j.feature as UserFeature] || j.feature}
                                              {j.status === "paused" && " · Tạm dừng"}
                                            </div>
                                            {isSpam && (
                                              <>
                                                <div className="admin-running-job-progress-wrap">
                                                  <div className="admin-running-job-progress-fill" style={{ width: `${progress}%` }} />
                                                </div>
                                                <div className="admin-running-job-meta">
                                                  <span>Bắt đầu: {startedLabel}</span>
                                                  {endsLabel && <span>Kết thúc: {endsLabel}</span>}
                                                  <span>{progress >= 100 ? "100%" : `${progress.toFixed(0)}%`}</span>
                                                </div>
                                              </>
                                            )}
                                            {!isSpam && (
                                              <div className="admin-running-job-meta">
                                                <span>Bắt đầu: {startedLabel}</span>
                                              </div>
                                            )}
                                            <div className="admin-running-job-actions">
                                              {j.feature === "spam_login" && j.status === "active" && (
                                                <button
                                                  type="button"
                                                  className="admin-running-job-btn admin-running-job-btn-stop"
                                                  disabled={(stoppingJobId ?? resumingJobId ?? deletingJobId) !== null}
                                                  onClick={async () => {
                                                    if (!u.username || stoppingJobId || resumingJobId || deletingJobId) return;
                                                    setStoppingJobId(j.id);
                                                    try {
                                                      const adminUsername = getLoggedInUser();
                                                      const res = await fetch(
                                                        `/api/admin/users/${encodeURIComponent(u.username)}/jobs/${encodeURIComponent(j.id)}/pause`,
                                                        {
                                                          method: "POST",
                                                          headers: adminUsername ? { "X-Username": adminUsername, "Content-Type": "application/json" } : undefined,
                                                        }
                                                      );
                                                      if (res.ok) refetchExpandedJobs();
                                                    } finally {
                                                      setStoppingJobId(null);
                                                    }
                                                  }}
                                                >
                                                  {stoppingJobId === j.id ? "Đang dừng…" : "Dừng"}
                                                </button>
                                              )}
                                              {j.feature === "spam_login" && j.status === "paused" && (
                                                <button
                                                  type="button"
                                                  className="admin-running-job-btn admin-running-job-btn-resume"
                                                  disabled={(stoppingJobId ?? resumingJobId ?? deletingJobId) !== null}
                                                  onClick={async () => {
                                                    if (!u.username || stoppingJobId || resumingJobId || deletingJobId) return;
                                                    setResumingJobId(j.id);
                                                    try {
                                                      const adminUsername = getLoggedInUser();
                                                      const res = await fetch(
                                                        `/api/admin/users/${encodeURIComponent(u.username)}/jobs/${encodeURIComponent(j.id)}/resume`,
                                                        {
                                                          method: "POST",
                                                          headers: adminUsername ? { "X-Username": adminUsername, "Content-Type": "application/json" } : undefined,
                                                        }
                                                      );
                                                      if (res.ok) refetchExpandedJobs();
                                                    } finally {
                                                      setResumingJobId(null);
                                                    }
                                                  }}
                                                >
                                                  {resumingJobId === j.id ? "Đang tiếp tục…" : "Tiếp tục"}
                                                </button>
                                              )}
                                              <button
                                                type="button"
                                                className="admin-running-job-btn admin-running-job-btn-delete"
                                                disabled={(stoppingJobId ?? resumingJobId ?? deletingJobId) !== null}
                                                onClick={async () => {
                                                  if (!u.username || stoppingJobId || resumingJobId || deletingJobId) return;
                                                  if (!confirm("Xóa công việc này khỏi hệ thống?")) return;
                                                  setDeletingJobId(j.id);
                                                  try {
                                                    const adminUsername = getLoggedInUser();
                                                    const res = await fetch(
                                                      `/api/admin/users/${encodeURIComponent(u.username)}/jobs/${encodeURIComponent(j.id)}/delete`,
                                                      {
                                                        method: "POST",
                                                        headers: adminUsername ? { "X-Username": adminUsername, "Content-Type": "application/json" } : undefined,
                                                      }
                                                    );
                                                    if (res.ok) refetchExpandedJobs();
                                                  } finally {
                                                    setDeletingJobId(null);
                                                  }
                                                }}
                                              >
                                                {deletingJobId === j.id ? "Đang xóa…" : "Xóa"}
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <nav className="admin-pagination" aria-label="Phân trang">
                <button
                  type="button"
                  className="admin-page-btn"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  aria-label="Trang trước"
                >
                  ←
                </button>
                {(() => {
                  const pages: (number | "ellipsis")[] = [];
                  if (totalPages <= 7) {
                    for (let i = 1; i <= totalPages; i++) pages.push(i);
                  } else {
                    pages.push(1);
                    if (safePage > 3) pages.push("ellipsis");
                    const mid = [safePage - 1, safePage, safePage + 1]
                      .filter((i) => i >= 2 && i <= totalPages - 1)
                      .sort((a, b) => a - b);
                    const seen = new Set(pages.filter((x): x is number => typeof x === "number"));
                    for (const i of mid) { if (!seen.has(i)) { seen.add(i); pages.push(i); } }
                    if (safePage < totalPages - 2) pages.push("ellipsis");
                    if (totalPages > 1) pages.push(totalPages);
                  }
                  return pages.map((p, i) =>
                    p === "ellipsis" ? (
                      <span key={`e-${i}`} className="admin-page-ellipsis">…</span>
                    ) : (
                      <button
                        key={p}
                        type="button"
                        className={`admin-page-btn ${p === safePage ? "current" : ""}`}
                        onClick={() => setCurrentPage(p)}
                        aria-label={`Trang ${p}`}
                        aria-current={p === safePage ? "page" : undefined}
                      >
                        {p}
                      </button>
                    )
                  );
                })()}
                <button
                  type="button"
                  className="admin-page-btn"
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  aria-label="Trang sau"
                >
                  →
                </button>
              </nav>
            )}

            {totalCount === 0 && !loading && (
              <p style={{ color: "rgba(255,255,255,0.5)", marginTop: 16 }}>
                {searchQuery.trim() ? "Không tìm thấy khách hàng nào." : "Chưa có người dùng."}
              </p>
            )}
          </>
          )}
        </div>
      </div>

      {editing && (
        <EditUserModal
          user={editing}
          onClose={() => {
            setEditing(null);
            setSaveError(null);
          }}
          onSave={handleSave}
          saving={saving}
          saveError={saveError}
        />
      )}
    </>
  );
}

function EditUserModal({
  user,
  onClose,
  onSave,
  saving,
  saveError,
}: {
  user: UserRow;
  onClose: () => void;
  onSave: (u: { type?: string; jobAllowance?: JobAllowance }) => Promise<void>;
  saving: boolean;
  saveError: string | null;
}) {
  const [type, setType] = useState(user.type);
  const [jobAllowance, setJobAllowance] = useState<Partial<Record<UserFeature, number>>>(() => {
    const a = user.jobAllowance ?? {};
    const out: Partial<Record<UserFeature, number>> = {};
    for (const key of FEATURES_WITH_ALLOWANCE) {
      const v = a[key];
      out[key] = typeof v === "number" && v >= 0 ? v : 0;
    }
    return out;
  });
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [passwordDropdownOpen, setPasswordDropdownOpen] = useState(false);
  const [unblurToast, setUnblurToast] = useState(false);
  const [currentPassword, setCurrentPassword] = useState<string | null>(null);
  const [passwordRevealed, setPasswordRevealed] = useState(false);
  const [passwordFetching, setPasswordFetching] = useState(false);

  const setAllowance = (key: UserFeature, value: number) => {
    setJobAllowance((prev) => ({ ...prev, [key]: Math.max(0, Math.floor(value)) }));
  };

  const handleUnblurClick = async () => {
    if (passwordRevealed) {
      setPasswordRevealed(false);
      return;
    }
    if (currentPassword !== null) {
      if (currentPassword === "") {
        setUnblurToast(true);
      } else {
        setPasswordRevealed(true);
      }
      return;
    }
    setPasswordFetching(true);
    try {
      const adminUsername = getLoggedInUser();
      const res = await fetch(`/api/admin/users/${encodeURIComponent(user.username)}/password`, {
        headers: adminUsername ? { "X-Username": adminUsername } : undefined,
      });
      const data = await res.json().catch(() => ({}));
      const plain = typeof data.password === "string" ? data.password : null;
      setCurrentPassword(plain ?? "");
      if (plain !== null && plain !== "") {
        setPasswordRevealed(true);
      } else {
        setUnblurToast(true);
      }
    } catch {
      setUnblurToast(true);
    } finally {
      setPasswordFetching(false);
    }
  };

  useEffect(() => {
    if (!unblurToast) return;
    const t = setTimeout(() => setUnblurToast(false), 2500);
    return () => clearTimeout(t);
  }, [unblurToast]);

  useEffect(() => {
    if (!passwordDropdownOpen) {
      setPasswordRevealed(false);
      setCurrentPassword(null);
    }
  }, [passwordDropdownOpen]);

  const getAllowanceForSave = (): JobAllowance => {
    const out: JobAllowance = {};
    for (const key of FEATURES_WITH_ALLOWANCE) {
      const v = jobAllowance[key];
      if (typeof v === "number" && v > 0) out[key] = v;
    }
    return out;
  };

  const handleSaveClick = async () => {
    setSubmitError(null);
    const np = newPassword.trim();
    const cp = confirmPassword.trim();
    if (np || cp) {
      if (!np) {
        setSubmitError("Vui lòng nhập mật khẩu mới.");
        return;
      }
      if (np !== cp) {
        setSubmitError("Mật khẩu xác nhận không khớp.");
        return;
      }
      setPasswordSaving(true);
      try {
        const adminUsername = getLoggedInUser();
        const res = await fetch(`/api/admin/users/${encodeURIComponent(user.username)}/password`, {
          method: "POST",
          headers: adminUsername ? { "X-Username": adminUsername, "Content-Type": "application/json" } : undefined,
          body: JSON.stringify({ newPassword: np }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setSubmitError((data.error as string) || "Không thể đổi mật khẩu.");
          setPasswordSaving(false);
          return;
        }
      } catch {
        setSubmitError("Lỗi kết nối.");
        setPasswordSaving(false);
        return;
      }
      setPasswordSaving(false);
      setNewPassword("");
      setConfirmPassword("");
    }
    await onSave({ type, jobAllowance: getAllowanceForSave() });
  };

  return (
    <div
      className="admin-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h2 className="admin-modal-title">Sửa: {user.username}</h2>
          <button
            type="button"
            className="admin-modal-close"
            onClick={onClose}
            aria-label="Đóng"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="admin-modal-body">
          {(saveError || submitError) && (
            <div className="admin-msg admin-msg-error">{saveError || submitError}</div>
          )}

          <div className="admin-field">
            <label>Loại tài khoản</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="admin-password-dropdown">
            <button
              type="button"
              className="admin-password-header"
              onClick={() => setPasswordDropdownOpen((o) => !o)}
              aria-expanded={passwordDropdownOpen}
              aria-label={passwordDropdownOpen ? "Thu gọn mật khẩu" : "Mở mật khẩu"}
            >
              <span className="admin-password-label">Mật khẩu</span>
              <span className={`admin-password-arrow ${passwordDropdownOpen ? "expanded" : ""}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </span>
            </button>
            {passwordDropdownOpen && (
            <div className="admin-password-body">
              <div className="admin-password-dots-row">
                <span className="admin-password-dots-box" aria-hidden>
                  {passwordRevealed && currentPassword ? currentPassword : "••••••••"}
                </span>
                <button
                  type="button"
                  className="admin-password-unblur-btn"
                  onClick={handleUnblurClick}
                  disabled={passwordFetching}
                  title={passwordRevealed ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  aria-label={passwordRevealed ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {passwordRevealed ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {unblurToast && (
                <p className="admin-expiry-hint" style={{ marginTop: -8, marginBottom: 12, color: "rgba(255,255,255,0.5)" }}>
                  Mật khẩu không lưu dạng thô nên không thể hiển thị.
                </p>
              )}
              <div className="admin-field">
                <label>Mật khẩu mới (tùy chọn)</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setSubmitError(null); }}
                  placeholder="Để trống nếu không đổi"
                  autoComplete="new-password"
                />
              </div>
              <div className="admin-field">
                <label>Xác nhận mật khẩu</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setSubmitError(null); }}
                  placeholder="Nhập lại mật khẩu mới"
                  autoComplete="new-password"
                />
              </div>
            </div>
            )}
          </div>

          <div className="admin-field">
            <label>Số lần (job) cho từng tính năng</label>
            <p className="admin-expiry-hint">Nhập số lần người dùng được phép dùng. Spam login: mỗi lần = 1 job 15 ngày. Gỡ mail, Gắn mail, OTP: 1 lần = 1 job. 0 = không có quyền.</p>
            <div className="admin-feature-rows">
              {(USER_FEATURES as readonly UserFeature[]).map((key) => (
                <div key={key} className="admin-feature-row">
                  <label className="admin-job-label">{FEATURE_LABELS[key] || key}</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={jobAllowance[key] ?? 0}
                    onChange={(e) => setAllowance(key, parseInt(e.target.value, 10) || 0)}
                    className="admin-job-input"
                    aria-label={`Số lần ${key}`}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="admin-modal-actions">
            <button type="button" className="admin-btn admin-btn-cancel" onClick={onClose}>
              Hủy
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-save"
              disabled={saving || passwordSaving}
              onClick={handleSaveClick}
            >
              {saving || passwordSaving ? "Đang lưu…" : "Lưu"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
