import React, { Suspense } from "react";
import NavigationClient from "@/components/NavigationClient";
import { Zap, Shield, Clock, CheckCircle } from "lucide-react";
import dynamic from "next/dynamic";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";

const ProductCard = dynamic(() => import("@/components/ProductCard"), {
  loading: () => <ProductCardSkeleton />,
});

export default function Home() {
  const products = [
    {
      title: "Elite Weapon Skin",
      seller: "GameStore",
      tags: ["Weapon", "Skin", "Rare"],
      price: "1200",
      usdPrice: "15",
      link: "/products/elite-weapon-skin",
    },
    // add more products here
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0d18] text-white">
      <NavigationClient />

      {/* Hero Section */}
      <header className="relative h-[calc(100vh-90px)] flex items-center justify-center overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00eaff]/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-[#8a3dff]/10 rounded-full blur-3xl -z-10" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00eaff]/10 border border-[#00eaff]/30 mb-6 backdrop-blur-sm mx-auto">
            <span className="w-2 h-2 rounded-full bg-[#00eaff] animate-pulse" />
            <span className="text-sm font-semibold text-[#00eaff]">
              #1 Free Fire Level Bot
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold mb-6 leading-tight">
            Level Up Your Free Fire Game
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            Automated daily EXP grind with 57,000+ points. Bank-level security, 24/7 non-stop leveling. Join thousands of players worldwide.
          </p>

          {/* Search Bar */}
          <div className="w-full max-w-xl mx-auto mb-12">
            <div className="relative flex items-center rounded-full border border-[#00eaff]/30 bg-black/30 shadow-lg backdrop-blur-md">
              <input
                type="text"
                placeholder="Search products, weapons, skins..."
                className="flex-1 px-6 py-3 text-white bg-transparent rounded-full focus:outline-none focus:border-[#00eaff] focus:ring-2 focus:ring-[#00eaff]/30"
              />
              <button className="ml-2 mr-1 px-6 py-2 rounded-full bg-gradient-to-r from-[#00eaff] to-[#8a3dff] font-semibold shadow-lg hover:from-[#8a3dff] hover:to-[#00eaff] transition-all duration-300">
                Search
              </button>
            </div>
          </div>

          {/* Product Listing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <Suspense fallback={<ProductCardSkeleton />}>
              {products.map((product, idx) => (
                <div
                  key={idx}
                  className="transform hover:scale-105 transition-transform duration-300"
                >
                  <ProductCard {...product} />
                </div>
              ))}
            </Suspense>
          </div>
        </div>
      </header>
    </div>
  );
}