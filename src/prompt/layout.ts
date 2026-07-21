import type { RenderTarget } from "@/scryfall/types";

// Extra arrangement guidance for non-standard card layouts.
export function layoutGuidance(t: RenderTarget): string {
  switch (t.layout) {
    case "split":
    case "aftermath":
      return "This is a split card: show two half-cards, each with its own name, cost, art, and text box.";
    case "adventure":
      return "This is an adventure card: a creature card with a smaller inset 'adventure' spell box (its own name, cost, and text) in the lower-left of the text area.";
    case "flip":
      return "This is a flip card: the second name, type, and text appear inverted at the bottom of the card.";
    default:
      if (t.faceLabel) return `Render the ${t.faceLabel} face of a double-faced card.`;
      return "";
  }
}
