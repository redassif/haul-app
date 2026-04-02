export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { message, history, catalog } = req.body;
    if (!message) return res.status(400).json({ error: "No message provided" });

    const systemPrompt = `You are a personal AI shopping assistant for Haul — a shoppable fashion platform where verified creators post outfit haul videos.

Your job is to help users find items from the creator haul catalog below. When a user describes what they want, find the best matching items from the catalog and recommend them.

HAUL CATALOG:
${JSON.stringify(catalog, null, 2)}

Rules:
- Always respond in a friendly, fashion-forward tone
- When recommending items, ALWAYS include their exact id, name, brand, price, and color from the catalog
- If the user asks for something not in the catalog, suggest the closest match and explain why
- Keep responses concise and conversational — max 3 sentences before showing items
- If no items match, be honest and suggest what they could look for
- Format item recommendations as JSON at the END of your response like this:
ITEMS: [{"id": 1, "name": "...", "brand": "...", "price": 89.99, "color": "#8B7355", "creator": "...", "haul": "..."}]
- Only include ITEMS: JSON when you have actual product recommendations
- Always mention which creator wore the item`;

    const messages = [
      ...(history || []),
      { role: "user", content: message }
    ];

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: systemPrompt,
        messages,
      }),
    });

    let data;
    try {
      const ct = resp.headers.get("content-type") || "";
      if (!ct.includes("application/json")) throw new Error("Non-JSON from Anthropic");
      data = await resp.json();
    } catch (e) {
      return res.status(500).json({ error: "AI parse error: " + e.message });
    }
    if (!resp.ok) return res.status(500).json({ error: data.error?.message || "AI error" });

    const fullText = data.content[0].text;

    // Extract items JSON if present
    let items = [];
    let text = fullText;
    const itemsMatch = fullText.match(/ITEMS:\s*(\[[\s\S]*?\])/);
    if (itemsMatch) {
      try {
        items = JSON.parse(itemsMatch[1]);
        text = fullText.replace(/ITEMS:\s*\[[\s\S]*?\]/, "").trim();
      } catch { }
    }

    return res.status(200).json({ text, items });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
