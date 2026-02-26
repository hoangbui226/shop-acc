"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import NavBar from "@/components/NavBar";
import { isLoggedIn, getLoggedInUser } from "@/lib/auth";

const TYPE_LABELS: Record<string, string> = {
  admin: "Quản trị viên",
  vip: "VIP",
  user: "Thành viên",
};

type UserInfo = {
  username: string;
  type: string;
  registeredAt: string;
};

const ProfilePage = () => {
  const router = useRouter();
  const [info, setInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        .profile-label {
          color: rgba(255,255,255,0.5);
          font-weight: 500;
        }
        .profile-value {
          color: rgba(255,255,255,0.95);
          font-weight: 500;
        }
        .profile-value.type-admin { color: #a78bfa; }
        .profile-value.type-vip { color: #fbbf24; }
        .profile-value.type-user { color: rgba(255,255,255,0.9); }
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
              <div className="profile-row">
                <span className="profile-label">Tên đăng nhập</span>
                <span className="profile-value">{info.username}</span>
              </div>
              <div className="profile-row">
                <span className="profile-label">Loại tài khoản</span>
                <span className={`profile-value type-${info.type}`}>
                  {TYPE_LABELS[info.type] ?? info.type}
                </span>
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
      </div>
    </>
  );
};

export default ProfilePage;
