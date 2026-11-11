# Collector experience review — November 11, 2026

## Authorization and release state

The artist accepted the recommendations from the current market comparison and requested implementation. This is an isolated review from production `d12af4906508eae078ad81af16e06a8e93f212fd`, tree `64733947306f8e99c70f92fb35a66a5c3a6735f2`. The current request authorizes preparing and testing these improvements. Publication to the studio domain remains a separate decision under the project instructions.

## Implemented for review

- The November 11 audit follow-up directs the homepage's original-artwork action to the two available originals, adds a clear three-step collecting process and explains the commission journey after an inquiry. The published original selection and inactive payment/booking status remain intact.
- Contact, Privacy and security-header source files now use the native Cloudflare implementation directly. The build copies the same public blueprint without a hidden Netlify-to-Cloudflare rewrite. Earlier Netlify records and deployments remain historical; runtime routes, storage schema and notification recipients are unchanged.

- A scoped phone layout shows the complete featured painting immediately after the approved headline. The original desktop composition, headline and authentic artwork files remain.
- Nine build-generated artwork pages have stable URLs, work-specific titles/descriptions, genuine original-image social metadata, exact catalog facts, related-work navigation and work-specific inquiries. The Gallery retains its square previews, filters and full uncropped viewer; each card and viewer also link to the artwork page.
- Navigation reads **Collect**, retaining the existing `/shop` address. The two selected originals show **Price on request**. The homepage's future-print link goes to an accurately described studio-updates signup.
- The $950 commission starting option now explicitly states **18 × 24 in**. A six-question FAQ covers larger approved sizes, references, the 8–10 week planning range to painting-completion review, separate drying/finishing/delivery, inquiries and delivery quotations. No booking or payment is activated.
- A downloadable, one-page public artist CV uses only approved About/catalog facts. It excludes personal phone/address, healthcare/employment details, private memberships, unconfirmed grants and exhibition claims. The tracked PDF is regenerated with `scripts/build-artist-cv.py` (ReportLab and DejaVu fonts); Python is not needed by the hosting build.
- A proposed public service target says the studio **aims to reply within two business days**, consistent with the existing private operating target. Review this wording with the rest of the draft before publication.
- A dedicated **Studio updates** page collects an email address only after an unchecked, required consent choice. It uses the existing same-origin inquiry handler, private database, fixed studio notification recipient, rate limiting, validation, form IDs and notification retries. Consent text and version are recorded as a separate `studio-updates` topic; ordinary inquiries do not subscribe anyone. No bulk sender, paid mailing platform or automated subscriber email is activated. The studio manages update requests directly and handles unsubscribe replies privately. Deduplicate addresses and honor removals before any future mailing.
- Signup and confirmation routes receive strict same-origin policies and no-store responses. The confirmation is noindex. Seventeen public URLs enter the sitemap; confirmation pages remain excluded.

## Still needs genuine photography

1. A real photograph of the artist working in the studio, with permission for public use.
2. For Skyline State of Mind and Next Door to Everything: a surface close-up, an angled edge/side photograph and a real photograph showing physical scale.

No generated likeness, invented installation, altered painting or empty photo placeholder is used. Additional authentic artwork views can be added as approved `views` records with `image`, `alt`, `caption`, `width` and `height`; the builder includes only supplied records.

## Validation

Run the existing page, search, artwork, privacy and Pinterest checks, plus `node tests/cloudflare.mjs`. The latter runs 96 native inquiry/signup/security/storage/retry scenarios with real in-memory SQLite and verifies all nine new pages, 457 published local resource links, consent, image-byte preservation and CV download. These tests use synthetic data and send no live emails. Render and inspect the PDF, and check the deployed review on desktop and phone-sized viewports before release.

## Release boundaries

No original asking price, checkout, deposit, guaranteed commission start, print/download product, DNS change, new paid service or production database migration accompanies this review. Production and test bindings stay separate. Use the established isolated Cloudflare review Worker; Netlify builds stay retired. Merge and verify the exact reviewed source only after the artist explicitly approves publication.
