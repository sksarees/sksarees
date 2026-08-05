/* ============================================================================
   SK SAREES — admin.js (FRESH CLEAN REWRITE)
   PIN login · Orders (local + Firestore) · Products (add/bulk) ·
   Reviews (delete) · Dashboard
   ========================================================================== */
'use strict';
const ADMIN_PIN = '1600'; /* 👉 change before going live */

function adminInit(){
  try{ injectChrome(); }catch(e){}
  try{ renderCartBadge(); }catch(e){}
  try{ Store.orders.forEach(dispatchOrder); Store.saveOrders(); }catch(e){}
  try{ Sync.run(); }catch(e){}
  if (String(LS.get('sk_admin', '0')) === '1'){
    renderAdmin();
    /* ensure Firestore collections exist (admins, cart, categories, ...) */
    try{ seedFirestoreCollections(); }catch(e){}
  } else {
    renderLogin();
  }
}
document.addEventListener('DOMContentLoaded', adminInit);

function renderLogin(){
  const app = document.getElementById('adminApp'); if (!app) return;
  app.innerHTML = '<div style="max-width:360px;margin:40px auto;text-align:center">' +
    '<div style="font-size:3rem">🔐</div>' +
    '<h1 style="margin-top:10px">Store Admin</h1>' +
    '<p class="muted small">Enter the admin PIN to manage orders, products &amp; reviews.</p>' +
    '<input id="pin" type="password" inputmode="numeric" placeholder="Admin PIN" style="width:100%;border:1.5px solid var(--line);border-radius:12px;padding:14px;text-align:center;font-size:1.2rem;letter-spacing:8px;background:#fff;outline:none;margin-top:18px">' +
    '<button type="button" class="btn btn-maroon" id="pinBtn" style="margin-top:12px">Login</button></div>';
  const go = () => {
    if (document.getElementById('pin').value === ADMIN_PIN){
      LS.set('sk_admin', '1'); renderAdmin();
    } else toast('❌ Wrong PIN');
  };
  document.getElementById('pinBtn').addEventListener('click', go);
  document.getElementById('pin').addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
}

let adminTab = 'orders';
let orderFilter = 'all';
let orderPage = 1;
const ORDER_PAGE_SIZE = 10;
let prodSearch = '';         /* Products tab: search query */
let prodPage = 1;            /* Products tab: pagination */
const PROD_PAGE_SIZE = 10;
let revPage = 1;             /* Reviews tab: pagination */
const REV_PAGE_SIZE = 10;

function renderAdmin(){
  const app = document.getElementById('adminApp'); if (!app) return;
  app.innerHTML =
    '<div class="admin-top"><h1>🛠️ SK Sarees — Admin</h1>' +
    '<span class="sync-pill online" id="cloudPill">💾 Saved on device</span></div>' +
    '<div class="admin-tabs">' +
      '<button type="button" class="admin-tab on" id="tabOrders">📋 Orders</button>' +
      '<button type="button" class="admin-tab" id="tabProducts">🛍️ Products</button>' +
      '<button type="button" class="admin-tab" id="tabReviews">⭐ Reviews</button>' +
      '<button type="button" class="admin-tab" id="tabDashboard">📊 Dashboard</button>' +
    '</div>' +
    '<div id="tabBody"></div>' +
    '<div class="tpl-card"><h3>🤖 WhatsApp Templates</h3>' +
      '<p>Tap to copy — then paste in WhatsApp.</p>' +
      '<div style="display:grid;gap:8px;grid-template-columns:repeat(auto-fit,minmax(200px,1fr))">' +
        '<button type="button" class="btn btn-outline btn-sm" data-copy="🎉 Thank you for your order! Your saree will be dispatched shortly and you will receive tracking updates on WhatsApp. 💐">📋 Order Confirmation</button>' +
        '<button type="button" class="btn btn-outline btn-sm" data-copy="🚚 Your beautiful Saree is out for delivery! Track your order here. Thank you for shopping with us. 🪡">📋 Delivery Reminder</button>' +
      '</div></div>' +
    '<button type="button" class="btn btn-ghost btn-sm" id="logoutBtn" style="margin-top:14px;width:auto;border:1.5px solid var(--line)">Logout</button>';
  document.getElementById('tabOrders').addEventListener('click', () => switchTab('orders'));
  document.getElementById('tabProducts').addEventListener('click', () => switchTab('products'));
  document.getElementById('tabReviews').addEventListener('click', () => switchTab('reviews'));
  document.getElementById('tabDashboard').addEventListener('click', () => switchTab('dashboard'));
  document.getElementById('logoutBtn').addEventListener('click', () => { LS.set('sk_admin', '0'); location.reload(); });
  /* Firestore: quiet status + live orders/reviews */
  if (FS.enabled()){
    const pill = document.getElementById('cloudPill');
    FS.onStatus = (st) => {
      if (pill) pill.textContent = st === 'on' ? '🟢 Cloud sync on' : '💾 Saved on device';
    };
    FS.listenOrders(list => {
      if (!list || !list.length) return;
      const localMap = {}; Store.orders.forEach(o => localMap[o.id] = o);
      Store.orders = list.map(f => Object.assign({}, f, localMap[f.id] || {}))
        .concat(Store.orders.filter(o => !list.some(x => x.id === o.id)));
      Store.orders.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      Store.saveOrders();
      if (adminTab === 'orders'){ renderFilters(); renderOrderList(); }
    });
    FS.listenReviews(list => { fsReviews = list || []; if (adminTab === 'reviews') renderReviews(); });
    FS._getDb().catch(() => {});
  }
  const seedBtn = document.getElementById('seedDb');
  if (seedBtn) seedBtn.addEventListener('click', () => {
    seedFirestoreCollections();
    document.getElementById('seedMsg').innerHTML = '<b style="color:var(--green)">✅ Database synced — collections created/updated.</b>';
    toast('🗄️ Firestore collections synced');
  });
  switchTab('orders');
}

function switchTab(t){
  adminTab = t;
  ['tabOrders','tabProducts','tabReviews','tabDashboard'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('on', id === 'tab' + t[0].toUpperCase() + t.slice(1));
  });
  const body = document.getElementById('tabBody'); if (!body) return;
  try{
    if (t === 'orders'){ renderFilters(); renderOrderList(); }
    else if (t === 'products') renderProducts();
    else if (t === 'reviews') renderReviews();
    else if (t === 'dashboard') renderDashboard();
  }catch(e){ body.innerHTML = '<div class="empty"><div class="e-ic">⚠️</div><b>Could not load</b></div>'; }
}

function renderDashboard(){
  const o = Store.orders;
  const sales = o.reduce((s, x) => s + ((x.totals || {}).grand || 0), 0);
  document.getElementById('tabBody').innerHTML =
    '<div class="stat-row">' +
      '<div class="stat-chip"><b>' + o.length + '</b><small>Total</small></div>' +
      '<div class="stat-chip"><b>' + o.filter(x => (x.status || 'placed') === 'placed').length + '</b><small>New</small></div>' +
      '<div class="stat-chip"><b>' + o.filter(x => (x.status || 'placed') === 'confirmed').length + '</b><small>Confirmed</small></div>' +
      '<div class="stat-chip"><b>' + o.filter(x => (x.status || 'placed') === 'shipped').length + '</b><small>Shipped</small></div>' +
      '<div class="stat-chip"><b>' + o.filter(x => (x.status || 'placed') === 'delivered').length + '</b><small>Delivered</small></div>' +
      '<div class="stat-chip"><b>₹' + sales.toLocaleString('en-IN') + '</b><small>Sales</small></div>' +
    '</div>' +
    '<div class="form-card" style="margin-top:14px"><h3>🗄️ Firestore Collections</h3>' +
      '<p class="small muted">Collections in your project: <b>admins • cart • categories • customers • inventory • orders • products • promos • reviews • settings</b></p>' +
      '<button type="button" class="btn btn-outline btn-sm" id="seedDb" style="width:auto;min-width:200px;margin-top:8px">🛠️ Setup / Sync Database</button>' +
      '<p class="small" id="seedMsg" style="margin-top:6px"></p></div>' +
    '<div class="form-card" style="margin-top:14px"><h3>ℹ️ How to run the store</h3>' +
      '<p class="small muted">1. Orders placed on this device appear here instantly (local + Firestore sync).<br>' +
      '2. Update status → WhatsApp the customer confirmation / delivery reminder.<br>' +
      '3. When shipped, dispatch date + ETA (7 days) auto-capture; auto-Delivered after ETA.<br>' +
      '4. Manage products (add / bulk) and moderate reviews.</p></div>';
}

function renderFilters(){
  const counts = { all: Store.orders.length, placed: 0, confirmed: 0, shipped: 0, delivered: 0 };
  Store.orders.forEach(o => { const s = o.status || 'placed'; if (counts[s] !== undefined) counts[s]++; });
  const defs = [
    ['all', '📦 All (' + counts.all + ')'], ['placed', '🆕 New (' + counts.placed + ')'],
    ['confirmed', '✅ Confirmed (' + counts.confirmed + ')'], ['shipped', '🚚 Shipped (' + counts.shipped + ')'],
    ['delivered', '✔ Delivered (' + counts.delivered + ')'],
  ];
  document.getElementById('tabBody').innerHTML =
    '<div class="filter-chips">' + defs.map(([k, l]) =>
      '<button type="button" class="filter-chip ' + (orderFilter === k ? 'on' : '') + '" data-of="' + k + '">' + l + '</button>').join('') + '</div>' +
    '<div id="orderList" style="margin-top:10px"></div>' +
    '<div style="text-align:center;margin-top:10px"><button type="button" class="btn btn-outline" id="moreOrders" style="width:auto;min-width:200px">Load More Orders ↓</button></div>';
  document.querySelectorAll('[data-of]').forEach(b => b.addEventListener('click', () => {
    orderFilter = b.dataset.of; orderPage = 1;
    document.querySelectorAll('[data-of]').forEach(x => x.classList.toggle('on', x === b));
    renderOrderList();
  }));
}

function renderOrderList(){
  const wrap = document.getElementById('orderList'); if (!wrap) return;
  const list = orderFilter === 'all' ? Store.orders : Store.orders.filter(o => (o.status || 'placed') === orderFilter);
  if (!list.length){
    wrap.innerHTML = '<div class="empty"><div class="e-ic">📭</div><b>No orders here yet</b></div>';
    return;
  }
  const visible = list.slice(0, orderPage * ORDER_PAGE_SIZE);
  wrap.innerHTML = visible.map(o => orderCard(o)).join('');
  const mo = document.getElementById('moreOrders');
  if (mo){
    const hasMore = orderPage * ORDER_PAGE_SIZE < list.length;
    mo.style.display = hasMore ? 'inline-flex' : 'none';
    mo.onclick = () => { orderPage++; renderOrderList(); };
  }
}
function orderCard(o){
  const st = o.status || 'placed';
  const items = (o.items || []).map(i => esc(i.name) + ' ×' + i.qty).join(', ');
  const c = o.customer || {}; const t = o.totals || {};
  return '<div class="order-card">' +
    '<div class="oc-top"><b>#' + o.id + '</b><span class="status-pill status-' + st + '">' + esc(st.replace(/_/g, ' ')) + '</span></div>' +
    '<div class="oc-items">' + fmtDate(o.date || o.createdAt) + ' • <b>' + esc(c.name || '') + '</b> • ' + esc(c.phone || '') + '<br>' +
      esc(c.address || '') + ', ' + esc(c.pincode || '') + '<br>' + items + ' • <b>' + money(t.grand || 0) + '</b> (' + (o.payment || '').toUpperCase() + ')</div>' +
    '<select data-status="' + o.id + '">' +
      '<option value="placed"' + (st === 'placed' ? ' selected' : '') + '>Placed</option>' +
      '<option value="confirmed"' + (st === 'confirmed' ? ' selected' : '') + '>Confirmed</option>' +
      '<option value="shipped"' + (st === 'shipped' ? ' selected' : '') + '>Shipped</option>' +
      '<option value="delivered"' + (st === 'delivered' ? ' selected' : '') + '>Delivered</option>' +
    '</select>' +
    '<div class="oc-btns">' +
      '<a class="btn btn-wa btn-sm" href="' + waLink(TPL_CONFIRM(o), c.phone) + '" target="_blank" rel="noopener">💬 Send Confirmation</a>' +
      '<a class="btn btn-outline btn-sm" href="' + waLink(TPL_DELIVERY(o), c.phone) + '" target="_blank" rel="noopener">🚚 Send Delivery Reminder</a>' +
    '</div></div>';
}

function updateStatus(id, status){
  const o = Store.orders.find(x => x.id === id); if (!o) return;
  o.status = status;
  if (status === 'shipped') dispatchOrder(o);
  if (status === 'delivered') o.deliveredAt = o.deliveredAt || new Date().toISOString();
  Store.saveOrders();
  if (FS.enabled()) FS.updateStatus(id, status, status === 'shipped' ? { dispatchedAt: o.dispatchedAt, deliverBy: o.deliverBy } : (status === 'delivered' ? { deliveredAt: o.deliveredAt } : {})).catch(() => {});
  toast('✅ ' + id + ' → ' + status);
  orderPage = 1;
  renderFilters(); renderOrderList();
}

/* ============================ PRODUCTS ============================ */
function renderProducts(){
  document.getElementById('tabBody').innerHTML =
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">' +
      '<button type="button" class="btn btn-maroon btn-sm" id="btnAddProd" style="flex:1;min-width:130px">➕ Add Product</button>' +
      '<button type="button" class="btn btn-outline btn-sm" id="btnBulk" style="flex:1;min-width:130px">📥 Bulk Upload</button>' +
    '</div>' +
    '<input id="prodSearch" type="search" placeholder="🔍 Search products — name, SKU, category, colour…" autocomplete="off" value="' + esc(prodSearch) + '" style="width:100%;border:1.5px solid var(--line);border-radius:11px;padding:11px 13px;background:#fff;outline:none;margin-bottom:10px;font-size:15px">' +
    '<div class="bulk-panel" id="bulkPanel" style="display:none;background:#fff;border:1.5px dashed #d8b24e;border-radius:var(--r);padding:14px;margin-bottom:12px">' +
      '<h3 style="font-size:.95rem;margin-bottom:6px">📥 Bulk Upload Products</h3>' +
      '<p class="small muted" style="margin:6px 0">One per line: <b>Name, Price, MRP, Category, Image URL, Badge</b></p>' +
      '<textarea id="bulkText" placeholder="Soft Silk Saree, 1499, 2299, soft-silk, https://…, New" style="width:100%;border:1.5px solid var(--line);border-radius:11px;padding:10px;min-height:90px;font-size:.8rem;background:#fff;outline:none;font-family:inherit"></textarea>' +
      '<button type="button" class="btn btn-maroon btn-sm" id="btnImport" style="margin-top:10px">📥 Import</button>' +
      '<p class="small" id="bulkResult" style="margin-top:8px"></p></div>' +
    '<div class="prod-table-wrap"><table class="prod-table"><thead><tr><th>Photo</th><th>Product</th><th>Price</th><th>Stock</th><th>Badge</th><th></th></tr></thead><tbody id="prodBody"></tbody></table></div>' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;gap:8px;flex-wrap:wrap">' +
      '<p class="small muted" id="prodCount" style="margin:0"></p>' +
      '<button type="button" class="btn btn-outline btn-sm" id="moreProds" style="display:none">Load More Products ↓</button>' +
    '</div>';
  renderProdBody();
  document.getElementById('btnAddProd').addEventListener('click', openAddProduct);
  document.getElementById('btnBulk').addEventListener('click', () => { document.getElementById('bulkPanel').style.display = document.getElementById('bulkPanel').style.display === 'none' ? 'block' : 'none'; });
  document.getElementById('btnImport').addEventListener('click', importBulk);
  document.getElementById('prodSearch').addEventListener('input', e => { prodSearch = e.target.value; prodPage = 1; renderProdBody(); });
}
/* filter by the search box (name, SKU, category, colour) */
function filteredProds(){
  if (!prodSearch) return PRODUCTS;
  const q = prodSearch.toLowerCase();
  return PRODUCTS.filter(p => String(p.name + ' ' + (p.sku || '') + ' ' + p.cat + ' ' + (p.color || '')).toLowerCase().includes(q));
}
/* show FIRST 10 products, "Load More" → next 10 */
function renderProdBody(){
  const tbody = document.getElementById('prodBody'); if (!tbody) return;
  const list = filteredProds();
  const visible = list.slice(0, prodPage * PROD_PAGE_SIZE);
  tbody.innerHTML = visible.map(p =>
    '<tr><td><img src="' + esc(p.img) + '" alt="" loading="lazy"></td>' +
    '<td style="min-width:180px"><b>' + esc(p.name) + '</b><br><small class="muted">SKU: ' + esc(p.sku || p.id) + '</small></td>' +
    '<td>' + money(p.price) + '</td>' +
    '<td class="' + (p.stock <= 5 ? 'low' : '') + '">' + (p.stock <= 5 ? '🔥 ' + p.stock : p.stock) + '</td>' +
    '<td>' + (p.badge ? esc(p.badge) : '—') + '</td>' +
    '<td><div style="display:flex;gap:6px"><button type="button" class="btn btn-outline btn-sm" data-editprod="' + p.id + '">✏️ Edit</button>' +
    '<button type="button" class="btn btn-ghost btn-sm" data-delprod="' + p.id + '">✕</button></div></td></tr>').join('');
  const mo = document.getElementById('moreProds');
  if (mo){
    const hasMore = prodPage * PROD_PAGE_SIZE < list.length;
    mo.style.display = hasMore ? 'inline-flex' : 'none';
    mo.onclick = () => { prodPage++; renderProdBody(); };
  }
  const cl = document.getElementById('prodCount');
  if (cl) cl.textContent = list.length + ' product' + (list.length === 1 ? '' : 's') + (prodSearch ? ' • filtered' : '') + ' • showing ' + visible.length;
}
function openAddProduct(){
  const catOpts = CATEGORIES.map(c => '<option value="' + c.slug + '">' + c.name + '</option>').join('');
  openModal('<h2 style="font-size:1.1rem;font-weight:800;margin-bottom:10px">➕ Add New Product</h2>' +
    '<div class="field"><label>Product Name *</label><input id="apName"></div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' +
      '<div class="field"><label>Price (₹) *</label><input id="apPrice" type="number"></div>' +
      '<div class="field"><label>MRP (₹)</label><input id="apMrp" type="number"></div></div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' +
      '<div class="field"><label>Category *</label><select id="apCat">' + catOpts + '</select></div>' +
      '<div class="field"><label>Badge</label><select id="apBadge"><option value="">—</option><option>Bestseller</option><option>New</option><option>Sale</option><option>Limited Stock</option></select></div></div>' +
    '<div class="field"><label>Image URL</label><input id="apImg" placeholder="https://…"></div>' +
    '<div class="field"><label>Stock</label><input id="apStock" type="number" value="10"></div>' +
    '<button type="button" class="btn btn-maroon" id="apSave">💾 Add Product</button>');
  document.getElementById('apSave').addEventListener('click', () => {
    const name = document.getElementById('apName').value.trim();
    const price = +document.getElementById('apPrice').value;
    if (!name || !(price > 0)){ toast('⚠️ Name and Price required'); return; }
    const np = normalizeProduct({
      name, price, mrp: document.getElementById('apMrp').value,
      cat: document.getElementById('apCat').value, badge: document.getElementById('apBadge').value,
      img: document.getElementById('apImg').value, stock: +document.getElementById('apStock').value || 10,
    });
    PRODUCTS.unshift(np); saveProducts(PRODUCTS);
    closeModal(); prodPage = 1; renderProdBody(); toast('✅ Product added');
  });
}
function importBulk(){
  const lines = document.getElementById('bulkText').value.trim().split(/\r?\n/).filter(l => l.trim());
  let added = 0, errors = [];
  lines.forEach((line, i) => {
    const parts = line.includes('\t') ? line.split('\t') : line.split(',').map(x => x.trim());
    if (parts.length < 3){ errors.push('Line ' + (i + 1)); return; }
    PRODUCTS.unshift(normalizeProduct({ name: parts[0], price: parts[1], mrp: parts[2], cat: parts[3], img: parts[4], badge: parts[5] }));
    added++;
  });
  if (added){ saveProducts(PRODUCTS); prodPage = 1; renderProdBody(); }
  document.getElementById('bulkResult').innerHTML = added ? '✅ Imported ' + added + (errors.length ? ' • ⚠️ ' + errors.join('; ') : '') : '⚠️ Nothing imported' + (errors.length ? ': ' + errors.join('; ') : '');
  if (added) toast('📥 ' + added + ' imported');
}

function openEditProduct(id){
  const p = byId(id); if (!p) return;
  const catOpts = CATEGORIES.map(c => '<option value="' + c.slug + '"' + (p.cat === c.slug ? ' selected' : '') + '>' + c.name + '</option>').join('');
  openModal('<h2 style="font-size:1.1rem;font-weight:800;margin-bottom:10px">✏️ Edit Product</h2>' +
    '<div class="field"><label>Product Name</label><input id="epName" value="' + esc(p.name) + '"></div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' +
      '<div class="field"><label>Price (₹)</label><input id="epPrice" type="number" value="' + p.price + '"></div>' +
      '<div class="field"><label>MRP (₹)</label><input id="epMrp" type="number" value="' + (p.mrp || '') + '"></div></div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' +
      '<div class="field"><label>Category</label><select id="epCat">' + catOpts + '</select></div>' +
      '<div class="field"><label>Stock</label><input id="epStock" type="number" value="' + p.stock + '"></div></div>' +
    '<div class="field"><label>Badge</label><select id="epBadge"><option value=""' + (!p.badge ? ' selected' : '') + '>—</option><option' + (p.badge === 'Bestseller' ? ' selected' : '') + '>Bestseller</option><option' + (p.badge === 'New' ? ' selected' : '') + '>New</option><option' + (p.badge === 'Sale' ? ' selected' : '') + '>Sale</option><option' + (p.badge === 'Limited Stock' ? ' selected' : '') + '>Limited Stock</option></select></div>' +
    '<div class="field"><label>Image URL</label><input id="epImg" value="' + esc(p.img) + '"></div>' +
    '<button type="button" class="btn btn-maroon" id="epSave">💾 Save Changes</button>');
  document.getElementById('epSave').addEventListener('click', () => {
    const name = document.getElementById('epName').value.trim();
    const price = +document.getElementById('epPrice').value;
    if (!name || !(price > 0)){ toast('⚠️ Name and Price required'); return; }
    const idx = PRODUCTS.findIndex(x => x.id === id);
    if (idx >= 0){
      PRODUCTS[idx] = Object.assign({}, PRODUCTS[idx], {
        name, price,
        mrp: Math.max(price, +document.getElementById('epMrp').value || price),
        cat: document.getElementById('epCat').value,
        stock: Math.max(0, +document.getElementById('epStock').value || 0),
        badge: document.getElementById('epBadge').value,
        img: document.getElementById('epImg').value || PRODUCTS[idx].img,
      });
      saveProducts(PRODUCTS);
      closeModal(); renderProdBody(); toast('✅ Product updated');
    }
  });
}

/* ============================ REVIEWS ============================ */
let fsReviews = [];
function renderReviews(){
  const list = [];
  try{
    Object.keys(localStorage).filter(k => k.startsWith('sk_reviews_')).forEach(key => {
      const pid = key.replace('sk_reviews_', '');
      let arr = [];
      try{ arr = JSON.parse(localStorage.getItem(key) || '[]'); }catch(e){}
      arr.forEach((r, idx) => list.push({ pid, pname: (byId(pid) || {}).name || pid, idx, fromFS: false, name: r.name, rating: r.rating, text: r.text, date: r.date }));
    });
  }catch(e){}
  (fsReviews || []).forEach(r => list.push({ pid: r.productId, pname: (byId(r.productId) || {}).name || r.productId, fromFS: true, rid: r.rid, name: r.name, rating: r.rating, text: r.text, date: r.createdAt ? new Date(r.createdAt).getTime() : Date.now() }));
  list.sort((a, b) => (b.date || 0) - (a.date || 0));
  document.getElementById('tabBody').innerHTML =
    '<div class="form-card" style="margin-bottom:12px"><h3>⭐ Customer Reviews</h3>' +
    '<p class="small muted">' + list.length + ' reviews (local + Firestore). Delete spam here.</p></div>' +
    '<div id="reviewList"></div>' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;gap:8px;flex-wrap:wrap">' +
      '<p class="small muted" id="revCount" style="margin:0"></p>' +
      '<button type="button" class="btn btn-outline btn-sm" id="moreRevs" style="display:none">See More Reviews ↓</button>' +
    '</div>';
  const wrap = document.getElementById('reviewList');
  if (!list.length){ wrap.innerHTML = '<div class="empty"><div class="e-ic">⭐</div><b>No reviews yet</b></div>'; return; }
  /* show FIRST 10 reviews, "See More" → next 10 */
  const visible = list.slice(0, revPage * REV_PAGE_SIZE);
  wrap.innerHTML = visible.map(r =>
    '<div class="rev-admin-row" style="display:flex;gap:10px;align-items:flex-start;background:#fff;border:1px solid var(--line);border-radius:12px;padding:10px;margin-bottom:8px">' +
    '<span class="avatar" style="background:#8f1d3a;flex:0 0 auto;width:34px;height:34px;font-size:.8rem">' + esc((r.name || 'A')[0]) + '</span>' +
    '<div style="flex:1;min-width:0"><b style="font-size:.85rem">' + esc(r.name) + '</b> <span class="stars" style="display:inline">' + '★'.repeat(r.rating || 5) + '☆'.repeat(5 - (r.rating || 5)) + '</span>' +
    '<small class="muted" style="display:block">on ' + esc(r.pname) + '</small>' +
    '<p style="font-size:.82rem;margin-top:3px;color:#4a3f38">' + esc(r.text) + '</p></div>' +
    '<button type="button" class="btn btn-ghost btn-sm" data-delreview="' + (r.fromFS ? 'fs::' + r.rid : 'local::' + r.pid + '::' + r.idx) + '">🗑️</button></div>').join('');
  const mo = document.getElementById('moreRevs');
  if (mo){
    const hasMore = revPage * REV_PAGE_SIZE < list.length;
    mo.style.display = hasMore ? 'inline-flex' : 'none';
    mo.onclick = () => { revPage++; renderReviews(); };
  }
  const rc = document.getElementById('revCount');
  if (rc) rc.textContent = list.length + ' reviews • showing ' + visible.length;
}
function deleteReview(key){
  if (!confirm('Delete this review?')) return;
  const parts = key.split('::');
  if (parts[0] === 'fs'){
    if (FS.enabled()) FS.deleteReview(parts[1]).catch(() => {});
    fsReviews = fsReviews.filter(r => r.rid !== parts[1]);
  } else {
    try{
      const k = 'sk_reviews_' + parts[1];
      const arr = JSON.parse(localStorage.getItem(k) || '[]');
      arr.splice(+parts[2], 1);
      if (arr.length) localStorage.setItem(k, JSON.stringify(arr)); else localStorage.removeItem(k);
    }catch(e){}
  }
  revPage = 1;
  renderReviews();
  toast('🗑️ Review deleted');
}

/* ============================ EVENTS ============================ */
document.addEventListener('change', e => {
  if (e.target.dataset.status) updateStatus(e.target.dataset.status, e.target.value);
});
document.addEventListener('click', e => {
  const copy = e.target.closest('[data-copy]');
  if (copy){ copyText(copy.dataset.copy); return; }
  const editp = e.target.closest('[data-editprod]');
  if (editp){ openEditProduct(editp.dataset.editprod); return; }
  const delp = e.target.closest('[data-delprod]');
  if (delp){
    if (!confirm('Delete this product?')) return;
    PRODUCTS = PRODUCTS.filter(p => p.id !== delp.dataset.delprod);
    saveProducts(PRODUCTS); prodPage = 1; renderProdBody(); toast('🗑️ Deleted');
    return;
  }
  const delr = e.target.closest('[data-delreview]');
  if (delr){ deleteReview(delr.dataset.delreview); }
});
