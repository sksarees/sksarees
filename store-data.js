/* ============================================================================
   SK SAREES — Shared store data, utilities, cart & Firebase module
   Used by: index.html · products.html · admin.html
   ========================================================================== */
'use strict';

/* ============================ 1. STORE CONFIG ============================
   👉 EDIT THIS BLOCK to change store name, WhatsApp number, UPI ID etc. */
const CONFIG = {
  storeName : 'SK SAREES',
  tagline   : 'Premium Sarees — Salem',
  waNumber  : '917867915699',          // WhatsApp with country code (no +)
  waDisplay : '78679 15699',
  upiId     : 'sk7867915699-1@oksbi',  // Your UPI ID
  upiName   : 'SK SAREES',             // Payee name shown in UPI app (<= ~25 chars)
  codFee    : 49,                      // Extra charge on COD orders
  shipFreeAbove : 999,                 // Free shipping when item total >= this (₹)
  shipFee       : 79,                  // Shipping fee below that (₹)
  offerTag  : 'Aadi Sale — Up to 40% OFF',
  trackBase : 'https://yourstore.in/index.html#/track?id=', // replace with your tracking URL
  webhookUrl: '',                      // OPTIONAL: also POST orders here (e.g. Apps Script)
  waGroup   : 'https://chat.whatsapp.com/LifaKCj3msQApwxJ4N4sQ0',  // WhatsApp GROUP invite link
  dispatchDays : 7,                    // auto-mark Delivered N days after dispatch
  social : {
    instagram : 'https://www.instagram.com/sksarees_collection/',
    facebook  : 'https://www.facebook.com/eske.kalekcan/',
    youtube   : 'https://www.youtube.com/@sksarees_collection',
  },
};

/* ============================ 2. FIREBASE (FIRESTORE) ============================
   👉 OPTIONAL but recommended for live order sync across devices.
   Steps:
     1) console.firebase.google.com → Add project (e.g. "sk-sarees")
     2) Build → Firestore Database → Create database (production mode)
     3) Project settings → Your apps → Web (</>) → Register app → copy config
     4) Paste the values below, then update the security rules (see README)
   Leave apiKey:'' to run WITHOUT Firebase (orders stay in the browser only).
   IMPORTANT: treating this config as public is normal for web apps, but anyone
   can write to your DB unless you set Firestore security rules (see README). */
/* ☁️ FIREBASE CONFIG — project: sksareesapp (Firestore active)
   ⚠️ Don't forget Firestore SECURITY RULES (see README) or orders won't sync.
   Note: measurementId/analytics not used — we only load the Firestore SDK (lighter). */
const FIREBASE_CONFIG = {
  apiKey      : 'AIzaSyC351uS2-LkxIeDNCqhScnlGzHjoJ9KkOY',
  authDomain  : 'sksareesapp.firebaseapp.com',
  projectId   : 'sksareesapp',
  storageBucket: 'sksareesapp.firebasestorage.app',
  messagingSenderId: '774983284365',
  appId       : '1:774983284365:web:e03c9b2337d041986fd4c4',
  measurementId: 'G-QGHYX73WG6',   /* analytics — not loaded by the app, kept for reference */
};

/* ============================ 3. CATALOG ============================
   👉 Add/remove categories & products here. Photos go in images/products/
   NOTE: the live catalog (PRODUCTS) can be edited from admin.html — the
   edited list is stored in localStorage (ss_products). */
const CATEGORIES = [
  { slug:'silk',    name:'Silk Sarees',        emoji:'✨', cls:'ct-silk',    tagline:'Kanchipuram, Banarasi & soft silks' },
  { slug:'cotton',  name:'Cotton Sarees',      emoji:'🌿', cls:'ct-cotton',  tagline:'Handloom, cotton silk & linens' },
  { slug:'daily',   name:'Daily Wear',         emoji:'🌤️', cls:'ct-daily',   tagline:'Light, comfy & budget friendly' },
  { slug:'wedding', name:'Wedding & Bridal',   emoji:'👰', cls:'ct-wedding', tagline:'Show-stopper bridal pieces' },
  { slug:'party',   name:'Party Wear',         emoji:'🎉', cls:'ct-party',   tagline:'Georgette, organza & sequins' },
];

const BASE_PRODUCTS = [
  { id:'kanchipuram-silk', name:'Kanchipuram Pure Silk Saree — Red & Gold Zari', cat:'wedding', price:2499, mrp:3999, rating:4.8, reviews:132, badge:'Bestseller',
    fabric:'Pure Kanchipuram Silk with gold zari', length:'6.3 m + blouse piece', wash:'Dry clean only', colors:'Red / Maroon / Green',
    img:'images/products/kanchipuram-silk.jpg',
    desc:'Authentic Kanchipuram silk with rich gold zari border and traditional temple motifs. Woven in the heritage style — perfect for weddings, functions and festive occasions. Heavy, glossy and long-lasting.' },
  { id:'banarasi-silk', name:'Banarasi Silk Saree — Royal Purple & Gold', cat:'silk', price:1899, mrp:2999, rating:4.7, reviews:98, badge:'',
    fabric:'Banarasi silk with kadhwa weaving', length:'6.3 m + blouse piece', wash:'Dry clean only', colors:'Purple / Maroon / Teal',
    img:'images/products/banarasi-silk.jpg',
    desc:'Classic Banarasi weave with intricate gold paisley motifs. The rich sheen and fine zari work make it a beautiful choice for parties and celebrations.' },
  { id:'soft-silk', name:'Soft Silk Saree — Rose Pink with Golden Border', cat:'silk', price:1499, mrp:2299, rating:4.6, reviews:64, badge:'New',
    fabric:'Soft silk (light, skin-friendly)', length:'6.3 m + blouse piece', wash:'Dry clean recommended', colors:'Rose Pink / Lavender / Sky Blue',
    img:'images/products/soft-silk.jpg',
    desc:'Feather-light soft silk that drapes beautifully and is comfortable for all-day wear. Delicate golden border adds a festive touch.' },
  { id:'cotton-silk', name:'Cotton Silk Saree — Emerald Green', cat:'cotton', price:999, mrp:1599, rating:4.7, reviews:156, badge:'',
    fabric:'Cotton silk blend', length:'6.3 m + blouse piece', wash:'Gentle hand wash / dry clean', colors:'Emerald / Maroon / Navy',
    img:'images/products/cotton-silk.jpg',
    desc:'A perfect mix of cotton comfort and silk sheen. Temple border design — ideal for office wear, poojas and casual functions.' },
  { id:'handloom-cotton', name:'Handloom Cotton Saree — Mustard & Teal', cat:'cotton', price:749, mrp:1199, rating:4.8, reviews:210, badge:'Bestseller',
    fabric:'100% handloom cotton', length:'6.3 m + blouse piece', wash:'Machine wash (mild)', colors:'Mustard / Teal / Indigo',
    img:'images/products/handloom-cotton.jpg',
    desc:'Our most-loved handloom weave! Soft, breathable and easy to carry. Gets softer with every wash. Beautiful traditional checks and border.' },
  { id:'printed-cotton', name:'Printed Cotton Saree — Sky Blue Floral', cat:'daily', price:649, mrp:999, rating:4.5, reviews:187, badge:'',
    fabric:'Pure cotton, printed', length:'6.3 m + blouse piece', wash:'Machine wash', colors:'Sky Blue / Pink / Mint',
    img:'images/products/printed-cotton.jpg',
    desc:'Lightweight daily-wear cotton with a fresh floral print. Cool for hot days — perfect for everyday home & office wear.' },
  { id:'georgette', name:'Georgette Saree — Turquoise with Sequin Border', cat:'party', price:899, mrp:1499, rating:4.6, reviews:74, badge:'',
    fabric:'Georgette with sequin border', length:'6.3 m + blouse piece', wash:'Dry clean only', colors:'Turquoise / Peach / Lavender',
    img:'images/products/georgette.jpg',
    desc:'Flow-y georgette with a shimmering sequin border. Drapes elegantly and photographs beautifully — a party favourite.' },
  { id:'party-wear', name:'Party Wear Saree — Navy Blue Sequins', cat:'party', price:1299, mrp:2199, rating:4.7, reviews:85, badge:'',
    fabric:'Georgette with sequin & zari embroidery', length:'6.3 m + blouse piece', wash:'Dry clean only', colors:'Navy / Black / Wine',
    img:'images/products/party-wear.jpg',
    desc:'Designer party wear with all-over gold sequin embroidery. Luxurious look for receptions, sangeet and festive nights.' },
  { id:'organza', name:'Organza Saree — Lavender with Pearl Accents', cat:'party', price:1099, mrp:1799, rating:4.5, reviews:41, badge:'New',
    fabric:'Organza with golden threadwork', length:'6.3 m + blouse piece', wash:'Dry clean only', colors:'Lavender / White / Peach',
    img:'images/products/organza.jpg',
    desc:'Airy organza with delicate golden threadwork and pearl accents — an ethereal, modern look for cocktail events.' },
  { id:'linen', name:'Linen Saree — Beige with Brown Stripe', cat:'daily', price:849, mrp:1399, rating:4.6, reviews:58, badge:'',
    fabric:'Pure linen', length:'6.3 m + blouse piece', wash:'Gentle machine wash', colors:'Beige / Grey / Sage',
    img:'images/products/linen.jpg',
    desc:'Breathable pure linen with a subtle stripe texture. Crisp, minimal and effortlessly elegant for daily professional wear.' },
];

/* Live catalog — admin edits (admin.html) override the base list */
let PRODUCTS = (() => {
  try{ const s = JSON.parse(localStorage.getItem('ss_products')); if (Array.isArray(s) && s.length) return s; }catch(e){}
  return BASE_PRODUCTS.slice();
})();
function saveProducts(list){ PRODUCTS = list; try{ localStorage.setItem('ss_products', JSON.stringify(list)); }catch(e){} }
function genProductId(name){ return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2,6); }
function normalizeProduct(raw){
  const cat = catOf(raw.cat) ? raw.cat : 'daily';
  const price = Math.max(0, Math.round(+raw.price || 0));
  const mrp = Math.max(price, Math.round(+raw.mrp || 0) || Math.round(price * 1.6));
  return {
    id: raw.id || genProductId(raw.name),
    name: String(raw.name || 'Untitled Saree').trim(),
    price: price, mrp: mrp,
    cat: cat,
    rating: Math.min(5, Math.max(1, +raw.rating || 4.5)),
    reviews: Math.max(0, +raw.reviews || 0),
    badge: ['Bestseller','New'].includes(raw.badge) ? raw.badge : '',
    fabric: String(raw.fabric || 'Premium fabric').trim(),
    length: String(raw.length || '6.3 m + blouse piece').trim(),
    wash: String(raw.wash || 'Dry clean recommended').trim(),
    colors: String(raw.colors || '').trim(),
    img: raw.img || 'images/products/printed-cotton.jpg',
    desc: String(raw.desc || 'Beautiful handpicked saree from our collection.').trim(),
  };
}

const REVIEWS = [
  { name:'Lakshmi S.', place:'Salem',        avatar:'#8f1d3a', rating:5, text:'Ordered the Kanchipuram silk for my daughter’s wedding — pure quality, just like the photos. Delivery was fast and the WhatsApp confirmation made it so easy!' },
  { name:'Priya R.',    place:'Chennai',     avatar:'#2f7d5b', rating:5, text:'The cotton sarees are so soft and comfortable. Loved the COD option. Will definitely order again this Aadi season!' },
  { name:'Meenakshi K.',place:'Coimbatore',  avatar:'#5a3d8f', rating:5, text:'Best place to buy sarees online. Paid through UPI — instant and safe. The owner personally confirmed my order on WhatsApp. Very trustworthy.' },
  { name:'Kavitha M.',  place:'Erode',       avatar:'#b57f1f', rating:4, text:'Beautiful handloom saree, exact colours as shown. Fits the budget too. Thank you SK SAREES!' },
];

/* ============================ 4. UTILITIES ============================ */
const byId = id => PRODUCTS.find(p => p.id === id);
const catOf = slug => CATEGORIES.find(c => c.slug === slug);
const money = n => '₹' + Number(n).toLocaleString('en-IN');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtDate = iso => new Date(iso).toLocaleString('en-IN', { day:'numeric', month:'short', hour:'numeric', minute:'2-digit' });
const validPhone = p => /^[6-9]\d{9}$/.test(String(p).trim());
const genOrderId = () => 'SS' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2,4).toUpperCase();
const offPct = p => p.mrp > p.price ? Math.round((1 - p.price / p.mrp) * 100) : 0;

/* Icons (inline SVG, no icon font = faster) */
const IC = {
  wa: '', /* WhatsApp icons removed — buttons use text labels (reliable everywhere) */
  shield: '',
  truck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>',
  ret: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
};

/* ============================ 4b. LANGUAGES ============================
   UI language packs. English + தமிழ் fully; हिन्दी/తెలుగు/ಕನ್ನಡ/മലയാളം for
   the core conversion strings (missing keys fall back to English). */
const LANGS = {
  en: {
    shopAll:'Shop All Sarees', addToCart:'Add to Cart', buyNow:'Buy Now', checkout:'Checkout',
    cart:'Your Cart', total:'Total', freeShip:'Free Shipping', shop:'Shop', home:'Home',
    myOrders:'My Orders', orderDetails:'Order Details', like:'Like', liked:'Liked',
    writeReview:'Write a review', postComment:'Post Comment', continueShopping:'Continue Shopping',
    placeOrder:'Place Order', confirmOrderWA:'Confirm Order on WhatsApp', continueToPayment:'Continue to Payment →',
    orderOnWA:'Order on WhatsApp', viewAll:'View all →', joinGroup:'Join Our WhatsApp Group',
    bestSellers:'Best Sellers', newArrivals:'New Arrivals', shopByCategory:'Shop by Category',
    whatCustomersSay:'What Our Customers Say', howToOrder:'How to Order', shopSarees:'Shop Sarees',
    cat_silk:'Silk Sarees', cat_cotton:'Cotton Sarees', cat_daily:'Daily Wear', cat_wedding:'Wedding & Bridal', cat_party:'Party Wear',
    orderConfirmed:'Confirmed', dispatched:'Dispatched', delivered:'Delivered',
    orderDate:'Order Date', dispatchDate:'Dispatch Date', totalAmount:'Total Amount', expectedDelivery:'Expected Delivery',
    payOnline:'Pay Online (UPI)', payNow:'Pay Now — Open UPI App', freeShipAbove:'Free Shipping Above ₹999',
    codNote:'COD Available (Extra ₹49 charges apply)', share:'Share', shareWA:'Share on WhatsApp',
    language:'Language', contactUs:'Contact Us', quickLinks:'Quick Links', aboutUs:'About Us',
    orderPlaced:'Order Placed', noOrders:'No orders yet — place your first saree order!', askWA:'Ask on WhatsApp', help:'Help',
    all:'All', searchPlaceholder:'Search sarees, fabric, colour…', tapHint:'Tap any saree photo for a quick look & instant order', youMayLike:'You May Also Like',
  },
  ta: {
    shopAll:'அனைத்து சேலைகள்', addToCart:'வண்டியில் சேர்', buyNow:'இப்போது வாங்க', checkout:'செலுத்துதல்',
    cart:'உங்கள் வண்டி', total:'மொத்தம்', freeShip:'இலவச டெலிவரி', shop:'கடை', home:'முகப்பு',
    myOrders:'எனது ஆர்டர்கள்', orderDetails:'ஆர்டர் விவரம்', like:'விரும்பு', liked:'விரும்பப்பட்டது',
    writeReview:'விமர்சனம் எழுதுங்கள்', postComment:'கருத்து இடுங்கள்', continueShopping:'தொடர்ந்து வாங்குங்கள்',
    placeOrder:'ஆர்டர் செய்யுங்கள்', confirmOrderWA:'வாட்ஸ்அப்பில் ஆர்டர் உறுதி செய்யுங்கள்', continueToPayment:'பணம் செலுத்த தொடரவும் →',
    orderOnWA:'வாட்ஸ்அப்பில் ஆர்டர் செய்யுங்கள்', viewAll:'அனைத்தும் →', joinGroup:'எங்கள் வாட்ஸ்அப் குழுவில் சேர',
    bestSellers:'சிறந்த விற்பனை', newArrivals:'புதிய வரவுகள்', shopByCategory:'வகைப்படி வாங்குங்கள்',
    whatCustomersSay:'வாடிக்கையாளர்கள் என்ன சொல்கிறார்கள்', howToOrder:'எப்படி ஆர்டர் செய்வது', shopSarees:'சேலைகள் வாங்குங்கள்',
    cat_silk:'பட்டு சேலைகள்', cat_cotton:'பருத்தி சேலைகள்', cat_daily:'தினசரி உடை', cat_wedding:'திருமண சேலைகள்', cat_party:'பார்ட்டி சேலைகள்',
    orderConfirmed:'உறுதி செய்யப்பட்டது', dispatched:'அனுப்பப்பட்டது', delivered:'வழங்கப்பட்டது',
    orderDate:'ஆர்டர் தேதி', dispatchDate:'அனுப்பிய தேதி', totalAmount:'மொத்த தொகை', expectedDelivery:'எதிர்பார்க்கப்படும் டெலிவரி',
    payOnline:'ஆன்லைனில் செலுத்துங்கள் (UPI)', payNow:'பணம் செலுத்துங்கள் — UPI ஆப் திறக்கும்', freeShipAbove:'₹999க்கு மேல் இலவச டெலிவரி',
    codNote:'COD கிடைக்கும் (கூடுதல் ₹49 விண்ணப்பிக்கும்)', share:'பகிர்', shareWA:'வாட்ஸ்அப்பில் பகிர்',
    language:'மொழி', contactUs:'தொடர்பு', quickLinks:'விரைவு இணைப்புகள்', aboutUs:'எங்களை பற்றி',
    orderPlaced:'ஆர்டர் செய்யப்பட்டது', noOrders:'இன்னும் ஆர்டர்கள் இல்லை — உங்கள் முதல் சேலையை ஆர்டர் செய்யுங்கள்!', askWA:'வாட்ஸ்அப்பில் கேளுங்கள்', help:'உதவி',
    all:'அனைத்தும்', searchPlaceholder:'சேலைகள், துணி, நிறம் தேடுங்கள்…', tapHint:'விரைவு பார்வை & ஆர்டருக்கு சேலை புகைப்படத்தை தொடவும்', youMayLike:'இவையும் பிடிக்கலாம்',
  },
  hi: {
    shopAll:'सभी साड़ियाँ खरीदें', addToCart:'कार्ट में डालें', buyNow:'अभी खरीदें', checkout:'चेकआउट',
    cart:'आपकी कार्ट', total:'कुल', freeShip:'मुफ़्त डिलीवरी', shop:'दुकान', home:'होम',
    myOrders:'मेरे ऑर्डर', orderDetails:'ऑर्डर विवरण', like:'पसंद करें', liked:'पसंद किया',
    writeReview:'समीक्षा लिखें', postComment:'टिप्पणी करें', continueShopping:'खरीदारी जारी रखें',
    placeOrder:'ऑर्डर करें', confirmOrderWA:'व्हाट्सएप पर ऑर्डर की पुष्टि करें', continueToPayment:'भुगतान के लिए आगे बढ़ें →',
    orderOnWA:'व्हाट्सएप पर ऑर्डर करें', viewAll:'सभी देखें →', joinGroup:'हमारे व्हाट्सएप ग्रुप से जुड़ें',
    bestSellers:'सर्वश्रेष्ठ विक्रेता', newArrivals:'नए आगमन', shopByCategory:'श्रेणी से खरीदें',
    whatCustomersSay:'ग्राहक क्या कहते हैं', howToOrder:'ऑर्डर कैसे करें', shopSarees:'साड़ियाँ खरीदें',
    cat_silk:'सिल्क साड़ियाँ', cat_cotton:'कॉटन साड़ियाँ', cat_daily:'रोज़ाना पहनावा', cat_wedding:'शादी की साड़ियाँ', cat_party:'पार्टी साड़ियाँ',
    orderConfirmed:'पुष्टि हुई', dispatched:'भेज दी गई', delivered:'डिलीवर हुई',
    orderDate:'ऑर्डर दिनांक', dispatchDate:'भेजने की तारीख', totalAmount:'कुल राशि', expectedDelivery:'अपेक्षित डिलीवरी',
    payOnline:'ऑनलाइन भुगतान (UPI)', payNow:'अभी भुगतान करें — UPI ऐप खोलें', freeShipAbove:'₹999 से ऊपर मुफ़्त डिलीवरी',
    codNote:'COD उपलब्ध (अतिरिक्त ₹49 लागू)', share:'साझा करें', shareWA:'व्हाट्सएप पर साझा करें',
    language:'भाषा', contactUs:'संपर्क', quickLinks:'त्वरित लिंक', aboutUs:'हमारे बारे में',
  },
  te: {
    shopAll:'అన్ని చీరలు కొనండి', addToCart:'కార్ట్‌కు జోడించు', buyNow:'ఇప్పుడు కొనండి', checkout:'చెక్అవుట్',
    cart:'మీ కార్ట్', total:'మొత్తం', freeShip:'ఉచిత డెలివరీ', shop:'షాప్', home:'హోమ్',
    myOrders:'నా ఆర్డర్లు', orderDetails:'ఆర్డర్ వివరాలు', like:'ఇష్టం', liked:'ఇష్టపడ్డారు',
    writeReview:'సమీక్ష రాయండి', postComment:'వ్యాఖ్య పోస్ట్ చేయండి', continueShopping:'షాపింగ్ కొనసాగించండి',
    placeOrder:'ఆర్డర్ చేయండి', confirmOrderWA:'వాట్సాప్‌లో ఆర్డర్ నిర్ధారించండి', continueToPayment:'చెల్లింపుకు కొనసాగండి →',
    orderOnWA:'వాట్సాప్‌లో ఆర్డర్ చేయండి', viewAll:'అన్నీ చూడండి →', joinGroup:'మా వాట్సాప్ గ్రూప్‌లో చేరండి',
    bestSellers:'ఉత్తమ అమ్మకాలు', newArrivals:'కొత్త వస్తువులు', shopByCategory:'వర్గం ద్వారా కొనండి',
    cat_silk:'సిల్క్ చీరలు', cat_cotton:'కాటన్ చీరలు', cat_daily:'రోజువారీ దుస్తులు', cat_wedding:'పెళ్లి చీరలు', cat_party:'పార్టీ చీరలు',
    orderConfirmed:'నిర్ధారించబడింది', dispatched:'పంపబడింది', delivered:'డెలివరీ అయింది',
    orderDate:'ఆర్డర్ తేదీ', dispatchDate:'పంపిన తేదీ', totalAmount:'మొత్తం మొత్తం', expectedDelivery:'ఆశించిన డెలివరీ',
    payOnline:'ఆన్‌లైన్ చెల్లింపు (UPI)', payNow:'ఇప్పుడే చెల్లించండి — UPI యాప్ తెరవండి', freeShipAbove:'₹999 పైన ఉచిత డెలివరీ',
    codNote:'COD అందుబాటులో ఉంది (అదనంగా ₹49)', share:'షేర్ చేయండి', shareWA:'వాట్సాప్‌లో షేర్ చేయండి',
    language:'భాష', contactUs:'సంప్రదించండి', quickLinks:'త్వరిత లింకులు', aboutUs:'మా గురించి',
  },
  kn: {
    shopAll:'ಎಲ್ಲಾ ಸೀರೆಗಳನ್ನು ಖರೀದಿಸಿ', addToCart:'ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸಿ', buyNow:'ಈಗ ಖರೀದಿಸಿ', checkout:'ಚೆಕ್ಔಟ್',
    cart:'ನಿಮ್ಮ ಕಾರ್ಟ್', total:'ಒಟ್ಟು', freeShip:'ಉಚಿತ ವಿತರಣೆ', shop:'ಅಂಗಡಿ', home:'ಮುಖಪುಟ',
    myOrders:'ನನ್ನ ಆರ್ಡರ್ಗಳು', orderDetails:'ಆರ್ಡರ್ ವಿವರಗಳು', like:'ಇಷ್ಟ', liked:'ಇಷ್ಟಪಟ್ಟಿದ್ದೀರಿ',
    writeReview:'ವಿಮರ್ಶೆ ಬರೆಯಿರಿ', postComment:'ಕಾಮೆಂಟ್ ಪೋಸ್ಟ್ ಮಾಡಿ', continueShopping:'ಶಾಪಿಂಗ್ ಮುಂದುವರಿಸಿ',
    placeOrder:'ಆರ್ಡರ್ ಮಾಡಿ', confirmOrderWA:'ವಾಟ್ಸಾಪ್‌ನಲ್ಲಿ ಆರ್ಡರ್ ದೃಢೀಕರಿಸಿ', continueToPayment:'ಪಾವತಿಗೆ ಮುಂದುವರಿಯಿರಿ →',
    orderOnWA:'ವಾಟ್ಸಾಪ್‌ನಲ್ಲಿ ಆರ್ಡರ್ ಮಾಡಿ', viewAll:'ಎಲ್ಲಾ ನೋಡಿ →', joinGroup:'ನಮ್ಮ ವಾಟ್ಸಾಪ್ ಗುಂಪಿಗೆ ಸೇರಿ',
    bestSellers:'ಅತ್ಯುತ್ತಮ ಮಾರಾಟ', newArrivals:'ಹೊಸ ಆಗಮನ', shopByCategory:'ವರ್ಗದಿಂದ ಖರೀದಿಸಿ',
    cat_silk:'ಸಿಲ್ಕ್ ಸೀರೆಗಳು', cat_cotton:'ಕಾಟನ್ ಸೀರೆಗಳು', cat_daily:'ದೈನಂದಿನ ಉಡುಗೆ', cat_wedding:'ಮದುವೆಯ ಸೀರೆಗಳು', cat_party:'ಪಾರ್ಟಿ ಸೀರೆಗಳು',
    orderConfirmed:'ದೃಢೀಕರಿಸಲಾಗಿದೆ', dispatched:'ರವಾನೆಯಾಗಿದೆ', delivered:'ವಿತರಿಸಲಾಗಿದೆ',
    orderDate:'ಆರ್ಡರ್ ದಿನಾಂಕ', dispatchDate:'ರವಾನೆ ದಿನಾಂಕ', totalAmount:'ಒಟ್ಟು ಮೊತ್ತ', expectedDelivery:'ನಿರೀಕ್ಷಿತ ವಿತರಣೆ',
    payOnline:'ಆನ್‌ಲೈನ್ ಪಾವತಿ (UPI)', payNow:'ಈಗ ಪಾವತಿಸಿ — UPI ಅಪ್ ತೆರೆಯಿರಿ', freeShipAbove:'₹999 ಮೇಲೆ ಉಚಿತ ವಿತರಣೆ',
    codNote:'COD ಲಭ್ಯವಿದೆ (ಹೆಚ್ಚುವರಿ ₹49)', share:'ಹಂಚಿಕೊಳ್ಳಿ', shareWA:'ವಾಟ್ಸಾಪ್‌ನಲ್ಲಿ ಹಂಚಿಕೊಳ್ಳಿ',
    language:'ಭಾಷೆ', contactUs:'ಸಂಪರ್ಕಿಸಿ', quickLinks:'ತ್ವರಿತ ಲಿಂಕ್ಗಳು', aboutUs:'ನಮ್ಮ ಬಗ್ಗೆ',
  },
  ml: {
    shopAll:'എല്ലാ സാരികളും വാങ്ങുക', addToCart:'കാർട്ടിൽ ചേർക്കുക', buyNow:'ഇപ്പോൾ വാങ്ങുക', checkout:'ചെക്കൗട്ട്',
    cart:'നിങ്ങളുടെ കാർട്ട്', total:'ആകെ', freeShip:'സൗജന്യ ഡെലിവറി', shop:'ഷോപ്പ്', home:'ഹോം',
    myOrders:'എന്റെ ഓർഡറുകൾ', orderDetails:'ഓർഡർ വിശദാംശങ്ങൾ', like:'ഇഷ്ടം', liked:'ഇഷ്ടപ്പെട്ടു',
    writeReview:'അവലോകനം എഴുതുക', postComment:'കമന്റ് പോസ്റ്റ് ചെയ്യുക', continueShopping:'ഷോപ്പിംഗ് തുടരുക',
    placeOrder:'ഓർഡർ ചെയ്യുക', confirmOrderWA:'വാട്സ്ആപ്പിൽ ഓർഡർ സ്ഥിരീകരിക്കുക', continueToPayment:'പേയ്മെന്റിലേക്ക് തുടരുക →',
    orderOnWA:'വാട്സ്ആപ്പിൽ ഓർഡർ ചെയ്യുക', viewAll:'എല്ലാം കാണുക →', joinGroup:'ഞങ്ങളുടെ വാട്സ്ആപ്പ് ഗ്രൂപ്പിൽ ചേരൂ',
    bestSellers:'മികച്ച വിൽപ്പന', newArrivals:'പുതിയ വരവുകൾ', shopByCategory:'വിഭാഗം അനുസരിച്ച് വാങ്ങുക',
    cat_silk:'സിൽക്ക് സാരികൾ', cat_cotton:'കോട്ടൺ സാരികൾ', cat_daily:'ദൈനംദിന വസ്ത്രം', cat_wedding:'വിവാഹ സാരികൾ', cat_party:'പാർട്ടി സാരികൾ',
    orderConfirmed:'സ്ഥിരീകരിച്ചു', dispatched:'അയച്ചു', delivered:'ഡെലിവർ ചെയ്തു',
    orderDate:'ഓർഡർ തീയതി', dispatchDate:'അയച്ച തീയതി', totalAmount:'ആകെ തുക', expectedDelivery:'പ്രതീക്ഷിക്കുന്ന ഡെലിവറി',
    payOnline:'ഓൺലൈൻ പേയ്മെന്റ് (UPI)', payNow:'ഇപ്പോൾ പണം നൽകുക — UPI ആപ്പ് തുറക്കുക', freeShipAbove:'₹999-ന് മുകളിൽ സൗജന്യ ഡെലിവറി',
    codNote:'COD ലഭ്യമാണ് (അധികം ₹49)', share:'പങ്കിടുക', shareWA:'വാട്സ്ആപ്പിൽ പങ്കിടുക',
    language:'ഭാഷ', contactUs:'ബന്ധപ്പെടുക', quickLinks:'ദ്രുത ലിങ്കുകൾ', aboutUs:'ഞങ്ങളെക്കുറിച്ച്',
  },
};
let LANG_CODE = null;
function curLang(){
  if (LANG_CODE === null){ try{ LANG_CODE = LS.get('ss_lang', 'en'); }catch(e){ LANG_CODE = 'en'; } }
  return LANGS[LANG_CODE] ? LANG_CODE : 'en';
}
function t(key){ return (LANGS[curLang()] && LANGS[curLang()][key]) || LANGS.en[key] || key; }
function setLang(code){
  LANG_CODE = LANGS[code] ? code : 'en';
  LS.set('ss_lang', LANG_CODE);
  try{ document.dispatchEvent(new CustomEvent('langchange')); }catch(e){}
  /* in a real browser, also hard-reload so every cached string re-renders */
  try{ setTimeout(() => location.reload(), 60); }catch(e){}
}

/* ============================ 5. CART STATE ============================ */
const LS = {
  get(k, fb){ try{ const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; }catch(e){ return fb; } },
  set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} },
};
const Store = {
  cart  : LS.get('ss_cart', []),
  orders: LS.get('ss_orders', []),
  alerts: LS.get('ss_alerts', { phone:'' }),
  saveCart(){ LS.set('ss_cart', this.cart); renderCartBadge(); },
  saveOrders(){ LS.set('ss_orders', this.orders); },
};
function cartTotal(){ return Store.cart.reduce((s,i) => { const p = byId(i.id); return s + (p ? p.price * i.qty : 0); }, 0); }
function shippingFor(total){ return total >= CONFIG.shipFreeAbove ? 0 : CONFIG.shipFee; }
function addToCart(id, qty = 1){
  const p = byId(id); if (!p) return;
  const ex = Store.cart.find(i => i.id === id);
  if (ex) ex.qty = Math.min(ex.qty + qty, 10); else Store.cart.push({ id, qty });
  Store.saveCart(); markAbandoned();
  StoreUI.toast('✅ ' + p.name.split('—')[0].trim() + ' added to cart');
}
function setCartQty(id, qty){
  const it = Store.cart.find(i => i.id === id); if (!it) return;
  it.qty = Math.max(1, Math.min(qty, 10)); Store.saveCart(); markAbandoned();
}
function removeFromCart(id){ Store.cart = Store.cart.filter(i => i.id !== id); Store.saveCart(); StoreUI.toast('🗑️ Removed from cart'); }
function renderCartBadge(){
  const b = document.getElementById('cartBadge'); if (!b) return;
  const n = Store.cart.reduce((s,i) => s + i.qty, 0);
  b.hidden = n === 0; b.textContent = n;
}
const ABANDON_MS = 15 * 60 * 1000;
function markAbandoned(){ LS.set('ss_abandon', { last: Date.now(), reminded: false }); }

/* ============================ 6. UI HELPERS ============================ */
let toastT;
const StoreUI = {
  toast(msg){
    const t = document.getElementById('toast'); if (!t) return;
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2800);
  },
  copyText(txt){
    const done = () => this.toast('✅ Copied to clipboard');
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done).catch(() => fallbackCopy(txt, done));
    else fallbackCopy(txt, done);
  },
  openModal(html){
    const root = document.getElementById('modalRoot'); if (!root) return;
    root.innerHTML = `<div class="modal show" id="activeModal">
      <div class="m-back" data-close></div>
      <div class="m-card">${html}<button class="m-close" data-close aria-label="Close">✕</button></div></div>`;
    document.body.style.overflow = 'hidden';
  },
  closeModal(){
    const m = document.getElementById('activeModal'); if (!m) return;
    m.classList.remove('show');
    setTimeout(() => m.remove(), 300);
    document.body.style.overflow = '';
  },
};
function fallbackCopy(txt, done){
  const ta = document.createElement('textarea'); ta.value = txt; ta.style.position='fixed'; ta.style.opacity='0';
  document.body.appendChild(ta); ta.select();
  try{ document.execCommand('copy'); done(); }catch(e){ StoreUI.toast('Copy failed'); }
  ta.remove();
}

/* ============================ 6b. ADS CONVERSION TRACKING ============================
   Google Ads & Meta (Facebook) conversion events. Paste your gtag/fbq snippets in
   index.html <head> (see the TODO comments there). These calls are harmless
   when the snippets are not installed. */
function trackPurchase(order){
  try{
    const val = (order.totals && order.totals.grand) || 0;
    if (window.gtag) gtag('event', 'purchase', { currency:'INR', value: val, transaction_id: order.id, items: (order.items||[]).map(i => ({ item_id:i.id, item_name:i.name, quantity:i.qty, price:i.price })) });
    if (window.fbq) fbq('track', 'Purchase', { currency:'INR', value: val, content_ids:(order.items||[]).map(i=>i.id), content_type:'product' });
  }catch(e){}
}

/* ============================ 7. WHATSAPP ============================ */
function waLink(text, num = CONFIG.waNumber){
  let n = String(num).replace(/[^\d]/g, '');
  if (/^[6-9]\d{9}$/.test(n)) n = '91' + n; /* 10-digit Indian mobile → add country code */
  return 'https://wa.me/' + n + '?text=' + encodeURIComponent(text);
}
/* Share a link on WhatsApp to ANY chat (viral growth) — uses api.whatsapp.com send */
function waShare(text, url){
  const u = url || location.href.split('#')[0];
  return 'https://api.whatsapp.com/send?text=' + encodeURIComponent(text + '\n' + u);
}
function waProductMsg(p){
  return `Hi! I want to order this Saree:\n\n🪡 ${p.name}\n💰 Price: ${money(p.price)}\n\nIs it available? Please confirm.`;
}
function waCartMsg(){
  let lines = 'Hi! I want to place this order:\n';
  Store.cart.forEach(i => { const p = byId(i.id); if (p) lines += `\n• ${p.name} ×${i.qty} — ${money(p.price * i.qty)}`; });
  lines += `\n\nTotal: ${money(cartTotal())}\nPlease confirm availability & delivery.`;
  return lines;
}
/* Templates for the STORE ADMIN to send to customers */
const TPL_CONFIRM = o => `🎉 Order Confirmed!\n\nHi ${(o.customer||{}).name || 'friend'}, your order ${o.id} (${money((o.totals||{}).grand||0)}) has been confirmed ✅\nWe will update you on WhatsApp once it is dispatched.\n\nThank you for shopping with SK SAREES! 🪡`;
const TPL_DELIVERY = o => `🚚 Your beautiful Saree is out for delivery!\n\nTrack your order here: ${CONFIG.trackBase}${o.id}\n\nThank you for shopping with SK SAREES. 🪡`;
const TPL_NOTIFY  = o => `🆕 New Order Received — please confirm!\n\nOrder ID: ${o.id}\nCustomer: ${(o.customer||{}).name || '—'}\nPhone: ${(o.customer||{}).phone || '—'}\nAddress: ${(o.customer||{}).address || '—'}, ${(o.customer||{}).pincode || '—'}\nPayment: ${o.payment === 'upi' ? 'UPI' : 'COD (+₹' + CONFIG.codFee + ')'}\nTotal: ${money((o.totals||{}).grand||0)}\n\nItems:\n${(o.items||[]).map(i => `• ${i.name} ×${i.qty} — ${money(i.price*i.qty)}`).join('\n')}`;

/* ============================ 8. CARD / TILE MARKUP ============================ */
function starsHTML(r, c){
  return `<div class="stars">★★★★★ <span>${r}</span>${c ? `<span class="cnt">(${c} reviews)</span>` : ''}</div>`;
}
function productCard(p){
  const off = offPct(p);
  return `<article class="pcard">
    <a class="pcard-img" data-qv="${p.id}" href="${CARD_PRODUCT_URL}#/product/${p.id}" aria-label="${esc(p.name)}">
      <img src="${p.img}" alt="${esc(p.name)}" loading="lazy" decoding="async" width="800" height="600">
      ${p.badge ? `<span class="badge${p.badge === 'New' ? ' gold' : ''}">${esc(p.badge)}</span>` : ''}
      ${off ? `<span class="offchip">-${off}%</span>` : ''}
      <span class="quick-add" role="button" data-add="${p.id}" aria-label="Quick add to cart">+</span>
    </a>
    <div class="pcard-body">
      <h3><a href="${CARD_PRODUCT_URL}#/product/${p.id}">${esc(p.name)}</a></h3>
      ${starsHTML(p.rating, realReviewCount(p.id))}
      <div class="price-row"><b>${money(p.price)}</b>${p.mrp ? `<s>${money(p.mrp)}</s>` : ''}${off ? `<span class="off">${off}% OFF</span>` : ''}</div>
      <div class="p-actions">
        <button class="btn btn-outline" data-add="${p.id}">Add to Cart</button>
        <a class="btn btn-wa" href="${waLink(waProductMsg(p))}" target="_blank" rel="noopener" aria-label="Order ${esc(p.name)} on WhatsApp">${IC.wa}</a>
      </div>
    </div>
  </article>`;
}
/* Products live on their own page → card links point there */
const CARD_PRODUCT_URL = location.pathname.includes('products.html') ? 'index.html' : '';
function catTile(c){
  const count = PRODUCTS.filter(p => p.cat === c.slug).length;
  return `<a class="cat-tile ${c.cls}" href="products.html?cat=${c.slug}">
    <div><span class="ct-name">${c.name} <span>${c.emoji}</span></span>
    <span class="ct-count">${count} designs • ${c.tagline}</span></div>
  </a>`;
}
function openQuickView(id){
  const p = byId(id); if (!p) return;
  const off = offPct(p);
  const cat = catOf(p.cat);
  StoreUI.openModal(`
    <div>
      <img src="${p.img}" alt="${esc(p.name)}" style="width:100%;max-height:44vh;object-fit:cover;border-radius:12px" loading="lazy">
      <div style="text-align:left;margin-top:12px">
        <small class="pd-cat">${cat ? esc(cat.name) : ''}</small>
        <h2 style="font-size:1.05rem;font-weight:800;margin:4px 0">${esc(p.name)}</h2>
        ${starsHTML(p.rating, realReviewCount(p.id))}
        <div class="price-row" style="margin-top:6px"><b style="font-size:1.3rem;color:var(--maroon)">${money(p.price)}</b>${p.mrp ? `<s>${money(p.mrp)}</s>` : ''}${off ? `<span class="off">${off}% OFF</span>` : ''}</div>
      </div>
      <div style="display:grid;gap:8px;margin-top:12px">
        <button class="btn btn-maroon" data-add="${p.id}">🛒 ${t('addToCart')}</button>
        <a class="btn btn-gold" href="${CARD_PRODUCT_URL}#/checkout?buy=${p.id}" data-qv-close>⚡ ${t('payOnline')} — ${money(p.price)}</a>
        <a class="btn btn-ghost btn-sm" href="${CARD_PRODUCT_URL}#/product/${p.id}" data-qv-close>${t('orderDetails') || 'View Full Details'} →</a>
      </div>
    </div>`);
}

function revCard(r){
  return `<div class="rev">
    <div class="rev-top"><span class="avatar" style="background:${r.avatar}">${r.name[0]}</span>
      <div><b>${esc(r.name)}</b><small>${esc(r.place)} • Customer review ⭐</small></div></div>
    <div class="stars">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</div>
    <p>${esc(r.text)}</p>
  </div>`;
}

/* ============================ 9. ALERTS + ABANDONED CART ============================ */
/* ---------- WhatsApp GROUP join (replaces old alerts opt-in) ---------- */
function openGroupModal(){
  StoreUI.openModal(`<h2 style="font-size:1.15rem;font-weight:800;margin-bottom:4px">💬 Join Our WhatsApp Group</h2>
    <p class="muted small" style="margin-bottom:12px">Get <b>new arrivals, festival offers &amp; exclusive discounts</b> first — straight on WhatsApp.</p>
    <div class="field"><label>Your WhatsApp Number <span style="font-weight:500">(optional)</span></label>
      <input id="grpPhone" value="${esc(Store.alerts.phone)}" placeholder="10-digit mobile number" inputmode="numeric" maxlength="10"></div>
    <button class="btn btn-wa" id="grpGo">Join Our WhatsApp Group</button>
    <p class="small muted" style="margin-top:10px;text-align:center">We will add you within minutes. You can leave anytime.</p>`);
}
function joinGroup(){
  const inp = document.getElementById('grpPhone'); const ph = inp ? inp.value.trim() : '';
  if (ph && !validPhone(ph)) { StoreUI.toast('⚠️ Enter a valid 10-digit mobile number'); if (inp) inp.classList.add('err'); return; }
  if (ph){ Store.alerts.phone = ph; LS.set('ss_alerts', Store.alerts); }
  StoreUI.closeModal();
  if (CONFIG.waGroup){
    try{ window.open(CONFIG.waGroup, '_blank', 'noopener'); }catch(e){}
    StoreUI.toast('✅ Opening WhatsApp group…');
  } else {
    const msg = ph
      ? `Hi! Please add my number ${ph} to your WhatsApp group for new saree arrivals & offers. 🪡`
      : 'Hi! Please add me to your WhatsApp group for new saree arrivals & offers. 🪡';
    window.open(waLink(msg), '_blank', 'noopener');
    StoreUI.toast('✅ Request sent on WhatsApp');
  }
}
function checkAbandon(){
  const a = LS.get('ss_abandon', null);
  if (!a || !Store.cart.length || a.reminded) return;
  if (Date.now() - a.last < ABANDON_MS) return;
  a.reminded = true; LS.set('ss_abandon', a);
  const items = Store.cart.map(i => { const p = byId(i.id); return p ? `<div class="aband-item"><span>${esc(p.name)} ×${i.qty}</span><b>${money(p.price * i.qty)}</b></div>` : ''; }).join('');
  StoreUI.openModal(`<h2 style="font-size:1.15rem;font-weight:800;margin-bottom:6px">🛍️ Still thinking about your order?</h2>
    <p class="muted small" style="margin-bottom:10px">Your sarees are waiting in the cart — and stock is limited!</p>
    <div style="margin-bottom:10px">${items}
      <div class="aband-item" style="font-weight:800;border-bottom:none"><span>Total</span><b>${money(cartTotal())}</b></div></div>
    <div style="display:grid;gap:8px">
      <a class="btn btn-wa" href="${waLink('Hi! I want to complete my order on WhatsApp for instant confirmation:\n\n' + waCartMsg())}" target="_blank" rel="noopener">${IC.wa} Complete Order on WhatsApp — Instant Confirmation</a>
      <a class="btn btn-outline" href="index.html#/checkout">Finish Checkout</a>
    </div>
    <p class="small muted" style="text-align:center;margin-top:10px">💡 WhatsApp order = fastest confirmation</p>`);
}

/* ============================ 9a. AUTO-DELIVER ============================
   When an order is shipped (dispatched), it is automatically marked
   Delivered after CONFIG.dispatchDays days. Call once on load + on interval. */
function dispatchOrder(o){
  if (!o || (o.status||'') !== 'shipped') return;
  if (!o.deliverBy){
    o.dispatchedAt = o.dispatchedAt || new Date().toISOString();
    o.deliverBy = new Date(Date.now() + CONFIG.dispatchDays * 24 * 60 * 60 * 1000).toISOString();
  }
}
function maybeAutoDeliver(){
  let changed = false;
  Store.orders.forEach(o => {
    if (o.status === 'shipped' && o.deliverBy && Date.now() >= new Date(o.deliverBy).getTime()){
      o.status = 'delivered'; changed = true;
      Firestore.updateStatus(o.id, 'delivered').then(()=>{});
    }
  });
  if (changed){ Store.saveOrders(); }
}
function fmtDateDMY(iso){
  if (!iso) return '—';
  try{ return new Date(iso).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }); }catch(e){ return '—'; }
}

/* ============================ 9b. LIKES + REVIEWS (per browser) ============================ */
let likes = LS.get('ss_likes', []);
function isLiked(id){ return likes.includes(id); }
function toggleLike(id){
  likes = isLiked(id) ? likes.filter(x => x !== id) : likes.concat(id);
  LS.set('ss_likes', likes);
  return isLiked(id);
}
function realReviewCount(pid){
  try{ const all = LS.get('ss_reviews', {}); return (all[pid] || []).length; }catch(e){ return 0; }
}
function reviewsFor(pid){
  const all = LS.get('ss_reviews', {});
  const user = (all[pid] || []).slice().reverse();
  const base = REVIEWS.slice(0, 2);
  return user.map(r => ({ name: r.name, rating: r.rating, text: r.text, avatar: '#8f1d3a', place: 'Customer comment' })).concat(base);
}
function addReview(pid, name, rating, text){
  const all = LS.get('ss_reviews', {});
  (all[pid] = all[pid] || []).push({ name: name.trim(), rating: Math.min(5, Math.max(1, +rating || 5)), text: text.trim(), date: Date.now() });
  LS.set('ss_reviews', all);
}

/* ============================ 9c. PRODUCT CLOUD (Firestore) ============================
   The base catalog lives in store-data.js (fast first paint). With Firestore
   enabled you can also store the live catalog in a 'products' collection —
   admin.html has a one-tap "Sync to Firestore" and the store pages pull it
   on load (only when there are no local admin edits, so local edits win).
   Returns {ok, count}. */
const ProductCloud = {
  async saveAll(){
    if (!Firestore.enabled()) return { ok:false, reason:'firestore-off' };
    try{
      const db = await Firestore._db();
      const batch = db.batch();
      PRODUCTS.forEach(p => { batch.set(db.collection('products').doc(String(p.id)), Object.assign({}, p, { updatedAt: window.firebase.firestore.FieldValue.serverTimestamp() })); });
      await batch.commit();
      return { ok:true, count: PRODUCTS.length };
    }catch(e){ console.warn('[SK SAREES] ProductCloud save failed:', e); return { ok:false, reason:String(e.message||e).slice(0,80) }; }
  },
  async loadAll(){
    if (!Firestore.enabled()) return null;
    try{
      const db = await Firestore._db();
      const snap = await db.collection('products').get();
      const list = []; snap.forEach(d => list.push(d.data()));
      return list.length ? list : null;
    }catch(e){ console.warn('[SK SAREES] ProductCloud load failed:', e); return null; }
  },
};

/* ============================ 10. FIREBASE / FIRESTORE ============================ */
const FIREBASE_SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';
const Firestore = {
  enabled(){ return !!(FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId); },
  _load(){
    return new Promise((resolve, reject) => {
      if (window.firebase && window.firebase.firestore) return resolve();
      if (this._loading) return this._loading;
      const s1 = document.createElement('script'); s1.src = FIREBASE_SDK + 'firebase-app-compat.js';
      const s2 = document.createElement('script'); s2.src = FIREBASE_SDK + 'firebase-firestore-compat.js';
      let settled = false;
      const fail = () => { if (!settled){ settled = true; reject(new Error('Firebase SDK load failed')); } };
      const ok = () => { if (!settled){ settled = true; resolve(); } };
      this._loading = new Promise((res, rej) => {
        s1.onload = () => document.head.appendChild(s2);
        s1.onerror = fail;
        s2.onload = ok;
        s2.onerror = fail;
        document.head.appendChild(s1);
        setTimeout(fail, 12000); /* fail fast if the CDN is slow/blocked — store still works */
      });
      return this._loading;
    });
  },
  async _db(){
    await this._load();
    if (!window.firebase.apps.length){
      window.firebase.initializeApp({
        apiKey: FIREBASE_CONFIG.apiKey,
        authDomain: FIREBASE_CONFIG.authDomain,
        projectId: FIREBASE_CONFIG.projectId,
        appId: FIREBASE_CONFIG.appId,
        storageBucket: FIREBASE_CONFIG.storageBucket || undefined,
        messagingSenderId: FIREBASE_CONFIG.messagingSenderId || undefined,
      });
    }
    return window.firebase.firestore();
  },
  /* Save an order to Firestore (fire-and-forget). Returns true on success. */
  async saveOrder(order){
    if (!this.enabled()) return false;
    try{
      const db = await this._db();
      await db.collection('orders').doc(order.id).set(
        Object.assign({}, order, { createdAt: window.firebase.firestore.FieldValue.serverTimestamp() }),
        { merge: true }
      );
      return true;
    }catch(e){ console.warn('[SK SAREES] Firestore save failed:', e); return false; }
  },
  /* Update an order's status in Firestore */
  async updateStatus(id, status, extra){
    if (!this.enabled()) return false;
    try{
      const db = await this._db();
      const patch = Object.assign({ status, updatedAt: window.firebase.firestore.FieldValue.serverTimestamp() }, extra || {});
      await db.collection('orders').doc(id).set(patch, { merge: true });
      return true;
    }catch(e){ console.warn('[SK SAREES] Firestore status update failed:', e); return false; }
  },
  /* Fetch one order (for customer tracking) */
  async getOrder(id){
    if (!this.enabled()) return null;
    try{
      const db = await this._db();
      const snap = await db.collection('orders').doc(String(id).toUpperCase()).get();
      return snap.exists ? snap.data() : null;
    }catch(e){ console.warn('[SK SAREES] getOrder failed:', e); return null; }
  },
  /* Live listener for ONE order — customer tracking page updates in real time
     when the store owner changes the status in admin.html. */
  onOrder(id, cb){
    if (!this.enabled()){ cb(null); return () => {}; }
    let unsub = () => {};
    this._db().then(db => {
      unsub = db.collection('orders').doc(String(id).toUpperCase())
        .onSnapshot(doc => cb(doc.exists ? doc.data() : null), () => cb(null));
    }).catch(() => cb(null));
    return () => unsub();
  },
  /* Live listener. cb(ordersArray, usingLocal). Returns an unsubscribe function. */
  onOrders(cb){
    if (!this.enabled()){ cb([], true); return () => {}; }
    let unsub = () => {};
    this._db().then(db => {
      unsub = db.collection('orders')
        .onSnapshot(snap => {
          const list = [];
          snap.forEach(doc => list.push(doc.data()));
          cb(list, false);
        }, err => {
          console.warn('[SK SAREES] Firestore snapshot error:', err);
          cb([], true);
        });
    }).catch(() => cb([], true));
    return () => unsub();
  },
};
