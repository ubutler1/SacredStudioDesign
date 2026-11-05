# Artwork copying deterrents and Google discovery

Prepared November 5, 2026. Review branch: feature/artwork-protection-search-20261105.

## Requested behavior and practical limit

The artist requested clean artwork during normal viewing, with copying,
downloading and printing prevented or watermarked. A browser must receive clean
pixels to show a clean image. Neither JavaScript nor Cloudflare can reliably
detect every save, screenshot, copy, browser cache extraction or direct request.
An image that is always watermarked when downloaded must normally be served with
that watermark already in its pixels, which also makes it visible on screen.

This change is a reversible deterrent, not DRM or an invisible-download watermark.
All nine approved artwork files remain byte-for-byte unchanged. Their current
public web copies are 1600 pixels on the long edge, except Black Boy Magic at
1700 pixels. They remain usable for screenshots and some reproductions. No claim
that they are impossible to print or copy is made.

## Prepared behavior

- Only artwork surfaces suppress the ordinary context menu and dragging.
  Navigation, form fields, selected text and browser shortcuts remain available.
- Ordinary HTML clipboard copying that includes an artwork retains selected text
  while omitting embedded image content. No clipboard permission is requested.
- A rights notice appears after a blocked action. It is not a watermark on
  the artwork. There is no watermark during normal on-screen viewing.
- Page printing and Save as PDF omit artwork pixels and show a copyright/omission
  placeholder. This is CSS for the website document; it cannot control printing
  a direct image URL or a separately saved image. With JavaScript disabled, built
  artwork markup still carries print and drag attributes.
- The build emits the nine approved catalog cards, full-image disclosures and
  descriptions in Gallery's initial HTML. JavaScript replaces these with the
  existing filters and complete-artwork viewer. No new painting page URLs are
  invented and approved catalog facts are reused without interpretation.
- ImageObject markup on pages displaying artwork identifies the artwork credit
  and copyright notice, and directs image-permission inquiries to Contact. It
  does not invent a photographer credit, grant a license, add a checkout or
  promise a Google badge. The original homepage WebSite/Person data is retained.
- The sitemap keeps the same seven canonical page URLs. Only five pages with
  changed artwork/rights markup receive the November 5 modification date.

## Existing exposure and alternatives

Underlying image URLs, the public GitHub repository/history, older deployments,
Google/Pinterest caches and copies already obtained remain outside this
deterrent. No source-history rewrite, repository visibility change, deletion or
Netlify change is included. Hotlink blocking alone would not prevent saving and
could interfere with search and social previews.

Stronger visible watermarking of every public image, reducing public resolution
or placing selected works behind authenticated access requires a separate
presentation decision. Keep future print-resolution masters private. Do not
upload a private master to this public repository.

## Verification and release

Local checks: tests/site.cjs, tests/search.cjs, tests/privacy.cjs,
tests/artwork.cjs, tests/cloudflare.mjs and tests/pinterest.cjs. The artwork test
exercises context-menu/drag/copy actions and text/form exceptions, checks initial
HTML and rights metadata, tests HTML escaping and compares approved image bytes.
Browser review must confirm clean normal display, full compositions, gallery
navigation, a blocked ordinary image context menu, and the print preview.
Desktop browser checks do not certify every mobile long-press implementation.

This branch is prepared for preview. Production main is unchanged until the
artist approves publication of the reviewed result.

Primary references:

- https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl
- https://developers.google.com/search/docs/appearance/google-images
- https://developers.google.com/search/docs/appearance/structured-data/image-license-metadata
- https://developer.mozilla.org/en-US/docs/Web/API/Element/contextmenu_event
- https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Media_queries/Printing
