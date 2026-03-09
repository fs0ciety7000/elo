// GET /api/patients/check?email=...
// Vérifie si un patient existe (pour le formulaire de prescription)

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Role } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role === Role.PATIENT) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const email = req.nextUrl.searchParams.get("email");
  if (!email) {
    return NextResponse.json({ found: false });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, firstName: true, lastName: true, role: true },
  });

  if (!user) {
    return NextResponse.json({ found: false });
  }

  return NextResponse.json({
    found: true,
    name: `${user.firstName} ${user.lastName}`,
    role: user.role,
  });
}
