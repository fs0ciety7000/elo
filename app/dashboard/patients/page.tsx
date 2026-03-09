// ============================================================
// Liste des patients — Rôle DOCTOR / ADMIN
// ============================================================

import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getPatients } from "@/lib/actions/patients";
import { Role } from "@prisma/client";
import { Users, Plus } from "lucide-react";
import { PatientSearchAssign } from "@/components/patients/PatientSearchAssign";

export default async function PatientsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === Role.PATIENT) redirect("/dashboard");

  const patients = await getPatients();
  const isAdmin = session.role === Role.ADMIN;

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-medical-600" />
            {isAdmin ? "Tous les patients" : "Mes patients"}
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            {patients.length} patient{patients.length !== 1 ? "s" : ""} enregistré{patients.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/dashboard/patients/new"
          className="inline-flex items-center gap-2 bg-medical-600 text-white px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-medical-700 transition-all w-fit"
        >
          <Plus className="w-4 h-4" />
          Nouveau patient
        </Link>
      </div>

      {patients.length === 0 && isAdmin ? (
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700 shadow-sm dark:shadow-zinc-900/50 p-12 text-center">
          <Users className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
          <h3 className="font-medium text-zinc-700 dark:text-zinc-300 mb-2">Aucun patient</h3>
          <p className="text-sm text-zinc-400 mb-6">Aucun patient enregistré.</p>
          <Link
            href="/dashboard/patients/new"
            className="inline-flex items-center gap-2 bg-medical-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-medical-700 transition-all"
          >
            <Plus className="w-4 h-4" />
            Créer un patient
          </Link>
        </div>
      ) : (
        <PatientSearchAssign
          patients={patients}
          currentDoctorId={session.id}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}
