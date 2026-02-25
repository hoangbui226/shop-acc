"use client";

import React, { useState } from "react";
import Navigation from "@/components/Navigation";
import { useCart } from "@/lib/cart";
import Link from "next/link";

export default function CartPage() {
  const { items, removeItem, clear, totalItems } = useCart();
  const [removingIdx, setRemovingIdx] = useState<number | null>(null);

  const handleRemove = (idx: number) => {
    setRemovingIdx(idx);
    setTimeout(() => {
      removeItem(idx);
      setRemovingIdx(null);
    }, 300);
  };

  const totalINR = items.reduce((sum, it) => sum * it.qty, 0);
  const totalUSDT = items.reduce((sum, it) => {
    const usdNum = parseFloat(String(it.usdPrice).replace(/[^0-9.]/g, ""));
    return sum + (isNaN(usdNum) ? 0 : usdNum * it.qty);
  }, 0);

  return (
    <div className="min-h-screen bg-[#080b0f] text-[#e8edf2]">
      {/* Neon background gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute top-0 left-0 w-3/5 h-2/5"
          style={{ background: "radial-gradient(ellipse at top left, rgba(0,234,255,0.06) 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 right-0 w-1/2 h-3/5"
          style={{ background: "radial-gradient(ellipse at bottom right, rgba(138,61,255,0.04) 0%, transparent 70%)" }}
        />
      </div>

      <Navigation />

      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-28 pb-20">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6 text-center">
            <div className="w-24 h-24 rounded-full border-2 border-[#00eaff]/20 flex items-center justify-center text-[#00eaff] shadow-lg">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Your cart is empty</h2>
            <p className="text-[#5a6a7a] font-mono text-sm sm:text-base">
              Add items to get started
            </p>
            <Link
              href="/"
              className="mt-4 inline-flex items-center gap-3 bg-gradient-to-r from-[#00eaff] to-[#8a3dff] text-black font-bold text-sm uppercase tracking-widest px-6 py-3 rounded-xl shadow-md hover:opacity-90 transition-all"
            >
              Browse Marketplace
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-end justify-between mb-10 pb-6 border-b border-white/[0.06]">
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-none">
                Your Cart{" "}
                <span className="font-mono font-light text-[#00eaff] text-2xl ml-3">
                  {totalItems} {totalItems === 1 ? "item" : "items"}
                </span>
              </h1>
              <button
                onClick={clear}
                className="text-[#ff3c5a] font-mono text-xs uppercase tracking-widest px-4 py-2 rounded-md border border-[rgba(255,60,90,0.3)] hover:bg-[rgba(255,60,90,0.08)] hover:border-[#ff3c5a] transition-all"
              >
                Clear All
              </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
              {/* Cart Items */}
              <div className="flex-1 flex flex-col gap-4 min-w-0">
                {items.map((it, idx) => (
                  <div
                    key={idx}
                    className={`group relative flex items-center gap-5 px-6 py-5 rounded-xl bg-[#0e1318] border border-white/[0.06] shadow-md hover:shadow-xl hover:border-[#00eaff]/20 transition-all duration-300 ${
                      removingIdx === idx ? "opacity-0 translate-x-4 duration-300" : "opacity-100 translate-x-0"
                    }`}
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl bg-gradient-to-b from-[#00eaff] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    <img
                      src={it.image}
                      alt={it.title}
                      className="w-24 h-24 object-cover rounded-lg shrink-0 bg-[#131a22]"
                    />

                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-[15px] tracking-tight truncate mb-1">{it.title}</h3>
                      <p className="font-mono text-[11px] text-[#5a6a7a] mb-2">by {it.seller}</p>
                      <span className="inline-flex items-center gap-2 bg-[#131a22] border border-white/[0.06] rounded px-3 py-1 font-mono text-xs text-[#5a6a7a]">
                        qty <strong className="text-[#e8edf2] font-medium">{it.qty}</strong>
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono text-sm text-[#00eaff] font-light mt-1">
                        {it.usdPrice} USDT
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemove(idx)}
                      className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-[#5a6a7a] px-3 py-1.5 rounded border border-[rgba(255,60,90,0.2)] hover:border-[#ff3c5a] hover:text-[#ff3c5a] hover:bg-[rgba(255,60,90,0.06)] transition-all"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="w-full lg:w-80 shrink-0 relative bg-[#0e1318] border border-[#00eaff]/20 rounded-2xl p-7 shadow-md sticky top-28 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00eaff] to-transparent" />

                <h2 className="font-bold text-xs uppercase tracking-widest text-[#5a6a7a] mb-5">
                  Order Summary
                </h2>

                <div className="flex flex-col">
                  <div className="flex justify-between items-center py-3 border-b border-white/[0.06]">
                    <span className="font-mono text-xs uppercase tracking-widest text-[#5a6a7a]">Items</span>
                    <span className="font-bold text-sm">{totalItems}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-white/[0.06]">
                    <span className="font-mono text-xs uppercase tracking-widest text-[#5a6a7a]">USDT</span>
                    <span className="font-mono text-sm text-[#00eaff] font-light">{totalUSDT.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-5 pt-5 border-t border-white/[0.06]">
                  <span className="text-xs font-semibold uppercase tracking-widest text-[#5a6a7a]">Total</span>
                  <span className="text-3xl font-extrabold tracking-tight">
                    Rs.{totalINR.toLocaleString("en-IN")}
                  </span>
                </div>

                <button className="relative w-full mt-6 py-4 bg-gradient-to-r from-[#00eaff] to-[#8a3dff] text-black font-extrabold text-sm uppercase tracking-widest rounded-xl overflow-hidden hover:opacity-95 active:scale-[0.98] transition-all shadow-lg">
                  <span className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
                  Checkout &rarr;
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}