import { handleWebhook } from "@/lib/commerce";
import { ready } from "@/lib/db";
import { bad, json } from "@/lib/http";

export async function POST(req: Request) {
  await ready();
  const raw = await req.text();
  const result = await handleWebhook(raw, req.headers.get("x-razorpay-signature"));
  if ("error" in result && result.error) return bad(result.error, 400);
  return json({ ok: true });
}
