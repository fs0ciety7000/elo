// ============================================================
// Server Actions — Authentification
// registerUser : inscription d'un nouvel utilisateur
// loginUser    : connexion et émission du token JWT
// logoutUser   : déconnexion et suppression du cookie
// ============================================================

"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { signToken, setSessionCookie, clearSessionCookie } from "@/lib/auth";
import { Role } from "@prisma/client";
import { sendWelcomeEmail } from "@/lib/email/send";

// ── Schémas de validation Zod ────────────────────────────────
const RegisterSchema = z.object({
  firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Adresse email invalide"),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule")
    .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre"),
  role: z.enum(["PATIENT", "DOCTOR"]).default("PATIENT"),
  speciality: z.string().optional(),
  inami: z.string().optional(),
});

const LoginSchema = z.object({
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

// ── Types de retour des actions ──────────────────────────────
export type ActionResult<T = unknown> = {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
};

// ── Action : Inscription ──────────────────────────────────────
export async function registerUser(
  formData: FormData
): Promise<ActionResult> {
  // Extraction et validation des données du formulaire
  const rawData = {
    firstName: formData.get("firstName") as string,
    lastName: formData.get("lastName") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    role: (formData.get("role") as string) ?? "PATIENT",
    speciality: formData.get("speciality") as string | undefined,
    inami: formData.get("inami") as string | undefined,
  };

  const validation = RegisterSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      message: "Données invalides",
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const { firstName, lastName, email, password, role, speciality, inami } =
    validation.data;

  try {
    // Vérifie que l'email n'est pas déjà utilisé
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return {
        success: false,
        message: "Un compte existe déjà avec cette adresse email",
      };
    }

    // Hachage sécurisé du mot de passe (coût 12)
    const hashedPassword = await bcrypt.hash(password, 12);

    // Création de l'utilisateur en base de données
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: role as Role,
        speciality: role === "DOCTOR" ? speciality : undefined,
        inami: role === "DOCTOR" ? inami : undefined,
      },
    });

    // Audit log : inscription
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "REGISTER",
        entity: "User",
        entityId: user.id,
      },
    });

    // Email de bienvenue (non bloquant)
    sendWelcomeEmail(user.email, { firstName: user.firstName, role: user.role }).catch(
      (err) => console.error("[registerUser] Erreur email bienvenue :", err)
    );

    // Création et pose du token de session
    const token = await signToken({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    });
    await setSessionCookie(token);

    return {
      success: true,
      message: "Compte créé avec succès ! Bienvenue sur Antigravity.",
    };
  } catch (error) {
    console.error("[registerUser] Erreur :", error);
    return {
      success: false,
      message: "Une erreur inattendue s'est produite. Veuillez réessayer.",
    };
  }
}

// ── Action : Connexion ────────────────────────────────────────
export async function loginUser(
  formData: FormData
): Promise<ActionResult> {
  const rawData = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const validation = LoginSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      message: "Données invalides",
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const { email, password } = validation.data;

  try {
    // Recherche de l'utilisateur par email
    const user = await prisma.user.findUnique({ where: { email } });

    // Message générique pour éviter l'énumération des comptes
    if (!user) {
      return {
        success: false,
        message: "Email ou mot de passe incorrect",
      };
    }

    // Vérification du mot de passe avec bcrypt
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return {
        success: false,
        message: "Email ou mot de passe incorrect",
      };
    }

    // Audit log : connexion
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "LOGIN",
        entity: "User",
        entityId: user.id,
      },
    });

    // Création et pose du token JWT
    const token = await signToken({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    });
    await setSessionCookie(token);

    return {
      success: true,
      message: "Connexion réussie !",
    };
  } catch (error) {
    console.error("[loginUser] Erreur :", error);
    return {
      success: false,
      message: "Une erreur inattendue s'est produite. Veuillez réessayer.",
    };
  }
}

// ── Action : Déconnexion ──────────────────────────────────────
export async function logoutUser(): Promise<void> {
  await clearSessionCookie();
  redirect("/login");
}

// ── Schéma mise à jour profil ─────────────────────────────────
const UpdateProfileSchema = z.object({
  firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  phone: z.string().optional(),
  speciality: z.string().optional(),
  inami: z.string().optional(),
});

// ── Action : Mise à jour du profil ────────────────────────────
export async function updateProfile(
  formData: FormData
): Promise<ActionResult> {
  const { getSession } = await import("@/lib/auth");
  const session = await getSession();
  if (!session) return { success: false, message: "Non authentifié" };

  const rawData = {
    firstName: formData.get("firstName") ?? undefined,
    lastName: formData.get("lastName") ?? undefined,
    phone: formData.get("phone") ?? undefined,
    speciality: formData.get("speciality") ?? undefined,
    inami: formData.get("inami") ?? undefined,
  };

  const validation = UpdateProfileSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      message: "Données invalides",
      errors: validation.error.flatten().fieldErrors,
    };
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: session.id } });
    if (!user) return { success: false, message: "Utilisateur introuvable" };

    const isDoctor = user.role === Role.DOCTOR || user.role === Role.ADMIN;

    await prisma.user.update({
      where: { id: session.id },
      data: {
        firstName: validation.data.firstName,
        lastName: validation.data.lastName,
        phone: validation.data.phone || null,
        speciality: isDoctor ? (validation.data.speciality || null) : undefined,
        inami: isDoctor ? (validation.data.inami || null) : undefined,
      },
    });

    const { revalidatePath } = await import("next/cache");
    revalidatePath("/dashboard/profile");

    return { success: true, message: "Profil mis à jour avec succès" };
  } catch (error) {
    console.error("[updateProfile] Erreur :", error);
    return { success: false, message: "Erreur lors de la mise à jour" };
  }
}
