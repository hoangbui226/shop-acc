"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
const Navigation = dynamic(() => import("@/components/Navigation"), { ssr: false });
import { useCart } from "@/lib/cart";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const { items, removeItem, clear, totalItems } = useCart();
  const [removingIdx, setRemovingIdx] = useState<number | null>(null);
  const router = useRouter();

  const handleRemove = (idx: number) => {
    setRemovingIdx(idx);
    setTimeout(() => {
      removeItem(idx);
      setRemovingIdx(null);
    }, 300);
  };

  const totalINR = items.reduce((sum, it) => sum + it.price * it.qty, 0);
  const totalUSDT = items.reduce((sum, it) => {
    const usdNum = parseFloat(String(it.usdPrice).replace(/[^0-9.]/g, ""));
    return sum + (isNaN(usdNum) ? 0 : usdNum * it.qty);
  }, 0);

  return (
    <>
      <div className="cart-root">
        <div className="cart-bg" />
        <Navigation />

        <main className="cart-main">
          {items.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 01-8 0"/>
                </svg>
              </div>
              <h2 className="empty-title">Your cart is empty</h2>
              <p className="empty-sub">Add items to get started</p>
              <button className="shop-link" onClick={() => router.push("/")}>Browse marketplace
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            </div>
          ) : (
            // ...existing code...
            <>{/* Cart items and summary remain unchanged */}</>
          )}
        </main>
      </div>
    </>
  );
}
              </div>

              <div className="cart-items">
                {items.map((it, idx) => (
                  <div
                    key={idx}
                    className={`cart-item${removingIdx === idx ? " removing" : ""}`}
                  >
                    <img src={it.image} alt={it.title} className="item-img" />

                    <div className="item-info">
                      <h3 className="item-title">{it.title}</h3>
                      <p className="item-seller">by {it.seller}</p>
                      <div className="item-qty">
                        qty&nbsp;<strong>{it.qty}</strong>
                      </div>
                    </div>

                    <div className="item-actions">
                      <div>
                        <div className="item-price-inr">₹{(it.price * it.qty).toLocaleString("en-IN")}</div>
                        <div className="item-price-usdt">{it.usdPrice} USDT</div>
                      </div>
                      <button className="remove-btn" onClick={() => handleRemove(idx)}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="cart-summary">
                <div className="summary-row">
                  <span className="summary-label">Items</span>
                  <span className="summary-value">{totalItems}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Total (USDT)</span>
                  <span className="summary-value highlight">{totalUSDT.toFixed(2)} USDT</span>
                </div>
                <div className="summary-total">
                  <span className="summary-total-label">Total</span>
                  <span className="summary-total-value">₹{totalINR.toLocaleString("en-IN")}</span>
                </div>
                <button className="checkout-btn">
                  Proceed to Checkout →
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </>
  );
}