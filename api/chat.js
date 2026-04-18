// api/chat.js
// Personal shopping chat with server-computed fit intelligence.
// We pre-compute the fit projections deterministically and hand them
// to the model as structured facts. The model narrates; it never
// invents a measurement.

import { analyzeFit } from "../src/lib/fit.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { message, history, catalog, userProfile } = req.body;
    if (!message) return res.status(400).json({ error: "No message provided" });

    // Pre-compute fit analysis for every catalog item if user has a profile.
    // Passing numbers instead of asking the model to reason about them
    // keeps answers reproducible and makes future refinement (e.g.,
    // from return-rate data) a code change, not a prompt change.
    const hasProfile = Boolean(userProfile && userProfile.height_cm);
    let fitAnalysis = null;
    if (hasProfile) {
      fitAnalysis = (catalog || []).map(item => {
        const creator = {
          name: item.creator,
          height_cm: item.creator_height_cm,
          build: item.creator_build,
          usual_size: item.creator_usual_size,
        };
        return { id: item.id, ...analyzeFit({ creator, user: userProfile, item }) };
      });
    }

    const fitBlock = hasProfile
      ? `

USER PROFILE:
${JSON.stringify(userProfile, null, 2)}

FIT ANALYSIS (pre-computed projections — treat as ground truth, do not invent numbers):
${JSON.stringify(fitAnalysis, null, 2)}

When recommending an item:
- Use the matching FIT ANALYSIS entry to write a short, specific fit_note.
- If length.shift_steps is non-zero, name the hem position it will actually hit on the user (use the on_user value).
- If fit_style.adjusted is true, mention how the cut will read on the user's build.
- If size.delta is non-zero, note the sizing direction plainly.
- If flags is non-empty, surface the warning — don't bury it.
- Skip any dimension whose value is null. Never guess.`
      : `

The user has not set up their fit profile yet. After your first recommendation, add one short line inviting them to set up fit preferences for personalized sizing.`;

    const systemPrompt = `You are a personal AI shopping assistant for Haul — a shoppable fashion platform where verified creators post outfit haul videos.

Your job is to help users find items from the creator haul catalog and give personalized fit guidance.

HAUL CATALOG:
${JSON.stringify(catalog, null, 2)}
${fitBlock}

Rules:
- Friendly, fashion-forward tone. Keep chat copy short — max 3 sentences before items.
- Always mention the creator who wore each item.
- If the user asks for something not in the catalog, suggest the closest match and say why.
- Format item recommendations as JSON at the END of your response like:
ITEMS: [{"id": 1, "name": "...", "brand": "...", "price": 89.99, "color": "#8B7355", "creator": "...", "haul": "...", "fit_note": "..."}]
- Include fit_note only when FIT ANALYSIS data exists for that item; omit the field otherwise.
- Only include the ITEMS: block when you have actual recommendations.`;

    const messages = [
      ...(history || []),
      { role: "user", content: message },
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
        max_tokens: 1200,
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

    // Extract trailing ITEMS: JSON. Anchored to end-of-string to avoid
    // picking up example JSON inside the model's prose.
    let items = [];
    let text = fullText;
    const itemsMatch = fullText.match(/ITEMS:\s*(\[[\s\S]*\])\s*$/);
    if (itemsMatch) {
      try {
        items = JSON.parse(itemsMatch[1]);
        text = fullText.replace(/ITEMS:\s*\[[\s\S]*\]\s*$/, "").trim();
      } catch { /* leave text intact on parse failure */ }
    }

    return res.status(200).json({ text, items });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
