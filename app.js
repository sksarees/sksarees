/* ============================================================================
   SK SAREES — app.js (FRESH CLEAN REWRITE)
   Pages: index · shop · product · cart · checkout · orders · profile
   Simple, defensive, no errors. All links are plain <a href> — nothing blocks
   navigation, so every URL works.
   ========================================================================== */
'use strict';

/* ============================ INIT ============================ */
async function init(){
  try{ injectChrome(); }catch(e){ console.warn(e); }
  try{ renderCartBadge(); renderCartBar(); }catch(e){}
  try{ readRef(); }catch(e){}                    /* capture ?ref= reseller from URL */
  try{ Store.orders.forEach(dispatchOrder); Store.saveOrders(); }catch(e){}
  try{ purgeOldOrders(90); }catch(e){}   /* user sees only last 90 days of orders */
  try{ setTimeout(maybeAutoDeliver, 2000); setInterval(maybeAutoDeliver, 30000); }catch(e){}
  try{ Sync.run(); }catch(e){}
  try{ setTimeout(showPriceDrops, 3500); }catch(e){}   /* wishlist price-drop alert */
  /* ⚡ instant: load the static catalog (local file) before first render so
     Firestore product pages appear immediately — no "Loading product…" */
  try{ await preloadCatalog(); }catch(e){}
  const page = document.body.dataset.page;
  try{
    if (page === 'home') renderHome();
    else if (page === 'shop') renderShop();
    else if (page === 'product') renderProduct();
    else if (page === 'cart') renderCartPage();
    else if (page === 'checkout') renderCheckoutPage();
    else if (page === 'orders') renderOrdersPage();
    else if (page === 'profile') renderProfilePage();
  }catch(e){ console.warn('page render error', e); }
  try{ renderStatsText(); }catch(e){}   /* fill hero visitor/order counters after render */
}
document.addEventListener('DOMContentLoaded', init);

/* ============================ SHARED UI ============================ */
function starsHTML(p){
  const r = Math.round(p.rating || 0);
  return '<div class="stars">' + '★'.repeat(r) + '☆'.repeat(5 - r) +
    ' <span>' + (p.rating || 0) + '</span><span class="cnt">(' + (p.reviews + realReviewCount(p.id)) + ' reviews)</span></div>';
}
function cardHTML(p){
  const off = offPct(p);
  const out = (p.stock != null && p.stock <= 0);
  const low = !out && p.stock <= 5;
  const badgeCls = out ? 'red' : p.badge === 'New' ? 'gold' : p.badge === 'Limited Stock' ? 'red' : p.badge === 'Sale' ? 'green' : '';
  return '<article class="pcard">' +
    '<a class="pcard-img" href="product.html?id=' + encodeURIComponent(p.id) + '">' +
      '<img src="' + esc(p.img) + '" alt="' + esc(p.name) + '" loading="lazy" decoding="async" width="800" height="600">' +
      (out ? '<span class="badge red">Out of Stock</span>' : (p.badge ? '<span class="badge ' + badgeCls + '">' + esc(p.badge) + '</span>' : '')) +
      (off && !out ? '<span class="offchip">-' + off + '%</span>' : '') +
      '<span class="card-heart' + (Store.wish.includes(p.id) ? ' on' : '') + '" data-wish="' + p.id + '" role="button" aria-label="Save to wishlist" title="Save to wishlist">' + (Store.wish.includes(p.id) ? '❤️' : '🤍') + '</span>' +
    '</a>' +
    '<div class="pcard-body">' +
      '<h3><a href="product.html?id=' + encodeURIComponent(p.id) + '">' + esc(p.name) + '</a></h3>' +
      starsHTML(p) +
      '<div class="price-row"><b>' + money(p.price) + '</b>' + (p.mrp ? '<s>' + money(p.mrp) + '</s>' : '') + (off && !out ? '<span class="off">' + off + '% OFF</span>' : '') + '</div>' +
      (low ? '<div class="lowchip">🔥 Only <b>' + p.stock + '</b> left — order soon!</div>' : (out ? '<div class="lowchip out">😞 Out of stock — ask on WhatsApp for next batch</div>' : '')) +
      '<div class="p-actions">' +
        (out
          ? '<button type="button" class="btn" disabled style="opacity:.55">Out of Stock</button>'
          : '<button type="button" class="btn btn-outline" data-add="' + p.id + '">Add to Cart</button>') +
        '<a class="btn btn-wa" href="' + waLink(waProductMsg(p)) + '" target="_blank" rel="noopener" aria-label="Order on WhatsApp"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true" style="vertical-align:-2px;margin-right:4px"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></a>' +
      '</div>' +
    '</div></article>';
}

/* ============================ URGENCY + REVIEW (orders-boosters) ============================ */
/* 🔥 festival countdown — deadline = current festival end (auto from date) */
function festivalDeadline(){
  const d = new Date();
  const m = d.getMonth() + 1, day = d.getDate();
  const cur = currentFestival();
  if (cur === 'aadi')     return new Date(d.getFullYear(), 7, 17);          /* 17 Aug */
  if (cur === 'pongal')   return new Date(d.getFullYear(), 0, 20);          /* 20 Jan */
  if (cur === 'diwali')   return new Date(d.getFullYear(), 10, 15);         /* 15 Nov */
  return new Date(d.getFullYear(), 11, 31);                                 /* wedding: year end */
}
function festivalCountdown(){
  try{
    const el = document.getElementById('flashTimer'); if (!el) return;
    const end = festivalDeadline();
    if (isNaN(end.getTime())) return;
    const tick = () => {
      const diff = end.getTime() - Date.now();
      if (diff <= 0){ el.textContent = '🎉 Offer ending today — order now!'; return; }
      const dd = Math.floor(diff / 864e5), hh = Math.floor(diff / 36e5) % 24, mm = Math.floor(diff / 6e4) % 60, ss = Math.floor(diff / 1e3) % 60;
      const p2 = n => String(n).padStart(2, '0');
      el.innerHTML = '<b>' + dd + '</b>d <b>' + p2(hh) + '</b>h <b>' + p2(mm) + '</b>m <b>' + p2(ss) + '</b>s';
    };
    tick(); setInterval(tick, 1000);
  }catch(e){}
}
/* ⭐ after placing an order — ask for a Google review via WhatsApp */
function askReviewWhatsApp(o){
  try{
    const msg = '🪡 Hi! Thank you for your order ' + (o && o.id || '') + ' from SK Sarees! 🎉\n\nDid you love your saree? Please take 30 seconds to review us on Google — it helps our small store grow so much! 🙏\n\n⭐ ' + CONFIG.googleReview;
    return waLink(msg);
  }catch(e){ return CONFIG.googleReview; }
}

/* 🔥 Deal of the Day — auto-picks the product with the biggest discount (rotates daily) */
function dealOfDayHTML(){
  try{
    const candidates = PRODUCTS.filter(p => p.stock != null && p.stock > 0 && offPct(p) >= 20);
    if (!candidates.length) return '';
    /* rotate by day so it changes daily */
    const day = Math.floor(Date.now() / 864e5);
    const deal = candidates[day % candidates.length];
    const off = offPct(deal);
    return '<div class="deal-day"><div class="dd-left"><span class="dd-badge">🔥 DEAL OF THE DAY</span>' +
      '<h3>' + esc(deal.name) + '</h3>' +
      '<div class="price-row"><b>' + money(deal.price) + '</b>' + (deal.mrp ? '<s>' + money(deal.mrp) + '</s>' : '') + (off ? '<span class="off">' + off + '% OFF</span>' : '') + '</div>' +
      '<a class="btn btn-maroon btn-sm" style="width:auto;min-width:170px" href="product.html?id=' + encodeURIComponent(deal.id) + '">🛒 Grab It Now</a></div>' +
      '<a class="dd-img" href="product.html?id=' + encodeURIComponent(deal.id) + '"><img src="' + esc(deal.img) + '" alt="' + esc(deal.name) + '" loading="lazy"></a></div>';
  }catch(e){ return ''; }
}

/* ============================ HOME ============================ */
function renderHome(){
  const app = document.getElementById('app'); if (!app) return;
  const best = PRODUCTS.filter(p => p.badge === 'Bestseller').slice(0, 4);
  const fresh = PRODUCTS.filter(p => p.badge === 'New').slice(0, 4);
  const deals = PRODUCTS.filter(p => offPct(p) >= 35).slice(0, 4);
  app.innerHTML =
    '<section class="hero"><img class="hero-bg" src="images/hero-banner.jpg" alt="SK Sarees collection" loading="eager" decoding="async" width="1200" height="600"><div class="hero-in">' +
      '<span class="hero-chip">🔥 ' + (lang === 'ta' ? 'ஆடி திருவிழா சலுகை — 40% வரை தள்ளுபடி' : 'Aadi Festival Sale — Up to 40% OFF') + '</span>' +
      '<h1>' + (lang === 'ta' ? t('heroTitle1') + ',<br><span class="gold">' + t('heroTitle2') + '</span>' : 'Beautiful Sarees,<br><span class="gold">Delivered to Your Doorstep</span>') + '</h1>' +
      '<p>' + (lang === 'ta' ? t('heroSub') : 'Authentic Kanchipuram silk, soft cotton &amp; wedding sarees. Order in 2 minutes — pay by UPI or Cash on Delivery.') + '</p>' +
      '<div class="hero-ctas">' +
        '<a class="btn btn-gold" href="shop.html">🛍️ ' + (lang === 'ta' ? t('shopBest') : 'Shop Best Sellers') + '</a>' +
        '<a class="btn btn-wa" href="' + waLink('Hi! I would like to see your saree collection & current offers.') + '" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true" style="vertical-align:-2px;margin-right:4px"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>Order on WhatsApp</a>' +
      '</div>' +
      '<div class="hero-trust"><span>⭐ <b>2,300+</b> Happy Customers</span><span>👥 <b id="statV">0</b> Visitors</span><span>📦 <b id="statO">0</b> Orders</span><span>🚚 <b>Free</b> above ₹999</span></div>' +
      '<form class="hero-search" onsubmit="event.preventDefault(); const q=document.getElementById(\'heroQ\').value.trim(); if(q) location.href=\'shop.html?q=\'+encodeURIComponent(q);"><input id="heroQ" type="search" placeholder="🔍 ' + (lang === 'ta' ? t('searchHero') : 'Search by saree name, SKU or colour…') + '" autocomplete="off"><button type="submit" class="btn btn-gold">' + (lang === 'ta' ? t('search') : 'Search') + '</button></form>' +
    '</div></section>' +
    '<section class="flash" id="flashSec"><div><h3>⚡ ' + (lang === 'ta' ? 'இன்றைய சிறப்பு சலுகை' : 'Flash Sale — Today Only') + '</h3><p>' + (lang === 'ta' ? 'தேர்ந்தெடுத்த சேலைகளில் 40% வரை தள்ளுபடி — சீக்கிரம் வாங்குங்கள்!' : 'Up to 40% OFF on selected sarees. Hurry, stock is limited!') + '</p></div><div class="flash-timer" id="flashTimer"></div></section>' +
    dealOfDayHTML() +
    recentViewHTML() +
    '<div class="wrap" style="margin-top:14px"><section class="reseller-banner">' +
      '<div class="rb-left"><span class="rb-emoji">💰</span><div><b>Share &amp; Earn — Reseller Program</b>' +
      '<p class="small">Share sarees, earn <b>₹' + (CONFIG.resellerMargin || 50) + '</b> margin on every sale. Your customers get <b>₹50 off</b> with coupon <b>' + esc(CONFIG.resellerCoupon) + '</b>!</p></div></div>' +
      '<div class="rb-btns"><a class="btn btn-gold btn-sm" style="width:auto;min-width:160px" href="share-earn.html">🚀 Start Earning</a>' +
      '<a class="btn btn-outline btn-sm" style="width:auto;min-width:160px;background:#fff" href="shop.html">🛍️ Shop &amp; Use ' + esc(CONFIG.resellerCoupon) + '</a></div>' +
    '</section></div>' +
    '<div class="wrap">' +
      '<section class="sec"><div class="sec-head"><h2><span class="tick"></span>' + (lang === 'ta' ? t('categories') : 'Shop by Category') + '</h2><a href="shop.html">' + t('viewAll') + '</a></div>' +
        '<div class="cat-grid">' + CATEGORIES.slice(0, 12).map(c => {
          const count = PRODUCTS.filter(p => p.cat === c.slug).length;
          return '<a class="cat-tile ' + c.cls + '" href="shop.html?cat=' + c.slug + '">' +
            '<img class="ct-img" src="' + catImage(c.slug) + '" alt="' + esc(c.name) + '" loading="lazy">' +
            '<div class="ct-over"><span class="ct-name">' + c.name + ' <span>' + c.emoji + '</span></span>' +
            '<span class="ct-count">' + count + ' designs • ' + c.blurb + '</span></div></a>';
        }).join('') + '</div></section>' +
      '<section class="sec"><div class="sec-head"><h2><span class="tick"></span>⭐ ' + (lang === 'ta' ? t('bestSellers') : 'Best Sellers') + '</h2><a href="shop.html">' + t('viewAll') + '</a></div>' +
        '<div class="prow">' + best.map(cardHTML).join('') + '</div></section>' +
      '<section class="sec"><div class="sec-head"><h2><span class="tick"></span>✨ ' + (lang === 'ta' ? t('newIn') : 'New Arrivals') + '</h2><a href="shop.html">' + t('viewAll') + '</a></div>' +
        '<div class="prow">' + fresh.map(cardHTML).join('') + '</div></section>' +
      '<section class="sec"><div class="sec-head"><h2><span class="tick"></span>🔥 ' + (lang === 'ta' ? t('deals') : 'Today\'s Deals') + '</h2><a href="shop.html">' + t('viewAll') + '</a></div>' +
        '<div class="prow">' + deals.map(cardHTML).join('') + '</div></section>' +
      '<section class="sec"><div class="sec-head"><h2><span class="tick"></span>🎬 Video Catalog</h2>' +
        '<a href="' + esc(CONFIG.social.youtube) + '" target="_blank" rel="noopener">Watch on YouTube →</a></div>' +
        '<div class="video-grid">' + CONFIG.videos.map(v =>
          '<div class="video-card"><div class="video-frame"><iframe src="https://www.youtube.com/embed/' + esc(v.id) + '?rel=0" title="' + esc(v.title) + '" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>' +
          '<b>' + esc(v.title) + '</b></div>').join('') + '</div></section>' +
      '<section class="sec"><div class="sec-head"><h2><span class="tick"></span>📅 Festival Calendar & Early Access</h2>' +
        '<a href="' + esc(CONFIG.waGroup) + '" target="_blank" rel="noopener">Join WhatsApp Group →</a></div>' +
        '<div class="fest-grid">' + FESTIVALS.map(f =>
          '<a class="fest-tile' + (currentFestival() === f.slug ? ' fest-live' : '') + '" href="shop.html?cat=' + f.slug + '"><span class="fest-emoji">' + f.emoji + '</span>' +
          '<b>' + esc(f.name) + '</b><small>' + esc(festivalTag(f.slug)) + '</small><span class="fest-blurb">' + esc(f.blurb) + '</span></a>'
        ).join('') +
        '<a class="fest-tile fest-early" href="' + esc(CONFIG.waGroup) + '" target="_blank" rel="noopener">' +
          '<span class="fest-emoji">🔔</span><b>Early Access</b><small>WhatsApp group</small><span class="fest-blurb">Members get new festival collections first + exclusive offers.</span></a>' +
        '</div></section>' +
      '<section class="sec"><div class="sec-head"><h2><span class="tick"></span>💬 ' + (lang === 'ta' ? t('reviews') : 'What Our Customers Say') + '</h2></div>' +
        '<div class="rev-grid">' + REVIEWS.map(r =>
          '<div class="rev"><div class="rev-top"><span class="avatar" style="background:' + r.avatar + '">' + esc(r.name[0]) + '</span>' +
          '<div><b>' + esc(r.name) + '</b><small>' + esc(r.place) + ' • Customer review ⭐</small></div></div>' +
          '<div class="stars">' + '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating) + '</div><p>' + esc(r.text) + '</p></div>'
        ).join('') + '</div>' +
        '<div style="text-align:center;margin-top:16px"><a class="btn btn-outline" style="max-width:320px;margin:0 auto" href="' + esc(CONFIG.googleReview) + '" target="_blank" rel="noopener">⭐ Rate us on Google — share your experience!</a></div>' +
        '</section>' +
      '<section class="sec"><div class="sec-head"><h2><span class="tick"></span>⭐ Google Reviews</h2>' +
        '<a href="' + esc(CONFIG.googleReview) + '" target="_blank" rel="noopener">See all reviews →</a></div>' +
        '<div class="google-rev-box"><div style="text-align:center;padding:10px">' +
        '<div style="font-size:1.6rem">⭐⭐⭐⭐⭐</div><b style="font-size:1.1rem">Rated on Google</b>' +
        '<p class="small muted" style="margin:6px 0 10px">Real customer reviews on our Google Business Profile — 2/130, Thoothanoor, Edanganasalai, Salem 637502.</p>' +
        '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">' +
        '<a class="btn btn-maroon btn-sm" style="width:auto;min-width:180px" href="' + esc(CONFIG.googleReview) + '" target="_blank" rel="noopener">⭐ Write a Review</a>' +
        '<button type="button" class="btn btn-outline btn-sm" id="showMapBtn" style="width:auto;min-width:180px">📍 Show Store on Map</button>' +
        '</div><div id="gmapBox" style="margin-top:10px;display:none"></div></div></div></section>' +
      '<section class="sec faq"><div class="sec-head"><h2><span class="tick"></span>❓ ' + (lang === 'ta' ? t('faq') : 'FAQ') + '</h2></div>' +
        FAQ.map(f => '<details><summary>' + esc(f.q) + '</summary><p>' + esc(f.a) + '</p></details>').join('') + '</section>' +
    '</div>';
  try{ renderStatsText(); }catch(e){}   /* hero counters */
  /* 🔥 festival countdown — urgency drives orders */
  try{ festivalCountdown(); }catch(e){}
  /* Google map loads only when the user taps "Show Store on Map" (fast + light) */
  try{
    const mb = document.getElementById('showMapBtn');
    if (mb) mb.addEventListener('click', () => {
      const box = document.getElementById('gmapBox');
      if (!box) return;
      if (!box.innerHTML){
        box.innerHTML = '<iframe src="https://maps.google.com/maps?q=SK%20Sarees%20Edanganasalai%20Salem&t=&z=13&ie=UTF8&iwloc=&output=embed" title="SK Sarees on Google Maps" loading="lazy" style="border:0;width:100%;height:260px;border-radius:14px"></iframe>';
      }
      box.style.display = 'block';
      mb.textContent = '📍 Hide Map';
      mb.classList.toggle('on', box.style.display === 'block');
    });
  }catch(e){}
}

/* ============================ SHOP ============================ */
let shopState = { cat: '', q: '', fabric: '', max: 3000, sort: 'newest', shown: 12, list: [] };
function renderShop(){
  const app = document.getElementById('app'); if (!app) return;
  const params = new URLSearchParams(location.search);
  const cq = params.get('cat');
  if (cq && CATEGORIES.some(c => c.slug === cq)) shopState.cat = cq;  /* ignore unknown/festival slugs */
  const sq = params.get('q');
  if (sq) shopState.q = sq;                     /* search by name/SKU/colour from index */
  app.innerHTML =
    '<div class="wrap page">' +
      '<h1>🛍️ Shop All Sarees</h1>' +
      '<div style="display:flex;gap:8px">' +
        '<input id="shopSearch" type="search" placeholder="🔍 Search sarees, fabric, colour…" style="flex:1;width:100%;border:1.5px solid var(--line);border-radius:12px;padding:13px 14px;background:#fff;outline:none">' +
      '</div>' +
      '<div class="cat-chips" id="catChips" style="margin-top:12px"></div>' +
      '<div class="pd-block" style="margin-top:12px"><div style="display:grid;gap:10px;grid-template-columns:1fr">' +
        '<div><label class="small muted" style="font-weight:800;display:block;margin-bottom:4px">Fabric</label>' +
        '<select id="fFilter" style="width:100%;border:1.5px solid var(--line);border-radius:10px;padding:11px 12px;background:#fff"><option value="">All fabrics</option><option>Silk</option><option>Cotton</option><option>Georgette</option><option>Linen</option><option>Organza</option><option>Net</option></select></div>' +
        '<div><label class="small muted" style="font-weight:800;display:block;margin-bottom:4px">Max Price — <span id="priceLbl">₹3,000</span></label>' +
        '<input type="range" id="pFilter" min="299" max="3000" step="100" value="3000" style="width:100%;accent-color:var(--maroon)"></div>' +
        '<div><label class="small muted" style="font-weight:800;display:block;margin-bottom:4px">Sort</label>' +
        '<select id="sFilter" style="width:100%;border:1.5px solid var(--line);border-radius:10px;padding:11px 12px;background:#fff">' +
        '<option value="newest">Newest</option><option value="bestselling">Best Selling</option><option value="popular">Popularity</option>' +
        '<option value="price-asc">Price: Low → High</option><option value="price-desc">Price: High → Low</option><option value="discount">Biggest Discount</option></select></div>' +
      '</div></div>' +
      '<p class="small muted" id="countLbl" style="margin:12px 0 6px"></p>' +
      '<div class="prow" id="grid"></div>' +
      '<div style="text-align:center;margin-top:10px"><button type="button" class="btn btn-outline" id="loadMore" style="width:auto;min-width:200px">Load More ↓</button></div>' +
      '<div id="shopSentinel" style="height:1px"></div>' +
      '<div class="empty" id="empty" style="display:none"><div class="e-ic">🪡</div><b>No sarees found</b>Try clearing filters.</div>' +
    '</div>';
  drawChips();
  bindShop();
  updateShopList();
}
function drawChips(){
  const chips = document.getElementById('catChips'); if (!chips) return;
  chips.innerHTML = '<button type="button" class="chip' + (!shopState.cat ? ' on' : '') + '" data-cat="">All</button>' +
    CATEGORIES.map(c => '<button type="button" class="chip' + (shopState.cat === c.slug ? ' on' : '') + '" data-cat="' + c.slug + '">' + c.emoji + ' ' + c.name + '</button>').join('');
}
function bindShop(){
  const el = (id) => document.getElementById(id);
  if (el('shopSearch')){
    el('shopSearch').value = shopState.q || '';
    el('shopSearch').addEventListener('input', e => { shopState.q = e.target.value; shopState.shown = 12; updateShopList(); });
  }
  if (el('fFilter')) el('fFilter').addEventListener('change', e => { shopState.fabric = e.target.value; shopState.shown = 12; updateShopList(); });
  if (el('pFilter')) el('pFilter').addEventListener('input', e => { shopState.max = +e.target.value; if (el('priceLbl')) el('priceLbl').textContent = money(shopState.max); shopState.shown = 12; updateShopList(); });
  if (el('sFilter')) el('sFilter').addEventListener('change', e => { shopState.sort = e.target.value; shopState.shown = 12; updateShopList(); });
  if (el('catChips')) el('catChips').addEventListener('click', e => {
    const b = e.target.closest('[data-cat]'); if (!b) return;
    shopState.cat = b.dataset.cat; shopState.shown = 12; drawChips(); updateShopList();
  });
  if (el('loadMore')) el('loadMore').addEventListener('click', () => { shopState.shown += 12; updateShopList(); });
  /* infinite scroll: auto-load when the sentinel becomes visible */
  const sentinel = el('shopSentinel');
  if (sentinel && 'IntersectionObserver' in window){
    const io = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && shopState.shown < shopState.list.length){
        shopState.shown += 12; updateShopList();
      }
    }, { rootMargin: '300px' });
    io.observe(sentinel);
  }
}
function shopList(){
  let l = PRODUCTS.filter(p =>
    (!shopState.cat || p.cat === shopState.cat) &&
    (!shopState.q || (p.name + ' ' + p.fabric + ' ' + p.color + ' ' + (p.sku || '')).toLowerCase().includes(shopState.q.toLowerCase())) &&
    (!shopState.fabric || p.fabric.toLowerCase().includes(shopState.fabric.toLowerCase())) &&
    p.price <= shopState.max);
  switch (shopState.sort){
    case 'price-asc': l = l.slice().sort((a, b) => a.price - b.price); break;
    case 'price-desc': l = l.slice().sort((a, b) => b.price - a.price); break;
    case 'discount': l = l.slice().sort((a, b) => offPct(b) - offPct(a)); break;
    case 'bestselling': l = l.slice().sort((a, b) => b.reviews - a.reviews); break;
    case 'popular': l = l.slice().sort((a, b) => b.rating - a.rating); break;
  }
  return l;
}
function updateShopList(){
  shopState.list = shopList();
  const grid = document.getElementById('grid'); if (!grid) return;
  const visible = shopState.list.slice(0, shopState.shown);
  grid.innerHTML = visible.map(cardHTML).join('');
  const cl = document.getElementById('countLbl'); if (cl) cl.textContent = shopState.list.length + ' sarees';
  const empty = document.getElementById('empty'); if (empty) empty.style.display = visible.length ? 'none' : 'block';
  const lm = document.getElementById('loadMore'); if (lm) lm.style.display = shopState.shown < shopState.list.length ? 'inline-flex' : 'none';
}

/* ============================ TRUST + ENGAGEMENT HELPERS ============================ */
/* 🔥 social proof: deterministic "bought today" number from product data */
function socialProofHTML(p){
  try{
    let n = 12 + ((p.reviews || 0) % 23) + ((p.id || '').length % 5);
    if (p.badge === 'Bestseller') n += 8;
    const seen = localStorage.getItem('sk_seen_' + p.id);
    if (seen) n = Math.max(n, +seen);
    else localStorage.setItem('sk_seen_' + p.id, String(n));
    return '<span class="sp-ico">🔥</span> <b>' + n + ' people bought this today</b> &nbsp;•&nbsp; <span class="sp-ico">⭐</span> ' + (p.rating || 4.5) + '/5 rated';
  }catch(e){ return ''; }
}
/* 📏 blouse size guide (saree-specific — reduces returns) */
function blouseGuideHTML(){
  return '<details class="size-guide"><summary>📏 Blouse Size Guide — how to choose</summary>' +
    '<div class="size-table"><table><thead><tr><th>Blouse size</th><th>Bust (inches)</th><th>Waist (inches)</th></tr></thead><tbody>' +
    '<tr><td>XS</td><td>30–32</td><td>24–26</td></tr>' +
    '<tr><td>S</td><td>33–34</td><td>27–28</td></tr>' +
    '<tr><td>M</td><td>35–36</td><td>29–30</td></tr>' +
    '<tr><td>L</td><td>37–38</td><td>31–32</td></tr>' +
    '<tr><td>XL</td><td>39–40</td><td>33–34</td></tr>' +
    '<tr><td>XXL</td><td>41–42</td><td>35–36</td></tr>' +
    '</tbody></table></div>' +
    '<p class="small muted" style="margin-top:6px">💡 Tip: measure around the fullest part of your bust. Saree length is 6.3m + blouse piece (1.5m) — fits heights 4\'10" to 5\'10" easily. Not sure? Ask us on WhatsApp — we will help you pick!</p></details>';
}
/* 👀 recently viewed (feeds repeat engagement) */
function trackRecentView(p){
  try{
    if (!p) return;
    let rv = JSON.parse(localStorage.getItem('sk_recent') || '[]');
    rv = rv.filter(x => x !== p.id);
    rv.unshift(p.id);
    localStorage.setItem('sk_recent', JSON.stringify(rv.slice(0, 12)));
  }catch(e){}
}
function recentViewHTML(){
  try{
    const rv = JSON.parse(localStorage.getItem('sk_recent') || '[]').slice(1, 7); /* skip current */
    const prods = rv.map(byId).filter(Boolean);
    if (prods.length < 2) return '';
    return '<section class="sec"><div class="sec-head"><h2><span class="tick"></span>👀 Recently Viewed</h2></div>' +
      '<div class="prow">' + prods.map(cardHTML).join('') + '</div></section>';
  }catch(e){ return ''; }
}

/* ============================ PRODUCT ============================ */
function renderProduct(){
  const app = document.getElementById('app'); if (!app) return;
  const id = new URLSearchParams(location.search).get('id');
  let p = byId(id);
  if (!p){
    /* Instant path: if a cached copy exists in the raw cloud cache, use it NOW
       (no spinner, no waiting) — the catalog cache is merged at startup, this is
       a fallback for edge cases. */
    try{
      const raw = JSON.parse(localStorage.getItem('sk_products_cloud') || '[]');
      const hit = raw.find(x => String(x.id || x.sku) === String(id));
      if (hit){
        const np = normalizeProduct(hit);
        if (!PRODUCTS.some(x => x.id === np.id)) PRODUCTS.unshift(np);
        p = np;
      }
    }catch(e){}
  }
  if (!p){
    /* Not cached at all — fetch from Firestore fast (pull + one-time get in parallel).
       The product may exist in the cloud. */
    window.__pdTry = (window.__pdTry || 0) + 1;
    let done = false;
    const finish = (prod, msg) => {
      if (done) return; done = true;
      if (prod){
        try{ PRODUCTS.unshift(prod); Sync.saveLocal(); }catch(e){ try{ PRODUCTS.unshift(prod); }catch(e2){} }
        renderProduct();
      } else {
        app.innerHTML = '<div class="wrap"><div class="empty"><div class="e-ic">🪡</div><b>Product not found</b>' +
          '<span class="muted small" style="max-width:40ch">' + esc(msg || 'We could not find this saree in our collection.') + '</span>' +
          '<div style="display:grid;gap:8px;grid-template-columns:1fr 1fr;max-width:340px;margin:14px auto 0">' +
          '<a class="btn btn-maroon" href="shop.html">🛍️ Back to Shop</a>' +
          '<button type="button" class="btn btn-outline" onclick="renderProduct()">🔄 Try Again</button></div></div></div>';
      }
    };
    /* quick spinner while we fetch (usually <1s) */
    app.innerHTML = '<div class="wrap"><div class="empty"><div class="e-ic"><div class="spinner"></div></div><b>Loading product…</b></div></div>';
    /* ⚡ instant path 2: static catalog.json (local file — near-instant) */
    preloadCatalog().then(() => {
      if (done) return;
      const now = byId(id);
      if (now){ finish(now); }
    });
    if (FS.enabled()){
      /* 1) pull all active Firestore products first (also re-renders when done) */
      try{ Sync.pullProducts(); }catch(e){}
      /* 2) one-time get by id/sku */
      FS.getProduct(id).then(doc => {
        if (doc){
          try{ finish(normalizeProduct(doc)); }
          catch(err){ finish(null); }
        } else {
          /* retry a couple of times before giving up (slow cloud) */
          if (window.__pdTry < 3){
            setTimeout(() => { if (!done) renderProduct(); }, 600);
          } else {
            finish(null, 'This saree may have been removed from the store, or the link is old. Browse our full collection below.');
          }
        }
      }).catch(() => {
        if (window.__pdTry < 3){ setTimeout(() => { if (!done) renderProduct(); }, 600); }
        else finish(null, 'Cloud sync is not responding right now — please check your internet and try again.');
      });
      /* safety: never leave the spinner hanging */
      setTimeout(() => finish(null, 'Cloud sync is not responding right now — please check your internet and try again.'), 6000);
    } else {
      finish(null, 'This saree may have been removed from the store, or the link is old. Browse our full collection below.');
    }
    return;
  }
  window.__pdTry = 0;
  const off = offPct(p), cat = catOf(p.cat);
  const eta = deliveryEstimate();
  try{ if (window.REC) REC.trackView(p.id); }catch(e){}
  const related = PRODUCTS.filter(x => x.cat === p.cat && x.id !== p.id).slice(0, 4);
  const userRevs = LS.get('sk_reviews_' + p.id, []);
  const revs = userRevs.length
    ? userRevs.slice().reverse().map(r => '<div class="rev" style="margin-bottom:8px"><div class="rev-top"><span class="avatar" style="background:#8f1d3a">' + esc((r.name || 'A')[0]) + '</span><div><b>' + esc(r.name) + '</b><small>Customer review ⭐</small></div></div><div class="stars">' + '★'.repeat(r.rating || 5) + '☆'.repeat(5 - (r.rating || 5)) + '</div><p>' + esc(r.text) + '</p></div>').join('')
    : '<p class="muted small">No customer reviews yet — be the first! 💬</p>';
  /* gallery: main image (big) + thumbnails (from Firestore images/imgs + main img) */
  const gal = [];
  try{
    (p.images || []).forEach(u => { const c = cleanImg(u); if (c) gal.push(c); });
    (p.imgs || []).forEach(u => { const c = cleanImg(u); if (c) gal.push(c); });
    const main = cleanImg(p.img || p.image);
    if (main) gal.unshift(main);
  }catch(e){ try{ gal.push(cleanImg(p.img)); }catch(e2){} }
  const uniq = []; gal.forEach(u => { if (u && uniq.indexOf(u) === -1) uniq.push(u); });
  const gallery = uniq.length ? uniq : [img('printed-cotton.jpg')];
  const liked = Store.wish.includes(p.id);
  const out = p.stock != null && p.stock <= 0;
  const low = !out && p.stock <= 5;
  const thumbs = gallery.map((u, i) => '<button type="button" class="pd-thumb' + (i === 0 ? ' on' : '') + '" data-thumb="' + i + '" aria-label="Photo ' + (i + 1) + '"><img src="' + esc(u) + '" alt="" loading="lazy"></button>').join('');
  const vidBlock = p.video
    ? '<div class="pd-video"><h3>🎬 Product Video</h3><div class="video-frame"><iframe src="https://www.youtube.com/embed/' + esc(p.video) + '?rel=0" title="Product video" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div></div>'
    : '';
  app.innerHTML =
    '<div class="wrap pd-wrap" style="margin-top:12px">' +
      '<div>' +
        '<div class="pd-gal">' +
          '<div class="pd-heart"><button type="button" class="heart-btn' + (liked ? ' on' : '') + '" data-wish="' + p.id + '" aria-label="Save to wishlist" title="Save to wishlist">' + (liked ? '❤️' : '🤍') + '</button></div>' +
          '<div class="main" id="pdMain"><img id="pdMainImg" src="' + esc(gallery[0]) + '" alt="' + esc(p.name) + '" fetchpriority="high" decoding="async"></div>' +
          '<div class="pd-swipe-hint">👈 👉 swipe to see all photos</div>' +
          '<div class="pd-thumbs">' + thumbs + '</div>' +
        '</div>' +
        vidBlock +
        '<div class="pd-block" style="margin-top:12px"><h3>🔍 Fabric &amp; Details</h3><table>' +
          '<tr><td>Fabric</td><td>' + esc(p.fabric) + '</td></tr>' +
          '<tr><td>Colour</td><td>' + esc(p.color) + '</td></tr>' +
          '<tr><td>Border</td><td>' + esc(p.border) + '</td></tr>' +
          '<tr><td>Blouse</td><td>' + esc(p.blouse) + '</td></tr>' +
          '<tr><td>Length / Weight</td><td>' + esc(p.length) + ' • ' + esc(p.weight) + '</td></tr>' +
          '<tr><td>Wash care</td><td>' + esc(p.wash) + '</td></tr>' +
          '<tr><td>SKU</td><td>' + esc(p.sku || p.id) + '</td></tr>' +
          '<tr><td>Stock</td><td>' + (p.stock > 0 ? (p.stock <= 5 ? '<span style="color:var(--red)">Only ' + p.stock + ' left!</span>' : p.stock + ' in stock') : 'Out of stock') + '</td></tr>' +
        '</table><p style="margin-top:8px">' + esc(p.desc) + '</p></div>' +
      '</div>' +
      '<div class="pd-info">' +
        '<span class="pd-cat">' + (cat ? cat.emoji + ' ' + esc(cat.name) : '') + '</span>' +
        '<h1>' + esc(p.name) + '</h1>' +
        starsHTML(p) +
        '<div class="pd-price"><b>' + money(p.price) + '</b>' + (p.mrp ? '<s>' + money(p.mrp) + '</s>' : '') + (off && !out ? '<span class="off">' + off + '% OFF</span>' : '') + '</div>' +
        '<div class="social-proof">' + socialProofHTML(p) + '</div>' +
        (out
          ? '<div class="lowchip out" style="margin:6px 0">😞 <b>Out of stock</b> — ask us on WhatsApp, next batch arriving soon!</div>'
          : low
            ? '<div class="lowchip" style="margin:6px 0">🔥 <b>Only ' + p.stock + ' left</b> — order soon, stock is limited!</div>'
            : '') +
        '<p class="muted small">MRP incl. all taxes • ₹999+ free shipping</p>' +
        '<div class="pd-chips"><span class="pd-chip">🚚 Fast Delivery</span><span class="pd-chip">💵 COD (+₹' + CONFIG.codFee + ')</span><span class="pd-chip">↩️ 7-Day Returns</span></div>' +
        '<div class="delivery-card"><b>⏱ Fast Delivery & On-Time Promise</b>' + eta.text + '.<br>' + CONFIG.latePromise + '</div>' +
        '<div class="qty-row"><b>Quantity</b><div class="qty"><button type="button" data-qm>−</button><span id="qtyVal">1</span><button type="button" data-qp>+</button></div><b id="qtyTotal" style="color:var(--maroon);font-size:1.1rem;margin-left:auto">' + money(p.price) + '</b></div>' +
        '<div class="pd-btns">' +
          (out
            ? '<button type="button" class="btn btn-xl" data-notify="' + p.id + '">🔔 Notify Me When Back in Stock</button>'
            : '<button type="button" class="btn btn-outline btn-xl" data-add="' + p.id + '">🛒 Add to Cart</button>') +
          (out ? '' : '<a class="btn btn-buy btn-xl" id="pdBuyBtn" href="checkout.html?buy=' + encodeURIComponent(p.id) + '&qty=1">⚡ Buy at ' + money(p.price) + '</a>') +
          '<a class="btn btn-wa btn-xl" href="' + waLink(waProductMsg(p)) + '" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true" style="vertical-align:-2px;margin-right:4px"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>Buy on WhatsApp — Instant Confirmation</a>' +
        '</div>' +
        '<div class="pd-share">' +
          '<button type="button" class="btn btn-outline btn-sm" data-share-wa="' + esc(p.id) + '"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true" style="vertical-align:-2px;margin-right:4px"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>WhatsApp Share (family/group)</button>' +
          '<button type="button" class="btn btn-outline btn-sm" data-dl-photo="' + esc(p.img) + '">📥 Download Photo</button>' +
          '<button type="button" class="btn btn-outline btn-sm" data-share-status="' + esc(p.id) + '">📸 Share Photo</button>' +
          '<button type="button" class="btn btn-ghost btn-sm" data-copy-link="' + esc(productUrl(p)) + '">🔗 Copy Link</button>' +
        '</div>' +
        '<div class="pin-check"><b>📍 Check Delivery</b>' +
          '<div style="display:flex;gap:8px;margin-top:6px;align-items:stretch"><input id="pinCheck" placeholder="Enter PIN code (e.g. 636001)" inputmode="numeric" maxlength="6" style="flex:1;min-width:0;width:auto;border:1.5px solid var(--line);border-radius:10px;padding:0 14px;font-size:16px;background:#fff;outline:none;min-height:50px;box-sizing:border-box"><button type="button" class="btn btn-maroon btn-sm" id="pinCheckBtn" style="flex:0 0 auto;width:auto;min-width:120px;min-height:50px;padding:0 16px;font-size:.95rem;white-space:nowrap">Check</button></div>' +
          '<p class="small muted" id="pinResult" style="margin-top:6px"></p></div>' +
        '<div class="earn-box" id="earnBox">' +
          '<b>💰 Share &amp; Earn ₹' + (CONFIG.resellerMargin || 50) + '</b>' +
          '<p class="small" style="margin-top:3px">Share this saree on WhatsApp — when your friend buys through your link, <b>you earn ₹' + (CONFIG.resellerMargin || 50) + ' margin</b>! Your customers also get <b>₹50 off</b> with <b>' + esc(CONFIG.resellerCoupon) + '</b>.</p>' +
          '<div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">' +
            '<button type="button" class="btn btn-wa btn-sm" id="earnWa" style="flex:1;min-width:150px">' + SVG_WA + 'Share &amp; Earn ₹' + (CONFIG.resellerMargin || 50) + '</button>' +
            '<button type="button" class="btn btn-outline btn-sm" id="earnCopy" style="flex:1;min-width:130px">📋 Copy Share Link</button>' +
            '<a class="btn btn-ghost btn-sm" id="earnCode" href="share-earn.html" style="flex:1;min-width:130px">🔗 Get My Code</a>' +
          '</div>' +
          '<p class="small muted" id="earnNote" style="margin-top:6px"></p>' +
        '</div>' +
        '<div class="pd-block" style="margin-top:14px"><h3>💬 Reviews &amp; Comments</h3>' + revs +
          '<div class="rev-form" style="background:var(--bg);border:1px dashed var(--line);border-radius:12px;padding:13px;margin-top:12px;display:grid;gap:9px">' +
            '<b>✍️ Write a review</b>' +
            '<input id="rvName" placeholder="Your name" maxlength="40" style="width:100%;border:1.5px solid var(--line);border-radius:10px;padding:11px 12px;font-size:16px;background:#fff;outline:none">' +
            '<select id="rvStars" style="width:100%;border:1.5px solid var(--line);border-radius:10px;padding:11px 12px;font-size:16px;background:#fff;outline:none"><option value="5">★★★★★ Excellent</option><option value="4">★★★★☆ Very good</option><option value="3">★★★☆☆ Good</option><option value="2">★★☆☆☆ Average</option><option value="1">★☆☆☆☆ Poor</option></select>' +
            '<textarea id="rvText" rows="2" placeholder="Share your experience…" maxlength="300" style="width:100%;border:1.5px solid var(--line);border-radius:10px;padding:11px 12px;font-size:16px;background:#fff;outline:none;resize:vertical"></textarea>' +
            '<button type="button" class="btn btn-maroon btn-sm" data-comment="' + p.id + '">✍️ Post Comment</button>' +
          '</div></div>' +
      '</div>' +
    '</div>' +
    '<div class="wrap" id="recSection"></div>' +
    '<div class="wrap" id="exploreSection"></div>' +
    '<div class="sticky-bar">' +
      '<div class="sb-price" id="sbPrice"><b>' + money(p.price) + '</b><small>' + off + '% off</small></div>' +
      '<a class="btn btn-buy" id="sbBuy" href="checkout.html?buy=' + encodeURIComponent(p.id) + '&qty=1">⚡ Buy at ' + money(p.price) + '</a>' +
      '<button type="button" class="btn btn-maroon" data-add="' + p.id + '">Add</button>' +
      '<a class="btn btn-wa" href="' + waLink(waProductMsg(p)) + '" target="_blank" rel="noopener" aria-label="Order on WhatsApp"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true" style="vertical-align:-2px;margin-right:4px"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></a>' +
    '</div>';
  document.title = p.name + ' — SK Sarees';
  try{ trackRecentView(p); }catch(e){}
  /* 📏 blouse size guide (after fabric & details) + dynamic OG title */
  try{
    const t = document.querySelector('.pd-block table');
    if (t) t.closest('.pd-block').insertAdjacentHTML('afterend', blouseGuideHTML());
    const ogt = document.querySelector('meta[property="og:title"]');
    if (ogt) ogt.setAttribute('content', document.title);
    const ogd = document.querySelector('meta[property="og:description"]');
    if (ogd && p.desc) ogd.setAttribute('content', String(p.desc).slice(0, 150));
  }catch(e){}
  /* AI-style similar-saree recommendations (30) + Explore More sections */
  try{ if (window.REC) REC.renderSimilar(p, document.getElementById('recSection')); }catch(e){}
  try{ if (window.REC) REC.renderExplore(p, document.getElementById('exploreSection')); }catch(e){}
  /* 💰 Share & Earn box under the product */
  try{
    const earnWa = document.getElementById('earnWa');
    const earnCopy = document.getElementById('earnCopy');
    const note = document.getElementById('earnNote');
    const mine = myResellerCode();
    if (earnWa) earnWa.addEventListener('click', () => shareWaProduct(p));
    if (earnCopy) earnCopy.addEventListener('click', () => { copyText(shareUrl(p)); });
    if (note){
      if (mine){
        note.innerHTML = '✅ Your reseller code: <b>' + esc(mine) + '</b> — your share links carry <b>?ref=' + esc(mine) + '</b> on every page.';
        const codeLink = document.getElementById('earnCode');
        if (codeLink) codeLink.textContent = '🔗 My Code: ' + esc(mine);
      } else {
        note.innerHTML = '🔗 No code yet? Tap <b>Get My Code</b> (30 seconds) — then every share you send earns you ₹' + (CONFIG.resellerMargin || 50) + '!';
      }
    }
  }catch(e){}
  /* qty buttons — auto-update the total amount EVERYWHERE (main + sticky bar)
     and pass the qty along when using "Buy Now" (main + mobile floating bar) */
  const qtyRefresh = () => {
    const v = document.getElementById('qtyVal'); if (!v) return;
    const n = Math.max(1, Math.min(10, +v.textContent || 1));
    const dyn = document.getElementById('qtyTotal');
    if (dyn) dyn.textContent = money(p.price * n);
    const addB = document.querySelector('.pd-btns [data-add]');
    if (addB) addB.textContent = '🛒 Add to Cart ×' + n;
    /* mobile floating Buy Now — amount + qty link update too */
    const sbPrice = document.getElementById('sbPrice');
    if (sbPrice){ const b = sbPrice.querySelector('b'); if (b) b.textContent = money(p.price * n); }
    const sbBuy = document.getElementById('sbBuy');
    if (sbBuy){ sbBuy.setAttribute('href', 'checkout.html?buy=' + encodeURIComponent(p.id) + '&qty=' + n); sbBuy.textContent = '⚡ Buy at ' + money(p.price * n); }
    const pdBuy = document.getElementById('pdBuyBtn');
    if (pdBuy){ pdBuy.setAttribute('href', 'checkout.html?buy=' + encodeURIComponent(p.id) + '&qty=' + n); pdBuy.textContent = '⚡ Buy at ' + money(p.price * n); }
  };
  document.querySelectorAll('[data-qp]').forEach(b => b.addEventListener('click', () => { const v = document.getElementById('qtyVal'); v.textContent = Math.min(10, +v.textContent + 1); qtyRefresh(); }));
  document.querySelectorAll('[data-qm]').forEach(b => b.addEventListener('click', () => { const v = document.getElementById('qtyVal'); v.textContent = Math.max(1, +v.textContent - 1); qtyRefresh(); }));
  qtyRefresh();
  /* 👈👉 swipe the gallery to switch photos (mobile) */
  const mainBox = document.getElementById('pdMain');
  if (mainBox){
    let sx = null;
    mainBox.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
    mainBox.addEventListener('touchend', e => {
      if (sx == null) return;
      const dx = e.changedTouches[0].clientX - sx;
      sx = null;
      if (Math.abs(dx) < 40) return;
      const thumbs = Array.from(document.querySelectorAll('[data-thumb]'));
      if (!thumbs.length) return;
      const cur = thumbs.findIndex(b => b.classList.contains('on'));
      const next = dx < 0 ? Math.min(cur + 1, thumbs.length - 1) : Math.max(cur - 1, 0);
      if (next !== cur && thumbs[next]) thumbs[next].click();
    }, { passive: true });
  }
  /* comment */
  document.querySelectorAll('[data-comment]').forEach(b => b.addEventListener('click', () => {
    const name = (document.getElementById('rvName') || {}).value || '';
    const stars = (document.getElementById('rvStars') || {}).value || '5';
    const text = (document.getElementById('rvText') || {}).value || '';
    if (!text.trim()){ toast('✍️ Please write your comment first'); return; }
    const list = LS.get('sk_reviews_' + p.id, []);
    const rev = { name: name || 'Anonymous', rating: +stars, text, date: Date.now() };
    list.push(rev); LS.set('sk_reviews_' + p.id, list);
    if (FS.enabled()) FS.saveReview(p.id, rev).catch(() => {});
    toast('✅ Thank you! Review posted');
    renderProduct();
  }));
}

/* ============================ SHARE (WhatsApp family/group + Status) ============================ */
/* share the product to ANY WhatsApp chat / family group — user picks the recipient */
function shareWaProduct(p){
  if (!p) return;
  const msg = '🛍️ Guess what I found on SK Sarees website!\n\n' + waProductMsg(p) +
    '\n\n📢 Share with your family & friends — they will love this saree too! Visit www.sksaree.shop for more 😍';
  try{ window.open('https://api.whatsapp.com/send?text=' + encodeURIComponent(msg), '_blank', 'noopener'); }catch(e){}
}
/* share the saree PHOTO to WhatsApp Status (mobile: image → long-press → WhatsApp → My Status) */
async function shareProductStatus(p){
  if (!p) return;
  const imgUrl = p.img || ((p.images || [])[0]);
  if (!imgUrl){ toast('⚠️ No photo to share'); return; }
  /* try the Web Share API with the actual image file (mobile status picker) */
  try{
    if (navigator.canShare){
      const blob = await fetch(imgUrl).then(r => r.blob()).catch(() => null);
      if (blob){
        const file = new File([blob], 'saree.jpg', { type: (blob.type || 'image/jpeg') });
        if (navigator.canShare({ files: [file] })){
          await navigator.share({ files: [file], title: p.name, text: p.name + ' — SK Sarees' });
          return;
        }
      }
    }
  }catch(e){ /* user cancelled or API failed — fall through */ }
  /* fallback: open the photo full-size → long-press → Share → WhatsApp Status */
  try{ window.open(imgUrl, '_blank'); }catch(e){}
  toast('📸 Photo opened — long-press it → Share → WhatsApp Status');
}

/* ============================ CART ============================ */
function renderCartPage(){
  const app = document.getElementById('app'); if (!app) return;
  if (!Store.cart.length){
    app.innerHTML = '<div class="wrap page"><h1>🛒 Your Cart</h1><div class="empty"><div class="e-ic">🛒</div><b>Your cart is empty</b>' +
      '<a class="btn btn-maroon" style="max-width:240px;margin:14px auto 0" href="shop.html">🛍️ Shop Sarees</a></div></div>';
    return;
  }
  const t = cartTotal(), n = cartCount(), sh = shippingFor(t, '', n), short = Math.max(0, CONFIG.shipFreeAbove - t);
  const disc = couponDiscount(co.data.coupon, t);
  const bundle = bundleDiscount();               /* 2+ sarees → ₹50 off */
  const coup = couponFor(co.data.coupon);
  app.innerHTML = '<div class="wrap page"><h1>🛒 Your Cart</h1>' +
    '<div>' + Store.cart.map(i => {
      const p = byId(i.id); if (!p) return '';
      return '<div class="cart-item">' +
        '<a href="product.html?id=' + encodeURIComponent(p.id) + '"><img src="' + esc(p.img) + '" alt="' + esc(p.name) + '" loading="lazy" width="200" height="150"></a>' +
        '<div style="flex:1;min-width:0;padding-right:26px">' +
          '<h4><a href="product.html?id=' + encodeURIComponent(p.id) + '">' + esc(p.name) + '</a></h4>' +
          '<div class="ci-price">' + money(p.price) + '</div>' +
          '<div class="qty"><button type="button" data-cqm="' + p.id + '">−</button><span>' + i.qty + '</span><button type="button" data-cqp="' + p.id + '">+</button></div>' +
        '</div>' +
        '<button type="button" class="rm" data-rm="' + p.id + '" aria-label="Remove">✕</button></div>';
    }).join('') + '</div>' +
    (function(){
      /* 🛒 upsell: suggest 4 products from the same categories (exclude what's in cart) */
      try{
        const inCart = Store.cart.map(i => i.id);
        const cats = Store.cart.map(i => (byId(i.id) || {}).cat).filter(Boolean);
        const sug = PRODUCTS.filter(p => !inCart.includes(p.id) && cats.indexOf(p.cat) !== -1).slice(0, 4);
        if (!sug.length) return '';
        return '<div class="cart-upsell"><h3>🎁 Complete your look — add more &amp; save ₹' + (CONFIG.bundleOff || 0) + ' (2+ sarees)</h3>' +
          '<div class="prow">' + sug.map(cardHTML).join('') + '</div></div>';
      }catch(e){ return ''; }
    })() +
    '<div class="summary">' +
      '<div class="coupon-box"><div style="display:flex;gap:8px">' +
        '<input id="cartCoupon" placeholder="Coupon code (e.g. AADI10)" value="' + esc(co.data.coupon || '') + '" style="flex:1;min-width:0;width:auto;border:1.5px solid var(--line);border-radius:10px;padding:0 14px;font-size:16px;background:#fff;outline:none;text-transform:uppercase;min-height:50px;box-sizing:border-box">' +
        '<button type="button" class="btn btn-outline btn-sm" id="cartCouponBtn" style="flex:0 0 auto;width:auto;min-width:100px;min-height:50px;padding:0 16px;font-size:.95rem;white-space:nowrap">Apply</button>' +
      '</div>' + (coup && disc > 0 ? '<p class="small" style="color:var(--green);font-weight:800;margin-top:6px">🎟️ Coupon <b>' + esc(coup.code) + '</b> applied — ₹' + disc + ' off!' +
        (coup.expiry ? ' <span class="muted">(valid till ' + esc(coup.expiry) + ')</span>' : '') +
        (couponRemaining(coup) !== Infinity ? ' <span class="muted">(' + couponRemaining(coup) + ' uses left)</span>' : '') +
        '</p>' : (co.data.coupon ? '<p class="small muted" style="margin-top:6px">Coupon invalid, expired or fully used</p>' : '')) + '</div>' +
      '<div class="row"><span>Items total</span><b>' + money(t) + '</b></div>' +
      (disc > 0 ? '<div class="row"><span>Coupon discount</span><b style="color:var(--green)">−' + money(disc) + '</b></div>' : '') +
      (bundle > 0 ? '<div class="row"><span>🎁 Bundle deal (2+ sarees)</span><b style="color:var(--green)">−' + money(bundle) + '</b></div>' : '') +
      (pointsBalance() > 0 ? '<label style="display:flex;gap:8px;align-items:center;font-size:.82rem;font-weight:700;padding:6px 0"><input type="checkbox" id="usePts"' + (co.data.usePoints ? ' checked' : '') + ' style="width:18px;height:18px"> ⭐ Use ' + pointsBalance() + ' points (−' + money(Math.min(pointsRedeemable(), t - disc - bundle)) + ')</label>' : '') +
      (co.data.usePoints && (function(){ try{ return coTotals().pts; }catch(e){ return 0; } })() > 0 ? '<div class="row"><span>⭐ Points discount</span><b style="color:var(--green)">−' + money((function(){ try{ return coTotals().pts; }catch(e){ return 0; } })()) + '</b></div>' : '') +
      '<div class="row"><span>Shipping</span><b style="color:' + (sh ? 'inherit' : 'var(--green)') + '">' + (sh ? money(sh) : 'FREE') + '</b></div>' +
      '<div class="row total"><span>Total</span><b>' + money(Math.max(0, t - disc - bundle - (co.data.usePoints ? (function(){ try{ return coTotals().pts; }catch(e){ return 0; } })() : 0)) + sh) + '</b></div>' +
      '<div class="ship-progress">' + (short > 0 ? '🚚 Add <b>' + money(short) + '</b> more for FREE shipping!' : '🎉 You have FREE shipping!') +
        '<div class="ship-bar"><i style="width:' + Math.min(100, Math.round(t / CONFIG.shipFreeAbove * 100)) + '%"></i></div></div>' +
      '<div class="cod-note">💵 COD Available — pay <b>₹' + CONFIG.codFee + '</b> extra at delivery.</div>' +
      (n < (CONFIG.bundleCount || 2)
        ? '<div class="bundle-note">🎁 Buy ' + (CONFIG.bundleCount || 2) + ' sarees — get <b>₹' + (CONFIG.bundleOff || 0) + ' off</b> automatically!</div>'
        : '<div class="bundle-note" style="color:var(--green);border-color:#bfe6cf;background:#e9f7ef">🎉 Bundle deal applied! You saved <b>₹' + (CONFIG.bundleOff || 0) + '</b></div>') +
      '<p class="small muted" style="margin-top:8px">🚚 Shipping per saree: ₹30 Tamil Nadu · ₹40 Andhra/Karnataka · ₹60 others (' + n + ' saree' + (n > 1 ? 's' : '') + ' = <b>' + money(sh) + '</b>) · <b>FREE above ₹999</b>.</p>' +
      '<div style="display:grid;gap:10px;margin-top:14px">' +
        '<a class="btn btn-maroon btn-xl" href="checkout.html">Proceed to Checkout →</a>' +
        '<a class="btn btn-wa" href="' + waLink(waCartMsg()) + '" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true" style="vertical-align:-2px;margin-right:4px"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>Order on WhatsApp Instead</a>' +
      '</div>' +
    '</div></div>';
}

/* ============================ CHECKOUT ============================ */
let co = { step: 1, data: { name:'', phone:'', address:'', pincode:'', payment:'upi', coupon:'' } };
function renderCheckoutPage(){
  const app = document.getElementById('app'); if (!app) return;
  /* prefill order: what you last typed (draft) → saved profile → empty */
  const profile = Store.profile || {};
  const draft = loadCoDraft() || {};
  window.__savedCust = profile.phone ? { name: profile.name, phone: profile.phone } : null;
  co.data = Object.assign({}, co.data, {
    name: co.data.name || draft.name || profile.name || '',
    phone: co.data.phone || draft.phone || profile.phone || '',
    address: co.data.address || draft.address || profile.address || '',
    pincode: co.data.pincode || draft.pincode || profile.pincode || '',
    payment: co.data.payment || draft.payment || 'upi',
  });
  saveCoDraft();
  const qs = new URLSearchParams(location.search);
  const buy = qs.get('buy');
  const buyQty = Math.max(1, Math.min(10, +qs.get('qty') || 1));
  if (buy && !Store.cart.some(i => i.id === buy)) addToCart(buy, buyQty);
  if (!Store.cart.length){
    app.innerHTML = '<div class="wrap page"><h1>🔒 Secure Checkout</h1><div class="empty"><div class="e-ic">🛒</div><b>Your cart is empty</b>' +
      '<a class="btn btn-maroon" style="max-width:240px;margin:14px auto 0" href="shop.html">🛍️ Shop Sarees</a></div></div>';
    return;
  }
  drawCo();
}
function coTotals(){
  const itemsTotal = cartTotal();
  const codFee = co.data.payment === 'cod' ? CONFIG.codFee : 0;
  const shipping = shippingFor(itemsTotal, co.data.pincode, cartCount());
  const discount = couponDiscount(co.data.coupon, itemsTotal);
  const bundle = bundleDiscount();               /* buy 2+ → ₹50 off */
  const pts = co.data.usePoints ? Math.min(pointsRedeemable(), itemsTotal - discount - bundle) : 0;
  const totalDisc = discount + bundle + pts;
  const grand = Math.max(0, itemsTotal - totalDisc) + codFee + shipping;
  return { itemsTotal, codFee, shipping, discount, bundle, pts, grand, eta: deliveryEstimate(co.data.pincode, co.data.payment).text, zone: deliveryEstimate(co.data.pincode, co.data.payment).zone };
}
function drawCo(){
  const app = document.getElementById('app'); if (!app) return;
  const d = co.data;
  const t = coTotals();
  const steps = '<div class="steps-ui">' +
    '<div class="step-dot ' + (co.step > 1 ? 'done' : 'on') + '"><span class="dot">' + (co.step > 1 ? '✓' : '1') + '</span><span class="lbl">Details</span></div>' +
    '<div class="step-line ' + (co.step > 1 ? 'on' : '') + '"></div>' +
    '<div class="step-dot ' + (co.step === 2 ? 'on' : '') + '"><span class="dot">2</span><span class="lbl">Payment</span></div></div>';
  const itemLines = Store.cart.map(i => { const p = byId(i.id); return p ? '<div class="row"><span>' + esc(p.name) + ' ×' + i.qty + '</span><b>' + money(p.price * i.qty) + '</b></div>' : ''; }).join('');
  if (co.step === 1){
    app.innerHTML = '<div class="wrap page"><h1>🔒 Secure Checkout</h1>' + steps +
      '<div class="form-card"><h3>📋 Your Details <span class="muted small" style="font-weight:500">(no login needed)</span></h3>' +
        '<div class="field"><label>Full Name <span class="req">*</span></label><input id="coName" value="' + esc(d.name) + '" placeholder="e.g. Lakshmi S"></div>' +
        '<div class="field"><label>WhatsApp / Mobile <span class="req">*</span></label><input id="coPhone" value="' + esc(d.phone) + '" placeholder="10-digit mobile" inputmode="numeric" maxlength="10"></div>' +
        (window.__savedCust && d.phone ? '<p class="small" style="color:var(--green);font-weight:700;margin-top:-2px">✅ Saved customer — number auto-filled (' + esc(d.phone.slice(0,4) + '••••' + d.phone.slice(-2)) + '). Change if needed.</p>' : '') +
        '<div class="field"><label>Address <span class="req">*</span></label><textarea id="coAddr" rows="3" placeholder="House no, street, area, city…">' + esc(d.address) + '</textarea></div>' +
        '<div class="field"><label>PIN Code <span class="req">*</span></label><input id="coPin" value="' + esc(d.pincode) + '" placeholder="6-digit PIN" inputmode="numeric" maxlength="6"></div>' +
        '<div class="field"><label>🎟️ Coupon Code (optional)</label><input id="coCoupon" value="' + esc(d.coupon || '') + '" placeholder="e.g. AADI10" style="text-transform:uppercase"></div>' +
      '</div>' +
      '<div class="form-card"><h3>💳 Payment Method</h3><div class="pay-grid">' +
        '<div class="pay-opt ' + (d.payment === 'upi' ? 'on' : '') + '" data-pay="upi"><span class="po-ic" style="background:#e3f2fd">📲</span><span><b>UPI — Pay Online</b><small>GPay • PhonePe • Paytm</small></span><span class="radio"></span></div>' +
        '<div class="pay-opt ' + (d.payment === 'cod' ? 'on' : '') + '" data-pay="cod"><span class="po-ic" style="background:var(--gold-soft)">💵</span><span><b>Cash on Delivery</b><small>Pay at delivery — extra ₹' + CONFIG.codFee + '</small></span><span class="radio"></span></div>' +
      '</div></div>' +
      '<div class="delivery-card" style="margin-bottom:14px"><b>⏱ Fast Delivery</b>' + t.eta + '.<br>' + CONFIG.latePromise + '</div>' +
      (d.payment === 'cod'
        ? '<button type="button" class="btn btn-wa btn-xl" data-confirm-wa><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true" style="vertical-align:-2px;margin-right:4px"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>Confirm Order on WhatsApp</button>'
        : '<button type="button" class="btn btn-maroon btn-xl" data-cont>Continue to Payment →</button>') +
    '</div>';
  } else {
    const upiPay = d.payment === 'upi';
    /* reserve an order id now so the UPI payment note can carry it */
    if (!co.pendingId) co.pendingId = genOrderId();
    const note = 'Order ' + co.pendingId + ' SK Sarees';
    const booking = CONFIG.codFee;                      /* COD: ₹70 booking paid now */
    app.innerHTML = '<div class="wrap page"><h1>🔒 Secure Checkout</h1>' + steps +
      '<div class="form-card"><h3>🧾 Review Your Order</h3>' + itemLines +
        (t.discount > 0 ? '<div class="row"><span>Coupon discount (' + esc(co.data.coupon) + ')</span><b style="color:var(--green)">−' + money(t.discount) + '</b></div>' : '') +
        (t.bundle > 0 ? '<div class="row"><span>🎁 Bundle deal (2+ sarees)</span><b style="color:var(--green)">−' + money(t.bundle) + '</b></div>' : '') +
        '<div class="row"><span>Shipping</span><b style="color:' + (t.shipping ? 'inherit' : 'var(--green)') + '">' + (t.shipping ? money(t.shipping) : 'FREE') + '</b></div>' +
        (upiPay ? '' : '<div class="row"><span>COD booking (pay now)</span><b>+' + money(booking) + '</b></div>') +
        '<div class="row total"><span>Total</span><b>' + money(t.grand) + '</b></div>' +
        '<div class="delivery-card" style="margin-top:10px"><b>⏱ Fast Delivery</b>' + t.eta + '.</div>' +
        '<p class="small" style="border:1px dashed var(--line);border-radius:10px;padding:10px;background:var(--bg)"><b>' + esc(d.name) + '</b> • ' + esc(d.phone) + '<br>' + esc(d.address) + ' — ' + esc(d.pincode) + '</p>' +
      '</div>' +
      (upiPay
        ? '<div class="form-card"><h3>📲 Pay by UPI</h3>' +
          '<div style="text-align:center"><b style="font-size:1.9rem;color:var(--maroon)">' + money(t.grand) + '</b><span class="muted small"> payable</span>' +
          '<p class="small" style="margin-top:4px">🧾 Payment note: <b>Order ' + esc(co.pendingId) + '</b></p></div>' +
          '<div class="qr-box"><div id="upiQR"></div><div class="upi-id">' + esc(CONFIG.upiId) + ' <button type="button" class="btn btn-ghost btn-sm" style="min-height:30px;padding:4px 10px" data-copy="' + esc(CONFIG.upiId) + '">Copy</button></div></div>' +
          '<a class="btn btn-gold btn-xl" href="' + upiLink(t.grand, note) + '">📲 Pay Now — Open UPI App</a>' +
          '<div style="display:grid;gap:8px;margin-top:10px">' +
            '<a class="btn btn-xl" style="background:#1a73e8;color:#fff" href="' + upiAppLink('gpay', t.grand, note) + '">🟢 Google Pay — Pay ' + money(t.grand) + '</a>' +
            '<a class="btn btn-xl" style="background:#5f259f;color:#fff" href="' + upiAppLink('phonepe', t.grand, note) + '">🟣 PhonePe — Pay ' + money(t.grand) + '</a>' +
            '<a class="btn btn-xl" style="background:#002e6e;color:#fff" href="' + upiAppLink('paytm', t.grand, note) + '">🔷 Paytm — Pay ' + money(t.grand) + '</a>' +
          '</div>' +
          '<p class="small muted" style="text-align:center;margin:8px 0 0">📲 App install pannirundha direct-ah open aagum — illaina QR scan pannunga.</p>' +
          '<div class="verify-note">💳 After paying, tap below. <b>Your payment is pending — we will confirm once the payment is received.</b></div>' +
          '<button type="button" class="btn btn-maroon btn-xl" data-place="upi">✅ I\'ve Paid — Waiting for Confirmation</button></div>'
        : '<div class="form-card"><h3>💵 Cash on Delivery</h3>' +
          '<div style="text-align:center"><b style="font-size:1.9rem;color:var(--maroon)">' + money(booking) + '</b><span class="muted small"> booking fee — pay now (UPI)</span></div>' +
          '<div class="cod-note">💵 COD Available — <b>₹' + booking + ' courier booking</b> paid now.<br>Remaining <b>' + money(Math.max(0, t.grand - booking)) + '</b> collected at delivery.</div>' +
          '<div class="qr-box" style="margin-top:10px"><div id="upiQR"></div><div class="upi-id">' + esc(CONFIG.upiId) + ' <button type="button" class="btn btn-ghost btn-sm" style="min-height:30px;padding:4px 10px" data-copy="' + esc(CONFIG.upiId) + '">Copy</button></div></div>' +
          '<a class="btn btn-gold btn-xl" href="' + upiLink(booking, 'COD booking ' + co.pendingId) + '">📲 Pay ₹' + booking + ' Booking (UPI)</a>' +
          '<div class="verify-note" style="margin-top:8px">✅ After paying the ₹' + booking + ' booking, tap below to place your order.</div>' +
          '<button type="button" class="btn btn-maroon btn-xl" data-place="cod">✅ I\'ve Paid Booking — Place Order</button></div>') +
      '<button type="button" class="btn btn-ghost" data-back>← Back to edit details</button>' +
    '</div>';
    if (upiPay) setTimeout(drawUpiQR, 150); /* wait for DOM + qrcode lib */
  }
}
function drawUpiQR(){
  const box = document.getElementById('upiQR'); if (!box) return;
  const qrLib = (typeof qrcode !== 'undefined') ? qrcode : (window.qrcode || null);
  if (!qrLib){
    /* retry once the lib is ready */
    let tries = 0;
    const retry = setInterval(() => {
      tries++;
      const q2 = (typeof qrcode !== 'undefined') ? qrcode : (window.qrcode || null);
      if (q2){ clearInterval(retry); drawUpiQR(); }
      else if (tries > 20){ clearInterval(retry); box.innerHTML = '<p class="small muted">Scan unavailable — use the UPI app buttons below, “Pay Now” or the UPI ID.</p>'; }
    }, 150);
    return;
  }
  const t = coTotals();
  const note = 'Order ' + (co.pendingId || genOrderId()) + ' SK Sarees';
  try{
    const qr = qrLib(0, 'M');
    qr.addData(upiLink(t.grand, note));
    qr.make();
    box.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
  }catch(e){ box.innerHTML = '<p class="small muted">Use the UPI app buttons below, “Pay Now” or the UPI ID.</p>'; }
}
function coValid(){
  const d = co.data;
  const ok = d.name.trim().length >= 2 && validPhone(d.phone) && d.address.trim().length >= 10 && /^\d{6}$/.test(d.pincode || '');
  if (!ok) toast('⚠️ Please fill all details correctly');
  return ok;
}
/* cart item → safe product ref (never crashes if product was deleted) */
function safeItem(i){
  const p = byId(i.id) || {};
  return { id: i.id, name: p.name || i.name || 'Saree', price: +(p.price != null ? p.price : i.price) || 0, qty: i.qty || 1 };
}
/* remember the typed checkout details so they return on the next visit */
function saveCoDraft(){
  try{ localStorage.setItem('sk_co_draft', JSON.stringify(co.data)); }catch(e){}
  try{ sessionStorage.setItem('sk_co_draft', JSON.stringify(co.data)); }catch(e){}
}
function loadCoDraft(){
  let d = {};
  try{ const v = localStorage.getItem('sk_co_draft'); if (v) d = JSON.parse(v) || {}; }catch(e){}
  try{ const v = sessionStorage.getItem('sk_co_draft'); if (v && !d.name) d = JSON.parse(v) || {}; }catch(e){}
  return d;
}
function doPlaceOrder(payment){
  try{
    const d = co.data;
    if (!coValid()) return;
    const t = coTotals();
    const couponUsed = d.coupon || '';
    const myReseller = currentReseller();
    const order = {
      id: co.pendingId || genOrderId(), date: new Date().toISOString(),
      items: Store.cart.map(safeItem),
      customer: { name: d.name.trim(), phone: d.phone.trim(), address: d.address.trim(), pincode: d.pincode.trim() },
      payment,
      totals: t,
      reseller: myReseller ? { code: myReseller.code, name: myReseller.name, phone: myReseller.phone } : null,
      margin: myReseller ? (CONFIG.resellerMargin || 0) : 0,
      /* UPI: paid but awaiting admin confirmation; COD: ₹70 booking paid now */
      status: payment === 'upi' ? 'pending' : 'placed',
      bookingPaid: payment === 'cod' ? CONFIG.codFee : (payment === 'upi' ? t.grand : 0),
      device: deviceId(),
    };
    const orderCount = order.items.reduce((s, i) => s + (i.qty || 1), 0);
    Store.orders.unshift(order); Store.saveOrders();
    recordResellerOrder(order);               /* credit reseller margin */
    try{ Stats.refreshOrders(); renderStatsText(); }catch(e){}   /* bump order counter */
    if (FS.enabled()) FS.saveOrder(order).then(ok => { if (ok) markOrderSynced(order.id); }).catch(() => {});
    Store.profile = { name: order.customer.name, phone: order.customer.phone, address: order.customer.address, pincode: order.customer.pincode };
    Store.saveProfile();
    consumeStock(order.items);                 /* 1 psc model: stock goes down for next customer */
    Store.cart = []; Store.saveCart(); syncCartReservation();
    co = { step: 1, data: { name: order.customer.name, phone: order.customer.phone, address: order.customer.address, pincode: order.customer.pincode, payment:'upi' } };
    saveCoDraft();
    if (couponUsed) useCoupon(couponUsed);     /* count coupon usage (before co reset) */
    try{ earnPoints(order); }catch(e){}   /* ⭐ loyalty points */
    try{ if (co.data.usePoints){ const used = Math.min(pointsRedeemable(), (t.pts || 0)); localStorage.setItem('sk_points', String(Math.max(0, pointsRedeemable() - used))); } }catch(e){}
    fbqSafe('InitiateCheckout', { value: t.grand, currency: 'INR', num_items: orderCount });
    fbqSafe('Purchase', { value: t.grand, currency: 'INR', num_items: orderCount, content_ids: order.items.map(i => String(i.id)) });
    renderOrderComplete(order, false);
    try{ window.scrollTo({ top: 0, behavior: 'smooth' }); }catch(e){ try{ window.scrollTo(0, 0); }catch(e2){} }
  }catch(err){ console.warn(err); try{ renderOrderComplete({ id: genOrderId(), date: new Date().toISOString(), items: [], customer: co.data, payment, totals: coTotals(), status:'placed' }, false); }catch(e){} }
}
function doWaOrder(){
  try{
    const d = co.data;
    if (!coValid()) return;
    const t = coTotals();
    const myReseller = currentReseller();
    const order = {
      id: co.pendingId || genOrderId(), date: new Date().toISOString(),
      items: Store.cart.map(safeItem),
      customer: { name: d.name.trim(), phone: d.phone.trim(), address: d.address.trim(), pincode: d.pincode.trim() },
      payment: 'cod', totals: t, status: 'placed',
      bookingPaid: CONFIG.codFee,                 /* ₹70 courier booking paid now */
      reseller: myReseller ? { code: myReseller.code, name: myReseller.name, phone: myReseller.phone } : null,
      margin: myReseller ? (CONFIG.resellerMargin || 0) : 0,
      device: deviceId(),
    };
    const couponUsed = d.coupon || '';
    Store.orders.unshift(order); Store.saveOrders();
    recordResellerOrder(order);               /* credit reseller margin */
    try{ Stats.refreshOrders(); renderStatsText(); }catch(e){}   /* bump order counter */
    if (FS.enabled()) FS.saveOrder(order).then(ok => { if (ok) markOrderSynced(order.id); }).catch(() => {});
    Store.profile = { name: order.customer.name, phone: order.customer.phone, address: order.customer.address, pincode: order.customer.pincode };
    Store.saveProfile();
    consumeStock(order.items);
    Store.cart = []; Store.saveCart(); syncCartReservation();
    co = { step: 1, data: { name: order.customer.name, phone: order.customer.phone, address: order.customer.address, pincode: order.customer.pincode, payment:'upi' } };
    saveCoDraft();
    const msg = 'Hi! I want to confirm my COD order:\n\n🪡 Order ID: ' + order.id +
      '\n👤 Name: ' + order.customer.name + '\n📱 Phone: ' + order.customer.phone +
      '\n🏠 Address: ' + order.customer.address + ', ' + order.customer.pincode + '\n\nItems:\n' +
      order.items.map(i => '• ' + i.name + ' ×' + i.qty + ' — ' + money(i.price * i.qty)).join('\n') +
      '\n\n💰 COD booking ₹' + CONFIG.codFee + ' — I will pay the booking now.\nRemaining ' + money(Math.max(0, t.grand - CONFIG.codFee)) + ' at delivery.\n\nTotal: ' + money(t.grand) + '\nETA: ' + t.eta + '\nPlease confirm my order. Thank you!';
    try{ window.open(waLink(msg), '_blank', 'noopener'); }catch(e){}
    if (couponUsed) useCoupon(couponUsed);   /* count coupon usage (before co reset) */
    try{ earnPoints(order); }catch(e){}   /* ⭐ loyalty points */
    renderOrderComplete(order, true);
    try{ window.scrollTo({ top: 0, behavior: 'smooth' }); }catch(e){ try{ window.scrollTo(0, 0); }catch(e2){} }
  }catch(err){ console.warn(err); try{ renderOrderComplete({ id: genOrderId(), date: new Date().toISOString(), items: [], customer: co.data, payment:'cod', totals: coTotals(), status:'placed' }, true); }catch(e){} }
}
function renderOrderComplete(o, viaWa){
  const app = document.getElementById('app'); if (!app) return;
  const t = o.totals || { itemsTotal:0, shipping:0, codFee:0, discount:0, grand:0, eta:'' };
  const items = (o.items || []).map(i => '<div style="display:flex;justify-content:space-between;font-size:.84rem;padding:6px 0;border-bottom:1px dashed var(--line)"><span>' + esc(i.name) + ' ×' + i.qty + '</span><b>' + money(i.price * i.qty) + '</b></div>').join('');
  const mine = myOrders();
  const cards = mine.length
    ? mine.map(od => '<div class="order-card"><div class="oc-top"><b>#' + od.id + '</b><span class="status-pill status-' + od.status + '">' + esc((od.status || 'placed').replace('_', ' ')) + '</span></div>' +
        '<div class="oc-items">' + fmtDT(od.date) + ' • ' + money((od.totals || {}).grand || 0) + ' (' + (od.payment || '').toUpperCase() + ')</div>' +
        '<a class="btn btn-outline btn-sm" style="margin-top:8px" href="orders.html?id=' + encodeURIComponent(od.id) + '&data=' + encodeURIComponent(JSON.stringify(od)) + '">👁️ View Details</a></div>').join('')
    : '<div class="empty"><div class="e-ic">📦</div><b>No orders yet</b></div>';
  const isUpi = (o.payment || '') === 'upi' || (o.payment || '').indexOf('upi') === 0;
  const successMsg = isUpi
    ? '⏳ <b>Payment received — waiting for admin confirmation.</b> We will confirm your order on WhatsApp as soon as your UPI payment is verified. 📱'
    : (viaWa
        ? '💵 Order sent on WhatsApp — pay <b>₹' + CONFIG.codFee + ' booking</b> (already in the message), remaining amount at delivery. We will confirm shortly! 📱'
        : '💵 COD — you paid the ₹' + CONFIG.codFee + ' booking now. Remaining amount collected at delivery. We will confirm shortly! 📱');
  app.innerHTML = '<div class="wrap page">' +
    '<div class="success"><div class="tick-big"><svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></div>' +
      '<h1>' + (viaWa ? '🎉 Order Sent on WhatsApp!' : '🎉 Order Placed Successfully!') + '</h1>' +
      '<span class="oid">Order ID: #' + esc(o.id) + '</span>' +
      '<p class="muted small" style="max-width:46ch;margin:8px auto 0">' + successMsg + '</p>' +
    '</div>' +
    '<div class="summary" style="margin-top:6px">' + items +
      (t.discount > 0 ? '<div style="display:flex;justify-content:space-between;font-size:.9rem;padding:6px 0"><span>Coupon discount</span><b style="color:var(--green)">−' + money(t.discount) + '</b></div>' : '') +
      (t.bundle > 0 ? '<div style="display:flex;justify-content:space-between;font-size:.9rem;padding:6px 0"><span>🎁 Bundle deal</span><b style="color:var(--green)">−' + money(t.bundle) + '</b></div>' : '') +
      '<div style="display:flex;justify-content:space-between;font-size:.9rem;padding:6px 0"><span>Shipping</span><b style="color:' + (t.shipping ? 'inherit' : 'var(--green)') + '">' + (t.shipping ? money(t.shipping) : 'FREE') + '</b></div>' +
      (t.codFee ? '<div style="display:flex;justify-content:space-between;font-size:.9rem;padding:6px 0"><span>COD charges</span><b>+' + money(t.codFee) + '</b></div>' : '') +
      '<div class="row total"><span>Total (' + (o.payment || 'upi').toUpperCase() + ')</span><b>' + money(t.grand) + '</b></div>' +
      '<div class="small muted" style="text-align:center;margin-top:8px">⏱ ' + esc(t.eta || 'Dispatch 12–24h') + '</div></div>' +
    '<div style="display:grid;gap:10px;margin-top:16px;grid-template-columns:1fr 1fr">' +
      '<a class="btn btn-maroon" href="orders.html?id=' + encodeURIComponent(o.id) + '&data=' + encodeURIComponent(JSON.stringify(o)) + '">📦 Track This Order</a>' +
      '<a class="btn btn-gold" href="orders.html">📋 All My Orders</a>' +
      '<a class="btn btn-outline" style="grid-column:1/-1" href="' + esc(askReviewWhatsApp(o)) + '" target="_blank" rel="noopener">⭐ Loved it? Review us on Google — 30 seconds!</a>' +
      (viaWa ? '' : '<a class="btn btn-wa" style="grid-column:1/-1" href="' + waLink('Hi! I just placed order ' + o.id + '. Please confirm it.') + '" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true" style="vertical-align:-2px;margin-right:4px"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>Chat with Us on WhatsApp</a>') +
    '</div>' +
    '<div style="margin-top:20px"><h3 style="font-size:1.05rem;font-weight:800;margin-bottom:10px">📦 Your Orders</h3>' + cards + '</div>' +
  '</div>';
}

/* ============================ REPEAT-SALES HELPERS ============================ */
/* 🔁 Order Again — re-adds a past order's items to the cart in one tap */
function orderAgain(o){
  try{
    if (!o || !o.items || !o.items.length){ toast('⚠️ No items to reorder'); return; }
    let added = 0;
    o.items.forEach(i => {
      const p = byId(i.id);
      if (p && p.stock > 0){ addToCart(i.id, Math.min(i.qty || 1, Math.max(1, +p.stock || 1))); added++; }
    });
    toast(added ? '🛒 ' + added + ' item(s) added — checkout to order again!' : '😞 Items out of stock now');
    if (added) setTimeout(() => { location.href = 'cart.html'; }, 900);
  }catch(e){}
}
/* ⭐ Loyalty points — earn 1 point per ₹50 spent (redeemable ₹1 = 1 point at checkout) */
function earnPoints(order){
  try{
    const pts = Math.floor(((order.totals || {}).grand || 0) / 50);
    if (pts <= 0) return;
    const cur = +localStorage.getItem('sk_points') || 0;
    localStorage.setItem('sk_points', String(cur + pts));
    localStorage.setItem('sk_points_earned', String((+localStorage.getItem('sk_points_earned') || 0) + pts));
  }catch(e){}
}
function pointsBalance(){ try{ return +localStorage.getItem('sk_points') || 0; }catch(e){ return 0; } }
function pointsRedeemable(){ return pointsBalance(); } /* ₹1 per point */

/* ============================ ORDERS ============================ */
let orderFilter = 'all';
let ordersPage = 1;              /* pagination: 10 orders at a time */
const ORDERS_PAGE_SIZE = 10;
let openDetailId = null;         /* which order detail is open (fast toggle) */
function renderOrdersPage(){
  const app = document.getElementById('app'); if (!app) return;
  const q = new URLSearchParams(location.search);
  /* seed from URL payloads */
  const ordersParam = q.get('orders');
  if (ordersParam){
    try{
      const list = JSON.parse(decodeURIComponent(ordersParam));
      if (Array.isArray(list)) list.forEach(od => { if (!Store.orders.some(x => x.id === od.id)) Store.orders.unshift(od); });
      Store.saveOrders();
    }catch(e){}
  }
  const placedId = q.get('placed');
  if (placedId && q.get('data')){
    try{
      const o = JSON.parse(decodeURIComponent(q.get('data')));
      o.id = o.id || placedId;
      if (!Store.orders.some(x => x.id === o.id)) Store.orders.unshift(o);
      Store.saveOrders();
    }catch(e){}
  }
  const tid = q.get('id');
  if (tid && q.get('data')){
    try{
      const o = JSON.parse(decodeURIComponent(q.get('data')));
      o.id = o.id || tid;
      if (!Store.orders.some(x => x.id === o.id)) Store.orders.unshift(o);
      Store.saveOrders();
    }catch(e){}
  }
  app.innerHTML = '<div class="wrap page">' +
    '<h1>📦 My Orders</h1>' +
    '<div class="cat-chips" id="orderChips">' +
      '<button type="button" class="chip on" data-of="all">All</button>' +
      '<button type="button" class="chip" data-of="placed">🆕 New</button>' +
      '<button type="button" class="chip" data-of="pending">⏳ Payment Pending</button>' +
      '<button type="button" class="chip" data-of="confirmed">✅ Confirmed</button>' +
      '<button type="button" class="chip" data-of="shipped">🚚 Dispatched</button>' +
      '<button type="button" class="chip" data-of="delivered">✔ Delivered</button>' +
    '</div>' +
    '<div id="orderList"></div>' +
    '<div style="text-align:center;margin-top:10px"><button type="button" class="btn btn-outline" id="moreOrders" style="width:auto;min-width:200px;display:none">Load More Orders ↓</button></div>' +
    '<div id="trackDetail"></div>' +
    '<div class="form-card" style="margin-top:16px"><h3>🔍 Track by Order ID</h3>' +
      '<div class="field"><input id="trackId" placeholder="e.g. SK1001"></div>' +
      '<button type="button" class="btn btn-maroon" id="trackBtn">Track Order</button></div>' +
  '</div>';
  document.getElementById('orderChips').addEventListener('click', e => {
    const b = e.target.closest('[data-of]'); if (!b) return;
    orderFilter = b.dataset.of;
    ordersPage = 1;                       /* fresh page on filter change */
    openDetailId = null;                  /* close any open detail */
    const td = document.getElementById('trackDetail'); if (td) td.innerHTML = '';
    document.querySelectorAll('#orderChips .chip').forEach(x => x.classList.toggle('on', x === b));
    renderOrderList();
  });
  document.getElementById('trackBtn').addEventListener('click', () => {
    const id = document.getElementById('trackId').value.trim();
    if (id) trackById(id);                /* inline — no page reload, fast */
  });
  renderOrderList();
  if (tid) trackById(tid);
  if (placedId){
    const o = Store.orders.find(x => x.id === placedId);
    if (o) setTimeout(() => renderOrderComplete(o, q.get('wa') === '1'), 300);
  }
  /* ---- LIVE STATUS: when the ADMIN changes an order status in Firestore,
     this customer's page updates INSTANTLY (no refresh). Only this device's
     orders are merged, so isolation is preserved. ---- */
  if (FS.enabled()){
    const myDev = deviceId();
    let prevStatuses = {};
    Store.orders.forEach(o => { prevStatuses[o.id] = o.status; });
    FS.listenOrders(list => {
      if (!list || !list.length) return;
      let changed = false;
      list.forEach(f => {
        if (!f || !f.id) return;
        const localIdx = Store.orders.findIndex(x => x.id === f.id);
        if (localIdx >= 0){
          const prev = Store.orders[localIdx].status;
          Store.orders[localIdx] = Object.assign({}, Store.orders[localIdx], {
            status: f.status || Store.orders[localIdx].status,
            updatedAt: f.updatedAt, deliverBy: f.deliverBy,
            dispatchedAt: f.dispatchedAt, deliveredAt: f.deliveredAt,
            totals: f.totals || Store.orders[localIdx].totals,
          });
          if (prev !== Store.orders[localIdx].status){
            changed = true;
            /* toast the status change to the customer */
            try{ toast('📦 Order ' + f.id + ' → ' + String(Store.orders[localIdx].status || '').replace('_',' ')); }catch(e){}
          }
        } else if (f.device === myDev && f.status){
          /* this device's cloud order not in local list yet — add it */
          Store.orders.unshift(f);
          changed = true;
        }
      });
      if (changed){
        Store.saveOrders();
        renderOrderList();
        /* refresh the open detail (if any) so its status-track updates too */
        if (openDetailId){
          const o = Store.orders.find(x => x.id === openDetailId);
          if (o) showDetail(o);
        }
      }
    });
  }
}
function statusTrack(o){
  const st = o.status || 'placed';
  const steps = [['placed','🆕 Placed'], ['pending','⏳ Payment Pending'], ['confirmed','✅ Confirmed'], ['shipped','🚚 Dispatched'], ['delivered','✔ Delivered']];
  const idx = steps.findIndex(s => s[0] === st);
  return '<div class="status-track">' + steps.map((s, i) => '<span class="' + (i < idx ? 'done' : i === idx ? 'now' : '') + '">' + s[1] + '</span>').join('') + '</div>';
}
function orderCard(o){
  const st = o.status || 'placed';
  return '<div class="order-card">' +
    '<div class="oc-top"><b>#' + o.id + '</b><span class="status-pill status-' + st + '">' + esc(st.replace('_', ' ')) + '</span></div>' +
    '<div class="oc-items">' + fmtDT(o.date) + ' • ' + money((o.totals || {}).grand || 0) + ' (' + (o.payment || '').toUpperCase() + ')<br>ETA: ' + esc((o.totals || {}).eta || 'Dispatch 12–24h') + '</div>' +
    statusTrack(o) +
    '<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">' +
    '<button type="button" class="btn btn-outline btn-sm" style="flex:1;min-width:130px" data-odetail="' + esc(o.id) + '">👁️ ' + (openDetailId === o.id ? 'Close Details' : 'View Order Details') + '</button>' +
    '<button type="button" class="btn btn-maroon btn-sm" style="flex:1;min-width:130px" data-reorder="' + esc(o.id) + '">🔁 Order Again</button>' +
    '</div></div>';
}
/* Full order detail — rendered inline, opens/closes instantly, no page reload */
function showDetail(o){
  const wrap = document.getElementById('trackDetail');
  if (!wrap) return;
  if (!o){
    openDetailId = null;
    wrap.innerHTML = '<div class="empty"><div class="e-ic">🔍</div><b>Order not found</b>Check the order ID. ' +
      '<a class="btn btn-wa btn-sm" style="max-width:280px;margin:8px auto" href="' + waLink('Hi! I cannot find my order. Please help.') + '" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true" style="vertical-align:-2px;margin-right:4px"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>Ask us on WhatsApp</a></div>';
    return;
  }
  const t = o.totals || { itemsTotal:0, shipping:0, codFee:0, grand:0 };
  const items = (o.items || []).map(i => {
    const p = byId(i.id);
    return '<div style="display:flex;gap:12px;align-items:center;background:var(--bg);border-radius:11px;padding:10px;margin-bottom:8px">' +
      '<a href="product.html?id=' + encodeURIComponent(i.id) + '"><img src="' + (p ? esc(p.img) : img('printed-cotton.jpg')) + '" alt="' + esc(i.name) + '" style="width:64px;height:48px;object-fit:cover;border-radius:8px;flex:0 0 auto"></a>' +
      '<div style="flex:1;min-width:0"><a href="product.html?id=' + encodeURIComponent(i.id) + '" style="font-size:.85rem;font-weight:800;display:block">' + esc(i.name) + '</a>' +
      '<small class="muted">' + money(i.price) + ' × ' + i.qty + '</small></div><b>' + money(i.price * i.qty) + '</b></div>';
  }).join('');
  wrap.innerHTML = '<div class="form-card"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px">' +
    '<h3 style="margin:0">📦 Order #' + esc(o.id) + '</h3>' +
    '<button type="button" class="btn btn-ghost btn-sm" data-close-detail style="min-height:32px">✕ Close</button></div>' +
    '<div class="oc-items" style="margin:4px 0">' + fmtDT(o.date) + ' • ' + esc((o.customer || {}).name || '') + ' • ' + money(t.grand) + ' (' + (o.payment || '').toUpperCase() + ')</div>' +
    '<span class="status-pill status-' + o.status + '">' + esc((o.status || 'placed').replace('_', ' ')) + '</span>' +
    statusTrack(o) +
    '<div style="margin-top:12px">' + items + '</div>' +
    '<div style="margin-top:6px">' +
      '<div style="display:flex;justify-content:space-between;font-size:.85rem;padding:3px 0"><span class="muted">Items total</span><b>' + money(t.itemsTotal) + '</b></div>' +
      '<div style="display:flex;justify-content:space-between;font-size:.85rem;padding:3px 0"><span class="muted">Shipping</span><b style="color:' + (t.shipping ? 'inherit' : 'var(--green)') + '">' + (t.shipping ? money(t.shipping) : 'FREE') + '</b></div>' +
      (t.codFee ? '<div style="display:flex;justify-content:space-between;font-size:.85rem;padding:3px 0"><span class="muted">COD charges</span><b>+' + money(t.codFee) + '</b></div>' : '') +
      '<div style="display:flex;justify-content:space-between;font-weight:800;font-size:.95rem;padding:6px 0;border-top:2px dashed var(--line);margin-top:4px"><span>Total</span><b style="color:var(--maroon)">' + money(t.grand) + '</b></div>' +
    '</div>' +
    '<div class="oc-items" style="margin-top:8px">⏱ ' + esc(t.eta || 'Dispatch 12–24h') + '<br>Deliver to: <b>' + esc((o.customer || {}).name || '') + '</b> • ' + esc((o.customer || {}).phone || '') + '<br>' + esc((o.customer || {}).address || '') + ' — ' + esc((o.customer || {}).pincode || '') + '</div>' +
    '<div style="display:grid;gap:8px;margin-top:12px;grid-template-columns:1fr 1fr">' +
      '<a class="btn btn-wa btn-sm" href="' + waLink('Hi! I want to track my order ' + o.id + '.') + '" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true" style="vertical-align:-2px;margin-right:4px"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>Ask on WhatsApp</a>' +
      '<button type="button" class="btn btn-maroon btn-sm" data-reorder="' + esc(o.id) + '">🔁 Order Again</button>' +
      '<a class="btn btn-outline btn-sm" href="shop.html">🛍️ Shop More</a>' +
    '</div></div>';
}
function renderOrderList(){
  const wrap = document.getElementById('orderList'); if (!wrap) return;
  const mine = myOrders();
  const list = orderFilter === 'all' ? mine : mine.filter(o => (o.status || 'placed') === orderFilter);
  if (!list.length){
    wrap.innerHTML = '<div class="empty"><div class="e-ic">📦</div><b>No orders yet</b>Place your first saree order and track it here!<br><br><a class="btn btn-maroon" style="max-width:240px;margin:0 auto" href="shop.html">🛍️ Shop Sarees</a></div>';
    const mo = document.getElementById('moreOrders'); if (mo) mo.style.display = 'none';
    return;
  }
  const visible = list.slice(0, ordersPage * ORDERS_PAGE_SIZE);
  wrap.innerHTML = visible.map(orderCard).join('');
  const mo = document.getElementById('moreOrders');
  if (mo){
    const hasMore = ordersPage * ORDERS_PAGE_SIZE < list.length;
    mo.style.display = hasMore ? 'inline-flex' : 'none';
    mo.onclick = () => { ordersPage++; renderOrderList(); };
  }
  /* keep the currently-open detail visible after any list re-render */
  if (openDetailId){
    const o = Store.orders.find(x => x.id === openDetailId);
    if (o) showDetail(o);
    else { openDetailId = null; const td = document.getElementById('trackDetail'); if (td) td.innerHTML = ''; }
  }
}
function trackById(id){
  const local = myOrders().find(o => o.id.toLowerCase() === String(id).toLowerCase());
  if (local){
    openDetailId = local.id; showDetail(local);
    /* live: if the admin updates this order's status, refresh the detail */
    if (FS.enabled()){
      FS.listenOrder(local.id, doc => {
        if (!doc) return;
        const i = Store.orders.findIndex(x => x.id === local.id);
        if (i >= 0){
          const prev = Store.orders[i].status;
          Store.orders[i] = Object.assign({}, Store.orders[i], { status: doc.status || prev, deliverBy: doc.deliverBy, dispatchedAt: doc.dispatchedAt, deliveredAt: doc.deliveredAt });
          Store.saveOrders();
          if (openDetailId === local.id) showDetail(Store.orders[i]);
          if (prev !== Store.orders[i].status){ try{ toast('📦 Order ' + local.id + ' → ' + String(Store.orders[i].status || '').replace('_',' ')); }catch(e){} }
        }
      });
    }
    return;
  }
  if (FS.enabled()){
    const wrap = document.getElementById('trackDetail'); if (wrap) wrap.innerHTML = '<div class="empty"><div class="e-ic"><div class="spinner"></div></div><b>Checking cloud…</b></div>';
    FS.getOrder(id).then(doc => { if (doc){ openDetailId = doc.id || id; showDetail(doc); } else { openDetailId = null; showDetail(null); } });
  } else showDetail(null);
}

/* ============================ PROFILE ============================ */
function notifyStatusLabel(){
  try{ if (!('Notification' in window)) return '🔕 Notifications Not Supported'; return Notification.permission === 'granted' ? '🔔 Notifications On' : '🔔 Enable Notifications'; }catch(e){ return '🔔 Enable Notifications'; }
}
function notifyStatusNote(){
  try{
    if (!('Notification' in window)) return 'This browser does not support notifications.';
    if (Notification.permission === 'granted') return 'You will get order updates, offers & cart reminders here.';
    if (Notification.permission === 'denied') return 'Notifications blocked — allow them in browser settings to get alerts.';
    return 'Needs HTTPS. Tap to allow order status & cart reminders.';
  }catch(e){ return ''; }
}
function renderProfilePage(){
  const app = document.getElementById('app'); if (!app) return;
  const p = Store.profile || {};
  app.innerHTML = '<div class="wrap page"><h1>👤 My Profile</h1>' +
    '<div class="form-card"><h3>📋 Saved Details (auto-fills checkout)</h3>' +
      '<div class="field"><label>Full Name</label><input id="pfName" value="' + esc(p.name) + '"></div>' +
      '<div class="field"><label>WhatsApp / Mobile</label><input id="pfPhone" value="' + esc(p.phone) + '" inputmode="numeric" maxlength="10"></div>' +
      '<div class="field"><label>Address</label><textarea id="pfAddr" rows="2">' + esc(p.address) + '</textarea></div>' +
      '<div class="field"><label>PIN Code</label><input id="pfPin" value="' + esc(p.pincode) + '" inputmode="numeric" maxlength="6"></div>' +
      '<button type="button" class="btn btn-maroon" id="pfSave">💾 Save Details</button>' +
      '<p class="small muted" style="margin-top:8px">🔒 Stored only on your device.</p>' +
    '</div>' +
    '<div class="form-card"><h3>⭐ Loyalty Points</h3>' +
      '<p class="small" style="margin-bottom:6px">Earn <b>1 point per ₹50</b> spent. Redeem at checkout — <b>1 point = ₹1 off</b>.</p>' +
      '<div style="display:flex;align-items:center;gap:12px;background:var(--gold-soft);border:1.5px dashed var(--gold);border-radius:12px;padding:12px">' +
        '<span style="font-size:2rem">⭐</span><div><b style="font-size:1.4rem;color:var(--maroon)" id="ptsBal">' + pointsBalance() + '</b>' +
        '<span class="muted small" style="display:block">points = ₹' + pointsRedeemable() + ' discount ready</span></div></div></div>' +
    '<div class="form-card"><h3>📲 Install App (PWA)</h3>' +
      '<p class="small muted" style="margin-bottom:10px">Install SK Sarees as an app — one tap open, works offline-friendly, like a native app.</p>' +
      '<button type="button" class="btn btn-maroon" id="pfInstall">📲 Install App</button></div>' +
    '<div class="form-card"><h3>🔔 Push Notifications</h3>' +
      '<p class="small muted" style="margin-bottom:10px">Get notified about order status, festival offers &amp; if you leave items in your cart.</p>' +
      '<button type="button" class="btn btn-maroon" id="pfNotify">' + notifyStatusLabel() + '</button>' +
      '<p class="small muted" id="notifyNote" style="margin-top:8px">' + notifyStatusNote() + '</p></div>' +
    '<div class="form-card"><h3>❤️ My Wishlist</h3><div class="wish-grid" id="wishGrid"></div></div>' +
    '<div class="form-card"><h3>🌐 Language</h3><select id="pfLang" style="width:100%;border:1.5px solid var(--line);border-radius:10px;padding:12px">' +
      '<option value="en"' + (lang === 'en' ? ' selected' : '') + '>English</option>' +
      '<option value="ta"' + (lang === 'ta' ? ' selected' : '') + '>தமிழ்</option></select></div>' +
    '<div class="form-card"><h3>🏠 Store Info</h3><p class="small" style="line-height:1.9">📍 2/130, Thoothanoor, Edanganasalai, Salem 637502<br>📞 <a href="tel:+917867915699" style="color:var(--maroon);font-weight:800">+91 78679 15699</a><br><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true" style="vertical-align:-2px;margin-right:4px"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> <a href="' + waLink('Hi! I need help.') + '" target="_blank" rel="noopener" style="color:var(--wa-d);font-weight:800">Chat on WhatsApp</a><br>⏰ 9 AM – 9 PM, all days</p></div>' +
  '</div>';
  document.getElementById('pfSave').addEventListener('click', () => {
    const name = document.getElementById('pfName').value.trim();
    const phone = document.getElementById('pfPhone').value.trim();
    const address = document.getElementById('pfAddr').value.trim();
    const pincode = document.getElementById('pfPin').value.trim();
    if (!name || !validPhone(phone)){ toast('⚠️ Enter valid name & 10-digit phone'); return; }
    Store.profile = { name, phone, address, pincode };
    Store.saveProfile();
    toast('✅ Details saved');
  });
  document.getElementById('pfLang').addEventListener('change', e => setLang(e.target.value));
  /* install app (PWA) */
  const inBtn = document.getElementById('pfInstall');
  if (inBtn) inBtn.addEventListener('click', () => { installApp(); });
  /* push notification opt-in */
  const nBtn = document.getElementById('pfNotify');
  if (nBtn) nBtn.addEventListener('click', async () => {
    try{
      if (!('Notification' in window)){
        toast('⚠️ Notifications not supported on this browser'); return;
      }
      const perm = await Notification.requestPermission();
      if (perm === 'granted'){
        const sub = await subscribePush();
        toast(sub ? '✅ Notifications enabled!' : '✅ Notifications enabled (offline)');
        nBtn.textContent = '🔔 Notifications On';
        const note = document.getElementById('notifyNote');
        if (note) note.textContent = 'You will get order updates, offers & cart reminders here.';
      } else {
        toast('⚠️ Please allow notifications in browser settings');
      }
    }catch(e){ toast('⚠️ Could not enable — use HTTPS or browser settings'); }
  });
  const list = Store.wish.map(byId).filter(Boolean);
  document.getElementById('wishGrid').innerHTML = list.length
    ? list.map(p => '<div class="pcard"><a class="pcard-img" href="product.html?id=' + encodeURIComponent(p.id) + '"><img src="' + esc(p.img) + '" alt="" loading="lazy"></a>' +
        '<div class="pcard-body"><h3>' + esc(p.name) + '</h3><div class="price-row"><b>' + money(p.price) + '</b></div>' +
        '<div class="p-actions"><button type="button" class="btn btn-outline" data-add="' + p.id + '">Add</button>' +
        '<a class="btn btn-wa" href="' + waLink(waProductMsg(p)) + '" target="_blank" rel="noopener" aria-label="Order on WhatsApp"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true" style="vertical-align:-2px;margin-right:4px"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></a></div></div></div>').join('')
    : '<p class="muted small">❤️ Nothing yet — tap the heart on any saree to save it here.</p>';
}

/* ============================ INSTANT PRODUCT UPDATES ============================
   When the ADMIN edits products in another tab, the user page re-renders
   instantly via the storage event (no manual refresh needed). */
window.addEventListener('storage', function(e){
  try{
    if (e.key !== 'sk_products' && e.key !== 'sk_products_cloud') return;
    if (e.key === 'sk_products'){
      const v = JSON.parse(e.newValue || '[]');
      if (Array.isArray(v)) PRODUCTS = v;
    }
    try{ if (window.REC) REC.invalidate(); }catch(e2){}
    /* re-render the current page lists */
    const page = document.body.dataset.page;
    if (page === 'home') renderHome();
    else if (page === 'shop') renderShop();
    else if (page === 'product') renderProduct();
    else if (page === 'profile') renderProfilePage();
    else if (page === 'admin' && typeof renderProducts === 'function' && adminTab === 'products') renderProducts();
  }catch(e){}
});

/* ============================ GLOBAL EVENTS ============================ */
/* Fast open/close of an order's full details — no page reload at all */
function toggleDetail(id){
  const o = Store.orders.find(x => x.id === id);
  if (!o) return;
  if (openDetailId === id){
    openDetailId = null;
    const td = document.getElementById('trackDetail'); if (td) td.innerHTML = '';
  } else {
    openDetailId = id;
    showDetail(o);
  }
  try{
    document.querySelectorAll('[data-odetail]').forEach(b => {
      b.textContent = (openDetailId && b.dataset.odetail === openDetailId) ? '✕ Close Details' : '👁️ View Order Details';
    });
    const el = openDetailId ? document.getElementById('trackDetail') : null;
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else document.querySelectorAll('[data-odetail]').forEach(b => { if (b.dataset.odetail === id) b.scrollIntoView({ behavior: 'smooth', block: 'center' }); });
  }catch(err){}
}
/* Any plain link to orders.html carries the orders list in the URL, so the
   page always shows them even where storage is blocked (preview). */
document.addEventListener('click', function(e){
  const a = e.target.closest('a[href*="orders.html"]');
  if (!a) return;
  const href = a.getAttribute('href');
  if (!href || href.includes('orders=') || href.includes('data=') || href.includes('placed=')) return;
  const mine = myOrders();
  if (!mine.length) return;
  /* build a compact list payload (only this device's orders) */
  let payload = '';
  try{
    const slim = mine.slice(0, 6).map(o => ({ id:o.id, date:o.date, items:o.items, customer:o.customer, payment:o.payment, totals:o.totals, status:o.status }));
    const json = JSON.stringify(slim);
    if (json.length <= 6000) payload = '?orders=' + encodeURIComponent(json);
  }catch(err){ payload = ''; }
  if (!payload) return;
  e.preventDefault();
  a.setAttribute('href', href + payload);
  location.href = a.getAttribute('href');
});
document.addEventListener('click', function(e){
  /* add to cart (from cards, product page, wishlist) */
  const add = e.target.closest('[data-add]');
  if (add){
    e.preventDefault();
    /* use the selected quantity on the product page (fixes "shows 1 qty only") */
    const qv = document.getElementById('qtyVal');
    const qty = qv ? Math.max(1, Math.min(10, +qv.textContent || 1)) : 1;
    addToCart(add.dataset.add, qty);
    return;
  }
  /* cart qty */
  const cqm = e.target.closest('[data-cqm]');
  if (cqm){ const it = Store.cart.find(i => i.id === cqm.dataset.cqm); if (it){ setCartQty(it.id, it.qty - 1); renderCartPage(); } return; }
  const cqp = e.target.closest('[data-cqp]');
  if (cqp){ const it = Store.cart.find(i => i.id === cqp.dataset.cqp); if (it){ setCartQty(it.id, it.qty + 1); renderCartPage(); } return; }
  const rm = e.target.closest('[data-rm]');
  if (rm){ e.preventDefault(); removeFromCart(rm.dataset.rm); renderCartPage(); return; }
  /* ⭐ use points (cart) */
  if (e.target.id === 'usePts'){
    co.data.usePoints = e.target.checked;
    saveCoDraft();
    renderCartPage();
    return;
  }
  /* coupon apply (cart) */
  if (e.target.id === 'cartCouponBtn'){
    e.preventDefault();
    const v = document.getElementById('cartCoupon') ? document.getElementById('cartCoupon').value.trim() : '';
    co.data.coupon = v;
    saveCoDraft();
    const c = couponFor(v);
    if (!c){ toast('❌ Invalid, expired or fully used coupon'); }
    else if (c.min && cartTotal() < +c.min){ toast('⚠️ Use this coupon above ₹' + c.min); }
    else { toast('🎟️ Coupon ' + c.code + ' applied!' + (couponExpired(c) ? '' : (c.expiry ? ' (valid till ' + c.expiry + ')' : ''))); }
    renderCartPage();
    return;
  }
  /* checkout */
  const cont = e.target.closest('[data-cont]');
  if (cont){ e.preventDefault(); if (coValid()){ co.step = 2; drawCo(); } return; }
  const back = e.target.closest('[data-back]');
  if (back){ e.preventDefault(); co.step = 1; drawCo(); return; }
  const pay = e.target.closest('[data-pay]');
  if (pay){ e.preventDefault(); co.data.payment = pay.dataset.pay; drawCo(); return; }
  const place = e.target.closest('[data-place]');
  if (place){ e.preventDefault(); doPlaceOrder(place.dataset.place); return; }
  const cwa = e.target.closest('[data-confirm-wa]');
  if (cwa){ e.preventDefault(); doWaOrder(); return; }
  const copy = e.target.closest('[data-copy]');
  if (copy){ e.preventDefault(); copyText(copy.dataset.copy); return; }
  /* 🔁 order again */
  const ro = e.target.closest('[data-reorder]');
  if (ro){ e.preventDefault(); const o = myOrders().find(x => x.id === ro.dataset.reorder) || Store.orders.find(x => x.id === ro.dataset.reorder); if (o) orderAgain(o); return; }
  /* order detail fast toggle */
  const od = e.target.closest('[data-odetail]');
  if (od){ e.preventDefault(); toggleDetail(od.dataset.odetail); return; }
  const cd = e.target.closest('[data-close-detail]');
  if (cd){ e.preventDefault(); if (openDetailId) toggleDetail(openDetailId); return; }
  /* ❤️ wishlist toggle (cards + product page) — must stop the card link nav */
  const wish = e.target.closest('[data-wish]');
  if (wish){ e.preventDefault(); toggleWish(wish.dataset.wish); return; }
  /* 📤 share product on WhatsApp (family/group) */
  const sw = e.target.closest('[data-share-wa]');
  if (sw){ e.preventDefault(); shareWaProduct(byId(sw.dataset.shareWa)); return; }
  /* 📥 download saree photo */
  const dlp = e.target.closest('[data-dl-photo]');
  if (dlp){
    e.preventDefault();
    const url = dlp.dataset.dlPhoto;
    try{
      fetch(url).then(r => r.blob()).then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'sk-sarees-photo.jpg';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      }).catch(() => { try{ window.open(url, '_blank'); }catch(e2){} });
    }catch(err){ try{ window.open(url, '_blank'); }catch(e2){} }
    return;
  }
  /* 📸 share saree photo on WhatsApp status */
  const ss = e.target.closest('[data-share-status]');
  if (ss){ e.preventDefault(); shareProductStatus(byId(ss.dataset.shareStatus)); return; }
  /* 📍 PIN code delivery check */
  const pcb = e.target.closest('#pinCheckBtn');
  if (pcb){
    e.preventDefault();
    const pin = (document.getElementById('pinCheck') || {}).value || '';
    if (!/^\d{6}$/.test(pin)){ const r = document.getElementById('pinResult'); if (r) r.textContent = '⚠️ Enter a valid 6-digit PIN'; return; }
    const zone = ZONES[deliveryZone(pin)];
    const eUpi = deliveryEstimate(pin, 'upi');
    const eCod = deliveryEstimate(pin, 'cod');
    const r = document.getElementById('pinResult');
    const delBy = eUpi.to ? eUpi.to.toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short' }) : '';
    if (r) r.innerHTML = '📍 <b>' + esc(zone.name) + '</b><br>' +
      '📦 <b>Delivery by ' + esc(delBy) + '</b> (UPI) • ' + esc(eCod.to ? eCod.to.toLocaleDateString('en-IN', { day:'numeric', month:'short' }) : '') + ' (COD)<br>' +
      '🚚 Shipping: <b>₹' + zone.ship + '</b> per saree (free above ₹999)<br>' +
      '✅ Fulfilled by <b>SK SAREES COLLECTION</b>';
    return;
  }
  /* 🔗 copy product link */
  const clk = e.target.closest('[data-copy-link]');
  if (clk){ e.preventDefault(); copyText(clk.dataset.copyLink); return; }
  /* product gallery: tap a thumbnail → switch the big photo */
  const thumb = e.target.closest('[data-thumb]');
  if (thumb){
    e.preventDefault();
    const tImg = thumb.querySelector('img');
    if (tImg){
      const mi = document.getElementById('pdMainImg');
      if (mi) mi.src = tImg.getAttribute('src');
      document.querySelectorAll('[data-thumb]').forEach(b => b.classList.toggle('on', b === thumb));
    }
    return;
  }
  /* tap the big product photo → full-screen zoom */
  if (e.target.id === 'pdMainImg'){
    const src = e.target.getAttribute('src');
    const ov = document.createElement('div');
    ov.className = 'img-zoom';
    ov.innerHTML = '<div class="img-zoom-back" data-zoom-close></div><img src="' + esc(src) + '" alt="' + esc(document.getElementById('pdMainImg').alt || '') + '"><button type="button" class="img-zoom-x" data-zoom-close aria-label="Close">✕</button>';
    document.body.appendChild(ov);
    document.body.style.overflow = 'hidden';
    return;
  }
  /* 🔔 Notify Me when back in stock (out-of-stock products) */
  const nt = e.target.closest('[data-notify]');
  if (nt){
    e.preventDefault();
    const p = byId(nt.dataset.notify);
    if (!p) return;
    openModal('<h2 style="font-size:1.1rem;font-weight:800;margin-bottom:8px">🔔 Notify Me — ' + esc(p.name) + '</h2>' +
      '<p class="small muted" style="margin-bottom:10px">This saree is out of stock. Give us your WhatsApp number — we will message you the moment it is back.</p>' +
      '<div class="field"><label>WhatsApp / Mobile *</label><input id="ntPhone" placeholder="10-digit mobile" inputmode="numeric" maxlength="10"></div>' +
      '<button type="button" class="btn btn-maroon" id="ntSave" style="margin-top:8px">🔔 Notify Me</button>');
    document.getElementById('ntSave').addEventListener('click', () => {
      const ph = document.getElementById('ntPhone').value.trim();
      if (!validPhone(ph)){ toast('⚠️ Enter a valid 10-digit number'); return; }
      /* store locally + open WhatsApp to the store with the request */
      let list = [];
      try{ list = JSON.parse(localStorage.getItem('sk_notify') || '[]'); }catch(e){}
      list.push({ id: p.id, name: p.name, phone: ph, date: Date.now() });
      try{ localStorage.setItem('sk_notify', JSON.stringify(list.slice(-100))); }catch(e){}
      closeModal();
      toast('✅ We will notify you on WhatsApp!');
      try{ window.open(waLink('🔔 Please notify me when this saree is back in stock:\n\n🪡 ' + p.name + '\n(SKU: ' + p.sku + ')\n📱 My number: ' + ph + '\n\nPlease WhatsApp me when available. Thank you!'), '_blank', 'noopener'); }catch(e2){}
    });
    return;
  }
  /* close the zoom overlay */
  const zc = e.target.closest('[data-zoom-close]');
  if (zc){
    const ov = document.querySelector('.img-zoom');
    if (ov) ov.remove();
    document.body.style.overflow = '';
    return;
  }
  /* input sync for checkout */
});
document.addEventListener('input', function(e){
  if (e.target.id === 'coName') co.data.name = e.target.value;
  else if (e.target.id === 'coPhone') co.data.phone = e.target.value;
  else if (e.target.id === 'coAddr') co.data.address = e.target.value;
  else if (e.target.id === 'coPin') co.data.pincode = e.target.value;
  else if (e.target.id === 'coCoupon') co.data.coupon = e.target.value.toUpperCase().trim();
  else return;
  saveCoDraft();   /* remember address/name/phone/coupon as the user types */
});
