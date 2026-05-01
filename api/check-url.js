// api/check-url.js
// Lightweight validator the frontend hits when a creator pastes a product
// link, before the haul is submitted. Answers "will this URL work end to end?"
// without writing anything to the DB.
//
// Behaviour by retailer:
//   - Amazon → short-circuited as invalid. Rye's Amazon integration is down
//     with no ETA per their support, so calling Rye just burns a request and
//     returns a 500. We tell the creator upfront.
//   - Anything else → calls Rye REST /products/lookup; on 2xx, returns the
//     normalised product info; on any other status, returns the failure
//     reason without throwing.
//
// Response is always 200 with a structured envelope, except for two cases
// that genuinely indicate a bug on our side: missing 'url' input (400) and
// missing RYE_API_KEY env var (500). Everything else — bad URL, unreachable
// host, Rye outage, retailer not supported — is surfaced as
// { valid: false, reason } so the UI can display it inline without try/catch.

const RYE_BASE = "https://api.rye.com";

function detectRetailer(rawUrl) {
  let host;
  try {
    host = new URL(rawUrl).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
  if (/(^|\.)amazon\.[a-z.]+$/.test(host) || host === "amzn.to" || host === "a.co") {
    return "amazon";
  }
  if (host.endsWith(".myshopify.com")) {
    return "shopify";
  }
  return "generic";
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const url = req.query?.url || req.body?.url;
  if (!url) {
    return res.status(400).json({ error: "Missing 'url' parameter (in ?url= query or JSON body)" });
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return res.status(200).json({
      url, valid: false, retailer: null,
      reason: "Not a parseable URL",
    });
  }
  if (!/^https?:$/.test(parsed.protocol)) {
    return res.status(200).json({
      url, valid: false, retailer: null,
      reason: "URL must use http or https",
    });
  }

  const retailer = detectRetailer(url);

  if (retailer === "amazon") {
    return res.status(200).json({
      url, valid: false, retailer: "amazon",
      reason: "Amazon is currently unsupported (Rye integration unavailable; no ETA)",
    });
  }

  if (!process.env.RYE_API_KEY) {
    return res.status(500).json({ error: "RYE_API_KEY not set" });
  }

  const endpoint = `${RYE_BASE}/api/v1/products/lookup?url=${encodeURIComponent(url)}`;
  let resp;
  try {
    resp = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${process.env.RYE_API_KEY}` },
    });
  } catch (err) {
    return res.status(200).json({
      url, valid: false, retailer,
      reason: `Could not reach Rye: ${err.message}`,
    });
  }

  const text = await resp.text();

  if (!resp.ok) {
    const detail = text ? text.slice(0, 200).replace(/\s+/g, " ").trim() : "";
    return res.status(200).json({
      url, valid: false, retailer,
      reason: `Rye HTTP ${resp.status}${detail ? `: ${detail}` : ""}`,
    });
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return res.status(200).json({
      url, valid: false, retailer,
      reason: "Rye returned non-JSON",
    });
  }

  // Normalise price to dollars. Returns null if Rye didn't give us one —
  // we never fabricate a default since the frontend stores exactly what
  // Rye returned.
  let price = null;
  let priceDisplay = null;
  if (data.price != null) {
    if (typeof data.price === "number") price = data.price;
    else if (data.price.amountSubunits > 0) price = data.price.amountSubunits / 100;
    else if (data.price.value > 0) price = data.price.value;
    else if (data.price.amount > 0) price = data.price.amount;
    priceDisplay = data.price.displayValue || data.price.formatted || null;
  }
  if (!priceDisplay && price != null) priceDisplay = `$${price.toFixed(2)}`;

  const image =
    data.images?.find((i) => i.isFeatured)?.url ||
    data.images?.[0]?.url ||
    null;

  const resolvedRetailer = data.retailer || data.marketplace || retailer;

  return res.status(200).json({
    url,
    valid: true,
    retailer: resolvedRetailer,
    isPurchasable: data.isPurchasable !== false,
    data: {
      name: data.name || data.title || null,
      brand: data.brand || data.vendor || null,
      price,
      priceDisplay,
      image,
    },
  });
}
