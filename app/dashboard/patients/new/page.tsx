// ============================================================
// Créer un patient — DOCTOR / ADMIN
// ============================================================

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Role } from "@prisma/client";
import { NewPatientForm } from "@/components/patients/NewPatientForm";
import { UserPlus } from "lucide-react";

export default async function NewPatientPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === Role.PATIENT) redirect("/dashboard");

  return (
    <div className="p-4 sm:p-8 max-w-2xl">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-medical-100 flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-medical-700" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-zinc-900">Nouveau patient</h1>
            <p className="text-zinc-500 text-sm">Créer un compte et une fiche patient</p>
          </div>
        </div>
      </div>
      <NewPatientForm />
    </div>
  );
}
