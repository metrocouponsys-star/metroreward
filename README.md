# Stamp

QR-based digital stamp card and scratch card loyalty system for local shops in India.

## Quick start (development)

```bash
# 1. Clone and install
git clone <repo> && cd metroreward
npm install

# 2. Copy env and fill in DATABASE_URL at minimum
cp .env.example .env

# 3. Run database migrations
npm run db:migrate

# 4. Seed demo data
npm run db:seed

# 5. Start dev servers (API on :3000, web on :5173)
npm run dev
```

Open `http://localhost:5173` for the web app (proxied to the API).

## Production build & Run

```bash
# Build the React app (outputs to web/dist/)
npm run build

# Start the server (serves API + built web app on one port)
npm start
```

## Features vs. Competitor Benchmarks

| Feature | Status | Details |
|---|---|---|
| **PWA (No App Download)** | ✅ Yes | Works in any mobile browser, installs to home screen via service worker |
| **Customer Rotating QR Scan** | ✅ Yes | Display rotates every 25s, signed with HMAC-SHA256, 45s validity + 45s grace |
| **Reverse Stamping Mode** | ✅ Yes | Customer displays "My QR" from home page; staff scans at `/shop/scan` |
| **Customer List CSV Export** | ✅ Yes | Download complete customer list with stamps & last visit at `/api/shop/customers/export.csv` |
| **Printable Counter Standee** | ✅ Yes | Formatted A5/A4 printable counter sign at `/shop/print-qr` |
| **Business Discovery** | ✅ Yes | Customers browse and search local shops offering stamp programs at `/explore` |
| **Scratch Cards with Odds** | ✅ Yes | Server-side weighted draw, atomic inventory check, canvas foil scratch reveal |
| **Atomic Reward Redemptions**| ✅ Yes | 8-character codes (`23456789ABCDEFGHJKLMNPQRSTUVWXYZ`), 10-minute expiry |
| **Automated Reminders** | ✅ Yes | Reward ready, one-to-go, win-back, prize expiring via web push & cron |
| **Quiet Hours & Muting** | ✅ Yes | No notifications between 21:00 and 09:00 IST; customer per-shop mute |
| **NFC Tap Pods & Reviews** | 🚫 Excluded | Excluded per requirements (focus on frictionless zero-hardware QR) |

## Deploy on Hostinger Web App

### Setup

1. **Node.js version**: 22.x
2. **Build command**: `npm run build`
3. **Start command**: `npm start`
4. **Entry point**: `server/src/index.ts` (runs via tsx)

### Environment variables

Set these in hPanel → Web App → Environment Variables:

| Variable | Example | Required |
|----------|---------|----------|
| `DATABASE_URL` | `mysql://user:pass@host:3306/stamp` | ✅ |
| `SESSION_SECRET` | (32+ random characters) | ✅ |
| `BASE_URL` | `https://yourdomain.com` | ✅ |
| `CRON_SECRET` | (16+ random characters) | ✅ |
| `ADMIN_PHONES` | `+919876543210` | ✅ |
| `NODE_ENV` | `production` | ✅ |
| `PORT` | `3000` | ✅ |
| `OTP_PROVIDER_URL` | `https://api.msg91.com/api/v5/otp` | For prod |
| `OTP_PROVIDER_KEY` | (your API key) | For prod |
| `OTP_SENDER_ID` | `STAMPD` | For prod |
| `VAPID_PUBLIC_KEY` | (from `npx web-push generate-vapid-keys`) | For push |
| `VAPID_PRIVATE_KEY` | (from `npx web-push generate-vapid-keys`) | For push |

### Cron job

Set up a cron job in hPanel → Advanced → Cron Jobs:

**Frequency**: Every 5 minutes (`*/5 * * * *`)

**Command** (exact):
```bash
curl -s -X POST https://yourdomain.com/api/internal/cron/reminders -H "x-cron-secret: YOUR_CRON_SECRET" -H "Content-Type: application/json"
```

Replace `yourdomain.com` and `YOUR_CRON_SECRET` with your actual values.

### Database

The app expects MySQL 8.0. Run migrations before the first deploy:

```bash
DATABASE_URL=mysql://user:pass@host:3306/stamp npm run db:migrate
```

## Tests

```bash
npm test
```

Runs 56 unit and concurrency tests covering:
- Cryptographic utilities (UUID, SHA-256, HMAC, OTP, reward codes)
- QR token issuance and verification (valid, tampered, expired, wrong-shop, previous window, customer reverse mode)
- Session encoding/decoding & tenant isolation (customer, shop, admin, tampered, forbidden)
- Concurrent atomic redemption (20 simultaneous redemptions succeed exactly once)
- Weighted random draw distribution (10,000 draws within 2% margin) & concurrent stock safety (stock never falls below 0)
- Reminder rules (quiet hours 21:00-09:00 IST, 3-day quiet interval, 3-ignored shutoff)
- Contact form validation, honeypot & time-to-submit anti-spam, and phone normalization
- Utility functions (haversine formula, phone normalization, date math)

---

## Public Marketing Website (`/site`)

The public marketing website is built with **Astro 5** (static output) located in `site/`. It follows the "counter" design concept: cashbook ledger lines, perforated tickets, rubber-stamp ink marks, and a grounded color palette matching the product app.

### Stack & Architecture

- **Engine**: Astro 5 static site generation (`output: 'static'`)
- **Typography**: Self-hosted fonts via `@fontsource` (Familjen Grotesk for display, Figtree for body, IBM Plex Mono for serials/captions, Caveat for margin notes)
- **Styling**: Plain CSS custom properties (`tokens.css`, `base.css`, `type.css`) — no Tailwind, zero UI kit
- **Zero JavaScript by default**: Tiny progressive scripts for mobile navigation, interactive canvas scratch card, rotating QR simulator, word-by-word scroll reveal, and contact form handling
- **Honesty-first copy**: No invented testimonials, ratings, stats, or "trusted by" claims. Real v1 features only; future items in "On the way"

### Pages

1. **Home (`/`)**: 14 sections including split hero with landing stamp, word-opacity problem statement, pinned 5-step phone mockup story, asymmetric benefits grid, interactive canvas scratch card, customer benefits, rotating QR security demo, dashboard ledger preview, audience shop types, pilot flow, on-the-way roadmap, accessible FAQ (`<details>`), and full-bleed violet final CTA band.
2. **About (`/about`)**: Founder story, 4 core principles, pilot process walkthrough, team & location note.
3. **Contact (`/contact`)**: Contact channels (WhatsApp wa.me direct button, phone, email, address, hours), static storefront slot, and full contact form with honeypot & 3-second minimum submit guard.
4. **Policies (`/privacy-policy`, `/terms-and-conditions`, `/refund-policy`)**: DPDP-compliant plain-language privacy notice, terms of service, and refund/cancellation guidelines with sticky table of contents and print stylesheets.
5. **404 (`/404`)**: Calm, on-brand lost page with SVG stamp mark.

### Commands

```bash
# Start marketing site dev server (http://localhost:4321)
npm run dev:site

# Build marketing site (fails if [[FILL markers remain without ALLOW_PLACEHOLDERS=1)
npm run build:site

# In development, build allowing placeholders
cd site && ALLOW_PLACEHOLDERS=1 npm run build

# Check for remaining [[FILL markers across copy and policies
npm run check:placeholders

# Validate all internal links across built static HTML
cd site && npm run check:links
```

### How to Edit Content & Configuration

1. **Copy**: All text is centralized in TypeScript content files (`site/src/content/home.ts`, `site/src/content/about.ts`, `site/src/content/contact.ts`). Never hard-code copy in components.
2. **Site Configuration**: Edit `site/src/config/site.ts` to update brand name, WhatsApp number, phone, email, legal entity name, registered address, grievance officer contact, policy update date, pricing visibility, and analytics toggle.
3. **Images**: Registered in `site/src/config/images.ts`. When an image has no `src`, the site renders an exact aspect-ratio hatched placeholder box with mono caption. To add an image:
   - Drop the photo file into `site/public/images/{id}.jpg` (e.g. `hero-counter.jpg`, `about-founder.jpg`).
   - Add `src: '{id}.jpg'` in `site/src/config/images.ts`.
4. **Factual Claims**: See `site/CLAIMS_TO_VERIFY.md` for a checklist of all 18 factual claims made on the site for owner sign-off before launch.

### Contact Form Backend & Email Integration

- **Endpoint**: `POST /api/public/contact` on the Fastify server.
- **Spam Protection**: Hidden honeypot field (`website`), 3-second minimum elapsed submission time check, and IP-hash rate limiting (max 5 submissions per hour per IP in MySQL).
- **Storage**: Persisted to `contact_requests` table with normalized `+91` phone, topic, and channel preference.
- **Notification**: Sends notification email via `nodemailer` using `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, and `CONTACT_TO` environment variables.
- **Data Retention**: Old submissions (>12 months) are automatically deleted by the existing cron endpoint (`POST /api/internal/cron/reminders`).

### Deploying on Hostinger

Hostinger supports Node.js web applications and static sites. You need a plan that supports at least one subdomain or two sites:

1. **Main Domain (`yourdomain.com`)**:
   - Run `npm run build:site` inside `site/` (outputs static files to `site/dist/`).
   - Upload or deploy `site/dist/` to the public root (`public_html/`) on Hostinger.
2. **Product Application Subdomain (`app.yourdomain.com`)**:
   - Hostinger Node.js Web App configured with:
     - Node version: 22.x
     - Directory: repository root
     - Build command: `npm run build`
     - Start command: `npm start`
     - Environment variables: `SITE_ORIGIN=https://yourdomain.com`, `DATABASE_URL`, `SESSION_SECRET`, `BASE_URL=https://app.yourdomain.com`, etc.

