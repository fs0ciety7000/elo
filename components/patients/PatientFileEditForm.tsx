"use client";

import { useState, useTransition } from "react";
import { updatePatientFile } from "@/lib/actions/patients";
import { Save, Loader2, Pencil, CheckCircle, X } from "lucide-react";

type PatientData = {
  id: string;
  nationalId?: string | null;
  birthDate?: Date | null;
  address?: string | null;
  bloodType?: string | null;
  allergies?: string | null;
  medicalHistory?: string | null;
  currentMeds?: string | null;
  emergencyContact?: string | null;
};

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export function PatientFileEditForm({ patient }: { patient: PatientData }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const toDateString = (d: Date | null | undefined) => {
    if (!d) return "";
    return new Date(d).toISOString().split("T")[0];
  };

  const [form, setForm] = useState({
    nationalId: patient.nationalId ?? "",
    birthDate: toDateString(patient.birthDate),
    address: patient.address ?? "",
    bloodType: patient.bloodType ?? "",
    allergies: patient.allergies ?? "",
    medicalHistory: patient.medicalHistory ?? "",
    currentMeds: patient.currentMeds ?? "",
    emergencyContact: patient.emergencyContact ?? "",
  });

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      const result = await updatePatientFile(patient.id, fd);
      setMessage({ type: result.success ? "success" : "error", text: result.message });
      if (result.success) setIsEditing(false);
    });
  }

  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-sm outline-none focus:ring-2 focus:ring-medical-500 focus:border-medical-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all";
  const textareaCls = `${inputCls} resize-none`;

  return (
    <div className="bg-white rounded-xl border border-zinc-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-zinc-900 text-sm flex items-center gap-2">
          <Pencil className="w-4 h-4 text-medical-600" />
          Dossier médical
        </h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs text-medical-600 hover:text-medical-700 font-medium"
          >
            Modifier
          </button>
        )}
      </div>

      {message && (
        <div className={`mb-3 p-3 rounded-xl text-xs flex items-center gap-2 ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {message.type === "success" ? <CheckCircle className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">N° Registre national</label>
            <input value={form.nationalId} onChange={(e) => set("nationalId", e.target.value)} disabled={!isEditing} className={inputCls} placeholder="XX.XX.XX-XXX.XX" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Date de naissance</label>
            <input type="date" value={form.birthDate} onChange={(e) => set("birthDate", e.target.value)} disabled={!isEditing} className={inputCls} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Groupe sanguin</label>
            <select value={form.bloodType} onChange={(e) => set("bloodType", e.target.value)} disabled={!isEditing} className={inputCls}>
              <option value="">—</option>
              {BLOOD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Contact urgence</label>
            <input value={form.emergencyContact} onChange={(e) => set("emergencyContact", e.target.value)} disabled={!isEditing} className={inputCls} placeholder="Nom +32..." />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">Adresse</label>
          <input value={form.address} onChange={(e) => set("address", e.target.value)} disabled={!isEditing} className={inputCls} placeholder="Rue, Ville, Code postal" />
        </div>

        <div>
          <label className="block text-xs font-medium text-red-500 mb-1">⚠ Allergies</label>
          <textarea rows={2} value={form.allergies} onChange={(e) => set("allergies", e.target.value)} disabled={!isEditing} className={`${textareaCls} border-red-200 bg-red-50 focus:ring-red-400 focus:border-red-400`} placeholder="Pénicilline, Aspirine..." />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">Antécédents médicaux</label>
          <textarea rows={3} value={form.medicalHistory} onChange={(e) => set("medicalHistory", e.target.value)} disabled={!isEditing} className={textareaCls} placeholder="Maladies chroniques, interventions chirurgicales..." />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">Traitements en cours</label>
          <textarea rows={2} value={form.currentMeds} onChange={(e) => set("currentMeds", e.target.value)} disabled={!isEditing} className={textareaCls} placeholder="Médicaments, posologies..." />
        </div>

        {isEditing && (
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => setIsEditing(false)} className="flex-1 px-4 py-2.5 border border-zinc-200 text-zinc-600 rounded-xl text-sm font-medium hover:bg-zinc-50 transition-all">
              Annuler
            </button>
            <button type="submit" disabled={isPending} className="flex-1 flex items-center justify-center gap-2 bg-medical-600 hover:bg-medical-700 disabled:bg-medical-400 text-white font-semibold py-2.5 rounded-xl text-sm transition-all">
              {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Sauvegarde...</> : <><Save className="w-4 h-4" /> Enregistrer</>}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
