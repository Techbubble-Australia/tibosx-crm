import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { Figtree, Fira_Sans, Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { SiteChrome } from "@/components/SiteChrome";
import { fetchSiteContentPayload } from "@/lib/fetch-site-content";
import type { AnnouncementBarContent } from "@/components/AnnouncementBar";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  weight: ["700"],
  variable: "--font-space-grotesk",
});

const figtree = Figtree({
  subsets: ["latin"],
  display: "swap",
  weight: ["400"],
  variable: "--font-figtree",
});

const firaSans = Fira_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500"],
  variable: "--font-fira-sans",
});

export const metadata: Metadata = {
  title: "TechBubble - AI-Driven Digital Transformation",
  description: "AI-driven digital transformation across Asia Pacific and North America. Top 1% tech talent, deployed fast.",
};

function isAnnouncementPayload(v: unknown): v is AnnouncementBarContent {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.badge === "string" &&
    typeof o.message === "string" &&
    typeof o.linkText === "string" &&
    typeof o.linkHref === "string"
  );
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const raw = await fetchSiteContentPayload<unknown>("announcement_bar");
  const announcement = isAnnouncementPayload(raw) ? raw : null;

  return (
    <html
      lang="en"
      className={`${inter.variable} ${GeistSans.variable} ${spaceGrotesk.variable} ${figtree.variable} ${firaSans.variable}`}
    >
      <body className={`${inter.className} antialiased`}>
        <SiteChrome announcement={announcement}>{children}</SiteChrome>
      </body>
    </html>
  );
}
