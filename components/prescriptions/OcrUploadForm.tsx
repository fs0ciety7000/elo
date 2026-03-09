// ============================================================
// Formulaire Upload OCR — Flux Patient
// Étape 1 : Upload → Étape 2 : Résultat OCR → Étape 3 : Validation
// ============================================================

"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { processPrescriptionImage } from "@/lib/actions/ocr";
import { createPrescription } from "@/lib/actions/prescriptions";
import type { ParsedPrescription } from "@/lib/actions/ocr";
import {
  Upload,
  ScanLine,
  Loader2,
  CheckCircle,
  X,
  ImageIcon,
  Save,
  ArrowRight,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────
type Step = "upload" | "ocr-result" | "confirm";

// ── Composant principal ──────────────────────────────────────
export function OcrUploadForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rawText, setRawText] = useState<string>("");
  const [parsedData, setParsedData] = useState<ParsedPrescription | null>(null);

  // Champs éditables du formulaire de vérification
  const [examType, setExamType] = useState("");
  const [examDetails, setExamDetails] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [urgency, setUrgency] = useState(false);

  // ── Sélection du fichier ─────────────────────────────────
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setError(null);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreviewUrl(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  }

  // ── Drag & Drop ──────────────────────────────────────────
  const ALLOWED_TYPES = [
    "image/jpeg", "image/jpg", "image/png", "image/webp",
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
  ];

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !ALLOWED_TYPES.includes(file.type)) return;
    const dt = new DataTransfer();
    dt.items.add(file);
    if (fileInputRef.current) fileInputRef.current.files = dt.files;
    setSelectedFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreviewUrl(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  }

  // ── Lancement de l'OCR ───────────────────────────────────
  function handleOcr() {
    if (!selectedFile) return;
    setError(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.append("image", selectedFile);

      const result = await processPrescriptionImage(formData);

      if (result.success && result.parsedData) {
        setRawText(result.rawText ?? "");
        setParsedData(result.parsedData);
        setExamType(result.parsedData.examType);
        setExamDetails(result.parsedData.examDetails);
        setDiagnosis(result.parsedData.diagnosis);
        setNotes(result.parsedData.notes);
        setUrgency(result.parsedData.urgency);
        setStep("ocr-result");
      } else {
        setError(result.message ?? "Erreur OCR");
      }
    });
  }

  // ── Enregistrement final ─────────────────────────────────
  function handleSave() {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("examType", examType);
      formData.append("examDetails", examDetails);
      formData.append("diagnosis", diagnosis);
      formData.append("notes", notes);
      formData.append("urgency", String(urgency));
      formData.append("source", "OCR");
      formData.append("rawOcrText", rawText);

      // Upload de la pièce jointe originale
      if (selectedFile) {
        try {
          const uploadFd = new FormData();
          uploadFd.append("file", selectedFile);
          const uploadRes = await fetch("/api/upload", { method: "POST", body: uploadFd });
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            formData.append("attachmentUrl", uploadData.url);
            formData.append("attachmentName", uploadData.name);
            formData.append("attachmentSize", String(uploadData.size));
          }
        } catch {
          // Non bloquant : la prescription sera créée sans pièce jointe
        }
      }

      const result = await createPrescription(formData);
      if (result.success && result.data) {
        router.push(`/dashboard/prescriptions/${result.data.id}`);
      } else {
        setError(result.message);
      }
    });
  }

  // ── Réinitialisation ────────────────────────────────────
  function handleReset() {
    setStep("upload");
    setSelectedFile(null);
    setPreviewUrl(null);
    setParsedData(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // ── Rendu ────────────────────────────────────────────────

  // Étape 1 : Zone de dépôt d'image
  if (step === "upload") {
    return (
      <div className="space-y-4">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Zone de drop */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-zinc-300 rounded-2xl p-12 text-center cursor-pointer hover:border-medical-400 hover:bg-medical-50 transition-all group"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf,.pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileSelect}
            className="hidden"
          />

          {selectedFile ? (
            <div className="space-y-4">
              {previewUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={previewUrl}
                  alt="Aperçu de l'ordonnance"
                  className="max-h-64 mx-auto rounded-xl shadow-md object-contain"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto">
                  <Upload className="w-8 h-8 text-zinc-400" />
                </div>
              )}
              <div className="flex items-center justify-center gap-2 text-sm text-zinc-600">
                <CheckCircle className="w-4 h-4 text-green-500" />
                {selectedFile?.name} ({(selectedFile!.size / 1024 / 1024).toFixed(2)} Mo)
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleReset();
                }}
                className="text-xs text-zinc-400 hover:text-zinc-600 flex items-center gap-1 mx-auto"
              >
                <X className="w-3 h-3" /> Changer de fichier
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-zinc-100 group-hover:bg-medical-100 flex items-center justify-center mx-auto transition-colors">
                <ImageIcon className="w-8 h-8 text-zinc-400 group-hover:text-medical-600 transition-colors" />
              </div>
              <div>
                <p className="font-semibold text-zinc-700 mb-1">
                  Déposez votre ordonnance ici
                </p>
                <p className="text-sm text-zinc-400">
                  ou cliquez pour parcourir vos fichiers
                </p>
                <p className="text-xs text-zinc-300 mt-2">
                  JPEG, PNG, WebP, PDF ou Word (.docx) · Max 20 Mo
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bouton lancer l'OCR */}
        {selectedFile && (
          <button
            onClick={handleOcr}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 bg-medical-600 hover:bg-medical-700 disabled:bg-medical-400 text-white font-semibold py-4 rounded-xl transition-all"
          >
            {isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyse en cours par l&apos;IA...
              </>
            ) : (
              <>
                <ScanLine className="w-5 h-5" />
                Analyser l&apos;ordonnance
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </div>
    );
  }

  // Étape 2 & 3 : Vérification et correction des données extraites
  return (
    <div className="space-y-6">
      {/* Indicateur de succès OCR */}
      <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
        <div>
          <div className="font-semibold text-green-800 text-sm">
            Analyse OCR réussie
          </div>
          <div className="text-xs text-green-600">
            Vérifiez et corrigez les informations extraites avant d&apos;enregistrer
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6 space-y-5">
        <h2 className="font-semibold text-zinc-900">Informations extraites — à vérifier</h2>

        {/* Type d'examen */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">
            Type d&apos;examen *
          </label>
          <input
            type="text"
            value={examType}
            onChange={(e) => setExamType(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm outline-none focus:ring-2 focus:ring-medical-500 focus:border-medical-500 transition-all"
          />
        </div>

        {/* Motif */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">
            Motif / Diagnostic
          </label>
          <textarea
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            rows={2}
            className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm outline-none resize-none focus:ring-2 focus:ring-medical-500 focus:border-medical-500 transition-all"
          />
        </div>

        {/* Détails */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">
            Précisions techniques
          </label>
          <textarea
            value={examDetails}
            onChange={(e) => setExamDetails(e.target.value)}
            rows={2}
            className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm outline-none resize-none focus:ring-2 focus:ring-medical-500 focus:border-medical-500 transition-all"
          />
        </div>

        {/* Texte OCR brut (lecture seule) */}
        {rawText && (
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">
              Texte brut extrait (non modifiable)
            </label>
            <pre className="text-xs text-zinc-500 bg-zinc-50 border border-zinc-200 rounded-xl p-3 overflow-auto whitespace-pre-wrap font-mono max-h-32">
              {rawText}
            </pre>
          </div>
        )}

        {/* Urgence */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="urgency-ocr"
            checked={urgency}
            onChange={(e) => setUrgency(e.target.checked)}
            className="w-4 h-4 rounded border-red-300 text-red-600"
          />
          <label htmlFor="urgency-ocr" className="text-sm font-medium text-zinc-700">
            ⚡ Marquer comme urgent
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleReset}
          className="px-5 py-3 border border-zinc-200 text-zinc-600 rounded-xl text-sm font-medium hover:bg-zinc-50 transition-all"
        >
          ← Recommencer
        </button>
        <button
          onClick={handleSave}
          disabled={isPending || !examType}
          className="flex-1 flex items-center justify-center gap-2 bg-medical-600 hover:bg-medical-700 disabled:bg-medical-400 text-white font-semibold py-3 rounded-xl transition-all"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Confirmer et enregistrer
            </>
          )}
        </button>
      </div>
    </div>
  );
}
