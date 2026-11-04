# Privacy foundation review

Prepared November 2, 2026 against main `84d00390e61d43cdaeb32a2c082ea5fcf467bf51`.
This is a review draft. Production publication requires the owner's separate approval.

## Changes

- Expand the notice to cover the studio operator, inquiry fields, Netlify Forms, Gmail, hosting analytics, service providers, retention, request handling and external profile links.
- Put a linked inquiry disclosure beside the submit button. Preserve the native form, required fields, honeypot, limits and confirmation route.
- Keep existing Pinterest consent, revocation and browser-signal handling. Also suppress the tag on URLs with any query string or fragment, including artwork and campaign links; this intentionally reduces Pinterest measurement on those visits. Server-side hosting analytics are separate.
- Publish an explicit set of 25 website files into `dist/`. Internal review packages, inventory CSVs, notes, test code, dependency files and the repository itself are not hosting output. This does not erase public GitHub files, Git history or prior deployments.
- Add anti-framing, MIME, referrer, form-target and device-permission headers. Block advertising script, beacon and connection origins on Contact, Privacy and confirmation routes. These policies do not constitute a full strict script CSP on every page; inline hosting UI remains permitted on protected routes.
- Add footer clearance and a generous privacy-link tap target for the hosting badge.

## Validation

- `node tests/site.cjs`: 53 page, asset and catalog checks, plus existing assertions.
- `node tests/pinterest.cjs`: 15 behavior and integration cases; no live advertising calls.
- `node tests/privacy.cjs`: 191 output, image-preservation, navigation and protected-route checks, including synthetic unreferenced private files.
- `node scripts/build.cjs`: 25 public files. All nine artwork images match the approved source bytes.

Preview header delivery and browser interaction checks must be recorded with the pull request once the deploy preview is available. A successful build does not prove inquiry-email delivery or Pinterest event receipt.

## Operational release checks

The website cannot establish whether Netlify, GitHub and the studio Google account have MFA, suitable recovery methods or restricted collaborators. Those account controls need an owner check. Inquiry retention and deletion must cover both Netlify and Gmail, exports and other studio copies. No existing customer record, account permission or password was changed by this draft. No marketing subscription, product, checkout or payment change is included.

## Primary references

- https://www.ftc.gov/business-guidance/resources/protecting-personal-information-guide-business
- https://www.ftc.gov/business-guidance/resources/start-security-guide-business
- https://docs.netlify.com/manage/forms/submissions/
- https://docs.netlify.com/manage/monitoring/web-analytics/how-web-analytics-works/
- https://docs.netlify.com/manage/routing/headers/
- https://docs.netlify.com/manage/projects/powered-by-netlify-badge/
- https://policy.pinterest.com/en/ad-data-terms

The FTC guidance calls for minimizing data, limiting access, retaining it only for a business need and planning incident response. Pinterest terms require notice and legally required consent for advertising data. Applicability of individual legal regimes and account configurations has not been certified by this technical review. The current Pinterest terms announce an update effective November 12, 2026; check the terms in force when practices change.
