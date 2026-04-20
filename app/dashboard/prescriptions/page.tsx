// ============================================================
// Page Prescriptions / Rendez-vous — Antigravity Medical SaaS
// ============================================================

import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getUserPrescriptions } from "@/lib/actions/prescriptions";
import { STATUS_LABELS, STATUS_COLORS, formatDate } from "@/lib/utils";
import { Role } from "@prisma/client";
import {
  FileText,
  ScanLine,
  Plus,
  ArrowRight,
  Filter,
  Calendar,
  ArrowUpDown,
} from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[status] ?? "bg-zinc-100 text-zinc-600"}`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

type SortKey = "date" | "patient" | "doctor" | "status" | "examType";

function sortPrescriptions(
  prescriptions: Awaited<ReturnType<typeof getUserPrescriptions>>,
  sortBy: SortKey,
  sortDir: "asc" | "desc"
) {
  return [...prescriptions].sort((a, b) => {
    let cmp = 0;
    switch (sortBy) {
      case "date":
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case "patient":
        cmp = `${a.patient.lastName}${a.patient.firstName}`.localeCompare(
          `${b.patient.lastName}${b.patient.firstName}`
        );
        break;
      case "doctor":
        cmp = (a.doctor?.lastName ?? "").localeCompare(b.doctor?.lastName ?? "");
        break;
      case "status":
        cmp = a.status.localeCompare(b.status);
        break;
      case "examType":
        cmp = a.examType.localeCompare(b.examType);
        break;
    }
    return sortDir === "asc" ? cmp : -cmp;
  });
}

export default async function PrescriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; sort?: string; dir?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { status: filterStatus, sort, dir } = await searchParams;
  const prescriptions = await getUserPrescriptions();

  const isSecretary = session.role === Role.SECRETARY;
  const isDoctor = session.role === Role.DOCTOR || session.role === Role.ADMIN;

  const filtered = filterStatus
    ? prescriptions.filter((p) => p.status === filterStatus)
    : prescriptions;

  const sortBy = (sort as SortKey) ?? "date";
  const sortDir = (dir as "asc" | "desc") ?? "desc";
  const sorted = isSecretary ? sortPrescriptions(filtered, sortBy, sortDir) : filtered;

  const statusFilters = [
    { value: "", label: "Toutes" },
    { value: "PENDING", label: "En attente" },
    { value: "SCHEDULED", label: "Planifiés" },
    { value: "COMPLETED", label: "Terminés" },
    { value: "CANCELLED", label: "Annulés" },
  ];

  function sortLink(key: SortKey) {
    const newDir = sortBy === key && sortDir === "asc" ? "desc" : "asc";
    const params = new URLSearchParams();
    if (filterStatus) params.set("status", filterStatus);
    params.set("sort", key);
    params.set("dir", newDir);
    return `?${params.toString()}`;
  }

  const SortTh = ({ label, k }: { label: string; k: SortKey }) => (
    <th className="text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide px-6 py-4">
      <Link href={sortLink(k)} className="inline-flex items-center gap-1 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
        {label}
        <ArrowUpDown className={`w-3 h-3 ${sortBy === k ? "text-medical-600" : "text-zinc-300"}`} />
      </Link>
    </th>
  );

  return (
    <div className="p-8">
      {/* ── En-tête ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {isSecretary ? "Rendez-vous" : isDoctor ? "Prescriptions émises" : "Mes examens"}
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            {sorted.length} {isSecretary ? "rendez-vous" : "prescription"}{sorted.length !== 1 ? "" : ""}
          </p>
        </div>

        {isDoctor ? (
          <Link
            href="/dashboard/prescriptions/new"
            className="inline-flex items-center gap-2 bg-medical-600 text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-medical-700 transition-all"
          >
            <Plus className="w-4 h-4" />
            Nouvelle prescription
          </Link>
        ) : isSecretary ? (
          <Link
            href="/dashboard/rendez-vous/new"
            className="inline-flex items-center gap-2 bg-medical-600 text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-medical-700 transition-all"
          >
            <Calendar className="w-4 h-4" />
            Nouveau rendez-vous
          </Link>
        ) : (
          <Link
            href="/dashboard/upload"
            className="inline-flex items-center gap-2 bg-medical-600 text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-medical-700 transition-all"
          >
            <ScanLine className="w-4 h-4" />
            Numériser
          </Link>
        )}
      </div>

      {/* ── Filtres par statut ── */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <Filter className="w-4 h-4 text-zinc-400 flex-shrink-0" />
        {statusFilters.map((f) => {
          const params = new URLSearchParams();
          if (f.value) params.set("status", f.value);
          if (sortBy !== "date") params.set("sort", sortBy);
          if (sortDir !== "desc") params.set("dir", sortDir);
          const href = params.toString() ? `?${params.toString()}` : "/dashboard/prescriptions";
          return (
            <Link
              key={f.value}
              href={href}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                (filterStatus ?? "") === f.value
                  ? "bg-medical-600 text-white"
                  : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {/* ── Table ── */}
      <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700 shadow-sm dark:shadow-zinc-900/50 overflow-hidden">
        {sorted.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
            <h3 className="font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              {isSecretary ? "Aucun rendez-vous trouvé" : "Aucune prescription trouvée"}
            </h3>
            <p className="text-sm text-zinc-400">
              {filterStatus ? "Modifiez les filtres pour voir plus de résultats." : isSecretary ? "Créez un premier rendez-vous." : "Créez ou numérisez votre première ordonnance."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-100 dark:border-zinc-700">
                <tr>
                  {isSecretary ? (
                    <>
                      <SortTh label="Examen" k="examType" />
                      <SortTh label="Patient" k="patient" />
                      <SortTh label="Médecin" k="doctor" />
                      <SortTh label="Date" k="date" />
                      <SortTh label="Statut" k="status" />
                    </>
                  ) : (
                    <>
                      <th className="text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide px-6 py-4">Examen</th>
                      {isDoctor ? (
                        <th className="text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide px-6 py-4">Patient</th>
                      ) : (
                        <th className="text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide px-6 py-4">Médecin</th>
                      )}
                      <th className="text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide px-6 py-4">Source</th>
                      <th className="text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide px-6 py-4">Date</th>
                      <th className="text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide px-6 py-4">Statut</th>
                    </>
                  )}
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-700">
                {sorted.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-zinc-900 dark:text-zinc-100 text-sm">{p.examType}</div>
                      {p.urgency && <span className="text-xs text-red-600 font-medium">⚡ Urgent</span>}
                      {isSecretary && p.scheduledDate && (
                        <div className="text-xs text-blue-600 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          {formatDate(p.scheduledDate)}
                        </div>
                      )}
                    </td>
                    {isSecretary ? (
                      <>
                        <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                          {p.patient.firstName} {p.patient.lastName}
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                          {p.doctor ? `Dr. ${p.doctor.firstName} ${p.doctor.lastName}` : "—"}
                        </td>
                      </>
                    ) : isDoctor ? (
                      <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                        {p.patient.firstName} {p.patient.lastName}
                      </td>
                    ) : (
                      <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                        {p.doctor ? `Dr. ${p.doctor.firstName} ${p.doctor.lastName}` : "—"}
                      </td>
                    )}
                    {!isSecretary && (
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                          {p.source === "OCR" ? (
                            <><ScanLine className="w-3 h-3" /> OCR</>
                          ) : (
                            <><FileText className="w-3 h-3" /> Manuel</>
                          )}
                        </span>
                      </td>
                    )}
                    <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400">
                      {formatDate(p.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/prescriptions/${p.id}`}
                        className="inline-flex items-center gap-1 text-xs text-medical-600 hover:text-medical-700 font-medium"
                      >
                        Voir <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
