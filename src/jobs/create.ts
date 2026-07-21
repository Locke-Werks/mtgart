import { randomUUID } from "node:crypto";
import { resolveCards } from "@/scryfall/client";
import { normalizeCard, toRenderTargets } from "@/scryfall/normalize";
import { estimateCost } from "@/cost/estimate";
import { jobStore } from "./store";
import { runBatch } from "./runner";
import type { Batch, BatchSettings, CardJob } from "./types";

export async function createAndStartBatch(names: string[], settings: BatchSettings): Promise<Batch> {
  const { found, notFound } = await resolveCards(names);

  const cards: CardJob[] = [];
  let imageCount = 0;

  for (const raw of found) {
    const card = normalizeCard(raw);
    const targets = toRenderTargets(card, { generateBothFaces: settings.generateBothFaces });
    imageCount += targets.length;
    cards.push({
      cardId: card.id,
      inputName: card.inputName,
      canonicalName: card.name,
      layout: card.layout,
      renderMode: card.renderMode,
      status: "resolved",
      attempts: 0,
      outputs: [],
      costUsd: 0,
      card,
    });
  }

  for (const miss of notFound) {
    cards.push({
      cardId: `missing:${miss}`,
      inputName: miss,
      status: "error",
      attempts: 0,
      outputs: [],
      costUsd: 0,
      error: { code: "not_found", message: "Card not found on Scryfall.", retryable: false },
    });
  }

  const estimate = estimateCost(imageCount, found.length, settings.model, settings.quality);

  const batch: Batch = {
    batchId: `b_${randomUUID().slice(0, 8)}`,
    createdAt: new Date().toISOString(),
    settings,
    status: "queued",
    estimateUsd: estimate.totalUsd,
    actualUsd: 0,
    cards,
  };

  jobStore.create(batch);
  // Fire and forget; progress is reported over SSE / polling.
  void runBatch(batch.batchId);
  return batch;
}
