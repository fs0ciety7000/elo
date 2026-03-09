// ============================================================
// Formulaire Nouvelle Prescription — Rôle DOCTOR / ADMIN
// Recherche par nom/email, création inline, pièce jointe
// ============================================================

"use client";

import { useState, useTransition, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createPrescription } from "@/lib/actions/prescriptions";
import { createPatientAccount } from "@/lib/actions/patients";
import {
  Loader2, Save, Search, UserPlus, CheckCircle, X, ChevronRight,
} from "lucide-react";

const EXAM_SUGGESTIONS = [
  "IRM Lombaire","IRM Cérébrale","IRM Genou","IRM Épaule","IRM Abdominale",
  "Scanner Thoracique","Scanner Abdominal","Scanner Cérébral","Scanner Pelvis",
  "Radiographie Thoracique","Radiographie Colonne Vertébrale","Radiographie Bassin",
  "Échographie Abdominale","Échographie Thyroïde","Échographie Pelvienne",
  "Mammographie","Scintigraphie Osseuse","PET Scan","Arthrographie","Densitométrie Osseuse",
];

const Schema = z.object({
  examType: z.string().min(3, "Le type d'examen est requis"),
  examDetails: z.string().optional(),
  diagnosis: z.string().optional(),
  notes: z.string().optional(),
  urgency: z.boolean().default(false),
});
type FormData = z.infer<typeof Schema>;

interface PatientResult {
  id: string; firstName: string; lastName: string; email: string;
}

export function NewPrescriptionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultEmail = searchParams.get("patientEmail") ?? "";

  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<PatientResult | null>(null);
  const [query, setQuery] = useState(defaultEmail);
  const [results, setResults] = useState<PatientResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPt, setNewPt] = useState({ firstName:"", lastName:"", phone:"", password:"" });
  const [creatingPt, startCreatingPt] = useTransition();
  const [examSuggestions, setExamSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(Schema),
  });
  const examType = watch("examType");

  const searchPatients = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setShowDropdown(false); setNotFound(false); return; }
    setSearching(true);
    setNotFound(false);
    try {
      const res = await fetch(`/api/patients/search?q=${encodeURIComponent(q)}`);
      const data: PatientResult[] = await res.json();
      setResults(data);
      setShowDropdown(data.length > 0);
      setNotFound(data.length === 0);
    } catch { /* ignore */ }
    finally { setSearching(false); }
  }, []);

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    setSelectedPatient(null);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => searchPatients(e.target.value), 300);
  }

  function selectPatient(p: PatientResult) {
    setSelectedPatient(p);
    setQuery(`${p.firstName} ${p.lastName}`);
    setShowDropdown(false);
    setShowCreateForm(false);
    setNotFound(false);
  }

  function clearPatient() {
    setSelectedPatient(null);
    setQuery(""); setResults([]); setShowDropdown(false); setNotFound(false);
  }

  function handleCreatePatient() {
    startCreatingPt(async () => {
      const fd = new FormData();
      fd.append("firstName", newPt.firstName);
      fd.append("lastName", newPt.lastName);
      fd.append("email", query);
      fd.append("phone", newPt.phone);
      fd.append("password", newPt.password);
      const result = await createPatientAccount(fd);
      if (result.success && result.data) {
        selectPatient({ id: result.data.id, firstName: newPt.firstName, lastName: newPt.lastName, email: query });
      } else {
        setServerError(result.message);
      }
    });
  }

  function handleExamInput(e: React.ChangeEvent<HTMLInputElement>) {
    setValue("examType", e.target.value);
    if (e.target.value.length >= 2) {
      const f = EXAM_SUGGESTIONS.filter((s) => s.toLowerCase().includes(e.target.value.toLowerCase()));
      setExamSuggestions(f); setShowSuggestions(f.length > 0);
    } else { setShowSuggestions(false); }
  }

  const onSubmit = (data: FormData) => {
    if (!selectedPatient) { setServerError("Veuillez sélectionner un patient."); return; }
    setServerError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("patientEmail", selectedPatient.email);
      fd.append("examType", data.examType);
      fd.append("source", "MANUAL");
      if (data.examDetails) fd.append("examDetails", data.examDetails);
      if (data.diagnosis) fd.append("diagnosis", data.diagnosis);
      if (data.notes) fd.append("notes", data.notes);
      fd.append("urgency", String(data.urgency));
      const result = await createPrescription(fd);
      if (result.success && result.data) router.push(`/dashboard/prescriptions/${result.data.id}`);
      else setServerError(result.message);
    });
  };

  const inputCls = "w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-medical-500 focus:border-medical-500";

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6 sm:p-8">
      {serverError && (
        <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
          <X className="w-4 h-4 flex-shrink-0" />{serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* ── Patient ── */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">Patient *</label>

          {selectedPatient ? (
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
              <div className="w-9 h-9 rounded-xl gradient-medical flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {selectedPatient.firstName[0]}{selectedPatient.lastName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-green-800">{selectedPatient.firstName} {selectedPatient.lastName}</div>
                <div className="text-xs text-green-600 truncate">{selectedPatient.email}</div>
              </div>
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              <button type="button" onClick={clearPatient} className="text-zinc-400 hover:text-red-500 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 z-10" />
              <input
                type="text"
                value={query}
                onChange={handleQueryChange}
                onFocus={() => results.length > 0 && setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                placeholder="Rechercher par nom, prénom ou email..."
                className={`${inputCls} pl-10 border-zinc-200 bg-zinc-50`}
              />
              {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 animate-spin" />}

              {showDropdown && results.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-zinc-200 rounded-xl shadow-lg overflow-hidden">
                  {results.map((p) => (
                    <button key={p.id} type="button" onMouseDown={() => selectPatient(p)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors text-left border-b border-zinc-100 last:border-0">
                      <div className="w-8 h-8 rounded-lg gradient-medical flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {p.firstName[0]}{p.lastName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-zinc-900">{p.firstName} {p.lastName}</div>
                        <div className="text-xs text-zinc-400 truncate">{p.email}</div>
                      </div>
                      <ChevronRight className="w-3 h-3 text-zinc-300" />
                    </button>
                  ))}
                </div>
              )}

              {notFound && !showCreateForm && (
                <div className="mt-2 flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <span className="text-xs text-amber-700">Aucun résultat pour &quot;{query}&quot;</span>
                  <button type="button" onClick={() => setShowCreateForm(true)}
                    className="flex items-center gap-1.5 text-xs font-medium text-medical-600 hover:text-medical-700">
                    <UserPlus className="w-3.5 h-3.5" /> Créer ce patient
                  </button>
                </div>
              )}
            </div>
          )}

          {showCreateForm && !selectedPatient && (
            <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-3">
              <h3 className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                <UserPlus className="w-4 h-4" /> Créer le compte patient
              </h3>
              <p className="text-xs text-blue-600">Email : <strong>{query}</strong></p>
              <div className="grid grid-cols-2 gap-3">
                <input value={newPt.firstName} onChange={(e) => setNewPt((p) => ({...p, firstName:e.target.value}))} placeholder="Prénom *" className="px-3 py-2 rounded-lg border border-blue-200 bg-white text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                <input value={newPt.lastName} onChange={(e) => setNewPt((p) => ({...p, lastName:e.target.value}))} placeholder="Nom *" className="px-3 py-2 rounded-lg border border-blue-200 bg-white text-sm outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <input type="tel" value={newPt.phone} onChange={(e) => setNewPt((p) => ({...p, phone:e.target.value}))} placeholder="Téléphone" className="w-full px-3 py-2 rounded-lg border border-blue-200 bg-white text-sm outline-none focus:ring-2 focus:ring-blue-400" />
              <input type="password" value={newPt.password} onChange={(e) => setNewPt((p) => ({...p, password:e.target.value}))} placeholder="Mot de passe temporaire (min. 8 car.) *" className="w-full px-3 py-2 rounded-lg border border-blue-200 bg-white text-sm outline-none focus:ring-2 focus:ring-blue-400" minLength={8} />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowCreateForm(false)} className="flex-1 py-2 border border-zinc-200 text-zinc-600 rounded-lg text-sm hover:bg-zinc-50">Annuler</button>
                <button type="button" onClick={handleCreatePatient} disabled={creatingPt || !newPt.firstName || !newPt.lastName || newPt.password.length < 8}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 rounded-lg text-sm">
                  {creatingPt ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />} Créer
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Examen ── */}
        <div className="relative">
          <label className="block text-sm font-medium text-zinc-700 mb-2">Type d&apos;examen *</label>
          <input type="text" value={examType ?? ""} onChange={handleExamInput} onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="Ex: IRM Lombaire, Scanner Thoracique..."
            className={`${inputCls} ${errors.examType ? "border-red-300 bg-red-50" : "border-zinc-200 bg-zinc-50"}`} />
          {showSuggestions && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-zinc-200 rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
              {examSuggestions.map((s) => (
                <button key={s} type="button" onMouseDown={() => { setValue("examType", s); setShowSuggestions(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-zinc-700 hover:bg-medical-50 hover:text-medical-700">{s}</button>
              ))}
            </div>
          )}
          {errors.examType && <p className="mt-1 text-xs text-red-600">{errors.examType.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">Précisions techniques</label>
          <textarea {...register("examDetails")} rows={2} placeholder="Séquences T1, T2..." className={`${inputCls} border-zinc-200 bg-zinc-50 resize-none`} />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">Motif / Diagnostic</label>
          <textarea {...register("diagnosis")} rows={2} placeholder="Lombalgies chroniques..." className={`${inputCls} border-zinc-200 bg-zinc-50 resize-none`} />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">Notes pour le radiologue</label>
          <textarea {...register("notes")} rows={2} placeholder="Contre-indications, informations complémentaires..." className={`${inputCls} border-zinc-200 bg-zinc-50 resize-none`} />
        </div>

        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl">
          <input {...register("urgency")} type="checkbox" id="urgency" className="w-4 h-4 rounded border-red-300 text-red-600" />
          <label htmlFor="urgency" className="text-sm font-medium text-red-800 cursor-pointer">
            ⚡ Marquer comme urgent
            <span className="block text-xs text-red-500 font-normal mt-0.5">L&apos;examen doit être réalisé dans les plus brefs délais</span>
          </label>
        </div>

        <button type="submit" disabled={isPending || !selectedPatient}
          className="w-full flex items-center justify-center gap-2 bg-medical-600 hover:bg-medical-700 disabled:bg-medical-400 text-white font-semibold py-3 rounded-xl transition-all">
          {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Création...</> : <><Save className="w-4 h-4" /> Créer la prescription</>}
        </button>
        {!selectedPatient && <p className="text-center text-xs text-zinc-400">Recherchez et sélectionnez un patient pour continuer</p>}
      </form>
    </div>
  );
}
