"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";

export default function HeaderWrapper() {
  const pathname = usePathname();

  // Routes where header should NOT appear
  const hiddenRoutes = ["/login", "/register"];

  if (hiddenRoutes.includes(pathname)) {
    return null;
  }

  return <Header />;
}
