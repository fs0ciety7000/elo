// GET /api/files/[filename] — servir les fichiers uploadés
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { readFile } from "fs/promises";
import { join, extname, basename } from "path";
import { existsSync } from "fs";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "/app/uploads";

const MIME_MAP: Record<string, string> = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
  ".webp": "image/webp", ".pdf": "application/pdf",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".doc": "application/msword",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const { filename } = await params;
  // Sécurité : interdire path traversal
  const safe = basename(filename);
  const filepath = join(UPLOAD_DIR, safe);

  if (!existsSync(filepath)) {
    return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
  }

  const ext = extname(safe).toLowerCase();
  const contentType = MIME_MAP[ext] ?? "application/octet-stream";
  const buffer = await readFile(filepath);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${safe}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
