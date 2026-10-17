// Shared look for the README graphics, built on GitHub's own Primer design tokens.
//
// Cards are flat boxes with hairline borders and no fill, so they sit on the page like
// GitHub's own UI in light, dark, and dark dimmed themes.

import { readFileSync } from "node:fs";

export const W = 1000;
export const GAP = 24; // gutter between cards; ~matches the gap GitHub leaves between stacked images
export const PAD = 32; // inner padding of every card
const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif";
const MONO = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace";

const icons = JSON.parse(readFileSync(new URL("./icons.json", import.meta.url), "utf8"));
const { brands: BRANDS, brand_hex: BRAND_HEX, octicons: OCTICONS } = icons;

/** Number formatting helper, the JS stand-in for Python's f"{n:.1f}". */
export const f1 = (n) => Number(n).toFixed(1);

/** Escape text for XML (&, <, >). */
export const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Primer functional colours (github.com light / dark default): neutral greys, green as the one accent.
export const THEMES = {
  dark: {
    fg: "#f0f6fc",
    muted: "#9198a1",
    faint: "#656c76",
    border: "#3d444d",
    card: "rgba(110,118,129,0.035)",
    btn: "#212830",
    tag_bg: "rgba(110,118,129,0.10)",
    green: "#3fb950",
    heat: ["rgba(110,118,129,0.14)", "#033a16", "#196c2e", "#2ea043", "#56d364"],
  },
  light: {
    fg: "#1f2328",
    muted: "#59636e",
    faint: "#818b98",
    border: "#d1d9e0",
    card: "rgba(208,215,222,0.08)",
    btn: "#f6f8fa",
    tag_bg: "#f6f8fa",
    green: "#1a7f37",
    heat: ["#eff2f5", "#aceebb", "#4ac26b", "#2da44e", "#116329"],
  },
};

export const BASE_CSS = `
text { font-family: ${SANS}; }
.mono { font-family: ${MONO}; }
@keyframes rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
@keyframes fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes blink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
@keyframes pulse { 0% { opacity: .6; transform: scale(1); } 100% { opacity: 0; transform: scale(2.4); } }
.rise { opacity: 0; animation: rise .6s cubic-bezier(.25,.46,.45,.94) forwards; }
.fade { opacity: 0; animation: fade .5s ease-out forwards; }
.pulse { transform-box: fill-box; transform-origin: center; animation: pulse 2s ease-out infinite; }
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; }
  .rise, .fade { opacity: 1; }
}
`;

export function svg(t, width, height, body, css = "", defs = "") {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}" fill="none">\n` +
    `<style>${BASE_CSS}${css}</style>\n<defs>${defs}</defs>\n${body}\n</svg>\n`
  );
}

/** Octicon (GitHub's own icon set, 16px grid), filled. */
export function icon(name, x, y, size, color) {
  if (!OCTICONS[name]) throw new Error(`Unknown octicon: ${name}`);
  return `<g transform="translate(${f1(x)} ${f1(y)}) scale(${size / 16})" fill="${color}">${OCTICONS[name]}</g>`;
}

function luminance(hex) {
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function mix(hex, toward, amount) {
  return [0, 2, 4]
    .map((i) => parseInt(hex.slice(i, i + 2), 16))
    .map((c) => Math.round(c + (toward - c) * amount).toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Official brand colour, nudged just enough to stay legible on the theme's background.
 * Near-black logos (Next.js, Vercel, …) use the text colour in dark mode; other dark
 * brand colours are lightened step by step, keeping their hue.
 */
export function brandColor(t, slug) {
  let hex = BRAND_HEX[slug];
  if (!hex) throw new Error(`Unknown brand: ${slug}`);
  if (t === THEMES.dark) {
    if (luminance(hex) < 0.02) return t.fg;
    for (let step = 0; step < 10 && luminance(hex) < 0.16; step++) hex = mix(hex, 255, 0.15);
  } else if (luminance(hex) > 0.85) {
    return t.fg;
  }
  return `#${hex}`;
}

export function brand(name, x, y, size, color, opacity = 1) {
  return (
    `<path transform="translate(${f1(x)} ${f1(y)}) scale(${size / 24})" d="${BRANDS[name]}" ` +
    `fill="${color}" fill-opacity="${opacity}"/>`
  );
}

export function delay(i, step = 0.1, base = 0.05) {
  return `style="animation-delay:${(base + i * step).toFixed(2)}s"`;
}

/** GitHub 'Box': hairline border, near-transparent fill. */
export function cell(t, x, y, w, h, rx = 12) {
  return (
    `<rect x="${f1(x + 0.5)}" y="${f1(y + 0.5)}" width="${f1(w - 1)}" height="${f1(h - 1)}" rx="${rx}" ` +
    `fill="${t.card}" stroke="${t.border}"/>`
  );
}

/** Card title in GitHub's sentence-case style, with an optional muted icon. */
export function heading(t, x, y, text, iconName = null) {
  let out = "";
  if (iconName) {
    out += icon(iconName, x, y - 13, 16, t.muted);
    x += 24;
  }
  return out + `<text x="${f1(x)}" y="${y}" font-size="15" font-weight="600" fill="${t.fg}">${esc(text)}</text>`;
}

/** Small muted caption for sub-sections and right-aligned hints. */
export function sublabel(t, x, y, text, anchor = "start") {
  return (
    `<text x="${f1(x)}" y="${y}" font-size="12.5" font-weight="600" text-anchor="${anchor}" ` +
    `fill="${t.muted}">${esc(text)}</text>`
  );
}

/** Faint contribution-graph squares at both edges, fading out towards the centre. */
export function graphBackdrop(t, w, h, rx = 12, seed = 7) {
  const step = 15, size = 11;
  const cols = Math.floor(w / step), rows = Math.floor(h / step);
  const x0 = (w - cols * step + step - size) / 2, y0 = (h - rows * step + step - size) / 2;
  const edge = cols * 0.26;
  let rng = seed;
  const rects = [];
  for (let c = 0; c < cols; c++) {
    const dist = Math.min(c, cols - 1 - c);
    if (dist > edge) continue;
    for (let r = 0; r < rows; r++) {
      // Same LCG as before; BigInt keeps the 31-bit arithmetic exact.
      rng = Number((BigInt(rng) * 1103515245n + 12345n) & 0x7fffffffn);
      const roll = rng % 100;
      const level = roll < 45 ? 0 : roll < 68 ? 1 : roll < 84 ? 2 : roll < 95 ? 3 : 4;
      const op = Math.max(0, 1 - dist / edge) ** 1.4 * (level ? 0.38 : 0.6);
      if (op < 0.05) continue;
      rects.push(
        `<rect x="${f1(x0 + c * step)}" y="${f1(y0 + r * step)}" width="${size}" height="${size}" rx="2.5" ` +
          `fill="${t.heat[level]}" fill-opacity="${op.toFixed(2)}"/>`
      );
    }
  }
  return (
    `<clipPath id="frame"><rect width="${w}" height="${h}" rx="${rx}"/></clipPath>` +
    `<g clip-path="url(#frame)" class="fade" style="animation-duration:1.2s">${rects.join("")}</g>` +
    cell(t, 0, 0, w, h, rx)
  );
}
