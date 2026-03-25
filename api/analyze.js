export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
 
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
 
  try {
    const { imageData, mediaType } = req.body;
 
    if (!imageData) return res.status(400).json({ error: "No image provided" });
 
    const response = await fetch("https://api.anthropic.com/v1/messages", {
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
              text: `You are a fashion AI for a shopping app. Analyze this outfit image and identify every visible clothing item and accessory.
 
Return ONLY a valid JSON array, no other text, no markdown, no backticks. Each item should have:
- name: specific item name (e.g. "Oversized Beige Blazer")
- brand: most likely brand (e.g. "Zara", "H&M", "ASOS", "Nike", "Levi's", "Mango", "Shein", "Urban Outfitters")
- price: realistic retail price as a number (no $ sign)
- color: hex color code of the item
 
Identify between 2 and 6 items. Only include clearly visible clothing pieces and accessories.`,
            },
          ],
        }],
      }),
    });
 
    const data = await response.json();
 
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || "API error" });
    }
 
    const text = data.content[0].text.trim();
    const items = JSON.parse(text);
    return res.status(200).json({ items });
 
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to analyze image" });
  }
}