/* ============================================================================
   SK SAREES — Shared data & logic (multi-page premium redesign)
   Used by: index · shop · product · cart · checkout · orders · profile
   ========================================================================== */
'use strict';

/* ============================ 1. CONFIG ============================ */
const CONFIG = {
  storeName : 'SK SAREES',
  waNumber  : '917867915699',
  waDisplay : '78679 15699',
  upiId     : 'sk7867915699-1@oksbi',
  upiName   : 'SK SAREES',
  codFee    : 49,
  shipFreeAbove : 999,
  shipFee       : 79,
  dispatchDays  : 7,                 // auto Delivered N days after dispatch
  dispatchHours : 24,                // dispatch within 24-48h
  etaTn         : [2, 4],            // delivery days within Tamil Nadu
  etaIndia      : [4, 7],            // delivery days across India
  latePromise   : 'If your saree arrives after the promised date, reply LATE with your Order ID on WhatsApp and get ₹50 off your next order (code LATE50).',
  waGroup   : 'https://chat.whatsapp.com/LifaKCj3msQApwxJ4N4sQ0',
  social : {
    instagram : 'https://www.instagram.com/sksarees_collection/',
    facebook  : 'https://www.facebook.com/eske.kalekcan/',
    youtube   : 'https://www.youtube.com/@sksarees_collection',
  },
};

/* ============================ 2. FIREBASE (optional) ============================ */
const FIREBASE_CONFIG = {
  apiKey      : 'AIzaSyC351uS2-LkxIeDNCqhScnlGzHjoJ9KkOY',
  authDomain  : 'sksareesapp.firebaseapp.com',
  projectId   : 'sksareesapp',
  storageBucket: 'sksareesapp.firebasestorage.app',
  messagingSenderId: '774983284365',
  appId       : '1:774983284365:web:e03c9b2337d041986fd4c4',
};

/* ============================ 3. CATEGORIES (16) ============================ */
const CATEGORIES = [
  { slug:'kanchipuram', name:'Kanchipuram Sarees', emoji:'👑', cls:'c-kanchipuram', blurb:'Heritage zari silks' },
  { slug:'soft-silk',   name:'Soft Silk Sarees',   emoji:'✨', cls:'c-soft-silk',   blurb:'Feather-light silk' },
  { slug:'cotton',      name:'Cotton Sarees',      emoji:'🌿', cls:'c-cotton',      blurb:'Handloom & pure cotton' },
  { slug:'silk',        name:'Silk Sarees',        emoji:'🧵', cls:'c-silk',        blurb:'Silks & Banarasi' },
  { slug:'wedding',     name:'Wedding Collection', emoji:'👰', cls:'c-wedding',     blurb:'Bridal & occasion' },
  { slug:'party',       name:'Party Wear',         emoji:'🎉', cls:'c-party',       blurb:'Sequins & shimmer' },
  { slug:'georgette',   name:'Georgette Sarees',   emoji:'🌊', cls:'c-georgette',   blurb:'Flowy & elegant' },
  { slug:'designer',    name:'Designer Sarees',    emoji:'💎', cls:'c-designer',    blurb:'Designer finishes' },
  { slug:'printed',     name:'Printed Sarees',     emoji:'🌸', cls:'c-printed',     blurb:'Florals & prints' },
  { slug:'office',      name:'Office Wear',        emoji:'💼', cls:'c-office',      blurb:'Smart & comfortable' },
  { slug:'daily',       name:'Daily Wear',         emoji:'🌤️', cls:'c-daily',       blurb:'Easy everyday' },
  { slug:'fancy',       name:'Fancy Sarees',       emoji:'🎀', cls:'c-fancy',       blurb:'Trendy & stylish' },
  { slug:'half-saree',  name:'Half Sarees',        emoji:'🪭', cls:'c-half-saree',  blurb:'Two-piece sets' },
  { slug:'kids',        name:'Kids Collection',    emoji:'🧒', cls:'c-kids',        blurb:'For little ones' },
  { slug:'men-dhoti',   name:'Men Dhoti',          emoji:'👔', cls:'c-men-dhoti',   blurb:'Cotton veshtis' },
  { slug:'blouse',      name:'Blouse Material',    emoji:'🧵', cls:'c-blouse',      blurb:'Matching pieces' },
  { slug:'accessories', name:'Accessories',        emoji:'🪡', cls:'c-accessories', blurb:'Borders & more' },
];

/* ============================ 4. PRODUCTS (48) ============================ */
const IMG = {
  kan:'images/products/kanchipuram-silk.jpg', ban:'images/products/banarasi-silk.jpg',
  soft:'images/products/soft-silk.jpg', cot:'images/products/cotton-silk.jpg',
  hand:'images/products/handloom-cotton.jpg', prn:'images/products/printed-cotton.jpg',
  geo:'images/products/georgette.jpg', party:'images/products/party-wear.jpg',
  org:'images/products/organza.jpg', lin:'images/products/linen.jpg',
};
const BASE = [
  { id:'kanchipuram-red', name:'Kanchipuram Pure Silk — Red & Gold Zari', cat:'kanchipuram', price:2499, mrp:3999, rating:4.8, reviews:132, badge:'Bestseller', img:IMG.kan, fabric:'Pure Kanchipuram silk with gold zari', color:'Red / Maroon / Green', border:'Gold temple border', blouse:'Blouse piece included', length:'6.3 m + blouse', weight:'620 g', wash:'Dry clean only', stock:12, colors:['Red','Maroon','Green'], desc:'Authentic Kanchipuram silk with rich gold zari — heavy, glossy, the pride of Tamil Nadu weaving.' },
  { id:'banarasi-purple', name:'Banarasi Silk — Royal Purple & Gold', cat:'silk', price:1899, mrp:2999, rating:4.7, reviews:98, badge:'Sale', img:IMG.ban, fabric:'Banarasi silk, kadhwa weave', color:'Purple / Maroon / Teal', border:'Intricate gold border', blouse:'Blouse piece included', length:'6.3 m + blouse', weight:'540 g', wash:'Dry clean only', stock:8, colors:['Purple','Maroon','Teal'], desc:'Classic Banarasi weave with intricate gold paisley motifs — rich sheen for grand celebrations.' },
  { id:'soft-silk-rose', name:'Soft Silk — Rose Pink Golden Border', cat:'soft-silk', price:1499, mrp:2299, rating:4.6, reviews:64, badge:'New', img:IMG.soft, fabric:'Soft silk (light, skin-friendly)', color:'Rose Pink / Lavender / Sky Blue', border:'Delicate golden border', blouse:'Blouse piece included', length:'6.3 m + blouse', weight:'480 g', wash:'Dry clean recommended', stock:20, colors:['Rose Pink','Lavender','Sky Blue'], desc:'Feather-light soft silk that drapes beautifully — comfortable all-day wear.' },
  { id:'cotton-silk-emerald', name:'Cotton Silk — Emerald Green Temple', cat:'cotton', price:999, mrp:1599, rating:4.7, reviews:156, badge:'Bestseller', img:IMG.cot, fabric:'Cotton silk blend', color:'Emerald / Maroon / Navy', border:'Temple design border', blouse:'Blouse piece included', length:'6.3 m + blouse', weight:'450 g', wash:'Gentle hand wash', stock:30, colors:['Emerald','Maroon','Navy'], desc:'Perfect mix of cotton comfort and silk sheen with classic temple border.' },
  { id:'handloom-mustard', name:'Handloom Cotton — Mustard & Teal', cat:'cotton', price:749, mrp:1199, rating:4.8, reviews:210, badge:'Bestseller', img:IMG.hand, fabric:'100% handloom cotton', color:'Mustard / Teal / Indigo', border:'Traditional checks', blouse:'Blouse piece included', length:'6.3 m + blouse', weight:'420 g', wash:'Machine wash (mild)', stock:45, colors:['Mustard','Teal','Indigo'], desc:'Our most-loved handloom weave — soft, breathable, gets softer with every wash.' },
  { id:'printed-sky', name:'Printed Cotton — Sky Blue Floral', cat:'printed', price:649, mrp:999, rating:4.5, reviews:187, badge:'', img:IMG.prn, fabric:'Pure cotton, printed', color:'Sky Blue / Pink / Mint', border:'Contrast border', blouse:'Blouse piece included', length:'6.3 m + blouse', weight:'400 g', wash:'Machine wash', stock:60, colors:['Sky Blue','Pink','Mint'], desc:'Lightweight daily-wear cotton with a fresh floral print.' },
  { id:'georgette-turquoise', name:'Georgette — Turquoise Sequin Border', cat:'georgette', price:899, mrp:1499, rating:4.6, reviews:74, badge:'Sale', img:IMG.geo, fabric:'Georgette with sequin border', color:'Turquoise / Peach / Lavender', border:'Shimmering sequin border', blouse:'Blouse piece included', length:'6.3 m + blouse', weight:'380 g', wash:'Dry clean only', stock:18, colors:['Turquoise','Peach','Lavender'], desc:'Flow-y georgette with shimmering sequin border — drapes elegantly.' },
  { id:'party-navy', name:'Party Wear — Navy Blue Sequins', cat:'party', price:1299, mrp:2199, rating:4.7, reviews:85, badge:'Bestseller', img:IMG.party, fabric:'Georgette, sequin & zari embroidery', color:'Navy / Black / Wine', border:'All-over gold sequins', blouse:'Blouse piece included', length:'6.3 m + blouse', weight:'500 g', wash:'Dry clean only', stock:10, colors:['Navy','Black','Wine'], desc:'Designer party wear with all-over gold sequin embroidery.' },
  { id:'organza-lavender', name:'Organza — Lavender Pearl Accents', cat:'designer', price:1099, mrp:1799, rating:4.5, reviews:41, badge:'New', img:IMG.org, fabric:'Organza with golden threadwork', color:'Lavender / White / Peach', border:'Pearl & gold accents', blouse:'Blouse piece included', length:'6.3 m + blouse', weight:'360 g', wash:'Dry clean only', stock:14, colors:['Lavender','White','Peach'], desc:'Airy organza with delicate golden threadwork and pearl accents.' },
  { id:'linen-beige', name:'Linen — Beige Brown Stripe', cat:'office', price:849, mrp:1399, rating:4.6, reviews:58, badge:'', img:IMG.lin, fabric:'Pure linen', color:'Beige / Grey / Sage', border:'Subtle stripe', blouse:'Blouse piece included', length:'6.3 m + blouse', weight:'390 g', wash:'Gentle machine wash', stock:22, colors:['Beige','Grey','Sage'], desc:'Breathable pure linen — crisp, minimal and effortlessly elegant.' },
  { id:'kanchipuram-peacock', name:'Kanchipuram Soft Silk — Peacock Green', cat:'kanchipuram', price:2199, mrp:3499, rating:4.7, reviews:47, badge:'New', img:IMG.kan, fabric:'Kanchipuram soft silk', color:'Peacock Green / Blue', border:'Gold zari contrast', blouse:'Blouse piece included', length:'6.3 m + blouse', weight:'560 g', wash:'Dry clean only', stock:9, colors:['Peacock Green','Blue'], desc:'Lighter Kanchipuram soft silk with striking peacock-green body.' },
  { id:'fancy-net', name:'Fancy Net — Champagne Stone Work', cat:'fancy', price:1199, mrp:1999, rating:4.5, reviews:33, badge:'Limited Stock', img:IMG.geo, fabric:'Net with stone & sequin work', color:'Champagne / Rose Gold', border:'Stone embellished', blouse:'Blouse piece included', length:'6.3 m + blouse', weight:'410 g', wash:'Dry clean only', stock:4, colors:['Champagne','Rose Gold'], desc:'Trendy net saree with delicate stone work — modern glam.' },
  { id:'half-saree-red', name:'Traditional Half Saree Set — Red & Gold', cat:'half-saree', price:1799, mrp:2799, rating:4.6, reviews:29, badge:'New', img:IMG.kan, fabric:'Silk blend two-piece', color:'Red / Maroon', border:'Gold zari borders', blouse:'Full set included', length:'2 pc set', weight:'700 g', wash:'Dry clean only', stock:7, colors:['Red','Maroon'], desc:'Traditional pavadai-davani style half saree set — a cherished Tamil tradition.' },
  { id:'kids-lehenga', name:'Kids Silk Lehenga Set — Pink & Gold', cat:'kids', price:1199, mrp:1899, rating:4.8, reviews:52, badge:'Bestseller', img:IMG.soft, fabric:'Soft silk, comfort fit', color:'Pink / Peach', border:'Gold lace', blouse:'Lehenga + blouse set', length:'Kids 4-12', weight:'350 g', wash:'Dry clean recommended', stock:16, colors:['Pink','Peach'], desc:'Adorable silk lehenga sets — soft, comfortable and party-ready.' },
  { id:'men-dhoti', name:'Pure Cotton Men Dhoti — Gold Border', cat:'men-dhoti', price:499, mrp:799, rating:4.7, reviews:121, badge:'Bestseller', img:IMG.hand, fabric:'100% pure cotton', color:'White / Cream', border:'Gold zari option', blouse:'—', length:'4 m', weight:'320 g', wash:'Machine wash', stock:40, colors:['White','Cream'], desc:'Soft pure-cotton dhotis with optional gold zari border.' },
  { id:'blouse-material', name:'Designer Blouse Material — Zari Contrast', cat:'blouse', price:599, mrp:999, rating:4.6, reviews:66, badge:'', img:IMG.ban, fabric:'Matching saree fabric', color:'Multiple options', border:'Zari contrast', blouse:'1.5 m blouse piece', length:'1.5 m', weight:'150 g', wash:'As per fabric', stock:50, colors:['Gold','Antique'], desc:'Premium blouse pieces matched to our saree shades.' },
  { id:'zari-border', name:'Gold Zari Border & Accessory Pack', cat:'accessories', price:299, mrp:499, rating:4.5, reviews:84, badge:'Sale', img:IMG.ban, fabric:'Zari border + pins', color:'Gold / Antique', border:'—', blouse:'—', length:'Pack of 3', weight:'90 g', wash:'Store dry', stock:35, colors:['Gold','Antique'], desc:'Handy gold zari border strips and pins for quick draping.' },
  { id:'daily-printed', name:'Daily Wear Printed Cotton — Mint', cat:'daily', price:549, mrp:899, rating:4.5, reviews:143, badge:'', img:IMG.prn, fabric:'Pure cotton, printed', color:'Mint / Yellow / Blue', border:'Simple border', blouse:'Blouse piece included', length:'6.3 m + blouse', weight:'390 g', wash:'Machine wash', stock:55, colors:['Mint','Yellow','Blue'], desc:'Cool and comfy everyday cotton with a cheerful print.' },
];
/* Colour variants — multiplies the catalog so infinite scroll feels endless */
const VARIANTS = [
  { color:'Emerald', off:0 }, { color:'Royal Blue', off:5 }, { color:'Wine', off:8 },
  { color:'Peacock', off:4 }, { color:'Champagne', off:10 }, { color:'Sage', off:6 },
];
let PRODUCTS = (() => {
  let built = BASE.map(b => Object.assign({}, b));
  BASE.forEach(b => {
    VARIANTS.slice(0, 3).forEach((v, i) => {
      built.push(Object.assign({}, b, {
        id: b.id + '-v' + (i + 1),
        name: b.name.replace(/—[^-]*$/, '— ' + v.color),
        color: v.color + ' variant',
        price: Math.round(b.price * (1 - v.off / 100)),
        mrp: b.mrp,
        rating: b.rating,                 /* original rating — same saree, different colour */
        reviews: b.reviews,                /* original review count */
        stock: Math.max(2, b.stock - i * 4),
        badge: b.badge === 'Bestseller' ? '' : b.badge,
      }));
    });
  });
  /* auto-SKU for every product */
  const catCounts = {};
  built = built.map(p => {
    catCounts[p.cat] = (catCounts[p.cat] || 0) + 1;
    return Object.assign({}, p, { sku: p.sku || ('SKS-' + p.cat.slice(0,3).toUpperCase() + '-' + String(catCounts[p.cat]).padStart(3,'0')) });
  });
  /* Admin edits (sk_products) override the base catalog */
  try{ const custom = JSON.parse(localStorage.getItem('sk_products')); if (Array.isArray(custom) && custom.length) return custom; }catch(e){}
  return built;
})();
function saveProducts(list){ PRODUCTS = list; try{ localStorage.setItem('sk_products', JSON.stringify(list)); }catch(e){} }
function resetProducts(){ PRODUCTS = (() => { let built = BASE.map(b => Object.assign({}, b)); BASE.forEach(b => { VARIANTS.slice(0,3).forEach((v,i)=>{ built.push(Object.assign({}, b, { id: b.id + '-v' + (i+1), name: b.name.replace(/—[^-]*$/, '— ' + v.color), color: v.color + ' variant', price: Math.round(b.price * (1 - v.off/100)), mrp: b.mrp, rating: b.rating, reviews: b.reviews, stock: Math.max(2, b.stock - i*4), badge: b.badge === 'Bestseller' ? '' : b.badge })); }); }); return built; })(); try{ localStorage.removeItem('sk_products'); }catch(e){} }
function genProductId(name){ return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2,5); }
function normalizeProduct(raw){
  const cat = CATEGORIES.some(c => c.slug === raw.cat) ? raw.cat : 'daily';
  const price = Math.max(0, Math.round(+raw.price || 0));
  const mrp = Math.max(price, Math.round(+raw.mrp || 0) || Math.round(price * 1.6));
  const catCount = PRODUCTS.filter(p => p.cat === cat).length;
  return {
    id: raw.id || genProductId(raw.name),
    sku: raw.sku || ('SKS-' + cat.slice(0,3).toUpperCase() + '-' + String(catCount + 1).padStart(3,'0')),
    name: String(raw.name || 'Untitled Saree').trim(),
    price, mrp,
    cat,
    rating: Math.min(5, Math.max(1, +raw.rating || 4.5)),
    reviews: Math.max(0, +raw.reviews || 0),
    badge: ['Bestseller','New','Sale','Limited Stock'].includes(raw.badge) ? raw.badge : '',
    img: raw.img || 'images/products/printed-cotton.jpg',
    fabric: String(raw.fabric || 'Premium fabric').trim(),
    color: String(raw.color || 'Multi').trim(),
    border: String(raw.border || '—').trim(),
    blouse: String(raw.blouse || 'Blouse piece included').trim(),
    length: String(raw.length || '6.3 m + blouse').trim(),
    weight: String(raw.weight || '450 g').trim(),
    wash: String(raw.wash || 'Dry clean recommended').trim(),
    stock: Math.max(0, +raw.stock || 10),
    colors: Array.isArray(raw.colors) ? raw.colors : [String(raw.color || 'Multi')],
    desc: String(raw.desc || 'Beautiful handpicked saree from our collection.').trim(),
  };
}
const byId = id => PRODUCTS.find(p => p.id === id);
const catOf = slug => CATEGORIES.find(c => c.slug === slug);
const offPct = p => p.mrp > p.price ? Math.round((1 - p.price / p.mrp) * 100) : 0;
/* representative image for a category tile (first product in that category) */
const catImage = slug => { const p = PRODUCTS.find(x => x.cat === slug && x.img); return p ? p.img : 'images/products/kanchipuram-silk.jpg'; };
/* real customer review count for a product (from localStorage) */
const realReviewCount = id => { try{ return (LS.get('sk_reviews_' + id, [])).length; }catch(e){ return 0; } };

/* ============================ 5. REVIEWS ============================ */
const REVIEWS = [
  { name:'Lakshmi S.', place:'Salem', avatar:'#8f1d3a', rating:5, text:'Ordered the Kanchipuram silk for my daughter’s wedding — pure quality, just like the photos. Delivery was fast and the WhatsApp confirmation made it so easy!' },
  { name:'Priya R.', place:'Chennai', avatar:'#2f7d5b', rating:5, text:'The cotton sarees are so soft and comfortable. Loved the COD option. Will definitely order again this Aadi season!' },
  { name:'Meenakshi K.', place:'Coimbatore', avatar:'#5a3d8f', rating:5, text:'Best place to buy sarees online. Paid through UPI — instant and safe. The owner personally confirmed my order on WhatsApp.' },
  { name:'Kavitha M.', place:'Erode', avatar:'#b57f1f', rating:4, text:'Beautiful handloom saree, exact colours as shown. Fits the budget too. Thank you SK Sarees!' },
  { name:'Divya B.', place:'Bangalore', avatar:'#0e8f8f', rating:5, text:'Ordered on WhatsApp at 10pm, confirmed by 10:30pm. Such personal service. The georgette saree is gorgeous!' },
  { name:'Anitha V.', place:'Salem', avatar:'#7a4fb0', rating:5, text:'Local pickup saved me delivery time. The owner patiently showed options on a video call. Highly recommended!' },
];
const FAQ = [
  { q:'How do I pay? Is UPI safe?', a:'Pay online via UPI (GPay / PhonePe / Paytm) by scanning the QR or tapping Pay Now, or choose Cash on Delivery (+₹49). UPI is 100% secure — we never see your card details.' },
  { q:'How long does delivery take?', a:'We dispatch within 24–48 hours. Delivery: 2–4 days within Tamil Nadu, 4–7 days across India. Free shipping above ₹999 (else ₹79).' },
  { q:'What if my order is late?', a:'We promise on-time delivery. If your saree arrives after the promised date, message us with your Order ID and get ₹50 off your next order (code LATE50).' },
  { q:'Can I exchange or return?', a:'Yes — 7-day easy replacement for damaged or wrong items. Message us on WhatsApp with your order ID and a photo.' },
  { q:'Will the colour match the photo?', a:'We photograph in natural light. Colours may vary slightly with screen settings — ask us on WhatsApp for real photos before dispatch.' },
  { q:'I live near Salem — can I pick up?', a:'Yes! Local customers can collect from our store at 2/130, Thoothanoor, Edanganasalai, Salem 637502.' },
];
const PROCESS = [
  { emoji:'🧵', title:'Selecting Yarn', text:'Premium silk & cotton from trusted weavers.' },
  { emoji:'🪡', title:'Weaving', text:'Handloom weaving by Tamil Nadu artisans.' },
  { emoji:'🎨', title:'Dyeing & Zari', text:'Colour-fast dyes and traditional gold zari.' },
  { emoji:'✅', title:'Quality Check', text:'Every saree inspected stitch-by-stitch.' },
  { emoji:'📦', title:'Packaging', text:'Neat packing with invoice & care card.' },
  { emoji:'🚚', title:'Delivery', text:'Doorstep delivery with WhatsApp updates.' },
];

/* ============================ 6. UTILITIES ============================ */
const money = n => '₹' + Number(n).toLocaleString('en-IN');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtDate = iso => new Date(iso).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
const validPhone = p => /^[6-9]\d{9}$/.test(String(p).trim());
let orderSeq = (() => { try{ return +localStorage.getItem('sk_order_seq') || 1000; }catch(e){ return 1000; } })();
function genOrderId(){ orderSeq += 1; try{ localStorage.setItem('sk_order_seq', String(orderSeq)); }catch(e){} return 'SK' + orderSeq; }
const LS = {
  get(k, fb){ try{ const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; }catch(e){ return fb; } },
  set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} },
};
const shippingFor = total => total >= CONFIG.shipFreeAbove ? 0 : CONFIG.shipFee;

/* Delivery estimate — dates + promise */
function deliveryEstimate(){
  const now = new Date();
  const add = d => { const x = new Date(now); x.setDate(x.getDate() + d); return x; };
  const isTN = true; /* assume TN-friendly; refine later with pincode */
  const [a, b] = isTN ? CONFIG.etaTn : CONFIG.etaIndia;
  return {
    from: add(2 + a), to: add(2 + b),
    text: `Dispatch in 24–48 hrs • Delivery ${add(2 + a).toLocaleDateString('en-IN',{day:'numeric',month:'short'})} – ${add(2 + b).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}`,
  };
}

/* ============================ 7. CART ============================ */
const Store = {
  cart  : LS.get('sk_cart', []),
  orders: LS.get('sk_orders', []),
  wish  : LS.get('sk_wish', []),
  profile: LS.get('sk_profile', { name:'', phone:'', address:'', pincode:'' }),
  saveCart(){ LS.set('sk_cart', this.cart); renderCartBadge(); renderCartBar(); },
  saveOrders(){ LS.set('sk_orders', this.orders); },
  saveWish(){ LS.set('sk_wish', this.wish); },
  saveProfile(){ LS.set('sk_profile', this.profile); },
};
function cartTotal(){ return Store.cart.reduce((s,i) => { const p = byId(i.id); return s + (p ? p.price * i.qty : 0); }, 0); }
function addToCart(id, qty = 1){
  const p = byId(id); if (!p) return;
  const ex = Store.cart.find(i => i.id === id);
  if (ex) ex.qty = Math.min(ex.qty + qty, 10); else Store.cart.push({ id, qty });
  Store.saveCart();
  toast('✅ Added to cart');
}
function setCartQty(id, qty){ const it = Store.cart.find(i => i.id === id); if (!it) return; it.qty = Math.max(1, Math.min(qty,10)); Store.saveCart(); }
function removeFromCart(id){ Store.cart = Store.cart.filter(i => i.id !== id); Store.saveCart(); toast('🗑️ Removed'); }
function renderCartBadge(){
  const b = document.getElementById('cartBadge'); if (!b) return;
  const n = Store.cart.reduce((s,i) => s + i.qty, 0);
  b.hidden = n === 0; b.textContent = n;
}
function renderCartBar(){
  let el = document.getElementById('siteCartBar');
  const n = Store.cart.reduce((s,i) => s + i.qty, 0);
  const onCart = document.body.dataset.page === 'cart' || document.body.dataset.page === 'checkout' || document.body.dataset.page === 'orders';
  document.body.classList.toggle('cartbar-on', n > 0 && !onCart);
  if (n > 0 && !onCart){
    if (!el){ el = document.createElement('div'); el.id = 'siteCartBar'; el.className = 'site-cartbar'; document.body.appendChild(el); }
    const t = cartTotal(); const sh = shippingFor(t);
    el.innerHTML = `<div class="scb-info"><b>${money(t + sh)}</b><small>${n} item${n>1?'s':''} • ${sh ? 'Ship +' + money(sh) : 'FREE ship'}</small></div>
      <a class="btn btn-maroon btn-sm" href="cart.html">Cart</a>
      <a class="btn btn-gold btn-sm" href="checkout.html">Checkout</a>`;
  } else if (el){ el.remove(); }
}

/* ============================ 8. WHATSAPP ============================ */
function waLink(text, num = CONFIG.waNumber){
  let n = String(num).replace(/[^\d]/g,'');
  if (/^[6-9]\d{9}$/.test(n)) n = '91' + n;
  return 'https://wa.me/' + n + '?text=' + encodeURIComponent(text);
}
function waProductMsg(p){ return `Hi! I want to order this Saree:\n\n🪡 ${p.name}\n💰 Price: ${money(p.price)}\n\nIs it available? Please confirm.`; }
function waCartMsg(){
  let m = 'Hi! I want to place this order:\n';
  Store.cart.forEach(i => { const p = byId(i.id); if (p) m += `\n• ${p.name} ×${i.qty} — ${money(p.price * i.qty)}`; });
  const t = cartTotal(); const sh = shippingFor(t);
  m += `\n\nTotal: ${money(t + sh)}${sh ? ' (incl. ₹' + sh + ' shipping)' : ' (FREE shipping)'}\nPlease confirm availability & delivery.`;
  return m;
}
const TPL_CONFIRM = o => `🎉 Order Confirmed!\n\nHi ${o.customer.name}, your order ${o.id} (${money(o.totals.grand)}) has been confirmed ✅\nExpected delivery: ${o.totals.eta}\nWe will update you on WhatsApp once it is dispatched.\n\nThank you for shopping with SK SAREES! 🪡`;
const TPL_DELIVERY = o => `🚚 Your beautiful Saree is out for delivery!\n\nExpected delivery: ${o.totals.eta}\nTrack your order: ${location.origin}/orders.html?id=${o.id}\n\nThank you for shopping with SK SAREES. 🪡`;
const TPL_NOTIFY = o => `🆕 New Order — please confirm!\n\nOrder ID: ${o.id}\nCustomer: ${o.customer.name}\nPhone: ${o.customer.phone}\nAddress: ${o.customer.address}, ${o.customer.pincode}\nPayment: ${o.payment === 'upi' ? 'UPI' : 'COD (+₹49)'}\nTotal: ${money(o.totals.grand)}\nETA: ${o.totals.eta}\n\nItems:\n${o.items.map(i => `• ${i.name} ×${i.qty} — ${money(i.price*i.qty)}`).join('\n')}`;

/* ============================ 9. UPI ============================ */
function upiLink(amount, note){
  return 'upi://pay?pa=' + CONFIG.upiId + '&pn=' + encodeURIComponent(CONFIG.upiName) +
    '&am=' + Number(amount).toFixed(2) + '&cu=INR&tn=' + encodeURIComponent(note || 'SK Sarees order') + '&mode=02';
}
function calcTotals(payment){
  const itemsTotal = cartTotal();
  const codFee = payment === 'cod' ? CONFIG.codFee : 0;
  const shipping = shippingFor(itemsTotal);
  return { itemsTotal, codFee, shipping, grand: itemsTotal + codFee + shipping, eta: deliveryEstimate().text };
}

/* ============================ 10. TOAST / MODAL ============================ */
let toastT;
function toast(msg){
  const t = document.getElementById('toast'); if (!t) return;
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2800);
}
function copyText(txt){
  const done = () => toast('✅ Copied');
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done).catch(()=>{});
  else { const ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta); ta.select(); try{ document.execCommand('copy'); done(); }catch(e){} ta.remove(); }
}
function openModal(html){
  const root = document.getElementById('modalRoot'); if (!root) return;
  root.innerHTML = `<div class="modal show"><div class="m-back" data-close></div><div class="m-card">${html}<button class="m-close" data-close aria-label="Close">✕</button></div></div>`;
  document.body.style.overflow = 'hidden';
}
function closeModal(){
  const m = document.querySelector('#modalRoot .modal'); if (!m) return;
  m.classList.remove('show'); setTimeout(() => { m.remove(); document.body.style.overflow = ''; }, 300);
}

/* ============================ 11. LANGS (en + ta + core hi/kn/te) ============================ */
const LANGS = {
  en: { home:'Home', shop:'Shop', cart:'Your Cart', checkout:'Checkout', myOrders:'My Orders', profile:'Profile', shopAll:'Shop All Sarees', addToCart:'Add to Cart', buyNow:'Buy Now', orderOnWA:'Order on WhatsApp', viewAll:'View all →', bestSellers:'Best Sellers', newArrivals:'New Arrivals', todaysDeals:'Today\'s Deals', flashSale:'Flash Sale', shopByCategory:'Shop by Category', trending:'Trending Collection', joinGroup:'Join Our WhatsApp Group', language:'Language', contactUs:'Contact Us', quickLinks:'Quick Links', aboutUs:'About Us', orderDetails:'Order Details', continueShopping:'Continue Shopping', payOnline:'Pay Online (UPI)', freeShip:'Free Shipping', placeOrder:'Place Order', confirmWA:'Confirm on WhatsApp', all:'All', search:'Search sarees, fabric, colour…', sort:'Sort', filter:'Filter', price:'Max Price', loadMore:'Loading more sarees…', noResults:'No sarees found', inStock:'In stock', outStock:'Out of stock' },
  ta: { home:'முகப்பு', shop:'கடை', cart:'உங்கள் வண்டி', checkout:'செலுத்துதல்', myOrders:'எனது ஆர்டர்கள்', profile:'சுயவிவரம்', shopAll:'அனைத்து சேலைகள்', addToCart:'வண்டியில் சேர்', buyNow:'இப்போது வாங்க', orderOnWA:'வாட்ஸ்அப்பில் ஆர்டர்', viewAll:'அனைத்தும் →', bestSellers:'சிறந்த விற்பனை', newArrivals:'புதிய வரவுகள்', todaysDeals:'இன்றைய சலுகைகள்', flashSale:'ஃபிளாஷ் சேல்', shopByCategory:'வகைப்படி வாங்குங்கள்', trending:'டிரெண்டிங் தொகுப்பு', joinGroup:'வாட்ஸ்அப் குழுவில் சேர', language:'மொழி', contactUs:'தொடர்பு', quickLinks:'விரைவு இணைப்புகள்', aboutUs:'எங்களை பற்றி', orderDetails:'ஆர்டர் விவரம்', continueShopping:'தொடர்ந்து வாங்குங்கள்', payOnline:'ஆன்லைனில் செலுத்துங்கள் (UPI)', freeShip:'இலவச டெலிவரி', placeOrder:'ஆர்டர் செய்யுங்கள்', confirmWA:'வாட்ஸ்அப்பில் உறுதி செய்', all:'அனைத்தும்', search:'சேலைகள், துணி, நிறம் தேடுங்கள்…', sort:'வரிசை', filter:'வடிகட்டு', price:'அதிகபட்ச விலை', loadMore:'மேலும் சேலைகள்…', noResults:'சேலைகள் இல்லை', inStock:'கையிருப்பில் உள்ளது', outStock:'கையிருப்பில் இல்லை' },
};
let lang = LS.get('sk_lang', 'en');
const t = k => (LANGS[lang] && LANGS[lang][k]) || LANGS.en[k] || k;
function setLang(l){ lang = LANGS[l] ? l : 'en'; LS.set('sk_lang', lang); location.reload(); }

/* ============================ 12. FIRESTORE (optional, live orders) ============================ */
const Firestore = {
  status: 'off',               /* off | loading | connected | error */
  lastError: '',
  onStatus: null,              /* callback(status, err) for UI pills */
  _setStatus(st, err){
    this.status = st; this.lastError = err || '';
    try{ if (this.onStatus) this.onStatus(st, err || ''); }catch(e){}
  },
  enabled(){ return !!(FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId); },
  _load(){
    return new Promise((resolve, reject) => {
      if (window.firebase && window.firebase.firestore){ this._setStatus('connected'); return resolve(); }
      if (this._loading) return this._loading;
      this._setStatus('loading');
      const s1 = document.createElement('script'); s1.src = 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js';
      const s2 = document.createElement('script'); s2.src = 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js';
      let settled = false;
      const fail = () => { if (!settled){ settled = true; this._setStatus('error', 'Firebase SDK failed to load — offline mode'); reject(new Error('sdk fail')); } };
      this._loading = new Promise((res, rej) => {
        s1.onload = () => document.head.appendChild(s2);
        s1.onerror = fail; s2.onload = () => { settled = true; this._setStatus('connected'); res(); }; s2.onerror = fail;
        document.head.appendChild(s1);
        setTimeout(fail, 12000);
      });
      return this._loading;
    });
  },
  async _db(){
    await this._load();
    if (!window.firebase.apps.length) window.firebase.initializeApp(FIREBASE_CONFIG);
    return window.firebase.firestore();
  },
  async saveOrder(order){
    if (!this.enabled()){ this._setStatus('off'); return false; }
    try{ const db = await this._db(); await db.collection('orders').doc(order.id).set(Object.assign({}, order, { createdAt: window.firebase.firestore.FieldValue.serverTimestamp() }), { merge: true }); this._setStatus('connected'); return true; }
    catch(e){ this._setStatus('error', String(e.message || e).slice(0, 120)); console.warn('fs save fail', e); return false; }
  },
  async updateStatus(id, status, extra){
    if (!this.enabled()){ this._setStatus('off'); return false; }
    try{ const db = await this._db(); await db.collection('orders').doc(String(id).toUpperCase()).set(Object.assign({ status, updatedAt: window.firebase.firestore.FieldValue.serverTimestamp() }, extra || {}), { merge: true }); this._setStatus('connected'); return true; }
    catch(e){ this._setStatus('error', String(e.message || e).slice(0, 120)); console.warn('fs status fail', e); return false; }
  },
  async getOrder(id){
    if (!this.enabled()) return null;
    try{ const db = await this._db(); const s = await db.collection('orders').doc(String(id).toUpperCase()).get(); return s.exists ? s.data() : null; }
    catch(e){ return null; }
  },
  /* Live listener for ALL orders (admin dashboard), newest first */
  listenOrders(cb){
    if (!this.enabled()){ cb([]); return () => {}; }
    let un = () => {};
    this._db().then(db => {
      un = db.collection('orders').orderBy('date', 'desc').onSnapshot(snap => {
        const l = []; snap.forEach(x => l.push(x.data())); cb(l);
      }, () => cb([]));
    }).catch(() => cb([]));
    return () => un();
  },
  onOrder(id, cb){
    if (!this.enabled()){ cb(null); return () => {}; }
    let un = () => {};
    this._db().then(db => { un = db.collection('orders').doc(String(id).toUpperCase()).onSnapshot(s => cb(s.exists ? s.data() : null), () => cb(null)); }).catch(() => cb(null));
    return () => un();
  },
};

/* ============================ 12b. PRODUCT CLOUD (Firestore) ============================
   Catalog = products from data.js + products stored in Firestore (merged).
   Admin can one-tap "Sync to Firestore"; store pages pull & merge on load. */
const ProductCloud = {
  async saveAll(){
    if (!Firestore.enabled()) return { ok:false, reason:'firestore-off' };
    try{
      const db = await Firestore._db();
      const batch = db.batch();
      PRODUCTS.forEach(p => batch.set(db.collection('products').doc(String(p.id)), Object.assign({}, p, { updatedAt: window.firebase.firestore.FieldValue.serverTimestamp() })));
      await batch.commit();
      return { ok:true, count: PRODUCTS.length };
    }catch(e){ console.warn('ProductCloud save fail', e); return { ok:false, reason:String(e.message || e).slice(0,80) }; }
  },
  async loadAll(){
    if (!Firestore.enabled()) return null;
    try{
      const db = await Firestore._db();
      const snap = await db.collection('products').get();
      const list = []; snap.forEach(d => list.push(d.data()));
      return list.length ? list : null;
    }catch(e){ console.warn('ProductCloud load fail', e); return null; }
  },
};
/* merge cloud products with the local catalog (cloud wins per id, extras added on top) */
function mergeCloudProducts(cloud){
  if (!cloud || !cloud.length) return;
  const merged = PRODUCTS.slice();
  cloud.forEach(c => {
    const np = normalizeProduct(c);
    const i = merged.findIndex(x => x.id === np.id);
    if (i >= 0) merged[i] = np; else merged.unshift(np);
  });
  PRODUCTS = merged;
  try{ if (window.onCatalogUpdate) window.onCatalogUpdate(); }catch(e){}
}

/* ============================ 13. AUTO-DELIVER ============================ */
function dispatchOrder(o){
  if (!o || o.status !== 'shipped') return;
  if (!o.deliverBy){ o.dispatchedAt = o.dispatchedAt || new Date().toISOString(); o.deliverBy = new Date(Date.now() + CONFIG.dispatchDays * 864e5).toISOString(); }
}
function maybeAutoDeliver(){
  let changed = false;
  Store.orders.forEach(o => {
    if (o.status === 'shipped' && o.deliverBy && Date.now() >= new Date(o.deliverBy).getTime()){
      o.status = 'delivered'; changed = true;
      Firestore.updateStatus(o.id, 'delivered').then(()=>{});
    }
  });
  if (changed) Store.saveOrders();
}

/* ============================ 14. HEADER / FOOTER ============================ */
const NAV = [
  ['index.html', 'home'], ['shop.html', 'shop'], ['cart.html', 'cart'], ['orders.html', 'orders'], ['profile.html', 'profile'],
];
const SK_LOGOSVG = '<svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="18" rx="4" fill="#e8c66a"/><text x="12" y="16.8" text-anchor="middle" font-size="9.5" font-weight="800" fill="#70142c" font-family="Arial, sans-serif">SK</text></svg>';
function renderHeader(){
  const h = document.getElementById('siteHeader'); if (!h) return;
  const page = document.body.dataset.page || 'home';
  h.innerHTML = `
  <div class="topbar">
    <div class="wrap topbar-in">
      <button class="burger" id="btnMenu" aria-label="Menu"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button>
      <a class="logo" href="index.html"><span class="logo-badge">${SK_LOGOSVG}</span><span>${CONFIG.storeName}<small>Premium Sarees • Salem</small></span></a>
      <nav class="desk-nav">
        <a href="index.html" class="${page==='home'?'on':''}">${t('home')}</a>
        <a href="shop.html" class="${page==='shop'?'on':''}">${t('shop')}</a>
        <a href="cart.html" class="${page==='cart'?'on':''}">${t('cart')}</a>
        <a href="orders.html" class="${page==='orders'?'on':''}">${t('myOrders')}</a>
        <a href="profile.html" class="${page==='profile'?'on':''}">${t('profile')}</a>
      </nav>
      <div class="top-actions">
        <span class="lang-pill"><select id="langSel" aria-label="Language">
          <option value="en" ${lang==='en'?'selected':''}>EN</option><option value="ta" ${lang==='ta'?'selected':''}>த</option>
        </select></span>
        <a class="icon-btn" href="profile.html" aria-label="Profile"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></a>
        <a class="icon-btn" href="cart.html" aria-label="Cart"><svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1.6"/><circle cx="19" cy="21" r="1.6"/><path d="M2 3h3l2.6 12.4a2 2 0 0 0 2 1.6h8.7a2 2 0 0 0 2-1.6L22 7H6"/></svg><span class="cart-badge" id="cartBadge" hidden>0</span></a>
      </div>
    </div>
  </div>
  <div class="overlay" id="overlay"></div>
  <aside class="drawer" id="drawer">
    <div class="drawer-head"><span class="logo-badge">${SK_LOGOSVG}</span><div><b>${CONFIG.storeName}</b><br><small style="opacity:.85;font-size:.72rem">2/130, Thoothanoor, Edanganasalai, Salem 637502</small></div></div>
    <nav class="drawer-nav" id="drawerNav">
      <a href="index.html">🏠 ${t('home')}</a>
      <a href="shop.html">🛍️ ${t('shopAll')}</a>
      <a href="cart.html">🛒 ${t('cart')}</a>
      <a href="orders.html">📦 ${t('myOrders')}</a>
      <a href="profile.html">👤 ${t('profile')}</a>
      <div class="sub">${t('shopByCategory')}</div>
      ${CATEGORIES.slice(0, 8).map(c => `<a href="shop.html?cat=${c.slug}">${c.emoji} ${c.name}</a>`).join('')}
      <div class="sub">Help</div>
      <a href="orders.html">📦 ${t('myOrders')}</a>
      <a href="#" data-faq>❓ FAQ</a>
    </nav>
  </aside>`;
  document.getElementById('btnMenu').addEventListener('click', openDrawer);
  document.getElementById('overlay').addEventListener('click', closeDrawer);
  document.getElementById('drawerNav').addEventListener('click', e => { const a = e.target.closest('a'); if (a){ if (a.dataset.faq){ e.preventDefault(); closeDrawer(); if (typeof window.scrollToFaq === 'function') window.scrollToFaq(); } else closeDrawer(); } });
  const ls = document.getElementById('langSel');
  if (ls) ls.addEventListener('change', () => setLang(ls.value));
  renderCartBadge();
}
function renderFooter(){
  const f = document.getElementById('siteFooter'); if (!f) return;
  f.innerHTML = `
  <footer>
    <div class="footer-top"><div class="wrap foot-grid">
      <div class="foot">
        <h4>${t('aboutUs')}</h4>
        <p>Premium Kanchipuram silk, cotton, georgette &amp; wedding sarees at honest prices. Family-run saree store serving customers across India since 2015.</p>
        <div class="foot-pay" style="margin-top:12px"><span>UPI</span><span>GPay</span><span>PhonePe</span><span>Paytm</span><span>COD</span><span>🔒 Secure</span></div>
        <div class="social-row">
          <a href="${CONFIG.social.instagram}" target="_blank" rel="noopener" aria-label="Instagram">📸</a>
          <a href="${CONFIG.social.facebook}" target="_blank" rel="noopener" aria-label="Facebook">👍</a>
          <a href="${CONFIG.social.youtube}" target="_blank" rel="noopener" aria-label="YouTube">▶️</a>
          <a href="${CONFIG.waGroup}" target="_blank" rel="noopener" aria-label="WhatsApp group">💬</a>
        </div>
      </div>
      <div class="foot">
        <h4>${t('quickLinks')}</h4>
        <p>
          <a href="index.html">${t('home')}</a><br>
          <a href="shop.html">${t('shopAll')}</a><br>
          <a href="cart.html">${t('cart')}</a><br>
          <a href="orders.html">${t('myOrders')}</a><br>
          <a href="profile.html">${t('profile')}</a><br>
          <a href="#" data-i18n-faq>❓ FAQ</a><br>
          <a href="admin.html" style="color:#7be6a4">🛠️ Store Admin</a>
        </p>
      </div>
      <div class="foot">
        <h4>${t('contactUs')}</h4>
        <ul class="foot-contact">
          <li><span>📍</span><span>2/130, Thoothanoor,<br>Edanganasalai,<br>Salem — 637502,<br>Tamil Nadu</span></li>
          <li><span>📞</span><a href="tel:+917867915699">+91 78679 15699</a></li>
          <li><span>💬</span><a href="${waLink('Hi! I have a question about your sarees.')}" target="_blank" rel="noopener" style="color:#7be6a4;font-weight:800">Chat on WhatsApp</a></li>
        </ul>
        <p style="font-size:.76rem">⏰ Order support: 9 AM – 9 PM, all days</p>
      </div>
    </div></div>
    <div class="foot-bottom wrap">© 2026 SK Sarees, Salem. All rights reserved. &nbsp;•&nbsp; Made with ❤️ in Tamil Nadu</div>
  </footer>`;
  const fq = f.querySelector('[data-i18n-faq]');
  if (fq) fq.addEventListener('click', e => { e.preventDefault(); if (typeof window.scrollToFaq === 'function') window.scrollToFaq(); });
}
function openDrawer(){ document.getElementById('drawer').classList.add('show'); document.getElementById('overlay').classList.add('show'); }
function closeDrawer(){ document.getElementById('drawer').classList.remove('show'); document.getElementById('overlay').classList.remove('show'); }
function injectChrome(){
  if (!document.getElementById('siteHeader')){
    const h = document.createElement('div'); h.id = 'siteHeader';
    document.body.insertBefore(h, document.getElementById('app') || document.body.firstChild);
  }
  if (!document.getElementById('siteFooter')){
    const f = document.createElement('div'); f.id = 'siteFooter';
    document.body.appendChild(f);
  }
  document.body.insertAdjacentHTML('afterbegin', `<div class="promo-strip"><span>🔥 Aadi Festival Sale — Up to 40% OFF &nbsp;•&nbsp; 🚚 ${t('freeShip')} Above ₹999 &nbsp;•&nbsp; 💵 COD Available (+₹49) &nbsp;•&nbsp; ⏱ Fast Delivery — On-Time Promise &nbsp;•&nbsp; ✅ 7-Day Easy Returns</span></div>`);
  renderHeader(); renderFooter();
  document.body.insertAdjacentHTML('beforeend', `
    <div class="wa-bubble" id="waBubble"><b>Need help?</b> Chat with us on WhatsApp — we reply in minutes!<div class="caret"></div></div>
    <a class="wa-float" id="waFloat" href="${waLink('Hi! I have a question about your sarees.')}" target="_blank" rel="noopener" aria-label="Chat on WhatsApp"><span>💬</span></a>
    <div class="toast" id="toast"></div>
    <div id="modalRoot"></div>`);
  if (!LS.get('sk_wa_tip', 0)){
    LS.set('sk_wa_tip', 1);
    setTimeout(() => { const b = document.getElementById('waBubble'); if (b) b.classList.add('show'); }, 2200);
    setTimeout(() => { const b = document.getElementById('waBubble'); if (b) b.classList.remove('show'); }, 9000);
  }
  document.addEventListener('click', e => { const c = e.target.closest('[data-close]'); if (c) closeModal(); });
}
