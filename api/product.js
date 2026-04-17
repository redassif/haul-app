import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { urls } = req.body;
    if (!urls || !urls.length) return res.status(400).json({ error: "No URLs provided" });
    if (!process.env.RYE_API_KEY) return res.status(500).json({ error: "RYE_API_KEY not set" });

    const RYE_BASE = "https://api.rye.com";

    const results = await Promise.all(
      urls.map(async ({ id, url }) => {
        try {
          const resp = await fetch(
            `${RYE_BASE}/api/v1/products/lookup?url=${encodeURIComponent(url)}`,
            {
              method: "GET",
              headers: {
                "Authorization": `Bearer ${process.env.RYE_API_KEY}`,
              },
            }
          );

          const text = await resp.text();
          if (!resp.ok) {
            return { id, success: false, error: `HTTP ${resp.status}` };
          }

          const contentType = resp.headers.get("content-type") || "";
          if (!contentType.includes("application/json")) {
            return { id, success: false, error: "Non-JSON response from Rye" };
          }

          let data;
          try {
            data = JSON.parse(text);
          } catch {
            return { id, success: false, error: "Invalid JSON from Rye" };
          }

          let price = null;
          let priceDisplay = null;

          if (data.price != null) {
            if (typeof data.price === "number") {
              price = data.price;
            } else if (data.price.amountSubunits > 0) {
              price = data.price.amountSubunits / 100;
            } else if (data.price.value > 0) {
              price = data.price.value;
            } else if (data.price.amount > 0) {
              price = data.price.amount;
            }
            priceDisplay = data.price.displayValue || data.price.formatted || null;
          }

          if (!priceDisplay && price) priceDisplay = `$${price.toFixed(2)}`;

          const image = data.images?.find(i => i.isFeatured)?.url
            || data.images?.[0]?.url
            || null;

          return {
            id,
            success: true,
            name: data.name || data.title,
            brand: data.brand || data.vendor,
            price,
            priceDisplay,
            image,
            isAvailable: data.isPurchasable !== false,
          };
        } catch (err) {
          return { id, success: false, error: err.message };
        }
      })
    );

    // If Supabase service key is available, update haul_items in DB directly
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
      try {
        const supabaseAdmin = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_SERVICE_KEY
        );

        await Promise.all(
          results
            .filter(p => p.success && p.price)
            .map(p => supabaseAdmin
              .from("haul_items")
              .update({
                ...(p.name && { name: p.name }),
                ...(p.brand && { brand: p.brand }),
                ...(p.price && { price: p.price }),
              })
              .eq("id", p.id)
            )
        );
      } catch (dbErr) {
        console.error("DB update failed:", dbErr.message);
        // Don't throw — still return the price data to the frontend
      }
    }

    return res.status(200).json({ products: results });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
