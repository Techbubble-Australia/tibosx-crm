import type { Metadata } from "next";
import { DevelopmentModeBanner } from "@/components/DevelopmentModeBanner";
import "./globals.css";

export const metadata: Metadata = {
  title: "TIBOSX.AI",
  description: "AI-powered Business Operating System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <DevelopmentModeBanner />
        {children}
      </body>
    </html>
  );
}
