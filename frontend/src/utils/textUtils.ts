/**
 * Converts raw LaTeX mathematical expressions and markup into clean, readable Unicode text.
 * e.g.:
 *   "local $R^2 \\ge 0.75$, $\\sigma = 0.75 \\times \\sqrt{D}$"
 *   -> "local R² ≥ 0.75, σ = 0.75 × √D"
 */
export function formatMathText(text?: string | null): string {
  if (!text) return "";
  let s = text;

  // 1. Common fractions \frac{a}{b} -> (a / b)
  s = s.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1 / $2)");

  // 2. Square roots \sqrt{x} -> √x or √(x)
  s = s.replace(/\\sqrt\{([a-zA-Z0-9])\}/g, "√$1");
  s = s.replace(/\\sqrt\{([^}]+)\}/g, "√($1)");
  s = s.replace(/\\sqrt(?![a-zA-Z])/g, "√");

  // 3. Greek letters (lowercase & uppercase)
  const greek: Record<string, string> = {
    "\\alpha": "α",
    "\\beta": "β",
    "\\gamma": "γ",
    "\\Gamma": "Γ",
    "\\delta": "δ",
    "\\Delta": "Δ",
    "\\epsilon": "ε",
    "\\varepsilon": "ε",
    "\\zeta": "ζ",
    "\\eta": "η",
    "\\theta": "θ",
    "\\Theta": "Θ",
    "\\iota": "ι",
    "\\kappa": "κ",
    "\\lambda": "λ",
    "\\Lambda": "Λ",
    "\\mu": "μ",
    "\\nu": "ν",
    "\\xi": "ξ",
    "\\Xi": "Ξ",
    "\\pi": "π",
    "\\Pi": "Π",
    "\\rho": "ρ",
    "\\sigma": "σ",
    "\\Sigma": "Σ",
    "\\tau": "τ",
    "\\upsilon": "υ",
    "\\phi": "φ",
    "\\Phi": "Φ",
    "\\chi": "χ",
    "\\psi": "ψ",
    "\\Psi": "Ψ",
    "\\omega": "ω",
    "\\Omega": "Ω",
  };
  for (const [cmd, sym] of Object.entries(greek)) {
    s = s.replace(new RegExp(cmd.replace("\\", "\\\\") + "(?![a-zA-Z])", "g"), sym);
  }

  // 4. Mathematical relations & operators
  const mathSymbols: Record<string, string> = {
    "\\ge": "≥",
    "\\geq": "≥",
    "\\le": "≤",
    "\\leq": "≤",
    "\\ne": "≠",
    "\\neq": "≠",
    "\\approx": "≈",
    "\\simeq": "≃",
    "\\sim": "~",
    "\\times": "×",
    "\\cdot": "·",
    "\\pm": "±",
    "\\mp": "∓",
    "\\rightarrow": "→",
    "\\to": "→",
    "\\leftarrow": "←",
    "\\Rightarrow": "⇒",
    "\\Leftarrow": "⇐",
    "\\leftrightarrow": "↔",
    "\\infty": "∞",
    "\\partial": "∂",
    "\\nabla": "∇",
    "\\in": "∈",
    "\\notin": "∉",
    "\\subset": "⊂",
    "\\subseteq": "⊆",
    "\\cup": "∪",
    "\\cap": "∩",
    "\\forall": "∀",
    "\\exists": "∃",
    "\\neg": "¬",
  };
  for (const [cmd, sym] of Object.entries(mathSymbols)) {
    s = s.replace(new RegExp(cmd.replace("\\", "\\\\") + "(?![a-zA-Z])", "g"), sym);
  }

  // 5. LaTeX wrappers like \text{...}, \mathrm{...}, \mathbf{...}, \mathit{...}
  s = s.replace(/\\(?:text|mathrm|mathbf|mathit|textbf|textit)\{([^}]+)\}/g, "$1");

  // 6. Common superscripts & powers (e.g. R^2 -> R², ^0 to ^9, ^+, ^-)
  const superscripts: Record<string, string> = {
    "0": "⁰",
    "1": "¹",
    "2": "²",
    "3": "³",
    "4": "⁴",
    "5": "⁵",
    "6": "⁶",
    "7": "⁷",
    "8": "⁸",
    "9": "⁹",
    "+": "⁺",
    "-": "⁻",
    "=": "⁼",
    "n": "ⁿ",
  };
  s = s.replace(/\^\{([0-9+\-n]+)\}/g, (_, exp) =>
    exp.split("").map((c: string) => superscripts[c] || c).join("")
  );
  s = s.replace(/\^([0-9n])/g, (_, digit) => superscripts[digit] || digit);

  // 7. Common subscripts (e.g. _0 to _9)
  const subscripts: Record<string, string> = {
    "0": "₀",
    "1": "₁",
    "2": "₂",
    "3": "₃",
    "4": "₄",
    "5": "₅",
    "6": "₆",
    "7": "₇",
    "8": "₈",
    "9": "₉",
    "i": "ᵢ",
    "j": "ⱼ",
    "t": "ₜ",
    "k": "ₖ",
    "x": "ₓ",
  };
  s = s.replace(/_\{([0-9ijtkx]+)\}/g, (_, sub) =>
    sub.split("").map((c: string) => subscripts[c] || c).join("")
  );
  s = s.replace(/_([0-9ijtkx])/g, (_, sub) => subscripts[sub] || sub);

  // 8. Remove inline math delimiters $...$
  s = s.replace(/\$\$([^$]+)\$\$/g, "$1");
  s = s.replace(/\$([^$]+)\$/g, "$1");

  // 9. Remove stray backslashes before characters escaped in LaTeX (like \% -> %)
  s = s.replace(/\\([%&_#{}])/g, "$1");

  // 10. Clean up extra spaces
  s = s.replace(/\s{2,}/g, " ");

  return s.trim();
}
