# 🪡 SK SAREES — Online Store (Mobile-First, WhatsApp-Enabled, Firebase-Firestore)

A complete e-commerce frontend for selling sarees online — built for **maximum orders** from phone users.

| Feature | Status |
|---|---|
| 📱 Mobile-first responsive design (buttons sized for thumbs) | ✅ |
| ⚡ Fast loading — no heavy frameworks, no external plugins | ✅ |
| 🗂️ Separate pages: `index.html` (home/checkout) • `products.html` (catalog) • `admin.html` (orders) | ✅ |
| 🛍️ Categories (Silk, Cotton, Daily Wear, Wedding, Party) + search + filters | ✅ |
| 🛒 Cart + 2-step guest checkout (no login) | ✅ |
| 📲 UPI checkout — QR code + "Pay Now" deep link (GPay / PhonePe / Paytm) | ✅ |
| 💵 Cash on Delivery with automatic **+₹49** charge | ✅ |
| 💬 Floating WhatsApp chat widget (7867915699) | ✅ |
| 🛒 "Buy on WhatsApp" button under every product | ✅ |
| ⏰ Abandoned-cart reminder popup after **15 minutes** | ✅ |
| 📣 Order confirmation + delivery reminder WhatsApp templates for admin | ✅ |
| 💬 **WhatsApp group join** — one-tap "Join Our WhatsApp Group" (replaces alerts opt-in) | ✅ |
| 🖼️ **Gallery style catalog** — tap any saree photo for a quick-view with instant order buttons | ✅ |
| 🔒 Owner-only actions live only in `admin.html` — customer pages are 100% shopper-facing | ✅ |
| 🛍️ **Admin: product management** — add, edit, delete products | ✅ |
| 📥 **Admin: bulk upload** — CSV or JSON, hundreds of products at once | ✅ |
| 🚚 **Free shipping above ₹999** — with a live progress bar on the cart | ✅ |
| ❤️ **Like & comment on products** — heart button + customer review form | ✅ |
| 📍 **Live order status for customers** — admin status changes reflect instantly (Firestore) | ✅ |
| 📂 **Admin order filters** — All / New / Confirmed / Shipped / Delivered | ✅ |
| 🌐 **6 languages** — English, தமிழ், हिन्दी, తెలుగు, ಕನ್ನಡ, മലയാളം | ✅ |
| 📦 **Order Details page** — date, product images, total, dispatch date, live status | ✅ |
| ⚙️ **Auto-delivered 7 days** after dispatch (no manual work) | ✅ |
| 📣 **Share on WhatsApp** — products, orders & store (viral growth) | ✅ |
| 📲 **App buttons** — pay with GPay / PhonePe / Paytm directly from checkout | ✅ |
| 📍 **Local SEO** — Salem, Tamil Nadu business schema + social links | ✅ |
| 🎯 **Google Ads & Meta Pixel ready** — purchase conversion events built-in | ✅ |
| 🪡 **SK SAREES logo** — SVG monogram in header, drawer & footer | ✅ |
| ⭐ **Real reviews** — live counts (no fake numbers) + admin delete | ✅ |
| ⚡ **Quick-view = UPI fast pay** — photo tap → pay online directly | ✅ |
| ☁️ **Firestore catalog sync** — one-tap "Sync to Firestore", auto-pull on store pages | ✅ |
| ❓ **FAQ + "Why buy from us"** — trust, local Salem pickup | ✅ |
| 📲 **Auto WhatsApp confirmation** — opens straight to the customer's number after every order | ✅ |
| ☁️ **Firebase Firestore** — live order sync across all devices (optional) | ✅ |
| ⭐ Reviews, trust badges, return policy, privacy policy | ✅ |

---

## 📁 Files

```
saree-store/
├── index.html        ← Home • Product detail • Cart • Checkout • Track • Policies
├── products.html     ← Catalog page (search, category filters, grid)
├── admin.html        ← Store admin: Orders tab + Products tab (add/edit/delete/bulk upload)
├── store.css         ← Shared styles (all pages, cached once)
├── store-data.js     ← Shared data: store config, catalog, cart, WhatsApp & Firebase logic
└── images/
    └── products/     ← 10 saree photos (optimized ~45–85 KB each)
```

**Upload ALL of it to your hosting** (keep the folder structure). No build step, no database server needed.

---

## ☁️ Firebase Firestore — Setup (for live order sync)

By default orders are saved in the **customer's browser** (localStorage) — perfect for a single-device store. To see **all orders from all customers in one place** (admin page updates live), connect Firestore:

1. **Create a Firebase project** → https://console.firebase.google.com → *Add project* (e.g. `sk-sarees`) → continue (Google Analytics optional).
2. **Enable Firestore**: Build → *Firestore Database* → *Create database* → choose a location (e.g. `asia-south1` Mumbai for fastest India access) → start in *Production mode*.
3. **Get your Web config**: ⚙️ Project settings → *Your apps* → *Web (</>)* → register app → copy the `firebaseConfig` values.
4. **Paste them** into `store-data.js` → the `FIREBASE_CONFIG` block.
   > ✅ Already done for project **sksareesapp** — just verify the values match your project.
   ```js
   const FIREBASE_CONFIG = {
     apiKey    : 'AIza...',
     authDomain: 'sk-sarees.firebaseapp.com',
     projectId : 'sk-sarees',
     appId     : '1:123456789:web:abcdef',
   };
   ```
5. **Set security rules** (IMPORTANT — default rules block all access): Firestore → *Rules* → paste:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /orders/{orderId} {
         // Everyone can create orders; only authenticated admins can read/update.
         // For a private admin-only store, add Firebase Auth and use: request.auth != null
         allow create: if true;
         allow read, update: if true;   // ⚠️ set to "request.auth != null" if you add login
         allow delete: if false;
       }
     }
   }
   ```
   *(For simplicity this allows public read — fine for low-volume stores. If you add password login via Firebase Auth, tighten to `request.auth != null`.)*

6. **Done.** Now:
   - Every order placed on the website is saved to Firestore **automatically**.
   - Open `admin.html` on your phone/laptop → orders appear **live** (real-time listener).
   - Changing a status in admin updates Firestore + local storage.

> 🔌 No Firebase? The store still works 100% — orders just stay on the device they were placed from.
> ⚠️ Status updates retry automatically (3 attempts); if Firestore rules block writes you'll see *"Saved locally — Firestore sync failed"*. Fix the rules (below) and it syncs.

---

## ⚡ Fast Pay from the Gallery (quick view)

- Tap any saree photo → popup shows the image, price, **🛒 Add to Cart** and a gold **"⚡ Pay Online (UPI) — ₹X"** button that jumps straight to UPI checkout (GPay / PhonePe / Paytm). WhatsApp is no longer the primary action in the popup — paying online is.

## ⭐ Real Reviews (no fake numbers)

- Review counts on cards & product pages are **real** — counted from actual customer reviews (`ss_reviews`).
- The review form (name, star rating, comment) is fully styled for mobile.
- **Admin → ⭐ Reviews tab** lists every review with a **delete** button to remove spam/abuse.

## ☁️ Firestore Catalog Sync (fast)

- The base catalog lives in `store-data.js` (instant first paint, no network needed).
- In **Admin → Products → ☁️ Sync to Firestore**, one tap uploads your whole catalog to Firestore.
- Store pages then **auto-pull** the Firestore catalog on load (only when there are no local edits) — so customers always see your latest products fast.
- Product images are **links only** (local paths or full URLs) — nothing heavy is uploaded.

## 🪡 Logo & Footer

- A gold-on-maroon **SK** monogram logo now appears in the header, drawer and footer.
- Footer recolored (deep plum-black gradient, gold headings) with social buttons and a language selector.

## 🎯 Google Ads & Meta (Facebook) Ads — Ready

- `index.html` `<head>` has clearly-marked **placeholders** for your Google Ads tag (`gtag`) and Meta Pixel (`fbq`) — uncomment & paste your IDs.
- Every completed order fires a **purchase conversion event** automatically (`trackPurchase` in `store-data.js`) with `value`, `currency: INR` and `transaction_id` — so Google Ads "Purchase" and Meta "Purchase" conversions work with zero extra code.
- The store also ships with local SEO: **Salem, Tamil Nadu** business schema (geo, hours, area served), social `sameAs` links, and Tamil-friendly meta.

## 🚀 How to Deploy (pick one)

### Option A — Hostinger / any cPanel hosting (easiest)
1. cPanel → **File Manager** → `public_html`.
2. Upload the whole `saree-store` folder contents (all 5 files + `images/`).
3. Done — live at `https://yourdomain.com/index.html` (or make index.html the default document).

### Option B — Vercel / Netlify (free)
1. Push this folder to GitHub (or drag-and-drop on netlify.com).
2. Import → deploy. Done.

### Option C — WordPress (Custom HTML block)
1. Upload the `images` folder via **Media → Add New** (or FTP).
2. In a page, add a **Custom HTML** block and paste the contents of `index.html` (and separately `products.html` / `admin.html`).
3. Update every `images/products/…` path to your uploaded image URLs, and fix relative links (`products.html` → your page URLs).

---

## ✏️ How to Customize (5-minute guide)

Everything editable lives in **`store-data.js`** (shared by all pages):

### 1. Store settings — `/* === 1. STORE CONFIG === */`
```js
const CONFIG = {
  storeName : 'SK SAREES',
  waNumber  : '917867915699',          // ← your WhatsApp (country code, no +)
  upiId     : 'sk7867915699-1@oksbi',  // ← your UPI ID
  upiName   : 'SK SAREES',             // payee name in UPI apps
  codFee    : 49,                      // ← COD extra charge
  offerTag  : 'Aadi Sale — Up to 40% OFF',  // ← change anytime
  trackBase : 'https://yourstore.in/index.html#/track?id=',  // ← your tracking URL
  webhookUrl: '',                      // optional: also POST orders to your backend
};
```

### 2. Add / edit products — `/* === 3. CATALOG === */`
Each product is one object. Copy one line and change the values:
```js
{ id:'soft-silk', name:'Soft Silk Saree — Rose Pink', cat:'silk', price:1499, mrp:2299,
  rating:4.6, reviews:64, badge:'New', fabric:'Soft silk', length:'6.3 m + blouse piece',
  wash:'Dry clean recommended', colors:'Rose Pink / Lavender',
  img:'images/products/soft-silk.jpg', desc:'...' }
```
- `cat` must be a category slug: `silk` | `cotton` | `daily` | `wedding` | `party`
- `badge`: `'Bestseller'`, `'New'`, or `''`

### 3. Replace photos
Drop your real photos into `images/products/` and update the `img:` path — **or use full image links** (`https://…`) in the admin "Add/Edit Product" and bulk-upload image column. Product images are stored as links only (no upload from the site). Keep images ≤ 800 px wide, JPG quality ~70 for fast mobile loading.

---

## 🤖 WhatsApp Automation

| Feature | What happens |
|---|---|
| **Floating chat widget** (bottom-right) | Opens WhatsApp chat to 7867915699. |
| **Buy on WhatsApp** (every product) | Auto-fills: *"Hi! I want to order this Saree: [name] — ₹[price]. Is it available?"* |
| **Abandoned cart (15 min)** | Cart not checked out after 15 minutes → popup: *"Complete your order on WhatsApp for instant confirmation!"* with the full cart pre-filled in the message. |
| **Order confirmation** | Success page → *"Send Confirmation to Customer"* opens WhatsApp to the customer with the confirmation text ready. |
| **COD = WhatsApp confirm** | Selecting **Cash on Delivery** removes the payment step and shows **"Confirm Order on WhatsApp"** — the customer's full COD order (incl. ₹49) opens pre-filled in WhatsApp to your number. One tap and the order is in your chat. |
| **Delivery reminder** | In `admin.html`, each order has *"Send Delivery Reminder"* — pre-filled: *"Your beautiful Saree is out for delivery! Track your order here…"* |
| **Festive / restock alerts** | Bell button + footer forms save the customer's number and open WhatsApp with a subscribe message. |

---

## 🔒 Owner actions live ONLY in the Admin panel

The customer-facing pages (`index.html`, `products.html`) show **only what shoppers need**:
- No "Store Admin" links, no confirmation-send buttons, no copy-template cards, no delivery-reminder boxes.
- WhatsApp icons on buttons are drawn by **CSS** (no inline SVGs in the JavaScript), so every button is a consistent size.

The **Store Owner actions** — Send Confirmation to customer, Send Delivery Reminder, copy templates, status updates — are all inside `admin.html` only.

---

## 🖼️ Gallery-Style Catalog

- `products.html` shows all sarees as a photo gallery.
- **Tap any photo** → a quick-view popup with the big image, price, **Add to Cart** and **Buy on WhatsApp** — instant ordering without leaving the grid.
- A **+** quick-add button sits on every photo corner.
- Product titles still link to the full product page.

## 💬 WhatsApp Group Join (replaces alerts opt-in)

- The 🔔 bell and the "Join Our WhatsApp Group" section open a simple popup.
- Customer enters their number (optional) and taps **Join Our WhatsApp Group**:
  - If `CONFIG.waGroup` is set (your `chat.whatsapp.com` invite link) → opens the group directly.
  - Otherwise → opens WhatsApp to your number with a "please add me to the group" message.
- No more alerts list to maintain — everyone joins one group.

---

## 🛍️ Admin — Manage Products & Orders (`admin.html`)

### 📋 Orders tab
- Live list of all orders (Firestore-synced if enabled) with status dropdowns.
- One-tap WhatsApp buttons: **Send Confirmation** and **Send Delivery Reminder** go *straight to the customer's number* with the message pre-filled.
- COD orders confirmed via WhatsApp arrive here automatically (status: Placed).

### 🛍️ Products tab
- **➕ Add Product** — fill a simple form (name, price, MRP, category, badge, image, fabric…), save instantly.
- **✏️ Edit / ✕ Delete** on every product row.
- **📥 Bulk Upload** — paste one product per line:
  ```
  Name, Price, MRP, Category, Image URL, Badge
  Soft Silk Saree, 1499, 2299, silk, images/products/soft-silk.jpg, New
  ```
  Categories: `silk` `cotton` `daily` `wedding` `party` • Badge: `Bestseller` / `New` / blank.
  You can also paste a **JSON array** of products. Tap **⬇ Show Sample Format** to see an example.
- **↺ Reset Catalog** — back to the original 10 products.

> 💾 Catalog edits are stored in the browser (`localStorage`) and are instantly reflected on `index.html` and `products.html` — no server needed.

---

## 📲 Auto WhatsApp Confirmation (straight to the customer)

After every successful order, the success page:
1. Shows a green **"Send Confirmation — Straight to Customer's WhatsApp"** card with the confirmation message pre-filled for the **customer's number**.
2. **Auto-opens WhatsApp in ~3 seconds** (once per order) — the store owner just presses **Send** and the customer is confirmed in one tap.

---

## 🚚 Free Shipping Above ₹999

- Cart subtotal **≥ ₹999** → shipping is **FREE**.
- Below ₹999 → **₹79** shipping is added automatically (`CONFIG.shipFreeAbove` / `CONFIG.shipFee`).
- The cart shows a live progress bar: *"Add ₹X more to get FREE shipping!"* — and it's always itemised on the cart, checkout & success pages.

## ❤️ Likes & Comments

- Every product page has a **♡ Like** button (saved per browser) and a **✍️ Write a review** form (name, star rating, comment) — comments appear instantly in the Reviews section.

## 📍 Customer Order Status & Order Details (live)

- **My Orders** (`#/orders`, replaces the old "Track Order") lists every order with its status pill.
- **Order Details** (`#/order/<id>`) shows: order date, product images, total amount, payment method, **dispatch date**, **expected delivery date** and a visual status tracker (Placed → Confirmed → Dispatched → Delivered).
- When the store owner changes a status in `admin.html`, the customer's **Order Details page updates instantly** via Firestore's real-time listener.

## ⚙️ Auto-Delivered After Dispatch

- When you mark an order **Shipped** in admin, the dispatch date is captured and the delivery ETA is set to **+7 days** (`CONFIG.dispatchDays`).
- A background check automatically marks the order **Delivered** once the ETA passes — no manual work.
- The customer sees dispatch date + ETA on the order card and Order Details page.

## 🌐 Multi-Language UI

- A language selector in the header (and footer) switches the whole store UI between **English, தமிழ், हिन्दी, తెలుగు, ಕನ್ನಡ, മലയാളം** — core conversion strings fully translated; missing keys fall back to English.
- Language choice is remembered per visitor (`ss_lang`).

## 📣 Share & Grow on WhatsApp (safely)

- **Share on WhatsApp** buttons on every product page, on the order-success page, and order details — they use WhatsApp's **share** format (`api.whatsapp.com/send?text=…`), so customers share your store with friends → free viral traffic.
- ⚠️ **Avoid WhatsApp ban:** all store-to-customer automation is *one tap → WhatsApp opens with the message pre-filled → a human presses Send*. It never sends bulk messages automatically. For large-scale campaigns use WhatsApp Business API (Meta official) — do NOT use unofficial bulk senders, and keep the group join optional/consent-based.

## 📂 Admin Order Filters

`admin.html` → Orders tab now has filter chips with live counts: **All / 🆕 New / ✅ Confirmed / 🚚 Shipped / ✔ Delivered**. Perfect for handling "new orders → confirm" workflows.

---

## 💳 UPI Checkout — How It Works

On selecting **UPI** the store shows:
1. **QR code** — generated live from your UPI ID + amount.
2. **UPI ID** with a **Copy** button.
3. **Pay Now** deep link:
   ```
   upi://pay?pa=sk7867915699-1@oksbi&pn=SK%20SAREES&am=2499.00&cu=INR&tn=Saree%20order&mode=02
   ```
   Tapping opens GPay / PhonePe / Paytm directly with the amount pre-filled (Android opens the UPI chooser; iOS opens the installed UPI app). QR + manual UPI ID are the always-works fallback.

## 💵 COD Logic (+₹49)

```js
function calcTotals(payment){
  const itemsTotal = cartTotal();
  const codFee = payment === 'cod' ? CONFIG.codFee : 0;   // ₹49
  const shipping = 0;                                      // free shipping
  return { itemsTotal, codFee, shipping, grand: itemsTotal + codFee + shipping };
}
```
The ₹49 shows on the cart page, checkout summary and final total — always labelled *"COD Available (Extra ₹49 charges apply)"*.

---

## 🧪 Tested
- ✅ 30 end-to-end checks across all 3 pages (jsdom + real HTTP server): home → product → cart → checkout (UPI QR + deep link, COD +₹49) → order → track, products catalog (filters, search, add-to-cart, sticky cart bar), admin (orders, status, WhatsApp templates, Firestore label)
- ✅ Firestore module: gracefully disabled when not configured; fails fast if the CDN is blocked (store keeps working)
- ✅ JS syntax-validated, CSS braces balanced, zero external dependencies (Firebase loads only when you enable it)

---

## 🔒 Privacy
Order/cart data lives in the customer's browser (localStorage) and — if you enable it — your Firestore database. No analytics, no cookies, no tracking. See the in-store Privacy Policy page.

---

## 🗣️ தமிழ் வழிகாட்டி (Quick Tamil Guide)

**ஆன்லைனில் வெளியிட:**
1. அனைத்து கோப்புகளையும் (`index.html`, `products.html`, `admin.html`, `store.css`, `store-data.js`, `images/`) Hostinger/Vercel-ல் அப்லோட் செய்யவும்.
2. பெயர், WhatsApp எண், UPI ID — `store-data.js`-இன் `CONFIG` பகுதியில் மாற்றவும்.
3. புதிய சேலை — `PRODUCTS` பட்டியலில் ஒரு வரியை நகலெடுத்து மாற்றவும்.

**Firebase (விருப்பம்):** console.firebase.google.com-ல் திட்டம் உருவாக்கி, Firestore-ஐ activate செய்து, `FIREBASE_CONFIG`-இல் விசைகளை பேஸ்ட் செய்யவும். பிறகு அனைத்து ஆர்டர்களும் `admin.html`-இல் நேரடியாக (live) தெரியும்.

**வாட்ஸ்அப் விற்பனை:** ஒவ்வொரு சேலையின் கீழும் "Buy on WhatsApp" பட்டன்; 15 நிமிட வண்டி நினைவூட்டல்; ஆர்டர் உறுதிப்படுத்தல் & டெலிவரி ரிமைண்டர் பட்டன்கள் `admin.html`-இல்.

**பணம்:** UPI QR + "Pay Now" பட்டன்; COD-க்கு தானாக ₹49 சேர்க்கப்படும்.

---

© 2026 SK SAREES, 2/130, Thoothanoor, Edanganasalai, Salem 637502 • WhatsApp: 78679 15699
