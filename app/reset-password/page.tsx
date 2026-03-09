// ============================================================
// Page Réinitialisation du mot de passe — Antigravity Medical SaaS
// Lit le token depuis ?token=xxx dans les searchParams
// ============================================================

"use client";

import { useState, useTransition, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Activity, Lock, Eye, EyeOff, Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { resetPassword } from "@/lib/actions/auth";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (password !== confirm) {
      setMessage({ type: "error", text: "Les mots de passe ne correspondent pas." });
      return;
    }

    startTransition(async () => {
      const fd = new FormData();
      fd.append("token", token);
      fd.append("password", password);
      const result = await resetPassword(fd);
      setMessage({ type: result.success ? "success" : "error", text: result.message });
      if (result.success) {
        setTimeout(() => router.push("/login"), 2500);
      }
    });
  }

  const inputCls =
    "w-full pl-10 pr-10 py-3 rounded-lg border text-sm outline-none transition-all " +
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
              Nouveau mot de passe
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
              Choisissez un mot de passe sécurisé d&apos;au moins 8 caractères.
            </p>
          </div>

          {/* ── Token absent ── */}
          {!token && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400 mb-5">
              Lien invalide ou expiré. Veuillez effectuer une nouvelle demande.
            </div>
          )}

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
              <span>
                {message.text}
                {message.type === "success" && (
                  <span className="block text-xs mt-1 opacity-75">Redirection vers la connexion…</span>
                )}
              </span>
            </div>
          )}

          {/* ── Formulaire (masqué si token absent ou après succès) ── */}
          {token && message?.type !== "success" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nouveau mot de passe */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type={showPwd ? "text" : "password"}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 caractères"
                    autoComplete="new-password"
                    className={inputCls}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirmation */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type={showConfirm ? "text" : "password"}
                    required
                    minLength={8}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Répétez le mot de passe"
                    autoComplete="new-password"
                    className={inputCls}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
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
                    Réinitialisation…
                  </>
                ) : (
                  "Réinitialiser mon mot de passe"
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

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
