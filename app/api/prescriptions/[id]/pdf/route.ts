// ============================================================
// API Route : Génération PDF d'une prescription
// GET /api/prescriptions/[id]/pdf
// ============================================================
// @react-pdf/renderer est dans experimental.serverComponentsExternalPackages
// → pas bundlé par webpack → même instance React → pas de conflit.
// Génération via React.createElement pur (pas de JSX).
// Police Open Sans (TTF) pour les accents français.
// QR Code généré via qrcode → base64 → Image dans le PDF.
// ============================================================

import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Role } from "@prisma/client";
import React from "react";
import {
  renderToBuffer,
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ── Enregistrement de la police (Unicode + accents français) ──
const fontsDir = path.join(process.cwd(), "public", "fonts");
Font.register({
  family: "OpenSans",
  fonts: [
    { src: path.join(fontsDir, "OpenSans-Regular.ttf"), fontWeight: "normal" },
    { src: path.join(fontsDir, "OpenSans-Bold.ttf"),    fontWeight: "bold"   },
  ],
});

// ── Helpers ───────────────────────────────────────────────────
function fmt(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("fr-BE", {
    day: "2-digit", month: "long", year: "numeric",
  }).format(new Date(date));
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente", SCHEDULED: "Planifié",
  COMPLETED: "Terminé",  CANCELLED: "Annulé",
};

// ── Styles ────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const styles = StyleSheet.create<any>({
  page:         { fontFamily: "OpenSans", fontWeight: "normal", fontSize: 10, paddingTop: 48, paddingBottom: 64, paddingHorizontal: 48, backgroundColor: "#ffffff", color: "#18181b" },
  header:       { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: "#e4e4e7" },
  logoText:     { fontSize: 16, fontFamily: "OpenSans", fontWeight: "bold", color: "#2563eb" },
  logoSub:      { fontSize: 8, color: "#71717a", marginTop: 2 },
  refBox:       { alignItems: "flex-end" },
  refLabel:     { fontSize: 8, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: 1 },
  refValue:     { fontSize: 8, color: "#52525b", fontFamily: "OpenSans", fontWeight: "bold", marginTop: 2 },
  statusBadge:  { marginTop: 6, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: "#dbeafe", borderRadius: 4 },
  statusText:   { fontSize: 8, color: "#1d4ed8", fontFamily: "OpenSans", fontWeight: "bold" },
  title:        { fontSize: 20, fontFamily: "OpenSans", fontWeight: "bold", color: "#18181b", marginBottom: 4 },
  subtitle:     { fontSize: 10, color: "#71717a", marginBottom: 20 },
  urgentBadge:  { backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "#fecaca", borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start", marginBottom: 12 },
  urgentText:   { fontSize: 9, color: "#dc2626", fontFamily: "OpenSans", fontWeight: "bold" },
  section:      { marginBottom: 16 },
  sectionTitle: { fontSize: 8, fontFamily: "OpenSans", fontWeight: "bold", color: "#a1a1aa", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 },
  card:         { backgroundColor: "#fafafa", borderRadius: 8, padding: 14, borderWidth: 1, borderColor: "#e4e4e7" },
  row:          { flexDirection: "row", marginBottom: 6 },
  labelCol:     { width: 130, fontSize: 9, color: "#71717a", fontFamily: "OpenSans", fontWeight: "bold" },
  valueCol:     { flex: 1, fontSize: 9, color: "#18181b" },
  grid:         { flexDirection: "row", gap: 12 },
  gridItem:     { flex: 1, backgroundColor: "#fafafa", borderRadius: 8, padding: 12, borderWidth: 1, borderColor: "#e4e4e7" },
  personName:   { fontSize: 10, fontFamily: "OpenSans", fontWeight: "bold", color: "#18181b", marginBottom: 2 },
  personRole:   { fontSize: 8, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  personDetail: { fontSize: 8, color: "#52525b", marginBottom: 2 },
  // QR Code section
  qrSection:    { flexDirection: "row", alignItems: "flex-start", gap: 16, backgroundColor: "#eff6ff", borderRadius: 8, padding: 14, borderWidth: 1, borderColor: "#bfdbfe", marginTop: 16 },
  qrImage:      { width: 80, height: 80 },
  qrTextBox:    { flex: 1 },
  qrTitle:      { fontSize: 9, fontFamily: "OpenSans", fontWeight: "bold", color: "#1e40af", marginBottom: 4 },
  qrNoteText:   { fontSize: 8, color: "#1d4ed8", lineHeight: 1.5 },
  qrRefLine:    { fontSize: 8, fontFamily: "OpenSans", fontWeight: "bold", color: "#1e40af", marginTop: 6 },
  footer:       { position: "absolute", bottom: 24, left: 48, right: 48, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#e4e4e7", paddingTop: 10 },
  footerText:   { fontSize: 7, color: "#a1a1aa" },
});

// ── Handler ───────────────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;

  const prescription = await prisma.prescription.findUnique({
    where: { id },
    include: {
      patient: { select: { firstName: true, lastName: true, email: true, phone: true, birthDate: true, nationalId: true } },
      doctor:  { select: { firstName: true, lastName: true, speciality: true, inami: true, email: true, phone: true } },
    },
  });

  if (!prescription) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  if (session.role === Role.PATIENT && prescription.patientId !== session.id) {
    return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
  }

  const p = prescription;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdn = (p as any).prescribingDoctorName as string | null | undefined;
  const doctorLine = p.doctor
    ? `Dr. ${p.doctor.firstName} ${p.doctor.lastName}`
    : pdn ? `Dr. ${pdn}` : null;

  // ── Génération du QR Code (PNG base64) ────────────────────
  const qrDataUrl = await QRCode.toDataURL(p.qrCode ?? p.id, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 200,
    color: { dark: "#1e3a8a", light: "#eff6ff" },
  });

  // ── Arbre PDF (React.createElement, pas de JSX) ────────────
  const ce = React.createElement;

  const doc = ce(Document, { title: `Prescription — ${p.examType}`, author: "Antigravity Medical", subject: "Prescription médicale" },
    ce(Page, { size: "A4", style: styles.page },

      // En-tête
      ce(View, { style: styles.header },
        ce(View, null,
          ce(Text, { style: styles.logoText }, "Antigravity"),
          ce(Text, { style: styles.logoSub }, "Plateforme médicale numérique"),
        ),
        ce(View, { style: styles.refBox },
          ce(Text, { style: styles.refLabel }, "Référence"),
          ce(Text, { style: styles.refValue }, `${p.id.slice(0, 12)}...`),
          ce(View, { style: styles.statusBadge },
            ce(Text, { style: styles.statusText }, STATUS_LABELS[p.status] ?? p.status),
          ),
        ),
      ),

      // Titre
      ce(Text, { style: styles.title }, p.examType),
      ce(Text, { style: styles.subtitle }, `Prescription du ${fmt(p.createdAt)}`),

      // Badge urgent
      ...(p.urgency ? [ce(View, { style: styles.urgentBadge }, ce(Text, { style: styles.urgentText }, "URGENT — Traitement prioritaire requis"))] : []),

      // Détails de l'examen
      ce(View, { style: styles.section },
        ce(Text, { style: styles.sectionTitle }, "Détails de l'examen"),
        ce(View, { style: styles.card },
          ...(p.diagnosis    ? [ce(View, { style: styles.row }, ce(Text, { style: styles.labelCol }, "Motif / Diagnostic"),     ce(Text, { style: styles.valueCol }, p.diagnosis))]    : []),
          ...(p.examDetails  ? [ce(View, { style: styles.row }, ce(Text, { style: styles.labelCol }, "Précisions techniques"),  ce(Text, { style: styles.valueCol }, p.examDetails))]  : []),
          ...(p.notes        ? [ce(View, { style: styles.row }, ce(Text, { style: styles.labelCol }, "Notes au radiologue"),    ce(Text, { style: styles.valueCol }, p.notes))]        : []),
          ...(p.scheduledDate? [ce(View, { style: styles.row }, ce(Text, { style: styles.labelCol }, "Date planifiée"),         ce(Text, { style: styles.valueCol }, fmt(p.scheduledDate)))] : []),
        ),
      ),

      // Intervenants
      ce(View, { style: styles.section },
        ce(Text, { style: styles.sectionTitle }, "Intervenants"),
        ce(View, { style: styles.grid },
          ce(View, { style: styles.gridItem },
            ce(Text, { style: styles.personRole }, "Patient"),
            ce(Text, { style: styles.personName }, `${p.patient.firstName} ${p.patient.lastName}`),
            ce(Text, { style: styles.personDetail }, p.patient.email),
            ...(p.patient.phone     ? [ce(Text, { style: styles.personDetail }, p.patient.phone)]                         : []),
            ...(p.patient.birthDate ? [ce(Text, { style: styles.personDetail }, `Né(e) le ${fmt(p.patient.birthDate)}`)] : []),
          ),
          ce(View, { style: styles.gridItem },
            ce(Text, { style: styles.personRole }, "Médecin prescripteur"),
            ...(doctorLine           ? [ce(Text, { style: styles.personName }, doctorLine)]                             : [ce(Text, { style: styles.personDetail }, "Non renseigné")]),
            ...(p.doctor?.speciality ? [ce(Text, { style: styles.personDetail }, p.doctor.speciality)]                  : []),
            ...(p.doctor?.inami      ? [ce(Text, { style: styles.personDetail }, `INAMI : ${p.doctor.inami}`)]          : []),
            ...(p.doctor?.email      ? [ce(Text, { style: styles.personDetail }, p.doctor.email)]                       : []),
          ),
        ),
      ),

      // QR Code
      ce(View, { style: styles.qrSection },
        ce(Image, { style: styles.qrImage, src: qrDataUrl }),
        ce(View, { style: styles.qrTextBox },
          ce(Text, { style: styles.qrTitle }, "Code QR de la prescription"),
          ce(Text, { style: styles.qrNoteText }, "Présentez ce QR Code à l'accueil du centre d'imagerie le jour de votre examen. Il permettra au personnel soignant d'accéder directement à votre dossier."),
          ce(Text, { style: styles.qrRefLine }, `Réf. : ${p.qrCode ?? p.id}`),
        ),
      ),

      // Pied de page
      ce(View, { style: styles.footer, fixed: true },
        ce(Text, { style: styles.footerText }, "Antigravity Medical — Document confidentiel"),
        ce(Text, { style: styles.footerText }, `Généré le ${fmt(new Date())}`),
      ),
    ),
  );

  const pdfBuffer = await renderToBuffer(doc);

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="prescription-${p.id.slice(0, 8)}.pdf"`,
    },
  });
}
