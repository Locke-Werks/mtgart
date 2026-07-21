import { GEN_SIZE, DEFAULT_GEN_SIZE } from "@/config/constants";
import { estimateImagePrice } from "@/config/pricing";
import { getEnv } from "@/config/env";
import { getStorage } from "@/storage";
import { toRenderTargets } from "@/scryfall/normalize";
import { PolicyRejectionError } from "@/image/client";
import { jobStore, toPublicBatch } from "./store";
import { pLimit } from "./concurrency";
import { renderTarget } from "./pipeline";
import type { CardJob } from "./types";

// Gentle default for capped runs; full-send scales up to MAX_CONCURRENCY (env).
const NORMAL_CONCURRENCY = 3;

async function persistManifest(batchId: string): Promise<void> {
  const batch = jobStore.get(batchId);
  if (!batch) return;
  try {
    await getStorage().putJson(`batches/${batchId}/manifest.json`, toPublicBatch(batch));
  } catch {
    // manifest persistence is best-effort
  }
}

function patchCard(batchId: string, cardId: string, patch: Partial<CardJob>): void {
  jobStore.update(batchId, (b) => {
    const c = b.cards.find((x) => x.cardId === cardId);
    if (c) Object.assign(c, patch);
  });
}

async function processCard(
  batchId: string,
  cardId: string,
  model: string,
  quality: import("@/config/pricing").ImageQuality,
  perImageUsd: number,
): Promise<void> {
  const batch = jobStore.get(batchId);
  if (!batch) return;
  const cardJob = batch.cards.find((c) => c.cardId === cardId);
  if (!cardJob || !cardJob.card) return;

  const stylePrompt = batch.settings.stylePrompt;
  const storage = getStorage();
  const targets = toRenderTargets(cardJob.card, { generateBothFaces: batch.settings.generateBothFaces });

  try {
    for (const target of targets) {
      const current = jobStore.get(batchId);
      if (!current) return;
      if (!current.settings.fullSend && current.actualUsd + perImageUsd > current.settings.spendCapUsd) {
        patchCard(batchId, cardId, { status: "skipped_cap" });
        await persistManifest(batchId);
        return;
      }

      const { output, costUsd } = await renderTarget(
        target,
        stylePrompt,
        model,
        quality,
        { storage, batchId, cardId },
        (stage) => patchCard(batchId, cardId, { status: stage }),
      );

      jobStore.update(batchId, (b) => {
        const c = b.cards.find((x) => x.cardId === cardId);
        if (c) {
          c.outputs.push(output);
          c.costUsd += costUsd;
        }
        b.actualUsd += costUsd;
      });
    }

    patchCard(batchId, cardId, { status: "done" });
    await persistManifest(batchId);
  } catch (err) {
    if (err instanceof PolicyRejectionError) {
      patchCard(batchId, cardId, {
        status: "rejected_policy",
        error: { code: "moderation", message: err.message, retryable: false },
      });
    } else {
      const e = err as { message?: string };
      patchCard(batchId, cardId, {
        status: "error",
        error: { code: "error", message: e.message ?? String(err), retryable: true },
      });
    }
    await persistManifest(batchId);
  }
}

export async function runBatch(batchId: string): Promise<void> {
  const batch = jobStore.get(batchId);
  if (!batch) return;

  const { model, quality } = batch.settings;
  const size = GEN_SIZE[model] ?? DEFAULT_GEN_SIZE;
  const perImageUsd = estimateImagePrice(model, quality, size);

  jobStore.update(batchId, (b) => {
    b.status = "running";
  });

  const runnable = batch.cards.filter((c) => c.status === "resolved" && c.card);
  const maxConcurrency = getEnv().MAX_CONCURRENCY;
  const concurrency = batch.settings.fullSend
    ? Math.max(1, Math.min(runnable.length, maxConcurrency))
    : Math.min(NORMAL_CONCURRENCY, maxConcurrency);
  const limit = pLimit(concurrency);
  await Promise.all(
    runnable.map((c) => limit(() => processCard(batchId, c.cardId, model, quality, perImageUsd))),
  );

  const final = jobStore.get(batchId);
  const hasProblems = final?.cards.some(
    (c) => c.status === "error" || c.status === "rejected_policy" || c.status === "skipped_cap",
  );
  jobStore.update(batchId, (b) => {
    b.status = hasProblems ? "completed_with_errors" : "completed";
  });
  await persistManifest(batchId);
  jobStore.finish(batchId);
}
