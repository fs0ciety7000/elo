// ============================================================
// Extraction de texte depuis un .docx (ZIP + XML)
// Sans dépendance externe — lecture du word/document.xml
// ============================================================

import { promisify } from "util";
import { unzip } from "zlib";

const unzipAsync = promisify(unzip);

export async function extractDocxText(buffer: Buffer): Promise<string> {
  // DOCX est un ZIP. On cherche word/document.xml
  // Parsing manuel du format ZIP central directory
  const zip = parseZip(buffer);
  const docXml = zip.get("word/document.xml");
  if (!docXml) throw new Error("word/document.xml introuvable");

  const xmlStr = docXml.toString("utf-8");

  // Extraction du texte depuis les balises <w:t>
  const matches = xmlStr.match(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g) ?? [];
  const text = matches
    .map((m) => m.replace(/<[^>]+>/g, "").trim())
    .filter(Boolean)
    .join(" ");

  return text;
}

// Parseur ZIP minimal (format PKZIP)
function parseZip(buf: Buffer): Map<string, Buffer> {
  const files = new Map<string, Buffer>();
  let i = 0;

  while (i < buf.length - 4) {
    // Local file header signature: PK\x03\x04
    if (
      buf[i] === 0x50 &&
      buf[i + 1] === 0x4b &&
      buf[i + 2] === 0x03 &&
      buf[i + 3] === 0x04
    ) {
      const compressionMethod = buf.readUInt16LE(i + 8);
      const compressedSize = buf.readUInt32LE(i + 18);
      const fileNameLength = buf.readUInt16LE(i + 26);
      const extraFieldLength = buf.readUInt16LE(i + 28);
      const fileName = buf.subarray(i + 30, i + 30 + fileNameLength).toString("utf-8");
      const dataOffset = i + 30 + fileNameLength + extraFieldLength;
      const compressedData = buf.subarray(dataOffset, dataOffset + compressedSize);

      try {
        if (compressionMethod === 0) {
          // Stored (no compression)
          files.set(fileName, compressedData);
        } else if (compressionMethod === 8) {
          // Deflate — synchronous decompression via raw inflate
          const inflated = inflateRaw(compressedData);
          if (inflated) files.set(fileName, inflated);
        }
      } catch {
        // Skip unreadable entries
      }

      i = dataOffset + compressedSize;
    } else {
      i++;
    }
  }

  return files;
}

function inflateRaw(data: Buffer): Buffer | null {
  try {
    const zlib = require("zlib");
    return zlib.inflateRawSync(data);
  } catch {
    return null;
  }
}
