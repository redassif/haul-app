export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { imageData, mediaType } = req.body;
    if (!imageData) return res.status(400).json({ error: "No image provided" });

    // Check env vars
    if (!process.env.IMGBB_KEY) return res.status(500).json({ error: "IMGBB_KEY not set in environment variables" });
    if (!process.env.SERPAPI_KEY) return res.status(500).json({ error: "SERPAPI_KEY not set in environment variables" });

    // Step 1: Upload image to imgbb
    const imgbbForm = new URLSearchParams();
    imgbbForm.append("key", process.env.IMGBB_KEY);
    imgbbForm.append("image", imageData);

    const imgbbResp = await fetch("https://api.imgbb.com/1/upload", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: imgbbForm.toString(),
    });

    const imgbbData = await imgbbResp.json();
    if (!imgbbData.success) return res.status(500).json({ error: "imgbb upload failed: " + JSON.stringify(imgbbData) });

    const imageUrl = imgbbData.data.url;

    // Step 2: Google Lens via SerpAPI
    const params = new URLSearchParams({
      api_key: process.env.SERPAPI_KEY,
      engine: "google_lens",
      url: imageUrl,
    });

    const lensResp = await fetch(`https://serpapi.com/search?${params}`);
    const lensData = await lensResp.json();

    if (lensData.error) return res.status(500).json({ error: "SerpAPI error: " + lensData.error });

    const visualMatches = lensData.visual_matches || [];
    if (visualMatches.length === 0) return res.status(200).json({ items: [], debug: "No visual matches returned" });

    const items = visualMatches.slice(0, 6).map((match, i) => ({
      id: Date.now() + i,
      name: match.title || `Item ${i + 1}`,
      brand: match.source || "Various",
      price: match.price?.extracted_value || Math.floor(29 + Math.random() * 120),
      realPrice: match.price?.value || null,
      realImage: match.thumbnail || match.image,
      realLink: match.link,
      realSource: match.source,
      color: "#888888",
      checked: true,
      match: `${Math.floor(85 + Math.random() * 14)}%`,
    }));

    return res.status(200).json({ items });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
