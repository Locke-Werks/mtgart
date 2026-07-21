const COLOR_NAMES: Record<string, string> = {
  W: "white",
  U: "blue",
  B: "black",
  R: "red",
  G: "green",
};

// One <pip> element per mana symbol, carrying the canonical token plus an explicit
// kind so the model renders the same symbol every time instead of interpreting prose.
function pipXml(sym: string): string {
  const s = sym.replace(/[{}]/g, "");
  if (/^\d+$/.test(s)) return `  <pip token="${sym}" kind="generic" value="${s}"/>`;
  if (s === "X" || s === "Y" || s === "Z") return `  <pip token="${sym}" kind="generic" value="${s}"/>`;
  if (s === "C") return `  <pip token="${sym}" kind="colorless"/>`;
  if (s === "S") return `  <pip token="${sym}" kind="snow"/>`;
  if (s === "T") return `  <pip token="${sym}" kind="tap"/>`;
  if (s === "Q") return `  <pip token="${sym}" kind="untap"/>`;
  if (s === "E") return `  <pip token="${sym}" kind="energy"/>`;
  if (s.includes("/")) {
    const parts = s
      .split("/")
      .map((p) => (/^\d+$/.test(p) ? p : p === "P" ? "phyrexian" : (COLOR_NAMES[p] ?? p.toLowerCase())));
    return `  <pip token="${sym}" kind="hybrid" parts="${parts.join("/")}"/>`;
  }
  const name = COLOR_NAMES[s] ?? s.toLowerCase();
  return `  <pip token="${sym}" kind="${name}"/>`;
}

export interface ManaSpec {
  notation: string; // e.g. "{2}{U}{U}"
  count: number;
  pipsXml: string;
}

export function manaCostToSpec(manaCost: string): ManaSpec | null {
  const syms = manaCost.match(/\{[^}]+\}/g);
  if (!syms || syms.length === 0) return null;
  return {
    notation: manaCost,
    count: syms.length,
    pipsXml: syms.map(pipXml).join("\n"),
  };
}
