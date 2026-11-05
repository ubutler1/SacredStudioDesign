# Cloudflare hosting and inquiry architecture

The public studio domain is hosted by Cloudflare Workers Static Assets and deploys from GitHub main. The root/www Custom Domains and the zone's single www-to-root redirect retain path and query. Optional RUM/Web Analytics injection is disabled; Pinterest keeps its existing consent and protected-page exclusions.

The native inquiry replacement is documented in [CLOUDFLARE-INQUIRIES.md](CLOUDFLARE-INQUIRIES.md). It validates submissions, stores them in private D1 storage, and sends notifications only to the verified studio Gmail through a restricted Cloudflare Email binding. The existing original artwork files, page design and inquiry-only shop are preserved. No public inquiry database endpoint is exposed.

`node scripts/build.cjs` preserves the historical Netlify build and form blueprint. `node scripts/build-cloudflare.cjs` prepares Cloudflare pages and provider disclosures; no runtime inquiry from the new backend is sent to Netlify. Existing Netlify submissions and notifications are retained for the owner's retention review.

Before releasing the native replacement, run `node tests/cloudflare.mjs`, then deploy `wrangler.preview.json` to its separate Worker and test database. Verify a real stored inquiry and matching studio email, the private recovery process and current public-page/security checks. Production uses wrangler.json and the existing main build integration. Do not change DNS, billing, checkout or delete historical submissions as part of this backend change.

Cloudflare website versions provide rollback. D1 database Time Travel is separate and currently retains seven days on the Free plan; test recovery in the synthetic test database and preserve live inquiry data before a real restore. Refer to the operations document for recovery and notification retry handling.
