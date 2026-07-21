// Per-image USD price seeds. These are inputs to verify against OpenAI's cost
// calculator, not authoritative constants. Keyed model -> quality -> size.

export type ImageQuality = "low" | "medium" | "high";

type SizePrices = Record<string, number>;

export const IMAGE_PRICING: Record<string, Record<ImageQuality, SizePrices>> = {
  "gpt-image-2": {
    // gpt-image-2 bills by tokens; these are derived per-image estimates.
    low: { "1040x1456": 0.012, "1024x1024": 0.008 },
    medium: { "1040x1456": 0.048, "1024x1024": 0.032 },
    high: { "1040x1456": 0.187, "1024x1024": 0.125 },
  },
  "gpt-image-1.5": {
    low: { "1024x1536": 0.013, "1536x1024": 0.013, "1024x1024": 0.009 },
    medium: { "1024x1536": 0.05, "1536x1024": 0.05, "1024x1024": 0.034 },
    high: { "1024x1536": 0.2, "1536x1024": 0.2, "1024x1024": 0.133 },
  },
  "gpt-image-1-mini": {
    low: { "1024x1536": 0.003, "1024x1024": 0.002 },
    medium: { "1024x1536": 0.01, "1024x1024": 0.007 },
    high: { "1024x1536": 0.04, "1024x1024": 0.027 },
  },
};

export function estimateImagePrice(model: string, quality: ImageQuality, size: string): number {
  const byQuality = IMAGE_PRICING[model];
  if (!byQuality) return 0;
  const bySize = byQuality[quality];
  if (!bySize) return 0;
  return bySize[size] ?? Object.values(bySize)[0] ?? 0;
}

// Rough per-card cost of the art-director text call. Refined by real token usage.
export const ART_DIRECTOR_COST_PER_CARD = 0.01;
