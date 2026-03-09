// ============================================================
// Middleware de protection des routes — Antigravity Medical SaaS
// S'exécute en Edge Runtime avant chaque requête correspondante
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Routes nécessitant une authentification
const PROTECTED_ROUTES = ["/dashboard", "/profile"];

// Routes réservées aux utilisateurs NON authentifiés
const AUTH_ROUTES = ["/login", "/register"];

// Nom du cookie de session
const COOKIE_NAME = "antigravity_session";

function getJwtSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET ?? "fallback-secret-change-in-production";
  return new TextEncoder().encode(secret);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  // ── Vérification du token JWT ────────────────────────────
  let isAuthenticated = false;
  let userRole: string | null = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, getJwtSecret(), {
        issuer: "antigravity-medical",
      });
      isAuthenticated = true;
      userRole = payload.role as string;
    } catch {
      // Token invalide ou expiré — on le considère comme non authentifié
      isAuthenticated = false;
    }
  }

  // ── Protection des routes sécurisées ─────────────────────
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute && !isAuthenticated) {
    // Redirige vers /login avec l'URL d'origine pour revenir après connexion
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Redirection si déjà authentifié ──────────────────────
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (isAuthRoute && isAuthenticated) {
    // Redirige vers le dashboard si l'utilisateur est déjà connecté
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // ── Transmission du rôle dans les headers (pour les RSC) ─
  const response = NextResponse.next();
  if (userRole) {
    response.headers.set("x-user-role", userRole);
  }

  return response;
}

// ── Configuration du matcher ─────────────────────────────────
// Exclut les ressources statiques et les routes API
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
