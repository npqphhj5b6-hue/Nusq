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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nusq.vercel.app";

export const metadata: Metadata = {
  title: {
    default: "Nusq — MENA markets, explained.",
    template: "%s — Nusq",
  },
  description: "Daily Isharas and briefings on Gulf and MENA markets. Plain language. No finance degree needed.",
  metadataBase: new URL(SITE_URL),
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    siteName: "Nusq",
    type: "website",
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    site: "@nusqapp",
  },
  themeColor: [
    { media: "(prefers-color-scheme: dark)",  color: "#030C09" },
    { media: "(prefers-color-scheme: light)", color: "#F2FAF8" },
  ],
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
