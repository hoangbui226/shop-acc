"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import NavBar from "@/components/NavBar";
import { Checkbox } from "@/components/ui/checkbox";
import { setLoggedIn, getRememberedUsername } from "@/lib/auth";

const LoginPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showRegisteredMsg, setShowRegisteredMsg] = useState(false);

  useEffect(() => {
    if (searchParams?.get("registered") === "1") {
      setShowRegisteredMsg(true);
      router.replace("/login", { scroll: false });
    }
  }, [searchParams, router]);

  useEffect(() => {
    const saved = getRememberedUsername();
    if (saved?.trim()) {
      setUsername(saved.trim());
      setRemember(true);
    }
  }, []);

  const [loginError, setLoginError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    if (!username.trim() || !password.trim()) {
      alert("Vui lòng điền tên đăng nhập và mật khẩu.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLoginError(data.message || "Tên đăng nhập hoặc mật khẩu không đúng.");
        return;
      }
      setLoggedIn(data.username ?? username.trim(), remember);
      router.push("/");
    } catch {
      setLoginError("Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <style>{`
        .page-root {
          min-height: 100vh;
          background: #070710;
          font-family: 'Be Vietnam Pro', 'DM Sans', sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 96px 16px 64px;
          gap: 20px;
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
        .card-auth {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 420px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 18px;
          padding: 32px 26px 28px;
          animation: riseIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes riseIn {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .auth-title {
          font-family: 'Be Vietnam Pro', 'Syne', sans-serif;
          font-size: 1.5rem;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.03em;
          margin-bottom: 4px;
          text-align: center;
        }
        .auth-subtitle {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.5);
          text-align: center;
          margin-bottom: 24px;
        }
        .auth-form .auth-field-wrap { margin-bottom: 16px; }
        .auth-options {
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.78rem;
          color: rgba(255,255,255,0.48);
        }
        .auth-options .remember-box {
          flex-shrink: 0;
          width: 18px; height: 18px;
          border: 1px solid rgba(255,255,255,0.25);
          border-radius: 4px;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s ease, border-color 0.2s ease;
        }
        .auth-options .remember-box:has(button[data-state="checked"]) {
          background: #7c6af5;
          border-color: #7c6af5;
        }
        .auth-options .remember-box button {
          width: 18px; height: 18px;
          min-width: 18px; min-height: 18px;
          border-radius: 4px;
          border: none;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .auth-options .remember-box button[data-state="checked"] { background: transparent !important; }
        .auth-options .remember-box button svg { width: 12px; height: 12px; color: #fff; }
        .auth-options-label { cursor: pointer; user-select: none; }
        .auth-btn-wrap { margin-top: 4px; }
        .auth-footer {
          font-size: 0.78rem;
          color: rgba(255,255,255,0.48);
          text-align: center;
          margin-top: 24px;
        }
        .auth-link {
          color: #7c6af5;
          font-weight: 500;
          text-decoration: none;
          transition: color 0.2s ease;
        }
        .auth-link:hover { color: #8f7ef7; }
        .token-input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 13px 16px;
          font-family: 'Be Vietnam Pro', 'DM Sans', sans-serif;
          font-size: 0.875rem;
          color: rgba(255,255,255,0.9);
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .token-input::placeholder { color: rgba(255,255,255,0.22); }
        .token-input:focus {
          border-color: rgba(124, 106, 245, 0.5);
          box-shadow: 0 0 0 3px rgba(124, 106, 245, 0.1);
        }
        .btn-row { display: flex; gap: 10px; }
        .btn {
          flex: 1;
          font-family: 'Be Vietnam Pro', 'DM Sans', sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          padding: 12px 20px;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .btn-primary {
          background: #7c6af5;
          color: #fff;
          box-shadow: 0 2px 16px rgba(124, 106, 245, 0.35);
        }
        .btn-primary:hover {
          background: #8f7ef7;
          box-shadow: 0 4px 24px rgba(124, 106, 245, 0.55);
          transform: translateY(-1px);
        }
        .auth-registered-msg {
          font-size: 0.85rem;
          color: #4ade80;
          text-align: center;
          padding: 10px 14px;
          margin-bottom: 16px;
          background: rgba(74, 222, 128, 0.1);
          border: 1px solid rgba(74, 222, 128, 0.25);
          border-radius: 10px;
        }
        .auth-warning {
          font-size: 0.75rem;
          color: rgba(255, 120, 100, 0.95);
          margin-top: 6px;
          padding-left: 2px;
        }
        .token-input-error {
          border-color: rgba(255, 120, 100, 0.5);
        }
      `}</style>

      <div className="page-root">
        <NavBar />
        <div className="card-auth">
          <h1 className="auth-title">Đăng Nhập</h1>
          <p className="auth-subtitle">Đăng Nhập Để Bắt Đầu Tra Cứu.</p>
          {showRegisteredMsg && (
            <p className="auth-registered-msg" role="status">
              Đăng ký thành công. Vui lòng đăng nhập.
            </p>
          )}
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field-wrap">
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setLoginError(""); }}
                placeholder="Tên Đăng Nhập"
                className="token-input"
                required
                disabled={submitting}
              />
            </div>
            <div className="auth-field-wrap">
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setLoginError(""); }}
                placeholder="Mật Khẩu"
                className={`token-input ${loginError ? "token-input-error" : ""}`}
                required
                disabled={submitting}
              />
              {loginError && (
                <p className="auth-warning" role="alert">{loginError}</p>
              )}
            </div>
            <div className="auth-options">
              <span className="remember-box">
                <Checkbox
                  id="remember"
                  checked={remember}
                  onCheckedChange={(v) => setRemember(v === true)}
                />
              </span>
              <label htmlFor="remember" className="auth-options-label">
                Ghi Nhớ Tài Khoản
              </label>
            </div>
            <div className="auth-btn-wrap btn-row">
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? "Đang đăng nhập…" : "Đăng Nhập"}
              </button>
            </div>
          </form>
          <p className="auth-footer">
            Bạn Chưa Có Tài Khoản?{" "}
            <Link href="/signup" className="auth-link">
              Đăng Ký
            </Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
