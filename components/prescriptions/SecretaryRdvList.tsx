"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  X,
  ArrowUpDown,
  ArrowRight,
  Calendar,
} from "lucide-react";
import { STATUS_LABELS, STATUS_COLORS, formatDate } from "@/lib/utils";

interface Prescription {
  id: string;
  examType: string;
  status: string;
  urgency: boolean;
  scheduledDate: Date | null;
  createdAt: Date;
  patient: { firstName: string; lastName: string };
  doctor: { firstName: string; lastName: string; speciality: string | null } | null;
}

type SortKey = "examType" | "patient" | "doctor" | "date" | "status";
type SortDir = "asc" | "desc";

interface Props {
  prescriptions: Prescription[];
  filterStatus?: string;
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[status] ?? "bg-zinc-100 text-zinc-600"}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function SecretaryRdvList({ prescriptions, filterStatus }: Props) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = filterStatus
      ? prescriptions.filter((p) => p.status === filterStatus)
      : prescriptions;

    const searched = q.length < 2 ? base : base.filter((p) => {
      const patientFull = `${p.patient.firstName} ${p.patient.lastName}`.toLowerCase();
      const doctorFull  = p.doctor
        ? `${p.doctor.firstName} ${p.doctor.lastName}`.toLowerCase()
        : "";
      return (
        p.examType.toLowerCase().includes(q) ||
        patientFull.includes(q) ||
        doctorFull.includes(q)
      );
    });

    return [...searched].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "examType":
          cmp = a.examType.localeCompare(b.examType);
          break;
        case "patient":
          cmp = `${a.patient.lastName}${a.patient.firstName}`.localeCompare(
            `${b.patient.lastName}${b.patient.firstName}`
          );
          break;
        case "doctor":
          cmp = (a.doctor?.lastName ?? "").localeCompare(b.doctor?.lastName ?? "");
          break;
        case "date":
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [prescriptions, filterStatus, query, sortKey, sortDir]);

  const SortTh = ({ label, k }: { label: string; k: SortKey }) => (
    <th className="text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide px-6 py-4">
      <button
        onClick={() => toggleSort(k)}
        className="inline-flex items-center gap-1 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
      >
        {label}
        <ArrowUpDown className={`w-3 h-3 ${sortKey === k ? "text-medical-600" : "text-zinc-300"}`} />
      </button>
    </th>
  );

  return (
    <div className="space-y-4">
      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher par patient, médecin, type d'examen…"
          className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 outline-none focus:ring-2 focus:ring-medical-500 focus:border-medical-500 transition-all"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {query.length >= 2 && (
        <p className="text-xs text-zinc-400">
          {filtered.length} résultat{filtered.length !== 1 ? "s" : ""} pour «&nbsp;{query}&nbsp;»
        </p>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700 shadow-sm dark:shadow-zinc-900/50 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Search className="w-10 h-10 text-zinc-200 dark:text-zinc-600 mx-auto mb-3" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {query ? `Aucun résultat pour «\u00a0${query}\u00a0»` : "Aucun rendez-vous trouvé"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-100 dark:border-zinc-700">
                <tr>
                  <SortTh label="Examen" k="examType" />
                  <SortTh label="Patient" k="patient" />
                  <SortTh label="Médecin" k="doctor" />
                  <SortTh label="Date" k="date" />
                  <SortTh label="Statut" k="status" />
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-700">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-zinc-900 dark:text-zinc-100 text-sm">{p.examType}</div>
                      {p.urgency && (
                        <span className="text-xs text-red-600 font-medium">⚡ Urgent</span>
                      )}
                      {p.scheduledDate && (
                        <div className="text-xs text-blue-600 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          {formatDate(p.scheduledDate)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-700 dark:text-zinc-300">
                      {p.patient.firstName} {p.patient.lastName}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                      {p.doctor
                        ? `Dr. ${p.doctor.firstName} ${p.doctor.lastName}`
                        : <span className="text-zinc-300 dark:text-zinc-600">—</span>
                      }
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
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
