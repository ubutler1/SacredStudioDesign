# Confirmed content and remaining inputs

Confirmed by the owner: **Uriel Alexander**, visual artist based in **the Bronx, New York**.

No photographs, logos, or image assets exist in either repository commit audited on October 13, 2026. The earlier conversation contains no retrievable photographs or additional content. Do not substitute stock or generated artwork. All old image paths, Georgia contact details, unverified testimonials, repeated artwork metadata, availability assertions, payment plans, and shipping promises have been removed from the active pages. The original pages remain in Git history on main at `437a2c19e896b01a35f20869a18fe4a86af01a07`.

## Studio shop — physical and digital editions

The new `shop.html` provides three customer paths:
- Physical fine-art prints fulfilled by an external printer, e.g. Fine Art America, only after a tested listing URL is provided.
- High-resolution digital editions fulfilled by a digital-delivery platform, e.g. Payhip, only after a tested listing URL and usage license are provided.
- Original paintings by inquiry, routed to the studio Instagram until an inbox and fulfillment policy have been confirmed.

No payment is collected on the static site, and no prints or downloads are offered until an artist-approved product and real HTTPS checkout URL have been added. The shop uses `shop.js`, which safely builds product entries using text nodes and validates links as HTTPS before exposing order actions.

Add a `shop` object to an *already verified* artwork in `site-data.js` only when you want it to appear on the Shop page. Example (documentation only; not a live offering):

```js
{
  title: 'Approved artwork title',
  image: 'assets/approved-artwork-photo.jpg',
  alt: 'Accurate description of the actual painting',
  categories: ['abstract'],
  medium: 'Oil on canvas',  // use only verified metadata
  dimensions: '24 × 36 inches',
  year: '2026',
  shop: {
    physicalPrintUrl: 'https://example.com/real-print-listing',
    digitalDownloadUrl: 'https://example.com/real-digital-product'
  }
}
```

If only one format is live, leave the other URL blank; no inert button is rendered. Provide lower-resolution public previews and keep print-ready original files off the public GitHub repository. The third-party fulfillment partner should hold the deliverable file. Confirm print resolution, crop, color profile, archival paper choice, sample proof, cost, retail pricing, and shipping before selling.

Digital purchases should be accompanied by clear license terms: buyer's personal printing only unless otherwise agreed; no resale, sublicensing, redistribution, or commercial reproduction; copyright remains with Uriel Alexander. Confirm any return/refund policy and provider terms before the first live product.

## Add confirmed artwork

Place artist-supplied, publication-approved photographs in `assets/`. Add objects to `artworks` in `site-data.js`:

```js
{
  title: 'Artist-confirmed title',
  image: 'assets/artist-supplied-photo.jpg',
  alt: 'Accurate visual description of the supplied photograph',
  categories: ['abstract'], // abstract, portrait, mixed-media; artist-confirmed
  medium: '',             // optional; leave blank unless confirmed
  dimensions: '',        // optional; include units
  year: ''               // optional; leave blank unless confirmed
}
```

The gallery shows only these entries. Category filters appear once artwork exists; empty categories receive an explicit message. Images show in full without cropping. A failed image displays an honest unavailable notice. Never infer artwork title or attribution from a stock filename.

## Contact and forms

Set `email` in `site-data.js` only after the artist confirms the destination. The contact page will display it. The inquiry tool validates fields and downloads a text draft locally; it explicitly never sends or stores a message. Real online submission and newsletter signup remain blocked by the lack of a confirmed recipient/provider endpoint. The old newsletter collection form was removed to avoid collecting addresses without a destination. Do not claim successful delivery or subscription until a real service is integrated and tested.

## Review before merging

- Confirm studio domain registration and eventual site hosting; neither has been enabled by this code.
- Open real merchant accounts separately and verify their checkout and fulfillment links before activating sale buttons.
- Confirm paper/canvas proofs, print dimensions and prices; no prices are invented in these pages.
- Test mobile and keyboard navigation on Shop, Gallery, and Contact.


- Supply authentic current artwork photographs with confirmed labels/categories.
- Confirm contact email and preferred submission service if online delivery is desired.
- Confirm any expanded biography, social links, commission terms, or testimonials before adding them.

No deployment or publishing configuration was added. This is a review branch; main is preserved.

## Validation

Browser checks passed for all five pages at 320, 390, 768, and 1440 pixels: no horizontal overflow, correct page navigation, and keyboard skip links. Additional checks covered category filtering with synthetic test-only data, empty categories, missing photograph fallback, required form validation, commission topic selection, text draft download, and absence of browser script errors. No real artwork or submission service was available to test.

To rerun, install Playwright locally (`npm install --no-save --package-lock=false playwright`) and its Chromium browser (`npx playwright install chromium`), then run `node tests/site.cjs`. Alternatively set `BROWSER_EXECUTABLE` to an installed Chromium-compatible browser. The test server listens only on localhost. Test fixtures do not modify site data or send messages.

## Artist-selected portfolio photographs (Oct 28, 2026)

The artist provided eight photographs for the website. Their preview file paths are staged in `site-data.js` and referred to from the homepage, gallery, and (eventually) Print Shop. **The binary images must still be added to the `assets/` folder on this feature branch before merging.** Missing-image fallbacks prevent broken icons, but they are not a substitute for uploading the images.

Artist-provided names: **She Lives in Color**, **Guiding Hands**, **He Started in Color**, **He Lives in Color**, and **Self Portrait**.

Working descriptions requiring title confirmation: **Bronx Dispensary Streetscape**, **City Figure**, and **Portrait with Hands**.

No date, medium, original dimensions, selling status, or price has been assumed for any artwork. The gallery filters are subject-based (figurative and urban) rather than falsely asserting medium.

Image files prepared (WebP, web-display resolution only):
`assets/she-lives-in-color.webp`, `assets/guiding-hands.webp`, `assets/he-started-in-color.webp`, `assets/he-lives-in-color.webp`, `assets/self-portrait.webp`, `assets/bronx-dispensary-streetscape.webp`, `assets/city-figure.webp`, `assets/portrait-with-hands.webp`.

The photographer originals must be retained for potential print fulfillment, and 300-PPI large-format print quality cannot be assumed from the uploaded screenshots/photos. No images are registered as purchasable items on the Shop page.

**Launch gate:** confirm the actual images render on desktop/mobile in the Netlify PR preview; wait for artist's November 1, 2026, authorization before merging or making the site public.
