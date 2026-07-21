import OpenAI from "openai";
import { getEnv, requireOpenAIKey } from "@/config/env";
import { GEN_SIZE, DEFAULT_GEN_SIZE } from "@/config/constants";
import { estimateImagePrice, type ImageQuality } from "@/config/pricing";

export interface GenerateInput {
  prompt: string;
  model?: string;
  quality?: ImageQuality;
}

export interface GenerateResult {
  png: Buffer;
  model: string;
  size: string;
  quality: ImageQuality;
  costUsd: number;
}

// Thrown for content-policy rejections so callers can flag and skip without retrying.
export class PolicyRejectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PolicyRejectionError";
  }
}

function sizeForModel(model: string): string {
  return GEN_SIZE[model] ?? DEFAULT_GEN_SIZE;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function isPolicyError(status: number | undefined, code: unknown, message: string): boolean {
  if (status !== 400) return false;
  const c = String(code ?? "");
  return c.includes("moderation") || /safety|policy|moderation|content/i.test(message);
}

// Honor a Retry-After header (seconds) if the API sent one on a rate-limit error.
function retryAfterMs(err: unknown): number | null {
  const h = (err as { headers?: Headers | Record<string, string> }).headers;
  let val: string | null | undefined;
  if (h instanceof Headers) val = h.get("retry-after");
  else if (h && typeof h === "object") val = (h as Record<string, string>)["retry-after"];
  const secs = val ? Number(val) : NaN;
  return Number.isFinite(secs) ? secs * 1000 : null;
}

export async function generateCardImage(input: GenerateInput): Promise<GenerateResult> {
  const env = getEnv();
  const model = input.model ?? env.IMAGE_MODEL;
  const quality: ImageQuality = input.quality ?? "high";
  const size = sizeForModel(model);
  const client = new OpenAI({ apiKey: requireOpenAIKey() });

  const maxAttempts = 6;
  let lastErr: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Cast the body: gpt-image params (output_format, moderation) and custom sizes
      // are not all present in the SDK's static union across versions.
      const res = await client.images.generate({
        model,
        prompt: input.prompt,
        n: 1,
        size,
        quality,
        output_format: "png",
        moderation: "low",
      } as never);

      const b64 = (res as { data?: Array<{ b64_json?: string }> }).data?.[0]?.b64_json;
      if (!b64) throw new Error("OpenAI returned no image data.");
      const png = Buffer.from(b64, "base64");
      const costUsd = estimateImagePrice(model, quality, size);
      return { png, model, size, quality, costUsd };
    } catch (err: unknown) {
      lastErr = err;
      const e = err as { status?: number; code?: unknown; message?: string };
      const status = e.status;
      const message = e.message ?? String(err);

      if (isPolicyError(status, e.code, message)) {
        throw new PolicyRejectionError(message);
      }

      const retryable =
        status === 429 ||
        (typeof status === "number" && status >= 500 && status < 600) ||
        e.code === "ETIMEDOUT" ||
        e.code === "ECONNRESET";

      if (!retryable || attempt === maxAttempts) throw err;
      const backoff =
        retryAfterMs(err) ?? Math.min(30000, 1000 * 2 ** (attempt - 1)) + Math.floor(Math.random() * 750);
      await sleep(backoff);
    }
  }

  throw lastErr;
}
