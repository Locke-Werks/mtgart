import { expandStyle } from "@/style/expand";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { prompt?: unknown };
  const prompt = String(b.prompt ?? "").trim();
  if (!prompt) return Response.json({ error: "Empty style prompt." }, { status: 400 });

  try {
    const expanded = await expandStyle(prompt);
    return Response.json({ expanded });
  } catch (e) {
    const err = e as { message?: string };
    return Response.json({ error: err.message ?? "Failed to expand style." }, { status: 500 });
  }
}
