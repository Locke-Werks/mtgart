import type { Card, CardFace, RenderMode, RenderTarget, ScryfallCard, ScryfallCardFace } from "./types";

// Layouts that print as two separate images (front and back).
const DUAL_LAYOUTS = new Set(["transform", "modal_dfc", "reversible_card", "double_faced_token"]);

type FaceSource = ScryfallCardFace | ScryfallCard;

function faceFrom(src: FaceSource): CardFace {
  const manaCost = src.mana_cost && src.mana_cost.length > 0 ? src.mana_cost : null;
  return {
    name: src.name,
    manaCost,
    typeLine: src.type_line ?? "",
    oracleText: src.oracle_text ?? "",
    flavorText: src.flavor_text ?? null,
    power: src.power ?? null,
    toughness: src.toughness ?? null,
    loyalty: src.loyalty ?? null,
    colors: src.colors ?? [],
  };
}

export function normalizeCard(raw: ScryfallCard, inputName?: string): Card {
  const faces: CardFace[] =
    raw.card_faces && raw.card_faces.length > 0 ? raw.card_faces.map(faceFrom) : [faceFrom(raw)];

  const renderMode: RenderMode = DUAL_LAYOUTS.has(raw.layout) ? "dual" : "single";

  return {
    id: raw.id,
    oracleId: raw.oracle_id ?? raw.id,
    inputName: inputName ?? raw.name,
    name: raw.name,
    layout: raw.layout,
    colorIdentity: raw.color_identity ?? [],
    rarity: raw.rarity ?? null,
    set: raw.set ?? null,
    setName: raw.set_name ?? null,
    renderMode,
    faces,
  };
}

// Reduce a card to the list of images to generate.
export function toRenderTargets(card: Card, opts?: { generateBothFaces?: boolean }): RenderTarget[] {
  if (card.renderMode === "dual") {
    const both = opts?.generateBothFaces ?? true;
    const faces = both ? card.faces : card.faces.slice(0, 1);
    return faces.map((face, i) => ({
      cardId: card.id,
      faceIndex: i,
      faceLabel: i === 0 ? "front" : "back",
      primary: face,
      secondary: null,
      colorIdentity: card.colorIdentity,
      layout: card.layout,
      canonicalName: card.name,
    }));
  }

  // Single image; split/adventure carry a secondary face merged into one prompt.
  return [
    {
      cardId: card.id,
      faceIndex: null,
      faceLabel: "",
      primary: card.faces[0],
      secondary: card.faces[1] ?? null,
      colorIdentity: card.colorIdentity,
      layout: card.layout,
      canonicalName: card.name,
    },
  ];
}
