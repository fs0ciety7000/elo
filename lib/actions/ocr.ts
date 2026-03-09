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

// ── Nettoyage du texte OCR (supprime les en-têtes boilerplate) ──
function cleanOcrText(rawText: string): string {
  const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);

  // Patterns à ignorer : coordonnées cabinet, mentions légales, numéros
  const boilerplatePatterns = [
    /^\d{5}\s+\w+/,                        // Code postal + ville
    /tél?[.:]\s*[\d\s.\-()]+$/i,           // Lignes de téléphone
    /^\d{2}[\s.\-]\d{2}[\s.\-]\d{2}[\s.\-]\d{2}[\s.\-]\d{2}$/, // Numéro de téléphone
    /faculté\s+de\s+médecine/i,
    /médecine\s+générale/i,
    /n°\s*rpps/i,
    /sur\s+rendez[\s-]*vous/i,
    /absent[e]?\s+le?\s+/i,
    /membre\s+d.une\s+association/i,
    /règlement\s+par\s+chèque/i,
    /en\s+cas\s+d.urgence.+prière/i,
    /prière\s+d.appeler/i,
    /nam\s+\d+/i,
    /^\d{10,}$/,                           // Codes barres / NAM
    /^groupe\s+/i,
    /place\s+de\s+l.é?glise/i,
    /^docteur\s+[A-Z][a-zÀ-ÿ\-]+\s+[A-Z]/,  // Lignes d'en-tête médecin
    /de\s+la\s+faculté/i,
  ];

  return lines
    .filter((line) => !boilerplatePatterns.some((re) => re.test(line)))
    .join("\n");
}

// ── Analyse heuristique du texte brut ────────────────────────
function parseOcrText(rawText: string): ParsedPrescription {
  const cleaned = cleanOcrText(rawText);
  const lowerText = rawText.toLowerCase();
  const lowerCleaned = cleaned.toLowerCase();

  // Détection du type d'examen (cherche dans le texte complet)
  let examType = "Examen radiologique";
  let examKeywordPos = -1;
  for (const [type, keywords] of Object.entries(EXAM_KEYWORDS)) {
    for (const kw of keywords) {
      const pos = lowerText.indexOf(kw);
      if (pos !== -1) {
        examType = type;
        examKeywordPos = pos;
        break;
      }
    }
    if (examKeywordPos !== -1) break;
  }

  // Détection de l'urgence
  const urgency = lowerCleaned.includes("urgent") || lowerCleaned.includes("urgence");

  // Extraction du médecin
  const doctorMatch = rawText.match(/(?:Dr\.?|Docteur)\s+([A-Z][A-ZÀ-Ÿa-zÀ-ÿ\-]+(?:\s+[A-Z][A-ZÀ-Ÿa-zÀ-ÿ\-]+)?)/);
  const doctorName = doctorMatch ? doctorMatch[0] : "Médecin prescripteur";

  // Extraction du motif/diagnostic : texte du texte nettoyé après le type d'examen
  let diagnosis = "";
  let examDetails = "";

  const cleanedLines = cleaned.split("\n").filter(Boolean);
  let foundExam = false;
  const diagLines: string[] = [];

  for (const line of cleanedLines) {
    const lower = line.toLowerCase();
    // Cherche la ligne contenant le type d'examen
    if (!foundExam) {
      const isExamLine = Object.values(EXAM_KEYWORDS)
        .flat()
        .some((kw) => lower.includes(kw));
      if (isExamLine) {
        foundExam = true;
        // Prend le reste de la ligne après le mot-clé exam comme détails
        const detail = line.replace(/^(IRM|Scanner|Radio\w*|Écho\w*|Mammo\w*|Scinti\w*|PET[\s-]?Scan?)\s*/i, "").trim();
        if (detail) examDetails = detail;
        continue;
      }
    } else {
      // Ignore les lignes qui ressemblent à du bruit résiduel (date, numéro de patient court)
      if (!/^\d{1,2}\/\d{2}\/\d{2,4}$/.test(line) && !/^\d{1,3}$/.test(line)) {
        diagLines.push(line);
      }
    }
  }

  diagnosis = diagLines
    .join(" ")
    .replace(/\s{2,}/g, " ")
    .trim()
    // Nettoie les artefacts OCR courants sur l'écriture manuscrite
    .replace(/([a-z])\s+([a-z])/g, (_, a, b) => `${a} ${b}`)
    .trim();

  // Fallback : si rien trouvé après l'exam, prend le texte nettoyé complet
  if (!diagnosis && cleaned.length > 20) {
    diagnosis = cleaned.replace(/\n/g, " ").replace(/\s{2,}/g, " ").trim();
  }

  return {
    examType,
    examDetails,
    diagnosis,
    doctorName,
    notes: "",
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
