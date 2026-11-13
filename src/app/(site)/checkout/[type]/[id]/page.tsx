"use client";

import { FormEvent, useState } from "react";
import { useParams, useRouter } from "next/navigation";

declare global { interface Window { Razorpay?: any } }

export default function CheckoutPage() {
  const params = useParams<{ type: string; id: string }>();
  const router = useRouter();
  const [coupon, setCoupon] = useState("");
  const [quote, setQuote] = useState<any>(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const type = params.type === "test_series" ? "test_series" : "batch";

  async function call(body: Record<string, unknown>) {
    const res = await fetch("/api/checkout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ type, itemId: params.id, coupon, ...body }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Checkout failed");
    return data;
  }

  async function onQuote(event: FormEvent) {
    event.preventDefault();
    setError("");
    try { setQuote(await call({ action: "quote" })); } catch (err) { setError(err instanceof Error ? err.message : "Could not apply coupon"); }
  }

  async function pay() {
    setError(""); setInfo("");
    try {
      const data = await call({ action: "create" });
      if (data.mode === "free") { router.push("/student/my-purchases"); return; }
      if (data.mode === "demo") {
        setInfo("Demo checkout is active because Razorpay keys are not configured. No real money is collected. Confirming on the server…");
        await call({ action: "verify-demo", paymentId: data.paymentId, demoToken: data.demoToken });
        router.push("/student/my-purchases");
        return;
      }
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Razorpay could not load"));
        document.body.appendChild(script);
      });
      const checkout = new window.Razorpay({
        key: data.keyId, amount: data.amount, currency: "INR", name: "AJ Classes", description: data.description, order_id: data.orderId,
        handler: async (response: any) => {
          await call({ action: "verify-razorpay", paymentId: data.paymentId, orderId: response.razorpay_order_id, razorpayPaymentId: response.razorpay_payment_id, signature: response.razorpay_signature });
          router.push("/student/my-purchases");
        },
      });
      checkout.open();
    } catch (err) { setError(err instanceof Error ? err.message : "Payment failed"); }
  }

  return (
    <section className="container-aj max-w-xl py-16">
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-orange">Checkout</p>
      <h1 className="font-display text-4xl text-navy">Confirm your purchase</h1>
      <form onSubmit={onQuote} className="mt-6 flex gap-2"><input value={coupon} onChange={(event) => setCoupon(event.target.value)} placeholder="Coupon code" className="field" /><button className="btn-line">Apply</button></form>
      {quote ? <p className="mt-4 font-semibold">Payable ₹{Number(quote.amount / 100).toFixed(2)} {quote.discount ? `(discount ₹${(quote.discount / 100).toFixed(2)})` : ""}</p> : null}
      {error ? <p className="mt-4 text-sm font-semibold text-red-700">{error}</p> : null}
      {info ? <p className="mt-4 text-sm font-semibold text-navy">{info}</p> : null}
      <button onClick={pay} className="btn-orange mt-6">Buy Now</button>
    </section>
  );
}
