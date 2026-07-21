import type { Batch, BatchEvent, CardJob } from "./types";

type Subscriber = (e: BatchEvent) => void;

interface Entry {
  batch: Batch;
  subscribers: Set<Subscriber>;
  done: boolean;
}

// In-memory job store for local / persistent-host runs. Holds batch state and a
// per-batch pub/sub for SSE progress. Vercel uses a durable store instead (Phase 5).
class MemoryJobStore {
  private entries = new Map<string, Entry>();

  create(batch: Batch): void {
    this.entries.set(batch.batchId, { batch, subscribers: new Set(), done: false });
  }

  get(batchId: string): Batch | undefined {
    return this.entries.get(batchId)?.batch;
  }

  list(): Batch[] {
    return [...this.entries.values()]
      .map((e) => e.batch)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  update(batchId: string, mutate: (b: Batch) => void): Batch | undefined {
    const entry = this.entries.get(batchId);
    if (!entry) return undefined;
    mutate(entry.batch);
    this.emit(batchId, { type: "snapshot", batch: entry.batch });
    return entry.batch;
  }

  finish(batchId: string): void {
    const entry = this.entries.get(batchId);
    if (!entry) return;
    entry.done = true;
    this.emit(batchId, { type: "done", batch: entry.batch });
  }

  subscribe(batchId: string, cb: Subscriber): () => void {
    const entry = this.entries.get(batchId);
    if (!entry) return () => {};
    entry.subscribers.add(cb);
    // Replay current state so a late subscriber is immediately consistent.
    cb({ type: "snapshot", batch: entry.batch });
    if (entry.done) cb({ type: "done", batch: entry.batch });
    return () => {
      entry.subscribers.delete(cb);
    };
  }

  private emit(batchId: string, e: BatchEvent): void {
    const entry = this.entries.get(batchId);
    if (!entry) return;
    for (const cb of entry.subscribers) {
      try {
        cb(e);
      } catch {
        // subscriber failures must not break the run
      }
    }
  }
}

// Strip internal-only fields before sending to the client or persisting the manifest.
export function toPublicBatch(batch: Batch): Batch {
  return {
    ...batch,
    cards: batch.cards.map((c) => {
      const copy: CardJob = { ...c };
      delete copy.card;
      return copy;
    }),
  };
}

// Survive Next.js dev HMR by pinning the singleton to globalThis.
const g = globalThis as unknown as { __mtgJobStore?: MemoryJobStore };
export const jobStore: MemoryJobStore = g.__mtgJobStore ?? (g.__mtgJobStore = new MemoryJobStore());
