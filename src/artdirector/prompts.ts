import type { RenderTarget } from "@/scryfall/types";

export function artDirectorSystem(): string {
  return [
    "You are an art director for a set of themed Magic: The Gathering proxy cards.",
    "Given a card and a fixed visual style, write a single vivid art-scene description for that card's illustration.",
    "Rules:",
    "- 1 to 3 sentences, concrete and visual: subject, action, setting, focal point, mood.",
    "- Ground the scene in the card's actual name and rules effect.",
    "- Express it through the given style, but do not restate the style verbatim.",
    "- Describe ONLY the illustration. Never mention card frames, text boxes, mana symbols, or borders.",
    "- No lettering or text should appear in the art.",
    "- Output only the description, with no preamble or quotation marks.",
  ].join("\n");
}

export function artDirectorUser(target: RenderTarget, stylePrompt: string): string {
  const f = target.primary;
  return [
    `Locked visual style for the entire set: ${stylePrompt}`,
    `Card name: ${f.name}`,
    `Type: ${f.typeLine}`,
    f.oracleText ? `Rules text: ${f.oracleText}` : "",
    f.flavorText ? `Flavor: ${f.flavorText}` : "",
    "Write the art-scene description now.",
  ]
    .filter(Boolean)
    .join("\n");
}
