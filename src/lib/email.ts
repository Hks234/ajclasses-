import nodemailer from "nodemailer";
import { insert, one, run } from "./db";
import { readIntegrations } from "./secrets";
import { id, now, renderTemplate } from "./utils";

export async function queueTemplate(templateKey: string, to: string, vars: Record<string, string>, subjectOverride?: string) {
  const template = await one<any>("SELECT * FROM email_templates WHERE template_key = ?", [templateKey]);
  const subject = renderTemplate(subjectOverride || template?.subject || "AJ Classes", vars);
  const body = renderTemplate(template?.body_html || "<p>{{message}}</p>", vars);
  await insert("email_queue", {
    id: id(),
    to_email: to,
    subject,
    body_html: body,
    status: "pending",
    attempts: 0,
    last_error: null,
    created_at: now(),
    sent_at: null,
  });
}

export async function deliverPending(limit = 5) {
  const rows = await import("./db").then((db) => db.all<any>("SELECT * FROM email_queue WHERE status = 'pending' ORDER BY created_at LIMIT ?", [limit]));
  for (const row of rows) await deliver(row);
}

export async function deliver(row: any) {
  const cfg = readIntegrations();
  if (!cfg.smtpHost || !cfg.smtpUser) {
    await run("UPDATE email_queue SET status = 'held', attempts = attempts + 1, last_error = ? WHERE id = ?", ["SMTP is not configured", row.id]);
    return;
  }
  try {
    const transport = nodemailer.createTransport({
      host: cfg.smtpHost,
      port: Number(cfg.smtpPort || 587),
      secure: Number(cfg.smtpPort) === 465,
      auth: { user: cfg.smtpUser, pass: cfg.smtpPassword },
    });
    await transport.sendMail({
      from: cfg.emailFrom || "info@ajclasses.com",
      to: row.to_email,
      subject: row.subject,
      html: row.body_html,
    });
    await run("UPDATE email_queue SET status = 'sent', sent_at = ?, last_error = NULL WHERE id = ?", [now(), row.id]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Email failed";
    const attempts = Number(row.attempts || 0) + 1;
    await run("UPDATE email_queue SET status = ?, attempts = ?, last_error = ? WHERE id = ?", [attempts >= 4 ? "failed" : "pending", attempts, message.slice(0, 500), row.id]);
  }
}
