"use client";

import { useState, useRef, useEffect } from "react";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";

const languages = [
  { code: "en", label: "English" },
  { code: "vi", label: "Tiếng Việt" },
];

const NavBar = () => {
  const [langOpen, setLangOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState(languages[0]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        
        {/* Logo (use Next Link instead of <a>) */}
        <Link href="/" className="text-lg font-bold text-foreground tracking-tight">
          LimitesM2
        </Link>

        <div className="flex items-center gap-2">

          {/* Language dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center justify-center w-9 h-9 rounded-full border border-border bg-secondary text-foreground hover:bg-accent transition-colors"
              aria-label="Select language"
            >
              <Globe size={18} />
            </button>

            {langOpen && (
              <div className="absolute right-0 mt-2 w-40 rounded-lg bg-card border border-border shadow-lg z-50 overflow-hidden">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setSelectedLang(lang);
                      setLangOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-accent ${
                      selectedLang.code === lang.code
                        ? "text-primary font-medium"
                        : "text-foreground"
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sign Up */}
          <Button
            variant="outline"
            size="sm"
            className="text-sm w-24"
            onClick={() => router.push("/signup")}
          >
            Sign Up
          </Button>

          {/* Login */}
          <Button
            size="sm"
            className="text-sm w-24 ml-1"
            onClick={() => router.push("/login")}
          >
            Login
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;