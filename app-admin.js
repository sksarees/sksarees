/* ============================================================================
   SK SAREES — Admin panel (admin.html)
   PIN login (1600) · Dashboard · Live orders (Firestore) · Status updates ·
   WhatsApp automation · Products (add / edit / delete / bulk upload)
   ========================================================================== */
'use strict';
const ADMIN_PIN = '1600'; /* 👉 change this before going live */

function adminInit(){
  injectChrome();
  document.querySelectorAll('img').forEach(im => { if (im.complete) im.classList.add('in'); });
  if (sessionStorage.getItem('sk_admin') === '1'){
    renderAdmin();
  } else {
    renderLogin();
  }
}
document.addEventListener('DOMContentLoaded', adminInit);

function renderLogin(){
  document.getElementById('adminApp').innerHTML = `
    <div style="max-width:360px;margin:40px auto;text-align:center">
      <div style="font-size:3rem">🔐</div>
      <h1 style="margin-top:10px">Store Admin</h1>
      <p class="muted small">Enter the admin PIN to manage orders & products.</p>
      <input id="pin" type="password" inputmode="numeric" placeholder="Admin PIN" style="width:100%;border:1.5px solid var(--line);border-radius:12px;padding:14px;text-align:center;font-size:1.2rem;letter-spacing:8px;background:#fff;outline:none;margin-top:18px">
      <button class="btn btn-maroon" id="pinBtn" style="margin-top:12px">Login</button>
    </div>`;
  const go = () => {
    if (document.getElementById('pin').value === ADMIN_PIN){
      sessionStorage.setItem('sk_admin', '1'); renderAdmin();
    } else toast('❌ Wrong PIN');
  };
  document.getElementById('pinBtn').addEventListener('click', go);
  document.getElementById('pin').addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
}

/* ---------- state ---------- */
let adminTab = 'dashboard';
let orderFilter = 'all';
let fsUnsub = () => {};

/* ---------- merge local + Firestore (local edits win) ---------- */
function mergeOrders(fsOrders){
  const localMap = {}; Store.orders.forEach(o => localMap[o.id] = o);
  Store.orders = fsOrders.map(f => Object.assign({}, f, localMap[f.id] || {}))
    .concat(Store.orders.filter(o => !fsOrders.some(f => f.id === o.id)));
  Store.orders.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  Store.saveOrders();
  renderStats(); renderFilters(); renderOrdersList();
}

/* ---------- Firestore status pill ---------- */
function fsPillHTML(){
  const st = Firestore.status;
  if (st === 'connected') return '<span class="sync-pill online" id="syncPill">🟢 Live — Firestore connected</span>';
  if (st === 'loading') return '<span class="sync-pill" id="syncPill">☁️ Connecting…</span>';
  if (st === 'error') return `<span class="sync-pill" id="syncPill" title="${esc(Firestore.lastError)}">🔴 Firestore error — local only</span>`;
  return '<span class="sync-pill" id="syncPill">⚪ Local only (Firestore off)</span>';
}

/* ---------- render ---------- */
function renderAdmin(){
  document.getElementById('adminApp').innerHTML = `
    <div class="admin-top">
      <h1>🛠️ SK Sarees — Admin</h1>
      ${fsPillHTML()}
    </div>
    <div class="admin-tabs">
      <button class="admin-tab on" id="tabOrders">📋 Orders</button>
      <button class="admin-tab" id="tabProducts">🛍️ Products</button>
      <button class="admin-tab" id="tabDashboard">📊 Dashboard</button>
    </div>
    <div id="tabBody"></div>
    <div class="tpl-card">
      <h3>🤖 WhatsApp Automation Templates</h3>
      <p>Tap to copy — then paste in WhatsApp. Per-order Confirm / Delivery buttons are on each order card.</p>
      <div style="display:grid;gap:8px;grid-template-columns:repeat(auto-fit,minmax(210px,1fr))">
        <button class="btn btn-outline btn-sm" data-copy="🎉 Thank you for your order! Your saree will be dispatched shortly and you will receive tracking updates on WhatsApp. 💐">📋 Order Confirmation</button>
        <button class="btn btn-outline btn-sm" data-copy="🚚 Your beautiful Saree is out for delivery! Track your order here. Thank you for shopping with us. 🪡">📋 Delivery Reminder</button>
        <button class="btn btn-outline btn-sm" data-copy="🔔 New saree arrivals & festival offers are here! Reply YES to get WhatsApp alerts for the latest collection. 🪡">📋 Restock / Festival</button>
      </div>
    </div>
    <button class="btn btn-ghost btn-sm" id="logoutBtn" style="margin-top:14px;width:auto;border:1.5px solid var(--line)">Logout</button>`;
  document.getElementById('tabDashboard').addEventListener('click', () => switchTab('dashboard'));
  document.getElementById('tabOrders').addEventListener('click', () => switchTab('orders'));
  document.getElementById('tabProducts').addEventListener('click', () => switchTab('products'));
  document.getElementById('logoutBtn').addEventListener('click', () => { sessionStorage.removeItem('sk_admin'); location.reload(); });
  switchTab('orders');
  /* live Firestore + status */
  if (Firestore.enabled()){
    Firestore.onStatus = (st, err) => {
      const pill = document.getElementById('syncPill');
      if (!pill) return;
      if (st === 'connected'){ pill.className = 'sync-pill online'; pill.textContent = '🟢 Live — Firestore connected'; pill.title = ''; }
      else if (st === 'error'){ pill.className = 'sync-pill'; pill.textContent = '🔴 Firestore error — local only'; pill.title = err; }
      else { pill.className = 'sync-pill'; pill.textContent = '☁️ Connecting…'; }
    };
    fsUnsub = Firestore.listenOrders(list => mergeOrders(list));
  } else {
    const pill = document.getElementById('syncPill');
    if (pill) pill.textContent = '⚪ Local only (Firestore off)';
    mergeOrders([]);
  }
  /* merge Firestore products into catalog (if no local override) */
  if (Firestore.enabled() && !localStorage.getItem('sk_products')){
    ProductCloud.loadAll().then(list => {
      if (list && list.length){ mergeCloudProducts(list); if (adminTab === 'products') renderProductsTable(); }
    });
  }
  /* auto-deliver */
  Store.orders.forEach(dispatchOrder); Store.saveOrders();
  setTimeout(maybeAutoDeliver, 1500);
  setInterval(maybeAutoDeliver, 30000);
}

function switchTab(t){
  adminTab = t;
  ['tabDashboard','tabOrders','tabProducts'].forEach(id => document.getElementById(id).classList.toggle('on', id === 'tab' + t[0].toUpperCase() + t.slice(1)));
  if (t === 'dashboard') renderStats();
  else if (t === 'orders') renderFilters() && renderOrdersList();
  else if (t === 'products') renderProductsTable();
}

function renderStats(){
  const o = Store.orders;
  const sales = o.reduce((s, x) => s + ((x.totals || {}).grand || 0), 0);
  document.getElementById('tabBody').innerHTML = `
    <div class="stat-row">
      <div class="stat-chip"><b>${o.length}</b><small>Total</small></div>
      <div class="stat-chip"><b>${o.filter(x => (x.status||'placed') === 'placed').length}</b><small>New</small></div>
      <div class="stat-chip"><b>${o.filter(x => (x.status||'placed') === 'confirmed').length}</b><small>Confirmed</small></div>
      <div class="stat-chip"><b>${o.filter(x => (x.status||'placed') === 'shipped').length}</b><small>Shipped</small></div>
      <div class="stat-chip"><b>${o.filter(x => (x.status||'placed') === 'delivered').length}</b><small>Delivered</small></div>
      <div class="stat-chip"><b>₹${sales.toLocaleString('en-IN')}</b><small>Sales</small></div>
    </div>
    <div class="form-card" style="margin-top:14px"><h3>ℹ️ How to run the store</h3>
      <p class="small muted">1. New orders arrive here <b>live</b> (Firestore) — or locally if Firestore is off.<br>
      2. Open each order → update status → <b>Send Confirmation</b> straight to the customer's WhatsApp.<br>
      3. When shipped, dispatch date + ETA (7 days) are captured automatically — and the order auto-marks <b>Delivered</b> after the ETA.<br>
      4. Add products in the <b>🛍️ Products</b> tab (single add or bulk upload).<br>
      5. Copy templates from the bottom card for WhatsApp marketing.</p></div>`;
}

function renderFilters(){
  const counts = { all: Store.orders.length, placed: 0, confirmed: 0, shipped: 0, delivered: 0 };
  Store.orders.forEach(o => { const s = o.status || 'placed'; if (counts[s] !== undefined) counts[s]++; });
  const defs = [
    ['all', '📦 All (' + counts.all + ')'], ['placed', '🆕 New (' + counts.placed + ')'],
    ['confirmed', '✅ Confirmed (' + counts.confirmed + ')'], ['shipped', '🚚 Shipped (' + counts.shipped + ')'],
    ['delivered', '✔ Delivered (' + counts.delivered + ')'],
  ];
  let html = '<div class="filter-chips">' + defs.map(([k, l]) =>
    `<button class="filter-chip ${orderFilter === k ? 'on' : ''}" data-of="${k}">${l}</button>`).join('') + '</div>';
  html += '<div id="orderList" style="margin-top:10px"></div>';
  document.getElementById('tabBody').innerHTML = html;
  document.querySelectorAll('[data-of]').forEach(b => b.addEventListener('click', () => {
    orderFilter = b.dataset.of;
    document.querySelectorAll('[data-of]').forEach(x => x.classList.toggle('on', x === b));
    renderOrdersList();
  }));
  return true;
}

function renderOrdersList(){
  const list = orderFilter === 'all' ? Store.orders : Store.orders.filter(o => (o.status || 'placed') === orderFilter);
  const wrap = document.getElementById('orderList');
  if (!wrap) return;
  if (!list.length){
    wrap.innerHTML = '<div class="empty"><div class="e-ic">📭</div><b>No orders here yet</b>Orders placed on the website appear automatically.</div>';
    return;
  }
  wrap.innerHTML = list.map(o => orderCardHTML(o)).join('');
}
function orderCardHTML(o){
  const st = o.status || 'placed';
  const items = (o.items || []).map(i => esc(i.name) + ' ×' + i.qty).join(', ');
  const c = o.customer || {};
  const t = o.totals || {};
  const eta = t.eta || 'Dispatch 24–48h';
  return `<div class="order-card">
    <div class="oc-top"><b>#${o.id}</b><span class="status-pill status-${st}">${esc(st.replace(/_/g, ' '))}</span></div>
    <div class="oc-items">${fmtDate(o.date || o.createdAt)} • <b>${esc(c.name || '')}</b> • ${esc(c.phone || '')}<br>
      ${esc(c.address || '')}, ${esc(c.pincode || '')}<br>${items} • <b>${money(t.grand || 0)}</b> (${(o.payment || '').toUpperCase()}${o.payment === 'cod' ? ' +₹' + CONFIG.codFee : ''})<br>
      ⏱ ${esc(eta)}${o.dispatchedAt ? '<br>📦 Dispatched: <b>' + fmtDate(o.dispatchedAt) + '</b>' : ''}${o.deliverBy ? ' • ETA: <b>' + fmtDate(o.deliverBy) + '</b>' : ''}</div>
    <select data-status="${o.id}" aria-label="Update status">
      <option value="placed" ${st === 'placed' ? 'selected' : ''}>Placed</option>
      <option value="confirmed" ${st === 'confirmed' ? 'selected' : ''}>Confirmed</option>
      <option value="shipped" ${st === 'shipped' ? 'selected' : ''}>Shipped</option>
      <option value="delivered" ${st === 'delivered' ? 'selected' : ''}>Delivered</option>
    </select>
    <div class="oc-btns">
      <a class="btn btn-wa btn-sm" href="${waLink(TPL_CONFIRM(o), c.phone)}" target="_blank" rel="noopener">💬 Send Confirmation</a>
      <a class="btn btn-outline btn-sm" href="${waLink(TPL_DELIVERY(o), c.phone)}" target="_blank" rel="noopener">🚚 Send Delivery Reminder</a>
      <button class="btn btn-ghost btn-sm" data-copy="${esc(TPL_DELIVERY(o))}">📋 Copy Delivery Text</button>
    </div>
  </div>`;
}

function updateStatus(id, status){
  const o = Store.orders.find(x => x.id === id); if (!o) return;
  o.status = status;
  if (status === 'shipped') dispatchOrder(o);
  if (status === 'delivered') o.deliveredAt = o.deliveredAt || new Date().toISOString();
  Store.saveOrders();
  const extra = status === 'shipped' ? { dispatchedAt: o.dispatchedAt, deliverBy: o.deliverBy } : (status === 'delivered' ? { deliveredAt: o.deliveredAt } : {});
  const push = (attempt) => {
    Firestore.updateStatus(id, status, extra).then(ok => {
      toast(ok ? '✅ ' + id + ' → ' + status + ' (Firestore)' : '⚠️ Saved locally — Firestore sync failed');
      if (!ok && attempt < 2) setTimeout(() => push(attempt + 1), 2500);
    });
  };
  push(0);
  renderStats(); renderFilters(); renderOrdersList();
}

/* ============================ PRODUCTS (add / bulk) ============================ */
function renderProductsTable(){
  document.getElementById('tabBody').innerHTML = `
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
      <button class="btn btn-maroon btn-sm" id="btnAddProd" style="flex:1;min-width:130px">➕ Add Product</button>
      <button class="btn btn-outline btn-sm" id="btnBulk" style="flex:1;min-width:130px">📥 Bulk Upload</button>
      <button class="btn btn-outline btn-sm" id="btnSyncCloud" style="flex:1;min-width:130px">☁️ Sync to Firestore</button>
    </div>
    <p class="small muted" id="cloudStatus" style="margin:0 0 10px"></p>
    <div class="bulk-panel" id="bulkPanel" style="display:none;background:#fff;border:1.5px dashed #d8b24e;border-radius:var(--r);padding:14px;margin-bottom:12px">
      <h3 style="font-size:.95rem;margin-bottom:6px">📥 Bulk Upload Products</h3>
      <p class="small muted" style="margin:6px 0">One per line: <b>Name, Price, MRP, Category, Image URL, Badge</b><br>
      Categories: ${CATEGORIES.map(c => c.slug).join(', ')} • Badge: Bestseller / New / Sale / blank</p>
      <textarea id="bulkText" placeholder="Soft Silk Saree — Rose Pink, 1499, 2299, soft-silk, images/products/soft-silk.jpg, New&#10;Handloom Cotton Saree, 749, 1199, cotton, images/products/handloom-cotton.jpg, Bestseller" style="width:100%;border:1.5px solid var(--line);border-radius:11px;padding:10px;min-height:100px;font-size:.8rem;background:#fff;outline:none;font-family:inherit"></textarea>
      <button class="btn btn-maroon btn-sm" id="btnImport" style="margin-top:10px">📥 Import Products</button>
      <p class="small" id="bulkResult" style="margin-top:8px"></p>
    </div>
    <div class="prod-table-wrap">
      <table class="prod-table">
        <thead><tr><th>Photo</th><th>Product</th><th>Price</th><th>MRP</th><th>Stock</th><th>Badge</th><th>Actions</th></tr></thead>
        <tbody id="prodBody"></tbody>
      </table>
    </div>
    <p class="small muted" style="margin-top:10px">Low stock (≤5) highlighted in red. ${PRODUCTS.length} products total.</p>`;
  renderProdBody();
  document.getElementById('btnAddProd').addEventListener('click', openAddProduct);
  document.getElementById('btnBulk').addEventListener('click', () => { document.getElementById('bulkPanel').style.display = document.getElementById('bulkPanel').style.display === 'none' ? 'block' : 'none'; });
  document.getElementById('btnImport').addEventListener('click', importBulk);
  document.getElementById('btnSyncCloud').addEventListener('click', () => {
    const b = document.getElementById('btnSyncCloud'); b.textContent = '☁️ Syncing…';
    ProductCloud.saveAll().then(res => {
      b.textContent = '☁️ Sync to Firestore';
      document.getElementById('cloudStatus').textContent = res.ok
        ? '✅ ' + res.count + ' products synced to Firestore — store pages load them automatically.'
        : '⚠️ Sync failed (' + (res.reason || 'Firestore off') + '). Check config & rules.';
      toast(res.ok ? '☁️ Products synced' : '⚠️ Sync failed');
    });
  });
}
function renderProdBody(){
  document.getElementById('prodBody').innerHTML = PRODUCTS.map(p => `
    <tr>
      <td><img src="${p.img}" alt="" loading="lazy"></td>
      <td style="min-width:180px"><b>${esc(p.name)}</b><br><small class="muted">SKU: ${esc(p.sku || p.id)}</small></td>
      <td>${money(p.price)}</td>
      <td>${p.mrp ? '<s class="muted">' + money(p.mrp) + '</s>' : ''}</td>
      <td class="${p.stock <= 5 ? 'low' : ''}">${p.stock <= 5 ? '🔥 Low: ' + p.stock : p.stock}</td>
      <td>${p.badge ? esc(p.badge) : '—'}</td>
      <td><button class="btn btn-ghost btn-sm" style="border:1.5px solid var(--line)" data-delprod="${p.id}">✕</button></td>
    </tr>`).join('');
}
function openAddProduct(){
  const catOpts = CATEGORIES.map(c => `<option value="${c.slug}">${c.name}</option>`).join('');
  openModal(`
    <h2 style="font-size:1.1rem;font-weight:800;margin-bottom:10px">➕ Add New Product</h2>
    <div class="field"><label>Product Name *</label><input id="apName" placeholder="Soft Silk Saree — Rose Pink"></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div class="field"><label>Price (₹) *</label><input id="apPrice" type="number" inputmode="numeric"></div>
      <div class="field"><label>MRP (₹)</label><input id="apMrp" type="number" inputmode="numeric"></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div class="field"><label>Category *</label><select id="apCat">${catOpts}</select></div>
      <div class="field"><label>Badge</label><select id="apBadge"><option value="">—</option><option>Bestseller</option><option>New</option><option>Sale</option><option>Limited Stock</option></select></div>
    </div>
    <div class="field"><label>Image URL / Path</label><input id="apImg" placeholder="images/products/….jpg or https://…"></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div class="field"><label>Fabric</label><input id="apFabric" placeholder="Silk"></div>
      <div class="field"><label>Colour</label><input id="apColor" placeholder="Red / Maroon"></div>
    </div>
    <div class="field"><label>Description</label><textarea id="apDesc" rows="2" placeholder="Short description…" style="width:100%;border:1.5px solid var(--line);border-radius:11px;padding:10px;font-size:.86rem;outline:none;font-family:inherit"></textarea></div>
    <div class="field"><label>Stock</label><input id="apStock" type="number" value="10" inputmode="numeric"></div>
    <button class="btn btn-maroon" id="apSave">💾 Add Product</button>`);
  document.getElementById('apSave').addEventListener('click', () => {
    const name = document.getElementById('apName').value.trim();
    const price = +document.getElementById('apPrice').value;
    if (!name || !(price > 0)){ toast('⚠️ Name and Price are required'); return; }
    const np = normalizeProduct({
      name, price, mrp: document.getElementById('apMrp').value,
      cat: document.getElementById('apCat').value, badge: document.getElementById('apBadge').value,
      img: document.getElementById('apImg').value, fabric: document.getElementById('apFabric').value,
      color: document.getElementById('apColor').value, desc: document.getElementById('apDesc').value,
      stock: +document.getElementById('apStock').value || 10,
    });
    PRODUCTS.unshift(np); saveProducts(PRODUCTS);
    closeModal(); renderProdBody(); toast('✅ Product added — visible in store instantly');
  });
}
function importBulk(){
  const lines = document.getElementById('bulkText').value.trim().split(/\r?\n/).filter(l => l.trim());
  let added = 0, errors = [];
  lines.forEach((line, i) => {
    line = line.trim();
    if (line.startsWith('{') || line.startsWith('[')){
      try{ const obj = JSON.parse(line); if (Array.isArray(obj)) obj.forEach(p => { PRODUCTS.unshift(normalizeProduct(p)); added++; }); else { PRODUCTS.unshift(normalizeProduct(obj)); added++; } return; }
      catch(e){ errors.push('Line ' + (i+1) + ': invalid JSON'); return; }
    }
    const parts = line.includes('\t') ? line.split('\t') : line.split(',').map(x => x.trim());
    if (parts.length < 3){ errors.push('Line ' + (i+1) + ': need name, price, category'); return; }
    PRODUCTS.unshift(normalizeProduct({ name: parts[0], price: parts[1], mrp: parts[2], cat: parts[3], img: parts[4], badge: parts[5] }));
    added++;
  });
  if (added){ saveProducts(PRODUCTS); renderProdBody(); }
  document.getElementById('bulkResult').innerHTML = added
    ? '✅ Imported <b>' + added + '</b> products' + (errors.length ? ' • ⚠️ ' + errors.join('; ') : '')
    : '⚠️ No products imported.' + (errors.length ? ' ' + errors.join('; ') : '');
  if (added) toast('📥 ' + added + ' products imported');
}

/* ---------- events ---------- */
document.addEventListener('change', e => {
  if (e.target.dataset.status) updateStatus(e.target.dataset.status, e.target.value);
});
document.addEventListener('click', e => {
  const t = e.target.closest('[data-copy],[data-delprod]');
  if (!t) return;
  if (t.dataset.copy !== undefined){ copyText(t.dataset.copy); }
  else if (t.dataset.delprod !== undefined){
    const id = t.dataset.delprod;
    if (!confirm('Delete this product?')) return;
    PRODUCTS = PRODUCTS.filter(p => p.id !== id);
    saveProducts(PRODUCTS); renderProdBody(); toast('🗑️ Product deleted');
  }
});
