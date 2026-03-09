// ============================================================
// Page Profil — sous layout Dashboard
// ============================================================

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate, ROLE_LABELS } from "@/lib/utils";
import { logoutUser, updateProfile } from "@/lib/actions/auth";
import { Role } from "@prisma/client";
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  Stethoscope,
  Calendar,
  FileText,
  Activity,
  LogOut,
} from "lucide-react";
import { ProfileEditForm } from "@/components/profile/ProfileEditForm";

// ── Composant Champ de profil ────────────────────────────────
function ProfileField({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex items-start gap-3 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl">
      <div className="w-9 h-9 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-zinc-500" />
      </div>
      <div>
        <div className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
          {label}
        </div>
        <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mt-0.5">
          {value ?? "—"}
        </div>
      </div>
    </div>
  );
}

// ── Page principale ──────────────────────────────────────────
export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    include: {
      _count: {
        select: {
          prescriptionsAsPatient: true,
          prescriptionsAsDoctor: true,
        },
      },
    },
  });

  if (!user) redirect("/login");

  const isDoctor = user.role === Role.DOCTOR || user.role === Role.ADMIN;
  const isAdmin = user.role === Role.ADMIN;

  return (
    <div className="p-8 max-w-4xl">
      {/* ── En-tête ── */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-100">Mon profil</h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
          Vos informations personnelles et paramètres de compte
        </p>
      </div>

      {/* ── Card avatar + rôle ── */}
      <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 shadow-sm dark:shadow-zinc-900/50 mb-6 overflow-hidden">
        <div className="h-24 gradient-medical" />
        <div className="px-8 pb-8 -mt-12">
          <div className="w-20 h-20 rounded-2xl bg-white dark:bg-zinc-700 border-4 border-white dark:border-zinc-700 shadow-lg flex items-center justify-center mb-4">
            <div className="w-full h-full rounded-xl gradient-medical flex items-center justify-center">
              <span className="font-display text-2xl font-bold text-white">
                {user.firstName[0]}{user.lastName[0]}
              </span>
            </div>
          </div>

          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-display text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm">{user.email}</p>

              <div className="flex items-center gap-2 mt-3">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${
                    isAdmin
                      ? "bg-purple-50 text-purple-700 border-purple-200"
                      : isDoctor
                      ? "bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-600"
                      : "bg-medical-50 text-medical-700 border-medical-200"
                  }`}
                >
                  {isDoctor ? (
                    <Stethoscope className="w-3.5 h-3.5" />
                  ) : (
                    <User className="w-3.5 h-3.5" />
                  )}
                  {ROLE_LABELS[user.role]}
                </span>

                {isAdmin && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                    <ShieldCheck className="w-3 h-3" />
                    Administrateur
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-6 text-center">
              <div>
                <div className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {user._count.prescriptionsAsPatient}
                </div>
                <div className="text-xs text-zinc-400">
                  {isDoctor ? "Reçues" : "Prescriptions"}
                </div>
              </div>
              {isDoctor && (
                <div>
                  <div className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    {user._count.prescriptionsAsDoctor}
                  </div>
                  <div className="text-xs text-zinc-400">Émises</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* ── Informations personnelles (lecture) ── */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 shadow-sm dark:shadow-zinc-900/50 p-6">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-medical-600" />
            Informations personnelles
          </h3>
          <div className="space-y-3">
            <ProfileField icon={User} label="Prénom" value={user.firstName} />
            <ProfileField icon={User} label="Nom" value={user.lastName} />
            <ProfileField icon={Mail} label="Email" value={user.email} />
            <ProfileField icon={Phone} label="Téléphone" value={user.phone} />
            <ProfileField
              icon={Calendar}
              label="Membre depuis"
              value={formatDate(user.createdAt)}
            />
          </div>
        </div>

        {/* ── Formulaire de modification ── */}
        <ProfileEditForm
          user={{
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone ?? "",
            speciality: user.speciality ?? "",
            inami: user.inami ?? "",
          }}
          isDoctor={isDoctor}
        />

        {/* ── Informations pro (médecin) ── */}
        {isDoctor && (
          <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 shadow-sm dark:shadow-zinc-900/50 p-6">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-medical-600" />
              Informations professionnelles
            </h3>
            <div className="space-y-3">
              <ProfileField icon={Stethoscope} label="Spécialité" value={user.speciality} />
              <ProfileField icon={ShieldCheck} label="Numéro INAMI" value={user.inami} />
              <ProfileField
                icon={FileText}
                label="Prescriptions émises"
                value={String(user._count.prescriptionsAsDoctor)}
              />
            </div>
          </div>
        )}

        {/* ── Activité (patient) ── */}
        {!isDoctor && (
          <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 shadow-sm dark:shadow-zinc-900/50 p-6">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-medical-600" />
              Activité de votre compte
            </h3>
            <div className="space-y-3">
              <ProfileField
                icon={FileText}
                label="Prescriptions totales"
                value={String(user._count.prescriptionsAsPatient)}
              />
              <ProfileField icon={ShieldCheck} label="Statut de sécurité" value="Compte vérifié ✓" />
            </div>
            <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Protection RGPD</span>
              </div>
              <p className="text-xs text-blue-600">
                Vos données médicales sont chiffrées et hébergées en Europe.
                Vous pouvez demander leur suppression à tout moment.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Actions du compte ── */}
      <div className="mt-6 bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 shadow-sm dark:shadow-zinc-900/50 p-6">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Actions du compte</h3>
        <div className="flex gap-3">
          <form action={logoutUser}>
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2.5 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Se déconnecter
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
