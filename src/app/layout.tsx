import type { Metadata } from "next";
import { Geist, Geist_Mono, IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import { ThemeProvider } from "@/components/ThemeProvider";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const arabicSans = IBM_Plex_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Nusq — MENA financial intelligence",
  description: "Daily briefings and analysis on Gulf and MENA markets, deals, and macro.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${arabicSans.variable} h-full`}
    >
      <body className="min-h-full flex flex-col font-sans" style={{ backgroundColor: "var(--c-bg)" }}>
        <ThemeProvider>
          <Header />
          <main className="flex-1 page-enter page-content">{children}</main>
          <div className="hidden md:block">
            <Footer />
          </div>
          <BottomNav />
        </ThemeProvider>
      </body>
    </html>
  );
}
