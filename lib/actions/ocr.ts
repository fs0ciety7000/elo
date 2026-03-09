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
    return { success: false, message: "Aucun fichier fourni" };
  }

  // Types MIME acceptés : images, PDF, Word
  const allowedTypes = [
    "image/jpeg", "image/jpg", "image/png", "image/webp",
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

  // Limite : 20 Mo
  if (file.size > 20 * 1024 * 1024) {
    return { success: false, message: "Le fichier ne peut pas dépasser 20 Mo" };
  }

  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      message: "L'OCR n'est pas configuré (GOOGLE_VISION_API_KEY manquant)",
    };
  }

  try {
    const buffer = await file.arrayBuffer();
    const base64Content = Buffer.from(buffer).toString("base64");

    const isPdf = file.type === "application/pdf";
    const isWord =
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.type === "application/msword";

    let rawText = "";

    if (isWord) {
      // Word : extraction du texte XML brut depuis le .docx (ZIP)
      // Lecture simplifiée sans dépendance externe
      try {
        const { extractDocxText } = await import("@/lib/docx");
        rawText = await extractDocxText(Buffer.from(buffer));
      } catch {
        return { success: false, message: "Impossible de lire le fichier Word" };
      }
    } else {
      // Image ou PDF → Google Vision API
      let visionUrl: string;
      let visionBody: object;

      if (isPdf) {
        // Endpoint dédié aux fichiers PDF/TIFF (inline)
        visionUrl = `https://vision.googleapis.com/v1/files:annotate?key=${apiKey}`;
        visionBody = {
          requests: [
            {
              inputConfig: {
                content: base64Content,
                mimeType: "application/pdf",
              },
              features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
              pages: [1, 2], // Max 2 premières pages
            },
          ],
        };
      } else {
        // Image classique
        visionUrl = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;
        visionBody = {
          requests: [
            {
              image: { content: base64Content },
              features: [{ type: "DOCUMENT_TEXT_DETECTION", maxResults: 1 }],
              imageContext: { languageHints: ["fr", "nl", "en"] },
            },
          ],
        };
      }

      const visionResponse = await fetch(visionUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(visionBody),
      });

      if (!visionResponse.ok) {
        const errorBody = await visionResponse.text();
        console.error("[OCR] Erreur Google Vision API :", errorBody);
        return {
          success: false,
          message: "Erreur lors de l'appel à l'API de reconnaissance optique",
        };
      }

      const visionData = await visionResponse.json();

      if (isPdf) {
        // Réponse PDF : responses[].responses[].fullTextAnnotation.text
        const pages = visionData?.responses?.[0]?.responses ?? [];
        rawText = pages.map((p: { fullTextAnnotation?: { text?: string } }) =>
          p?.fullTextAnnotation?.text ?? ""
        ).join("\n");
      } else {
        rawText = visionData?.responses?.[0]?.fullTextAnnotation?.text ?? "";
      }
    }

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
