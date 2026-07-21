import { createHash } from "node:crypto";
import type { RenderTarget } from "@/scryfall/types";
import { chatComplete } from "@/lib/text";
import { artDirectorSystem, artDirectorUser } from "./prompts";

const cache = new Map<string, string>();

// Turn a card + the locked style into a vivid art-scene description grounded in the card's effect.
export async function directArt(target: RenderTarget, stylePrompt: string): Promise<string> {
  const styleHash = createHash("sha256").update(stylePrompt).digest("hex").slice(0, 12);
  const key = `${target.cardId}:${target.faceIndex ?? "all"}:${styleHash}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const scene = await chatComplete(
    [
      { role: "system", content: artDirectorSystem() },
      { role: "user", content: artDirectorUser(target, stylePrompt) },
    ],
    { temperature: 0.4 },
  );

  const out = scene || `${target.primary.name}: ${target.primary.typeLine}`;
  cache.set(key, out);
  return out;
}
