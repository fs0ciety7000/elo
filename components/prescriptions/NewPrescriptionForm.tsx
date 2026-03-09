// ============================================================
// Formulaire Nouvelle Prescription — Rôle DOCTOR / ADMIN
// Recherche patient par email, ou création inline si inexistant
// ============================================================

"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createPrescription } from "@/lib/actions/prescriptions";
import { createPatientAccount } from "@/lib/actions/patients";
import {
  Loader2, Save, User, Search, UserPlus, CheckCircle, X,
} from "lucide-react";

// ── Suggestions d'examens ─────────────────────────────────────
const EXAM_SUGGESTIONS = [
  "IRM Lombaire", "IRM Cérébrale", "IRM Genou", "IRM Épaule",
  "Scanner Thoracique", "Scanner Abdominal", "Scanner Cérébral",
  "Radiographie Thoracique", "Radiographie Colonne Vertébrale",
  "Échographie Abdominale", "Échographie Thyroïde",
  "Mammographie", "Scintigraphie Osseuse", "PET Scan", "Arthrographie",
];

const Schema = z.object({
  patientEmail: z.string().email("Email patient invalide"),
  examType: z.string().min(3, "Le type d'examen est requis"),
  examDetails: z.string().optional(),
  diagnosis: z.string().optional(),
  notes: z.string().optional(),
  urgency: z.boolean().default(false),
});

type FormData = z.infer<typeof Schema>;

// ── Statut de vérification patient ────────────────────────────
type PatientStatus =
  | { type: "idle" }
  | { type: "checking" }
  | { type: "found"; name: string }
  | { type: "not_found" };

// ── Données de création d'un nouveau patient ──────────────────
interface NewPatientData {
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
}

// ── Composant principal ───────────────────────────────────────
export function NewPrescriptionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultEmail = searchParams.get("patientEmail") ?? "";

  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [examSuggestions, setExamSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [patientStatus, setPatientStatus] = useState<PatientStatus>({ type: "idle" });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPatient, setNewPatient] = useState<NewPatientData>({
    firstName: "", lastName: "", phone: "", password: "",
  });
  const [creatingPatient, startCreatingPatient] = useTransition();

  const {
    register, handleSubmit, setValue, watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(Schema),
    defaultValues: { patientEmail: defaultEmail },
  });

  const examType = watch("examType");
  const patientEmail = watch("patientEmail");

  // ── Vérification de l'existence du patient ────────────────
  async function checkPatient(email: string) {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    setPatientStatus({ type: "checking" });
    try {
      const res = await fetch(`/api/patients/check?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.found) {
        setPatientStatus({ type: "found", name: data.name });
        setShowCreateForm(false);
      } else {
        setPatientStatus({ type: "not_found" });
      }
    } catch {
      setPatientStatus({ type: "idle" });
    }
  }

  // ── Création du patient inline ────────────────────────────
  function handleCreatePatient() {
    startCreatingPatient(async () => {
      const fd = new FormData();
      fd.append("firstName", newPatient.firstName);
      fd.append("lastName", newPatient.lastName);
      fd.append("email", patientEmail);
      fd.append("phone", newPatient.phone);
      fd.append("password", newPatient.password);
      const result = await createPatientAccount(fd);
      if (result.success) {
        setPatientStatus({ type: "found", name: `${newPatient.firstName} ${newPatient.lastName}` });
        setShowCreateForm(false);
      } else {
        setServerError(result.message);
      }
    });
  }

  // ── Autocomplétion examens ────────────────────────────────
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

  // ── Soumission ────────────────────────────────────────────
  const onSubmit = (data: FormData) => {
    if (patientStatus.type !== "found") {
      setServerError("Veuillez d'abord vérifier et confirmer le patient.");
      return;
    }
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

  const inputCls = "w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-medical-500 focus:border-medical-500";

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6 sm:p-8">
      {serverError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* ── Email du patient + vérification ── */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">
            Patient *
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                {...register("patientEmail")}
                type="email"
                placeholder="patient@exemple.com"
                onBlur={(e) => checkPatient(e.target.value)}
                className={`${inputCls} pl-10 ${errors.patientEmail ? "border-red-300 bg-red-50" : "border-zinc-200 bg-zinc-50"}`}
              />
            </div>
            <button
              type="button"
              onClick={() => checkPatient(patientEmail)}
              className="px-4 py-3 bg-zinc-100 hover:bg-zinc-200 rounded-xl text-sm font-medium text-zinc-600 transition-all flex items-center gap-2 flex-shrink-0"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Vérifier</span>
            </button>
          </div>

          {/* Feedback statut patient */}
          {patientStatus.type === "checking" && (
            <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
              <Loader2 className="w-3 h-3 animate-spin" /> Recherche en cours...
            </div>
          )}
          {patientStatus.type === "found" && (
            <div className="mt-2 flex items-center gap-2 text-xs text-green-700 bg-green-50 px-3 py-2 rounded-lg">
              <CheckCircle className="w-3.5 h-3.5" />
              Patient trouvé : <strong>{(patientStatus as { type: "found"; name: string }).name}</strong>
            </div>
          )}
          {patientStatus.type === "not_found" && !showCreateForm && (
            <div className="mt-2 flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 text-xs text-amber-700">
                <X className="w-3.5 h-3.5" />
                Aucun compte trouvé pour cet email.
              </div>
              <button
                type="button"
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-1.5 text-xs font-medium text-medical-600 hover:text-medical-700"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Créer le patient
              </button>
            </div>
          )}

          {/* Formulaire de création rapide */}
          {showCreateForm && (
            <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-3">
              <h3 className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                <UserPlus className="w-4 h-4" /> Créer le compte patient
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    value={newPatient.firstName}
                    onChange={(e) => setNewPatient((p) => ({ ...p, firstName: e.target.value }))}
                    placeholder="Prénom *"
                    className="w-full px-3 py-2 rounded-lg border border-blue-200 bg-white text-sm outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <input
                    value={newPatient.lastName}
                    onChange={(e) => setNewPatient((p) => ({ ...p, lastName: e.target.value }))}
                    placeholder="Nom *"
                    className="w-full px-3 py-2 rounded-lg border border-blue-200 bg-white text-sm outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>
              <input
                type="tel"
                value={newPatient.phone}
                onChange={(e) => setNewPatient((p) => ({ ...p, phone: e.target.value }))}
                placeholder="Téléphone"
                className="w-full px-3 py-2 rounded-lg border border-blue-200 bg-white text-sm outline-none focus:ring-2 focus:ring-blue-400"
              />
              <input
                type="password"
                value={newPatient.password}
                onChange={(e) => setNewPatient((p) => ({ ...p, password: e.target.value }))}
                placeholder="Mot de passe temporaire (min. 8 car.) *"
                className="w-full px-3 py-2 rounded-lg border border-blue-200 bg-white text-sm outline-none focus:ring-2 focus:ring-blue-400"
                minLength={8}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 py-2 border border-zinc-200 text-zinc-600 rounded-lg text-sm hover:bg-zinc-50 transition-all"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleCreatePatient}
                  disabled={creatingPatient || !newPatient.firstName || !newPatient.lastName || newPatient.password.length < 8}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 rounded-lg text-sm transition-all"
                >
                  {creatingPatient ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  Créer
                </button>
              </div>
            </div>
          )}

          {errors.patientEmail && (
            <p className="mt-1 text-xs text-red-600">{errors.patientEmail.message}</p>
          )}
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
              className={`${inputCls} pl-10 ${errors.examType ? "border-red-300 bg-red-50" : "border-zinc-200 bg-zinc-50"}`}
            />
          </div>

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

        {/* ── Précisions ── */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">Précisions techniques</label>
          <textarea
            {...register("examDetails")}
            rows={2}
            placeholder="Séquences T1, T2 — rachis lombo-sacré complet..."
            className={`${inputCls} border-zinc-200 bg-zinc-50 resize-none`}
          />
        </div>

        {/* ── Diagnostic ── */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">Motif / Diagnostic</label>
          <textarea
            {...register("diagnosis")}
            rows={2}
            placeholder="Lombalgies chroniques avec irradiation sciatique..."
            className={`${inputCls} border-zinc-200 bg-zinc-50 resize-none`}
          />
        </div>

        {/* ── Notes ── */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">Notes pour le radiologue</label>
          <textarea
            {...register("notes")}
            rows={2}
            placeholder="Informations complémentaires, contre-indications..."
            className={`${inputCls} border-zinc-200 bg-zinc-50 resize-none`}
          />
        </div>

        {/* ── Urgence ── */}
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

        {/* ── Submit ── */}
        <button
          type="submit"
          disabled={isPending || patientStatus.type !== "found"}
          className="w-full flex items-center justify-center gap-2 bg-medical-600 hover:bg-medical-700 disabled:bg-medical-400 text-white font-semibold py-3 rounded-xl transition-all"
        >
          {isPending ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Création en cours...</>
          ) : (
            <><Save className="w-4 h-4" /> Créer la prescription</>
          )}
        </button>

        {patientStatus.type !== "found" && (
          <p className="text-center text-xs text-zinc-400">
            Vérifiez d&apos;abord le patient en cliquant sur &quot;Vérifier&quot;
          </p>
        )}
      </form>
    </div>
  );
}
