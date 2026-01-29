// app/layout.jsx (Server Component - NO "use client")

import React from "react";
import { Noto_Kufi_Arabic } from "next/font/google";
import "./globals.css";
import ClientProviders from "@/components/ClientProviders";
import HeaderWrapper from "@/components/HeaderWrapper";

const notoKufi = Noto_Kufi_Arabic({
  subsets: ["arabic"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-noto-kufi",
  display: "swap",
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={notoKufi.variable}>
      <head>
        <title>Home Database</title>
      </head>
      <body
        style={{
          fontFamily: "var(--font-noto-kufi), sans-serif",
        }}
      >
        {/* ClientProviders still handles Redux + initAuth */}
        <ClientProviders>
          {/* Header now conditionally renders based on route */}
          <HeaderWrapper />
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
