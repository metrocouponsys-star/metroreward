# Stamp — Marketing Site Design Notes

## Concept: The Counter

The visual language borrows from the shopkeeper's world: cashbooks with ruled lines,
rubber stamps that leave imperfect ink marks, perforated tickets that tear along dotted
edges. Every device is used sparingly — abundance kills the effect.

---

## Three Hand-Made SVG Devices

### 1. Ink Marks (max 3 on the whole site)

Hand-drawn SVG paths that look like ballpoint or felt-tip marks:

- **Scribble underline**: under one word in the hero headline ("paper").
  A wobbly path with 2–3 slight waves, stroke-dasharray animated on viewport entry.
- **Loose circle**: around one number or short phrase (e.g. "30 seconds" in the
  security section). Imperfect ellipse, slightly open on one side.
- **Tick mark**: beside completed steps or the final CTA. A single check stroke
  drawn on with 300 ms delay.

Implementation: each is an `<svg>` with a single `<path>`, animated via
`stroke-dashoffset` on intersection. Reduced-motion: show the mark immediately,
no animation.

### 2. Perforated Tickets (max 4 tilted items on a page)

Cards with a dashed-line edge on one side (left or top), simulating a tear line.
Created with CSS `border-image` using a repeating linear gradient of dots, or
an inline SVG `<pattern>`. Tilt between −1.5° and 1.5° using `transform: rotate()`.

Used for: hero ticket mockup, benefit lead card, scratch demo card, pricing card.

### 3. Stamp Impressions (max 4 across the whole site)

Round or rectangular SVG marks that look like rubber stamp imprints:
- Slightly uneven edges (hand-drawn SVG path, not a perfect circle).
- Ink bleed effect via SVG `<feTurbulence>` + `<feDisplacementMap>` filter.
- Semi-transparent (opacity 0.85) with the stamp violet colour.
- Appear with a scale+rotate animation (1.35→1, −8°→−2°, 450 ms ease-out).

Used at: hero ticket (one stamp), "how it works" completion, final CTA band,
about page principles section.

---

## Section Dividers

Thin ruled lines (1 px hairline colour #D9DBD5) spanning the full content width,
with a small IBM Plex Mono label at the left edge in ink-muted:
`—— how it works`, `—— benefits`, etc.

---

## Home Page Layout Sketches

```
┌─────────────────────────────────────────────────────────────┐
│ HEADER  [logo]            Home  About  Contact    [CTA btn] │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│ transparent → solid after 24px scroll                        │
│ 2px violet progress line at very top                         │
└─────────────────────────────────────────────────────────────┘

§1 HERO (split layout, NOT centered)
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Paper stamp cards,              ┌──────────────┐           │
│  without the ~~~~~~              │  ┌─ ─ ─ ─ ┐  │           │
│         paper.                   │  │ TICKET  │  │ 4:5      │
│                                  │  │ MOCKUP  │  │ image    │
│  Customers scan a QR at your     │  │  ○ ◉ ○  │  │ slot     │
│  counter, collect stamps...      │  │  ○ ○ ○  │  │          │
│                                  │  └─ ─ ─ ─ ┘  │ overlaps  │
│  [Start a free pilot] [See how]  └──────────────┘           │
│                                                             │
│  ✓ No app to download                                       │
│  ✓ Works on any phone                                       │
│  ✓ Nothing to buy for your counter                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘

§2 PROBLEM STATEMENT (scroll-reveal)
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  "Paper cards get lost, get stamped by anyone,              │
│   and tell you nothing about the people who walk in."       │
│                                                             │
│  (words fade from 25% → 100% opacity as you scroll)        │
│                                                             │
└─────────────────────────────────────────────────────────────┘

── how it works ──────────────────────────────────────────────

§3 HOW IT WORKS (pinned story, desktop)
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌────────────┐     Step 1 (active)                         │
│  │            │     You show the QR at your counter.        │
│  │   PHONE    │     ✓ ─────────────────────── (progress)    │
│  │   MOCKUP   │                                             │
│  │            │     Step 2                                   │
│  │  (sticky)  │     A customer scans it with their phone    │
│  │            │     camera and signs in...                   │
│  │            │     ○ ───────────────────────                │
│  └────────────┘                                             │
│                     Step 3 ... Step 4 ... Step 5             │
│                                                             │
└─────────────────────────────────────────────────────────────┘

── benefits ──────────────────────────────────────────────────

§4 BENEFITS (uneven grid, NOT three-equal-cards)
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌──────────────────────┐  ┌───────────┐                    │
│  │                      │  │ Benefit 2 │                    │
│  │   LEAD BENEFIT       │  │ (smaller) │                    │
│  │   (large card,       │  ├───────────┤                    │
│  │    3:2 image,        │  │ Benefit 3 │                    │
│  │    tilted −1°)       │  │ (smaller) │                    │
│  │                      │  └───────────┘                    │
│  └──────────────────────┘                                   │
│                                                             │
│  ┌───────────┐ ┌───────────┐ ┌────────────────┐            │
│  │ Benefit 4 │ │ Benefit 5 │ │ Benefit 6      │            │
│  └───────────┘ └───────────┘ └────────────────┘            │
│                                                             │
│  ┌────────────────┐ ┌───────────┐                           │
│  │ Benefit 7      │ │ Benefit 8 │                           │
│  └────────────────┘ └───────────┘                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘

── try it ────────────────────────────────────────────────────

§5 SCRATCH DEMO
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Surprise rewards make                                      │
│  a stamp card feel like a game.                             │
│                                                             │
│  ┌── ── ── ── ── ── ── ──┐                                  │
│  │  ┌──────────────────┐ │  ← perforated edge               │
│  │  │ ░░░ SCRATCH ░░░  │ │                                  │
│  │  │ ░░░  HERE   ░░░  │ │  (canvas, finger-path hint)      │
│  │  │ ░░░░░░░░░░░░░░░  │ │                                  │
│  │  └──────────────────┘ │                                  │
│  │  [Reveal]             │  ← keyboard/reduced-motion        │
│  └── ── ── ── ── ── ── ──┘                                  │
│  Demo only                                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘

§6 FOR YOUR CUSTOMERS
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌────────────┐   · Nothing to download                     │
│  │   PHONE    │   · One scan per visit                      │
│  │   9:19.5   │   · See your progress                       │
│  │            │   · Scratch for a surprise                   │
│  └────────────┘   · A nudge when your reward is ready        │
│                   · Your history, always                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘

── security ──────────────────────────────────────────────────

§7 FAIR AND SECURE (QR demo)
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  · Rotating QR              ┌──────────┐                    │
│  · Cooldown between stamps  │  QR CODE │ ← regenerates      │
│  · Optional approval        │  (demo)  │    every 5s         │
│  · Void with a reason       │          │                     │
│  · Shop sees only its own   └──────────┘                    │
│    customers                ───────────── countdown          │
│                             "Demo, sped up..."               │
│                                                             │
└─────────────────────────────────────────────────────────────┘

§8 DASHBOARD PREVIEW (ledger style)
┌─────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────┐    │
│  │ TIME        EVENT           CUSTOMER     STATUS     │    │
│  │ ─────────── ─────────────── ──────────── ───────    │    │
│  │ 2:41 pm     stamp collected  Priya M.    ✓         │    │
│  │ 2:38 pm     scratch card     Rahul K.    won ₹50   │    │
│  │ 2:30 pm     reward claimed   Anita S.    confirmed │    │
│  │ ...rows appear one at a time...                     │    │
│  └─────────────────────────────────────────────────────┘    │
│  Sample data                                                │
└─────────────────────────────────────────────────────────────┘

§9 WHO IT IS FOR
┌─────────────────────────────────────────────────────────────┐
│  Chai stalls · Cafés · Bakeries · Salons · Gyms ·          │
│  Restaurants · Small retail                                 │
│                                                             │
│  ┌──────┐  ┌──────┐  ┌──────┐                               │
│  │ 4:3  │  │ 4:3  │  │ 4:3  │ ← three shop images           │
│  └──────┘  └──────┘  └──────┘                               │
└─────────────────────────────────────────────────────────────┘

§10 START WITH A FREE PILOT
┌─────────────────────────────────────────────────────────────┐
│  1. Talk to us                                              │
│  2. We set up your QR and program                           │
│  3. Go live and watch the ledger fill                        │
│                                                             │
│  (pricing cards only if site.ts pricing.visible = true)      │
│  Otherwise: "Tell us about your shop..."                     │
└─────────────────────────────────────────────────────────────┘

§11 ON THE WAY (small, muted)
┌─────────────────────────────────────────────────────────────┐
│  On the way                                                  │
│  · Wallet cards  · Referrals  · Spend-based  · Multi-branch │
└─────────────────────────────────────────────────────────────┘

§12 FAQ (native <details>)
┌─────────────────────────────────────────────────────────────┐
│  ▸ Do my customers need an app?                              │
│  ▸ What do customers share?                                  │
│  ▸ Can customers cheat by scanning from home?                │
│  ▸ Do I need any equipment?                                  │
│  ... (12 items)                                              │
└─────────────────────────────────────────────────────────────┘

§13 FINAL CTA (full-bleed violet)
┌─────────────────────────────────────────────────────────────┐
│ ████████████████████████████████████████████████████████████ │
│ █                                                         █ │
│ █  Give your regulars a reason to come back.              █ │
│ █                                                         █ │
│ █  [WhatsApp us]   [Start a free pilot]                   █ │
│ █                          ◉ ← stamp impression            █ │
│ █                                                         █ │
│ ████████████████████████████████████████████████████████████ │
└─────────────────────────────────────────────────────────────┘

§14 FOOTER
┌─────────────────────────────────────────────────────────────┐
│  Stamp                                                       │
│  Home · About · Contact                                      │
│  Privacy · Terms · Refund policy                             │
│  [[FILL: legal entity]] · [[FILL: address]]                  │
│  © 2026                                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Colour Tokens

| Token          | Hex       | Use                          |
|----------------|-----------|------------------------------|
| page           | #F2F3F0   | body background              |
| surface        | #FFFFFF   | cards, inputs                |
| ink            | #101820   | headings, body text          |
| ink-muted      | #5B6470   | captions, labels             |
| violet         | #4B2E9A   | primary actions, stamp       |
| violet-tint    | #E9E4F5   | light violet background      |
| gold           | #B8962E   | scratch foil only            |
| success        | #1F8A5B   | confirmations                |
| alert          | #C8372D   | errors                       |
| hairline       | #D9DBD5   | borders, rules               |

## Typography

| Role     | Font              | Size         | Weight | Notes                       |
|----------|-------------------|------------- |--------|-----------------------------|
| Display  | Familjen Grotesk  | clamp 44–120 | 700    | tight tracking, sentence    |
| Body     | Figtree           | 17–18 px     | 400    | 62–68 ch line length        |
| Mono     | IBM Plex Mono     | 13–14 px     | 400    | captions, labels, serials   |
| Hand     | Caveat (optional) | 18–22 px     | 400    | max 6 margin notes sitewide |

