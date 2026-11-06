# Stamp — Architecture Assumptions & Decisions

This document records key decisions, assumptions, and competitor feature implementations made during the design and implementation of Stamp (v1).

---

## 1. Runtime & Hosting (Hostinger Node.js Web App)
- **Single Process**: One long-running Node.js process (Node 22) hosts Fastify 5. Fastify serves both the `/api` endpoints and the production-built React 18 single-page application from `web/dist/` with an SPA fallback handler (`index.html`).
- **No Inbound WebSockets**: Fastify runs without WebSockets. Real-time behavior is achieved using HTTP polling: the shop live activity feed polls every 10 seconds, and the rotating QR token polls every 25 seconds.
- **Stateless Across Restarts**: The process restarts on every deploy. No business-critical state is held in memory; all state is persisted in MySQL 8.0.
- **Cron Jobs**: No persistent background workers or daemon queues. Scheduled tasks run via Hostinger hPanel's cron triggering a protected HTTP POST endpoint (`/api/internal/cron/reminders`) with the `x-cron-secret` header every 5 minutes.

---

## 2. Data Model & Balance Calculation
- **No Stored Stamp Counters**: As required by the specification, no mutable stamp counter column exists on customers or programs. The customer's available stamp balance is computed deterministically in SQL:
  $$\text{Balance} = \text{Counted Stamps} - (\text{Stamps Required} \times \text{Stamp Card Rewards Issued})$$
- **Append-Only Stamp Ledger**: Stamps are recorded in `stamp_events` and are never deleted. Shopkeepers can void a stamp by setting `status = 'voided'` and supplying a reason.
- **UUIDs**: All primary keys are 36-character UUIDv4 strings generated in application code (`crypto.randomUUID()`).
- **Timestamps**: All timestamps in the MySQL database are stored in UTC (`timezone: 'Z'`). The client and API display times in Indian Standard Time (`Asia/Kolkata`, UTC+5:30).

---

## 3. Stamping Methods & Fraud Prevention
- **Rotating Shop QR**: Display fetches a new token every 25 seconds (valid 45 seconds). The server accepts both the current and previous window (up to 90 seconds total).
- **Reverse Stamping Mode (Staff Scans Customer)**: The customer can open "My Stamp QR" on their phone (`GET /api/customer/qr-token`), which displays a 60-second rotating customer token. Shop staff can scan or paste this token directly in `/shop/scan` to stamp the customer in 1 tap without counter bottlenecks.
- **Timing Attacks**: Signature comparisons use constant-time `crypto.timingSafeEqual`.
- **GPS Distance Validation**: Geolocation coordinates (`lat`/`lng`) are optional on scan. If provided and greater than 150 meters from the shop's registered coordinates (calculated via the Haversine formula), the stamp is counted but flagged with `location_mismatch` and logged in `audit_log` for admin review.
- **Exclusion of NFC Tap Pods**: Per instructions, NFC hardware tap pods are omitted in favor of the universal, zero-cost rotating QR flow (accessible to any smartphone with a camera or browser).

---

## 4. Authentication & Rate Limiting
- **Phone OTP**: Standard 6-digit numeric OTP with 5-minute validity.
- **Abuse Prevention**:
  - Max 5 requests per hour per phone.
  - Max 20 requests per hour per IP.
  - 60-second cooldown between resends.
  - Locked for 15 minutes after 5 consecutive incorrect attempts.
  - All OTP attempts and locks are tracked in the `otp_requests` database table.
- **Sender Interface**: Uses `ConsoleSender` in development and test environments (`NODE_ENV !== 'production'`) and an HTTP sender (`HttpSender`) in production.
- **Sessions**: Signed HTTP-only cookies (`@fastify/cookie`) with 30-day lifetime, `SameSite=Lax`, and role-based permissions (`customer`, `shop`, `admin`).

---

## 5. Rewards, Redemption & Scratch Cards
- **Claim Code Format**: 8-character string drawn from an unambiguous alphabet (`23456789ABCDEFGHJKLMNPQRSTUVWXYZ`), excluding easily confused characters `0`, `O`, `1`, and `I`.
- **TTL**: Reward claim codes expire after 10 minutes.
- **Atomic Redemption**: Redemptions execute an atomic `UPDATE rewards SET status='redeemed', redeemed_at=NOW() WHERE code=? AND status='claimed' AND code_expires_at > NOW()`. Zero rows updated results in `CODE_USED_OR_EXPIRED`, preventing race conditions and double redemptions.
- **Scratch Cards**: Server determines prize at stamp time using `crypto.randomInt` with weighted distribution. Stock decrements atomically in SQL with automatic redraw on stock exhaustion. Client canvas foil provides tactile scratch interaction and auto-reveals at 55% area.

---

## 6. Shop Tools & Marketing Assets
- **Customer Directory CSV Export**: Available to shopkeepers under `/shop/customers` (`GET /api/shop/customers/export.csv`), exporting customer name, phone, stamp balance, and last visit time in IST.
- **Printable Counter Standee**: Dedicated `/shop/print-qr` page with print-specific CSS (`@media print`) allowing shopkeepers to print A4/A5 counter signs with their shop name, QR code, and reward details.
- **Business Discovery**: Public directory (`/explore` and `GET /api/shops/public`) allowing customers to find local merchants and their reward programs.
- **Exclusion of Review Section**: Per instructions, Google review requests and star-rating surveys are omitted to maintain focus on the core loyalty loop.

---

## 7. Automated Reminders & Quiet Hours
- **Quiet Hours**: No push notifications or reminders are dispatched between 21:00 and 09:00 IST.
- **Frequency**: Maximum of 1 reminder per customer per shop every 3 days.
- **Muting & Inactivity**: Customers can mute notifications per shop (`reminder_mutes` table). Reminders are automatically halted after 3 consecutive ignored notifications without an intervening visit.

---

## 8. Design & Typography
- **Hand-Crafted Aesthetic**: Flat color palette (`#F2F3F0`, `#FFFFFF`, `#101820`, `#4B2E9A`, `#B8962E`, `#1F8A5B`, `#C8372D`, `#D9DBD5`).
- **No Dark Theme**: Kept strictly light to replicate the tactile feeling of an authentic paper punch card from an Indian neighbourhood shop.
- **Typography**: Self-hosted `@fontsource/familjen-grotesk` for headings and display numbers, `@fontsource/figtree` for body and UI elements, with `Noto Sans Devanagari` as fallback for Indian language readiness.
- **Tactile Details**: Perforated stub borders (using CSS radial-gradient masks), stamp ink bleed animation (CSS keyframes), and physical noise texture on the scratch card canvas.
