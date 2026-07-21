import type { RenderTarget } from "@/scryfall/types";
import type { ImageQuality } from "@/config/pricing";
import type { StorageAdapter } from "@/storage";
import type { RenderOutput } from "./types";
import { directArt } from "@/artdirector";
import { buildCardPrompt } from "@/prompt/builder";
import { generateCardImage } from "@/image/client";
import { makePrintVariants } from "@/print/prep";
import { singleCardPdf } from "@/print/pdf";

export type Stage = "art_directing" | "generating" | "printing";

export interface RenderDeps {
  storage: StorageAdapter;
  batchId: string;
  cardId: string;
}

// One image, end to end: scene -> prompt -> generate -> print prep -> store.
export async function renderTarget(
  target: RenderTarget,
  stylePrompt: string,
  model: string,
  quality: ImageQuality,
  deps: RenderDeps,
  onStage: (s: Stage) => void,
): Promise<{ output: RenderOutput; costUsd: number }> {
  onStage("art_directing");
  const artScene = await directArt(target, stylePrompt);
  const { text, promptHash } = buildCardPrompt({ target, stylePrompt, artScene });

  onStage("generating");
  const img = await generateCardImage({ prompt: text, model, quality });

  onStage("printing");
  const variants = await makePrintVariants(img.png);
  const pdf = await singleCardPdf(variants.bleed);

  const faceIndex = target.faceIndex ?? 0;
  const base = `batches/${deps.batchId}/${deps.cardId}/face${faceIndex}`;
  const [master, screen, trim, bleed, pdfPut] = await Promise.all([
    deps.storage.put(`${base}.master.png`, img.png, "image/png"),
    deps.storage.put(`${base}.screen.webp`, variants.screen, "image/webp"),
    deps.storage.put(`${base}.trim.png`, variants.trim, "image/png"),
    deps.storage.put(`${base}.bleed.png`, variants.bleed, "image/png"),
    deps.storage.put(`${base}.pdf`, pdf, "application/pdf"),
  ]);

  const output: RenderOutput = {
    faceIndex,
    faceLabel: target.faceLabel || "card",
    promptHash,
    promptText: text,
    artScene,
    masterUrl: master.url,
    screenUrl: screen.url,
    trimUrl: trim.url,
    bleedUrl: bleed.url,
    pdfUrl: pdfPut.url,
  };
  return { output, costUsd: img.costUsd };
}
