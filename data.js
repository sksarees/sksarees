/* ============================================================================
   SK SAREES â€” Shared data & logic (multi-page premium redesign)
   Used by: index Â· shop Â· product Â· cart Â· checkout Â· orders Â· profile
   ========================================================================== */
'use strict';

/* ============================ 1. CONFIG ============================ */
const SVG_WA = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true" style="vertical-align:-2px;margin-right:4px"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';
const CONFIG = {
  storeName : 'SK SAREES',
  waNumber  : '917867915699',
  waDisplay : '78679 15699',
  upiId     : 'sk7867915699-1@oksbi',
  upiName   : 'SK SAREES',
  codFee    : 70,
  shipFreeAbove : 999,
  /* Shipping = â‚¹zoneFee PER SARE (item), free above â‚¹999.
     1 saree TN â‚¹30 Â· 2 sarees â‚¹60 Â· 3 sarees â‚¹90 (per unit Ã— qty). */
  shipFee       : 30,
  cartCoupon    : { code:'CART50', off:50, label:'Forgot your cart? Get â‚¹50 off!' },
  dispatchDays  : 7,                 // auto Delivered N days after dispatch
  /* ðŸ›’ bundle deal: buy 2+ sarees â†’ â‚¹50 off */
  bundleCount : 2, bundleOff : 50,
  dispatchHours : 12,                // dispatch within 12â€“24h (COD: 24â€“48h)
  /* ðŸ’° Reseller / Share & Earn program: 5% margin per order (GPay OR loyalty
     points) + â‚¹50-off promo coupon for customers */
  resellerMargin : 50,               // â‚¹50-off customer coupon value (SHARE50)
  resellerMarginPct : 5,             // ðŸ”¥ reseller earns 5% of every confirmed order
  resellerCoupon : 'SHARE50',        // â‚¹50 off coupon shown on the index banner
  couponCap      : 5,                 // ðŸ”’ ALL % coupons capped at 5% (low-profit â†’ more buying)
  onlineDiscount : 1,                 // ðŸ’³ 1% off when paying ONLINE (UPI); COD = full price
  latePromise   : 'If your saree arrives after the promised date, reply LATE with your Order ID on WhatsApp and get â‚¹50 off your next order (code LATE50).',
  googleReview : 'https://g.page/r/CSQ5w7DqPWbXEAE/review',
  /* ðŸŽ¬ Video catalog (YouTube embeds on the home page) â€” replace IDs with your
     own store videos: e.g. { title:'My Silk Collection', id:'VIDEO_ID_11CHARS' } */
  videos : [
    { title:'The Making of Kanjeevaram Sarees', id:'OWv0uzHelqE' },
    { title:'Cotton Silk Saree Draping', id:'X8RuLsrjMm4' },
    { title:'Beginner Saree Draping Tutorial', id:'yKaY_CI-aXE' },
  ],
  waGroup   : 'https://chat.whatsapp.com/LifaKCj3msQApwxJ4N4sQ0',
  /* ðŸ“¸ PRODUCT IMAGES: LOCAL-FIRST â€” the photos ship inside the site folder
     (images/products/) so they always show, no CDN needed. `imageBase` is kept
     for future use (e.g. if you later move photos to a CDN, set it and change
     the `img()` helper). Failed remote images (Firestore etc.) fall back to the
     local copy, then to a branded placeholder â€” no broken icons ever. */
  imageBase : 'https://sksaree.shop/',   /* ðŸ‘‰ optional CDN root for future use */
  siteUrl   : 'https://www.sksaree.shop', /* canonical site URL â€” used for Google feeds & schema so Google can reach the products */
  social : {
    instagram : 'https://www.instagram.com/sksarees_collection/',
    facebook  : 'https://www.facebook.com/eske.kalekcan/',
    youtube   : 'https://www.youtube.com/@sksarees_collection',
  },
};

/* ============================ 2. DELIVERY ZONES (by PIN code) ============================ */
const ZONES = {
  tn:        { name:'Tamil Nadu',         ship: 30, days: [2, 3] },
  andra:     { name:'Andhra / Telangana', ship: 40, days: [3, 4] },
  karnataka: { name:'Karnataka',          ship: 40, days: [3, 4] },
  other:     { name:'Other states',       ship: 60, days: [5, 7] },
};
/* ============================ 2b. FESTIVAL CALENDAR + EARLY ACCESS ============================ */
const FESTIVALS = [
  { slug:'aadi',     emoji:'ðŸŒ¾', name:'Aadi Sale',        blurb:'Aadi month specials â€” up to 40% off' },
  { slug:'pongal',   emoji:'ðŸŒ…', name:'Pongal Collection', blurb:'Harvest season silks & cottons' },
  { slug:'diwali',   emoji:'ðŸª”', name:'Diwali Special',    blurb:'Festive lights & gold-zari sarees' },
  { slug:'wedding',  emoji:'ðŸ’', name:'Wedding Season',    blurb:'Bridal & family wedding sarees' },
];
/* Auto-detect which festival is currently live based on today's date */
function currentFestival(){
  const d = new Date();
  const m = d.getMonth() + 1, day = d.getDate();
  if ((m === 7 && day >= 17) || (m === 8 && day <= 17)) return 'aadi';          /* Aadi: ~17 Jul â€“ 17 Aug */
  if (m === 1 && day >= 10 && day <= 20) return 'pongal';                        /* Pongal: 10â€“20 Jan */
  if ((m === 10 && day >= 15) || (m === 11 && day <= 15)) return 'diwali';       /* Diwali: ~15 Oct â€“ 15 Nov */
  return 'wedding';                                                              /* default: wedding season */
}
function festivalTag(slug){
  const cur = currentFestival();
  if (slug === cur) return 'Now live';
  if (slug === 'wedding') return 'Early access';
  return 'Coming';
}
function festivalName(slug){
  const f = FESTIVALS.find(x => x.slug === slug);
  return f ? f.name : 'Festival';
}

/* Which zone a PIN code belongs to (empty/unknown â†’ Tamil Nadu default) */
function deliveryZone(pincode){
  const p = String(pincode || '').replace(/\D/g, '');
  if (!p) return 'tn';                        /* ðŸ”§ unknown PIN â†’ default Tamil Nadu (store home) so cart shows â‚¹30, not â‚¹60 */
  if (/^6[0-4]/.test(p)) return 'tn';        /* 60xâ€“64x = Tamil Nadu */
  if (/^5[0-3]/.test(p)) return 'andra';     /* 50xâ€“53x = Andhra/Telangana */
  if (/^5[6-9]/.test(p)) return 'karnataka'; /* 56xâ€“59x = Karnataka */
  return 'other';
}

/* ============================ 3. CATEGORIES (16) ============================ */
const CATEGORIES = [
  { slug:'kanchipuram', name:'Kanchipuram Sarees', emoji:'ðŸ‘‘', cls:'c-kanchipuram', blurb:'Heritage zari silks' },
  { slug:'soft-silk',   name:'Soft Silk Sarees',   emoji:'âœ¨', cls:'c-soft-silk',   blurb:'Feather-light silk' },
  { slug:'cotton',      name:'Cotton Sarees',      emoji:'ðŸŒ¿', cls:'c-cotton',      blurb:'Handloom & pure cotton' },
  { slug:'silk',        name:'Silk Sarees',        emoji:'ðŸ§µ', cls:'c-silk',        blurb:'Silks & Banarasi' },
  { slug:'wedding',     name:'Wedding Collection', emoji:'ðŸ‘°', cls:'c-wedding',     blurb:'Bridal & occasion' },
  { slug:'party',       name:'Party Wear',         emoji:'ðŸŽ‰', cls:'c-party',       blurb:'Sequins & shimmer' },
  { slug:'georgette',   name:'Georgette Sarees',   emoji:'ðŸŒŠ', cls:'c-georgette',   blurb:'Flowy & elegant' },
  { slug:'designer',    name:'Designer Sarees',    emoji:'ðŸ’Ž', cls:'c-designer',    blurb:'Designer finishes' },
  { slug:'printed',     name:'Printed Sarees',     emoji:'ðŸŒ¸', cls:'c-printed',     blurb:'Florals & prints' },
  { slug:'office',      name:'Office Wear',        emoji:'ðŸ’¼', cls:'c-office',      blurb:'Smart & comfortable' },
  { slug:'daily',       name:'Daily Wear',         emoji:'ðŸŒ¤ï¸', cls:'c-daily',       blurb:'Easy everyday' },
  { slug:'fancy',       name:'Fancy Sarees',       emoji:'ðŸŽ€', cls:'c-fancy',       blurb:'Trendy & stylish' },
  { slug:'half-saree',  name:'Half Sarees',        emoji:'ðŸª­', cls:'c-half-saree',  blurb:'Two-piece sets' },
  { slug:'kids',        name:'Kids Collection',    emoji:'ðŸ§’', cls:'c-kids',        blurb:'For little ones' },
  { slug:'men-dhoti',   name:'Men Dhoti',          emoji:'ðŸ‘”', cls:'c-men-dhoti',   blurb:'Cotton veshtis' },
  { slug:'blouse',      name:'Blouse Material',    emoji:'ðŸ§µ', cls:'c-blouse',      blurb:'Matching pieces' },
  { slug:'accessories', name:'Accessories',        emoji:'ðŸª¡', cls:'c-accessories', blurb:'Borders & more' },
  { slug:'bridal-sarees', name:'Bridal Sarees',    emoji:'ðŸ‘°', cls:'c-wedding',      blurb:'Wedding & bridal silks' },
  { slug:'gayathri-silk', name:'Gayathri Silk',    emoji:'âœ¨', cls:'c-soft-silk',    blurb:'Soft traditional silks' },
  { slug:'samuthrika',    name:'Samuthrika Sarees',emoji:'ðŸŒ¿', cls:'c-silk',         blurb:'Classic drape styles' },
];

/* ============================ 4. PRODUCTS (48) ============================ */
/* product image helper â€” LOCAL-FIRST: the photos ship inside the site folder
   (images/products/), so they show on any hosting and in previews with zero
   setup. Firestore products may still use their own remote URLs; the global
   error-fallback below converts any failed image â†’ local copy â†’ placeholder. */
/* WebP support probe (auto, once) */
let __webpOk = null;
function webpOk(){
  if (__webpOk !== null) return __webpOk;
  try{
    if (typeof window === 'undefined' || !window.Image) return false;
    const im = new Image();
    im.src = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=';
    __webpOk = im.width === 2 || im.height === 2;
    if (!__webpOk){ /* some engines resolve lazily */ setTimeout(()=>{ __webpOk = (im.width === 2 || im.height === 2); }, 300); }
  }catch(e){ __webpOk = false; }
  return __webpOk === true;
}
/* product image URL â€” uses .webp when the browser supports it (faster), else .jpg */
const img = file => {
  const base = 'images/products/';
  const clean = String(file || '').replace(/^.*[\/]/, '');
  if (webpOk()){ const w = base + clean.replace(/\.jpe?g$/i, '.webp'); return w; }
  return base + clean;
};
/* local fallback: try the original extension first, then the other format */
const imgLocal = file => {
  const clean = String(file || '').replace(/^.*[\/]/, '');
  if (/^[^/]*$/.test(clean)) return 'images/products/' + clean;
  return clean;
};
/* Branded placeholder â€” clean SK monogram ONLY (no "coming soon" text).
   Used as the final fallback so a missing photo never shows a broken icon. */
const IMG_PLACEHOLDER = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">' +
  '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8f1d3a"/><stop offset="1" stop-color="#5c0f26"/></linearGradient></defs>' +
  '<rect width="800" height="600" fill="url(#g)"/>' +
  '<rect x="56" y="56" width="688" height="488" rx="18" fill="none" stroke="#e8c66a" stroke-width="5"/>' +
  '<text x="400" y="320" text-anchor="middle" font-family="Georgia, serif" font-size="170" font-weight="bold" fill="#e8c66a">SK</text>' +
  '<text x="400" y="395" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" letter-spacing="8" fill="#fff" opacity="0.95">SAREES &#8226; SALEM</text>' +
  '</svg>');
/* âš¡ safe image fallback (inline onerror). Tries webpâ†’jpg, then the clean SK
   placeholder. Never loops, never throws â€” a missing photo can't break the page. */
function imgSafe(el){
  try{
    if (!el || !el.src) return;
    const cur = String(el.src);
    if (cur === IMG_PLACEHOLDER || cur.indexOf('data:image/svg+xml') === 0) return;
    const n = +(el.dataset.fbk || 0);
    if (n >= 2){ el.src = IMG_PLACEHOLDER; el.onerror = null; return; }
    el.dataset.fbk = String(n + 1);
    if (n === 0 && cur.indexOf('.webp') !== -1){
      const m = cur.match(/\/images\/products\/([^/?#]+)\.webp/);
      if (m){ el.src = 'images/products/' + m[1] + '.jpg'; return; }
    }
    if (n === 0 && cur.indexOf('/images/products/') !== -1){
      const m = cur.match(/\/images\/products\/([^/?#]+)/);
      if (m){ el.src = imgLocal(m[1]); return; }
    }
    el.src = IMG_PLACEHOLDER;
    el.onerror = null;
  }catch(e){ try{ el.onerror = null; }catch(e2){} }
}
/* âš¡ image finished loading â†’ fade it in & remove the progress overlay */
function imgLoaded(el){
  try{ if (el) el.classList.add('img-ok'); }catch(e){}
}
/* Extract a YouTube video ID from a URL (or pass a raw 11-char ID through) */
function ytId(u){
  const s = String(u || '').trim();
  if (!s) return '';
  if (/^[\w-]{11}$/.test(s)) return s;
  const m = s.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : '';
}
/* Clean image value: some sources store markdown [url](url) or arrays */
function cleanImg(u){
  if (!u) return img('printed-cotton.jpg');
  let s = String(u).trim();
  if (Array.isArray(u)) s = String((u[0] || '')).trim();
  const m = s.match(/\(([^)]+)\)\s*$/);
  if (m && s.indexOf('[') === 0) s = m[1];
  return s || img('printed-cotton.jpg');
}
/* Global image fallback (fires on every page, covers index/shop/adminâ€¦):
   any <img> that fails (CDN not uploaded yet / offline preview) first tries the
   local images/products/ copy, then the branded placeholder. No broken icons. */
try{
  document.addEventListener('error', function(e){
    const el = e.target;
    if (!el || el.tagName !== 'IMG' || !el.src) return;
    const cur = String(el.src);
    if (cur === IMG_PLACEHOLDER || cur.indexOf('data:image/svg+xml') === 0) return;
    const n = +(el.dataset.fbk || 0);
    if (n >= 2){ el.src = IMG_PLACEHOLDER; return; }
    el.dataset.fbk = String(n + 1);
    /* .webp failed â†’ try the .jpg twin, then placeholder */
    if (cur.indexOf('.webp') !== -1){
      const m = cur.match(/\/images\/products\/([^/?#]+)\.webp/);
      el.src = m ? 'images/products/' + m[1] + '.jpg' : IMG_PLACEHOLDER;
      return;
    }
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
  { id:'kanchipuram-red', name:'Kanchipuram Pure Silk â€” Red & Gold Zari', cat:'kanchipuram', price:2499, mrp:3999, rating:4.8, reviews:132, badge:'Bestseller', img:IMG.kan, fabric:'Semi silk with gold zari', color:'Red / Maroon / Green', border:'Gold temple border', blouse:'Blouse piece included', length:'6.3 m + blouse', weight:'approx 800 g', wash:'Normal wash', stock:12, colors:['Red','Maroon','Green'], desc:'Semi silk with rich gold zari â€” heavy, glossy, the pride of Tamil Nadu weaving.' },
  { id:'banarasi-purple', name:'Banarasi Silk â€” Royal Purple & Gold', cat:'silk', price:1899, mrp:2999, rating:4.7, reviews:98, badge:'Sale', img:IMG.ban, fabric:'Semi silk, kadhwa weave', color:'Purple / Maroon / Teal', border:'Intricate gold border', blouse:'Blouse piece included', length:'6.3 m + blouse', weight:'approx 800 g', wash:'Normal wash', stock:8, colors:['Purple','Maroon','Teal'], desc:'Classic semi-silk weave with intricate gold paisley motifs â€” rich sheen for grand celebrations.' },
  { id:'soft-silk-rose', name:'Soft Silk â€” Rose Pink Golden Border', cat:'soft-silk', price:1499, mrp:2299, rating:4.6, reviews:64, badge:'New', img:IMG.soft, fabric:'Semi silk (light, skin-friendly)', color:'Rose Pink / Lavender / Sky Blue', border:'Delicate golden border', blouse:'Blouse piece included', length:'6.3 m + blouse', weight:'approx 800 g', wash:'Normal wash', stock:20, colors:['Rose Pink','Lavender','Sky Blue'], desc:'Feather-light soft silk that drapes beautifully â€” comfortable all-day wear.' },
  { id:'cotton-silk-emerald', name:'Cotton Silk â€” Emerald Green Temple', cat:'cotton', price:999, mrp:1599, rating:4.7, reviews:156, badge:'Bestseller', img:IMG.cot, fabric:'Cotton silk blend', color:'Emerald / Maroon / Navy', border:'Temple design border', blouse:'Blouse piece included', length:'6.3 m + blouse', weight:'approx 800 g', wash:'Normal wash', stock:30, colors:['Emerald','Maroon','Navy'], desc:'Perfect mix of cotton comfort and silk sheen with classic temple border.' },
  { id:'handloom-mustard', name:'Handloom Cotton â€” Mustard & Teal', cat:'cotton', price:749, mrp:1199, rating:4.8, reviews:210, badge:'Bestseller', img:IMG.hand, fabric:'100% handloom cotton', color:'Mustard / Teal / Indigo', border:'Traditional checks', blouse:'Blouse piece included', length:'6.3 m + blouse', weight:'approx 800 g', wash:'Normal wash', stock:45, colors:['Mustard','Teal','Indigo'], desc:'Our most-loved handloom weave â€” soft, breathable, gets softer with every wash.' },
  { id:'printed-sky', name:'Printed Cotton â€” Sky Blue Floral', cat:'printed', price:649, mrp:999, rating:4.5, reviews:187, badge:'', img:IMG.prn, fabric:'Pure cotton, printed', color:'Sky Blue / Pink / Mint', border:'Contrast border', blouse:'Blouse piece included', length:'6.3 m + blouse', weight:'approx 800 g', wash:'Machine wash', stock:60, colors:['Sky Blue','Pink','Mint'], desc:'Lightweight daily-wear cotton with a fresh floral print.' },
  { id:'georgette-turquoise', name:'Georgette â€” Turquoise Sequin Border', cat:'georgette', price:899, mrp:1499, rating:4.6, reviews:74, badge:'Sale', img:IMG.geo, fabric:'Georgette with sequin border', color:'Turquoise / Peach / Lavender', border:'Shimmering sequin border', blouse:'Blouse piece included', length:'6.3 m + blouse', weight:'approx 800 g', wash:'Normal wash', stock:18, colors:['Turquoise','Peach','Lavender'], desc:'Flow-y georgette with shimmering sequin border â€” drapes elegantly.' },
  { id:'party-navy', name:'Party Wear â€” Navy Blue Sequins', cat:'party', price:1299, mrp:2199, rating:4.7, reviews:85, badge:'Bestseller', img:IMG.party, fabric:'Georgette, sequin & zari embroidery', color:'Navy / Black / Wine', border:'All-over gold sequins', blouse:'Blouse piece included', length:'6.3 m + blouse', weight:'approx 800 g', wash:'Normal wash', stock:10, colors:['Navy','Black','Wine'], desc:'Designer party wear with all-over gold sequin embroidery.' },
  { id:'organza-lavender', name:'Organza â€” Lavender Pearl Accents', cat:'designer', price:1099, mrp:1799, rating:4.5, reviews:41, badge:'New', img:IMG.org, fabric:'Organza with golden threadwork', color:'Lavender / White / Peach', border:'Pearl & gold accents', blouse:'Blouse piece included', length:'6.3 m + blouse', weight:'approx 800 g', wash:'Normal wash', stock:14, colors:['Lavender','White','Peach'], desc:'Airy organza with delicate golden threadwork and pearl accents.' },
  { id:'linen-beige', name:'Linen â€” Beige Brown Stripe', cat:'office', price:849, mrp:1399, rating:4.6, reviews:58, badge:'', img:IMG.lin, fabric:'Pure linen', color:'Beige / Grey / Sage', border:'Subtle stripe', blouse:'Blouse piece included', length:'6.3 m + blouse', weight:'approx 800 g', wash:'Gentle machine wash', stock:22, colors:['Beige','Grey','Sage'], desc:'Breathable pure linen â€” crisp, minimal and effortlessly elegant.' },
  { id:'kanchipuram-peacock', name:'Kanchipuram Soft Silk â€” Peacock Green', cat:'kanchipuram', price:2199, mrp:3499, rating:4.7, reviews:47, badge:'New', img:IMG.kan, fabric:'Semi silk', color:'Peacock Green / Blue', border:'Gold zari contrast', blouse:'Blouse piece included', length:'6.3 m + blouse', weight:'approx 800 g', wash:'Normal wash', stock:9, colors:['Peacock Green','Blue'], desc:'Lighter Kanchipuram soft silk with striking peacock-green body.' },
  { id:'fancy-net', name:'Fancy Net â€” Champagne Stone Work', cat:'fancy', price:1199, mrp:1999, rating:4.5, reviews:33, badge:'Limited Stock', img:IMG.geo, fabric:'Net with stone & sequin work', color:'Champagne / Rose Gold', border:'Stone embellished', blouse:'Blouse piece included', length:'6.3 m + blouse', weight:'approx 800 g', wash:'Normal wash', stock:4, colors:['Champagne','Rose Gold'], desc:'Trendy net saree with delicate stone work â€” modern glam.' },
  { id:'half-saree-red', name:'Traditional Half Saree Set â€” Red & Gold', cat:'half-saree', price:1799, mrp:2799, rating:4.6, reviews:29, badge:'New', img:IMG.kan, fabric:'Silk blend two-piece', color:'Red / Maroon', border:'Gold zari borders', blouse:'Full set included', length:'2 pc set', weight:'approx 800 g', wash:'Normal wash', stock:7, colors:['Red','Maroon'], desc:'Traditional pavadai-davani style half saree set â€” a cherished Tamil tradition.' },
  { id:'kids-lehenga', name:'Kids Silk Lehenga Set â€” Pink & Gold', cat:'kids', price:1199, mrp:1899, rating:4.8, reviews:52, badge:'Bestseller', img:IMG.soft, fabric:'Soft silk, comfort fit', color:'Pink / Peach', border:'Gold lace', blouse:'Lehenga + blouse set', length:'Kids 4-12', weight:'approx 800 g', wash:'Normal wash', stock:16, colors:['Pink','Peach'], desc:'Adorable silk lehenga sets â€” soft, comfortable and party-ready.' },
  { id:'men-dhoti', name:'Pure Cotton Men Dhoti â€” Gold Border', cat:'men-dhoti', price:499, mrp:799, rating:4.7, reviews:121, badge:'Bestseller', img:IMG.hand, fabric:'100% pure cotton', color:'White / Cream', border:'Gold zari option', blouse:'â€”', length:'4 m', weight:'approx 800 g', wash:'Machine wash', stock:40, colors:['White','Cream'], desc:'Soft pure-cotton dhotis with optional gold zari border.' },
  { id:'blouse-material', name:'Designer Blouse Material â€” Zari Contrast', cat:'blouse', price:599, mrp:999, rating:4.6, reviews:66, badge:'', img:IMG.ban, fabric:'Matching saree fabric', color:'Multiple options', border:'Zari contrast', blouse:'1.5 m blouse piece', length:'1.5 m', weight:'approx 800 g', wash:'As per fabric', stock:50, colors:['Gold','Antique'], desc:'Premium blouse pieces matched to our saree shades.' },
  { id:'zari-border', name:'Gold Zari Border & Accessory Pack', cat:'accessories', price:299, mrp:499, rating:4.5, reviews:84, badge:'Sale', img:IMG.ban, fabric:'Zari border + pins', color:'Gold / Antique', border:'â€”', blouse:'â€”', length:'Pack of 3', weight:'approx 800 g', wash:'Store dry', stock:35, colors:['Gold','Antique'], desc:'Handy gold zari border strips and pins for quick draping.' },
  { id:'daily-printed', name:'Daily Wear Printed Cotton â€” Mint', cat:'daily', price:549, mrp:899, rating:4.5, reviews:143, badge:'', img:IMG.prn, fabric:'Pure cotton, printed', color:'Mint / Yellow / Blue', border:'Simple border', blouse:'Blouse piece included', length:'6.3 m + blouse', weight:'approx 800 g', wash:'Machine wash', stock:55, colors:['Mint','Yellow','Blue'], desc:'Cool and comfy everyday cotton with a cheerful print.' },
];
/* Colour variants â€” multiplies the catalog so infinite scroll feels endless */
const VARIANTS = [
  { color:'Emerald', off:0 }, { color:'Royal Blue', off:5 }, { color:'Wine', off:8 },
  { color:'Peacock', off:4 }, { color:'Champagne', off:10 }, { color:'Sage', off:6 },
];
/* sample/demo product id check (old demo catalog) â€” used to keep caches clean */
function isSampleId(id){
  try{
    if (BASE.some(b => b.id === id)) return true;
    return /-v[123]$/.test(String(id)) && BASE.some(b => id.indexOf(b.id) === 0);
  }catch(e){ return false; }
}
/* ðŸ’° margin earned by a reseller for an order = 5% of the order total */
function resellerMarginFor(order){
  try{ return Math.round(((order && order.totals && order.totals.grand) || 0) * (CONFIG.resellerMarginPct || 5) / 100); }catch(e){ return 0; }
}
/* â­ convert a reseller's pending margin into LOYALTY POINTS (1 â‚¹ = 1 point,
   usable as â‚¹1 off on their own saree orders at checkout) */
function convertMarginToPoints(code){
  try{
    const list = getResellers();
    const r = list.find(x => x.code === code);
    if (!r || !(r.margin > 0)) return false;
    const amt = Math.round(r.margin || 0);
    r.margin = 0;
    r.lastConvert = new Date().toISOString();
    r.pointsConverted = (r.pointsConverted || 0) + amt;
    saveResellers(list);
    /* add to this device's loyalty points (redeemable â‚¹1/point at checkout) */
    try{
      const cur = +localStorage.getItem('sk_points') || 0;
      localStorage.setItem('sk_points', String(cur + amt));
      const earned = +localStorage.getItem('sk_points_earned') || 0;
      localStorage.setItem('sk_points_earned', String(earned + amt));
    }catch(e){}
    /* conversion log (reseller can see it) */
    try{
      const log = JSON.parse(localStorage.getItem('sk_reseller_convert') || '[]');
      log.push({ code, amount: amt, date: r.lastConvert });
      localStorage.setItem('sk_reseller_convert', JSON.stringify(log.slice(-100)));
    }catch(e){}
    if (FS.enabled()){
      FS._getDb().then(db => { if (db) db.collection('resellers').doc(code).set({ margin: 0, pointsConverted: r.pointsConverted, lastConvert: r.lastConvert }, { merge: true }).catch(()=>{}); }).catch(()=>{});
    }
    return true;
  }catch(e){ return false; }
}
/* ðŸ” this device is the admin (logged in) â†’ sees hidden products in Admin only */
function isAdminDevice(){
  try{ return String(LS.get('sk_admin', '0')) === '1'; }catch(e){ return false; }
}
/* customer-visible products (hidden ones stay in Admin but never on the store) */
function visibleProducts(){
  try{ return PRODUCTS.filter(p => !p.hidden); }catch(e){ return PRODUCTS || []; }
}
let PRODUCTS = (() => {
  /* ðŸ“¦ CATALOG SOURCE: real products come from the ADMIN (sk_products) and
     FIRESTORE (sk_products_cloud cache). The demo BASE catalog in data.js is
     REMOVED â€” enable it only for tests with window.__KEEP_BASE = true. */
  /* SAMPLE/DEMO product ids (from the old demo catalog) are always filtered
     out of local caches so ONLY real Firestore products ever show. */
  const SAMPLE_IDS = (function(){
    const set = {};
    try{
      BASE.forEach(b => { set[b.id] = 1; });
      BASE.forEach(b => { for (let i = 1; i <= 3; i++) set[b.id + '-v' + i] = 1; });
    }catch(e){}
    return set;
  })();
  const notSample = p => p && p.id && !SAMPLE_IDS[p.id];
  const notHidden = p => isAdminDevice() || !(p && p.hidden);   /* customers never see hidden products */
  let built = [];
  if (window.__KEEP_BASE){
    built = BASE.map(b => Object.assign({}, b));
    BASE.forEach(b => {
      VARIANTS.slice(0, 3).forEach((v, i) => {
        built.push(Object.assign({}, b, {
          id: b.id + '-v' + (i + 1),
          name: b.name.replace(/â€”[^-]*$/, 'â€” ' + v.color),
          color: v.color + ' variant',
          price: Math.round(b.price * (1 - v.off / 100)),
          mrp: b.mrp,
          rating: b.rating,                 /* original rating â€” same saree, different colour */
          reviews: b.reviews,                /* original review count */
          stock: Math.max(2, b.stock - i * 4),
          badge: b.badge === 'Bestseller' ? '' : b.badge,
        }));
      });
    });
    /* auto-SKU for every catalog product: SK + 5 digits, sequential (SK10001â€¦) */
    built = built.map((p, i) => Object.assign({}, p, { sku: p.sku || ('SK' + String(10000 + i + 1)) }));
  }
  /* 1. Admin edits (sk_products) override everything â€” sample ids removed */
  try{
    const custom = JSON.parse(localStorage.getItem('sk_products'));
    if (Array.isArray(custom) && custom.length){
      /* merge cached Firestore products into it too (silent local restore) */
      try{
        const cached = JSON.parse(localStorage.getItem('sk_products_cloud'));
        if (Array.isArray(cached) && cached.length){
          cached.filter(notSample).filter(notHidden).forEach(cp => { const np = normalizeProduct(cp); if (!custom.some(x => x.id === np.id)) custom.unshift(np); });
        }
      }catch(e){}
      return custom.filter(notSample);
    }
  }catch(e){}
  /* 2. Cached Firestore products merge silently â€” so cloud-only products
     appear instantly on every visit, no network needed (samples filtered) */
  try{
    const cached = JSON.parse(localStorage.getItem('sk_products_cloud'));
    if (Array.isArray(cached) && cached.length){
      cached.filter(notSample).filter(notHidden).forEach(cp => {
        const np = normalizeProduct(cp);
        const i = built.findIndex(x => x.id === np.id);
        if (i >= 0) built[i] = np; else built.unshift(np);
      });
    }
  }catch(e){}
  /* âš¡ INSTANT product pages: product/<id>.html embeds its own product data
     (window.__PRODUCT_DATA) so the page renders with ZERO fetching â€” no
     "Loading productâ€¦" ever, even on a fresh browser. */
  try{
    if (window.__PRODUCT_DATA && window.__PRODUCT_DATA.id){
      const np = normalizeProduct(window.__PRODUCT_DATA);
      const i = built.findIndex(x => x.id === np.id);
      if (i >= 0) built[i] = np; else built.unshift(np);
    }
  }catch(e){}
  /* when tests enable __KEEP_BASE, keep the demo catalog as-is; in production
     only real (non-sample) products from admin/Firestore caches are shown */
  return window.__KEEP_BASE ? built : built.filter(notSample);
})();
function saveProducts(list){
  PRODUCTS = list;
  LS.set('sk_products', list);
  try{ if (window.REC) REC.invalidate(); }catch(e){}   /* recompute similarity on change */
  if (FS.enabled()){ try{ Sync.pushProducts(); }catch(e){} }  /* admin edits only */
}
function resetProducts(){ PRODUCTS = (() => { let built = BASE.map(b => Object.assign({}, b)); BASE.forEach(b => { VARIANTS.slice(0,3).forEach((v,i)=>{ built.push(Object.assign({}, b, { id: b.id + '-v' + (i+1), name: b.name.replace(/â€”[^-]*$/, 'â€” ' + v.color), color: v.color + ' variant', price: Math.round(b.price * (1 - v.off/100)), mrp: b.mrp, rating: b.rating, reviews: b.reviews, stock: Math.max(2, b.stock - i*4), badge: b.badge === 'Bestseller' ? '' : b.badge })); }); }); return built; })(); try{ localStorage.removeItem('sk_products'); }catch(e){} }
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
  /* admin extra images (img2, img3) + any raw arrays â†’ product gallery */
  let extraImgs = [];
  try{
    const arr = Array.isArray(raw.images) ? raw.images : Array.isArray(raw.imgs) ? raw.imgs : [];
    arr.forEach(u => { if (!u) return; const c = cleanImg(u); if (c && c !== imgUrl && extraImgs.indexOf(c) === -1) extraImgs.push(c); });
    [raw.img2, raw.img3, raw.img4].forEach(u => { if (!u) return; const c = cleanImg(u); if (c && c !== imgUrl && extraImgs.indexOf(c) === -1) extraImgs.push(c); });
  }catch(e){}
  /* badge: explicit, else from featured/discount */
  let badge = ['Bestseller','New','Sale','Limited Stock'].includes(raw.badge) ? raw.badge : '';
  if (!badge){ if (raw.featured || raw.ft) badge = 'Bestseller'; else if ((+raw.disc || 0) >= 40) badge = 'Sale'; }
  const colors = Array.isArray(raw.colors) && raw.colors.length
    ? raw.colors.map(c => String(c).trim()).filter(Boolean)
    : String(raw.col || raw.color || 'Multi').split('/').map(x => x.trim()).filter(Boolean);
  /* ðŸŽ¨ colour-wise stock â€” e.g. {Red:3, Blue:2} (object) or "Red:3, Blue:2" (string).
     When present, each colour is sold & deducted separately (auto colour deduct). */
  let colourStock = null;
  try{
    const cs = raw.colourStock || raw.colorStock || raw.colStock;
    if (cs && typeof cs === 'object' && !Array.isArray(cs)){
      const m = {};
      Object.keys(cs).forEach(k => { const v = Math.round(+cs[k]); if (k.trim() && Number.isFinite(v)) m[String(k).trim()] = Math.max(0, v); });
      if (Object.keys(m).length) colourStock = m;
    } else if (cs && typeof cs === 'string'){
      const m = {};
      cs.split(',').forEach(part => {
        const kv = String(part).split(':');
        if (kv.length === 2){
          const k = kv[0].trim(), v = Math.round(+kv[1]);
          if (k && Number.isFinite(v)) m[k] = Math.max(0, v);
        }
      });
      if (Object.keys(m).length) colourStock = m;
    }
  }catch(e){ colourStock = null; }
  /* PRODUCT ID == SKU (same value). If only one is given, the other copies it;
     if neither, a fresh auto-increment SK+5 number is used for BOTH. */
  const pid = String(raw.id || raw.sku || genProductId(raw.name || '')).trim();
  return {
    id: pid,
    sku: String(raw.sku || pid).trim(),
    name: String(raw.name || 'Untitled Saree').trim(),
    price, mrp, cat,
    hidden: !!(raw.hidden === true || raw.hidden === 1 || raw.hidden === 'true' || raw.hidden === '1'),
    rating: Math.min(5, Math.max(1, +raw.rating || +raw.rat || 4.5)),
    reviews: Math.max(0, +raw.reviews || +raw.rev || 0),
    badge,
    img: imgUrl,
    images: extraImgs.length ? [imgUrl].concat(extraImgs) : (imgUrl ? [imgUrl] : []),
    fabric: String(raw.fabric || raw.fab || 'Premium fabric').trim(),
    color: colors.join(' / ') || 'Multi',
    border: String(raw.border || 'â€”').trim(),
    blouse: String(raw.blouse || 'Blouse piece included').trim(),
    length: String(raw.length || raw.len || '6.3 m + blouse').trim(),
    weight: String(raw.weight || 'approx 800 g').trim(),
    wash: String(raw.wash || raw.care || 'Normal wash').trim(),
    stock: (function(){ const s = +raw.stock; return Number.isFinite(s) ? Math.max(0, Math.round(s)) : 10; })(),
    colors: colors.length ? colors : ['Multi'],
    colourStock,
    desc: String(raw.desc || 'Beautiful handpicked saree from our collection.').trim(),
    video: ytId(raw.video || raw.videoUrl || ''),
  };
}

/* ============================ 4b. INSTANT CATALOG LOAD ============================
   Static catalog.json ships with the site (regenerate from Admin â†’ Catalog Feed).
   catalog.json is merged into PRODUCTS on EVERY visit (before first render) so
   Firestore product pages render immediately â€” no "Loading productâ€¦". Firestore
   pull still refreshes the cache in the background for freshness.
   wantId (optional): when given, returns true only once that product is found,
   so the product page can render instantly from the static catalog. */
async function preloadCatalog(wantId){
  const have = id => { try{ return !id || PRODUCTS.some(p => String(p.id) === String(id)); }catch(e){ return false; } };
  try{ if (have(wantId)) return true; }catch(e){}
  /* 1) raw cloud cache (device copy of Firestore products) â€” silent merge */
  try{
    const raw = JSON.parse(localStorage.getItem('sk_products_cloud') || '[]');
    if (Array.isArray(raw) && raw.length){
      raw.filter(p => p && p.id && !isSampleId(p.id) && (isAdminDevice() || !p.hidden)).forEach(cp => {
        try{
          const np = normalizeProduct(cp);
          if (!PRODUCTS.some(x => x.id === np.id)) PRODUCTS.push(np);
        }catch(e){}
      });
    }
  }catch(e){}
  try{ if (have(wantId)) return true; }catch(e){}
  /* 2) static catalog.json â€” merged ALWAYS (not only when PRODUCTS is empty),
     so an uploaded catalog fixes missing products even if other caches exist.
     Accepts both a bare array and { products: [...] }. */
  if (!window.__catalogLoaded){
    const tryLoad = async url => {
      try{
        const r = await fetch(url, { cache: 'no-cache' });
        if (!r.ok) return false;
        const data = await r.json();
        const list = Array.isArray(data) ? data : (data && Array.isArray(data.products) ? data.products : []);
        if (Array.isArray(list) && list.length){
          list.filter(p => p && p.id && !isSampleId(p.id) && (isAdminDevice() || !p.hidden)).forEach(cp => {
            try{
              const np = normalizeProduct(cp);
              if (!PRODUCTS.some(x => x.id === np.id)) PRODUCTS.push(np);
            }catch(e){}
          });
          return true;
        }
      }catch(e){}
      return false;
    };
    try{ await tryLoad('catalog.json'); }catch(e){}
    window.__catalogLoaded = true;
    if (PRODUCTS.length){ try{ LS.set('sk_products_cloud', PRODUCTS); }catch(e){} }
  }
  try{ return have(wantId); }catch(e){ return false; }
}

/* ============================ 5. UTILITIES ============================ */
const money = n => 'â‚¹' + Number(n).toLocaleString('en-IN');
/* ðŸŽ¨ colour name â†’ real hex swatch (same palette the admin auto-detector uses,
   so customers see the ACTUAL colour of the saree â€” Google-photos style) */
const COLOUR_SWATCHES = {
  Red:'#c62828', Maroon:'#800020', Wine:'#722f37', 'Rose Pink':'#e91e63', Pink:'#f48fb1', Magenta:'#c2185b',
  Purple:'#7b1fa2', Lavender:'#9c7ac8', 'Royal Blue':'#193a94', Blue:'#1976d2', 'Sky Blue':'#4fc3f7', Navy:'#1a237e',
  Teal:'#00897b', Peacock:'#00695c', Emerald:'#046307', Green:'#2e7d32', Sage:'#8c9678',
  Gold:'#d4af37', Mustard:'#c9a227', Yellow:'#f9a825', Orange:'#ef6c00', Saffron:'#f57c00', Rust:'#b7410e', Coral:'#ff7043',
  Peach:'#ffccbc', Brown:'#6d4c41', Beige:'#c9b79c', Cream:'#f5ebdc', Champagne:'#f7e7ce', Grey:'#757575',
  Silver:'#b0bec5', Black:'#212121', White:'#f5f5f5', Multi:'#b58b5a',
};
function swatchHex(name){
  try{ return COLOUR_SWATCHES[String(name||'').trim()] || '#b58b5a'; }catch(e){ return '#b58b5a'; }
}
/* ðŸ‘€ recently viewed + â¤ï¸ wishlist product ids (newest first, de-duped) â€” powers
   the "ðŸ¤– Recommended for You" strip and smarter suggestions */
function viewedOrWishedProductIds(){
  const ids = [];
  try{ const rv = JSON.parse(localStorage.getItem('sk_recent') || '[]'); (Array.isArray(rv) ? rv : []).forEach(id => { if (ids.indexOf(id) === -1) ids.push(id); }); }catch(e){}
  try{ (Store.wish || []).forEach(id => { if (ids.indexOf(id) === -1) ids.push(id); }); }catch(e){}
  return ids;
}
/* ðŸ’³ online-only price: 1% off for UPI payments (COD = full price) */
const onlinePrice = p => Math.round((p.price || 0) * (100 - (CONFIG.onlineDiscount || 1)) / 100);
const onlineOffLabel = () => '1% off on online payment';
/* ðŸ‘€ "X people viewing now" â€” deterministic from id so it's stable per product */
function viewingNow(p){
  try{
    let n = 3 + ((p.id || '').length % 6) + ((p.reviews || 0) % 4);
    if (p.badge === 'Bestseller') n += 3;
    return Math.min(14, n);
  }catch(e){ return 4; }
}
/* ðŸ¤ Referral: my code â†’ friend gets â‚¹50 off, I get â‚¹50 points */
function myReferralCode(){
  try{ return localStorage.getItem('sk_ref_code') || ''; }catch(e){ return ''; }
}
function setReferralCode(code){
  try{ localStorage.setItem('sk_ref_code', String(code).trim().toUpperCase()); }catch(e){}
}
function genReferralCode(){
  try{
    const ph = ((Store.profile || {}).phone || '').replace(/\D/g, '').slice(-4);
    return 'SK' + ph + Math.floor(10 + Math.random() * 89);
  }catch(e){ return 'SK' + Math.floor(100 + Math.random() * 900); }
}
function referralLink(){
  try{ return location.origin + '/shop.html?ref=' + encodeURIComponent(myReferralCode()); }catch(e){ return ''; }
}
/* when a friend buys with my referral â†’ I earn 50 points */
function creditReferral(order){
  try{
    if (!order || !order.referral) return;
    const cur = +localStorage.getItem('sk_points') || 0;
    localStorage.setItem('sk_points', String(cur + 50));
  }catch(e){}
}
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtDate = iso => new Date(iso).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
/* age of an order in days (0 if unknown) */
function orderAgeDays(o){
  try{
    const d = new Date(o && (o.date || o.createdAt || 0));
    if (isNaN(d.getTime())) return 0;
    return Math.max(0, Math.floor((Date.now() - d.getTime()) / 864e5));
  }catch(e){ return 0; }
}
/* Auto-delete old orders: ADMIN keeps 30 days, USER keeps 90 days.
   Cleans sk_orders so the store never accumulates stale orders. */
function purgeOldOrders(days){
  try{
    const before = Store.orders.length;
    Store.orders = Store.orders.filter(o => orderAgeDays(o) <= days);
    if (Store.orders.length !== before) Store.saveOrders();
  }catch(e){}
}
/* Date + time with AM/PM, e.g. "6 Aug 2026, 3:05 PM" */
const fmtDT = iso => {
  const d = new Date(iso); if (isNaN(d.getTime())) return '';
  const date = d.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
  let h = d.getHours(), m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12;
  return date + ', ' + h + ':' + String(m).padStart(2, '0') + ' ' + ampm;
};
const validPhone = p => /^[6-9]\d{9}$/.test(String(p).trim());
/* Order ID = ORD-<MMDD>-<HHMMSS>-<3 random digits>  e.g. ORD-0805-104537-372
   (seconds + random + duplicate check â†’ guaranteed unique) */
function genOrderId(){
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  for (let i = 0; i < 10; i++){
    const rnd = String(Math.floor(100 + Math.random() * 900));
    const id = 'ORD-' + mm + dd + '-' + hh + mi + ss + '-' + rnd;
    try{
      const exists = typeof Store !== 'undefined' && Store.orders && Store.orders.some(o => o && o.id === id);
      if (!exists) return id;
    }catch(e){ return id; }
  }
  return 'ORD-' + mm + dd + '-' + hh + mi + ss + '-' + String(Date.now()).slice(-3);
}
/* Used SKU history (this browser) so random SKUs NEVER repeat, even across
   page reloads. Also checks the live catalog + Firestore cache. */
let __skuUsed = (() => {
  try{ const u = JSON.parse(localStorage.getItem('sk_sku_used') || '[]'); return Array.isArray(u) ? u : []; }catch(e){ return []; }
})();
function __saveSkuUsed(){
  try{ localStorage.setItem('sk_sku_used', JSON.stringify(__skuUsed.slice(-300))); }catch(e){}
}
function nextSku(){
  /* ðŸ”¢ SKU = SK + 4 random digits, e.g. SK7257 â€” never repeats.
     Checks live catalog, Firestore cache, and this browser's used-SKU history. */
  const exists = id => {
    try{
      if (__skuUsed.indexOf(id) !== -1) return true;
      if (PRODUCTS.find(p => String(p.id || p.sku) === String(id))) return true;
      const raw = JSON.parse(localStorage.getItem('sk_products_cloud') || '[]');
      if (raw.some(p => String(p.id || p.sku) === String(id))) return true;
    }catch(e){}
    return false;
  };
  for (let i = 0; i < 20; i++){
    const id = 'SK' + String(Math.floor(1000 + Math.random() * 9000));   /* SK + 4 random digits */
    if (!exists(id)){
      __skuUsed.push(id); __saveSkuUsed();
      try{ localStorage.setItem('sk_sku_seq', id); }catch(e){}
      return id;
    }
  }
  const id = 'SK' + String(Math.floor(1000 + Math.random() * 9000));
  __skuUsed.push(id); __saveSkuUsed();
  return id;
}
/* Product ID for new/admin-added products = auto-increment SK number */
function genProductId(name){ return nextSku(); }
/* Stable fallback SKU (Firestore products without sku) â€” SK + 5 digits from id hash */
function skuGen(id){
  let h = 0; const s = String(id || 'p');
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return 'SK' + String(10000 + (h % 90000));
}
/* Each device gets a unique ID â€” orders are stamped with it so the user's
   "My Orders" page can always show ONLY this device's orders. */
function deviceId(){
  try{
    let id = localStorage.getItem('sk_device_id');
    if (!id){ id = 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); localStorage.setItem('sk_device_id', id); }
    return id;
  }catch(e){ return 'd' + Math.random().toString(36).slice(2, 8); }
}
/* Orders that belong to THIS device: stamped with my device id, or legacy
   orders placed before stamping (no device field, but only ever local). */
function myOrders(){
  const my = deviceId();
  return Store.orders.filter(o => !o.device || o.device === my);
}
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
/* Shipping = zone fee Ã— number of sarees (1 saree TN â‚¹30, 2 sarees â‚¹60, â€¦).
   Free above â‚¹999. Falls back to 1 unit when no count given. */
const cartCount = () => Store.cart.reduce((s, i) => s + (i.qty || 1), 0);
const shippingFor = (total, pincode, qty) => {
  if (total >= CONFIG.shipFreeAbove) return 0;
  const fee = (ZONES[deliveryZone(pincode)] || ZONES.tn).ship;
  return fee * Math.max(1, +qty || cartCount() || 1);
};

/* Delivery estimate â€” zone + payment aware.
   Dispatch: 12â€“24h (COD: 24â€“48h).
   Days: TN 2â€“3 Â· Andhra/Karnataka 3â€“4 Â· others 5â€“7 Â· COD (any zone) 5â€“7. */
function deliveryEstimate(pincode, payment){
  const now = new Date();
  const add = d => { const x = new Date(now); x.setDate(x.getDate() + d); return x; };
  const zone = ZONES[deliveryZone(pincode)] || ZONES.tn;
  const cod = payment === 'cod';
  const days = cod ? ZONES.other.days : zone.days;         /* COD â†’ 5â€“7 everywhere */
  const dispatch = cod ? '24â€“48 hrs' : '12â€“24 hrs';
  const a = days[0], b = days[1];
  return {
    zone: zone.name,
    from: add(1 + a), to: add(1 + b),
    text: 'Dispatch in ' + dispatch + ' â€¢ Delivery ' + add(1 + a).toLocaleDateString('en-IN',{day:'numeric',month:'short'}) + ' â€“ ' + add(1 + b).toLocaleDateString('en-IN',{day:'numeric',month:'short'}) +
      (zone.name !== 'Tamil Nadu' || cod ? ' (' + (cod ? 'COD' : zone.name) + ')' : ''),
  };
}

/* Storage with fallbacks â€” works even where localStorage is blocked */
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
  { name:'Lakshmi S.', place:'Salem', avatar:'#8f1d3a', rating:5, text:'Ordered the Kanchipuram silk for my daughterâ€™s wedding â€” pure quality, just like the photos. Delivery was fast and the WhatsApp confirmation made it so easy!' },
  { name:'Priya R.', place:'Chennai', avatar:'#2f7d5b', rating:5, text:'The cotton sarees are so soft and comfortable. Loved the COD option. Will definitely order again this Aadi season!' },
  { name:'Meenakshi K.', place:'Coimbatore', avatar:'#5a3d8f', rating:5, text:'Best place to buy sarees online. Paid through UPI â€” instant and safe. The owner personally confirmed my order on WhatsApp.' },
  { name:'Kavitha M.', place:'Erode', avatar:'#b57f1f', rating:4, text:'Beautiful handloom saree, exact colours as shown. Fits the budget too. Thank you SK Sarees!' },
  { name:'Divya B.', place:'Bangalore', avatar:'#0e8f8f', rating:5, text:'Ordered on WhatsApp at 10pm, confirmed by 10:30pm. Such personal service. The georgette saree is gorgeous!' },
  { name:'Anitha V.', place:'Salem', avatar:'#7a4fb0', rating:5, text:'Local pickup saved me delivery time. The owner patiently showed options on a video call. Highly recommended!' },
];
const FAQ = [
  { q:'How do I pay? Is UPI safe?', a:'Pay online via UPI (GPay / PhonePe / Paytm) by scanning the QR or tapping Pay Now, or choose Cash on Delivery (+â‚¹70). UPI is 100% secure â€” we never see your card details.' },
  { q:'How long does delivery take?', a:'We dispatch within 12â€“24 hours (COD orders: 24â€“48 hours). Delivery: 2â€“3 days Tamil Nadu, 3â€“4 days Andhra & Karnataka, 5â€“7 days other states. Free shipping above â‚¹999 (else â‚¹30 / â‚¹40 / â‚¹60 by state).' },
  { q:'What if my order is late?', a:'We promise on-time delivery. If your saree arrives after the promised date, message us with your Order ID and get â‚¹50 off your next order (code LATE50).' },
  { q:'Can I exchange or return?', a:'Yes â€” 7-day easy replacement for damaged or wrong items. Message us on WhatsApp with your order ID and a photo.' },
  { q:'Will the colour match the photo?', a:'We photograph in natural light. Colours may vary slightly with screen settings â€” ask us on WhatsApp for real photos before dispatch.' },
  { q:'I live near Salem â€” can I pick up?', a:'Yes! Local customers can collect from our store at 2/130, Thoothanoor, Edanganasalai, Salem 637502.' },
];
const PROCESS = [
  { emoji:'ðŸ§µ', title:'Selecting Yarn', text:'Premium silk & cotton from trusted weavers.' },
  { emoji:'ðŸª¡', title:'Weaving', text:'Handloom weaving by Tamil Nadu artisans.' },
  { emoji:'ðŸŽ¨', title:'Dyeing & Zari', text:'Colour-fast dyes and traditional gold zari.' },
  { emoji:'âœ…', title:'Quality Check', text:'Every saree inspected stitch-by-stitch.' },
  { emoji:'ðŸ“¦', title:'Packaging', text:'Neat packing with invoice & care card.' },
  { emoji:'ðŸšš', title:'Delivery', text:'Doorstep delivery with WhatsApp updates.' },
];

/* ============================ 7. CART ============================ */
const Store = {
  cart  : LS.get('sk_cart', []),
  orders: LS.get('sk_orders', []),
  wish  : LS.get('sk_wish', []),
  profile: LS.get('sk_profile', { name:'', phone:'', address:'', pincode:'' }),
  saveCart(){
    LS.set('sk_cart', this.cart);
    try{ if (this.cart.length) localStorage.setItem('sk_cart_time', String(Date.now())); else localStorage.removeItem('sk_cart_time'); }catch(e){}
    renderCartBadge(); renderCartBar(); if (FS.enabled()) Sync.pushCloud();
  },
  saveOrders(){ LS.set('sk_orders', this.orders); }, /* no pushCloud here (avoids FS listener loop) */
  saveWish(){ LS.set('sk_wish', this.wish); },
  saveProfile(){ LS.set('sk_profile', this.profile); },
};
function cartTotal(){ return Store.cart.reduce((s,i) => { const p = byId(i.id); return s + (p ? p.price * i.qty : 0); }, 0); }
/* ---- STOCK (1 psc model) ----
   Products have limited stock (often 1 psc). Stock is consumed when an order is
   placed; cart reservations (this device + other devices via Firestore) reduce
   what other customers see â€” one customer takes it â†’ next sees Out of Stock. */
let _remoteReserve = null;
function remoteReservedSync(id){ try{ return _remoteReserve ? (_remoteReserve[id] || 0) : 0; }catch(e){ return 0; } }
function myCartQty(id){ const it = Store.cart.find(i => i.id === id); return it ? (it.qty || 1) : 0; }
/* fetch reservations from Firestore (once), excluding this device */
async function loadRemoteReservations(){
  try{
    if (!FS.enabled()) return;
    const db = await FS._getDb();
    if (!db) return;
    const snap = await db.collection('cart').get();
    const my = deviceId();
    const map = {};
    snap.forEach(doc => {
      if (doc.id === my) return;
      const data = doc.data() || {};
      (data.items || []).forEach(it => { if (it && it.id) map[it.id] = (map[it.id] || 0) + (+it.qty || 1); });
    });
    _remoteReserve = map;
  }catch(e){}
}
function syncCartReservation(){
  try{
    if (!FS.enabled()) return;
    FS._getDb().then(db => {
      if (!db) return;
      if (Store.cart.length) db.collection('cart').doc(deviceId()).set({ items: Store.cart, updatedAt: Date.now() }, { merge: true }).catch(() => {});
      else db.collection('cart').doc(deviceId()).delete().catch(() => {});
    }).catch(() => {});
  }catch(e){}
}
/* stock still available to THIS customer right now (optionally per colour) */
function colourStockOf(p, colour){
  if (!p) return 0;
  if (p.colourStock && colour && p.colourStock[colour] != null) return Math.max(0, +p.colourStock[colour] || 0);
  return Math.max(0, +p.stock || 0);
}
/* how many of THIS colour the visitor already holds in their cart (legacy items
   without a colour are counted under the product's default colour) */
function myColourQty(id, colour){
  const p = byId(id);
  const defCol = p && p.colors && p.colors[0] ? p.colors[0] : '';
  let n = 0;
  try{
    Store.cart.forEach(i => {
      if (i.id !== id) return;
      if ((i.colour || defCol) === colour) n += (i.qty || 1);
    });
  }catch(e){}
  return n;
}
function liveStock(p, colour){
  if (!p) return 0;
  const base = colour ? colourStockOf(p, colour) : Math.max(0, +p.stock || 0);
  const mine = colour ? myColourQty(p.id, colour) : myCartQty(p.id);
  return Math.max(0, base - remoteReservedSync(p.id) - mine);
}
/* permanently consume stock after an order (1 psc model) â€” also deducts the
   exact colour bought (auto colour deduct) and removes sold-out colours */
function consumeStock(items){
  (items || []).forEach(i => {
    const p = byId(i.id);
    if (!p) return;
    p.stock = Math.max(0, (+p.stock || 0) - (i.qty || 1));
    if (p.colourStock && i.colour && p.colourStock[i.colour] != null){
      p.colourStock[i.colour] = Math.max(0, (+p.colourStock[i.colour] || 0) - (i.qty || 1));
      if (p.colourStock[i.colour] <= 0){
        delete p.colourStock[i.colour];
        p.colors = (p.colors || []).filter(c => c !== i.colour);
      }
      if (p.colourStock && !Object.keys(p.colourStock).length) p.colourStock = null;
    }
  });
  try{ LS.set('sk_products', PRODUCTS); }catch(e){}
  try{ if (window.REC) REC.invalidate(); }catch(e){}
  if (FS.enabled()){ try{ Sync.pushProducts(); }catch(e){} }
}
function addToCart(id, qty = 1, colour){
  const p = byId(id); if (!p) return;
  if (p.stock != null && p.stock <= 0){ toast('ðŸ˜ž Out of stock â€” ask us on WhatsApp'); return; }
  /* colour separation only when colour-wise stock is set (else single-line cart) */
  const useColours = !!(p.colourStock && Object.keys(p.colourStock).length);
  const defCol = (p.colors && p.colors[0]) || '';
  const c = useColours ? (colour || defCol) : '';
  const ex = useColours ? Store.cart.find(i => i.id === id && (i.colour || defCol) === c) : Store.cart.find(i => i.id === id);
  const have = ex ? (ex.qty || 1) : 0;
  const avail = liveStock(p, c);                        /* stock âˆ’ remote âˆ’ my cart */
  if (avail <= 0){ toast('ðŸ˜ž Out of stock â€” ask us on WhatsApp'); return; }
  if (qty > avail) qty = avail;                         /* can't take more than available */
  const cap = Math.max(1, useColours ? (colourStockOf(p, c) || 1) : (+p.stock || 1));
  if (ex){
    ex.qty = Math.min(have + qty, cap);
    if (!useColours && ex.colour) ex.colour = '';
  } else {
    Store.cart.push({ id, qty: Math.min(qty, cap), colour: useColours ? c : '' });
  }
  Store.saveCart();
  syncCartReservation();
  toast('âœ… Added to cart' + (useColours && c ? ' â€” ' + c : ''));
  fbqSafe('AddToCart', Object.assign(fbqId(id), { value: p.price * qty, currency: 'INR', quantity: qty }));
}
/* â¤ï¸ Like / wishlist toggle â€” works on product page & shop cards */
function toggleWish(id){
  const p = byId(id); if (!p) return;
  const i = Store.wish.indexOf(id);
  if (i >= 0){ Store.wish.splice(i, 1); toast('ðŸ’” Removed from wishlist'); }
  else { Store.wish.push(id); toast('â¤ï¸ Added to wishlist'); }
  Store.saveWish();
  /* update every heart button for this product without a full re-render */
  try{
    document.querySelectorAll('[data-wish="' + id + '"]').forEach(b => {
      b.textContent = Store.wish.includes(id) ? 'â¤ï¸' : 'ðŸ¤';
      b.classList.toggle('on', Store.wish.includes(id));
    });
  }catch(e){}
}
function setCartQty(id, qty, colour){
  const p = byId(id); if (!p) return;
  const useColours = !!(p.colourStock && Object.keys(p.colourStock).length);
  const defCol = (p.colors && p.colors[0]) || '';
  const c = useColours ? (colour || defCol) : '';
  const it = useColours
    ? (Store.cart.find(i => i.id === id && (i.colour || defCol) === c) || Store.cart.find(i => i.id === id))
    : Store.cart.find(i => i.id === id);
  if (!it) return;
  it.qty = Math.max(1, Math.min(qty, Math.max(1, useColours ? (colourStockOf(p, it.colour || c) || 1) : (+p.stock || 1))));
  Store.saveCart(); syncCartReservation();
}
function removeFromCart(id, colour){
  const p = byId(id); if (!p){ Store.cart = Store.cart.filter(i => i.id !== id); Store.saveCart(); syncCartReservation(); toast('ðŸ—‘ï¸ Removed'); return; }
  const useColours = !!(p.colourStock && Object.keys(p.colourStock).length);
  const defCol = (p.colors && p.colors[0]) || '';
  const c = useColours ? (colour || defCol) : '';
  Store.cart = useColours
    ? Store.cart.filter(i => !(i.id === id && (i.colour || defCol) === c))
    : Store.cart.filter(i => i.id !== id);
  Store.saveCart(); syncCartReservation(); toast('ðŸ—‘ï¸ Removed');
}
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
    el.innerHTML = `<div class="scb-info"><b>${money(t + sh)}</b><small>${n} item${n>1?'s':''} â€¢ ${sh ? 'Ship +' + money(sh) : 'FREE ship'}</small></div>
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
/* absolute product page URL â€” classic format: product.html?id=SK75279 */
function repoBase(){
  try{ return location.pathname.replace(/[^/]*$/, ''); }catch(e){ return '/'; }
}
function productUrl(p){
  try{ return location.origin + repoBase() + 'product.html?id=' + encodeURIComponent(p.id); }catch(e){ return 'product.html?id=' + encodeURIComponent(p.id); }
}
/* the product id for the CURRENT page â€” ?id= param (safeParams fixes broken
   links like ?id=SK75250?ref=SHA9088) */
function currentProductId(){
  try{
    if (window.__PRODUCT_ID) return String(window.__PRODUCT_ID).trim();   /* leftover safety */
    const m = location.pathname.match(/\/([^/]+)\.html$/);
    if (m && /^SK\d+$/i.test(m[1])) return m[1];                          /* leftover safety */
  }catch(e){}
  return String(safeParams().get('id') || '').split('?')[0].trim();
}
function waProductMsg(p){
  /* absolute product URL so the customer can tap & see the saree;
     if the sharer is a reseller the link carries ?ref=CODE (any page) */
  const url = shareUrl(p);
  const off = offPct(p);
  return `ðŸª¡ Hi! I found this beautiful saree on SK Sarees ðŸ›ï¸\n\nâœ¨ ${p.name}\nðŸ’° Price: ${money(p.price)}${off ? ' (' + off + '% OFF)' : ''}\n\nðŸ“± Order in 2 minutes â€” COD & UPI available, fast delivery!\nðŸ‘‰ ${url}\n\nIs it available? Please confirm ðŸ˜Š`;
}
function waCartMsg(){
  let m = 'ðŸ›ï¸ Hi! I love these sarees from SK Sarees and want to order:\n';
  Store.cart.forEach(i => { const p = byId(i.id); if (p) m += `\nâœ¨ ${p.name} Ã—${i.qty} â€” ${money(p.price * i.qty)}\n   ðŸ‘‰ ${location.origin}${location.pathname.replace(/[^/]*$/, '')}product.html?id=${encodeURIComponent(p.id)}`; });
  const t = cartTotal(); const sh = shippingFor(t, '', cartCount());
  m += `\n\nShipping (${cartCount()} saree${cartCount() > 1 ? 's' : ''}): ${sh ? money(sh) : 'FREE'}\nTotal: ${money(t + sh)}${sh ? '' : ' (FREE shipping)'}\nPlease confirm availability & delivery.`;
  return m;
}
/* ðŸ’¬ WhatsApp templates â€” fully defensive: any order (even with missing
   customer/totals/items) produces a message instead of crashing the admin list. */
const TPL_CONFIRM = o => {
  const c = (o && o.customer) || {}, t = (o && o.totals) || {};
  return `ðŸŽ‰ Order Confirmed!\n\nHi ${c.name || 'Customer'}, your order ${o && o.id || ''} (${money(t.grand || 0)}) has been confirmed âœ…\nExpected delivery: ${t.eta || 'Dispatch 12-24h'}\nWe will update you on WhatsApp once it is dispatched.\n\nThank you for shopping with SK SAREES! ðŸª¡`;
};
const TPL_DELIVERY = o => {
  const t = (o && o.totals) || {};
  return `ðŸšš Your beautiful Saree is out for delivery!\n\nExpected delivery: ${t.eta || 'Today'}\nTrack your order: ${location.origin}/orders.html?id=${(o && o.id) || ''}\n\nThank you for shopping with SK SAREES. ðŸª¡`;
};
const TPL_NOTIFY = o => {
  const c = (o && o.customer) || {}, t = (o && o.totals) || {}, items = (o && o.items) || [];
  return `ðŸ†• New Order â€” please confirm!\n\nOrder ID: ${(o && o.id) || ''}\nCustomer: ${c.name || 'Customer'}\nPhone: ${c.phone || ''}\nAddress: ${c.address || ''}, ${c.pincode || ''}\nPayment: ${(o && o.payment) === 'upi' ? 'UPI' : 'COD (+â‚¹' + CONFIG.codFee + ')'}\nTotal: ${money(t.grand || 0)}\nETA: ${t.eta || 'Dispatch 12-24h'}\n\nItems:\n${items.map(i => `â€¢ ${(i && i.name) || 'Saree'} Ã—${(i && i.qty) || 1} â€” ${money(((i && i.price) || 0) * ((i && i.qty) || 1))}`).join('\n')}`;
};

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
function calcTotals(payment, pincode){
  const itemsTotal = cartTotal();
  const codFee = payment === 'cod' ? CONFIG.codFee : 0;
  const shipping = shippingFor(itemsTotal, pincode);
  return { itemsTotal, codFee, shipping, grand: itemsTotal + codFee + shipping, eta: deliveryEstimate(pincode, payment).text };
}

/* ============================ 9b. ABANDONED CART RECOVERY ============================
   If a visitor leaves items in the cart for 30+ minutes, show a gentle reminder
   banner with a discount coupon + WhatsApp / SMS buttons to bring them back. */
function abandonedCartBanner(){
  try{
    const page = (document.body && document.body.dataset.page) || '';
    if (page === 'cart' || page === 'checkout' || page === 'orders') return;
    if (!Store.cart.length) return;
    /* save the abandoned-cart record (local + Firestore) so admin can push */
    try{ saveAbandonedRecord(); }catch(e){}
    const t0 = +(localStorage.getItem('sk_cart_time') || 0);
    if (!t0 || Date.now() - t0 < 30 * 60 * 1000) return;   /* only after 30 min */
    if (localStorage.getItem('sk_cart_banner_closed')) return;
    if (document.getElementById('cartRecovery')) return;
    /* also fire a browser push/local notification */
    try{ notifyLocal('ðŸ§º Your cart is waiting!', CONFIG.cartCoupon.label + ' Use coupon ' + CONFIG.cartCoupon.code, 'cart.html'); }catch(e){}
    const items = Store.cart.map(i => { const p = byId(i.id); return p ? 'â€¢ ' + p.name + ' Ã—' + i.qty : ''; }).filter(Boolean).join('\n');
    const cartUrl = location.origin + location.pathname.replace(/[^/]*$/, '') + 'cart.html';
    const msg = 'Hi! You left sarees in your cart ðŸ§º\n\n' + items +
      '\n\nðŸŽŸï¸ Use coupon ' + CONFIG.cartCoupon.code + ' for â‚¹' + CONFIG.cartCoupon.off + ' off â€” offer valid today!\n\nðŸ‘‰ Complete your order: ' + cartUrl + '\n\nHappy shopping! ðŸ˜Š';
    const div = document.createElement('div');
    div.id = 'cartRecovery';
    div.className = 'cart-recovery';
    div.innerHTML = '<button type="button" class="cr-x" data-cr-close aria-label="Close">âœ•</button>' +
      '<b>ðŸ§º ' + CONFIG.cartCoupon.label + '</b>' +
      '<span>Coupon <b>' + CONFIG.cartCoupon.code + '</b> = â‚¹' + CONFIG.cartCoupon.off + ' off on your next order.</span>' +
      '<div class="cr-btns">' +
        '<a class="btn btn-wa btn-sm" href="' + waLink(msg) + '" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true" style="vertical-align:-2px;margin-right:4px"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>WhatsApp Reminder</a>' +
        '<a class="btn btn-outline btn-sm" href="sms:+91' + CONFIG.waNumber + '?body=' + encodeURIComponent(msg) + '">ðŸ“± SMS Reminder</a>' +
        '<a class="btn btn-gold btn-sm" href="cart.html">ðŸ›’ Complete Order</a>' +
      '</div>';
    document.body.appendChild(div);
    setTimeout(() => div.classList.add('show'), 600);
  }catch(e){}
}
document.addEventListener('click', function(e){
  const c = e.target.closest('[data-cr-close]');
  if (c){ const d = document.getElementById('cartRecovery'); if (d) d.remove(); try{ localStorage.setItem('sk_cart_banner_closed','1'); }catch(e2){} }
});

/* ============================ 9c. COUPONS ============================
   Default coupons + admin-created ones (sk_coupons overrides the defaults).
   Types: flat (â‚¹ off) or percent (% off). min = minimum cart total.
   maxUses = usage limit (per store) Â· expiry = YYYY-MM-DD end date (optional).
   Usage is tracked in sk_coupon_used (a map code â†’ count). */
function defaultCoupons(){
  return [
    { code:'AP5',    type:'percent', value:5,  min:0,   active:true, label:'Aadi Festival â€” 5% off', maxUses:0, expiry:'' },
    { code:'CART50', type:'flat',    value:50, min:0,   active:true, label:'Forgot cart â€” â‚¹50 off', maxUses:0, expiry:'' },
    { code:'LATE50', type:'flat',    value:50, min:0,   active:true, label:'Late delivery â€” â‚¹50 off', maxUses:0, expiry:'' },
    { code:'SHARE50', type:'percent', value:5,  min:0,   active:true, label:'Share & Earn â€” 5% off', maxUses:0, expiry:'' },
  ];
}
function getCoupons(){
  try{ const c = JSON.parse(localStorage.getItem('sk_coupons')); if (Array.isArray(c) && c.length) return c; }catch(e){}
  return defaultCoupons();
}
function saveCoupons(list){ try{ localStorage.setItem('sk_coupons', JSON.stringify(list || [])); }catch(e){} }
function couponUsedCount(code){
  try{ const m = JSON.parse(localStorage.getItem('sk_coupon_used') || '{}'); return +m[String(code).trim().toUpperCase()] || 0; }catch(e){ return 0; }
}
function couponRemaining(c){
  if (!c) return 0;
  if (c.maxUses == null || !(+c.maxUses)) return Infinity;
  return Math.max(0, (+c.maxUses) - couponUsedCount(c.code));
}
function couponExpired(c){
  if (!c || !c.expiry) return false;
  const e = new Date(c.expiry); if (isNaN(e.getTime())) return false;
  return e < new Date(new Date().toDateString());   /* expired before today */
}
function couponFor(code){
  if (!code) return null;
  const s = String(code).trim().toUpperCase();
  const c = getCoupons().find(x => x && String(x.code).trim().toUpperCase() === s && x.active);
  if (!c) return null;
  if (couponExpired(c)) return null;               /* expired */
  if (couponRemaining(c) === 0) return null;       /* usage limit reached */
  return c;
}
function useCoupon(code){
  const s = String(code || '').trim().toUpperCase();
  if (!s) return;
  try{
    const m = JSON.parse(localStorage.getItem('sk_coupon_used') || '{}');
    m[s] = (+m[s] || 0) + 1;
    localStorage.setItem('sk_coupon_used', JSON.stringify(m));
  }catch(e){}
}
function couponDiscount(code, total){
  const c = couponFor(code); if (!c) return 0;
  if (c.min && total < +c.min) return 0;
  /* ðŸ”’ percent coupons capped at CONFIG.couponCap (5%) â€” low-profit policy */
  let val = +c.value || 0;
  if (c.type === 'percent') val = Math.min(val, CONFIG.couponCap || 5);
  return c.type === 'percent' ? Math.round(total * val / 100) : val;
}

/* ============================ 9d. RESELLER / SHARE & EARN ============================
   Customers can join as resellers: they get a personal code + share link
   (?ref=CODE). Orders placed through their link record the reseller and a
   margin (â‚¹CONFIG.resellerMargin). Admin sees name/phone/margin/orders and can
   pay the commission via GPay. Resellers are saved locally + Firestore. */
function getResellers(){
  try{ const r = JSON.parse(localStorage.getItem('sk_resellers')); if (Array.isArray(r)) return r; }catch(e){}
  return [];
}
function saveResellers(list){
  try{ localStorage.setItem('sk_resellers', JSON.stringify(list || [])); }catch(e){}
}
/* ðŸ”— Firestore resellers cache â€” makes ?ref=CODE work on every visitor device */
let __fsResellers = [];
function setFsResellers(list){
  __fsResellers = Array.isArray(list) ? list : [];
  /* merge into local storage too so orders on THIS device can credit margin */
  try{
    const loc = getResellers();
    let changed = false;
    __fsResellers.forEach(fr => {
      const i = loc.findIndex(x => x.code === fr.code);
      if (i >= 0){
        if ((fr.margin || 0) > (loc[i].margin || 0)){ loc[i].margin = fr.margin; changed = true; }
        if ((fr.orders || 0) > (loc[i].orders || 0)){ loc[i].orders = fr.orders; changed = true; }
        if (fr.views != null && (fr.views || 0) > (loc[i].views || 0)){ loc[i].views = fr.views; changed = true; }
        if (fr.upi){ loc[i].upi = fr.upi; changed = true; }
      } else { loc.push(fr); changed = true; }
    });
    if (changed) saveResellers(loc);
  }catch(e){}
}
function allResellers(){
  const list = getResellers().slice();
  __fsResellers.forEach(fr => {
    if (!fr || !fr.code) return;
    const i = list.findIndex(x => x.code === fr.code);
    if (i >= 0){
      /* ðŸ”§ merge only DEFINED fields â€” an older cloud record (no views/upi)
         must never erase the local views/upi counts */
      const merged = Object.assign({}, list[i]);
      Object.keys(fr).forEach(k => { if (fr[k] !== undefined && fr[k] !== null) merged[k] = fr[k]; });
      list[i] = merged;
    } else list.push(fr);
  });
  return list;
}
function makeResellerCode(name, phone){
  const n = String(name || '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() || 'RS';
  const p = String(phone || '').replace(/\D/g, '').slice(-4);
  return n + p || ('R' + Date.now().toString(36).slice(-4));
}
function addReseller(name, phone){
  const list = getResellers();
  const ph = String(phone || '').replace(/\D/g, '');
  const ex = list.find(r => r.phone === ph);
  if (ex){ try{ localStorage.setItem('sk_my_reseller', ex.code); }catch(e){} return ex; }   /* already registered â†’ still set this device */
  const r = { code: makeResellerCode(name, ph), name: String(name || '').trim(), phone: ph, date: Date.now(), orders: 0, margin: 0, views: 0, upi: '' };
  list.push(r);
  saveResellers(list);
  try{ localStorage.setItem('sk_my_reseller', r.code); }catch(e){}   /* this device is a reseller now */
  try{
    if (FS.enabled()){ FS._getDb().then(db => { if (db) db.collection('resellers').doc(r.code).set(r, { merge: true }).catch(()=>{}); }).catch(()=>{}); }
  }catch(e){}
  return r;
}
/* ðŸ¤ AUTO-RESELLER â€” whenever a user saves their name + number (profile,
   checkout, fast order), they instantly get their own code, and EVERY share
   link on their device automatically carries ?ref=CODE (so one registered
   user sharing in family groups earns margin on all orders). */
function autoRegisterReseller(name, phone){
  try{
    const ph = String(phone || '').replace(/\D/g, '');
    if (ph.length !== 10 || !/^[6-9]/.test(ph)) return null;
    const mine = myResellerCode();
    if (mine){
      const r = resellerByCode(mine);
      if (r) return r;
    }
    return addReseller(String(name || '').trim() || 'Customer', ph);
  }catch(e){ return null; }
}
/* ðŸ’³ reseller sets their own UPI for receiving margin (profile page) */
function setResellerUpi(code, upi){
  try{
    const list = getResellers();
    const r = list.find(x => x.code === code);
    if (!r) return false;
    r.upi = String(upi || '').trim();
    saveResellers(list);
    if (FS.enabled()){ FS._getDb().then(db => { if (db) db.collection('resellers').doc(code).set({ upi: r.upi }, { merge: true }).catch(()=>{}); }).catch(()=>{}); }
    return true;
  }catch(e){ return false; }
}
function resellerByCode(code){
  if (!code) return null;
  const s = String(code).trim().toUpperCase();
  return allResellers().find(r => r && String(r.code).trim().toUpperCase() === s) || null;
}
/* the reseller's OWN code (this visitor registered as a reseller) */
function myResellerCode(){
  try{ const c = localStorage.getItem('sk_my_reseller'); return c || ''; }catch(e){ return ''; }
}
/* product share URL that carries the reseller's ?ref= on ANY page */
function shareUrl(p){
  const base = productUrl(p);
  const mine = myResellerCode();
  if (mine) return base + (base.indexOf('?') === -1 ? '?' : '&') + 'ref=' + encodeURIComponent(mine);
  return base;
}
/* ðŸ” safe query-param reader â€” tolerates MALFORMED share URLs like
   product.html?id=SK75250?ref=SHA9088 (double ?) by converting every extra ?
   into &, and strips stray ? / spaces from values. Never throws, so no page
   can hang or crash from a bad link. */
function safeParams(){
  try{
    let s = String(location.search || '');
    if (s.charAt(0) === '?') s = s.slice(1);
    if (s.indexOf('?') !== -1) s = s.replace(/\?/g, '&');   /* fix broken ?ref= links */
    const p = new URLSearchParams(s);
    const clean = {};
    p.forEach((v, k) => { clean[k] = String(v || '').split('?')[0].trim(); });
    return { get: k => (k in clean ? clean[k] : null) };
  }catch(e){ return { get: () => null }; }
}
/* capture ?ref= from the URL on any page (used by orders placed later) */
function readRef(){
  try{
    const ref = safeParams().get('ref');
    if (!ref) return null;
    const code = String(ref).trim().toUpperCase();
    /* ðŸ“Œ store the ref on THIS device persistently (localStorage) â€” so even if
       the customer leaves this page and orders later (or another page), the
       order is claimed to the referrer and they earn commission. */
    try{ localStorage.setItem('sk_ref', code); }catch(e){}
    try{ sessionStorage.setItem('sk_ref', code); }catch(e){}
    const r = resellerByCode(code);
    if (r){
      /* ðŸ‘ count a share-link view ONCE per device for this code */
      try{
        if (!localStorage.getItem('sk_ref_viewed_' + code)){
          localStorage.setItem('sk_ref_viewed_' + code, '1');
          r.views = (r.views || 0) + 1;
          saveResellers(getResellers().map(x => x.code === r.code ? r : x));
          if (FS.enabled()){ FS._getDb().then(db => { if (db) db.collection('resellers').doc(r.code).set({ views: r.views }, { merge: true }).catch(()=>{}); }).catch(()=>{}); }
        }
      }catch(e){}
      return r;
    }
    return { code };   /* code may exist in Firestore cloud â€” orders still carry it */
  }catch(e){}
  return null;
}
/* reseller attached to the CURRENT visitor â€” read from persistent localStorage
   (set by any shared ?ref= link on this device), fallback to session */
function currentReseller(){
  try{
    let code = '';
    try{ code = localStorage.getItem('sk_ref') || sessionStorage.getItem('sk_ref') || ''; }catch(e){ code = sessionStorage.getItem('sk_ref') || ''; }
    if (!code) return null;
    const r = resellerByCode(code);
    return r || { code: String(code).trim().toUpperCase() };
  }catch(e){ return null; }
}
/* after an order is placed: credit the reseller + persist to Firestore */
function recordResellerOrder(order){
  try{
    const r = order && order.reseller;
    if (!r || !r.code) return;
    /* ðŸ’° commission rules: ONLY UPI orders earn margin, and the margin is
       confirmed only when the order is SHIPPED (shown as pending until then). */
    if ((order.payment || '') !== 'upi') return;
    const list = getResellers();
    /* if the code is known only from the cloud cache, add a local copy so the
       margin is credited & visible in the admin panel */
    let i = list.findIndex(x => x.code === r.code);
    if (i < 0){
      const cloud = allResellers().find(x => x.code === r.code);
      if (cloud){
        list.push({ code: cloud.code, name: cloud.name || r.name, phone: cloud.phone || r.phone, date: cloud.date || Date.now(), orders: 0, margin: 0, views: cloud.views || 0, upi: cloud.upi || '' });
        i = list.length - 1;
      } else {
        /* code totally unknown (cloud not synced yet) â†’ still credit a record so
           the admin sees it and the margin is never lost */
        list.push({ code: r.code, name: r.name || 'Reseller', phone: r.phone || '', date: Date.now(), orders: 0, margin: 0, views: 0, upi: '' });
        i = list.length - 1;
      }
    }
    if (i >= 0){
      list[i].orders = (list[i].orders || 0) + 1;
      /* margin stored as PENDING until the order ships (order ref kept) */
      list[i].pendingMargin = (list[i].pendingMargin || 0) + (order.margin || 0);
      list[i].lastOrder = order.date || new Date().toISOString();
      if (!Array.isArray(list[i].refOrders)) list[i].refOrders = [];
      list[i].refOrders.push({ id: order.id, date: order.date, grand: (order.totals && order.totals.grand) || 0, margin: order.margin || 0, status: (order.status || 'placed') });
      list[i].refOrders = list[i].refOrders.slice(-50);
      saveResellers(list);
    }
    if (FS.enabled()){
      FS._getDb().then(db => {
        if (!db) return;
        db.collection('resellers').doc(r.code).set({ code: r.code, name: r.name, phone: r.phone, orders: (list[i] && list[i].orders) || 0, margin: (list[i] && list[i].margin) || 0, updatedAt: Date.now() }, { merge: true }).catch(()=>{});
      }).catch(()=>{});
    }
  }catch(e){}
}
/* ðŸšš when an order is SHIPPED, its pending reseller margin becomes CONFIRMED
   (usable / payable). Called from the admin status update. */
function confirmMarginOnShip(orderId){
  try{
    const list = getResellers();
    let changed = false;
    list.forEach(r => {
      const o = (r.refOrders || []).find(x => x.id === orderId);
      /* confirm when the admin marks it shipped (status param also passed);
         the ref-order copy may still say 'placed/pending' â€” accept any non-cancelled */
      if (o && !o.confirmed && o.status !== 'cancelled'){
        o.confirmed = true; o.confirmedAt = new Date().toISOString();
        o.status = 'shipped';
        /* move from pendingMargin â†’ margin (confirmed) */
        const amt = o.margin || 0;
        r.pendingMargin = Math.max(0, (r.pendingMargin || 0) - amt);
        r.margin = (r.margin || 0) + amt;
        changed = true;
      }
    });
    if (changed){
      saveResellers(list);
      if (FS.enabled()){
        FS._getDb().then(db => { if (db) list.forEach(r => { const rr = { margin: r.margin || 0, pendingMargin: r.pendingMargin || 0, refOrders: r.refOrders || [] }; db.collection('resellers').doc(r.code).set(rr, { merge: true }).catch(()=>{}); }); }).catch(()=>{});
      }
    }
  }catch(e){}
}
/* âŒ order CANCELLED â†’ remove its pending margin + mark the ref order cancelled */
function cancelResellerMargin(orderId){
  try{
    const list = getResellers();
    let changed = false;
    list.forEach(r => {
      const o = (r.refOrders || []).find(x => x.id === orderId);
      if (o && !o.confirmed){
        o.status = 'cancelled';
        r.pendingMargin = Math.max(0, (r.pendingMargin || 0) - (o.margin || 0));
        changed = true;
      }
    });
    if (changed){ saveResellers(list); }
  }catch(e){}
}
/* âœ… admin marks a reseller's commission as PAID â†’ margin resets to 0
   (paid history is kept so you can always see what was paid) */
function markResellerPaid(code){
  const list = getResellers();
  const r = list.find(x => x.code === code);
  if (!r) return false;
  const paid = +(r.margin || 0);
  r.paidTotal = (r.paidTotal || 0) + paid;
  r.lastPaid = new Date().toISOString();
  r.margin = 0;
  saveResellers(list);
  /* ðŸ’¸ payment log â€” the reseller can see "commission received" on their profile */
  try{
    const pays = JSON.parse(localStorage.getItem('sk_reseller_payments') || '[]');
    pays.push({ code, amount: paid, date: r.lastPaid });
    localStorage.setItem('sk_reseller_payments', JSON.stringify(pays.slice(-100)));
  }catch(e){}
  if (FS.enabled()){
    FS._getDb().then(db => {
      if (!db) return;
      db.collection('resellers').doc(code).set({ code: code, paidTotal: r.paidTotal, lastPaid: r.lastPaid, margin: 0, updatedAt: Date.now() }, { merge: true }).catch(()=>{});
    }).catch(()=>{});
  }
  return true;
}
/* GPay commission link for a reseller (pay to their phone @upi) */
function resellerUpiId(r){
  /* âœ… UPI for receiving margin â€” prefers the reseller's own edited UPI
     (profile â†’ ðŸ’³ UPI ID), else derives from their phone (91<10digit>@upi). */
  let u = String((r && r.upi) || '').trim();
  if (u){
    u = u.replace(/\s+/g, '');
    if (u.indexOf('@') !== -1) return u;
    if (/^\d{10,12}$/.test(u)){
      let pp = u.replace(/\D/g, '');
      if (pp.length === 12 && pp.indexOf('91') === 0) pp = pp.slice(2);
      if (pp.length === 10 && /^[6-9]/.test(pp)) pp = '91' + pp;
      return pp + '@upi';
    }
    return u + '@upi';
  }
  let p = String((r && r.phone) || '').replace(/\D/g, '');
  if (p.length === 12 && p.indexOf('91') === 0) p = p.slice(2);
  if (p.length === 10 && /^[6-9]/.test(p)) p = '91' + p;
  return p + '@upi';
}
function resellerPayLink(r, amount){
  const pa = resellerUpiId(r);
  const amt = Number(amount || CONFIG.resellerMargin || 0).toFixed(2);
  const note = encodeURIComponent('SK Sarees commission ' + (r.code || '') + ' â€” thank you!');
  const name = encodeURIComponent(r.name || 'Reseller');
  /* GPay deep link + web fallback (works even without the GPay app) */
  return 'intent://pay?pa=' + pa + '&pn=' + name + '&am=' + amt + '&cu=INR&tn=' + note + '#Intent;scheme=upi;package=com.google.android.apps.nfcpay;S.browser_fallback_url=' + encodeURIComponent('https://pay.google.com/gp/p/u/0/home/payments?amount=' + amt + '&currency=INR') + ';end';
}

/* ============================ 9d. WEB PUSH NOTIFICATIONS ============================
   Push notifications for customers (order status, offers, abandoned cart) and
   an admin panel to send them. Works on HTTPS only (browsers require it).
   Â· Customers subscribe once â†’ their PushSubscription is saved (device-local +
     Firestore pushsubs collection) so the admin can reach them.
   Â· Admin "ðŸ“£ Push" tab lists abandoned carts + sends push reminders using the
     Web Push protocol (VAPID-signed, E2E-encrypted) straight from the browser. */
const VAPID_PUBLIC = 'BIbNKuIOEHTqp7idmQMi7cvHUSQqhipFPP9wiaH0YnUbRiBapYGLppgH883GunMKRw0dY1q6gA9tfNFF7yN7Vds';
const VAPID_PRIVATE_DEFAULT = '1P4YzC3VLgeImxWZXqgKpniZ3mxCVtHYMTTVBuIXk5Q'; /* change in Admin â†’ Push */

function vapidPrivate(){
  try{ return localStorage.getItem('sk_vapid_private') || VAPID_PRIVATE_DEFAULT; }catch(e){ return VAPID_PRIVATE_DEFAULT; }
}
function saveVapidPrivate(k){ try{ localStorage.setItem('sk_vapid_private', k); }catch(e){} }

/* ---- subscribe the current browser (needs HTTPS + permission) ---- */
async function subscribePush(){
  try{
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;
    const reg = await navigator.serviceWorker.register(repoBase() + 'sw.js');
    await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64ToUint8(VAPID_PUBLIC) });
    /* save locally + Firestore */
    try{ localStorage.setItem('sk_pushsub', JSON.stringify(sub.toJSON())); }catch(e){}
    try{
      if (FS.enabled()){
        const db = await FS._getDb();
        if (db){
          db.collection('pushsubs').doc(deviceId()).set({ device: deviceId(), sub: sub.toJSON(), phone: (Store.profile||{}).phone || '', updatedAt: Date.now() }, { merge: true }).catch(()=>{});
        }
      }
    }catch(e){}
    return sub;
  }catch(e){ return null; }
}
function urlB64ToUint8(b64){
  const pad = b64.replace(/=+$/, '');
  const raw = atob(pad.replace(/-/g, '+').replace(/_/g, '/'));
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}
/* ---- local (in-app) notification â€” works even without a push service ---- */
function notifyLocal(title, body, url){
  try{
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    const n = new Notification(title, { body, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: 'sk-sarees' });
    n.onclick = function(){ try{ window.focus(); if (url) location.href = url; n.close(); }catch(e){} };
  }catch(e){}
}
/* ---- Web Push sender (works from the admin page; pure browser crypto) ----
   Builds the VAPID JWT (ES256), ECDH shared secret, AES-128-GCM payload and
   POSTs it to the subscription endpoint â€” the Web Push protocol. */
async function webPushSend(subJson, payload){
  const sub = typeof subJson === 'string' ? JSON.parse(subJson) : subJson;
  if (!sub || !sub.endpoint || !sub.keys) throw new Error('No subscription');
  const enc = new TextEncoder();
  const dec = new TextDecoder();

  /* 1) VAPID JWT (ES256) signed with the private key.
     ðŸ”¥ UTF-8-safe base64url: plain btoa crashes on non-Latin1 text (Tamil/emoji
     and invalid-UTF8 signature bytes â†’ U+FFFD). We always encode bytes. */
  const bytesB64url = bytes => {
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  };
  const strB64url = str => bytesB64url(enc.encode(String(str)));
  const header = strB64url(JSON.stringify({ typ: 'JWT', alg: 'ES256' }));
  const now = Math.floor(Date.now() / 1000);
  const payloadB64 = strB64url(JSON.stringify({ aud: new URL(sub.endpoint).origin, exp: now + 3600, sub: 'mailto:sk7867915699@example.com' }));
  const toSign = header + '.' + payloadB64;

  const privJwk = { crv: 'P-256', kty: 'EC', x: await b64ToJwkPart(VAPID_PUBLIC, 1), y: await b64ToJwkPart(VAPID_PUBLIC, 2), d: await b64ToJwkPart(vapidPrivate(), 3) };
  const privKey = await crypto.subtle.importKey('jwk', privJwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, privKey, enc.encode(toSign));
  const sigB64 = bytesB64url(new Uint8Array(sig));   /* ðŸ”¥ signature is raw bytes â€” never UTF-8 decode + btoa */
  const authorization = 'vapid t=' + toSign + '.' + sigB64 + ', k=' + VAPID_PUBLIC;

  /* 2) ECDH shared secret from the subscription's p256dh */
  const p256dhJwk = { crv: 'P-256', kty: 'EC', x: await b64ToJwkPart(sub.keys.p256dh, 1), y: await b64ToJwkPart(sub.keys.p256dh, 2), ext: true };
  const pubKey = await crypto.subtle.importKey('jwk', p256dhJwk, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const ephPair = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const ephPubRaw = new Uint8Array(await crypto.subtle.exportKey('raw', ephPair.publicKey)); /* ArrayBuffer â†’ Uint8Array */
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: pubKey }, ephPair.privateKey, 256));

  /* 3) HKDF to derive the encryption key + nonce (RFC 8291) */
  const auth = await b64ToRaw(sub.keys.auth);
  const ikm = new Uint8Array(32); ikm.set(new Uint8Array(shared), 0);
  const keyInfo = new Uint8Array([...new TextEncoder().encode('WebPush: info\x00'), ...new Uint8Array(ephPubRaw), ...new Uint8Array(await b64ToRaw(sub.keys.p256dh))]);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const prk = await hkdf(ikm, auth, new Uint8Array(0), 32);
  const cek = await hkdf(prk, salt, new TextEncoder().encode('Content-Encoding: aes128gcm\x00'), 16);
  const nonce = await hkdf(prk, salt, new TextEncoder().encode('Content-Encoding: nonce\x00'), 12);

  /* 4) AES-128-GCM encrypt the payload */
  const aesKey = await crypto.subtle.importKey('raw', cek, { name: 'AES-GCM' }, false, ['encrypt']);
  const data = enc.encode(payload);
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce, tagLength: 128, additionalData: keyInfo }, aesKey, data);
  const cipherBytes = new Uint8Array(cipher);

  /* 5) Assemble aes128gcm record: header(86 bytes) + ciphertext+tag */
  const record = new Uint8Array(86 + cipherBytes.length);
  record[0] = 16;                                  /* salt length */
  record.set(salt, 1);
  record.set([0, 0], 17);                          /* rs = 0 */
  record.set([ephPubRaw.length], 19);              /* idlen = public key length (65) */
  record.set(ephPubRaw, 20);                       /* public key (65) */
  record[85] = 0;                                  /* padding len */
  record.set(cipherBytes, 86);

  /* 6) POST to the push service */
  const res = await fetch(sub.endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream', 'TTL': '86400', 'Authorization': authorization, 'Content-Encoding': 'aes128gcm' },
    body: record,
  });
  if (!res.ok && res.status !== 201 && res.status !== 202){ throw new Error('Push service error ' + res.status); }
  return true;
}
/* HKDF (RFC 5869) with WebCrypto */
async function hkdf(ikm, salt, info, len){
  const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, key, len * 8);
  return new Uint8Array(bits);
}
/* helpers to convert URL-safe base64 â†’ JWK parts / raw bytes */
function b64urlToBytes(s){
  const pad = String(s).replace(/=+$/, '');
  const raw = atob(pad.replace(/-/g, '+').replace(/_/g, '/'));
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}
async function b64ToJwkPart(s, part){
  /* part 1 = x, 2 = y, 3 = d (private scalar). Public keys are 65-byte
     uncompressed points (0x04 + x + y) â€” skip the marker byte. */
  const bytes = b64urlToBytes(s);
  const off = (bytes.length === 65 && bytes[0] === 4) ? 1 : 0;
  const slice = part === 1 ? bytes.subarray(off, off + 32)
              : part === 2 ? bytes.subarray(off + 32, off + 64)
              : bytes.subarray(bytes.length - 32);
  const b64 = btoa(String.fromCharCode.apply(null, slice)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  return b64;
}
async function b64ToRaw(s){ return b64urlToBytes(s); }

/* ---- abandoned-cart record (local + Firestore) so admin can push ---- */
/* ðŸ“‹ LEAD COLLECTION â€” any visitor who shares a name + number (Fast Order,
   checkout, Notify-Me) is recorded as a lead: local list + Firestore, so the
   admin's ðŸ“‹ Leads tab and ðŸ”” new-lead alerts work. */
function recordLead(name, phone, code){
  try{
    const ph = String(phone || '').replace(/\D/g, '');
    if (ph.length < 10) return;
    const lead = { name: String(name || '').trim() || 'Visitor', phone: ph, code: code || '', date: Date.now(), page: (document.body && document.body.dataset.page) || '' };
    try{
      const list = JSON.parse(localStorage.getItem('sk_lead_list') || '[]');
      const i = list.findIndex(x => String(x.phone || '').replace(/\D/g, '') === ph);
      if (i >= 0) list[i] = lead; else list.push(lead);
      localStorage.setItem('sk_lead_list', JSON.stringify(list.slice(-200)));
    }catch(e){}
    if (FS.enabled()){
      FS._getDb().then(db => { if (db) db.collection('leads').doc(ph).set(lead, { merge: true }).catch(()=>{}); }).catch(()=>{});
    }
  }catch(e){}
}
function saveAbandonedRecord(){
  try{
    if (!Store.cart.length) return;
    const items = Store.cart.map(i => { const p = byId(i.id); return { id: i.id, name: p ? p.name : 'Saree', qty: i.qty, price: p ? p.price : 0 }; });
    const rec = { device: deviceId(), items, total: cartTotal(), phone: (Store.profile||{}).phone || (co && co.data ? co.data.phone : '') || '', time: Date.now(), sub: (function(){ try{ return JSON.parse(localStorage.getItem('sk_pushsub') || 'null'); }catch(e){ return null; } })() };
    try{ localStorage.setItem('sk_abandoned', JSON.stringify(rec)); }catch(e){}
    try{
      if (FS.enabled()){
        FS._getDb().then(db => { if (db) db.collection('abandoned').doc(deviceId()).set(rec, { merge: true }).catch(()=>{}); }).catch(()=>{});
      }
    }catch(e){}
  }catch(e){}
}

/* ============================ 9f. VISITOR + ORDER COUNTERS ============================
   Â· Visitors: bumped once per device on first visit; Firestore increments a
     shared counter (counters/site) so the total grows across all devices.
   Â· Orders: local orders + cloud orders (best effort, updates live).
   Shown in the hero trust strip and the footer. */
const Stats = {
  visitors: 0,
  orders: 0,
  init(){
    try{ this.visitors = +(localStorage.getItem('sk_visitors') || 0); }catch(e){}
    try{
      if (!localStorage.getItem('sk_visitor_done')){
        localStorage.setItem('sk_visitor_done', '1');
        this.visitors += 1;
        try{ localStorage.setItem('sk_visitors', String(this.visitors)); }catch(e){}
        try{
          if (FS.enabled()){
            FS._getDb().then(db => {
              if (!db) return;
              db.collection('counters').doc('site').set({ visitors: window.firebase.firestore.FieldValue.increment(1), updatedAt: Date.now() }, { merge: true }).catch(() => {});
            }).catch(() => {});
          }
        }catch(e){}
      }
    }catch(e){}
    this.refreshOrders();
    /* ðŸ”´ REAL totals: visitors from the shared Firestore counter,
       orders = actual count of documents in the Firestore orders collection
       (plus this device's local orders that may not be synced yet) */
    try{
      if (FS.enabled()){
        FS._getDb().then(db => {
          if (!db) return;
          db.collection('counters').doc('site').onSnapshot(snap => {
            if (!snap.exists) return;
            const d = snap.data() || {};
            if (d.visitors) this.visitors = d.visitors;
            renderStatsText();
          }, () => {});
          /* true order count = Firestore orders docs + unsynced local orders */
          db.collection('orders').get().then(snap => {
            this.orders = (snap.size || 0);
            this.orders += Store.orders.filter(o => !o.syncedCloud).length || 0;
            renderStatsText();
          }).catch(() => {});
          /* keep it live with a listener */
          db.collection('orders').onSnapshot(snap => {
            this.orders = (snap && snap.size) || 0;
            renderStatsText();
          }, () => {});
        }).catch(() => {});
      }
    }catch(e){}
  },
  refreshOrders(){
    try{ this.orders = Store.orders.length; }catch(e){}
    try{ if (typeof fsOrders !== 'undefined' && fsOrders) this.orders = fsOrders.length; }catch(e){}
  },
  text(){ return 'ðŸ‘¥ ' + (this.visitors || 0).toLocaleString('en-IN') + '+ visitors Â· ðŸ“¦ ' + (this.orders || 0).toLocaleString('en-IN') + '+ orders'; }
};
function renderStatsText(){
  try{
    const v = document.getElementById('statV'); if (v) v.textContent = (Stats.visitors || 0).toLocaleString('en-IN');
    const o = document.getElementById('statO'); if (o) o.textContent = (Stats.orders || 0).toLocaleString('en-IN');
    const t = document.getElementById('siteStats'); if (t) t.textContent = 'ðŸ‘¥ ' + (Stats.visitors || 0).toLocaleString('en-IN') + '+ visitors Â· ðŸ“¦ ' + (Stats.orders || 0).toLocaleString('en-IN') + '+ orders';
  }catch(e){}
}

/* ============================ 9g. BUNDLE + PRICE-DROP ALERTS ============================ */
/* ðŸ›’ bundle deal: buy N+ sarees â†’ â‚¹off (auto-applied at checkout) */
function bundleDiscount(){
  try{
    const n = cartCount();
    if (n >= (CONFIG.bundleCount || 2)) return CONFIG.bundleOff || 0;
  }catch(e){}
  return 0;
}
/* ðŸ’¸ wishlist price-drop alerts: remember prices, alert when a price drops */
function trackWishPrices(){
  try{
    const saved = JSON.parse(localStorage.getItem('sk_wish_prices') || '{}');
    const drops = [];
    Store.wish.forEach(id => {
      const p = byId(id); if (!p) return;
      const prev = saved[id];
      if (prev && prev > p.price && prev - p.price >= 20){
        drops.push({ id, name: p.name, from: prev, to: p.price, img: p.img });
      }
      saved[id] = p.price;
    });
    localStorage.setItem('sk_wish_prices', JSON.stringify(saved));
    return drops;
  }catch(e){ return []; }
}
function showPriceDrops(){
  try{
    const drops = trackWishPrices();
    if (!drops.length) return;
    let list = '';
    drops.forEach(d => { list += '<div style="display:flex;gap:10px;align-items:center;padding:8px 0;border-bottom:1px dashed var(--line)"><img src="' + esc(d.img) + '" style="width:54px;height:42px;object-fit:cover;border-radius:8px"><div style="flex:1;min-width:0"><b style="font-size:.85rem">' + esc(d.name) + '</b><br><small><s>' + money(d.from) + '</s> <b style="color:var(--green)">' + money(d.to) + '</b> ðŸ”¥ Price dropped!</small></div><a class="btn btn-outline btn-sm" style="width:auto;min-height:34px;padding:6px 10px" href="product.html?id=' + encodeURIComponent(d.id) + '">View</a></div>'; });
    openModal('<h2 style="font-size:1.05rem;font-weight:800;margin-bottom:6px">ðŸ’¸ Price Drop Alert!</h2>' +
      '<p class="small muted" style="margin-bottom:4px">Your wishlist sarees are cheaper now:</p>' + list +
      '<a class="btn btn-maroon" style="margin-top:10px" href="shop.html">ðŸ›ï¸ Shop More Deals</a>');
  }catch(e){}
}

/* ============================ 9h. SKIN-TONE â†’ SAREE COLOR (South India favorite) ============================
   Brides & family pick saree colours by skin tone. This gives instant
   recommendations per product colour. */
const SKIN_TONES = {
  fair:   { label:'Fair (à®šà®¿à®µà®ªà¯à®ªà¯ à®¨à®¿à®±à®®à¯)',    colors:['red','pink','purple','blue','green','gold'] },
  medium: { label:'Medium',         colors:['gold','green','maroon','teal','purple','pink'] },
  dusky:  { label:'Dusky (à®•à®°à¯à®ªà¯à®ªà¯ à®¨à®¿à®±à®®à¯)',    colors:['gold','orange','red','yellow','green','champagne'] },
};
function skinToneOf(colorFam){
  /* map a saree colour family to the best skin tones for it */
  const c = String(colorFam || '').toLowerCase();
  if (['gold','orange','yellow','champagne','red','green'].indexOf(c) !== -1) return 'dusky';
  if (['purple','blue','pink','maroon','teal'].indexOf(c) !== -1) return 'fair';
  if (['white','brown'].indexOf(c) !== -1) return 'medium';
  return 'medium';
}
function skinToneRecommendHTML(p){
  try{
    /* compute colour family locally (no REC dependency) */
    const COL = [
      [/maroon|burgundy|wine|red/i,'red'],[/pink|rose|magenta/i,'pink'],[/emerald|green|peacock|teal|mint|sage/i,'green'],
      [/navy|blue|turquoise|sky/i,'blue'],[/purple|lavender|violet/i,'purple'],[/gold|yellow|mustard|ochre/i,'gold'],
      [/white|cream|ivory/i,'white'],[/beige|brown|tan/i,'brown'],[/black|grey|gray/i,'dark'],[/champagne/i,'champagne'],
    ];
    const src = String((p.colors||[]).join(' ') + ' ' + (p.color||'')).toLowerCase();
    let fam = 'multi';
    for (const [re, v] of COL){ if (re.test(src)){ fam = v; break; } }
    const best = skinToneOf(fam);
    const tone = SKIN_TONES[best];
    return '<div class="skin-note">âœ¨ <b>Looks great on ' + esc(tone.label) + ' skin</b> â€” a favourite for brides &amp; family in South India!</div>';
  }catch(e){ return ''; }
}

/* ============================ 10. TOAST / MODAL ============================ */
let toastT;
function toast(msg){
  const t = document.getElementById('toast'); if (!t) return;
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2800);
}
function copyText(txt){
  const done = () => toast('âœ… Copied');
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done).catch(()=>{});
  else { const ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta); ta.select(); try{ document.execCommand('copy'); done(); }catch(e){} ta.remove(); }
}
function openModal(html){
  const root = document.getElementById('modalRoot'); if (!root) return;
  root.innerHTML = `<div class="modal show"><div class="m-back" data-close></div><div class="m-card">${html}<button class="m-close" data-close aria-label="Close">âœ•</button></div></div>`;
  document.body.style.overflow = 'hidden';
}
function closeModal(){
  const m = document.querySelector('#modalRoot .modal'); if (!m) return;
  m.classList.remove('show'); setTimeout(() => { m.remove(); document.body.style.overflow = ''; }, 300);
}

/* ============================ 11. LANGS (en + ta + core hi/kn/te) ============================ */
const LANGS = {
  en: { home:'Home', shop:'Shop', cart:'Your Cart', checkout:'Checkout', myOrders:'My Orders', profile:'Profile', shopAll:'Shop All Sarees', addToCart:'Add to Cart', buyNow:'Buy Now', orderOnWA:'Order on WhatsApp', viewAll:'View all â†’', bestSellers:'Best Sellers', newArrivals:'New Arrivals', todaysDeals:"Today's Deals", flashSale:'Flash Sale', shopByCategory:'Shop by Category', trending:'Trending Collection', joinGroup:'Join Our WhatsApp Group', language:'Language', contactUs:'Contact Us', quickLinks:'Quick Links', aboutUs:'About Us', orderDetails:'Order Details', continueShopping:'Continue Shopping', payOnline:'Pay Online (UPI)', freeShip:'Free Shipping', placeOrder:'Place Order', confirmWA:'Confirm on WhatsApp', all:'All', search:'Search sarees, fabric, colourâ€¦', sort:'Sort', filter:'Filter', price:'Max Price', loadMore:'Loading more sareesâ€¦', noResults:'No sarees found', inStock:'In stock', outStock:'Out of stock' },
  ta: {
    home:'à®®à¯à®•à®ªà¯à®ªà¯', shop:'à®•à®Ÿà¯ˆ', cart:'à®‰à®™à¯à®•à®³à¯ à®µà®£à¯à®Ÿà®¿', checkout:'à®šà¯†à®²à¯à®¤à¯à®¤à¯à®¤à®²à¯', myOrders:'à®Žà®©à®¤à¯ à®†à®°à¯à®Ÿà®°à¯à®•à®³à¯', profile:'à®šà¯à®¯à®µà®¿à®µà®°à®®à¯',
    shopAll:'à®…à®©à¯ˆà®¤à¯à®¤à¯ à®šà¯‡à®²à¯ˆà®•à®³à¯', addToCart:'à®µà®£à¯à®Ÿà®¿à®¯à®¿à®²à¯ à®šà¯‡à®°à¯', buyNow:'à®‡à®ªà¯à®ªà¯‹à®¤à¯ à®µà®¾à®™à¯à®•', orderOnWA:'à®µà®¾à®Ÿà¯à®¸à¯à®…à®ªà¯à®ªà®¿à®²à¯ à®†à®°à¯à®Ÿà®°à¯',
    viewAll:'à®…à®©à¯ˆà®¤à¯à®¤à¯à®®à¯ â†’', bestSellers:'à®šà®¿à®±à®¨à¯à®¤ à®µà®¿à®±à¯à®ªà®©à¯ˆ', newArrivals:'à®ªà¯à®¤à®¿à®¯ à®µà®°à®µà¯à®•à®³à¯', todaysDeals:'à®‡à®©à¯à®±à¯ˆà®¯ à®šà®²à¯à®•à¯ˆà®•à®³à¯',
    flashSale:'à®ƒà®ªà®¿à®³à®¾à®·à¯ à®šà¯‡à®²à¯', shopByCategory:'à®µà®•à¯ˆà®ªà¯à®ªà®Ÿà®¿ à®µà®¾à®™à¯à®•à¯à®™à¯à®•à®³à¯', trending:'à®Ÿà®¿à®°à¯†à®£à¯à®Ÿà®¿à®™à¯ à®¤à¯Šà®•à¯à®ªà¯à®ªà¯',
    joinGroup:'à®µà®¾à®Ÿà¯à®¸à¯à®…à®ªà¯ à®•à¯à®´à¯à®µà®¿à®²à¯ à®šà¯‡à®°', language:'à®®à¯Šà®´à®¿', contactUs:'à®¤à¯Šà®Ÿà®°à¯à®ªà¯', quickLinks:'à®µà®¿à®°à¯ˆà®µà¯ à®‡à®£à¯ˆà®ªà¯à®ªà¯à®•à®³à¯',
    aboutUs:'à®Žà®™à¯à®•à®³à¯ˆ à®ªà®±à¯à®±à®¿', orderDetails:'à®†à®°à¯à®Ÿà®°à¯ à®µà®¿à®µà®°à®®à¯', continueShopping:'à®¤à¯Šà®Ÿà®°à¯à®¨à¯à®¤à¯ à®µà®¾à®™à¯à®•à¯à®™à¯à®•à®³à¯',
    payOnline:'à®†à®©à¯à®²à¯ˆà®©à®¿à®²à¯ à®šà¯†à®²à¯à®¤à¯à®¤à¯à®™à¯à®•à®³à¯ (UPI)', freeShip:'à®‡à®²à®µà®š à®Ÿà¯†à®²à®¿à®µà®°à®¿', placeOrder:'à®†à®°à¯à®Ÿà®°à¯ à®šà¯†à®¯à¯à®¯à¯à®™à¯à®•à®³à¯',
    confirmWA:'à®µà®¾à®Ÿà¯à®¸à¯à®…à®ªà¯à®ªà®¿à®²à¯ à®‰à®±à¯à®¤à®¿ à®šà¯†à®¯à¯', all:'à®…à®©à¯ˆà®¤à¯à®¤à¯à®®à¯', search:'à®šà¯‡à®²à¯ˆà®•à®³à¯, à®¤à¯à®£à®¿, à®¨à®¿à®±à®®à¯ à®¤à¯‡à®Ÿà¯à®™à¯à®•à®³à¯â€¦', sort:'à®µà®°à®¿à®šà¯ˆ',
    filter:'à®µà®Ÿà®¿à®•à®Ÿà¯à®Ÿà¯', price:'à®…à®¤à®¿à®•à®ªà®Ÿà¯à®š à®µà®¿à®²à¯ˆ', loadMore:'à®®à¯‡à®²à¯à®®à¯ à®šà¯‡à®²à¯ˆà®•à®³à¯â€¦', noResults:'à®šà¯‡à®²à¯ˆà®•à®³à¯ à®‡à®²à¯à®²à¯ˆ',
    inStock:'à®•à¯ˆà®¯à®¿à®°à¯à®ªà¯à®ªà®¿à®²à¯ à®‰à®³à¯à®³à®¤à¯', outStock:'à®•à¯ˆà®¯à®¿à®°à¯à®ªà¯à®ªà®¿à®²à¯ à®‡à®²à¯à®²à¯ˆ',
    /* extra UI (hero, sections, buttons) */
    heroTitle1:'à®…à®´à®•à®¾à®© à®šà¯‡à®²à¯ˆà®•à®³à¯', heroTitle2:'à®‰à®™à¯à®• à®µà¯€à®Ÿà¯à®Ÿà¯ à®µà®¾à®šà®²à¯ à®µà®°à¯ˆ à®Ÿà¯†à®²à®¿à®µà®°à®¿!',
    heroSub:'à®•à®žà¯à®šà®¿à®ªà¯à®°à®®à¯ à®ªà®Ÿà¯à®Ÿà¯, à®•à®¾à®Ÿà¯à®Ÿà®©à¯, à®œà®¾à®°à¯à®œà¯†à®Ÿà¯ & à®¤à®¿à®°à¯à®®à®£ à®šà¯‡à®²à¯ˆà®•à®³à¯. 2 à®¨à®¿à®®à®¿à®Ÿà®¤à¯à®¤à¯à®² à®†à®°à¯à®Ÿà®°à¯ â€” UPI à®…à®²à¯à®²à®¤à¯ COD.',
    shopBest:'à®šà®¿à®±à®¨à¯à®¤ à®µà®¿à®±à¯à®ªà®©à¯ˆ à®šà¯‡à®²à¯ˆà®•à®³à¯', newIn:'à®ªà¯à®¤à®¿à®¯ à®µà®°à®µà¯à®•à®³à¯', deals:'à®‡à®©à¯à®±à¯ˆà®¯ à®šà®²à¯à®•à¯ˆà®•à®³à¯',
    categories:'à®µà®•à¯ˆà®ªà¯à®ªà®Ÿà®¿ à®µà®¾à®™à¯à®•à¯à®™à¯à®•à®³à¯', whyUs:'à®à®©à¯ SK Sarees?', reviews:'à®µà®¾à®Ÿà®¿à®•à¯à®•à¯ˆà®¯à®¾à®³à®°à¯ à®•à®°à¯à®¤à¯à®¤à¯à®•à®³à¯',
    faq:'à®…à®Ÿà®¿à®•à¯à®•à®Ÿà®¿ à®•à¯‡à®Ÿà¯à®•à®ªà¯à®ªà®Ÿà¯à®®à¯ à®•à¯‡à®³à¯à®µà®¿à®•à®³à¯', videoCat:'à®µà¯€à®Ÿà®¿à®¯à¯‹ à®•à¯‡à®Ÿà¯à®Ÿà®²à®¾à®•à¯', festival:'à®ªà®£à¯à®Ÿà®¿à®•à¯ˆ à®•à®¾à®²à®£à¯à®Ÿà®°à¯',
    shareEarn:'à®ªà®•à®¿à®°à¯à®¨à¯à®¤à¯ à®šà®®à¯à®ªà®¾à®¤à®¿à®¯à¯à®™à¯à®•à®³à¯', resellerTag:'à®°à¯€à®šà¯†à®²à¯à®²à®°à¯ à®¤à®¿à®Ÿà¯à®Ÿà®®à¯ â€” à®’à®µà¯à®µà¯Šà®°à¯ à®µà®¿à®±à¯à®ªà®©à¯ˆà®•à¯à®•à¯à®®à¯ â‚¹' ,
    googleRev:'Google à®®à®¤à®¿à®ªà¯à®ªà¯à®°à¯ˆà®•à®³à¯', whatsappGroup:'à®µà®¾à®Ÿà¯à®¸à¯à®…à®ªà¯ à®•à¯à®´à¯à®µà®¿à®²à¯ à®šà¯‡à®°',
    searchHero:'à®šà¯‡à®²à¯ˆ à®ªà¯†à®¯à®°à¯, SKU à®…à®²à¯à®²à®¤à¯ à®¨à®¿à®±à®®à¯ à®¤à¯‡à®Ÿà¯à®™à¯à®•à®³à¯â€¦', search:'à®¤à¯‡à®Ÿà¯',
    freeShipAbove:'â‚¹999à®•à¯à®•à¯ à®®à¯‡à®²à¯ à®‡à®²à®µà®š à®Ÿà¯†à®²à®¿à®µà®°à®¿', cod:'à®•à®¾à®·à¯ à®†à®©à¯ à®Ÿà¯†à®²à®¿à®µà®°à®¿',
  },
  te: {
    home:'à°¹à±‹à°®à±', shop:'à°·à°¾à°ªà±', cart:'à°®à±€ à°•à°¾à°°à±à°Ÿà±', checkout:'à°šà±†à°•à±à°…à°µà±à°Ÿà±', myOrders:'à°¨à°¾ à°†à°°à±à°¡à°°à±à°²à±', profile:'à°ªà±à°°à±Šà°«à±ˆà°²à±',
    shopAll:'à°…à°¨à±à°¨à°¿ à°šà±€à°°à°²à±', addToCart:'à°•à°¾à°°à±à°Ÿà±â€Œà°²à±‹ à°šà±‡à°°à±à°šà°‚à°¡à°¿', buyNow:'à°‡à°ªà±à°ªà±à°¡à± à°•à±Šà°¨à°‚à°¡à°¿', orderOnWA:'à°µà°¾à°Ÿà±à°¸à°¾à°ªà±â€Œà°²à±‹ à°†à°°à±à°¡à°°à±',
    viewAll:'à°…à°¨à±à°¨à±€ â†’', bestSellers:'à°¬à±†à°¸à±à°Ÿà± à°¸à±†à°²à±à°²à°°à±à°¸à±', newArrivals:'à°•à±Šà°¤à±à°¤ à°µà°¸à±à°¤à±à°µà±à°²à±', todaysDeals:'à°¨à±‡à°Ÿà°¿ à°†à°«à°°à±à°²à±',
    categories:'à°µà°°à±à°—à°¾à°² à°ªà±à°°à°•à°¾à°°à°‚ à°•à±Šà°¨à°‚à°¡à°¿', aboutUs:'à°®à°¾ à°—à±à°°à°¿à°‚à°šà°¿', quickLinks:'à°¤à±à°µà°°à°¿à°¤ à°²à°¿à°‚à°•à±à°²à±',
    contactUs:'à°¸à°‚à°ªà±à°°à°¦à°¿à°‚à°šà°‚à°¡à°¿', freeShip:'à°«à±à°°à±€ à°¡à±†à°²à°¿à°µà°°à±€', placeOrder:'à°†à°°à±à°¡à°°à± à°šà±‡à°¯à°‚à°¡à°¿',
    search:'à°šà±€à°°à°²à±, à°«à°¾à°¬à±à°°à°¿à°•à±, à°°à°‚à°—à± à°µà±†à°¤à°•à°‚à°¡à°¿â€¦', all:'à°…à°¨à±à°¨à±€', inStock:'à°¸à±à°Ÿà°¾à°•à±â€Œà°²à±‹ à°‰à°‚à°¦à°¿', outStock:'à°¸à±à°Ÿà°¾à°•à± à°²à±‡à°¦à±',
  },
  kn: {
    home:'à²®à³à²–à²ªà³à²Ÿ', shop:'à²…à²‚à²—à²¡à²¿', cart:'à²¨à²¿à²®à³à²® à²•à²¾à²°à³à²Ÿà³', checkout:'à²šà³†à²•à³à²”à²Ÿà³', myOrders:'à²¨à²¨à³à²¨ à²†à²°à³à²¡à²°à³à²—à²³à³', profile:'à²ªà³à²°à³Šà²«à³ˆà²²à³',
    shopAll:'à²Žà²²à³à²²à²¾ à²¸à³€à²°à³†à²—à²³à³', addToCart:'à²•à²¾à²°à³à²Ÿà³â€Œà²—à³† à²¸à³‡à²°à²¿à²¸à²¿', buyNow:'à²ˆà²— à²–à²°à³€à²¦à²¿à²¸à²¿', orderOnWA:'à²µà²¾à²Ÿà³à²¸à²¾à²ªà³â€Œà²¨à²²à³à²²à²¿ à²†à²°à³à²¡à²°à³',
    viewAll:'à²Žà²²à³à²²à²¾ â†’', bestSellers:'à²…à²¤à³à²¯à³à²¤à³à²¤à²® à²®à²¾à²°à²¾à²Ÿ', newArrivals:'à²¹à³Šà²¸ à²†à²—à²®à²¨', todaysDeals:'à²‡à²‚à²¦à²¿à²¨ à²†à²«à²°à³à²—à²³à³',
    categories:'à²µà²°à³à²—à²—à²³ à²®à³‚à²²à²• à²–à²°à³€à²¦à²¿à²¸à²¿', aboutUs:'à²¨à²®à³à²® à²¬à²—à³à²—à³†', quickLinks:'à²¤à³à²µà²°à²¿à²¤ à²²à²¿à²‚à²•à³à²—à²³à³',
    contactUs:'à²¸à²‚à²ªà²°à³à²•à²¿à²¸à²¿', freeShip:'à²‰à²šà²¿à²¤ à²¡à³†à²²à²¿à²µà²°à²¿', placeOrder:'à²†à²°à³à²¡à²°à³ à²®à²¾à²¡à²¿',
    search:'à²¸à³€à²°à³†à²—à²³à³, à²«à³à²¯à²¾à²¬à³à²°à²¿à²•à³, à²¬à²£à³à²£ à²¹à³à²¡à³à²•à²¿â€¦', all:'à²Žà²²à³à²²à²¾', inStock:'à²¸à³à²Ÿà²¾à²•à³â€Œà²¨à²²à³à²²à²¿à²¦à³†', outStock:'à²¸à³à²Ÿà²¾à²•à³ à²‡à²²à³à²²',
  },
};
let lang = LS.get('sk_lang', 'en');
const t = k => (LANGS[lang] && LANGS[lang][k]) || LANGS.en[k] || k;
function setLang(l){ lang = LANGS[l] ? l : 'en'; LS.set('sk_lang', lang); location.reload(); }
/* ============================ 12. FIRESTORE (ORDERS + REVIEWS only) ============================
   Clean & simple: optional cloud sync for orders & reviews.
   - Never blocks the site â€” everything works locally first.
   - No probe, no reserved IDs, no scary status: badge shows ðŸŸ¢ only when connected.
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
   with LOW write volume â€” so the free Firestore quota never gets burned:
   Â· orders are pushed ONCE (tracked in sk_orders_synced) â€” never re-pushed
   Â· products are pushed ONLY when the admin edits them (saveProducts)
   Â· collections are seeded ONCE per device (sk_seed_done)
   Â· order listeners run only on the pages that display orders (orders/admin) */
function markOrderSynced(id){
  try{
    const s = JSON.parse(localStorage.getItem('sk_orders_synced') || '[]');
    if (!s.includes(id)){ s.push(id); localStorage.setItem('sk_orders_synced', JSON.stringify(s.slice(-300))); }
  }catch(e){}
}
const Sync = {
  _pushPause: 0,   /* timestamp â€” back off after repeated cloud write failures */
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
  /* ---- push the product catalog to Firestore (admin edits only â€” rare) ---- */
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
  /* ---- pull cloud products â†’ local (BOTH show; schema-flexible) ---- */
  /* ðŸ”— pull reseller codes from Firestore so ?ref=CODE works on EVERY device
     (not just the device where the reseller registered) */
  pullResellers(){
    if (!FS.enabled()) return;
    FS._getDb().then(db => {
      if (!db) return;
      db.collection('resellers').get().then(snap => {
        const list = [];
        snap.forEach(x => {
          const d = x.data() || {};
          if (d && d.code) list.push({ code: d.code, name: d.name || '', phone: d.phone || '', orders: +d.orders || 0, margin: +d.margin || 0, date: d.date || Date.now() });
        });
        if (list.length){ setFsResellers(list); }
      }).catch(() => {});
    }).catch(() => {});
  },
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
          if (isSampleId(d.id)) return;   /* never re-add demo products */
          if (d.hidden && !isAdminDevice()) return;   /* ðŸš« hidden products never re-appear for customers */
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
  /* ---- pull cloud â†’ local (merge; local status wins for orders) ---- */
  pullCloud(){
    if (!FS.enabled()) return;
    clearTimeout(this._debounce);
    this._debounce = setTimeout(() => {
      this._pullCloudNow();
    }, 300); /* debounce rapid snapshots â†’ fast loading */
  },
  _pullCloudNow(){
    if (!FS.enabled()) return;
    /* NOTE: cloud ORDERS are handled ONLY by the admin page (runtime fsOrders).
       They are NEVER written into Store.orders / sk_orders, so a customer's
       "My Orders" page can only ever show orders placed on that device. */
    /* products from Firestore â†’ merge into data.js catalog (BOTH show) */
    FS._getDb().then(db => {
      if (!db) return;
      db.collection('products').get().then(snap => {
        const cloud = [];
        snap.forEach(x => {
          const d = x.data() || {};
          d.id = d.id || d.sku || x.id;          /* use Firestore doc id as fallback */
          if (d.status && String(d.status).toLowerCase() !== 'active') return; /* only Active */
          if (isSampleId(d.id)) return;   /* never re-add demo products */
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
    this.pullResellers();          /* ðŸ”— reseller codes known on every device */
    let pg = '';
    try{ pg = (document.body && document.body.dataset.page) || ''; }catch(e){}
    if (pg === 'admin'){
      this.pullCloud();           /* ADMIN ONLY: live orders (everyone's) + products */
    } else {
      this.pullProducts();        /* user pages: only products â€” orders stay DEVICE-LOCAL */
    }
  },
};

/* Manual refresh helper (used by a shop-page button) */
window.refreshCloudProducts = function(){ try{ Sync.pullProducts(); }catch(e){} };

/* ============================ 12c. FIRESTORE COLLECTIONS SETUP ============================
   Creates the full database structure in your Firestore project:
   admins Â· cart Â· categories Â· customers Â· inventory Â· orders Â· products Â·
   promos Â· reviews Â· settings
   Each collection gets a seed document so it exists (and your rules apply). */
const FS_COLLECTIONS = ['admins','cart','categories','counters','customers','inventory','leads','orders','products','promos','reviews','settings'];
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
    /* counters: visitors + orders */
    db.collection('counters').doc('site').set({ visitors: 1, orders: 0, updatedAt: now }, { merge: true }).catch(() => {});
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
      <a class="logo" href="index.html"><span class="logo-badge">${SK_LOGOSVG}</span><span>${CONFIG.storeName}<small>Premium Sarees â€¢ Salem</small></span></a>
      <nav class="desk-nav">
        <a href="index.html" class="${page==='home'?'on':''}">${t('home')}</a>
        <a href="shop.html" class="${page==='shop'?'on':''}">${t('shop')}</a>
        <a href="cart.html" class="${page==='cart'?'on':''}">${t('cart')}</a>
        <a href="orders.html" class="${page==='orders'?'on':''}">${t('myOrders')}</a>
        <a href="profile.html" class="${page==='profile'?'on':''}">${t('profile')}</a>
      </nav>
      <div class="top-actions">
        ${((Store.profile && Store.profile.name) ? '<a class="header-greet" href="profile.html" aria-label="My account"><span class="hg-emoji">ðŸ‘‹</span><span class="hg-name">Hi, <b>' + esc(Store.profile.name.split(' ')[0]) + '</b></span></a>' : '')}
        <a class="icon-btn" href="profile.html" aria-label="Profile"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></a>
        <a class="icon-btn" href="cart.html" aria-label="Cart"><svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1.6"/><circle cx="19" cy="21" r="1.6"/><path d="M2 3h3l2.6 12.4a2 2 0 0 0 2 1.6h8.7a2 2 0 0 0 2-1.6L22 7H6"/></svg><span class="cart-badge" id="cartBadge" hidden>0</span></a>
      </div>
    </div>
  </div>
  <div class="overlay" id="overlay"></div>
  <aside class="drawer" id="drawer">
    <div class="drawer-head"><span class="logo-badge">${SK_LOGOSVG}</span><div><b>${CONFIG.storeName}</b><br><small style="opacity:.85;font-size:.72rem">2/130, Thoothanoor, Edanganasalai, Salem 637502</small></div></div>
    <nav class="drawer-nav" id="drawerNav">
      <a href="index.html">ðŸ  ${t('home')}</a>
      <a href="shop.html">ðŸ›ï¸ ${t('shopAll')}</a>
      <a href="cart.html">ðŸ›’ ${t('cart')}</a>
      <a href="orders.html">ðŸ“¦ ${t('myOrders')}</a>
      <a href="profile.html">ðŸ‘¤ ${t('profile')}</a>
      <div class="sub">${t('shopByCategory')}</div>
      ${CATEGORIES.slice(0, 8).map(c => `<a href="shop.html?cat=${c.slug}">${c.emoji} ${c.name}</a>`).join('')}
      <div class="sub">Help</div>
      <a href="orders.html">ðŸ“¦ ${t('myOrders')}</a>
      <a href="share-earn.html">ðŸ’° Share &amp; Earn</a>
      <a href="blog.html">ðŸ“– Blog</a>
      <a href="return-policy.html">â†©ï¸ Return Policy</a>
      <a href="#" data-faq>â“ FAQ</a>
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
        <div class="foot-pay" style="margin-top:12px"><span>UPI</span><span>GPay</span><span>PhonePe</span><span>Paytm</span><span>COD</span><span>ðŸ”’ Secure</span></div>
        <div class="social-row">
          <a href="${CONFIG.social.instagram}" target="_blank" rel="noopener" aria-label="Instagram">ðŸ“¸</a>
          <a href="${CONFIG.social.facebook}" target="_blank" rel="noopener" aria-label="Facebook">ðŸ‘</a>
          <a href="${CONFIG.social.youtube}" target="_blank" rel="noopener" aria-label="YouTube">â–¶ï¸</a>
          <a href="${CONFIG.waGroup}" target="_blank" rel="noopener" aria-label="WhatsApp group"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true" style="vertical-align:-2px;margin-right:4px"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></a>
          <a href="${CONFIG.googleReview}" target="_blank" rel="noopener" aria-label="Review us on Google">â­</a>
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
          <a href="#" data-i18n-faq>â“ FAQ</a><br>
          <a href="share-earn.html">ðŸ’° Share &amp; Earn</a><br>
          <a href="blog.html">ðŸ“– Blog</a><br>
          <a href="return-policy.html">â†©ï¸ Return Policy</a><br>
          <a href="aadi-sale.html">ðŸŒ¾ Aadi Sale</a><br>
          <a href="pongal-collection.html">ðŸŒ… Pongal</a><br>
          <a href="diwali-special.html">ðŸª” Diwali</a><br>
          <a href="bulk-wedding.html">ðŸ’ Bulk Wedding</a><br>
          <a href="${CONFIG.waGroup}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true" style="vertical-align:-2px;margin-right:4px"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>Join WhatsApp Group</a>
        </p>
      </div>
      <div class="foot">
        <h4>${t('contactUs')}</h4>
        <ul class="foot-contact">
          <li><span>ðŸ“</span><span>2/130, Thoothanoor,<br>Edanganasalai,<br>Salem â€” 637502,<br>Tamil Nadu</span></li>
          <li><span>ðŸ“ž</span><a href="tel:+917867915699">+91 78679 15699</a></li>
          <li><span><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true" style="vertical-align:-2px;margin-right:4px"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></span><a href="${waLink('Hi! I have a question about your sarees.')}" target="_blank" rel="noopener" style="color:#7be6a4;font-weight:800">Chat on WhatsApp</a></li>
        </ul>
        <p style="font-size:.76rem">â° Order support: 9 AM â€“ 9 PM, all days</p>
      </div>
    </div></div>
    <div class="foot-bottom wrap">Â© 2026 SK Sarees, Salem. All rights reserved. &nbsp;â€¢&nbsp; Made with â¤ï¸ in Tamil Nadu<br><span id="siteStats" style="font-size:.72rem;opacity:.85;margin-top:4px;display:block"></span></div>
  </footer>`;
  const fq = f.querySelector('[data-i18n-faq]');
  if (fq) fq.addEventListener('click', e => { e.preventDefault(); if (typeof window.scrollToFaq === 'function') window.scrollToFaq(); });
}
function openDrawer(){ document.getElementById('drawer').classList.add('show'); document.getElementById('overlay').classList.add('show'); }
function closeDrawer(){ document.getElementById('drawer').classList.remove('show'); document.getElementById('overlay').classList.remove('show'); }
/* ============================ MICROSOFT CLARITY ============================
   Session recordings + heatmaps. Loads once on every page. */
(function(){
  try{
    if (window.__clarityDone) return;
    window.__clarityDone = true;
    /* defensive: only load in real browsers (Clarity needs MessageChannel;
       test runners like jsdom don't have it and would crash) */
    if (typeof window.MessageChannel === 'undefined') return;
    (function(c,l,a,r,i,t,y){
      c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
      t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
      y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "xuykvctr73");
  }catch(e){}
})();

/* ============================ GOOGLE TAG (gtag.js / GA4) ============================
   Loads on EVERY page. Analytics ID: G-J1W5VVY48L
   Replace the ID below if your GA4 property changes. */
(function(){
  try{
    if (window.__gtagDone) return;
    window.__gtagDone = true;
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=G-J1W5VVY48L';
    (document.head || document.documentElement).appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function(){ window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', 'G-J1W5VVY48L');
  }catch(e){}
})();
function gtagSafe(ev, data){
  try{ if (window.gtag) window.gtag('event', ev, data || {}); }catch(e){}
}

/* ============================ META PIXEL (Facebook Ads) ============================
   Loads on EVERY page. Standard events fire automatically:
   PageView (each page) Â· AddToCart Â· InitiateCheckout Â· Purchase
   Replace the Pixel ID below (1017916097675955) with your own if it changes. */
(function(){
  try{
    if (window.__metaPixelDone) return;
    window.__metaPixelDone = true;
    /* load the fbevents script */
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://connect.facebook.net/en_US/fbevents.js';
    (document.head || document.documentElement).appendChild(s);
    /* init */
    window.fbq = window.fbq || function(){ (window.fbq.q = window.fbq.q || []).push(arguments); };
    window.fbq('init', '1017916097675955');
    window.fbq('track', 'PageView');
    /* noscript fallback */
    const img = document.createElement('img');
    img.height = 1; img.width = 1; img.style.display = 'none';
    img.src = 'https://www.facebook.com/tr?id=1017916097675955&ev=PageView&noscript=1';
    (document.body || document.documentElement).appendChild(img);
  }catch(e){}
})();
function fbqSafe(ev, data){
  try{ if (window.fbq) window.fbq('track', ev, data || {}); }catch(e){}
}
function fbqId(id){
  try{
    const p = byId(id);
    return { content_ids: [String(id)], content_name: p ? p.name : id, content_category: p ? (p.cat || '') : '', content_type: 'product' };
  }catch(e){ return { content_ids: [String(id)], content_type: 'product' }; }
}

/* ============================ 15. SEO â€” JSON-LD schema ============================
   Injects structured data on every page (LocalBusiness), product pages
   (Product), and the home page (FAQ + WebSite). Helps Google show rich results. */
function seoInject(){
  try{
    if (document.getElementById('ld-seo')) return;
    const page = (document.body && document.body.dataset.page) || '';
    const base = location.origin + location.pathname.replace(/[^/]*$/, '');
    const ld = [];
    /* ðŸŒ Open Graph + Twitter meta (social sharing cards â€” makes sharing famous) */
    try{
      const ogTitle = document.title || CONFIG.storeName;
      const ogDesc = (document.querySelector('meta[name="description"]') || {}).content || 'Buy sarees online from Salem, Tamil Nadu â€” semi silk, cotton & Kanchipuram styles.';
      const ogImg = base + 'images/hero-banner.jpg';
      const addMeta = (prop, content, isProp) => {
        if (document.querySelector('meta[' + (isProp ? 'property' : 'name') + '="' + prop + '"]')) return;
        const m = document.createElement('meta');
        if (isProp) m.setAttribute('property', prop); else m.setAttribute('name', prop);
        m.setAttribute('content', content);
        document.head.appendChild(m);
      };
      addMeta('og:title', ogTitle, true);
      addMeta('og:description', ogDesc, true);
      addMeta('og:type', 'website', true);
      addMeta('og:url', location.href, true);
      addMeta('og:image', ogImg, true);
      addMeta('og:site_name', CONFIG.storeName, true);
      addMeta('twitter:card', 'summary_large_image', false);
      addMeta('twitter:title', ogTitle, false);
      addMeta('twitter:description', ogDesc, false);
      addMeta('twitter:image', ogImg, false);
    }catch(e){}
    /* LocalBusiness (all pages) */
    ld.push({
      '@context':'https://schema.org','@type':'LocalBusiness','@id': base + '#business',
      name:'SK Sarees', image: base + 'images/hero-banner.jpg',
      url: location.origin + '/', telephone:'+917867915699',
      address:{ '@type':'PostalAddress', streetAddress:'2/130, Thoothanoor, Edanganasalai', addressLocality:'Salem', addressRegion:'Tamil Nadu', postalCode:'637502', addressCountry:'IN' },
      geo:{ '@type':'GeoCoordinates', latitude:11.6694, longitude:78.1408 },
      openingHours:'Mo-Su 09:00-21:00', priceRange:'â‚¹â‚¹',
      sameAs:[ CONFIG.social.instagram, CONFIG.social.facebook, CONFIG.social.youtube, CONFIG.waGroup ],
    });
    /* WebSite + FAQ (home) */
    if (page === 'home'){
      ld.push({ '@context':'https://schema.org','@type':'WebSite', name:CONFIG.storeName, url:location.origin + '/', potentialAction:{ '@type':'SearchAction', target: base + 'shop.html?cat={search_term_string}', 'query-input':'required name=search_term_string' } });
      ld.push({ '@context':'https://schema.org','@type':'FAQPage', mainEntity: FAQ.map(f => ({ '@type':'Question', name:f.q, acceptedAnswer:{ '@type':'Answer', text:f.a } })) });
    }
    /* Product (product pages) */
    if (page === 'product'){
      const id = safeParams().get('id');
      const p = byId(id);
      if (p){
        ld.push({ '@context':'https://schema.org','@type':'Product', name:p.name, image:p.img, sku:p.sku || p.id, brand:{ '@type':'Brand', name:CONFIG.storeName },
          offers:{ '@type':'Offer', priceCurrency:'INR', price:p.price, availability: (p.stock != null && p.stock <= 0) ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock', url: location.href, itemCondition:'https://schema.org/NewCondition' },
          aggregateRating: p.reviews ? { '@type':'AggregateRating', ratingValue:p.rating || 4.5, reviewCount:p.reviews + realReviewCount(p.id) } : undefined });
        /* Breadcrumb */
        const cat = catOf(p.cat);
        ld.push({ '@context':'https://schema.org','@type':'BreadcrumbList', itemListElement:[
          { '@type':'ListItem', position:1, name:'Home', item: location.origin + '/' },
          { '@type':'ListItem', position:2, name: cat ? cat.name : 'Sarees', item: location.origin + '/shop.html' },
          { '@type':'ListItem', position:3, name: p.name, item: location.href },
        ]});
        /* product og:image */
        try{
          const ogi = document.querySelector('meta[property="og:image"]');
          if (ogi && /^https?:/.test(p.img)) ogi.setAttribute('content', p.img);
          else if (ogi) ogi.setAttribute('content', location.origin + '/' + p.img.replace(/^\.?\//, ''));
        }catch(e){}
      }
    }
    const sc = document.createElement('script');
    sc.type = 'application/ld+json'; sc.id = 'ld-seo';
    sc.textContent = JSON.stringify(ld.filter(Boolean));
    document.head.appendChild(sc);
  }catch(e){}
}

/* ðŸ“² PWA install â€” capture the beforeinstallprompt and show an Install button */
let deferredPrompt = null;
function installApp(){
  try{
    if (deferredPrompt){ deferredPrompt.prompt(); deferredPrompt.userChoice.then(() => { deferredPrompt = null; }); return; }
    toast('ðŸ“² Chrome: â‹® menu â†’ Add to Home screen Â· Safari: Share â†’ Add to Home Screen');
  }catch(e){}
}
function showInstallBanner(){
  try{
    if (document.getElementById('installBanner')) return;
    const el = document.createElement('div');
    el.id = 'installBanner';
    el.className = 'install-banner';
    el.innerHTML = '<div><b>ðŸ“² Install SK Sarees App</b><span class="small muted">Open in one tap, like a native app!</span></div>' +
      '<button type="button" class="btn btn-maroon btn-sm" id="installBtn" style="width:auto;min-width:110px">Install</button>' +
      '<button type="button" class="btn btn-ghost btn-sm" id="installX" style="width:auto;min-width:40px">âœ•</button>';
    document.body.appendChild(el);
    setTimeout(() => el.classList.add('show'), 800);
    document.getElementById('installBtn').addEventListener('click', () => { installApp(); });
    document.getElementById('installX').addEventListener('click', () => { el.remove(); try{ localStorage.setItem('sk_install_closed','1'); }catch(e){} });
  }catch(e){}
}

function injectChrome(){
  try{ seoInject(); }catch(e){}
  try{ Stats.init(); renderStatsText(); }catch(e){}
  /* PWA install: capture prompt + show banner once */
  try{
    /* âš¡ show the Install banner ONLY on devices that fire beforeinstallprompt
       (i.e. truly PWA-install-capable: Android Chrome / desktop). iOS/Safari and
       unsupported browsers never get it. */
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      deferredPrompt = e;
      try{ if (!localStorage.getItem('sk_install_closed')) showInstallBanner(); }catch(e2){}
    });
    /* iOS Safari can't fire beforeinstallprompt but CAN add to home screen â€”
       show a tiny hint there instead of the big banner */
    try{
      const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent || '');
      if (isIOS && !window.matchMedia('(display-mode: standalone)').matches && !localStorage.getItem('sk_install_closed')){
        setTimeout(() => {
          if (deferredPrompt || document.getElementById('installBanner')) return;
          showInstallBanner();
        }, 6000);
      }
    }catch(e2){}
  }catch(e){}
  /* register the push service worker (HTTPS only; harmless fallback otherwise) */
  try{
    if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register(repoBase() + 'sw.js').catch(()=>{});
  }catch(e){}
  if (!document.getElementById('siteHeader')){
    const h = document.createElement('div'); h.id = 'siteHeader';
    document.body.insertBefore(h, document.getElementById('app') || document.body.firstChild);
  }
  if (!document.getElementById('siteFooter')){
    const f = document.createElement('div'); f.id = 'siteFooter';
    document.body.appendChild(f);
  }
  /* ðŸ”¥ festival banner auto-updates with the season (Aadi/Pongal/Diwali/Wedding) */
  document.body.insertAdjacentHTML('afterbegin', `<div class="promo-strip"><span>ðŸ”¥ ${festivalName(currentFestival())} Special â€” Up to 40% OFF &nbsp;â€¢&nbsp; ðŸšš ${t('freeShip')} Above â‚¹999 &nbsp;â€¢&nbsp; ðŸ’µ COD Available (+â‚¹${CONFIG.codFee}) &nbsp;â€¢&nbsp; â± Fast Delivery â€” On-Time Promise &nbsp;â€¢&nbsp; âœ… 7-Day Easy Returns</span></div>`);
  renderHeader(); renderFooter();
  try{ renderStatsText(); }catch(e){}   /* fill footer stats after chrome renders */
  document.body.insertAdjacentHTML('beforeend', `
    <div class="wa-bubble" id="waBubble"><b>Need help?</b> Chat with us on WhatsApp â€” we reply in minutes!<div class="caret"></div></div>
    <button class="ai-float" id="aiFloat" type="button" aria-label="SK AI Assistant â€” find your saree" title="SK AI Assistant â€” find your saree"><svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true"><path d="M12 2l2.2 5.8L20 10l-5.8 2.2L12 18l-2.2-5.8L4 10l5.8-2.2L12 2z"/><path d="M19 14l1.1 2.9L23 18l-2.9 1.1L19 22l-1.1-2.9L15 18l2.9-1.1L19 14z" opacity=".75"/></svg></button>
    <a class="wa-float" id="waFloat" href="${waLink('Hi! I have a question about your sarees.')}" target="_blank" rel="noopener" aria-label="Chat on WhatsApp"><svg viewBox="0 0 24 24" width="32" height="32" fill="#fff" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></a>
    <div class="toast" id="toast"></div>
    <div id="modalRoot"></div>`);
  try{ abandonedCartBanner(); }catch(e){}
  if (!LS.get('sk_wa_tip', 0)){
    LS.set('sk_wa_tip', 1);
    setTimeout(() => { const b = document.getElementById('waBubble'); if (b) b.classList.add('show'); }, 2200);
    setTimeout(() => { const b = document.getElementById('waBubble'); if (b) b.classList.remove('show'); }, 9000);
  }
  document.addEventListener('click', e => { const c = e.target.closest('[data-close]'); if (c) closeModal(); });
        }
