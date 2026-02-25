import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { CartProvider } from "@/lib/cart";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.className} bg-[#0a0d18] text-white min-h-screen antialiased overflow-x-hidden`}
      >
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
