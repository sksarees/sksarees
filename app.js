/* ============================================================================
   SK SAREES — app.js (page behaviors)
   Home · Shop (infinite scroll) · Product (no image popup) · Cart ·
   Checkout (UPI QR / COD +49 / fast delivery) · Orders (live) · Profile
   ========================================================================== */
'use strict';

/* ============================ INIT ============================ */
function init(){
  injectChrome();
  const page = document.body.dataset.page;
  /* lazy image fade */
  document.addEventListener('load', e => { if (e.target.tagName === 'IMG') e.target.classList.add('in'); }, true);
  document.querySelectorAll('img').forEach(im => { if (im.complete) im.classList.add('in'); });
  /* global delegation */
  document.addEventListener('click', onDocClick);
  /* per page */
  if (page === 'home') initHome();
  else if (page === 'shop') initShop();
  else if (page === 'product') initProduct();
  else if (page === 'cart') renderCartPage();
  else if (page === 'checkout') initCheckout();
  else if (page === 'orders') initOrders();
  else if (page === 'profile') initProfile();
  renderCartBar();
  Store.orders.forEach(dispatchOrder); Store.saveOrders();
  setTimeout(maybeAutoDeliver, 1500); setInterval(maybeAutoDeliver, 30000);
  /* merge products from Firestore into the data.js catalog (unless admin overrode) */
  if (Firestore.enabled() && !localStorage.getItem('sk_products')){
    window.onCatalogUpdate = () => {
      const pg = document.body.dataset.page;
      if (pg === 'shop' && typeof renderShop === 'function') renderShop();
      else if (pg === 'home') initHome();
      else if (pg === 'product') initProduct();
      else if (pg === 'admin') { try{ if (typeof renderProdBody === 'function') renderProdBody(); }catch(e){} }
    };
    ProductCloud.loadAll().then(list => { if (list && list.length) mergeCloudProducts(list); });
  }
}
document.addEventListener('DOMContentLoaded', init);

/* ============================ GLOBAL CLICKS ============================ */
function onDocClick(e){
  const t = e.target.closest('[data-add],[data-wish],[data-goto]');
  if (!t) return;
  if (t.dataset.add !== undefined){ e.preventDefault(); addToCart(t.dataset.add, 1); }
  else if (t.dataset.wish !== undefined){ e.preventDefault(); toggleWish(t.dataset.wish); }
  else if (t.dataset.goto !== undefined){ location.href = t.dataset.goto; }
}
function toggleWish(id){
  const i = Store.wish.indexOf(id);
  if (i >= 0) Store.wish.splice(i, 1); else Store.wish.push(id);
  Store.saveWish();
  toast(i >= 0 ? '💔 Removed from wishlist' : '❤️ Added to wishlist');
  document.querySelectorAll('[data-wish="' + id + '"]').forEach(b => b.classList.toggle('on', i < 0));
}
const cardHTML = p => {
  const off = offPct(p);
  const badgeCls = p.badge === 'New' ? 'gold' : p.badge === 'Limited Stock' ? 'red' : p.badge === 'Sale' ? 'green' : '';
  return `<article class="pcard">
    <a class="pcard-img" href="product.html?id=${p.id}">
      <img src="${p.img}" alt="${esc(p.name)}" loading="lazy" decoding="async" width="800" height="600">
      ${p.badge ? `<span class="badge ${badgeCls}">${esc(p.badge)}</span>` : ''}
      ${off ? `<span class="offchip">-${off}%</span>` : ''}
    </a>
    <button class="wish ${Store.wish.includes(p.id) ? 'on' : ''}" data-wish="${p.id}" aria-label="Wishlist">${Store.wish.includes(p.id) ? '❤️' : '🤍'}</button>
    <div class="pcard-body">
      <h3><a href="product.html?id=${p.id}">${esc(p.name)}</a></h3>
      <div class="stars">★★★★★ <span>${p.rating}</span><span class="cnt">(${p.reviews + realReviewCount(p.id)} reviews)</span></div>
      <div class="price-row"><b>${money(p.price)}</b>${p.mrp ? `<s>${money(p.mrp)}</s>` : ''}${off ? `<span class="off">${off}% OFF</span>` : ''}</div>
      <div class="p-actions">
        <button class="btn btn-outline" data-add="${p.id}">Add to Cart</button>
        <a class="btn btn-wa" href="${waLink(waProductMsg(p))}" target="_blank" rel="noopener" aria-label="Order on WhatsApp">💬</a>
      </div>
    </div>
  </article>`;
};
const stars = r => '<div class="stars">' + '★'.repeat(r) + '☆'.repeat(5 - r) + '</div>';

/* ============================ HOME ============================ */
function initHome(){
  const flashTimer = document.getElementById('flashTimer');
  if (flashTimer){
    const end = new Date(); end.setHours(23,59,59,999);
    const tick = () => {
      const s = Math.max(0, Math.floor((end - Date.now()) / 1000));
      const pad = n => String(n).padStart(2,'0');
      flashTimer.innerHTML = `<b>${pad(Math.floor(s/3600))}</b><em>:</em><b>${pad(Math.floor(s%3600/60))}</b><em>:</em><b>${pad(s%60)}</b>`;
    };
    tick(); setInterval(tick, 1000);
  }
  const cats = CATEGORIES.slice(0, 12);
  document.getElementById('catGrid').innerHTML = cats.map(c => {
    const count = PRODUCTS.filter(p => p.cat === c.slug).length;
    return `<a class="cat-tile ${c.cls}" href="shop.html?cat=${c.slug}">
      <img class="ct-img" src="${catImage(c.slug)}" alt="${esc(c.name)}" loading="lazy">
      <div class="ct-over"><span class="ct-name">${c.name} <span>${c.emoji}</span></span>
      <span class="ct-count">${count} designs • ${c.blurb}</span></div></a>`;
  }).join('');
  document.getElementById('bestRow').innerHTML = PRODUCTS.filter(p => p.badge === 'Bestseller').slice(0, 4).map(cardHTML).join('');
  document.getElementById('newRow').innerHTML = PRODUCTS.filter(p => p.badge === 'New').slice(0, 4).map(cardHTML).join('');
  document.getElementById('dealRow').innerHTML = PRODUCTS.filter(p => offPct(p) >= 35).slice(0, 4).map(cardHTML).join('');
  document.getElementById('whySteps').innerHTML = [
    ['📍','Local Store — Salem','Visit us at 2/130, Thoothanoor, Edanganasalai. Local pickup available!'],
    ['🪡','Handpicked Quality','Every saree is quality-checked before dispatch — authentic fabrics, honest prices.'],
    ['⏱','Fast Delivery','Dispatch within 24–48 hours. 2–4 days in Tamil Nadu, 4–7 days across India.'],
    ['💬','Personal WhatsApp Care','Real human support in Tamil & English — replies within minutes, 9 AM – 9 PM.'],
  ].map(([n, b, p]) => `<div class="step"><span class="n">${n}</span><div><b>${b}</b><p>${p}</p></div></div>`).join('');
  document.getElementById('revGrid').innerHTML = REVIEWS.map(r => `
    <div class="rev"><div class="rev-top"><span class="avatar" style="background:${r.avatar}">${r.name[0]}</span>
      <div><b>${esc(r.name)}</b><small>${esc(r.place)} • Customer review ⭐</small></div></div>
      ${stars(r.rating)}<p>${esc(r.text)}</p></div>`).join('');
  document.getElementById('faqList').innerHTML = FAQ.map(f =>
    `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('');
  document.getElementById('heroWa').href = waLink('Hi! I would like to see your saree collection & current offers.');
  document.getElementById('waBannerBtn').href = waLink('Hi! I want to order sarees on WhatsApp. Please share your latest collection.');
  window.scrollToFaq = () => { const s = document.getElementById('faqSec'); if (s) s.scrollIntoView({ behavior:'smooth' }); };
}

/* ============================ SHOP (infinite scroll) ============================ */
const SHOP_PAGE = 12;
let shopState = { cat:'', q:'', fabric:'', max:3000, sort:'newest', shown:SHOP_PAGE, list:[] };
function initShop(){
  const params = new URLSearchParams(location.search);
  if (params.get('cat')) shopState.cat = params.get('cat');
  /* chips */
  const chips = document.getElementById('catChips');
  chips.innerHTML = '<button class="chip' + (!shopState.cat ? ' on' : '') + '" data-cat="">All</button>' +
    CATEGORIES.map(c => `<button class="chip${shopState.cat === c.slug ? ' on' : ''}" data-cat="${c.slug}">${c.emoji} ${c.name}</button>`).join('');
  chips.addEventListener('click', e => {
    const b = e.target.closest('[data-cat]'); if (!b) return;
    shopState.cat = b.dataset.cat; shopState.shown = SHOP_PAGE;
    chips.querySelectorAll('.chip').forEach(x => x.classList.toggle('on', x === b));
    renderShop();
  });
  document.getElementById('shopSearch').addEventListener('input', e => { shopState.q = e.target.value; shopState.shown = SHOP_PAGE; renderShop(); });
  document.getElementById('fFilter').addEventListener('change', e => { shopState.fabric = e.target.value; shopState.shown = SHOP_PAGE; renderShop(); });
  document.getElementById('pFilter').addEventListener('input', e => { shopState.max = +e.target.value; document.getElementById('priceLbl').textContent = money(shopState.max); shopState.shown = SHOP_PAGE; renderShop(); });
  document.getElementById('sFilter').addEventListener('change', e => { shopState.sort = e.target.value; shopState.shown = SHOP_PAGE; renderShop(); });
  document.getElementById('voiceBtn').addEventListener('click', voiceSearch);
  renderShop();
  /* infinite scroll + manual fallback */
  const moreBtn = document.getElementById('loadMoreBtn');
  const loadMore = () => {
    const loader = document.getElementById('gridLoader');
    loader.style.display = 'block';
    setTimeout(() => { shopState.shown += SHOP_PAGE; renderShop(); loader.style.display = 'none'; }, 350);
  };
  if (moreBtn) moreBtn.addEventListener('click', loadMore);
  const sentinel = document.getElementById('sentinel');
  const loader = document.getElementById('gridLoader');
  if ('IntersectionObserver' in window){
    const io = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && shopState.shown < shopState.list.length){
        loader.style.display = 'block';
        setTimeout(() => { shopState.shown += SHOP_PAGE; renderShop(); loader.style.display = 'none'; }, 350);
      }
    }, { rootMargin: '240px' });
    io.observe(sentinel);
  }
}
function filteredProducts(){
  let l = PRODUCTS.filter(p =>
    (!shopState.cat || p.cat === shopState.cat) &&
    (!shopState.q || (p.name + ' ' + p.fabric + ' ' + p.color).toLowerCase().includes(shopState.q.toLowerCase())) &&
    (!shopState.fabric || p.fabric.toLowerCase().includes(shopState.fabric.toLowerCase())) &&
    p.price <= shopState.max);
  switch (shopState.sort){
    case 'price-asc': l = [...l].sort((a,b) => a.price - b.price); break;
    case 'price-desc': l = [...l].sort((a,b) => b.price - a.price); break;
    case 'discount': l = [...l].sort((a,b) => offPct(b) - offPct(a)); break;
    case 'bestselling': l = [...l].sort((a,b) => b.reviews - a.reviews); break;
    case 'popular': l = [...l].sort((a,b) => b.rating - a.rating); break;
    default: l = [...l];
  }
  return l;
}
function renderShop(){
  shopState.list = filteredProducts();
  document.getElementById('countLbl').textContent = shopState.list.length + ' sarees (scroll for more ↓)';
  const grid = document.getElementById('grid');
  const visible = shopState.list.slice(0, shopState.shown);
  grid.innerHTML = visible.map(cardHTML).join('');
  document.getElementById('empty').style.display = visible.length ? 'none' : 'block';
  const hasMore = shopState.shown < shopState.list.length;
  document.getElementById('gridLoader').style.display = hasMore ? 'block' : 'none';
  const mb = document.getElementById('loadMoreBtn');
  if (mb) mb.style.display = hasMore ? 'inline-flex' : 'none';
}
function voiceSearch(){
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR){ toast('🎙️ Voice search not supported in this browser'); return; }
  const rec = new SR(); rec.lang = 'ta-IN';
  rec.onresult = e => { const q = e.results[0][0].transcript; document.getElementById('shopSearch').value = q; shopState.q = q; shopState.shown = SHOP_PAGE; renderShop(); toast('🎙️ "' + q + '"'); };
  rec.onerror = () => toast('🎙️ Could not hear — try again');
  rec.start();
}

/* ============================ PRODUCT (no popup on image) ============================ */
function initProduct(){
  const id = new URLSearchParams(location.search).get('id');
  const p = byId(id);
  if (!p){ document.getElementById('pdWrap').innerHTML = '<div class="empty"><div class="e-ic">🪡</div><b>Product not found</b><a class="btn btn-maroon" style="max-width:220px;margin:14px auto 0" href="shop.html">Back to Shop</a></div>'; return; }
  pdId = p.id; pdQty = 1;
  const off = offPct(p);
  const cat = catOf(p.cat);
  const eta = deliveryEstimate();
  const rel = PRODUCTS.filter(x => x.cat === p.cat && x.id !== p.id).slice(0, 4);
  /* reviews: real count from localStorage */
  const userRevs = LS.get('sk_reviews_' + p.id, []);
  const revTotal = p.reviews + userRevs.length;
  document.title = p.name + ' — SK Sarees';
  const revHTML = userRevs.length
    ? userRevs.slice().reverse().map(r => `<div class="rev" style="margin-bottom:8px"><div class="rev-top"><span class="avatar" style="background:#8f1d3a">${(r.name||'A')[0]}</span><div><b>${esc(r.name)}</b><small>Customer review ⭐</small></div></div>${stars(r.rating)}<p>${esc(r.text)}</p></div>`).join('')
    : '<p class="muted small">No customer reviews yet — be the first! 💬</p>';
  document.getElementById('pdWrap').innerHTML = `
  <div>
    <div class="pd-gal">
      <div class="main"><img src="${p.img}" alt="${esc(p.name)}" data-zoom="${p.img}"></div>
      <div class="pd-thumbs">
        ${[p.img, ...(p.colors.length > 1 ? [p.img, p.img] : [])].slice(0, 3).map((im, i) => `<button class="${i === 0 ? 'on' : ''}" data-thumb="${im}"><img src="${im}" alt=""></button>`).join('')}
      </div>
    </div>
    <div class="pd-block" style="margin-top:12px"><h3>🔍 Fabric &amp; Details</h3>
      <table>
        <tr><td>Fabric</td><td>${esc(p.fabric)}</td></tr>
        <tr><td>Colour</td><td>${esc(p.color)}</td></tr>
        <tr><td>Border</td><td>${esc(p.border)}</td></tr>
        <tr><td>Blouse</td><td>${esc(p.blouse)}</td></tr>
        <tr><td>Length / Weight</td><td>${esc(p.length)} • ${esc(p.weight)}</td></tr>
        <tr><td>Wash care</td><td>${esc(p.wash)}</td></tr>
        <tr><td>SKU</td><td>${esc(p.sku || p.id)}</td></tr>
        <tr><td>Stock</td><td>${p.stock > 0 ? (p.stock <= 5 ? `<span style="color:var(--red)">Only ${p.stock} left!</span>` : p.stock + ' in stock') : 'Out of stock'}</td></tr>
      </table>
      <p style="margin-top:8px">${esc(p.desc)}</p>
    </div>
  </div>
  <div class="pd-info">
    <span class="pd-cat">${cat ? cat.emoji + ' ' + esc(cat.name) : ''}</span>
    <h1>${esc(p.name)}</h1>
    <div class="stars">${'★'.repeat(Math.round(p.rating))}${'☆'.repeat(5 - Math.round(p.rating))} <span>${p.rating}</span><span class="cnt">(${revTotal} reviews)</span></div>
    <div class="pd-price"><b>${money(p.price)}</b>${p.mrp ? `<s>${money(p.mrp)}</s>` : ''}${off ? `<span class="off">${off}% OFF</span>` : ''}</div>
    <p class="muted small">MRP incl. all taxes • ${money(CONFIG.shipFreeAbove)}+ free shipping</p>
    <div class="pd-chips">
      <span class="pd-chip">🚚 Fast Delivery</span><span class="pd-chip">💵 COD (+₹${CONFIG.codFee})</span>
      <span class="pd-chip">↩️ 7-Day Returns</span><span class="pd-chip">⭐ ${p.rating} Rating</span>
    </div>
    <div class="delivery-card"><b>⏱ Fast Delivery & On-Time Promise</b>
      ${eta.text}.<br>${CONFIG.latePromise}</div>
    <div class="qty-row"><b>Quantity</b><div class="qty"><button data-qm aria-label="−">−</button><span id="qtyVal">1</span><button data-qp aria-label="+">+</button></div></div>
    <div class="pd-btns">
      <button class="btn btn-outline" data-addp>🛒 Add to Cart</button>
      <a class="btn btn-maroon" href="checkout.html?buy=${p.id}">⚡ Buy Now</a>
      <a class="btn btn-wa btn-xl" href="${waLink(waProductMsg(p))}" target="_blank" rel="noopener">💬 Buy on WhatsApp — Instant Confirmation</a>
    </div>
    <div class="like-row" style="display:flex;gap:8px;margin-top:12px">
      <button class="btn btn-ghost btn-sm" style="flex:1;border:1.5px solid var(--line)" data-wish="${p.id}">${Store.wish.includes(p.id) ? '❤️ Liked' : '🤍 Wishlist'}</button>
      <a class="btn btn-ghost btn-sm" style="flex:1;border:1.5px solid var(--line)" href="https://api.whatsapp.com/send?text=${encodeURIComponent('✨ Beautiful saree at SK Sarees!\n🪡 ' + p.name + '\n💰 ' + money(p.price) + '\n' + location.href)}" target="_blank" rel="noopener">📣 Share</a>
    </div>
    <div class="pd-block" style="margin-top:14px"><h3>💬 Reviews &amp; Comments</h3>${revHTML}
      <div class="rev-form" style="background:var(--bg);border:1px dashed var(--line);border-radius:12px;padding:13px;margin-top:12px;display:grid;gap:9px">
        <b>✍️ Write a review</b>
        <input id="rvName" placeholder="Your name" maxlength="40" style="width:100%;border:1.5px solid var(--line);border-radius:10px;padding:11px 12px;font-size:16px;background:#fff;outline:none">
        <select id="rvStars" style="width:100%;border:1.5px solid var(--line);border-radius:10px;padding:11px 12px;font-size:16px;background:#fff;outline:none">
          <option value="5">★★★★★ Excellent</option><option value="4">★★★★☆ Very good</option>
          <option value="3">★★★☆☆ Good</option><option value="2">★★☆☆☆ Average</option><option value="1">★☆☆☆☆ Poor</option>
        </select>
        <textarea id="rvText" rows="2" placeholder="Share your experience with this saree…" maxlength="300" style="width:100%;border:1.5px solid var(--line);border-radius:10px;padding:11px 12px;font-size:16px;background:#fff;outline:none;resize:vertical"></textarea>
        <button class="btn btn-maroon btn-sm" data-comment-submit="${p.id}">✍️ Post Comment</button>
      </div>
    </div>
  </div>
  ${rel.length ? `<div class="wrap sec" style="grid-column:1/-1"><div class="sec-head"><h2><span class="tick"></span>✨ You May Also Like</h2></div><div class="prow">${rel.map(cardHTML).join('')}</div></div>` : ''}`;
  /* gallery thumbnails switch main image (NOT a popup) */
  document.querySelectorAll('[data-thumb]').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('[data-thumb]').forEach(x => x.classList.remove('on'));
    b.classList.add('on');
    const main = document.querySelector('.pd-gal .main img');
    if (main) main.src = b.dataset.thumb;
  }));
  /* sticky bar */
  document.getElementById('stickyBar').innerHTML = `
    <div class="sb-price"><b>${money(p.price)}</b><small>${off}% off • Fast delivery</small></div>
    <a class="btn btn-outline" href="checkout.html?buy=${p.id}">Buy Now</a>
    <button class="btn btn-maroon" data-add="${p.id}">Add</button>
    <a class="btn btn-wa" href="${waLink(waProductMsg(p))}" target="_blank" rel="noopener" aria-label="Order on WhatsApp">💬</a>`;
}
/* delegated actions on product page */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-addp],[data-qm],[data-qp],[data-comment-submit]');
  if (!t) return;
  if (t.dataset.addp !== undefined){ addToCart(pdId, pdQty); }
  else if (t.dataset.qm !== undefined){ if (pdQty > 1) pdQty--; const v = document.getElementById('qtyVal'); if (v) v.textContent = pdQty; }
  else if (t.dataset.qp !== undefined){ if (pdQty < 10) pdQty++; const v = document.getElementById('qtyVal'); if (v) v.textContent = pdQty; }
  else if (t.dataset.commentSubmit){ submitComment(t.dataset.commentSubmit); }
});
let pdId = null, pdQty = 1;
function submitComment(pid){
  const name = (document.getElementById('rvName') || {}).value || '';
  const stars = (document.getElementById('rvStars') || {}).value || '5';
  const text = (document.getElementById('rvText') || {}).value || '';
  if (!text.trim()){ toast('✍️ Please write your comment first'); return; }
  const list = LS.get('sk_reviews_' + pid, []);
  list.push({ name: name || 'Anonymous', rating: +stars, text, date: Date.now() });
  LS.set('sk_reviews_' + pid, list);
  toast('✅ Thank you! Your review is posted');
  location.reload();
}

/* ============================ CART ============================ */
function renderCartPage(){
  const wrap = document.getElementById('cartWrap');
  if (!Store.cart.length){
    wrap.innerHTML = `<div class="empty"><div class="e-ic">🛒</div><b>Your cart is empty</b>Browse our sarees and add your favourites!<br><br><a class="btn btn-maroon" style="max-width:260px;margin:0 auto" href="shop.html">🛍️ Shop Sarees</a></div>`;
    return;
  }
  const t = cartTotal(); const sh = shippingFor(t); const short = Math.max(0, CONFIG.shipFreeAbove - t);
  wrap.innerHTML = `<h1>🛒 Your Cart</h1>
    <div style="display:grid;gap:16px;grid-template-columns:1fr;align-items:start">
      <div>${Store.cart.map(i => {
        const p = byId(i.id); if (!p) return '';
        return `<div class="cart-item">
          <a href="product.html?id=${p.id}"><img src="${p.img}" alt="${esc(p.name)}" loading="lazy" width="200" height="150"></a>
          <div style="flex:1;min-width:0;padding-right:26px">
            <h4><a href="product.html?id=${p.id}">${esc(p.name)}</a></h4>
            <div class="ci-price">${money(p.price)}</div>
            <div class="qty"><button data-cqm="${i.id}">−</button><span>${i.qty}</span><button data-cqp="${i.id}">+</button></div>
          </div>
          <button class="rm" data-rm="${i.id}" aria-label="Remove">✕</button>
        </div>`;
      }).join('')}</div>
      <div>
        <div class="summary">
          <div class="row"><span>Items total</span><b>${money(t)}</b></div>
          <div class="row"><span>Shipping</span><b style="color:${sh ? 'inherit' : 'var(--green)'}">${sh ? money(sh) : 'FREE'}</b></div>
          <div class="row total"><span>Total</span><b>${money(t + sh)}</b></div>
          <div class="ship-progress">${short > 0 ? `🚚 Add <b>${money(short)}</b> more to get <b>FREE shipping</b>!` : '🎉 You have <b>FREE shipping</b>!'}
            <div class="ship-bar"><i style="width:${Math.min(100, Math.round(t / CONFIG.shipFreeAbove * 100))}%"></i></div></div>
          <div class="cod-note">💵 COD Available — pay <b>&nbsp;₹${CONFIG.codFee}&nbsp;</b> extra at delivery. Choose it at checkout.</div>
          <div style="display:grid;gap:10px;margin-top:14px">
            <a class="btn btn-maroon btn-xl" href="checkout.html">Proceed to Checkout →</a>
            <a class="btn btn-wa" href="${waLink(waCartMsg())}" target="_blank" rel="noopener">💬 Order on WhatsApp Instead</a>
          </div>
          <p class="small muted" style="text-align:center;margin-top:10px">🔒 No login needed • UPI &amp; COD • 7-day returns • ⏱ Fast delivery</p>
        </div>
      </div>
    </div>`;
}
document.addEventListener('click', e => {
  const t = e.target.closest('[data-cqm],[data-cqp],[data-rm]');
  if (!t) return;
  if (t.dataset.cqm){ const it = Store.cart.find(i => i.id === t.dataset.cqm); if (it) setCartQty(it.id, it.qty - 1); renderCartPage(); }
  else if (t.dataset.cqp){ const it = Store.cart.find(i => i.id === t.dataset.cqp); if (it) setCartQty(it.id, it.qty + 1); renderCartPage(); }
  else if (t.dataset.rm){ removeFromCart(t.dataset.rm); renderCartPage(); }
});

/* ============================ CHECKOUT ============================ */
const co = { step: 1, data: Object.assign({ name:'', phone:'', address:'', pincode:'', payment:'upi' }, Store.profile) };
function initCheckout(){
  const buy = new URLSearchParams(location.search).get('buy');
  if (buy && !Store.cart.some(i => i.id === buy)) addToCart(buy, 1);
  if (!Store.cart.length){ document.getElementById('coWrap').innerHTML = `<div class="empty"><div class="e-ic">🛒</div><b>Your cart is empty</b><a class="btn btn-maroon" style="max-width:240px;margin:14px auto 0" href="shop.html">Shop Sarees</a></div>`; return; }
  renderCo();
}
function renderCo(){
  const wrap = document.getElementById('coWrap');
  const d = co.data;
  const stepsUI = `<div class="steps-ui">
    <div class="step-dot ${co.step > 1 ? '' : 'on'}"><span class="dot">${co.step > 1 ? '✓' : '1'}</span><span class="lbl">Details</span></div>
    <div class="step-line ${co.step > 1 ? 'on' : ''}"></div>
    <div class="step-dot ${co.step === 2 ? 'on' : ''}"><span class="dot">2</span><span class="lbl">Payment</span></div>
  </div>`;
  wrap.innerHTML = `<h1>🔒 Secure Checkout</h1>${stepsUI}${co.step === 1 ? coStep1(d) : coStep2(d)}`;
  if (co.step === 2 && d.payment === 'upi') setTimeout(drawUpiQR, 60);
}
function coStep1(d){
  return `<div class="form-card">
    <h3>📋 Your Details <span class="muted small" style="font-weight:500">(no login needed)</span></h3>
    <div class="field"><label>Full Name <span class="req">*</span></label><input id="coName" data-co="name" value="${esc(d.name)}" placeholder="e.g. Lakshmi S" autocomplete="name"></div>
    <div class="field"><label>WhatsApp / Mobile <span class="req">*</span></label><input id="coPhone" data-co="phone" value="${esc(d.phone)}" placeholder="10-digit mobile" inputmode="numeric" maxlength="10" autocomplete="tel"><div class="hint">📱 Order updates &amp; delivery alerts on this number</div></div>
    <div class="field"><label>Complete Address <span class="req">*</span></label><textarea id="coAddr" data-co="address" rows="3" placeholder="House no, street, area, city…" autocomplete="street-address">${esc(d.address)}</textarea></div>
    <div class="field"><label>PIN Code <span class="req">*</span></label><input id="coPin" data-co="pincode" value="${esc(d.pincode)}" placeholder="6-digit PIN" inputmode="numeric" maxlength="6" autocomplete="postal-code"></div>
  </div>
  <div class="form-card">
    <h3>💳 Payment Method</h3>
    <div class="pay-grid">
      <div class="pay-opt ${d.payment === 'upi' ? 'on' : ''}" data-pay="upi">
        <span class="po-ic" style="background:#e3f2fd">📲</span>
        <span><b>UPI — Pay Online</b><small>GPay • PhonePe • Paytm • Scan QR</small></span><span class="radio"></span>
      </div>
      <div class="pay-opt ${d.payment === 'cod' ? 'on' : ''}" data-pay="cod">
        <span class="po-ic" style="background:var(--gold-soft)">💵</span>
        <span><b>Cash on Delivery</b><small>Pay at delivery — extra ₹${CONFIG.codFee} applies</small></span><span class="radio"></span>
      </div>
    </div>
  </div>
  <div class="delivery-card" style="margin-bottom:14px"><b>⏱ Fast Delivery</b>${deliveryEstimate().text}.<br>${CONFIG.latePromise}</div>
  ${d.payment === 'cod'
    ? `<button class="btn btn-wa btn-xl" data-confirm-wa>💬 Confirm Order on WhatsApp</button>
       <p class="small muted" style="text-align:center;margin-top:8px">Instant confirmation — your COD order (incl. ₹${CONFIG.codFee}) is sent to us on WhatsApp.</p>`
    : `<button class="btn btn-maroon btn-xl" data-cont>Continue to Payment →</button>`}
  <p class="small muted" style="text-align:center;margin-top:10px">🔒 100% secure • We never store card details</p>`;
}
function coStep2(d){
  const t = calcTotals(d.payment);
  const itemLines = Store.cart.map(i => { const p = byId(i.id); return p ? `<div class="row"><span>${esc(p.name)} ×${i.qty}</span><b>${money(p.price * i.qty)}</b></div>` : ''; }).join('');
  const upiPay = d.payment === 'upi';
  return `<div class="form-card">
    <h3>🧾 Review Your Order</h3>
    ${itemLines}
    <div class="row"><span>Shipping</span><b style="color:${t.shipping ? 'inherit' : 'var(--green)'}">${t.shipping ? money(t.shipping) : 'FREE'}</b></div>
    ${upiPay ? '' : `<div class="row"><span>COD charges</span><b>+${money(t.codFee)}</b></div>`}
    <div class="row total"><span>Total</span><b>${money(t.grand)}</b></div>
    <div class="delivery-card" style="margin-top:10px"><b>⏱ Fast Delivery</b>${t.eta}.</div>
    <div class="row" style="margin-top:8px"><span style="color:var(--muted);font-size:.8rem">Deliver to</span></div>
    <p class="small" style="border:1px dashed var(--line);border-radius:10px;padding:10px;background:var(--bg)"><b>${esc(d.name)}</b> • ${esc(d.phone)}<br>${esc(d.address)} — ${esc(d.pincode)}</p>
  </div>
  ${upiPay ? `
  <div class="form-card">
    <h3>📲 Pay by UPI</h3>
    <div class="pay-amt" style="text-align:center"><b style="font-size:1.9rem;color:var(--maroon)">${money(t.grand)}</b><span class="muted small">payable</span></div>
    <div class="qr-box"><div id="upiQR"></div>
      <div class="upi-id">${esc(CONFIG.upiId)} <button class="btn btn-ghost btn-sm" style="min-height:30px;padding:4px 10px" data-copy="${esc(CONFIG.upiId)}">Copy</button></div>
    </div>
    <a class="btn btn-gold btn-xl" href="${upiLink(t.grand, 'SK Sarees order')}">📲 Pay Now — Open UPI App</a>
    <div style="display:flex;gap:8px;margin-top:10px">
      <a class="btn btn-ghost btn-sm" style="flex:1;border:1.5px solid var(--line)" href="tez://upi/pay?pa=${CONFIG.upiId}&pn=${encodeURIComponent(CONFIG.upiName)}&am=${t.grand.toFixed(2)}&cu=INR&tn=SK%20Sarees">🟢 GPay</a>
      <a class="btn btn-ghost btn-sm" style="flex:1;border:1.5px solid var(--line)" href="phonepe://pay?pa=${CONFIG.upiId}&pn=${encodeURIComponent(CONFIG.upiName)}&am=${t.grand.toFixed(2)}&cu=INR&tn=SK%20Sarees">🔵 PhonePe</a>
      <a class="btn btn-ghost btn-sm" style="flex:1;border:1.5px solid var(--line)" href="paytmmp://pay?pa=${CONFIG.upiId}&pn=${encodeURIComponent(CONFIG.upiName)}&am=${t.grand.toFixed(2)}&cu=INR&tn=SK%20Sarees">🔴 Paytm</a>
    </div>
    <p class="upi-note" style="margin-top:10px">Scan QR or tap “Pay Now” — then tap the button below after paying.</p>
    <div class="verify-note">✅ After paying, tap below. We will verify &amp; confirm your order on WhatsApp within minutes.</div>
    <button class="btn btn-maroon btn-xl" data-place="upi">✅ I've Paid — Confirm My Order</button>
  </div>` : `
  <div class="form-card">
    <h3>💵 Cash on Delivery</h3>
    <div style="text-align:center"><b style="font-size:1.9rem;color:var(--maroon)">${money(t.grand)}</b><span class="muted small"> pay at delivery</span></div>
    <div class="cod-note">💵 COD Available (Extra <b>₹${CONFIG.codFee}</b> charges apply) — already added above.</div>
    <p class="upi-note" style="margin:10px 0">Keep ${money(t.grand)} ready when your saree arrives. Check the parcel before paying.</p>
    <button class="btn btn-maroon btn-xl" data-place="cod">✅ Place Order — Pay on Delivery</button>
  </div>`}
  <button class="btn btn-ghost" data-back>← Back to edit details</button>`;
}
function drawUpiQR(){
  const box = document.getElementById('upiQR'); if (!box || box.dataset.done) return;
  box.dataset.done = '1';
  const t = calcTotals('upi');
  try{
    const qr = qrcode(0, 'M');
    qr.addData(upiLink(t.grand, 'SK Sarees order'));
    qr.make();
    box.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
  }catch(e){ box.innerHTML = '<p class="small muted">Scan unavailable — use “Pay Now” or the UPI ID.</p>'; }
}
function validateCo1(){
  const d = co.data; let ok = true;
  const setErr = (id, bad) => { const el = document.getElementById(id); if (el) el.classList.toggle('err', bad); };
  if (d.name.trim().length < 2){ setErr('coName', true); ok = false; } else setErr('coName', false);
  if (!validPhone(d.phone)){ setErr('coPhone', true); ok = false; } else setErr('coPhone', false);
  if (d.address.trim().length < 10){ setErr('coAddr', true); ok = false; } else setErr('coAddr', false);
  if (!/^\d{6}$/.test(d.pincode || '')){ setErr('coPin', true); ok = false; } else setErr('coPin', false);
  if (!ok) toast('⚠️ Please fill the highlighted fields correctly');
  return ok;
}
function placeOrder(payment){
  const d = co.data;
  if (!validateCo1()) return;
  const t = calcTotals(payment);
  const order = {
    id: genOrderId(), date: new Date().toISOString(),
    items: Store.cart.map(i => ({ id: i.id, name: byId(i.id).name, price: byId(i.id).price, qty: i.qty })),
    customer: { name: d.name.trim(), phone: d.phone.trim(), address: d.address.trim(), pincode: d.pincode.trim() },
    payment, totals: t, status: payment === 'upi' ? 'confirmed' : 'placed',
  };
  Store.orders.unshift(order); Store.saveOrders();
  Firestore.saveOrder(order).then(()=>{});
  /* save profile for next time */
  Store.profile = { name: d.name.trim(), phone: d.phone.trim(), address: d.address.trim(), pincode: d.pincode.trim() };
  Store.saveProfile();
  Store.cart = []; Store.saveCart();
  co.step = 1; co.data = Object.assign({}, Store.profile, { payment:'upi' });
  /* inline success screen — NO popup */
  showSuccess(order, false);
}
function confirmOrderOnWhatsApp(){
  const d = co.data;
  if (!validateCo1()) return;
  const t = calcTotals('cod');
  const order = {
    id: genOrderId(), date: new Date().toISOString(),
    items: Store.cart.map(i => ({ id: i.id, name: byId(i.id).name, price: byId(i.id).price, qty: i.qty })),
    customer: { name: d.name.trim(), phone: d.phone.trim(), address: d.address.trim(), pincode: d.pincode.trim() },
    payment: 'cod', totals: t, status: 'placed',
  };
  Store.orders.unshift(order); Store.saveOrders();
  Firestore.saveOrder(order).then(()=>{});
  Store.profile = { name: d.name.trim(), phone: d.phone.trim(), address: d.address.trim(), pincode: d.pincode.trim() };
  Store.saveProfile();
  const msg = `Hi! I want to confirm my COD order:\n\n🪡 Order ID: ${order.id}\n👤 Name: ${order.customer.name}\n📱 Phone: ${order.customer.phone}\n🏠 Address: ${order.customer.address}, ${order.customer.pincode}\n\nItems:\n${order.items.map(i => '• ' + i.name + ' ×' + i.qty + ' — ' + money(i.price * i.qty)).join('\n')}\n\nTotal (incl. COD ₹${CONFIG.codFee}): ${money(t.grand)}\nETA: ${t.eta}\n\nPlease confirm my order. Thank you!`;
  Store.cart = []; Store.saveCart();
  co.step = 1; co.data = Object.assign({}, Store.profile, { payment:'upi' });
  try{ window.open(waLink(msg), '_blank', 'noopener'); }catch(e){}
  /* inline success screen — NO popup */
  showSuccess(order, true);
}
document.addEventListener('click', e => {
  if (e.target.id === 'grpGo'){ return; }
  const t = e.target.closest('[data-cont],[data-back],[data-place],[data-pay],[data-confirm-wa],[data-copy]');
  if (!t) return;
  if (t.dataset.cont !== undefined){ e.preventDefault(); if (validateCo1()){ co.step = 2; renderCo(); } }
  else if (t.dataset.back !== undefined){ e.preventDefault(); co.step = 1; renderCo(); }
  else if (t.dataset.place){ e.preventDefault(); placeOrder(t.dataset.place); }
  else if (t.dataset.pay){ e.preventDefault(); co.data.payment = t.dataset.pay; renderCo(); }
  else if (t.dataset.confirmWa !== undefined){ e.preventDefault(); confirmOrderOnWhatsApp(); }
  else if (t.dataset.copy){ e.preventDefault(); copyText(t.dataset.copy); }
});
document.addEventListener('input', e => { if (e.target.dataset.co) co.data[e.target.dataset.co] = e.target.value; });

/* ============================ ORDERS (live) ============================ */
let orderFilter = 'all';
function initOrders(){
  const q = new URLSearchParams(location.search);
  const wrap = document.getElementById('ordersWrap');
  wrap.innerHTML = `<h1>📦 My Orders <span class="sync-pill" id="fsPill" style="display:inline-flex;align-items:center;gap:6px;font-size:.7rem;font-weight:800;padding:5px 11px;border-radius:999px;background:var(--gold-soft);color:#6b4c05;border:1px dashed #d8b24e;vertical-align:middle;margin-left:6px">☁️ sync…</span></h1>
    <div class="cat-chips" id="orderChips">
      <button class="chip on" data-of="all">All</button>
      <button class="chip" data-of="placed">🆕 New</button>
      <button class="chip" data-of="confirmed">✅ Confirmed</button>
      <button class="chip" data-of="shipped">🚚 Dispatched</button>
      <button class="chip" data-of="delivered">✔ Delivered</button>
    </div>
    <div id="orderList"></div>
    <div class="form-card" style="margin-top:16px"><h3>🔍 Track by Order ID</h3>
      <div class="field"><input id="trackId" placeholder="e.g. SSK1A2B3C"></div>
      <button class="btn btn-maroon" id="trackBtn">Track Order</button>
    </div>`;
  document.getElementById('orderChips').addEventListener('click', e => {
    const b = e.target.closest('[data-of]'); if (!b) return;
    orderFilter = b.dataset.of;
    document.querySelectorAll('#orderChips .chip').forEach(x => x.classList.toggle('on', x === b));
    renderOrdersList();
  });
  document.getElementById('trackBtn').addEventListener('click', () => {
    const id = document.getElementById('trackId').value.trim();
    if (id) location.href = 'orders.html?id=' + encodeURIComponent(id);
  });
  renderOrdersList();
  /* LIVE sync: new/updated orders from Firestore (any device) appear here */
  if (Firestore.enabled()){
    Firestore.listenOrders(list => {
      const localMap = {}; Store.orders.forEach(o => localMap[o.id] = o);
      Store.orders = list.map(f => Object.assign({}, f, localMap[f.id] || {}))
        .concat(Store.orders.filter(o => !list.some(x => x.id === o.id)));
      Store.orders.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      Store.saveOrders();
      renderOrdersList();
    });
  }
  /* Firestore sync indicator */
  const fsPill = document.getElementById('fsPill');
  if (fsPill){
    const setPill = (st, err) => {
      if (st === 'connected'){ fsPill.className = 'sync-pill online'; fsPill.textContent = '🟢 Live sync'; fsPill.style.cssText = 'display:inline-flex;align-items:center;gap:6px;font-size:.7rem;font-weight:800;padding:5px 11px;border-radius:999px;background:#e9f7ef;color:var(--green);border:1px solid #bfe6cf;vertical-align:middle;margin-left:6px'; }
      else if (st === 'error'){ fsPill.className = 'sync-pill'; fsPill.textContent = '🔴 Offline mode'; fsPill.title = err || ''; }
      else { fsPill.textContent = '☁️ sync…'; }
    };
    Firestore.onStatus = (st, err) => setPill(st, err);
    setPill(Firestore.status, Firestore.lastError);
    if (Firestore.enabled()) Firestore._load().catch(()=>{});
    else fsPill.textContent = '⚪ Local only';
  }
  const pid = q.get('placed');
  if (pid){
    const o = Store.orders.find(x => x.id === pid);
    if (o) setTimeout(() => { showSuccess(o, q.get('wa') === '1'); }, 300);
  }
  const tid = q.get('id');
  if (tid) trackById(tid);
}
function statusTrack(o){
  const steps = [['placed','🆕 Placed'], ['confirmed','✅ Confirmed'], ['shipped','🚚 Dispatched'], ['delivered','✔ Delivered']];
  const idx = steps.findIndex(s => s[0] === o.status);
  return `<div class="status-track">${steps.map((s, i) => `<span class="${i < idx ? 'done' : i === idx ? 'now' : ''}">${s[1]}</span>`).join('')}</div>`;
}
function renderOrdersList(){
  const list = orderFilter === 'all' ? Store.orders : Store.orders.filter(o => (o.status || 'placed') === orderFilter);
  const wrap = document.getElementById('orderList');
  if (!list.length){
    wrap.innerHTML = `<div class="empty"><div class="e-ic">📦</div><b>No orders yet</b>Place your first saree order and track it here!<br><br><a class="btn btn-maroon" style="max-width:240px;margin:0 auto" href="shop.html">🛍️ Shop Sarees</a></div>`;
    return;
  }
  wrap.innerHTML = list.map(o => `<div class="order-card">
    <div class="oc-top"><b>#${o.id}</b><span class="status-pill status-${o.status}">${esc((o.status||'placed').replace('_',' '))}</span></div>
    <div class="oc-items">${fmtDate(o.date)} • ${money(o.totals.grand)} (${o.payment.toUpperCase()})<br>
      ${o.dispatchedAt ? '📦 Dispatched: <b>' + fmtDate(o.dispatchedAt) + '</b>' : ''}${o.deliverBy ? ' • ETA: <b>' + fmtDate(o.deliverBy) + '</b>' : ''}<br>ETA: ${esc(o.totals.eta || '')}</div>
    ${statusTrack(o)}
    <a class="btn btn-outline btn-sm" style="margin-top:10px" href="orders.html?id=${o.id}">👁️ View Order Details</a>
  </div>`).join('');
  /* live Firestore status for each */
  list.forEach(o => {
    Firestore.onOrder(o.id, doc => {
      if (doc && doc.status && doc.status !== o.status){
        const i = Store.orders.findIndex(x => x.id === o.id);
        if (i >= 0){ Store.orders[i] = Object.assign({}, Store.orders[i], doc); Store.saveOrders(); renderOrdersList(); }
      }
    });
  });
}
function trackById(id){
  const wrap = document.getElementById('orderList');
  const local = Store.orders.find(o => o.id.toLowerCase() === id.toLowerCase());
  const show = o => {
    if (!o){ wrap.innerHTML = `<div class="empty"><div class="e-ic">🔍</div><b>Order not found</b>Check the ID or WhatsApp us.</div>`; return; }
    const t = o.totals || { itemsTotal:0, shipping:0, codFee:0, grand:0 };
    const items = (o.items || []).map(i => {
      const p = byId(i.id);
      return `<div style="display:flex;gap:12px;align-items:center;background:var(--bg);border-radius:11px;padding:10px;margin-bottom:8px">
        <a href="product.html?id=${i.id}"><img src="${p ? p.img : 'images/products/printed-cotton.jpg'}" alt="${esc(i.name)}" style="width:64px;height:48px;object-fit:cover;border-radius:8px;flex:0 0 auto"></a>
        <div style="flex:1;min-width:0"><a href="product.html?id=${i.id}" style="font-size:.85rem;font-weight:800;display:block;line-height:1.3">${esc(i.name)}</a>
        <small class="muted">${money(i.price)} × ${i.qty}</small></div>
        <b>${money(i.price * i.qty)}</b></div>`;
    }).join('');
    wrap.innerHTML = `<div class="form-card"><h3>📦 Order #${esc(o.id)}</h3>
      <div class="oc-items" style="margin:4px 0">${fmtDate(o.date)} • ${esc((o.customer||{}).name||'')} • ${money(t.grand)} (${o.payment.toUpperCase()})</div>
      <span class="status-pill status-${o.status}">${esc((o.status||'placed').replace('_',' '))}</span>
      ${statusTrack(o)}
      <div style="margin-top:12px">${items}</div>
      <div style="margin-top:6px">
        <div style="display:flex;justify-content:space-between;font-size:.85rem;padding:3px 0"><span class="muted">Items total</span><b>${money(t.itemsTotal)}</b></div>
        <div style="display:flex;justify-content:space-between;font-size:.85rem;padding:3px 0"><span class="muted">Shipping</span><b style="color:${t.shipping ? 'inherit' : 'var(--green)'}">${t.shipping ? money(t.shipping) : 'FREE'}</b></div>
        ${t.codFee ? `<div style="display:flex;justify-content:space-between;font-size:.85rem;padding:3px 0"><span class="muted">COD charges</span><b>+${money(t.codFee)}</b></div>` : ''}
        <div style="display:flex;justify-content:space-between;font-weight:800;font-size:.95rem;padding:6px 0;border-top:2px dashed var(--line);margin-top:4px"><span>Total</span><b style="color:var(--maroon)">${money(t.grand)}</b></div>
      </div>
      <div class="oc-items" style="margin-top:8px">⏱ ${esc(t.eta || 'Dispatch 24–48h')}<br>${o.dispatchedAt ? '📦 Dispatched: <b>' + fmtDate(o.dispatchedAt) + '</b>' : ''}${o.deliverBy ? ' • Expected delivery: <b>' + fmtDate(o.deliverBy) + '</b>' : ''}</div>
      <div class="oc-items">Deliver to: <b>${esc((o.customer||{}).name||'')}</b> • ${esc((o.customer||{}).phone||'')}<br>${esc((o.customer||{}).address||'')} — ${esc((o.customer||{}).pincode||'')}</div>
      <div style="display:grid;gap:8px;margin-top:12px;grid-template-columns:1fr 1fr">
        <a class="btn btn-wa btn-sm" href="${waLink('Hi! I want to track my order ' + o.id + '.')}" target="_blank" rel="noopener">💬 Ask on WhatsApp</a>
        <a class="btn btn-outline btn-sm" href="https://api.whatsapp.com/send?text=${encodeURIComponent('🛍️ I ordered from SK Sarees! Order ID ' + o.id)}" target="_blank" rel="noopener">📣 Share</a>
      </div>
    </div>`;
  };
  if (local) show(local);
  Firestore.getOrder(id).then(doc => { if (doc && (!local || doc.status !== local.status)) show(doc); });
  Firestore.onOrder(id, doc => { if (doc) show(doc); });
}
/* Inline order success screen — NO popup. Renders in the current page. */
function showSuccess(o, viaWa){
  const t = o.totals || { itemsTotal:0, shipping:0, codFee:0, grand:0, eta:'' };
  const items = (o.items || []).map(i => `<div style="display:flex;justify-content:space-between;font-size:.84rem;padding:6px 0;border-bottom:1px dashed var(--line)"><span>${esc(i.name)} ×${i.qty}</span><b>${money(i.price * i.qty)}</b></div>`).join('');
  const panel = `
  <div class="success">
    <div class="tick-big"><svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></div>
    <h1>${viaWa ? '🎉 Order Sent on WhatsApp!' : '🎉 Order Placed Successfully!'}</h1>
    <span class="oid">Order ID: #${esc(o.id)}</span>
    <p class="muted small" style="max-width:46ch;margin:8px auto 0">${viaWa ? 'WhatsApp is opening with your COD order — just tap <b>Send</b>. We will confirm within minutes! 💬' : 'Our team will confirm your order on WhatsApp within minutes. Keep your phone handy! 📱'}</p>
  </div>
  <div class="summary" style="margin-top:6px">
    ${items}
    <div style="display:flex;justify-content:space-between;font-size:.9rem;padding:6px 0"><span>Shipping</span><b style="color:${t.shipping ? 'inherit' : 'var(--green)'}">${t.shipping ? money(t.shipping) : 'FREE'}</b></div>
    ${t.codFee ? `<div style="display:flex;justify-content:space-between;font-size:.9rem;padding:6px 0"><span>COD charges</span><b>+${money(t.codFee)}</b></div>` : ''}
    <div class="row total"><span>Total (${(o.payment || 'upi').toUpperCase()})</span><b>${money(t.grand)}</b></div>
    <div class="small muted" style="text-align:center;margin-top:8px">⏱ ${esc(t.eta || 'Dispatch 24–48h')}</div>
  </div>
  <div style="display:grid;gap:10px;margin-top:16px;grid-template-columns:1fr 1fr">
    <a class="btn btn-maroon" href="orders.html?id=${o.id}">📦 Track This Order</a>
    <a class="btn btn-gold" href="shop.html">🛍️ Continue Shopping</a>
    ${viaWa ? '' : `<a class="btn btn-wa" style="grid-column:1/-1" href="${waLink('Hi! I just placed order ' + o.id + '. Please confirm it.')}" target="_blank" rel="noopener">💬 Chat with Us on WhatsApp</a>`}
  </div>`;
  const wrap = document.getElementById('coWrap') || document.getElementById('ordersWrap');
  if (wrap){
    if (document.body.dataset.page === 'checkout'){ wrap.innerHTML = '<h1>🔒 Secure Checkout</h1>' + panel; }
    else { wrap.insertAdjacentHTML('afterbegin', panel); }
    try{ window.scrollTo({ top:0, behavior:'smooth' }); }catch(e){}
  }
}

/* ============================ PROFILE ============================ */
function initProfile(){
  const wrap = document.getElementById('profileWrap');
  const p = Store.profile;
  wrap.innerHTML = `<h1>👤 My Profile</h1>
    <div class="prof-card"><h3>📋 Saved Details (auto-fills checkout)</h3>
      <div class="field"><label>Full Name</label><input id="pfName" value="${esc(p.name)}" placeholder="Your name"></div>
      <div class="field"><label>WhatsApp / Mobile</label><input id="pfPhone" value="${esc(p.phone)}" placeholder="10-digit mobile" inputmode="numeric" maxlength="10"></div>
      <div class="field"><label>Address</label><textarea id="pfAddr" rows="2" placeholder="House no, street, area, city…">${esc(p.address)}</textarea></div>
      <div class="field"><label>PIN Code</label><input id="pfPin" value="${esc(p.pincode)}" placeholder="6-digit PIN" inputmode="numeric" maxlength="6"></div>
      <button class="btn btn-maroon" id="pfSave">💾 Save Details</button>
      <p class="small muted" style="margin-top:8px">🔒 Stored only on your device. Used to fill checkout faster.</p>
    </div>
    <div class="prof-card"><h3>❤️ My Wishlist</h3><div class="wish-grid" id="wishGrid"></div></div>
    <div class="prof-card"><h3>🌐 Language</h3>
      <select id="pfLang" style="width:100%;border:1.5px solid var(--line);border-radius:10px;padding:12px">
        <option value="en" ${lang === 'en' ? 'selected' : ''}>English</option>
        <option value="ta" ${lang === 'ta' ? 'selected' : ''}>தமிழ்</option>
      </select></div>
    <div class="prof-card"><h3>🏠 Store Info</h3>
      <p class="small" style="line-height:1.9">📍 2/130, Thoothanoor, Edanganasalai, Salem 637502<br>📞 <a href="tel:+917867915699" style="color:var(--maroon);font-weight:800">+91 78679 15699</a><br>💬 <a href="${waLink('Hi! I need help.')}" target="_blank" rel="noopener" style="color:var(--wa-d);font-weight:800">Chat on WhatsApp</a><br>⏰ 9 AM – 9 PM, all days</p>
    </div>`;
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
  const wg = document.getElementById('wishGrid');
  const list = Store.wish.map(byId).filter(Boolean);
  wg.innerHTML = list.length ? list.map(p => `
    <div class="pcard" style="box-shadow:var(--sh-sm)">
      <a class="pcard-img" href="product.html?id=${p.id}"><img src="${p.img}" alt="${esc(p.name)}" loading="lazy"></a>
      <div class="pcard-body"><h3>${esc(p.name)}</h3>
        <div class="price-row"><b>${money(p.price)}</b></div>
        <div class="p-actions"><button class="btn btn-outline" data-add="${p.id}">Add</button>
        <a class="btn btn-wa" href="${waLink(waProductMsg(p))}" target="_blank" rel="noopener" aria-label="Order on WhatsApp">💬</a></div>
      </div>
    </div>`).join('')
    : '<p class="muted small">❤️ Nothing yet — tap the heart on any saree to save it here.</p>';
}
