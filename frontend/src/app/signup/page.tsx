"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import NavBar from "@/components/NavBar";
import { Checkbox } from "@/components/ui/checkbox";

const SignUpPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [captchaChecked, setCaptchaChecked] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!captchaChecked) return;

    if (!username.trim() || !password.trim() || !confirm.trim()) {
      alert("Preencha todos os campos para continuar.");
      return;
    }

    if (password !== confirm) {
      alert("As senhas não coincidem. Tente novamente.");
      return;
    }

    // TODO: replace with your real sign-up API
    console.log("Sign up:", { username, password });
  };

  return (
    <>
      <style>{`
        .page-root {
          min-height: 100vh;
          background: #070710;
          font-family: 'DM Sans', sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 96px 16px 64px;
          gap: 20px;
          position: relative;
          overflow: hidden;
        }

        .page-root::before,
        .page-root::after {
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
          font-family: 'Syne', sans-serif;
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
          margin-bottom: 20px;
        }

        .auth-footer {
          font-size: 0.78rem;
          color: rgba(255,255,255,0.48);
          text-align: center;
          margin-top: 18px;
        }

        .token-input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 13px 16px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.875rem;
          color: rgba(255,255,255,0.9);
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          font-weight: 300;
          letter-spacing: 0.01em;
        }

        .token-input::placeholder {
          color: rgba(255,255,255,0.22);
        }

        .token-input:focus {
          border-color: rgba(124, 106, 245, 0.5);
          box-shadow: 0 0 0 3px rgba(124, 106, 245, 0.1);
        }

        .btn-row {
          display: flex;
          gap: 10px;
        }

        .btn {
          flex: 1;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          padding: 12px 20px;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
          letter-spacing: 0.01em;
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

        .btn-primary:active { transform: translateY(0); }
      `}</style>

      <div className="page-root">
        <div className="noise" aria-hidden="true" />
        <NavBar />

        <div className="card-auth">
          <h1 className="auth-title">Create account</h1>
          <p className="auth-subtitle">
            Sign up to check limits and manage your account.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="token-input"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="token-input"
              required
            />
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Retype password"
              className="token-input"
              required
            />

            <div className="flex items-center gap-3 rounded-md border border-border bg-secondary/50 p-3">
              <Checkbox
                id="captcha"
                checked={captchaChecked}
                onCheckedChange={(v) => setCaptchaChecked(v === true)}
              />
              <label
                htmlFor="captcha"
                className="text-sm text-foreground cursor-pointer select-none"
              >
                I&apos;m not a robot
              </label>
            </div>

            <div className="btn-row">
              <button type="submit" className="btn btn-primary" disabled={!captchaChecked}>
                Sign Up
              </button>
            </div>
          </form>

          <p className="auth-footer">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="text-primary hover:underline"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </>
  );
};

export default SignUpPage;