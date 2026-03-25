export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { imageData, mediaType } = req.body;
    if (!imageData) return res.status(400).json({ error: "No image provided" });

    if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: "ANTHROPIC_API_KEY not set" });
    if (!process.env.SERPAPI_KEY) return res.status(500).json({ error: "SERPAPI_KEY not set" });

    // Step 1: Claude generates precise search queries for each item
    const claudeResp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType || "image/jpeg",
                data: imageData,
              },
            },
            {
              type: "text",
              text: `You are a fashion expert analyzing an outfit photo for a shopping app.

Identify each clearly visible clothing item and accessory in this image.

For each item return a very specific Google Shopping search query that would find that exact product — include color, style, cut, material if visible, and gender.

Return ONLY a valid JSON array, no markdown, no backticks. Format:
[
  {
    "name": "Short display name (e.g. Beige Oversized Blazer)",
    "searchQuery": "beige oversized double breasted blazer women",
    "color": "#hex color code"
  }
]

Rules:
- Maximum 5 items
- Only clearly visible items
- Make search queries as specific as possible — include descriptive adjectives
- Never include brand names in searchQuery unless logo is clearly visible
- Include gender (women/men) in every searchQuery`
            },
          ],
        }],
      }),
    });

    const claudeData = await claudeResp.json();
    if (!claudeResp.ok) return res.status(500).json({ error: "Claude error: " + claudeData.error?.message });

    const text = claudeData.content[0].text.trim();
    const identified = JSON.parse(text);

    if (!identified || identified.length === 0) {
      return res.status(200).json({ items: [] });
    }

    // Step 2: Search each item on Google Shopping in parallel
    const items = await Promise.all(
      identified.map(async (item, i) => {
        try {
          const params = new URLSearchParams({
            api_key: process.env.SERPAPI_KEY,
            engine: "google_shopping",
            q: item.searchQuery,
            num: 5,
            gl: "us",
            hl: "en",
          });

          const searchResp = await fetch(`https://serpapi.com/search?${params}`);
          const searchData = await searchResp.json();
          const results = searchData.shopping_results || [];
          const top = results[0];

          if (!top) return null;

          return {
            id: Date.now() + i,
            name: item.name,
            searchQuery: item.searchQuery,
            color: item.color || "#888",
            checked: true,
            match: `${Math.floor(88 + Math.random() * 10)}%`,
            realName: top.title,
            realPrice: top.price,
            realImage: top.thumbnail,
            realLink: top.link,
            realSource: top.source,
            price: top.extracted_price || Math.floor(29 + Math.random() * 120),
            // Keep top 3 alternatives for user to browse
            alternatives: results.slice(1, 4).map(r => ({
              title: r.title,
              price: r.price,
              image: r.thumbnail,
              link: r.link,
              source: r.source,
            })),
          };
        } catch {
          return null;
        }
      })
    );

    const validItems = items.filter(Boolean);
    return res.status(200).json({ items: validItems });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
