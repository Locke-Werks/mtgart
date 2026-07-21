import { z } from "zod";

const EnvSchema = z.object({
  // Optional so the free Scryfall path works without a key; required lazily for image/text calls.
  OPENAI_API_KEY: z.string().min(1).optional(),
  SCRYFALL_USER_AGENT: z.string().min(1).default("MTGArt/1.0 (contact-not-set)"),
  STORAGE_DRIVER: z.enum(["local", "blob", "supabase"]).default("local"),
  JOB_DRIVER: z.enum(["memory", "inngest"]).default("memory"),
  IMAGE_MODEL: z.string().default("gpt-image-2"),
  // Prefer a cheap, capable text model; falls back to gpt-4o-mini if unavailable.
  TEXT_MODEL: z.string().default("gpt-5-mini"),
  MAX_BATCH_SPEND_USD: z.coerce.number().positive().default(25),
  // Max simultaneous image requests. Keep BELOW your OpenAI account's concurrency
  // limit; full-send never exceeds this.
  MAX_CONCURRENCY: z.coerce.number().int().min(1).max(64).default(16),
});

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (!cached) cached = EnvSchema.parse(process.env);
  return cached;
}

export function requireOpenAIKey(): string {
  const key = getEnv().OPENAI_API_KEY;
  if (!key) {
    throw new Error(
      "OPENAI_API_KEY is not set. Copy .env.local.example to .env.local and add a key with image-generation access.",
    );
  }
  return key;
}
