// ============================================================
// Seed de la base de données — Données de démonstration
// Exécution : npm run db:seed
// ============================================================

import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Démarrage du seed de la base de données...");

  // Nettoyage des données existantes
  await prisma.auditLog.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.user.deleteMany();

  // ── Création des utilisateurs de démonstration ──────────
  const hashedPassword = await bcrypt.hash("Demo1234!", 12);

  // Administrateur
  const admin = await prisma.user.create({
    data: {
      email: "admin@antigravity.med",
      password: hashedPassword,
      firstName: "Admin",
      lastName: "Système",
      role: Role.ADMIN,
    },
  });

  // Médecin
  const doctor = await prisma.user.create({
    data: {
      email: "dr.martin@antigravity.med",
      password: hashedPassword,
      firstName: "Sophie",
      lastName: "Martin",
      role: Role.DOCTOR,
      speciality: "Médecine Générale",
      inami: "1-23456-78-901",
    },
  });

  // Patient
  const patient = await prisma.user.create({
    data: {
      email: "patient@exemple.com",
      password: hashedPassword,
      firstName: "Jean",
      lastName: "Dupont",
      role: Role.PATIENT,
      phone: "+32 470 12 34 56",
    },
  });

  // ── Création de prescriptions de démonstration ──────────
  await prisma.prescription.create({
    data: {
      source: "MANUAL",
      status: "SCHEDULED",
      examType: "IRM Lombaire",
      examDetails: "Séquences T1, T2 et STIR — rachis lombo-sacré complet",
      diagnosis: "Lombalgies chroniques avec irradiation sciatique droite",
      urgency: false,
      scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      patientId: patient.id,
      doctorId: doctor.id,
    },
  });

  await prisma.prescription.create({
    data: {
      source: "OCR",
      status: "PENDING",
      examType: "Radiographie Thoracique",
      examDetails: "Face et profil",
      diagnosis: "Toux persistante — bilan pulmonaire",
      rawOcrText:
        "Dr Martin S. - Radiographie thoracique F+P - Toux persistante > 3 semaines",
      urgency: false,
      patientId: patient.id,
      doctorId: doctor.id,
    },
  });

  console.log("✅ Seed terminé avec succès !");
  console.log("📧 Comptes de démonstration créés :");
  console.log(`   Admin   : admin@antigravity.med / Demo1234!`);
  console.log(`   Médecin : dr.martin@antigravity.med / Demo1234!`);
  console.log(`   Patient : patient@exemple.com / Demo1234!`);
}

main()
  .catch((error) => {
    console.error("❌ Erreur lors du seed :", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
