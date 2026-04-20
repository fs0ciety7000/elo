// ============================================================
// Seed des comptes de test — sûr en production (upsert)
// Exécution : npx tsx prisma/seed-test-accounts.ts
// ============================================================

import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const TEST_ACCOUNTS = [
  {
    email: "docteur@test.com",
    firstName: "Marc",
    lastName: "Dubois",
    role: Role.DOCTOR,
    speciality: "Radiologie",
    inami: "2-34567-89-012",
  },
  {
    email: "secretaire@test.com",
    firstName: "Marie",
    lastName: "Lambert",
    role: Role.SECRETARY,
    speciality: null,
    inami: null,
  },
  {
    email: "patient@test.com",
    firstName: "Paul",
    lastName: "Renard",
    role: Role.PATIENT,
    speciality: null,
    inami: null,
  },
];

async function main() {
  const hashedPassword = await bcrypt.hash("Topsecret86", 12);

  for (const account of TEST_ACCOUNTS) {
    await prisma.user.upsert({
      where: { email: account.email },
      update: { password: hashedPassword },
      create: {
        email: account.email,
        password: hashedPassword,
        firstName: account.firstName,
        lastName: account.lastName,
        role: account.role,
        speciality: account.speciality,
        inami: account.inami,
      },
    });
    console.log(`✅ ${account.role} — ${account.email}`);
  }

  console.log("✅ Comptes de test prêts (mot de passe : Topsecret86)");
}

main()
  .catch((e) => {
    console.error("❌ Erreur :", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
