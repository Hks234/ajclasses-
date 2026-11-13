import { insert, one, ready } from "@/lib/db";
import { bad, json, originBlock } from "@/lib/http";
import { hashPassword } from "@/lib/auth";
import { id, now, passwordOk } from "@/lib/utils";
import { z } from "zod";

export async function GET() {
  await ready();
  const row = await one("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
  return json({ needsSetup: !row });
}

const schema = z.object({
  fullName: z.string().min(3).max(120),
  email: z.string().email(),
  password: z.string().min(10).max(120),
});

export async function POST(req: Request) {
  const blocked = originBlock(req);
  if (blocked) return blocked;
  await ready();
  const existing = await one("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
  if (existing) return bad("Setup is already complete.", 409);
  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) return bad("Enter a name, email and a password of at least 10 characters.");
  if (!passwordOk(body.data.password)) return bad("Use 10 or more characters with upper case, lower case and a number.");
  const stamp = now();
  const userId = id();
  await insert("users", {
    id: userId,
    email: body.data.email.toLowerCase(),
    mobile: null,
    password_hash: await hashPassword(body.data.password),
    full_name: body.data.fullName,
    role: "admin",
    status: "active",
    email_verified: 1,
    must_change_password: 1,
    google_sub: null,
    avatar_url: null,
    created_at: stamp,
    updated_at: stamp,
    deleted_at: null,
  });
  await insert("admin_users", { user_id: userId, role_id: "super_admin", last_login_at: null });
  return json({ ok: true });
}
