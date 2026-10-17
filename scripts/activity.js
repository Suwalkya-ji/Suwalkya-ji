// Contribution data and the contributions card; composed into the profile by build.js.

import { GAP, W, cell, delay, f1, icon, svg } from "./theme.js";

const QUERY = `
query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar { weeks { contributionDays { date contributionCount } } }
    }
  }
}
`;

export async function fetchCalendar(user, token) {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: QUERY, variables: { login: user } }),
    signal: AbortSignal.timeout(30_000),
  });
  const payload = await res.json();
  if (payload.errors) throw new Error(`GitHub API error: ${JSON.stringify(payload.errors)}`);
  const weeks = payload.data.user.contributionsCollection.contributionCalendar.weeks;
  return weeks.flatMap((w) => w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount })));
}

export function summarize(days) {
  days = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const counts = days.map((d) => d.count);

  let longest = 0, run = 0;
  for (const c of counts) {
    run = c ? run + 1 : 0;
    longest = Math.max(longest, run);
  }

  // Today may still be in progress, so a zero today doesn't break the streak.
  const tail = counts.length && counts.at(-1) === 0 ? counts.slice(0, -1) : counts;
  let current = 0;
  for (let i = tail.length - 1; i >= 0 && tail[i]; i--) current++;

  return {
    days,
    total: counts.reduce((a, b) => a + b, 0),
    current,
    longest,
    best: Math.max(0, ...counts),
    active: counts.filter(Boolean).length,
    updated: days.at(-1)?.date,
  };
}

const plural = (n, word) => (n === 1 ? `${n} ${word}` : `${n} ${word}s`);

/** Four stat tiles. The contribution graph itself is left to GitHub, which shows it below the README. */
export function card(t, s) {
  const tiles = [
    ["git-commit", s.total.toLocaleString("en-US"), "Contributions, past year"],
    ["flame", plural(s.current, "day"), "Current streak"],
    ["trophy", plural(s.longest, "day"), "Longest streak"],
    ["calendar", String(s.active), "Active days"],
  ];
  const tileH = 92;
  const tileW = (W - GAP * 3) / 4;

  const body = [];
  tiles.forEach(([ic, value, text], i) => {
    const x = i * (tileW + GAP);
    body.push(
      `<g class="rise" ${delay(i, 0.08)}>`,
      cell(t, x, 0, tileW, tileH),
      `<text x="${f1(x + 24)}" y="44" font-size="22" font-weight="600" fill="${t.fg}">${value}</text>`,
      `<text x="${f1(x + 24)}" y="67" font-size="13" fill="${t.muted}">${text}</text>`,
      icon(ic, x + tileW - 24 - 16, 24, 16, t.muted),
      "</g>"
    );
  });
  return svg(t, W, tileH, body.join("\n"));
}
