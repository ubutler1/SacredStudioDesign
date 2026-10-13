# Confirmed content and remaining inputs

Confirmed by the owner: **Urie Alexander**, visual artist based in **the Bronx, New York**.

No photographs, logos, or image assets exist in either repository commit audited on October 13, 2026. The earlier conversation contains no retrievable photographs or additional content. Do not substitute stock or generated artwork. All old image paths, Georgia contact details, unverified testimonials, repeated artwork metadata, availability assertions, payment plans, and shipping promises have been removed from the active pages. The original pages remain in Git history on main at `437a2c19e896b01a35f20869a18fe4a86af01a07`.

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

- Supply authentic current artwork photographs with confirmed labels/categories.
- Confirm contact email and preferred submission service if online delivery is desired.
- Confirm any expanded biography, social links, commission terms, or testimonials before adding them.

No deployment or publishing configuration was added. This is a review branch; main is preserved.

## Validation

Browser checks passed for all five pages at 320, 390, 768, and 1440 pixels: no horizontal overflow, correct page navigation, and keyboard skip links. Additional checks covered category filtering with synthetic test-only data, empty categories, missing photograph fallback, required form validation, commission topic selection, text draft download, and absence of browser script errors. No real artwork or submission service was available to test.

To rerun, install Playwright locally (`npm install --no-save --package-lock=false playwright`) and its Chromium browser (`npx playwright install chromium`), then run `node tests/site.cjs`. Alternatively set `BROWSER_EXECUTABLE` to an installed Chromium-compatible browser. The test server listens only on localhost. Test fixtures do not modify site data or send messages.
