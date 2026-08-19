import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SettingsRuntime } from "@/components/settings/SettingsRuntime";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ShotOptix | Shot Optimization Engine",
  description:
    "AI-powered Expected Points Per Shot engine for smarter basketball scoring decisions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full scroll-smooth`}>
      <body className="min-h-full bg-background text-foreground antialiased">
        <SettingsRuntime />
        {children}
      </body>
    </html>
  );
}
