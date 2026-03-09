// ============================================================
// Composant PDF — Prescription Antigravity Medical
// Rendu serveur via @react-pdf/renderer
// ============================================================

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  SCHEDULED: "Planifié",
  COMPLETED: "Terminé",
  CANCELLED: "Annulé",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingTop: 48,
    paddingBottom: 48,
    paddingHorizontal: 48,
    backgroundColor: "#ffffff",
    color: "#18181b",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e4e4e7",
  },
  logoBox: {
    width: 36,
    height: 36,
    backgroundColor: "#2563eb",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  logoText: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#2563eb",
  },
  logoSub: {
    fontSize: 8,
    color: "#71717a",
    marginTop: 2,
  },
  refBox: {
    alignItems: "flex-end",
  },
  refLabel: {
    fontSize: 8,
    color: "#a1a1aa",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  refValue: {
    fontSize: 8,
    color: "#52525b",
    fontFamily: "Helvetica-Bold",
    marginTop: 2,
  },
  statusBadge: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "#dbeafe",
    borderRadius: 4,
  },
  statusText: {
    fontSize: 8,
    color: "#1d4ed8",
    fontFamily: "Helvetica-Bold",
  },
  title: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: "#18181b",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: "#71717a",
    marginBottom: 20,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#a1a1aa",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  card: {
    backgroundColor: "#fafafa",
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e4e4e7",
  },
  row: {
    flexDirection: "row",
    marginBottom: 6,
  },
  labelCol: {
    width: 130,
    fontSize: 9,
    color: "#71717a",
    fontFamily: "Helvetica-Bold",
  },
  valueCol: {
    flex: 1,
    fontSize: 9,
    color: "#18181b",
  },
  grid: {
    flexDirection: "row",
    gap: 12,
  },
  gridItem: {
    flex: 1,
    backgroundColor: "#fafafa",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e4e4e7",
  },
  personName: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#18181b",
    marginBottom: 2,
  },
  personRole: {
    fontSize: 8,
    color: "#a1a1aa",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  personDetail: {
    fontSize: 8,
    color: "#52525b",
    marginBottom: 2,
  },
  urgentBadge: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  urgentText: {
    fontSize: 9,
    color: "#dc2626",
    fontFamily: "Helvetica-Bold",
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 48,
    right: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#e4e4e7",
    paddingTop: 10,
  },
  footerText: {
    fontSize: 7,
    color: "#a1a1aa",
  },
  qrNote: {
    backgroundColor: "#eff6ff",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    marginTop: 4,
  },
  qrNoteText: {
    fontSize: 9,
    color: "#1d4ed8",
  },
  qrCode: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#1e40af",
    marginTop: 4,
  },
});

interface PrescriptionData {
  id: string;
  qrCode: string;
  examType: string;
  examDetails: string | null;
  diagnosis: string | null;
  notes: string | null;
  urgency: boolean;
  status: string;
  scheduledDate: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  prescribingDoctorName?: string | null;
  patient: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
    birthDate?: Date | null;
    nationalId?: string | null;
  };
  doctor?: {
    firstName: string;
    lastName: string;
    speciality?: string | null;
    inami?: string | null;
    email: string;
    phone?: string | null;
  } | null;
}

function formatDateSimple(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("fr-BE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function PrescriptionPdf({ prescription }: { prescription: PrescriptionData }) {
  return (
    <Document
      title={`Prescription — ${prescription.examType}`}
      author="Antigravity Medical"
      subject="Prescription médicale"
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logoText}>Antigravity</Text>
            <Text style={styles.logoSub}>Plateforme médicale numérique</Text>
          </View>
          <View style={styles.refBox}>
            <Text style={styles.refLabel}>Référence</Text>
            <Text style={styles.refValue}>{prescription.id.slice(0, 12)}…</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{STATUS_LABELS[prescription.status] ?? prescription.status}</Text>
            </View>
          </View>
        </View>

        {/* Titre */}
        <Text style={styles.title}>{prescription.examType}</Text>
        <Text style={styles.subtitle}>
          Prescription du {formatDateSimple(prescription.createdAt)}
        </Text>

        {/* Urgent */}
        {prescription.urgency && (
          <View style={styles.urgentBadge}>
            <Text style={styles.urgentText}>⚠ URGENT — Traitement prioritaire requis</Text>
          </View>
        )}

        {/* Détails médicaux */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{"Détails de l'examen"}</Text>
          <View style={styles.card}>
            {prescription.diagnosis && (
              <View style={styles.row}>
                <Text style={styles.labelCol}>Motif / Diagnostic</Text>
                <Text style={styles.valueCol}>{prescription.diagnosis}</Text>
              </View>
            )}
            {prescription.examDetails && (
              <View style={styles.row}>
                <Text style={styles.labelCol}>Précisions techniques</Text>
                <Text style={styles.valueCol}>{prescription.examDetails}</Text>
              </View>
            )}
            {prescription.notes && (
              <View style={styles.row}>
                <Text style={styles.labelCol}>Notes au radiologue</Text>
                <Text style={styles.valueCol}>{prescription.notes}</Text>
              </View>
            )}
            {prescription.scheduledDate && (
              <View style={styles.row}>
                <Text style={styles.labelCol}>Date planifiée</Text>
                <Text style={styles.valueCol}>{formatDateSimple(prescription.scheduledDate)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Intervenants */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Intervenants</Text>
          <View style={styles.grid}>
            {/* Patient */}
            <View style={styles.gridItem}>
              <Text style={styles.personRole}>Patient</Text>
              <Text style={styles.personName}>
                {prescription.patient.firstName} {prescription.patient.lastName}
              </Text>
              <Text style={styles.personDetail}>{prescription.patient.email}</Text>
              {prescription.patient.phone && (
                <Text style={styles.personDetail}>{prescription.patient.phone}</Text>
              )}
              {prescription.patient.birthDate && (
                <Text style={styles.personDetail}>
                  Né(e) le {formatDateSimple(prescription.patient.birthDate)}
                </Text>
              )}
            </View>

            {/* Médecin */}
            <View style={styles.gridItem}>
              <Text style={styles.personRole}>Médecin prescripteur</Text>
              {prescription.doctor ? (
                <>
                  <Text style={styles.personName}>
                    Dr. {prescription.doctor.firstName} {prescription.doctor.lastName}
                  </Text>
                  {prescription.doctor.speciality && (
                    <Text style={styles.personDetail}>{prescription.doctor.speciality}</Text>
                  )}
                  {prescription.doctor.inami && (
                    <Text style={styles.personDetail}>INAMI : {prescription.doctor.inami}</Text>
                  )}
                  <Text style={styles.personDetail}>{prescription.doctor.email}</Text>
                </>
              ) : prescription.prescribingDoctorName ? (
                <Text style={styles.personName}>Dr. {prescription.prescribingDoctorName}</Text>
              ) : (
                <Text style={styles.personDetail}>Non renseigné</Text>
              )}
            </View>
          </View>
        </View>

        {/* QR Code note */}
        <View style={styles.qrNote}>
          <Text style={styles.qrNoteText}>
            Présentez le QR Code de cette prescription à l'accueil du centre d'imagerie le jour de votre examen.
          </Text>
          <Text style={styles.qrCode}>Ref. QR : {prescription.qrCode}</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Antigravity Medical — Document confidentiel</Text>
          <Text style={styles.footerText}>
            Généré le {formatDateSimple(new Date())}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
