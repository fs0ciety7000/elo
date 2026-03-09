// ============================================================
// Page d'Inscription — Antigravity Medical SaaS
// Design SaaS premium avec sélection de rôle (Patient / Médecin)
// ============================================================

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Activity,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  User,
  Stethoscope,
  Users,
  CheckCircle,
} from "lucide-react";
import { registerUser } from "@/lib/actions/auth";

// ── Schéma de validation ─────────────────────────────────────
const RegisterSchema = z
  .object({
    firstName: z.string().min(2, "Minimum 2 caractères"),
    lastName: z.string().min(2, "Minimum 2 caractères"),
    email: z.string().email("Email invalide"),
    password: z
      .string()
      .min(8, "Minimum 8 caractères")
      .regex(/[A-Z]/, "Au moins une majuscule requise")
      .regex(/[0-9]/, "Au moins un chiffre requis"),
    confirmPassword: z.string(),
    role: z.enum(["PATIENT", "DOCTOR"]),
    speciality: z.string().optional(),
    inami: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof RegisterSchema>;

// ── Types de rôle ─────────────────────────────────────────────
const ROLES = [
  {
    value: "PATIENT" as const,
    label: "Patient",
    description: "Je souhaite numériser mes ordonnances",
    icon: Users,
    color: "medical",
  },
  {
    value: "DOCTOR" as const,
    label: "Prestataire médical",
    description: "Je prescris des examens à mes patients",
    icon: Stethoscope,
    color: "zinc",
  },
];

// ── Composant principal ──────────────────────────────────────
export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { role: "PATIENT" },
  });

  const selectedRole = watch("role");
  const password = watch("password");

  // ── Indicateur de force du mot de passe ─────────────────
  const passwordStrength = {
    hasLength: password?.length >= 8,
    hasUpper: /[A-Z]/.test(password ?? ""),
    hasNumber: /[0-9]/.test(password ?? ""),
  };
  const strengthCount = Object.values(passwordStrength).filter(Boolean).length;

  // ── Soumission du formulaire ─────────────────────────────
  const onSubmit = (data: RegisterFormData) => {
    setServerError(null);

    startTransition(async () => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) formData.append(key, String(value));
      });

      const result = await registerUser(formData);

      if (result.success) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setServerError(result.message);
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-medical-50 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-lg">
        {/* ── Logo ── */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-medical flex items-center justify-center shadow-lg shadow-medical-200">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-zinc-900">
              Antigravity<span className="text-medical-600"> Medical</span>
            </span>
          </Link>
        </div>

        {/* ── Card d'inscription ── */}
        <div className="bg-white rounded-2xl shadow-xl shadow-zinc-100 border border-zinc-100 p-8">
          <div className="mb-6">
            <h1 className="font-display text-2xl font-bold text-zinc-900">
              Créer un compte
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              Rejoignez la plateforme de prescription numérique
            </p>
          </div>

          {/* ── Message d'erreur ── */}
          {serverError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* ── Sélection du rôle ── */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Je suis…
              </label>
              <div className="grid grid-cols-2 gap-3">
                {ROLES.map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => setValue("role", role.value)}
                    className={`relative p-4 rounded-xl border-2 text-left transition-all
                      ${
                        selectedRole === role.value
                          ? role.color === "medical"
                            ? "border-medical-500 bg-medical-50"
                            : "border-zinc-700 bg-zinc-50"
                          : "border-zinc-200 hover:border-zinc-300"
                      }`}
                  >
                    <role.icon
                      className={`w-5 h-5 mb-2 ${
                        selectedRole === role.value
                          ? role.color === "medical"
                            ? "text-medical-600"
                            : "text-zinc-800"
                          : "text-zinc-400"
                      }`}
                    />
                    <div className="font-semibold text-sm text-zinc-900">
                      {role.label}
                    </div>
                    <div className="text-xs text-zinc-500 mt-0.5">
                      {role.description}
                    </div>
                    {selectedRole === role.value && (
                      <CheckCircle className="absolute top-3 right-3 w-4 h-4 text-medical-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Prénom / Nom ── */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Prénom
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    {...register("firstName")}
                    type="text"
                    placeholder="Marie"
                    className={`w-full pl-9 pr-3 py-2.5 rounded-lg border text-sm outline-none transition-all
                      focus:ring-2 focus:ring-medical-500 focus:border-medical-500
                      ${errors.firstName ? "border-red-300 bg-red-50" : "border-zinc-200 bg-zinc-50"}`}
                  />
                </div>
                {errors.firstName && (
                  <p className="mt-1 text-xs text-red-600">{errors.firstName.message}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Nom
                </label>
                <input
                  {...register("lastName")}
                  type="text"
                  placeholder="Dupont"
                  className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-all
                    focus:ring-2 focus:ring-medical-500 focus:border-medical-500
                    ${errors.lastName ? "border-red-300 bg-red-50" : "border-zinc-200 bg-zinc-50"}`}
                />
                {errors.lastName && (
                  <p className="mt-1 text-xs text-red-600">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            {/* ── Email ── */}
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                Adresse email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  {...register("email")}
                  type="email"
                  placeholder="vous@exemple.com"
                  className={`w-full pl-9 pr-3 py-2.5 rounded-lg border text-sm outline-none transition-all
                    focus:ring-2 focus:ring-medical-500 focus:border-medical-500
                    ${errors.email ? "border-red-300 bg-red-50" : "border-zinc-200 bg-zinc-50"}`}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* ── Champs spécifiques aux médecins ── */}
            {selectedRole === "DOCTOR" && (
              <div className="grid grid-cols-2 gap-3 p-4 bg-zinc-50 rounded-xl border border-zinc-200">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                    Spécialité
                  </label>
                  <input
                    {...register("speciality")}
                    type="text"
                    placeholder="Médecine générale"
                    className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 bg-white text-sm outline-none focus:ring-2 focus:ring-medical-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                    N° INAMI
                  </label>
                  <input
                    {...register("inami")}
                    type="text"
                    placeholder="1-23456-78-901"
                    className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 bg-white text-sm outline-none focus:ring-2 focus:ring-medical-500"
                  />
                </div>
              </div>
            )}

            {/* ── Mot de passe ── */}
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={`w-full pl-9 pr-10 py-2.5 rounded-lg border text-sm outline-none transition-all
                    focus:ring-2 focus:ring-medical-500 focus:border-medical-500
                    ${errors.password ? "border-red-300 bg-red-50" : "border-zinc-200 bg-zinc-50"}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Indicateur de force */}
              {password && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          strengthCount >= i
                            ? strengthCount === 1
                              ? "bg-red-400"
                              : strengthCount === 2
                              ? "bg-amber-400"
                              : "bg-green-400"
                            : "bg-zinc-200"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex gap-3 text-xs text-zinc-500">
                    <span className={passwordStrength.hasLength ? "text-green-600" : ""}>
                      ✓ 8 caractères
                    </span>
                    <span className={passwordStrength.hasUpper ? "text-green-600" : ""}>
                      ✓ Majuscule
                    </span>
                    <span className={passwordStrength.hasNumber ? "text-green-600" : ""}>
                      ✓ Chiffre
                    </span>
                  </div>
                </div>
              )}
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* ── Confirmation mot de passe ── */}
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  {...register("confirmPassword")}
                  type="password"
                  placeholder="••••••••"
                  className={`w-full pl-9 pr-3 py-2.5 rounded-lg border text-sm outline-none transition-all
                    focus:ring-2 focus:ring-medical-500 focus:border-medical-500
                    ${errors.confirmPassword ? "border-red-300 bg-red-50" : "border-zinc-200 bg-zinc-50"}`}
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* ── Bouton inscription ── */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-medical-600 hover:bg-medical-700 disabled:bg-medical-400 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2 mt-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Création du compte...
                </>
              ) : (
                "Créer mon compte"
              )}
            </button>
          </form>

          {/* ── Lien connexion ── */}
          <p className="text-center text-sm text-zinc-500 mt-6">
            Déjà un compte ?{" "}
            <Link href="/login" className="text-medical-600 font-medium hover:underline">
              Se connecter
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-zinc-400 mt-6">
          En créant un compte, vous acceptez notre politique de confidentialité RGPD.
        </p>
      </div>
    </div>
  );
}
