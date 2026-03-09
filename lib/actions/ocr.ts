// ============================================================
// Server Action — Traitement OCR via Google Cloud Vision
// Analyse une image d'ordonnance manuscrite et extrait le texte
// ============================================================

"use server";

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

// ── Mots-clés pour l'analyse heuristique du texte OCR ────────
const EXAM_KEYWORDS: Record<string, string[]> = {
  "IRM": ["irm", "mri", "imagerie par résonance"],
  "Scanner CT": ["scanner", "ct", "tomodensitométrie", "tdm"],
  "Radiographie": ["radio", "rx", "radiographie", "rayon"],
  "Échographie": ["echo", "échographie", "us", "ultrasound"],
  "Mammographie": ["mammo", "mammographie"],
  "Scintigraphie": ["scinti", "scintigraphie"],
  "PET Scan": ["pet", "pet-scan", "tep"],
};

// ── Analyse heuristique du texte brut ────────────────────────
function parseOcrText(rawText: string): ParsedPrescription {
  const lowerText = rawText.toLowerCase();

  // Détection du type d'examen
  let examType = "Examen radiologique";
  for (const [type, keywords] of Object.entries(EXAM_KEYWORDS)) {
    if (keywords.some((kw) => lowerText.includes(kw))) {
      examType = type;
      break;
    }
  }

  // Détection de l'urgence
  const urgency = lowerText.includes("urgent") || lowerText.includes("urgence");

  // Extraction basique du médecin (pattern "Dr. Nom" ou "Docteur Nom")
  const doctorMatch = rawText.match(/(?:Dr\.?|Docteur)\s+([A-Z][a-zÀ-ÿ]+(?:\s+[A-Z][a-zÀ-ÿ]+)?)/i);
  const doctorName = doctorMatch ? doctorMatch[0] : "Médecin prescripteur";

  return {
    examType,
    examDetails: "",
    diagnosis: "",
    doctorName,
    notes: rawText.trim(),
    urgency,
  };
}

// ── Server Action principale ──────────────────────────────────
export async function processPrescriptionImage(
  formData: FormData
): Promise<OcrResult> {
  // Vérification de l'authentification
  const session = await getSession();
  if (!session) {
    return { success: false, message: "Vous devez être connecté pour utiliser cette fonctionnalité" };
  }

  const file = formData.get("image") as File | null;
  if (!file || file.size === 0) {
    return { success: false, message: "Aucune image fournie" };
  }

  // Vérification du type MIME (JPEG, PNG, WebP uniquement)
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return {
      success: false,
      message: "Format non supporté. Utilisez une image JPEG, PNG ou WebP.",
    };
  }

  // Vérification de la taille (max 10 Mo)
  if (file.size > 10 * 1024 * 1024) {
    return { success: false, message: "L'image ne peut pas dépasser 10 Mo" };
  }

  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      message: "L'OCR n'est pas configuré (GOOGLE_VISION_API_KEY manquant)",
    };
  }

  try {
    // Conversion de l'image en base64 pour l'API Google Vision
    const buffer = await file.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString("base64");

    // Appel à l'API Google Cloud Vision (DOCUMENT_TEXT_DETECTION)
    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [
            {
              image: { content: base64Image },
              features: [
                {
                  type: "DOCUMENT_TEXT_DETECTION",
                  maxResults: 1,
                },
              ],
              imageContext: {
                languageHints: ["fr", "nl", "en"],
              },
            },
          ],
        }),
      }
    );

    if (!visionResponse.ok) {
      const errorBody = await visionResponse.text();
      console.error("[OCR] Erreur Google Vision API :", errorBody);
      return {
        success: false,
        message: "Erreur lors de l'appel à l'API de reconnaissance optique",
      };
    }

    const visionData = await visionResponse.json();

    // Extraction du texte depuis la réponse
    const rawText =
      visionData?.responses?.[0]?.fullTextAnnotation?.text ?? "";

    if (!rawText) {
      return {
        success: false,
        message:
          "Aucun texte détecté dans l'image. Assurez-vous que l'image est nette et bien éclairée.",
      };
    }

    // Analyse heuristique du texte pour pré-remplir les champs
    const parsedData = parseOcrText(rawText);

    // Audit log : traitement OCR
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

    return {
      success: true,
      rawText,
      parsedData,
    };
  } catch (error) {
    console.error("[processPrescriptionImage] Erreur :", error);
    return {
      success: false,
      message: "Une erreur inattendue s'est produite lors du traitement de l'image",
    };
  }
}
