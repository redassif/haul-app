import CheckoutIntents from 'checkout-intents';

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { items, buyer, stripeToken } = req.body;
    if (!items || !buyer) return res.status(400).json({ error: "Missing items or buyer info" });
    if (!process.env.RYE_API_KEY) return res.status(500).json({ error: "RYE_API_KEY not set" });

    // SDK auto-routes to staging or prod based on key prefix (RYE/staging- vs RYE/production-)
    const client = new CheckoutIntents({
      apiKey: process.env.RYE_API_KEY,
    });

    const results = await Promise.all(
      items.map(async (item) => {
        try {
          // Phase 1: Create intent and poll until offer is ready
          const intent = await client.checkoutIntents.createAndPoll({
            productUrl: item.link || item.url,
            quantity: 1,
            buyer: {
              firstName: buyer.firstName,
              lastName: buyer.lastName,
              email: buyer.email,
              phone: buyer.phone,
              address1: buyer.address1,
              address2: buyer.address2 || "",
              city: buyer.city,
              province: buyer.province,
              postalCode: buyer.postalCode,
              country: buyer.country || "US",
            },
          });

          if (intent.state === "failed") {
            return {
              item: item.name,
              status: "failed",
              error: intent.failureReason?.message || "Intent failed",
            };
          }

          // If no stripe token provided, return the offer for review
          if (!stripeToken) {
            return {
              item: item.name,
              status: "awaiting_payment",
              intentId: intent.id,
              offer: intent.offer,
            };
          }

          // Phase 2: Confirm with payment and poll until completed
          const completed = await client.checkoutIntents.confirmAndPoll(intent.id, {
            paymentMethod: {
              type: "stripe_token",
              stripeToken,
            },
          });

          return {
            item: item.name,
            brand: item.brand,
            price: item.price,
            status: completed.state,
            intentId: completed.id,
            failureReason: completed.failureReason || null,
          };

        } catch (err) {
          return { item: item.name, status: "failed", error: err.message };
        }
      })
    );

    const succeeded = results.filter(r => r.status === "completed");
    const failed = results.filter(r => r.status === "failed");
    const awaitingPayment = results.filter(r => r.status === "awaiting_payment");

    return res.status(200).json({
      success: true,
      total: results.length,
      succeeded: succeeded.length,
      failed: failed.length,
      awaitingPayment: awaitingPayment.length,
      orders: results,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
