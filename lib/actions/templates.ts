"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Role } from "@prisma/client";
import type { ActionResult } from "./auth";

const TemplateSchema = z.object({
  name:        z.string().min(2, "Nom requis"),
  examType:    z.string().min(2, "Type d'examen requis"),
  examDetails: z.string().optional(),
  diagnosis:   z.string().optional(),
  notes:       z.string().optional(),
  urgency:     z.boolean().default(false),
});

// ── Créer un template ─────────────────────────────────────────
export async function createTemplate(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const session = await getSession();
  if (!session || (session.role !== Role.DOCTOR && session.role !== Role.ADMIN)) {
    return { success: false, message: "Accès non autorisé" };
  }

  const raw = {
    name:        formData.get("name") as string,
    examType:    formData.get("examType") as string,
    examDetails: formData.get("examDetails") as string | undefined,
    diagnosis:   formData.get("diagnosis") as string | undefined,
    notes:       formData.get("notes") as string | undefined,
    urgency:     formData.get("urgency") === "true",
  };

  const v = TemplateSchema.safeParse(raw);
  if (!v.success) return { success: false, message: "Données invalides", errors: v.error.flatten().fieldErrors };

  const template = await prisma.prescriptionTemplate.create({
    data: { ...v.data, doctorId: session.id },
  });

  revalidatePath("/dashboard/prescriptions/new");
  return { success: true, message: "Modèle sauvegardé", data: { id: template.id } };
}

// ── Supprimer un template ─────────────────────────────────────
export async function deleteTemplate(id: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session || (session.role !== Role.DOCTOR && session.role !== Role.ADMIN)) {
    return { success: false, message: "Accès non autorisé" };
  }

  const template = await prisma.prescriptionTemplate.findUnique({ where: { id } });
  if (!template || template.doctorId !== session.id) {
    return { success: false, message: "Introuvable" };
  }

  await prisma.prescriptionTemplate.delete({ where: { id } });
  revalidatePath("/dashboard/prescriptions/new");
  return { success: true, message: "Modèle supprimé" };
}

// ── Lister les templates du médecin ──────────────────────────
export async function getMyTemplates() {
  const session = await getSession();
  if (!session || (session.role !== Role.DOCTOR && session.role !== Role.ADMIN)) return [];

  return prisma.prescriptionTemplate.findMany({
    where: { doctorId: session.id },
    orderBy: { name: "asc" },
  });
}
