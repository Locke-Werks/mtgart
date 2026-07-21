import { chatComplete } from "@/lib/text";

const cache = new Map<string, string>();

const SYSTEM = [
  "You expand a short art-style brief into ONE locked, self-contained visual style block for a whole set of trading cards.",
  "In flowing prose (not a list), cover: medium and technique, color palette, lighting and mood, linework and texture, card frame and border treatment, composition tendencies, and a short 'avoid' clause.",
  "End with a sentence asserting that every card in the set must share this exact look.",
  "Keep it under 130 words. Output only the style block, with no preamble or quotation marks.",
].join(" ");

// Expand a user's short master prompt into a fuller, coherent locked style block.
// The user reviews and can edit the result; it is not applied silently.
export async function expandStyle(masterPrompt: string): Promise<string> {
  const trimmed = masterPrompt.trim();
  if (!trimmed) return trimmed;
  const cached = cache.get(trimmed);
  if (cached) return cached;

  const out =
    (await chatComplete(
      [
        { role: "system", content: SYSTEM },
        { role: "user", content: `Expand this into the locked style block:\n${trimmed}` },
      ],
      { temperature: 0.5 },
    )) || trimmed;

  cache.set(trimmed, out);
  return out;
}
