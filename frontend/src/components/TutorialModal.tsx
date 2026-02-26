import { useState } from "react";
import { X } from "lucide-react";

const tutorialData = {
  ios: {
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    steps: [
      {
        title: "Download the App",
        description:
          "Go to the App Store on your iPhone or iPad. Search for the application and tap 'Get' to download and install it on your device.",
      },
      {
        title: "Create Your Account",
        description:
          "Open the app and tap 'Sign Up'. Fill in your details including email and password, then verify your email address to activate your account.",
      },
      {
        title: "Get Your Token",
        description:
          "Navigate to Settings > Account > Token. Tap 'Copy Token' to copy it to your clipboard. You will use this token in the Checagem de Limites tool.",
      },
      {
        title: "Check Your Limits",
        description:
          "Paste your token into the input field on the main page and click 'Consultar'. Your available recharges and diamond history will be displayed.",
      },
    ],
  },
  adr: {
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    steps: [
      {
        title: "Install the APK",
        description:
          "Download the APK file from the official website. Go to Settings > Security and enable 'Unknown Sources', then install the APK.",
      },
      {
        title: "Register Your Account",
        description:
          "Launch the app and tap 'Register'. Enter your email, create a strong password, and complete the verification process.",
      },
      {
        title: "Retrieve Your Token",
        description:
          "Open the side menu and go to Profile > Token Management. Tap 'Generate Token' and copy the generated token to your clipboard.",
      },
      {
        title: "Verify Your Limits",
        description:
          "Go back to the Checagem de Limites page, paste your token, and press 'Consultar' to see your available recharges and diamond usage.",
      },
    ],
  },
};

interface TutorialModalProps {
  open: boolean;
  onClose: () => void;
}

const TutorialModal = ({ open, onClose }: TutorialModalProps) => {
  const [platform, setPlatform] = useState<"ios" | "adr">("ios");

  if (!open) return null;

  const data = tutorialData[platform];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');

        .tm-overlay {
          position: fixed;
          inset: 0;
          z-index: 200;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          animation: tm-fade-in 0.2s ease both;
        }

        @keyframes tm-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .tm-backdrop {
          position: absolute;
          inset: 0;
          background: rgba(4, 4, 10, 0.82);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }

        .tm-modal {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 820px;
          max-height: 90vh;
          overflow-y: auto;
          border-radius: 22px;
          background: #0d0d18;
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow:
            0 0 0 1px rgba(124, 106, 245, 0.08),
            0 32px 80px rgba(0,0,0,0.7),
            0 8px 24px rgba(0,0,0,0.4);
          animation: tm-slide-up 0.28s cubic-bezier(0.22, 1, 0.36, 1) both;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.08) transparent;
        }

        .tm-modal::-webkit-scrollbar { width: 5px; }
        .tm-modal::-webkit-scrollbar-track { background: transparent; }
        .tm-modal::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.07);
          border-radius: 99px;
        }

        @keyframes tm-slide-up {
          from { opacity: 0; transform: translateY(22px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* ── Header ── */
        .tm-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 32px 36px 0;
          gap: 12px;
        }

        .tm-title-group {}

        .tm-eyebrow {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.68rem;
          font-weight: 500;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #7c6af5;
          margin-bottom: 6px;
        }

        .tm-title {
          font-family: 'Syne', sans-serif;
          font-size: 1.5rem;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.03em;
          line-height: 1.1;
        }

        .tm-close {
          flex-shrink: 0;
          width: 34px; height: 34px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.45);
          cursor: pointer;
          transition: all 0.18s ease;
          margin-top: 2px;
        }

        .tm-close:hover {
          background: rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.85);
          border-color: rgba(255,255,255,0.18);
        }

        /* ── Body ── */
        .tm-body {
          padding: 28px 36px 36px;
        }

        /* ── Platform toggle ── */
        .tm-toggle {
          display: inline-flex;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 4px;
          margin-bottom: 28px;
          gap: 2px;
        }

        .tm-tab {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.8rem;
          font-weight: 500;
          padding: 7px 20px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          color: rgba(255,255,255,0.38);
          background: transparent;
          letter-spacing: 0.06em;
        }

        .tm-tab.active {
          background: #7c6af5;
          color: #fff;
          box-shadow: 0 2px 12px rgba(124, 106, 245, 0.4);
        }

        .tm-tab:not(.active):hover {
          color: rgba(255,255,255,0.7);
          background: rgba(255,255,255,0.05);
        }

        /* ── Video ── */
        .tm-video-wrap {
          position: relative;
          width: 100%;
          aspect-ratio: 16/9;
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.07);
          background: #050508;
          margin-bottom: 32px;
        }

        .tm-video-wrap iframe {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }

        /* ── Steps ── */
        .tm-steps {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .tm-step {
          display: flex;
          gap: 20px;
          position: relative;
          padding-bottom: 28px;
        }

        .tm-step:last-child { padding-bottom: 0; }

        /* Vertical line */
        .tm-step:not(:last-child) .tm-step-line {
          position: absolute;
          left: 15px;
          top: 32px;
          bottom: 0;
          width: 1px;
          background: linear-gradient(to bottom, rgba(124,106,245,0.3), rgba(124,106,245,0.05));
        }

        .tm-step-num {
          flex-shrink: 0;
          width: 32px; height: 32px;
          border-radius: 50%;
          background: rgba(124, 106, 245, 0.12);
          border: 1px solid rgba(124, 106, 245, 0.25);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Syne', sans-serif;
          font-size: 0.75rem;
          font-weight: 700;
          color: #9d8fff;
          position: relative;
          z-index: 1;
        }

        .tm-step-content {
          padding-top: 4px;
          flex: 1;
        }

        .tm-step-title {
          font-family: 'Syne', sans-serif;
          font-size: 0.92rem;
          font-weight: 700;
          color: rgba(255,255,255,0.88);
          letter-spacing: -0.01em;
          margin-bottom: 5px;
        }

        .tm-step-desc {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.82rem;
          line-height: 1.7;
          color: rgba(255,255,255,0.38);
          font-weight: 300;
        }

        /* ── Divider ── */
        .tm-divider {
          height: 1px;
          background: rgba(255,255,255,0.06);
          margin: 0 36px;
        }
      `}</style>

      <div className="tm-overlay">
        <div className="tm-backdrop" onClick={onClose} />

        <div className="tm-modal" role="dialog" aria-modal="true" aria-label="Hướng Dẫn">
          {/* Header */}
          <div className="tm-header">
            <div className="tm-title-group">
              <p className="tm-eyebrow">CHECK MXT</p>
              <h2 className="tm-title">TUTORIAL</h2>
            </div>
            <button className="tm-close" onClick={onClose} aria-label="Fechar">
              <X size={16} />
            </button>
          </div>

          <div className="tm-divider" style={{ margin: "0 36px 0" }} />

          {/* Body */}
          <div className="tm-body">
            {/* Platform toggle */}
            <div className="tm-toggle" role="tablist">
              <button
                role="tab"
                className={`tm-tab ${platform === "ios" ? "active" : ""}`}
                onClick={() => setPlatform("ios")}
                aria-selected={platform === "ios"}
              >
                iOS
              </button>
              <button
                role="tab"
                className={`tm-tab ${platform === "adr" ? "active" : ""}`}
                onClick={() => setPlatform("adr")}
                aria-selected={platform === "adr"}
              >
                ADR
              </button>
            </div>

            {/* Video */}
            <div className="tm-video-wrap">
              <iframe
                key={platform}
                src={data.videoUrl}
                title={`${platform.toUpperCase()} Tutorial`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {/* Steps */}
            <div className="tm-steps">
              {data.steps.map((step, i) => (
                <div className="tm-step" key={i}>
                  <div className="tm-step-line" aria-hidden="true" />
                  <div className="tm-step-num">{i + 1}</div>
                  <div className="tm-step-content">
                    <p className="tm-step-title">{step.title}</p>
                    <p className="tm-step-desc">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TutorialModal;