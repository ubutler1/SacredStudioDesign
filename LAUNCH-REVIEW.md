# Uriel Alexander Art Studio — launch review gates
**Target public launch: November 1, 2026.** This branch is for review only. Keep Netlify private until the artist explicitly approves public launch.

## New in this design pass
- Artist artwork first: responsive exhibition-style homepage and featured paintings.
- Nine artwork gallery cards with keyboard-accessible native dialog enlargement, next/previous navigation and per-painting inquiry links.
- Artwork-linked inquiries automatically put the painting title into the message field.
- Contact form now uses HTML Netlify Forms submission and a branded thank-you page instead of downloading a text draft. No public email address is required.
- About, commissions, and prints pages have been updated to make the inquiry paths clearer.
- Checkout remains unconfigured until actual sale, licensing, pricing and provider terms are ready.

## Business-critical setup and testing
1. In your private Netlify project, open **Forms** and enable **Form detection**. Then trigger/review a new site deploy with this branch.
2. Verify `studio-inquiry` appears under **Active forms**. Test submission with a real name and an email address you control, then confirm it appears under **Forms > Submissions** and redirects to `thank-you.html`. Form HTML alone cannot verify delivery.
3. Configure **Forms > Submission notifications > Add notification** to a working email you control. Send a second test, confirm receipt, check spam if necessary, and reply to the test.
4. Review the new text, imagery, photo cropping and behavior on desktop and mobile; test dialog Close, Escape, Left/Right keys, filters, and work-specific inquiry links.
5. Check keyboard focus, contrast and responsive behavior. `node tests/site.cjs` runs basic static assertions without additional installs.
6. Confirm artwork metadata and selling decisions: medium, dimensions, year, availability, pricing. The current site does NOT claim an artwork is available for purchase.
7. Connect `urielalexanderstudio.com` from Netlify **Domain management**; use the exact DNS records provided by Netlify in GoDaddy. Check both www/root address and HTTPS.
8. After the artist approves the final version, merge PR #2 to `main`, inspect the **production** deploy, re-test Forms in production, verify domain/SSL, then make Netlify public on the chosen date.
9. Keep personal/commercial print-ready image masters out of public GitHub. The current GitHub repository is public even while Netlify is private.
10. Keep web preview images lightweight and avoid uploading ZIP collections to the public website assets folder.

## Commercial follow-through
- First goal: qualified inquiries about original works and commissioned paintings.
- Next: verified production and checkout for physical/digital prints only after proof, cost and license decisions.
- Track: visits to the gallery, contact form submissions, qualifying leads, and real sales. Do not equate visits with revenue.
- Maintain an independent inbox and Netlify notification to avoid missed client inquiries.

**No domain DNS, Netlify visibility, payment, or GitHub main branch changes were made by this code update.**

## October 29 preflight — pre-publication code checks
- Every static artwork <img> now includes verified intrinsic dimensions, while existing CSS presentation and crop treatment remain unchanged.
- Gallery, About and Commissions metadata descriptions were expanded without creating unverifiable sale or exhibition claims.
- Shop fulfillment wording no longer presumes an unconfirmed print-and-ship provider.
- Tests now cover internal HTML navigation, artwork deep links and native image dimensions. These static checks do **not** establish that a browser test was completed.
- The custom domain, both root and www, HTTPS/SSL, Netlify notification receipt and production Forms must be verified from their respective dashboards and a real browser before public launch.
- Do not merge PR #2, publish the site, switch DNS or activate checkout without the artist's explicit authorization.
- Review public repository attachments: PDFs, ZIPs, and contact sheets may expose images beyond the intended lightweight website previews. Removing them from a Git branch does not by itself erase Git history.

## October 29 — natural-language refinement
- Revised visible language on Home, About, Gallery, Shop, Commissions, Contact and thank-you pages, keeping the artist-approved layout, hero headline, artwork and full-image viewer unchanged.
- The artist does not want AI-sounding language or public identity labels to dominate his story. Keep language grounded and specific; do not add sexuality/heritage statements without additional copy approval.
- Added confirmed studio email to the Contact page; print checkout remains inactive and truthful.
- See `CONTENT.md` for a concrete collector/production/launch information gap list.
- The review branch remains separate from production.

## October 29: Gallery standard editorial review
- Replaced overly casual first person site copy with measured professional language intended for collectors, galleries and curators.
- Kept the approved hero headline and all nine artwork names unchanged.
- Preserved the existing structure, image placements, gallery behavior, Netlify form and truthful inactive checkout state.
- Final artist approval of editorial copy remains required before publishing.
