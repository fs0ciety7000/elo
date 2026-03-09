// ============================================================
// Utilitaires d'authentification — Antigravity Medical SaaS
// Gestion des tokens JWT avec la librairie jose (Edge-compatible)
// ============================================================

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { Role } from "@prisma/client";

// Durée de validité du token (24 heures)
const TOKEN_EXPIRY = "24h";
const COOKIE_NAME = "antigravity_session";

// Charge la clé secrète depuis les variables d'environnement
function getJwtSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET n'est pas défini dans les variables d'environnement");
  }
  return new TextEncoder().encode(secret);
}

// ── Types ────────────────────────────────────────────────────
export interface JWTPayload {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
}

// ── Création du token JWT ────────────────────────────────────
export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .setIssuer("antigravity-medical")
    .sign(getJwtSecret());
}

// ── Vérification et décodage du token JWT ───────────────────
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), {
      issuer: "antigravity-medical",
    });
    return payload as unknown as JWTPayload;
  } catch {
    // Token invalide, expiré ou malformé
    return null;
  }
}

// ── Pose le cookie de session sécurisé ──────────────────────
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,           // Inaccessible depuis JavaScript côté client
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24,   // 24 heures en secondes
    path: "/",
  });
}

// ── Supprime le cookie de session ───────────────────────────
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// ── Récupère la session courante depuis le cookie ────────────
export async function getSession(): Promise<JWTPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifyToken(token);
  } catch {
    return null;
  }
}

// ── Vérifie si l'utilisateur a le rôle requis ───────────────
export function hasRole(session: JWTPayload | null, ...roles: Role[]): boolean {
  if (!session) return false;
  return roles.includes(session.role);
}
