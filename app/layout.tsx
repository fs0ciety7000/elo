// ============================================================
// Layout racine — Antigravity Medical SaaS
// Applique les polices, métadonnées et la structure HTML de base
// ============================================================

import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";

// ── Polices Google Fonts ─────────────────────────────────────
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

// ── Métadonnées SEO ──────────────────────────────────────────
export const metadata: Metadata = {
  title: {
    default: "Antigravity Medical | Prescriptions numériques",
    template: "%s | Antigravity Medical",
  },
  description:
    "Plateforme SaaS de digitalisation des prescriptions médicales et examens radiologiques. Sécurisée, rapide, conforme RGPD.",
  keywords: ["médical", "prescription", "radiologie", "OCR", "ordonnance numérique"],
  authors: [{ name: "Antigravity Medical" }],
  creator: "Antigravity Medical SaaS",
  robots: {
    index: false,
    follow: false,
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#1d4ed8",
  width: "device-width",
  initialScale: 1,
};

// ── Layout principal ─────────────────────────────────────────
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${inter.variable} ${outfit.variable}`}>
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Antigravity" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
