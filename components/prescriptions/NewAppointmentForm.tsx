"use client";

// ============================================================
// NewAppointmentForm — Création de rendez-vous (Secrétaire)
// ============================================================

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPrescription } from "@/lib/actions/prescriptions";
import {
  Loader2,
  Calendar,
  Stethoscope,
  User,
  FileText,
  CheckCircle,
  X,
} from "lucide-react";

interface DoctorOption {
  id: string;
  firstName: string;
  lastName: string;
  speciality?: string | null;
}

interface PatientOption {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
}

interface Props {
  doctors: DoctorOption[];
  patients: PatientOption[];
}

const EXAM_SUGGESTIONS = [
  "IRM Lombaire",
  "IRM Cérébrale",
  "Scanner Thoracique",
  "Radio Thoracique",
  "Échographie Abdominale",
  "Échographie Cardiaque",
  "Mammographie",
  "Densitométrie Osseuse",
  "Scintigraphie",
  "PET Scan",
];

export function NewAppointmentForm({ doctors, patients }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [form, setForm] = useState({
    doctorId: "",
    patientId: "",
    examType: "",
    examDetails: "",
    scheduledDate: "",
    urgency: false,
    notes: "",
  });

  const [patientFilter, setPatientFilter] = useState("");

  const filteredPatients = patientFilter.trim().length < 2
    ? patients
    : patients.filter((p) => {
        const q = patientFilter.toLowerCase();
        return (
          p.firstName.toLowerCase().includes(q) ||
          p.lastName.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q)
        );
      });

  function set(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (!form.doctorId) { setMessage({ type: "error", text: "Veuillez sélectionner un médecin" }); return; }
    if (!form.patientId) { setMessage({ type: "error", text: "Veuillez sélectionner un patient" }); return; }
    if (!form.examType.trim()) { setMessage({ type: "error", text: "Le type d'examen est requis" }); return; }

    startTransition(async () => {
      const fd = new FormData();
      fd.append("doctorId", form.doctorId);
      fd.append("patientId", form.patientId);
      fd.append("examType", form.examType);
      fd.append("examDetails", form.examDetails);
      fd.append("scheduledDate", form.scheduledDate);
      fd.append("urgency", String(form.urgency));
      fd.append("notes", form.notes);
      fd.append("source", "MANUAL");

      const result = await createPrescription(fd);
      if (result.success && result.data) {
        router.push(`/dashboard/prescriptions/${result.data.id}`);
        router.refresh();
      } else {
        setMessage({ type: "error", text: result.message });
      }
    });
  }

  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-700/50 text-sm outline-none focus:ring-2 focus:ring-medical-500 focus:border-medical-500 disabled:opacity-60 transition-all";
  const selectedPatient = patients.find((p) => p.id === form.patientId);
  const selectedDoctor = doctors.find((d) => d.id === form.doctorId);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {message && (
        <div className={`flex items-center gap-2 p-3 rounded-xl text-sm border ${
          message.type === "success"
            ? "bg-green-50 text-green-700 border-green-200"
            : "bg-red-50 text-red-700 border-red-200"
        }`}>
          {message.type === "success" ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <X className="w-4 h-4 flex-shrink-0" />}
          {message.text}
        </div>
      )}

      {/* Médecin */}
      <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700 p-5 space-y-3">
        <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm flex items-center gap-2">
          <Stethoscope className="w-4 h-4 text-medical-600" /> Médecin
        </h2>
        <select
          value={form.doctorId}
          onChange={(e) => set("doctorId", e.target.value)}
          className={inputCls}
          required
        >
          <option value="">Sélectionner un médecin…</option>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>
              Dr. {d.firstName} {d.lastName}{d.speciality ? ` — ${d.speciality}` : ""}
            </option>
          ))}
        </select>
        {selectedDoctor && (
          <div className="flex items-center gap-2 px-3 py-2 bg-medical-50 dark:bg-medical-900/20 rounded-lg text-xs text-medical-700 dark:text-medical-300">
            <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
            Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}
            {selectedDoctor.speciality && ` · ${selectedDoctor.speciality}`}
          </div>
        )}
      </div>

      {/* Patient */}
      <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700 p-5 space-y-3">
        <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm flex items-center gap-2">
          <User className="w-4 h-4 text-medical-600" /> Patient
        </h2>
        <input
          type="text"
          placeholder="Filtrer par nom ou email…"
          value={patientFilter}
          onChange={(e) => setPatientFilter(e.target.value)}
          className={inputCls}
        />
        <select
          value={form.patientId}
          onChange={(e) => set("patientId", e.target.value)}
          className={inputCls}
          size={Math.min(filteredPatients.length + 1, 6)}
          required
        >
          <option value="">— Sélectionner —</option>
          {filteredPatients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.lastName} {p.firstName}{p.phone ? ` · ${p.phone}` : ""}
            </option>
          ))}
        </select>
        {selectedPatient && (
          <div className="flex items-center gap-2 px-3 py-2 bg-medical-50 dark:bg-medical-900/20 rounded-lg text-xs text-medical-700 dark:text-medical-300">
            <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
            {selectedPatient.firstName} {selectedPatient.lastName} · {selectedPatient.email}
          </div>
        )}
      </div>

      {/* Type d'examen */}
      <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700 p-5 space-y-3">
        <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm flex items-center gap-2">
          <FileText className="w-4 h-4 text-medical-600" /> Examen
        </h2>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Type d&apos;examen</label>
          <input
            value={form.examType}
            onChange={(e) => set("examType", e.target.value)}
            className={inputCls}
            placeholder="Ex : IRM Lombaire"
            list="exam-suggestions"
            required
          />
          <datalist id="exam-suggestions">
            {EXAM_SUGGESTIONS.map((s) => <option key={s} value={s} />)}
          </datalist>
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Détails (optionnel)</label>
          <textarea
            rows={2}
            value={form.examDetails}
            onChange={(e) => set("examDetails", e.target.value)}
            className={`${inputCls} resize-none`}
            placeholder="Précisions sur l'examen…"
          />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.urgency}
            onChange={(e) => set("urgency", e.target.checked)}
            className="rounded border-zinc-300 text-red-600 focus:ring-red-500"
          />
          <span className="text-sm text-zinc-700 dark:text-zinc-300">Urgent</span>
        </label>
      </div>

      {/* Date et notes */}
      <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700 p-5 space-y-3">
        <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm flex items-center gap-2">
          <Calendar className="w-4 h-4 text-medical-600" /> Planification
        </h2>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Date du rendez-vous</label>
          <input
            type="datetime-local"
            value={form.scheduledDate}
            onChange={(e) => set("scheduledDate", e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Notes (optionnel)</label>
          <textarea
            rows={2}
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            className={`${inputCls} resize-none`}
            placeholder="Instructions particulières…"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 bg-medical-600 hover:bg-medical-700 disabled:bg-medical-400 text-white font-semibold py-3 rounded-xl text-sm transition-all"
      >
        {isPending ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Création en cours…</>
        ) : (
          <><Calendar className="w-4 h-4" /> Créer le rendez-vous</>
        )}
      </button>
    </form>
  );
}
