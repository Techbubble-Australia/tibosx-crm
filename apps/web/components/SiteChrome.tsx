"use client";

import { usePathname } from "next/navigation";
import { AnnouncementBar, type AnnouncementBarContent } from "@/components/AnnouncementBar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import type { SiteFooterPayload } from "@/lib/site-content/resolve-pages";

export function SiteChrome({
  children,
  announcement,
  footer,
}: {
  children: React.ReactNode;
  announcement?: AnnouncementBarContent | null;
  footer: SiteFooterPayload;
}) {
  usePathname();

  return (
    <>
      <AnnouncementBar content={announcement} />
      <Header />
      <main>{children}</main>
      <Footer data={footer} />
    </>
  );
}
