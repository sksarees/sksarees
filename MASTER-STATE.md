# SK Sarees — Master State & Handoff (save this, start a fresh chat)

> **Last updated:** 2026-08-16 · **Purpose:** old chat is huge → phone hangs. Open a NEW chat in Arena and say: "Open sksaree/MASTER-STATE.md and continue." Everything needed is here.

## 📍 The store
- Folder: `/home/user/sksaree/` — static site (no build step), deploy to any static host. Domain: `www.sksaree.shop`.
- Seller: Edanganasalai, Salem, Tamil Nadu 637502 · WhatsApp +91 78679 15699 · UPI `sk7867915699-1@oksbi` (SK SAREES).
- Admin: `admin.html` → PIN `1600`.

## 🏗️ CURRENT architecture (do not "improve" without asking)
- **Products load ONLY from `catalog.json`** (ships with the site, preloaded in every page `<head>`). Firestore is used ONLY for **qty, reviews, orders**. Customer pages do ZERO Firestore product reads.
- Admin flow for products: add/edit/delete (local) → **⬇️ Download catalog.json** (Admin → 🛍️ Products) → upload to host root. **📦 Upload catalog.json** restores from backup.
- Product links everywhere = classic `product.html?id=<id>` (no `product/<sku>.html`, no `share/` folder, no `products.js` — all deleted).
- `catalog.json` images are **absolute https** (`https://www.sksaree.shop/images/products/….jpg`); host keeps the photo files, repo has none.
- **REMOVED from product page (per user):** Buy on WhatsApp (Instant Confirmation), ⚡ Fast Order, 📞 Call to Order, 🎨 Try-On, 📥 Download Photo, 📸 Share Photo, 📱 Instagram Share. KEPT: 🛒 Add to Cart, ⚡ Buy Now, 💬 Chat on WhatsApp, WhatsApp Share, WhatsApp Share — Groups, 🔗 Copy Link, social chips (FB/X/TG/WA/Pinterest/LinkedIn).
- Birthday coupon = **BDAY1 (1% off)**, shown once in profile. Loyalty = **1 point per ₹75**, 1 point = ₹1 off. Reseller = 5% of order, GPay only, min ₹100.
- Coupons: AP5/CART50/LATE50/SHARE50, all % capped 5%. Online payment 1% off, COD full price + ₹70 booking.
- Delivery: TN ₹30 (2–3d), AP/KA ₹40 (3–4d), others ₹60 (5–7d), free ≥ ₹999, COD 5–7d.
- Order IDs `ORD-<MMDD>-<HHMMSS>-<3d>`; SKU = `SK` + 4 random digits. Orders device-local for customers; admin sees everyone's (last 30 days).

## ✅ Test status
- 53 test suites in `/home/user/*-test.js`, ALL PASS (53/53).
- Run: server `python3 -m http.server 8150 --bind 0.0.0.0` in `sksaree/`; `npm install jsdom --no-audit --no-fund` if missing; run `bash /home/user/run_all_tests.sh`.

## 📋 Deploy checklist (upload to host root)
`index.html shop.html product.html cart.html checkout.html orders.html profile.html admin.html share-earn.html feed.html` + festival/blog pages · `data.js app.js app-admin.js rec.js style.css` · `catalog.json` (regenerated) · `products-feed.xml google-merchant-feed.txt sitemap.xml robots.txt` · `products.js`?? NO — deleted · `product/` folder → only `index.html` (host must DELETE old `product/SK*.html` + old `products.js` + old `catalog.json`) · `manifest.webmanifest sw.js icons/ images/` (images/products/*.jpg stay ON HOST, not in repo) · `tools/generate-product-pages.js` regenerates catalog.json + feeds + sitemap from local `products.json`.

## ⚙️ Key Firebase (active project `sksareesapp`)
apiKey `AIzaSyC351uS2-LkxIeDNCqhScnlGzHjoJ9KkOY` · authDomain `sksareesapp.firebaseapp.com` · projectId `sksareesapp` · storageBucket `sksareesapp.firebasestorage.app` · messagingSenderId `774983284365` · appId `1:774983284365:web:e03c9b2337d041986fd4c4` · measurementId `G-QGHYX73WG6`. Meta Pixel `1017916097675955`, GA4 `G-J1W5VVY48L`, Clarity `xuykvctr73`.

## 🧭 User priorities (always)
No page hangs · fast loads · instant product display · all URLs work · silent saves · no demo data · low Firestore reads · simple (no confusing uploads) · order-quota-safe · Tamil-friendly replies with emoji.

### 2026-08-16 quick changes
- Home hero: "Visitors / Orders" badges REMOVED (only "⭐ 2,300+ Happy Customers" + "🚚 Free above ₹999"). Footer site-stats line removed. Internal counters still run but never shown.
- Reseller link VIEW COUNT removed everywhere: profile "Link views 👁 N" box gone, admin reseller row has no "👁 N views", bumpResellerView no longer called (function still defined, harmless). ?ref= still claims orders.
- Admin bulk panel: "📦 Upload catalog.json (backup restore)" + 💡 note explaining: ⬇️ Download → upload to host = customers see changes; 📦 Upload = load saved copy back into Admin (backup). Website loads ONLY catalog.json for products.

### 2026-08-16 — catalog-wise admin products (bulk)
- Admin → 🛍️ Products is now **catalog-wise**: category chips (All + each catalog with count) filter the list; "All" view groups products under category headers with a per-group **⬇️ CSV** button.
- **⬇️ Download Products CSV (edit)** = all products; **⬇️ CSVs — catalog wise** downloads ONE file per category (`catalog-<slug>.csv`) sequentially (memory-friendly).
- **CSV upload is header-aware** (works with exported files incl. sku column, or any column order) and **catalog-wise**: a file named `catalog-<slug>.csv` auto-assigns that category to new rows; a `Category` column also works. Edit one catalog at a time → re-upload → ⬇️ Download catalog.json → upload to host.
- **Single product add** (➕ Add Product) also writes ONE Firestore doc as backup (`FS.saveProduct`); bulk/CSV = catalog.json only. Customers still load products ONLY from catalog.json.
- Fixed pre-existing bug: `bulkPartsToProduct` read category from the image column; now reads column 5 (`parts[4]`).
