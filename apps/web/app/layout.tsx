import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SiteChrome } from "@/components/SiteChrome";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "TechBubble - AI-Driven Digital Transformation",
  description: "AI-driven digital transformation across Asia Pacific and North America. Top 1% tech talent, deployed fast.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} antialiased`}>
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
