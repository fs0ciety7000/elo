// ============================================================
// API Route : Génération PDF d'une prescription
// GET /api/prescriptions/[id]/pdf
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Role } from "@prisma/client";
import { renderToBuffer } from "@react-pdf/renderer";
import { PrescriptionPdf } from "@/components/prescriptions/PrescriptionPdf";
import React from "react";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;

  const prescription = await prisma.prescription.findUnique({
    where: { id },
    include: {
      patient: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          birthDate: true,
          nationalId: true,
        },
      },
      doctor: {
        select: {
          firstName: true,
          lastName: true,
          speciality: true,
          inami: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  if (!prescription) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  // Contrôle d'accès
  if (session.role === Role.PATIENT && prescription.patientId !== session.id) {
    return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
  }

  const pdfBuffer = await renderToBuffer(
    React.createElement(PrescriptionPdf, { prescription: prescription as Parameters<typeof PrescriptionPdf>[0]["prescription"] })
  );

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="prescription-${prescription.id.slice(0, 8)}.pdf"`,
    },
  });
}
