"use client";

import React, { createContext, useContext, useState } from "react";

export type CartItem = {
  title: string;
  seller: string;
  image: string;
  tags?: string[];
  price: string;
  usdPrice: string;
  link: string;
  qty: number;
};

type CartContextType = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "qty">) => void;
  removeItem: (index: number) => void;
  clear: () => void;
  totalItems: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  function addItem(item: Omit<CartItem, "qty">) {
    setItems((prev) => {
      const found = prev.find((p) => p.link === item.link && p.price === item.price);
      if (found) {
        return prev.map((p) =>
          p.link === item.link && p.price === item.price ? { ...p, qty: p.qty + 1 } : p
        );
      }
      return [...prev, { ...item, qty: 1 }];
    });
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function clear() {
    setItems([]);
  }

  const totalItems = items.reduce((s, it) => s + it.qty, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clear, totalItems }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
