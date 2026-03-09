// ============================================================
// API Route : Recherche globale
// GET /api/search?q=terme
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ patients: [], prescriptions: [] });

  const isDoctor  = session.role === Role.DOCTOR || session.role === Role.ADMIN;
  const isPatient = session.role === Role.PATIENT;

  // ── Recherche prescriptions ────────────────────────────────
  const prescriptions = await prisma.prescription.findMany({
    where: {
      AND: [
        isPatient ? { patientId: session.id } : {},
        isDoctor  ? { doctorId: session.id }  : {},
        {
          OR: [
            { examType:   { contains: q, mode: "insensitive" } },
            { diagnosis:  { contains: q, mode: "insensitive" } },
            { examDetails:{ contains: q, mode: "insensitive" } },
          ],
        },
      ],
    },
    select: {
      id: true,
      examType: true,
      status: true,
      createdAt: true,
      patient: { select: { firstName: true, lastName: true } },
    },
    take: 5,
    orderBy: { createdAt: "desc" },
  });

  // ── Recherche patients (médecin/admin uniquement) ──────────
  let patients: { id: string; firstName: string; lastName: string; email: string }[] = [];
  if (isDoctor) {
    patients = await prisma.user.findMany({
      where: {
        role: Role.PATIENT,
        OR: [
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName:  { contains: q, mode: "insensitive" } },
          { email:     { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, firstName: true, lastName: true, email: true },
      take: 5,
    });
  }

  return NextResponse.json({ patients, prescriptions });
}
