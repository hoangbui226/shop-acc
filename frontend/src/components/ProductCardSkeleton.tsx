import React from "react";

export default function ProductCardSkeleton() {
  return (
    <div className="animate-pulse rounded-[20px] bg-[#0a1020] border border-white/[0.07] overflow-hidden h-64 w-full flex flex-col">
      <div className="bg-gray-700 h-32 w-full mb-4" />
      <div className="px-4">
        <div className="h-6 bg-gray-600 rounded w-3/4 mb-2" />
        <div className="h-4 bg-gray-600 rounded w-1/2 mb-2" />
        <div className="h-4 bg-gray-600 rounded w-1/3 mb-2" />
        <div className="h-8 bg-gray-700 rounded w-1/2 mt-4" />
      </div>
    </div>
  );
}
