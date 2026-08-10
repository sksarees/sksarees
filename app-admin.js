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
  try{ purgeOldOrders(30); }catch(e){}   /* auto-delete orders older than 30 days */
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
let orderSearch = '';   /* Orders tab: search query (id / customer / phone) */
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
      '<button type="button" class="admin-tab" id="tabMetaAds">📣 Meta Ads</button>' +
      '<button type="button" class="admin-tab" id="tabPush">📣 Push</button>' +
      '<button type="button" class="admin-tab" id="tabLeads">📋 Leads</button>' +
      '<button type="button" class="admin-tab" id="tabFeed">📦 Catalog Feed</button>' +
      '<button type="button" class="admin-tab" id="tabResellers">💰 Resellers</button>' +
      '<button type="button" class="admin-tab" id="tabCoupons">🎟️ Coupons</button>' +
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
  document.getElementById('tabCoupons').addEventListener('click', () => switchTab('coupons'));
  document.getElementById('tabResellers').addEventListener('click', () => switchTab('resellers'));
  document.getElementById('tabFeed').addEventListener('click', () => switchTab('feed'));
  document.getElementById('tabLeads').addEventListener('click', () => switchTab('leads'));
  document.getElementById('tabPush').addEventListener('click', () => switchTab('push'));
  document.getElementById('tabMetaAds').addEventListener('click', () => switchTab('metaads'));
  document.getElementById('logoutBtn').addEventListener('click', () => { LS.set('sk_admin', '0'); location.reload(); });
  /* Firestore: quiet status + live orders/reviews */
  if (FS.enabled()){
    const pill = document.getElementById('cloudPill');
    FS.onStatus = (st) => {
      if (pill) pill.textContent = st === 'on' ? '🟢 Cloud sync on' : '💾 Saved on device';
    };
    /* Cloud orders stay in a RUNTIME list (fsOrders) — they are NEVER written
       into Store.orders / sk_orders, so the admin device's own "My Orders"
       page still shows only this device's orders. Admin view merges both. */
    FS.listenOrders(list => {
      fsOrders = list && list.length ? list : [];
      fsOrders.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      if (adminTab === 'orders'){ renderFilters(); renderOrderList(); }
    });
    FS.listenReviews(list => { fsReviews = list || []; if (adminTab === 'reviews') renderReviews(); });
    FS._getDb().then(db => {
      if (!db) return;
      db.collection('abandoned').onSnapshot(snap => {
        const l = []; snap.forEach(x => l.push(Object.assign({}, x.data(), { device: x.id })));
        fsAbandoned = l; if (adminTab === 'push') renderPush();
      }, () => {});
      db.collection('resellers').onSnapshot(snap => {
        const l = []; snap.forEach(x => l.push(Object.assign({}, x.data(), { code: x.id })));
        fsResellers = l; if (adminTab === 'resellers') renderResellers();
      }, () => {});
      db.collection('leads').onSnapshot(snap => {
        const l = []; snap.forEach(x => l.push(Object.assign({}, x.data(), { lid: x.id })));
        fsLeads = l; if (adminTab === 'leads') renderLeads();
      }, () => {});
    }).catch(() => {});
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
  ['tabOrders','tabProducts','tabReviews','tabMetaAds','tabPush','tabResellers','tabLeads','tabFeed','tabCoupons','tabDashboard'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('on', id === 'tab' + t[0].toUpperCase() + t.slice(1));
  });
  const body = document.getElementById('tabBody'); if (!body) return;
  try{
    if (t === 'orders'){ renderFilters(); renderOrderList(); }
    else if (t === 'products') renderProducts();
    else if (t === 'reviews') renderReviews();
    else if (t === 'coupons') renderCoupons();
    else if (t === 'resellers') renderResellers();
    else if (t === 'feed') renderFeed();
    else if (t === 'leads') renderLeads();
    else if (t === 'push') renderPush();
    else if (t === 'metaads') renderMetaAds();
    else if (t === 'dashboard') renderDashboard();
  }catch(e){ body.innerHTML = '<div class="empty"><div class="e-ic">⚠️</div><b>Could not load</b></div>'; }
}

function renderDashboard(){
  const all = adminAllOrders();
  const o = all;
  const sales = o.reduce((s2, x) => s2 + ((x.totals || {}).grand || 0), 0);
  const dayMap = {}; const weekMap = {};
  o.forEach(x => {
    const d = new Date(x.date || x.createdAt || 0);
    if (isNaN(d.getTime())) return;
    const dayKey = d.toISOString().slice(0, 10);
    dayMap[dayKey] = (dayMap[dayKey] || 0) + ((x.totals || {}).grand || 0);
    const wk = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil((((d - wk) / 864e5) + wk.getDay() + 1) / 7);
    const wkKey = d.getFullYear() + '-W' + String(weekNo).padStart(2, '0');
    weekMap[wkKey] = (weekMap[wkKey] || 0) + ((x.totals || {}).grand || 0);
  });
  const dayKeys = Object.keys(dayMap).sort().slice(-14);
  const weekKeys = Object.keys(weekMap).sort().slice(-8);
  const barChart = (keys, map) => {
    const vals = keys.map(k => map[k] || 0);
    const max = Math.max.apply(null, vals.concat([1]));
    return '<div style="display:flex;align-items:flex-end;gap:6px;height:130px;padding-top:8px">' + keys.map((k, i) => {
      const h = Math.max(3, Math.round((vals[i] / max) * 110));
      return '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;min-width:0"><div style="width:100%;background:linear-gradient(180deg,var(--maroon),var(--maroon-d));border-radius:6px 6px 0 0;height:' + h + 'px" title="' + esc(k) + ': ' + money(vals[i]) + '"></div><span style="font-size:.58rem;color:var(--muted);white-space:nowrap;overflow:hidden;max-width:100%">' + esc(k.slice(5)) + '</span></div>';
    }).join('') + '</div>';
  };
  const prodMap = {};
  o.forEach(x => (x.items || []).forEach(i => {
    prodMap[i.id] = prodMap[i.id] || { name: i.name, qty: 0, rev: 0 };
    prodMap[i.id].qty += (i.qty || 1);
    prodMap[i.id].rev += ((i.price || 0) * (i.qty || 1));
  }));
  const topProds = Object.values(prodMap).sort((a, b) => b.rev - a.rev).slice(0, 8);
  const rsMap = {};
  o.forEach(x => { if (x.reseller && x.reseller.code){ rsMap[x.reseller.code] = rsMap[x.reseller.code] || { name: x.reseller.name, phone: x.reseller.phone, orders: 0, margin: 0 }; rsMap[x.reseller.code].orders += 1; rsMap[x.reseller.code].margin += (x.margin || 0); } });
  const topRs = Object.values(rsMap).sort((a, b) => b.margin - a.margin).slice(0, 8);
  document.getElementById('tabBody').innerHTML =
    '<div class="stat-row">' +
      '<div class="stat-chip"><b>' + o.length + '</b><small>Orders</small></div>' +
      '<div class="stat-chip"><b>₹' + sales.toLocaleString('en-IN') + '</b><small>Sales</small></div>' +
      '<div class="stat-chip"><b>' + o.filter(x => (x.status || 'placed') === 'placed').length + '</b><small>New</small></div>' +
      '<div class="stat-chip"><b>' + o.filter(x => (x.status || 'placed') === 'pending').length + '</b><small>Pending</small></div>' +
      '<div class="stat-chip"><b>' + o.filter(x => (x.status || 'placed') === 'confirmed').length + '</b><small>Confirmed</small></div>' +
      '<div class="stat-chip"><b>' + o.filter(x => (x.status || 'placed') === 'shipped').length + '</b><small>Shipped</small></div>' +
      '<div class="stat-chip"><b>' + o.filter(x => (x.status || 'placed') === 'delivered').length + '</b><small>Delivered</small></div>' +
    '</div>' +
    '<div class="form-card" style="margin-top:14px"><h3>📈 Revenue — last 14 days</h3>' + barChart(dayKeys, dayMap) + '</div>' +
    '<div class="form-card" style="margin-top:14px"><h3>📊 Revenue — last 8 weeks</h3>' + barChart(weekKeys, weekMap) + '</div>' +
    '<div style="display:grid;gap:14px;grid-template-columns:1fr;margin-top:14px">' +
      '<div class="form-card"><h3>🏆 Top Products</h3>' + (topProds.length
        ? topProds.map((p, i) => '<div style="display:flex;justify-content:space-between;gap:8px;font-size:.82rem;padding:7px 0;border-bottom:1px dashed var(--line)"><span><b>' + (i + 1) + '.</b> ' + esc(p.name) + ' <span class="muted">×' + p.qty + '</span></span><b>' + money(p.rev) + '</b></div>').join('')
        : '<p class="small muted">No sales yet.</p>') + '</div>' +
      '<div class="form-card"><h3>💰 Best Resellers</h3>' + (topRs.length
        ? topRs.map((r, i) => '<div style="display:flex;justify-content:space-between;gap:8px;font-size:.82rem;padding:7px 0;border-bottom:1px dashed var(--line)"><span><b>' + (i + 1) + '.</b> ' + esc(r.name) + ' <span class="muted">' + esc(r.phone) + ' • ' + r.orders + ' orders</span></span><b style="color:var(--green)">' + money(r.margin) + '</b></div>').join('')
        : '<p class="small muted">No reseller sales yet.</p>') + '</div>' +
    '</div>' +
    '<div class="form-card" style="margin-top:14px"><h3>🗄️ Firestore Collections</h3>' +
      '<p class="small muted">Collections in your project: <b>admins • cart • categories • counters • customers • inventory • orders • products • promos • reviews • resellers • settings</b></p>' +
      '<button type="button" class="btn btn-outline btn-sm" id="seedDb" style="width:auto;min-width:200px;margin-top:8px">🛠️ Setup / Sync Database</button>' +
      '<p class="small" id="seedMsg" style="margin-top:6px"></p></div>' +
    '<div class="form-card" style="margin-top:14px"><h3>ℹ️ How to run the store</h3>' +
      '<p class="small muted">1. Orders placed on this device appear here instantly (local + Firestore sync).<br>' +
      '2. Update status → WhatsApp the customer confirmation / delivery reminder.<br>' +
      '3. When shipped, dispatch date + ETA (7 days) auto-capture; auto-Delivered after ETA.<br>' +
      '4. Manage products (add / bulk / XML feed), coupons, resellers &amp; reviews.</p></div>';
}

function adminAllOrders(){
  const localMap = {};
  Store.orders.forEach(o => { if (o && o.id) localMap[o.id] = o; });
  const merged = (fsOrders || []).filter(f => orderAgeDays(f) <= 30).map(f => Object.assign({}, f, localMap[f.id] || {}))
    .concat(Store.orders.filter(o => o && o.id && orderAgeDays(o) <= 30 && !(fsOrders || []).some(x => x.id === o.id)));
  merged.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  return merged;
}
function renderFilters(){
  const all = adminAllOrders();
  const counts = { all: all.length, placed: 0, pending: 0, confirmed: 0, shipped: 0, delivered: 0 };
  all.forEach(o => { const s = o.status || 'placed'; if (counts[s] !== undefined) counts[s]++; });
  const defs = [
    ['all', '📦 All (' + counts.all + ')'], ['placed', '🆕 New (' + counts.placed + ')'],
    ['pending', '⏳ Payment Pending (' + counts.pending + ')'], ['confirmed', '✅ Confirmed (' + counts.confirmed + ')'],
    ['shipped', '🚚 Shipped (' + counts.shipped + ')'], ['delivered', '✔ Delivered (' + counts.delivered + ')'],
  ];
  document.getElementById('tabBody').innerHTML =
    '<input id="orderSearch" type="search" placeholder="🔍 Search orders — ID, customer name, phone…" autocomplete="off" value="' + esc(orderSearch) + '" style="width:100%;border:1.5px solid var(--line);border-radius:11px;padding:11px 13px;background:#fff;outline:none;margin-bottom:10px;font-size:15px">' +
    '<div class="filter-chips">' + defs.map(([k, l]) =>
      '<button type="button" class="filter-chip ' + (orderFilter === k ? 'on' : '') + '" data-of="' + k + '">' + l + '</button>').join('') + '</div>' +
    '<div id="orderList" style="margin-top:10px"></div>' +
    '<div style="text-align:center;margin-top:10px"><button type="button" class="btn btn-outline" id="moreOrders" style="width:auto;min-width:200px">Load More Orders ↓</button></div>';
  document.getElementById('orderSearch').addEventListener('input', e => { orderSearch = e.target.value; orderPage = 1; renderOrderList(); });
  document.querySelectorAll('[data-of]').forEach(b => b.addEventListener('click', () => {
    orderFilter = b.dataset.of; orderPage = 1;
    document.querySelectorAll('[data-of]').forEach(x => x.classList.toggle('on', x === b));
    renderOrderList();
  }));
}

function renderOrderList(){
  const wrap = document.getElementById('orderList'); if (!wrap) return;
  let all = adminAllOrders();
  if (orderSearch){
    const q = orderSearch.toLowerCase();
    all = all.filter(o => String((o.id || '') + ' ' + ((o.customer || {}).name || '') + ' ' + ((o.customer || {}).phone || '')).toLowerCase().includes(q));
  }
  const list = orderFilter === 'all' ? all : all.filter(o => (o.status || 'placed') === orderFilter);
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
    '<div class="oc-items">' + fmtDT(o.date || o.createdAt) + ' • <b>' + esc(c.name || '') + '</b> • ' + esc(c.phone || '') + '<br>' +
      esc(c.address || '') + ', ' + esc(c.pincode || '') + '<br>' + items + ' • <b>' + money(t.grand || 0) + '</b> (' + (o.payment || '').toUpperCase() + ')</div>' +
    '<select data-status="' + o.id + '">' +
      '<option value="placed"' + (st === 'placed' ? ' selected' : '') + '>Placed</option>' +
      '<option value="pending"' + (st === 'pending' ? ' selected' : '') + '>⏳ Payment Pending</option>' +
      '<option value="confirmed"' + (st === 'confirmed' ? ' selected' : '') + '>Confirmed</option>' +
      '<option value="shipped"' + (st === 'shipped' ? ' selected' : '') + '>Shipped</option>' +
      '<option value="delivered"' + (st === 'delivered' ? ' selected' : '') + '>Delivered</option>' +
    '</select>' +
    '<div class="oc-btns">' +
      '<a class="btn btn-wa btn-sm" href="' + waLink(TPL_CONFIRM(o), c.phone) + '" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true" style="vertical-align:-2px;margin-right:4px"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>Send Confirmation</a>' +
      '<a class="btn btn-outline btn-sm" href="' + waLink(TPL_DELIVERY(o), c.phone) + '" target="_blank" rel="noopener">🚚 Send Delivery Reminder</a>' +
    '</div></div>';
}

function updateStatus(id, status){
  /* find in cloud orders (fsOrders) OR device orders (Store.orders) */
  const fi = (fsOrders || []).findIndex(x => x.id === id);
  const o = fi >= 0 ? fsOrders[fi] : Store.orders.find(x => x.id === id);
  if (!o) return;
  o.status = status;
  if (status === 'shipped') dispatchOrder(o);
  if (status === 'delivered') o.deliveredAt = o.deliveredAt || new Date().toISOString();
  if (fi >= 0){
    /* cloud order → update Firestore ONLY (never pollute sk_orders) */
    fsOrders[fi] = o;
    if (FS.enabled()) FS.updateStatus(id, status, status === 'shipped' ? { dispatchedAt: o.dispatchedAt, deliverBy: o.deliverBy } : (status === 'delivered' ? { deliveredAt: o.deliveredAt } : {})).catch(() => {});
  } else {
    /* device order → local + Firestore */
    Store.saveOrders();
    if (FS.enabled()) FS.updateStatus(id, status, status === 'shipped' ? { dispatchedAt: o.dispatchedAt, deliverBy: o.deliverBy } : (status === 'delivered' ? { deliveredAt: o.deliveredAt } : {})).catch(() => {});
  }
  toast('✅ ' + id + ' → ' + status);
  /* 💬 auto-offer: open WhatsApp to the customer with the status update + track link */
  try{
    const cust = o.customer || {};
    if (cust.phone && /^[6-9]\d{9}$/.test(String(cust.phone).replace(/\D/g, ''))){
      const track = location.origin + '/orders.html?id=' + encodeURIComponent(id);
      const labels = { placed:'🆕 Placed', pending:'⏳ Payment Pending', confirmed:'✅ Confirmed', shipped:'🚚 Dispatched', delivered:'✔ Delivered' };
      const msg = '🪡 SK Sarees — Order update!\n\n📦 Order ' + id + ' → ' + (labels[status] || status) + (status === 'delivered' ? ' 🎉 Enjoy your saree!' : '') +
        '\n\nTrack: ' + track + '\n\nThank you for shopping with SK SAREES! 💛';
      setTimeout(() => { try{ window.open(waLink(msg, cust.phone), '_blank', 'noopener'); }catch(e){} }, 400);
    }
  }catch(e){}
  orderPage = 1;
  renderFilters(); renderOrderList();
}

/* ============================ PRODUCTS ============================ */
function renderProducts(){
  document.getElementById('tabBody').innerHTML =
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">' +
      '<button type="button" class="btn btn-maroon btn-sm" id="btnAddProd" style="flex:1;min-width:130px">➕ Add Product</button>' +
      '<button type="button" class="btn btn-outline btn-sm" id="btnBulk" style="flex:1;min-width:130px">📥 Bulk Upload</button>' +
      '<button type="button" class="btn btn-ghost btn-sm" id="btnDelSel" style="flex:1;min-width:130px;color:var(--red);border:1.5px solid #f0c4c4">🗑️ Delete Selected (<span id="delSelCount">0</span>)</button>' +
    '</div>' +
    '<input id="prodSearch" type="search" placeholder="🔍 Search products — name, SKU, category, colour…" autocomplete="off" value="' + esc(prodSearch) + '" style="width:100%;border:1.5px solid var(--line);border-radius:11px;padding:11px 13px;background:#fff;outline:none;margin-bottom:10px;font-size:15px">' +
    '<div class="bulk-panel" id="bulkPanel" style="display:none;background:#fff;border:1.5px dashed #d8b24e;border-radius:var(--r);padding:14px;margin-bottom:12px">' +
      '<h3 style="font-size:.95rem;margin-bottom:6px">📥 Bulk Upload Products</h3>' +
      '<p class="small muted" style="margin:6px 0">One per line: <b>Name, Price, MRP, Category, Image URL, Badge</b></p>' +
      '<textarea id="bulkText" placeholder="Soft Silk Saree, 1499, 2299, soft-silk, https://…, New" style="width:100%;border:1.5px solid var(--line);border-radius:11px;padding:10px;min-height:90px;font-size:.8rem;background:#fff;outline:none;font-family:inherit"></textarea>' +
      '<button type="button" class="btn btn-maroon btn-sm" id="btnImport" style="margin-top:10px">📥 Import</button>' +
      '<p class="small" id="bulkResult" style="margin-top:8px"></p></div>' +
    '<div class="prod-table-wrap"><table class="prod-table"><thead><tr><th style="width:38px"><input type="checkbox" id="prodSelAll" title="Select all"></th><th>Photo</th><th>Product</th><th>Price</th><th>Stock</th><th>Badge</th><th></th></tr></thead><tbody id="prodBody"></tbody></table></div>' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;gap:8px;flex-wrap:wrap">' +
      '<p class="small muted" id="prodCount" style="margin:0"></p>' +
      '<button type="button" class="btn btn-outline btn-sm" id="moreProds" style="display:none">Load More Products ↓</button>' +
    '</div>';
  renderProdBody();
  document.getElementById('btnAddProd').addEventListener('click', openAddProduct);
  document.getElementById('btnBulk').addEventListener('click', () => { document.getElementById('bulkPanel').style.display = document.getElementById('bulkPanel').style.display === 'none' ? 'block' : 'none'; });
  document.getElementById('btnImport').addEventListener('click', importBulk);
  document.getElementById('prodSearch').addEventListener('input', e => { prodSearch = e.target.value; prodPage = 1; renderProdBody(); });
  document.getElementById('btnDelSel').addEventListener('click', () => {
    const sel = Array.from(document.querySelectorAll('.prod-sel:checked')).map(cb => cb.value);
    if (!sel.length){ toast('⚠️ Select products first'); return; }
    if (!confirm('Delete ' + sel.length + ' selected product(s)?')) return;
    PRODUCTS = PRODUCTS.filter(p => !sel.includes(p.id));
    saveProducts(PRODUCTS); prodPage = 1; renderProdBody(); toast('🗑️ ' + sel.length + ' deleted');
  });
  /* select-all checkbox in the table header */
  const selAll = document.getElementById('prodSelAll');
  if (selAll) selAll.addEventListener('change', () => {
    document.querySelectorAll('.prod-sel').forEach(cb => cb.checked = selAll.checked);
    updateDelSelCount();
  });
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
    '<tr><td><input type="checkbox" class="prod-sel" value="' + esc(p.id) + '"></td>' +
    '<td><img src="' + esc(p.img) + '" alt="" loading="lazy"></td>' +
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
  /* keep select-all + count in sync */
  const selAll = document.getElementById('prodSelAll');
  if (selAll) selAll.checked = visible.length > 0 && document.querySelectorAll('.prod-sel:checked').length === visible.length;
  updateDelSelCount();
}
function updateDelSelCount(){
  const c = document.getElementById('delSelCount');
  if (c) c.textContent = document.querySelectorAll('.prod-sel:checked').length;
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
    '<div class="field"><label>🖼️ Main Image URL *</label><input id="apImg" placeholder="https://…"></div>' +
    '<div class="field"><label>➕ Extra Image 1 (optional — gallery thumbnail)</label><input id="apImg2" placeholder="https://…"></div>' +
    '<div class="field"><label>➕ Extra Image 2 (optional — gallery thumbnail)</label><input id="apImg3" placeholder="https://…"></div>' +
    '<div class="field"><label>Video URL (YouTube — optional)</label><input id="apVideo" placeholder="https://youtube.com/watch?v=…"></div>' +
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
      video: document.getElementById('apVideo').value,
      img2: document.getElementById('apImg2').value,
      img3: document.getElementById('apImg3').value,
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
    '<div class="field"><label>🖼️ Main Image URL</label><input id="epImg" value="' + esc(p.img) + '"></div>' +
    '<div class="field"><label>➕ Extra Image 1</label><input id="epImg2" value="' + esc((p.images || [])[1] || '') + '" placeholder="https://…"></div>' +
    '<div class="field"><label>➕ Extra Image 2</label><input id="epImg3" value="' + esc((p.images || [])[2] || '') + '" placeholder="https://…"></div>' +
    '<div class="field"><label>Video URL (YouTube — optional)</label><input id="epVideo" value="' + esc(p.video ? 'https://www.youtube.com/watch?v=' + p.video : '') + '" placeholder="https://youtube.com/watch?v=…"></div>' +
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
        img2: document.getElementById('epImg2').value,
        img3: document.getElementById('epImg3').value,
        video: ytId(document.getElementById('epVideo').value),
      });
      /* rebuild the gallery array from main + extra images */
      try{
        const imgs = [];
        [PRODUCTS[idx].img, PRODUCTS[idx].img2, PRODUCTS[idx].img3].forEach(u => {
          const c = cleanImg(u); if (c && imgs.indexOf(c) === -1) imgs.push(c);
        });
        PRODUCTS[idx].images = imgs;
      }catch(e){}
      saveProducts(PRODUCTS);
      closeModal(); renderProdBody(); toast('✅ Product updated');
    }
  });
}

/* ============================ COUPONS ============================ */
function renderCoupons(){
  const list = getCoupons();
  document.getElementById('tabBody').innerHTML =
    '<div class="form-card"><h3>🎟️ Create Coupon</h3>' +
      '<div style="display:grid;gap:10px;grid-template-columns:1fr 1fr">' +
        '<div class="field"><label>Code *</label><input id="cpCode" placeholder="e.g. PONGAL50" style="text-transform:uppercase"></div>' +
        '<div class="field"><label>Type</label><select id="cpType"><option value="flat">₹ Flat off</option><option value="percent">% Percent off</option></select></div>' +
      '</div>' +
      '<div style="display:grid;gap:10px;grid-template-columns:1fr 1fr">' +
        '<div class="field"><label>Value *</label><input id="cpValue" type="number" placeholder="e.g. 50 or 10"></div>' +
        '<div class="field"><label>Min cart (₹)</label><input id="cpMin" type="number" placeholder="0"></div>' +
      '</div>' +
      '<div style="display:grid;gap:10px;grid-template-columns:1fr 1fr">' +
        '<div class="field"><label>Max uses (0 = unlimited)</label><input id="cpMax" type="number" placeholder="e.g. 100"></div>' +
        '<div class="field"><label>Expiry date (optional)</label><input id="cpExpiry" type="date"></div>' +
      '</div>' +
      '<div class="field"><label>Label (shown to customers)</label><input id="cpLabel" placeholder="Pongal offer — ₹50 off"></div>' +
      '<label style="display:flex;gap:8px;align-items:center;font-size:.85rem;font-weight:700;margin-bottom:10px"><input type="checkbox" id="cpActive" checked style="width:18px;height:18px"> Active</label>' +
      '<button type="button" class="btn btn-maroon" id="cpSave">💾 Create Coupon</button></div>' +
    '<div class="form-card"><h3>📋 All Coupons</h3><div id="cpList"></div></div>';
  document.getElementById('cpSave').addEventListener('click', () => {
    const code = (document.getElementById('cpCode').value || '').trim().toUpperCase();
    const value = +document.getElementById('cpValue').value;
    if (!code || !(value > 0)){ toast('⚠️ Code and Value required'); return; }
    const coupons = getCoupons().filter(c => String(c.code).trim().toUpperCase() !== code);
    coupons.unshift({
      code, type: document.getElementById('cpType').value,
      value, min: Math.max(0, +document.getElementById('cpMin').value || 0),
      label: document.getElementById('cpLabel').value.trim() || (code + ' offer'),
      active: document.getElementById('cpActive').checked,
      maxUses: Math.max(0, +document.getElementById('cpMax').value || 0),
      expiry: document.getElementById('cpExpiry').value || '',
    });
    saveCoupons(coupons);
    renderCoupons();
    toast('✅ Coupon ' + code + ' created');
  });
  renderCouponList();
}
function renderCouponList(){
  const wrap = document.getElementById('cpList'); if (!wrap) return;
  const list = getCoupons();
  if (!list.length){ wrap.innerHTML = '<p class="small muted">No coupons yet — create one above.</p>'; return; }
  wrap.innerHTML = list.map((c, i) =>
    '<div class="order-card" style="padding:12px">' +
      '<div class="oc-top"><b style="letter-spacing:1px">🎟️ ' + esc(c.code) + '</b>' +
      '<span class="status-pill ' + (c.active ? 'status-delivered' : 'status-placed') + '">' + (c.active ? 'Active' : 'Inactive') + '</span></div>' +
      '<div class="oc-items">' + esc(c.label || '') + '<br>' +
        (c.type === 'percent' ? c.value + '% off' : '₹' + c.value + ' off') +
        (c.min ? ' • min ₹' + c.min : ' • no minimum') +
        (c.expiry ? ' • till ' + esc(c.expiry) : ' • no expiry') +
        (c.maxUses ? ' • ' + couponRemaining(c) + '/' + c.maxUses + ' uses left' : ' • unlimited') + '</div>' +
      '<div class="oc-btns">' +
        '<button type="button" class="btn btn-outline btn-sm" data-cp-toggle="' + i + '">' + (c.active ? '⏸️ Deactivate' : '▶️ Activate') + '</button>' +
        '<button type="button" class="btn btn-ghost btn-sm" data-cp-del="' + i + '">🗑️ Delete</button>' +
      '</div></div>').join('');
}
function couponAct(i, del){
  let list = getCoupons();
  if (del){ list.splice(i, 1); toast('🗑️ Coupon deleted'); }
  else { list[i].active = !list[i].active; toast(list[i].active ? '▶️ Activated' : '⏸️ Deactivated'); }
  saveCoupons(list);
  renderCouponList();
}

/* ============================ META ADS RUNNER ============================
   Creates ready-to-paste ad campaigns from your product catalog:
   · pick a product (or let it auto-pick best sellers)
   · generates ad headline / primary text / CTA + tracking link
   · copy buttons + WhatsApp/Telegram share + open Meta Ads Manager
   · optional discount code to sweeten the ad */
function renderMetaAds(){
  const body = document.getElementById('tabBody');
  const picks = PRODUCTS.slice(0, 60);
  const opt = id => '<option value="' + esc(id) + '">' + esc(byId(id) ? byId(id).name : id) + ' — ' + money(byId(id) ? byId(id).price : 0) + '</option>';
  body.innerHTML =
    '<div class="form-card"><h3>📣 Meta Ads — Ad Builder</h3>' +
      '<p class="small muted">Pick a saree → we write the ad for you → copy it into Meta Ads Manager (or share on WhatsApp). Every ad carries a <b>tracking link</b> so you can see clicks &amp; orders.</p>' +
      '<div class="field"><label>1️⃣ Choose product</label><select id="maProd" style="width:100%;border:1.5px solid var(--line);border-radius:10px;padding:12px">' +
        picks.map(p => opt(p.id)).join('') + '</select></div>' +
      '<div class="field"><label>2️⃣ Discount coupon (optional)</label><input id="maCoupon" placeholder="e.g. AADI10 — leave empty for none" style="text-transform:uppercase"></div>' +
      '<button type="button" class="btn btn-maroon" id="maGen" style="margin-top:4px">✨ Generate Ad</button></div>' +
    '<div class="form-card" id="maOut" style="display:none"></div>' +
    '<div class="form-card"><h3>📊 Quick actions</h3>' +
      '<div style="display:grid;gap:8px;grid-template-columns:1fr 1fr">' +
        '<a class="btn btn-outline btn-sm" href="https://www.facebook.com/adsmanager" target="_blank" rel="noopener">🖥️ Open Meta Ads Manager</a>' +
        '<a class="btn btn-outline btn-sm" href="https://business.facebook.com/events_manager" target="_blank" rel="noopener">📈 Events Manager (Pixel)</a>' +
        '<a class="btn btn-outline btn-sm" href="https://business.facebook.com" target="_blank" rel="noopener">🏢 Business Suite</a>' +
        '<a class="btn btn-outline btn-sm" href="' + waLink('Hi! I am promoting my saree store on Meta ads — any tips for our area? 😊') + '" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true" style="vertical-align:-2px;margin-right:4px"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>Ad tips on WhatsApp</a>' +
      '</div>' +
      '<p class="small muted" style="margin-top:10px">💡 <b>Tip:</b> the Meta Pixel is already installed — ads will automatically track AddToCart, InitiateCheckout &amp; Purchase. Start with ₹100–₹300/day targeting Tamil Nadu &amp; Karnataka, women 25–50.</p></div>';
  document.getElementById('maGen').addEventListener('click', maGenerate);
}
function maGenerate(){
  const out = document.getElementById('maOut'); if (!out) return;
  const id = document.getElementById('maProd').value;
  const p = byId(id); if (!p) return;
  const coupon = document.getElementById('maCoupon').value.trim().toUpperCase();
  const page = location.origin + location.pathname.replace(/[^/]*$/, '');
  const link = page + 'product.html?id=' + encodeURIComponent(p.id) + (coupon ? '?coupon=' + coupon : '');
  const off = offPct(p);
  const price = money(p.price);
  const mrp = p.mrp ? money(p.mrp) : '';
  const headline = p.name + (off ? ' — ' + off + '% OFF' : '');
  const waNum = /^[6-9]\d{9}$/.test(String(CONFIG.waNumber).replace(/\D/g, '')) ? '91' + String(CONFIG.waNumber).replace(/\D/g, '') : String(CONFIG.waNumber).replace(/\D/g, '');
  const primary = `💜 ${p.name}\n\n✨ Price: ${price}${mrp ? ' (MRP ' + mrp + ')' : ''}\n${off ? '🔥 Save ' + off + '% today!' : ''}\n🚚 Fast dispatch 12–24h • Free shipping ₹999+\n💵 COD available • UPI (GPay/PhonePe/Paytm)\n\n${coupon ? '🎟️ Use coupon ' + coupon + ' for extra discount!\n' : ''}👉 Order on WhatsApp: wa.me/${waNum}\n🔗 ${link}`;
  out.style.display = 'block';
  out.innerHTML =
    '<h3 style="font-size:1rem;font-weight:800;margin-bottom:6px">✅ Ad ready — copy &amp; paste</h3>' +
    '<div style="display:grid;gap:8px;margin-bottom:10px">' +
      '<div><label class="small muted" style="font-weight:800">Headline</label><textarea id="maHead" rows="1" style="width:100%;border:1.5px solid var(--line);border-radius:10px;padding:10px;font-size:.85rem;background:#fff;outline:none">' + esc(headline) + '</textarea></div>' +
      '<div><label class="small muted" style="font-weight:800">Primary text</label><textarea id="maBody" rows="7" style="width:100%;border:1.5px solid var(--line);border-radius:10px;padding:10px;font-size:.82rem;background:#fff;outline:none">' + esc(primary) + '</textarea></div>' +
    '</div>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
      '<button type="button" class="btn btn-outline btn-sm" data-copy="' + esc(primary) + '" style="width:auto">📋 Copy Ad Text</button>' +
      '<a class="btn btn-wa btn-sm" href="' + waLink('Please promote my saree: ' + headline + ' — ' + link) + '" target="_blank" rel="noopener" style="width:auto"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true" style="vertical-align:-2px;margin-right:4px"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>Send to my WhatsApp</a>' +
      '<a class="btn btn-gold btn-sm" href="https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(link) + '" target="_blank" rel="noopener" style="width:auto">📤 Share on Facebook</a>' +
    '</div>' +
    '<p class="small muted" style="margin-top:10px">🔗 Tracking link: <b style="word-break:break-all">' + esc(link) + '</b> <button type="button" class="btn btn-ghost btn-sm" data-copy="' + esc(link) + '" style="width:auto;min-height:28px;padding:3px 10px">Copy</button></p>' +
    '<p class="small muted">📷 Ad image: use <b>' + esc(p.img) + '</b> (or any of the ' + ((p.images || []).length) + ' product photos).</p>';
}

/* ============================ LEADS (customer numbers from first-load popup) ============================
   Every number collected on first visit (coupon popup) is saved here —
   local sk_lead_list + Firestore leads — with name, phone, code & date.
   WhatsApp / call each lead to convert them into orders. */
let fsLeads = [];
function renderLeads(){
  const body = document.getElementById('tabBody');
  /* merge local + Firestore (dedupe by phone) */
  const merged = [];
  const seen = {};
  try{ const l = JSON.parse(localStorage.getItem('sk_lead_list') || '[]'); l.forEach(x => { const k = String(x.phone); if (!seen[k]){ seen[k] = 1; merged.push(x); } }); }catch(e){}
  (fsLeads || []).forEach(x => { if (!x || !x.phone) return; const k = String(x.phone); if (!seen[k]){ seen[k] = 1; merged.push(x); } });
  merged.sort((a, b) => (b.date || 0) - (a.date || 0));
  body.innerHTML =
    '<div class="form-card"><h3>📋 Customer Leads — collected on first visit</h3>' +
      '<p class="small muted">Numbers captured from the welcome-offer popup. Contact them on WhatsApp — they already wanted the coupon! Total: <b>' + merged.length + '</b>.</p></div>' +
    '<div id="leadList"></div>';
  const wrap = document.getElementById('leadList');
  if (!merged.length){
    wrap.innerHTML = '<div class="empty"><div class="e-ic">📋</div><b>No leads yet</b>When visitors enter their number in the ₹50-off popup, they appear here.</div>';
    return;
  }
  wrap.innerHTML = merged.map((r, i) => {
    const when = r.date ? fmtDT(r.date) : '—';
    const msg = '🎉 Hi ' + (r.name || 'there') + '! Your SK Sarees ₹50 OFF coupon (' + (r.code || 'SHARE50') + ') is ready — shop now & save! 🪡\n\n👉 https://www.sksaree.shop/shop.html';
    return '<div class="order-card">' +
      '<div class="oc-top"><b>👤 ' + esc(r.name || 'Customer') + '</b><span class="status-pill status-delivered">🎟️ ' + esc(r.code || 'SHARE50') + '</span></div>' +
      '<div class="oc-items">📱 ' + esc(r.phone) + ' • ' + when + '</div>' +
      '<div class="oc-btns" style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">' +
        '<a class="btn btn-wa btn-sm" style="width:auto" href="' + waLink(msg, r.phone) + '" target="_blank" rel="noopener">💬 Send Offer</a>' +
        '<a class="btn btn-gold btn-sm" style="width:auto" href="tel:+91' + esc(String(r.phone).replace(/\D/g, '')) + '">📞 Call</a>' +
        '<a class="btn btn-outline btn-sm" style="width:auto" href="sms:+91' + esc(String(r.phone).replace(/\D/g, '')) + '?body=' + encodeURIComponent('Hi! Your ₹50 OFF coupon is ready: ' + (r.code || 'SHARE50')) + '">📱 SMS</a>' +
      '</div></div>';
  }).join('');
}

/* ============================ CATALOG FEED (Facebook/Instagram Shopping XML) ============================ */
function feedXml(){
  const escX = s => String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
  /* 🔴 absolute site URL (not localhost) so GOOGLE can reach every product */
  const base = (CONFIG.siteUrl || (location.origin + location.pathname.replace(/[^/]*$/, ''))) + '/';
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n<channel>\n<title>SK Sarees Catalog</title>\n<link>' + escX(location.origin + '/') + '</link>\n<description>Saree catalog for Facebook & Instagram Shopping</description>\n';
  PRODUCTS.slice(0, 500).forEach(p => {
    const imgAbs = /^https?:/.test(p.img) ? p.img : (base + p.img.replace(/^\.?\//,''));
    xml += '<item>\n' +
      '<g:id>' + escX(p.id) + '</g:id>\n' +
      '<g:title>' + escX(p.name) + '</g:title>\n' +
      '<g:description>' + escX((p.desc || p.name + ' from SK Sarees.') + ' ' + p.fabric + ' — ' + p.color) + '</g:description>\n' +
      '<g:link>' + escX(base + 'product.html?id=' + encodeURIComponent(p.id)) + '</g:link>\n' +
      '<g:image_link>' + escX(imgAbs) + '</g:image_link>\n' +
      '<g:availability>' + ((p.stock != null && p.stock <= 0) ? 'out of stock' : 'in stock') + '</g:availability>\n' +
      '<g:price>' + p.price + ' INR</g:price>\n' +
      (p.mrp && p.mrp > p.price ? '<g:sale_price>' + p.price + ' INR</g:sale_price>\n<g:price>' + p.mrp + ' INR</g:price>\n' : '') +
      '<g:condition>new</g:condition>\n' +
      '<g:brand>SK Sarees</g:brand>\n' +
      '<g:mpn>' + escX(p.sku || p.id) + '</g:mpn>\n' +
      '<g:item_group_id>' + escX(p.id) + '</g:item_group_id>\n' +
      '<g:google_product_category>Apparel & Accessories > Clothing > Traditional & Ceremonial Clothing</g:google_product_category>\n' +
      '<g:product_type>' + escX(p.cat || 'Sarees') + '</g:product_type>\n' +
      '<g:shipping><g:country>IN</g:country><g:service>Standard</g:service><g:price>30 INR</g:price></g:shipping>\n' +
      '<g:identifier_exists>no</g:identifier_exists>\n' +
      '</item>\n';
  });
  xml += '</channel>\n</rss>';
  return xml;
}
/* Google Merchant Center TXT feed — exact required columns:
   id,title,description,price,condition,link,availability,image_link */
function feedTxt(){
  const escT = v => String(v == null ? '' : v).replace(/\t/g, ' ').replace(/\n/g, ' ').replace(/\r/g, '');
  /* 🔴 absolute site URL so Google Merchant Center can crawl products */
  const base = (CONFIG.siteUrl || (location.origin + location.pathname.replace(/[^/]*$/, ''))) + '/';
  const lines = ['id\ttitle\tdescription\tprice\tcondition\tlink\tavailability\timage_link'];
  PRODUCTS.slice(0, 500).forEach(p => {
    const imgAbs = /^https?:/.test(p.img) ? p.img : (base + p.img.replace(/^\.?\//, ''));
    const row = [
      escT(p.id),
      escT(p.name),
      escT((p.desc || p.name + ' from SK Sarees.') + ' ' + p.fabric + ' - ' + p.color),
      p.price + ' INR',
      'new',
      escT(base + 'product.html?id=' + encodeURIComponent(p.id)),
      (p.stock != null && p.stock <= 0) ? 'out of stock' : 'in stock',
      escT(imgAbs),
    ];
    lines.push(row.join('\t'));
  });
  return lines.join('\n');
}
function renderFeed(){
  const body = document.getElementById('tabBody');
  const count = PRODUCTS.length;
  body.innerHTML =
    '<div class="form-card"><h3>📦 Catalog Feed — Facebook / Instagram Shopping</h3>' +
      '<p class="small muted">Generate the product XML feed, upload it to your hosting root as <b>products-feed.xml</b>, then connect it in Meta Commerce Manager (Catalog → Data source → Product feed). This lets customers <b>tag &amp; buy sarees directly on Instagram/Facebook</b>.</p>' +
      '<p class="small" style="margin-top:6px">Currently <b>' + count + '</b> products will be in the feed.</p>' +
      '<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">' +
        '<button type="button" class="btn btn-maroon" id="feedDownload" style="width:auto;min-width:230px">⬇️ products-feed.xml</button>' +
        '<button type="button" class="btn btn-gold" id="feedTxtDownload" style="width:auto;min-width:240px">⬇️ Google Merchant (TXT)</button>' +
        '<button type="button" class="btn btn-buy" id="feedJsonDownload" style="width:auto;min-width:220px">⚡ catalog.json (instant load)</button>' +
        '<button type="button" class="btn btn-outline" id="feedCopy" style="width:auto;min-width:180px">📋 Copy XML</button>' +
      '</div>' +
      '<p class="small muted" id="feedNote" style="margin-top:8px">1. Download → 2. Upload to your host (same folder as index.html) → 3. Meta Commerce Manager → add feed URL <b>' + esc(location.origin + '/products-feed.xml') + '</b>.</p></div>' +
    '<div class="form-card"><h3>🔍 Feed preview (first 3)</h3><div style="overflow:auto;max-height:260px;font-size:.68rem;background:var(--bg);border-radius:10px;padding:10px"><pre style="white-space:pre-wrap">' + esc(feedXml().slice(0, 2000)) + '</pre></div></div>';
  document.getElementById('feedDownload').addEventListener('click', () => {
    const blob = new Blob([feedXml()], { type: 'application/xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'products-feed.xml';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    toast('✅ products-feed.xml downloaded (' + count + ' products)');
  });
  document.getElementById('feedCopy').addEventListener('click', () => { copyText(feedXml()); });
  const jsonBtn = document.getElementById('feedJsonDownload');
  if (jsonBtn) jsonBtn.addEventListener('click', () => {
    const clean = PRODUCTS.map(p => ({ id: p.id, sku: p.sku, name: p.name, price: p.price, mrp: p.mrp, cat: p.cat, img: p.img, images: p.images || [p.img], stock: p.stock, fabric: p.fabric, color: p.color, border: p.border, blouse: p.blouse, length: p.length, weight: p.weight, wash: p.wash, desc: p.desc, rating: p.rating, reviews: p.reviews, badge: p.badge, status: 'Active' }));
    const blob = new Blob([JSON.stringify(clean)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'catalog.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    toast('⚡ catalog.json downloaded — upload to site root for instant product load!');
  });
  const txtBtn = document.getElementById('feedTxtDownload');
  if (txtBtn) txtBtn.addEventListener('click', () => {
    const blob = new Blob([feedTxt()], { type: 'text/tab-separated-values' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'google-merchant-feed.txt';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    toast('✅ google-merchant-feed.txt downloaded (' + PRODUCTS.length + ' products)');
  });
}

/* ============================ RESELLERS (Share & Earn) ============================
   Shows every reseller: name, phone, code, orders count, total margin, and the
   order details they brought in — so the owner can pay commission via GPay. */
let fsResellers = [];
function renderResellers(){
  const body = document.getElementById('tabBody');
  /* merge local + Firestore resellers (dedupe by code) */
  const merged = getResellers().slice();
  (fsResellers || []).forEach(fr => {
    if (!fr || !fr.code) return;
    const i = merged.findIndex(x => x.code === fr.code);
    if (i >= 0) merged[i] = Object.assign({}, merged[i], fr);
    else merged.push(fr);
  });
  const all = merged.slice().sort((a, b) => (b.margin || 0) - (a.margin || 0));
  const totalMargin = all.reduce((s, r) => s + (r.margin || 0), 0);
  body.innerHTML =
    '<div class="form-card"><h3>💰 Resellers — Share &amp; Earn</h3>' +
      '<p class="small muted">Resellers earn <b>₹' + (CONFIG.resellerMargin || 50) + '</b> per confirmed order placed through their share link (<code>?ref=CODE</code>). Total margin to pay: <b style="color:var(--green)">' + money(totalMargin) + '</b>.</p></div>' +
    '<div id="rsList"></div>';
  const wrap = document.getElementById('rsList');
  if (!all.length){
    wrap.innerHTML = '<div class="empty"><div class="e-ic">💰</div><b>No resellers yet</b>Share the Share &amp; Earn page (share-earn.html) so people can join!</div>';
    return;
  }
  wrap.innerHTML = all.map((r, i) => {
    const myOrders = Store.orders.filter(o => o.reseller && o.reseller.code === r.code);
    const orderLines = myOrders.length
      ? myOrders.slice(0, 8).map(o => '<div style="font-size:.75rem;padding:3px 0;border-bottom:1px dashed var(--line)">#' + esc(o.id) + ' • ' + fmtDT(o.date) + ' • ' + money((o.totals||{}).grand||0) + ' (' + esc(o.payment||'').toUpperCase() + ') • ' + esc((o.customer||{}).name||'') + '</div>').join('')
      : '<p class="small muted" style="margin-top:4px">No local orders yet (cloud orders sync when Firestore is on).</p>';
    return '<div class="order-card">' +
      '<div class="oc-top"><b>💰 ' + esc(r.name) + '</b><span class="status-pill status-delivered">' + (r.orders||0) + ' orders • ' + money(r.margin||0) + '</span></div>' +
      '<div class="oc-items">📱 ' + esc(r.phone) + ' • Code: <b>' + esc(r.code) + '</b> • Joined ' + fmtDate(r.date) + '</div>' +
      '<div class="oc-items" style="margin-top:6px"><b>📦 Orders via ' + esc(r.code) + ':</b>' + orderLines + '</div>' +
      '<div class="oc-btns" style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">' +
        '<a class="btn btn-wa btn-sm" style="width:auto" href="' + waLink('🎉 Hi ' + r.name + '! Your SK Sarees commission ' + money(r.margin||0) + ' for ' + (r.orders||0) + ' order(s) is ready. Please confirm your GPay details 🙏') + '" target="_blank" rel="noopener">💬 Notify on WhatsApp</a>' +
        '<a class="btn btn-gold btn-sm" style="width:auto" href="' + resellerPayLink(r, r.margin) + '">💸 Pay ' + money(r.margin||0) + ' via GPay</a>' +
        '<a class="btn btn-outline btn-sm" style="width:auto" href="tel:+91' + esc(r.phone) + '">📞 Call</a>' +
      '</div></div>';
  }).join('');
}

/* ============================ PUSH NOTIFICATIONS ============================ */
let fsAbandoned = [];
let pushPage = 1;                 /* abandoned carts pagination */
const PUSH_PAGE_SIZE = 10;
function allAbandoned(){
  const localRec = (function(){ try{ const r = JSON.parse(localStorage.getItem('sk_abandoned') || 'null'); return r ? [r] : []; }catch(e){ return []; } })();
  let all = (fsAbandoned || []).concat(localRec.filter(r => r && !(fsAbandoned || []).some(f => f.device === r.device)));
  /* newest first */
  all.sort((a, b) => ((b.time || 0) - (a.time || 0)) || (b.t || 0) - (a.t || 0));
  return all;
}
function renderPush(){
  const body = document.getElementById('tabBody');
  const all = allAbandoned();
  body.innerHTML =
    '<div class="form-card"><h3>📣 Push Notifications</h3>' +
      '<p class="small muted">Send abandoned-cart &amp; offer reminders straight to customers\' phones (needs HTTPS). ' +
      'Subscribed visitors appear below when they leave items 30+ min.</p></div>' +
    '<div class="form-card"><h3>🔑 Push Keys (VAPID)</h3>' +
      '<p class="small muted">Public key is built into the site. Private key is used to sign pushes — only this browser needs it.</p>' +
      '<textarea id="vkPriv" style="width:100%;border:1.5px solid var(--line);border-radius:11px;padding:10px;font-size:.72rem;background:#fff;outline:none;min-height:46px;font-family:monospace">' + esc(vapidPrivate()) + '</textarea>' +
      '<div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">' +
        '<button type="button" class="btn btn-outline btn-sm" id="vkSave" style="width:auto">💾 Save Key</button>' +
        '<button type="button" class="btn btn-outline btn-sm" id="vkTest" style="width:auto">🔔 Test on My Device</button>' +
      '</div>' +
      '<p class="small" id="vkMsg" style="margin-top:6px"></p></div>' +
    '<div class="form-card"><h3>🧺 Abandoned Carts <span class="muted small">(' + all.length + ')</span></h3><div id="abList"></div>' +
    '<div style="text-align:center;margin-top:10px"><button type="button" class="btn btn-outline" id="moreAb" style="width:auto;min-width:200px;display:none">Load More Carts ↓</button></div></div>';
  document.getElementById('vkSave').addEventListener('click', () => {
    saveVapidPrivate(document.getElementById('vkPriv').value.trim());
    document.getElementById('vkMsg').innerHTML = '<b style="color:var(--green)">✅ Key saved</b>';
  });
  document.getElementById('vkTest').addEventListener('click', async () => {
    const msg = document.getElementById('vkMsg');
    try{
      saveVapidPrivate(document.getElementById('vkPriv').value.trim());
      const sub = await subscribePush();
      if (!sub){ msg.innerHTML = '<b style="color:var(--red)">⚠️ Not subscribed — allow notifications & use HTTPS</b>'; return; }
      await webPushSend(sub.toJSON(), JSON.stringify({ title: '🪡 SK Sarees', body: 'Push notifications work! You can now send cart reminders.', url: './cart.html' }));
      msg.innerHTML = '<b style="color:var(--green)">✅ Push sent to your device!</b>';
    }catch(e){ msg.innerHTML = '<b style="color:var(--red)">⚠️ Push service blocked from browser (' + esc(String(e.message||e).slice(0,80)) + ')</b> — use HTTPS, or send via WhatsApp instead.'; }
  });
  renderAbandonedList(all);
}
function renderAbandonedList(list){
  const wrap = document.getElementById('abList'); if (!wrap) return;
  if (!list.length){
    wrap.innerHTML = '<p class="small muted">No abandoned carts yet — visitors who leave items 30+ min will appear here.</p>';
    const mo = document.getElementById('moreAb'); if (mo) mo.style.display = 'none';
    return;
  }
  /* first 10 (newest) + Load More */
  const visible = list.slice(0, pushPage * PUSH_PAGE_SIZE);
  wrap.innerHTML = visible.map((r, i) => {
    const items = (r.items || []).map(it => esc(it.name) + ' ×' + it.qty).join(', ');
    const when = r.time ? fmtDT(r.time) : '—';
    const hasSub = !!(r.sub && r.sub.endpoint);
    const cartUrl = location.origin + location.pathname.replace(/[^/]*$/, '') + 'cart.html';
    const msg = 'Hi! You left sarees in your cart 🧺\n\n' + items + '\n\n🎟️ Use coupon CART50 for ₹50 off — offer valid today!\n\n👉 Complete your order: ' + cartUrl + '\n\nHappy shopping! 😊';
    return '<div class="order-card">' +
      '<div class="oc-top"><b>🧺 Abandoned cart</b><span class="status-pill ' + (hasSub ? 'status-delivered' : 'status-placed') + '">' + (hasSub ? '🔔 Push ready' : 'No push sub') + '</span></div>' +
      '<div class="oc-items">' + when + (r.phone ? ' • 📱 ' + esc(r.phone) : '') + '<br>' + items + '<br><b>' + money(r.total || 0) + '</b></div>' +
      '<div class="oc-btns" style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">' +
        '<button type="button" class="btn btn-maroon btn-sm" data-pushsend="' + i + '" ' + (hasSub ? '' : 'disabled style="opacity:.5"') + '>📣 Send Push</button>' +
        '<a class="btn btn-wa btn-sm" href="' + waLink(msg) + '" target="_blank" rel="noopener" style="width:auto"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true" style="vertical-align:-2px;margin-right:4px"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>WhatsApp</a>' +
        '<a class="btn btn-outline btn-sm" href="sms:+91' + CONFIG.waNumber + '?body=' + encodeURIComponent(msg) + '" style="width:auto">📱 SMS</a>' +
      '</div></div>';
  }).join('');
  const mo = document.getElementById('moreAb');
  if (mo){
    const hasMore = pushPage * PUSH_PAGE_SIZE < list.length;
    mo.style.display = hasMore ? 'inline-flex' : 'none';
    mo.onclick = () => { pushPage++; renderAbandonedList(list); };
  }
}
async function sendPushTo(i){
  const all = allAbandoned();
  const r = all[i]; if (!r) return;
  const items = (r.items || []).map(it => esc(it.name) + ' ×' + it.qty).join(', ');
  const payload = JSON.stringify({ title: '🧺 Your saree cart is waiting!', body: items + ' — use coupon CART50 for ₹50 off.', url: './cart.html' });
  try{
    if (!(r.sub && r.sub.endpoint)) throw new Error('No push subscription');
    await webPushSend(r.sub, payload);
    toast('📣 Push sent!');
  }catch(e){
    toast('⚠️ Could not send push — ' + String(e.message || e).slice(0, 40));
  }
}

/* ============================ REVIEWS ============================ */
let fsReviews = [];
let fsOrders = [];   /* cloud orders — runtime ONLY, never saved to sk_orders */
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
  if (e.target.classList && e.target.classList.contains('prod-sel')) updateDelSelCount();
});
document.addEventListener('click', e => {
  const copy = e.target.closest('[data-copy]');
  if (copy){ copyText(copy.dataset.copy); return; }
  const editp = e.target.closest('[data-editprod]');
  if (editp){ openEditProduct(editp.dataset.editprod); return; }
  const delp = e.target.closest('[data-delprod]');
  if (delp){
    if (!confirm('Delete this product?')) return;
    const id = delp.dataset.delprod;
    PRODUCTS = PRODUCTS.filter(p => p.id !== id);
    saveProducts(PRODUCTS);
    /* remove it from the Firestore cache too, so it never comes back */
    try{
      const cached = JSON.parse(localStorage.getItem('sk_products_cloud') || '[]');
      const nc = cached.filter(p => p.id !== id);
      localStorage.setItem('sk_products_cloud', JSON.stringify(nc));
    }catch(e){}
    /* mark Inactive in Firestore so pulls skip it */
    try{
      if (FS.enabled()){
        FS._getDb().then(db => { if (db) db.collection('products').doc(String(id)).set({ status: 'Inactive', deletedAt: Date.now() }, { merge: true }).catch(() => {}); }).catch(() => {});
      }
    }catch(e){}
    prodPage = 1; renderProdBody(); toast('🗑️ Deleted');
    return;
  }
  const delr = e.target.closest('[data-delreview]');
  if (delr){ deleteReview(delr.dataset.delreview); }
  /* send push to an abandoned cart */
  const ps = e.target.closest('[data-pushsend]');
  if (ps){ sendPushTo(+ps.dataset.pushsend); return; }
  /* coupon toggle / delete */
  const cpt = e.target.closest('[data-cp-toggle]');
  if (cpt){ couponAct(+cpt.dataset.cpToggle, false); return; }
  const cpd = e.target.closest('[data-cp-del]');
  if (cpd){
    if (!confirm('Delete this coupon?')) return;
    couponAct(+cpd.dataset.cpDel, true);
  }
});
