// ============================================================
// Server Actions — Gestion des prescriptions
// ============================================================

"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Role, PrescriptionStatus } from "@prisma/client";
import { sendPrescriptionEmail } from "@/lib/email/send";
import type { ActionResult } from "./auth";

// ── Schéma de validation ──────────────────────────────────────
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
  attachmentUrl: z.string().optional(),
  attachmentName: z.string().optional(),
  attachmentSize: z.number().optional(),
});

// ── Action : Création d'une prescription ─────────────────────
export async function createPrescription(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const session = await getSession();
  if (!session) return { success: false, message: "Non authentifié" };

  const attachmentSizeRaw = formData.get("attachmentSize");
  const rawData = {
    patientEmail: formData.get("patientEmail") ?? undefined,
    patientId: formData.get("patientId") ?? undefined,
    examType: formData.get("examType") as string,
    examDetails: formData.get("examDetails") ?? undefined,
    diagnosis: formData.get("diagnosis") ?? undefined,
    notes: formData.get("notes") ?? undefined,
    urgency: formData.get("urgency") === "true",
    source: (formData.get("source") ?? "MANUAL") as string,
    rawOcrText: formData.get("rawOcrText") ?? undefined,
    attachmentUrl: formData.get("attachmentUrl") ?? undefined,
    attachmentName: formData.get("attachmentName") ?? undefined,
    attachmentSize: attachmentSizeRaw ? Number(attachmentSizeRaw) : undefined,
  };

  const validation = CreatePrescriptionSchema.safeParse(rawData);
  if (!validation.success) {
    console.error("[createPrescription] Validation échouée :", validation.error.flatten().fieldErrors);
    return { success: false, message: "Données invalides", errors: validation.error.flatten().fieldErrors };
  }

  const data = validation.data;

  try {
    let patientId: string;
    let doctorId: string | undefined;

    if (session.role === Role.DOCTOR || session.role === Role.ADMIN) {
      doctorId = session.id;
      if (data.patientEmail) {
        const patient = await prisma.user.findUnique({ where: { email: data.patientEmail } });
        if (!patient) return { success: false, message: `Aucun patient trouvé avec l'email : ${data.patientEmail}` };
        patientId = patient.id;
      } else if (data.patientId) {
        patientId = data.patientId;
      } else {
        return { success: false, message: "Email ou ID du patient requis" };
      }
    } else {
      patientId = session.id;
    }

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
        attachmentUrl: data.attachmentUrl,
        attachmentName: data.attachmentName,
        attachmentSize: data.attachmentSize,
      },
      include: { patient: true, doctor: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "CREATE_PRESCRIPTION",
        entity: "Prescription",
        entityId: prescription.id,
        metadata: { source: data.source, examType: data.examType },
      },
    });

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
      console.error("[createPrescription] Erreur envoi email :", emailError);
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/prescriptions");

    return { success: true, message: "Prescription créée avec succès", data: { id: prescription.id } };
  } catch (error) {
    console.error("[createPrescription] Erreur :", error);
    return { success: false, message: "Erreur lors de la création de la prescription" };
  }
}

// ── Action : Mise à jour du statut ────────────────────────────
export async function updatePrescriptionStatus(
  prescriptionId: string,
  status: PrescriptionStatus,
  scheduledDate?: string
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { success: false, message: "Non authentifié" };
  if (session.role === Role.PATIENT) return { success: false, message: "Accès non autorisé" };

  try {
    const prescription = await prisma.prescription.findUnique({
      where: { id: prescriptionId },
      include: { patient: true, doctor: true },
    });
    if (!prescription) return { success: false, message: "Prescription introuvable" };

    const updatedData: { status: PrescriptionStatus; scheduledDate?: Date; completedAt?: Date } = { status };
    if (scheduledDate && status === "SCHEDULED") updatedData.scheduledDate = new Date(scheduledDate);
    if (status === "COMPLETED") updatedData.completedAt = new Date();

    await prisma.prescription.update({ where: { id: prescriptionId }, data: updatedData });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "UPDATE_PRESCRIPTION_STATUS",
        entity: "Prescription",
        entityId: prescriptionId,
        metadata: { newStatus: status },
      },
    });

    // Email lors de la planification
    if (status === "SCHEDULED" && updatedData.scheduledDate) {
      try {
        await sendPrescriptionEmail(prescription.patient.email, {
          patientName: `${prescription.patient.firstName} ${prescription.patient.lastName}`,
          doctorName: prescription.doctor
            ? `Dr. ${prescription.doctor.firstName} ${prescription.doctor.lastName}`
            : "Antigravity Medical",
          examType: prescription.examType,
          prescriptionId: prescription.id,
          qrCode: prescription.qrCode,
          scheduledDate: updatedData.scheduledDate,
        });
      } catch (emailError) {
        console.error("[updatePrescriptionStatus] Erreur envoi email planification :", emailError);
      }
    }

    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/prescriptions/${prescriptionId}`);

    return { success: true, message: "Statut mis à jour avec succès" };
  } catch (error) {
    console.error("[updatePrescriptionStatus] Erreur :", error);
    return { success: false, message: "Erreur lors de la mise à jour du statut" };
  }
}

// ── Action : Modification d'une prescription ──────────────────
const EditPrescriptionSchema = z.object({
  examType: z.string().min(3, "Le type d'examen est requis"),
  examDetails: z.string().optional(),
  diagnosis: z.string().optional(),
  notes: z.string().optional(),
  urgency: z.boolean().default(false),
});

export async function editPrescription(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { success: false, message: "Non authentifié" };

  const rawData = {
    examType: formData.get("examType") as string,
    examDetails: formData.get("examDetails") ?? undefined,
    diagnosis: formData.get("diagnosis") ?? undefined,
    notes: formData.get("notes") ?? undefined,
    urgency: formData.get("urgency") === "true",
  };

  const validation = EditPrescriptionSchema.safeParse(rawData);
  if (!validation.success) {
    return { success: false, message: "Données invalides", errors: validation.error.flatten().fieldErrors };
  }

  try {
    const prescription = await prisma.prescription.findUnique({ where: { id } });
    if (!prescription) return { success: false, message: "Prescription introuvable" };

    // Contrôle d'accès
    if (session.role === Role.PATIENT && prescription.patientId !== session.id) {
      return { success: false, message: "Accès non autorisé" };
    }
    if (session.role === Role.DOCTOR && prescription.doctorId !== session.id) {
      return { success: false, message: "Accès non autorisé" };
    }

    await prisma.prescription.update({
      where: { id },
      data: validation.data,
    });

    revalidatePath(`/dashboard/prescriptions/${id}`);
    revalidatePath("/dashboard/prescriptions");
    revalidatePath("/dashboard");

    return { success: true, message: "Prescription modifiée avec succès" };
  } catch (error) {
    console.error("[editPrescription] Erreur :", error);
    return { success: false, message: "Erreur lors de la modification" };
  }
}

// ── Action : Suppression d'une prescription ───────────────────
export async function deletePrescription(id: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { success: false, message: "Non authentifié" };

  try {
    const prescription = await prisma.prescription.findUnique({ where: { id } });
    if (!prescription) return { success: false, message: "Prescription introuvable" };

    // Contrôle d'accès
    if (session.role === Role.PATIENT && prescription.patientId !== session.id) {
      return { success: false, message: "Accès non autorisé" };
    }
    if (session.role === Role.DOCTOR && prescription.doctorId !== session.id) {
      return { success: false, message: "Accès non autorisé" };
    }

    await prisma.prescription.delete({ where: { id } });

    revalidatePath("/dashboard/prescriptions");
    revalidatePath("/dashboard");

    return { success: true, message: "Prescription supprimée" };
  } catch (error) {
    console.error("[deletePrescription] Erreur :", error);
    return { success: false, message: "Erreur lors de la suppression" };
  }
}

// ── Action : Récupération des prescriptions ───────────────────
export async function getUserPrescriptions() {
  const session = await getSession();
  if (!session) return [];

  try {
    const where =
      session.role === Role.PATIENT
        ? { patientId: session.id }
        : session.role === Role.DOCTOR
        ? { doctorId: session.id }
        : {};

    return await prisma.prescription.findMany({
      where,
      include: {
        patient: { select: { firstName: true, lastName: true, email: true } },
        doctor: { select: { firstName: true, lastName: true, speciality: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("[getUserPrescriptions] Erreur :", error);
    return [];
  }
}
