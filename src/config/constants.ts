// Single source of truth for print geometry and generation sizes.

export const DPI = 300;

// True MTG card dimensions in inches.
export const CARD_IN = { w: 2.5, h: 3.5 } as const;
export const BLEED_IN = 0.125; // bleed added per side for cutting

// Derived pixel dimensions at 300 DPI.
export const TRIM_PX = {
  w: Math.round(CARD_IN.w * DPI), // 750
  h: Math.round(CARD_IN.h * DPI), // 1050
};
export const BLEED_PX = {
  w: Math.round((CARD_IN.w + 2 * BLEED_IN) * DPI), // 825
  h: Math.round((CARD_IN.h + 2 * BLEED_IN) * DPI), // 1125
};
// Bleed is added by extending the trim card OUTWARD (edge replication), never by
// cropping into the card. These are the per-side margins that grow trim -> bleed.
export const BLEED_MARGIN = {
  left: Math.ceil((BLEED_PX.w - TRIM_PX.w) / 2), // 38
  right: BLEED_PX.w - TRIM_PX.w - Math.ceil((BLEED_PX.w - TRIM_PX.w) / 2), // 37
  top: Math.ceil((BLEED_PX.h - TRIM_PX.h) / 2), // 38
  bottom: BLEED_PX.h - TRIM_PX.h - Math.ceil((BLEED_PX.h - TRIM_PX.h) / 2), // 37
};

// Keep title, rules, and P/T inside this margin so trimming never cuts them.
export const SAFE_MARGIN_PCT = 9;

// Generation size per image model. gpt-image-2 hits an exact 5:7; the others are 2:3
// and get reconciled to 5:7 in print prep.
export const GEN_SIZE: Record<string, string> = {
  "gpt-image-2": "1040x1456", // exact 5:7 (each edge a multiple of 16)
  "gpt-image-1.5": "1024x1536", // 2:3
  "gpt-image-1-mini": "1024x1536", // 2:3
};

export const DEFAULT_GEN_SIZE = "1024x1536";
