// POST /api/auth/logout — déconnexion via API route (pour le drawer mobile)
import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

export async function POST() {
  await clearSessionCookie();
  return NextResponse.redirect(new URL("/login", process.env.AUTH_URL ?? "http://localhost:3000"));
}
