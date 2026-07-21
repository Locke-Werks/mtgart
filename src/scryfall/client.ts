import { getEnv } from "@/config/env";
import { getCached, setCached, normalizeName } from "./cache";
import type { ScryfallCard, ScryfallList } from "./types";

const BASE = "https://api.scryfall.com";
const SPACING_MS = 100; // stay well under Scryfall's ~10 req/s

let lastCall = 0;
async function spaced(): Promise<void> {
  const wait = Math.max(0, SPACING_MS - (Date.now() - lastCall));
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastCall = Date.now();
}

function headers(): Record<string, string> {
  return {
    "User-Agent": getEnv().SCRYFALL_USER_AGENT,
    Accept: "application/json",
  };
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function collection(names: string[]): Promise<ScryfallList<ScryfallCard>> {
  await spaced();
  const res = await fetch(`${BASE}/cards/collection`, {
    method: "POST",
    headers: { ...headers(), "Content-Type": "application/json" },
    body: JSON.stringify({ identifiers: names.map((name) => ({ name })) }),
  });
  if (!res.ok) throw new Error(`Scryfall /cards/collection failed: ${res.status} ${await res.text()}`);
  return (await res.json()) as ScryfallList<ScryfallCard>;
}

async function autocomplete(q: string): Promise<string[]> {
  await spaced();
  const res = await fetch(`${BASE}/cards/autocomplete?q=${encodeURIComponent(q)}`, { headers: headers() });
  if (!res.ok) return [];
  const body = (await res.json()) as { data?: string[] };
  return body.data ?? [];
}

type NamedResult = ScryfallCard | { ambiguousCandidates: string[] } | null;

async function named(fuzzy: string): Promise<NamedResult> {
  await spaced();
  const res = await fetch(`${BASE}/cards/named?fuzzy=${encodeURIComponent(fuzzy)}`, { headers: headers() });
  if (res.status === 404) {
    const body = (await res.json().catch(() => ({}))) as { details?: string };
    if (typeof body.details === "string" && /too many cards/i.test(body.details)) {
      return { ambiguousCandidates: await autocomplete(fuzzy) };
    }
    return null;
  }
  if (!res.ok) throw new Error(`Scryfall /cards/named failed: ${res.status}`);
  return (await res.json()) as ScryfallCard;
}

export interface ResolveResult {
  found: ScryfallCard[];
  notFound: string[];
  ambiguous: Array<{ name: string; candidates: string[] }>;
}

// Batch resolve for the app: one collection call per 75 names, fuzzy fallback per miss.
export async function resolveCards(names: string[]): Promise<ResolveResult> {
  const found: ScryfallCard[] = [];
  const notFound: string[] = [];
  const ambiguous: Array<{ name: string; candidates: string[] }> = [];

  const toQuery: string[] = [];
  const seen = new Set<string>();
  for (const name of names) {
    const norm = normalizeName(name);
    if (!norm || seen.has(norm)) continue;
    seen.add(norm);
    const cached = getCached(name);
    if (cached) found.push(cached);
    else toQuery.push(name);
  }

  for (const group of chunk(toQuery, 75)) {
    const list = await collection(group);
    for (const card of list.data) {
      setCached(card.name, card);
      found.push(card);
    }
    for (const nf of list.not_found ?? []) {
      const miss = nf.name;
      if (!miss) continue;
      const r = await named(miss);
      if (r && "ambiguousCandidates" in r) {
        ambiguous.push({ name: miss, candidates: r.ambiguousCandidates });
      } else if (r) {
        setCached(miss, r);
        setCached(r.name, r);
        found.push(r);
      } else {
        notFound.push(miss);
      }
    }
  }

  return { found, notFound, ambiguous };
}

export interface ResolveOneResult {
  card?: ScryfallCard;
  ambiguous?: string[];
  notFound?: boolean;
}

// Single-card resolve for the CLI slice; fuzzy handles typos directly.
export async function resolveOne(name: string): Promise<ResolveOneResult> {
  const cached = getCached(name);
  if (cached) return { card: cached };
  const r = await named(name);
  if (r && "ambiguousCandidates" in r) return { ambiguous: r.ambiguousCandidates };
  if (r) {
    setCached(name, r);
    setCached(r.name, r);
    return { card: r };
  }
  return { notFound: true };
}
