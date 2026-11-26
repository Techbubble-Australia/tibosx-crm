import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Debug tickets | TechBubble",
  description: "Review debug capture tickets from TBOS",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
