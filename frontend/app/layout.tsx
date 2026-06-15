import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Load Inter through Next font optimization and expose it as a CSS variable.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Root metadata appears in browser tabs and search/social previews.
  title: "ShotOptix | Shot Optimization Engine",
  description:
    "AI-powered Expected Points Per Shot engine for smarter basketball scoring decisions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Root layout is required by the App Router and wraps every route.
  return (
    <html lang="en" className={`${inter.variable} h-full scroll-smooth`}>
      <body className="min-h-full bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
