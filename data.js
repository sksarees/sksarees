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
  shipFee       : 49,
  dispatchDays  : 7,                 // auto Delivered N days after dispatch
  dispatchHours : 24,                // dispatch within 24-48h
  etaTn         : [2, 4],            // delivery days within Tamil Nadu
  etaIndia      : [4, 7],            // delivery days across India
  latePromise   : 'If your saree arrives after the promised date, reply LATE with your Order ID on WhatsApp and get ₹50 off your next order (code LATE50).',
  waGroup   : 'https://chat.whatsapp.com/LifaKCj3msQApwxJ4N4sQ0',
  /* 📸 PRODUCT IMAGES: LOCAL-FIRST — the photos ship inside the site folder
     (images/products/) so they always show, no CDN needed. `imageBase` is kept
     for future use (e.g. if you later move photos to a CDN, set it and change
     the `img()` helper). Failed remote images (Firestore etc.) fall back to the
     local copy, then to a branded placeholder — no broken icons ever. */
  imageBase : 'https://sksaree.shop/',   /* 👉 optional CDN root for future use */
  social : {
    instagram : 'https://www.instagram.com/sksarees_collection/',
    facebook  : 'https://www.facebook.com/eske.kalekcan/',
    youtube   : 'https://www.youtube.com/@sksarees_collection',
  },
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
  { slug:'bridal-sarees', name:'Bridal Sarees',    emoji:'👰', cls:'c-wedding',      blurb:'Wedding & bridal silks' },
  { slug:'gayathri-silk', name:'Gayathri Silk',    emoji:'✨', cls:'c-soft-silk',    blurb:'Soft traditional silks' },
  { slug:'samuthrika',    name:'Samuthrika Sarees',emoji:'🌿', cls:'c-silk',         blurb:'Classic drape styles' },
];

/* ============================ 4. PRODUCTS (48) ============================ */
/* product image helper — LOCAL-FIRST: the photos ship inside the site folder
   (images/products/), so they show on any hosting and in previews with zero
   setup. Firestore products may still use their own remote URLs; the global
   error-fallback below converts any failed image → local copy → placeholder. */
const img = file => 'images/products/' + file;
/* Local copy fallback target (same folder) */
const imgLocal = file => 'images/products/' + file;
/* Branded placeholder — used only when BOTH remote and local copies fail
   (e.g. offline preview). Never shows a broken image icon. */
const IMG_PLACEHOLDER = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">' +
  '<rect width="800" height="600" fill="#8f1d3a"/>' +
  '<rect x="56" y="56" width="688" height="488" rx="18" fill="none" stroke="#e8c66a" stroke-width="5"/>' +
  '<text x="400" y="265" text-anchor="middle" font-family="Georgia, serif" font-size="130" font-weight="bold" fill="#e8c66a">SK</text>' +
  '<text x="400" y="345" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" letter-spacing="6" fill="#fff" opacity="0.95">SAREES &#8226; SALEM</text>' +
  '<text x="400" y="420" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="#e8c66a" opacity="0.9">Image coming soon</text>' +
  '</svg>');
/* Clean image value: some sources store markdown [url](url) or arrays */
function cleanImg(u){
  if (!u) return img('printed-cotton.jpg');
  let s = String(u).trim();
  if (Array.isArray(u)) s = String((u[0] || '')).trim();
  const m = s.match(/\(([^)]+)\)\s*$/);
  if (m && s.indexOf('[') === 0) s = m[1];
  return s || img('printed-cotton.jpg');
}
/* Global image fallback (fires on every page, covers index/shop/admin…):
   any <img> that fails (CDN not uploaded yet / offline preview) first tries the
   local images/products/ copy, then the branded placeholder. No broken icons. */
try{
  document.addEventListener('error', function(e){
    const el = e.target;
    if (!el || el.tagName !== 'IMG' || !el.src) return;
    const cur = String(el.src);
    if (cur === IMG_PLACEHOLDER || cur.indexOf('data:image/svg+xml') === 0) return;
    const n = +(el.dataset.fbk || 0);
    if (n >= 1){ el.src = IMG_PLACEHOLDER; return; }
    el.dataset.fbk = '1';
    const m = cur.match(/\/images\/products\/([^/?#]+)/);
    el.src = m ? imgLocal(m[1]) : IMG_PLACEHOLDER;
  }, true);
}catch(e){}
const IMG = {
  kan: img('kanchipuram-silk.jpg'), ban: img('banarasi-silk.jpg'),
  soft: img('soft-silk.jpg'), cot: img('cotton-silk.jpg'),
  hand: img('handloom-cotton.jpg'), prn: img('printed-cotton.jpg'),
  geo: img('georgette.jpg'), party: img('party-wear.jpg'),
  org: img('organza.jpg'), lin: img('linen.jpg'),
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
  /* 1. Admin edits (sk_products) override the base catalog */
  try{
    const custom = JSON.parse(localStorage.getItem('sk_products'));
    if (Array.isArray(custom) && custom.length){
      /* merge cached Firestore products into it too (silent local restore) */
      try{
        const cached = JSON.parse(localStorage.getItem('sk_products_cloud'));
        if (Array.isArray(cached) && cached.length){
          cached.forEach(cp => { const np = normalizeProduct(cp); if (!custom.some(x => x.id === np.id)) custom.unshift(np); });
        }
      }catch(e){}
      return custom;
    }
  }catch(e){}
  /* 2. Cached Firestore products merge silently into the base catalog —
     so cloud-only products appear instantly on every visit, no network needed */
  try{
    const cached = JSON.parse(localStorage.getItem('sk_products_cloud'));
    if (Array.isArray(cached) && cached.length){
      cached.forEach(cp => {
        const np = normalizeProduct(cp);
        const i = built.findIndex(x => x.id === np.id);
        if (i >= 0) built[i] = np; else built.unshift(np);
      });
    }
  }catch(e){}
  return built;
})();
function saveProducts(list){
  PRODUCTS = list;
  LS.set('sk_products', list);
  if (FS.enabled()){ try{ Sync.pushProducts(); }catch(e){} }  /* admin edits only */
}
function resetProducts(){ PRODUCTS = (() => { let built = BASE.map(b => Object.assign({}, b)); BASE.forEach(b => { VARIANTS.slice(0,3).forEach((v,i)=>{ built.push(Object.assign({}, b, { id: b.id + '-v' + (i+1), name: b.name.replace(/—[^-]*$/, '— ' + v.color), color: v.color + ' variant', price: Math.round(b.price * (1 - v.off/100)), mrp: b.mrp, rating: b.rating, reviews: b.reviews, stock: Math.max(2, b.stock - i*4), badge: b.badge === 'Bestseller' ? '' : b.badge })); }); }); return built; })(); try{ localStorage.removeItem('sk_products'); }catch(e){} }
function genProductId(name){ return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2,5); }
function normalizeProduct(raw){
  raw = raw || {};
  /* ---- flexible field mapping: supports BOTH schemas ----
     Your Firestore: name, price, op, disc, cat, category, fab, col, len, care,
                     occ, image/images/imgs, sku, stock, desc, rat, rev, featured
     Admin-added:    name, price, mrp, cat, fabric, color, length, wash, img, ... */
  const catSlug = String(raw.cat || raw.category || 'daily').trim().toLowerCase().replace(/\s+/g, '-');
  const cat = CATEGORIES.some(c => c.slug === catSlug) ? catSlug : 'daily';
  const price = Math.max(0, Math.round(+raw.price || 0));
  /* MRP: prefer mrp/op; else derive from discount % (disc) */
  let mrp = Math.round(+raw.mrp || +raw.op || 0);
  if (!(mrp > price)){
    const disc = Math.min(90, Math.max(0, +raw.disc || 0));
    if (disc > 0 && price > 0) mrp = Math.round(price * 100 / (100 - disc));
  }
  mrp = Math.max(price, mrp || Math.round(price * 1.6));
  /* safe: during PRODUCTS' own initializer this binding is in TDZ and throws */
  let catCount = 0;
  try{ catCount = PRODUCTS.filter(p => p.cat === cat).length; }catch(e){ catCount = 0; }
  const imgUrl = cleanImg(raw.img || raw.image || (raw.images && raw.images[0]) || (raw.imgs && raw.imgs[0]));
  /* badge: explicit, else from featured/discount */
  let badge = ['Bestseller','New','Sale','Limited Stock'].includes(raw.badge) ? raw.badge : '';
  if (!badge){ if (raw.featured || raw.ft) badge = 'Bestseller'; else if ((+raw.disc || 0) >= 40) badge = 'Sale'; }
  const colors = Array.isArray(raw.colors) && raw.colors.length
    ? raw.colors
    : String(raw.col || raw.color || 'Multi').split('/').map(x => x.trim()).filter(Boolean);
  return {
    id: String(raw.id || raw.sku || genProductId(raw.name)).trim(),
    sku: String(raw.sku || ('SKS-' + cat.slice(0,3).toUpperCase() + '-' + String(catCount + 1).padStart(3,'0'))).trim(),
    name: String(raw.name || 'Untitled Saree').trim(),
    price, mrp, cat,
    rating: Math.min(5, Math.max(1, +raw.rating || +raw.rat || 4.5)),
    reviews: Math.max(0, +raw.reviews || +raw.rev || 0),
    badge,
    img: imgUrl,
    fabric: String(raw.fabric || raw.fab || 'Premium fabric').trim(),
    color: colors.join(' / ') || 'Multi',
    border: String(raw.border || '—').trim(),
    blouse: String(raw.blouse || 'Blouse piece included').trim(),
    length: String(raw.length || raw.len || '6.3 m + blouse').trim(),
    weight: String(raw.weight || '450 g').trim(),
    wash: String(raw.wash || raw.care || 'Dry clean recommended').trim(),
    stock: Math.max(0, +raw.stock || 10),
    colors: colors.length ? colors : ['Multi'],
    desc: String(raw.desc || 'Beautiful handpicked saree from our collection.').trim(),
  };
}

/* ============================ 5. UTILITIES ============================ */
const money = n => '₹' + Number(n).toLocaleString('en-IN');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtDate = iso => new Date(iso).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
const validPhone = p => /^[6-9]\d{9}$/.test(String(p).trim());
let orderSeq = (() => { try{ return +localStorage.getItem('sk_order_seq') || 1000; }catch(e){ return 1000; } })();
function genOrderId(){ orderSeq += 1; try{ localStorage.setItem('sk_order_seq', String(orderSeq)); }catch(e){} return 'SK' + orderSeq; }
const offPct = p => p.mrp > p.price ? Math.round((1 - p.price / p.mrp) * 100) : 0;
const byId = id => {
  if (!id) return undefined;
  const s = String(id);
  return PRODUCTS.find(p => String(p.id) === s)
      || PRODUCTS.find(p => String(p.sku) === s)
      || PRODUCTS.find(p => String(p.id).toLowerCase() === s.toLowerCase());
};
const catOf = slug => CATEGORIES.find(c => c.slug === slug);
const catImage = slug => { const p = PRODUCTS.find(x => x.cat === slug && x.img); return p ? p.img : img('kanchipuram-silk.jpg'); };
const realReviewCount = id => { try{ return (LS.get('sk_reviews_' + id, [])).length; }catch(e){ return 0; } };
const shippingFor = total => total >= CONFIG.shipFreeAbove ? 0 : CONFIG.shipFee;

/* Delivery estimate — dates + promise */
function deliveryEstimate(){
  const now = new Date();
  const add = d => { const x = new Date(now); x.setDate(x.getDate() + d); return x; };
  const [a, b] = CONFIG.etaTn;
  return {
    from: add(2 + a), to: add(2 + b),
    text: 'Dispatch in 24–48 hrs • Delivery ' + add(2 + a).toLocaleDateString('en-IN',{day:'numeric',month:'short'}) + ' – ' + add(2 + b).toLocaleDateString('en-IN',{day:'numeric',month:'short'}),
  };
}

/* Storage with fallbacks — works even where localStorage is blocked */
const LS = {
  _mem: {},
  _get(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } },
  _set(k, v){ try{ localStorage.setItem(k, v); return true; }catch(e){ return false; } },
  _sget(k){ try{ return sessionStorage.getItem(k); }catch(e){ return null; } },
  _sset(k, v){ try{ sessionStorage.setItem(k, v); return true; }catch(e){ return false; } },
  get(k, fb){
    try{ const v = this._get(k); if (v != null) return JSON.parse(v); }catch(e){}
    try{ const v = this._sget(k); if (v != null) return JSON.parse(v); }catch(e){}
    return (k in this._mem) ? this._mem[k] : fb;
  },
  set(k, v){
    const str = JSON.stringify(v);
    this._mem[k] = v;
    if (this._set(k, str)) return;
    this._sset(k, str);
  },
};

/* ============================ 6. REVIEWS / FAQ / PROCESS ============================ */
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
  { q:'How long does delivery take?', a:'We dispatch within 24–48 hours. Delivery: 2–4 days within Tamil Nadu, 4–7 days across India. Free shipping above ₹999 (else ₹49).' },
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

/* ============================ 7. CART ============================ */
const Store = {
  cart  : LS.get('sk_cart', []),
  orders: LS.get('sk_orders', []),
  wish  : LS.get('sk_wish', []),
  profile: LS.get('sk_profile', { name:'', phone:'', address:'', pincode:'' }),
  saveCart(){ LS.set('sk_cart', this.cart); renderCartBadge(); renderCartBar(); if (FS.enabled()) Sync.pushCloud(); },
  saveOrders(){ LS.set('sk_orders', this.orders); }, /* no pushCloud here (avoids FS listener loop) */
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
/* ❤️ Like / wishlist toggle — works on product page & shop cards */
function toggleWish(id){
  const p = byId(id); if (!p) return;
  const i = Store.wish.indexOf(id);
  if (i >= 0){ Store.wish.splice(i, 1); toast('💔 Removed from wishlist'); }
  else { Store.wish.push(id); toast('❤️ Added to wishlist'); }
  Store.saveWish();
  /* update every heart button for this product without a full re-render */
  try{
    document.querySelectorAll('[data-wish="' + id + '"]').forEach(b => {
      b.textContent = Store.wish.includes(id) ? '❤️' : '🤍';
      b.classList.toggle('on', Store.wish.includes(id));
    });
  }catch(e){}
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
/* Deep links that open a SPECIFIC UPI app directly (GPay / PhonePe / Paytm).
   Works on Android when the app is installed; otherwise the generic
   "Pay Now" (upi://) button and the QR code are the fallbacks. */
function upiAppLink(app, amount, note){
  const base = 'pa=' + CONFIG.upiId + '&pn=' + encodeURIComponent(CONFIG.upiName) +
    '&am=' + Number(amount).toFixed(2) + '&cu=INR&tn=' + encodeURIComponent(note || 'SK Sarees order');
  if (app === 'gpay')    return 'intent://pay?' + base + '#Intent;scheme=upi;package=com.google.android.apps.nfcpay;S.browser_fallback_url=' + encodeURIComponent('https://pay.google.com/') + ';end';
  if (app === 'phonepe') return 'phonepe://pay?' + base;
  if (app === 'paytm')   return 'paytmmp://pay?' + base;
  return 'upi://pay?' + base + '&mode=02';
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

/* ============================ 12. FIRESTORE (ORDERS + REVIEWS only) ============================
   Clean & simple: optional cloud sync for orders & reviews.
   - Never blocks the site — everything works locally first.
   - No probe, no reserved IDs, no scary status: badge shows 🟢 only when connected.
   - Config: project sksareesapp (change FIREBASE_CONFIG if you use another project). */
const FIREBASE_CONFIG = {
  apiKey      : 'AIzaSyC351uS2-LkxIeDNCqhScnlGzHjoJ9KkOY',
  authDomain  : 'sksareesapp.firebaseapp.com',
  projectId   : 'sksareesapp',
  storageBucket: 'sksareesapp.firebasestorage.app',
  messagingSenderId: '774983284365',
  appId       : '1:774983284365:web:e03c9b2337d041986fd4c4',
  measurementId: 'G-QGHYX73WG6',
};

function _loadScript(src){
  return new Promise((res, rej) => {
    const el = document.createElement('script');
    el.src = src; el.async = true;
    el.onload = () => res();
    el.onerror = () => rej(new Error('load failed'));
    document.head.appendChild(el);
    setTimeout(() => rej(new Error('timeout')), 15000);
  });
}

const FS = {
  status: 'off',          /* off | connecting | on | error */
  lastError: '',
  onStatus: null,
  _setStatus(st, err){
    this.status = st; this.lastError = err || '';
    try{ if (this.onStatus) this.onStatus(st, err || ''); }catch(e){}
  },
  enabled(){
    /* window.__FS_OFF = true disables cloud sync entirely (tests / debug) */
    try{ if (window.__FS_OFF) return false; }catch(e){}
    return !!(FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId);
  },
  _db: null,
  _loading: null,
  _getDb(){
    if (this._db) return Promise.resolve(this._db);
    if (this._loading) return this._loading;
    this._setStatus('connecting');
    this._loading = (async () => {
      const bases = ['https://www.gstatic.com/firebasejs/10.12.2/','https://unpkg.com/firebase@10.12.2/','https://cdn.jsdelivr.net/npm/firebase@10.12.2/'];
      for (const base of bases){
        try{
          if (!(window.firebase && window.firebase.app)) await _loadScript(base + 'firebase-app-compat.js');
          if (!(window.firebase && window.firebase.firestore)) await _loadScript(base + 'firebase-firestore-compat.js');
          break;
        }catch(e){}
      }
      if (!(window.firebase && window.firebase.firestore)) throw new Error('sdk unavailable (offline / blocked)');
      if (!window.firebase.apps.length) window.firebase.initializeApp(FIREBASE_CONFIG);
      this._db = window.firebase.firestore();
      this._setStatus('on');
      return this._db;
    })().catch(e => {
      this._loading = null;
      this._setStatus('error', String((e && e.message) || e).slice(0, 150));
      return null;
    });
    return this._loading;
  },
  /* ---------- ORDERS ---------- */
  async saveOrder(order){
    const db = await this._getDb(); if (!db) return false;
    try{
      await db.collection('orders').doc(order.id).set(Object.assign({}, order, { createdAt: window.firebase.firestore.FieldValue.serverTimestamp() }), { merge: true });
      this._setStatus('on');
      return true;
    }catch(e){ this._setStatus('error', String(e.message || e).slice(0, 150)); return false; }
  },
  async updateStatus(id, status, extra){
    const db = await this._getDb(); if (!db) return false;
    try{
      await db.collection('orders').doc(String(id)).set(Object.assign({ status, updatedAt: window.firebase.firestore.FieldValue.serverTimestamp() }, extra || {}), { merge: true });
      return true;
    }catch(e){ return false; }
  },
  listenOrders(cb){
    let un = () => {};
    this._getDb().then(db => {
      if (!db) return;
      un = db.collection('orders').orderBy('date', 'desc').onSnapshot(snap => {
        const l = []; snap.forEach(x => l.push(x.data())); cb(l);
      }, () => {});
    });
    return () => un();
  },
  /* one-time fetch (works even while connecting) */
  async getOrder(id){
    const db = await this._getDb(); if (!db) return null;
    try{
      const snap = await db.collection('orders').doc(String(id)).get();
      return snap.exists ? snap.data() : null;
    }catch(e){ return null; }
  },
  listenOrder(id, cb){
    let un = () => {};
    this._getDb().then(db => {
      if (!db) return;
      un = db.collection('orders').doc(String(id)).onSnapshot(s => cb(s.exists ? s.data() : null), () => {});
    });
    return () => un();
  },
  /* ---------- PRODUCTS (one-time fetch, used by product-page fallback) ---------- */
  /* Find one product by doc id / sku / id field. Returns null when missing. */
  async getProduct(id){
    const db = await this._getDb(); if (!db) return null;
    const s = String(id);
    const tries = [
      () => db.collection('products').doc(s).get(),
      () => db.collection('products').where('sku', '==', s).limit(1).get(),
      () => db.collection('products').where('id', '==', s).limit(1).get(),
    ];
    for (const t of tries){
      try{
        const snap = await t();
        if (snap.exists) return snap.data();
        let hit = null;
        snap.forEach(d => { if (d.exists && !hit) hit = d.data(); });
        if (hit) return hit;
      }catch(e){}
    }
    return null;
  },
  /* ---------- REVIEWS ---------- */
  async saveReview(productId, review){
    const db = await this._getDb(); if (!db) return false;
    try{
      const rid = 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      await db.collection('reviews').doc(rid).set(Object.assign({}, review, { productId, rid, createdAt: window.firebase.firestore.FieldValue.serverTimestamp() }));
      return true;
    }catch(e){ return false; }
  },
  async getProductReviews(productId){
    const db = await this._getDb(); if (!db) return [];
    try{
      const snap = await db.collection('reviews').where('productId', '==', productId).limit(50).get();
      const l = []; snap.forEach(x => l.push(x.data())); return l;
    }catch(e){ return []; }
  },
  listenReviews(cb){
    let un = () => {};
    this._getDb().then(db => {
      if (!db) return;
      un = db.collection('reviews').orderBy('createdAt', 'desc').limit(200).onSnapshot(snap => {
        const l = []; snap.forEach(x => l.push(x.data())); cb(l);
      }, () => {});
    });
    return () => un();
  },
  async deleteReview(rid){
    const db = await this._getDb(); if (!db) return false;
    try{ await db.collection('reviews').doc(rid).delete(); return true; }catch(e){ return false; }
  },
};

/* ============================ 12b. UNIFIED SYNC (localStorage + Firestore) ============================
   Every page saves to local storage (multi-tier) first, then syncs to Firestore
   with LOW write volume — so the free Firestore quota never gets burned:
   · orders are pushed ONCE (tracked in sk_orders_synced) — never re-pushed
   · products are pushed ONLY when the admin edits them (saveProducts)
   · collections are seeded ONCE per device (sk_seed_done)
   · order listeners run only on the pages that display orders (orders/admin) */
function markOrderSynced(id){
  try{
    const s = JSON.parse(localStorage.getItem('sk_orders_synced') || '[]');
    if (!s.includes(id)){ s.push(id); localStorage.setItem('sk_orders_synced', JSON.stringify(s.slice(-300))); }
  }catch(e){}
}
const Sync = {
  _pushPause: 0,   /* timestamp — back off after repeated cloud write failures */
  _fail: 0,
  /* ---- save everything to local storage (multi-tier) ---- */
  saveLocal(){
    LS.set('sk_cart', Store.cart);
    LS.set('sk_orders', Store.orders);
    LS.set('sk_wish', Store.wish);
    LS.set('sk_profile', Store.profile);
    try{ LS.set('sk_products', PRODUCTS); }catch(e){}
  },
  /* ---- push NEW (unsynced) orders to Firestore, once each ---- */
  pushCloud(){
    if (!FS.enabled()) return;
    if (this._pushPause && Date.now() < this._pushPause) return; /* backoff */
    let synced = [];
    try{ synced = JSON.parse(localStorage.getItem('sk_orders_synced')) || []; }catch(e){}
    const doneSet = new Set(synced);
    let pushed = 0;
    (Store.orders || []).forEach(o => {
      if (!o || !o.id || doneSet.has(o.id) || pushed >= 10) return;
      pushed++;
      FS.saveOrder(o).then(ok => {
        if (ok){
          doneSet.add(o.id); markOrderSynced(o.id);
        } else {
          this._fail = (this._fail || 0) + 1;
          if (this._fail >= 6) this._pushPause = Date.now() + 5 * 60 * 1000; /* 5-min backoff */
        }
      }).catch(() => {
        this._fail = (this._fail || 0) + 1;
        if (this._fail >= 6) this._pushPause = Date.now() + 5 * 60 * 1000;
      });
    });
  },
  /* ---- push the product catalog to Firestore (admin edits only — rare) ---- */
  pushProducts(){
    if (!FS.enabled()) return;
    try{
      FS._getDb().then(db => {
        if (!db) return;
        (PRODUCTS || []).slice(0, 100).forEach(p => {
          db.collection('products').doc(String(p.id)).set(Object.assign({}, p, { updatedAt: window.firebase.firestore.FieldValue.serverTimestamp() }), { merge: true }).catch(() => {});
        });
      }).catch(() => {});
    }catch(e){}
  },
  /* ---- pull cloud products → local (BOTH show; schema-flexible) ---- */
  pullProducts(){
    if (!FS.enabled()) return;
    FS._getDb().then(db => {
      if (!db) return;
      db.collection('products').get().then(snap => {
        const cloud = [];
        snap.forEach(x => {
          const d = x.data() || {};
          d.id = d.id || d.sku || x.id;
          if (d.status && String(d.status).toLowerCase() !== 'active') return;
          cloud.push(d);
        });
        if (!cloud.length) return;
        const merged = PRODUCTS.slice();
        cloud.forEach(c => {
          const np = normalizeProduct(c);
          const i = merged.findIndex(x => x.id === np.id);
          if (i >= 0) merged[i] = np; else merged.unshift(np);
        });
        PRODUCTS = merged;
        try{ LS.set('sk_products_cloud', PRODUCTS); }catch(e){}
        try{
          const pg = document.body.dataset.page;
          if (pg === 'shop') renderShop();
          else if (pg === 'home') renderHome();
          else if (pg === 'product') renderProduct();
          else if (pg === 'admin' && typeof renderProdBody === 'function') renderProdBody();
        }catch(e2){}
      }).catch(() => {});
    }).catch(() => {});
  },
  _debounce: null,
  /* ---- pull cloud → local (merge; local status wins for orders) ---- */
  pullCloud(){
    if (!FS.enabled()) return;
    clearTimeout(this._debounce);
    this._debounce = setTimeout(() => {
      this._pullCloudNow();
    }, 300); /* debounce rapid snapshots → fast loading */
  },
  _pullCloudNow(){
    if (!FS.enabled()) return;
    FS.listenOrders(list => {
      if (!list || !list.length) return;
      const localMap = {}; Store.orders.forEach(o => localMap[o.id] = o);
      Store.orders = list.map(f => Object.assign({}, f, localMap[f.id] || {}))
        .concat(Store.orders.filter(o => !list.some(x => x.id === o.id)));
      Store.orders.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      Store.saveOrders();
      /* re-render current page lists if they exist */
      try{
        if (typeof renderOrdersList === 'function' && document.getElementById('orderList')) renderOrdersList();
        if (typeof renderStats === 'function') renderStats();
      }catch(e){}
    });
    /* products from Firestore → merge into data.js catalog (BOTH show) */
    FS._getDb().then(db => {
      if (!db) return;
      db.collection('products').get().then(snap => {
        const cloud = [];
        snap.forEach(x => {
          const d = x.data() || {};
          d.id = d.id || d.sku || x.id;          /* use Firestore doc id as fallback */
          if (d.status && String(d.status).toLowerCase() !== 'active') return; /* only Active */
          cloud.push(d);
        });
        if (!cloud.length) return;
        const merged = PRODUCTS.slice();
        cloud.forEach(c => {
          const np = normalizeProduct(c);
          const i = merged.findIndex(x => x.id === np.id);
          if (i >= 0) merged[i] = np; else merged.unshift(np);
        });
        PRODUCTS = merged;
        try{ LS.set('sk_products_cloud', PRODUCTS); }catch(e){}
        /* re-render the current page so Firestore products appear immediately */
        try{
          const pg = document.body.dataset.page;
          if (pg === 'shop') renderShop();
          else if (pg === 'home') renderHome();
          else if (pg === 'product') renderProduct();
          else if (pg === 'admin' && typeof renderProdBody === 'function') renderProdBody();
        }catch(e2){}
      }).catch(() => {});
    }).catch(() => {});
  },
  /* ---- call on every page: save local + push new orders + pull what the
     page needs (order listeners only where orders are displayed) ---- */
  run(){
    this.saveLocal();
    this.pushCloud();
    let pg = '';
    try{ pg = (document.body && document.body.dataset.page) || ''; }catch(e){}
    if (pg === 'admin'){
      this.pullCloud();           /* ADMIN ONLY: live orders (everyone's) + products */
    } else {
      this.pullProducts();        /* user pages: only products — orders stay DEVICE-LOCAL */
    }
  },
};

/* Manual refresh helper (used by a shop-page button) */
window.refreshCloudProducts = function(){ try{ Sync.pullProducts(); }catch(e){} };

/* ============================ 12c. FIRESTORE COLLECTIONS SETUP ============================
   Creates the full database structure in your Firestore project:
   admins · cart · categories · customers · inventory · orders · products ·
   promos · reviews · settings
   Each collection gets a seed document so it exists (and your rules apply). */
const FS_COLLECTIONS = ['admins','cart','categories','customers','inventory','orders','products','promos','reviews','settings'];
function seedFirestoreCollections(){
  if (!FS.enabled()) return;
  if (window.__seedDone) return;       /* in-page guard (prevents write loops) */
  window.__seedDone = true;
  try{ if (localStorage.getItem('sk_seed_done') === '1') return; }catch(e){} /* once per device */
  FS._getDb().then(db => {
    if (!db) return;
    try{ localStorage.setItem('sk_seed_done', '1'); }catch(e){}
    const now = window.firebase.firestore.FieldValue.serverTimestamp();
    /* settings: store details */
    db.collection('settings').doc('store').set({
      name: CONFIG.storeName, whatsapp: CONFIG.waNumber, upi: CONFIG.upiId,
      address: '2/130, Thoothanoor, Edanganasalai, Salem 637502',
      codFee: CONFIG.codFee, shipFreeAbove: CONFIG.shipFreeAbove, shipFee: CONFIG.shipFee,
      updatedAt: now,
    }, { merge: true }).catch(() => {});
    /* admins: seed admin */
    db.collection('admins').doc('owner').set({
      name: 'Store Owner', phone: CONFIG.waDisplay, role: 'owner', updatedAt: now,
    }, { merge: true }).catch(() => {});
    /* categories: seed all categories */
    CATEGORIES.forEach(c => {
      db.collection('categories').doc(c.slug).set({
        slug: c.slug, name: c.name, emoji: c.emoji, blurb: c.blurb, updatedAt: now,
      }, { merge: true }).catch(() => {});
    });
    /* promos: seed default */
    db.collection('promos').doc('aadi-sale').set({
      code: 'AADI10', title: 'Aadi Festival Sale', discount: 10, active: true, updatedAt: now,
    }, { merge: true }).catch(() => {});
    /* inventory: ensure a doc exists (touched by product sync) */
    db.collection('inventory').doc('_meta').set({ note: 'Inventory mirrors products collection. Sync via Products tab.', updatedAt: now }, { merge: true }).catch(() => {});
    /* customers: placeholder */
    db.collection('customers').doc('_meta').set({ note: 'Customer profiles stored here. Add on signup.', updatedAt: now }, { merge: true }).catch(() => {});
    /* cart: placeholder */
    db.collection('cart').doc('_meta').set({ note: 'Carts sync here for logged-in users.', updatedAt: now }, { merge: true }).catch(() => {});
    console.log('[SK Sarees] Firestore collections ensured:', FS_COLLECTIONS.join(', '));
  }).catch(() => {});
}
window.seedFirestoreCollections = seedFirestoreCollections;

/* ============================ 12. AUTO-DELIVER ============================ */
function dispatchOrder(o){
  if (!o || o.status !== 'shipped') return;
  if (!o.deliverBy){ o.dispatchedAt = o.dispatchedAt || new Date().toISOString(); o.deliverBy = new Date(Date.now() + CONFIG.dispatchDays * 864e5).toISOString(); }
}
function maybeAutoDeliver(){
  let changed = false;
  Store.orders.forEach(o => {
    if (o.status === 'shipped' && o.deliverBy && Date.now() >= new Date(o.deliverBy).getTime()){
      o.status = 'delivered'; changed = true;
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
