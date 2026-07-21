import { estimateCost } from "@/cost/estimate";
import type { ImageQuality } from "@/config/pricing";

export const dynamic = "force-dynamic";

const QUALITIES: ImageQuality[] = ["low", "medium", "high"];

export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as {
    imageCount?: unknown;
    cardCount?: unknown;
    model?: unknown;
    quality?: unknown;
  };

  const imageCount = Math.max(0, Number(b.imageCount ?? 0));
  const cardCount = Math.max(0, Number(b.cardCount ?? 0));
  const model = String(b.model ?? "gpt-image-2");
  const quality: ImageQuality = QUALITIES.includes(b.quality as ImageQuality)
    ? (b.quality as ImageQuality)
    : "high";

  return Response.json(estimateCost(imageCount, cardCount, model, quality));
}
