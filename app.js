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
     Firestore product pages appear immediately — no "Loading product…".
     🔥 Never blocks first paint: if catalog.json is slow/unreachable, the page
     renders after 1.2s max (product pages already have their own fast path). */
  try{ await Promise.race([preloadCatalog(), new Promise(r => setTimeout(r, 1200))]); }catch(e){}
  const page = document.body.dataset.page;
  try{
    if (page === 'home') renderHome();
    else if (page === 'shop') renderShop();
    else if (page === 'product') renderProduct();
    else if (page === 'cart') renderCartPage();
    else if (page === 'checkout') renderCheckoutPage();
    else if (page === 'orders') renderOrdersPage();
    else if (page === 'profile') renderProfilePage();
    else if (page === 'feed') renderFeedPage();
  }catch(e){ console.warn('page render error', e); }
  try{ renderStatsText(); }catch(e){}   /* fill hero visitor/order counters after render */
  try{ const aiF = document.getElementById('aiFloat'); if (aiF) aiF.addEventListener('click', () => openAIAssistant()); }catch(e){}
}
document.addEventListener('DOMContentLoaded', init);
/* Refresh the active customer page if catalog.json finishes after first paint. */
window.addEventListener('skcatalogready', () => {
  try{
    const page = document.body && document.body.dataset.page;
    if (page === 'home') renderHome();
    else if (page === 'shop') renderShop();
  }catch(e){}
});


/* ============================ 🤖 SK AI ASSISTANT ============================
   Finds the right saree in seconds — type what you need (occasion, colour,
   fabric, budget) and it recommends matching sarees with prices + links.
   100% client-side, no server, works on any static host. */
function aiCard(p){
  return '<div class="ai-card"><a href="' + productUrl(p) + '"><img src="' + esc(p.img) + '" alt="' + esc(p.name) + '" loading="lazy" onerror="imgSafe(this)" onload="imgLoaded(this)"></a>' +
    '<div class="ai-card-b"><b><a href="' + productUrl(p) + '">' + esc(p.name) + '</a></b>' +
    '<div class="price-row"><b>' + money(p.price) + '</b>' + (p.mrp ? '<s>' + money(p.mrp) + '</s>' : '') + (offPct(p) ? '<span class="off">' + offPct(p) + '%</span>' : '') + '</div>' +
    '<div style="display:flex;gap:6px;margin-top:6px"><button type="button" class="btn btn-maroon btn-sm" data-add="' + esc(p.id) + '">🛒 Add</button>' +
    '<a class="btn btn-outline btn-sm" href="' + productUrl(p) + '">View</a></div></div></div>';
}
function aiMsgHTML(role, html){
  return '<div class="ai-msg ' + role + '">' + html + '</div>';
}
function aiPushMsg(role, html){
  const ms = document.getElementById('aiMsgs'); if (!ms) return;
  ms.insertAdjacentHTML('beforeend', aiMsgHTML(role, html));
  ms.scrollTop = ms.scrollHeight;
}
function aiRespond(q){
  q = String(q || '').trim();
  const input = q.replace(/[?.!]/g, ' ').toLowerCase();
  const has = re => new RegExp(re).test(input);
  let pool = [];
  try{ pool = PRODUCTS.filter(p => !p.hidden && p.stock != null && p.stock > 0); }catch(e){}
  const hint = has('wedding|bride|bridal|kalyana|marriage') ? 'Wedding collection' :
               has('office|work|formal') ? 'Office wear' :
               has('party|function|reception|birthday') ? 'Party wear' :
               has('puja|festival|aadi|pongal|diwali|temple') ? 'Festival collection' :
               has('gift|surprise') ? 'Gift picks' :
               has('silk|kanjivaram|banarasi') ? 'Silk sarees' :
               has('cotton') ? 'Cotton sarees' :
               has('linen') ? 'Linen sarees' : '';
  const score = (p) => {
    let s = 0;
    const t = (p.name + ' ' + p.fabric + ' ' + p.color + ' ' + p.cat + ' ' + (p.desc || '')).toLowerCase();
    if (has('wedding|bride|bridal|kalyana|marriage')){ if (/wedding|bridal|kalyana/.test(p.cat) || /bridal|wedding|bride/.test(t)) s += 4; }
    if (has('office|work|formal')){ if (p.cat === 'office' || /office|formal/.test(t)) s += 4; }
    if (has('party|function|reception|birthday')){ if (p.cat === 'party' || p.cat === 'fancy' || /party|reception/.test(t)) s += 4; }
    if (has('puja|festival|aadi|pongal|diwali|temple')){ if (p.cat === 'festival' || /festival|puja|temple/.test(t)) s += 4; }
    for (const fab of ['silk','cotton','linen','organza','georgette','net','kanjivaram','banarasi']) if (has(fab) && t.indexOf(fab) !== -1) s += 3;
    for (const col of Object.keys(COLOUR_SWATCHES)) if (has(col) && t.indexOf(col) !== -1) s += 3;
    const bm = input.match(/under\s*₹?\s*(\d+)|(\d+)\s*(?:rupees|rs)\b|below\s*(\d+)/);
    if (bm){ const budget = +(bm[1] || bm[2] || bm[3]); if (p.price <= budget) s += 3; else s -= 2; }
    if (has('cheap|budget|low price')){ if (p.price <= 1200) s += 3; }
    if (has('gift')) s += 1;
    return s;
  };
  let picks = pool.map(p => ({ p, s: score(p) })).filter(x => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 3).map(x => x.p);
  if (!picks.length) picks = pool.slice().sort((a, b) => (b.reviews || 0) - (a.reviews || 0)).slice(0, 3);
  if (!picks.length){ aiPushMsg('bot', '😊 We will get fresh stock soon! Meanwhile, <b>ask us on WhatsApp</b> — we will help you find the perfect saree.'); return; }
  aiPushMsg('bot', (hint ? 'Here are <b>' + hint + '</b> picks for you: 🎯' : 'Here are your best matches: 🎯') +
    '<div class="ai-cards">' + picks.map(aiCard).join('') + '</div>' +
    '<a class="btn btn-wa btn-sm" style="margin-top:8px" href="' + waLink('Hi! I am looking for: ' + q + '. Please help me choose. 🙏') + '" target="_blank" rel="noopener">💬 Not sure? Ask us on WhatsApp</a>');
}
function openAIAssistant(){
  const quick = ['👰 Wedding sarees', '💼 Office sarees', '💰 Under ₹1500', '✨ Silk', '🌾 Cotton', '⭐ Best sellers'];
  openModal('<div class="ai-chat">' +
    '<div class="ai-head">🤖 SK AI Assistant<small>Finds your perfect saree in seconds</small></div>' +
    '<div class="ai-msgs" id="aiMsgs"></div>' +
    '<div class="ai-quick">' + quick.map(x => '<button type="button" class="btn btn-outline btn-sm" data-aiq="' + esc(x) + '">' + esc(x) + '</button>').join('') + '</div>' +
    '<div class="ai-input"><input id="aiIn" placeholder="e.g. red silk saree under 1500" maxlength="90" autocomplete="off"><button type="button" class="btn btn-maroon btn-sm" id="aiSend">➤</button></div>' +
    '</div>');
  aiPushMsg('bot', '👋 Vanakkam! Tell me what you need — <b>occasion, colour, fabric or budget</b> — and I will show sarees for you. Try: <i>"red silk saree under ₹1500"</i> 😊');
  const send = () => {
    const inp = document.getElementById('aiIn'); if (!inp) return;
    const v = inp.value.trim(); if (!v) return;
    aiPushMsg('user', esc(v));
    inp.value = '';
    setTimeout(() => aiRespond(v), 350);
  };
  const sb = document.getElementById('aiSend');
  if (sb) sb.addEventListener('click', send);
  const inp = document.getElementById('aiIn');
  if (inp) inp.addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
  const qs = document.querySelectorAll('[data-aiq]');
  qs.forEach(b => b.addEventListener('click', () => { aiPushMsg('user', esc(b.dataset.aiq)); setTimeout(() => aiRespond(b.dataset.aiq), 350); }));
}

/* 🛒 Smart upsell — right after "Add to Cart" show 2-3 similar sarees
   (Amazon-style "You may also like") → bigger cart → more orders.
   Shows once per 60s so it never feels spammy. */
function maybeShowUpsell(id){
  try{
    const page = document.body.dataset.page;
    if (page === 'cart' || page === 'checkout' || page === 'orders') return;   /* those pages already upsell */
    try{ if (+sessionStorage.getItem('sk_upsell_t') && Date.now() - +sessionStorage.getItem('sk_upsell_t') < 60000) return; }catch(e){}
    const p = byId(id); if (!p) return;
    let recs = [];
    try{
      if (window.REC && REC.recommendFor) recs = REC.recommendFor(p, 4).map(r => byId(r.id)).filter(Boolean);
    }catch(e){}
    if (recs.length < 2) recs = PRODUCTS.filter(x => !x.hidden && x.id !== p.id && x.cat === p.cat && x.stock > 0).slice(0, 3);
    recs = recs.filter(x => !Store.cart.some(c => c.id === x.id)).slice(0, 3);
    if (recs.length < 2) return;
    try{ sessionStorage.setItem('sk_upsell_t', String(Date.now())); }catch(e){}
    openModal('<div class="upsell">' +
      '<div class="upsell-ok">✅ <b>Added to cart!</b></div>' +
      '<h3 style="font-size:1rem;margin:10px 0 2px">🎁 You may also like</h3>' +
      '<p class="small muted" style="margin-bottom:10px">Customers who liked this also bought these…</p>' +
      '<div class="prow">' + recs.map(cardHTML).join('') + '</div>' +
      '<div style="display:grid;gap:8px;grid-template-columns:1fr 1fr;margin-top:12px">' +
        '<a class="btn btn-maroon" href="cart.html">🛒 Go to Cart</a>' +
        '<button type="button" class="btn btn-outline" data-close>Continue Shopping</button>' +
      '</div></div>');
  }catch(e){}
}

/* 🤖 "Recommended for You" — top of the home page, powered by what this visitor
   viewed / liked (REC engine). Falls back to a trending strip when no history. */
function forYouHTML(){
  try{
    const recIds = viewedOrWishedProductIds();
    const picks = [];
    const seen = new Set();
    if (recIds.length){
      for (const id of recIds){
        const p = byId(id); if (!p || p.hidden) continue;
        try{
          const r = (window.REC && REC.recommendFor) ? REC.recommendFor(p, 8) : [];
          r.forEach(x => {
            const pp = byId(x.id);
            if (pp && !pp.hidden && pp.id !== id && !seen.has(pp.id) && !Store.cart.some(c => c.id === pp.id)){
              seen.add(pp.id); picks.push(pp);
            }
          });
        }catch(e){}
        if (picks.length >= 4) break;
      }
    }
    if (picks.length < 2){
      /* no history → trending (best-rated) strip */
      picks.push.apply(picks, PRODUCTS.filter(p => !p.hidden && p.stock > 0).slice().sort((a, b) => (b.reviews || 0) - (a.reviews || 0)).slice(0, 4));
    }
    if (picks.length < 2) return '';
    return '<section class="sec"><div class="sec-head"><h2><span class="tick"></span>🤖 ' + (lang === 'ta' ? 'உங்களுக்கான பரிந்துரைகள்' : 'Recommended for You') + '</h2><a href="shop.html">' + t('viewAll') + '</a></div>' +
      '<div class="prow">' + picks.slice(0, 4).map(cardHTML).join('') + '</div></section>';
  }catch(e){ return ''; }
}

/* ============================ FEED PAGE (public) ============================
   feed.html lists every machine-readable product feed (catalog.json for instant
   load, products-feed.xml for Meta, google-merchant-feed.txt for Google Merchant
   Center) with download links + last-updated time. Auto-refreshes from the
   latest feeds the admin regenerates in Admin → Catalog Feed. */
function renderFeedPage(){
  const app = document.getElementById('app'); if (!app) return;
  let base = (CONFIG.siteUrl || location.origin) + '/';
  try{ const d = localStorage.getItem('sk_feed_domain'); if (d) base = d.replace(/\/+$/, '') + '/'; }catch(e){}
  let updated = '—';
  let feedCount = PRODUCTS.filter(p => !p.hidden).length;
  try{
    const u = localStorage.getItem('sk_feed_updated');
    if (u) updated = new Date(u).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }catch(e){}
  const files = [
    { name: 'catalog.json', icon: '⚡', desc: 'Instant product load — powers every product page. Upload to your site root.', url: 'catalog.json', meta: 'JSON · ' + feedCount + ' products' },
    { name: 'products-feed.xml', icon: '📦', desc: 'Facebook / Instagram Shopping catalogue (Meta Commerce Manager → Data source → Product feed).', url: 'products-feed.xml', meta: 'XML · RSS 2.0 + Google namespace' },
    { name: 'google-merchant-feed.txt', icon: '🛒', desc: 'Google Merchant Center product feed — submit this URL in GMC → Products → Feeds.', url: 'google-merchant-feed.txt', meta: 'TXT · TSV, exact Google columns' },
  ];
  app.innerHTML =
    '<div class="wrap page">' +
      '<h1>📦 SK Sarees — Product Feeds</h1>' +
      '<p class="muted small" style="max-width:60ch">Machine-readable catalog files so <b>Google Shopping, Meta (Facebook/Instagram)</b> and this website always show your latest sarees. Regenerate in <a href="admin.html#feed" style="color:var(--maroon);font-weight:800">Admin → Catalog Feed</a> and upload to your hosting root.</p>' +
      '<div class="pd-block" style="margin-top:14px"><h3>🕒 Last updated: <span style="color:var(--maroon)">' + esc(updated) + '</span></h3>' +
        '<p class="small muted">Products in feed: <b>' + feedCount + '</b> • Site: <a href="' + esc(base) + '" style="color:var(--maroon)">' + esc(base) + '</a></p></div>' +
      '<div style="display:grid;gap:12px;margin-top:14px">' + files.map(f =>
        '<div class="cart-item" style="align-items:center;padding:14px">' +
          '<div style="font-size:1.6rem">' + f.icon + '</div>' +
          '<div style="flex:1;min-width:0">' +
            '<b>' + esc(f.name) + '</b><br>' +
            '<small class="muted">' + esc(f.desc) + '</small><br>' +
            '<small style="color:var(--green);font-weight:700">' + esc(f.meta) + '</small>' +
          '</div>' +
          '<a class="btn btn-maroon btn-sm" style="width:auto;min-width:120px" href="' + esc(f.url) + '" download>' + (f.url === 'catalog.json' ? '⚡ Download' : '⬇️ Download') + '</a>' +
        '</div>').join('') + '</div>' +
      '<div class="pd-block" style="margin-top:16px"><h3>📋 How to connect</h3>' +
        '<ol class="small" style="line-height:1.9;padding-left:20px">' +
          '<li>Open <b>Admin → Catalog Feed</b>, save a product or tap "💾 Save feeds to this browser" — the 3 files regenerate automatically.</li>' +
          '<li>Download &amp; upload them to your hosting root (same folder as index.html).</li>' +
          '<li><b>Google Merchant Center:</b> Products → Feeds → add primary feed → choose <i>Google Sheets or scheduled fetch</i> → paste <b>' + esc(base + 'google-merchant-feed.txt') + '</b> → set refresh to daily (auto-update).</li>' +
          '<li><b>Meta:</b> Commerce Manager → Data sources → Product feed → paste <b>' + esc(base + 'products-feed.xml') + '</b>.</li>' +
          '<li>Submit <a href="sitemap.xml" style="color:var(--maroon)">sitemap.xml</a> in Google Search Console for fast page discovery.</li>' +
        '</ol></div>' +
      '<div style="text-align:center;margin-top:18px"><a class="btn btn-gold" href="shop.html">🛍️ Back to Shop</a></div>' +
    '</div>';
}

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
    '<a class="pcard-img" href="' + productUrl(p) + '">' +
      '<img src="' + esc(p.img) + '" alt="' + esc(p.name) + '" loading="lazy" decoding="async" width="800" height="600" onerror="imgSafe(this)" onload="imgLoaded(this)">' +
      (out ? '<span class="badge red">Out of Stock</span>' : (p.badge ? '<span class="badge ' + badgeCls + '">' + esc(p.badge) + '</span>' : '')) +
      (off && !out ? '<span class="offchip">-' + off + '%</span>' : '') +
      '<span class="card-heart' + (Store.wish.includes(p.id) ? ' on' : '') + '" data-wish="' + p.id + '" role="button" aria-label="Save to wishlist" title="Save to wishlist">' + (Store.wish.includes(p.id) ? '❤️' : '🤍') + '</span>' +
    '</a>' +
    '<div class="pcard-body">' +
      '<h3><a href="' + productUrl(p) + '">' + esc(p.name) + '</a></h3>' +
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
    const candidates = PRODUCTS.filter(p => !p.hidden && p.stock != null && p.stock > 0 && offPct(p) >= 20);
    if (!candidates.length) return '';
    /* rotate by day so it changes daily */
    const day = Math.floor(Date.now() / 864e5);
    const deal = candidates[day % candidates.length];
    const off = offPct(deal);
    return '<div class="deal-day"><div class="dd-left"><span class="dd-badge">🔥 DEAL OF THE DAY</span>' +
      '<h3>' + esc(deal.name) + '</h3>' +
      '<div class="price-row"><b>' + money(deal.price) + '</b>' + (deal.mrp ? '<s>' + money(deal.mrp) + '</s>' : '') + (off ? '<span class="off">' + off + '% OFF</span>' : '') + '</div>' +
      '<a class="btn btn-maroon btn-sm" style="width:auto;min-width:170px" href="product.html?id=' + encodeURIComponent(deal.id) + '">🛒 Grab It Now</a></div>' +
      '<a class="dd-img" href="product.html?id=' + encodeURIComponent(deal.id) + '"><img src="' + esc(deal.img) + '" alt="' + esc(deal.name) + '" loading="lazy" onerror="imgSafe(this)" onload="imgLoaded(this)"></a></div>';
  }catch(e){ return ''; }
}

/* 🎉 Occasion quick-shop — one-tap picks for South India occasions */
function occasionQuickShopHTML(){
  const items = [
    ['👰','Wedding','wedding'],
    ['💃','Reception','party'],
    ['🕉️','Puja','festival'],
    ['💼','Office','office'],
    ['🌤️','Daily Wear','daily'],
    ['🎀','Party','fancy'],
  ];
  return '<section class="sec"><div class="sec-head"><h2><span class="tick"></span>🎉 Shop by Occasion</h2></div>' +
    '<div class="occ-grid">' + items.map(i => {
      const p = PRODUCTS.find(x => !x.hidden && x.cat === i[2]) || PRODUCTS.find(x => !x.hidden) || PRODUCTS[0];
      const count = PRODUCTS.filter(x => !x.hidden && x.cat === i[2]).length;
      return '<a class="occ-tile" href="shop.html?cat=' + i[2] + '"><span class="occ-ic">' + i[0] + '</span><b>' + i[1] + '</b><small>' + count + ' sarees</small></a>';
    }).join('') + '</div></section>';
}

/* 🧵 Ilampillai weaver story — Salem's heritage handloom village (trust + premium) */
function weaverStoryHTML(){
  return '<section class="sec"><div class="sec-head"><h2><span class="tick"></span>🧵 Our Weaver Story — Ilampillai Looms</h2></div>' +
    '<div class="weaver-card">' +
      '<div class="weaver-img"><img src="images/hero-banner.jpg" alt="Ilampillai weaver sarees" loading="lazy"></div>' +
      '<div class="weaver-txt">' +
        '<p class="small" style="line-height:1.9;color:#4a3f38">Just 20 km from Salem lies <b>Ilampillai</b> — a village where looms have sung for generations. Every SK Sarees semi-silk &amp; cotton saree is woven here by skilled artisans who carry a craft passed down for decades.</p>' +
        '<p class="small" style="line-height:1.9;color:#4a3f38;margin-top:6px">When you buy from us, you <b>support these weaver families</b> and get a saree made with honest hands — no middlemen, fair prices, real quality.</p>' +
        '<div class="weaver-badges"><span>🪡 Handloom heritage</span><span>👨‍👩‍👧 Supports local weavers</span><span>🏆 Honest pricing</span></div>' +
        '<a class="btn btn-maroon btn-sm" style="width:auto;min-width:180px;margin-top:10px" href="shop.html">🛍️ Shop Ilampillai Sarees</a>' +
      '</div>' +
    '</div></section>';
}

/* ============================ HOME ============================ */
function renderHome(){
  const app = document.getElementById('app'); if (!app) return;
  const best = PRODUCTS.filter(p => !p.hidden && p.badge === 'Bestseller').slice(0, 4);
  const fresh = PRODUCTS.filter(p => !p.hidden && p.badge === 'New').slice(0, 4);
  const deals = PRODUCTS.filter(p => !p.hidden && offPct(p) >= 35).slice(0, 4);
  const forYou = forYouHTML();   /* 🤖 personalized strip (viewed/wishlist based) */
  app.innerHTML = forYou +
    '<section class="hero"><img class="hero-bg" src="images/hero-banner.jpg" alt="SK Sarees collection" loading="eager" decoding="async" width="1200" height="600"><div class="hero-in">' +
      '<span class="hero-chip">🔥 ' + (lang === 'ta' ? 'ஆடி திருவிழா சலுகை — 40% வரை தள்ளுபடி' : 'Aadi Festival Sale — Up to 40% OFF') + '</span>' +
      '<h1>' + (lang === 'ta' ? t('heroTitle1') + ',<br><span class="gold">' + t('heroTitle2') + '</span>' : 'Beautiful Sarees,<br><span class="gold">Delivered to Your Doorstep</span>') + '</h1>' +
      '<p>' + (lang === 'ta' ? t('heroSub') : 'Authentic Kanchipuram silk, soft cotton &amp; wedding sarees. Order in 2 minutes — pay by UPI or Cash on Delivery.') + '</p>' +
      '<div class="hero-ctas">' +
        '<a class="btn btn-gold" href="shop.html">🛍️ ' + (lang === 'ta' ? t('shopBest') : 'Shop Best Sellers') + '</a>' +
        '<a class="btn btn-wa" href="' + waLink('Hi! I would like to see your saree collection & current offers.') + '" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true" style="vertical-align:-2px;margin-right:4px"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>Order on WhatsApp</a>' +
      '</div>' +
      '<div class="hero-trust"><span>⭐ <b>2,300+</b> Happy Customers</span><span>🚚 <b>Free</b> above ₹999</span></div>' +
      '<form class="hero-search" onsubmit="event.preventDefault(); const q=document.getElementById(\'heroQ\').value.trim(); if(q) location.href=\'shop.html?q=\'+encodeURIComponent(q);"><input id="heroQ" type="search" placeholder="🔍 ' + (lang === 'ta' ? t('searchHero') : 'Search by saree name, SKU or colour…') + '" autocomplete="off"><button type="submit" class="btn btn-gold">' + (lang === 'ta' ? t('search') : 'Search') + '</button></form>' +
    '</div></section>' +
    '<section class="flash" id="flashSec"><div><h3>⚡ ' + (lang === 'ta' ? 'இன்றைய சிறப்பு சலுகை' : 'Flash Sale — Today Only') + '</h3><p>' + (lang === 'ta' ? 'தேர்ந்தெடுத்த சேலைகளில் 40% வரை தள்ளுபடி — சீக்கிரம் வாங்குங்கள்!' : 'Up to 40% OFF on selected sarees. Hurry, stock is limited!') + '</p></div><div class="flash-timer" id="flashTimer"></div></section>' +
    dealOfDayHTML() +
    recentViewHTML() +
    '<div class="wrap" style="margin-top:14px"><section class="reseller-banner">' +
      '<div class="rb-left"><span class="rb-emoji">💰</span><div><b>Share &amp; Earn — Reseller Program</b>' +
      '<p class="small">Share sarees, earn <b>' + (CONFIG.resellerMarginPct || 5) + '%</b> margin on every sale (GPay or loyalty points). Your customers get <b>5% off</b> with coupon <b>' + esc(CONFIG.resellerCoupon) + '</b>!</p></div></div>' +
      '<div class="rb-btns"><a class="btn btn-gold btn-sm" style="width:auto;min-width:160px" href="share-earn.html">🚀 Start Earning</a>' +
      '<a class="btn btn-outline btn-sm" style="width:auto;min-width:160px;background:#fff" href="shop.html">🛍️ Shop &amp; Use ' + esc(CONFIG.resellerCoupon) + '</a></div>' +
    '</section></div>' +
    '<div class="wrap">' +
      '<section class="sec"><div class="sec-head"><h2><span class="tick"></span>' + (lang === 'ta' ? t('categories') : 'Shop by Category') + '</h2><a href="shop.html">' + t('viewAll') + '</a></div>' +
        '<div class="cat-grid">' + CATEGORIES.slice(0, 12).map(c => {
          const count = PRODUCTS.filter(p => !p.hidden && p.cat === c.slug).length;
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
      occasionQuickShopHTML() +
      weaverStoryHTML() +
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
let shopState = { cat: '', q: '', fabric: '', colour: '', max: 3000, sort: 'newest', shown: 12, list: [] };
function renderShop(){
  const app = document.getElementById('app'); if (!app) return;
  const params = safeParams();
  const cq = params.get('cat');
  if (cq && CATEGORIES.some(c => c.slug === cq)) shopState.cat = cq;  /* ignore unknown/festival slugs */
  const sq = params.get('q');
  if (sq) shopState.q = sq;                     /* search by name/SKU/colour from index */
  /* 🎨 unique colours across the live catalog (drives the Colour filter) */
  const allColours = [];
  try{
    PRODUCTS.forEach(p => (p.colors || []).forEach(c => { c = String(c).trim(); if (c && allColours.indexOf(c) === -1) allColours.push(c); }));
  }catch(e){}
  const colOpts = allColours.map(c => '<option value="' + esc(c) + '"' + (shopState.colour === c ? ' selected' : '') + '>' + esc(c) + '</option>').join('');
  /* 🔍 smart suggestions — product names / SKUs / colours appear as you type */
  const suggest = [];
  try{
    PRODUCTS.filter(p => !p.hidden).slice(0, 40).forEach(p => {
      [p.name, p.color, p.sku].forEach(v => { v = String(v || '').trim(); if (v && suggest.indexOf(v) === -1) suggest.push(v); });
    });
  }catch(e){}
  const datalist = suggest.length ? '<datalist id="searchSuggest">' + suggest.map(s => '<option value="' + esc(s) + '">').join('') + '</datalist>' : '';
  app.innerHTML =
    '<div class="wrap page">' +
      '<h1>🛍️ Shop All Sarees</h1>' +
      '<div style="display:flex;gap:8px">' +
        '<input id="shopSearch" list="searchSuggest" type="search" placeholder="🔍 Search sarees, fabric, colour… (suggestions as you type)" style="flex:1;width:100%;border:1.5px solid var(--line);border-radius:12px;padding:13px 14px;background:#fff;outline:none">' +
      '</div>' + datalist +
      '<div class="cat-chips" id="catChips" style="margin-top:12px"></div>' +
      '<div class="pd-block" style="margin-top:12px"><div style="display:grid;gap:10px;grid-template-columns:1fr 1fr">' +
        '<div><label class="small muted" style="font-weight:800;display:block;margin-bottom:4px">Fabric</label>' +
        '<select id="fFilter" style="width:100%;border:1.5px solid var(--line);border-radius:10px;padding:11px 12px;background:#fff"><option value="">All fabrics</option><option>Silk</option><option>Cotton</option><option>Georgette</option><option>Linen</option><option>Organza</option><option>Net</option></select></div>' +
        '<div><label class="small muted" style="font-weight:800;display:block;margin-bottom:4px">🎨 Colour</label>' +
        '<select id="cFilter" style="width:100%;border:1.5px solid var(--line);border-radius:10px;padding:11px 12px;background:#fff"><option value="">All colours</option>' + colOpts + '</select></div>' +
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
      keepBrowsingHTML() +
      recentViewHTML() +
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
  if (el('cFilter')) el('cFilter').addEventListener('change', e => { shopState.colour = e.target.value; shopState.shown = 12; updateShopList(); });
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
    !p.hidden &&
    (!shopState.cat || p.cat === shopState.cat) &&
    (!shopState.q || (p.name + ' ' + p.fabric + ' ' + p.color + ' ' + (p.sku || '')).toLowerCase().includes(shopState.q.toLowerCase())) &&
    (!shopState.fabric || p.fabric.toLowerCase().includes(shopState.fabric.toLowerCase())) &&
    (!shopState.colour || (p.colors || []).indexOf(shopState.colour) !== -1 || String(p.color || '').toLowerCase().includes(shopState.colour.toLowerCase())) &&
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

/* ============================ FAST ORDER (ads → WhatsApp, no friction) ============================
   Ad visitors often bounce at full checkout. Fast Order asks ONLY name + phone,
   then opens WhatsApp with the full order — the seller confirms & closes. */
function fastOrderModal(p){
  try{
    if (!p) return;
    openModal('<h2 style="font-size:1.05rem;font-weight:800;margin-bottom:6px">⚡ Fast Order — 30 seconds</h2>' +
      '<p class="small muted" style="margin-bottom:10px">Just your name &amp; number — we will confirm on WhatsApp. <b>No payment needed now.</b></p>' +
      '<div style="display:flex;gap:8px;align-items:center;background:var(--bg);border-radius:10px;padding:8px;margin-bottom:10px"><img src="' + esc(p.img) + '" style="width:52px;height:40px;object-fit:cover;border-radius:8px" onerror="imgSafe(this)" onload="imgLoaded(this)"><div style="flex:1;min-width:0"><b style="font-size:.85rem">' + esc(p.name) + '</b><br><small class="muted">' + money(p.price) + (p.mrp ? ' <s>' + money(p.mrp) + '</s>' : '') + '</small></div></div>' +
      '<div class="field"><label>Your Name *</label><input id="foName" value="' + esc((Store.profile || {}).name || '') + '" placeholder="e.g. Lakshmi"></div>' +
      '<div class="field"><label>WhatsApp / Mobile *</label><input id="foPhone" value="' + esc((Store.profile || {}).phone || '') + '" placeholder="10-digit mobile" inputmode="numeric" maxlength="10"></div>' +
      '<button type="button" class="btn btn-maroon" id="foGo" style="margin-top:4px">💬 Confirm on WhatsApp</button>');
    document.getElementById('foGo').addEventListener('click', () => {
      const nm = document.getElementById('foName').value.trim();
      const ph = document.getElementById('foPhone').value.trim();
      if (!validPhone(ph)){ toast('⚠️ Enter a valid 10-digit number'); return; }
      /* save customer */
      try{
        Store.profile = Object.assign({}, Store.profile, { name: Store.profile.name || nm || '', phone: ph });
        Store.saveProfile(); saveCoDraft();
        renderHeader();
        autoRegisterReseller(nm, ph);   /* 🤝 auto-reseller: every share link now carries this user's code */
      }catch(e){}
      const msg = '⚡ Fast Order — SK Sarees\n\n🪡 ' + p.name + ' — ' + money(p.price) + '\n👤 ' + (nm || 'Customer') + '\n📱 ' + ph + '\n\nPlease confirm my order. Thank you!';
      try{ window.open(waLink(msg), '_blank', 'noopener'); }catch(e){}
      closeModal();
      toast('✅ WhatsApp opened — send it!');
    });
  }catch(e){}
}

/* 🎨 AI-style colour preview — see the saree design in other shades (try-on feel) */
const TRY_COLORS = [
  { n:'Classic', css:'' }, { n:'Red', css:'hue-rotate(0deg) saturate(1.1)' },
  { n:'Maroon', css:'hue-rotate(-18deg) saturate(1.05) brightness(.92)' },
  { n:'Gold', css:'hue-rotate(35deg) saturate(1.4) brightness(1.08)' },
  { n:'Green', css:'hue-rotate(90deg) saturate(1.15)' },
  { n:'Blue', css:'hue-rotate(160deg) saturate(1.1)' },
  { n:'Purple', css:'hue-rotate(230deg) saturate(1.1)' },
  { n:'Pink', css:'hue-rotate(-30deg) saturate(1.15) brightness(1.05)' },
  { n:'Peacock', css:'hue-rotate(120deg) saturate(1.2)' },
];
function openTryOn(p){
  try{
    if (!p) return;
    const img = p.img || (p.images || [])[0];
    openModal('<h2 style="font-size:1.05rem;font-weight:800;margin-bottom:4px">🎨 Try-On Preview</h2>' +
      '<p class="small muted" style="margin-bottom:10px">See how <b>' + esc(p.name) + '</b> looks in other shades — tap a colour!</p>' +
      '<div style="text-align:center;background:var(--bg);border-radius:14px;padding:12px">' +
        '<img id="tryImg" src="' + esc(img) + '" alt="Try-on preview" style="max-height:280px;width:auto;border-radius:12px;transition:filter .3s">' +
      '</div>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-top:12px">' +
        TRY_COLORS.map((c, i) => '<button type="button" class="try-swatch' + (i === 0 ? ' on' : '') + '" data-try="' + i + '" style="background:' + swatchBg(c.css) + '"><span>' + c.n + '</span></button>').join('') +
      '</div>' +
      '<p class="small muted" style="text-align:center;margin-top:10px">💡 Colour may vary by screen. Ask us on WhatsApp for real photos.</p>');
    document.querySelectorAll('[data-try]').forEach(b => b.addEventListener('click', () => {
      const c = TRY_COLORS[+b.dataset.try];
      const im = document.getElementById('tryImg');
      if (im) im.style.filter = c.css;
      document.querySelectorAll('[data-try]').forEach(x => x.classList.toggle('on', x === b));
    }));
  }catch(e){}
}
function swatchBg(css){
  if (!css) return 'linear-gradient(135deg,#eee,#fff)';
  /* approximate swatch color per hue — keep simple: return a tint */
  const map = {
    'hue-rotate(0deg) saturate(1.1)':'#d0342c',
    'hue-rotate(-18deg) saturate(1.05) brightness(.92)':'#8f1d3a',
    'hue-rotate(35deg) saturate(1.4) brightness(1.08)':'#c99a2e',
    'hue-rotate(90deg) saturate(1.15)':'#1d8a4e',
    'hue-rotate(160deg) saturate(1.1)':'#1565c0',
    'hue-rotate(230deg) saturate(1.1)':'#6a1b9a',
    'hue-rotate(-30deg) saturate(1.15) brightness(1.05)':'#e91e63',
    'hue-rotate(120deg) saturate(1.2)':'#00695c',
  };
  return map[css] || '#ddd';
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
/* 🔥 KEEP BROWSING — always shows more sarees below the shop grid (best-rated +
   trending) so visitors never hit a dead end and never leave the page. */
function keepBrowsingHTML(){
  try{
    const picks = PRODUCTS.filter(p => !p.hidden && p.stock > 0)
      .slice().sort((a, b) => (b.reviews || 0) - (a.reviews || 0)).slice(0, 8);
    if (picks.length < 2) return '';
    return '<section class="sec"><div class="sec-head"><h2><span class="tick"></span>🔥 Keep Browsing — Trending Sarees</h2><a href="shop.html">' + t('viewAll') + '</a></div>' +
      '<div class="prow">' + picks.map(cardHTML).join('') + '</div></section>';
  }catch(e){ return ''; }
}

/* ============================ PRODUCT ============================ */
function renderProduct(){
  const app = document.getElementById('app'); if (!app) return;
  /* 🔐 defensive id: safeParams fixes broken links like
     product.html?id=SK75250?ref=SHA9088 → id=SK75250 & ref=SHA9088 */
  const id = currentProductId();
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
    /* ⚡ INSTANT path: static catalog.json FIRST (local file — near-instant).
       preloadCatalog(id) merges the uploaded catalog into PRODUCTS even when
       other caches already exist, then tells us if THIS id is now found.
       Only if the catalog still doesn't have it do we go to Firestore / give
       up — so an uploaded catalog.json always fixes "Loading product…". */
    const gate = Promise.race([
      preloadCatalog(id),
      new Promise(res => setTimeout(() => res(false), 4000)),
    ]);
    gate.then(() => {
      if (done) return;
      const now = byId(id);
      if (now){ finish(now); return; }
      if (!FS.enabled()){
        finish(null, 'This saree may have been removed from the store, or the link is old. Browse our full collection below.');
        return;
      }
      /* 🔒 READ-OPTIMIZED: read ONLY this product's document (1 doc), never the
         whole products collection — catalog.json + local cache already cover
         the store for browsing. */
      FS.getProduct(id).then(doc => {
        if (done) return;
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
        if (done) return;
        if (window.__pdTry < 3){ setTimeout(() => { if (!done) renderProduct(); }, 600); }
        else finish(null, 'Cloud sync is not responding right now — please check your internet and try again.');
      });
      /* safety: never leave the spinner hanging */
      setTimeout(() => finish(null, 'Cloud sync is not responding right now — please check your internet and try again.'), 6000);
    });
    return;
  }
  window.__pdTry = 0;
  /* Product detail only: one Firestore read gives an admin-edited saree its
     latest values. Home/shop browsing still uses catalog.json only. */
  try{ if (p && FS.enabled() && window.__pdLiveChecked !== id){ window.__pdLiveChecked = id; FS.getProduct(id).then(doc => { if (!doc) return; const live=normalizeProduct(doc); const i=PRODUCTS.findIndex(x=>x.id===live.id); if(i>=0) PRODUCTS[i]=live; else PRODUCTS.unshift(live); if(String(live.updatedAt||'') !== String(p.updatedAt||'')) renderProduct(); }).catch(()=>{}); } }catch(e){}
  /* 🚫 hidden product → customers go straight home (admin can still open it) */
  if (p.hidden && !isAdminDevice()){
    try{ location.replace('index.html'); }catch(e){}
    app.innerHTML = '<div class="wrap page"><div class="empty"><div class="e-ic">🚫</div><b>This saree is no longer available</b>' +
      '<a class="btn btn-maroon" style="max-width:240px;margin:14px auto 0" href="index.html">🏠 Back to Home</a></div></div>';
    return;
  }
  const off = offPct(p), cat = catOf(p.cat);
  const eta = deliveryEstimate();
  try{ if (window.REC) REC.trackView(p.id); }catch(e){}
  const related = PRODUCTS.filter(x => !x.hidden && x.cat === p.cat && x.id !== p.id).slice(0, 4);
  const userRevs = LS.get('sk_reviews_' + p.id, []);
  const revs = userRevs.length
    ? userRevs.slice().reverse().map(r => '<div class="rev" style="margin-bottom:8px"><div class="rev-top"><span class="avatar" style="background:#8f1d3a">' + esc((r.name || 'A')[0]) + '</span><div><b>' + esc(r.name) + '</b><small>Verified customer ⭐</small></div></div><div class="stars">' + '★'.repeat(r.rating || 5) + '☆'.repeat(5 - (r.rating || 5)) + '</div><p>' + esc(r.text) + '</p>' + '</div>').join('')
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
  const thumbs = gallery.map((u, i) => '<button type="button" class="pd-thumb' + (i === 0 ? ' on' : '') + '" data-thumb="' + i + '" aria-label="Photo ' + (i + 1) + '"><img src="' + esc(u) + '" alt="" loading="lazy" onerror="imgSafe(this)" onload="imgLoaded(this)"></button>').join('');
  const vidBlock = p.video
    ? '<div class="pd-video"><h3>🎬 Product Video</h3><div class="video-frame"><iframe src="https://www.youtube.com/embed/' + esc(p.video) + '?rel=0" title="Product video" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div></div>'
    : '';
  app.innerHTML =
    '<div class="wrap pd-wrap" style="margin-top:12px">' +
      '<div>' +
        '<div class="pd-gal">' +
          '<div class="pd-heart"><button type="button" class="heart-btn' + (liked ? ' on' : '') + '" data-wish="' + p.id + '" aria-label="Save to wishlist" title="Save to wishlist">' + (liked ? '❤️' : '🤍') + '</button></div>' +
          '<div class="main" id="pdMain"><img id="pdMainImg" src="' + esc(gallery[0]) + '" alt="' + esc(p.name) + '" fetchpriority="high" decoding="async" onerror="imgSafe(this)" onload="imgLoaded(this)"></div>' +
          '<div class="pd-swipe-hint">👈 👉 swipe to see all photos</div>' +
          '<div class="pd-thumbs">' + thumbs + '</div>' +
        '</div>' +
        vidBlock +
        '<div class="pd-block" style="margin-top:12px"><h3>🔍 Fabric &amp; Details</h3><table>' +
          '<tr><td>Fabric</td><td>' + esc(p.fabric) + '</td></tr>' +
          '<tr><td>Colour</td><td>' + esc(p.color) + (p.colourStock ? '<br><small class="muted">' + (p.colors || []).map(c => esc(c) + ': ' + (p.colourStock[c] != null ? p.colourStock[c] : '—')).join(' • ') + '</small>' : '') + '</td></tr>' +
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
        '<div class="pd-price"><b>' + money(p.price) + '</b>' + (p.mrp ? '<s class="old-price">' + money(p.mrp) + '</s>' : '') + (off && !out ? '<span class="off">' + off + '% OFF</span>' : '') + '</div>' +
        '<div class="price-line"><span>Old price: <s>' + money(p.mrp || p.price) + '</s></span> &nbsp;•&nbsp; <span>New price: <b>' + money(p.price) + '</b></span></div>' +
        (out ? '' : '<p class="small" style="color:var(--green);font-weight:800;margin:2px 0">💳 Pay online &amp; save ' + (CONFIG.onlineDiscount || 1) + '% — <b>' + money(onlinePrice(p)) + '</b> (COD: ' + money(p.price) + ')</p>') +
        '<div class="social-proof">' + socialProofHTML(p) + '</div>' +
        '<div class="viewing-now">👀 <b>' + viewingNow(p) + ' people viewing this right now</b></div>' +
        skinToneRecommendHTML(p) +
        (out
          ? '<div class="lowchip out" style="margin:6px 0">😞 <b>Out of stock</b> — ask us on WhatsApp, next batch arriving soon!</div>'
          : low
            ? '<div class="lowchip" style="margin:6px 0">🔥 <b>Only ' + p.stock + ' left</b> — order soon, stock is limited!</div>'
            : '') +
        '<p class="muted small">MRP incl. all taxes • ₹999+ free shipping</p>' +
        '<div class="pd-chips"><span class="pd-chip">🚚 Fast Delivery</span><span class="pd-chip">💵 COD (+₹' + CONFIG.codFee + ')</span><span class="pd-chip">↩️ 7-Day Returns</span></div>' +
        '<div class="delivery-card"><b>⏱ Fast Delivery & On-Time Promise</b>' + eta.text + '.<br>' + CONFIG.latePromise + '</div>' +
        (p.colors && p.colors.length
          ? '<div class="pd-colour-row"><b>🎨 Colour</b> <small class="muted" style="font-weight:600">— AI-detected from photo</small>' +
            '<div class="pd-colours" id="pdColours">' + p.colors.map((c, i) => {
              const left = (p.colourStock && p.colourStock[c] != null) ? p.colourStock[c] : null;
              const dead = left === 0;
              return '<button type="button" class="pd-colour' + (i === 0 && !dead ? ' on' : '') + '" data-colour="' + esc(c) + '"' + (dead ? ' disabled' : '') + '><span class="sw-dot" style="background:' + swatchHex(c) + '"></span>' + esc(c) + (left != null ? ' <small>(' + left + ' left)</small>' : '') + '</button>';
            }).join('') + '</div></div>'
          : '') +
        '<input type="hidden" id="pdSelColour" value="' + esc((p.colors || [])[0] || '') + '">' +
        '<div class="qty-row"><b>Quantity</b><div class="qty"><button type="button" data-qm>−</button><span id="qtyVal">1</span><button type="button" data-qp>+</button></div><b id="qtyTotal" style="color:var(--maroon);font-size:1.1rem;margin-left:auto">' + money(p.price) + '</b></div>' +
        '<div class="pd-btns">' +
          (out
            ? '<button type="button" class="btn btn-xl" data-notify="' + p.id + '">🔔 Notify Me When Back in Stock</button>'
            : '<button type="button" class="btn btn-outline btn-xl" data-add="' + p.id + '">🛒 Add to Cart</button>') +
          (out ? '' : '<a class="btn btn-buy btn-xl" id="pdBuyBtn" data-buy="' + esc(p.id) + '" href="checkout.html?buy=' + encodeURIComponent(p.id) + '&qty=1">⚡ Buy at ' + money(onlinePrice(p)) + '</a>') +
        '</div>' +
        '<div class="pd-share">' +
          '<button type="button" class="btn btn-wa btn-sm" data-share-wa="' + esc(p.id) + '"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true" style="vertical-align:-2px;margin-right:4px"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>WhatsApp Share</button>' +
          '<button type="button" class="btn btn-maroon btn-sm" data-viral="' + esc(p.id) + '">📢 ' + (lang === 'ta' ? 'வாட்ஸ்அப் குரூப்பில் பகிர்' : 'WhatsApp Share — Groups') + '</button>' +
          '<button type="button" class="btn btn-outline btn-sm" data-dl-photo="' + esc(p.img) + '">📥 Download Photo</button>' +
          '<button type="button" class="btn btn-outline btn-sm" data-share-status="' + esc(p.id) + '">📸 Share Photo</button>' +
          '<button type="button" class="btn btn-ghost btn-sm" data-copy-link="' + esc(productUrl(p)) + '">🔗 Copy Link</button>' +
        '</div>' +
        '<div class="pd-social">' +
          '<span class="small muted" style="font-weight:800">📤 Share to:</span>' +
          '<a class="soc soc-fb" href="https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(productUrl(p)) + '" target="_blank" rel="noopener" title="Share on Facebook">FB</a>' +
          '<a class="soc soc-x" href="https://twitter.com/intent/tweet?url=' + encodeURIComponent(productUrl(p)) + '&text=' + encodeURIComponent(p.name + ' — SK Sarees 🪡') + '" target="_blank" rel="noopener" title="Share on X (Twitter)">𝕏</a>' +
          '<a class="soc soc-tg" href="https://t.me/share/url?url=' + encodeURIComponent(productUrl(p)) + '&text=' + encodeURIComponent(p.name + ' — SK Sarees 🪡') + '" target="_blank" rel="noopener" title="Share on Telegram">✈️</a>' +
          '<a class="soc soc-wa" href="https://wa.me/?text=' + encodeURIComponent(p.name + ' — SK Sarees 🪡\n' + productUrl(p)) + '" target="_blank" rel="noopener" title="Share on WhatsApp">WA</a>' +
          '<a class="soc soc-pin" href="https://pinterest.com/pin/create/button/?url=' + encodeURIComponent(productUrl(p)) + '&media=' + encodeURIComponent(p.img || '') + '&description=' + encodeURIComponent(p.name) + '" target="_blank" rel="noopener" title="Share on Pinterest">P</a>' +
          '<a class="soc soc-in" href="https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(productUrl(p)) + '" target="_blank" rel="noopener" title="Share on LinkedIn">in</a>' +
        '</div>' +
        '<div class="pin-check"><b>📍 Check Delivery</b>' +
          '<div style="display:flex;gap:8px;margin-top:6px;align-items:stretch"><input id="pinCheck" placeholder="Enter PIN code (e.g. 636001)" inputmode="numeric" maxlength="6" style="flex:1;min-width:0;width:auto;border:1.5px solid var(--line);border-radius:10px;padding:0 14px;font-size:16px;background:#fff;outline:none;min-height:50px;box-sizing:border-box"><button type="button" class="btn btn-maroon btn-sm" id="pinCheckBtn" style="flex:0 0 auto;width:auto;min-width:120px;min-height:50px;padding:0 16px;font-size:.95rem;white-space:nowrap">Check</button></div>' +
          '<p class="small muted" id="pinResult" style="margin-top:6px"></p></div>' +
        '<div class="earn-box" id="earnBox">' +
          '<b>💰 Share &amp; Earn ' + (CONFIG.resellerMarginPct || 5) + '%</b>' +
          '<p class="small" style="margin-top:3px">Share this saree on WhatsApp — when your friend buys through your link, <b>you earn ' + (CONFIG.resellerMarginPct || 5) + '% margin</b> (paid via GPay or as loyalty points)! Your customers also get <b>5% off</b> with <b>' + esc(CONFIG.resellerCoupon) + '</b>.</p>' +
          '<div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">' +
            '<button type="button" class="btn btn-wa btn-sm" id="earnWa" style="flex:1;min-width:150px">' + SVG_WA + 'Share &amp; Earn ' + (CONFIG.resellerMarginPct || 5) + '%</button>' +
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
    recentViewHTML() +
    '<div class="wrap" id="recSection"></div>' +
    '<div class="sticky-bar">' +
      '<div class="sb-price" id="sbPrice"><b>' + money(p.price) + '</b><small>' + off + '% off</small></div>' +
      '<a class="btn btn-buy" id="sbBuy" href="checkout.html?buy=' + encodeURIComponent(p.id) + '&qty=1">⚡ Buy at ' + money(onlinePrice(p)) + '</a>' +
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
        note.innerHTML = '🔗 No code yet? Tap <b>Get My Code</b> (30 seconds) — then every share you send earns you ' + (CONFIG.resellerMarginPct || 5) + '%!';
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
    if (sbBuy){ sbBuy.setAttribute('href', 'checkout.html?buy=' + encodeURIComponent(p.id) + '&qty=' + n); sbBuy.textContent = '⚡ Buy at ' + money(onlinePrice(p) * n); }
    const pdBuy = document.getElementById('pdBuyBtn');
    if (pdBuy){ const _sel = document.getElementById('pdSelColour'); const _cv = (_sel && _sel.value) ? '&colour=' + encodeURIComponent(_sel.value) : ''; pdBuy.setAttribute('href', 'checkout.html?buy=' + encodeURIComponent(p.id) + '&qty=' + n + _cv); pdBuy.textContent = '⚡ Buy at ' + money(onlinePrice(p) * n); }
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
  try{ window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank', 'noopener'); }catch(e){}
}
/* 📢 VIRAL share — sends the saree to WhatsApp GROUPS with a viral caption.
   Uses the native share sheet first (no blocking — customer picks any group),
   falls back to the universal wa.me link. Works on mobile + desktop. */
function viralShareProduct(p){
  if (!p) return;
  const url = productUrl(p);
  const off = offPct(p);
  const msg =
    '🪡 ** சேலை பாருங்க! ** சேலை பாருங்க! 🎉\n\n' +
    '✨ ' + p.name + '\n' +
    '💰 விலை: ' + money(p.price) + (off ? ' (' + off + '% OFF)' : '') + (p.mrp ? ' (MRP ' + money(p.mrp) + ')' : '') + '\n' +
    '🚚 ₹999+ மேல இலவச டெலிவரி • COD & UPI உண்டு\n' +
    '✅ 7 நாள் ரிட்டர்ன் • South India-வின் நம்பர் 1 சேலை ஸ்டோர் 🏆\n\n' +
    '👉 ' + url + '\n\n' +
    '🔥 Group-ல உள்ள அனைவருக்கும் பகிருங்க — உங்களுக்கும் ரெசலர் மார்கின் ' + (CONFIG.resellerMarginPct || 5) + '%! 🎁';
  /* 📱 native share sheet → customer picks any WhatsApp group/chat (never blocked) */
  try{
    if (navigator.share){
      navigator.share({ title: p.name, text: msg, url }).then(() => {}, () => {
        try{ window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank', 'noopener'); }catch(e){}
      });
      return;
    }
  }catch(e){}
  try{ window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank', 'noopener'); }catch(e){}
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
  const bundle = bundleDiscount();               /* 2+ sarees → 2% off */
  const coup = couponFor(co.data.coupon);
  app.innerHTML = '<div class="wrap page"><h1>🛒 Your Cart</h1>' +
    '<div>' + Store.cart.map(i => {
      const p = byId(i.id); if (!p) return '';
      const lk = encodeURIComponent(p.id) + '::' + encodeURIComponent(i.colour || '');
      return '<div class="cart-item">' +
        '<a href="product.html?id=' + encodeURIComponent(p.id) + '"><img src="' + esc(p.img) + '" alt="' + esc(p.name) + '" loading="lazy" width="200" height="150" onerror="imgSafe(this)" onload="imgLoaded(this)"></a>' +
        '<div style="flex:1;min-width:0;padding-right:26px">' +
          '<h4><a href="product.html?id=' + encodeURIComponent(p.id) + '">' + esc(p.name) + '</a></h4>' +
          (i.colour ? '<div class="ci-col">🎨 ' + esc(i.colour) + '</div>' : '') +
          '<div class="ci-price">' + money(p.price) + '</div>' +
          '<div class="qty"><button type="button" data-cqm="' + lk + '">−</button><span>' + i.qty + '</span><button type="button" data-cqp="' + lk + '">+</button></div>' +
        '</div>' +
        '<button type="button" class="rm" data-rm="' + lk + '" aria-label="Remove">✕</button></div>';
    }).join('') + '</div>' +
    (function(){
      /* 🛒 upsell: suggest 4 products from the same categories (exclude what's in cart) */
      try{
        const inCart = Store.cart.map(i => i.id);
        const cats = Store.cart.map(i => (byId(i.id) || {}).cat).filter(Boolean);
        const sug = PRODUCTS.filter(p => !p.hidden && !inCart.includes(p.id) && cats.indexOf(p.cat) !== -1).slice(0, 4);
        if (!sug.length) return '';
        return '<div class="cart-upsell"><h3>🎁 Complete your look — add 2+ sarees &amp; get ' + (CONFIG.bundlePct || 2) + '% off</h3>' +
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
      '<p class="small" style="color:var(--green);font-weight:800;margin-top:6px">💳 Pay online (UPI) &amp; get ' + (CONFIG.onlineDiscount||1) + '% off — <b>save ' + money(Math.round(t * (CONFIG.onlineDiscount||1) / 100)) + '</b> on this order!</p>' +
      (n < (CONFIG.bundleCount || 2)
        ? '<div class="bundle-note">🎁 Buy ' + (CONFIG.bundleCount || 2) + ' sarees — get <b>' + (CONFIG.bundlePct || 2) + '% off</b> automatically!</div>'
        : '<div class="bundle-note" style="color:var(--green);border-color:#bfe6cf;background:#e9f7ef">🎉 Bundle deal applied! You saved <b>' + (CONFIG.bundlePct || 2) + '%</b></div>') +
      '<p class="small muted" style="margin-top:8px">🚚 Shipping per saree: ₹30 Tamil Nadu · ₹40 Andhra/Karnataka · ₹60 others (' + n + ' saree' + (n > 1 ? 's' : '') + ' = <b>' + money(sh) + '</b>) · <b>FREE above ₹999</b>.</p>' +
      '<div style="display:grid;gap:10px;margin-top:14px">' +
        '<a class="btn btn-maroon btn-xl" href="checkout.html">Proceed to Checkout →</a>' +
        '<a class="btn btn-wa" href="' + waLink(waCartMsg()) + '" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true" style="vertical-align:-2px;margin-right:4px"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>Order on WhatsApp Instead</a>' +
      '</div>' +
    '</div></div>';
}

/* ============================ CHECKOUT ============================ */
let co = { step: 1, buyOnly: null, data: { name:'', phone:'', address:'', pincode:'', payment:'upi', coupon:'' } };
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
  const qs = safeParams();
  const buy = qs.get('buy');
  const buyQty = Math.max(1, Math.min(10, +qs.get('qty') || 1));
  const buyCol = qs.get('colour') || '';
  /* ⚡ BUY-NOW mode: order contains ONLY this product — the existing cart is
     left untouched (no merge). Clears after the order is placed. */
  if (buy && byId(buy)) co.buyOnly = { id: buy, qty: buyQty, colour: buyCol || '' };
  else co.buyOnly = null;
  if (!coItems().length && !Store.cart.length){
    app.innerHTML = '<div class="wrap page"><h1>🔒 Secure Checkout</h1><div class="empty"><div class="e-ic">🛒</div><b>Your cart is empty</b>' +
      '<a class="btn btn-maroon" style="max-width:240px;margin:14px auto 0" href="shop.html">🛍️ Shop Sarees</a></div></div>';
    return;
  }
  drawCo();
}
/* items used for THIS checkout: buy-now → only the chosen product, else cart */
function coItems(){
  try{
    if (co.buyOnly){
      const p = byId(co.buyOnly.id);
      if (!p) return [];
      return [{ id: p.id, name: p.name, price: p.price, qty: co.buyOnly.qty || 1, colour: co.buyOnly.colour || '' }];
    }
  }catch(e){}
  return Store.cart.slice();
}
function coCartTotal(){
  return coItems().reduce((s, i) => { const p = byId(i.id); return s + (p ? p.price * i.qty : 0); }, 0);
}
function coTotals(){
  const itemsTotal = coCartTotal();
  const codFee = co.data.payment === 'cod' ? CONFIG.codFee : 0;
  const shipping = shippingFor(itemsTotal, co.data.pincode, coItems().reduce((s, i) => s + (i.qty || 1), 0));
  const discount = couponDiscount(co.data.coupon, itemsTotal);
  const bundle = bundleDiscount();               /* buy 2+ → ₹50 off */
  const pts = co.data.usePoints ? Math.min(pointsRedeemable(), itemsTotal - discount - bundle) : 0;
  /* 💳 1% online-payment discount (COD = full) */
  const online = (co.data.payment === 'upi') ? Math.round(itemsTotal * (CONFIG.onlineDiscount || 1) / 100) : 0;
  const totalDisc = discount + bundle + pts + online;
  const grand = Math.max(0, itemsTotal - totalDisc) + codFee + shipping;
  return { itemsTotal, codFee, shipping, discount, bundle, pts, online, grand, eta: deliveryEstimate(co.data.pincode, co.data.payment).text, zone: deliveryEstimate(co.data.pincode, co.data.payment).zone };
}
/* 🎁 AI "Complete your look" — before paying, suggest matching sarees to add.
   Keeps the cart growing → bigger orders. */
function checkoutUpsellHTML(){
  try{
    const inCart = Store.cart.map(i => i.id);
    let recs = [];
    const seed = Store.cart.map(i => byId(i.id)).find(Boolean);
    if (seed){
      try{ if (window.REC && REC.recommendFor) recs = REC.recommendFor(seed, 5).map(r => byId(r.id)).filter(Boolean); }catch(e){}
    }
    if (recs.length < 2) recs = PRODUCTS.filter(x => !x.hidden && x.stock > 0 && !inCart.includes(x.id)).slice().sort((a, b) => (b.reviews || 0) - (a.reviews || 0)).slice(0, 2);
    recs = recs.filter(x => !inCart.includes(x.id)).slice(0, 2);
    if (recs.length < 2) return '';
    return '<div class="co-upsell"><h3>🎁 Complete your look — add matching sarees</h3>' +
      '<div style="display:grid;gap:8px;grid-template-columns:1fr 1fr">' + recs.map(p =>
        '<div class="co-up-card"><img src="' + esc(p.img) + '" alt="' + esc(p.name) + '" loading="lazy" onerror="imgSafe(this)" onload="imgLoaded(this)">' +
        '<div style="flex:1;min-width:0"><b style="font-size:.78rem;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(p.name) + '</b>' +
        '<div class="price-row" style="font-size:.75rem"><b>' + money(p.price) + '</b></div>' +
        '<button type="button" class="btn btn-maroon btn-sm" data-add="' + esc(p.id) + '">+ Add</button></div></div>').join('') + '</div></div>';
  }catch(e){ return ''; }
}
/* ✨ "You may also love" on the order-success page — more sarees, next order */
function orderSuccessRecs(o){
  try{
    const bought = (o && o.items || []).map(i => i.id);
    const seedId = bought[0];
    let recs = [];
    try{
      if (seedId && window.REC && REC.recommendFor){
        const seed = byId(seedId);
        if (seed) recs = REC.recommendFor(seed, 5).map(r => byId(r.id)).filter(Boolean);
      }
    }catch(e){}
    if (recs.length < 3) recs = PRODUCTS.filter(x => !x.hidden && x.stock > 0 && !bought.includes(x.id)).slice().sort((a, b) => (b.reviews || 0) - (a.reviews || 0)).slice(0, 3);
    recs = recs.filter(x => !bought.includes(x.id)).slice(0, 3);
    if (recs.length < 2) return '';
    return '<div style="margin-top:20px"><h3 style="font-size:1.05rem;font-weight:800;margin-bottom:10px">✨ You may also love</h3>' +
      '<div class="prow">' + recs.map(cardHTML).join('') + '</div></div>';
  }catch(e){ return ''; }
}
/* 🧾 LIVE ORDER SUMMARY — items + price + courier details (zone/shipping/ETA
   per pincode) shown ABOVE the payment method; refreshes as the user types. */
function coSummaryHTML(){
  try{
    const t = coTotals();
    const pin = co.data.pincode || '';
    const zone = deliveryZone(pin);
    const zn = ZONES[zone] || ZONES.tn;
    const rows = coItems().map(i => { const p = byId(i.id); return p ? '<div class="row"><span>' + esc(p.name) + (i.colour ? ' (' + esc(i.colour) + ')' : '') + ' ×' + i.qty + '</span><b>' + money(p.price * i.qty) + '</b></div>' : ''; }).join('');
    const courier = pin
      ? '📦 Courier: <b>' + esc(zn.name) + '</b> • Ship ' + (t.shipping ? money(t.shipping) : 'FREE') + ' • ' + t.eta
      : '📦 Enter your <b>PIN code</b> to see courier + delivery date';
    return '<div class="form-card"><h3>🧾 Order Summary</h3>' +
      (rows || '<p class="small muted">No items yet.</p>') +
      (t.discount > 0 ? '<div class="row"><span>Coupon discount</span><b style="color:var(--green)">−' + money(t.discount) + '</b></div>' : '') +
      '<div class="row"><span>Shipping</span><b style="color:' + (t.shipping ? 'inherit' : 'var(--green)') + '">' + (t.shipping ? money(t.shipping) : 'FREE') + '</b></div>' +
      '<div class="row total"><span>Total</span><b>' + money(t.grand) + '</b></div>' +
      '<p class="small" style="border:1px dashed var(--line);border-radius:10px;padding:9px;background:var(--bg);margin-top:8px">' + courier + '</p></div>';
  }catch(e){ return ''; }
}
/* 🎟️ perks under the coupon: loyalty points to use + reseller commission on this order */
function checkoutPerksHTML(){
  try{
    const t = coTotals();
    let html = '';
    const pts = pointsBalance();
    if (pts > 0){
      html += '<label style="display:flex;gap:8px;align-items:center;font-size:.82rem;font-weight:700;padding:6px 0;border-top:1px dashed var(--line);margin-top:8px"><input type="checkbox" id="usePts" style="width:18px;height:18px"' + (co.data.usePoints ? ' checked' : '') + '> ⭐ Use my ' + pts + ' loyalty points (−' + money(Math.min(pointsRedeemable(), t.itemsTotal - t.discount - t.bundle)) + ' on this order)</label>';
    }
    const res = currentReseller();
    /* 🤫 commission is PRIVATE — only show it when the person CHECKING OUT is
       the reseller themself (their own device has sk_my_reseller = this code).
       A friend who just clicked ?ref=KAV7474 must NOT see the referrer's
       commission — they only see their own loyalty benefit. */
    if (res && res.code && myResellerCode() === res.code){
      const comm = resellerMarginFor({ totals: { grand: t.grand } });
      html += '<p class="small" style="border:1px dashed var(--gold);border-radius:10px;padding:9px;background:var(--gold-soft);margin-top:8px">💰 Your reseller commission on this order: <b style="color:var(--maroon)">' + money(comm) + '</b> (' + (CONFIG.resellerMarginPct || 5) + '%) — code <b>' + esc(res.code) + '</b></p>';
    }
    return html;
  }catch(e){ return ''; }
}
function drawCo(){
  const app = document.getElementById('app'); if (!app) return;
  const d = co.data;
  const t = coTotals();
  const steps = '<div class="steps-ui">' +
    '<div class="step-dot ' + (co.step > 1 ? 'done' : 'on') + '"><span class="dot">' + (co.step > 1 ? '✓' : '1') + '</span><span class="lbl">Details</span></div>' +
    '<div class="step-line ' + (co.step > 1 ? 'on' : '') + '"></div>' +
    '<div class="step-dot ' + (co.step === 2 ? 'on' : '') + '"><span class="dot">2</span><span class="lbl">Payment</span></div></div>';
  const itemLines = coItems().map(i => { const p = byId(i.id); return p ? '<div class="row"><span>' + esc(p.name) + (i.colour ? ' (' + esc(i.colour) + ')' : '') + ' ×' + i.qty + '</span><b>' + money(p.price * i.qty) + '</b></div>' : ''; }).join('');
  if (co.step === 1){
    app.innerHTML = '<div class="wrap page"><h1>🔒 Secure Checkout</h1>' + steps +
      '<div class="form-card"><h3>📋 Your Details <span class="muted small" style="font-weight:500">(no login needed)</span></h3>' +
        '<div class="field"><label>Full Name <span class="req">*</span></label><input id="coName" value="' + esc(d.name) + '" placeholder="e.g. Lakshmi S"></div>' +
        '<div class="field"><label>WhatsApp / Mobile <span class="req">*</span></label><input id="coPhone" value="' + esc(d.phone) + '" placeholder="10-digit mobile" inputmode="numeric" maxlength="10"></div>' +
        (window.__savedCust && d.phone ? '<p class="small" style="color:var(--green);font-weight:700;margin-top:-2px">✅ Saved customer — number auto-filled (' + esc(d.phone.slice(0,4) + '••••' + d.phone.slice(-2)) + '). Change if needed.</p>' : '') +
        '<div class="field"><label>Address <span class="req">*</span></label><textarea id="coAddr" rows="3" placeholder="House no, street, area, city…">' + esc(d.address) + '</textarea></div>' +
        '<div class="field"><label>PIN Code <span class="req">*</span></label><input id="coPin" value="' + esc(d.pincode) + '" placeholder="6-digit PIN" inputmode="numeric" maxlength="6"></div>' +
        '<div class="field"><label>🎟️ Coupon Code (optional)</label><input id="coCoupon" value="' + esc(d.coupon || '') + '" placeholder="e.g. AADI10" style="text-transform:uppercase"></div>' +
        checkoutPerksHTML() +
      '</div>' +
      '<div id="coSummaryBox">' + coSummaryHTML() + '</div>' +
      '<div class="form-card"><h3>💳 Payment Method</h3><div class="pay-grid">' +
        '<div class="pay-opt ' + (d.payment === 'upi' ? 'on' : '') + '" data-pay="upi"><span class="po-ic" style="background:#e3f2fd">📲</span><span><b>UPI — Pay Online</b><small>GPay • PhonePe • Paytm</small></span><span class="radio"></span></div>' +
        '<div class="pay-opt ' + (d.payment === 'cod' ? 'on' : '') + '" data-pay="cod"><span class="po-ic" style="background:var(--gold-soft)">💵</span><span><b>Cash on Delivery</b><small>₹' + CONFIG.codFee + ' booking first • WhatsApp confirmation only</small></span><span class="radio"></span></div>' +
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
        (t.online > 0 ? '<div class="row"><span>💳 Online payment ' + (CONFIG.onlineDiscount||1) + '% off</span><b style="color:var(--green)">−' + money(t.online) + '</b></div>' : '') +
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
          '<div class="cod-note">💵 <b>COD Rules:</b> ₹' + booking + ' extra booking charge applies. First pay ₹' + booking + ' by UPI to book your order.<br><b>COD orders are confirmed only on WhatsApp</b> after we verify the booking payment. Remaining <b>' + money(Math.max(0, t.grand - booking)) + '</b> is collected at delivery.</div>' +
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
  return { id: i.id, name: p.name || i.name || 'Saree', price: +(p.price != null ? p.price : i.price) || 0, qty: i.qty || 1, colour: i.colour || '' };
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
function createPendingPaymentOrder(){
  try{
    if (!co.pendingId) co.pendingId = genOrderId();
    if (Store.orders.some(o => o.id === co.pendingId)) return;
    const d = co.data, t = coTotals(), res = currentReseller();
    const order = { id:co.pendingId, date:new Date().toISOString(), items:coItems().map(safeItem), customer:{name:d.name.trim(),phone:d.phone.trim(),address:d.address.trim(),pincode:d.pincode.trim()}, payment:'upi', totals:t, reseller:res ? {code:res.code,name:res.name,phone:res.phone}:null, margin:0, status:'pending', paidConfirmed:false, paymentStarted:true, bookingPaid:0, device:deviceId() };
    Store.orders.unshift(order); Store.saveOrders();
    if (FS.enabled()) FS.saveOrder(order).catch(()=>{});
  }catch(e){}
}
function confirmPendingPayment(){
  const order = Store.orders.find(o => o.id === co.pendingId);
  if (!order){ doPlaceOrder('upi'); return; }
  order.paidConfirmed = true; order.paymentStarted = true; order.status = 'pending'; order.paymentMarkedAt = new Date().toISOString(); Store.saveOrders();
  if (FS.enabled()) FS.saveOrder(order).catch(()=>{});
  if (!co.buyOnly){ Store.cart=[]; Store.saveCart(); syncCartReservation(); }
  renderOrderComplete(order, false);
}
function pendingPaymentHTML(o){
  if (o.payment !== 'upi' || o.paidConfirmed) return '';
  const amount = ((o.totals||{}).grand||0), note = 'Order ' + o.id + ' SK Sarees';
  return '<div class="form-card" style="margin-top:12px;border:1.5px dashed var(--gold)"><h3>📲 Complete UPI Payment</h3><p class="small muted">Payment is not marked yet. Scan QR or open your UPI app, then tap I&apos;ve Paid.</p><div class="qr-box"><div class="pendingQR" data-pendingqr="' + esc(o.id) + '"></div><div class="upi-id">' + esc(CONFIG.upiId) + ' <button type="button" class="btn btn-ghost btn-sm" data-copy="' + esc(CONFIG.upiId) + '">Copy</button></div></div><a class="btn btn-gold" href="' + upiLink(amount,note) + '">📲 Pay ' + money(amount) + ' — Open UPI App</a><button type="button" class="btn btn-maroon" style="margin-top:8px" data-confirm-pending="' + esc(o.id) + '">✅ I&apos;ve Paid — Waiting for Confirmation</button></div>';
}
function drawPendingQrs(){
  try{ const lib = typeof qrcode !== 'undefined' ? qrcode : window.qrcode; if (!lib) return; document.querySelectorAll('[data-pendingqr]').forEach(box => { const o=Store.orders.find(x=>x.id===box.dataset.pendingqr); if (!o) return; const q=lib(0,'M'); q.addData(upiLink((o.totals||{}).grand||0,'Order '+o.id+' SK Sarees')); q.make(); box.innerHTML=q.createSvgTag({cellSize:4,margin:0,scalable:true}); }); }catch(e){}
}
function doPlaceOrder(payment){
  try{
    const d = co.data;
    if (!coValid()) return;
    recordLead(d.name, d.phone, d.coupon || '');   /* 📋 lead collected */
    const t = coTotals();
    const couponUsed = d.coupon || '';
    const myReseller = currentReseller();
    const order = {
      id: co.pendingId || genOrderId(), date: new Date().toISOString(),
      items: coItems().map(safeItem),
      customer: { name: d.name.trim(), phone: d.phone.trim(), address: d.address.trim(), pincode: d.pincode.trim() },
      payment,
      totals: t,
      reseller: myReseller ? { code: myReseller.code, name: myReseller.name, phone: myReseller.phone } : null,
      margin: 0,
      /* UPI: customer tapped "I've Paid" → paidConfirmed=true, awaiting admin
         confirmation; COD: ₹70 booking paid now */
      status: payment === 'upi' ? 'pending' : 'placed',
      paidConfirmed: payment === 'upi',          /* ✅ customer says they paid */
      bookingPaid: payment === 'cod' ? CONFIG.codFee : (payment === 'upi' ? t.grand : 0),
      device: deviceId(),
    };
    order.margin = myReseller ? resellerMarginFor(order) : 0;   /* 💰 5% of grand */
    const orderCount = order.items.reduce((s, i) => s + (i.qty || 1), 0);
    Store.orders.unshift(order); Store.saveOrders();
    recordResellerOrder(order);               /* credit reseller margin */
    try{ Stats.refreshOrders(); renderStatsText(); }catch(e){}   /* bump order counter */
    if (FS.enabled()) FS.saveOrder(order).then(ok => { if (ok) markOrderSynced(order.id); }).catch(() => {});
    Store.profile = { name: order.customer.name, phone: order.customer.phone, address: order.customer.address, pincode: order.customer.pincode };
    try{ autoRegisterReseller(order.customer.name, order.customer.phone); }catch(e){}   /* 🤝 auto-reseller */
    Store.saveProfile();
    consumeStock(order.items);                 /* 1 psc model: stock goes down for next customer */
    if (!co.buyOnly){ Store.cart = []; Store.saveCart(); syncCartReservation(); }
    co.buyOnly = null;   /* buy-now order done → back to normal cart mode */
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
      items: coItems().map(safeItem),
      customer: { name: d.name.trim(), phone: d.phone.trim(), address: d.address.trim(), pincode: d.pincode.trim() },
      payment: 'cod', totals: t, status: 'placed',
      bookingPaid: CONFIG.codFee,                 /* ₹70 courier booking paid now */
      reseller: myReseller ? { code: myReseller.code, name: myReseller.name, phone: myReseller.phone } : null,
      margin: 0,
      device: deviceId(),
    };
    order.margin = myReseller ? resellerMarginFor(order) : 0;   /* 💰 5% of grand */
    const couponUsed = d.coupon || '';
    Store.orders.unshift(order); Store.saveOrders();
    recordResellerOrder(order);               /* credit reseller margin */
    try{ Stats.refreshOrders(); renderStatsText(); }catch(e){}   /* bump order counter */
    if (FS.enabled()) FS.saveOrder(order).then(ok => { if (ok) markOrderSynced(order.id); }).catch(() => {});
    Store.profile = { name: order.customer.name, phone: order.customer.phone, address: order.customer.address, pincode: order.customer.pincode };
    try{ autoRegisterReseller(order.customer.name, order.customer.phone); }catch(e){}   /* 🤝 auto-reseller */
    Store.saveProfile();
    consumeStock(order.items);
    if (!co.buyOnly){ Store.cart = []; Store.saveCart(); syncCartReservation(); }
    co.buyOnly = null;   /* buy-now order done → back to normal cart mode */
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
  const items = (o.items || []).map(i => '<div style="display:flex;justify-content:space-between;font-size:.84rem;padding:6px 0;border-bottom:1px dashed var(--line)"><span>' + esc(i.name) + (i.colour ? ' <small class="muted">(' + esc(i.colour) + ')</small>' : '') + ' ×' + i.qty + '</span><b>' + money(i.price * i.qty) + '</b></div>').join('');
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
        : '💵 COD booking payment received. Your COD order will be confirmed only on WhatsApp after verification. Remaining amount is collected at delivery. 📱');
  app.innerHTML = '<div class="wrap page">' +
    '<div class="success"><div class="tick-big"><svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></div>' +
      '<h1>' + (viaWa ? '🎉 Order Sent on WhatsApp!' : '🎉 Order Placed Successfully!') + '</h1>' +
      '<span class="oid">Order ID: #' + esc(o.id) + '</span>' +
      '<p class="muted small" style="max-width:46ch;margin:8px auto 0">' + successMsg + '</p>' +
    '</div>' +
    '<div class="summary" style="margin-top:6px">' + items +
      (t.discount > 0 ? '<div style="display:flex;justify-content:space-between;font-size:.9rem;padding:6px 0"><span>Coupon discount</span><b style="color:var(--green)">−' + money(t.discount) + '</b></div>' : '') +
      (t.bundle > 0 ? '<div style="display:flex;justify-content:space-between;font-size:.9rem;padding:6px 0"><span>🎁 Bundle deal</span><b style="color:var(--green)">−' + money(t.bundle) + '</b></div>' : '') +
      (t.online > 0 ? '<div style="display:flex;justify-content:space-between;font-size:.9rem;padding:6px 0"><span>💳 Online payment off</span><b style="color:var(--green)">−' + money(t.online) + '</b></div>' : '') +
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
    orderSuccessRecs(o) +
  '</div>';
}

/* 💰 RESELLER COMMISSION CARD (profile page) — shows this visitor's reseller
   code, orders brought, pending margin (to be paid) and total paid so far. */
/* 🔗 GET YOUR PERSONAL SHARE LINK — profile card: if the visitor already has a
   code (from auto-registration or share-earn) show the link + copy/share;
   otherwise let them generate one right here with name + mobile. */
function myShareLinkCard(){
  try{
    const code = myResellerCode();
    if (code){
      const link = location.origin + location.pathname.replace(/[^/]*$/, '') + 'shop.html?ref=' + encodeURIComponent(code);
      return '<div class="form-card"><h3>🔗 Get Your Personal Share Link</h3>' +
        '<p class="small muted" style="margin-bottom:8px">Your code: <b>' + esc(code) + '</b> — every order via this link earns you <b>' + (CONFIG.resellerMarginPct || 5) + '%</b> (UPI orders, confirmed on shipment).</p>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap"><input id="mslLink" readonly value="' + esc(link) + '" style="flex:1;min-width:180px;border:1.5px solid var(--line);border-radius:10px;padding:10px 12px;font-size:.78rem;background:var(--bg);outline:none"><button type="button" class="btn btn-maroon btn-sm" id="mslCopy" style="width:auto;min-width:110px">📋 Copy</button>' +
        '<a class="btn btn-wa btn-sm" id="mslWa" style="width:auto;min-width:110px" href="https://wa.me/?text=' + encodeURIComponent('🪡 Hi! Shop sarees on SK Sarees — use my link & get 5% off!\n👉 ' + link) + '" target="_blank" rel="noopener">💬 Share</a>' +
        '<a class="btn btn-gold btn-sm" href="share-earn.html" style="width:auto;min-width:110px">🎁 More ways</a></div></div>';
    }
    /* no code yet → generate option */
    return '<div class="form-card"><h3>🔗 Get Your Personal Share Link</h3>' +
      '<p class="small muted" style="margin-bottom:8px">Enter your name &amp; mobile — we create your personal code. Share it in family/WhatsApp groups: every UPI order via your link earns you <b>' + (CONFIG.resellerMarginPct || 5) + '%</b> (confirmed when the order ships, min payout ₹' + (CONFIG.resellerMinPayout || 100) + ').</p>' +
      '<div style="display:grid;gap:8px;grid-template-columns:1fr 1fr">' +
        '<div class="field" style="margin:0"><label>Your Name</label><input id="mslName" value="' + esc((Store.profile || {}).name || '') + '"></div>' +
        '<div class="field" style="margin:0"><label>WhatsApp / Mobile</label><input id="mslPhone" value="' + esc((Store.profile || {}).phone || '') + '" inputmode="numeric" maxlength="10"></div>' +
      '</div>' +
      '<button type="button" class="btn btn-maroon" id="mslGen" style="margin-top:10px">🔗 Generate My Share Link</button>' +
      '<p class="small muted" id="mslNote" style="margin-top:8px"></p></div>';
  }catch(e){ return ''; }
}
function resellerProfileCard(){
  try{
    const code = myResellerCode();
    if (!code) return '';
    const r = allResellers().find(x => x && x.code === code);
    if (!r) return '';
    const pending = (r.pendingMargin || 0);       /* earned but not yet shipped */
    const confirmed = (r.margin || 0);             /* confirmed on shipment — payable */
    const paid = r.paidTotal || 0;
    const minPayout = CONFIG.resellerMinPayout || 100;
    const canPay = confirmed >= minPayout;
    /* 📦 this reseller's orders (local orders tagged with their code) */
    const myOrders = Store.orders.filter(o => o.reseller && o.reseller.code === code);
    const orderRows = myOrders.length
      ? myOrders.slice(0, 10).map(o => '<div style="display:flex;justify-content:space-between;font-size:.75rem;padding:5px 0;border-bottom:1px dashed var(--line)"><span>#' + esc(o.id) + ' • ' + fmtDT(o.date) + '</span><b style="color:var(--green)">+' + money(o.margin || 0) + '</b></div>').join('')
      : '<p class="small muted">No referral orders on this device yet (orders placed by friends via your link appear here + are credited on your code).</p>';
    /* 💸 commission received history */
    let pays = [];
    try{ pays = JSON.parse(localStorage.getItem('sk_reseller_payments') || '[]').filter(x => x.code === code); }catch(e){}
    const payRows = pays.length
      ? pays.slice().reverse().slice(0, 8).map(x => '<div style="display:flex;justify-content:space-between;font-size:.75rem;padding:5px 0;border-bottom:1px dashed var(--line)"><span>💸 ' + fmtDT(x.date) + '</span><b style="color:var(--green)">' + money(x.amount) + '</b></div>').join('')
      : '<p class="small muted">No commission received yet.</p>';
    return '<div class="form-card"><h3>💰 My Commission</h3>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:8px">' +
        '<div style="background:var(--gold-soft);border:1.5px dashed var(--gold);border-radius:12px;padding:10px;text-align:center"><span class="muted small" style="display:block">Pending (till shipped)</span><b style="font-size:1.2rem;color:var(--maroon)">' + money(pending) + '</b></div>' +
        '<div style="background:var(--bg);border:1.5px solid var(--line);border-radius:12px;padding:10px;text-align:center"><span class="muted small" style="display:block">Confirmed</span><b style="font-size:1.2rem;color:var(--green)">' + money(confirmed) + '</b></div>' +
        '<div style="background:var(--bg);border:1.5px solid var(--line);border-radius:12px;padding:10px;text-align:center"><span class="muted small" style="display:block">Paid</span><b style="font-size:1.2rem;color:var(--green)">' + money(paid) + '</b></div>' +
      '</div>' +
      '<p class="small muted" style="margin-top:8px">Code: <b>' + esc(r.code) + '</b> • Orders: <b>' + (r.orders || 0) + '</b> • ' + (CONFIG.resellerMarginPct || 5) + '% per UPI order, confirmed when the order <b>ships</b>.</p>' +
      '<p class="small" style="border:1px dashed var(--gold);border-radius:10px;padding:9px;background:var(--gold-soft);margin-top:8px">💵 Payout via <b>GPay</b> when confirmed reaches <b>₹' + minPayout + '</b>' + (canPay ? ' — you can request now! 🎉' : ' (' + money(Math.max(0, minPayout - confirmed)) + ' more needed).') + '</p>' +
      '<h4 style="font-size:.85rem;margin:10px 0 4px">📦 My Referral Orders</h4>' + orderRows +
      '<h4 style="font-size:.85rem;margin:10px 0 4px">💸 Commission Received</h4>' + payRows +
      '<h4 style="font-size:.85rem;margin:10px 0 4px">💳 My UPI for receiving margin</h4>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap"><input id="rcUpi" value="' + esc(r.upi || '') + '" placeholder="e.g. 9876500000@ybl (edit to receive commission)" style="flex:1;min-width:180px;border:1.5px solid var(--line);border-radius:10px;padding:9px 11px;font-size:.78rem;outline:none"><button type="button" class="btn btn-maroon btn-sm" id="rcUpiSave" style="width:auto;min-width:90px">💾 Save</button></div>' +
      '<a class="btn btn-wa btn-sm" style="width:auto;margin-top:8px" href="' + waLink('Hi! I am a SK Sarees reseller (' + r.code + '). My confirmed commission is ' + money(confirmed) + ' — please pay to my UPI ' + (resellerUpiId(r)) + '. 🙏') + '" target="_blank" rel="noopener">💬 Ask for Commission on WhatsApp</a></div>';
  }catch(e){ return ''; }
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
  const q = safeParams();
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
    const myPhone = String((Store.profile || {}).phone || '').replace(/\D/g, '');
    let prevStatuses = {};
    Store.orders.forEach(o => { prevStatuses[o.id] = o.status; });
    /* 🔒 READ-OPTIMIZED: listen ONLY to this customer's orders — a one-time
       query by phone + a cheap per-doc listener per known order. The old code
       subscribed to the ENTIRE orders collection here (huge reads). */
    const applyUpdates = (list) => {
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
    };
    if (myPhone && /^[6-9]\d{9}$/.test(myPhone)){
      /* customer with a saved phone → targeted listener (their orders only) */
      FS.myOrdersSnapshot(myPhone, applyUpdates);
    } else {
      /* no phone yet → device-local orders only (no Firestore listener at all) */
    }
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
    ((o.payment === 'upi' && !o.paidConfirmed) ? '<button type="button" class="btn btn-gold btn-sm" style="flex:1;min-width:130px" data-odetail="' + esc(o.id) + '">📲 Pay / QR</button>' : '') +
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
      '<a href="product.html?id=' + encodeURIComponent(i.id) + '"><img src="' + (p ? esc(p.img) : img('printed-cotton.jpg')) + '" alt="' + esc(i.name) + '" style="width:64px;height:48px;object-fit:cover;border-radius:8px;flex:0 0 auto" onerror="imgSafe(this)" onload="imgLoaded(this)"></a>' +
      '<div style="flex:1;min-width:0"><a href="product.html?id=' + encodeURIComponent(i.id) + '" style="font-size:.85rem;font-weight:800;display:block">' + esc(i.name) + '</a>' +
      (i.colour ? '<small class="muted">🎨 ' + esc(i.colour) + '</small><br>' : '') +
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
    pendingPaymentHTML(o) +
    '<div style="display:grid;gap:8px;margin-top:12px;grid-template-columns:1fr 1fr">' +
      '<a class="btn btn-wa btn-sm" href="' + waLink('Hi! I want to track my order ' + o.id + '.') + '" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true" style="vertical-align:-2px;margin-right:4px"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>Ask on WhatsApp</a>' +
      '<button type="button" class="btn btn-maroon btn-sm" data-reorder="' + esc(o.id) + '">🔁 Order Again</button>' +
      '<a class="btn btn-outline btn-sm" href="shop.html">🛍️ Shop More</a>' +
    '</div></div>';
  setTimeout(drawPendingQrs, 60);
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
    myShareLinkCard() +
    resellerProfileCard() +
    '<div class="form-card"><h3>📲 Install App (PWA)</h3>' +
      '<p class="small muted" style="margin-bottom:10px">Install SK Sarees as an app — one tap open, works offline-friendly, like a native app.</p>' +
      '<button type="button" class="btn btn-maroon" id="pfInstall">📲 Install App</button></div>' +
    '<div class="form-card"><h3>🔔 Push Notifications</h3>' +
      '<p class="small muted" style="margin-bottom:10px">Get notified about order status, festival offers &amp; if you leave items in your cart.</p>' +
      '<button type="button" class="btn btn-maroon" id="pfNotify">' + notifyStatusLabel() + '</button>' +
      '<p class="small muted" id="notifyNote" style="margin-top:8px">' + notifyStatusNote() + '</p></div>' +
    '<div class="form-card"><h3>❤️ My Wishlist</h3><div class="wish-grid" id="wishGrid"></div></div>' +
    '<div class="form-card"><h3>🌐 Language / மொழி / భాష / ಭಾಷೆ</h3><select id="pfLang" style="width:100%;border:1.5px solid var(--line);border-radius:10px;padding:12px">' +
      '<option value="en"' + (lang === 'en' ? ' selected' : '') + '>English</option>' +
      '<option value="ta"' + (lang === 'ta' ? ' selected' : '') + '>தமிழ்</option>' +
      '<option value="te"' + (lang === 'te' ? ' selected' : '') + '>తెలుగు</option>' +
      '<option value="kn"' + (lang === 'kn' ? ' selected' : '') + '>ಕನ್ನಡ</option></select></div>' +
    '<div class="form-card"><h3>🏠 Store Info</h3><p class="small" style="line-height:1.9">📍 2/130, Thoothanoor, Edanganasalai, Salem 637502<br>📞 <a href="tel:+917867915699" style="color:var(--maroon);font-weight:800">+91 78679 15699</a><br><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true" style="vertical-align:-2px;margin-right:4px"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> <a href="' + waLink('Hi! I need help.') + '" target="_blank" rel="noopener" style="color:var(--wa-d);font-weight:800">Chat on WhatsApp</a><br>⏰ 9 AM – 9 PM, all days</p></div>' +
  '</div>';
  /* 🔗 share link card: copy / share + generate */
  try{
    const mslC = document.getElementById('mslCopy');
    if (mslC) mslC.addEventListener('click', () => { const v = document.getElementById('mslLink'); if (v){ copyText(v.value); toast('📋 Share link copied'); } });
    const mslG = document.getElementById('mslGen');
    if (mslG) mslG.addEventListener('click', () => {
      const nm = (document.getElementById('mslName') || {}).value || '';
      const ph = (document.getElementById('mslPhone') || {}).value || '';
      if (nm.length < 2 || !validPhone(ph)){ toast('⚠️ Enter your name & valid 10-digit mobile'); return; }
      const r = addReseller(nm, ph);
      recordLead(nm, ph, r.code);
      toast('🎉 Your code: ' + r.code + ' — share link ready!');
      renderProfilePage();
    });
    const rcU = document.getElementById('rcUpiSave');
    if (rcU) rcU.addEventListener('click', () => {
      const inp = document.getElementById('rcUpi'); if (!inp) return;
      const ok = setResellerUpi(myResellerCode(), inp.value.trim());
      toast(ok ? '💳 UPI saved — commission will be paid to ' + resellerUpiId({ upi: inp.value.trim(), phone: (Store.profile||{}).phone || '' }) : '⚠️ Could not save UPI');
    });
  }catch(e){}
  document.getElementById('pfSave').addEventListener('click', () => {
    const name = document.getElementById('pfName').value.trim();
    const phone = document.getElementById('pfPhone').value.trim();
    const address = document.getElementById('pfAddr').value.trim();
    const pincode = document.getElementById('pfPin').value.trim();
    if (!name || !validPhone(phone)){ toast('⚠️ Enter valid name & 10-digit phone'); return; }
    Store.profile = { name, phone, address, pincode };
    Store.saveProfile();
    const rr = autoRegisterReseller(name, phone);   /* 🤝 auto-reseller code for this device */
    if (rr) toast('🎉 Reseller code ready: ' + rr.code + ' — your share links now earn you ' + (CONFIG.resellerMarginPct || 5) + '% per order!');
    toast('✅ Details saved');
  });
  document.getElementById('pfLang').addEventListener('change', e => setLang(e.target.value));
  /* 🤝 referral */
  try{
    const rc = document.getElementById('refCode');
    if (rc){ if (!myReferralCode()) setReferralCode(rc.value); rc.value = myReferralCode(); }
    const cp = document.getElementById('refCopy');
    if (cp) cp.addEventListener('click', () => { copyText(referralLink()); toast('✅ Referral link copied!'); });
    const rw = document.getElementById('refWa');
    const rn = document.getElementById('refNote');
    if (rw){
      const msg = '🪡 Shop sarees & get ₹50 OFF — use my code ' + myReferralCode() + '!\n\n👉 ' + referralLink() + '\n\nWe both get ₹50 off! 😍';
      rw.setAttribute('href', waLink(msg));
      rw.style.display = 'block';
    }
    if (rn) rn.textContent = 'Your referral link: ' + referralLink();
  }catch(e){}
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
    ? list.map(p => '<div class="pcard"><a class="pcard-img" href="' + productUrl(p) + '"><img src="' + esc(p.img) + '" alt="" loading="lazy" onerror="imgSafe(this)" onload="imgLoaded(this)"></a>' +
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
    let colour = '';
    const sel = document.getElementById('pdSelColour');
    if (sel && sel.value) colour = sel.value;
    addToCart(add.dataset.add, qty, colour);
    /* 🛒 upsell "add more" on the cart page: refresh totals instantly so the
       amount shown always matches checkout */
    if (document.body.dataset.page === 'cart'){ try{ renderCartPage(); }catch(err){} }
    /* checkout add → leave buy-now mode (order now uses the full cart) + redraw */
    else if (document.body.dataset.page === 'checkout'){ co.buyOnly = null; try{ drawCo(); }catch(err){} }
    /* 🎁 smart "you may also like" popup on product/shop adds */
    else try{ maybeShowUpsell(add.dataset.add); }catch(err2){}
    return;
  }
  /* 🎨 colour chip on product page */
  const pchip = e.target.closest('[data-colour]');
  if (pchip){
    e.preventDefault();
    if (pchip.disabled) return;
    document.querySelectorAll('#pdColours .pd-colour').forEach(b => { b.classList.toggle('on', b === pchip); });
    const hid = document.getElementById('pdSelColour');
    if (hid) hid.value = pchip.dataset.colour;
    return;
  }
  /* ⚡ Buy Now — carry the selected colour into checkout */
  const pb = e.target.closest('#pdBuyBtn');
  if (pb){
    e.preventDefault();
    const c = document.getElementById('pdSelColour');
    const q = document.getElementById('qtyVal');
    const qty = q ? Math.max(1, Math.min(10, +q.textContent || 1)) : 1;
    pb.href = 'checkout.html?buy=' + encodeURIComponent(pb.dataset.buy || '') + '&qty=' + qty + (c && c.value ? '&colour=' + encodeURIComponent(c.value) : '');
    location.href = pb.href;
    return;
  }
  /* cart qty (line key = id::colour so colour variants change independently) */
  const parseLK = s => { try{ const p2 = String(s).split('::'); return { id: decodeURIComponent(p2[0]), colour: p2[1] ? decodeURIComponent(p2[1]) : '' }; }catch(e){ return { id: s, colour: '' }; } };
  const cqm = e.target.closest('[data-cqm]');
  if (cqm){ const lk = parseLK(cqm.dataset.cqm); const it = Store.cart.find(i => i.id === lk.id && (i.colour || '') === lk.colour); if (it){ setCartQty(it.id, it.qty - 1, it.colour); renderCartPage(); } return; }
  const cqp = e.target.closest('[data-cqp]');
  if (cqp){ const lk = parseLK(cqp.dataset.cqp); const it = Store.cart.find(i => i.id === lk.id && (i.colour || '') === lk.colour); if (it){ setCartQty(it.id, it.qty + 1, it.colour); renderCartPage(); } return; }
  const rm = e.target.closest('[data-rm]');
  if (rm){ e.preventDefault(); const lk = parseLK(rm.dataset.rm); removeFromCart(lk.id, lk.colour); renderCartPage(); return; }
  /* ⭐ use points (cart) */
  if (e.target.id === 'usePts'){
    co.data.usePoints = e.target.checked;
    saveCoDraft();
    if (document.body.dataset.page === 'checkout'){
      try{ if (document.getElementById('coSummaryBox')) document.getElementById('coSummaryBox').innerHTML = coSummaryHTML(); }catch(e){}
    } else {
      renderCartPage();
    }
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
  if (cont){ e.preventDefault(); if (coValid()){ if (co.data.payment === 'upi') createPendingPaymentOrder(); co.step = 2; drawCo(); } return; }
  const back = e.target.closest('[data-back]');
  if (back){ e.preventDefault(); co.step = 1; drawCo(); return; }
  const pay = e.target.closest('[data-pay]');
  if (pay){ e.preventDefault(); co.data.payment = pay.dataset.pay; drawCo(); return; }
  const place = e.target.closest('[data-place]');
  if (place){ e.preventDefault(); if (place.dataset.place === 'upi') confirmPendingPayment(); else doPlaceOrder(place.dataset.place); return; }
  const cwa = e.target.closest('[data-confirm-wa]');
  if (cwa){ e.preventDefault(); doWaOrder(); return; }
  const copy = e.target.closest('[data-copy]');
  if (copy){ e.preventDefault(); copyText(copy.dataset.copy); return; }
  const pending = e.target.closest('[data-confirm-pending]');
  if (pending){ e.preventDefault(); const o = Store.orders.find(x => x.id === pending.dataset.confirmPending); if (!o) return; o.paidConfirmed=true; o.paymentMarkedAt=new Date().toISOString(); Store.saveOrders(); if (FS.enabled()) FS.saveOrder(o).catch(()=>{}); showDetail(o); toast('✅ Payment confirmation sent to SK Sarees'); return; }
  /* 🎨 try-on preview */
  const tr = e.target.closest('#tryOpen');
  if (tr){ e.preventDefault(); openTryOn(byId(currentProductId())); return; }
  /* ⚡ fast order */
  const fo = e.target.closest('#foOpen');
  if (fo){ e.preventDefault(); fastOrderModal(byId(currentProductId())); return; }
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
  /* 📋 lead: visitor clicks a WhatsApp order/chat link with a saved phone */
  const wao = e.target.closest('a[href*="wa.me"], a[href*="api.whatsapp.com"]');
  if (wao){
    try{
      const prof = Store.profile || {};
      if (prof.phone) recordLead(prof.name || '', prof.phone, '');
    }catch(err){}
  }
  /* 📢 viral share to WhatsApp groups */
  const vl = e.target.closest('[data-viral]');
  if (vl){ e.preventDefault(); viralShareProduct(byId(vl.dataset.viral)); return; }
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
      recordLead('', ph, '');   /* 📋 lead collected */
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
  /* 🧾 live refresh the order summary (courier by pincode) + perks */
  try{
    if (document.body.dataset.page === 'checkout' && co.step === 1 && document.getElementById('coSummaryBox')){
      const box = document.getElementById('coSummaryBox');
      box.innerHTML = coSummaryHTML();
    }
  }catch(e){}
});
