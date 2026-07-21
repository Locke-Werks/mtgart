import { jobStore, toPublicBatch } from "@/jobs/store";
import type { BatchEvent } from "@/jobs/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!jobStore.get(id)) return new Response("Batch not found.", { status: 404 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let unsub = () => {};
      let closed = false;
      const close = () => {
        if (closed) return;
        closed = true;
        unsub();
        try {
          controller.close();
        } catch {
          // already closed
        }
      };

      const send = (e: BatchEvent) => {
        if (closed) return;
        const payload = { type: e.type, batch: toPublicBatch(e.batch) };
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        } catch {
          close();
          return;
        }
        if (e.type === "done") close();
      };

      unsub = jobStore.subscribe(id, send);
      req.signal.addEventListener("abort", close);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
