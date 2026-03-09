// ============================================================
// Layout racine — Antigravity Medical SaaS
// Applique les polices, métadonnées et la structure HTML de base
// ============================================================

import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

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
    index: false, // Indexation désactivée pour une app médicale privée
    follow: false,
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
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
