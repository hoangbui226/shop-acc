"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import NavBar from "@/components/NavBar";
import { isLoggedIn, getLoggedInUser } from "@/lib/auth";
import { USER_FEATURES, type UserFeature } from "@/lib/users-types";

const TYPE_LABELS: Record<string, string> = {
  admin: "Quản trị viên",
  user: "Thành viên",
};

const FEATURE_LABELS: Record<UserFeature, string> = {
  check_info: "Tra cứu thông tin (mail + liên kết)",
  spam_login: "Spam login",
  remove_mail: "Gỡ mail xác thực",
  attach_mail: "Gắn mail xác thực",
  get_otp: "Nhận mã OTP",
};

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const PencilIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

type UserInfo = {
  username: string;
  type: string;
  registeredAt: string;
  permissions?: UserFeature[];
  jobAllowance?: Partial<Record<UserFeature, number>>;
  remaining?: Partial<Record<UserFeature, number>>;
};

type JobItem = {
  id: string;
  feature: UserFeature;
  startedAt: string;
  expiresAt: string | null;
  status: string;
  meta?: { bannerUrl?: string };
};

const ProfilePage = () => {
  const router = useRouter();
  const [info, setInfo] = useState<UserInfo | null>(null);
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [pausingId, setPausingId] = useState<string | null>(null);
  const [resumingId, setResumingId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [passwordRevealed, setPasswordRevealed] = useState(false);
  const [passwordPlain, setPasswordPlain] = useState<string | null>(null);
  const [passwordHashedOnly, setPasswordHashedOnly] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [changePwOpen, setChangePwOpen] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [changePwError, setChangePwError] = useState("");
  const [changePwSubmitting, setChangePwSubmitting] = useState(false);
  const [changePwSuccess, setChangePwSuccess] = useState(false);

  const activeSpamJobs = jobs.filter(
    (j) => j.feature === "spam_login" && (j.status === "active" || j.status === "paused") && j.expiresAt
  );

  const refreshJobs = () => {
    const username = getLoggedInUser();
    if (!username) return;
    fetch(`/api/user/jobs?username=${encodeURIComponent(username)}`, { headers: { "X-Username": username } })
      .then((res) => res.json())
      .then((data) => { if (data.jobs) setJobs(Array.isArray(data.jobs) ? data.jobs : []); })
      .catch(() => {});
  };

  const fetchPassword = () => {
    const username = getLoggedInUser();
    if (!username) return;
    setPasswordPlain(null);
    setPasswordHashedOnly(false);
    fetch(`/api/user/password?username=${encodeURIComponent(username)}`, { headers: { "X-Username": username } })
      .then((res) => res.json())
      .then((data) => {
        if (data.hashed) setPasswordHashedOnly(true);
        else if (data.password !== undefined) setPasswordPlain(data.password ?? "");
      })
      .catch(() => {});
  };

  const togglePasswordReveal = () => {
    if (passwordRevealed) {
      setPasswordRevealed(false);
      setPasswordPlain(null);
      setPasswordHashedOnly(false);
      return;
    }
    if (passwordPlain !== null || passwordHashedOnly) {
      setPasswordRevealed(true);
      return;
    }
    fetchPassword();
    setPasswordRevealed(true);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePwError("");
    setChangePwSuccess(false);
    if (!currentPw.trim() || !newPw.trim() || !confirmPw.trim()) {
      setChangePwError("Vui lòng điền đầy đủ các trường.");
      return;
    }
    if (newPw !== confirmPw) {
      setChangePwError("Mật khẩu mới và xác nhận không khớp.");
      return;
    }
    const username = getLoggedInUser();
    if (!username) return;
    setChangePwSubmitting(true);
    try {
      const res = await fetch("/api/user/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-Username": username },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setChangePwError((data.error as string) || "Không đổi được mật khẩu.");
        return;
      }
      setChangePwSuccess(true);
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      setPasswordPlain(newPw);
      setPasswordHashedOnly(false);
      setPasswordRevealed(true);
      setTimeout(() => {
        setChangePwOpen(false);
        setChangePwSuccess(false);
        setPasswordRevealed(false);
        setPasswordPlain(null);
      }, 1500);
    } catch {
      setChangePwError("Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setChangePwSubmitting(false);
    }
  };

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }
    const username = getLoggedInUser();
    if (!username) {
      router.replace("/login");
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/user/info?username=${encodeURIComponent(username)}`)
      .then((res) => {
        if (cancelled) return res.json();
        if (!res.ok) {
          if (res.status === 404) setError("Không tìm thấy tài khoản.");
          else setError("Không tải được thông tin. Vui lòng thử lại.");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!cancelled && data) setInfo(data);
      })
      .catch(() => {
        if (!cancelled) setError("Lỗi kết nối. Vui lòng thử lại.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [router]);

  useEffect(() => {
    const username = getLoggedInUser();
    if (!username || !info?.username) return;
    let cancelled = false;
    fetch(`/api/user/jobs?username=${encodeURIComponent(username)}`, {
      headers: { "X-Username": username },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.jobs) setJobs(Array.isArray(data.jobs) ? data.jobs : []);
      })
      .catch(() => {
        if (!cancelled) setJobs([]);
      });
    return () => { cancelled = true; };
  }, [info?.username]);

  const activeCount = activeSpamJobs.filter((j) => j.status === "active").length;
  useEffect(() => {
    if (activeCount === 0) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [activeCount]);

  if (!isLoggedIn()) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500&display=swap');
        .page-root {
          min-height: 100vh;
          background: #070710;
          font-family: 'DM Sans', sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 96px 16px 64px;
          position: relative;
          overflow: hidden;
        }
        .page-root::before, .page-root::after {
          content: '';
          position: fixed;
          border-radius: 50%;
          filter: blur(90px);
          pointer-events: none;
          z-index: 0;
        }
        .page-root::before {
          width: 600px; height: 600px;
          top: -180px; left: -160px;
          background: radial-gradient(circle, rgba(100, 82, 230, 0.14) 0%, transparent 70%);
        }
        .page-root::after {
          width: 500px; height: 500px;
          bottom: -120px; right: -120px;
          background: radial-gradient(circle, rgba(32, 180, 160, 0.09) 0%, transparent 70%);
        }
        .card-profile {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 440px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 18px;
          padding: 32px 28px;
          animation: riseIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes riseIn {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .profile-title {
          font-family: 'Syne', sans-serif;
          font-size: 1.4rem;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.03em;
          margin-bottom: 6px;
          text-align: center;
        }
        .profile-subtitle {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.5);
          text-align: center;
          margin-bottom: 28px;
        }
        .profile-loading, .profile-error {
          text-align: center;
          color: rgba(255,255,255,0.7);
          padding: 24px 0;
        }
        .profile-error { color: rgba(255, 120, 100, 0.95); }
        .profile-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          margin-bottom: 10px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          font-size: 0.9rem;
        }
        .profile-row:last-child { margin-bottom: 0; }
        .profile-row-left {
          justify-content: flex-start;
          gap: 12px;
        }
        .profile-label {
          color: rgba(255,255,255,0.5);
          font-weight: 500;
        }
        .profile-value {
          color: rgba(255,255,255,0.95);
          font-weight: 500;
        }
        .profile-value.type-admin { color: #a78bfa; }
        .profile-value.type-user { color: rgba(255,255,255,0.9); }
        .profile-features-wrap {
          margin-top: 4px;
          padding: 12px 16px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          margin-bottom: 10px;
        }
        .profile-features-label {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.5);
          font-weight: 500;
          margin-bottom: 8px;
        }
        .profile-time-left {
          font-size: 0.82rem;
          color: rgba(255,255,255,0.65);
          margin-bottom: 10px;
        }
        .profile-time-left.expired { color: rgba(255, 120, 100, 0.95); }
        .profile-time-left.unlimited { color: rgba(74, 222, 128, 0.9); }
        .profile-features-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .profile-feature-row {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.85rem;
          color: rgba(255,255,255,0.85);
        }
        .profile-feature-name { flex: 1; min-width: 0; }
        .profile-feature-time {
          flex-shrink: 0;
          font-size: 0.78rem;
          color: rgba(255,255,255,0.55);
        }
        .profile-feature-row.locked .profile-feature-time { display: none; }
        .profile-feature-icon {
          flex-shrink: 0;
          width: 18px;
          height: 18px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }
        .profile-feature-icon.tick {
          color: #4ade80;
          background: rgba(74, 222, 128, 0.15);
        }
        .profile-feature-icon.locked {
          color: rgba(255,255,255,0.35);
          background: rgba(255,255,255,0.06);
        }
        .profile-feature-row.locked {
          color: rgba(255,255,255,0.4);
        }
        .profile-back {
          display: block;
          text-align: center;
          margin-top: 24px;
          font-size: 0.85rem;
        }
        .profile-link {
          color: #7c6af5;
          font-weight: 500;
          text-decoration: none;
          transition: color 0.2s ease;
        }
        .profile-link:hover { color: #8f7ef7; }
        .card-profile.job-running-card { margin-top: 24px; max-width: 440px; }
        .job-running-title { font-family: 'Syne', sans-serif; font-size: 1.1rem; font-weight: 700; color: rgba(255,255,255,0.95); margin-bottom: 16px; }
        .job-running-item {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 14px;
          padding: 18px;
          margin-bottom: 16px;
        }
        .job-running-item:last-child { margin-bottom: 0; }
        .job-running-banner-wrap { display: flex; justify-content: center; margin-bottom: 16px; }
        .job-running-banner {
          width: 100%;
          max-width: 360px;
          min-height: 120px;
          height: auto;
          object-fit: contain;
          border-radius: 12px;
        }
        .job-running-progress-label { font-size: 0.85rem; color: rgba(255,255,255,0.7); margin-bottom: 8px; }
        .job-running-progress-bar-wrap {
          height: 20px;
          background: rgba(255,255,255,0.08);
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 8px;
        }
        .job-running-progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, rgba(74, 222, 128, 0.9), rgba(34, 197, 94, 0.8));
          border-radius: 10px;
          transition: width 0.3s ease;
        }
        .job-running-meta { font-size: 0.78rem; color: rgba(255,255,255,0.5); margin-bottom: 14px; }
        .job-running-actions { display: flex; gap: 10px; flex-wrap: wrap; }
        .job-running-btn {
          padding: 10px 18px;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          border: none;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .job-running-btn-start {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(22, 163, 74, 0.85));
          color: #fff;
        }
        .job-running-btn-start:hover:not(:disabled) { filter: brightness(1.1); }
        .job-running-btn-start:disabled { opacity: 0.6; cursor: not-allowed; }
        .job-running-btn-pause {
          background: rgba(234, 179, 8, 0.25);
          color: #eab308;
          border: 1px solid rgba(234, 179, 8, 0.5);
        }
        .job-running-btn-pause:hover:not(:disabled) { background: rgba(234, 179, 8, 0.35); }
        .job-running-btn-pause:disabled { opacity: 0.6; cursor: not-allowed; }
        .job-running-btn-stop {
          background: rgba(248, 113, 113, 0.2);
          color: #f87171;
          border: 1px solid rgba(248, 113, 113, 0.4);
        }
        .job-running-btn-stop:hover:not(:disabled) { background: rgba(248, 113, 113, 0.3); }
        .job-running-btn-stop:disabled { opacity: 0.6; cursor: not-allowed; }
        .profile-row-right {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex: 1;
          min-width: 0;
        }
        .profile-row-right .profile-password-value {
          letter-spacing: 0.05em;
        }
        .profile-password-actions {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }
        .profile-password-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 8px;
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.7);
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
        }
        .profile-password-btn:hover { background: rgba(255,255,255,0.12); color: #fff; }
        .profile-password-btn:disabled { opacity: 0.4; cursor: not-allowed; pointer-events: none; }
        .profile-password-btn svg { width: 16px; height: 16px; }
        .profile-change-pw-wrap {
          padding: 16px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          margin-bottom: 10px;
        }
        .profile-change-pw-form { display: flex; flex-direction: column; gap: 12px; }
        .profile-change-pw-field { display: flex; flex-direction: column; gap: 4px; }
        .profile-change-pw-label { font-size: 0.8rem; color: rgba(255,255,255,0.55); font-weight: 500; }
        .profile-change-pw-input {
          padding: 10px 12px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.15);
          background: rgba(0,0,0,0.2);
          color: #fff;
          font-size: 0.9rem;
        }
        .profile-change-pw-input:focus { outline: none; border-color: rgba(124, 106, 245, 0.6); }
        .profile-change-pw-error { font-size: 0.85rem; color: #f87171; margin: 0; }
        .profile-change-pw-success { font-size: 0.85rem; color: #4ade80; margin: 0; }
        .profile-change-pw-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 4px; }
        .profile-change-pw-btn {
          padding: 10px 18px;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          border: none;
        }
        .profile-change-pw-btn.primary {
          background: linear-gradient(135deg, rgba(124, 106, 245, 0.9), rgba(99, 102, 241, 0.85));
          color: #fff;
        }
        .profile-change-pw-btn.primary:hover:not(:disabled) { filter: brightness(1.1); }
        .profile-change-pw-btn.primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .profile-change-pw-btn.secondary {
          background: rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.9);
          border: 1px solid rgba(255,255,255,0.2);
        }
        .profile-change-pw-btn.secondary:hover:not(:disabled) { background: rgba(255,255,255,0.12); }
      `}</style>

      <div className="page-root">
        <NavBar />
        <div className="card-profile">
          <h1 className="profile-title">Thông Tin Tài Khoản</h1>
          <p className="profile-subtitle">Xem thông tin đăng ký của bạn</p>

          {loading && (
            <div className="profile-loading">Đang tải…</div>
          )}

          {error && !loading && (
            <div className="profile-error">{error}</div>
          )}

          {info && !loading && !error && (
            <>
              <div className="profile-row profile-row-left">
                <span className="profile-label">Tên đăng nhập</span>
                <span className="profile-value">{info.username}</span>
              </div>
              <div className="profile-row profile-row-left">
                <span className="profile-label">Mật khẩu</span>
                <div className="profile-row-right">
                  <span className="profile-value profile-password-value">
                    {!passwordRevealed
                      ? "••••••••"
                      : passwordLoading
                        ? "Đang tải…"
                        : passwordHashedOnly
                          ? "•••••••• (đã mã hóa)"
                          : (passwordPlain ?? "••••••••")}
                  </span>
                  <div className="profile-password-actions">
                    {!passwordHashedOnly && (
                      <button
                        type="button"
                        className="profile-password-btn"
                        onClick={togglePasswordReveal}
                        disabled={passwordLoading}
                        title={passwordRevealed ? "Ẩn" : "Hiện"}
                        aria-label={passwordRevealed ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                      >
                        {passwordRevealed ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    )}
                    <button
                      type="button"
                      className="profile-password-btn"
                      onClick={() => setChangePwOpen(true)}
                      title="Đổi mật khẩu"
                      aria-label="Đổi mật khẩu"
                    >
                      <PencilIcon />
                    </button>
                  </div>
                </div>
              </div>
              {changePwOpen && (
                <div className="profile-change-pw-wrap">
                  <form onSubmit={handleChangePassword} className="profile-change-pw-form">
                    <div className="profile-change-pw-field">
                      <label className="profile-change-pw-label">Mật khẩu hiện tại</label>
                      <input
                        type="password"
                        value={currentPw}
                        onChange={(e) => { setCurrentPw(e.target.value); setChangePwError(""); }}
                        placeholder="Nhập mật khẩu hiện tại"
                        className="profile-change-pw-input"
                        autoComplete="current-password"
                        disabled={changePwSubmitting}
                      />
                    </div>
                    <div className="profile-change-pw-field">
                      <label className="profile-change-pw-label">Mật khẩu mới</label>
                      <input
                        type="password"
                        value={newPw}
                        onChange={(e) => { setNewPw(e.target.value); setChangePwError(""); }}
                        placeholder="Nhập mật khẩu mới"
                        className="profile-change-pw-input"
                        autoComplete="new-password"
                        disabled={changePwSubmitting}
                      />
                    </div>
                    <div className="profile-change-pw-field">
                      <label className="profile-change-pw-label">Xác nhận mật khẩu mới</label>
                      <input
                        type="password"
                        value={confirmPw}
                        onChange={(e) => { setConfirmPw(e.target.value); setChangePwError(""); }}
                        placeholder="Nhập lại mật khẩu mới"
                        className="profile-change-pw-input"
                        autoComplete="new-password"
                        disabled={changePwSubmitting}
                      />
                    </div>
                    {changePwError && <p className="profile-change-pw-error" role="alert">{changePwError}</p>}
                    {changePwSuccess && <p className="profile-change-pw-success">Đã đổi mật khẩu thành công.</p>}
                    <div className="profile-change-pw-actions">
                      <button type="submit" className="profile-change-pw-btn primary" disabled={changePwSubmitting}>
                        {changePwSubmitting ? "Đang xử lý…" : "Đổi mật khẩu"}
                      </button>
                      <button
                        type="button"
                        className="profile-change-pw-btn secondary"
                        onClick={() => {
                          setChangePwOpen(false);
                          setChangePwError("");
                          setCurrentPw("");
                          setNewPw("");
                          setConfirmPw("");
                        }}
                        disabled={changePwSubmitting}
                      >
                        Hủy
                      </button>
                    </div>
                  </form>
                </div>
              )}
              <div className="profile-row">
                <span className="profile-label">Loại tài khoản</span>
                <span className={`profile-value type-${info.type}`}>
                  {TYPE_LABELS[info.type] ?? info.type}
                </span>
              </div>
              <div className="profile-features-wrap">
                <div className="profile-features-label">Tính năng</div>
                <div className="profile-features-list" style={{ marginTop: 4 }}>
                  {(USER_FEATURES as readonly UserFeature[]).map((key) => {
                    const rem = info.remaining?.[key] ?? 0;
                    const allowed = rem > 0;
                    const timeText = rem >= 999999 ? "Không giới hạn" : `Còn ${rem} lần`;
                    return (
                      <div key={key} className={`profile-feature-row ${allowed ? "" : "locked"}`}>
                        <span className={`profile-feature-icon ${allowed ? "tick" : "locked"}`} aria-hidden>
                          {allowed ? (
                            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                          ) : (
                            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                          )}
                        </span>
                        <span className="profile-feature-name">{FEATURE_LABELS[key] ?? key}</span>
                        {allowed && (
                          <span className="profile-feature-time">{timeText}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="profile-row">
                <span className="profile-label">Ngày đăng ký</span>
                <span className="profile-value">{info.registeredAt}</span>
              </div>
            </>
          )}

          <Link href="/" className="profile-back profile-link">
            ← Quay lại trang chủ
          </Link>
        </div>

        {info && !loading && !error && activeSpamJobs.length > 0 && (
          <div className="card-profile job-running-card">
            <h2 className="job-running-title">Công việc đang chạy ({activeSpamJobs.length})</h2>
            {activeSpamJobs.map((j) => {
              const startMs = new Date(j.startedAt).getTime();
              const endMs = new Date(j.expiresAt!).getTime();
              const progress = endMs > startMs
                ? Math.min(100, Math.max(0, ((now - startMs) / (endMs - startMs)) * 100))
                : 100;
              const progressLabel = progress >= 100 ? "100%" : `${progress.toFixed(1)}%`;
              const startedLabel = new Date(j.startedAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "short", timeStyle: "short" });
              const endsLabel = j.expiresAt ? new Date(j.expiresAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "short", timeStyle: "short" }) : "";
              const isPaused = j.status === "paused";
              return (
                <div key={j.id} className="job-running-item">
                  {j.meta?.bannerUrl && (
                    <div className="job-running-banner-wrap">
                      <img src={j.meta.bannerUrl} alt="" className="job-running-banner" />
                    </div>
                  )}
                  <div className="job-running-progress-label">
                    {progressLabel} tiến trình spam
                    {isPaused && " · Tạm dừng"}
                  </div>
                  <div className="job-running-progress-bar-wrap">
                    <div className="job-running-progress-bar-fill" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="job-running-meta">
                    Bắt đầu: {startedLabel}
                    {endsLabel && ` · Kết thúc: ${endsLabel}`}
                  </div>
                  <div className="job-running-actions">
                    {isPaused ? (
                      <button
                        type="button"
                        className="job-running-btn job-running-btn-start"
                        disabled={resumingId === j.id}
                        onClick={async () => {
                          setResumingId(j.id);
                          try {
                            const username = getLoggedInUser();
                            if (!username) return;
                            const res = await fetch("/api/jobs/resume", {
                              method: "POST",
                              headers: { "Content-Type": "application/json", "X-Username": username },
                              body: JSON.stringify({ jobId: j.id }),
                            });
                            if (res.ok) refreshJobs();
                          } finally {
                            setResumingId(null);
                          }
                        }}
                      >
                        {resumingId === j.id ? "Đang tiếp tục…" : "Bắt đầu"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="job-running-btn job-running-btn-pause"
                        disabled={pausingId === j.id}
                        onClick={async () => {
                          setPausingId(j.id);
                          try {
                            const username = getLoggedInUser();
                            if (!username) return;
                            const res = await fetch("/api/jobs/pause", {
                              method: "POST",
                              headers: { "Content-Type": "application/json", "X-Username": username },
                              body: JSON.stringify({ jobId: j.id }),
                            });
                            if (res.ok) refreshJobs();
                          } finally {
                            setPausingId(null);
                          }
                        }}
                      >
                        {pausingId === j.id ? "Đang tạm dừng…" : "Tạm Dừng"}
                      </button>
                    )}
                    <button
                      type="button"
                      className="job-running-btn job-running-btn-stop"
                      disabled={cancellingId === j.id}
                      onClick={async () => {
                        setCancellingId(j.id);
                        try {
                          const username = getLoggedInUser();
                          if (!username) return;
                          const res = await fetch("/api/jobs/cancel", {
                            method: "POST",
                            headers: { "Content-Type": "application/json", "X-Username": username },
                            body: JSON.stringify({ jobId: j.id }),
                          });
                          if (res.ok) refreshJobs();
                        } finally {
                          setCancellingId(null);
                        }
                      }}
                    >
                      {cancellingId === j.id ? "Đang xóa…" : "Stop"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default ProfilePage;
