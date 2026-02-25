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
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute top-0 left-0 w-3/5 h-2/5"
          style={{ background: "radial-gradient(ellipse at top left, rgba(0,234,255,0.04) 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 right-0 w-1/2 h-3/5"
          style={{ background: "radial-gradient(ellipse at bottom right, rgba(0,150,200,0.03) 0%, transparent 70%)" }}
        />
      </div>

      <Navigation />

      <main className="relative z-10 max-w-5xl mx-auto px-6 pt-28 pb-20">

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-5 text-center">
            <div className="w-20 h-20 rounded-full border border-[rgba(0,234,255,0.2)] flex items-center justify-center text-[#00eaff]">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold tracking-tight m-0">Your cart is empty</h2>
            <p className="text-[#5a6a7a] font-mono text-sm m-0">Add items to get started</p>
            <Link
              href="/"
              className="mt-2 inline-flex items-center gap-2 bg-[#00eaff] text-black font-bold text-sm uppercase tracking-widest px-6 py-3 rounded-lg hover:opacity-85 transition-opacity"
            >
              Browse marketplace
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-end justify-between mb-8 pb-6 border-b border-white/[0.06]">
              <h1 className="text-4xl font-extrabold tracking-tight leading-none m-0">
                Your Cart{" "}
                <span className="font-mono font-light text-[#00eaff] text-2xl tracking-wide ml-3">
                  {totalItems} {totalItems === 1 ? "item" : "items"}
                </span>
              </h1>
              <button
                onClick={clear}
                className="text-[#ff3c5a] font-mono text-xs uppercase tracking-widest px-4 py-2 rounded-md border border-[rgba(255,60,90,0.3)] bg-transparent hover:bg-[rgba(255,60,90,0.08)] hover:border-[#ff3c5a] transition-all"
              >
                Clear all
              </button>
            </div>

            <div className="flex gap-8 items-start">

              <div className="flex-1 flex flex-col gap-2 min-w-0">
                {items.map((it, idx) => (
                  <div
                    key={idx}
                    className={[
                      "group relative flex items-center gap-5 px-6 py-5",
                      "bg-[#0e1318] border border-white/[0.06] rounded-xl",
                      "hover:border-[rgba(0,234,255,0.18)] transition-all duration-200",
                      removingIdx === idx
                        ? "opacity-0 translate-x-4 duration-300"
                        : "opacity-100 translate-x-0",
                    ].join(" ")}
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl bg-gradient-to-b from-[#00eaff] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    <img
                      src={it.image}
                      alt={it.title}
                      className="w-20 h-20 object-cover rounded-lg shrink-0 bg-[#131a22]"
                    />

                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-[15px] tracking-tight truncate m-0 mb-1">{it.title}</h3>
                      <p className="font-mono text-[11px] text-[#5a6a7a] m-0 mb-3">by {it.seller}</p>
                      <span className="inline-flex items-center gap-2 bg-[#131a22] border border-white/[0.06] rounded px-3 py-1 font-mono text-xs text-[#5a6a7a]">
                        qty <strong className="text-[#e8edf2] font-medium">{it.qty}</strong>
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono text-xs text-[#00eaff] font-light mt-1">
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

              <div className="w-72 shrink-0 relative bg-[#0e1318] border border-[rgba(0,234,255,0.18)] rounded-2xl p-7 sticky top-28 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00eaff] to-transparent" />

                <h2 className="font-bold text-xs uppercase tracking-widest text-[#5a6a7a] mb-5 m-0">Order Summary</h2>

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

                <button className="relative w-full mt-6 py-4 bg-[#00eaff] text-black font-extrabold text-sm uppercase tracking-widest rounded-xl overflow-hidden hover:opacity-85 active:scale-[0.98] transition-all">
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