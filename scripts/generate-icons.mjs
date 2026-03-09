import sharp from "sharp";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");
const src = join(publicDir, "logo.png");

// ── Logo redimensionné avec fond aplati ───────────────────────
async function resizedLogoFlattened(size, bgR, bgG, bgB) {
  return sharp(src)
    .resize(size, size, {
      fit: "contain",
      background: { r: bgR, g: bgG, b: bgB, alpha: 1 },
    })
    .flatten({ background: { r: bgR, g: bgG, b: bgB } })
    .png()
    .toBuffer();
}

// ── Fond bleu + logo centré (PWA maskable) ────────────────────
async function blueBgWithLogo(canvasSize, logoRatio = 0.72) {
  const logoSize = Math.round(canvasSize * logoRatio);
  const offset   = Math.floor((canvasSize - logoSize) / 2);
  const logoFlat = await resizedLogoFlattened(logoSize, 37, 99, 235);

  return sharp({
    create: { width: canvasSize, height: canvasSize, channels: 3, background: { r: 37, g: 99, b: 235 } },
  })
    .composite([{ input: logoFlat, left: offset, top: offset }])
    .flatten({ background: { r: 37, g: 99, b: 235 } })
    .png();
}

// ── Fond blanc + logo centré (apple touch / favicon) ──────────
async function whiteBgWithLogo(canvasSize, logoRatio = 0.80) {
  const logoSize = Math.round(canvasSize * logoRatio);
  const offset   = Math.floor((canvasSize - logoSize) / 2);
  const logoFlat = await resizedLogoFlattened(logoSize, 255, 255, 255);

  return sharp({
    create: { width: canvasSize, height: canvasSize, channels: 3, background: { r: 255, g: 255, b: 255 } },
  })
    .composite([{ input: logoFlat, left: offset, top: offset }])
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .png();
}

// ── Génération ────────────────────────────────────────────────
async function generate() {
  await (await blueBgWithLogo(192)).toFile(join(publicDir, "icon-192.png"));
  console.log("✓ icon-192.png");

  await (await blueBgWithLogo(512)).toFile(join(publicDir, "icon-512.png"));
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
