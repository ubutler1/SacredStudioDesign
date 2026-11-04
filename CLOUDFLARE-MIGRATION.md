# Cloudflare migration preparation — November 4, 2026

The owner authorized finishing privacy/mobile, then search/link previews, then a tested Cloudflare copy **before** domain cutover. PR #6 and PR #7 are released. This migration branch does not change the domain, Netlify visibility, billing or checkout.

## Hosting and inquiry route

Cloudflare Workers Static Assets hosts the studio's own selected website files. The original artwork, logo, page design and catalog remain intact. The Cloudflare build changes only the inquiry action/provider disclosure, provider notice and host-specific headers/redirects. It is separate from the Netlify output, so the existing form blueprint and rollback site remain available.

The Cloudflare form posts to `/inquiry` on its own origin. A Worker validates the six expected fields, size, email/topic, origin and honeypot, applies an approximate five-per-minute IP-hash limit per Cloudflare location, and sends one URL-encoded request to the existing Netlify Forms installation. It forwards no browser cookies, authorization or visitor IP header and writes no inquiry logs. Netlify continues to store submissions and notify the studio Gmail account. This is Cloudflare web hosting with Netlify retained for form processing; it is not complete removal of the Netlify account. No new email provider or paid plan is configured.

The Worker handles failures without claiming success or echoing private fields. It does not automatically retry submissions. A provider HTTP acknowledgment is not proof of email delivery; an actual matching studio notification is a cutover requirement. Honeypot acceptance deliberately appears successful to bots without forwarding the message.

`node scripts/build.cjs` remains the Netlify build. `node scripts/build-cloudflare.cjs` produces `cloudflare-dist` (28 selected files including header rules). `wrangler.json` uses that directory, the inquiry Worker and a rate limiter. Use Wrangler 4.36 or later. No domain routes or account ID are included, so initial deployment is to the selected owner's workers.dev account only. Ensure the rate-limit namespace 2026110401 is unused or intentionally dedicated in that account. The workers.dev host receives noindex headers; the canonical URLs stay on the existing studio domain. Configure the www-to-apex redirect as a Cloudflare zone Single Redirect rule, preserving path and query; Workers static _redirects does not support domain-level source URLs.

## Release gates

1. Sign in to the correct Cloudflare account and confirm the free Workers plan. Deploy this branch to workers.dev without adding a custom domain or changing nameservers. If using Git integration, restrict access to this repository.
2. Run existing site/privacy/Pinterest/search checks and `node tests/cloudflare.mjs`. Check the deployed copy's eight pages, nine complete paintings, gallery behavior, narrow phone layout, footer access, provider disclosure, security/noindex headers, sitemap/robots/share image and 404s. Verify the Netlify badge is absent from the Cloudflare-hosted copy.
3. From the Cloudflare Contact page, send one clearly identified studio-owned test inquiry. Confirm the thank-you route, the matching Netlify submission **and** its notification in urielalexanderstudio@gmail.com. Check spam handling if the controlled test is filtered; do not disable spam defenses. Exercise an invalid submission and safe error handling without flooding the backend.
4. Export the complete current DNS zone and record registrar/nameservers, web targets and TTLs. Verify every MX/TXT/SPF/DKIM/DMARC/verification record. Prepare the Cloudflare zone with these preserved records. Keep Netlify running for rollback. Do not guess mail records or change the registrar.
5. Only after the copy and delivery checks pass, switch the authoritative nameservers/domain in the authorized sequence and attach the studio root/www to the tested Worker. Check any DNSSEC/DS transition before nameserver changes. Add a zone Single Redirect rule matching www.urielalexanderstudio.com, redirecting permanently to https://urielalexanderstudio.com with the request path and query preserved. Verify both HTTPS hostnames, the actual www redirect, all public pages, real form delivery, share metadata, no hosting badge and protected headers at the studio domain. Record actual DNS values and times privately in the project register.
6. Keep the Netlify form backend and rollback site. Do not delete the project, historical submissions or DNS records as cleanup. Remove or change old analytics only after the new operational reporting is verified. Checkout remains inactive.

## Current evidence and limits

The 41 local handler scenarios and independent-build checks passed both locally and in Cloudflare Builds. The Cloudflare test copy deployed successfully. A native inquiry from that copy reached confirmation and delivered its matching studio Gmail notification on November 4. Full gallery/mobile/metadata checks and the domain cutover remain separate gates. HTTPS-only transport headers are applied to static assets and Worker-generated responses to retain the existing site's HSTS protection.

The earlier scripted Netlify privacy test was found in Netlify's spam submissions. A fresh native browser submission reached confirmation, appeared in verified submissions and delivered its exact matching notification to the studio Gmail inbox. The narrow Contact and confirmation-page checks also passed, including normal access to the footer Privacy link. No spam defense was disabled.

The Cloudflare account is on the Free Workers plan. The Worker is named uriel-alexander-studio and its build is configured for feature/cloudflare-migration-20261104, with node tests/cloudflare.mjs as the build check and npx wrangler@4.157.0 deploy as the deployment command. The studio domain still points to Netlify. Local tests do not substitute for deployed review or the final custom-domain checks.

Cloudflare's protected pages use script-src self without the inline-script exception that the Netlify review tools needed. The existing Netlify output retains its reviewed policy and form blueprint. The Workers configuration was accepted by an official Wrangler 4.157.0 deployment dry run; no files were uploaded or deployed by that check.

Primary references:

- https://developers.cloudflare.com/workers/static-assets/migration-guides/netlify-to-workers/
- https://developers.cloudflare.com/workers/static-assets/headers/
- https://developers.cloudflare.com/workers/static-assets/binding/
- https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/
- https://developers.cloudflare.com/workers/configuration/routing/custom-domains/
- https://docs.netlify.com/manage/forms/setup/
- https://answers.netlify.com/t/can-i-use-netlify-forms-on-websites-which-are-not-hosted-at-netlify/111808
