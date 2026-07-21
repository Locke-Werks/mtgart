import { GEN_SIZE, DEFAULT_GEN_SIZE } from "@/config/constants";
import { estimateImagePrice, ART_DIRECTOR_COST_PER_CARD, type ImageQuality } from "@/config/pricing";

export interface CostEstimate {
  imageCount: number;
  cardCount: number;
  model: string;
  quality: ImageQuality;
  perImageUsd: number;
  imageUsd: number;
  textUsd: number;
  totalUsd: number;
}

export function estimateCost(
  imageCount: number,
  cardCount: number,
  model: string,
  quality: ImageQuality,
): CostEstimate {
  const size = GEN_SIZE[model] ?? DEFAULT_GEN_SIZE;
  const perImageUsd = estimateImagePrice(model, quality, size);
  const imageUsd = imageCount * perImageUsd;
  const textUsd = cardCount * ART_DIRECTOR_COST_PER_CARD;
  return {
    imageCount,
    cardCount,
    model,
    quality,
    perImageUsd,
    imageUsd,
    textUsd,
    totalUsd: imageUsd + textUsd,
  };
}
