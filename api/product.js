export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { urls } = req.body;
    if (!urls || !urls.length) return res.status(400).json({ error: "No URLs provided" });

    const RYE_KEY = process.env.RYE_API_KEY || "RYE/staging-adcde2a158554b26b349";

    const results = await Promise.all(
      urls.map(async ({ id, url }) => {
        try {
          const resp = await fetch(
            `https://staging.api.rye.com/api/v1/products/lookup?url=${encodeURIComponent(url)}`,
            {
              method: "GET",
              headers: {
                "Authorization": `Bearer ${RYE_KEY}`,
              },
            }
          );

          const text = await resp.text();
          console.log(`Rye ${resp.status} for ${url.slice(0,50)}:`, text.slice(0, 300));

          if (!resp.ok) {
            return { id, success: false, error: `HTTP ${resp.status}: ${text.slice(0,100)}` };
          }

          const data = JSON.parse(text);

          // Rye can return price in multiple formats — try all of them
          let price = null;
          let priceDisplay = null;

          if (data.price != null) {
            if (typeof data.price === "number") {
              price = data.price;
            } else if (data.price.amountSubunits != null && data.price.amountSubunits > 0) {
              price = data.price.amountSubunits / 100;
            } else if (data.price.value != null && data.price.value > 0) {
              price = data.price.value;
            } else if (data.price.amount != null && data.price.amount > 0) {
              price = data.price.amount;
            }
            priceDisplay = data.price.displayValue || data.price.formatted || null;
          }

          // Also check top-level price fields
          if (!price && data.priceRange?.minVariantPrice?.amount) {
            price = parseFloat(data.priceRange.minVariantPrice.amount);
          }
          if (!priceDisplay && price) {
            priceDisplay = `$${price.toFixed(2)}`;
          }

          console.log("Price data:", JSON.stringify(data.price), "parsed:", price);

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

    return res.status(200).json({ products: results });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
