"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPrescription } from "@/lib/actions/prescriptions";
import { FileText, Loader2, Save, AlertTriangle } from "lucide-react";

const EXAM_TYPES = [
  "IRM",
  "Scanner CT",
  "Radiographie",
  "Échographie",
  "Mammographie",
  "Scintigraphie",
  "PET Scan",
  "Autre",
];

export function PatientManualForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [examType, setExamType] = useState("");
  const [customExamType, setCustomExamType] = useState("");
  const [examDetails, setExamDetails] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [urgency, setUrgency] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const finalExamType = examType === "Autre" ? customExamType : examType;
    if (!finalExamType.trim()) {
      setError("Le type d'examen est requis");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("examType", finalExamType);
      formData.append("examDetails", examDetails);
      formData.append("diagnosis", diagnosis);
      formData.append("notes", notes);
      formData.append("urgency", String(urgency));
      formData.append("source", "MANUAL");

      const result = await createPrescription(formData);
      if (result.success && result.data) {
        router.push(`/dashboard/prescriptions/${result.data.id}`);
      } else {
        setError(result.message ?? "Erreur lors de la création");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Type d'examen */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1.5">
          Type d&apos;examen *
        </label>
        <select
          value={examType}
          onChange={(e) => setExamType(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm outline-none focus:ring-2 focus:ring-medical-500 focus:border-medical-500 transition-all"
        >
          <option value="">Sélectionner un type...</option>
          {EXAM_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        {examType === "Autre" && (
          <input
            type="text"
            value={customExamType}
            onChange={(e) => setCustomExamType(e.target.value)}
            placeholder="Précisez le type d'examen"
            className="mt-2 w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm outline-none focus:ring-2 focus:ring-medical-500 focus:border-medical-500 transition-all"
          />
        )}
      </div>

      {/* Motif / Diagnostic */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1.5">
          Motif / Diagnostic
        </label>
        <textarea
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          rows={3}
          placeholder="Ex : douleurs lombaires chroniques, suspicion de hernie discale..."
          className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm outline-none resize-none focus:ring-2 focus:ring-medical-500 focus:border-medical-500 transition-all"
        />
      </div>

      {/* Précisions techniques */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1.5">
          Précisions techniques
        </label>
        <textarea
          value={examDetails}
          onChange={(e) => setExamDetails(e.target.value)}
          rows={2}
          placeholder="Ex : avec injection de produit de contraste, séquences spécifiques..."
          className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm outline-none resize-none focus:ring-2 focus:ring-medical-500 focus:border-medical-500 transition-all"
        />
      </div>

      {/* Notes au radiologue */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1.5">
          Notes au radiologue
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Instructions particulières, antécédents importants..."
          className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm outline-none resize-none focus:ring-2 focus:ring-medical-500 focus:border-medical-500 transition-all"
        />
      </div>

      {/* Urgence */}
      <div className="flex items-center gap-3 p-3 rounded-xl border border-zinc-200 bg-zinc-50">
        <input
          type="checkbox"
          id="urgency-manual"
          checked={urgency}
          onChange={(e) => setUrgency(e.target.checked)}
          className="w-4 h-4 rounded border-red-300 text-red-600"
        />
        <label htmlFor="urgency-manual" className="flex items-center gap-2 text-sm font-medium text-zinc-700 cursor-pointer">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          Marquer comme urgent
        </label>
      </div>

      <button
        type="submit"
        disabled={isPending || (!examType || (examType === "Autre" && !customExamType.trim()))}
        className="w-full flex items-center justify-center gap-2 bg-medical-600 hover:bg-medical-700 disabled:bg-medical-400 text-white font-semibold py-4 rounded-xl transition-all"
      >
        {isPending ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Enregistrement...
          </>
        ) : (
          <>
            <Save className="w-5 h-5" />
            Soumettre la prescription
          </>
        )}
      </button>
    </form>
  );
}
