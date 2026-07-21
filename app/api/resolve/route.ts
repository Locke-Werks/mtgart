import { resolveCards } from "@/scryfall/client";
import { normalizeCard, toRenderTargets } from "@/scryfall/normalize";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { names?: unknown; generateBothFaces?: unknown };
  const names = Array.isArray(body.names) ? body.names.map((n) => String(n).trim()).filter(Boolean) : [];
  const generateBothFaces = body.generateBothFaces !== false;

  if (names.length === 0) {
    return Response.json({ cards: [], notFound: [], ambiguous: [], imageCount: 0, cardCount: 0 });
  }

  const { found, notFound, ambiguous } = await resolveCards(names);

  let imageCount = 0;
  const cards = found.map((raw) => {
    const card = normalizeCard(raw);
    const targets = toRenderTargets(card, { generateBothFaces });
    imageCount += targets.length;
    return {
      cardId: card.id,
      name: card.name,
      layout: card.layout,
      renderMode: card.renderMode,
      imageCount: targets.length,
    };
  });

  return Response.json({ cards, notFound, ambiguous, imageCount, cardCount: found.length });
}
