import { writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";
import { makePrintVariants } from "@/print/prep";
import { singleCardPdf } from "@/print/pdf";
import { TRIM_PX, BLEED_PX } from "@/config/constants";

// Validates the sharp + pdf-lib pipeline without any API key, using a placeholder
// 5:7 image with edge and title/PT markers to eyeball crop safety.
async function main() {
  const W = 1040;
  const H = 1456;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2b1055"/><stop offset="1" stop-color="#7597de"/></linearGradient></defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <rect x="3" y="3" width="${W - 6}" height="${H - 6}" fill="none" stroke="#ffffff" stroke-width="6"/>
    <text x="${W / 2}" y="96" fill="#ffffff" font-size="56" text-anchor="middle" font-family="serif">TITLE SAFE?</text>
    <text x="${W / 2}" y="${H - 60}" fill="#ffffff" font-size="56" text-anchor="middle" font-family="serif">P/T SAFE?</text>
  </svg>`;

  const placeholder = await sharp(Buffer.from(svg)).png().toBuffer();
  const variants = await makePrintVariants(placeholder);
  const pdf = await singleCardPdf(variants.bleed);

  const outDir = resolve(process.cwd(), "storage", "print-test");
  await mkdir(outDir, { recursive: true });
  await writeFile(resolve(outDir, "bleed.png"), variants.bleed);
  await writeFile(resolve(outDir, "trim.png"), variants.trim);
  await writeFile(resolve(outDir, "screen.webp"), variants.screen);
  await writeFile(resolve(outDir, "card.pdf"), pdf);

  const bleedMeta = await sharp(variants.bleed).metadata();
  const trimMeta = await sharp(variants.trim).metadata();
  console.log(`bleed: ${bleedMeta.width}x${bleedMeta.height} density=${bleedMeta.density} (expect ${BLEED_PX.w}x${BLEED_PX.h} @300)`);
  console.log(`trim : ${trimMeta.width}x${trimMeta.height} density=${trimMeta.density} (expect ${TRIM_PX.w}x${TRIM_PX.h} @300)`);
  console.log(`pdf  : ${pdf.length} bytes`);
  console.log(`wrote ${outDir}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
