// ============================================================
// Formulaire Nouvelle Prescription — Rôle DOCTOR
// Encodage direct avec autocomplétion des types d'examens
// ============================================================

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createPrescription } from "@/lib/actions/prescriptions";
import { Loader2, Save, User, Search } from "lucide-react";

// ── Liste d'autocomplétion des examens médicaux courants ─────
const EXAM_SUGGESTIONS = [
  "IRM Lombaire",
  "IRM Cérébrale",
  "IRM Genou",
  "IRM Épaule",
  "Scanner Thoracique",
  "Scanner Abdominal",
  "Scanner Cérébral",
  "Radiographie Thoracique",
  "Radiographie Colonne Vertébrale",
  "Échographie Abdominale",
  "Échographie Thyroïde",
  "Mammographie",
  "Scintigraphie Osseuse",
  "PET Scan",
  "Arthrographie",
];

// ── Schéma de validation ─────────────────────────────────────
const Schema = z.object({
  patientEmail: z.string().email("Email patient invalide"),
  examType: z.string().min(3, "Le type d'examen est requis"),
  examDetails: z.string().optional(),
  diagnosis: z.string().optional(),
  notes: z.string().optional(),
  urgency: z.boolean().default(false),
});

type FormData = z.infer<typeof Schema>;

// ── Composant principal ──────────────────────────────────────
export function NewPrescriptionForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [examSuggestions, setExamSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(Schema),
  });

  const examType = watch("examType");

  // ── Filtrage des suggestions ─────────────────────────────
  function handleExamInput(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setValue("examType", value);
    if (value.length >= 2) {
      const filtered = EXAM_SUGGESTIONS.filter((s) =>
        s.toLowerCase().includes(value.toLowerCase())
      );
      setExamSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }

  // ── Soumission ───────────────────────────────────────────
  const onSubmit = (data: FormData) => {
    setServerError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.append("patientEmail", data.patientEmail);
      formData.append("examType", data.examType);
      formData.append("source", "MANUAL");
      if (data.examDetails) formData.append("examDetails", data.examDetails);
      if (data.diagnosis) formData.append("diagnosis", data.diagnosis);
      if (data.notes) formData.append("notes", data.notes);
      formData.append("urgency", String(data.urgency));

      const result = await createPrescription(formData);
      if (result.success && result.data) {
        router.push(`/dashboard/prescriptions/${result.data.id}`);
      } else {
        setServerError(result.message);
      }
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-8">
      {serverError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* ── Email du patient ── */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">
            Email du patient *
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              {...register("patientEmail")}
              type="email"
              placeholder="patient@exemple.com"
              className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none transition-all
                focus:ring-2 focus:ring-medical-500 focus:border-medical-500
                ${errors.patientEmail ? "border-red-300 bg-red-50" : "border-zinc-200 bg-zinc-50"}`}
            />
          </div>
          {errors.patientEmail && (
            <p className="mt-1 text-xs text-red-600">{errors.patientEmail.message}</p>
          )}
          <p className="mt-1 text-xs text-zinc-400">
            L&apos;ordonnance sera automatiquement liée au dossier du patient.
          </p>
        </div>

        {/* ── Type d'examen avec autocomplétion ── */}
        <div className="relative">
          <label className="block text-sm font-medium text-zinc-700 mb-2">
            Type d&apos;examen *
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={examType ?? ""}
              onChange={handleExamInput}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Ex: IRM Lombaire, Scanner Thoracique..."
              className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none transition-all
                focus:ring-2 focus:ring-medical-500 focus:border-medical-500
                ${errors.examType ? "border-red-300 bg-red-50" : "border-zinc-200 bg-zinc-50"}`}
            />
          </div>

          {/* Dropdown suggestions */}
          {showSuggestions && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-zinc-200 rounded-xl shadow-lg overflow-hidden">
              {examSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onMouseDown={() => {
                    setValue("examType", suggestion);
                    setShowSuggestions(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-zinc-700 hover:bg-medical-50 hover:text-medical-700 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
          {errors.examType && (
            <p className="mt-1 text-xs text-red-600">{errors.examType.message}</p>
          )}
        </div>

        {/* ── Détails de l'examen ── */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">
            Précisions techniques
          </label>
          <textarea
            {...register("examDetails")}
            rows={2}
            placeholder="Ex: Séquences T1, T2 — rachis lombo-sacré complet avec injection de gadolinium"
            className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm outline-none resize-none focus:ring-2 focus:ring-medical-500 focus:border-medical-500 transition-all"
          />
        </div>

        {/* ── Diagnostic / Motif ── */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">
            Motif / Diagnostic
          </label>
          <textarea
            {...register("diagnosis")}
            rows={2}
            placeholder="Ex: Lombalgies chroniques avec irradiation sciatique droite depuis 3 mois"
            className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm outline-none resize-none focus:ring-2 focus:ring-medical-500 focus:border-medical-500 transition-all"
          />
        </div>

        {/* ── Notes supplémentaires ── */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">
            Notes pour le radiologue
          </label>
          <textarea
            {...register("notes")}
            rows={2}
            placeholder="Informations complémentaires, contre-indications, matériel implanté..."
            className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm outline-none resize-none focus:ring-2 focus:ring-medical-500 focus:border-medical-500 transition-all"
          />
        </div>

        {/* ── Case urgence ── */}
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl">
          <input
            {...register("urgency")}
            type="checkbox"
            id="urgency"
            className="w-4 h-4 rounded border-red-300 text-red-600 focus:ring-red-500"
          />
          <label htmlFor="urgency" className="text-sm font-medium text-red-800 cursor-pointer">
            ⚡ Marquer comme urgent
            <span className="block text-xs text-red-500 font-normal mt-0.5">
              L&apos;examen doit être réalisé dans les plus brefs délais
            </span>
          </label>
        </div>

        {/* ── Bouton submit ── */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 flex items-center justify-center gap-2 bg-medical-600 hover:bg-medical-700 disabled:bg-medical-400 text-white font-semibold py-3 rounded-xl transition-all"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Création en cours...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Créer la prescription
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
