// ============================================================
// Page Upload — Soumettre une ordonnance — Rôle PATIENT
// Mode OCR (numérisation) ou saisie manuelle
// ============================================================

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Role } from "@prisma/client";
import { OcrUploadForm } from "@/components/prescriptions/OcrUploadForm";
import { PatientManualForm } from "@/components/prescriptions/PatientManualForm";
import { UploadModeTabs } from "@/components/prescriptions/UploadModeTabs";
import { ScanLine, PenLine } from "lucide-react";

export default async function UploadPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  if (session.role !== Role.PATIENT) redirect("/dashboard");

  const { mode } = await searchParams;
  const isManual = mode === "manual";

  return (
    <div className="p-8 max-w-2xl">
      {/* ── En-tête ── */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">
          Soumettre une ordonnance
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">
          Numérisez votre ordonnance ou saisissez-la manuellement
        </p>
      </div>

      {/* ── Sélecteur de mode ── */}
      <UploadModeTabs active={isManual ? "manual" : "ocr"} />

      {/* ── Contenu selon le mode ── */}
      {isManual ? (
        <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 shadow-sm dark:shadow-zinc-900/50 p-6 space-y-1">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-medical-100 flex items-center justify-center">
              <PenLine className="w-5 h-5 text-medical-700" />
            </div>
            <div>
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Saisie manuelle</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Renseignez les informations de l&apos;ordonnance</p>
            </div>
          </div>
          <PatientManualForm />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Conseils OCR */}
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <ScanLine className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-blue-800">
                Conseils pour une meilleure reconnaissance
              </h3>
            </div>
            <ul className="space-y-1">
              {[
                "Photographiez l'ordonnance sur un fond sombre et uniforme",
                "Assurez-vous que le document est bien éclairé",
                "L'écriture doit être lisible et bien contrastée",
                "Évitez les reflets et l'ombre sur le document",
              ].map((tip) => (
                <li key={tip} className="text-xs text-blue-700 flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-blue-400 flex-shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
          <OcrUploadForm />
        </div>
      )}
    </div>
  );
}
