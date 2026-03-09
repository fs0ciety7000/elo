"use client";

import { useState, useTransition } from "react";
import { editPrescription } from "@/lib/actions/prescriptions";
import { Save, Loader2, X, Pencil } from "lucide-react";

const EXAM_TYPES = [
  "IRM", "Scanner CT", "Radiographie", "Échographie",
  "Mammographie", "Scintigraphie", "PET Scan", "Autre",
];

interface Props {
  prescription: {
    id: string;
    examType: string;
    examDetails: string | null;
    diagnosis: string | null;
    notes: string | null;
    urgency: boolean;
  };
}

export function PrescriptionEditForm({ prescription }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [examType, setExamType] = useState(prescription.examType);
  const [examDetails, setExamDetails] = useState(prescription.examDetails ?? "");
  const [diagnosis, setDiagnosis] = useState(prescription.diagnosis ?? "");
  const [notes, setNotes] = useState(prescription.notes ?? "");
  const [urgency, setUrgency] = useState(prescription.urgency);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.append("examType", examType);
      formData.append("examDetails", examDetails);
      formData.append("diagnosis", diagnosis);
      formData.append("notes", notes);
      formData.append("urgency", String(urgency));
      const result = await editPrescription(prescription.id, formData);
      if (result.success) {
        setSuccess(true);
        setOpen(false);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.message ?? "Erreur");
      }
    });
  }

  if (!open) {
    return (
      <div className="flex items-center gap-2">
        {success && (
          <span className="text-xs text-green-600 font-medium">Sauvegardé ✓</span>
        )}
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-all"
        >
          <Pencil className="w-3.5 h-3.5" />
          Modifier
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-zinc-900 text-sm">Modifier la prescription</h3>
        <button onClick={() => setOpen(false)} className="text-zinc-400 hover:text-zinc-600">
          <X className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1">Type d&apos;examen *</label>
          <select
            value={EXAM_TYPES.includes(examType) ? examType : "Autre"}
            onChange={(e) => setExamType(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 text-sm outline-none focus:ring-2 focus:ring-medical-500 transition-all"
          >
            {EXAM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          {!EXAM_TYPES.includes(examType) && (
            <input
              type="text"
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
              className="mt-1.5 w-full px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 text-sm outline-none focus:ring-2 focus:ring-medical-500 transition-all"
            />
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1">Motif / Diagnostic</label>
          <textarea
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 text-sm outline-none resize-none focus:ring-2 focus:ring-medical-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1">Précisions techniques</label>
          <textarea
            value={examDetails}
            onChange={(e) => setExamDetails(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 text-sm outline-none resize-none focus:ring-2 focus:ring-medical-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1">Notes au radiologue</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 text-sm outline-none resize-none focus:ring-2 focus:ring-medical-500 transition-all"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
          <input
            type="checkbox"
            checked={urgency}
            onChange={(e) => setUrgency(e.target.checked)}
            className="w-4 h-4 rounded border-red-300 text-red-600"
          />
          Urgent
        </label>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex-1 px-3 py-2 border border-zinc-200 text-zinc-600 rounded-lg text-sm hover:bg-zinc-50 transition-all"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-medical-600 hover:bg-medical-700 disabled:bg-medical-400 text-white rounded-lg text-sm font-medium transition-all"
          >
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
}
