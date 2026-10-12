import type { Metadata } from "next";
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
      <body className="antialiased">{children}</body>
    </html>
  );
}
