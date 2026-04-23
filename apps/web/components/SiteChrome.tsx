"use client";

import { usePathname } from "next/navigation";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  usePathname();

  return (
    <>
      <AnnouncementBar />
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}
