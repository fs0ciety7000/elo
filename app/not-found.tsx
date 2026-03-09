// ============================================================
// Page 404 — Antigravity Medical SaaS
// ============================================================

import Link from "next/link";
import { Activity, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl gradient-medical flex items-center justify-center mx-auto mb-6">
          <Activity className="w-8 h-8 text-white" />
        </div>
        <h1 className="font-display text-6xl font-bold text-zinc-200 mb-4">404</h1>
        <h2 className="font-display text-xl font-bold text-zinc-900 mb-2">
          Page introuvable
        </h2>
        <p className="text-zinc-500 text-sm mb-8">
          La page que vous recherchez n&apos;existe pas ou a été déplacée.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 bg-medical-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-medical-700 transition-all"
        >
          <Home className="w-4 h-4" />
          Retour au tableau de bord
        </Link>
      </div>
    </div>
  );
}
