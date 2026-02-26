import type { Metadata } from "next";
import "../index.css";

export const metadata: Metadata = {
  title: "LimitesM2 — Checagem de Limites",
  description: "Verifique suas recargas e histórico de diamantes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <head>
        {/* Preconnect for Google Fonts used across the app */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap"
          rel="stylesheet"
        />
        <style>{`
          /* ── Reset & baseline ── */
          *, *::before, *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }

          html {
            -webkit-text-size-adjust: 100%;
            text-size-adjust: 100%;
            scroll-behavior: smooth;
          }

          body {
            min-height: 100vh;
            background: #070710;
            color: rgba(255,255,255,0.82);
            font-family: 'DM Sans', sans-serif;
            font-weight: 400;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            overflow-x: hidden;
          }

          /* Thin scrollbar globally */
          ::-webkit-scrollbar { width: 5px; height: 5px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb {
            background: rgba(255,255,255,0.1);
            border-radius: 99px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: rgba(255,255,255,0.18);
          }

          /* Selection colour */
          ::selection {
            background: rgba(124, 106, 245, 0.35);
            color: #fff;
          }

          /* Focus ring */
          :focus-visible {
            outline: 2px solid rgba(124, 106, 245, 0.6);
            outline-offset: 3px;
          }

          /* Prevent tap highlight on mobile */
          button, a {
            -webkit-tap-highlight-color: transparent;
          }
        `}</style>
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}