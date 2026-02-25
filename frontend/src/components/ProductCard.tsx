"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, Eye, ShoppingBasket, ArrowRight, Plus } from "lucide-react";
import { useCart } from "@/lib/cart";

interface ProductCardProps {
  title: string;
  seller: string;
  image: string;
  tags: string[];
  price: string;
  usdPrice: string;
  link: string;
}

export default function ProductCard({
  title,
  seller,
  image,
  tags,
  price,
  usdPrice,
  link,
}: ProductCardProps) {
  const { addItem } = useCart();

  return (
    <div className="group relative rounded-[20px] bg-[#0a1020] border border-white/[0.07] overflow-hidden transition-all duration-[400ms] ease-out hover:-translate-y-1.5 hover:border-[#00f5ff]/30 hover:shadow-[0_24px_60px_rgba(0,0,0,0.6),0_0_40px_rgba(0,245,255,0.06),inset_0_1px_0_rgba(0,245,255,0.12)]">

      <div className="pointer-events-none absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-[#00f5ff] rounded-tl-[20px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />
      <div className="pointer-events-none absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-violet-500 rounded-br-[20px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />

      <div className="relative aspect-video overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 z-[3] opacity-40"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.08) 2px,rgba(0,0,0,0.08) 4px)",
          }}
        />
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-3/5 bg-gradient-to-t from-[#0a1020] to-transparent z-[4]" />

  

        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 border border-green-500/40 backdrop-blur-md">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_6px_#22c55e] animate-pulse" />
          <span className="font-mono text-[10px] font-bold tracking-[0.15em] uppercase text-white">
            In Stock
          </span>
        </div>

        <button
          aria-label="Add to wishlist"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-[10px] bg-black/50 border border-white/10 backdrop-blur-md text-slate-500 hover:text-[#f500a0] hover:border-[#f500a0]/60 hover:bg-[#f500a0]/10 transition-all duration-200"
        >
          <Heart className="w-3.5 h-3.5" />
        </button>

        <div className="absolute inset-0 z-[6] flex items-center justify-center bg-[#04070f]/70 backdrop-blur-[3px] opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-300">
          <Link
            href={link}
            className="flex items-center gap-2 px-5 py-2.5 rounded-[10px] bg-[#00f5ff]/10 border border-[#00f5ff] text-[#00f5ff] font-['Rajdhani',sans-serif] font-bold text-sm tracking-[0.1em] uppercase translate-y-2 group-hover:translate-y-0 hover:bg-[#00f5ff] hover:text-black transition-all duration-300"
          >
            <Eye className="w-3.5 h-3.5" />
            Quick View
          </Link>
        </div>
      </div>
      <div className="flex flex-col gap-2.5 p-5">
        <h3 className="font-['Rajdhani',sans-serif] font-bold text-lg tracking-wide uppercase text-white/90 truncate group-hover:text-[#00f5ff] transition-colors duration-300">
          {title}
        </h3>

        <p className="font-mono text-[11px] tracking-[0.15em] uppercase text-slate-500">
          // {seller}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag, i) => (
            <span
              key={i}
              className="px-2 py-0.5 font-mono text-[10px] tracking-[0.08em] text-white/35 border border-white/[0.07] rounded-[5px] bg-white/[0.02] hover:border-[#00f5ff]/40 hover:text-[#00f5ff] transition-all duration-200 cursor-default"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Price row */}
        <div className="flex items-end justify-between gap-3 pt-3 mt-1 border-t border-white/[0.05]">
          <div className="flex flex-col gap-0.5">
            <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-slate-600">
              Starting from
            </span>
            <span className="font-['Rajdhani',sans-serif] font-bold text-2xl text-white leading-none">
              ৳{price}
            </span>
            <span className="font-mono text-[10px] text-slate-600">BDT</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#00f5ff]/[0.06] border border-[#00f5ff]/15 rounded-[8px]">
              <Plus className="w-2.5 h-2.5 text-[#00f5ff]" />
              <span className="font-mono text-[10px] font-bold text-[#00f5ff]">
                {usdPrice} USDT
              </span>
            </div>

            <button
              aria-label={`Add ${title} to cart`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                addItem({ title, seller, image, tags, price, usdPrice, link });
              }}
              className="px-3.5 py-1.5 bg-[#00f5ff] text-black font-['Rajdhani',sans-serif] font-bold text-sm tracking-[0.08em] uppercase rounded-[8px] shadow-[0_0_16px_rgba(0,245,255,0.25)] hover:shadow-[0_0_28px_rgba(0,245,255,0.45)] hover:scale-105 transition-all duration-200"
            >
              Add
            </button>
          </div>
        </div>

        <Link
          href={link}
          onClick={(e) => e.stopPropagation()}
          className="group/btn flex items-center justify-center gap-2 w-full py-2.5 mt-1 rounded-[10px] border border-white/[0.07] text-slate-500 font-['Rajdhani',sans-serif] font-semibold text-sm tracking-[0.1em] uppercase hover:border-violet-500 hover:text-white hover:bg-violet-500/10 hover:shadow-[0_0_20px_rgba(124,58,237,0.15)] transition-all duration-300"
        >
          View Details
          <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover/btn:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}