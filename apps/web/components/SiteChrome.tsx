"use client";

import { usePathname } from "next/navigation";
import { AnnouncementBar, type AnnouncementBarContent } from "@/components/AnnouncementBar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export function SiteChrome({
  children,
  announcement,
}: {
  children: React.ReactNode;
  announcement?: AnnouncementBarContent | null;
}) {
  usePathname();

  return (
    <>
      <AnnouncementBar content={announcement} />
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}
