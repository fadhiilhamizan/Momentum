/**
 * make-icon.js — generate the app icon (assets/icon.png + assets/icon.ico)
 * using pure-JS libraries so no native image tooling is required.
 *
 * Draws the Momentum mark: a gold rounded square with a dark flame.
 */
const fs = require('fs');
const path = require('path');
const PImage = require('pureimage');
const pngToIcoModule = require('png-to-ico');
const pngToIco = pngToIcoModule.default || pngToIcoModule;

const S = 256;
const ASSETS = path.join(__dirname, '..', 'assets');

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  ctx.lineTo(x + w, y + h - r);
  ctx.arc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  ctx.lineTo(x + r, y + h);
  ctx.arc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  ctx.lineTo(x, y + r);
  ctx.arc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  ctx.closePath();
}

function render(useGradient) {
  const bmp = PImage.make(S, S);
  const ctx = bmp.getContext('2d');

  // Start fully transparent so the rounded corners are see-through.
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) bmp.setPixelRGBA(x, y, 0x00000000);
  }

  let fill = '#d4af37';
  if (useGradient) {
    const g = ctx.createLinearGradient(0, 0, S, S);
    g.addColorStop(0, '#e8c547');
    g.addColorStop(1, '#b8941f');
    fill = g;
  }
  ctx.fillStyle = fill;
  roundRectPath(ctx, 8, 8, 240, 240, 56);
  ctx.fill();

  // Flame silhouette (a pointed teardrop).
  ctx.fillStyle = '#1a1510';
  const cx = 128;
  const top = 72;
  const bottom = 194;
  ctx.beginPath();
  ctx.moveTo(cx, top);
  ctx.bezierCurveTo(cx + 56, top + 46, cx + 50, bottom - 26, cx, bottom);
  ctx.bezierCurveTo(cx - 50, bottom - 26, cx - 56, top + 46, cx, top);
  ctx.closePath();
  ctx.fill();

  return bmp;
}

async function main() {
  let bmp;
  try {
    bmp = render(true);
  } catch (err) {
    console.warn('Gradient unavailable, using solid gold:', err.message);
    bmp = render(false);
  }

  const pngPath = path.join(ASSETS, 'icon.png');
  await PImage.encodePNGToStream(bmp, fs.createWriteStream(pngPath));
  const ico = await pngToIco([pngPath]);
  fs.writeFileSync(path.join(ASSETS, 'icon.ico'), ico);
  console.log('Wrote assets/icon.png and assets/icon.ico');
}

main().catch((err) => {
  console.error('Icon generation failed:', err);
  process.exit(1);
});
