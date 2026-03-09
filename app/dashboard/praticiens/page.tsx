// ============================================================
// Mes Praticiens — Vue Patient
// Affiche les médecins assignés au patient connecté
// ============================================================

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Role } from "@prisma/client";
import { formatDate } from "@/lib/utils";
import {
  Stethoscope,
  Mail,
  Phone,
  Award,
  FileText,
  Calendar,
  Users,
  UserPlus,
} from "lucide-react";
import Link from "next/link";

export default async function PraticiensPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== Role.PATIENT) redirect("/dashboard");

  // Récupérer les médecins assignés à ce patient
  const assignments = await prisma.doctorPatient.findMany({
    where: { patientId: session.id },
    include: {
      doctor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          speciality: true,
          inami: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Récupérer aussi les médecins liés via les prescriptions
  const prescriptionDoctors = await prisma.prescription.findMany({
    where: {
      patientId: session.id,
      doctorId: { not: null },
    },
    include: {
      doctor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          speciality: true,
          inami: true,
        },
      },
    },
    distinct: ["doctorId"],
  });

  // Fusionner les deux sources (sans doublons)
  const assignedDoctorIds = new Set(assignments.map((a) => a.doctor.id));
  const prescriptionOnlyDoctors = prescriptionDoctors.filter(
    (p) => p.doctor && !assignedDoctorIds.has(p.doctor.id)
  );

  // Médecins mentionnés librement dans les prescriptions (sans compte)
  const freeTextDoctors = await prisma.prescription.findMany({
    where: {
      patientId: session.id,
      prescribingDoctorName: { not: null },
      doctorId: null,
    },
    select: {
      prescribingDoctorName: true,
      examType: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Dédupliquer par nom
  const uniqueFreeTextDoctors = Array.from(
    new Map(freeTextDoctors.map((p) => [p.prescribingDoctorName, p])).values()
  );

  return (
    <div className="p-8 max-w-4xl">
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
            <Users className="w-4 h-4 text-zinc-600" />
          </div>
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Santé</span>
        </div>
        <h1 className="font-display text-2xl font-bold text-zinc-900">Mes praticiens</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Vos médecins et prestataires de soins assignés
        </p>
      </div>

      {/* Aucun praticien */}
      {assignments.length === 0 && prescriptionOnlyDoctors.length === 0 && uniqueFreeTextDoctors.length === 0 && (
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-12 text-center">
          <div className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Stethoscope className="w-7 h-7 text-zinc-400" />
          </div>
          <h2 className="font-semibold text-zinc-800 mb-2">Aucun praticien assigné</h2>
          <p className="text-sm text-zinc-500 max-w-sm mx-auto">
            Vos médecins apparaîtront ici lorsqu&apos;ils vous auront assigné à leur liste de patients ou que vous aurez renseigné leur nom sur une prescription.
          </p>
        </div>
      )}

      {/* Médecins assignés (via DoctorPatient) */}
      {assignments.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">
            Médecins assignés
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {assignments.map((a) => (
              <DoctorCard
                key={a.doctor.id}
                doctor={a.doctor}
                notes={a.notes}
                since={a.createdAt}
                linked
              />
            ))}
          </div>
        </section>
      )}

      {/* Médecins liés via prescriptions (mais pas formellement assignés) */}
      {prescriptionOnlyDoctors.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">
            Médecins prescripteurs
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {prescriptionOnlyDoctors.map((p) =>
              p.doctor ? (
                <DoctorCard
                  key={p.doctor.id}
                  doctor={p.doctor}
                  linked
                />
              ) : null
            )}
          </div>
        </section>
      )}

      {/* Médecins mentionnés librement (sans compte) */}
      {uniqueFreeTextDoctors.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">
            Autres prescripteurs (non inscrits)
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {uniqueFreeTextDoctors.map((d) => (
              <div
                key={d.prescribingDoctorName}
                className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center flex-shrink-0">
                    <Stethoscope className="w-5 h-5 text-zinc-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-zinc-900 text-sm">
                      Dr. {d.prescribingDoctorName}
                    </div>
                    <div className="text-xs text-zinc-400 mt-0.5">
                      Non inscrit sur la plateforme
                    </div>
                    <div className="flex items-center gap-1 mt-2 text-xs text-zinc-400">
                      <FileText className="w-3 h-3" />
                      {d.examType}
                    </div>
                  </div>
                </div>
                <div className="mt-3 px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700">
                  Le lien sera établi automatiquement si ce médecin crée un compte &quot;Prestataire Médical&quot;.
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ── Composant carte praticien ──────────────────────────────────
function DoctorCard({
  doctor,
  notes,
  since,
  linked,
}: {
  doctor: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
    speciality?: string | null;
    inami?: string | null;
  };
  notes?: string | null;
  since?: Date;
  linked?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 space-y-4">
      {/* En-tête */}
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl gradient-medical flex items-center justify-center flex-shrink-0">
          <Stethoscope className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-zinc-900">
            Dr. {doctor.firstName} {doctor.lastName}
          </div>
          {doctor.speciality && (
            <div className="text-xs text-medical-600 font-medium mt-0.5">{doctor.speciality}</div>
          )}
          {linked && (
            <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 border border-green-200 rounded-full px-2 py-0.5 mt-1">
              <Award className="w-3 h-3" />
              Inscrit sur la plateforme
            </span>
          )}
        </div>
      </div>

      {/* Coordonnées */}
      <div className="space-y-1.5">
        <a
          href={`mailto:${doctor.email}`}
          className="flex items-center gap-2 text-xs text-zinc-500 hover:text-medical-600 transition-colors"
        >
          <Mail className="w-3.5 h-3.5 text-zinc-400" />
          {doctor.email}
        </a>
        {doctor.phone && (
          <a
            href={`tel:${doctor.phone}`}
            className="flex items-center gap-2 text-xs text-zinc-500 hover:text-medical-600 transition-colors"
          >
            <Phone className="w-3.5 h-3.5 text-zinc-400" />
            {doctor.phone}
          </a>
        )}
        {doctor.inami && (
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Award className="w-3.5 h-3.5 text-zinc-300" />
            INAMI : {doctor.inami}
          </div>
        )}
      </div>

      {/* Notes du médecin */}
      {notes && (
        <div className="px-3 py-2.5 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
          <div className="font-medium mb-1">Note du praticien</div>
          {notes}
        </div>
      )}

      {/* Date de relation */}
      {since && (
        <div className="flex items-center gap-1.5 text-xs text-zinc-400 pt-1 border-t border-zinc-50">
          <Calendar className="w-3 h-3" />
          Suivi depuis le {formatDate(since)}
        </div>
      )}
    </div>
  );
}
