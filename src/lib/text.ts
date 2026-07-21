import OpenAI from "openai";
import { getEnv, requireOpenAIKey } from "@/config/env";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const FALLBACK_MODEL = "gpt-4o-mini";

// Memoize which text model actually works so we do not eat a failed request per card
// when the configured model is unavailable on the account.
let resolvedModel: string | null = null;

function isModelUnavailable(err: unknown): boolean {
  const e = err as { status?: number; code?: string; message?: string };
  if (e.status === 404 || e.code === "model_not_found") return true;
  const msg = e.message ?? "";
  return /model/i.test(msg) && /(does not exist|not found|do not have access|unknown model)/i.test(msg);
}

function isTemperatureError(err: unknown): boolean {
  const e = err as { status?: number; message?: string };
  return e.status === 400 && /temperature/i.test(e.message ?? "");
}

async function once(
  client: OpenAI,
  model: string,
  messages: ChatMessage[],
  temperature?: number,
): Promise<string> {
  try {
    const res = await client.chat.completions.create({
      model,
      messages,
      ...(temperature !== undefined ? { temperature } : {}),
    });
    return res.choices[0]?.message?.content?.trim() ?? "";
  } catch (err) {
    // Some reasoning models reject a custom temperature; retry once without it.
    if (isTemperatureError(err) && temperature !== undefined) {
      const res = await client.chat.completions.create({ model, messages });
      return res.choices[0]?.message?.content?.trim() ?? "";
    }
    throw err;
  }
}

// A chat completion that prefers the configured TEXT_MODEL (default gpt-5-mini) and
// falls back to a widely available model if that one is not on the account.
export async function chatComplete(messages: ChatMessage[], opts?: { temperature?: number }): Promise<string> {
  const client = new OpenAI({ apiKey: requireOpenAIKey() });
  const primary = getEnv().TEXT_MODEL;
  const candidates = resolvedModel
    ? [resolvedModel]
    : primary === FALLBACK_MODEL
      ? [FALLBACK_MODEL]
      : [primary, FALLBACK_MODEL];

  let lastErr: unknown;
  for (const model of candidates) {
    try {
      const out = await once(client, model, messages, opts?.temperature);
      resolvedModel = model;
      return out;
    } catch (err) {
      lastErr = err;
      if (isModelUnavailable(err)) continue;
      throw err;
    }
  }
  throw lastErr;
}
