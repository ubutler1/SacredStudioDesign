# Pinterest measurement

Prepared November 1, 2026 for a separate draft review. Tag ID: 2613622321548.

## Behavior

- The deferred pinterest.js file is included once on each page. It offers an optional choice in the footer and editable choices on privacy.html.
- No Pinterest script, image beacon or connection hint is requested until Allow Pinterest is chosen. The browser stores the preference under studio-pinterest-consent-v1. Denied or missing consent keeps tracking off.
- Only HTTPS visits to the studio domain and its www alias on Home, Gallery, Shop, About and Commissions can load the tag. Both .html and Netlify clean URLs are supported. Deploy previews, localhost, Contact, the inquiry confirmation and Privacy are excluded.
- Global Privacy Control and Do Not Track prevent activation even with stored permission.
- The standard load and page base calls run once per eligible page load with the supplied ID. No additional lead, checkout, purchase or conversion events are added.
- Sample email fields are omitted. This integration does not read forms or pass visitor email identifiers. Enhanced-match account settings were not accessed.
- The no-JavaScript image beacon is omitted because it would bypass the consent choice. Without JavaScript, Pinterest tracking stays off.
- Revocation reloads affected pages to remove running third-party code. Storage events also handle a change from another tab. Revocation does not erase data previously sent.
- The privacy notice explains sharing and links to Pinterest privacy settings and AdChoices.

## Scope

The Pinterest portion adds a shared deferred script, optional visitor choices, a Privacy page and its footer link. The combined review also includes the approved collector details, public CV and verified social links. Artwork images, titles, approved descriptions, primary navigation and Netlify form behavior are retained. The approved CSS base remains unchanged, with scoped feature styles added. Website access, DNS, checkout and account settings are unchanged.

This combined review now includes the reviewed collector-details from PR #3 and public Artist CV section from PR #4, alongside the Pinterest and social-link changes. Their original review branches remain separate records; no production merge or publication is performed by preparing this combined preview.

## Validation and release

Run node tests/site.cjs and node tests/pinterest.cjs. The script tests make no Pinterest requests and cover refusal, explicit/saved consent, revocation, cross-tab changes, privacy signals, unavailable storage, page/domain restrictions and duplicate initialization.

Publication requires separate owner authorization. After an authorized production release:

1. Confirm no Pinterest requests occur before consent.
2. Choose Allow Pinterest on an eligible page and verify one base initialization with the correct ID using Pinterest Tag Helper or Test events.
3. Confirm Decline prevents new requests after navigation, Privacy allows changes, and Contact/confirmation pages stay excluded.
4. Verify event receipt in the Pinterest account. A Netlify build does not prove receipt.

No live-account detection, paid campaign, audience creation or sales measurement is implied by this change.

## Official references

- https://developers.pinterest.com/docs/track-conversions/pinterest-tag/
- https://help.pinterest.com/en/business/article/install-the-base-code
- https://policy.pinterest.com/en/advertising-guidelines
- https://policy.pinterest.com/en/ad-data-terms
