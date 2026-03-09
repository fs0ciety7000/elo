// ============================================================
// Dashboard principal — Antigravity Medical SaaS
// Vue adaptée au rôle : Patient ou Prestataire médical
// ============================================================

import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getUserPrescriptions } from "@/lib/actions/prescriptions";
import { STATUS_LABELS, STATUS_COLORS, formatDate, ROLE_LABELS } from "@/lib/utils";
import { Role } from "@prisma/client";
import {
  FileText,
  Clock,
  CheckCircle,
  Calendar,
  ScanLine,
  Plus,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

// ── Composant Badge de statut ────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[status] ?? "bg-zinc-100 text-zinc-600"}`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

// ── Composant Carte de statistique ───────────────────────────
function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 border border-zinc-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <TrendingUp className="w-4 h-4 text-zinc-300" />
      </div>
      <div className="font-display text-3xl font-bold text-zinc-900">{value}</div>
      <div className="text-sm text-zinc-500 mt-1">{label}</div>
    </div>
  );
}

// ── Page principale ──────────────────────────────────────────
export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const prescriptions = await getUserPrescriptions();

  // Calcul des statistiques
  const stats = {
    total: prescriptions.length,
    pending: prescriptions.filter((p) => p.status === "PENDING").length,
    scheduled: prescriptions.filter((p) => p.status === "SCHEDULED").length,
    completed: prescriptions.filter((p) => p.status === "COMPLETED").length,
  };

  const isDoctor = session.role === Role.DOCTOR || session.role === Role.ADMIN;

  return (
    <div className="p-8">
      {/* ── En-tête ── */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-zinc-900">
              Bonjour, {session.firstName} 👋
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              {ROLE_LABELS[session.role]} ·{" "}
              {isDoctor
                ? "Gérez les prescriptions de vos patients"
                : "Suivez vos examens radiologiques"}
            </p>
          </div>

          {/* CTA contextuel selon le rôle */}
          {isDoctor ? (
            <Link
              href="/dashboard/prescriptions/new"
              className="inline-flex items-center gap-2 bg-medical-600 text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-medical-700 transition-all"
            >
              <Plus className="w-4 h-4" />
              Nouvelle prescription
            </Link>
          ) : (
            <Link
              href="/dashboard/upload"
              className="inline-flex items-center gap-2 bg-medical-600 text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-medical-700 transition-all"
            >
              <ScanLine className="w-4 h-4" />
              Numériser une ordonnance
            </Link>
          )}
        </div>
      </div>

      {/* ── Statistiques ── */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total prescriptions"
          value={stats.total}
          icon={FileText}
          color="bg-medical-600"
        />
        <StatCard
          label="En attente"
          value={stats.pending}
          icon={Clock}
          color="bg-amber-500"
        />
        <StatCard
          label="Planifiés"
          value={stats.scheduled}
          icon={Calendar}
          color="bg-blue-500"
        />
        <StatCard
          label="Terminés"
          value={stats.completed}
          icon={CheckCircle}
          color="bg-green-500"
        />
      </div>

      {/* ── Liste des dernières prescriptions ── */}
      <div className="bg-white rounded-xl border border-zinc-100 shadow-sm">
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
          <h2 className="font-semibold text-zinc-900">
            {isDoctor ? "Prescriptions récentes émises" : "Mes examens"}
          </h2>
          <Link
            href="/dashboard/prescriptions"
            className="text-sm text-medical-600 hover:text-medical-700 font-medium flex items-center gap-1"
          >
            Tout voir <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {prescriptions.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
            <h3 className="font-medium text-zinc-700 mb-2">Aucune prescription</h3>
            <p className="text-sm text-zinc-400 mb-6">
              {isDoctor
                ? "Créez votre première prescription pour un patient."
                : "Numérisez votre première ordonnance pour commencer."}
            </p>
            <Link
              href={isDoctor ? "/dashboard/prescriptions/new" : "/dashboard/upload"}
              className="inline-flex items-center gap-2 bg-medical-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-medical-700 transition-all"
            >
              <Plus className="w-4 h-4" />
              {isDoctor ? "Créer une prescription" : "Numériser une ordonnance"}
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-zinc-50">
            {prescriptions.slice(0, 8).map((prescription) => (
              <Link
                key={prescription.id}
                href={`/dashboard/prescriptions/${prescription.id}`}
                className="flex items-center gap-4 p-4 hover:bg-zinc-50 transition-colors group"
              >
                {/* Icône source */}
                <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center flex-shrink-0">
                  {prescription.source === "OCR" ? (
                    <ScanLine className="w-5 h-5 text-zinc-500" />
                  ) : (
                    <FileText className="w-5 h-5 text-zinc-500" />
                  )}
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-zinc-900 text-sm truncate">
                      {prescription.examType}
                    </span>
                    {prescription.urgency && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                        Urgent
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-zinc-400">
                    {isDoctor
                      ? `Patient : ${prescription.patient.firstName} ${prescription.patient.lastName}`
                      : prescription.doctor
                      ? `Dr. ${prescription.doctor.firstName} ${prescription.doctor.lastName}`
                      : "Auto-soumission"}
                    {" · "}
                    {formatDate(prescription.createdAt)}
                  </div>
                </div>

                {/* Statut */}
                <StatusBadge status={prescription.status} />

                <ArrowRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-500 transition-colors" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
