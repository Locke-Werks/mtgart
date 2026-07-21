// Raw Scryfall shapes (partial) plus the internal Card model the rest of the app uses.

export interface ScryfallImageUris {
  small?: string;
  normal?: string;
  large?: string;
  png?: string;
  art_crop?: string;
  border_crop?: string;
}

export interface ScryfallCardFace {
  name: string;
  mana_cost?: string;
  type_line?: string;
  oracle_text?: string;
  flavor_text?: string;
  power?: string;
  toughness?: string;
  loyalty?: string;
  colors?: string[];
  image_uris?: ScryfallImageUris;
}

export interface ScryfallCard {
  id: string;
  oracle_id?: string;
  name: string;
  layout: string;
  mana_cost?: string;
  cmc?: number;
  type_line?: string;
  oracle_text?: string;
  flavor_text?: string;
  power?: string;
  toughness?: string;
  loyalty?: string;
  colors?: string[];
  color_identity?: string[];
  rarity?: string;
  set?: string;
  set_name?: string;
  image_uris?: ScryfallImageUris;
  card_faces?: ScryfallCardFace[];
}

export interface ScryfallList<T> {
  data: T[];
  not_found?: Array<{ name?: string }>;
}

// Internal model.

export interface CardFace {
  name: string;
  manaCost: string | null; // raw "{2}{U}{U}"; the builder derives the pip spec from this
  typeLine: string;
  oracleText: string;
  flavorText: string | null;
  power: string | null;
  toughness: string | null;
  loyalty: string | null;
  colors: string[];
}

export type RenderMode = "single" | "dual";

export interface Card {
  id: string;
  oracleId: string;
  inputName: string;
  name: string;
  layout: string;
  colorIdentity: string[];
  rarity: string | null;
  set: string | null;
  setName: string | null;
  renderMode: RenderMode;
  faces: CardFace[];
}

// One image to generate. dual layouts produce one target per face; single layouts
// produce one target that may carry a secondary face (split/adventure).
export interface RenderTarget {
  cardId: string;
  faceIndex: number | null;
  faceLabel: string; // "front" | "back" | ""
  primary: CardFace;
  secondary: CardFace | null;
  colorIdentity: string[];
  layout: string;
  canonicalName: string;
}
