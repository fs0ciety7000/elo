"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deletePrescription } from "@/lib/actions/prescriptions";
import { Trash2, Loader2, AlertTriangle, X } from "lucide-react";

export function DeletePrescriptionButton({ prescriptionId }: { prescriptionId: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    startTransition(async () => {
      const result = await deletePrescription(prescriptionId);
      if (result.success) {
        router.push("/dashboard/prescriptions");
      } else {
        setError(result.message ?? "Erreur");
        setConfirm(false);
      }
    });
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-2">
        {error && <span className="text-xs text-red-600">{error}</span>}
        <span className="text-xs text-zinc-500 flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
          Confirmer la suppression ?
        </span>
        <button
          onClick={() => setConfirm(false)}
          className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded"
        >
          <X className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm rounded-lg transition-all"
        >
          {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          Supprimer
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-all"
    >
      <Trash2 className="w-3.5 h-3.5" />
      Supprimer
    </button>
  );
}
