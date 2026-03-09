"use client";

// ============================================================
// PatientSearchAssign — Recherche + filtre côté client
// Composant client embarqué dans la page patients (DOCTOR)
// ============================================================

import { useState, useTransition, useCallback, useRef } from "react";
import Link from "next/link";
import { Search, UserPlus, Loader2, Check, X, ArrowRight, FileText, User } from "lucide-react";
import { assignPatientToDoctor } from "@/lib/actions/patients";

// ── Types ─────────────────────────────────────────────────────
interface PatientCard {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  _count: { prescriptionsAsPatient: number };
  assignedDoctors: { doctor: { id: string; firstName: string; lastName: string } }[];
}

interface SearchResult {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Props {
  patients: PatientCard[];
  currentDoctorId: string;
  isAdmin: boolean;
}

// ── Composant principal ───────────────────────────────────────
export function PatientSearchAssign({ patients, currentDoctorId, isAdmin }: Props) {
  // --- Filtre local (patients déjà assignés) ---
  const [filterQuery, setFilterQuery] = useState("");

  const filteredPatients = filterQuery.trim().length === 0
    ? patients
    : patients.filter((p) => {
        const q = filterQuery.toLowerCase();
        return (
          p.firstName.toLowerCase().includes(q) ||
          p.lastName.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q)
        );
      });

  // --- Recherche patients existants à assigner ---
  const [assignQuery, setAssignQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [assignedIds, setAssignedIds] = useState<Set<string>>(new Set());
  const [assignError, setAssignError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleAssignSearch = useCallback((value: string) => {
    setAssignQuery(value);
    setAssignError(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/patients/search?q=${encodeURIComponent(value.trim())}`);
        if (res.ok) {
          const data: SearchResult[] = await res.json();
          setSearchResults(data);
        }
      } catch {
        // silently ignore
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, []);

  const handleAssign = (patientId: string) => {
    setAssignError(null);
    startTransition(async () => {
      const result = await assignPatientToDoctor(patientId, currentDoctorId);
      if (result.success) {
        setAssignedIds((prev) => new Set(prev).add(patientId));
        setSearchResults((prev) => prev.filter((p) => p.id !== patientId));
      } else {
        setAssignError(result.message);
      }
    });
  };

  // ── Styles communs ──────────────────────────────────────────
  const inputCls =
    "w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-600 " +
    "bg-zinc-50 dark:bg-zinc-700/50 text-sm text-zinc-900 dark:text-zinc-100 " +
    "placeholder-zinc-400 dark:placeholder-zinc-500 outline-none " +
    "focus:ring-2 focus:ring-medical-500 focus:border-medical-500 transition-all";

  return (
    <div className="space-y-6">
      {/* ── Section 1 : Filtre des patients assignés ── */}
      <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 shadow-sm dark:shadow-zinc-900/50 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filtrer mes patients par nom ou email…"
            className={inputCls}
          />
          {filterQuery && (
            <button
              onClick={() => setFilterQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {filterQuery && (
          <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
            {filteredPatients.length} résultat{filteredPatients.length !== 1 ? "s" : ""} sur {patients.length} patient{patients.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* ── Liste des patients filtrés ── */}
      {patients.length > 0 && (
        filteredPatients.length === 0 ? (
          <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700 shadow-sm dark:shadow-zinc-900/50 p-8 text-center">
            <Search className="w-8 h-8 text-zinc-200 dark:text-zinc-600 mx-auto mb-3" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Aucun patient ne correspond à &laquo;&nbsp;{filterQuery}&nbsp;&raquo;</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredPatients.map((patient) => {
              const initials = `${patient.firstName[0]}${patient.lastName[0]}`;
              const prescCount = patient._count.prescriptionsAsPatient;
              const doctors = patient.assignedDoctors;

              return (
                <Link
                  key={patient.id}
                  href={`/dashboard/patients/${patient.id}`}
                  className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700 shadow-sm dark:shadow-zinc-900/50 p-5 hover:shadow-md hover:border-medical-200 dark:hover:border-medical-700 transition-all group"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl gradient-medical flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-medical-700 dark:group-hover:text-medical-400 transition-colors">
                        {patient.firstName} {patient.lastName}
                      </h3>
                      <p className="text-xs text-zinc-400 truncate">{patient.email}</p>
                      {patient.phone && (
                        <p className="text-xs text-zinc-400">{patient.phone}</p>
                      )}
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-300 group-hover:text-medical-500 transition-colors flex-shrink-0 mt-1" />
                  </div>

                  <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                    <div className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      {prescCount} prescription{prescCount !== 1 ? "s" : ""}
                    </div>
                    {doctors.length > 0 && (
                      <div className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        {doctors.map((d) => `Dr. ${d.doctor.lastName}`).join(", ")}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )
      )}

      {/* ── Section 2 : Assigner un patient existant (DOCTOR uniquement) ── */}
      {!isAdmin && (
        <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 shadow-sm dark:shadow-zinc-900/50 p-5">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="w-4 h-4 text-medical-600" />
            <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              Ajouter un patient existant à ma patientèle
            </h2>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
            <input
              type="text"
              value={assignQuery}
              onChange={(e) => handleAssignSearch(e.target.value)}
              placeholder="Rechercher par nom ou email…"
              className={inputCls}
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 animate-spin" />
            )}
            {!isSearching && assignQuery && (
              <button
                onClick={() => { setAssignQuery(""); setSearchResults([]); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {assignError && (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400">{assignError}</p>
          )}

          {searchResults.length > 0 && (
            <ul className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-700 rounded-xl border border-zinc-100 dark:border-zinc-700 overflow-hidden">
              {searchResults.map((p) => {
                const isAssigned = assignedIds.has(p.id);
                return (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-3 px-4 py-3 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg gradient-medical flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                        {p.firstName[0]}{p.lastName[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">
                          {p.firstName} {p.lastName}
                        </p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate">{p.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAssign(p.id)}
                      disabled={isPending || isAssigned}
                      className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        isAssigned
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 cursor-default"
                          : "bg-medical-600 hover:bg-medical-700 disabled:bg-medical-400 text-white"
                      }`}
                    >
                      {isAssigned ? (
                        <><Check className="w-3.5 h-3.5" /> Assigné</>
                      ) : isPending ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> En cours…</>
                      ) : (
                        <><UserPlus className="w-3.5 h-3.5" /> Ajouter</>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {assignQuery.trim().length >= 2 && !isSearching && searchResults.length === 0 && (
            <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500 text-center py-2">
              Aucun patient non assigné trouvé pour &laquo;&nbsp;{assignQuery}&nbsp;&raquo;
            </p>
          )}

          <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">
            Pour créer un nouveau compte patient,{" "}
            <Link href="/dashboard/patients/new" className="text-medical-600 hover:underline">
              utilisez le formulaire de création
            </Link>.
          </p>
        </div>
      )}
    </div>
  );
}
