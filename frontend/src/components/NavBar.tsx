import { useState, useRef, useEffect } from "react";
import { Globe, ChevronDown, LogOut, User } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { isLoggedIn, getLoggedInUser, logout } from "@/lib/auth";

const languages = [
  { code: "vi", label: "Tiếng Việt" },
  { code: "en", label: "English" },
];

function formatExpiration(expiresAt: string): string {
  try {
    const d = new Date(expiresAt);
    if (Number.isNaN(d.getTime())) return expiresAt;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return expiresAt;
  }
}

type UserInfo = { type: string; expiresAt: string | null };

const MEMBER_TYPE_LABELS: Record<string, string> = {
  admin: "Admin",
  vip: "VIP",
  user: "Thành viên",
};

const NavBar = () => {
  const [langOpen, setLangOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState(languages[0]);
  const [scrolled, setScrolled] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setLoggedIn(isLoggedIn());
    setUsername(getLoggedInUser());
    setUserInfo(null);
  }, [pathname]);

  useEffect(() => {
    if (!userOpen || !username?.trim()) return;
    let cancelled = false;
    fetch(`/api/user/info?username=${encodeURIComponent(username.trim())}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || data.error) return;
        setUserInfo({
          type: data.type ?? "user",
          expiresAt: data.expiresAt ?? null,
        });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [userOpen, username]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setUserOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

        .navbar-root {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 100;
          padding: 0 0;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .navbar-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 28px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .navbar-root.scrolled .navbar-inner {
          height: 52px;
        }

        .navbar-root::before {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(8, 8, 12, 0.72);
          backdrop-filter: blur(18px) saturate(180%);
          -webkit-backdrop-filter: blur(18px) saturate(180%);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          opacity: 0;
          transition: opacity 0.35s ease;
          pointer-events: none;
        }

        .navbar-root.scrolled::before {
          opacity: 1;
        }

        /* Logo */
        .nav-logo {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 1.15rem;
          letter-spacing: -0.03em;
          color: #fff;
          text-decoration: none;
          position: relative;
          z-index: 1;
          transition: opacity 0.2s ease;
        }

        .nav-logo:hover { opacity: 0.75; }

        .nav-logo span {
          color: #7c6af5;
        }

        /* Right cluster */
        .nav-right {
          display: flex;
          align-items: center;
          gap: 8px;
          position: relative;
          z-index: 1;
        }

        /* Language button */
        .lang-btn {
          display: flex;
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
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .lang-btn:hover {
          background: rgba(255,255,255,0.09);
          color: rgba(255,255,255,0.9);
          border-color: rgba(255,255,255,0.18);
        }

        .lang-btn svg {
          flex-shrink: 0;
          opacity: 0.7;
        }

        /* Dropdown */
        .lang-dropdown {
          position: absolute;
          right: 0;
          top: calc(100% + 8px);
          min-width: 148px;
          background: #111118;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.3);
          overflow: hidden;
          animation: dropIn 0.18s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          transform-origin: top right;
        }

        @keyframes dropIn {
          from { opacity: 0; transform: scale(0.95) translateY(-4px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }

        .lang-option {
          width: 100%;
          text-align: left;
          padding: 10px 16px;
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.55);
          font-family: 'DM Sans', sans-serif;
          font-size: 0.82rem;
          cursor: pointer;
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .lang-option:hover {
          background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.9);
        }

        .lang-option.active {
          color: #9d8fff;
          font-weight: 500;
        }

        .lang-option.active::after {
          content: '';
          width: 5px; height: 5px;
          border-radius: 50%;
          background: #7c6af5;
          display: block;
        }

        /* Divider between options */
        .lang-option + .lang-option {
          border-top: 1px solid rgba(255,255,255,0.05);
        }

        /* Nav buttons */
        .nav-btn {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.82rem;
          font-weight: 500;
          padding: 7px 18px;
          border-radius: 100px;
          cursor: pointer;
          border: none;
          transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
          letter-spacing: 0.01em;
        }

        .nav-btn-ghost {
          background: transparent;
          color: rgba(255,255,255,0.6);
          border: 1px solid rgba(255,255,255,0.12);
        }

        .nav-btn-ghost:hover {
          background: rgba(255,255,255,0.07);
          color: rgba(255,255,255,0.9);
          border-color: rgba(255,255,255,0.22);
        }

        .nav-btn-primary {
          background: #7c6af5;
          color: #fff;
          border: 1px solid transparent;
          box-shadow: 0 2px 12px rgba(124, 106, 245, 0.35);
        }

        .nav-btn-primary:hover {
          background: #8f7ef7;
          box-shadow: 0 4px 20px rgba(124, 106, 245, 0.5);
          transform: translateY(-1px);
        }

        .nav-btn-primary:active {
          transform: translateY(0);
        }

        /* User dropdown */
        .user-dropdown-trigger {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px 6px 12px;
          border-radius: 100px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.9);
          font-family: 'DM Sans', sans-serif;
          font-size: 0.82rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          max-width: 180px;
        }

        .user-dropdown-trigger:hover {
          background: rgba(255,255,255,0.1);
          border-color: rgba(255,255,255,0.2);
        }

        .user-dropdown-trigger span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .user-dropdown-trigger svg:last-child {
          flex-shrink: 0;
          opacity: 0.7;
          transition: transform 0.2s ease;
        }

        .user-dropdown-trigger[aria-expanded="true"] svg:last-child {
          transform: rotate(180deg);
        }

        .user-dropdown-menu {
          position: absolute;
          right: 0;
          top: calc(100% + 8px);
          min-width: 180px;
          background: #111118;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.3);
          overflow: hidden;
          animation: dropIn 0.18s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          transform-origin: top right;
          z-index: 50;
        }

        .user-dropdown-item {
          width: 100%;
          text-align: left;
          padding: 10px 16px;
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.7);
          font-family: 'DM Sans', sans-serif;
          font-size: 0.82rem;
          cursor: pointer;
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .user-dropdown-item:hover {
          background: rgba(255,255,255,0.06);
          color: #fff;
        }

        .user-dropdown-item.logout {
          color: rgba(255, 120, 100, 0.95);
          border-top: 1px solid rgba(255,255,255,0.08);
        }

        .user-dropdown-item.logout:hover {
          background: rgba(255, 120, 100, 0.08);
        }

        .user-dropdown-info {
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.02);
        }

        .user-dropdown-info-row {
          font-size: 0.78rem;
          color: rgba(255,255,255,0.6);
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 4px;
        }

        .user-dropdown-info-row:last-child {
          margin-bottom: 0;
        }

        .user-dropdown-info-label {
          min-width: 64px;
        }

        .user-dropdown-info-value {
          color: rgba(255,255,255,0.9);
          font-weight: 500;
        }
      `}</style>

      <nav className={`navbar-root ${scrolled ? "scrolled" : ""}`}>
        <div className="navbar-inner">
          {/* Logo */}
          <a href="/" className="nav-logo">
            CHECK<span>mxt</span>
          </a>

          {/* Right side */}
          <div className="nav-right">
            {/* Language dropdown */}
            <div style={{ position: "relative" }} ref={dropdownRef}>
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="lang-btn"
                aria-label="Select language"
              >
                <Globe size={14} />
                {selectedLang.label}
              </button>

              {langOpen && (
                <div className="lang-dropdown">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => { setSelectedLang(lang); setLangOpen(false); }}
                      className={`lang-option ${selectedLang.code === lang.code ? "active" : ""}`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {loggedIn && username ? (
              <div style={{ position: "relative" }} ref={userDropdownRef}>
                <button
                  className="user-dropdown-trigger"
                  onClick={() => setUserOpen(!userOpen)}
                  aria-expanded={userOpen}
                  aria-haspopup="true"
                  aria-label="User menu"
                >
                  <span>{username}</span>
                  <ChevronDown size={16} />
                </button>
                {userOpen && (
                  <div className="user-dropdown-menu">
                    <div className="user-dropdown-info">
                      <div className="user-dropdown-info-row">
                        <span className="user-dropdown-info-label">Loại:</span>
                        <span className="user-dropdown-info-value">
                          {userInfo ? MEMBER_TYPE_LABELS[userInfo.type] ?? userInfo.type : "…"}
                        </span>
                      </div>
                      <div className="user-dropdown-info-row">
                        <span className="user-dropdown-info-label">Hết hạn:</span>
                        <span className="user-dropdown-info-value">
                          {userInfo
                            ? (userInfo.expiresAt
                                ? formatExpiration(userInfo.expiresAt)
                                : "Không giới hạn")
                            : "…"}
                        </span>
                      </div>
                    </div>
                    <button
                      className="user-dropdown-item"
                      onClick={() => {
                        setUserOpen(false);
                        router.push("/profile");
                      }}
                    >
                      <User size={16} />
                      Thông tin tài khoản
                    </button>
                    <button
                      className="user-dropdown-item logout"
                      onClick={() => {
                        logout();
                        setUserOpen(false);
                        setLoggedIn(false);
                        setUsername(null);
                        router.push("/");
                      }}
                    >
                      <LogOut size={16} />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  className="nav-btn nav-btn-ghost"
                  onClick={() => router.push("/signup")}
                >
                  Đăng Ký
                </button>
                <button
                  className="nav-btn nav-btn-primary"
                  onClick={() => router.push("/login")}
                >
                  Đăng Nhập
                </button>
              </>
            )}
          </div>
        </div>
      </nav>
    </>
  );
};

export default NavBar;