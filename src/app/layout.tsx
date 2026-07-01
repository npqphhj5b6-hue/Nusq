import type { Metadata } from "next";
import { Bricolage_Grotesque, Karla, IBM_Plex_Mono, IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";

const displayFont = Bricolage_Grotesque({ variable: "--font-display-raw", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
const bodyFont = Karla({ variable: "--font-body-raw", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const monoFont = IBM_Plex_Mono({ variable: "--font-mono-raw", subsets: ["latin"], weight: ["400", "500"] });
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
    { media: "(prefers-color-scheme: dark)",  color: "oklch(17% 0.014 250)" },
    { media: "(prefers-color-scheme: light)", color: "oklch(98% 0.004 250)" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} ${arabicSans.variable} h-full`}
    >
      <body className="min-h-full flex flex-col font-sans" style={{ backgroundColor: "var(--c-bg)" }}>
        <ThemeProvider>
          <Header />
          <main className="flex-1 page-enter">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
