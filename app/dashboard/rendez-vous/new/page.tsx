// ============================================================
// Nouveau Rendez-vous — Secrétaire
// Création d'une prescription planifiée pour un médecin/patient
// ============================================================

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Role } from "@prisma/client";
import { getDoctors, getPatients } from "@/lib/actions/patients";
import { NewAppointmentForm } from "@/components/prescriptions/NewAppointmentForm";
import { Calendar } from "lucide-react";

export default async function NewAppointmentPage({
  searchParams,
}: {
  searchParams: Promise<{ patientId?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== Role.SECRETARY && session.role !== Role.ADMIN) {
    redirect("/dashboard");
  }

  const [doctors, patients, { patientId: initialPatientId }] = await Promise.all([
    getDoctors(),
    getPatients(),
    searchParams,
  ]);

  return (
    <div className="p-4 sm:p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-medical-600" />
          Nouveau rendez-vous
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
          Planifier un examen pour un patient auprès d&apos;un médecin
        </p>
      </div>

      <NewAppointmentForm doctors={doctors} patients={patients} initialPatientId={initialPatientId} />
    </div>
  );
}
