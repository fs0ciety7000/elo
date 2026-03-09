import sharp from "sharp";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");
const src = join(publicDir, "logo.png");

// ── Flatten finale : force RGB (3 canaux, 0 alpha) ────────────
async function forceRgb(input, r, g, b) {
  const buf = await (typeof input === "string"
    ? sharp(input)
    : sharp(input)
  )
    .flatten({ background: { r, g, b } })
    .removeAlpha()
    .png()
    .toBuffer();
  // Second pass to be absolutely sure
  return sharp(buf)
    .flatten({ background: { r, g, b } })
    .removeAlpha()
    .png()
    .toBuffer();
}

// ── Logo redimensionné + fond aplati ─────────────────────────
async function resizedLogo(size, bgR, bgG, bgB) {
  const buf = await sharp(src)
    .resize(size, size, {
      fit: "contain",
      background: { r: bgR, g: bgG, b: bgB, alpha: 255 },
    })
    .flatten({ background: { r: bgR, g: bgG, b: bgB } })
    .removeAlpha()
    .png()
    .toBuffer();
  return buf;
}

// ── Fond bleu + logo centré (PWA maskable) ────────────────────
async function blueBgWithLogo(canvasSize, logoRatio = 0.72) {
  const bgR = 37, bgG = 99, bgB = 235;
  const logoSize = Math.round(canvasSize * logoRatio);
  const offset   = Math.floor((canvasSize - logoSize) / 2);
  const logoFlat = await resizedLogo(logoSize, bgR, bgG, bgB);

  // Composite onto blue canvas
  const composed = await sharp({
    create: { width: canvasSize, height: canvasSize, channels: 4, background: { r: bgR, g: bgG, b: bgB, alpha: 255 } },
  })
    .composite([{ input: logoFlat, left: offset, top: offset }])
    .png()
    .toBuffer();

  // Force RGB — second pass removes any residual alpha
  return sharp(await forceRgb(composed, bgR, bgG, bgB));
}

// ── Fond blanc + logo centré (apple touch / favicon) ──────────
async function whiteBgWithLogo(canvasSize, logoRatio = 0.80) {
  const bgR = 255, bgG = 255, bgB = 255;
  const logoSize = Math.round(canvasSize * logoRatio);
  const offset   = Math.floor((canvasSize - logoSize) / 2);
  const logoFlat = await resizedLogo(logoSize, bgR, bgG, bgB);

  const composed = await sharp({
    create: { width: canvasSize, height: canvasSize, channels: 4, background: { r: bgR, g: bgG, b: bgB, alpha: 255 } },
  })
    .composite([{ input: logoFlat, left: offset, top: offset }])
    .png()
    .toBuffer();

  return sharp(await forceRgb(composed, bgR, bgG, bgB));
}

// ── Génération ────────────────────────────────────────────────
async function generate() {
  await (await whiteBgWithLogo(192)).toFile(join(publicDir, "icon-192.png"));
  console.log("✓ icon-192.png");

  await (await whiteBgWithLogo(512)).toFile(join(publicDir, "icon-512.png"));
  console.log("✓ icon-512.png");

  await (await whiteBgWithLogo(180)).toFile(join(publicDir, "apple-touch-icon.png"));
  console.log("✓ apple-touch-icon.png");

  await (await whiteBgWithLogo(32, 0.88)).toFile(join(publicDir, "favicon.ico"));
  console.log("✓ favicon.ico");

  const png64 = await (await whiteBgWithLogo(64)).toBuffer();
  writeFileSync(
    join(publicDir, "favicon.svg"),
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 64 64" width="64" height="64">\n  <image href="data:image/png;base64,${png64.toString("base64")}" width="64" height="64" />\n</svg>`
  );
  console.log("✓ favicon.svg");

  console.log("\nDone.");
}

generate().catch(console.error);
