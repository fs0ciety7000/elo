// ============================================================
// Service d'envoi d'emails — Resend API
// ============================================================

import { Resend } from "resend";
import { getBaseUrl } from "@/lib/utils";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "noreply@elodie.fs0ciety.org";

// ── Paramètres de l'email de prescription ───────────────────
interface PrescriptionEmailParams {
  patientName: string;
  doctorName: string;
  examType: string;
  prescriptionId: string;
  qrCode: string;
  scheduledDate?: Date;
}

// ── Envoi de l'email de confirmation de prescription ─────────
export async function sendPrescriptionEmail(
  to: string,
  params: PrescriptionEmailParams
): Promise<void> {
  const baseUrl = getBaseUrl();
  const prescriptionUrl = `${baseUrl}/dashboard/prescriptions/${params.prescriptionId}`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Votre prescription médicale — Antigravity</title>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f4f7fb; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 40px 32px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { color: #bfdbfe; margin: 8px 0 0; font-size: 14px; }
    .body { padding: 32px; }
    .greeting { font-size: 18px; font-weight: 600; color: #1e293b; margin-bottom: 16px; }
    .info-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
    .info-row:last-child { border-bottom: none; }
    .label { color: #64748b; font-size: 13px; }
    .value { color: #1e293b; font-weight: 600; font-size: 14px; }
    .btn { display: inline-block; background: #2563eb; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 20px 0; }
    .qr-section { text-align: center; padding: 24px; background: #f0f7ff; border-radius: 8px; margin: 20px 0; }
    .footer { background: #f8fafc; padding: 24px 32px; text-align: center; color: #94a3b8; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏥 Antigravity Medical</h1>
      <p>Votre prescription numérique est prête</p>
    </div>
    <div class="body">
      <p class="greeting">Bonjour ${params.patientName},</p>
      <p style="color: #475569; line-height: 1.6;">
        Votre prescription médicale a été enregistrée sur la plateforme Antigravity.
        Vous pouvez la consulter et la présenter le jour de votre examen via votre QR Code personnel.
      </p>

      <div class="info-card">
        <div class="info-row">
          <span class="label">Type d'examen</span>
          <span class="value">${params.examType}</span>
        </div>
        <div class="info-row">
          <span class="label">Prescrit par</span>
          <span class="value">${params.doctorName}</span>
        </div>
        <div class="info-row">
          <span class="label">Référence</span>
          <span class="value" style="font-family: monospace; font-size: 12px;">${params.prescriptionId}</span>
        </div>
        ${
          params.scheduledDate
            ? `<div class="info-row">
          <span class="label">Date planifiée</span>
          <span class="value">${new Intl.DateTimeFormat("fr-BE", { dateStyle: "full" }).format(params.scheduledDate)}</span>
        </div>`
            : ""
        }
      </div>

      <div class="qr-section">
        <p style="color: #475569; margin: 0 0 12px; font-size: 14px;">
          Présentez votre QR Code le jour de l'examen
        </p>
        <p style="font-family: monospace; font-size: 12px; color: #64748b; word-break: break-all;">${params.qrCode}</p>
        <small style="color: #94a3b8;">Code accessible dans votre espace patient</small>
      </div>

      <div style="text-align: center;">
        <a href="${prescriptionUrl}" class="btn">Voir ma prescription →</a>
      </div>
    </div>
    <div class="footer">
      <p>Antigravity Medical SaaS — Plateforme de digitalisation des ordonnances</p>
      <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `✅ Votre prescription "${params.examType}" est prête — Antigravity`,
    html: htmlContent,
  });
}

// ── Envoi de l'email de bienvenue ────────────────────────────
export async function sendWelcomeEmail(
  to: string,
  firstName: string
): Promise<void> {
  const baseUrl = getBaseUrl();

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Bienvenue sur Antigravity Medical 🏥",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="color: #1e40af;">Bienvenue, ${firstName} !</h1>
        <p>Votre compte Antigravity Medical a été créé avec succès.</p>
        <p>Vous pouvez dès maintenant accéder à votre espace patient pour :</p>
        <ul>
          <li>Numériser vos ordonnances via notre technologie OCR</li>
          <li>Consulter et gérer vos prescriptions</li>
          <li>Planifier vos examens radiologiques</li>
        </ul>
        <a href="${baseUrl}/dashboard" style="display: inline-block; background: #2563eb; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px;">
          Accéder à mon espace →
        </a>
      </div>
    `,
  });
}
