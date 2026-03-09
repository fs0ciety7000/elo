// ============================================================
// Utilitaires généraux — Antigravity Medical SaaS
// ============================================================

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Role } from "@prisma/client";

// ── Fusion des classes Tailwind CSS ─────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Formatage des dates en français ─────────────────────────
export function formatDate(date: Date | string | null, options?: Intl.DateTimeFormatOptions): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("fr-BE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    ...options,
  }).format(new Date(date));
}

// ── Libellés des rôles utilisateur ──────────────────────────
export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrateur",
  DOCTOR: "Prestataire Médical",
  PATIENT: "Patient",
};

// ── Libellés des statuts de prescription ────────────────────
export const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  SCHEDULED: "Planifié",
  COMPLETED: "Terminé",
  CANCELLED: "Annulé",
};

// ── Couleurs Tailwind associées aux statuts ──────────────────
export const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 border-amber-200",
  SCHEDULED: "bg-blue-100 text-blue-800 border-blue-200",
  COMPLETED: "bg-green-100 text-green-800 border-green-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
};

// ── Génère une URL de base absolue ──────────────────────────
export function getBaseUrl(): string {
  return process.env.AUTH_URL ?? `http://localhost:3000`;
}

// ── Formate un nom complet ───────────────────────────────────
export function fullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`;
}

// ── Masque partiellement une adresse email ───────────────────
export function maskEmail(email: string): string {
  const [localPart, domain] = email.split("@");
  const masked = localPart.slice(0, 2) + "***";
  return `${masked}@${domain}`;
}
