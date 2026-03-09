// ============================================================
// Formulaire de Nouvelle Prescription — Rôle DOCTOR/ADMIN
// Encodage direct avec attribution au patient par email
// ============================================================

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Role } from "@prisma/client";
import { NewPrescriptionForm } from "@/components/prescriptions/NewPrescriptionForm";
import { FileText } from "lucide-react";

export default async function NewPrescriptionPage() {
  const session = await getSession();

  if (!session) redirect("/login");

  // Seuls les médecins et admins accèdent à cette page
  if (session.role === Role.PATIENT) {
    redirect("/dashboard");
  }

  return (
    <div className="p-8 max-w-3xl">
      {/* ── En-tête ── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-medical-100 flex items-center justify-center">
            <FileText className="w-5 h-5 text-medical-700" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-zinc-900">
              Nouvelle prescription
            </h1>
            <p className="text-zinc-500 text-sm">
              Encodez directement une demande d&apos;examen pour un patient
            </p>
          </div>
        </div>
      </div>

      {/* ── Formulaire ── */}
      <NewPrescriptionForm />
    </div>
  );
}
