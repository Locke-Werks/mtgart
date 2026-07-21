import { jobStore, toPublicBatch } from "@/jobs/store";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const batch = jobStore.get(id);
  if (!batch) return Response.json({ error: "Batch not found." }, { status: 404 });
  return Response.json({ batch: toPublicBatch(batch) });
}
