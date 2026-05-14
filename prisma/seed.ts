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
  const hashedDemoPassword = await bcrypt.hash("Demo1234!", 12);
  const hashedTestPassword = await bcrypt.hash("Topsecret86", 12);

  // Administrateur
  const admin = await prisma.user.create({
    data: {
      email: "admin@HumaScan.med",
      password: hashedDemoPassword,
      firstName: "Admin",
      lastName: "Système",
      role: Role.ADMIN,
    },
  });

  // Médecin (demo)
  const doctor = await prisma.user.create({
    data: {
      email: "dr.martin@HumaScan.med",
      password: hashedDemoPassword,
      firstName: "Sophie",
      lastName: "Martin",
      role: Role.DOCTOR,
      speciality: "Médecine Générale",
      inami: "1-23456-78-901",
    },
  });

  // Patient (demo)
  const patient = await prisma.user.create({
    data: {
      email: "patient@exemple.com",
      password: hashedDemoPassword,
      firstName: "Jean",
      lastName: "Dupont",
      role: Role.PATIENT,
      phone: "+32 470 12 34 56",
    },
  });

  // ── Comptes de test par rôle (mdp : Topsecret86) ────────

  // Médecin test
  const testDoctor = await prisma.user.create({
    data: {
      email: "docteur@test.com",
      password: hashedTestPassword,
      firstName: "Marc",
      lastName: "Dubois",
      role: Role.DOCTOR,
      speciality: "Radiologie",
      inami: "2-34567-89-012",
    },
  });

  // Secrétaire test
  await prisma.user.create({
    data: {
      email: "secretaire@test.com",
      password: hashedTestPassword,
      firstName: "Marie",
      lastName: "Lambert",
      role: Role.SECRETARY,
    },
  });

  // Patient test
  const testPatient = await prisma.user.create({
    data: {
      email: "patient@test.com",
      password: hashedTestPassword,
      firstName: "Paul",
      lastName: "Renard",
      role: Role.PATIENT,
      phone: "+32 471 99 88 77",
      address: "Rue de la Paix 10, 1000 Bruxelles",
    },
  });

  // Lier le médecin test à son patient test
  await prisma.doctorPatient.create({
    data: { doctorId: testDoctor.id, patientId: testPatient.id },
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
  console.log("📧 Comptes de démonstration (Demo1234!) :");
  console.log(`   Admin    : admin@HumaScan.med`);
  console.log(`   Médecin  : dr.martin@HumaScan.med`);
  console.log(`   Patient  : patient@exemple.com`);
  console.log("📧 Comptes de test (Topsecret86) :");
  console.log(`   Médecin  : docteur@test.com`);
  console.log(`   Secrét.  : secretaire@test.com`);
  console.log(`   Patient  : patient@test.com`);
}

main()
  .catch((error) => {
    console.error("❌ Erreur lors du seed :", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
