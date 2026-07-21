import type { Card } from "@/scryfall/types";
import type { ImageQuality } from "@/config/pricing";

export type CardStatus =
  | "resolved"
  | "art_directing"
  | "generating"
  | "printing"
  | "done"
  | "error"
  | "rejected_policy"
  | "skipped_cap";

export type BatchStatus = "queued" | "running" | "completed" | "completed_with_errors" | "canceled";

export interface RenderOutput {
  faceIndex: number;
  faceLabel: string; // "front" | "back" | "card"
  promptHash?: string;
  promptText?: string; // the exact prompt sent to the image model
  artScene?: string;
  masterUrl?: string; // raw AI generation, exact 5:7
  screenUrl?: string;
  trimUrl?: string;
  bleedUrl?: string;
  pdfUrl?: string;
}

export interface CardJobError {
  code: string;
  message: string;
  retryable: boolean;
}

export interface CardJob {
  cardId: string;
  inputName: string;
  canonicalName?: string;
  layout?: string;
  renderMode?: "single" | "dual";
  status: CardStatus;
  attempts: number;
  outputs: RenderOutput[];
  costUsd: number;
  error?: CardJobError;
  // Internal: the normalized card, used by the runner, stripped from public payloads.
  card?: Card;
}

export interface BatchSettings {
  // The user's master style prompt, locked and reused for every card in the batch.
  stylePrompt: string;
  model: string;
  quality: ImageQuality;
  generateBothFaces: boolean;
  spendCapUsd: number;
  // "Full send": fire every card at once and ignore the spend cap.
  fullSend: boolean;
}

export interface Batch {
  batchId: string;
  createdAt: string;
  settings: BatchSettings;
  status: BatchStatus;
  estimateUsd: number;
  actualUsd: number;
  cards: CardJob[];
}

export type BatchEvent = { type: "snapshot"; batch: Batch } | { type: "done"; batch: Batch };
