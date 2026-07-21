import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { jobStore } from "@/jobs/store";
import { getEnv } from "@/config/env";
import { slug } from "@/lib/sanitize";
import { createZip, type ZipEntry } from "@/lib/zip";

export const dynamic = "force-dynamic";

const ROOT = resolve(process.cwd(), "storage");

// A zip of every finished card's full-resolution master render, uniquely named.
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (getEnv().STORAGE_DRIVER !== "local") {
    return new Response("Zip download is only available with the local storage driver.", { status: 501 });
  }
  const batch = jobStore.get(id);
  if (!batch) return new Response("Batch not found.", { status: 404 });

  const entries: ZipEntry[] = [];
  let idx = 0;
  for (const card of batch.cards) {
    if (card.status !== "done") continue;
    for (const out of card.outputs) {
      idx++;
      const key = `batches/${id}/${card.cardId}/face${out.faceIndex}.master.png`;
      const path = join(ROOT, key);
      if (!existsSync(path)) continue;
      const face = out.faceLabel && out.faceLabel !== "card" ? `-${out.faceLabel}` : "";
      const name = `${String(idx).padStart(3, "0")}-${slug(card.canonicalName ?? card.inputName)}${face}.png`;
      entries.push({ name, data: await readFile(path) });
    }
  }

  if (entries.length === 0) return new Response("No finished renders to download yet.", { status: 404 });

  const zip = createZip(entries);
  const body = new Uint8Array(zip.length);
  body.set(zip);
  return new Response(body, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="mtgart-${id}.zip"`,
      "Content-Length": String(zip.length),
      "Cache-Control": "no-store",
    },
  });
}
