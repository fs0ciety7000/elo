// ============================================================
// Dossier médical patient — DOCTOR / ADMIN
// ============================================================

import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getPatientFile } from "@/lib/actions/patients";
import { formatDate, STATUS_LABELS, STATUS_COLORS } from "@/lib/utils";
import { Role } from "@prisma/client";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  FileText,
  Heart,
  AlertTriangle,
  Pill,
  Plus,
  Clock,
  CheckCircle,
  Stethoscope,
  ArrowRight,
} from "lucide-react";
import { PatientFileEditForm } from "@/components/patients/PatientFileEditForm";
import { AssignDoctorForm } from "@/components/patients/AssignDoctorForm";
import { DoctorNotesForm } from "@/components/patients/DoctorNotesForm";
import { getDoctors } from "@/lib/actions/patients";

function InfoField({
  icon: Icon,
  label,
  value,
  alert,
}: {
  icon: React.ElementType;
  label: string;
  value: string | null | undefined;
  alert?: boolean;
}) {
  if (!value) return null;
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl ${alert ? "bg-red-50 border border-red-100" : "bg-zinc-50"}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${alert ? "bg-red-100" : "bg-white border border-zinc-200"}`}>
        <Icon className={`w-4 h-4 ${alert ? "text-red-600" : "text-zinc-500"}`} />
      </div>
      <div>
        <div className={`text-xs font-medium uppercase tracking-wide ${alert ? "text-red-500" : "text-zinc-400"}`}>
          {label}
        </div>
        <div className={`text-sm font-medium mt-0.5 whitespace-pre-wrap ${alert ? "text-red-800" : "text-zinc-900"}`}>
          {value}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[status] ?? "bg-zinc-100 text-zinc-600"}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export default async function PatientFilePage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === Role.PATIENT) redirect("/dashboard");

  const patient = await getPatientFile(params.id);
  if (!patient) notFound();

  const allDoctors = session.role === Role.ADMIN ? await getDoctors() : [];

  const prescriptions = patient.prescriptionsAsPatient;
  const scheduled = prescriptions.filter((p) => p.status === "SCHEDULED" && p.scheduledDate);
  const pending = prescriptions.filter((p) => p.status === "PENDING");
  const completed = prescriptions.filter((p) => p.status === "COMPLETED");

  const initials = `${patient.firstName[0]}${patient.lastName[0]}`;

  return (
    <div className="p-4 sm:p-8">
      {/* ── Navigation ── */}
      <div className="mb-6">
        <Link
          href="/dashboard/patients"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux patients
        </Link>
      </div>

      {/* ── En-tête patient ── */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm mb-6 p-5 sm:p-6">
        {/* Identité */}
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-2xl gradient-medical flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-lg sm:text-xl font-bold text-zinc-900 truncate">
              {patient.firstName} {patient.lastName}
            </h1>
            <p className="text-sm text-zinc-500 truncate">{patient.email}</p>
            {patient.birthDate && (
              <p className="text-xs text-zinc-400 mt-0.5">
                Né(e) le {formatDate(patient.birthDate)} ·{" "}
                {Math.floor((Date.now() - new Date(patient.birthDate).getTime()) / (365.25 * 24 * 3600 * 1000))} ans
              </p>
            )}
          </div>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-4 gap-3 pt-4 border-t border-zinc-100">
          {[
            { value: prescriptions.length, label: "Total", color: "text-zinc-900" },
            { value: pending.length, label: "En attente", color: "text-amber-600" },
            { value: scheduled.length, label: "Planifiés", color: "text-blue-600" },
            { value: completed.length, label: "Terminés", color: "text-green-600" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className={`font-bold text-xl ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-zinc-400 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Colonne gauche : infos + dossier ── */}
        <div className="space-y-4">

          {/* Infos de base */}
          <div className="bg-white rounded-xl border border-zinc-100 shadow-sm p-5">
            <h2 className="font-semibold text-zinc-900 text-sm mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-medical-600" /> Informations
            </h2>
            <div className="space-y-2">
              <InfoField icon={Mail} label="Email" value={patient.email} />
              <InfoField icon={Phone} label="Téléphone" value={patient.phone} />
              <InfoField icon={FileText} label="N° Registre national" value={patient.nationalId} />
              <InfoField icon={Calendar} label="Adresse" value={patient.address} />
              <InfoField icon={Heart} label="Groupe sanguin" value={patient.bloodType} />
              <InfoField icon={Calendar} label="Contact urgence" value={patient.emergencyContact} />
            </div>
          </div>

          {/* Dossier médical — alertes */}
          {(patient.allergies || patient.medicalHistory || patient.currentMeds) && (
            <div className="bg-white rounded-xl border border-zinc-100 shadow-sm p-5">
              <h2 className="font-semibold text-zinc-900 text-sm mb-3 flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-500" /> Dossier médical
              </h2>
              <div className="space-y-2">
                <InfoField icon={AlertTriangle} label="Allergies" value={patient.allergies} alert />
                <InfoField icon={Clock} label="Antécédents médicaux" value={patient.medicalHistory} />
                <InfoField icon={Pill} label="Traitements en cours" value={patient.currentMeds} />
              </div>
            </div>
          )}

          {/* Médecins assignés */}
          <div className="bg-white rounded-xl border border-zinc-100 shadow-sm p-5">
            <h2 className="font-semibold text-zinc-900 text-sm mb-3 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-medical-600" /> Médecins traitants
            </h2>
            {patient.assignedDoctors.length === 0 ? (
              <p className="text-xs text-zinc-400">Aucun médecin assigné</p>
            ) : (
              <div className="space-y-2">
                {patient.assignedDoctors.map((a) => (
                  <div key={a.doctorId} className="flex items-center gap-2 text-sm text-zinc-700">
                    <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center text-xs font-bold">
                      {a.doctor.firstName[0]}{a.doctor.lastName[0]}
                    </div>
                    <span>Dr. {a.doctor.firstName} {a.doctor.lastName}</span>
                    {a.doctor.speciality && (
                      <span className="text-xs text-zinc-400">· {a.doctor.speciality}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="mt-3">
              <AssignDoctorForm
                patientId={patient.id}
                currentDoctorIds={patient.assignedDoctors.map((a) => a.doctorId)}
                sessionRole={session.role}
                sessionDoctorId={session.id}
                allDoctors={allDoctors}
              />
            </div>
          </div>
        </div>

        {/* ── Colonne centrale : édition dossier ── */}
        <div className="space-y-4">
          <PatientFileEditForm patient={patient} />

          {/* Notes privées du médecin */}
          {session.role === Role.DOCTOR && (() => {
            const doctorAssignment = patient.assignedDoctors.find(
              (a) => a.doctorId === session.id
            );
            return (
              <DoctorNotesForm
                patientId={patient.id}
                initialNotes={doctorAssignment?.notes ?? ""}
                doctorName={`${session.firstName} ${session.lastName}`}
              />
            );
          })()}
        </div>

        {/* ── Colonne droite : prescriptions ── */}
        <div className="space-y-4">
          {/* Examens planifiés */}
          {scheduled.length > 0 && (
            <div className="bg-white rounded-xl border border-zinc-100 shadow-sm p-5">
              <h2 className="font-semibold text-zinc-900 text-sm mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" /> Examens planifiés
              </h2>
              <div className="space-y-2">
                {scheduled.map((p) => (
                  <Link
                    key={p.id}
                    href={`/dashboard/prescriptions/${p.id}`}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-zinc-50 transition-colors group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-blue-700 leading-none">
                        {new Date(p.scheduledDate!).getDate()}
                      </span>
                      <span className="text-xs text-blue-400 leading-none">
                        {new Date(p.scheduledDate!).toLocaleDateString("fr-BE", { month: "short" })}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-zinc-900 truncate">{p.examType}</div>
                      <div className="text-xs text-zinc-400">
                        {p.doctor ? `Dr. ${p.doctor.lastName}` : "—"}
                      </div>
                    </div>
                    <ArrowRight className="w-3 h-3 text-zinc-300 group-hover:text-zinc-500" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Historique des prescriptions */}
          <div className="bg-white rounded-xl border border-zinc-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-zinc-900 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-zinc-500" /> Historique
              </h2>
              <Link
                href={`/dashboard/prescriptions/new?patientEmail=${encodeURIComponent(patient.email)}`}
                className="text-xs text-medical-600 hover:text-medical-700 font-medium flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Nouvelle
              </Link>
            </div>

            {prescriptions.length === 0 ? (
              <p className="text-xs text-zinc-400 text-center py-4">Aucune prescription</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {prescriptions.map((p) => (
                  <Link
                    key={p.id}
                    href={`/dashboard/prescriptions/${p.id}`}
                    className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-zinc-50 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      {p.status === "COMPLETED" ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : p.status === "SCHEDULED" ? (
                        <Calendar className="w-4 h-4 text-blue-500" />
                      ) : (
                        <Clock className="w-4 h-4 text-amber-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-zinc-900 truncate">{p.examType}</div>
                      <div className="text-xs text-zinc-400">{formatDate(p.createdAt)}</div>
                    </div>
                    <StatusBadge status={p.status} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

