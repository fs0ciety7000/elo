// ============================================================
// Page de Connexion — Antigravity Medical SaaS
// Design SaaS premium avec validation Zod + React Hook Form
// ============================================================

"use client";

import { Suspense, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Activity, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { loginUser } from "@/lib/actions/auth";

// ── Schéma de validation ─────────────────────────────────────
const LoginSchema = z.object({
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

type LoginFormData = z.infer<typeof LoginSchema>;

// ── Composant interne (useSearchParams requiert Suspense) ────
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema),
  });

  // ── Soumission du formulaire ─────────────────────────────
  const onSubmit = (data: LoginFormData) => {
    setServerError(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.append("email", data.email);
      formData.append("password", data.password);

      const result = await loginUser(formData);

      if (result.success) {
        router.push(callbackUrl);
        router.refresh();
      } else {
        setServerError(result.message);
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-medical-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* ── Logo ── */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl gradient-medical flex items-center justify-center shadow-lg shadow-medical-200">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-zinc-900">
              Antigravity<span className="text-medical-600"> Medical</span>
            </span>
          </Link>
        </div>

        {/* ── Card de connexion ── */}
        <div className="bg-white rounded-2xl shadow-xl shadow-zinc-100 border border-zinc-100 p-8">
          <div className="mb-6">
            <h1 className="font-display text-2xl font-bold text-zinc-900">
              Bon retour 👋
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              Connectez-vous à votre espace médical sécurisé
            </p>
          </div>

          {/* ── Message d'erreur serveur ── */}
          {serverError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500 flex-shrink-0" />
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* ── Champ Email ── */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                Adresse email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  {...register("email")}
                  type="email"
                  placeholder="vous@exemple.com"
                  autoComplete="email"
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border text-sm outline-none transition-all
                    focus:ring-2 focus:ring-medical-500 focus:border-medical-500
                    ${errors.email ? "border-red-300 bg-red-50" : "border-zinc-200 bg-zinc-50 hover:border-zinc-300"}`}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* ── Champ Mot de passe ── */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={`w-full pl-10 pr-10 py-3 rounded-lg border text-sm outline-none transition-all
                    focus:ring-2 focus:ring-medical-500 focus:border-medical-500
                    ${errors.password ? "border-red-300 bg-red-50" : "border-zinc-200 bg-zinc-50 hover:border-zinc-300"}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* ── Lien mot de passe oublié ── */}
            <div className="flex justify-end -mt-1">
              <Link
                href="/forgot-password"
                className="text-xs text-medical-600 hover:text-medical-700 hover:underline transition-colors"
              >
                Mot de passe oublié ?
              </Link>
            </div>

            {/* ── Bouton de connexion ── */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-medical-600 hover:bg-medical-700 disabled:bg-medical-400 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2 mt-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                "Se connecter"
              )}
            </button>
          </form>

          {/* ── Séparateur ── */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-100" />
            </div>
            <div className="relative flex justify-center text-xs text-zinc-400 bg-white px-2">
              Pas encore de compte ?
            </div>
          </div>

          {/* ── Lien vers inscription ── */}
          <Link
            href="/register"
            className="w-full flex items-center justify-center gap-2 border border-zinc-200 text-zinc-700 font-medium py-3 rounded-lg hover:bg-zinc-50 transition-all text-sm"
          >
            Créer un compte
          </Link>
        </div>

        {/* ── Mention sécurité ── */}
        <p className="text-center text-xs text-zinc-400 mt-6">
          🔒 Connexion chiffrée · Données protégées · Conforme RGPD
        </p>
      </div>
    </div>
  );
}

// ── Page exportée (Suspense requis pour useSearchParams) ─────
export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
