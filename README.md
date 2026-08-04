# 🪡 SK Sarees — Premium Multi-Page Redesign

Full redesign of the saree store as a **lightning-fast, mobile-first, multi-page HTML site** — no build step, no server needed. Open any page or upload the folder to Hostinger / Netlify / Vercel (static) / GitHub Pages.

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
| `product.html?id=…` | Product page — **no image popup** (photo click goes straight to the product page; thumbnails switch the main photo) · price/MRP/discount · fabric & details table · **fast delivery + on-time promise card (LATE50 ₹50 off if late)** · Add to Cart with qty · Buy Now · WhatsApp order · wishlist · share · reviews + comment box · related products · sticky mobile buy bar · **auto-loads products from Firestore if not found locally** |
| `cart.html` | Cart with qty controls, **free-shipping progress bar (≥₹999)**, COD ₹49 note, WhatsApp order |
| `checkout.html` | 2-step guest checkout — UPI QR + **one-tap GPay / PhonePe / Paytm app buttons**, generic "Pay Now" deep link + UPI ID copy, **COD +₹49 auto**, **fast delivery ETA shown**, WhatsApp confirm for COD, success modal with order ID |
| `orders.html` | My Orders — **pagination (first 10 + "Load More Orders ↓")**, filter chips (All/New/Confirmed/Dispatched/Delivered), **status tracker** (saved on device), dispatch date + ETA, **fast inline View Order Details toggle**, track by Order ID (inline, no reload), success screen after placing an order |
| `admin.html` | **Store admin** — PIN login (**`1600`**), tabs: **📋 Orders · 🛍️ Products · ⭐ Reviews · 📊 Dashboard** — orders saved locally appear instantly, status updates (auto dispatch date + ETA, auto-Delivered after 7 days), WhatsApp **Send Confirmation / Delivery Reminder** straight to the customer, copy templates, **➕ Add Product** & **📥 Bulk Upload** (CSV/JSON), **🔍 product search** (name/SKU/category/colour), **Products paginated 10 at a time + "Load More"**, **⭐ Reviews paginated 10 at a time + "See More"** with delete for moderation |
| `profile.html` | Saved details (auto-fills checkout), wishlist, language, store info |
| `style.css` / `data.js` / `app.js` / `qrcode.min.js` | Shared premium design, data + logic, page behaviors, UPI QR library |

## ✨ What's New in This Redesign

- **Premium luxury theme** — maroon/gold/white/black, Playfair Display serif headings, gradient hero, gold-tick section titles, hover-lift cards
- **No popup on product image click** — images navigate to the product page (thumbnails switch the photo)
- **Infinite scroll** on the shop page — products keep loading as you scroll (72 products, 12 per batch)
- **Fast delivery + on-time promise** — dispatch in 24–48h, 2–4 days (TN) / 4–7 days (India), ETA shown on product/cart/checkout/orders, **late = ₹50 off (code LATE50)**
- **COD +₹49** automatic, shown clearly everywhere
- **Online payment** — live UPI QR + Pay Now deep link + **one-tap GPay / PhonePe / Paytm app buttons** (each opens its own app with the order amount pre-filled)
- **72 products** (base catalog × colour variants) covering 17 categories
- **Orders saved on device** — placed orders appear instantly in My Orders & the admin panel; auto-Delivered 7 days after dispatch
- **English + தமிழ்** language switch
- **Original rating counts** — colour variants show the original saree's review count (no fake reduced numbers); product page shows honest star rating + real customer reviews
- **Category tiles with real photos** — each category shows a representative saree image
- **Order success — NO popup** — a clean inline success screen appears right on the checkout page (Order ID, items, total, ETA, Track + Continue buttons). No popups anywhere.
- **Order ID = #SK + numbers** — e.g. `SK1001`, `SK1002`… sequential, easy to read over WhatsApp
- **Auto-SKU** — every product gets a SKU automatically (`SKS-<CATEGORY>-<number>`, e.g. `SKS-KAN-001`), shown on the product page & admin
- **Products in data.js + admin-added** — base catalog from `data.js`, plus products you add via the admin (saved on device); images load from public URLs
- **Full order detail** — tap "View Order Details" to see each product with image, quantity, price breakdown, dispatch date, expected delivery, address & share
## 📸 Product Images — 3-step fallback (never broken)

Product photos load from **public URLs** built from `CONFIG.imageBase` (default `https://sksaree.shop/`). If a photo fails to load, the page **automatically falls back** to the **local `images/products/` copy** (shipped in this folder), and only then to a branded "SK Sarees" placeholder. So you will **never see a broken image icon** — even offline or in sandboxed previews.

**To serve real photos (recommended):**
1. Your saree photos are saved in **`sksaree-images-backup.zip`** (in the workspace root) — extract it. The `images/products/` folder with all 10 photos already ships inside `sksaree/`, so the site works standalone.
2. (Optional) Upload the `images/` folder to your CDN too, so `https://sksaree.shop/images/products/kanchipuram-silk.jpg` resolves — the primary path.
3. If you use a different host/CDN, change `imageBase` in `data.js` (top of file) to that root URL — all products, category tiles and order images update automatically.

> 👉 You can also set individual public URLs in the admin Add/Bulk product forms.

## 🔁 Unified Sync — localStorage + Firestore on EVERY page

A single `Sync` layer makes **all pages** (index, shop, product, cart, checkout, orders, profile, admin) save to **both** local storage (multi-tier: localStorage → sessionStorage → memory) **and** Firestore, and pull cloud data back on load:

- **Orders** — saved locally + Firestore; listed on orders.html & admin; status updates push to Firestore.
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
