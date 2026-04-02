export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { items, buyer } = req.body;
    if (!items || !buyer) return res.status(400).json({ error: "Missing items or buyer info" });
    if (!process.env.RYE_API_KEY) return res.status(500).json({ error: "RYE_API_KEY not set" });

    const RYE_BASE = process.env.RYE_ENV === "staging"
      ? "https://staging.api.rye.com"
      : "https://api.rye.com";
    const RYE_ENDPOINT = `${RYE_BASE}/api/v1/checkout-intents`;

    const results = await Promise.all(
      items.map(async (item) => {
        try {
          const resp = await fetch(RYE_ENDPOINT, {
            method: "POST",
            headers: {
              "Authorization": `Basic ${process.env.RYE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
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
              productUrl: item.link || item.url,
              quantity: "1",
            }),
          });

          let data = {};
          try {
            const ct = resp.headers.get("content-type") || "";
            if (ct.includes("application/json")) data = await resp.json();
          } catch { }

          if (!resp.ok) {
            return { item: item.name, status: "failed", error: data.message || `HTTP ${resp.status}` };
          }

          return {
            item: item.name,
            brand: item.brand,
            price: item.price,
            status: "created",
            checkoutIntentId: data.id,
            checkoutUrl: data.checkoutUrl,
          };
        } catch (err) {
          return { item: item.name, status: "failed", error: err.message };
        }
      })
    );

    const succeeded = results.filter(r => r.status === "created");
    const failed = results.filter(r => r.status === "failed");

    return res.status(200).json({
      success: true,
      total: results.length,
      succeeded: succeeded.length,
      failed: failed.length,
      orders: results,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
