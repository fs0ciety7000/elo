// ============================================================
// Server Actions — Gestion des prescriptions
// createPrescription, updatePrescriptionStatus, getUserPrescriptions
// ============================================================

"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Role, PrescriptionStatus } from "@prisma/client";
import { sendPrescriptionEmail } from "@/lib/email/send";
import type { ActionResult } from "./auth";

// ── Schéma de validation pour la création d'une prescription ─
const CreatePrescriptionSchema = z.object({
  patientEmail: z.string().email("Email patient invalide").optional(),
  patientId: z.string().optional(),
  examType: z.string().min(3, "Le type d'examen est requis"),
  examDetails: z.string().optional(),
  diagnosis: z.string().optional(),
  notes: z.string().optional(),
  urgency: z.boolean().default(false),
  source: z.enum(["MANUAL", "OCR"]),
  rawOcrText: z.string().optional(),
});

// ── Action : Création d'une prescription (DOCTOR & PATIENT) ──
export async function createPrescription(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const session = await getSession();
  if (!session) {
    return { success: false, message: "Non authentifié" };
  }

  const rawData = {
    patientEmail: formData.get("patientEmail") as string | undefined,
    patientId: formData.get("patientId") as string | undefined,
    examType: formData.get("examType") as string,
    examDetails: formData.get("examDetails") as string | undefined,
    diagnosis: formData.get("diagnosis") as string | undefined,
    notes: formData.get("notes") as string | undefined,
    urgency: formData.get("urgency") === "true",
    source: (formData.get("source") as string) ?? "MANUAL",
    rawOcrText: formData.get("rawOcrText") as string | undefined,
  };

  const validation = CreatePrescriptionSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      message: "Données invalides",
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const data = validation.data;

  try {
    let patientId: string;
    let doctorId: string | undefined;

    if (session.role === Role.DOCTOR || session.role === Role.ADMIN) {
      // Le médecin prescrit pour un patient identifié par email ou ID
      doctorId = session.id;

      if (data.patientEmail) {
        const patient = await prisma.user.findUnique({
          where: { email: data.patientEmail },
        });
        if (!patient) {
          return {
            success: false,
            message: `Aucun patient trouvé avec l'email : ${data.patientEmail}`,
          };
        }
        patientId = patient.id;
      } else if (data.patientId) {
        patientId = data.patientId;
      } else {
        return { success: false, message: "Email ou ID du patient requis" };
      }
    } else {
      // Le patient soumet sa propre prescription (via OCR)
      patientId = session.id;
    }

    // Création de la prescription en base
    const prescription = await prisma.prescription.create({
      data: {
        patientId,
        doctorId,
        examType: data.examType,
        examDetails: data.examDetails,
        diagnosis: data.diagnosis,
        notes: data.notes,
        urgency: data.urgency,
        source: data.source as "MANUAL" | "OCR",
        rawOcrText: data.rawOcrText,
        status: "PENDING",
      },
      include: {
        patient: true,
        doctor: true,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "CREATE_PRESCRIPTION",
        entity: "Prescription",
        entityId: prescription.id,
        metadata: { source: data.source, examType: data.examType },
      },
    });

    // Envoi de l'email de confirmation au patient
    try {
      await sendPrescriptionEmail(prescription.patient.email, {
        patientName: `${prescription.patient.firstName} ${prescription.patient.lastName}`,
        doctorName: prescription.doctor
          ? `Dr. ${prescription.doctor.firstName} ${prescription.doctor.lastName}`
          : "Prescription numérique",
        examType: prescription.examType,
        prescriptionId: prescription.id,
        qrCode: prescription.qrCode,
      });
    } catch (emailError) {
      // L'échec de l'envoi d'email ne bloque pas la création
      console.error("[createPrescription] Erreur envoi email :", emailError);
    }

    // Invalide le cache de la page dashboard
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/prescriptions");

    return {
      success: true,
      message: "Prescription créée avec succès",
      data: { id: prescription.id },
    };
  } catch (error) {
    console.error("[createPrescription] Erreur :", error);
    return {
      success: false,
      message: "Erreur lors de la création de la prescription",
    };
  }
}

// ── Action : Mise à jour du statut d'une prescription ─────────
export async function updatePrescriptionStatus(
  prescriptionId: string,
  status: PrescriptionStatus,
  scheduledDate?: string
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, message: "Non authentifié" };
  }

  // Seuls les médecins et admins peuvent mettre à jour le statut
  if (session.role === Role.PATIENT) {
    return { success: false, message: "Accès non autorisé" };
  }

  try {
    const prescription = await prisma.prescription.findUnique({
      where: { id: prescriptionId },
    });

    if (!prescription) {
      return { success: false, message: "Prescription introuvable" };
    }

    const updatedData: {
      status: PrescriptionStatus;
      scheduledDate?: Date;
      completedAt?: Date;
    } = { status };

    if (scheduledDate && status === "SCHEDULED") {
      updatedData.scheduledDate = new Date(scheduledDate);
    }
    if (status === "COMPLETED") {
      updatedData.completedAt = new Date();
    }

    await prisma.prescription.update({
      where: { id: prescriptionId },
      data: updatedData,
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "UPDATE_PRESCRIPTION_STATUS",
        entity: "Prescription",
        entityId: prescriptionId,
        metadata: { newStatus: status },
      },
    });

    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/prescriptions/${prescriptionId}`);

    return { success: true, message: "Statut mis à jour avec succès" };
  } catch (error) {
    console.error("[updatePrescriptionStatus] Erreur :", error);
    return { success: false, message: "Erreur lors de la mise à jour du statut" };
  }
}

// ── Action : Récupération des prescriptions de l'utilisateur ──
export async function getUserPrescriptions() {
  const session = await getSession();
  if (!session) return [];

  try {
    // Les patients voient leurs propres prescriptions
    // Les médecins voient celles qu'ils ont émises
    // Les admins voient tout
    const where =
      session.role === Role.PATIENT
        ? { patientId: session.id }
        : session.role === Role.DOCTOR
        ? { doctorId: session.id }
        : {};

    return await prisma.prescription.findMany({
      where,
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        doctor: {
          select: {
            firstName: true,
            lastName: true,
            speciality: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("[getUserPrescriptions] Erreur :", error);
    return [];
  }
}
