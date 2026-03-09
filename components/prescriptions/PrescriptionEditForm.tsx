"use client";

import { useState, useTransition } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { editPrescription } from "@/lib/actions/prescriptions";
import {
  Save, Loader2, X, Pencil, Calendar, Stethoscope,
  Clock, CheckCircle, AlertCircle, XCircle,
} from "lucide-react";
import { PrescriptionStatus } from "@prisma/client";

const EXAM_TYPES = [
  "IRM", "Scanner CT", "Radiographie", "Échographie",
  "Mammographie", "Scintigraphie", "PET Scan", "Autre",
];

const STATUS_OPTIONS: { value: PrescriptionStatus; label: string; icon: React.ReactNode; color: string }[] = [
  { value: "PENDING", label: "En attente", icon: <Clock className="w-3.5 h-3.5" />, color: "bg-amber-50 text-amber-700 border-amber-200 data-[selected]:ring-amber-400" },
  { value: "SCHEDULED", label: "Planifié", icon: <Calendar className="w-3.5 h-3.5" />, color: "bg-blue-50 text-blue-700 border-blue-200 data-[selected]:ring-blue-400" },
  { value: "COMPLETED", label: "Terminé", icon: <CheckCircle className="w-3.5 h-3.5" />, color: "bg-green-50 text-green-700 border-green-200 data-[selected]:ring-green-400" },
  { value: "CANCELLED", label: "Annulé", icon: <XCircle className="w-3.5 h-3.5" />, color: "bg-red-50 text-red-700 border-red-200 data-[selected]:ring-red-400" },
];

interface Props {
  prescription: {
    id: string;
    examType: string;
    examDetails: string | null;
    diagnosis: string | null;
    notes: string | null;
    urgency: boolean;
    status: PrescriptionStatus;
    prescribingDoctorName?: string | null;
    scheduledDate?: Date | string | null;
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
  const [status, setStatus] = useState<PrescriptionStatus>(prescription.status);
  const [scheduledDate, setScheduledDate] = useState(
    prescription.scheduledDate
      ? new Date(prescription.scheduledDate).toISOString().slice(0, 16)
      : ""
  );
  const [doctorName, setDoctorName] = useState(prescription.prescribingDoctorName ?? "");

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
      formData.append("status", status);
      formData.append("scheduledDate", scheduledDate);
      formData.append("prescribingDoctorName", doctorName);
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

  return (
    <>
      {/* Trigger */}
      <div className="flex items-center gap-2">
        {success && (
          <span className="text-xs text-green-600 font-medium flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" />
            Sauvegardé
          </span>
        )}
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger asChild>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all">
              <Pencil className="w-3.5 h-3.5" />
              Modifier
            </button>
          </Dialog.Trigger>

          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-100 dark:border-zinc-700 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-700 sticky top-0 bg-white dark:bg-zinc-900 rounded-t-2xl">
                <div>
                  <Dialog.Title className="font-semibold text-zinc-900 dark:text-zinc-100">
                    Modifier la prescription
                  </Dialog.Title>
                  <Dialog.Description className="text-xs text-zinc-500 mt-0.5">
                    Modifiez les détails, le statut et le médecin prescripteur
                  </Dialog.Description>
                </div>
                <Dialog.Close asChild>
                  <button className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">
                    <X className="w-4 h-4" />
                  </button>
                </Dialog.Close>
              </div>

              {/* Body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {error && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {error}
                  </div>
                )}

                {/* Statut */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">
                    Statut
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setStatus(opt.value)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all
                          ${status === opt.value
                            ? `${opt.color} ring-2 ring-offset-1`
                            : "border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 bg-white dark:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600"
                          }`}
                      >
                        {opt.icon}
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date/heure si Planifié */}
                {status === "SCHEDULED" && (
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">
                      Date et heure de l&apos;examen
                    </label>
                    <input
                      type="datetime-local"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-medical-500 focus:border-medical-500 transition-all"
                    />
                  </div>
                )}

                <hr className="border-zinc-100" />

                {/* Type d'examen */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">
                    Type d&apos;examen *
                  </label>
                  <select
                    value={EXAM_TYPES.includes(examType) ? examType : "Autre"}
                    onChange={(e) => setExamType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-medical-500 transition-all"
                  >
                    {EXAM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {!EXAM_TYPES.includes(examType) && (
                    <input
                      type="text"
                      value={examType}
                      onChange={(e) => setExamType(e.target.value)}
                      placeholder="Précisez le type d'examen…"
                      className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-medical-500 transition-all"
                    />
                  )}
                </div>

                {/* Motif */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">
                    Motif / Diagnostic
                  </label>
                  <textarea
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    rows={2}
                    placeholder="Motif de l'examen ou diagnostic…"
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 outline-none resize-none focus:ring-2 focus:ring-medical-500 transition-all"
                  />
                </div>

                {/* Précisions techniques */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">
                    Précisions techniques
                  </label>
                  <textarea
                    value={examDetails}
                    onChange={(e) => setExamDetails(e.target.value)}
                    rows={2}
                    placeholder="Ex: avec injection de produit de contraste…"
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 outline-none resize-none focus:ring-2 focus:ring-medical-500 transition-all"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">
                    Notes au radiologue
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Informations complémentaires pour le radiologue…"
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 outline-none resize-none focus:ring-2 focus:ring-medical-500 transition-all"
                  />
                </div>

                {/* Médecin prescripteur */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Stethoscope className="w-3.5 h-3.5" />
                      Médecin prescripteur
                    </span>
                  </label>
                  <input
                    type="text"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    placeholder="Nom ou e-mail du médecin (lié automatiquement si inscrit)"
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-medical-500 transition-all"
                  />
                  <p className="mt-1 text-xs text-zinc-400">
                    Si ce médecin est inscrit sur la plateforme, le lien sera établi automatiquement.
                  </p>
                </div>

                {/* Urgent */}
                <label className="flex items-center gap-3 px-4 py-3 bg-red-50 rounded-xl border border-red-100 cursor-pointer hover:bg-red-100 transition-all">
                  <input
                    type="checkbox"
                    checked={urgency}
                    onChange={(e) => setUrgency(e.target.checked)}
                    className="w-4 h-4 rounded border-red-300 accent-red-600"
                  />
                  <div>
                    <div className="text-sm font-medium text-red-700">Urgent</div>
                    <div className="text-xs text-red-500">Cette prescription nécessite une attention prioritaire</div>
                  </div>
                </label>

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="flex-1 px-4 py-2.5 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-xl text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
                    >
                      Annuler
                    </button>
                  </Dialog.Close>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-medical-600 hover:bg-medical-700 disabled:bg-medical-400 text-white rounded-xl text-sm font-semibold transition-all"
                  >
                    {isPending
                      ? <><Loader2 className="w-4 h-4 animate-spin" />Enregistrement…</>
                      : <><Save className="w-4 h-4" />Enregistrer</>
                    }
                  </button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </>
  );
}
