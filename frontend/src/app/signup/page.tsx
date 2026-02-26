"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import NavBar from "@/components/NavBar";

const SignUpPage = () => {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passwordWarning, setPasswordWarning] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordWarning("");
    setUsernameError("");
    if (!username.trim() || !password.trim() || !confirm.trim()) {
      alert("Vui lòng điền đầy đủ các trường.");
      return;
    }
    if (password !== confirm) {
      setPasswordWarning("Mật khẩu không trùng khớp. Vui lòng kiểm tra lại.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 409) {
        setUsernameError(data.message || "Tên đăng nhập đã được sử dụng.");
        return;
      }
      if (!res.ok) {
        setUsernameError(data.error || data.message || "Đăng ký thất bại. Vui lòng thử lại.");
        return;
      }
      router.replace("/login?registered=1");
    } catch {
      setUsernameError("Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const clearPasswordWarning = () => setPasswordWarning("");
  const clearUsernameError = () => setUsernameError("");

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
        .auth-warning {
          font-size: 0.75rem;
          color: rgba(255, 120, 100, 0.95);
          margin-top: 6px;
          padding-left: 2px;
        }
        .token-input-error {
          border-color: rgba(255, 120, 100, 0.5);
        }
        .auth-success-box {
          text-align: center;
          padding: 24px 20px;
        }
        .auth-success-box .auth-success-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #4ade80;
          margin-bottom: 8px;
        }
        .auth-success-box .auth-success-msg {
          font-size: 0.9rem;
          color: rgba(255,255,255,0.7);
        }
      `}</style>

      <div className="page-root">
        <NavBar />
        <div className="card-auth">
          <>
          <h1 className="auth-title">Đăng Ký</h1>
          <p className="auth-subtitle">
            Đăng Ký Để Tra Cứu Thông Tin Tài Khoản.
          </p>
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field-wrap">
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); clearUsernameError(); }}
                placeholder="Tên Đăng Nhập"
                className={`token-input ${usernameError ? "token-input-error" : ""}`}
                required
                disabled={submitting}
              />
              {usernameError && (
                <p className="auth-warning" role="alert">{usernameError}</p>
              )}
            </div>
            <div className="auth-field-wrap">
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); clearPasswordWarning(); }}
                placeholder="Mật Khẩu"
                className="token-input"
                required
              />
            </div>
            <div className="auth-field-wrap">
              <input
                type="password"
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); clearPasswordWarning(); }}
                placeholder="Nhập Lại Mật Khẩu"
                className={`token-input ${passwordWarning ? "token-input-error" : ""}`}
                required
              />
              {passwordWarning && (
                <p className="auth-warning" role="alert">{passwordWarning}</p>
              )}
            </div>
            <div className="auth-btn-wrap btn-row">
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? "Đang đăng ký…" : "Đăng Ký"}
              </button>
            </div>
          </form>
          <p className="auth-footer">
            Bạn Đã Có Tài Khoản?{" "}
            <Link href="/login" className="auth-link">
              Đăng Nhập
            </Link>
          </p>
          </>
        </div>
      </div>
    </>
  );
};

export default SignUpPage;
