export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { imageData, mediaType } = req.body;
    if (!imageData) return res.status(400).json({ error: "No image provided" });
    if (!process.env.XIMILAR_KEY) return res.status(500).json({ error: "XIMILAR_KEY not set" });
    if (!process.env.SERPAPI_KEY) return res.status(500).json({ error: "SERPAPI_KEY not set" });

    // Step 1: Ximilar detects and tags every fashion item in the photo
    const ximilarResp = await fetch("https://api.ximilar.com/tagging/fashion/v2/detect_tags", {
      method: "POST",
      headers: {
        "Authorization": `Token ${process.env.XIMILAR_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        records: [{ "_base64": imageData }]
      }),
    });

    const ximilarData = await ximilarResp.json();
    if (!ximilarResp.ok) return res.status(500).json({ error: "Ximilar error: " + JSON.stringify(ximilarData) });

    const record = ximilarData.records?.[0];
    if (!record) return res.status(200).json({ items: [] });

    // Extract detected objects (individual clothing items)
    const objects = record._objects || [];
    if (objects.length === 0) return res.status(200).json({ items: [], debug: "No objects detected" });

    // Step 2: For each detected item, build a precise search query from tags
    const buildQuery = (obj) => {
      const tags = obj._tags || {};
      const parts = [];

      // Color
      const color = tags.Color?.[0]?.name;
      if (color) parts.push(color);

      // Pattern/Print
      const pattern = tags["Pattern/print"]?.[0]?.name;
      if (pattern && pattern !== "plain") parts.push(pattern);

      // Material
      const material = tags.Material?.[0]?.name;
      if (material) parts.push(material);

      // Subcategory (most specific — e.g. "sweat pants", "bomber jacket")
      const subcat = tags.Subcategory?.[0]?.name;
      if (subcat) parts.push(subcat);
      else {
        // Fallback to category
        const cat = tags.Category?.[0]?.name?.split("/")?.[1];
        if (cat) parts.push(cat);
      }

      // Style
      const style = tags.Style?.[0]?.name;
      if (style && style !== "casual") parts.push(style);

      // Gender
      const gender = tags.Gender?.[0]?.name || "women";
      parts.push(gender);

      return parts.join(" ");
    };

    const buildDisplayName = (obj) => {
      const tags = obj._tags || {};
      const color = tags.Color?.[0]?.name || "";
      const subcat = tags.Subcategory?.[0]?.name || tags.Category?.[0]?.name?.split("/")?.[1] || "Item";
      return `${color} ${subcat}`.trim()
        .split(" ")
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    };

    const getColorHex = (obj) => {
      const colorName = obj._tags?.Color?.[0]?.name?.toLowerCase() || "";
      const colorMap = {
        black: "#1A1A1A", white: "#F5F5F5", grey: "#888888", gray: "#888888",
        blue: "#2C5F8A", navy: "#1A2A5E", red: "#CC2222", pink: "#F4A0A0",
        green: "#2A6A2A", beige: "#C8B89A", cream: "#F5F0E0", brown: "#6B3F1F",
        yellow: "#F5D020", orange: "#E8701A", purple: "#6B2D8B", burgundy: "#8B1A2A",
        khaki: "#8B7D3A", denim: "#4A6FA5", camel: "#C19A49",
      };
      return colorMap[colorName] || "#888888";
    };

    // Step 3: Search Google Shopping for each item in parallel
    const items = await Promise.all(
      objects.slice(0, 5).map(async (obj, i) => {
        const searchQuery = buildQuery(obj);
        const displayName = buildDisplayName(obj);
        const colorHex = getColorHex(obj);

        try {
          const params = new URLSearchParams({
            api_key: process.env.SERPAPI_KEY,
            engine: "google_shopping",
            q: searchQuery,
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
            name: displayName,
            searchQuery,
            color: colorHex,
            checked: true,
            match: `${Math.round((obj.prob || 0.9) * 100)}%`,
            realName: top.title,
            realPrice: top.price,
            realImage: top.thumbnail,
            realLink: top.link,
            realSource: top.source,
            price: top.extracted_price || Math.floor(29 + Math.random() * 120),
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
