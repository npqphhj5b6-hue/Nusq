import type { Metadata } from "next";
import { Geist, DM_Serif_Display, IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const dmSerif = DM_Serif_Display({
  variable: "--font-dm-serif",
  subsets: ["latin"],
  weight: "400",
});

const arabicSans = IBM_Plex_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["700"],
});

export const metadata: Metadata = {
  title: "Nusq — MENA financial intelligence",
  description:
    "Daily briefings and analysis on Gulf and MENA markets, deals, and macro.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${dmSerif.variable} ${arabicSans.variable} h-full`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <Header />
        <main className="flex-1 page-enter">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
