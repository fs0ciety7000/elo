// POST /api/upload — upload de fichier prescription (image, PDF, Word)
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join, extname } from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "/app/uploads";
const MAX_SIZE = 20 * 1024 * 1024; // 20 Mo
const ALLOWED_MIME = [
  "image/jpeg", "image/jpg", "image/png", "image/webp",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
];

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "Aucun fichier" }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "Fichier trop grand (max 20 Mo)" }, { status: 400 });
  if (!ALLOWED_MIME.includes(file.type)) return NextResponse.json({ error: "Format non supporté" }, { status: 400 });

  const ext = extname(file.name) || ".bin";
  const filename = `${randomUUID()}${ext}`;
  const filepath = join(UPLOAD_DIR, filename);

  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);

    return NextResponse.json({
      url: `/api/files/${filename}`,
      name: file.name,
      size: file.size,
    });
  } catch (error) {
    console.error("[upload] Erreur :", error);
    return NextResponse.json({ error: "Erreur lors du stockage" }, { status: 500 });
  }
}
