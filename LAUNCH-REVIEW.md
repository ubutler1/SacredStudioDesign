# Uriel Alexander Art Studio — launch review gates
**Target public launch: November 1, 2026.** This branch is for review only. Keep Netlify private until the artist explicitly approves public launch.

## New in this design pass
- Artist artwork first: responsive exhibition-style homepage and featured paintings.
- Eight artwork gallery cards with keyboard-accessible native dialog enlargement, next/previous navigation and per-painting inquiry links.
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
