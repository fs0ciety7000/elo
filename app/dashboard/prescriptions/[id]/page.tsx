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
  Download,
  Paperclip,
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
              <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center">
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
            <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {prescription.examType}
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
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
                <PrescriptionEditForm
                  prescription={{
                    id: prescription.id,
                    examType: prescription.examType,
                    examDetails: prescription.examDetails,
                    diagnosis: prescription.diagnosis,
                    notes: prescription.notes,
                    urgency: prescription.urgency,
                    status: prescription.status,
                    prescribingDoctorName: (prescription as { prescribingDoctorName?: string | null }).prescribingDoctorName,
                    scheduledDate: prescription.scheduledDate,
                  }}
                />
                <DeletePrescriptionButton prescriptionId={prescription.id} />
              </>
            )}
            <a
              href={`/api/prescriptions/${prescription.id}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              PDF
            </a>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* ── Colonne principale (2/3) ── */}
        <div className="md:col-span-2 space-y-4">
          {/* Informations médicales */}
          <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700 shadow-sm dark:shadow-zinc-900/50 p-6">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
              <Info className="w-4 h-4 text-medical-600" />
              Détails de l&apos;examen
            </h2>
            <dl className="space-y-3">
              {prescription.examDetails && (
                <div>
                  <dt className="text-xs text-zinc-400 font-medium uppercase tracking-wide mb-1">
                    Détails techniques
                  </dt>
                  <dd className="text-sm text-zinc-700 dark:text-zinc-300">{prescription.examDetails}</dd>
                </div>
              )}
              {prescription.diagnosis && (
                <div>
                  <dt className="text-xs text-zinc-400 font-medium uppercase tracking-wide mb-1">
                    Motif / Diagnostic
                  </dt>
                  <dd className="text-sm text-zinc-700 dark:text-zinc-300">{prescription.diagnosis}</dd>
                </div>
              )}
              {prescription.notes && (
                <div>
                  <dt className="text-xs text-zinc-400 font-medium uppercase tracking-wide mb-1">
                    Notes
                  </dt>
                  <dd className="text-sm text-zinc-700 dark:text-zinc-300">{prescription.notes}</dd>
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

          {/* Pièce jointe originale */}
          {prescription.attachmentUrl && (
            <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700 shadow-sm dark:shadow-zinc-900/50 p-6">
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-medical-600" />
                Ordonnance originale
              </h2>
              {/\.(jpg|jpeg|png|webp)$/i.test(prescription.attachmentName ?? "") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={prescription.attachmentUrl}
                  alt={prescription.attachmentName ?? "Pièce jointe"}
                  className="max-w-full rounded-lg border border-zinc-200 dark:border-zinc-700 mb-3"
                />
              ) : (
                <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-700 rounded-lg mb-3">
                  <Paperclip className="w-5 h-5 text-zinc-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-zinc-800 dark:text-zinc-100 truncate">
                      {prescription.attachmentName ?? "Fichier joint"}
                    </div>
                    {prescription.attachmentSize && (
                      <div className="text-xs text-zinc-400">
                        {(prescription.attachmentSize / 1024).toFixed(1)} Ko
                      </div>
                    )}
                  </div>
                </div>
              )}
              <a
                href={prescription.attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-medical-600 hover:text-medical-700 font-medium"
              >
                <Download className="w-4 h-4" />
                Télécharger / Visualiser
              </a>
            </div>
          )}

          {/* Texte OCR brut (si applicable) */}
          {prescription.rawOcrText && (
            <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700 shadow-sm dark:shadow-zinc-900/50 p-6">
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
                <ScanLine className="w-4 h-4 text-medical-600" />
                Texte extrait par OCR
              </h2>
              <pre className="text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-auto whitespace-pre-wrap font-mono">
                {prescription.rawOcrText}
              </pre>
            </div>
          )}

          {/* Personnes impliquées */}
          <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700 shadow-sm dark:shadow-zinc-900/50 p-6">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Intervenants</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-zinc-400" />
                  <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
                    Patient
                  </span>
                </div>
                <div className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                  {prescription.patient.firstName} {prescription.patient.lastName}
                </div>
                <div className="text-xs text-zinc-500">{prescription.patient.email}</div>
                {prescription.patient.phone && (
                  <div className="text-xs text-zinc-500">{prescription.patient.phone}</div>
                )}
              </div>

              {prescription.doctor && (
                <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Stethoscope className="w-4 h-4 text-zinc-400" />
                    <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
                      Médecin
                    </span>
                  </div>
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
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
          <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700 shadow-sm dark:shadow-zinc-900/50 p-4">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">
              Métadonnées
            </h3>
            <dl className="space-y-2">
              <div>
                <dt className="text-xs text-zinc-400">Référence</dt>
                <dd className="text-xs font-mono text-zinc-600 dark:text-zinc-400 break-all">{prescription.id}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-400">Créée le</dt>
                <dd className="text-xs text-zinc-600 dark:text-zinc-400">{formatDate(prescription.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-400">Mise à jour</dt>
                <dd className="text-xs text-zinc-600 dark:text-zinc-400">{formatDate(prescription.updatedAt)}</dd>
              </div>
              {prescription.completedAt && (
                <div>
                  <dt className="text-xs text-zinc-400">Complétée le</dt>
                  <dd className="text-xs text-zinc-600 dark:text-zinc-400">{formatDate(prescription.completedAt)}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Signature numérique SHA-256 */}
          {(prescription as { hash?: string | null }).hash && (
            <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700 shadow-sm dark:shadow-zinc-900/50 p-4">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                e-Prescription vérifiée
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">Hash SHA-256</p>
              <p className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 break-all leading-relaxed">
                {(prescription as { hash?: string | null }).hash}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
