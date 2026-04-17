/**
 * Genera PNGs PWA y favicon.ico desde public/brand-logo.png (logo horizontal centrado en cuadrado blanco).
 * Si no existe brand-logo.png, usa public/favicon.svg como respaldo.
 * Ejecutar: npm run icons:generate
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const publicDir = path.join(root, 'public');
const logoPath = path.join(publicDir, 'brand-logo.png');
const svgPath = path.join(publicDir, 'favicon.svg');
const iconsDir = path.join(publicDir, 'icons');

const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };
const ANY_SIZES = [32, 72, 96, 128, 144, 152, 192, 384, 512];

function useLogo() {
  return fs.existsSync(logoPath);
}

function sourcePipeline() {
  if (useLogo()) return sharp(logoPath);
  if (fs.existsSync(svgPath)) return sharp(svgPath);
  throw new Error(`Necesitás public/brand-logo.png o public/favicon.svg`);
}

/** Icono cuadrado: logo contenido con margen (horizontal centrado). */
async function squareIcon(size, paddingRatio = 0.08) {
  const pad = Math.max(1, Math.round(size * paddingRatio));
  const inner = Math.max(1, size - 2 * pad);
   const resized = await sourcePipeline()
    .resize(inner, inner, { fit: 'inside' })
    .png()
    .toBuffer();

  return sharp({
    create: { width: size, height: size, channels: 4, background: WHITE },
  })
    .composite([{ input: resized, gravity: 'center' }])
    .png()
    .toBuffer();
}

/** Maskable: logo más chico (~58% del lado) para zona segura en launchers Android. */
async function maskablePng(outer) {
  const inner = Math.round(outer * 0.58);
  const resized = await sourcePipeline()
    .resize(inner, inner, { fit: 'inside' })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: outer,
      height: outer,
      channels: 4,
      background: WHITE,
    },
  })
    .composite([{ input: resized, gravity: 'center' }])
    .png()
    .toBuffer();
}

async function main() {
  fs.mkdirSync(iconsDir, { recursive: true });

  for (const size of ANY_SIZES) {
    const out = path.join(iconsDir, `icon-${size}x${size}.png`);
    const buf = await squareIcon(size);
    await fs.promises.writeFile(out, buf);
    console.log('wrote', path.relative(root, out));
  }

  for (const size of [192, 512]) {
    const buf = await maskablePng(size);
    const out = path.join(iconsDir, `icon-${size}x${size}-maskable.png`);
    await fs.promises.writeFile(out, buf);
    console.log('wrote', path.relative(root, out));
  }

  const touch180 = await squareIcon(180);
  await fs.promises.writeFile(path.join(publicDir, 'apple-touch-icon.png'), touch180);
  await fs.promises.writeFile(path.join(publicDir, 'apple-touch-icon-180.png'), touch180);
  console.log('wrote public/apple-touch-icon.png, apple-touch-icon-180.png');

  const touch152 = await sharp(touch180).resize(152, 152).png().toBuffer();
  const touch167 = await sharp(touch180).resize(167, 167).png().toBuffer();
  await fs.promises.writeFile(path.join(publicDir, 'apple-touch-icon-152.png'), touch152);
  await fs.promises.writeFile(path.join(publicDir, 'apple-touch-icon-167.png'), touch167);
  console.log('wrote public/apple-touch-icon-152.png, apple-touch-icon-167.png');

  const ico16 = await squareIcon(16);
  const ico32 = await squareIcon(32);
  const ico48 = await squareIcon(48);
  const icoBuf = await pngToIco([ico16, ico32, ico48]);
  await fs.promises.writeFile(path.join(publicDir, 'favicon.ico'), icoBuf);
  console.log('wrote public/favicon.ico');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
