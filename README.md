# 🪡 SK Sarees — Premium Multi-Page Redesign

Full redesign of the saree store as a **lightning-fast, mobile-first, multi-page HTML site** — no build step, no server needed. Open any page or upload the folder to Hostinger / Netlify / Vercel (static) / GitHub Pages.

## 🛒 Business Features

- **Product ID == SKU** — every product's ID and SKU are the same auto-increment value (`SK20001`, `SK20002`, …). **Bulk upload** increments them automatically per line (never collides with the built-in catalog).
- **🚚 Per-saree courier** — shipping = zone fee × number of sarees: 1 saree TN ₹30 → 2 sarees ₹60 → 3 sarees ₹90; Andhra/Karnataka ₹40 each, other states ₹60 each; free above ₹999.
- **🧵 Semi-silk only** — all silks are labelled **Semi silk** (no "pure silk" claims); wash care is **Normal wash**; saree weight shown as **approx 800 g**.
- **🔍 Admin order search** — search any order by ID, customer name or phone.
- **🗑️ Multi-delete products** — admin Products tab: checkboxes (select-all in header), live "Delete Selected (N)" count, one tap deletes all chosen.
- **🧺 Abandoned Cart Recovery** — if a visitor leaves items for 30+ min, a banner appears with coupon **CART50 (₹50 off)** + **WhatsApp** and **SMS** reminder buttons + "Complete Order" link (dismissible once).
- **📅 Festival Calendar + Early Access** — home section for Aadi, Pongal, Diwali & Wedding season with tiles + an **Early Access** tile linking to the WhatsApp group (members see new collections first).
- **🔔 Notify Me** — out-of-stock products keep a **Notify Me** button: customer enters their number, it's saved locally and a WhatsApp request is sent to the store owner so you can notify them when stock returns.

## 🎬 Videos · Stock Urgency · Extras

- **🎬 Video catalog** — a "Video Catalog" section on the home page embeds YouTube videos (config: `CONFIG.videos` in `data.js` — replace the sample IDs with your own store videos).
- **📹 Product videos** — optional YouTube video per product: add the URL in **Admin → Products → Add / Edit → "Video URL (YouTube)"**; the product page embeds it under the gallery.
- **🖼️ Gallery swipe + zoom** — product photos swipe left/right on mobile (👈👉 hint) and tap for full-screen zoom; thumbnails switch photos.
- **🖼️ Hero banner image** — home hero now has a real photo background (`images/hero-banner.jpg`, generated) with a maroon overlay.
- **⭐ Google reviews** — "Rate us on Google" link (your `g.page/r/CSQ5w7DqPWbXEAE/review`) on the home reviews section and in the footer social row (`CONFIG.googleReview`).
- **🔥 Low stock urgency** — stock ≤ 5 shows "🔥 Only N left — order soon!" on shop cards and the product page.
- **😞 Out of stock** — out-of-stock products stay **visible** (never hidden) on shop & product pages with an "Out of Stock" badge, disabled Add-to-Cart/Buy-Now, but WhatsApp order still available; `addToCart` blocks adding them.
- **SKU / Product ID** — auto-increment `SK` + 5 digits (`SK10001`, `SK10002`, …). Catalog SKUs are sequential; admin-added products get the next number automatically.
- **Order confirm → scroll to top** — after placing an order the success message renders and the page scrolls smoothly to the top.
- **Layout tweaks** — `.offchip` discount chip moved to the **left** (top-left, below the badge); footer `.foot-grid` uses `grid-auto-flow: column`.

## 📱 Installable App (PWA)

The site is **installable as an app**: `manifest.webmanifest` + `icons/icon-192.png` + `icons/icon-512.png` are linked on **every page** (plus apple-touch-icon for iPhone). On Android Chrome / iPhone Safari, users get **"Add to Home Screen / Install App"** and the store opens full-screen like a native app. No service worker needed for a basic installable static site.

- **Order success page** — bulletproof: placing an order always shows the success screen (Order ID, summary, Your Orders list, Track + All My Orders). It never crashes even if a cart product was deleted (defensive item mapping + try/catch).
- **Checkout remembers your address** — every keystroke is saved as a draft (`sk_co_draft`), so if you leave the page and come back, name/phone/address/PIN are already filled (draft → saved profile → empty).
- **⚡ Buy Now is bright orange** — the most-liked buy color in Indian e-commerce (Amazon/Flipkart style); stands out against maroon Add to Cart and green WhatsApp buttons. Product page + sticky bar.
- **Full white background** — `--bg` is now `#ffffff`; cards/chips keep soft borders so everything stays clean and readable.

## ⚡ Performance & Fixes

- **No more page hanging** — fixed a critical **infinite loop**: saving orders no longer triggers a Firestore re-push, so the write→snapshot→write cycle (which froze the admin page) is gone.
- **Orders page pagination (customer)** — `orders.html` shows the **first 10 orders only**; tap **"Load More Orders ↓"** for the next 10 (25 orders → 10 → 20 → 25). Fast, no full-list render.
- **View Order Details = instant toggle** — details open **inline** with a tap (no page reload, URL unchanged) and close with a second tap or the ✕ Close button. Deep links (`orders.html?id=SK1001&data=…`) still open details directly.
- **Admin orders pagination** — the Orders tab shows the **first 10 orders** with a **"Load More Orders ↓"** button for the next 10 (fast, no full-list render).
- **Admin product search + pagination** — 🔍 search box filters by name / SKU / category / colour, and the list shows **first 10 products** with a **"Load More Products ↓"** button (fast on 70+ products).
- **Admin reviews pagination** — the ⭐ Reviews tab shows **first 10 reviews** with a **"See More Reviews ↓"** button for the next 10.
- **Infinite scroll on shop** — products auto-load as you scroll (IntersectionObserver) plus the Load More button.
- **QR code** renders reliably on the UPI checkout step (waits for the library, retries).
- **Products never show "Product not found" when they exist in Firestore** — the product page first shows a brief "Loading product…" and **fetches the product from Firestore** (by id, SKU, or doc id) before ever showing a not-found screen. Found products are saved locally so they appear instantly next time.
- **Products load & save silently to localStorage** — Firestore products are cached (`sk_products_cloud`) and merged into the catalog on every visit with **no network needed**; admin edits (`sk_products`) override the base catalog. No popups, no errors.
- **Images always load** — every photo first tries the CDN URL, falls back to the **local `images/products/` copy** (shipped in this folder), and only then to a branded placeholder — **no broken image icons**, even offline or in sandboxed previews.
- **Write-light Firestore sync (quota-safe)** — orders are pushed to the cloud **once each** (tracked in `sk_orders_synced`), products are pushed **only when the admin edits them**, collections are seeded **once per device**, and order listeners run **only on orders.html & admin**. This stops the free Firestore daily quota from being burned by page loads.
- **Cloud sync debounced** — Firestore snapshots are debounced (300ms) so rapid updates never jank the page.

## 🔄 Fresh Clean JavaScript (error-free)

The `app.js` and `app-admin.js` were **fully rewritten from scratch** (no leftover patches):
- Every page renders with **zero JS errors** (verified on all 8 URLs).
- Product cards are **plain `<a href>` links** — nothing blocks navigation, so clicking any product always opens it.
- Admin tabs use `type="button"` + LS-based auth — **tabs never close/refresh**.
- Simple, defensive code with `try/catch` on every page render.

## 📁 Pages

| File | What it does |
|---|---|
| `index.html` | Home — hero slider, flash-sale countdown, 17 categories, best sellers, new arrivals, today's deals, why-us + brand story, real reviews, FAQ, WhatsApp group join |
| `shop.html` | **Infinite scroll** — 72 sarees load in batches (12 at a time) as you scroll, plus manual "Load More" button · search · voice search · fabric filter · price slider · 6 sort modes |
| `product.html?id=…` | Product page — **BIG photo** (never cropped, tap to full-screen zoom) · **thumbnail strip** (multiple photos from Firestore `images`/`imgs` arrays, tap to switch) · **❤️ Like button** on photo + on every shop card (wishlist) · price/MRP/discount · fabric & details table · **fast delivery + on-time promise card (LATE50 ₹50 off if late)** · big **🛒 Add to Cart** + **⚡ Buy Now** + WhatsApp order buttons · reviews + comment box · related products · sticky mobile buy bar · **auto-loads products from Firestore if not found locally** |
| `cart.html` | Cart with qty controls, **free-shipping progress bar (≥₹999)**, COD ₹70 note, WhatsApp order |
| `checkout.html` | 2-step guest checkout — UPI QR + **one-tap GPay / PhonePe / Paytm app buttons**, generic "Pay Now" deep link + UPI ID copy, **COD +₹70 auto**, **fast delivery ETA shown**, WhatsApp confirm for COD, success modal with order ID |
| `orders.html` | My Orders — **pagination (first 10 + "Load More Orders ↓")**, filter chips (All/New/Confirmed/Dispatched/Delivered), **status tracker** (saved on device), dispatch date + ETA, **fast inline View Order Details toggle**, track by Order ID (inline, no reload), success screen after placing an order |
| `admin.html` | **Store admin** — PIN login (**`1600`**), tabs: **📋 Orders · 🛍️ Products · ⭐ Reviews · 📊 Dashboard** — orders saved locally appear instantly, status updates (auto dispatch date + ETA, auto-Delivered after 7 days), WhatsApp **Send Confirmation / Delivery Reminder** straight to the customer, copy templates, **➕ Add Product** & **📥 Bulk Upload** (CSV/JSON), **🔍 product search** (name/SKU/category/colour), **Products paginated 10 at a time + "Load More"**, **⭐ Reviews paginated 10 at a time + "See More"** with delete for moderation |
| `profile.html` | Saved details (auto-fills checkout), wishlist, language, store info |
| `style.css` / `data.js` / `app.js` / `qrcode.min.js` | Shared premium design, data + logic, page behaviors, UPI QR library |

## ✨ What's New in This Redesign

- **Premium luxury theme** — maroon/gold/white/black, Playfair Display serif headings, gradient hero, gold-tick section titles, hover-lift cards
- **No popup on product IMAGE in shop cards** — card images navigate straight to the product page (no lightbox on cards)
- **Product photo zoom** — on the product page, tapping the big photo opens a full-screen zoom (tap ✕ or outside to close); thumbnails switch the photo instantly
- **Infinite scroll** on the shop page — products keep loading as you scroll (72 products, 12 per batch)
- **Fast delivery + on-time promise** — dispatch in 12–24h (COD 24–48h), delivery 2–3 days (TN) / 3–4 days (Andhra-Karnataka) / 5–7 days (other states), ETA shown on product/cart/checkout/orders, **late = ₹50 off (code LATE50)**
- **COD +₹70** automatic, shown clearly everywhere
- **Online payment** — live UPI QR + Pay Now deep link + **one-tap GPay / PhonePe / Paytm app buttons** (each opens its own app with the order amount pre-filled)
- **Shipping ₹30** — flat shipping is now **₹30** (free above ₹999), shown on cart/checkout/orders automatically. **COD is +₹70** extra at delivery, shown everywhere (FAQ, promo strip, cart, checkout, WhatsApp templates)
- **72 products** (base catalog × colour variants) covering 17 categories
- **Orders saved on device** — placed orders appear instantly in My Orders & the admin panel; auto-Delivered 7 days after dispatch
- **English + தமிழ்** language switch (moved to Profile page only — the header dropdown was removed for a cleaner look)
- **Clear page titles** — every page shows a bold maroon page heading (Shop All Sarees · Your Cart · My Orders · My Profile · Secure Checkout…)
- **Original rating counts** — colour variants show the original saree's review count (no fake reduced numbers); product page shows honest star rating + real customer reviews
- **Category tiles with real photos** — each category shows a representative saree image
- **Order success — NO popup** — a clean inline success screen appears right on the checkout page (Order ID, items, total, ETA, Track + Continue buttons). No popups anywhere.
- **Order ID = #SK + numbers** — e.g. `SK1001`, `SK1002`… sequential, easy to read over WhatsApp
- **Auto-SKU** — every product gets a SKU automatically (`#SK-<MMDD>-<3 digits>`, e.g. `#SK-0805-129` — date-based + stable per product), shown on the product page & admin
- **Order ID** — `ORD-<MMDD>-<HHMMSS>-<3 digits>` (e.g. `ORD-0805-104537-372`) — date, time and 3 random digits, guaranteed unique
- **Dispatch 12–24 hrs** (COD: 24–48 hrs)
- **Delivery by state** — Tamil Nadu **2–3 days** (shipping ₹30) · Andhra & Karnataka **3–4 days** (₹40) · other states **5–7 days** (₹60) · **COD = 5–7 days** everywhere · free shipping above ₹999
- **Products in data.js + admin-added** — base catalog from `data.js`, plus products you add via the admin (saved on device); images load from public URLs
- **Full order detail** — tap "View Order Details" to see each product with image, quantity, price breakdown, dispatch date, expected delivery, address & share
## 📸 Product Images — LOCAL-FIRST (never broken)

Product photos are **local-first**: every catalog image points at **`images/products/…`** inside the site folder, which ships with the repo (10 photos from `sksaree-images-backup.zip`). This means images show on **any static host and in live previews with zero setup** — no CDN dependency.

- Firestore products may carry their own remote URLs (e.g. Blogger). If any image fails to load, the page **automatically falls back** to the **local `images/products/` copy**, then to a branded "SK Sarees" placeholder — so you will **never see a broken image icon**.
- `CONFIG.imageBase` is kept for future CDN use — if you later upload the photos to `https://sksaree.shop/images/products/…`, you can flip the `img()` helper (top of `data.js`) to use it as the primary source.

**Setup (already done):**
1. `images/products/` with all 10 photos ships inside `sksaree/` — the site works standalone.
2. (Optional) Upload the `images/` folder to your hosting root too — same relative path works everywhere.
3. Category tiles, product cards, product page main photo **and thumbnails** all use the same local images.

> 👉 You can also set individual public URLs in the admin Add/Bulk product forms (those keep the fallback chain).

## 🔁 Unified Sync — localStorage + Firestore on EVERY page

A single `Sync` layer makes **all pages** (index, shop, product, cart, checkout, orders, profile, admin) save to **both** local storage (multi-tier: localStorage → sessionStorage → memory) **and** Firestore, and pull cloud data back on load:

- **Orders — strict device isolation** — a customer's `orders.html` shows **only the orders placed on that device** (local `sk_orders`). Every placed order is stamped with a **device ID** (`sk_device_id`), and the user page filters to `myOrders()`. Cloud orders are **never** written into `sk_orders` — the **admin** page shows everyone's orders in a **runtime-only** merge (`fsOrders` + device orders) that is never saved to the device's own order list, so even the owner's "My Orders" stays clean.
- **Reviews** — saved locally + Firestore; admin ⭐ Reviews merges both and deletes from both; delete button is compact.
- **Products** — base catalog from `data.js` **plus** products synced to the Firestore `products` collection are merged (both show); admin adds appear everywhere; the merged list is cached to localStorage (`sk_products_cloud`) so cloud products load instantly on every visit, no network needed.
- **Write-light by design** — orders push to Firestore **once each** (`sk_orders_synced`), products push **only on admin edit**, collections seed **once per device** (`sk_seed_done`), and live order listeners run **only on orders.html & admin** — so the Firestore free tier (50k reads / 20k writes per day) is never burned by ordinary page views.
- **View Order Details** — tap-to-open **inline** (no reload) with a close button; deep links carry the order in the URL (`?id=SK1001&data={…}`), and the detail renders in its own container (`#trackDetail`) that the live list re-render can never overwrite — so details **always show**, even in sandboxed previews with zero storage.
- `Sync.run()` is called on every page init.
- **Admin tabs never close** — admin login now uses the multi-tier storage (`LS`, with memory fallback) so it survives environments where sessionStorage is blocked, and all tab buttons are `type="button"`. Verified: Orders · Products · Reviews · Dashboard all stay open.
- **orders.html always shows orders** — every link to `orders.html` (header nav, drawer, footer, "All My Orders") automatically appends the orders to the URL (`?orders=…`), so the page shows them even with **zero storage**. Combined with the `?placed=&data=` success flow and localStorage/Firestore, the orders page can't be empty when you just placed an order.

## ☁️ Firestore — Orders + Reviews sync (optional)

Orders **and** Reviews sync to Firestore (project `sksareesapp`) — products stay in `data.js` (local).

- **Orders** — placed orders save locally **and** to Firestore. The admin Orders tab **listens live**, so orders from any device appear automatically; status updates (dispatch date, ETA, auto-Delivered) push back to Firestore too.
- **Reviews** — product reviews save locally **and** to Firestore. The admin ⭐ Reviews tab merges local + cloud reviews and lets you **delete from both** (spam moderation).
- **Quiet & safe** — everything works locally first; Firestore never blocks the site. No probes, no reserved IDs, no scary status — the badge shows **☁️ syncing…** while connecting, **🟢 Cloud sync on** when connected, otherwise **💾 Saved on device**.
- **Order confirmation is 100% visible** — after placing an order, the **same page** shows:
  1. 🎉 Success banner with Order ID
  2. The placed order summary (items, shipping, COD, total, ETA)
  3. A **📦 Your Orders list right below** — the new order card appears immediately
  4. **📋 "All My Orders" button** — links to `orders.html?orders={full list}` carrying ALL orders in the URL, so the orders page shows them **even with zero storage** (sandboxed previews). The orders page also reads `?orders=` / `?placed=&data=` payloads and seeds them first.
  No navigation or storage required, so it **always works** — even in sandboxed previews where localStorage is blocked. Orders are also saved to storage (localStorage → sessionStorage → memory fallback) and synced to Firestore when available, so they appear in the dedicated `orders.html` All tab too.
- **Track-by-ID** searches local → cloud (Firestore) → helpful "Ask on WhatsApp" if truly not found.
- To enable: paste these rules in Firebase Console → Firestore → Rules:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /orders/{orderId} { allow create, read, update: if true; allow delete: if false; }
    match /reviews/{reviewId} { allow read, create: if true; allow delete: if true; }
  }
}
```
> Change the project by editing `FIREBASE_CONFIG` at the top of `data.js` (currently `sksareesapp`).

> ⚠️ **If cloud sync suddenly stops** (badge stays on "💾 Saved on device"): the free Firestore daily quota (50k reads / 20k writes) may be exhausted for the day. It resets automatically at **midnight US Pacific (≈12:30 PM IST)**. The store keeps working 100% locally during this time — orders are saved on the device and sync up automatically once quota frees (each new order is pushed once). The new write-light sync prevents this from happening in normal use.

### 🗄️ Full database structure (collections)

The admin **Dashboard → 🗄️ Firestore Collections → "Setup / Sync Database"** button (and every admin login) creates these collections in your project:

| Collection | Purpose | Documents |
|---|---|---|
| `admins` | store owners/roles | `owner` |
| `cart` | carts for logged-in users | `_meta` |
| `categories` | all 19 saree categories | `silk`, `cotton`, `kanchipuram`, … |
| `customers` | customer profiles | `_meta` |
| `inventory` | stock mirror | `_meta` |
| `orders` | customer orders (live sync) | `SK…` |
| `products` | products (data.js + cloud merge) | product ids |
| `promos` | coupons/offers | `aadi-sale` (AADI10) |
| `reviews` | customer reviews (live sync) | `r…` |
| `settings` | store details (name, UPI, WhatsApp…) | `store` |

**Firestore rules** (Console → Firestore → Rules) — allow the app to read/write these:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /orders/{orderId}      { allow create, read, update: if true; allow delete: if false; }
    match /reviews/{reviewId}    { allow read, create: if true; allow delete: if true; }
    match /products/{productId}  { allow read: if true; allow write: if true; }
    match /categories/{doc}      { allow read: if true; allow write: if true; }
    match /settings/{doc}        { allow read: if true; allow write: if true; }
    match /{collection}/{doc}    { allow read, create, update: if true; allow delete: if false; }
  }
}
```
> ⚠️ The last catch-all rule is convenient for getting started; tighten it before launch (e.g. `request.auth != null` for writes).

## ▶️ Run

```bash
# Option A — just open
open index.html        # or double-click

# Option B — local server (recommended for testing payment deep links)
cd sksaree && python3 -m http.server 8080
# then visit http://localhost:8080
```

**Deploy:** upload the whole `sksaree/` folder to any static host (Netlify / Vercel / Hostinger public_html / GitHub Pages). No build needed.

## 🛠 Customize

All store settings (WhatsApp number, UPI ID, COD fee, shipping thresholds, social links, delivery ETA, late-promise text) are in the **`CONFIG`** block at the top of `data.js`. Products live in the **`BASE`** array (add colour variants automatically, or add your own products with full detail fields).

## 🛠 Admin

Open `admin.html` → PIN **`1600`** (change it in `app-admin.js` before going live). **Tabs: 📋 Orders (default) · 🛍️ Products · ⭐ Reviews · 📊 Dashboard.**

- **📋 Orders** — orders placed on this device appear instantly; update status per order (Placed → Confirmed → Shipped → Delivered, with auto dispatch date + ETA and auto-Delivered after 7 days); **Send Confirmation / Delivery Reminder** open WhatsApp straight to the customer.
- **🛍️ Products** — **🔍 search** (name / SKU / category / colour), **Add a product** (single form) or **Bulk Upload** (one per line: `Name, Price, MRP, Category, Image URL, Badge`). List is **paginated 10 at a time + "Load More Products ↓"**. Products get **auto-SKU**; added products appear in the store instantly.
- **⭐ Reviews** — **first 10 reviews + "See More Reviews ↓"** for the next 10; every review has a **🗑️ Delete** button to remove spam/abuse.
- **📊 Dashboard** — totals, new/confirmed/shipped/delivered counts, and sales amount.

© 2026 SK Sarees · 2/130, Thoothanoor, Edanganasalai, Salem 637502 · WhatsApp 78679 15699
