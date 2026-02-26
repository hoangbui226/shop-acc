"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import NavBar from "@/components/NavBar";
import TutorialModal from "@/components/TutorialModal";
import { isLoggedIn } from "@/lib/auth";

/* ─────────────────────────────────────────────
   Inline styles — no Tailwind / shadcn needed
   for the page-level layout. NavBar & Modal are
   kept as-is via their own files.
───────────────────────────────────────────── */

/** Proxy API: runs on our server so no CORS. Returns { error } or { bannerUrl }. */
const CHECK_TOKEN_API = "/api/check-token";

/** Platform id -> label for display */
const PLATFORM_LABELS: Record<number, string> = {
  7: "Facebook",
  8: "Google",
  10: "iCloud",
  5: "VKontakte",
  11: "Twitter (X)",
};

/** Display order for Liên kết section */
const PLATFORM_ORDER = [8, 10, 5, 11, 7] as const; // Google, iCloud, VK, X, Facebook

/** Platform icon SVGs (simple brand-style shapes) */
function PlatformIcon({ platform, className }: { platform: number; className?: string }) {
  const size = 16;
  const common = { width: size, height: size, className };
  switch (platform) {
    case 8: // Google
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
      );
    case 10: // Apple / iCloud
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path fill="currentColor" d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-1.18 1.62-2.09 3.23-3.53 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
        </svg>
      );
    case 5: // VK (VKontakte) - official style
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path fill="#07F" d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4.03 8.57 4.03 8.096c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.677.863 2.49 2.303 4.675 3.253 5.576.254.254.356.339.61.339.254 0 .356-.085.356-.593V9.721c-.017-.47-.085-.61-.525-.61h-2.44c-.44 0-.593.17-.593.508v2.644c0 .678-.305.847-.61.847-.61 0-.593-.78-.593-2.406V9.721c0-.44-.135-.61-.593-.61H7.576c-.322 0-.525.17-.525.508v2.931c0 1.389.254 1.932 1.321 1.932.66 0 1.017-.17 1.491-.593 1.017-1.067 1.744-3.05 2.644-5.405.17-.508.339-.677.78-.677h2.44c.44 0 .525.254.44.677-.22 1.017-2.354 4.031-2.354 3.965 0 .305.44.593.61.593h1.321c.508 0 .678-.27 1.017-.593.508-.678 1.253-1.694 2.034-2.847.78-1.135 1.355-1.966 1.576-2.44.17-.39.085-.678-.44-.678z" />
        </svg>
      );
    case 11: // Twitter (X)
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case 7: // Facebook
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
  }
}

/** Bounded account from API */
type BoundedAccount = {
  platform: number;
  create_time: number;
  uid: number;
  user_info?: { nickname?: string; email?: string; icon?: string };
};

const CopyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

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

const UidIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    <path d="M9 14h6M9 10h6" />
  </svg>
);

const Index = () => {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [region, setRegion] = useState<string | null>(null);
  const [uid, setUid] = useState("");
  const [email, setEmail] = useState("");
  const [emailToBe, setEmailToBe] = useState("");
  const [countdownDisplay, setCountdownDisplay] = useState("");
  const [boundedAccounts, setBoundedAccounts] = useState<BoundedAccount[]>([]);
  const [availablePlatforms, setAvailablePlatforms] = useState<number[]>([]);
  const [mailVisible, setMailVisible] = useState({ mail: false, mailToBe: false, countdown: false });
  const resultsCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showResults && resultsCardRef.current) {
      resultsCardRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [showResults]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
  };

  const toggleMailVisible = (key: keyof typeof mailVisible) => {
    setMailVisible((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    const accessToken = token.trim();
    if (!accessToken) return;

    setShowResults(true);
    setLoading(true);
    setError(null);
    setErrorCode(null);
    setBannerUrl(null);
    setRegion(null);
    setUid("");
    setEmail("");
    setEmailToBe("");
    setCountdownDisplay("");
    setBoundedAccounts([]);
    setAvailablePlatforms([]);
    setMailVisible({ mail: false, mailToBe: false, countdown: false });

    try {
      const res = await fetch(
        `${CHECK_TOKEN_API}?access_token=${encodeURIComponent(accessToken)}`
      );
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError((data.error as string) || `Lỗi server (${res.status}).`);
        if (data.errorCode) setErrorCode(data.errorCode as string);
        return;
      }

      if (data.error) {
        setError(data.error as string);
        if (data.errorCode) setErrorCode(data.errorCode as string);
        return;
      }

      if (data.bannerUrl) {
        setBannerUrl(data.bannerUrl);
      } else {
        setError("Không nhận được banner từ server.");
      }
      if (data.region) setRegion(data.region);
      if (data.uid != null) setUid(data.uid);
      if (data.email != null) setEmail(data.email);
      if (data.email_to_be != null) setEmailToBe(data.email_to_be);
      if (data.request_exec_countdown != null)
        setCountdownDisplay(data.request_exec_countdown);
      if (Array.isArray(data.bounded_accounts))
        setBoundedAccounts(data.bounded_accounts);
      if (Array.isArray(data.available_platforms))
        setAvailablePlatforms(data.available_platforms);
    } catch (err) {
      console.error("Check token error:", err);
      setError("Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
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
        .card-desc .highlight-link {
          text-decoration: none;
          transition: color 0.2s ease, background 0.2s ease, border-color 0.2s ease;
        }
        .card-desc .highlight-link:hover {
          color: #e0daff;
          background: rgba(124, 106, 245, 0.2);
          border-color: rgba(124, 106, 245, 0.35);
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
        .notice-text .notice-link {
          color: rgba(255, 200, 80, 0.9);
          font-weight: 500;
          text-decoration: none;
          border-bottom: 1px solid rgba(255, 200, 80, 0.4);
          transition: color 0.2s ease, border-color 0.2s ease;
        }
        .notice-text .notice-link:hover {
          color: rgba(255, 220, 120, 1);
          border-color: rgba(255, 220, 120, 0.7);
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

        .results-error {
          font-size: 0.9rem;
          color: hsl(var(--destructive));
          padding: 24px 0;
        }

        .results-error-link {
          background: none;
          border: none;
          padding: 0;
          font: inherit;
          color: #7c6af5;
          text-decoration: underline;
          cursor: pointer;
          text-underline-offset: 2px;
        }

        .results-error-link:hover {
          color: #8f7ef7;
        }

        .results-banner-wrap {
          padding: 16px 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .results-banner-center {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
        }

        .results-banner-img {
          display: block;
          max-width: 100%;
          height: auto;
          border-radius: var(--radius);
        }

        .results-pills-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
          margin-top: 14px;
          justify-content: center;
        }

        .region-pill,
        .uid-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px 6px 10px;
          border-radius: 100px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.65);
          font-family: 'DM Sans', sans-serif;
          font-size: 0.78rem;
          font-weight: 400;
          cursor: default;
          pointer-events: none;
        }

        .region-pill svg,
        .uid-pill svg {
          flex-shrink: 0;
          width: 14px;
          height: 14px;
          opacity: 0.7;
        }

        .results-meta {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-start;
          gap: 16px 24px;
          margin-top: 12px;
        }

        .results-email-block {
          flex: 1;
          min-width: 200px;
        }

        .results-email-row {
          margin-bottom: 8px;
          font-size: 0.85rem;
        }

        .results-email-row:last-child {
          margin-bottom: 0;
        }

        .results-email-label {
          color: rgba(255,255,255,0.5);
          margin-right: 8px;
        }

        .results-email-value {
          color: rgba(255,255,255,0.9);
        }

        .result-sections {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 16px;
          width: 100%;
        }

        .result-section {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 16px 18px;
          min-width: 0;
        }

        .result-section-title {
          font-family: 'Syne', sans-serif;
          font-size: 1.05rem;
          font-weight: 700;
          color: rgba(255,255,255,0.95);
          margin-bottom: 12px;
          letter-spacing: 0.02em;
        }

        .copyable-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          margin-bottom: 8px;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 10px;
          background: rgba(255,255,255,0.02);
          font-size: 0.85rem;
        }

        .copyable-row:last-of-type {
          margin-bottom: 0;
        }

        .copyable-row-label {
          color: rgba(255,255,255,0.55);
          flex-shrink: 0;
          min-width: 120px;
        }

        .copyable-row-value {
          flex: 1;
          min-width: 0;
          color: rgba(255,255,255,0.9);
          font-family: ui-monospace, monospace;
          letter-spacing: 0.02em;
          user-select: none;
        }

        .copyable-row-value.masked {
          filter: blur(4px);
          pointer-events: none;
          user-select: none;
        }

        .copyable-row-value:not(.masked) {
          user-select: text;
        }

        .copyable-row-actions {
          display: flex;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
        }

        .copyable-row-btn {
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

        .copyable-row-btn:hover {
          background: rgba(255,255,255,0.12);
          color: #fff;
        }

        .copyable-row-btn svg {
          width: 16px;
          height: 16px;
        }

        .link-main-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          margin-bottom: 10px;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 10px;
          background: rgba(255,255,255,0.02);
          font-size: 0.85rem;
        }

        .link-main-label {
          color: rgba(255,255,255,0.55);
          flex-shrink: 0;
          margin-right: 8px;
        }

        .link-main-icons {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .link-main-icons .link-platform-icon {
          width: 22px;
          height: 22px;
        }

        .link-main-icons .link-platform-icon svg {
          width: 18px;
          height: 18px;
        }

        .link-status {
          font-size: 0.9rem;
          color: rgba(255,255,255,0.7);
          margin-bottom: 12px;
        }

        .link-status strong {
          color: rgba(255,255,255,0.95);
        }

        .link-platforms-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 14px;
          flex-wrap: wrap;
        }

        .link-platforms-row .link-platform-icon {
          width: 24px;
          height: 24px;
        }

        .link-platforms-row .link-platform-icon svg {
          width: 20px;
          height: 20px;
        }

        .link-box {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          margin-bottom: 8px;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 10px;
          background: rgba(255,255,255,0.02);
          font-size: 0.85rem;
        }

        .link-box:last-child {
          margin-bottom: 0;
        }

        .link-box .link-platform-icon {
          width: 22px;
          height: 22px;
          flex-shrink: 0;
        }

        .link-box .link-platform-icon svg {
          width: 18px;
          height: 18px;
        }

        .link-platform-value {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
          flex: 1;
        }

        .link-platform-value.available {
          color: rgba(255,255,255,0.5);
        }

        .link-item-avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          object-fit: cover;
          flex-shrink: 0;
          background: rgba(255,255,255,0.1);
        }

        .link-item-name {
          color: rgba(255,255,255,0.9);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .link-platform-icon {
          flex-shrink: 0;
          width: 20px;
          height: 20px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .link-platform-icon svg {
          width: 16px;
          height: 16px;
        }

        .link-empty {
          color: rgba(255,255,255,0.4);
          font-size: 0.8rem;
          padding: 8px 0;
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
            Tham Gia{" "}
            <a
              href="https://zalo.me/g/yourgroup"
              target="_blank"
              rel="noopener noreferrer"
              className="highlight highlight-link"
            >
              Nhóm Zalo
            </a>{" "}
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
              <strong>LƯU Ý:</strong> TUYỆT ĐỐI KHÔNG CHIA SẺ TOKEN VỚI BẤT KÌ AI.
              ĐIỀU NÀY CÓ THỂ KHIỂN ACC BẠN BỊ KHÓA VĨNH VIÊN!
              <br />
              MỌI TOKEN TRÊN TRANG WEB ĐƯỢC BẢO MẬT TUYỆT ĐỐI.
              <br />
              MỌI THẮC MẮC VUI LÒNG LIÊN HỆ ADMIN{" "}
              <a href="https://zalo.me/g/yourgroup" target="_blank" rel="noopener noreferrer" className="notice-link">
                TẠI ĐÂY
              </a>
              .
            </p>
          </div>
        </div>

        {/* ── Results card ── */}
        {showResults && (
          <div className="card" ref={resultsCardRef}>
            <p className="results-label">KẾT QUẢ</p>
            {loading ? (
              <div className="spinner-wrap">
                <div className="spinner" />
                <span className="spinner-text">ĐANG TRA CỨU…</span>
              </div>
            ) : error ? (
              <div className="results-content">
                <p className="results-error">
                  {errorCode === "invalid_token" ? (
                    <>
                      Token không hợp lệ hoặc đã hết hạn. Vui lòng làm theo hướng dẫn{" "}
                      <button type="button" className="results-error-link" onClick={() => setTutorialOpen(true)}>
                        tại đây
                      </button>
                      .
                    </>
                  ) : (
                    error
                  )}
                </p>
              </div>
            ) : bannerUrl ? (
              <div className="results-content results-banner-wrap">
                <div className="results-banner-center">
                  <img
                    src={bannerUrl}
                    alt="Profile banner"
                    className="results-banner-img"
                  />
                </div>
                <div className="results-pills-row">
                  {region ? (
                    <div className="region-pill" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                      </svg>
                      <span>{region}</span>
                    </div>
                  ) : null}
                  {uid ? (
                    <div className="uid-pill" aria-hidden="true">
                      <UidIcon />
                      <span>UID: {uid}</span>
                    </div>
                  ) : null}
                </div>
                <div className="result-sections">
                  <div className="result-section">
                    <h3 className="result-section-title">Mail xác thực</h3>
                    <div className="copyable-row">
                      <span className="copyable-row-label">Mail Xác Thực</span>
                      <span className={`copyable-row-value ${!mailVisible.mail ? "masked" : ""}`}>
                        {mailVisible.mail ? (email || "—") : "••••••••••••••••"}
                      </span>
                      <span className="copyable-row-actions">
                        <button type="button" className="copyable-row-btn" onClick={() => copyToClipboard(email)} title="Sao chép" aria-label="Sao chép">
                          <CopyIcon />
                        </button>
                        <button type="button" className="copyable-row-btn" onClick={() => toggleMailVisible("mail")} title={mailVisible.mail ? "Ẩn" : "Hiện"} aria-label={mailVisible.mail ? "Ẩn" : "Hiện"}>
                          {mailVisible.mail ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                      </span>
                    </div>
                    <div className="copyable-row">
                      <span className="copyable-row-label">Mail đang gắn</span>
                      <span className={`copyable-row-value ${!mailVisible.mailToBe ? "masked" : ""}`}>
                        {mailVisible.mailToBe ? (emailToBe || "Not Available") : "••••••••••••••••"}
                      </span>
                      <span className="copyable-row-actions">
                        <button type="button" className="copyable-row-btn" onClick={() => copyToClipboard(emailToBe)} title="Sao chép" aria-label="Sao chép">
                          <CopyIcon />
                        </button>
                        <button type="button" className="copyable-row-btn" onClick={() => toggleMailVisible("mailToBe")} title={mailVisible.mailToBe ? "Ẩn" : "Hiện"} aria-label={mailVisible.mailToBe ? "Ẩn" : "Hiện"}>
                          {mailVisible.mailToBe ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                      </span>
                    </div>
                    <div className="copyable-row">
                      <span className="copyable-row-label">Thời gian gắn</span>
                      <span className={`copyable-row-value ${!mailVisible.countdown ? "masked" : ""}`}>
                        {mailVisible.countdown ? (countdownDisplay || "Not Available") : "••••••••••••••••"}
                      </span>
                      <span className="copyable-row-actions">
                        <button type="button" className="copyable-row-btn" onClick={() => copyToClipboard(countdownDisplay)} title="Sao chép" aria-label="Sao chép">
                          <CopyIcon />
                        </button>
                        <button type="button" className="copyable-row-btn" onClick={() => toggleMailVisible("countdown")} title={mailVisible.countdown ? "Ẩn" : "Hiện"} aria-label={mailVisible.countdown ? "Ẩn" : "Hiện"}>
                          {mailVisible.countdown ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                      </span>
                    </div>
                  </div>
                  <div className="result-section">
                    <h3 className="result-section-title">Liên kết</h3>
                    {(() => {
                      const mainLinked = PLATFORM_ORDER.filter((p) => !availablePlatforms.includes(p));
                      return mainLinked.length > 0 ? (
                        <div className="link-main-row">
                          <span className="link-main-label">Liên kết chính</span>
                          <div className="link-main-icons">
                            {mainLinked.map((p) => (
                              <span key={p} className="link-platform-icon" title={PLATFORM_LABELS[p]}>
                                <PlatformIcon platform={p} />
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : null;
                    })()}
                    <div>
                      {PLATFORM_ORDER.filter((platformId) => availablePlatforms.includes(platformId)).map((platformId) => {
                        const acc = boundedAccounts.find((a) => a.platform === platformId);
                        return (
                          <div key={platformId} className="link-box">
                            <span className="link-platform-icon" title={PLATFORM_LABELS[platformId]}>
                              <PlatformIcon platform={platformId} />
                            </span>
                            <div className={`link-platform-value ${!acc ? "available" : ""}`}>
                              {acc ? (
                                <>
                                  {acc.user_info?.icon ? (
                                    <img src={acc.user_info.icon} alt="" className="link-item-avatar" />
                                  ) : (
                                    <div className="link-item-avatar" style={{ background: "rgba(255,255,255,0.15)" }} />
                                  )}
                                  <span className="link-item-name">{acc.user_info?.nickname || "—"}</span>
                                </>
                              ) : (
                                <span>Available</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}

        <TutorialModal open={tutorialOpen} onClose={() => setTutorialOpen(false)} />
      </div>
    </>
  );
};

export default Index;