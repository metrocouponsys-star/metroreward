# Stamp — System Design Notes & Layout Architecture

**Version:** 3.0  
**Design Philosophy:** Hand-finished, tactile, vernacular Indian local commerce platform.  
**Theme:** Crisp Light Theme throughout (including Super Admin control tower, Merchant Khata cashbook, and Customer paper ticket).  
**Metaphors:**
- **Customer:** Paper ticket, perforated stub, rubber stamp ink impression with speckle mask, metallic foil scratch card with gold crimp.
- **Merchant:** Traditional Indian *Khata* (bahi-khata cashbook), ruled 1px lines, faint red left margin line (8% opacity), 5-bar gate tally marks, one dominant primary action per screen.
- **Super Admin:** Interactive platform control tower with real-time Hierarchy Map (Super Admin → Merchants → Customer clusters), audit-logged impersonation with diagonal hazard tape, dense tabular data.

---

## 1. Role Hierarchy & Data Isolation Model

```
┌────────────────────────────────────────────────────────┐
│                      SUPER ADMIN                       │
│    (Universal Platform Governance & Control Tower)     │
└───────────────────────────┬────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
  ┌───────────────────┐           ┌───────────────────┐
  │    MERCHANT A     │           │    MERCHANT B     │
  │ (e.g. Chai Point) │           │ (e.g. Cuts Salon) │
  ├───────────────────┤           ├───────────────────┤
  │ • Own Counter QR  │           │ • Own Counter QR  │
  │ • Own Program     │           │ • Own Program     │
  │ • Own Scratch     │           │ • Own Scratch     │
  │ • Own Khata Book  │           │ • Own Khata Book  │
  └─────────┬─────────┘           └─────────┬─────────┘
            │                               │
     ┌──────┴──────┐                 ┌──────┴──────┐
     ▼             ▼                 ▼             ▼
 Customer 1    Customer 2        Customer 3    Customer 4
 (Chai Point   (Chai Point       (Cuts Salon   (Cuts Salon
  Card only)    Card only)        Card only)    Card only)
```

**Non-Negotiable Isolation Rules:**
1. A customer belongs strictly to **one** merchant. Phone numbers are unique on `(merchant_id, phone)`.
2. Customer 1 visiting Merchant B has a completely distinct card, ledger, and session cookie (`cs_cutssalon`). No cross-merchant join or wallet leakage is permitted.
3. Super Admin impersonation requires an explicit audit reason, expires after 30 minutes, displays an unmistakable persistent diagonal-striped tape across every screen, and records `impersonated_by` in `audit_log`.

---

## 2. Page Concepts & ASCII Layout Sketches

### C1 — Customer: Scan Landing (`/m/:slug?t=:token`)
**Concept:** A breathless 1.5-second counter moment. The camera scans, brackets lock in, and ink stamps the ticket.

```
┌──────────────────────────────────────────────────────┐
│  [Logo Mark: Seal]                      [Language ▾] │
├──────────────────────────────────────────────────────┤
│                                                      │
│              K H A N A   K H A Z A N A               │
│                                                      │
│            ┌────────────────────────────┐            │
│            │ ┌──                    ──┐ │            │
│            │      [Breathing Brackets]  │            │
│            │            [QR]            │            │
│            │ └──                    ──┘ │            │
│            └────────────────────────────┘            │
│                                                      │
│             Verifying your counter visit...          │
│            ════════════════════════════════          │
│             [Countdown Line / Progress]              │
│                                                      │
│  [Vignette: Sleeping Seal if cooldown active]        │
│  "Next stamp available at 4:30 PM at this counter"   │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

### C2 — Customer: Sign In (`/m/:slug/login`)
**Concept:** Lightweight vernacular bottom-sheet OTP authentication scoped strictly to this merchant.

```
┌──────────────────────────────────────────────────────┐
│  [Merchant Branding: Banner + Colors]                │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │ ━━━ [Sheet Pull Handle]                        │  │
│  │                                                │  │
│  │ Welcome to Chai Point Loyalty                  │  │
│  │ Enter your phone number to collect stamps      │  │
│  │                                                │  │
│  │ ┌────────────────────────────────────────────┐ │  │
│  │ │ +91  |  9 8 7 6 5   4 3 2 1 0              │ │  │
│  │ └────────────────────────────────────────────┘ │  │
│  │                                                │  │
│  │  [OTP Input: 6 separate boxed digits with pop] │  │
│  │  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐           │  │
│  │  │ 4 │ │ 2 │ │ 8 │ │   │ │   │ │   │           │  │
│  │  └───┘ └───┘ └───┘ └───┘ └───┘ └───┘           │  │
│  │                                                │  │
│  │  Resend code in (54s) ↺ [Drain Ring]           │  │
│  │                                                │  │
│  │  ☑ I agree to store my visit history for       │  │
│  │    rewards at Chai Point. Privacy Policy       │  │
│  │                                                │  │
│  │  [ VERIFY & OPEN MY CARD ] (10px radius)       │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

---

### C3 — Customer: Stamp Success (`/m/:slug/stamp-success`)
**Concept:** Physical punch-card celebration. M01 stamp lands with ink rotation and audio-haptic feedback.

```
┌──────────────────────────────────────────────────────┐
│  [Top Bar: Merchant Name]               [My QR 📱]   │
├──────────────────────────────────────────────────────┤
│                                                      │
│   ┌──────────────────────────────────────────────┐   │
│   │  CHAI POINT • OFFICIAL TICKET    #CP-98124   │   │
│   │ ════════════════════════════════════════════ │   │
│   │                                              │   │
│   │   (★)      (★)      (★)      (★)      (★)    │   │
│   │  Slot 1   Slot 2   Slot 3   Slot 4   Slot 5  │   │
│   │                                              │   │
│   │   [★]     ( )      ( )      ( )      ( )     │   │
│   │  Slot 6   Slot 7   Slot 8   Slot 9   Slot 10 │   │
│   │  [NEW STAMP LANDS HERE - M01 OVER-ROTATION]  │   │
│   │                                              │   │
│   │ - - - - - - [Perforated Tear Line] - - - - - │   │
│   │  STAMP 6 OF 10 RECORDED • 4 MORE FOR CHAI    │   │
│   └──────────────────────────────────────────────┘   │
│                                                      │
│   ┌──────────────────────────────────────────────┐   │
│   │ 🎁 YOU WON A SURPRISE SCRATCH CARD!          │   │
│   │ [ SCRATCH CARD NOW ]      [ Save for Later ] │   │
│   └──────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

---

### C4 — Customer: Scratch Card (`/m/:slug/scratch/:id`)
**Concept:** Google-Pay-style metallic foil canvas with gold crimp edge and particle dust.

```
┌──────────────────────────────────────────────────────┐
│  ← Back to Card                           Chai Point │
├──────────────────────────────────────────────────────┤
│                                                      │
│      ┌────────────────────────────────────────┐      │
│      │ SERIAL: #SC-49102-CP      [Gold Crimp] │      │
│      ├────────────────────────────────────────┤      │
│      │                                        │      │
│      │   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │      │
│      │   ░░░░░░░ [METALLIC FOIL] ░░░░░░░░░░   │      │
│      │   ░░░░░░ (Touch & Scratch) ░░░░░░░░░   │      │
│      │   ░░░░░░░░ [55% Auto-Solve] ░░░░░░░░   │      │
│      │   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │      │
│      │                                        │      │
│      │   [Hidden underneath: Free Bun Maska]  │      │
│      │                                        │      │
│      └────────────────────────────────────────┘      │
│                                                      │
│      [ Reveal Instantly (Reduced Motion / Keyb) ]    │
│                                                      │
│      ┌────────────────────────────────────────┐      │
│      │ ℹ️ How This Works (Shop-Funded Odds)    │      │
│      │ • Every scan gives 1 free scratch card │      │
│      │ • Prizes set & funded by Chai Point    │      │
│      │ • Chance-based with verified fairness  │      │
│      └────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────┘
```

---

### C5 — Customer: Card Home (`/m/:slug/card`)
**Concept:** The permanent digital stamp card ticket with slight hand-stamped angle offsets and tear-off stub.

```
┌──────────────────────────────────────────────────────┐
│  CHAI POINT • LOYALTY CARD            [📱 My QR]     │
├──────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────┐  │
│  │ ☕ CHAI POINT               #CP-004128         │  │
│  │ ────────────────────────────────────────────── │  │
│  │                                                │  │
│  │  ┌────┐  ┌────┐  ┌────┐  ┌────┐  ┌────┐        │  │
│  │  │ ☕ │  │ ☕ │  │ ☕ │  │ ☕ │  │ ☕ │        │  │
│  │  └────┘  └────┘  └────┘  └────┘  └────┘        │  │
│  │  Nov 01  Nov 02  Nov 04  Nov 05  Nov 07        │  │
│  │                                                │  │
│  │  ┌────┐  ┌────┐  ┌────┐  ┌────┐  ┌────┐        │  │
│  │  │( ) │  │( ) │  │( ) │  │( ) │  │( ) │        │  │
│  │  └────┘  └────┘  └────┘  └────┘  └────┘        │  │
│  │   #6      #7      #8      #9     #10           │  │
│  │                                                │  │
│  │ - - - - - - [Perforated Notch] - - - - - - - - │  │
│  │ 5 Stamps collected • 5 more to unlock Reward   │  │
│  │ Reward: 1 Special Kulhad Chai & Bun Maska      │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  K H A T A   L E D G E R   (Visit History)           │
│  ─────────────────────────────────────────────────── │
│  07 Nov  • Counter Stamp #5            11:24 AM  ✓   │
│  05 Nov  • Counter Stamp #4            05:12 PM  ✓   │
│  04 Nov  • Counter Stamp #3 + Scratch  09:40 AM  ✓   │
│                                                      │
│  [ View All Unclaimed Rewards (2) → ]                │
└──────────────────────────────────────────────────────┘
```

---

### M2 — Merchant: Counter (`/merchant`)
**Concept:** The Khata (Cashbook) desk. One giant dominant primary action `[ SHOW COUNTER QR ]` and live 5-bar gate tallies.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ☕ CHAI POINT  [Counter Open]                     [Lang: हिन्दी ▾] [Logout] │
├──────────────────────────────────────┬──────────────────────────────────────┤
│ DAILY KHATA (Cashbook Ledger)        │ COUNTER DESK & PRIMARY ACTIONS       │
│ ──────────────────────────────────── │ ──────────────────────────────────── │
│ ║ [Faint Red Margin Line]            │                                      │
│ ║                                    │ ┌──────────────────────────────────┐ │
│ ║ 12:41 PM • Amit Sharma   +1 Stamp  │ │                                  │ │
│ ║ 12:35 PM • Priya Patel   +Scratch  │ │       [ SHOW COUNTER QR ]        │ │
│ ║ 12:18 PM • Rajesh K.     CLAIM #8  │ │      (Giant Primary Action)      │ │
│ ║ 11:50 AM • Anita Roy     +1 Stamp  │ │                                  │ │
│ ║ 11:22 AM • Vikram Singh  +1 Stamp  │ └──────────────────────────────────┘ │
│ ║                                    │                                      │
│ ║                                    │ ┌──────────────────────────────────┐ │
│ ║ TODAY'S TALLY MARKS                │ │ 📷 SCAN CUSTOMER PHONE QR        │ │
│ ║ 卌 卌 卌 卌 卌 卌 ||| (33 Stamps)  │ │ (Staff-facing camera scanner)    │ │
│ ║ 卌 卌 | (11 Scratch Cards)         │ └──────────────────────────────────┘ │
│ ║ 卌 (5 Rewards Claimed)             │                                      │
│ ║                                    │ ┌───────────────┐  ┌───────────────┐ │
│ ║                                    │ │ 🎁 REDEEM     │  │ 🖨️ POSTER     │ │
│ ║                                    │ │    CODE       │  │    PRINT      │ │
│ ║                                    │ └───────────────┘  └───────────────┘ │
├──────────────────────────────────────┴──────────────────────────────────────┤
│ [Mobile Bottom Nav: 1. Counter | 2. Ledger | 3. Regulars | 4. Studio ]       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### M7 — Merchant: Studio (`/merchant/studio`)
**Concept:** Live two-way interactive visual ticket builder. Sliders and color pickers on the left, responsive rubber-stamped ticket on the right that springs into place.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ☕ CHAI POINT STUDIO — CARD & RULES DESIGNER                                 │
├────────────────────────────────────────┬────────────────────────────────────┤
│ PROGRAM SETTINGS & RULES               │ LIVE TICKET PREVIEW (Spring M09)   │
│ ────────────────────────────────────── │ ────────────────────────────────── │
│ Stamps Required per Card:              │ ┌────────────────────────────────┐ │
│ [====●=================]  8 Stamps     │ │ ☕ CHAI POINT    #CP-SAMPLE    │ │
│                                        │ │ ────────────────────────────── │ │
│ Reward Text on Completion:             │ │ [☕] [☕] [☕] [☕]            │ │
│ [ Free Kulhad Chai & Samosa Combo    ] │ │ [☕] [☕] [☕] [☕]            │ │
│                                        │ │ - - - - - - - - - - - - - - -  │ │
│ Stamp Icon (12 Curated SVG Icons):     │ │ 8 Stamps = Free Kulhad Chai    │ │
│ [☕ Cup] [🫖 Kulhad] [✂️ Scissors] [★]│ └────────────────────────────────┘ │
│                                        │                                    │
│ Card Accent Palette (8 Curated Colors):│ Cooldown Rule:                     │
│ [Violet] [Forest] [Brick] [Turmeric]   │ "Customer can collect 1 stamp      │
│                                        │  every 4 hours at this counter"    │
│ Cooldown Between Visits:               │                                    │
│ [===========●==========] 4 Hours       │ [ Save & Publish to Counter ]      │
└────────────────────────────────────────┴────────────────────────────────────┘
```

---

### A1 — Super Admin: Platform Control Tower (`/admin`)
**Concept:** The Master Control Tower. Clean, crisp light theme with the interactive Hierarchy Map as the centerpiece.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🛡️ STAMP UNIVERSAL ADMIN                        [Admin: Sharvil More] [Exit]│
├─────────────────────────────────────────────────────────────────────────────┤
│ PLATFORM HIERARCHY MAP (Interactive SVG Nodes & Flow Dots - M13)            │
│                                                                             │
│                     ┌─────────────────────────────┐                         │
│                     │       PLATFORM ROOT         │                         │
│                     │ (Universal Governance Node) │                         │
│                     └──────────────┬──────────────┘                         │
│                                    │                                        │
│          ┌─────────────────────────┴─────────────────────────┐              │
│          ▼                                                   ▼              │
│  ┌───────────────┐                                   ┌───────────────┐      │
│  │  CHAI POINT   │ [● Active]                        │  CUTS SALON   │      │
│  │  142 Members  │ ───► (Flow Dot: Live Stamp)       │  89 Members   │      │
│  └───────┬───────┘                                   └───────┬───────┘      │
│          │                                                   │              │
│     ┌────┴────┐                                         ┌────┴────┐         │
│     ▼         ▼                                         ▼         ▼         │
│  [Cust 1]  [Cust 2]                                  [Cust 3]  [Cust 4]     │
│                                                                             │
├──────────────────────────────────────┬──────────────────────────────────────┤
│ MERCHANT DIRECTORY & VITALS          │ ATTENTION & HEALTH MONITOR           │
│ ──────────────────────────────────── │ ──────────────────────────────────── │
│ [Search merchant, phone, slug...]    │ 🚩 2 Location Mismatch Flags         │
│                                      │ ⏳ 1 Pending Onboarding Merchant     │
│ • Chai Point      142 Cust  [Enter ↗]│ 💓 Cron Heartbeat: Ran 2m ago (OK)   │
│ • Cuts Salon       89 Cust  [Enter ↗]│ 📱 OTP Gateway: 99.4% Delivery       │
│ • Urban Bakery     44 Cust  [Enter ↗]│                                      │
│                                      │ [ + Onboard New Merchant (Wizard) ]  │
└──────────────────────────────────────┴──────────────────────────────────────┘
```

---

### A3 — Super Admin: Safe Impersonation Banner
**Concept:** M14 diagonal safety tape across the top of all merchant pages during support sessions.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ⚠️ IMPERSONATING CHAI POINT • REASON: "Assisting owner with prize setup"     │
│ Session expires in 24m 10s • All actions logged with audit ID #AUD-912 [EXIT]│
├─────────────────────────────────────────────────────────────────────────────┤
│ (Active Merchant UI renders below under full isolation)                     │
```

---

## 3. Motion System & Haptic Catalogue (M01 to M16)

| Code | Trigger | Physical Effect | Duration | Easing |
|---|---|---|---|---|
| **M01** | Stamp Recorded | Rubber seal lands from `scale(1.35)` to `scale(1.0)`, settles with random 3–6° tilt and speckle ink opacity. | 450 ms | `cubic-bezier(0.2, 0.9, 0.3, 1.15)` |
| **M02** | Card Counter Update | Stamp counter number and "N more for reward" text cross-fade. | 160 ms | `ease-out` |
| **M03** | Reward Unlocked | Ticket stub tears off along SVG perforation line, slides 6° down, reward ticket slides up. | 600 ms | Spring linear approximation |
| **M04** | Scratch Reveal | Canvas metallic sheen, particle dust at touch points. At 55% cleared, foil dissolves outward. | 300 ms | Radial dissolve |
| **M05** | Claim Code Reveal | 8-character code digits fade in sequentially (40 ms stagger), circular countdown arc starts. | 320 ms | Step stagger |
| **M06** | OTP Box & Shake | Filled digit pops `scale(1.15)`; on invalid code, card shakes `translateX(±6px)` with haptic. | 240 ms | 3-cycle spring shake |
| **M07** | QR Module Wipe | New QR rows wipe in via SVG clip-path row-by-row; countdown ring drains over 25s. | 300 ms | Row clip-path |
| **M08** | Khata Ledger Insert | FLIP slide down; hand-drawn SVG circle highlights the new visit row for 500 ms. | 500 ms | FLIP + stroke-dashoffset |
| **M09** | Spring Sheets | Modal bottom-sheet springs up from bottom; follows finger drag on dismiss. | 350 ms | Spring |
| **M10** | Card-to-History View | View Transitions API morphs ticket into detailed transaction history ledger. | 300 ms | Cross-fade transform |
| **M11** | Pull-to-Refresh | Rubber seal presses into ink pad as user pulls down, then releases. | 400 ms | Ink compression |
| **M12** | Tabular Count-Up | Numbers count up smoothly on first dashboard mount. | 600 ms | Ease-out cubic |
| **M13** | Hierarchy Flow Dots | SVG flow dot travels along bezier branch connector when a live stamp event arrives. | 800 ms | Path follow |
| **M14** | Impersonation Tape | Diagonal warning tape slides down from top edge; title prefix changes to `[IMPERSONATING]`. | 240 ms | Slide-down |
| **M15** | Draggable Odds Bar | Live multi-handled foil bar rebalances percentage slices for scratch prizes. | Instant | Direct DOM drag |
| **M16** | Vernacular Switch | Smooth cross-fade of strings when switching English ⇄ हिन्दी ⇄ मराठी. | 150 ms | Opacity fade |

---

## 4. Mandatory Hand-Crafted SVG Assets Catalogue

1. **Brand Mark Seal:** 64x64 viewBox circular seal with hand-wobbled 2.5px ring and central check-mark punch.
2. **6 Stamp Impressions:** Round, Scalloped, Rotated Square, Ticket-Notch, Star-Ring, Check-Ring with SVG speckle filter.
3. **12 Merchant Stamp Icons:** Kulhad Chai Cup, Coffee Cup, Croissant, Scissors, Comb, Dumbbell, Burger, Pizza Slice, Ice-Cream Cone, Bubble Tea, Shopping Bag, Star.
4. **Perforated Ticket Card:** Semicircular cutout notches, dashed perforation line, decorative tear-off stub.
5. **Metallic Foil Scratch Layer:** Diagonal gold sheen band and zig-zag crimped edge.
6. **Scratch Dust Particles:** 6 varied geometric flake shapes pooled for touch emission.
7. **5 Prize Glyphs:** Free Item Gift, Percentage Tag, No-Prize Soft Cloud, Jackpot Star-Burst, Coupon Voucher.
8. **QR Stage:** 4 breathing corner brackets and circular stroke-dashoffset countdown timer.
9. **Khata Rules:** Ruled horizontal cashbook lines with faint red vertical margin rule (8% opacity).
10. **Five-Bar Gate Tally Marks:** Hand-drawn 5-stroke SVG tally marks (`|`, `||`, `|||`, `||||`, `卌`).
11. **7 Empty-State Vignettes:** Empty Card, Open Ledger & Pencil, Empty Foil Ticket, Cut-Wire Offline QR, Bell Reminder, Closed Shutter, Calm Seal.
12. **Hierarchy Map Elements:** Super Admin Node, Merchant Node, Customer Cluster, Connected Bezier Curves, Flow Dots.
13. **Status Marks:** Counted (Check Seal), Pending (Dashed Circle), Voided (Struck-through Seal), Redeemed (Double Check), Expired (Faded Seal).

