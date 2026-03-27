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

    // Fetch product data for all URLs in parallel
    const results = await Promise.all(
      urls.map(async ({ id, url }) => {
        try {
          const resp = await fetch(
            `https://staging.api.rye.com/api/v1/products?url=${encodeURIComponent(url)}`,
            {
              method: "GET",
              headers: {
                "Authorization": `Basic ${process.env.RYE_API_KEY}`,
                "Content-Type": "application/json",
              },
            }
          );

          const data = await resp.json();

          if (!resp.ok || data.error) {
            return { id, success: false, error: data.error || "Failed to fetch" };
          }

          // Normalize the response
          const price = data.price?.amountSubunits
            ? data.price.amountSubunits / 100
            : data.price?.value || null;

          const image = data.images?.find(i => i.isFeatured)?.url
            || data.images?.[0]?.url
            || null;

          return {
            id,
            success: true,
            name: data.name || data.title,
            brand: data.brand || data.vendor,
            price,
            priceDisplay: data.price?.displayValue || (price ? `$${price.toFixed(2)}` : null),
            image,
            isAvailable: data.isPurchasable !== false,
            url,
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
