# Cloudflare inquiry operations

New inquiries use the existing studio website and Gmail address. Cloudflare validates each form, saves it in private D1 storage, and notifies **urielalexanderstudio@gmail.com** through a binding restricted to that recipient. No public inquiry-reading endpoint or additional administrator login is added to the website. Database access remains in the owner's authenticated Cloudflare dashboard.

## Data and delivery

- Production database: `uriel-studio-inquiries`. Preview/recovery database: `uriel-studio-inquiries-test`.
- The schema is `migrations/0001_inquiries.sql`. It contains the inquiry fields, a per-form UUID, creation time and notification status. Visitor IPs, browser cookies and authorization headers are not stored or forwarded.
- A submitted UUID can create one record. Repeating the same submission does not send a second successful notification. Reusing it for different content is rejected. Forms opened before the release without a UUID remain usable.
- Database storage must succeed before the form shows success. If email temporarily fails, the saved inquiry remains accepted and its failed notification stays in the private queue. A Cloudflare scheduled handler checks due notifications every ten minutes, with a maximum of five attempts. The atomic delivery lease also recovers interrupted work. A lost email acknowledgment can result in a repeated notification; the fixed inquiry ID identifies the same saved record.
- Only the fixed studio address receives notifications. Reply-To contains the validated sender address. No automatic customer receipt, marketing subscription or message to another recipient is enabled.
- No inquiry contents or raw provider errors are written to application logs. The existing rate limit, honeypot, body/field/origin validation and restrictive browser protections remain in place.
- Earlier Netlify submissions and notifications remain historical records. This implementation does not delete or migrate them.

## Owner inbox and private log

Continue checking studio Gmail. For the backup log, open Cloudflare **Storage & databases → D1 → uriel-studio-inquiries → Console**. The authenticated data explorer is also available there.

List recent inquiries without placing them in public code:

```sql
SELECT id, datetime(created_at,'unixepoch') AS received_utc,
       name, email, topic, notification_status, notification_attempts
FROM studio_inquiries ORDER BY created_at DESC LIMIT 50;
```

Read a particular message by its exact inquiry ID in the private Console. Review `pending`, `failed` and stale `sending` records if a notification is missing. Five exhausted attempts require operator review; storage is not erased. Before manually retrying, check Gmail for the same inquiry ID to avoid duplicate handling. The proposed retention/deletion routine remains an owner decision; no automated record deletion is configured.

## Preview and release

The preview Worker uses `wrangler.preview.json`: a separate Worker name and database, a separate limiter namespace, no studio-domain routes and no automatic retry schedule. Its notifications use only the same verified studio Gmail. Run `node tests/cloudflare.mjs` before deployment. Do not switch the production backend until the real preview stores an inquiry, delivers its matching studio notification and passes a recovery test in the test database.

The preview Worker is `uriel-studio-inquiries-preview`. Its Cloudflare Builds production branch is `feature/cloudflare-native-inquiries-20261104`, build command is `node tests/cloudflare.mjs`, and deploy command is `npx wrangler@4.157.0 deploy --config wrangler.preview.json`. This branch selection applies only to the separate preview Worker; the public studio Worker continues to follow `main`.

The production configuration retains only the authorized root/www domains. Its reviewed main build is the release source. The Cloudflare output exposes only selected public assets; Worker source, configuration, SQL, tests and operation notes stay outside the published directory. The separate Netlify build preserves the old form blueprint for historical fallback while new Cloudflare inquiries have no Netlify runtime dependency.

## Website rollback and inquiry recovery

Cloudflare **Workers & Pages → uriel-alexander-studio → Deployments** can restore a previously deployed website version. Record the known working version before release. Restoring a website version does not rewind the D1 database or DNS/email configuration.

Cloudflare D1 Time Travel provides seven days of recovery on the current Free plan. Obtain a bookmark before a recovery operation and retain the returned undo bookmark. Restore tests belong in `uriel-studio-inquiries-test`, using synthetic records. A real production restore can overwrite newer inquiries, so first preserve the current private data and coordinate it as a separate owner action. Do not test destructive recovery on the live inquiry database.

Keep source and schema in GitHub. A website rollback can temporarily restore the older Netlify relay if necessary; preserve all D1 inquiries and handle pending notifications when returning to the native backend. No cleanup should delete the original Netlify project or historical customer correspondence without a separate retention decision.

Primary references:

- https://developers.cloudflare.com/email-service/configuration/send-bindings/
- https://developers.cloudflare.com/email-service/api/send-emails/workers-api/
- https://developers.cloudflare.com/email-service/platform/limits/
- https://developers.cloudflare.com/d1/reference/time-travel/
- https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/
