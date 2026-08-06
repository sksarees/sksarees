/* ============================================================================
   SK SAREES — app.js (FRESH CLEAN REWRITE)
   Pages: index · shop · product · cart · checkout · orders · profile
   Simple, defensive, no errors. All links are plain <a href> — nothing blocks
   navigation, so every URL works.
   ========================================================================== */
'use strict';

/* ============================ INIT ============================ */
function init(){
  try{ injectChrome(); }catch(e){ console.warn(e); }
  try{ renderCartBadge(); renderCartBar(); }catch(e){}
  try{ Store.orders.forEach(dispatchOrder); Store.saveOrders(); }catch(e){}
  try{ setTimeout(maybeAutoDeliver, 2000); setInterval(maybeAutoDeliver, 30000); }catch(e){}
  try{ Sync.run(); }catch(e){}
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
        '<a class="btn btn-wa" href="' + waLink(waProductMsg(p)) + '" target="_blank" rel="noopener" aria-label="Order on WhatsApp">💬</a>' +
      '</div>' +
    '</div></article>';
}

/* ============================ HOME ============================ */
function renderHome(){
  const app = document.getElementById('app'); if (!app) return;
  const best = PRODUCTS.filter(p => p.badge === 'Bestseller').slice(0, 4);
  const fresh = PRODUCTS.filter(p => p.badge === 'New').slice(0, 4);
  const deals = PRODUCTS.filter(p => offPct(p) >= 35).slice(0, 4);
  app.innerHTML =
    '<section class="hero"><div class="hero-in">' +
      '<span class="hero-chip">🔥 Aadi Festival Sale — Up to 40% OFF</span>' +
      '<h1>Beautiful Sarees,<br><span class="gold">Delivered to Your Doorstep</span></h1>' +
      '<p>Authentic Kanchipuram silk, soft cotton &amp; wedding sarees. Order in 2 minutes — pay by UPI or Cash on Delivery.</p>' +
      '<div class="hero-ctas">' +
        '<a class="btn btn-gold" href="shop.html">🛍️ Shop Best Sellers</a>' +
        '<a class="btn btn-wa" href="' + waLink('Hi! I would like to see your saree collection & current offers.') + '" target="_blank" rel="noopener">💬 Order on WhatsApp</a>' +
      '</div>' +
      '<div class="hero-trust"><span>⭐ <b>2,300+</b> Happy Customers</span><span>🚚 <b>Free</b> above ₹999</span><span>💵 <b>COD</b> Available</span><span>⏱ <b>Fast</b> Delivery</span></div>' +
    '</div></section>' +
    '<div class="wrap">' +
      '<section class="sec"><div class="sec-head"><h2><span class="tick"></span>Shop by Category</h2><a href="shop.html">View all →</a></div>' +
        '<div class="cat-grid">' + CATEGORIES.slice(0, 12).map(c => {
          const count = PRODUCTS.filter(p => p.cat === c.slug).length;
          return '<a class="cat-tile ' + c.cls + '" href="shop.html?cat=' + c.slug + '">' +
            '<img class="ct-img" src="' + catImage(c.slug) + '" alt="' + esc(c.name) + '" loading="lazy">' +
            '<div class="ct-over"><span class="ct-name">' + c.name + ' <span>' + c.emoji + '</span></span>' +
            '<span class="ct-count">' + count + ' designs • ' + c.blurb + '</span></div></a>';
        }).join('') + '</div></section>' +
      '<section class="sec"><div class="sec-head"><h2><span class="tick"></span>⭐ Best Sellers</h2><a href="shop.html">View all →</a></div>' +
        '<div class="prow">' + best.map(cardHTML).join('') + '</div></section>' +
      '<section class="sec"><div class="sec-head"><h2><span class="tick"></span>✨ New Arrivals</h2><a href="shop.html">View all →</a></div>' +
        '<div class="prow">' + fresh.map(cardHTML).join('') + '</div></section>' +
      '<section class="sec"><div class="sec-head"><h2><span class="tick"></span>🔥 Today\'s Deals</h2><a href="shop.html">View all →</a></div>' +
        '<div class="prow">' + deals.map(cardHTML).join('') + '</div></section>' +
      '<section class="sec"><div class="sec-head"><h2><span class="tick"></span>🎬 Video Catalog</h2>' +
        '<a href="' + esc(CONFIG.social.youtube) + '" target="_blank" rel="noopener">Watch on YouTube →</a></div>' +
        '<div class="video-grid">' + CONFIG.videos.map(v =>
          '<div class="video-card"><div class="video-frame"><iframe src="https://www.youtube.com/embed/' + esc(v.id) + '?rel=0" title="' + esc(v.title) + '" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>' +
          '<b>' + esc(v.title) + '</b></div>').join('') + '</div></section>' +
      '<section class="sec"><div class="sec-head"><h2><span class="tick"></span>💬 What Our Customers Say</h2></div>' +
        '<div class="rev-grid">' + REVIEWS.map(r =>
          '<div class="rev"><div class="rev-top"><span class="avatar" style="background:' + r.avatar + '">' + esc(r.name[0]) + '</span>' +
          '<div><b>' + esc(r.name) + '</b><small>' + esc(r.place) + ' • Customer review ⭐</small></div></div>' +
          '<div class="stars">' + '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating) + '</div><p>' + esc(r.text) + '</p></div>'
        ).join('') + '</div>' +
        '<div style="text-align:center;margin-top:16px"><a class="btn btn-outline" style="max-width:320px;margin:0 auto" href="' + esc(CONFIG.googleReview) + '" target="_blank" rel="noopener">⭐ Rate us on Google — share your experience!</a></div>' +
        '</section>' +
      '<section class="sec faq"><div class="sec-head"><h2><span class="tick"></span>❓ FAQ</h2></div>' +
        FAQ.map(f => '<details><summary>' + esc(f.q) + '</summary><p>' + esc(f.a) + '</p></details>').join('') + '</section>' +
    '</div>';
}

/* ============================ SHOP ============================ */
let shopState = { cat: '', q: '', fabric: '', max: 3000, sort: 'newest', shown: 12, list: [] };
function renderShop(){
  const app = document.getElementById('app'); if (!app) return;
  const params = new URLSearchParams(location.search);
  if (params.get('cat')) shopState.cat = params.get('cat');
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
  if (el('shopSearch')) el('shopSearch').addEventListener('input', e => { shopState.q = e.target.value; shopState.shown = 12; updateShopList(); });
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
    (!shopState.q || (p.name + ' ' + p.fabric + ' ' + p.color).toLowerCase().includes(shopState.q.toLowerCase())) &&
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

/* ============================ PRODUCT ============================ */
function renderProduct(){
  const app = document.getElementById('app'); if (!app) return;
  const id = new URLSearchParams(location.search).get('id');
  let p = byId(id);
  if (!p){
    /* Not in the local catalog yet — try Firestore before showing "not found".
       The product may exist in the cloud (Firestore products collection). */
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
    app.innerHTML = '<div class="wrap"><div class="empty"><div class="e-ic"><div class="spinner"></div></div><b>Loading product…</b>' +
      '<span class="muted small">Checking our collection</span></div></div>';
    if (FS.enabled()){
      FS.getProduct(id).then(doc => {
        if (doc){
          try{ finish(normalizeProduct(doc)); }
          catch(err){ finish(null); }
        } else {
          finish(null, 'This saree may have been removed from the store, or the link is old. Browse our full collection below.');
        }
      }).catch(() => finish(null));
      /* safety: never leave the spinner hanging if the cloud is slow/offline */
      setTimeout(() => finish(null, 'Cloud sync is not responding right now — please check your internet and try again.'), 5000);
    } else {
      finish(null, 'This saree may have been removed from the store, or the link is old. Browse our full collection below.');
    }
    return;
  }
  const off = offPct(p), cat = catOf(p.cat);
  const eta = deliveryEstimate();
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
          '<div class="main" id="pdMain"><img id="pdMainImg" src="' + esc(gallery[0]) + '" alt="' + esc(p.name) + '"></div>' +
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
        (out
          ? '<div class="lowchip out" style="margin:6px 0">😞 <b>Out of stock</b> — ask us on WhatsApp, next batch arriving soon!</div>'
          : low
            ? '<div class="lowchip" style="margin:6px 0">🔥 <b>Only ' + p.stock + ' left</b> — order soon, stock is limited!</div>'
            : '') +
        '<p class="muted small">MRP incl. all taxes • ₹999+ free shipping</p>' +
        '<div class="pd-chips"><span class="pd-chip">🚚 Fast Delivery</span><span class="pd-chip">💵 COD (+₹' + CONFIG.codFee + ')</span><span class="pd-chip">↩️ 7-Day Returns</span></div>' +
        '<div class="delivery-card"><b>⏱ Fast Delivery & On-Time Promise</b>' + eta.text + '.<br>' + CONFIG.latePromise + '</div>' +
        '<div class="qty-row"><b>Quantity</b><div class="qty"><button type="button" data-qm>−</button><span id="qtyVal">1</span><button type="button" data-qp>+</button></div></div>' +
        '<div class="pd-btns">' +
          (out
            ? '<button type="button" class="btn btn-xl" disabled style="opacity:.6">😞 Out of Stock</button>'
            : '<button type="button" class="btn btn-outline btn-xl" data-add="' + p.id + '">🛒 Add to Cart</button>') +
          (out ? '' : '<a class="btn btn-buy btn-xl" href="checkout.html?buy=' + encodeURIComponent(p.id) + '">⚡ Buy Now</a>') +
          '<a class="btn btn-wa btn-xl" href="' + waLink(waProductMsg(p)) + '" target="_blank" rel="noopener">💬 Buy on WhatsApp — Instant Confirmation</a>' +
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
    (related.length ? '<div class="wrap sec"><div class="sec-head"><h2><span class="tick"></span>✨ You May Also Like</h2></div><div class="prow">' + related.map(cardHTML).join('') + '</div></div>' : '') +
    '<div class="sticky-bar">' +
      '<div class="sb-price"><b>' + money(p.price) + '</b><small>' + off + '% off</small></div>' +
      '<a class="btn btn-buy" href="checkout.html?buy=' + encodeURIComponent(p.id) + '">⚡ Buy Now</a>' +
      '<button type="button" class="btn btn-maroon" data-add="' + p.id + '">Add</button>' +
      '<a class="btn btn-wa" href="' + waLink(waProductMsg(p)) + '" target="_blank" rel="noopener" aria-label="Order on WhatsApp">💬</a>' +
    '</div>';
  document.title = p.name + ' — SK Sarees';
  /* qty buttons */
  document.querySelectorAll('[data-qp]').forEach(b => b.addEventListener('click', () => { const v = document.getElementById('qtyVal'); v.textContent = Math.min(10, +v.textContent + 1); }));
  document.querySelectorAll('[data-qm]').forEach(b => b.addEventListener('click', () => { const v = document.getElementById('qtyVal'); v.textContent = Math.max(1, +v.textContent - 1); }));
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

/* ============================ CART ============================ */
function renderCartPage(){
  const app = document.getElementById('app'); if (!app) return;
  if (!Store.cart.length){
    app.innerHTML = '<div class="wrap page"><h1>🛒 Your Cart</h1><div class="empty"><div class="e-ic">🛒</div><b>Your cart is empty</b>' +
      '<a class="btn btn-maroon" style="max-width:240px;margin:14px auto 0" href="shop.html">🛍️ Shop Sarees</a></div></div>';
    return;
  }
  const t = cartTotal(), sh = shippingFor(t), short = Math.max(0, CONFIG.shipFreeAbove - t);
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
    '<div class="summary">' +
      '<div class="row"><span>Items total</span><b>' + money(t) + '</b></div>' +
      '<div class="row"><span>Shipping</span><b style="color:' + (sh ? 'inherit' : 'var(--green)') + '">' + (sh ? money(sh) : 'FREE') + '</b></div>' +
      '<div class="row total"><span>Total</span><b>' + money(t + sh) + '</b></div>' +
      '<div class="ship-progress">' + (short > 0 ? '🚚 Add <b>' + money(short) + '</b> more for FREE shipping!' : '🎉 You have FREE shipping!') +
        '<div class="ship-bar"><i style="width:' + Math.min(100, Math.round(t / CONFIG.shipFreeAbove * 100)) + '%"></i></div></div>' +
      '<div class="cod-note">💵 COD Available — pay <b>₹' + CONFIG.codFee + '</b> extra at delivery.</div>' +
      '<p class="small muted" style="margin-top:8px">🚚 Shipping by state: ₹30 Tamil Nadu · ₹40 Andhra/Karnataka · ₹60 others · <b>FREE above ₹999</b> — calculated at checkout.</p>' +
      '<div style="display:grid;gap:10px;margin-top:14px">' +
        '<a class="btn btn-maroon btn-xl" href="checkout.html">Proceed to Checkout →</a>' +
        '<a class="btn btn-wa" href="' + waLink(waCartMsg()) + '" target="_blank" rel="noopener">💬 Order on WhatsApp Instead</a>' +
      '</div>' +
    '</div></div>';
}

/* ============================ CHECKOUT ============================ */
let co = { step: 1, data: { name:'', phone:'', address:'', pincode:'', payment:'upi' } };
function renderCheckoutPage(){
  const app = document.getElementById('app'); if (!app) return;
  /* prefill order: what you last typed (draft) → saved profile → empty */
  const profile = Store.profile || {};
  const draft = loadCoDraft() || {};
  co.data = Object.assign({}, co.data, {
    name: co.data.name || draft.name || profile.name || '',
    phone: co.data.phone || draft.phone || profile.phone || '',
    address: co.data.address || draft.address || profile.address || '',
    pincode: co.data.pincode || draft.pincode || profile.pincode || '',
    payment: co.data.payment || draft.payment || 'upi',
  });
  saveCoDraft();
  const buy = new URLSearchParams(location.search).get('buy');
  if (buy && !Store.cart.some(i => i.id === buy)) addToCart(buy, 1);
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
  const shipping = shippingFor(itemsTotal, co.data.pincode);
  return { itemsTotal, codFee, shipping, grand: itemsTotal + codFee + shipping, eta: deliveryEstimate(co.data.pincode, co.data.payment).text, zone: deliveryEstimate(co.data.pincode, co.data.payment).zone };
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
        '<div class="field"><label>Address <span class="req">*</span></label><textarea id="coAddr" rows="3" placeholder="House no, street, area, city…">' + esc(d.address) + '</textarea></div>' +
        '<div class="field"><label>PIN Code <span class="req">*</span></label><input id="coPin" value="' + esc(d.pincode) + '" placeholder="6-digit PIN" inputmode="numeric" maxlength="6"></div>' +
      '</div>' +
      '<div class="form-card"><h3>💳 Payment Method</h3><div class="pay-grid">' +
        '<div class="pay-opt ' + (d.payment === 'upi' ? 'on' : '') + '" data-pay="upi"><span class="po-ic" style="background:#e3f2fd">📲</span><span><b>UPI — Pay Online</b><small>GPay • PhonePe • Paytm</small></span><span class="radio"></span></div>' +
        '<div class="pay-opt ' + (d.payment === 'cod' ? 'on' : '') + '" data-pay="cod"><span class="po-ic" style="background:var(--gold-soft)">💵</span><span><b>Cash on Delivery</b><small>Pay at delivery — extra ₹' + CONFIG.codFee + '</small></span><span class="radio"></span></div>' +
      '</div></div>' +
      '<div class="delivery-card" style="margin-bottom:14px"><b>⏱ Fast Delivery</b>' + t.eta + '.<br>' + CONFIG.latePromise + '</div>' +
      (d.payment === 'cod'
        ? '<button type="button" class="btn btn-wa btn-xl" data-confirm-wa>💬 Confirm Order on WhatsApp</button>'
        : '<button type="button" class="btn btn-maroon btn-xl" data-cont>Continue to Payment →</button>') +
    '</div>';
  } else {
    const upiPay = d.payment === 'upi';
    app.innerHTML = '<div class="wrap page"><h1>🔒 Secure Checkout</h1>' + steps +
      '<div class="form-card"><h3>🧾 Review Your Order</h3>' + itemLines +
        '<div class="row"><span>Shipping</span><b style="color:' + (t.shipping ? 'inherit' : 'var(--green)') + '">' + (t.shipping ? money(t.shipping) : 'FREE') + '</b></div>' +
        (upiPay ? '' : '<div class="row"><span>COD charges</span><b>+' + money(t.codFee) + '</b></div>') +
        '<div class="row total"><span>Total</span><b>' + money(t.grand) + '</b></div>' +
        '<div class="delivery-card" style="margin-top:10px"><b>⏱ Fast Delivery</b>' + t.eta + '.</div>' +
        '<p class="small" style="border:1px dashed var(--line);border-radius:10px;padding:10px;background:var(--bg)"><b>' + esc(d.name) + '</b> • ' + esc(d.phone) + '<br>' + esc(d.address) + ' — ' + esc(d.pincode) + '</p>' +
      '</div>' +
      (upiPay
        ? '<div class="form-card"><h3>📲 Pay by UPI</h3>' +
          '<div style="text-align:center"><b style="font-size:1.9rem;color:var(--maroon)">' + money(t.grand) + '</b><span class="muted small"> payable</span></div>' +
          '<div class="qr-box"><div id="upiQR"></div><div class="upi-id">' + esc(CONFIG.upiId) + ' <button type="button" class="btn btn-ghost btn-sm" style="min-height:30px;padding:4px 10px" data-copy="' + esc(CONFIG.upiId) + '">Copy</button></div></div>' +
          '<a class="btn btn-gold btn-xl" href="' + upiLink(t.grand, 'SK Sarees order') + '">📲 Pay Now — Open UPI App</a>' +
          '<div style="display:grid;gap:8px;margin-top:10px">' +
            '<a class="btn btn-xl" style="background:#1a73e8;color:#fff" href="' + upiAppLink('gpay', t.grand, 'SK Sarees order') + '">🟢 Google Pay — Pay ' + money(t.grand) + '</a>' +
            '<a class="btn btn-xl" style="background:#5f259f;color:#fff" href="' + upiAppLink('phonepe', t.grand, 'SK Sarees order') + '">🟣 PhonePe — Pay ' + money(t.grand) + '</a>' +
            '<a class="btn btn-xl" style="background:#002e6e;color:#fff" href="' + upiAppLink('paytm', t.grand, 'SK Sarees order') + '">🔷 Paytm — Pay ' + money(t.grand) + '</a>' +
          '</div>' +
          '<p class="small muted" style="text-align:center;margin:8px 0 0">📲 App install pannirundha direct-ah open aagum — illaina QR scan pannunga.</p>' +
          '<div class="verify-note">✅ After paying, tap below. We will confirm your order on WhatsApp within minutes.</div>' +
          '<button type="button" class="btn btn-maroon btn-xl" data-place="upi">✅ I\'ve Paid — Confirm My Order</button></div>'
        : '<div class="form-card"><h3>💵 Cash on Delivery</h3>' +
          '<div style="text-align:center"><b style="font-size:1.9rem;color:var(--maroon)">' + money(t.grand) + '</b><span class="muted small"> pay at delivery</span></div>' +
          '<div class="cod-note">💵 COD Available (Extra <b>₹' + CONFIG.codFee + '</b> charges apply).</div>' +
          '<button type="button" class="btn btn-maroon btn-xl" data-place="cod">✅ Place Order — Pay on Delivery</button></div>') +
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
  try{
    const qr = qrLib(0, 'M');
    qr.addData(upiLink(t.grand, 'SK Sarees order'));
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
    const order = {
      id: genOrderId(), date: new Date().toISOString(),
      items: Store.cart.map(safeItem),
      customer: { name: d.name.trim(), phone: d.phone.trim(), address: d.address.trim(), pincode: d.pincode.trim() },
      payment, totals: t, status: payment === 'upi' ? 'confirmed' : 'placed',
      device: deviceId(),
    };
    Store.orders.unshift(order); Store.saveOrders();
    if (FS.enabled()) FS.saveOrder(order).then(ok => { if (ok) markOrderSynced(order.id); }).catch(() => {});
    Store.profile = { name: order.customer.name, phone: order.customer.phone, address: order.customer.address, pincode: order.customer.pincode };
    Store.saveProfile();
    Store.cart = []; Store.saveCart();
    co = { step: 1, data: { name: order.customer.name, phone: order.customer.phone, address: order.customer.address, pincode: order.customer.pincode, payment:'upi' } };
    saveCoDraft();
    renderOrderComplete(order, false);
    try{ window.scrollTo({ top: 0, behavior: 'smooth' }); }catch(e){ try{ window.scrollTo(0, 0); }catch(e2){} }
  }catch(err){ console.warn(err); try{ renderOrderComplete({ id: genOrderId(), date: new Date().toISOString(), items: [], customer: co.data, payment, totals: coTotals(), status:'placed' }, false); }catch(e){} }
}
function doWaOrder(){
  try{
    const d = co.data;
    if (!coValid()) return;
    const t = coTotals();
    const order = {
      id: genOrderId(), date: new Date().toISOString(),
      items: Store.cart.map(safeItem),
      customer: { name: d.name.trim(), phone: d.phone.trim(), address: d.address.trim(), pincode: d.pincode.trim() },
      payment: 'cod', totals: t, status: 'placed',
      device: deviceId(),
    };
    Store.orders.unshift(order); Store.saveOrders();
    if (FS.enabled()) FS.saveOrder(order).then(ok => { if (ok) markOrderSynced(order.id); }).catch(() => {});
    Store.profile = { name: order.customer.name, phone: order.customer.phone, address: order.customer.address, pincode: order.customer.pincode };
    Store.saveProfile();
    Store.cart = []; Store.saveCart();
    co = { step: 1, data: { name: order.customer.name, phone: order.customer.phone, address: order.customer.address, pincode: order.customer.pincode, payment:'upi' } };
    saveCoDraft();
    const msg = 'Hi! I want to confirm my COD order:\n\n🪡 Order ID: ' + order.id +
      '\n👤 Name: ' + order.customer.name + '\n📱 Phone: ' + order.customer.phone +
      '\n🏠 Address: ' + order.customer.address + ', ' + order.customer.pincode + '\n\nItems:\n' +
      order.items.map(i => '• ' + i.name + ' ×' + i.qty + ' — ' + money(i.price * i.qty)).join('\n') +
      '\n\nTotal (incl. COD ₹' + CONFIG.codFee + '): ' + money(t.grand) + '\nETA: ' + t.eta + '\nPlease confirm my order. Thank you!';
    try{ window.open(waLink(msg), '_blank', 'noopener'); }catch(e){}
    renderOrderComplete(order, true);
    try{ window.scrollTo({ top: 0, behavior: 'smooth' }); }catch(e){ try{ window.scrollTo(0, 0); }catch(e2){} }
  }catch(err){ console.warn(err); try{ renderOrderComplete({ id: genOrderId(), date: new Date().toISOString(), items: [], customer: co.data, payment:'cod', totals: coTotals(), status:'placed' }, true); }catch(e){} }
}
function renderOrderComplete(o, viaWa){
  const app = document.getElementById('app'); if (!app) return;
  const t = o.totals || { itemsTotal:0, shipping:0, codFee:0, grand:0, eta:'' };
  const items = (o.items || []).map(i => '<div style="display:flex;justify-content:space-between;font-size:.84rem;padding:6px 0;border-bottom:1px dashed var(--line)"><span>' + esc(i.name) + ' ×' + i.qty + '</span><b>' + money(i.price * i.qty) + '</b></div>').join('');
  const mine = myOrders();
  const cards = mine.length
    ? mine.map(od => '<div class="order-card"><div class="oc-top"><b>#' + od.id + '</b><span class="status-pill status-' + od.status + '">' + esc((od.status || 'placed').replace('_', ' ')) + '</span></div>' +
        '<div class="oc-items">' + fmtDate(od.date) + ' • ' + money((od.totals || {}).grand || 0) + ' (' + (od.payment || '').toUpperCase() + ')</div>' +
        '<a class="btn btn-outline btn-sm" style="margin-top:8px" href="orders.html?id=' + encodeURIComponent(od.id) + '&data=' + encodeURIComponent(JSON.stringify(od)) + '">👁️ View Details</a></div>').join('')
    : '<div class="empty"><div class="e-ic">📦</div><b>No orders yet</b></div>';
  app.innerHTML = '<div class="wrap page">' +
    '<div class="success"><div class="tick-big"><svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></div>' +
      '<h1>' + (viaWa ? '🎉 Order Sent on WhatsApp!' : '🎉 Order Placed Successfully!') + '</h1>' +
      '<span class="oid">Order ID: #' + esc(o.id) + '</span>' +
      '<p class="muted small" style="max-width:46ch;margin:8px auto 0">Our team will confirm your order on WhatsApp within minutes. Keep your phone handy! 📱</p>' +
    '</div>' +
    '<div class="summary" style="margin-top:6px">' + items +
      '<div style="display:flex;justify-content:space-between;font-size:.9rem;padding:6px 0"><span>Shipping</span><b style="color:' + (t.shipping ? 'inherit' : 'var(--green)') + '">' + (t.shipping ? money(t.shipping) : 'FREE') + '</b></div>' +
      (t.codFee ? '<div style="display:flex;justify-content:space-between;font-size:.9rem;padding:6px 0"><span>COD charges</span><b>+' + money(t.codFee) + '</b></div>' : '') +
      '<div class="row total"><span>Total (' + (o.payment || 'upi').toUpperCase() + ')</span><b>' + money(t.grand) + '</b></div>' +
      '<div class="small muted" style="text-align:center;margin-top:8px">⏱ ' + esc(t.eta || 'Dispatch 12–24h') + '</div></div>' +
    '<div style="display:grid;gap:10px;margin-top:16px;grid-template-columns:1fr 1fr">' +
      '<a class="btn btn-maroon" href="orders.html?id=' + encodeURIComponent(o.id) + '&data=' + encodeURIComponent(JSON.stringify(o)) + '">📦 Track This Order</a>' +
      '<a class="btn btn-gold" href="orders.html">📋 All My Orders</a>' +
      (viaWa ? '' : '<a class="btn btn-wa" style="grid-column:1/-1" href="' + waLink('Hi! I just placed order ' + o.id + '. Please confirm it.') + '" target="_blank" rel="noopener">💬 Chat with Us on WhatsApp</a>') +
    '</div>' +
    '<div style="margin-top:20px"><h3 style="font-size:1.05rem;font-weight:800;margin-bottom:10px">📦 Your Orders</h3>' + cards + '</div>' +
  '</div>';
}

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
}
function statusTrack(o){
  const steps = [['placed','🆕 Placed'], ['confirmed','✅ Confirmed'], ['shipped','🚚 Dispatched'], ['delivered','✔ Delivered']];
  const idx = steps.findIndex(s => s[0] === o.status);
  return '<div class="status-track">' + steps.map((s, i) => '<span class="' + (i < idx ? 'done' : i === idx ? 'now' : '') + '">' + s[1] + '</span>').join('') + '</div>';
}
function orderCard(o){
  const st = o.status || 'placed';
  return '<div class="order-card">' +
    '<div class="oc-top"><b>#' + o.id + '</b><span class="status-pill status-' + st + '">' + esc(st.replace('_', ' ')) + '</span></div>' +
    '<div class="oc-items">' + fmtDate(o.date) + ' • ' + money((o.totals || {}).grand || 0) + ' (' + (o.payment || '').toUpperCase() + ')<br>ETA: ' + esc((o.totals || {}).eta || 'Dispatch 12–24h') + '</div>' +
    statusTrack(o) +
    '<button type="button" class="btn btn-outline btn-sm" style="margin-top:10px" data-odetail="' + esc(o.id) + '">👁️ ' + (openDetailId === o.id ? 'Close Details' : 'View Order Details') + '</button></div>';
}
/* Full order detail — rendered inline, opens/closes instantly, no page reload */
function showDetail(o){
  const wrap = document.getElementById('trackDetail');
  if (!wrap) return;
  if (!o){
    openDetailId = null;
    wrap.innerHTML = '<div class="empty"><div class="e-ic">🔍</div><b>Order not found</b>Check the order ID. ' +
      '<a class="btn btn-wa btn-sm" style="max-width:280px;margin:8px auto" href="' + waLink('Hi! I cannot find my order. Please help.') + '" target="_blank" rel="noopener">💬 Ask us on WhatsApp</a></div>';
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
    '<div class="oc-items" style="margin:4px 0">' + fmtDate(o.date) + ' • ' + esc((o.customer || {}).name || '') + ' • ' + money(t.grand) + ' (' + (o.payment || '').toUpperCase() + ')</div>' +
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
      '<a class="btn btn-wa btn-sm" href="' + waLink('Hi! I want to track my order ' + o.id + '.') + '" target="_blank" rel="noopener">💬 Ask on WhatsApp</a>' +
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
  if (local){ openDetailId = local.id; showDetail(local); return; }
  if (FS.enabled()){
    const wrap = document.getElementById('trackDetail'); if (wrap) wrap.innerHTML = '<div class="empty"><div class="e-ic"><div class="spinner"></div></div><b>Checking cloud…</b></div>';
    FS.getOrder(id).then(doc => { if (doc){ openDetailId = doc.id || id; showDetail(doc); } else { openDetailId = null; showDetail(null); } });
  } else showDetail(null);
}

/* ============================ PROFILE ============================ */
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
    '<div class="form-card"><h3>❤️ My Wishlist</h3><div class="wish-grid" id="wishGrid"></div></div>' +
    '<div class="form-card"><h3>🌐 Language</h3><select id="pfLang" style="width:100%;border:1.5px solid var(--line);border-radius:10px;padding:12px">' +
      '<option value="en"' + (lang === 'en' ? ' selected' : '') + '>English</option>' +
      '<option value="ta"' + (lang === 'ta' ? ' selected' : '') + '>தமிழ்</option></select></div>' +
    '<div class="form-card"><h3>🏠 Store Info</h3><p class="small" style="line-height:1.9">📍 2/130, Thoothanoor, Edanganasalai, Salem 637502<br>📞 <a href="tel:+917867915699" style="color:var(--maroon);font-weight:800">+91 78679 15699</a><br>💬 <a href="' + waLink('Hi! I need help.') + '" target="_blank" rel="noopener" style="color:var(--wa-d);font-weight:800">Chat on WhatsApp</a><br>⏰ 9 AM – 9 PM, all days</p></div>' +
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
  const list = Store.wish.map(byId).filter(Boolean);
  document.getElementById('wishGrid').innerHTML = list.length
    ? list.map(p => '<div class="pcard"><a class="pcard-img" href="product.html?id=' + encodeURIComponent(p.id) + '"><img src="' + esc(p.img) + '" alt="" loading="lazy"></a>' +
        '<div class="pcard-body"><h3>' + esc(p.name) + '</h3><div class="price-row"><b>' + money(p.price) + '</b></div>' +
        '<div class="p-actions"><button type="button" class="btn btn-outline" data-add="' + p.id + '">Add</button>' +
        '<a class="btn btn-wa" href="' + waLink(waProductMsg(p)) + '" target="_blank" rel="noopener" aria-label="Order on WhatsApp">💬</a></div></div></div>').join('')
    : '<p class="muted small">❤️ Nothing yet — tap the heart on any saree to save it here.</p>';
}

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
  if (add){ e.preventDefault(); addToCart(add.dataset.add, 1); return; }
  /* cart qty */
  const cqm = e.target.closest('[data-cqm]');
  if (cqm){ const it = Store.cart.find(i => i.id === cqm.dataset.cqm); if (it){ setCartQty(it.id, it.qty - 1); renderCartPage(); } return; }
  const cqp = e.target.closest('[data-cqp]');
  if (cqp){ const it = Store.cart.find(i => i.id === cqp.dataset.cqp); if (it){ setCartQty(it.id, it.qty + 1); renderCartPage(); } return; }
  const rm = e.target.closest('[data-rm]');
  if (rm){ e.preventDefault(); removeFromCart(rm.dataset.rm); renderCartPage(); return; }
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
  /* order detail fast toggle */
  const od = e.target.closest('[data-odetail]');
  if (od){ e.preventDefault(); toggleDetail(od.dataset.odetail); return; }
  const cd = e.target.closest('[data-close-detail]');
  if (cd){ e.preventDefault(); if (openDetailId) toggleDetail(openDetailId); return; }
  /* ❤️ wishlist toggle (cards + product page) — must stop the card link nav */
  const wish = e.target.closest('[data-wish]');
  if (wish){ e.preventDefault(); toggleWish(wish.dataset.wish); return; }
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
  else return;
  saveCoDraft();   /* remember address/name/phone as the user types */
});
