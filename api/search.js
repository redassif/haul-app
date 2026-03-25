export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "No query provided" });

    const params = new URLSearchParams({
      api_key: process.env.SERPAPI_KEY,
      engine: "google_shopping",
      q: query,
      num: 5,
      gl: "us",
      hl: "en",
    });

    const response = await fetch(`https://serpapi.com/search?${params}`);
    const data = await response.json();

    if (!response.ok) return res.status(500).json({ error: "Search failed" });

    const results = (data.shopping_results || []).slice(0, 4).map(item => ({
      title: item.title,
      price: item.price,
      source: item.source,
      link: item.link,
      image: item.thumbnail,
      rating: item.rating,
    }));

    return res.status(200).json({ results });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Search failed" });
  }
}
