import { useState } from "react";

const C = {
  bg: "#F8F4EF",
  dark: "#1A1209",
  card: "#FFFFFF",
  accent: "#E8442C",
  accentLight: "#E8442C18",
  gold: "#C9A84C",
  muted: "#9A8F82",
  border: "#E8E0D5",
  tag: "#F0EBE3",
};

const FONT_DISPLAY = "'Playfair Display', Georgia, serif";
const FONT_BODY = "'DM Sans', 'Helvetica Neue', sans-serif";

const HAULS = [
  {
    id: 1,
    creator: "Zara M.",
    handle: "@zarastyles",
    avatar: "Z",
    avatarColor: "#E8442C",
    title: "Spring Minimalist Haul ✨",
    views: "128K",
    likes: "14.2K",
    thumbnail: "🌸",
    bg: "linear-gradient(135deg, #F9E4D4 0%, #F0D5C8 100%)",
    items: [
      { id: 1, name: "Linen Oversized Blazer", brand: "Zara", price: 89.99, color: "#8B7355", checked: true },
      { id: 2, name: "Wide Leg Trousers", brand: "H&M", price: 49.99, color: "#4A4A4A", checked: true },
      { id: 3, name: "Strappy Sandals", brand: "ASOS", price: 39.99, color: "#C4A882", checked: false },
      { id: 4, name: "Mini Shoulder Bag", brand: "Mango", price: 59.99, color: "#1A1A1A", checked: true },
    ],
  },
  {
    id: 2,
    creator: "Mia Chen",
    handle: "@miafashion",
    avatar: "M",
    avatarColor: "#2D6A4F",
    title: "Y2K Comeback Pieces 🌀",
    views: "89K",
    likes: "9.8K",
    thumbnail: "⭐",
    bg: "linear-gradient(135deg, #D4E8F9 0%, #C8D5F0 100%)",
    items: [
      { id: 5, name: "Low Rise Cargo Pants", brand: "Urban Outfitters", price: 79.99, color: "#556B2F", checked: true },
      { id: 6, name: "Butterfly Crop Top", brand: "Shein", price: 19.99, color: "#FF69B4", checked: true },
      { id: 7, name: "Platform Sneakers", brand: "Nike", price: 120.00, color: "#FFFFFF", checked: true },
      { id: 8, name: "Tinted Sunglasses", brand: "ASOS", price: 24.99, color: "#2C2C2C", checked: false },
    ],
  },
  {
    id: 3,
    creator: "Leila K.",
    handle: "@leilaootd",
    avatar: "L",
    avatarColor: "#7B2D8B",
    title: "Office to Out — Work Fits 💼",
    views: "204K",
    likes: "22.1K",
    thumbnail: "💼",
    bg: "linear-gradient(135deg, #E8D4F9 0%, #D8C8F0 100%)",
    items: [
      { id: 9, name: "Tailored Midi Skirt", brand: "& Other Stories", price: 99.99, color: "#2C3E50", checked: true },
      { id: 10, name: "Silk Button Blouse", brand: "Mango", price: 69.99, color: "#F5F5DC", checked: true },
      { id: 11, name: "Block Heel Mules", brand: "Zara", price: 79.99, color: "#8B4513", checked: true },
      { id: 12, name: "Structured Tote", brand: "Nordstrom", price: 149.00, color: "#000000", checked: false },
    ],
  },
];

function Avatar({ letter, color, size = 36 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: color, display: "flex", alignItems: "center",
      justifyContent: "center", fontWeight: 800,
      fontSize: size * 0.4, color: "#fff",
      fontFamily: FONT_BODY, flexShrink: 0,
      border: "2px solid white",
      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
    }}>{letter}</div>
  );
}

function ColorDot({ color }) {
  return <div style={{ width: 14, height: 14, borderRadius: "50%", background: color, border: "1.5px solid #E8E0D5", flexShrink: 0 }} />;
}

function HaulCard({ haul, onOpen }) {
  const total = haul.items.filter(i => i.checked).reduce((s, i) => s + i.price, 0);
  return (
    <div style={{
      background: C.card, borderRadius: 20, overflow: "hidden",
      border: `1px solid ${C.border}`, marginBottom: 20,
      boxShadow: "0 4px 24px rgba(26,18,9,0.06)",
      cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s",
    }}
      onClick={() => onOpen(haul)}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(26,18,9,0.12)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 24px rgba(26,18,9,0.06)"; }}
    >
      {/* Video thumbnail */}
      <div style={{
        height: 220, background: haul.bg,
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ fontSize: 72, opacity: 0.6 }}>{haul.thumbnail}</div>
        {/* Play button */}
        <div style={{
          position: "absolute", inset: 0, display: "flex",
          alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: "50%",
            background: "rgba(255,255,255,0.9)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          }}>
            <div style={{ width: 0, height: 0, borderTop: "10px solid transparent", borderBottom: "10px solid transparent", borderLeft: `16px solid ${C.accent}`, marginLeft: 4 }} />
          </div>
        </div>
        {/* Stats overlay */}
        <div style={{
          position: "absolute", bottom: 10, left: 10, right: 10,
          display: "flex", justifyContent: "space-between",
        }}>
          <span style={{ fontSize: 12, color: "white", fontFamily: FONT_BODY, fontWeight: 600, background: "rgba(0,0,0,0.4)", padding: "3px 8px", borderRadius: 20 }}>▶ {haul.views}</span>
          <span style={{ fontSize: 12, color: "white", fontFamily: FONT_BODY, fontWeight: 600, background: "rgba(0,0,0,0.4)", padding: "3px 8px", borderRadius: 20 }}>♥ {haul.likes}</span>
        </div>
        {/* Verified badge */}
        <div style={{
          position: "absolute", top: 10, right: 10,
          background: C.accent, borderRadius: 20,
          padding: "3px 10px", fontSize: 11,
          color: "white", fontFamily: FONT_BODY, fontWeight: 700,
        }}>✓ Verified</div>
      </div>

      {/* Content */}
      <div style={{ padding: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <Avatar letter={haul.avatar} color={haul.avatarColor} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: C.dark, fontFamily: FONT_BODY }}>{haul.creator}</div>
            <div style={{ fontSize: 12, color: C.muted, fontFamily: FONT_BODY }}>{haul.handle}</div>
          </div>
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.dark, fontFamily: FONT_DISPLAY, marginBottom: 12, lineHeight: 1.3 }}>{haul.title}</div>

        {/* Item previews */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          {haul.items.slice(0, 3).map(item => (
            <div key={item.id} style={{
              display: "flex", alignItems: "center", gap: 6,
              background: C.tag, borderRadius: 20, padding: "5px 10px",
              fontSize: 12, color: C.dark, fontFamily: FONT_BODY,
            }}>
              <ColorDot color={item.color} />
              <span>{item.name.split(" ").slice(0, 2).join(" ")}</span>
            </div>
          ))}
          {haul.items.length > 3 && (
            <div style={{ background: C.tag, borderRadius: 20, padding: "5px 10px", fontSize: 12, color: C.muted, fontFamily: FONT_BODY }}>
              +{haul.items.length - 3} more
            </div>
          )}
        </div>

        {/* CTA */}
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{
            flex: 1, padding: "11px", borderRadius: 12,
            background: C.accent, color: "white", border: "none",
            fontWeight: 700, fontSize: 13, fontFamily: FONT_BODY,
            cursor: "pointer",
          }}>
            Buy Full Look · ${total.toFixed(0)}
          </button>
          <button style={{
            padding: "11px 14px", borderRadius: 12,
            background: C.tag, color: C.dark, border: "none",
            fontWeight: 600, fontSize: 13, fontFamily: FONT_BODY,
            cursor: "pointer",
          }}>Pick Items</button>
        </div>
      </div>
    </div>
  );
}

function HaulDetail({ haul, onBack, onCheckout }) {
  const [items, setItems] = useState(haul.items);
  const selected = items.filter(i => i.checked);
  const total = selected.reduce((s, i) => s + i.price, 0);

  const toggle = (id) => setItems(items.map(i => i.id === id ? { ...i, checked: !i.checked } : i));

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Video area */}
      <div style={{
        height: 260, background: haul.bg, position: "relative",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <div style={{ fontSize: 80, opacity: 0.5 }}>{haul.thumbnail}</div>
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            width: 60, height: 60, borderRadius: "50%",
            background: "rgba(255,255,255,0.92)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 6px 24px rgba(0,0,0,0.15)",
          }}>
            <div style={{ width: 0, height: 0, borderTop: "12px solid transparent", borderBottom: "12px solid transparent", borderLeft: `18px solid ${C.accent}`, marginLeft: 5 }} />
          </div>
        </div>
        <button onClick={onBack} style={{
          position: "absolute", top: 16, left: 16,
          width: 36, height: 36, borderRadius: "50%",
          background: "rgba(255,255,255,0.9)", border: "none",
          fontSize: 18, cursor: "pointer", display: "flex",
          alignItems: "center", justifyContent: "center",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}>←</button>
        <div style={{ position: "absolute", top: 16, right: 16, background: C.accent, borderRadius: 20, padding: "3px 10px", fontSize: 11, color: "white", fontFamily: FONT_BODY, fontWeight: 700 }}>✓ Verified</div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 140px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <Avatar letter={haul.avatar} color={haul.avatarColor} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: C.dark, fontFamily: FONT_BODY }}>{haul.creator}</div>
            <div style={{ fontSize: 12, color: C.muted, fontFamily: FONT_BODY }}>{haul.handle}</div>
          </div>
          <div style={{ marginLeft: "auto", fontSize: 12, color: C.muted, fontFamily: FONT_BODY }}>♥ {haul.likes}</div>
        </div>

        <div style={{ fontSize: 20, fontWeight: 800, color: C.dark, fontFamily: FONT_DISPLAY, marginBottom: 4, lineHeight: 1.3 }}>{haul.title}</div>
        <div style={{ fontSize: 13, color: C.muted, fontFamily: FONT_BODY, marginBottom: 20 }}>Select the pieces you want — or grab the full look at once.</div>

        {/* Select all */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.dark, fontFamily: FONT_BODY, textTransform: "uppercase", letterSpacing: 1 }}>Items in this haul</div>
          <button onClick={() => setItems(items.map(i => ({ ...i, checked: true })))} style={{ fontSize: 12, color: C.accent, fontFamily: FONT_BODY, fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>Select All</button>
        </div>

        {items.map(item => (
          <div key={item.id} onClick={() => toggle(item.id)} style={{
            display: "flex", alignItems: "center", gap: 12,
            background: item.checked ? C.accentLight : C.tag,
            border: `1.5px solid ${item.checked ? C.accent : C.border}`,
            borderRadius: 14, padding: "14px", marginBottom: 10,
            cursor: "pointer", transition: "all 0.15s",
          }}>
            <div style={{
              width: 22, height: 22, borderRadius: 6,
              border: `2px solid ${item.checked ? C.accent : C.border}`,
              background: item.checked ? C.accent : "white",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, transition: "all 0.15s",
            }}>
              {item.checked && <span style={{ color: "white", fontSize: 13, fontWeight: 700 }}>✓</span>}
            </div>
            <ColorDot color={item.color} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.dark, fontFamily: FONT_BODY }}>{item.name}</div>
              <div style={{ fontSize: 12, color: C.muted, fontFamily: FONT_BODY }}>{item.brand}</div>
            </div>
            <div style={{ fontWeight: 800, fontSize: 15, color: C.dark, fontFamily: FONT_BODY }}>${item.price.toFixed(2)}</div>
          </div>
        ))}
      </div>

      {/* Checkout bar */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        background: "white", borderTop: `1px solid ${C.border}`,
        padding: "16px 20px 28px",
        boxShadow: "0 -8px 30px rgba(26,18,9,0.08)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 13, color: C.muted, fontFamily: FONT_BODY }}>{selected.length} item{selected.length !== 1 ? "s" : ""} selected</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.dark, fontFamily: FONT_DISPLAY }}>${total.toFixed(2)}</div>
        </div>
        <button
          onClick={() => selected.length > 0 && onCheckout(selected, total)}
          disabled={selected.length === 0}
          style={{
            width: "100%", padding: "15px",
            borderRadius: 14, border: "none",
            background: selected.length > 0 ? C.accent : C.border,
            color: selected.length > 0 ? "white" : C.muted,
            fontWeight: 800, fontSize: 15, fontFamily: FONT_BODY,
            cursor: selected.length > 0 ? "pointer" : "not-allowed",
            transition: "all 0.2s",
          }}
        >
          {selected.length > 0 ? `Buy ${selected.length === haul.items.length ? "Full Look" : "Selected"} — 1 Checkout` : "Select items to buy"}
        </button>
      </div>
    </div>
  );
}

function SnapScreen({ onBack }) {
  const [stage, setStage] = useState("upload"); // upload, analyzing, result
  const [dragging, setDragging] = useState(false);

  const fakeItems = [
    { id: 101, name: "Cream Knit Sweater", brand: "Zara", price: 59.99, color: "#F5F0E8", match: "98%" },
    { id: 102, name: "Straight Leg Jeans", brand: "Levi's", price: 79.99, color: "#4A6FA5", match: "95%" },
    { id: 103, name: "White Leather Sneakers", brand: "Nike", price: 110.00, color: "#FFFFFF", match: "91%" },
    { id: 104, name: "Gold Hoop Earrings", brand: "ASOS", price: 18.99, color: "#C9A84C", match: "89%" },
  ];

  const total = fakeItems.reduce((s, i) => s + i.price, 0);

  const handleUpload = () => {
    setStage("analyzing");
    setTimeout(() => setStage("result"), 2200);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "20px 20px 0", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button onClick={onBack} style={{
            width: 36, height: 36, borderRadius: "50%",
            border: `1px solid ${C.border}`, background: C.tag,
            fontSize: 18, cursor: "pointer",
          }}>←</button>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.dark, fontFamily: FONT_DISPLAY }}>Snap to Shop</div>
            <div style={{ fontSize: 12, color: C.muted, fontFamily: FONT_BODY }}>Upload any outfit — we'll find every piece</div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 120px" }}>
        {stage === "upload" && (
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); handleUpload(); }}
            onClick={handleUpload}
            style={{
              border: `2px dashed ${dragging ? C.accent : C.border}`,
              borderRadius: 20, padding: "48px 24px",
              textAlign: "center", cursor: "pointer",
              background: dragging ? C.accentLight : C.tag,
              transition: "all 0.2s", marginBottom: 20,
            }}
          >
            <div style={{ fontSize: 52, marginBottom: 16 }}>📸</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.dark, fontFamily: FONT_DISPLAY, marginBottom: 8 }}>Upload an outfit photo</div>
            <div style={{ fontSize: 14, color: C.muted, fontFamily: FONT_BODY, lineHeight: 1.6 }}>Tap to upload or drag & drop.<br />We'll identify every piece and find where to buy it.</div>
            <div style={{ marginTop: 20, display: "inline-block", background: C.accent, color: "white", padding: "10px 24px", borderRadius: 20, fontFamily: FONT_BODY, fontWeight: 700, fontSize: 14 }}>Choose Photo</div>
          </div>
        )}

        {stage === "analyzing" && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: 64, marginBottom: 20, animation: "spin 1s linear infinite", display: "inline-block" }}>🔍</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.dark, fontFamily: FONT_DISPLAY, marginBottom: 8 }}>Analyzing outfit...</div>
            <div style={{ fontSize: 14, color: C.muted, fontFamily: FONT_BODY, lineHeight: 1.6 }}>
              Identifying clothing pieces<br />Finding best matches across retailers<br />Preparing your cart
            </div>
            <div style={{ marginTop: 24, display: "flex", gap: 6, justifyContent: "center" }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 8, height: 8, borderRadius: "50%", background: C.accent,
                  animation: `bounce 0.8s ease-in-out ${i * 0.2}s infinite alternate`,
                }} />
              ))}
            </div>
          </div>
        )}

        {stage === "result" && (
          <>
            <div style={{ background: "#E8F5E9", borderRadius: 14, padding: "12px 16px", marginBottom: 20, display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 20 }}>✅</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#2D6A4F", fontFamily: FONT_BODY }}>4 items identified</div>
                <div style={{ fontSize: 12, color: "#52B788", fontFamily: FONT_BODY }}>All available for purchase · Ships separately</div>
              </div>
            </div>

            {fakeItems.map(item => (
              <div key={item.id} style={{
                background: C.card, border: `1px solid ${C.border}`,
                borderRadius: 14, padding: "14px", marginBottom: 10,
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <ColorDot color={item.color} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.dark, fontFamily: FONT_BODY }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: C.muted, fontFamily: FONT_BODY }}>{item.brand} · <span style={{ color: "#2D6A4F", fontWeight: 600 }}>{item.match} match</span></div>
                </div>
                <div style={{ fontWeight: 800, fontSize: 15, color: C.dark, fontFamily: FONT_BODY }}>${item.price.toFixed(2)}</div>
              </div>
            ))}
          </>
        )}
      </div>

      {stage === "result" && (
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          background: "white", borderTop: `1px solid ${C.border}`,
          padding: "16px 20px 28px",
          boxShadow: "0 -8px 30px rgba(26,18,9,0.08)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontSize: 13, color: C.muted, fontFamily: FONT_BODY }}>4 items · 1 checkout</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.dark, fontFamily: FONT_DISPLAY }}>${total.toFixed(2)}</div>
          </div>
          <button style={{
            width: "100%", padding: "15px", borderRadius: 14,
            background: C.accent, color: "white", border: "none",
            fontWeight: 800, fontSize: 15, fontFamily: FONT_BODY, cursor: "pointer",
          }}>Buy Full Outfit — 1 Checkout</button>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes bounce { from { transform: translateY(0); } to { transform: translateY(-8px); } }
      `}</style>
    </div>
  );
}

function CheckoutScreen({ items, total, onBack, onDone }) {
  const [stage, setStage] = useState("review"); // review, processing, done
  const retailers = [...new Set(items.map(i => i.brand))];

  const handlePay = () => {
    setStage("processing");
    setTimeout(() => setStage("done"), 2500);
  };

  if (stage === "done") return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: 32, textAlign: "center" }}>
      <div style={{ fontSize: 72, marginBottom: 16 }}>🎉</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: C.dark, fontFamily: FONT_DISPLAY, marginBottom: 8 }}>Order Placed!</div>
      <div style={{ fontSize: 14, color: C.muted, fontFamily: FONT_BODY, lineHeight: 1.8, marginBottom: 24 }}>
        Your {items.length} items have been ordered from {retailers.length} retailer{retailers.length > 1 ? "s" : ""}.<br />
        One payment. Multiple deliveries.
      </div>
      <div style={{ width: "100%", background: C.tag, borderRadius: 16, padding: "16px 20px", marginBottom: 20 }}>
        {retailers.map((r, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < retailers.length - 1 ? `1px solid ${C.border}` : "none" }}>
            <span style={{ fontSize: 14, color: C.dark, fontFamily: FONT_BODY }}>{r}</span>
            <span style={{ fontSize: 12, color: "#2D6A4F", fontFamily: FONT_BODY, fontWeight: 600 }}>✓ Confirmed</span>
          </div>
        ))}
      </div>
      <button onClick={onDone} style={{
        width: "100%", padding: "15px", borderRadius: 14,
        background: C.accent, color: "white", border: "none",
        fontWeight: 800, fontSize: 15, fontFamily: FONT_BODY, cursor: "pointer",
      }}>Back to Feed</button>
    </div>
  );

  if (stage === "processing") return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: 32, textAlign: "center" }}>
      <div style={{ fontSize: 64, marginBottom: 20 }}>⚡</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: C.dark, fontFamily: FONT_DISPLAY, marginBottom: 8 }}>Processing order...</div>
      <div style={{ fontSize: 14, color: C.muted, fontFamily: FONT_BODY, lineHeight: 1.8 }}>
        Placing orders across {retailers.length} retailer{retailers.length > 1 ? "s" : ""} simultaneously.<br />You only pay once.
      </div>
      <div style={{ marginTop: 24, display: "flex", gap: 6 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: C.accent, animation: `bounce 0.8s ease-in-out ${i * 0.2}s infinite alternate` }} />
        ))}
      </div>
      <style>{`@keyframes bounce { from { transform: translateY(0); } to { transform: translateY(-8px); } }`}</style>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "20px 20px 0", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: "50%", border: `1px solid ${C.border}`, background: C.tag, fontSize: 18, cursor: "pointer" }}>←</button>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.dark, fontFamily: FONT_DISPLAY }}>Checkout</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 160px" }}>
        <div style={{ background: C.accentLight, border: `1px solid ${C.accent}`, borderRadius: 14, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: C.accent, fontFamily: FONT_BODY, fontWeight: 600 }}>
          ⚡ 1 payment · {retailers.length} retailers · all ordered simultaneously
        </div>

        <div style={{ fontSize: 12, fontWeight: 700, color: C.dark, fontFamily: FONT_BODY, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Order Summary</div>

        {items.map(item => (
          <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <ColorDot color={item.color} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.dark, fontFamily: FONT_BODY }}>{item.name}</div>
                <div style={{ fontSize: 12, color: C.muted, fontFamily: FONT_BODY }}>{item.brand}</div>
              </div>
            </div>
            <div style={{ fontWeight: 700, fontSize: 14, color: C.dark, fontFamily: FONT_BODY }}>${item.price.toFixed(2)}</div>
          </div>
        ))}

        <div style={{ marginTop: 20, background: C.tag, borderRadius: 14, padding: "16px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.dark, fontFamily: FONT_BODY, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Payment</div>
          <div style={{ background: "white", borderRadius: 10, padding: "12px 14px", border: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 14, color: C.dark, fontFamily: FONT_BODY }}>•••• •••• •••• 4242</span>
            <span style={{ fontSize: 20 }}>💳</span>
          </div>
        </div>

        <div style={{ marginTop: 16, background: C.tag, borderRadius: 14, padding: "16px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.dark, fontFamily: FONT_BODY, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Shipping</div>
          <div style={{ fontSize: 14, color: C.dark, fontFamily: FONT_BODY }}>123 Main St, Apt 4B</div>
          <div style={{ fontSize: 12, color: C.muted, fontFamily: FONT_BODY }}>New York, NY 10001</div>
        </div>
      </div>

      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        background: "white", borderTop: `1px solid ${C.border}`,
        padding: "16px 20px 28px",
        boxShadow: "0 -8px 30px rgba(26,18,9,0.08)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ fontSize: 13, color: C.muted, fontFamily: FONT_BODY }}>Total · {items.length} items</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.dark, fontFamily: FONT_DISPLAY }}>${total.toFixed(2)}</div>
        </div>
        <button onClick={handlePay} style={{
          width: "100%", padding: "15px", borderRadius: 14,
          background: C.accent, color: "white", border: "none",
          fontWeight: 800, fontSize: 15, fontFamily: FONT_BODY, cursor: "pointer",
          boxShadow: `0 6px 20px ${C.accent}44`,
        }}>Place Order Now →</button>
      </div>
    </div>
  );
}

function BottomNav({ screen, setScreen }) {
  const tabs = [{ id: "feed", icon: "▶", label: "Feed" }, { id: "snap", icon: "📸", label: "Snap" }, { id: "profile", icon: "👤", label: "Profile" }];
  return (
    <div style={{
      position: "absolute", bottom: 0, left: 0, right: 0,
      background: "white", borderTop: `1px solid ${C.border}`,
      display: "flex", padding: "10px 0 20px",
    }}>
      {tabs.map(tab => (
        <button key={tab.id} onClick={() => setScreen(tab.id)} style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", gap: 3, border: "none",
          background: "none", cursor: "pointer",
          color: screen === tab.id ? C.accent : C.muted,
        }}>
          <span style={{ fontSize: 20 }}>{tab.icon}</span>
          <span style={{ fontSize: 11, fontFamily: FONT_BODY, fontWeight: screen === tab.id ? 700 : 500 }}>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

function ProfileScreen() {
  return (
    <div style={{ padding: "20px 20px 100px", overflowY: "auto", height: "100%" }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: C.dark, fontFamily: FONT_DISPLAY, marginBottom: 20 }}>Profile</div>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 800, color: "white", fontFamily: FONT_BODY, margin: "0 auto 12px" }}>Y</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.dark, fontFamily: FONT_DISPLAY }}>Your Profile</div>
        <div style={{ fontSize: 13, color: C.muted, fontFamily: FONT_BODY }}>Fashion enthusiast</div>
        <div style={{ display: "inline-block", marginTop: 8, padding: "4px 14px", background: C.accentLight, borderRadius: 20, fontSize: 12, color: C.accent, fontWeight: 700, fontFamily: FONT_BODY }}>✓ Verified Creator</div>
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        {[{ label: "Hauls", value: "12" }, { label: "Purchased", value: "$2.4K" }, { label: "Followers", value: "8.2K" }].map(s => (
          <div key={s.label} style={{ flex: 1, background: C.tag, borderRadius: 14, padding: "14px 8px", textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.accent, fontFamily: FONT_DISPLAY }}>{s.value}</div>
            <div style={{ fontSize: 11, color: C.muted, fontFamily: FONT_BODY }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.dark, fontFamily: FONT_BODY, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Recent Orders</div>
      {["Spring Minimalist Haul · $199", "Y2K Pieces · $220", "Snap Purchase · $269"].map((o, i) => (
        <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px", marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, color: C.dark, fontFamily: FONT_BODY }}>{o.split("·")[0]}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.accent, fontFamily: FONT_BODY }}>{o.split("·")[1]}</span>
        </div>
      ))}
    </div>
  );
}

export default function HaulApp() {
  const [screen, setScreen] = useState("feed");
  const [selectedHaul, setSelectedHaul] = useState(null);
  const [checkoutData, setCheckoutData] = useState(null);

  const showNav = screen === "feed" || screen === "snap" || screen === "profile";

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#EDE8E0", fontFamily: FONT_BODY }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;600;700;800&display=swap'); * { box-sizing: border-box; } ::-webkit-scrollbar { width: 0; }`}</style>

      <div style={{
        width: 390, height: 780, background: C.bg,
        borderRadius: 44, border: "10px solid #2A2010",
        boxShadow: "0 40px 100px rgba(0,0,0,0.35), 0 0 0 1px #3A3020",
        position: "relative", overflow: "hidden",
        display: "flex", flexDirection: "column",
      }}>
        {/* Notch */}
        <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 120, height: 28, background: "#2A2010", borderRadius: "0 0 18px 18px", zIndex: 100 }} />

        {/* Status bar */}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "36px 20px 0", fontSize: 11, color: C.muted, fontFamily: FONT_BODY, fontWeight: 600, flexShrink: 0 }}>
          <span>9:41</span><span>●●●○ 🔋</span>
        </div>

        {/* Header - only on feed */}
        {screen === "feed" && (
          <div style={{ padding: "12px 20px 0", flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: C.dark, fontFamily: FONT_DISPLAY, letterSpacing: -1 }}>haul<span style={{ color: C.accent }}>.</span></div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ padding: "7px 16px", borderRadius: 20, background: C.accent, color: "white", border: "none", fontFamily: FONT_BODY, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>+ Post Haul</button>
            </div>
          </div>
        )}

        {/* Screen content */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          {screen === "feed" && !selectedHaul && (
            <div style={{ height: "100%", overflowY: "auto", padding: "14px 20px 100px" }}>
              <div style={{ fontSize: 12, color: C.muted, fontFamily: FONT_BODY, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>Trending Hauls</div>
              {HAULS.map(haul => (
                <HaulCard key={haul.id} haul={haul} onOpen={h => { setSelectedHaul(h); }} />
              ))}
            </div>
          )}

          {screen === "feed" && selectedHaul && !checkoutData && (
            <HaulDetail
              haul={selectedHaul}
              onBack={() => setSelectedHaul(null)}
              onCheckout={(items, total) => { setCheckoutData({ items, total }); setScreen("checkout"); }}
            />
          )}

          {screen === "checkout" && checkoutData && (
            <CheckoutScreen
              items={checkoutData.items}
              total={checkoutData.total}
              onBack={() => { setScreen("feed"); }}
              onDone={() => { setCheckoutData(null); setSelectedHaul(null); setScreen("feed"); }}
            />
          )}

          {screen === "snap" && <SnapScreen onBack={() => setScreen("feed")} />}
          {screen === "profile" && <ProfileScreen />}
        </div>

        {showNav && <BottomNav screen={screen} setScreen={setScreen} />}
      </div>
    </div>
  );
}
