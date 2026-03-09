// ============================================================
// Client Prisma — Singleton pour Next.js
// Évite la création de multiples instances en développement
// (Hot Reload crée de nouvelles instances sans cette protection)
// ============================================================

import { PrismaClient } from "@prisma/client";

// Déclaration globale pour conserver l'instance entre les rechargements HMR
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

// Stocke l'instance globalement en développement uniquement
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
