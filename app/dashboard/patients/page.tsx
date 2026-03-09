// ============================================================
// Liste des patients — Rôle DOCTOR / ADMIN
// ============================================================

import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getPatients } from "@/lib/actions/patients";
import { Role } from "@prisma/client";
import { Users, Plus, FileText, ArrowRight, User } from "lucide-react";

export default async function PatientsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === Role.PATIENT) redirect("/dashboard");

  const patients = await getPatients();

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-medical-600" />
            {session.role === Role.ADMIN ? "Tous les patients" : "Mes patients"}
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

      {patients.length === 0 ? (
        <div className="bg-white rounded-xl border border-zinc-100 shadow-sm p-12 text-center">
          <Users className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
          <h3 className="font-medium text-zinc-700 mb-2">Aucun patient</h3>
          <p className="text-sm text-zinc-400 mb-6">
            {session.role === Role.ADMIN
              ? "Aucun patient enregistré."
              : "Aucun patient ne vous est encore assigné."}
          </p>
          <Link
            href="/dashboard/patients/new"
            className="inline-flex items-center gap-2 bg-medical-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-medical-700 transition-all"
          >
            <Plus className="w-4 h-4" />
            Créer un patient
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {patients.map((patient) => {
            const initials = `${patient.firstName[0]}${patient.lastName[0]}`;
            const prescCount = patient._count.prescriptionsAsPatient;
            const doctors = patient.assignedDoctors;

            return (
              <Link
                key={patient.id}
                href={`/dashboard/patients/${patient.id}`}
                className="bg-white rounded-xl border border-zinc-100 shadow-sm p-5 hover:shadow-md hover:border-medical-200 transition-all group"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl gradient-medical flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-zinc-900 truncate group-hover:text-medical-700 transition-colors">
                      {patient.firstName} {patient.lastName}
                    </h3>
                    <p className="text-xs text-zinc-400 truncate">{patient.email}</p>
                    {patient.phone && (
                      <p className="text-xs text-zinc-400">{patient.phone}</p>
                    )}
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-300 group-hover:text-medical-500 transition-colors flex-shrink-0 mt-1" />
                </div>

                <div className="flex items-center gap-3 text-xs text-zinc-500">
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
      )}
    </div>
  );
}
