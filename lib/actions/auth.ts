// ============================================================
// Server Actions — Authentification
// registerUser : inscription d'un nouvel utilisateur
// loginUser    : connexion et émission du token JWT
// logoutUser   : déconnexion et suppression du cookie
// ============================================================

"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { signToken, setSessionCookie, clearSessionCookie } from "@/lib/auth";
import { Role } from "@prisma/client";
import { sendWelcomeEmail, sendPasswordResetEmail } from "@/lib/email/send";

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

// ── Action : Mot de passe oublié ──────────────────────────────
export async function forgotPassword(formData: FormData): Promise<ActionResult> {
  const email = (formData.get("email") as string | null)?.trim() ?? "";

  if (!email || !z.string().email().safeParse(email).success) {
    return { success: false, message: "Adresse email invalide" };
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    // Réponse générique pour éviter l'énumération des comptes
    if (!user) {
      return {
        success: true,
        message: "Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.",
      };
    }

    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // +1h

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: token, passwordResetExpires: expires },
    });

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? "https://elodie.fs0ciety.org";
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    sendPasswordResetEmail(user.email, {
      resetUrl,
      userName: `${user.firstName} ${user.lastName}`,
    }).catch((err) =>
      console.error("[forgotPassword] Erreur email :", err)
    );

    return {
      success: true,
      message: "Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.",
    };
  } catch (error) {
    console.error("[forgotPassword] Erreur :", error);
    return { success: false, message: "Une erreur inattendue s'est produite." };
  }
}

// ── Action : Réinitialisation du mot de passe ─────────────────
export async function resetPassword(formData: FormData): Promise<ActionResult> {
  const token = (formData.get("token") as string | null)?.trim() ?? "";
  const password = (formData.get("password") as string | null) ?? "";

  if (!token) {
    return { success: false, message: "Token manquant ou invalide" };
  }

  const passwordValidation = z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .safeParse(password);

  if (!passwordValidation.success) {
    return {
      success: false,
      message: passwordValidation.error.errors[0].message,
    };
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { gt: new Date() },
      },
    });

    if (!user) {
      return {
        success: false,
        message: "Ce lien de réinitialisation est invalide ou a expiré.",
      };
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    return {
      success: true,
      message: "Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.",
    };
  } catch (error) {
    console.error("[resetPassword] Erreur :", error);
    return { success: false, message: "Une erreur inattendue s'est produite." };
  }
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
