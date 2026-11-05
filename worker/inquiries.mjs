// Inquiry contents are private D1 data. No HTTP read/admin endpoint is exposed.
export const STUDIO_EMAIL = 'urielalexanderstudio@gmail.com';
export const SENDER_EMAIL = 'inquiries@urielalexanderstudio.com';
const RETRY_DELAYS = [60, 300, 1800, 7200, 43200];
const MAX_ATTEMPTS = RETRY_DELAYS.length;

export async function inquiryFingerprint(fields) {
  const bytes = new TextEncoder().encode(JSON.stringify([fields.name, fields.email, fields.topic, fields.message]));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), x => x.toString(16).padStart(2,'0')).join('');
}

export async function saveInquiry(db, fields, id, now = Math.floor(Date.now()/1000)) {
  const fingerprint = await inquiryFingerprint(fields);
  await db.prepare(`INSERT INTO studio_inquiries
    (id,created_at,name,email,topic,message,fingerprint,next_attempt_at)
    VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING`)
    .bind(id,now,fields.name,fields.email,fields.topic,fields.message,fingerprint,now).run();
  const saved = await db.prepare('SELECT id,fingerprint FROM studio_inquiries WHERE id=?').bind(id).first();
  if (!saved) throw new Error('inquiry storage unavailable');
  return {id:saved.id, conflict:saved.fingerprint!==fingerprint};
}

export function notificationFor(row) {
  // Recipient and sender are fixed. Visitor input never selects a recipient.
  return {
    to:STUDIO_EMAIL,
    from:{email:SENDER_EMAIL,name:'Uriel Alexander Art Studio'},
    replyTo:row.email,
    subject:`Studio inquiry: ${row.topic} [${row.id}]`,
    text:`A website inquiry was saved privately in Cloudflare.\n\nInquiry ID: ${row.id}\nReceived (UTC): ${new Date(row.created_at*1000).toISOString()}\nName: ${row.name}\nEmail: ${row.email}\nTopic: ${row.topic}\n\nMessage:\n${row.message}\n\nReply to this email to contact the sender. Repeated notifications with the same inquiry ID refer to the same stored inquiry.\n`
  };
}

export async function notifyInquiry(env, id, now = Math.floor(Date.now()/1000)) {
  // An atomic lease prevents the HTTP and scheduled handlers sending together.
  const claimed = await env.INQUIRIES_DB.prepare(`UPDATE studio_inquiries
    SET notification_status='sending',notification_attempts=notification_attempts+1,lease_until=?
    WHERE id=? AND notification_attempts<? AND next_attempt_at<=?
      AND (notification_status IN ('pending','failed') OR (notification_status='sending' AND lease_until<?))`)
    .bind(now+120,id,MAX_ATTEMPTS,now,now).run();
  if (!claimed.meta?.changes) return false;
  const row = await env.INQUIRIES_DB.prepare('SELECT * FROM studio_inquiries WHERE id=?').bind(id).first();
  if (!row) return false;
  try {
    const sent = await env.INQUIRY_EMAIL.send(notificationFor(row));
    if (!sent?.messageId) throw new Error('email delivery not acknowledged');
    await env.INQUIRIES_DB.prepare(`UPDATE studio_inquiries SET notification_status='sent',
      notification_id=?,notified_at=?,lease_until=0 WHERE id=?`)
      .bind(sent.messageId,now,id).run();
    return true;
  } catch {
    // Keep the inquiry. Do not log provider errors, addresses or message bodies.
    await env.INQUIRIES_DB.prepare(`UPDATE studio_inquiries SET notification_status='failed',
      next_attempt_at=?,lease_until=0 WHERE id=?`)
      .bind(now+RETRY_DELAYS[Math.min(row.notification_attempts-1,RETRY_DELAYS.length-1)],id).run();
    return false;
  }
}

export async function retryNotifications(env, now = Math.floor(Date.now()/1000)) {
  if (env.INQUIRIES_ENABLED!=='true' || !env.INQUIRIES_DB?.prepare || !env.INQUIRY_EMAIL?.send) return;
  const pending = await env.INQUIRIES_DB.prepare(`SELECT id FROM studio_inquiries
    WHERE notification_attempts<? AND next_attempt_at<=?
      AND (notification_status IN ('pending','failed') OR (notification_status='sending' AND lease_until<?))
    ORDER BY next_attempt_at LIMIT 20`).bind(MAX_ATTEMPTS,now,now).all();
  for (const row of pending.results || []) await notifyInquiry(env,row.id,now);
}
