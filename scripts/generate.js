// README sections (used by build.js) and the link buttons (written to ../assets).
//
// Run: node scripts/generate.js   # rewrites the buttons; build.js renders the cards

import { mkdirSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  GAP, PAD, THEMES, W, brand, brandColor, cell, delay, esc, f1, graphBackdrop, heading, icon, sublabel, svg,
} from "./theme.js";

const OUT = fileURLToPath(new URL("../assets/", import.meta.url));

// ── Banner ─────────────────────────────────────────────────────────────

const PHRASES = [
  "Full Stack Engineer",
  "React · Next.js · Node.js",
  "Shipping products end to end",
  "Building AI powered features",
];

/** Centred type-and-delete loop over PHRASES, in SMIL so it runs inside <img>. */
function typewriter(t, cx, y, size) {
  const cw = size * 0.6;
  const typeS = 0.07, holdS = 1.9, delS = 0.03, gapS = 0.3;
  const events = []; // [time, chars shown, phrase index]
  const spans = [];
  let now = 0;
  PHRASES.forEach((p, i) => {
    const start = now;
    for (let k = 0; k <= p.length; k++) {
      events.push([now, k, i]);
      now += k < p.length ? typeS : holdS;
    }
    for (let k = p.length - 1; k >= 0; k--) {
      events.push([now, k, i]);
      now += delS;
    }
    now += gapS;
    spans.push([start, now]);
  });
  const total = now;
  const kt = events.map((e) => (e[0] / total).toFixed(5)).join(";") + ";1";

  // Each phrase is centred, so its left edge depends on its own length.
  const left = (i) => cx - (PHRASES[i].length * cw) / 2;

  const clipX = events.map(([, , i]) => f1(left(i))).join(";") + `;${f1(left(0))}`;
  const clipW = events.map(([, k]) => f1(k * cw)).join(";") + ";0";
  const cursorX = events.map(([, k, i]) => f1(left(i) + k * cw + 3)).join(";") + `;${f1(left(0) + 3)}`;
  const dur = total.toFixed(2);
  const anim = `dur="${dur}s" repeatCount="indefinite" calcMode="discrete" keyTimes="${kt}"`;

  const out = [
    `<clipPath id="type"><rect y="${y - size}" height="${size * 1.4}" x="${f1(left(0))}" width="0">` +
      `<animate attributeName="x" ${anim} values="${clipX}"/>` +
      `<animate attributeName="width" ${anim} values="${clipW}"/></rect></clipPath>`,
    '<g clip-path="url(#type)">',
  ];
  PHRASES.forEach((p, i) => {
    const [start, end] = spans[i];
    out.push(
      `<text class="mono" x="${cx}" y="${y}" font-size="${size}" text-anchor="middle" fill="${t.muted}" ` +
        `textLength="${f1(p.length * cw)}" lengthAdjust="spacingAndGlyphs" opacity="0">${esc(p)}` +
        `<animate attributeName="opacity" dur="${dur}s" repeatCount="indefinite" calcMode="discrete" ` +
        `keyTimes="0;${(start / total).toFixed(5)};${(end / total).toFixed(5)};1" values="0;1;0;0"/></text>`
    );
  });
  out.push("</g>");
  out.push(
    `<rect class="cursor" y="${f1(y - size * 0.82)}" width="2.5" height="${f1(size * 1.02)}" rx="1" fill="${t.green}">` +
      `<animate attributeName="x" ${anim} values="${cursorX}"/></rect>`
  );
  return out.join("\n");
}

export function banner(t) {
  const h = 260, cx = W / 2;
  const css = ".cursor { animation: blink 1s step-end infinite; }";
  const body = [
    graphBackdrop(t, W, h),
    `<text class="rise" ${delay(0)} x="${cx}" y="70" font-size="18" text-anchor="middle" fill="${t.muted}">Hi there, I'm</text>`,
    `<text class="rise" ${delay(1)} x="${cx}" y="134" font-size="64" font-weight="700" letter-spacing="-1.5" text-anchor="middle" fill="${t.fg}">Dinesh Suwalkya</text>`,
    `<g class="rise" ${delay(2)}>${typewriter(t, cx, 182, 20)}</g>`,
    `<g class="rise" ${delay(3)} font-size="14" fill="${t.muted}">`,
    icon("location", cx - 58, 208, 16, t.muted),
    `<text x="${cx - 36}" y="221">Jaipur, India</text>`,
    "</g>",
  ];
  return svg(t, W, h, body.join("\n"), css);
}

// ── Link buttons (GitHub .btn) ─────────────────────────────────────────

const BUTTONS = {
  portfolio: ["icon", "globe", "Portfolio"],
  linkedin: ["brand", "linkedin", "LinkedIn"],
  codolio: ["icon", "code", "Codolio"],
  email: ["icon", "mail", "Email"],
};

function button(t, kind, glyph, text) {
  const h = 40;
  const w = Math.round(44 + textW(text, 14, 600) + 18);
  const mark = kind === "icon" ? icon(glyph, 16, 12, 16, t.muted) : brand(glyph, 16, 12, 16, t.fg);
  const body =
    `<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="8" fill="${t.btn}" stroke="${t.border}"/>` +
    mark +
    `<text x="42" y="25" font-size="14" font-weight="600" fill="${t.fg}">${esc(text)}</text>`;
  return svg(t, w, h, body);
}

// ── Row 1: About + Experience ──────────────────────────────────────────

const ABOUT = [
  "Full Stack Engineer working across React, Next.js and Node.js.",
  "I take features from early requirements through testing and",
  "CI/CD to production support, with AI built into the product.",
];
const METHOD = ["requirements", "build", "test", "ship"];
const FOCUS = "React interfaces · Node.js APIs · LLM features in production";

const WINS = [["API response time", "1.8s → 450ms"], ["Reusable components", "15+"]];

/** Rough proportional-font width, good enough for laying out pills. */
function textW(text, size, weight = 400) {
  const count = (chars) => [...text].filter((c) => chars.includes(c)).length;
  const narrow = count("iljtfrI.,·(/ ");
  const wide = count("MWmw");
  const avg = weight >= 600 ? 0.6 : 0.56;
  return ((text.length - narrow - wide) * avg + narrow * 0.3 + wide * 0.85) * size;
}

/** Primer Label: neutral outlined pill. */
function ghLabel(t, x, y, text, size = 12.5) {
  const w = textW(text, size, 500) + 22;
  return [
    w,
    `<rect x="${f1(x + 0.5)}" y="${y + 0.5}" width="${f1(w - 1)}" height="27" rx="13.5" stroke="${t.border}"/>` +
      `<text x="${f1(x + w / 2)}" y="${y + 18.5}" font-size="${size}" font-weight="500" text-anchor="middle" fill="${t.muted}">${esc(text)}</text>`,
  ];
}

export function bentoAbout(t) {
  const h = 330, aw = 604;
  const nx = aw + GAP, nw = W - aw - GAP;
  const body = [
    `<g class="rise" ${delay(0)}>`,
    cell(t, 0, 0, aw, h),
    heading(t, PAD, 46, "About", "person"),
    `<text x="${PAD}" y="94" font-size="24" font-weight="600" letter-spacing="-.3" fill="${t.fg}">I ship web products end to end,</text>`,
    `<text x="${PAD}" y="124" font-size="24" font-weight="600" letter-spacing="-.3" fill="${t.muted}">from first requirement to production.</text>`,
  ];
  ABOUT.forEach((line, i) => {
    body.push(`<text x="${PAD}" y="${164 + i * 23}" font-size="15" fill="${t.muted}">${esc(line)}</text>`);
  });

  // requirements → build → test → ship
  let x = PAD;
  const y = 230;
  METHOD.forEach((step, i) => {
    const [w, markup] = ghLabel(t, x, y, step);
    body.push(`<g class="rise" ${delay(i, 0.1, 0.4)}>${markup}</g>`);
    x += w;
    if (i < METHOD.length - 1) {
      body.push(icon("chevron-right", x + 4, y + 6, 16, t.faint));
      x += 24;
    }
  });

  body.push(
    `<line x1="${PAD}" y1="282" x2="${aw - PAD}" y2="282" stroke="${t.border}"/>`,
    icon("zap", PAD, 294, 16, t.muted),
    `<text x="${PAD + 24}" y="306" font-size="13" fill="${t.muted}"><tspan fill="${t.fg}" font-weight="600">Focus</tspan>  ${esc(FOCUS)}</text>`,
    "</g>"
  );

  body.push(
    `<g class="rise" ${delay(1)}>`,
    cell(t, nx, 0, nw, h),
    heading(t, nx + PAD, 46, "Experience", "briefcase"),
    sublabel(t, nx + nw - PAD, 46, "Jun 2025 – Jul 2026", "end"),
    `<text x="${nx + PAD}" y="92" font-size="21" font-weight="600" fill="${t.fg}">Software Developer</text>`,
    `<text x="${nx + PAD}" y="117" font-size="15" font-weight="600" fill="${t.fg}">Netparam Technologies <tspan fill="${t.muted}" font-weight="400">· Jaipur</tspan></text>`,
    `<line x1="${nx + PAD}" y1="140" x2="${nx + nw - PAD}" y2="140" stroke="${t.border}"/>`,
    sublabel(t, nx + PAD, 170, "Key wins")
  );
  WINS.forEach(([label, value], i) => {
    const wy = 196 + i * 25;
    body.push(
      `<text x="${nx + PAD}" y="${wy}" font-size="15" font-weight="600" fill="${t.fg}">${esc(label)}</text>`,
      `<text x="${nx + nw - PAD}" y="${wy}" font-size="13.5" text-anchor="end" fill="${t.muted}">${esc(value)}</text>`
    );
  });
  body.push(
    `<line x1="${nx + PAD}" y1="244" x2="${nx + nw - PAD}" y2="244" stroke="${t.border}"/>`,
    sublabel(t, nx + PAD, 274, "Education"),
    `<text x="${nx + PAD}" y="300" font-size="15" font-weight="600" fill="${t.fg}">B.Tech, Electrical Engg.</text>`,
    `<text x="${nx + nw - PAD}" y="300" font-size="13.5" text-anchor="end" fill="${t.muted}">JECRC · 2024</text>`,
    "</g>"
  );
  return svg(t, W, h, body.join("\n"));
}

// ── Row 2: Highlights + Projects ───────────────────────────────────────

const STATS = [
  ["zap", "75%", "Faster APIs", "1.8s → 450ms on MongoDB"],
  ["plug", "30+", "REST APIs shipped", "serving 500+ active users"],
];
const PROJECTS = [
  ["book", "StudyAdda", "LMS with an AI doubt solving tutor"],
  ["package", "Dealskart", "ecommerce · 100+ secure orders"],
  ["milestone", "QuickStay", "hotel booking · owner & admin portals"],
];

export function bentoHighlights(t) {
  const h = 236, sw = 232;
  const body = [];
  STATS.forEach(([ic, big, text, sub], i) => {
    const x = i * (sw + GAP);
    body.push(
      `<g class="rise" ${delay(i)}>`,
      cell(t, x, 0, sw, h),
      icon(ic, x + PAD, 32, 20, t.muted),
      `<text x="${x + PAD - 2}" y="138" font-size="60" font-weight="600" letter-spacing="-1.5" fill="${t.fg}">${big}</text>`,
      `<text x="${x + PAD}" y="178" font-size="15" font-weight="600" fill="${t.fg}">${esc(text)}</text>`,
      `<text x="${x + PAD}" y="200" font-size="13" fill="${t.muted}">${esc(sub)}</text>`,
      "</g>"
    );
  });

  const ox = 2 * (sw + GAP), ow = W - ox;
  body.push(
    `<g class="rise" ${delay(2)}>`,
    cell(t, ox, 0, ow, h),
    heading(t, ox + PAD, 46, "Projects", "rocket"),
    sublabel(t, ox + ow - PAD, 46, "Live and shipped", "end")
  );
  PROJECTS.forEach(([ic, title, sub], i) => {
    const y = 72 + i * 50;
    body.push(
      `<rect x="${ox + PAD + 0.5}" y="${y + 0.5}" width="37" height="37" rx="8" fill="${t.btn}" stroke="${t.border}"/>`,
      icon(ic, ox + PAD + 10, y + 10, 18, t.muted),
      `<text x="${ox + PAD + 54}" y="${y + 16}" font-size="15" font-weight="600" fill="${t.fg}">${esc(title)}</text>`,
      `<text x="${ox + PAD + 54}" y="${y + 34}" font-size="13" fill="${t.muted}">${esc(sub)}</text>`
    );
  });
  body.push("</g>");
  return svg(t, W, h, body.join("\n"));
}

// ── Toolbox: every resume skill, as GitHub topic tags ──────────────────

// [kind, glyph, name]: kind is "brand" (Simple Icons logo) or "icon" (Octicon, for concepts).
// To hide a skill, comment its line out; to bring it back, uncomment it.
const TOOLS = [
  ["Languages", [
    ["brand", "javascript", "JavaScript"],
    ["brand", "typescript", "TypeScript"],
    ["brand", "python", "Python"],
    ["icon", "database", "SQL"],
    ["brand", "cplusplus", "C++"],
  ]],
  ["Frontend", [
    ["brand", "react", "React"],
    ["brand", "nextdotjs", "Next.js"],
    ["brand", "redux", "Redux Toolkit"],
    ["brand", "tailwindcss", "Tailwind CSS"],
    ["brand", "mui", "Material UI"],
  ]],
  ["Backend", [
    ["brand", "nodedotjs", "Node.js"],
    ["brand", "express", "Express.js"],
    ["brand", "fastapi", "FastAPI"],
    ["icon", "plug", "REST APIs"],
    ["brand", "jsonwebtokens", "JWT"],
    ["icon", "list-ordered", "BullMQ"],
  ]],
  ["Databases", [
    ["brand", "mongodb", "MongoDB"],
    ["brand", "mysql", "MySQL"],
    ["brand", "postgresql", "PostgreSQL"],
    ["brand", "redis", "Redis"],
    ["brand", "qdrant", "Qdrant Vector DB"],
    // ["icon", "stopwatch", "Query Optimization"],
  ]],
  ["AI", [
    ["icon", "sparkle-fill", "LLMs"],
    ["icon", "search", "RAG"],
    ["icon", "plug", "AI APIs"],
    ["brand", "claude", "Claude"],
    ["brand", "openai", "ChatGPT"],
    ["brand", "googlegemini", "Gemini"],
  ]],
  ["Integrations", [
    ["brand", "razorpay", "Razorpay"],
    ["brand", "clerk", "Clerk"],
    ["brand", "cloudinary", "Cloudinary"],
  ]],
  ["Cloud & tools", [
    ["brand", "docker", "Docker"],
    ["brand", "amazonwebservices", "AWS"],
    ["brand", "vercel", "Vercel"],
    ["brand", "githubactions", "CI/CD"],
    ["brand", "git", "Git"],
    ["brand", "github", "GitHub"],
    ["brand", "postman", "Postman"],
    ["brand", "jira", "Jira"],
    ["brand", "figma", "Figma"],
    ["icon", "file-code", "VS Code"],
    ["icon", "rocket", "Antigravity"],
  ]],
  ["Core", [
    ["icon", "code", "DSA"],
    ["icon", "workflow", "System Design"],
    ["icon", "package", "Object-Oriented Programming"],
    ["icon", "database", "DBMS"],
    ["icon", "terminal", "Operating Systems"],
    ["icon", "globe", "Computer Networks"],
  ]],
];

const TAG_H = 32, TAG_GAP = 8, TAG_FS = 13;
const tagW = (name) => 36 + textW(name, TAG_FS, 500) * 1.06 + 16;

/** Neutral tag pill with a logo. */
function tag(t, x, y, kind, glyph, name) {
  const w = tagW(name);
  const mark =
    kind === "brand" ? brand(glyph, x + 11, y + 8, 16, brandColor(t, glyph)) : icon(glyph, x + 11, y + 8, 16, t.muted);
  return (
    `<rect x="${f1(x)}" y="${y}" width="${f1(w)}" height="${TAG_H}" rx="${TAG_H / 2}" fill="${t.tag_bg}" stroke="${t.border}"/>` +
    mark +
    `<text x="${f1(x + 33)}" y="${y + 21}" font-size="${TAG_FS}" font-weight="500" fill="${t.fg}">${esc(name)}</text>`
  );
}

export function toolbox(t) {
  const labelW = 150;
  const left = PAD + labelW, right = W - PAD;
  const body = [];
  let y = 80, n = 0;
  TOOLS.forEach(([group, items], g) => {
    if (g) {
      body.push(`<line x1="${PAD}" y1="${y - 12}" x2="${W - PAD}" y2="${y - 12}" stroke="${t.border}" stroke-opacity=".7"/>`);
    }
    body.push(sublabel(t, PAD, y + 21, group));
    let x = left;
    for (const [kind, glyph, name] of items) {
      const w = tagW(name);
      if (x + w > right) {
        x = left;
        y += TAG_H + TAG_GAP;
      }
      body.push(`<g class="rise" ${delay(n, 0.02, 0.15)}>${tag(t, x, y, kind, glyph, name)}</g>`);
      x += w + TAG_GAP;
      n++;
    }
    y += TAG_H + 24;
  });
  const h = y + 4;
  const header = [
    cell(t, 0, 0, W, h),
    heading(t, PAD, 46, "Toolbox", "tools"),
    sublabel(t, W - PAD, 46, "What I build with", "end"),
  ];
  return svg(t, W, h, [...header, ...body].join("\n"));
}

function main() {
  mkdirSync(OUT, { recursive: true });
  for (const old of readdirSync(OUT)) if (old.endsWith(".svg")) unlinkSync(OUT + old);
  for (const [key, spec] of Object.entries(BUTTONS)) {
    for (const [theme, tokens] of Object.entries(THEMES)) {
      writeFileSync(`${OUT}btn-${key}-${theme}.svg`, button(tokens, ...spec));
    }
  }
  console.log(`Wrote ${Object.keys(BUTTONS).length * Object.keys(THEMES).length} buttons to ${OUT}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
