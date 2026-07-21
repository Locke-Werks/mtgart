import sharp from "sharp";
import { BLEED_MARGIN, TRIM_PX, DPI, SCREEN_WIDTH } from "./pixelMath";

export interface PrintVariants {
  bleed: Buffer; // 825 x 1125 @ 300 DPI, card + replicated bleed margin
  trim: Buffer; // 750 x 1050 @ 300 DPI, the whole card, uncut
  screen: Buffer; // downscaled webp for gallery
}

// The AI output IS the whole card. Scale it straight to the trim size with no
// crop (an exact 5:7 generation matches 5:7 trim; a 2:3 fallback cover-fits),
// then grow bleed by replicating the card's edge pixels outward so nothing on
// the card is ever cut.
export async function makePrintVariants(source: Buffer, screenWidth = SCREEN_WIDTH): Promise<PrintVariants> {
  const trim = await sharp(source)
    .resize(TRIM_PX.w, TRIM_PX.h, { fit: "cover", position: "centre" })
    .withMetadata({ density: DPI })
    .png()
    .toBuffer();

  const bleed = await sharp(trim)
    .extend({
      top: BLEED_MARGIN.top,
      bottom: BLEED_MARGIN.bottom,
      left: BLEED_MARGIN.left,
      right: BLEED_MARGIN.right,
      extendWith: "copy",
    })
    .withMetadata({ density: DPI })
    .png()
    .toBuffer();

  const screen = await sharp(trim).resize({ width: screenWidth }).webp({ quality: 82 }).toBuffer();

  return { bleed, trim, screen };
}
