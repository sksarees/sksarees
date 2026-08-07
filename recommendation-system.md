# 🧠 SK Sarees — "Similar Saree" Recommendation System (Production Guide)

> **Already live on this site.** `rec.js` implements the full engine client-side
> (works on any static host, cold-start safe, fast). This guide documents the
> architecture, schema, Python/Node reference implementations, LLM prompt
> design, and caching plan so a developer can scale it to a server later.

---

## 1) System Architecture

```
                    ┌───────────────────────────────────────────────┐
                    │            PRODUCT DATA (source of truth)      │
                    │  data.js BASE · admin sk_products · Firestore  │
                    └──────────────┬────────────────────────────────┘
                                   ▼
                    ┌───────────────────────────────────────────────┐
                    │        ATTRIBUTE EXTRACTOR (cold-start)        │
                    │  keyword → normalized: fabric, color, design,   │
                    │  occasion, work-type, price-band, blouse        │
                    └──────────────┬────────────────────────────────┘
                                   ▼
              ┌────────────────────┴─────────────────────┐
              │        SIMILARITY SCORER (weighted)       │
              │ fabric 30 · color 20 · design 15 ·        │
              │ occasion 15 · price 10 · work 10 (+bonus) │
              └────────────────────┬─────────────────────┘
                                   ▼
        ┌──────────────────────────┴──────────────────────────┐
        │  HYBRID RANKING                                      │
        │  score + collaborative boost (view/order history,     │
        │  popularity) → sort desc → top 6–12                   │
        └──────────────────────────┬──────────────────────────┘
                                   ▼
                    ┌───────────────────────────────────────────────┐
                    │        PRESENTATION (product page)            │
                    │  "✨ Similar Sarees" — image, price, % match, │
                    │  reason, Add-to-Cart, WhatsApp                │
                    └───────────────────────────────────────────────┘
```

**Hybrid = content-based (attributes) + collaborative (co-view/order history).**
Content-based handles new products (cold start); collaborative improves
personalization as the store collects views/orders. In the current static
deployment the collaborative part is per-device (localStorage) — the guide
below shows how to aggregate it server-side with Firestore.

---

## 2) Database Schema / Product Attributes

Recommended product document (works with your existing Firestore `products`
collection — extra fields are optional, the extractor fills gaps from
name/desc keywords):

```jsonc
{
  "id": "SK10001",
  "sku": "SK10001",
  "name": "Kanchipuram Semi Silk — Red & Gold Zari",
  "price": 2499, "mrp": 3999,
  "cat": "kanchipuram",
  "img": "…", "images": ["…", "…"],
  "stock": 12,
  // —— structured attributes (optional; extractor auto-fills if missing) ——
  "attributes": {
    "fabric":    "kanjivaram",   // kanjivaram | banarasi | silk | cotton | georgette | organza | linen | net | tussar | chiffon | velvet
    "color":     ["red"],        // family ids: red green blue pink purple gold white brown dark orange champagne multi
    "design":    "zari",         // plain | printed | embroidered | embellished | zari | geometric | traditional | contemporary
    "occasion":  "festival",     // wedding | party | office | festival | casual
    "work":      "zari",         // zari | sequin | stone | pearl | embroidery | lace | print | plain
    "priceBand": "luxury",       // cheap <700 · mid 700–1400 · premium 1400–2200 · luxury >2200
    "blouse":    "blouse piece included"
  },
  "rating": 4.8, "reviews": 132
}
```

**Recommended index/collections (server scale):**
| Collection | Purpose |
|---|---|
| `products` | product docs incl. `attributes` (above) |
| `events` | event log: `{user, productId, type: view|addtocart|purchase, ts}` — feeds collaborative |
| `similar_precomputed` | nightly job output: `{productId, similar: [{id, score, reason}]}` (cached reads) |
| `users` | profile + history reference (optional auth) |

---

## 3) Step-by-Step Implementation Plan

1. **Attribute extractor** — normalize each product into a fixed vector
   (fabric, color[], design, occasion, work, priceBand, blouse). Keyword maps
   (see §2) make it work with *any* existing schema → cold start solved.
2. **Similarity scorer** — weighted sum per business priority:
   `fabric 30 · color 20 · design 15 · occasion 15 · price 10 · work 10`,
   color bonus for complementary families (red↔gold etc.), ±2 for same blouse.
   Produce a human reason from the top 1–2 matching factors.
3. **Candidate narrowing** — build in-memory buckets (`fabric → ids`,
   `color → ids`, `occasion → ids`); candidates = union of same-fabric,
   same-color, same-occasion, same-price-band (cap ~80). Score only candidates
   → O(n) instead of O(n²).
4. **Collaborative layer** — track events (view/add-to-cart/purchase). Server:
   co-occurrence matrix or "users who viewed X also viewed Y"; client fallback:
   localStorage history. Boost +0–4 points.
5. **Ranking + presentation** — sort by (score + boost) desc, keep 6–12,
   render cards with image, price, **% match**, **reason**, Add-to-Cart, WhatsApp.
6. **Events wiring** — Meta Pixel `ViewContent`, `AddToCart`, `Purchase` already
   fire; add the same to the recommendation data feed.
7. **Caching + precompute** (see §7).
8. **A/B test** — randomize 20% of visitors to "popular only" to measure lift
   in add-to-cart / conversion.

---

## 4) Code Examples

### 4a) Python — scikit-learn (content-based, production reference)

```python
# requirements: scikit-learn
import re, numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

FABRIC = re.compile(r'kanjivaram|banarasi|tussar|chiffon|organza|georgette|velvet|net|linen|silk|cotton', re.I)
COLORS = re.compile(r'maroon|burgundy|wine|red|pink|rose|emerald|green|peacock|teal|mint|navy|blue|turquoise|purple|lavender|gold|yellow|mustard|white|cream|beige|brown|black|grey|champagne', re.I)

def attrs(p):
    """Normalized attribute string from any product dict (cold-start safe)."""
    text = ' '.join(str(p.get(k, '')) for k in ('fabric', 'color', 'name', 'desc', 'border'))
    m = FABRIC.search(text); c = COLORS.search(text)
    return {
        'fabric': m.group(0).lower() if m else 'other',
        'color':  c.group(0).lower() if c else 'multi',
        'design': 'zari' if re.search(r'zari|temple|border heavy', text, re.I) else 'plain',
        'occasion': 'wedding' if re.search(r'bridal|wedding', text, re.I) else 'casual',
        'band': 'luxury' if p.get('price', 0) > 2200 else 'mid',
        'text': text.lower(),
    }

def build_matrix(products):
    """TF-IDF over attribute text + cosine similarity matrix (precompute once)."""
    docs = [attrs(p)['text'] for p in products]
    vec = TfidfVectorizer(analyzer='word', ngram_range=(1, 2), stop_words='english')
    X = vec.fit_transform(docs)
    return cosine_similarity(X)

def recommend(products, idx, matrix, top=8):
    """Content-based recommendations by cosine similarity."""
    sims = list(enumerate(matrix[idx]))
    sims.sort(key=lambda x: -x[1])
    out = []
    for j, s in sims:
        if j == idx or s <= 0: continue
        p = products[j]
        out.append({'id': p['id'], 'name': p['name'], 'img': p['img'],
                    'price': p['price'], 'score': int(s * 100),
                    'reason': f"Similar {attrs(p)['fabric']} fabric"})
        if len(out) >= top: break
    return out
```

### 4b) Python — sentence-transformers (semantic, smarter for descriptions)

```python
# requirements: sentence-transformers
from sentence_transformers import SentenceTransformer, util
model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')  # EN + Tamil ok

# precompute once, store as numpy file
emb = model.encode([f"{p['name']} {p.get('desc','')} fabric {p.get('fabric','')}" for p in products],
                   normalize_embeddings=True)

def recommend_semantic(idx, top=8):
    sims = util.cos_sim(emb[idx], emb)[0]
    order = sims.argsort(descending=True)
    return [{'id': products[j]['id'], 'score': int(float(sims[j]) * 100)} for j in order[1:top+1]]
```

### 4c) Node.js — weighted scorer (mirrors rec.js, for a server/API)

```js
// recompute.js — nightly precompute (or call on demand + cache)
const W = { fabric: 30, color: 20, design: 15, occasion: 15, price: 10, work: 10 };
function similarity(a, b) {
  let s = 0, reasons = [];
  if (a.fabric === b.fabric) { s += W.fabric; reasons.push(`Same ${a.fabric} fabric`); }
  if (a.color === b.color) { s += W.color; reasons.push(`Same ${a.color} colour`); }
  else if (COMPLEMENTARY[a.color]?.includes(b.color)) s += W.color * 0.6;
  if (a.design === b.design) s += W.design;
  if (a.occasion === b.occasion) { s += W.occasion; reasons.push(`Perfect for ${a.occasion}`); }
  if (a.band === b.band) s += W.price;
  if (a.work === b.work && a.work !== 'plain') { s += W.work; reasons.push(`Same ${a.work} work`); }
  return { score: Math.min(100, Math.round(s)), reason: reasons[0] || 'Popular choice' };
}
// Buckets: index fabric/color/occasion → ids; candidates = union; score only those.
```

---

## 5) Integration into sksaree (already done)

1. **`rec.js`** — copy the file into your site root.
2. **Every page** — add before `app.js`:
   ```html
   <script src="rec.js"></script>
   <script src="app.js"></script>
   ```
3. **Product page** — a `<div id="recSection"></div>` placeholder; `app.js` calls
   `REC.renderSimilar(p, el)` after rendering the product → shows **"✨ Similar
   Sarees"** with 8 cards (image, price, **% match**, **reason**, Add-to-Cart, WhatsApp).
4. **Views** are tracked automatically (`sk_viewed`) for the collaborative layer;
   `REC.invalidate()` runs after admin product saves so scores stay fresh.
5. **Admin** — nothing extra needed; the section appears automatically for
   every product (including Firestore-only ones).

If you later move to a backend: replace `REC.recommendFor` with a fetch to
`/api/recommend?id=…` returning the same shape `[{id,name,img,price,score,reason}]`
— the rendering code stays identical.

---

## 6) LLM / API Design for Smarter Matching

Use a model when you want *semantic* reasons or cross-language (Tamil) matches.
Design: fetch candidates (top ~20 from the fast engine) → send to LLM for
re-ranking + a single fluent reason → cache the result.

**Prompt (OpenAI / Claude / local LLM):**

```
You rank saree recommendations for a South Indian saree store.

Target product:
NAME: {name}
FABRIC: {fabric}   COLOUR: {color}
DESIGN: {design}   OCCASION: {occasion}   PRICE: ₹{price}
DESC: {desc}

Candidates (JSON): {candidates_json}

Task:
1) Score each candidate 0–100 for how well it matches the target
   (fabric > colour > design > occasion > price > work-type).
2) For the top 5, write ONE short reason (max 12 words), e.g.
   "Same Kanjivaram silk + gold zari border".
3) Output ONLY JSON:
   [{"id":"…","score":87,"reason":"Same silk + festival style"}]
Do not add text outside the JSON.
```

**System prompt hints:** "You are an expert Indian ethnic-wear merchandiser.
Favour same fabric family, complementary colours (red↔gold, green↔gold),
same occasion. Keep reasons human, in simple English or Tamil (தமிழ்) matching
the customer's language."

**API shape (your backend or a Cloud Function):**
```
GET /api/recommend?product=SK10001&lang=ta&n=8
→ { "items": [ { "id":"SK10002","name":"…","img":"…","price":1899,
                 "score":87,"reason":"அதே பட்டு + தங்க ஜரிகை" } ] }
```

**Local LLM option:** run a small model (e.g. Llama 3.1 8B / Qwen 7B) via
Ollama/llama.cpp on your own server for privacy + zero per-call cost; latency
is hidden by precomputing nightly.

---

## 7) Making It Fast (Caching & Precomputation)

| Layer | Strategy | Impact |
|---|---|---|
| **Attribute memo** | `Map<id, attrs>` computed once (already in rec.js) | ~0ms after first |
| **Buckets** | fabric/color/occasion → id lists (already in rec.js) | O(n) → O(40) scoring |
| **Client cache** | `localStorage: sk_rec_<productId>` = top-8 JSON, TTL 24h; `REC.invalidate()` on admin save | 0 network, instant repeat views |
| **Server precompute** | nightly job writes `similar_precomputed/{productId}` (Python/Node above) | API = 1 read |
| **Redis cache** | `GET rec:{productId}` with 24h TTL, keyed by catalog version hash | <5ms API |
| **CDN** | serve `rec.js` and the precomputed JSON through your static CDN (Netlify/Vercel edge) | global low latency |
| **LLM cache** | cache LLM re-rank output by (productId, lang) for 7 days; batch at night | hides LLM latency/cost |

**Cold-start fallback:** while precompute is warming, `rec.js` computes on the
fly in ~1–3ms for 60–100 products — the site never shows an empty section.

**Telemetry:** log `impression` + `addtocart` per recommendation card (Meta
Pixel `ViewContent`/`AddToCart` already fires) → measure CTR lift, tune weights
(fabric vs price) quarterly.

---

## Quick Start for This Site
1. `rec.js` is included on all 8 pages ✅
2. Product page shows "✨ Similar Sarees" automatically ✅
3. Want more aggressive personalization? Enable the **Firestore events** sync:
   `REC.trackView` already records locally — extend it to push `{user,productId,type}` to Firestore `events`, then the admin can see "top co-viewed pairs" and the engine can boost globally.
4. Test in preview: open any product → scroll to "✨ Similar Sarees" → see % match + reason chips.

© 2026 SK Sarees · Salem
