import { getSession } from "@/lib/auth";
import { createCheckout, quoteProduct, verifyDemo, verifyRazorpay } from "@/lib/commerce";
import { ready } from "@/lib/db";
import { bad, json, originBlock } from "@/lib/http";

export async function POST(req: Request) {
  const blocked = originBlock(req);
  if (blocked) return blocked;
  await ready();
  const session = await getSession();
  if (!session || session.role !== "student") return bad("Sign in as a student to continue.", 401);
  if (!session.emailVerified) return bad("Verify your email before purchasing.");
  const body = await req.json().catch(() => ({}));
  const type = body.type === "test_series" ? "test_series" : "batch";
  const itemId = String(body.itemId || "");
  const coupon = body.coupon ? String(body.coupon) : undefined;
  if (body.action === "quote") {
    const quote = await quoteProduct(type, itemId, session.id, coupon);
    if ("error" in quote && quote.error) return bad(quote.error);
    return json({ amount: quote.payable, discount: quote.discount, list: quote.product.price_paise, title: type === "batch" ? quote.product.name : quote.product.title });
  }
  if (body.action === "verify-demo") {
    const result = await verifyDemo(String(body.paymentId || ""), String(body.demoToken || ""), session.id);
    if ("error" in result && result.error) return bad(result.error);
    return json({ ok: true });
  }
  if (body.action === "verify-razorpay") {
    const result = await verifyRazorpay(String(body.paymentId || ""), String(body.orderId || ""), String(body.razorpayPaymentId || ""), String(body.signature || ""));
    if ("error" in result && result.error) return bad(result.error);
    return json({ ok: true });
  }
  const created = await createCheckout(session.id, type, itemId, coupon);
  if ("error" in created && created.error) return bad(created.error);
  return json(created);
}
