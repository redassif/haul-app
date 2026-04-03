export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { items, buyer } = req.body;
    if (!items || !buyer) return res.status(400).json({ error: "Missing items or buyer info" });

    // Simulate successful order for each item
    const orders = items.map(item => ({
      item: item.name,
      brand: item.brand,
      price: item.price,
      status: "created",
    }));

    return res.status(200).json({
      success: true,
      total: orders.length,
      succeeded: orders.length,
      failed: 0,
      orders,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
