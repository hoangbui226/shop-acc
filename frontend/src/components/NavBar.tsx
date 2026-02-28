import { useState, useRef, useEffect } from "react";
import { Globe, ChevronDown, LogOut, User, Tag, Check, X, Menu, Shield } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { isLoggedIn, getLoggedInUser, logout } from "@/lib/auth";

const languages = [
  { code: "vi", label: "Tiếng Việt" },
  { code: "en", label: "English" },
];

type UserInfo = { type: string };

const MEMBER_TYPE_LABELS: Record<string, string> = {
  admin: "Admin",
  user: "Thành viên",
};

/** Each product is a set of features (editable list). Only these features are shown, with a tick. */
export type PricingProduct = {
  id: string;
  title: string;
  desc: string;
  price: string;
  featured?: boolean;
  features: string[];
};

const PRICING_PRODUCTS: PricingProduct[] = [
  {
    id: "check",
    title: "Check MXT & LK",
    desc: "Vĩnh Viễn: 299.000đ",
    price: "49.000đ",
    features: ["Tra cứu mail xác thực", "Tra cứu liên kết ẩn",      "Hỗ trợ 24/7",
      "Bảo hành trọn đời",],
  },
  {
    id: "gogan",
    title: "Gỡ & Gắn MXT",
    desc: "Vĩnh Viễn: 699.000đ",
    price: "299.000đ",
    featured: true,
    features: [
      "Gỡ MXT chưa ngấm vào acc nhanh chóng & tiện lợi",
      "Gỡ + Gắn ngay cả khi acc bị khóa tạm thời",
      "Không cần log vào acc",
      "Hỗ trợ 24/7",
      "Bảo hành trọn đời",
    ],
  },
  {
    id: "spam",
    title: "Spam Login",
    desc: "Vĩnh Viễn: 649.000đ",
    price: "139.000đ",
    features: [
      "Spam Đăng Nhập Liên Tục 24/24",
      "Ngăn người khác đăng nhập vào tài khoản",
      "Spam lên đến 15 ngày liên tục",
      "Dashboard quản lí tài khoản spam",
      "Hỗ trợ 24/7",
      "Bảo hành trọn đời",
    ],
  },

];

const NavBar = () => {
  const [langOpen, setLangOpen] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState(languages[0]);
  const [scrolled, setScrolled] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownRefMobile = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRefMobile = useRef<HTMLDivElement>(null);
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
        });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [userOpen, username]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const inLang = dropdownRef.current?.contains(target) || dropdownRefMobile.current?.contains(target);
      if (!inLang) setLangOpen(false);
      const inUser = userDropdownRef.current?.contains(target) || userDropdownRefMobile.current?.contains(target);
      if (!inUser) setUserOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

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

        @media (max-width: 768px) {
          .navbar-inner {
            padding: 0 16px;
          }
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

        /* Hamburger - hidden on desktop */
        .nav-hamburger {
          display: none;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border: none;
          border-radius: 12px;
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.9);
          cursor: pointer;
          z-index: 11;
          transition: background 0.2s;
        }
        .nav-hamburger:hover {
          background: rgba(255,255,255,0.12);
        }
        @media (max-width: 768px) {
          .nav-hamburger { display: flex; }
          .nav-right { display: none !important; }
        }

        /* Mobile menu panel */
        .nav-mobile-menu {
          display: none;
          position: fixed;
          top: 60px;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(8, 8, 12, 0.98);
          backdrop-filter: blur(20px);
          padding: 24px 20px 32px;
          flex-direction: column;
          gap: 8px;
          overflow-y: auto;
          z-index: 99;
        }
        .navbar-root.mobile-open .nav-mobile-menu {
          display: flex;
        }
        .navbar-root.scrolled.mobile-open .nav-mobile-menu {
          top: 52px;
        }
        .nav-mobile-menu .lang-btn,
        .nav-mobile-menu .nav-pricing-btn {
          width: 100%;
          justify-content: center;
          padding: 14px 16px;
          font-size: 0.9rem;
        }
        .nav-mobile-menu .user-dropdown-trigger,
        .nav-mobile-menu .nav-btn {
          width: 100%;
          max-width: none;
          justify-content: center;
          padding: 14px 16px;
          font-size: 0.95rem;
          font-weight: 500;
        }
        .nav-mobile-menu .user-dropdown-trigger {
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
        }
        .nav-mobile-menu .user-dropdown-menu {
          position: static;
          margin-top: 8px;
          width: 100%;
          max-width: none;
          box-shadow: none;
          border-radius: 12px;
        }
        .nav-mobile-menu > div {
          width: 100%;
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
          width: max-content;
          min-width: 200px;
          max-width: 280px;
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
          padding: 10px 18px;
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
          padding: 14px 18px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.02);
        }

        .user-dropdown-info-row {
          font-size: 0.82rem;
          color: rgba(255,255,255,0.6);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          white-space: nowrap;
          margin-bottom: 8px;
        }

        .user-dropdown-info-row:last-child {
          margin-bottom: 0;
        }

        .user-dropdown-info-label {
          flex-shrink: 0;
        }

        .user-dropdown-info-value {
          color: rgba(255,255,255,0.9);
          font-weight: 500;
          text-align: right;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Bảng Giá button */
        .nav-pricing-btn {
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

        .nav-pricing-btn:hover {
          background: rgba(255,255,255,0.09);
          color: rgba(255,255,255,0.9);
          border-color: rgba(255,255,255,0.18);
        }

        .nav-pricing-btn svg {
          flex-shrink: 0;
          opacity: 0.7;
        }

        /* Pricing modal - larger */
        .pricing-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.65);
          backdrop-filter: blur(8px);
          z-index: 200;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 24px;
          animation: pricing-fadeIn 0.2s ease-out;
          overflow-y: auto;
        }

        @keyframes pricing-fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .pricing-modal {
          background: #0f0f16;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 24px;
          padding: 40px 36px 36px;
          max-width: 1120px;
          width: 100%;
          box-shadow: 0 28px 90px rgba(0,0,0,0.55);
          animation: pricing-scaleIn 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes pricing-scaleIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }

        .pricing-modal-header {
          position: relative;
          margin-bottom: 32px;
        }

        .pricing-modal h2 {
          font-family: 'Syne', sans-serif;
          font-size: 1.75rem;
          font-weight: 700;
          color: #fff;
          text-align: center;
          margin: 0;
          letter-spacing: -0.02em;
        }

        .pricing-modal-close {
          position: absolute;
          top: -8px;
          right: -8px;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          border-radius: 10px;
          background: rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.7);
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
        }

        .pricing-modal-close:hover {
          background: rgba(255,255,255,0.14);
          color: #fff;
        }

        .pricing-cards {
          display: flex;
          align-items: stretch;
          gap: 24px;
          justify-content: center;
        }

        .pricing-card {
          flex: 1;
          min-width: 0;
          max-width: 320px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          padding: 28px 22px 26px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease, background 0.22s ease;
          cursor: default;
        }

        .pricing-card:hover {
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.2);
          box-shadow: 0 12px 40px rgba(0,0,0,0.35);
          transform: translateY(-4px);
        }

        .pricing-card.featured {
          max-width: 360px;
          flex: 1.08;
          padding: 34px 26px 30px;
          border-color: rgba(124, 106, 245, 0.45);
          background: rgba(124, 106, 245, 0.06);
          box-shadow: 0 10px 36px rgba(124, 106, 245, 0.18);
        }

        .pricing-card.featured:hover {
          border-color: rgba(124, 106, 245, 0.65);
          box-shadow: 0 16px 48px rgba(124, 106, 245, 0.28);
          transform: translateY(-6px);
        }

        .pricing-card-title {
          font-family: 'Syne', sans-serif;
          font-size: 1.25rem;
          font-weight: 700;
          color: rgba(255,255,255,0.95);
          margin-bottom: 6px;
        }

        .pricing-card.featured .pricing-card-title {
          font-size: 1.45rem;
        }

        .pricing-card-badge {
          font-size: 0.72rem;
          color: #7c6af5;
          background: rgba(124, 106, 245, 0.22);
          padding: 5px 12px;
          border-radius: 100px;
          margin-bottom: 14px;
          font-weight: 500;
        }

        .pricing-card-desc {
          font-size: 0.82rem;
          color: rgba(255,255,255,0.5);
          line-height: 1.4;
          margin-bottom: 20px;
        }

        .pricing-card-features {
          width: 100%;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 24px;
          text-align: left;
        }

        .pricing-feature-row {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.8rem;
          color: rgba(255,255,255,0.75);
          transition: color 0.15s ease;
        }

        .pricing-card:hover .pricing-feature-row {
          color: rgba(255,255,255,0.88);
        }

        .pricing-feature-row.has {
          color: rgba(255,255,255,0.9);
        }

        .pricing-feature-row.no {
          color: rgba(255,255,255,0.4);
        }

        .pricing-card:hover .pricing-feature-row.no {
          color: rgba(255,255,255,0.5);
        }

        .pricing-feature-icon {
          flex-shrink: 0;
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pricing-feature-icon.has {
          color: #4ade80;
        }

        .pricing-feature-icon.no {
          color: rgba(255,255,255,0.35);
        }

        .pricing-card-price-wrap {
          margin-top: auto;
          padding-top: 8px;
          border-top: 1px solid rgba(255,255,255,0.08);
          width: 100%;
        }

        .pricing-card-price {
          font-family: 'Syne', sans-serif;
          font-size: 1.6rem;
          font-weight: 700;
          color: #fff;
        }

        .pricing-card.featured .pricing-card-price {
          font-size: 1.9rem;
          color: #a78bfa;
        }

        /* Pricing modal - responsive */
        @media (max-width: 768px) {
          .pricing-modal-overlay {
            padding: 16px 12px 24px;
            align-items: flex-start;
          }
          .pricing-modal {
            padding: 24px 16px 20px;
            border-radius: 16px;
            max-width: 100%;
          }
          .pricing-modal-header {
            margin-bottom: 20px;
          }
          .pricing-modal h2 {
            font-size: 1.35rem;
          }
          .pricing-modal-close {
            top: -4px;
            right: -4px;
            width: 32px;
            height: 32px;
          }
          .pricing-cards {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
          }
          .pricing-card,
          .pricing-card.featured {
            max-width: none;
            flex: none;
            padding: 22px 18px 20px;
          }
          .pricing-card-title {
            font-size: 1.15rem;
          }
          .pricing-card.featured .pricing-card-title {
            font-size: 1.25rem;
          }
          .pricing-card-desc {
            margin-bottom: 16px;
            font-size: 0.8rem;
          }
          .pricing-card-features {
            gap: 10px;
            margin-bottom: 18px;
          }
          .pricing-feature-row {
            font-size: 0.78rem;
          }
          .pricing-card-price {
            font-size: 1.4rem;
          }
          .pricing-card.featured .pricing-card-price {
            font-size: 1.55rem;
          }
        }
      `}</style>

      <nav className={`navbar-root ${scrolled ? "scrolled" : ""} ${mobileMenuOpen ? "mobile-open" : ""}`}>
        <div className="navbar-inner">
          {/* Logo */}
          <a href="/" className="nav-logo" onClick={() => setMobileMenuOpen(false)}>
            CHECK<span>mxt</span>
          </a>

          {/* Hamburger - visible on mobile only via CSS */}
          <button
            type="button"
            className="nav-hamburger"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label={mobileMenuOpen ? "Đóng menu" : "Mở menu"}
            aria-expanded={mobileMenuOpen}
          >
            <Menu size={22} />
          </button>

          {/* Right side - hidden on mobile */}
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

            <button
              type="button"
              className="nav-pricing-btn"
              onClick={() => setPricingOpen(true)}
              aria-label="Bảng giá"
            >
              <Tag size={14} />
              Bảng Giá
            </button>

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
                    </div>
                    {userInfo?.type === "admin" && (
                      <button
                        className="user-dropdown-item"
                        onClick={() => {
                          setUserOpen(false);
                          router.push("/admin");
                        }}
                      >
                        <Shield size={16} />
                        Quản trị
                      </button>
                    )}
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

        {/* Mobile menu panel - same items, stacked */}
        <div className="nav-mobile-menu">
          <div style={{ position: "relative" }} ref={dropdownRefMobile}>
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="lang-btn"
              aria-label="Select language"
            >
              <Globe size={18} />
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
          <button
            type="button"
            className="nav-pricing-btn"
            onClick={() => { setPricingOpen(true); setMobileMenuOpen(false); }}
            aria-label="Bảng giá"
          >
            <Tag size={18} />
            Bảng Giá
          </button>
          {loggedIn && username ? (
            <div style={{ position: "relative" }} ref={userDropdownRefMobile}>
              <button
                className="user-dropdown-trigger"
                onClick={() => setUserOpen(!userOpen)}
                aria-expanded={userOpen}
                aria-haspopup="true"
              >
                <span>{username}</span>
                <ChevronDown size={18} />
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
                  </div>
                  {userInfo?.type === "admin" && (
                    <button
                      className="user-dropdown-item"
                      onClick={() => { setUserOpen(false); setMobileMenuOpen(false); router.push("/admin"); }}
                    >
                      <Shield size={16} />
                      Quản trị
                    </button>
                  )}
                  <button
                    className="user-dropdown-item"
                    onClick={() => { setUserOpen(false); setMobileMenuOpen(false); router.push("/profile"); }}
                  >
                    <User size={16} />
                    Thông tin tài khoản
                  </button>
                  <button
                    className="user-dropdown-item logout"
                    onClick={() => {
                      logout();
                      setUserOpen(false);
                      setMobileMenuOpen(false);
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
                onClick={() => { setMobileMenuOpen(false); router.push("/signup"); }}
              >
                Đăng Ký
              </button>
              <button
                className="nav-btn nav-btn-primary"
                onClick={() => { setMobileMenuOpen(false); router.push("/login"); }}
              >
                Đăng Nhập
              </button>
            </>
          )}
        </div>
      </nav>

      {pricingOpen && (
        <div
          className="pricing-modal-overlay"
          onClick={() => setPricingOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="pricing-title"
        >
          <div
            className="pricing-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pricing-modal-header">
              <h2 id="pricing-title">Bảng Giá</h2>
              <button
                type="button"
                className="pricing-modal-close"
                onClick={() => setPricingOpen(false)}
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>
            <div className="pricing-cards">
              {PRICING_PRODUCTS.map((product) => (
                <div
                  key={product.id}
                  className={`pricing-card ${product.featured ? "featured" : ""}`}
                >
                  <div className="pricing-card-title">{product.title}</div>
                  <div className="pricing-card-desc">{product.desc}</div>
                  <div className="pricing-card-features">
                    {product.features.map((label) => (
                      <div key={label} className="pricing-feature-row has">
                        <span className="pricing-feature-icon has">
                          <Check size={16} strokeWidth={2.5} />
                        </span>
                        <span>{label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pricing-card-price-wrap">
                    <div className="pricing-card-price">{product.price}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NavBar;