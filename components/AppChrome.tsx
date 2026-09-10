"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";
import CompareTray from "./CompareTray";

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const path = usePathname() || "";
  const bare = path.startsWith("/os") || path.startsWith("/portal");
  if (bare) return <>{children}</>;
  return (
    <>
      <Header />
      {children}
      <Footer />
      <CompareTray />
    </>
  );
}
