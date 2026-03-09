// ============================================================
// Page Upload OCR — Numérisation d'ordonnance — Rôle PATIENT
// Flux en 3 étapes : Upload → Extraction OCR → Vérification
// ============================================================

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Role } from "@prisma/client";
import { OcrUploadForm } from "@/components/prescriptions/OcrUploadForm";
import { ScanLine, Upload, CheckCircle } from "lucide-react";

// ── Composant d'étape ────────────────────────────────────────
function Step({
  number,
  label,
  active,
}: {
  number: number;
  label: string;
  active?: boolean;
}) {
  return (
    <div className={`flex items-center gap-2 ${active ? "text-medical-700" : "text-zinc-400"}`}>
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold ${
          active
            ? "bg-medical-600 text-white"
            : "bg-zinc-100 text-zinc-400"
        }`}
      >
        {number}
      </div>
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

// ── Page principale ──────────────────────────────────────────
export default async function UploadPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // Seuls les patients accèdent à l'upload OCR
  if (session.role !== Role.PATIENT) {
    redirect("/dashboard");
  }

  return (
    <div className="p-8 max-w-2xl">
      {/* ── En-tête ── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-medical-100 flex items-center justify-center">
            <ScanLine className="w-6 h-6 text-medical-700" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-zinc-900">
              Numériser une ordonnance
            </h1>
            <p className="text-zinc-500 text-sm">
              Photographiez votre ordonnance manuscrite pour la numériser
            </p>
          </div>
        </div>

        {/* Indicateur d'étapes */}
        <div className="flex items-center gap-4 p-4 bg-zinc-50 rounded-xl border border-zinc-100">
          <Step number={1} label="Upload" active />
          <div className="flex-1 h-px bg-zinc-200" />
          <Step number={2} label="Extraction OCR" />
          <div className="flex-1 h-px bg-zinc-200" />
          <Step number={3} label="Vérification" />
        </div>
      </div>

      {/* ── Conseils pour une bonne photo ── */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
        <h3 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Conseils pour une meilleure reconnaissance
        </h3>
        <ul className="space-y-1">
          {[
            "Photographiez l'ordonnance sur un fond sombre et uniforme",
            "Assurez-vous que le document est bien éclairé",
            "L'écriture doit être lisible et bien contrastée",
            "Évitez les reflets et l'ombre sur le document",
          ].map((tip) => (
            <li key={tip} className="text-xs text-blue-700 flex items-center gap-1.5">
              <CheckCircle className="w-3 h-3 flex-shrink-0" />
              {tip}
            </li>
          ))}
        </ul>
      </div>

      {/* ── Formulaire d'upload avec logique OCR ── */}
      <OcrUploadForm />
    </div>
  );
}
