// Compose the whole profile into one SVG per theme, so every gap between cards is identical.
//
// Separate <img>s can't do this: GitHub puts a fixed CSS gap between images, while gaps
// drawn inside an image scale with the page width, so the two never match.
//
// In CI:   GITHUB_TOKEN=... node scripts/build.js --user Suwalkya-ji --out dist
// Locally: node scripts/build.js --calendar days.json --out preview
//          (days.json is a list of {"date": "YYYY-MM-DD", "count": N})

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";

import { card, fetchCalendar, summarize } from "./activity.js";
import { banner, bentoAbout, bentoHighlights, toolbox } from "./generate.js";
import { BASE_CSS, GAP, THEMES, W } from "./theme.js";

// Space left under the last card. GitHub adds only a ~6px inline gap between this image
// and the link buttons, so this tops it up to match the card gutter.
const BOTTOM = 16;

/** Split one of our generated SVGs into [height, extra css, defs, body]. */
function parts(markup) {
  const height = parseFloat(markup.match(/<svg[^>]* height="([\d.]+)"/)[1]);
  const css = markup.match(/<style>([\s\S]*?)<\/style>/)[1].replace(BASE_CSS, "");
  const defs = markup.match(/<defs>([\s\S]*?)<\/defs>/)[1];
  const body = markup.match(/<\/defs>\n([\s\S]*)\n<\/svg>/)[1];
  return [height, css, defs, body];
}

function compose(t, stats) {
  const sections = [banner(t), bentoAbout(t), bentoHighlights(t), toolbox(t), card(t, stats)];
  let y = 0;
  const css = [], defs = [], bodies = [];
  for (const markup of sections) {
    const [h, extraCss, extraDefs, body] = parts(markup);
    css.push(extraCss);
    defs.push(extraDefs);
    bodies.push(`<g transform="translate(0 ${y.toFixed(1)})">\n${body}\n</g>`);
    y += h + GAP;
  }
  const height = Math.round(y - GAP + BOTTOM);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${height}" ` +
    `viewBox="0 0 ${W} ${height}" fill="none">\n` +
    `<style>${BASE_CSS}${css.join("")}</style>\n<defs>${defs.join("")}</defs>\n` +
    bodies.join("\n") +
    "\n</svg>\n"
  );
}

async function main() {
  const { values: args } = parseArgs({
    options: {
      user: { type: "string", default: "Suwalkya-ji" },
      calendar: { type: "string" },
      out: { type: "string", default: "dist" },
    },
  });

  let days;
  if (args.calendar) {
    days = JSON.parse(readFileSync(args.calendar, "utf8"));
  } else {
    const token = process.env.GITHUB_TOKEN;
    if (!token) throw new Error("Set GITHUB_TOKEN or pass --calendar");
    days = await fetchCalendar(args.user, token);
  }

  const stats = summarize(days);
  mkdirSync(args.out, { recursive: true });
  for (const [theme, tokens] of Object.entries(THEMES)) {
    writeFileSync(join(args.out, `profile-${theme}.svg`), compose(tokens, stats));
  }
  console.log(`total=${stats.total} current=${stats.current} longest=${stats.longest} -> ${args.out}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
