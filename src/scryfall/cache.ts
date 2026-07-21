import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import type { ScryfallCard } from "./types";

const DIR = resolve(process.cwd(), ".cache", "scryfall");
const mem = new Map<string, ScryfallCard>();

// Punctuation-insensitive key so "jace the mind sculptor" hits "Jace, the Mind Sculptor".
export function normalizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function keyToFile(key: string): string {
  const safe = key.replace(/[^a-z0-9]+/g, "_").slice(0, 120);
  return resolve(DIR, `${safe}.json`);
}

export function getCached(name: string): ScryfallCard | null {
  const key = normalizeName(name);
  const hit = mem.get(key);
  if (hit) return hit;
  const file = keyToFile(key);
  if (existsSync(file)) {
    try {
      const card = JSON.parse(readFileSync(file, "utf8")) as ScryfallCard;
      mem.set(key, card);
      return card;
    } catch {
      return null;
    }
  }
  return null;
}

export function setCached(name: string, card: ScryfallCard): void {
  const key = normalizeName(name);
  mem.set(key, card);
  try {
    if (!existsSync(DIR)) mkdirSync(DIR, { recursive: true });
    writeFileSync(keyToFile(key), JSON.stringify(card), "utf8");
  } catch {
    // cache writes are best-effort
  }
}
