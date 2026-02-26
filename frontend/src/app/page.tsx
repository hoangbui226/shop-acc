"use client";
import { useState } from "react";
import NavBar from "@/components/NavBar";
import TutorialModal from "@/components/TutorialModal";

/* ─────────────────────────────────────────────
   Inline styles — no Tailwind / shadcn needed
   for the page-level layout. NavBar & Modal are
   kept as-is via their own files.
───────────────────────────────────────────── */

const Index = () => {
  const [token, setToken] = useState("");
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    setShowResults(true);
    setLoading(true);
    setTimeout(() => setLoading(false), 3000);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

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

        /* ── Background orbs ── */
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

        /* ── Card ── */
        .card {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 640px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 40px;
          animation: riseIn 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .card:nth-child(3) { animation-delay: 0.08s; }
        .card:nth-child(4) { animation-delay: 0.16s; }

        @keyframes riseIn {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Card heading ── */
        .card-eyebrow {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #7c6af5;
          margin-bottom: 10px;
        }

        .card-title {
          font-family: 'Syne', sans-serif;
          font-size: 1.65rem;
          font-weight: 800;
          color: #fff;
          line-height: 1.15;
          letter-spacing: -0.03em;
          margin-bottom: 16px;
        }

        .card-desc {
          font-size: 0.875rem;
          line-height: 1.7;
          color: rgba(255,255,255,0.48);
          margin-bottom: 28px;
        }

        .card-desc strong {
          color: rgba(255,255,255,0.82);
          font-weight: 500;
        }

        .card-desc .highlight {
          display: inline-block;
          color: #c4baff;
          font-weight: 600;
          font-size: 0.8rem;
          letter-spacing: 0.04em;
          background: rgba(124, 106, 245, 0.12);
          border: 1px solid rgba(124, 106, 245, 0.2);
          border-radius: 6px;
          padding: 2px 7px;
          margin-top: 4px;
        }

        /* ── Divider ── */
        .divider {
          height: 1px;
          background: rgba(255,255,255,0.07);
          margin: 24px 0;
        }

        /* ── Input ── */
        .token-input-wrap {
          position: relative;
          margin-bottom: 16px;
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

        /* ── Buttons ── */
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

        .btn-outline {
          background: transparent;
          color: rgba(255,255,255,0.6);
          border: 1px solid rgba(255,255,255,0.12);
        }

        .btn-outline:hover {
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.9);
          border-color: rgba(255,255,255,0.22);
        }

        /* ── Notice ── */
        .notice {
          display: flex;
          gap: 10px;
          margin-top: 24px;
          padding: 14px 16px;
          background: rgba(255, 200, 80, 0.05);
          border: 1px solid rgba(255, 200, 80, 0.12);
          border-radius: 10px;
        }

        .notice-icon {
          flex-shrink: 0;
          width: 18px; height: 18px;
          margin-top: 1px;
          color: #f5c842;
        }

        .notice-text {
          font-size: 0.78rem;
          line-height: 1.65;
          color: rgba(255,255,255,0.38);
        }

        .notice-text strong {
          color: rgba(255, 200, 80, 0.75);
          font-weight: 500;
        }

        /* ── Results card ── */
        .results-card {
          composes: card;
        }

        .results-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.68rem;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.25);
          margin-bottom: 20px;
        }

        /* ── Spinner ── */
        .spinner-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 0 32px;
          gap: 16px;
        }

        .spinner {
          width: 36px; height: 36px;
          border-radius: 50%;
          border: 2.5px solid rgba(124, 106, 245, 0.18);
          border-top-color: #7c6af5;
          animation: spin 0.75s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .spinner-text {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.3);
          letter-spacing: 0.04em;
        }

        /* ── Results content placeholder ── */
        .results-content {
          animation: riseIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .results-title {
          font-family: 'Syne', sans-serif;
          font-size: 1.1rem;
          font-weight: 700;
          color: #fff;
          margin-bottom: 8px;
          letter-spacing: -0.02em;
        }

        .results-sub {
          font-size: 0.82rem;
          color: rgba(255,255,255,0.35);
        }

        /* ── Grid noise overlay ── */
        .noise {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          opacity: 0.022;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 200px 200px;
        }
      `}</style>

      <div className="page-root">
        <div className="noise" aria-hidden="true" />
        <NavBar />

        {/* ── Main card ── */}
        <div className="card">
          <p className="card-eyebrow">SHOP BO ARA</p>
          <h1 className="card-title">CHECK THÔNG TIN<br />ACC</h1>

          <p className="card-desc">
            Dịch Vụ Tra Cứu <strong>Thông Tin Tài Khoản</strong> Bằng Token
            Nhanh Chóng, Đầy Đủ Và Bảo Mật{" "}
            Tham Gia <span className="highlight">Nhóm Zalo</span>{" "}
            Để Được Hỗ Trợ.
          </p>

          <div className="divider" />

          <form onSubmit={handleSubmit}>
            <div className="token-input-wrap">
              <input
                className="token-input"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Nhập Access Token của bạn"
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            <div className="btn-row">
              <button type="submit" className="btn btn-primary">
                CHECK
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setTutorialOpen(true)}
              >
                HƯỚNG DẪN
              </button>
            </div>
          </form>

          <div className="notice">
            <svg className="notice-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
            </svg>
            <p className="notice-text">
              <strong>IMPORTANTE:</strong> Nas quantidades que mostram por ex: 620 ou 930,
              significa que você só tem limite de 1 recarga incluindo as duas — ou seja,
              se você fizer 930, não poderá fazer 620 também.
            </p>
          </div>
        </div>

        {/* ── Results card ── */}
        {showResults && (
          <div className="card">
            <p className="results-label">Resultado da verificação</p>
            {loading ? (
              <div className="spinner-wrap">
                <div className="spinner" />
                <span className="spinner-text">Consultando API…</span>
              </div>
            ) : (
              <div className="results-content">
                <h2 className="results-title">Dados disponíveis</h2>
                <p className="results-sub">As informações da conta aparecerão aqui.</p>
              </div>
            )}
          </div>
        )}

        <TutorialModal open={tutorialOpen} onClose={() => setTutorialOpen(false)} />
      </div>
    </>
  );
};

export default Index;