import React from "react";
import Navigation from "@/components/Navigation";
import { Zap, Shield, Clock, CheckCircle } from "lucide-react";

const HERO_IMAGE =
  "https://storage.googleapis.com/gpt-engineer-file-uploads/bLmg6dRP6kev4R35rqzaWVXOn2z2/social-images/social-1767481799431-Gemini_Generated_Image_xwftaxxwftaxxwft.png";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0a0d18]">
      <Navigation />

      <main className="flex-1 pt-[90px]">
        <header
          className="h-[calc(100vh-90px)] flex items-center relative overflow-hidden"
          style={{
            backgroundImage: `url(${HERO_IMAGE})`,
            backgroundPosition: "center",
            backgroundSize: "cover",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40" />

          <div className="absolute top-0 right-0 w-96 h-96 bg-[#00eaff]/10 rounded-full blur-3xl -z-10" />
          <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-[#8a3dff]/10 rounded-full blur-3xl -z-10" />

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00eaff]/10 border border-[#00eaff]/30 mb-6 backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-[#00eaff] animate-pulse" />
                <span className="text-sm font-semibold text-[#00eaff]">
                  #1 Free Fire Level Bot
                </span>
              </div>
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-black mb-6 text-white leading-tight">
                Level Up Your Free Fire Game
              </h1>

              <p className="text-lg sm:text-xl text-gray-200 mb-8 max-w-2xl leading-relaxed">
                Automated daily EXP grind with 57,000+ points. Bank-level security, 24/7 non-stop leveling. Join thousands of players worldwide.
              </p>
 
                <div className="w-1/2 max-w-auto mx-auto mb-8">
                  <div className="relative flex items-center rounded-full border border-[#00eaff]/30">
                    <span className="pl-4 pr-2 text-[#00eaff]">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      placeholder="Search products, weapons, skins..."
                      className="flex-1 px-4 py-4 text-white focus:outline-none focus:border-[#00eaff] focus:ring-2 focus:ring-[#00eaff]/20 rounded-full"
                    />
                    <button className="m-2 px-6 py-2 rounded-full bg-gradient-to-r from-[#00eaff] to-[#8a3dff] text-white font-semibold shadow-md hover:from-[#8a3dff] hover:to-[#00eaff] transition-all duration-300">
                      Search
                    </button>
                  </div>
                </div>
            </div>
          </div>
        </header>
      </main>
    </div>
  );
}