// ============================================================
// Server Actions — Gestion des patients (DOCTOR / ADMIN)
// ============================================================

"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Role } from "@prisma/client";
import type { ActionResult } from "./auth";
import { sendPatientAccountCreatedEmail } from "@/lib/email/send";

async function requireDoctorOrAdmin() {
  const session = await getSession();
  if (!session) throw new Error("Non authentifié");
  if (session.role === Role.PATIENT) throw new Error("Accès non autorisé");
  return session;
}

export async function getPatients() {
  const session = await getSession();
  if (!session || session.role === Role.PATIENT) return [];
  try {
    if (session.role === Role.ADMIN) {
      return await prisma.user.findMany({
        where: { role: Role.PATIENT },
        include: {
          _count: { select: { prescriptionsAsPatient: true } },
          assignedDoctors: {
            include: { doctor: { select: { id: true, firstName: true, lastName: true } } },
          },
        },
        orderBy: { lastName: "asc" },
      });
    }
    const assignments = await prisma.doctorPatient.findMany({
      where: { doctorId: session.id },
      include: {
        patient: {
          include: {
            _count: { select: { prescriptionsAsPatient: true } },
            assignedDoctors: {
              include: { doctor: { select: { id: true, firstName: true, lastName: true } } },
            },
          },
        },
      },
      orderBy: { patient: { lastName: "asc" } },
    });
    return assignments.map((a) => a.patient);
  } catch (error) {
    console.error("[getPatients] Erreur :", error);
    return [];
  }
}

export async function getPatientFile(patientId: string) {
  const session = await getSession();
  if (!session || session.role === Role.PATIENT) return null;
  try {
    const patient = await prisma.user.findUnique({
      where: { id: patientId, role: Role.PATIENT },
      include: {
        prescriptionsAsPatient: {
          include: {
            doctor: { select: { firstName: true, lastName: true, speciality: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        assignedDoctors: {
          include: {
            doctor: { select: { id: true, firstName: true, lastName: true, speciality: true } },
          },
        },
      },
    });
    if (!patient) return null;
    if (session.role === Role.DOCTOR) {
      const isAssigned = patient.assignedDoctors.some((a) => a.doctorId === session.id);
      if (!isAssigned) return null;
    }
    return patient;
  } catch (error) {
    console.error("[getPatientFile] Erreur :", error);
    return null;
  }
}

const UpdatePatientSchema = z.object({
  nationalId: z.string().optional(),
  birthDate: z.string().optional(),
  address: z.string().optional(),
  bloodType: z.string().optional(),
  allergies: z.string().optional(),
  medicalHistory: z.string().optional(),
  currentMeds: z.string().optional(),
  emergencyContact: z.string().optional(),
});

export async function updatePatientFile(
  patientId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireDoctorOrAdmin();
  } catch {
    return { success: false, message: "Accès non autorisé" };
  }
  const rawData = {
    nationalId: formData.get("nationalId") ?? undefined,
    birthDate: formData.get("birthDate") ?? undefined,
    address: formData.get("address") ?? undefined,
    bloodType: formData.get("bloodType") ?? undefined,
    allergies: formData.get("allergies") ?? undefined,
    medicalHistory: formData.get("medicalHistory") ?? undefined,
    currentMeds: formData.get("currentMeds") ?? undefined,
    emergencyContact: formData.get("emergencyContact") ?? undefined,
  };
  const validation = UpdatePatientSchema.safeParse(rawData);
  if (!validation.success) return { success: false, message: "Données invalides" };
  try {
    await prisma.user.update({
      where: { id: patientId },
      data: {
        nationalId: (validation.data.nationalId as string) || null,
        birthDate: validation.data.birthDate ? new Date(validation.data.birthDate as string) : null,
        address: (validation.data.address as string) || null,
        bloodType: (validation.data.bloodType as string) || null,
        allergies: (validation.data.allergies as string) || null,
        medicalHistory: (validation.data.medicalHistory as string) || null,
        currentMeds: (validation.data.currentMeds as string) || null,
        emergencyContact: (validation.data.emergencyContact as string) || null,
      },
    });
    revalidatePath(`/dashboard/patients/${patientId}`);
    return { success: true, message: "Dossier mis à jour" };
  } catch (error) {
    console.error("[updatePatientFile] Erreur :", error);
    return { success: false, message: "Erreur lors de la mise à jour" };
  }
}

export async function assignPatientToDoctor(
  patientId: string,
  doctorId: string
): Promise<ActionResult> {
  try {
    const session = await requireDoctorOrAdmin();
    const targetDoctorId = session.role === Role.ADMIN ? doctorId : session.id;
    await prisma.doctorPatient.upsert({
      where: { doctorId_patientId: { doctorId: targetDoctorId, patientId } },
      update: {},
      create: { doctorId: targetDoctorId, patientId },
    });
    revalidatePath("/dashboard/patients");
    revalidatePath(`/dashboard/patients/${patientId}`);
    return { success: true, message: "Patient assigné avec succès" };
  } catch (error) {
    console.error("[assignPatientToDoctor] Erreur :", error);
    return { success: false, message: "Erreur lors de l'assignation" };
  }
}

export async function unassignPatientFromDoctor(
  patientId: string,
  doctorId: string
): Promise<ActionResult> {
  try {
    await requireDoctorOrAdmin();
    await prisma.doctorPatient.deleteMany({ where: { doctorId, patientId } });
    revalidatePath("/dashboard/patients");
    revalidatePath(`/dashboard/patients/${patientId}`);
    return { success: true, message: "Patient retiré" };
  } catch (error) {
    console.error("[unassignPatientFromDoctor] Erreur :", error);
    return { success: false, message: "Erreur lors du retrait" };
  }
}

const CreatePatientSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email("Email invalide"),
  phone: z.string().optional(),
  password: z.string().min(8, "Minimum 8 caractères"),
});

export async function createPatientAccount(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  let session;
  try {
    session = await requireDoctorOrAdmin();
  } catch {
    return { success: false, message: "Accès non autorisé" };
  }
  const rawData = {
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone") ?? undefined,
    password: formData.get("password"),
  };
  const validation = CreatePatientSchema.safeParse(rawData);
  if (!validation.success) {
    return { success: false, message: "Données invalides", errors: validation.error.flatten().fieldErrors };
  }
  try {
    const existing = await prisma.user.findUnique({ where: { email: validation.data.email } });
    if (existing) return { success: false, message: "Un compte existe déjà avec cet email" };
    const hashedPassword = await bcrypt.hash(validation.data.password, 12);
    const patient = await prisma.user.create({
      data: {
        firstName: validation.data.firstName,
        lastName: validation.data.lastName,
        email: validation.data.email,
        phone: validation.data.phone || null,
        password: hashedPassword,
        role: Role.PATIENT,
      },
    });
    if (session.role === Role.DOCTOR) {
      await prisma.doctorPatient.create({ data: { doctorId: session.id, patientId: patient.id } });
    }

    // Email de création de compte par le médecin (non bloquant)
    const doctorName = session.role === Role.DOCTOR
      ? `Dr. ${session.firstName} ${session.lastName}`
      : "Antigravity Medical";
    sendPatientAccountCreatedEmail(patient.email, {
      patientName: `${patient.firstName} ${patient.lastName}`,
      doctorName,
      email: patient.email,
      temporaryPassword: validation.data.password,
    }).catch((err) => console.error("[createPatientAccount] Erreur email :", err));

    revalidatePath("/dashboard/patients");
    return { success: true, message: "Compte patient créé", data: { id: patient.id } };
  } catch (error) {
    console.error("[createPatientAccount] Erreur :", error);
    return { success: false, message: "Erreur lors de la création" };
  }
}

export async function getDoctors() {
  const session = await getSession();
  if (!session || session.role !== Role.ADMIN) return [];
  return await prisma.user.findMany({
    where: { role: { in: [Role.DOCTOR, Role.ADMIN] } },
    select: { id: true, firstName: true, lastName: true, speciality: true },
    orderBy: { lastName: "asc" },
  });
}

// ── Sauvegarder les notes du médecin sur un patient ──────────
export async function saveDoctorNotes(
  patientId: string,
  notes: string
): Promise<ActionResult> {
  try {
    const session = await requireDoctorOrAdmin();
    await prisma.doctorPatient.upsert({
      where: { doctorId_patientId: { doctorId: session.id, patientId } },
      update: { notes },
      create: { doctorId: session.id, patientId, notes },
    });
    revalidatePath(`/dashboard/patients/${patientId}`);
    return { success: true, message: "Notes sauvegardées" };
  } catch (error) {
    console.error("[saveDoctorNotes] Erreur :", error);
    return { success: false, message: "Erreur lors de la sauvegarde" };
  }
}
