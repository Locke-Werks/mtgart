import { loadDotEnv } from "@/config/loadEnv";
import { resolveOne } from "@/scryfall/client";
import { normalizeCard, toRenderTargets } from "@/scryfall/normalize";
import { STARTERS, DEFAULT_STYLE_PROMPT } from "@/style/starters";
import { directArt } from "@/artdirector";
import { buildCardPrompt } from "@/prompt/builder";
import { generateCardImage } from "@/image/client";
import { makePrintVariants } from "@/print/prep";
import { singleCardPdf } from "@/print/pdf";
import { getStorage } from "@/storage";

// A starter id maps to its example prompt; anything else is treated as literal style text.
function resolveStyle(arg: string | undefined): string {
  if (!arg) return DEFAULT_STYLE_PROMPT;
  const starter = STARTERS.find((s) => s.id === arg);
  return starter ? starter.prompt : arg;
}

async function main() {
  loadDotEnv();

  const rawArgs = process.argv.slice(2);
  const dry = rawArgs.includes("--dry");
  const [nameArg, styleArg] = rawArgs.filter((a) => !a.startsWith("--"));
  if (!nameArg) {
    console.error('Usage: npm run generate:one -- "Card Name" [styleId|"style text"] [--dry]');
    console.error("Starter style ids: " + STARTERS.map((s) => s.id).join(", "));
    process.exit(1);
  }

  const stylePrompt = resolveStyle(styleArg);

  console.log(`Resolving "${nameArg}" ...`);
  const r = await resolveOne(nameArg);
  if (r.ambiguous) {
    console.error("Ambiguous name. Did you mean:\n- " + r.ambiguous.join("\n- "));
    process.exit(1);
  }
  if (!r.card) {
    console.error("Card not found.");
    process.exit(1);
  }

  const card = normalizeCard(r.card, nameArg);
  console.log(`Resolved: ${card.name} [layout=${card.layout}, render=${card.renderMode}]`);

  const targets = toRenderTargets(card, { generateBothFaces: true });
  const storage = getStorage();
  const batchId = "oneoff";
  let totalCost = 0;

  for (const target of targets) {
    const label = target.faceLabel || "card";

    if (dry) {
      const artScene = "A representative themed scene for this card (art-director fills this at run time).";
      const { text, promptHash } = buildCardPrompt({ target, stylePrompt, artScene });
      console.log(`\n[${label}] DRY RUN prompt ${promptHash} (no OpenAI calls):\n`);
      console.log(text);
      continue;
    }

    console.log(`\n[${label}] art-directing ...`);
    const artScene = await directArt(target, stylePrompt);
    console.log(`[${label}] scene: ${artScene}`);

    const { text, promptHash } = buildCardPrompt({ target, stylePrompt, artScene });
    console.log(`[${label}] prompt ${promptHash}, generating image ...`);

    const img = await generateCardImage({ prompt: text });
    totalCost += img.costUsd;
    console.log(`[${label}] generated with ${img.model} @ ${img.size}, est $${img.costUsd.toFixed(3)}`);

    const variants = await makePrintVariants(img.png);
    const pdf = await singleCardPdf(variants.bleed);

    const base = `batches/${batchId}/${card.id}/face${target.faceIndex ?? 0}`;
    const puts = await Promise.all([
      storage.put(`${base}.master.png`, img.png, "image/png"),
      storage.put(`${base}.screen.webp`, variants.screen, "image/webp"),
      storage.put(`${base}.trim.png`, variants.trim, "image/png"),
      storage.put(`${base}.bleed.png`, variants.bleed, "image/png"),
      storage.put(`${base}.pdf`, pdf, "application/pdf"),
    ]);
    console.log(`[${label}] saved:`);
    for (const p of puts) console.log(`   storage/${p.key}`);
  }

  console.log(`\nDone. Estimated image cost: $${totalCost.toFixed(3)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
