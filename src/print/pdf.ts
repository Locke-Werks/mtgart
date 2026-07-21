import { PDFDocument } from "pdf-lib";
import { CARD_IN, BLEED_IN, PT_PER_IN } from "./pixelMath";

// A print-shop-ready single card: a page sized to the full bleed with the image
// filling it edge to edge. The trim card sits centred; the shop cuts BLEED_IN in.
export async function singleCardPdf(bleedPng: Buffer): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const wIn = CARD_IN.w + 2 * BLEED_IN;
  const hIn = CARD_IN.h + 2 * BLEED_IN;
  const wPt = wIn * PT_PER_IN;
  const hPt = hIn * PT_PER_IN;

  const page = doc.addPage([wPt, hPt]);
  const img = await doc.embedPng(bleedPng);
  page.drawImage(img, { x: 0, y: 0, width: wPt, height: hPt });

  const bytes = await doc.save();
  return Buffer.from(bytes);
}
