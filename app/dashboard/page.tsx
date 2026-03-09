// ============================================================
// Dashboard principal — Antigravity Medical SaaS
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

// ── Badge de statut ──────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[status] ?? "bg-zinc-100 text-zinc-600"}`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

// ── Carte statistique ────────────────────────────────────────
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
    <div className="bg-white rounded-xl p-5 border border-zinc-100 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <TrendingUp className="w-4 h-4 text-zinc-300" />
      </div>
      <div className="font-display text-2xl font-bold text-zinc-900">{value}</div>
      <div className="text-xs text-zinc-500 mt-1">{label}</div>
    </div>
  );
}

// ── Mini calendrier mensuel ──────────────────────────────────
function MiniCalendar({
  scheduledDates,
}: {
  scheduledDates: { date: Date; examType: string; id: string }[];
}) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const firstDay = new Date(year, month, 1).getDay(); // 0=dim
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1; // lundi=0

  const scheduledSet = new Map<number, string>();
  for (const s of scheduledDates) {
    const d = new Date(s.date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      scheduledSet.set(d.getDate(), s.examType);
    }
  }

  const MONTH_FR = [
    "Janvier","Février","Mars","Avril","Mai","Juin",
    "Juillet","Août","Septembre","Octobre","Novembre","Décembre",
  ];
  const DAY_FR = ["Lu","Ma","Me","Je","Ve","Sa","Di"];

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="bg-white rounded-xl border border-zinc-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-zinc-900 text-sm">
          {MONTH_FR[month]} {year}
        </h2>
        <Calendar className="w-4 h-4 text-zinc-400" />
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAY_FR.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-zinc-400 py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const isToday = day === today.getDate();
          const hasExam = scheduledSet.has(day);
          return (
            <div
              key={i}
              title={hasExam ? scheduledSet.get(day) : undefined}
              className={`relative flex items-center justify-center h-8 rounded-lg text-xs font-medium transition-all cursor-default
                ${isToday ? "bg-medical-600 text-white" : ""}
                ${hasExam && !isToday ? "bg-blue-100 text-blue-700 font-semibold" : ""}
                ${!isToday && !hasExam ? "text-zinc-600 hover:bg-zinc-50" : ""}
              `}
            >
              {day}
              {hasExam && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-500" />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-zinc-100">
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <div className="w-3 h-3 rounded-full bg-medical-600" />
          Aujourd&apos;hui
        </div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <div className="w-3 h-3 rounded-full bg-blue-100 border border-blue-300" />
          Examen planifié
        </div>
      </div>
    </div>
  );
}

// ── Page principale ──────────────────────────────────────────
export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const prescriptions = await getUserPrescriptions();

  const stats = {
    total: prescriptions.length,
    pending: prescriptions.filter((p) => p.status === "PENDING").length,
    scheduled: prescriptions.filter((p) => p.status === "SCHEDULED").length,
    completed: prescriptions.filter((p) => p.status === "COMPLETED").length,
  };

  const isDoctor = session.role === Role.DOCTOR || session.role === Role.ADMIN;

  // Examens planifiés avec date pour le calendrier
  const scheduledWithDates = prescriptions
    .filter((p) => p.status === "SCHEDULED" && p.scheduledDate)
    .map((p) => ({
      date: p.scheduledDate as Date,
      examType: p.examType,
      id: p.id,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Prochains examens (30 jours)
  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const upcoming = scheduledWithDates.filter(
    (p) => new Date(p.date) >= now && new Date(p.date) <= in30
  );

  return (
    <div className="p-4 sm:p-8">
      {/* ── En-tête ── */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-zinc-900">
              Bonjour, {session.firstName} 👋
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              {ROLE_LABELS[session.role]} ·{" "}
              {isDoctor
                ? "Gérez les prescriptions de vos patients"
                : "Suivez vos examens radiologiques"}
            </p>
          </div>

          {isDoctor ? (
            <Link
              href="/dashboard/prescriptions/new"
              className="inline-flex items-center gap-2 bg-medical-600 text-white px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-medical-700 transition-all w-fit"
            >
              <Plus className="w-4 h-4" />
              Nouvelle prescription
            </Link>
          ) : (
            <Link
              href="/dashboard/upload"
              className="inline-flex items-center gap-2 bg-medical-600 text-white px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-medical-700 transition-all w-fit"
            >
              <ScanLine className="w-4 h-4" />
              Numériser une ordonnance
            </Link>
          )}
        </div>
      </div>

      {/* ── Statistiques ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <StatCard label="Total" value={stats.total} icon={FileText} color="bg-medical-600" />
        <StatCard label="En attente" value={stats.pending} icon={Clock} color="bg-amber-500" />
        <StatCard label="Planifiés" value={stats.scheduled} icon={Calendar} color="bg-blue-500" />
        <StatCard label="Terminés" value={stats.completed} icon={CheckCircle} color="bg-green-500" />
      </div>

      {/* ── Grille principale (liste + calendrier) ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">

        {/* ── Liste des prescriptions ── */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-zinc-100 shadow-sm">
          <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
            <h2 className="font-semibold text-zinc-900 text-sm sm:text-base">
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
            <div className="p-10 text-center">
              <FileText className="w-10 h-10 text-zinc-200 mx-auto mb-3" />
              <h3 className="font-medium text-zinc-700 mb-2 text-sm">Aucune prescription</h3>
              <p className="text-xs text-zinc-400 mb-5">
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
                  className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-zinc-50 transition-colors group"
                >
                  <div className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center flex-shrink-0">
                    {prescription.source === "OCR" ? (
                      <ScanLine className="w-4 h-4 text-zinc-500" />
                    ) : (
                      <FileText className="w-4 h-4 text-zinc-500" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-zinc-900 text-sm truncate">
                        {prescription.examType}
                      </span>
                      {prescription.urgency && (
                        <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
                          Urgent
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-zinc-400 truncate">
                      {isDoctor
                        ? `${prescription.patient.firstName} ${prescription.patient.lastName}`
                        : prescription.doctor
                        ? `Dr. ${prescription.doctor.firstName} ${prescription.doctor.lastName}`
                        : "Auto-soumission"}
                      {" · "}
                      {formatDate(prescription.createdAt)}
                    </div>
                  </div>

                  <StatusBadge status={prescription.status} />
                  <ArrowRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-500 transition-colors flex-shrink-0 hidden sm:block" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ── Colonne droite : calendrier + prochains examens ── */}
        <div className="space-y-4">
          <MiniCalendar scheduledDates={scheduledWithDates} />

          {/* Prochains examens */}
          <div className="bg-white rounded-xl border border-zinc-100 shadow-sm p-5">
            <h2 className="font-semibold text-zinc-900 text-sm mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              Prochains examens (30j)
            </h2>

            {upcoming.length === 0 ? (
              <p className="text-xs text-zinc-400 text-center py-4">
                Aucun examen planifié dans les 30 prochains jours
              </p>
            ) : (
              <div className="space-y-2">
                {upcoming.map((exam) => {
                  const d = new Date(exam.date);
                  return (
                    <Link
                      key={exam.id}
                      href={`/dashboard/prescriptions/${exam.id}`}
                      className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-zinc-50 transition-colors group"
                    >
                      <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-blue-50 border border-blue-100 flex flex-col items-center justify-center">
                        <span className="text-xs font-bold text-blue-700 leading-none">
                          {d.getDate()}
                        </span>
                        <span className="text-xs text-blue-500 leading-none">
                          {d.toLocaleDateString("fr-BE", { month: "short" })}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-zinc-900 truncate">
                          {exam.examType}
                        </div>
                        <div className="text-xs text-zinc-400">
                          {d.toLocaleDateString("fr-BE", {
                            weekday: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                      <ArrowRight className="w-3 h-3 text-zinc-300 group-hover:text-zinc-500 flex-shrink-0" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
