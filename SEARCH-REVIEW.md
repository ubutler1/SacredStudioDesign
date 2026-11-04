# Search and link preview release

Prepared November 4, 2026 after the privacy/mobile release in PR #6.

Every page has one canonical URL on the studio domain and a complete Open Graph and large-image card description. Home and Gallery have more descriptive search titles. The seven indexable pages appear in sitemap.xml, announced by robots.txt. The inquiry confirmation stays noindex and outside the sitemap. Home includes WebSite and Person structured data limited to the public artist name, visual-artist role and approved social profiles.

The 1200 × 630 JPEG uses the original approved logo, complete Skyline State of Mind photograph, approved headline and existing studio colors. No artwork is cropped or regenerated. The editable SVG and optional Pillow rendering script are source files, excluded from hosting output. All page body content, CSS, catalog, artwork bytes, scripts and native form behavior remain unchanged in this release.

Validation: existing site, privacy and Pinterest checks; tests/search.cjs; byte comparison of body content and all original assets; direct visual review of the exported card. The build now includes 28 selected public files. Production checks must confirm all page tags, the actual image response, sitemap, robots and confirmation noindex after deployment. A platform's cached preview and search indexing may update later; these changes do not guarantee rankings or immediate recrawling. Artwork query links continue to use the Gallery's shared preview.

Primary references:

- https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
- https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview
- https://ogp.me/
