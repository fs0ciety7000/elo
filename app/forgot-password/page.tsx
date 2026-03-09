// ============================================================
// Page Mot de passe oublié — Antigravity Medical SaaS
// ============================================================

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Activity, Mail, Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { forgotPassword } from "@/lib/actions/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("email", email);
      const result = await forgotPassword(fd);
      setMessage({ type: result.success ? "success" : "error", text: result.message });
    });
  }

  const inputCls =
    "w-full pl-10 pr-4 py-3 rounded-lg border text-sm outline-none transition-all " +
    "focus:ring-2 focus:ring-medical-500 focus:border-medical-500 " +
    "border-zinc-200 bg-zinc-50 hover:border-zinc-300 " +
    "dark:border-zinc-600 dark:bg-zinc-700/50 dark:text-zinc-100 dark:placeholder-zinc-400 " +
    "dark:focus:border-medical-500";

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-medical-50 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* ── Logo ── */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl gradient-medical flex items-center justify-center shadow-lg shadow-medical-200">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-zinc-900 dark:text-zinc-100">
              Antigravity<span className="text-medical-600"> Medical</span>
            </span>
          </Link>
        </div>

        {/* ── Card ── */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl shadow-zinc-100 dark:shadow-zinc-900/50 border border-zinc-100 dark:border-zinc-700 p-8">
          <div className="mb-6">
            <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Mot de passe oublié
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
              Entrez votre adresse email pour recevoir un lien de réinitialisation.
            </p>
          </div>

          {/* ── Message de retour ── */}
          {message && (
            <div
              className={`mb-5 p-4 rounded-xl border text-sm flex items-start gap-3 ${
                message.type === "success"
                  ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300"
                  : "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
              }`}
            >
              {message.type === "success" && <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
              {message.text}
            </div>
          )}

          {/* ── Formulaire (masqué après succès) ── */}
          {message?.type !== "success" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Adresse email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@exemple.com"
                    autoComplete="email"
                    className={inputCls}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-medical-600 hover:bg-medical-700 disabled:bg-medical-400 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2 mt-2"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Envoi en cours…
                  </>
                ) : (
                  "Envoyer le lien de réinitialisation"
                )}
              </button>
            </form>
          )}

          {/* ── Retour connexion ── */}
          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400 hover:text-medical-600 dark:hover:text-medical-400 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Retour à la connexion
            </Link>
          </div>
        </div>

        {/* ── Mention sécurité ── */}
        <p className="text-center text-xs text-zinc-400 mt-6">
          Connexion chiffrée · Données protégées · Conforme RGPD
        </p>
      </div>
    </div>
  );
}
