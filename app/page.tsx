"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { STARTERS, DEFAULT_STYLE_PROMPT } from "@/style/starters";
import type { Batch, CardJob } from "@/jobs/types";
import type { CostEstimate } from "@/cost/estimate";

interface ResolveCard {
  cardId: string;
  name: string;
  layout: string;
  renderMode: string;
  imageCount: number;
}
interface ResolveResult {
  cards: ResolveCard[];
  notFound: string[];
  ambiguous: { name: string; candidates: string[] }[];
  imageCount: number;
  cardCount: number;
}

const MODELS = ["gpt-image-2", "gpt-image-1.5", "gpt-image-1-mini"];
const QUALITIES = ["low", "medium", "high"] as const;

const STATUS_COLOR: Record<string, string> = {
  resolved: "#9ca3af",
  art_directing: "#22d3ee",
  generating: "#a78bfa",
  printing: "#60a5fa",
  done: "#4ade80",
  error: "#f87171",
  rejected_policy: "#fbbf24",
  skipped_cap: "#9ca3af",
};

export default function Home() {
  const [namesText, setNamesText] = useState("Lightning Bolt\nSerra Angel\nCounterspell");
  const [stylePrompt, setStylePrompt] = useState(DEFAULT_STYLE_PROMPT);
  const [model, setModel] = useState(MODELS[0]);
  const [quality, setQuality] = useState<(typeof QUALITIES)[number]>("high");
  const [bothFaces, setBothFaces] = useState(true);
  const [spendCap, setSpendCap] = useState(10);
  const [fullSend, setFullSend] = useState(false);
  const [enriching, setEnriching] = useState(false);

  const [resolving, setResolving] = useState(false);
  const [resolveResult, setResolveResult] = useState<ResolveResult | null>(null);
  const [estimate, setEstimate] = useState<CostEstimate | null>(null);

  const [batch, setBatch] = useState<Batch | null>(null);
  const [running, setRunning] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => () => esRef.current?.close(), []);

  function names(): string[] {
    return namesText
      .split("\n")
      .map((n) => n.trim())
      .filter(Boolean);
  }

  async function onEnrich() {
    if (!stylePrompt.trim()) return;
    setEnriching(true);
    try {
      const res = await fetch("/api/style/expand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: stylePrompt }),
      });
      const data = (await res.json()) as { expanded?: string; error?: string };
      if (data.expanded) setStylePrompt(data.expanded);
      else if (data.error) alert(data.error);
    } finally {
      setEnriching(false);
    }
  }

  async function onResolve() {
    setResolving(true);
    setResolveResult(null);
    setEstimate(null);
    try {
      const res = await fetch("/api/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ names: names(), generateBothFaces: bothFaces }),
      });
      const data = (await res.json()) as ResolveResult;
      setResolveResult(data);
      const est = await fetch("/api/cost/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageCount: data.imageCount, cardCount: data.cardCount, model, quality }),
      });
      setEstimate((await est.json()) as CostEstimate);
    } finally {
      setResolving(false);
    }
  }

  async function onGenerate() {
    if (!stylePrompt.trim()) {
      alert("Enter a master style prompt first.");
      return;
    }
    setRunning(true);
    setBatch(null);
    esRef.current?.close();
    const res = await fetch("/api/batches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ names: names(), stylePrompt, model, quality, generateBothFaces: bothFaces, spendCapUsd: spendCap, fullSend }),
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      alert(err.error ?? "Failed to start batch.");
      setRunning(false);
      return;
    }
    const { batchId, batch: initial } = (await res.json()) as { batchId: string; batch: Batch };
    setBatch(initial);

    const es = new EventSource(`/api/batches/${batchId}/stream`);
    esRef.current = es;
    es.onmessage = (ev) => {
      const msg = JSON.parse(ev.data) as { type: string; batch: Batch };
      setBatch(msg.batch);
      if (msg.type === "done") {
        es.close();
        setRunning(false);
      }
    };
    es.onerror = () => {
      es.close();
      setRunning(false);
    };
  }

  return (
    <main style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 4 }}>MTG Custom Art Generator</h1>
      <p style={{ marginTop: 0, color: "#6b7280", fontSize: 13 }}>
        Names go through Scryfall, then each card is rendered by AI in one locked style you define.
        Card names, text, and symbols are Wizards of the Coast IP; output is unofficial proxies for
        personal use.
      </p>

      <section style={panel}>
        <label style={label}>Card names (one per line)</label>
        <textarea
          value={namesText}
          onChange={(e) => setNamesText(e.target.value)}
          rows={6}
          style={{ ...textarea, fontFamily: "monospace" }}
        />

        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <label style={{ ...label, marginBottom: 0 }}>
              Master style prompt (drives every card, edit freely)
            </label>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select
                value=""
                onChange={(e) => {
                  const s = STARTERS.find((x) => x.id === e.target.value);
                  if (s) setStylePrompt(s.prompt);
                }}
                style={input}
              >
                <option value="">Load a starter...</option>
                {STARTERS.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
              <button onClick={onEnrich} disabled={enriching || !stylePrompt.trim()} style={{ ...btn, background: "#6d28d9", padding: "6px 10px", fontSize: 13 }}>
                {enriching ? "Enriching..." : "Enrich"}
              </button>
            </div>
          </div>
          <textarea
            value={stylePrompt}
            onChange={(e) => setStylePrompt(e.target.value)}
            rows={5}
            placeholder="Describe the single visual style the whole set should share: medium, palette, lighting, frame treatment, mood, and what to avoid."
            style={{ ...textarea, lineHeight: 1.5 }}
          />
        </div>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 12 }}>
          <Field label="Model">
            <select value={model} onChange={(e) => setModel(e.target.value)} style={input}>
              {MODELS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </Field>
          <Field label="Quality">
            <select value={quality} onChange={(e) => setQuality(e.target.value as (typeof QUALITIES)[number])} style={input}>
              {QUALITIES.map((q) => (
                <option key={q} value={q}>{q}</option>
              ))}
            </select>
          </Field>
          <Field label="Spend cap ($)">
            <input
              type="number"
              min={0}
              step={1}
              value={spendCap}
              disabled={fullSend}
              onChange={(e) => setSpendCap(Number(e.target.value))}
              style={{ ...input, width: 90, opacity: fullSend ? 0.4 : 1 }}
            />
          </Field>
          <Field label="Both faces (DFC)">
            <input type="checkbox" checked={bothFaces} onChange={(e) => setBothFaces(e.target.checked)} />
          </Field>
          <Field label="Full send (no cap)">
            <input
              type="checkbox"
              checked={fullSend}
              onChange={(e) => setFullSend(e.target.checked)}
              title="Fire every card at once and ignore the spend cap. Payday mode."
            />
          </Field>
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <button onClick={onResolve} disabled={resolving || running} style={btn}>
            {resolving ? "Resolving..." : "Resolve & estimate"}
          </button>
          <button
            onClick={onGenerate}
            disabled={running || (fullSend ? namesText.trim().length === 0 : !resolveResult || resolveResult.cardCount === 0)}
            style={{ ...btn, background: fullSend ? "#dc2626" : "#2563eb", color: "#fff" }}
          >
            {running ? "Generating..." : fullSend ? "Full send" : "Generate batch"}
          </button>
        </div>
        {fullSend && (
          <div style={{ marginTop: 8, fontSize: 12, color: "#fbbf24" }}>
            Full send: cards fire in parallel up to your API concurrency limit and the spend cap is ignored. You are billed for all images. No resolve step needed.
          </div>
        )}
      </section>

      {resolveResult && (
        <section style={panel}>
          <strong>{resolveResult.cardCount}</strong> cards resolved,{" "}
          <strong>{resolveResult.imageCount}</strong> images.
          {estimate && (
            <span>
              {" "}Estimated cost <strong>${estimate.totalUsd.toFixed(2)}</strong>{" "}
              (${estimate.perImageUsd.toFixed(3)}/image).
            </span>
          )}
          {resolveResult.notFound.length > 0 && (
            <div style={warn}>Not found: {resolveResult.notFound.join(", ")}</div>
          )}
          {resolveResult.ambiguous.length > 0 && (
            <div style={warn}>
              {resolveResult.ambiguous.map((a) => (
                <div key={a.name}>
                  &ldquo;{a.name}&rdquo; is ambiguous. Try: {a.candidates.slice(0, 5).join(", ")}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {batch && (
        <section style={panel}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, gap: 12, flexWrap: "wrap" }}>
            <span>
              Batch <code>{batch.batchId}</code> ({batch.status})
            </span>
            <span style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <span>Spend ${batch.actualUsd.toFixed(2)} / est ${batch.estimateUsd.toFixed(2)}</span>
              {(() => {
                const doneCount = batch.cards.filter((c) => c.status === "done" && c.outputs.length > 0).length;
                return doneCount > 0 ? (
                  <a
                    href={`/api/batches/${batch.batchId}/download`}
                    download
                    style={{ ...btn, background: "#16a34a", color: "#fff", textDecoration: "none", padding: "6px 12px", fontSize: 13 }}
                  >
                    Download all ({doneCount})
                  </a>
                ) : null;
              })()}
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
            {batch.cards.map((c) => (
              <CardTile key={c.cardId} card={c} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function CardTile({ card }: { card: CardJob }) {
  const out = card.outputs[0];
  const linkStyle: CSSProperties = { color: "#60a5fa" };
  return (
    <div style={{ border: "1px solid #33333a", borderRadius: 8, padding: 8, background: "#1d1d20" }}>
      <div style={{ aspectRatio: "5 / 7", background: "#2a2a2e", borderRadius: 4, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {out?.screenUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={out.screenUrl} alt={card.canonicalName ?? card.inputName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span style={{ fontSize: 12, color: STATUS_COLOR[card.status] ?? "#6b7280" }}>{card.status}</span>
        )}
      </div>
      <div style={{ fontSize: 13, marginTop: 6, fontWeight: 600 }}>{card.canonicalName ?? card.inputName}</div>
      <div style={{ fontSize: 11, color: STATUS_COLOR[card.status] ?? "#6b7280" }}>
        {card.status}
        {card.error ? `: ${card.error.message}` : ""}
      </div>
      {card.outputs.length > 0 && (
        <div style={{ fontSize: 11, marginTop: 4, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {card.outputs.map((o) => (
            <span key={o.faceIndex} style={{ display: "flex", gap: 6 }}>
              {o.trimUrl && <a href={o.trimUrl} target="_blank" rel="noreferrer" style={linkStyle}>png</a>}
              {o.pdfUrl && <a href={o.pdfUrl} target="_blank" rel="noreferrer" style={linkStyle}>pdf</a>}
              {o.masterUrl && <a href={o.masterUrl} target="_blank" rel="noreferrer" style={linkStyle}>master</a>}
            </span>
          ))}
        </div>
      )}
      {out?.promptText && (
        <details style={{ marginTop: 6 }}>
          <summary style={{ fontSize: 11, color: "#9ca3af", cursor: "pointer" }}>prompt</summary>
          <pre
            style={{
              fontSize: 10,
              whiteSpace: "pre-wrap",
              color: "#c7c7cc",
              background: "#151517",
              padding: 6,
              borderRadius: 4,
              marginTop: 4,
              maxHeight: 220,
              overflow: "auto",
            }}
          >
            {out.promptText}
          </pre>
        </details>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 11, color: "#6b7280" }}>{label}</span>
      {children}
    </div>
  );
}

const panel: CSSProperties = { border: "1px solid #2e2e33", borderRadius: 10, padding: 16, marginTop: 16, background: "#212124" };
const label: CSSProperties = { display: "block", fontSize: 12, color: "#a1a1aa", marginBottom: 6 };
const input: CSSProperties = { padding: "6px 8px", border: "1px solid #3f3f46", borderRadius: 6, fontSize: 13, background: "#2a2a2e", color: "#e5e5e5" };
const textarea: CSSProperties = { width: "100%", fontSize: 13, padding: 8, boxSizing: "border-box", background: "#2a2a2e", color: "#e5e5e5", border: "1px solid #3f3f46", borderRadius: 6 };
const btn: CSSProperties = { padding: "8px 14px", background: "#3f3f46", color: "#e5e5e5", border: "none", borderRadius: 6, fontSize: 14, cursor: "pointer" };
const warn: CSSProperties = { marginTop: 8, padding: 8, background: "#332701", borderRadius: 6, fontSize: 13, color: "#fcd34d" };
