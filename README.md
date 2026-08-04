# 🪡 SK Sarees — Premium Multi-Page Redesign

Full redesign of the saree store as a **lightning-fast, mobile-first, multi-page HTML site** — no build step, no server needed. Open any page or upload the folder to Hostinger / Netlify / Vercel (static) / GitHub Pages.

## 📁 Pages

| File | What it does |
|---|---|
| `index.html` | Home — hero slider, flash-sale countdown, 17 categories, best sellers, new arrivals, today's deals, why-us + brand story, real reviews, FAQ, WhatsApp group join |
| `shop.html` | **Infinite scroll** — 72 sarees load in batches (12 at a time) as you scroll, plus manual "Load More" button · search · voice search · fabric filter · price slider · 6 sort modes |
| `product.html?id=…` | Product page — **no image popup** (photo click goes straight to the product page; thumbnails switch the main photo) · price/MRP/discount · fabric & details table · **fast delivery + on-time promise card (LATE50 ₹50 off if late)** · Add to Cart with qty · Buy Now · WhatsApp order · wishlist · share · reviews + comment box · related products · sticky mobile buy bar |
| `cart.html` | Cart with qty controls, **free-shipping progress bar (≥₹999)**, COD ₹49 note, WhatsApp order |
| `checkout.html` | 2-step guest checkout — UPI QR + GPay/PhonePe/Paytm deep links, **COD +₹49 auto**, **fast delivery ETA shown**, WhatsApp confirm for COD, success modal with order ID |
| `orders.html` | My Orders — filter chips (All/New/Confirmed/Dispatched/Delivered), **live status via Firestore**, status tracker, dispatch date + ETA, track by Order ID, success modal after placing an order |
| `admin.html` | **Store admin** — PIN login (**`1600`**), tabs: **📋 Orders (1st) · 🛍️ Products (2nd) · 📊 Dashboard (3rd)** — live orders (Firestore) with status updates (auto dispatch date + ETA, auto-Delivered after 7 days), WhatsApp **Send Confirmation / Delivery Reminder** straight to the customer, copy templates, **➕ Add Product** & **📥 Bulk Upload** (CSV/JSON), **☁️ Sync to Firestore** for the catalog |
| `profile.html` | Saved details (auto-fills checkout), wishlist, language, store info |
| `style.css` / `data.js` / `app.js` / `qrcode.min.js` | Shared premium design, data + logic, page behaviors, UPI QR library |

## ✨ What's New in This Redesign

- **Premium luxury theme** — maroon/gold/white/black, Playfair Display serif headings, gradient hero, gold-tick section titles, hover-lift cards
- **No popup on product image click** — images navigate to the product page (thumbnails switch the photo)
- **Infinite scroll** on the shop page — products keep loading as you scroll (72 products, 12 per batch)
- **Fast delivery + on-time promise** — dispatch in 24–48h, 2–4 days (TN) / 4–7 days (India), ETA shown on product/cart/checkout/orders, **late = ₹50 off (code LATE50)**
- **COD +₹49** automatic, shown clearly everywhere
- **Online payment** — live UPI QR + Pay Now deep link + GPay/PhonePe/Paytm buttons
- **72 products** (base catalog × colour variants) covering 17 categories
- **Firestore live orders** (your `sksareesapp` project) — orders save to the cloud, status updates flow to the customer's Orders page instantly; auto-Delivered 7 days after dispatch
- **English + தமிழ்** language switch
- **Original rating counts** — colour variants show the original saree's review count (no fake reduced numbers); product page shows honest star rating + real customer reviews
- **Category tiles with real photos** — each category shows a representative saree image
- **Order success — NO popup** — a clean inline success screen appears right on the checkout page (Order ID, items, total, ETA, Track + Continue buttons). No popups anywhere.
- **Order ID = #SK + numbers** — e.g. `SK1001`, `SK1002`… sequential, easy to read over WhatsApp
- **Auto-SKU** — every product gets a SKU automatically (`SKS-<CATEGORY>-<number>`, e.g. `SKS-KAN-001`), shown on the product page & admin
- **Catalog = data.js + Firestore** — store pages merge products from `data.js` AND the Firestore `products` collection (admin's "☁️ Sync to Firestore" uploads them); admin-added products appear instantly
- **Full order detail** — tap "View Order Details" to see each product with image, quantity, price breakdown, dispatch date, expected delivery, address & share
- **orders.html live sync** — new/updated orders from ANY device (Firestore) appear on the orders page in real time
- **Firestore status indicator** — orders page & admin show 🟢 Live sync / 🔴 Offline / ⚪ Local only, so you always know if cloud sync is working
- **Admin panel** — manage orders & WhatsApp automation from `admin.html` (PIN **`1600`**)

## ▶️ Run

```bash
# Option A — just open
open index.html        # or double-click

# Option B — local server (recommended for testing payment deep links)
cd sksaree && python3 -m http.server 8080
# then visit http://localhost:8080
```

**Deploy:** upload the whole `sksaree/` folder to any static host (Netlify / Vercel / Hostinger public_html / GitHub Pages). No build needed.

## ☁️ Firestore rules (for live order sync)

Console → Firestore → Rules:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /orders/{orderId} {
      allow create, read, update: if true;
      allow delete: if false;
    }
  }
}
```

## 🛠 Customize

All store settings (WhatsApp number, UPI ID, COD fee, shipping thresholds, social links, delivery ETA, late-promise text) are in the **`CONFIG`** block at the top of `data.js`. Products live in the **`BASE`** array (add colour variants automatically, or add your own products with full detail fields).

## 🛠 Admin

Open `admin.html` → PIN **`1600`** (change it in `app-admin.js` before going live). **Tabs: 📋 Orders (default) · 🛍️ Products · 📊 Dashboard.** New orders appear live (Firestore); update status per order and WhatsApp the customer confirmation / delivery reminder straight from the button. In **Products** you can **Add a product** (single form), **Bulk Upload** (one per line: `Name, Price, MRP, Category, Image URL, Badge`), and **☁️ Sync to Firestore** so the merged catalog (data.js + Firestore) reaches all visitors. Products get **auto-SKU** on creation.

### Firestore rules (needed for live cloud sync)

Console → Firestore → Rules:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /orders/{orderId} {
      allow create, read, update: if true;
      allow delete: if false;
    }
  }
}
```
If the rules aren't set, the orders page/admin shows **🔴 Offline mode** — orders still work locally, they just don't sync to the cloud.

© 2026 SK Sarees · 2/130, Thoothanoor, Edanganasalai, Salem 637502 · WhatsApp 78679 15699
