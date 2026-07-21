import { createHash } from "node:crypto";
import type { CardFace, RenderTarget } from "@/scryfall/types";
import { SAFE_MARGIN_PCT } from "@/config/constants";
import { manaCostToSpec } from "./manaWords";
import { layoutGuidance } from "./layout";

export interface BuiltPrompt {
  text: string;
  promptHash: string;
}

export interface BuildInput {
  target: RenderTarget;
  // The user's master style prompt, injected verbatim so every card in the set matches.
  stylePrompt: string;
  artScene: string;
}

function xmlEscape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function el(tag: string, value: string | null | undefined, indent = "  "): string {
  if (value === null || value === undefined || value === "") return "";
  return `${indent}<${tag}>${xmlEscape(value)}</${tag}>\n`;
}

function manaXml(manaCost: string | null, indent = "  "): string {
  const spec = manaCost ? manaCostToSpec(manaCost) : null;
  if (!spec) return "";
  const pips = spec.pipsXml
    .split("\n")
    .map((l) => `${indent}  ${l.trim()}`)
    .join("\n");
  return `${indent}<mana notation="${spec.notation}" count="${spec.count}">\n${pips}\n${indent}</mana>\n`;
}

// Split oracle text into discrete rules elements: bullet choices become <mode>, everything
// else becomes a <line>, so the model lays out a clean, one-item-per-line text box.
function rulesXml(oracleText: string, indent = "  "): string {
  const lines = oracleText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return "";
  const items = lines
    .map((line) =>
      line.startsWith("•")
        ? `${indent}  <mode>${xmlEscape(line.replace(/^•\s*/, ""))}</mode>`
        : `${indent}  <line>${xmlEscape(line)}</line>`,
    )
    .join("\n");
  return `${indent}<rules>\n${items}\n${indent}</rules>\n`;
}

function faceXml(f: CardFace, artScene: string | null, tag: string): string {
  const pt = f.power !== null && f.toughness !== null ? `${f.power}/${f.toughness}` : null;
  let body = "";
  body += el("title", f.name);
  body += el("type", f.typeLine);
  body += manaXml(f.manaCost);
  if (artScene) body += el("art", artScene);
  body += f.oracleText ? rulesXml(f.oracleText) : "";
  body += el("flavor", f.flavorText);
  body += el("pt", pt);
  body += el("loyalty", f.loyalty);
  return `<${tag}>\n${body}</${tag}>`;
}

export function buildCardPrompt({ target, stylePrompt, artScene }: BuildInput): BuiltPrompt {
  const styleBlock = `<style>\n${stylePrompt.trim()}\n</style>`;
  const cardXml = faceXml(target.primary, artScene, "card");
  const secondXml = target.secondary ? faceXml(target.secondary, null, "second-face") : "";
  const guidance = layoutGuidance(target);

  const parts = [
    "Render ONE full Magic-style trading card from this XML spec.",
    "",
    styleBlock,
    "",
    cardXml,
  ];
  if (secondXml) parts.push("", secondXml);
  if (guidance) parts.push("", `<note>${xmlEscape(guidance)}</note>`);

  parts.push(
    "",
    "<layout>",
    "  Render the spec as a single Magic-style trading card, portrait aspect ratio 5:7, full-bleed art. Reproduce every text value EXACTLY as written; never invent, omit, translate, or alter words, and add no logos or watermarks.",
    "  - <title> in the title bar at the top-left.",
    '  - <mana> pips in the top-right of the title bar: one horizontal row of standard Magic mana symbols, one per <pip> in order. A pip with kind="generic" is ONE gray circle with its value inside, never split or repeated. Colors: {W}=white, {U}=blue, {B}=black, {R}=red, {G}=green, {C}=colorless.',
    "  - <art> fills a large central illustration window.",
    "  - <type> on a bar directly under the art.",
    "  - <rules> and <flavor> in the lower text box, rules above flavor. Render each <line> and each <mode> on its own line; prefix every <mode> with a bullet point.",
    "  - <pt> in a box at the bottom-right for creatures; <loyalty> as a loyalty badge for planeswalkers.",
    `  - keep ALL text, the title, and every box within a safe zone about ${SAFE_MARGIN_PCT}% in from every edge, so trimming for print never cuts them; only the artwork may bleed to the edges.`,
    "</layout>",
  );

  const text = parts.join("\n");
  const promptHash = createHash("sha256").update(text).digest("hex").slice(0, 16);
  return { text, promptHash };
}
