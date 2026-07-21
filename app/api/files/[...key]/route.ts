import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, sep } from "node:path";
import { getEnv } from "@/config/env";

export const dynamic = "force-dynamic";

const ROOT = resolve(process.cwd(), "storage");
const TYPES: Record<string, string> = {
  ".png": "image/png",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
  ".json": "application/json",
};

export async function GET(_req: Request, ctx: { params: Promise<{ key: string[] }> }) {
  if (getEnv().STORAGE_DRIVER !== "local") {
    return new Response("File serving is only available with the local storage driver.", { status: 404 });
  }
  const { key } = await ctx.params;
  const path = resolve(ROOT, key.join("/"));
  // Path traversal guard: the resolved path must stay under storage/.
  if (path !== ROOT && !path.startsWith(ROOT + sep)) {
    return new Response("Bad path.", { status: 400 });
  }
  if (!existsSync(path)) return new Response("Not found.", { status: 404 });

  const ext = path.slice(path.lastIndexOf("."));
  const data = await readFile(path);
  return new Response(data, {
    headers: {
      "Content-Type": TYPES[ext] ?? "application/octet-stream",
      "Cache-Control": "no-store",
    },
  });
}
