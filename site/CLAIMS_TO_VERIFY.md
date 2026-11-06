# Claims to Verify

Every factual claim made on the site. The owner must confirm each one before launch.

| # | Claim | Where on site | Status |
|---|-------|--------------|--------|
| 1 | "The QR changes every 30 seconds" | Home §7 (QR demo caption), FAQ | ☐ Confirm the interval |
| 2 | "We never sell customer data" | Privacy policy §4, FAQ | ☐ Owner to confirm |
| 3 | "No app to download" | Home hero, FAQ, customer benefits | ☐ Verified — it's a PWA |
| 4 | "Works on any phone" | Home hero | ☐ Check minimum browser requirements |
| 5 | "Nothing to buy for your counter" | Home hero, benefits | ☐ Confirmed — QR shown on any device |
| 6 | "One-time code valid for 10 minutes" | FAQ | ☐ Check server config (`CLAIM_TTL_MS`) |
| 7 | "Cooldown stops repeat scans" | Benefits, FAQ, security section | ☐ Confirm default cooldown value |
| 8 | "The server decides the result, not the phone" | Benefits, FAQ | ☐ Verified — scratch outcome from server |
| 9 | "Browser notifications work on iPhone after adding to home screen" | FAQ | ☐ Confirm iOS Safari PWA push support |
| 10 | "Each shop sees only its own customers" | Security section, privacy policy | ☐ Verified by DB scoping |
| 11 | "Contact form data deleted after 12 months" | Privacy policy | ☐ Owner to confirm retention period |
| 12 | "Service is for people aged 18 and over" | Privacy policy | ☐ Owner to confirm age rule |
| 13 | "We will respond within [X] days" (data requests) | Privacy policy | ☐ Owner to set response time |
| 14 | "We will refund within [X] working days" | Refund policy | ☐ Owner to set refund timeline |
| 15 | "GST invoices provided for all paid plans" | Refund policy | ☐ Confirm GST registration |
| 16 | "Location coordinates are not stored" | Privacy policy | ☐ Verify server code |
| 17 | "One-time codes stored as a one-way hash" | Privacy policy | ☐ Verify server code |
| 18 | "Void action is logged with a reason" | Terms, benefits | ☐ Verified — voided_reason column in DB |

## How to use this file

1. Go through each claim.
2. Mark ✓ if confirmed, ✗ if false (and fix the copy), or ? if uncertain.
3. All claims must be ✓ before launch.

