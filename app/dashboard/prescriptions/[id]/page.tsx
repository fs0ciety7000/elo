// ============================================================
// Page Détail d'une Prescription — Antigravity Medical SaaS
// Affiche le QR Code, les détails et permet la mise à jour du statut
// ============================================================

import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate, STATUS_LABELS, STATUS_COLORS, ROLE_LABELS } from "@/lib/utils";
import { Role } from "@prisma/client";
import { PrescriptionQrCode } from "@/components/prescriptions/PrescriptionQrCode";
import { StatusUpdateForm } from "@/components/prescriptions/StatusUpdateForm";
import { PrescriptionEditForm } from "@/components/prescriptions/PrescriptionEditForm";
import { DeletePrescriptionButton } from "@/components/prescriptions/DeletePrescriptionButton";
import {
  FileText,
  ScanLine,
  User,
  Stethoscope,
  Calendar,
  Info,
  AlertTriangle,
} from "lucide-react";

// ── Page principale ──────────────────────────────────────────
export default async function PrescriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;

  // Récupération de la prescription avec les relations
  const prescription = await prisma.prescription.findUnique({
    where: { id },
    include: {
      patient: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      doctor: {
        select: {
          firstName: true,
          lastName: true,
          speciality: true,
          inami: true,
        },
      },
    },
  });

  if (!prescription) notFound();

  // Contrôle d'accès : le patient ne voit que ses propres prescriptions
  if (
    session.role === Role.PATIENT &&
    prescription.patientId !== session.id
  ) {
    redirect("/dashboard");
  }

  const isDoctor = session.role === Role.DOCTOR || session.role === Role.ADMIN;
  const canUpdateStatus = isDoctor;

  // Peut modifier/supprimer : admin = tous, doctor = les siennes, patient = les siennes
  const canEdit =
    session.role === Role.ADMIN ||
    (session.role === Role.DOCTOR && prescription.doctorId === session.id) ||
    (session.role === Role.PATIENT && prescription.patientId === session.id);

  return (
    <div className="p-8 max-w-4xl">
      {/* ── En-tête ── */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
                {prescription.source === "OCR" ? (
                  <ScanLine className="w-4 h-4 text-zinc-600" />
                ) : (
                  <FileText className="w-4 h-4 text-zinc-600" />
                )}
              </div>
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
                {prescription.source === "OCR" ? "Numérisation OCR" : "Encodage manuel"}
              </span>
            </div>
            <h1 className="font-display text-2xl font-bold text-zinc-900">
              {prescription.examType}
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              Prescription du {formatDate(prescription.createdAt)}
            </p>
          </div>

          {/* Statut + Urgence + Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {prescription.urgency && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-medium">
                <AlertTriangle className="w-4 h-4" />
                Urgent
              </span>
            )}
            <span
              className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium border ${STATUS_COLORS[prescription.status] ?? ""}`}
            >
              {STATUS_LABELS[prescription.status]}
            </span>
            {canEdit && (
              <>
                <PrescriptionEditForm prescription={prescription} />
                <DeletePrescriptionButton prescriptionId={prescription.id} />
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* ── Colonne principale (2/3) ── */}
        <div className="md:col-span-2 space-y-4">
          {/* Informations médicales */}
          <div className="bg-white rounded-xl border border-zinc-100 shadow-sm p-6">
            <h2 className="font-semibold text-zinc-900 mb-4 flex items-center gap-2">
              <Info className="w-4 h-4 text-medical-600" />
              Détails de l&apos;examen
            </h2>
            <dl className="space-y-3">
              {prescription.examDetails && (
                <div>
                  <dt className="text-xs text-zinc-400 font-medium uppercase tracking-wide mb-1">
                    Détails techniques
                  </dt>
                  <dd className="text-sm text-zinc-700">{prescription.examDetails}</dd>
                </div>
              )}
              {prescription.diagnosis && (
                <div>
                  <dt className="text-xs text-zinc-400 font-medium uppercase tracking-wide mb-1">
                    Motif / Diagnostic
                  </dt>
                  <dd className="text-sm text-zinc-700">{prescription.diagnosis}</dd>
                </div>
              )}
              {prescription.notes && (
                <div>
                  <dt className="text-xs text-zinc-400 font-medium uppercase tracking-wide mb-1">
                    Notes
                  </dt>
                  <dd className="text-sm text-zinc-700">{prescription.notes}</dd>
                </div>
              )}
              {prescription.scheduledDate && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <div>
                    <div className="text-xs text-blue-500 font-medium">Date planifiée</div>
                    <div className="text-sm font-medium text-blue-800">
                      {formatDate(prescription.scheduledDate, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                    </div>
                  </div>
                </div>
              )}
            </dl>
          </div>

          {/* Texte OCR brut (si applicable) */}
          {prescription.rawOcrText && (
            <div className="bg-white rounded-xl border border-zinc-100 shadow-sm p-6">
              <h2 className="font-semibold text-zinc-900 mb-3 flex items-center gap-2">
                <ScanLine className="w-4 h-4 text-medical-600" />
                Texte extrait par OCR
              </h2>
              <pre className="text-xs text-zinc-600 bg-zinc-50 p-4 rounded-lg border border-zinc-200 overflow-auto whitespace-pre-wrap font-mono">
                {prescription.rawOcrText}
              </pre>
            </div>
          )}

          {/* Personnes impliquées */}
          <div className="bg-white rounded-xl border border-zinc-100 shadow-sm p-6">
            <h2 className="font-semibold text-zinc-900 mb-4">Intervenants</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-zinc-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-zinc-400" />
                  <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
                    Patient
                  </span>
                </div>
                <div className="font-semibold text-zinc-900 text-sm">
                  {prescription.patient.firstName} {prescription.patient.lastName}
                </div>
                <div className="text-xs text-zinc-500">{prescription.patient.email}</div>
                {prescription.patient.phone && (
                  <div className="text-xs text-zinc-500">{prescription.patient.phone}</div>
                )}
              </div>

              {prescription.doctor && (
                <div className="p-4 bg-zinc-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Stethoscope className="w-4 h-4 text-zinc-400" />
                    <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
                      Médecin
                    </span>
                  </div>
                  <div className="font-semibold text-zinc-900 text-sm">
                    Dr. {prescription.doctor.firstName} {prescription.doctor.lastName}
                  </div>
                  {prescription.doctor.speciality && (
                    <div className="text-xs text-zinc-500">
                      {prescription.doctor.speciality}
                    </div>
                  )}
                  {prescription.doctor.inami && (
                    <div className="text-xs text-zinc-400">
                      INAMI : {prescription.doctor.inami}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Mise à jour du statut (médecins uniquement) */}
          {canUpdateStatus && (
            <StatusUpdateForm
              prescriptionId={prescription.id}
              currentStatus={prescription.status}
            />
          )}
        </div>

        {/* ── Colonne QR Code (1/3) ── */}
        <div className="space-y-4">
          <PrescriptionQrCode
            prescriptionId={prescription.id}
            qrCode={prescription.qrCode}
            examType={prescription.examType}
          />

          {/* Métadonnées */}
          <div className="bg-white rounded-xl border border-zinc-100 shadow-sm p-4">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">
              Métadonnées
            </h3>
            <dl className="space-y-2">
              <div>
                <dt className="text-xs text-zinc-400">Référence</dt>
                <dd className="text-xs font-mono text-zinc-600 break-all">{prescription.id}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-400">Créée le</dt>
                <dd className="text-xs text-zinc-600">{formatDate(prescription.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-400">Mise à jour</dt>
                <dd className="text-xs text-zinc-600">{formatDate(prescription.updatedAt)}</dd>
              </div>
              {prescription.completedAt && (
                <div>
                  <dt className="text-xs text-zinc-400">Complétée le</dt>
                  <dd className="text-xs text-zinc-600">{formatDate(prescription.completedAt)}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
