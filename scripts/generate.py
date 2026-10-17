"""README sections (used by build.py) and the link buttons (written to ../assets).

Run: python3 scripts/generate.py   # rewrites the buttons; build.py renders the cards
"""

from pathlib import Path
from xml.sax.saxutils import escape

from theme import GAP, PAD, THEMES, W, brand, brand_color, cell, delay, graph_backdrop, heading, icon, sublabel, svg

OUT = Path(__file__).resolve().parent.parent / "assets"

# ── Banner ─────────────────────────────────────────────────────────────

PHRASES = [
    "Full Stack Engineer",
    "React · Next.js · Node.js",
    "Shipping products end to end",
    "Building AI powered features",
]


def typewriter(t, cx, y, size):
    """Centred type-and-delete loop over PHRASES, in SMIL so it runs inside <img>."""
    cw = size * 0.6
    type_s, hold_s, del_s, gap_s = 0.07, 1.9, 0.03, 0.3
    events, spans, now = [], [], 0.0  # events: (time, chars shown, phrase index)
    for i, p in enumerate(PHRASES):
        start = now
        for k in range(len(p) + 1):
            events.append((now, k, i))
            now += type_s if k < len(p) else hold_s
        for k in range(len(p) - 1, -1, -1):
            events.append((now, k, i))
            now += del_s
        now += gap_s
        spans.append((start, now))
    total = now
    kt = ";".join(f"{e[0] / total:.5f}" for e in events) + ";1"

    # Each phrase is centred, so its left edge depends on its own length.
    def left(i):
        return cx - len(PHRASES[i]) * cw / 2

    clip_x = ";".join(f"{left(i):.1f}" for _, _, i in events) + f";{left(0):.1f}"
    clip_w = ";".join(f"{k * cw:.1f}" for _, k, _ in events) + ";0"
    cursor_x = ";".join(f"{left(i) + k * cw + 3:.1f}" for _, k, i in events) + f";{left(0) + 3:.1f}"
    anim = f'dur="{total:.2f}s" repeatCount="indefinite" calcMode="discrete" keyTimes="{kt}"'

    out = [
        f'<clipPath id="type"><rect y="{y - size}" height="{size * 1.4}" x="{left(0):.1f}" width="0">'
        f'<animate attributeName="x" {anim} values="{clip_x}"/>'
        f'<animate attributeName="width" {anim} values="{clip_w}"/></rect></clipPath>',
        '<g clip-path="url(#type)">',
    ]
    for p, (start, end) in zip(PHRASES, spans):
        out.append(
            f'<text class="mono" x="{cx}" y="{y}" font-size="{size}" text-anchor="middle" fill="{t["muted"]}" '
            f'textLength="{len(p) * cw:.1f}" lengthAdjust="spacingAndGlyphs" opacity="0">{escape(p)}'
            f'<animate attributeName="opacity" dur="{total:.2f}s" repeatCount="indefinite" calcMode="discrete" '
            f'keyTimes="0;{start / total:.5f};{end / total:.5f};1" values="0;1;0;0"/></text>'
        )
    out.append("</g>")
    out.append(
        f'<rect class="cursor" y="{y - size * 0.82:.1f}" width="2.5" height="{size * 1.02:.1f}" rx="1" fill="{t["green"]}">'
        f'<animate attributeName="x" {anim} values="{cursor_x}"/></rect>'
    )
    return "\n".join(out)


def banner(t):
    h, cx = 260, W / 2
    css = ".cursor { animation: blink 1s step-end infinite; }"
    body = [
        graph_backdrop(t, W, h),
        f'<text class="rise" {delay(0)} x="{cx}" y="70" font-size="18" text-anchor="middle" fill="{t["muted"]}">Hi there, I\'m</text>',
        f'<text class="rise" {delay(1)} x="{cx}" y="134" font-size="64" font-weight="700" letter-spacing="-1.5" text-anchor="middle" fill="{t["fg"]}">Dinesh Suwalkya</text>',
        f'<g class="rise" {delay(2)}>{typewriter(t, cx, 182, 20)}</g>',
        f'<g class="rise" {delay(3)} font-size="14" fill="{t["muted"]}">',
        icon("location", cx - 58, 208, 16, t["muted"]),
        f'<text x="{cx - 36}" y="221">Jaipur, India</text>',
        "</g>",
    ]
    return svg(t, W, h, "\n".join(body), css)


# ── Link buttons (GitHub .btn) ─────────────────────────────────────────

BUTTONS = {
    "portfolio": ("icon", "globe", "Portfolio"),
    "linkedin": ("brand", "linkedin", "LinkedIn"),
    "email": ("icon", "mail", "Email"),
}


def button(t, kind, glyph, text):
    h = 40
    w = round(44 + text_w(text, 14, 600) + 18)
    mark = icon(glyph, 16, 12, 16, t["muted"]) if kind == "icon" else brand(glyph, 16, 12, 16, t["fg"])
    body = (
        f'<rect x=".5" y=".5" width="{w - 1}" height="{h - 1}" rx="8" fill="{t["btn"]}" stroke="{t["border"]}"/>'
        + mark
        + f'<text x="42" y="25" font-size="14" font-weight="600" fill="{t["fg"]}">{escape(text)}</text>'
    )
    return svg(t, w, h, body)


# ── Row 1: About + Now ─────────────────────────────────────────────────

ABOUT = [
    "Full Stack Engineer working across React, Next.js and Node.js.",
    "I take features from early requirements through testing and",
    "CI/CD to production support, with AI built into the product.",
]
METHOD = ["requirements", "build", "test", "ship"]
FOCUS = "React interfaces · Node.js APIs · LLM features in production"

WINS = [("API response time", "1.8s → 450ms"), ("Reusable components", "15+")]


def text_w(text, size, weight=400):
    """Rough proportional-font width, good enough for laying out pills."""
    narrow = sum(text.count(c) for c in "iljtfrI.,·(/ ")
    wide = sum(text.count(c) for c in "MWmw")
    avg = 0.6 if weight >= 600 else 0.56
    return ((len(text) - narrow - wide) * avg + narrow * 0.3 + wide * 0.85) * size


def gh_label(t, x, y, text, size=12.5):
    """Primer Label: neutral outlined pill."""
    w = text_w(text, size, 500) + 22
    return w, (
        f'<rect x="{x + .5:.1f}" y="{y + .5}" width="{w - 1:.1f}" height="27" rx="13.5" stroke="{t["border"]}"/>'
        f'<text x="{x + w / 2:.1f}" y="{y + 18.5}" font-size="{size}" font-weight="500" text-anchor="middle" fill="{t["muted"]}">{text}</text>'
    )


def bento_about(t):
    h = 330
    aw = 604
    nx, nw = aw + GAP, W - aw - GAP
    body = [
        f'<g class="rise" {delay(0)}>',
        cell(t, 0, 0, aw, h),
        heading(t, PAD, 46, "About", "person"),
        f'<text x="{PAD}" y="94" font-size="24" font-weight="600" letter-spacing="-.3" fill="{t["fg"]}">I ship web products end to end,</text>',
        f'<text x="{PAD}" y="124" font-size="24" font-weight="600" letter-spacing="-.3" fill="{t["muted"]}">from first requirement to production.</text>',
    ]
    for i, line in enumerate(ABOUT):
        body.append(f'<text x="{PAD}" y="{164 + i * 23}" font-size="15" fill="{t["muted"]}">{escape(line)}</text>')

    # observe → question → experiment → refine
    x, y = PAD, 230
    for i, step in enumerate(METHOD):
        w, markup = gh_label(t, x, y, step)
        body.append(f'<g class="rise" {delay(i, 0.1, 0.4)}>{markup}</g>')
        x += w
        if i < len(METHOD) - 1:
            body.append(icon("chevron-right", x + 4, y + 6, 16, t["faint"]))
            x += 24

    body += [
        f'<line x1="{PAD}" y1="282" x2="{aw - PAD}" y2="282" stroke="{t["border"]}"/>',
        icon("zap", PAD, 294, 16, t["muted"]),
        f'<text x="{PAD + 24}" y="306" font-size="13" fill="{t["muted"]}"><tspan fill="{t["fg"]}" font-weight="600">Focus</tspan>  {escape(FOCUS)}</text>',
        "</g>",
    ]

    body += [
        f'<g class="rise" {delay(1)}>',
        cell(t, nx, 0, nw, h),
        heading(t, nx + PAD, 46, "Experience", "briefcase"),
        sublabel(t, nx + nw - PAD, 46, "Jun 2025 – Jul 2026", "end"),
        f'<text x="{nx + PAD}" y="92" font-size="21" font-weight="600" fill="{t["fg"]}">Software Developer</text>',
        f'<text x="{nx + PAD}" y="117" font-size="15" font-weight="600" fill="{t["fg"]}">Netparam Technologies <tspan fill="{t["muted"]}" font-weight="400">· Jaipur</tspan></text>',
        f'<line x1="{nx + PAD}" y1="140" x2="{nx + nw - PAD}" y2="140" stroke="{t["border"]}"/>',
        sublabel(t, nx + PAD, 170, "Key wins"),
    ]
    for i, (org, role) in enumerate(WINS):
        y = 196 + i * 25
        body += [
            f'<text x="{nx + PAD}" y="{y}" font-size="15" font-weight="600" fill="{t["fg"]}">{escape(org)}</text>',
            f'<text x="{nx + nw - PAD}" y="{y}" font-size="13.5" text-anchor="end" fill="{t["muted"]}">{escape(role)}</text>',
        ]
    body += [
        f'<line x1="{nx + PAD}" y1="244" x2="{nx + nw - PAD}" y2="244" stroke="{t["border"]}"/>',
        sublabel(t, nx + PAD, 274, "Education"),
        f'<text x="{nx + PAD}" y="300" font-size="15" font-weight="600" fill="{t["fg"]}">B.Tech, Electrical Engg.</text>',
        f'<text x="{nx + nw - PAD}" y="300" font-size="13.5" text-anchor="end" fill="{t["muted"]}">JECRC · 2024</text>',
        "</g>",
    ]
    return svg(t, W, h, "\n".join(body))


# ── Row 2: Highlights + Projects ───────────────────────────────────────

STATS = [("zap", "75%", "Faster APIs", "1.8s → 450ms on MongoDB"), ("plug", "30+", "REST APIs shipped", "serving 500+ active users")]
OFFSCREEN = [
    ("book", "StudyAdda", "LMS with an AI doubt solving tutor"),
    ("package", "Dealskart", "ecommerce · 100+ secure orders"),
    ("milestone", "QuickStay", "hotel booking · owner & admin portals"),
]


def bento_highlights(t):
    h = 236
    sw = 232
    body = []
    for i, (ic, big, text, sub) in enumerate(STATS):
        x = i * (sw + GAP)
        body += [
            f'<g class="rise" {delay(i)}>',
            cell(t, x, 0, sw, h),
            icon(ic, x + PAD, 32, 20, t["muted"]),
            f'<text x="{x + PAD - 2}" y="138" font-size="60" font-weight="600" letter-spacing="-1.5" fill="{t["fg"]}">{big}</text>',
            f'<text x="{x + PAD}" y="178" font-size="15" font-weight="600" fill="{t["fg"]}">{escape(text)}</text>',
            f'<text x="{x + PAD}" y="200" font-size="13" fill="{t["muted"]}">{escape(sub)}</text>',
            "</g>",
        ]

    ox = 2 * (sw + GAP)
    ow = W - ox
    body += [
        f'<g class="rise" {delay(2)}>',
        cell(t, ox, 0, ow, h),
        heading(t, ox + PAD, 46, "Projects", "rocket"),
        sublabel(t, ox + ow - PAD, 46, "Live and shipped", "end"),
    ]
    for i, (ic, title, sub) in enumerate(OFFSCREEN):
        y = 72 + i * 50
        body += [
            f'<rect x="{ox + PAD + .5}" y="{y + .5}" width="37" height="37" rx="8" fill="{t["btn"]}" stroke="{t["border"]}"/>',
            icon(ic, ox + PAD + 10, y + 10, 18, t["muted"]),
            f'<text x="{ox + PAD + 54}" y="{y + 16}" font-size="15" font-weight="600" fill="{t["fg"]}">{title}</text>',
            f'<text x="{ox + PAD + 54}" y="{y + 34}" font-size="13" fill="{t["muted"]}">{escape(sub)}</text>',
        ]
    body.append("</g>")
    return svg(t, W, h, "\n".join(body))


# ── Toolbox: every resume skill, as GitHub topic tags ──────────────────

# (kind, glyph, name): kind is "brand" (Simple Icons) or "icon" (Lucide, for concepts).
TOOLS = [
    ("Languages", [
        ("brand", "javascript", "JavaScript"), ("brand", "typescript", "TypeScript"), ("brand", "python", "Python"), ("icon", "database", "SQL"),
        ("brand", "html5", "HTML5"), ("brand", "css3", "CSS3"), ("brand", "cplusplus", "C++"),
    ]),
    ("Frontend", [
        ("brand", "react", "React"), ("brand", "nextdotjs", "Next.js"), ("brand", "redux", "Redux Toolkit"),
        ("brand", "tailwindcss", "Tailwind CSS"), ("brand", "mui", "Material UI"), 
    ]),
    ("Backend", [
        ("brand", "nodedotjs", "Node.js"), ("brand", "express", "Express.js"), ("brand", "fastapi", "FastAPI"), ("icon", "plug", "REST APIs"),
        ("brand", "jsonwebtokens", "JWT"), ("icon", "list-ordered", "BullMQ"),
        # ("brand", "cloudinary", "Cloudinary"), 
        # ("brand", "clerk", "Clerk"),
        # ("brand", "razorpay", "Razorpay"), 
    ]),
    ("Databases", [
        ("brand", "mongodb", "MongoDB"), ("brand", "mysql", "MySQL"), ("brand", "postgresql", "PostgreSQL"), ("brand", "redis", "Redis"),
        ("brand", "qdrant", "Qdrant Vector DB"), 
        # ("icon", "stopwatch", "Query Optimization"),
    ]),
    ("AI", [
        ("icon", "sparkle-fill", "LLMs"), ("icon", "search", "RAG"), ("icon", "plug", "AI APIs"),
        ("brand", "claude", "Claude"), ("brand", "openai", "ChatGPT"), ("brand", "googlegemini", "Gemini"),
    ]),
    ("Cloud & tools", [
        ("brand", "docker", "Docker"), ("brand", "amazonwebservices", "AWS"), ("brand", "vercel", "Vercel"),
        ("brand", "githubactions", "CI/CD"), ("brand", "git", "Git"), ("brand", "github", "GitHub"),
        ("brand", "postman", "Postman"), ("brand", "jira", "Jira"), ("brand", "figma", "Figma"), ("icon", "file-code", "VS Code"), ("icon", "rocket", "Antigravity"),
    ]),
    ("Core", [
        ("icon", "code", "DSA"), ("icon", "workflow", "System Design"), ("icon", "package", "Object-Oriented Programming"),
        ("icon", "database", "DBMS"), ("icon", "terminal", "Operating Systems"), ("icon", "globe", "Computer Networks"),
    ]),
]

TAG_H, TAG_GAP, TAG_FS = 32, 8, 13


def tag(t, x, y, kind, glyph, name):
    """Neutral tag pill with a muted logo."""
    w = 36 + text_w(name, TAG_FS, 500) + 14
    mark = brand(glyph, x + 11, y + 8, 16, brand_color(t, glyph)) if kind == "brand" else icon(glyph, x + 11, y + 8, 16, t["muted"])
    return w, (
        f'<rect x="{x:.1f}" y="{y}" width="{w:.1f}" height="{TAG_H}" rx="{TAG_H / 2}" fill="{t["tag_bg"]}" stroke="{t["border"]}"/>' + mark +
        f'<text x="{x + 33:.1f}" y="{y + 21}" font-size="{TAG_FS}" font-weight="500" fill="{t["fg"]}">{escape(name)}</text>'
    )


def toolbox(t):
    label_w = 150
    left, right = PAD + label_w, W - PAD
    body, y, n = [], 80, 0
    for g, (group, items) in enumerate(TOOLS):
        if g:
            body.append(f'<line x1="{PAD}" y1="{y - 12}" x2="{W - PAD}" y2="{y - 12}" stroke="{t["border"]}" stroke-opacity=".7"/>')
        body.append(sublabel(t, PAD, y + 21, group))
        x = left
        for kind, glyph, name in items:
            w = 36 + text_w(name, TAG_FS, 500) + 14
            if x + w > right:
                x, y = left, y + TAG_H + TAG_GAP
            _, markup = tag(t, x, y, kind, glyph, name)
            body.append(f'<g class="rise" {delay(n, 0.02, 0.15)}>{markup}</g>')
            x += w + TAG_GAP
            n += 1
        y += TAG_H + 24
    h = y + 4
    header = [
        cell(t, 0, 0, W, h),
        heading(t, PAD, 46, "Toolbox", "tools"),
        sublabel(t, W - PAD, 46, "What I build with", "end"),
    ]
    return svg(t, W, h, "\n".join(header + body))


def main():
    OUT.mkdir(exist_ok=True)
    for old in OUT.glob("*.svg"):
        old.unlink()
    for key, spec in BUTTONS.items():
        for theme, tokens in THEMES.items():
            (OUT / f"btn-{key}-{theme}.svg").write_text(button(tokens, *spec))
    print(f"Wrote {len(BUTTONS) * len(THEMES)} buttons to {OUT}")


if __name__ == "__main__":
    main()
