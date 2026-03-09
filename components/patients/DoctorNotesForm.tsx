"use client";

import { useState, useTransition } from "react";
import { saveDoctorNotes } from "@/lib/actions/patients";
import { Save, Loader2, CheckCircle, Pencil } from "lucide-react";

interface Props {
  patientId: string;
  initialNotes: string;
  doctorName: string;
}

export function DoctorNotesForm({ patientId, initialNotes, doctorName }: Props) {
  const [isPending, startTransition] = useTransition();
  const [notes, setNotes] = useState(initialNotes);
  const [saved, setSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  function handleSave() {
    startTransition(async () => {
      const result = await saveDoctorNotes(patientId, notes);
      if (result.success) {
        setSaved(true);
        setIsEditing(false);
        setTimeout(() => setSaved(false), 3000);
      }
    });
  }

  return (
    <div className="bg-white rounded-xl border border-zinc-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-zinc-900 text-sm flex items-center gap-2">
          <Pencil className="w-4 h-4 text-medical-600" />
          Mes notes — {doctorName}
        </h2>
        {saved && (
          <span className="flex items-center gap-1 text-xs text-green-600">
            <CheckCircle className="w-3.5 h-3.5" /> Sauvegardé
          </span>
        )}
      </div>

      <textarea
        value={notes}
        onChange={(e) => { setNotes(e.target.value); setIsEditing(true); }}
        rows={5}
        placeholder="Notes confidentielles sur ce patient (visibles uniquement par vous)..."
        className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-sm outline-none resize-none focus:ring-2 focus:ring-medical-500 focus:border-medical-500 transition-all"
      />

      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-zinc-400">Ces notes sont privées et ne sont pas partagées avec le patient.</p>
        {isEditing && (
          <button
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-2 bg-medical-600 hover:bg-medical-700 disabled:bg-medical-400 text-white rounded-lg text-xs font-medium transition-all"
          >
            {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            Enregistrer
          </button>
        )}
      </div>
    </div>
  );
}
