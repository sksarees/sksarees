# 🪡 SK Sarees — Premium Multi-Page Redesign

Full redesign of the saree store as a **lightning-fast, mobile-first, multi-page HTML site** — no build step, no server needed. Open any page or upload the folder to Hostinger / Netlify / Vercel (static) / GitHub Pages.

## 📦 Catalog & Auto-cleanup (latest)

- **Demo products removed** — the data.js demo catalog is gone. Products now come **only from the admin (`sk_products`) and Firestore** (`sk_products_cloud` cache). The store shows exactly what you add/manage.
- **Auto-delete orders** — **Admin keeps 30 days** (local purge + cloud filtered to last 30 days); **user "My Orders" keeps 90 days**. Old orders vanish automatically, so the store never accumulates stale data.
- **Instant product updates** — when the admin edits/saves products, **open user pages re-render instantly** (storage event + REC invalidation), no manual refresh.
- **Festival auto-update** — the promo strip and Festival Calendar detect today's date and highlight the **live festival** (Aadi ~17 Jul–17 Aug, Pongal ~10–20 Jan, Diwali ~15 Oct–15 Nov, default Wedding season): "Aadi Sale Special — Up to 40% OFF" + the live tile shows **Now live**.
- **Abandoned-cart messages** (WhatsApp/SMS/push) now include a **"Complete your order" link to `cart.html`**.
- **WhatsApp logo icon** — every WhatsApp button (buy, share, cart, floating chat, admin templates) now shows the **official WhatsApp SVG logo** instead of the 💬 emoji.
- **Engaging prefilled WhatsApp messages** — product/cart/share messages are friendlier and point customers to the website (www.sksaree.shop), so reach grows.

## 🔴 Live Order Status (admin → customer, instant)

When the **admin changes an order status** (Confirmed / Shipped / Delivered / Payment Pending), the **customer's open `orders.html` page updates instantly** — no refresh needed:

- A live Firestore listener on the customer page merges **only this device's orders** (isolation is preserved — other customers' orders never appear).
- The order card pill + status-track change immediately, and the **open detail view** refreshes too (via `listenOrder`).
- A toast shows the change ("📦 Order ORD-… → shipped") so the customer notices.
- The **track-by-ID** detail also live-updates if the admin changes the status while the customer is viewing it.

**Note:** requires Firestore sync (project `sksareesapp`) to be enabled and reachable — the same cloud that powers the admin. Works on HTTPS with the rules from this README.

## 💰 Low-Profit Boost + Smart Shopping (latest)

1. **🔒 All % coupons capped at 5%** — `CONFIG.couponCap:5`. Defaults: `AP5` (5%), flat ₹50 coupons stay. Low-margin strategy = more buying (per your call).
2. **💳 1% online-payment discount** — Buy Now shows **"Buy at ₹1,287"** for a ₹1,300 saree (1% off online only); **COD = full price**. Product page shows **Old price + New price** line + "Pay online & save 1%" note; checkout review & success add the online-discount row.
3. **🔍 Advanced Filters + Smart Search** — shop page now filters by **Fabric · Colour · Occasion · Length · Blouse-included** PLUS **📷 visual search**: upload a photo → dominant colour detected (canvas) → matching sarees shown.
4. **📷 Photo reviews** — review form has "Add photo (optional)"; uploaded photos show in the review list ("Verified customer").
5. **👀 "X people viewing right now"** — deterministic urgency on every product page.
6. **🤝 Refer & Earn** — Profile referral card: personal code + copy + WhatsApp share; friend orders with your code → you earn ₹50 margin (reseller flow) + they get ₹50 off.
7. **💬 Chat on WhatsApp** — product page direct chat button (product name + price pre-filled).
8. **🧺 Complete the Look + Frequently Bought Together** — explore sections now include matching blouse/accessories and top co-purchased picks.

## 🔧 Google Feed Fix + 🧵 Weaver + 🎨 Try-On + 🎯 Regional (latest)

1. **🔧 Google "No products displayed" FIXED** — the feed files were generated with `http://localhost:8150` URLs, which Google can't crawl → zero products shown. Now the feed generators use **`CONFIG.siteUrl` (`https://www.sksaree.shop`)** for **both** product links and image links, and the static `google-merchant-feed.txt` / `products-feed.xml` are regenerated with the real domain. (Remember: the product photos must actually exist at `https://www.sksaree.shop/images/products/…`.)
2. **🧵 Ilampillai weaver story** — home page section "Our Weaver Story — Ilampillai Looms": heritage, weaver-family support, honesty badges + CTA. Builds trust & premium feel (Salem's famous handloom village, ~20 km away).
3. **🎨 Try-On / AI colour preview** — every product page has "🎨 Try-On — Preview Colours": pick one of 9 shades and the saree photo re-colours live (CSS filter). Feels like trying on different colourways; note that real photos can be requested on WhatsApp.
4. **🎯 Regional offer popups** — state-specific one-time offer popup: saved PIN (or geolocation) → **Tamil Nadu (TNFREE) · Andhra/Telangana (AP10) · Karnataka (KA50) · Pan-India (INDIA10)**. Makes each region feel local.

## 🏆 South India #1 Pack (regional power)

1. **🌐 4 languages** — English · தமிழ் · **తెలుగు** · **ಕನ್ನಡ** (Profile → Language). Win Andhra/Telangana & Karnataka customers in their own language.
2. **✨ Skin-tone → saree colour recommender** — every product page shows "Looks great on Fair/Medium/Dusky skin" — a huge help for brides & family in South India (also reduces returns).
3. **💍 Bulk Wedding Order page** — `bulk-wedding.html` (name, occasion, count, budget → WhatsApp) — South Indian weddings order 5–50 sarees at once. Linked from footer.
4. **🌾 Festival landing pages** — `aadi-sale.html`, `pongal-collection.html`, `diwali-special.html` with SEO titles/descriptions + offers + best-deal sarees (auto). Each is a Google-magnet keyword page. In sitemap.
5. **🎉 Shop by Occasion** — home page one-tap tiles: Wedding · Reception · Puja · Office · Daily Wear · Party (each links to its category).

## 🎯 Conversion Boost (ads → orders — the SK20002 problem)

**Why ad visitors view but don't order:** full checkout (address + payment + coupon) is too much friction for a Facebook ad visitor. Fixes added:
1. **⚡ Fast Order** — a big "⚡ Fast Order — WhatsApp" button on every product page opens a **name + phone only** modal → WhatsApp with the full order pre-filled. **No address, no payment, no coupon — the seller confirms & closes on WhatsApp.** This converts ad traffic that bounces at checkout.
2. **🎯 AD SPECIAL offer** — when a visitor lands from a **Meta/Facebook ad** (`?utm_source=facebook`, `fbclid`, `gclid`, `from=ad`), the product page shows an **"AD SPECIAL — Extra 10% off with coupon AD10"** banner + Fast Order. Normal visitors don't see it.
3. **🎟️ Compact welcome popup** — smaller & simpler (name + number one row, "₹50 OFF on first order"). After entering the name, the popup says **"🎉 Welcome, {name}!"** and the **header shows "👋 Hi, {name}"** on every page (saved to the customer profile; checkout auto-fills, no re-asking).
4. **📲 Install banner only on PWA-capable devices** — the "Install App" banner now appears **only after `beforeinstallprompt` fires** (Android Chrome / desktop that support PWA) — never on unsupported devices. iOS gets a delayed hint instead.

## 🌟 Fame & Power Pack (latest — makes sksaree.shop a top saree store)

1. **🌐 SEO power** — `sitemap.xml` + `robots.txt` (Google discovers every page), **Open Graph + Twitter cards** on all pages (product pages get dynamic og:title/og:image/description), and **BreadcrumbList schema** on product pages → rich results in Google.
2. **🔥 Social proof** — product page shows "🔥 N people bought this today" + rating (deterministic per product, Bestseller boosted).
3. **👀 Recently Viewed** — tracked per device; a "Recently Viewed" strip appears on the home page → repeat engagement.
4. **🔁 Order Again** — one-tap reorder button on every order card AND in the order detail (re-adds items to cart → checkout).
5. **⭐ Loyalty Points** — earn **1 point per ₹50** spent; Profile shows balance; **cart has "Use points" checkbox** (1 point = ₹1 off); points auto-consume on order.
6. **📏 Blouse Size Guide** — expandable size chart (XS–XXL bust/waist) + tip on every product page → fewer returns.
7. **⚡ catalog.json instant load** + **📋 Leads tab** (from the previous batch) — all active.

## ⚡ Instant Firestore Products + 📋 Leads (latest)

1. **⚡ catalog.json instant load** — a static `catalog.json` ships with the site (regenerate in **Admin → 📦 Catalog Feed → "⚡ catalog.json (instant load)"** and upload to the site root). On the **first visit**, the product page reads it from the **local file** (zero network wait) → **Firestore products like `product.html?id=SK20001` render instantly — no "Loading product…"**. Firestore still refreshes the cache in the background for freshness. Works even before the Firestore cache is warm.
2. **📋 Leads collected with NAME** — the ₹50-off first-visit popup now asks for **name + number**; the lead is saved (local `sk_lead_list` + Firestore `leads`) AND stored into the **customer profile**, so the **next checkout auto-fills the number** (shows "✅ Saved customer — number auto-filled") — no re-asking.
3. **Admin → 📋 Leads tab** — every collected number with **name, phone, coupon, date** + per-lead **💬 Send Offer / 📞 Call / 📱 SMS** buttons (Firestore leads live-sync).

## ↩️ Returns & ⚡ Speed & 🛒 Merchant Feed (latest)

1. **↩️ Return & Refund Policy page** — `return-policy.html` (7-day replacement, how to request, refunds, shipping, FAQ, WhatsApp CTA), linked from footer & drawer — builds buyer trust → more orders.
2. **⚡ Instant product page** — cached products render **immediately** (no spinner); uncached ones load straight from the raw cloud cache, or a quick Firestore fetch (<1s) — the long "Loading product… hang on" screen is gone. Main product image uses `fetchpriority="high"`; Google Fonts are non-blocking (faster first paint) on every page.
3. **🛒 Google Merchant Center TXT feed** — Admin → 📦 Catalog Feed → **"⬇️ Google Merchant (TXT)"** downloads `google-merchant-feed.txt` with the exact required columns: `id, title, description, price, condition, link, availability, image_link` (72 products). A static copy also ships in the site root.

## 🎯 Orders-Boosters (added to drive sales)

1. **⚡ Festival countdown timer** — the flash-sale timer now really ticks ("7d 09h 27m" until the current festival offer ends) — urgency = conversion.
2. **⭐ Review-request button** — after every order, the success page shows "Loved it? Review us on Google" (prefilled WhatsApp) — grows your Google reviews → trust → more orders.
3. **🛒 Cart upsell** — "Complete your look — add more & save ₹50 (2+ sarees)" suggests same-category products right in the cart.
4. **🔥 Deal of the Day** — home page auto-picks the biggest-discount in-stock product each day (rotates daily) with a "Grab It Now" CTA.
5. **🎟️ First-visit coupon popup** — after ~2.5s a ₹50-off (SHARE50) popup asks for the WhatsApp number, saves it as a lead (local + Firestore `leads`), and opens WhatsApp with the offer — builds your list + converts.
6. **💬 Auto WhatsApp on status change** — when the admin updates an order status, WhatsApp auto-opens to the **customer** with the status + track link (trust → repeat orders).

## 🛍️ Conversion & UX updates (latest)

1. **⚡ Buy at ₹X** — the Buy Now buttons (main + mobile sticky bar) now say **"Buy at ₹849"** and update live with quantity (**Buy at ₹1,698** for 3 pcs), and pass the qty to checkout.
2. **📍 PIN check upgrade** — shows **"Delivery by Thu, 13 Aug"** (with weekday), COD date, shipping, and **"✅ Fulfilled by SK SAREES COLLECTION"**.
3. **🧠 30 similar + Explore More** — "✨ Similar Sarees" now shows **30 products**; below it three merchandising sections: **🛒 Customers Who Bought This Also Bought**, **🎨 Visually Similar Items**, **👀 Others Buy After Viewing This** (each up to 30).
4. **🌙 Dark mode removed** — toggle, helpers and dark CSS fully removed (per your request).
5. **👥 Real counters** — visitors come from the shared Firestore `counters/site` doc; **orders = actual Firestore orders collection count** (live listener), so the numbers are the true store totals.
6. **🗑️ Product delete fixed** — deleting now also removes the product from the local cloud cache and marks it **Inactive in Firestore**, so it never comes back on refresh/pull.
7. **🎁 Bundle total fixed** — the cart total now **subtracts the ₹50 bundle discount** correctly (2+ sarees).
8. **📦 Google Merchant Center feed** — added `g:mpn` (SKU), `g:item_group_id`, and `g:shipping` (IN) so the feed uploads cleanly to Google Merchant Center.
9. **📲 PWA easy install** — install banner (first visit) + **Install App** button in Profile + `beforeinstallprompt` capture. Works on Android Chrome / iPhone Safari (HTTPS).
10. **📊 Microsoft Clarity** — the Clarity snippet (ID `xuykvctr73`) loads on **every page** for session recordings & heatmaps.

## 🚀 Big Feature Pack (all implemented)

1. **📦 Catalog Feed XML** — Admin → **📦 Catalog Feed** tab: download `products-feed.xml` (Facebook/Instagram Shopping format: id, title, description, price, sale_price, image_link, availability, brand, google_product_category…). Upload it to your host, connect in Meta Commerce Manager, and customers can **tag & buy sarees on Instagram/Facebook**. Static `products-feed.xml` also included.
2. **💸 Wishlist price-drop alert** — prices are tracked; when a wishlist saree's price drops ₹20+, a **"Price Drop Alert!"** popup shows the new price with a View button.
3. **🎁 Bundle deal** — buy **2+ sarees → ₹50 off automatically** at checkout (config: `CONFIG.bundleCount` / `bundleOff`). Shown on cart, checkout review & success page.
4. **🇮🇳 Full Tamil UI** — expanded Tamil dictionary + translated hero, section headings, nav, footer & promo strip (toggle in Profile → Language).
5. **📖 Blog** — `blog.html` with 10 SEO topic cards + 2 full sample articles (Kanchipuram vs Semi-Silk, draping guide), linked from footer & drawer.
6. **⭐ Google Reviews section** — already live: "Write a Review" + lazy "Show Store on Map".
7. **📈 Admin sales dashboard** — **revenue bar charts (last 14 days + 8 weeks)**, **🏆 Top Products** report, **💰 Best Resellers** ranking, plus order/sales stat chips.
8. **🖼️ WebP images (auto)** — all product photos + hero have `.webp` twins; the site serves WebP when supported and falls back to `.jpg` (faster loading on mobile).
9. **🌙 Dark mode** — 🌙/☀️ toggle in the header (saved per device), full dark theme.

## 👥 Visitor & Order Counters

- **Visitor counter** — bumped once per device on first visit; Firestore increments a shared `counters/site` doc so the total grows across all devices. Shown in the hero trust strip ("👥 N Visitors") and the footer ("👥 N+ visitors · 📦 N+ orders").
- **Order counter** — reflects local orders + cloud orders, updates live (also right after a customer places an order).
- Admin dashboard can see the same totals in Firestore `counters/site`.

## 🔗 Reseller ref on EVERY page + catalog cleanup

- **`?ref=CODE` works on ALL pages** — product page, shop, home, anywhere. A visitor who lands via a reseller link is tracked (sessionStorage), so their order credits the reseller even if they browse around first.
- **Reseller shares carry their code automatically** — once a reseller registers (`sk_my_reseller` set), every product WhatsApp message and share link auto-appends `?ref=CODE` (`shareUrl()`), so "share a product → friend buys → you earn" works from any page.
- **Product page "Share & Earn ₹50" box** — under every saree: share-on-WhatsApp (with your ref), copy share link, "Get My Code" → `share-earn.html`; shows your code once registered.
- **Sample products fully removed** — the demo catalog ids are filtered out of the admin cache, the Firestore cache, and every Firestore pull, so **only your real Firestore products** ever show.
- **"Loading product…" while fetching** — when a product isn't local yet, the product page shows "Loading product… Fetching our saree collection from the cloud" and retries a few times before ever showing "Product not found".
- **Share & Earn page** — now has a **Tamil section** ("தமிழில் — Share & Earn", casual local tone) and a **"Send to Your Customer"** prefilled message (carries SHARE50 + your `?ref=` link) with Copy / Send on WhatsApp / Paste-My-Link buttons.

## 💰 Reseller / Share & Earn program (full loop)

- **Index banner** — "Share & Earn — Reseller Program" on the home page: customers get **₹50 off** with coupon **`SHARE50`**; resellers earn **₹50 margin per order** (`CONFIG.resellerMargin`).
- **Join & get a personal link** — on `share-earn.html`, a reseller enters **name + mobile** → gets a personal code (e.g. `PRI3210`) and share link (`shop.html?ref=PRI3210`) with Copy + WhatsApp share buttons.
- **Order tracking** — when a customer orders via `?ref=CODE`, the order records the **reseller (name/phone/code) + margin ₹50** automatically; the reseller's stats (orders, margin total) update locally + Firestore.
- **Admin → 💰 Resellers tab** — shows every reseller's **name, phone, code, orders count, total margin**, the **order details they brought in**, plus buttons: **💸 Pay via GPay** (opens GPay with the amount to their phone `@upi`), **Notify on WhatsApp**, **Call**. Firestore resellers merge in automatically.
- **Check Delivery + coupon inputs** — fixed alignment: input and Check/Apply buttons are equal height (50px), buttons no longer stretch full-width.

## 💰 Share & Earn page

A ready **`share-earn.html`** affiliate landing page (linked from the footer & drawer): hero banner ("Share Products & Earn Margin"), 3-step How It Works, 8 benefits, coupon-offer section, final CTA (all WhatsApp prefilled), a copyable **WhatsApp broadcast message** with a "Send on WhatsApp" button, and a Share & Earn FAQ. Uses the site header/footer theme automatically. Marketing copy source: `share-earn-content.md`.

## 🛒 Cart, Stock & Checkout (latest)

- **Quantity fixed** — the product page qty selector now actually adds that many to cart (was stuck at 1) and the **total amount updates live** as qty changes (e.g. 3×₹849 → ₹2,547 shown next to qty).
- **Stock = 1 psc model** — products have real stock (often 1). When an order is placed, **stock is consumed** and the next customer sees **Out of Stock**. Cart reservations are synced to Firestore so "one customer adds it → others see it taken".
- **Download Photo** — product page now has **📥 Download Photo** (plus the WhatsApp Share + Share Photo buttons).
- **📍 PIN code delivery check** — on the product page: enter a PIN → shows zone, shipping (₹30/40/60 per saree) and delivery days (UPI vs COD).
- **⭐ Google Reviews** — home section with "Rated on Google" + **Write a Review** link + lazy **📍 Show Store on Map** (map loads only on tap, keeps the page fast).
- **🔍 Index search** — hero search box searches by **name, SKU or colour** and jumps to the shop (`shop.html?q=…`).
- **UPI payments** — the UPI note includes the **Order ID** ("Order ORD-… SK Sarees"); after paying, order status is **⏳ Payment Pending** and the success page says *waiting for admin confirmation* (admin has a ⏳ Payment Pending filter + status option).
- **COD = ₹70 booking upfront** — "Cash on Delivery — ₹70 courier booking paid now (UPI), **remaining saree price collected at delivery**". Order records `bookingPaid: 70` and the WhatsApp message explains it.

## 🛠️ Admin & Conversion Fixes (latest)

- **Admin status fixed for cloud orders** — changing status (Confirmed/Shipped/Delivered) now works for **both** device orders and Firestore orders. Cloud status updates push to Firestore and are never written into the device's own `sk_orders`.
- **Ad generator fixed** — ad text no longer shows literal `+ CONFIG.waNumber +`; it shows the real WhatsApp number correctly (`wa.me/917867915699`, no double-91).
- **Abandoned carts** — newest first, **first 10 shown**, "Load More Carts ↓" for older 10.
- **Footer** — removed the "🛠️ Store Admin" quick link (replaced with "💬 Join WhatsApp Group"); admin is reached directly via `admin.html`.
- **Coupons got usage limits + expiry** — admin create form has **Max uses (0 = unlimited)** and **Expiry date**; usage is counted on every order (`sk_coupon_used`); expired/exhausted coupons are rejected automatically; cart & admin show "uses left" and "valid till".
- **📤 Product sharing** — product page share row: **💬 WhatsApp Share (family/group)** opens the WhatsApp contact/group picker with the product link; **📸 Photo → WhatsApp Status** shares the photo file (Web Share API on mobile; fallback opens the image for long-press → WhatsApp → My Status); **🔗 Copy Link**. Great for word-of-mouth reach.

## 🖼️ Multi-Image Products

Admin **Add / Edit product** now has **🖼️ Main Image + ➕ Extra Image 1 + ➕ Extra Image 2** fields. The product page gallery shows all photos as thumbnails (with 👈👉 swipe + tap-to-zoom). Firestore products keep working too — their `images`/`imgs` arrays merge with `img2`/`img3`.

## 📣 Meta Ads — Admin "Ad Builder"

Admin → **📣 Meta Ads** tab: pick a product (or browse the catalog) → **Generate Ad** → get a ready-to-paste **headline + primary text** (price, discount, shipping, COD, coupon, WhatsApp button) with a **tracking link** (`product.html?id=…?coupon=…`). One-tap buttons: **Copy Ad Text**, **Send to my WhatsApp**, **Share on Facebook**, plus quick links to **Meta Ads Manager / Events Manager / Business Suite** and a suggested starter budget. Works with the installed Meta Pixel (AddToCart/InitiateCheckout/Purchase are tracked automatically).

## 📈 Google Analytics (gtag.js)

**gtag.js** (GA4, ID `G-J1W5VVY48L`) loads on every page — page views, sessions, and (via the events already wired) purchases flow into Google Analytics. Edit the ID in `data.js` (`GOOGLE TAG` block) if your property changes.

## 🧠 Similar Saree Recommender (AI-style)

- **`rec.js`** — a full recommendation engine that runs client-side (works on any static host, zero backend):
  - **Content-based**: weighted attribute similarity — fabric (30) > colour (20) > design (15) > occasion (15) > price (10) > work-type (10), with complementary-colour bonuses (red↔gold…).
  - **Cold-start safe**: attributes are extracted from name/desc/fabric/colour keywords, so brand-new or Firestore-only products get recommendations instantly.
  - **Collaborative boost**: view history (`sk_viewed`) + order popularity nudge personalization over time.
  - **Fast**: attributes memoized, fabric/colour/occasion buckets narrow candidates to ~40 before scoring; results cached per product (TTL 24h) and invalidated on admin saves.
- **Product page** shows **"✨ Similar Sarees"** — 8 cards with image, price, **% match chip**, a short **reason** ("Same kanjivaram fabric…"), Add-to-Cart & WhatsApp.
- Full production guide (architecture, schema, Python scikit-learn + sentence-transformers, Node.js, LLM prompt, caching plan) in **`recommendation-system.md`**.

## 📈 Meta Pixel (Facebook Ads)

The **Meta Pixel** (ID `1017916097675955`) loads on **every page** with automatic events for ad campaigns:
- **PageView** — each page load (plus noscript fallback image)
- **AddToCart** — when a saree is added to the cart (content_ids, name, value, INR)
- **InitiateCheckout** — when an order is placed (value, currency, num_items)
- **Purchase** — order placed (value, currency, num_items, content_ids) — fires for UPI & COD

Edit the Pixel ID in `data.js` (`META PIXEL` block, `fbq('init', …)`) if you change it. Verify in **Meta Events Manager → Test Events**.

## 📣 Push Notifications (admin → customers)

- **Admin "📣 Push" tab** — lists **abandoned carts** (customers who left items 30+ min) with item details, phone, and per-cart buttons: **📣 Send Push**, **💬 WhatsApp reminder**, **📱 SMS reminder**.
- **Customers subscribe once** — Profile → "🔔 Enable Notifications" (or automatic after adding to cart). Their PushSubscription is saved (device-local + Firestore `pushsubs`), and abandoned-cart records are saved to Firestore `abandoned` so the admin sees them.
- **Web Push protocol implemented in pure browser JS** — VAPID-signed JWT (ES256) + ECDH + HKDF + AES-128-GCM (`aes128gcm`). Verified end-to-end with a decrypt round-trip test (catches malformed records).
- **Service worker** (`sw.js`) shows notifications even when the site is closed; tapping opens the cart.
- **Local notifications** — when a visitor returns with an abandoned cart, a browser notification fires immediately (works without a push service).
- **Requirements**: HTTPS (browsers require it for service workers + push). Test your device in **Admin → Push → "Test on My Device"**. If the push service blocks browser POSTs (some providers), use the WhatsApp/SMS buttons instead — the admin shows a clear message.
- **VAPID keys** — public key built into the site; private key editable in **Admin → Push** (default keypair works out of the box).

## 🎟️ Coupons · ⏰ Order Time · 🚀 SEO

- **🎟️ Coupons (user)** — cart & checkout have a coupon input: type a code (e.g. `AADI10`, `CART50`, `LATE50`), tap Apply, and the discount shows in cart, checkout review, and the success page + saved order totals.
- **🎟️ Coupons (admin)** — new **🎟️ Coupons tab** in admin: create (code / ₹flat or % / value / min cart / active), activate/deactivate, delete. Saved on device; customers can use them instantly.
- **⏰ Order date + time (AM/PM)** — order cards, order details, admin cards and success page now show date **and** time, e.g. `6 Aug 2026, 3:05 PM`.
- **🚀 SEO package** — every page injects **JSON-LD schema** (LocalBusiness on all pages, WebSite + FAQPage on home, Product + Offer + AggregateRating on product pages). Meta titles/descriptions improved on shop/cart/checkout/index. Full keyword list, blog topics, GBP & WhatsApp tips in **`seo-package.md`** (contains a ready-to-paste SEO prompt for ChatGPT/Claude/Grok).
- **🖼️ Hero banner** — now an inline `<img class="hero-bg">` (same loading path as product images) so it shows reliably in every preview, with a maroon gradient overlay for readability.

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
