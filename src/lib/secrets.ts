import fs from "fs";
import path from "path";
import { randomBytes } from "crypto";

type Integrations = {
  razorpayKeyId: string;
  razorpayKeySecret: string;
  razorpayWebhookSecret: string;
  googleClientId: string;
  googleClientSecret: string;
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPassword: string;
  emailFrom: string;
};

const empty: Integrations = {
  razorpayKeyId: "",
  razorpayKeySecret: "",
  razorpayWebhookSecret: "",
  googleClientId: "",
  googleClientSecret: "",
  smtpHost: "",
  smtpPort: "587",
  smtpUser: "",
  smtpPassword: "",
  emailFrom: "info@ajclasses.com",
};

function filePath() {
  return path.join(process.cwd(), "storage", "private", "integrations.json");
}

let ephemeralSecret: string | undefined;

export function authSecret() {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
  if (process.env.VERCEL) {
    ephemeralSecret ??= randomBytes(32).toString("hex");
    return ephemeralSecret;
  }
  const file = path.join(process.cwd(), "data", "auth-secret");
  if (fs.existsSync(file)) return fs.readFileSync(file, "utf8").trim();
  const secret = randomBytes(32).toString("hex");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, secret, { mode: 0o600 });
  return secret;
}

export function readIntegrations(): Integrations {
  let stored: Partial<Integrations> = {};
  const file = filePath();
  if (fs.existsSync(file)) {
    try {
      stored = JSON.parse(fs.readFileSync(file, "utf8"));
    } catch {
      stored = {};
    }
  }
  return {
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || stored.razorpayKeyId || "",
    razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || stored.razorpayKeySecret || "",
    razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || stored.razorpayWebhookSecret || "",
    googleClientId: process.env.GOOGLE_CLIENT_ID || stored.googleClientId || "",
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || stored.googleClientSecret || "",
    smtpHost: process.env.SMTP_HOST || stored.smtpHost || "",
    smtpPort: process.env.SMTP_PORT || stored.smtpPort || "587",
    smtpUser: process.env.SMTP_USER || stored.smtpUser || "",
    smtpPassword: process.env.SMTP_PASSWORD || stored.smtpPassword || "",
    emailFrom: process.env.EMAIL_FROM || stored.emailFrom || "info@ajclasses.com",
  };
}

export function writeIntegrations(next: Partial<Integrations>) {
  const current = readIntegrations();
  const merged = { ...empty, ...current, ...stripEnvOverrides(next) };
  fs.mkdirSync(path.dirname(filePath()), { recursive: true });
  fs.writeFileSync(filePath(), JSON.stringify(merged, null, 2), { mode: 0o600 });
  return readIntegrations();
}

function stripEnvOverrides(next: Partial<Integrations>) {
  const copy = { ...next };
  if (process.env.RAZORPAY_KEY_ID) delete copy.razorpayKeyId;
  if (process.env.RAZORPAY_KEY_SECRET) delete copy.razorpayKeySecret;
  if (process.env.RAZORPAY_WEBHOOK_SECRET) delete copy.razorpayWebhookSecret;
  if (process.env.GOOGLE_CLIENT_ID) delete copy.googleClientId;
  if (process.env.GOOGLE_CLIENT_SECRET) delete copy.googleClientSecret;
  if (process.env.SMTP_HOST) delete copy.smtpHost;
  if (process.env.SMTP_PORT) delete copy.smtpPort;
  if (process.env.SMTP_USER) delete copy.smtpUser;
  if (process.env.SMTP_PASSWORD) delete copy.smtpPassword;
  if (process.env.EMAIL_FROM) delete copy.emailFrom;
  return copy;
}

export function publicIntegrations() {
  const cfg = readIntegrations();
  const mask = (value: string) => (value ? `••••${value.slice(-4)}` : "");
  return {
    razorpay: Boolean(cfg.razorpayKeyId && cfg.razorpayKeySecret),
    google: Boolean(cfg.googleClientId && cfg.googleClientSecret),
    smtp: Boolean(cfg.smtpHost && cfg.smtpUser),
    emailFrom: cfg.emailFrom,
    razorpayKeyId: cfg.razorpayKeyId,
    googleClientId: cfg.googleClientId,
    smtpHost: cfg.smtpHost,
    smtpPort: cfg.smtpPort,
    smtpUser: cfg.smtpUser,
    maskedSecret: mask(cfg.razorpayKeySecret),
    maskedWebhook: mask(cfg.razorpayWebhookSecret),
    maskedGoogleSecret: mask(cfg.googleClientSecret),
    maskedSmtp: mask(cfg.smtpPassword),
  };
}

export function razorpayReady() {
  const cfg = readIntegrations();
  return Boolean(cfg.razorpayKeyId && cfg.razorpayKeySecret);
}

export function demoCheckoutAllowed() {
  if (process.env.ALLOW_DEMO_CHECKOUT === "false") return false;
  if (process.env.ALLOW_DEMO_CHECKOUT === "true") return true;
  return process.env.NODE_ENV !== "production" && !razorpayReady();
}
