// ============================================================
// Server Action — Traitement OCR via Claude Vision (Anthropic)
// Analyse une image d'ordonnance manuscrite et extrait le texte
// ============================================================

"use server";

import Anthropic from "@anthropic-ai/sdk";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

// ── Types ─────────────────────────────────────────────────────
export interface OcrResult {
  success: boolean;
  rawText?: string;
  parsedData?: ParsedPrescription;
  message?: string;
}

export interface ParsedPrescription {
  examType: string;
  examDetails: string;
  diagnosis: string;
  doctorName: string;
  notes: string;
  urgency: boolean;
}

// ── Prompt système pour l'analyse d'ordonnance médicale ──────
const PRESCRIPTION_PROMPT = `Tu es un assistant spécialisé dans la lecture d'ordonnances médicales françaises manuscrites.

Analyse l'image et extrais les informations suivantes. Réponds UNIQUEMENT avec un objet JSON valide, sans aucun texte avant ou après.

Format de réponse attendu :
{
  "rawText": "transcription fidèle et complète de tout le texte visible sur l'ordonnance",
  "examType": "type d'examen prescrit (ex: IRM, Scanner CT, Radiographie, Échographie, Mammographie, Scintigraphie, PET Scan, ou Examen radiologique si inconnu)",
  "examDetails": "détails de l'examen (zone anatomique, côté droit/gauche, protocole...)",
  "diagnosis": "motif/indication médicale, symptômes, antécédents pertinents",
  "doctorName": "nom du médecin prescripteur",
  "patientName": "nom et prénom du patient si visible",
  "date": "date de l'ordonnance (format JJ/MM/AAAA si possible)",
  "urgency": false,
  "notes": "autres informations utiles (numéro de téléphone du service, instructions spéciales...)"
}

Règles importantes :
- Déchiffre l'écriture médicale manuscrite française avec attention
- ATCD = antécédents, Dt = droite, G = gauche, genou = genou, IRM = IRM, Dr = Docteur
- Pour rawText : retranscris tout ce qui est lisible, y compris les en-têtes du cabinet
- Pour urgency : true uniquement si "urgent" ou "urgence" est explicitement écrit
- Si une information est illisible ou absente, utilise une chaîne vide ""
- Ne devine pas, reste fidèle au contenu visible`;

// ── Server Action principale ──────────────────────────────────
export async function processPrescriptionImage(
  formData: FormData
): Promise<OcrResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, message: "Vous devez être connecté pour utiliser cette fonctionnalité" };
  }

  const file = formData.get("image") as File | null;
  if (!file || file.size === 0) {
    return { success: false, message: "Aucun fichier fourni" };
  }

  const allowedTypes = [
    "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif",
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
  ];
  if (!allowedTypes.includes(file.type)) {
    return {
      success: false,
      message: "Format non supporté. Utilisez JPEG, PNG, WebP, PDF ou Word (.docx).",
    };
  }

  if (file.size > 20 * 1024 * 1024) {
    return { success: false, message: "Le fichier ne peut pas dépasser 20 Mo" };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      message: "L'OCR n'est pas configuré (ANTHROPIC_API_KEY manquant)",
    };
  }

  try {
    const buffer = await file.arrayBuffer();
    const base64Content = Buffer.from(buffer).toString("base64");

    const isWord =
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.type === "application/msword";

    let rawText = "";
    let parsedData: ParsedPrescription;

    if (isWord) {
      // Word : extraction du texte XML brut depuis le .docx (ZIP)
      try {
        const { extractDocxText } = await import("@/lib/docx");
        rawText = await extractDocxText(Buffer.from(buffer));
      } catch {
        return { success: false, message: "Impossible de lire le fichier Word" };
      }
      parsedData = parseWordText(rawText);
    } else {
      // Image ou PDF → Claude Vision
      const client = new Anthropic({ apiKey });

      let mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp" | "application/pdf";
      if (file.type === "application/pdf") {
        mediaType = "application/pdf";
      } else if (file.type === "image/png") {
        mediaType = "image/png";
      } else if (file.type === "image/gif") {
        mediaType = "image/gif";
      } else if (file.type === "image/webp") {
        mediaType = "image/webp";
      } else {
        mediaType = "image/jpeg";
      }

      const messageContent: Anthropic.MessageParam["content"] = mediaType === "application/pdf"
        ? [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: base64Content,
              },
            },
            { type: "text", text: PRESCRIPTION_PROMPT },
          ]
        : [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: base64Content,
              },
            },
            { type: "text", text: PRESCRIPTION_PROMPT },
          ];

      const response = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        messages: [{ role: "user", content: messageContent }],
      });

      const responseText = response.content
        .filter((b) => b.type === "text")
        .map((b) => (b as { type: "text"; text: string }).text)
        .join("");

      // Parse the JSON response from Claude
      let claudeResult: {
        rawText?: string;
        examType?: string;
        examDetails?: string;
        diagnosis?: string;
        doctorName?: string;
        patientName?: string;
        date?: string;
        urgency?: boolean;
        notes?: string;
      };
      try {
        // Extract JSON from the response (Claude might add markdown code blocks)
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No JSON found");
        claudeResult = JSON.parse(jsonMatch[0]);
      } catch {
        console.error("[OCR] Réponse Claude non-JSON :", responseText);
        return {
          success: false,
          message: "Erreur lors de l'analyse de l'ordonnance. Veuillez réessayer.",
        };
      }

      rawText = claudeResult.rawText ?? responseText;

      // Enrichit les notes avec le nom du patient et la date si trouvés
      const extraNotes: string[] = [];
      if (claudeResult.patientName) extraNotes.push(`Patient : ${claudeResult.patientName}`);
      if (claudeResult.date) extraNotes.push(`Date : ${claudeResult.date}`);
      if (claudeResult.notes) extraNotes.push(claudeResult.notes);

      parsedData = {
        examType: claudeResult.examType || "Examen radiologique",
        examDetails: claudeResult.examDetails || "",
        diagnosis: claudeResult.diagnosis || "",
        doctorName: claudeResult.doctorName || "Médecin prescripteur",
        urgency: claudeResult.urgency ?? false,
        notes: extraNotes.join(" — "),
      };
    }

    if (!rawText) {
      return {
        success: false,
        message: "Aucun texte détecté dans l'image. Assurez-vous que l'image est nette et bien éclairée.",
      };
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "OCR_PROCESS",
        metadata: {
          fileSize: file.size,
          fileType: file.type,
          textLength: rawText.length,
        },
      },
    });

    return { success: true, rawText, parsedData };
  } catch (error) {
    console.error("[processPrescriptionImage] Erreur :", error);
    return {
      success: false,
      message: "Une erreur inattendue s'est produite lors du traitement de l'image",
    };
  }
}

// ── Fallback heuristique pour les fichiers Word ───────────────
function parseWordText(rawText: string): ParsedPrescription {
  const lower = rawText.toLowerCase();

  const EXAM_KEYWORDS: Record<string, string[]> = {
    "IRM": ["irm", "mri", "imagerie par résonance"],
    "Scanner CT": ["scanner", "ct", "tomodensitométrie", "tdm"],
    "Radiographie": ["radio", "rx", "radiographie", "rayon"],
    "Échographie": ["echo", "échographie", "ultrasound"],
    "Mammographie": ["mammo", "mammographie"],
    "Scintigraphie": ["scinti", "scintigraphie"],
    "PET Scan": ["pet", "pet-scan", "tep"],
  };

  let examType = "Examen radiologique";
  for (const [type, keywords] of Object.entries(EXAM_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      examType = type;
      break;
    }
  }

  const doctorMatch = rawText.match(/(?:Dr\.?|Docteur)\s+([A-ZÀ-Ÿ][A-Za-zÀ-ÿ\-]+(?:\s+[A-ZÀ-Ÿ][A-Za-zÀ-ÿ\-]+)?)/);

  return {
    examType,
    examDetails: "",
    diagnosis: rawText.replace(/\n/g, " ").trim(),
    doctorName: doctorMatch ? doctorMatch[0] : "Médecin prescripteur",
    urgency: lower.includes("urgent") || lower.includes("urgence"),
    notes: "",
  };
}
