import { createAndStartBatch } from "@/jobs/create";
import { jobStore, toPublicBatch } from "@/jobs/store";
import type { ImageQuality } from "@/config/pricing";
import type { BatchSettings } from "@/jobs/types";

export const dynamic = "force-dynamic";

const QUALITIES: ImageQuality[] = ["low", "medium", "high"];

export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const names = Array.isArray(b.names) ? b.names.map((n) => String(n).trim()).filter(Boolean) : [];
  if (names.length === 0) {
    return Response.json({ error: "No card names provided." }, { status: 400 });
  }

  const stylePrompt = String(b.stylePrompt ?? "").trim();
  if (!stylePrompt) {
    return Response.json({ error: "A master style prompt is required." }, { status: 400 });
  }

  const settings: BatchSettings = {
    stylePrompt,
    model: String(b.model ?? "gpt-image-2"),
    quality: QUALITIES.includes(b.quality as ImageQuality) ? (b.quality as ImageQuality) : "high",
    generateBothFaces: b.generateBothFaces !== false,
    spendCapUsd: Math.max(0, Number(b.spendCapUsd ?? 25)),
    fullSend: b.fullSend === true,
  };

  const batch = await createAndStartBatch(names, settings);
  return Response.json({ batchId: batch.batchId, batch: toPublicBatch(batch) });
}

export async function GET() {
  return Response.json({ batches: jobStore.list().map(toPublicBatch) });
}
