// ============================================================
// Service d'envoi d'emails — Resend API
// Templates HTML professionnels avec logo Antigravity
// ============================================================

import { Resend } from "resend";
import { readFileSync } from "fs";
import { join } from "path";
import { getBaseUrl } from "@/lib/utils";

const resend   = new Resend(process.env.RESEND_API_KEY);
const FROM     = process.env.RESEND_FROM_EMAIL ?? "noreply@elodie.fs0ciety.org";
const APP_NAME = "Antigravity Medical";

// ── Logo embarqué en base64 (80×80, fond blanc) ───────────────
function getLogoBase64(): string {
  try {
    const logoPath = join(process.cwd(), "public", "logo.png");
    return `data:image/png;base64,${readFileSync(logoPath).toString("base64")}`;
  } catch {
    return "";
  }
}

// ── Base HTML commune ─────────────────────────────────────────
function emailBase(content: string, subject: string): string {
  const logo = getLogoBase64();
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 32px rgba(0,0,0,0.08);">

        <!-- HEADER -->
        <tr>
          <td style="background:linear-gradient(135deg,#1e3a8a 0%,#2563eb 60%,#3b82f6 100%);padding:40px 48px 36px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="vertical-align:middle;">
                  ${logo ? `<img src="${logo}" width="52" height="52" alt="Logo" style="border-radius:10px;vertical-align:middle;margin-right:14px;" />` : ""}
                  <span style="font-size:22px;font-weight:700;color:#ffffff;vertical-align:middle;letter-spacing:-0.5px;">${APP_NAME}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="padding:40px 48px;">
            ${content}
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 48px;text-align:center;">
            <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;">${APP_NAME} — Plateforme de digitalisation des prescriptions médicales</p>
            <p style="margin:0;font-size:11px;color:#cbd5e1;">Cet e-mail est généré automatiquement. Merci de ne pas y répondre.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Helpers HTML ──────────────────────────────────────────────
function infoRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:10px 16px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#64748b;width:45%;">${label}</td>
    <td style="padding:10px 16px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#1e293b;font-weight:600;">${value}</td>
  </tr>`;
}

function ctaButton(text: string, href: string, color = "#2563eb"): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:28px auto 0;">
    <tr>
      <td style="background:${color};border-radius:10px;">
        <a href="${href}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:-0.2px;">${text} →</a>
      </td>
    </tr>
  </table>`;
}

function badge(text: string, bg: string, color: string): string {
  return `<span style="display:inline-block;background:${bg};color:${color};font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px;text-transform:uppercase;letter-spacing:0.5px;">${text}</span>`;
}

// ══════════════════════════════════════════════════════════════
// 1. EMAIL DE BIENVENUE
// ══════════════════════════════════════════════════════════════
interface WelcomeParams {
  firstName: string;
  role: "PATIENT" | "DOCTOR" | string;
}

export async function sendWelcomeEmail(to: string, params: WelcomeParams | string): Promise<void> {
  // Rétro-compatibilité : ancienne signature sendWelcomeEmail(to, firstName)
  const firstName = typeof params === "string" ? params : params.firstName;
  const role      = typeof params === "string" ? "PATIENT" : params.role;
  const baseUrl   = getBaseUrl();
  const isDoctor  = role === "DOCTOR";

  const features = isDoctor ? [
    "Créer et gérer les prescriptions de vos patients",
    "Suivre le statut des examens en temps réel",
    "Sauvegarder vos prescriptions-types (modèles)",
    "Télécharger les PDF signés numériquement (SHA-256)",
  ] : [
    "Consulter et gérer vos prescriptions médicales",
    "Numériser une ordonnance papier via OCR",
    "Planifier et suivre vos examens radiologiques",
    "Présenter votre QR Code le jour de l'examen",
  ];

  const content = `
    <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#0f172a;letter-spacing:-0.5px;">
      Bienvenue, ${firstName}&nbsp;!
    </h1>
    <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6;">
      Votre compte ${isDoctor ? "médecin" : "patient"} a été créé avec succès sur <strong>${APP_NAME}</strong>.
      Vous pouvez dès maintenant accéder à votre espace personnel.
    </p>

    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:24px;margin-bottom:28px;">
      <p style="margin:0 0 14px;font-size:14px;font-weight:700;color:#1e40af;">
        ${isDoctor ? "Vos fonctionnalités :" : "Ce que vous pouvez faire :"}
      </p>
      <ul style="margin:0;padding-left:20px;color:#374151;font-size:14px;line-height:2.2;">
        ${features.map((f) => `<li>${f}</li>`).join("")}
      </ul>
    </div>

    ${ctaButton("Accéder à mon espace", `${baseUrl}/dashboard`)}

    <p style="margin:28px 0 0;font-size:12px;color:#94a3b8;text-align:center;">
      Si vous n'avez pas créé ce compte, ignorez cet e-mail.
    </p>
  `;

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Bienvenue sur ${APP_NAME} 🏥`,
    html: emailBase(content, `Bienvenue sur ${APP_NAME}`),
  });
}

// ══════════════════════════════════════════════════════════════
// 2. EMAIL DE NOUVELLE PRESCRIPTION
// ══════════════════════════════════════════════════════════════
interface PrescriptionEmailParams {
  patientName: string;
  doctorName: string;
  examType: string;
  prescriptionId: string;
  qrCode: string;
  scheduledDate?: Date;
}

export async function sendPrescriptionEmail(to: string, p: PrescriptionEmailParams): Promise<void> {
  const baseUrl = getBaseUrl();
  const url     = `${baseUrl}/dashboard/prescriptions/${p.prescriptionId}`;

  const content = `
    <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#2563eb;text-transform:uppercase;letter-spacing:1px;">
      Nouvelle prescription
    </p>
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0f172a;letter-spacing:-0.5px;">
      Votre prescription est prête
    </h1>
    <p style="margin:0 0 28px;font-size:14px;color:#64748b;line-height:1.6;">
      Bonjour <strong>${p.patientName}</strong>, votre prescription médicale a été enregistrée.
      Présentez votre QR Code le jour de votre examen.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:28px;">
      <tbody>
        ${infoRow("Type d'examen", p.examType)}
        ${infoRow("Prescrit par", p.doctorName)}
        ${infoRow("Référence", `<code style="font-size:11px;background:#f1f5f9;padding:2px 6px;border-radius:4px;">${p.prescriptionId.slice(0, 16)}…</code>`)}
        ${p.scheduledDate ? infoRow("Date planifiée", new Intl.DateTimeFormat("fr-BE", { dateStyle: "full", timeStyle: "short" }).format(p.scheduledDate)) : ""}
      </tbody>
    </table>

    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:20px;text-align:center;margin-bottom:28px;">
      <p style="margin:0 0 8px;font-size:13px;color:#1e40af;font-weight:600;">Code QR de votre prescription</p>
      <code style="font-family:monospace;font-size:11px;color:#3b82f6;word-break:break-all;">${p.qrCode}</code>
      <p style="margin:8px 0 0;font-size:11px;color:#94a3b8;">Accessible également dans votre espace patient</p>
    </div>

    ${ctaButton("Voir ma prescription", url)}
  `;

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Votre prescription "${p.examType}" est disponible`,
    html: emailBase(content, "Nouvelle prescription médicale"),
  });
}

// ══════════════════════════════════════════════════════════════
// 3. EMAIL DE RAPPEL D'EXAMEN (statut SCHEDULED)
// ══════════════════════════════════════════════════════════════
interface ReminderEmailParams {
  patientName: string;
  doctorName: string;
  examType: string;
  prescriptionId: string;
  qrCode: string;
  scheduledDate: Date;
}

export async function sendExamReminderEmail(to: string, p: ReminderEmailParams): Promise<void> {
  const baseUrl = getBaseUrl();
  const url     = `${baseUrl}/dashboard/prescriptions/${p.prescriptionId}`;

  const dateStr = new Intl.DateTimeFormat("fr-BE", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  }).format(p.scheduledDate);
  const timeStr = new Intl.DateTimeFormat("fr-BE", {
    hour: "2-digit", minute: "2-digit",
  }).format(p.scheduledDate);

  const content = `
    <div style="text-align:center;margin-bottom:24px;">
      ${badge("Examen planifié", "#dcfce7", "#15803d")}
    </div>

    <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0f172a;letter-spacing:-0.5px;text-align:center;">
      Votre examen est planifié
    </h1>
    <p style="margin:0 0 28px;font-size:14px;color:#64748b;line-height:1.6;text-align:center;">
      Bonjour <strong>${p.patientName}</strong>, votre examen <strong>${p.examType}</strong> a été programmé.
    </p>

    <div style="background:linear-gradient(135deg,#1e3a8a,#2563eb);border-radius:16px;padding:28px;text-align:center;margin-bottom:28px;">
      <p style="margin:0 0 4px;font-size:12px;color:#bfdbfe;text-transform:uppercase;letter-spacing:1px;">Date de votre examen</p>
      <p style="margin:0 0 4px;font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">${dateStr}</p>
      <p style="margin:0;font-size:18px;font-weight:600;color:#93c5fd;">${timeStr}</p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:24px;">
      <tbody>
        ${infoRow("Type d'examen", p.examType)}
        ${infoRow("Prescrit par", p.doctorName)}
        ${infoRow("Référence", `<code style="font-size:11px;background:#f1f5f9;padding:2px 6px;border-radius:4px;">${p.prescriptionId.slice(0, 16)}…</code>`)}
      </tbody>
    </table>

    <div style="background:#fefce8;border:1px solid #fde68a;border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#92400e;">À ne pas oublier le jour de l'examen</p>
      <ul style="margin:0;padding-left:18px;font-size:13px;color:#78350f;line-height:2;">
        <li>Présentez votre QR Code à l'accueil du centre d'imagerie</li>
        <li>Apportez votre carte d'identité et votre carte vitale</li>
        <li>Arrivez 15 minutes avant l'heure prévue</li>
      </ul>
    </div>

    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:20px;text-align:center;margin-bottom:28px;">
      <p style="margin:0 0 8px;font-size:13px;color:#1e40af;font-weight:600;">Votre QR Code</p>
      <code style="font-family:monospace;font-size:11px;color:#3b82f6;word-break:break-all;">${p.qrCode}</code>
    </div>

    ${ctaButton("Voir les détails de mon examen", url, "#059669")}
  `;

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Rappel : votre examen "${p.examType}" — ${dateStr}`,
    html: emailBase(content, "Rappel d'examen planifié"),
  });
}

// ══════════════════════════════════════════════════════════════
// 4. EMAIL DE COMPTE PATIENT CRÉÉ PAR UN MÉDECIN
// ══════════════════════════════════════════════════════════════
interface PatientCreatedByDoctorParams {
  patientName: string;
  doctorName: string;
  email: string;
  temporaryPassword: string;
}

// ══════════════════════════════════════════════════════════════
// 5. EMAIL DE RÉINITIALISATION DU MOT DE PASSE
// ══════════════════════════════════════════════════════════════
interface PasswordResetParams {
  resetUrl: string;
  userName: string;
}

export async function sendPasswordResetEmail(to: string, p: PasswordResetParams): Promise<void> {
  const content = `
    <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#2563eb;text-transform:uppercase;letter-spacing:1px;">
      Réinitialisation du mot de passe
    </p>
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0f172a;letter-spacing:-0.5px;">
      Réinitialiser votre mot de passe
    </h1>
    <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.6;">
      Bonjour <strong>${p.userName}</strong>, nous avons reçu une demande de réinitialisation du mot de passe
      associé à votre compte <strong>${APP_NAME}</strong>. Cliquez sur le bouton ci-dessous pour
      choisir un nouveau mot de passe.
    </p>

    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:20px;margin-bottom:28px;text-align:center;">
      <p style="margin:0 0 6px;font-size:13px;color:#1e40af;font-weight:600;">
        Ce lien est valable pendant <strong>1 heure</strong>
      </p>
      <p style="margin:0;font-size:12px;color:#60a5fa;">
        Passé ce délai, vous devrez effectuer une nouvelle demande.
      </p>
    </div>

    ${ctaButton("Réinitialiser mon mot de passe", p.resetUrl, "#2563eb")}

    <p style="margin:28px 0 0;font-size:12px;color:#94a3b8;text-align:center;">
      Si vous n'avez pas demandé cette réinitialisation, ignorez cet e-mail —
      votre mot de passe ne sera pas modifié.
    </p>
  `;

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Réinitialisation de votre mot de passe — ${APP_NAME}`,
    html: emailBase(content, "Réinitialisation du mot de passe"),
  });
}

export async function sendPatientAccountCreatedEmail(to: string, p: PatientCreatedByDoctorParams): Promise<void> {
  const baseUrl = getBaseUrl();

  const content = `
    <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#2563eb;text-transform:uppercase;letter-spacing:1px;">
      Compte créé par votre médecin
    </p>
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0f172a;letter-spacing:-0.5px;">
      Votre espace patient est prêt
    </h1>
    <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.6;">
      Bonjour <strong>${p.patientName}</strong>, <strong>${p.doctorName}</strong> a créé votre compte sur
      <strong>${APP_NAME}</strong>. Vous pouvez dès maintenant consulter vos prescriptions en ligne.
    </p>

    <div style="background:#fef9c3;border:1px solid #fde68a;border-radius:12px;padding:24px;margin-bottom:28px;">
      <p style="margin:0 0 14px;font-size:14px;font-weight:700;color:#92400e;">Vos identifiants de connexion</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tbody>
          ${infoRow("Adresse e-mail", p.email)}
          ${infoRow("Mot de passe provisoire", `<code style="font-size:13px;background:#fef3c7;padding:3px 8px;border-radius:6px;letter-spacing:1px;">${p.temporaryPassword}</code>`)}
        </tbody>
      </table>
      <p style="margin:14px 0 0;font-size:12px;color:#b45309;">Pensez à modifier votre mot de passe après votre première connexion.</p>
    </div>

    ${ctaButton("Se connecter à mon espace", `${baseUrl}/login`)}
  `;

  await resend.emails.send({
    from: FROM,
    to,
    subject: `${p.doctorName} vous a créé un espace sur ${APP_NAME}`,
    html: emailBase(content, "Votre espace patient est prêt"),
  });
}
