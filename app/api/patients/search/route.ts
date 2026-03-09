// GET /api/patients/search?q=... — recherche patients NON encore assignés au médecin courant
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Role } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role === Role.PATIENT) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const all = req.nextUrl.searchParams.get("all") === "true";
  if (q.length < 2) return NextResponse.json([]);

  // Exclure les patients déjà assignés SAUF si ?all=true (formulaire de prescription)
  let excludedPatientIds: string[] = [];
  if (session.role === Role.DOCTOR && !all) {
    const assignments = await prisma.doctorPatient.findMany({
      where: { doctorId: session.id },
      select: { patientId: true },
    });
    excludedPatientIds = assignments.map((a) => a.patientId);
  }

  const patients = await prisma.user.findMany({
    where: {
      role: Role.PATIENT,
      ...(session.role === Role.DOCTOR && excludedPatientIds.length > 0
        ? { id: { notIn: excludedPatientIds } }
        : {}),
      OR: [
        { email: { contains: q, mode: "insensitive" } },
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        {
          AND: [
            { firstName: { contains: q.split(" ")[0], mode: "insensitive" } },
            q.split(" ")[1]
              ? { lastName: { contains: q.split(" ")[1], mode: "insensitive" } }
              : {},
          ],
        },
      ],
    },
    select: { id: true, firstName: true, lastName: true, email: true },
    take: 8,
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  return NextResponse.json(patients);
}
