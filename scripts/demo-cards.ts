import { loadDotEnv } from "@/config/loadEnv";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { CardFace, RenderTarget } from "@/scryfall/types";
import { DEFAULT_STYLE_PROMPT } from "@/style/starters";
import { directArt } from "@/artdirector";
import { buildCardPrompt } from "@/prompt/builder";
import { generateCardImage } from "@/image/client";
import { makePrintVariants } from "@/print/prep";

// Original, fictional cards for the README so the demo shows the engine without
// reproducing any real Wizards of the Coast card.
function face(f: Partial<CardFace> & { name: string; typeLine: string }): CardFace {
  return {
    name: f.name,
    manaCost: f.manaCost ?? null,
    typeLine: f.typeLine,
    oracleText: f.oracleText ?? "",
    flavorText: f.flavorText ?? null,
    power: f.power ?? null,
    toughness: f.toughness ?? null,
    loyalty: f.loyalty ?? null,
    colors: f.colors ?? [],
  };
}

function target(id: string, f: CardFace, colorIdentity: string[]): RenderTarget {
  return { cardId: id, faceIndex: null, faceLabel: "", primary: f, secondary: null, colorIdentity, layout: "normal", canonicalName: f.name };
}

const CARDS: { id: string; target: RenderTarget }[] = [
  {
    id: "pyrewing-drake",
    target: target(
      "pyrewing-drake",
      face({
        name: "Pyrewing Drake",
        manaCost: "{3}{R}",
        typeLine: "Creature — Dragon",
        oracleText:
          "Flying\nWhen Pyrewing Drake enters the battlefield, it deals 2 damage to each opponent.",
        flavorText: "It nests where the mountain still remembers being angry.",
        power: "3",
        toughness: "3",
        colors: ["R"],
      }),
      ["R"],
    ),
  },
  {
    id: "glimmerveil-oracle",
    target: target(
      "glimmerveil-oracle",
      face({
        name: "Glimmerveil Oracle",
        manaCost: "{1}{U}{U}",
        typeLine: "Creature — Merfolk Wizard",
        oracleText: "When Glimmerveil Oracle enters the battlefield, scry 2, then draw a card.",
        flavorText: "She reads the tide the way others read a page.",
        power: "2",
        toughness: "2",
        colors: ["U"],
      }),
      ["U"],
    ),
  },
  {
    id: "aldreth-last-ember",
    target: target(
      "aldreth-last-ember",
      face({
        name: "Aldreth, the Last Ember",
        manaCost: "{2}{R}{W}",
        typeLine: "Legendary Planeswalker — Aldreth",
        oracleText:
          '+1: Aldreth, the Last Ember deals 1 damage to any target.\n-2: Create two 1/1 red Elemental creature tokens with haste.\n-7: You get an emblem with "Creatures you control get +2/+0 and have haste."',
        loyalty: "4",
        colors: ["R", "W"],
      }),
      ["R", "W"],
    ),
  },
];

async function main() {
  loadDotEnv();
  const style = DEFAULT_STYLE_PROMPT;
  const outDir = resolve(process.cwd(), "docs");
  await mkdir(outDir, { recursive: true });

  let total = 0;
  for (const c of CARDS) {
    console.log(`\n[${c.id}] art-directing ...`);
    const artScene = await directArt(c.target, style);
    console.log(`[${c.id}] scene: ${artScene}`);
    const { text } = buildCardPrompt({ target: c.target, stylePrompt: style, artScene });
    console.log(`[${c.id}] generating ...`);
    const img = await generateCardImage({ prompt: text, quality: "high" });
    total += img.costUsd;
    const variants = await makePrintVariants(img.png);
    await writeFile(resolve(outDir, `${c.id}.png`), variants.trim);
    console.log(`[${c.id}] saved docs/${c.id}.png ($${img.costUsd.toFixed(3)})`);
  }
  console.log(`\nDone. Estimated cost: $${total.toFixed(3)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
