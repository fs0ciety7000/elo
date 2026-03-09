// ============================================================
// Formulaire de mise à jour du statut — Rôle DOCTOR/ADMIN
// Permet de changer le statut d'une prescription
// ============================================================

"use client";

import { useState, useTransition } from "react";
import { PrescriptionStatus } from "@prisma/client";
import { updatePrescriptionStatus } from "@/lib/actions/prescriptions";
import { STATUS_LABELS } from "@/lib/utils";
import { Loader2, CheckCircle } from "lucide-react";

interface StatusUpdateFormProps {
  prescriptionId: string;
  currentStatus: PrescriptionStatus;
}

const STATUS_OPTIONS: { value: PrescriptionStatus; label: string; color: string }[] = [
  { value: "PENDING", label: "En attente", color: "bg-amber-100 text-amber-800 border-amber-200" },
  { value: "SCHEDULED", label: "Planifié", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { value: "COMPLETED", label: "Terminé", color: "bg-green-100 text-green-800 border-green-200" },
  { value: "CANCELLED", label: "Annulé", color: "bg-red-100 text-red-800 border-red-200" },
];

export function StatusUpdateForm({
  prescriptionId,
  currentStatus,
}: StatusUpdateFormProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedStatus, setSelectedStatus] = useState<PrescriptionStatus>(currentStatus);
  const [scheduledDate, setScheduledDate] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await updatePrescriptionStatus(
        prescriptionId,
        selectedStatus,
        scheduledDate || undefined
      );

      if (result.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <div className="bg-white rounded-xl border border-zinc-100 shadow-sm p-6">
      <h2 className="font-semibold text-zinc-900 mb-4">Mettre à jour le statut</h2>

      {success && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          <CheckCircle className="w-4 h-4" />
          Statut mis à jour avec succès
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Sélection du statut */}
        <div className="grid grid-cols-2 gap-2">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setSelectedStatus(option.value)}
              className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-all
                ${selectedStatus === option.value
                  ? `${option.color} ring-2 ring-offset-1 ring-current`
                  : "border-zinc-200 text-zinc-600 hover:border-zinc-300 bg-white"
                }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Date de planification (visible uniquement si statut = SCHEDULED) */}
        {selectedStatus === "SCHEDULED" && (
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              Date de l&apos;examen
            </label>
            <input
              type="datetime-local"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-sm outline-none focus:ring-2 focus:ring-medical-500 focus:border-medical-500 transition-all"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={isPending || selectedStatus === currentStatus}
          className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-900 disabled:bg-zinc-300 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-all text-sm"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Mise à jour...
            </>
          ) : (
            `Confirmer : ${STATUS_LABELS[selectedStatus] ?? selectedStatus}`
          )}
        </button>
      </form>
    </div>
  );
}
