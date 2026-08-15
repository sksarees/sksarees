/* ============================================================================
   SK SAREES — admin.js (FRESH CLEAN REWRITE)
   PIN login · Orders (local + Firestore) · Products (add/bulk) ·
   Reviews (delete) · Dashboard
   ========================================================================== */
'use strict';
const ADMIN_PIN = '1600'; /* 👉 change before going live */

/* ============================ 🔔 NEW-ORDER ALERTS ============================
   When a NEW order (or lead) arrives on the admin page, show a browser
   notification + toast + beep — so the owner never misses an order. */
let __seenOrders = (() => { try{ return JSON.parse(localStorage.getItem('sk_admin_seen_orders') || '[]'); }catch(e){ return []; } })();
let __seenLeads = (() => { try{ return JSON.parse(localStorage.getItem('sk_admin_seen_leads') || '[]'); }catch(e){ return []; } })();
function __saveSeenOrders(){ try{ localStorage.setItem('sk_admin_seen_orders', JSON.stringify(__seenOrders.slice(-200))); }catch(e){} }
function __saveSeenLeads(){ try{ localStorage.setItem('sk_admin_seen_leads', JSON.stringify(__seenLeads.slice(-200))); }catch(e){} }
function __beep(){
  try{
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    [880, 1174].forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.18);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.4);
      o.connect(g); g.connect(ctx.destination); o.start(ctx.currentTime + i * 0.18); o.stop(ctx.currentTime + i * 0.18 + 0.45);
    });
  }catch(e){}
}
function notifyAdmin(title, body, tag){
  /* browser notification (if allowed) */
  try{
    if ('Notification' in window && Notification.permission === 'granted'){
      new Notification(title, { body, tag, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png' });
    }
  }catch(e){}
  /* in-page toast + beep so it is never missed */
  try{ toast('🔔 ' + title + (body ? ' — ' + body : '')); }catch(e){}
  try{ __beep(); }catch(e){}
}
function enableAdminAlerts(){
  if (!('Notification' in window)){ toast('⚠️ This browser does not support notifications'); return; }
  Notification.requestPermission().then(p => {
    toast(p === 'granted' ? '🔔 Order alerts ON — new orders will notify you!' : '⚠️ Notifications blocked — enable in browser settings');
  }).catch(() => {});
}
function watchNewOrders(list){
  try{
    (list || []).forEach(o => {
      const id = o && o.id;
      if (!id || __seenOrders.indexOf(id) !== -1) return;
      __seenOrders.push(id);
      const c = o.customer || {};
      const t = o.totals || {};
      const items = (o.items || []).map(i => i.name).join(', ');
      notifyAdmin('🛒 New Order! ' + (o.id || ''), (c.name || '') + ' • ' + money(t.grand || 0) + (c.phone ? ' • ' + c.phone : '') + (items ? ' • ' + items : ''), 'new-order');
    });
    __saveSeenOrders();
  }catch(e){}
}
function watchNewLeads(list){
  try{
    (list || []).forEach(l => {
      const key = (l && (l.lid || (l.phone + '|' + (l.date || '')))) || '';
      if (!key || __seenLeads.indexOf(key) !== -1) return;
      __seenLeads.push(key);
      notifyAdmin('📋 New Lead!', (l.name || '') + ' • ' + (l.phone || '') + (l.code ? ' • ' + l.code : ''), 'new-lead');
    });
    __saveSeenLeads();
  }catch(e){}
}
/* 🧾 COURIER LABEL — print/download a shipping label for an order:
   From: SK Sarees (store) • To: customer address • product details. */
function printOrderLabel(id){
  try{
    const o = adminAllOrders().find(x => x.id === id);
    if (!o){ toast('⚠️ Order not found'); return; }
    const c = o.customer || {};
    const items = (o.items || []).map(i => {
      const p = byId(i.id) || {};
      return { name: i.name || p.name || 'Saree', sku: p.sku || i.sku || i.id || '', qty: i.qty || 1, price: i.price || p.price || 0 };
    });
    const rows = items.map(i => '<tr><td>' + esc(i.name) + '</td><td>' + esc(i.sku) + '</td><td>' + i.qty + '</td><td>' + money(i.price * i.qty) + '</td></tr>').join('');
    const t = o.totals || {};
    const label = '<!doctype html><html><head><meta charset="utf-8"><title>Courier Label ' + esc(o.id) + '</title>' +
      '<style>' +
      'body{font-family:Arial,sans-serif;margin:0;padding:18px;color:#000}' +
      '.label{border:2px solid #000;border-radius:10px;padding:16px;max-width:760px;margin:0 auto}' +
      'h2{margin:0 0 10px;font-size:1.3rem}' +
      '.box{border:1px solid #999;border-radius:8px;padding:10px;margin-bottom:12px}' +
      '.box b{font-size:1.05rem;display:block;margin-bottom:4px}' +
      '.box p{margin:2px 0;font-size:.95rem}' +
      '.from{background:#f0f0f0}.to{background:#fff8e1;border:2px solid #000}' +
      'table{width:100%;border-collapse:collapse;font-size:.9rem}' +
      'td,th{border:1px solid #999;padding:6px 8px;text-align:left}' +
      '.foot{margin-top:12px;font-size:.85rem;text-align:center}' +
      '@media print{body{padding:0}.label{border-radius:0}}' +
      '</style></head><body><div class="label">' +
      '<h2>📦 SK Sarees — Courier Label</h2>' +
      '<div class="box from"><b>FROM — SK SAREES</b>' +
        '<p>2/130, Thoothanoor, Edanganasalai, Salem, Tamil Nadu 637502</p>' +
        '<p>📞 +91 78679 15699</p></div>' +
      '<div class="box to"><b>TO — ' + esc(c.name || '') + '  •  📞 ' + esc(c.phone || '') + '</b>' +
        '<p>' + esc(c.address || '') + (c.pincode ? ' — ' + esc(c.pincode) : '') + '</p>' +
        '<p>PIN: ' + esc(c.pincode || '') + '</p></div>' +
      '<div class="box"><b>Order ' + esc(o.id) + '</b>' +
        '<p>' + fmtDT(o.date) + ' • Payment: ' + (o.payment || '').toUpperCase() + ' • Status: ' + esc((o.status || 'placed').replace('_', ' ')) + '</p>' +
        '<table><thead><tr><th>Product</th><th>SKU</th><th>Qty</th><th>Amount</th></tr></thead><tbody>' + rows +
        '</tbody></table>' +
        '<p style="margin-top:8px">Total: <b>' + money(t.grand || 0) + '</b> (incl. ship ' + money(t.shipping || 0) + (t.codFee ? ' + COD ' + money(t.codFee) : '') + ')</p></div>' +
      '<p class="foot">SK Sarees • Edanganasalai, Salem • www.sksaree.shop • Thank you! 🪡</p>' +
      '</div><script>window.onload = function(){ setTimeout(function(){ window.print(); }, 400); };<\/script></body></html>';
    const win = window.open('', '_blank', 'width=820,height=900');
    if (win){ win.document.write(label); win.document.close(); }
    else { toast('⚠️ Pop-up blocked — allow pop-ups for this site'); }
  }catch(e){ toast('⚠️ Could not open label'); }
}
/* 🔄 24-HR LIVE SYNC — any edit in the admin (this tab, another tab, or another
   device via Firestore) reflects immediately: storage events, focus, and a
   periodic refresh keep orders + products + resellers + leads live. */
function enableLiveSync(){
  try{
    window.addEventListener('storage', () => { if (document.visibilityState === 'visible') refreshAdminTab(); });
    window.addEventListener('focus', () => { refreshAdminTab(); });
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') refreshAdminTab(); });
    setInterval(() => { try{ if (document.visibilityState === 'visible') refreshAdminTab(); }catch(e){} }, 60000);
  }catch(e){}
}
function refreshAdminTab(){
  try{
    if (adminTab === 'orders'){ renderFilters(); renderOrderList(); }
    else if (adminTab === 'products') renderProducts();
    else if (adminTab === 'resellers') renderResellers();
    else if (adminTab === 'leads') renderLeads();
    else if (adminTab === 'push') renderPush();
    else if (adminTab === 'coupons') renderCoupons();
    else if (adminTab === 'feed') renderFeed();
  }catch(e){}
}
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
    /* 🚚 auto-delivery watcher (every 30s) */
    try{ setTimeout(adminAutoDeliver, 4000); setInterval(adminAutoDeliver, 30000); }catch(e){}
    /* 🔄 24-hr live sync */
    try{ enableLiveSync(); }catch(e){}
  } else {
    renderLogin();
  }
}document.addEventListener('DOMContentLoaded', adminInit);

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
    '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap"><button type="button" class="btn btn-outline btn-sm" id="btnAlerts" style="width:auto;min-width:0;padding:5px 10px;font-size:.72rem">🔔 Order Alerts</button><span class="sync-pill online" id="cloudPill">💾 Saved on device</span></div></div>' +
    '<div class="admin-tabs">' +
      '<button type="button" class="admin-tab on" id="tabOrders">📋 Orders</button>' +
      '<button type="button" class="admin-tab" id="tabProducts">🛍️ Products</button>' +
      '<button type="button" class="admin-tab" id="tabReviews">⭐ Reviews</button>' +
      '<button type="button" class="admin-tab" id="tabMetaAds">📣 Meta Ads</button>' +
      '<button type="button" class="admin-tab" id="tabStatus">📱 Status Posts</button>' +
      '<button type="button" class="admin-tab" id="tabGrowth">📈 Growth</button>' +
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
  document.getElementById('tabStatus').addEventListener('click', () => switchTab('status'));
  document.getElementById('tabGrowth').addEventListener('click', () => switchTab('growth'));
  document.getElementById('logoutBtn').addEventListener('click', () => { LS.set('sk_admin', '0'); location.reload(); });
  const ab = document.getElementById('btnAlerts');
  if (ab) ab.addEventListener('click', () => enableAdminAlerts());
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
      watchNewOrders(fsOrders);                    /* 🔔 new order alert */
      if (adminTab === 'orders'){ renderFilters(); renderOrderList(); }
    });
    /* local device orders also trigger the alert */
    try{
      Store.orders.forEach(o => { if (o && o.id && __seenOrders.indexOf(o.id) === -1){ __seenOrders.push(o.id); notifyAdmin('🛒 New Order! ' + o.id, ((o.customer||{}).name||'') + ' • ' + money((o.totals||{}).grand||0), 'new-order'); } });
      __saveSeenOrders();
    }catch(e){}
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
        fsLeads = l; watchNewLeads(l);             /* 🔔 new lead alert */
        if (adminTab === 'leads') renderLeads();
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
  ['tabOrders','tabProducts','tabReviews','tabMetaAds','tabStatus','tabGrowth','tabPush','tabResellers','tabLeads','tabFeed','tabCoupons','tabDashboard'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('on', id === 'tab' + t[0].toUpperCase() + t.slice(1));
  });
  const body = document.getElementById('tabBody'); if (!body) return;
  try{
    if (t === 'orders'){ renderFilters(); renderOrderList(); }
    else if (t === 'products') renderProducts();
    else if (t === 'reviews') renderReviews();
    else if (t === 'coupons') renderCoupons();
    else if (t === 'resellers'){ rsPage = 1; renderResellers(); }
    else if (t === 'feed') renderFeed();
    else if (t === 'leads') renderLeads();
    else if (t === 'push') renderPush();
    else if (t === 'metaads') renderMetaAds();
    else if (t === 'status') renderStatusPosts();
    else if (t === 'growth') renderGrowth();
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

/* 🚚 AUTO-DELIVERY (admin): any shipped order whose 7-day window has passed is
   auto-marked delivered (local + Firestore) — the owner never has to remember. */
function adminAutoDeliver(){
  try{
    let changed = 0;
    adminAllOrders().forEach(o => {
      if (o.status !== 'shipped') return;
      const by = o.deliverBy || (o.dispatchedAt ? new Date(new Date(o.dispatchedAt).getTime() + 7 * 864e5).toISOString() : '');
      if (!by || Date.now() < new Date(by).getTime()) return;
      o.status = 'delivered';
      o.deliveredAt = o.deliveredAt || new Date().toISOString();
      const fi = (fsOrders || []).findIndex(x => x.id === o.id);
      if (fi >= 0) fsOrders[fi] = o;
      else Store.saveOrders();
      if (FS.enabled()) FS.updateStatus(o.id, 'delivered', { deliveredAt: o.deliveredAt }).catch(() => {});
      changed++;
      notifyAdmin('🚚 Auto-Delivered', o.id + ' — 7-day window passed', 'auto-deliver');
    });
    if (changed && adminTab === 'orders'){ renderFilters(); renderOrderList(); }
  }catch(e){}
}
function adminAllOrders(){
  const localMap = {};
  try{ Store.orders.forEach(o => { if (o && o.id) localMap[o.id] = o; }); }catch(e){}
  const merged = [];
  try{
    (fsOrders || []).forEach(f => {
      try{ if (f && f.id && orderAgeDays(f) <= 30) merged.push(Object.assign({}, f, localMap[f.id] || {})); }catch(e){}
    });
    try{
      Store.orders.forEach(o => {
        if (o && o.id && orderAgeDays(o) <= 30 && !merged.some(x => x.id === o.id)) merged.push(o);
      });
    }catch(e){}
  }catch(e){}
  merged.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  return merged;
}
function renderFilters(){
  const all = adminAllOrders();
  const counts = { all: all.length, placed: 0, pending: 0, confirmed: 0, shipped: 0, delivered: 0, cod: 0, cancelled: 0 };
  all.forEach(o => { const s = o.status || 'placed'; if (counts[s] !== undefined) counts[s]++; });
  all.forEach(o => { if ((o.payment || '') === 'cod') counts.cod++; });
  const defs = [
    ['pending', '⏳ Payment Pending (' + counts.pending + ')'], ['confirmed', '✅ Confirmed (' + counts.confirmed + ')'],
    ['shipped', '🚚 Shipped (' + counts.shipped + ')'], ['delivered', '✔ Delivered (' + counts.delivered + ')'],
    ['cod', '💵 COD (' + counts.cod + ')'], ['cancelled', '❌ Cancelled (' + counts.cancelled + ')'],
    ['all', '📦 All (' + counts.all + ')'], ['placed', '🆕 New (' + counts.placed + ')'],
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
  const list = orderFilter === 'all' ? all
    : orderFilter === 'cod' ? all.filter(o => (o.payment || '') === 'cod')
    : all.filter(o => (o.status || 'placed') === orderFilter);
  if (!list.length){
    wrap.innerHTML = '<div class="empty"><div class="e-ic">📭</div><b>No orders here yet</b></div>';
    return;
  }
  const visible = list.slice(0, orderPage * ORDER_PAGE_SIZE);
  const html = [];
  visible.forEach(o => {
    try{ html.push(orderCard(o)); }catch(e){ /* skip a corrupt order — never break the list */ }
  });
  wrap.innerHTML = html.join('') || '<div class="empty"><div class="e-ic">📭</div><b>No orders here yet</b></div>';
  const mo = document.getElementById('moreOrders');
  if (mo){
    const hasMore = orderPage * ORDER_PAGE_SIZE < list.length;
    mo.style.display = hasMore ? 'inline-flex' : 'none';
    mo.onclick = () => { orderPage++; renderOrderList(); };
  }
}
function orderCard(o){
  const st = o.status || 'placed';
  const c = o.customer || {}; const t = o.totals || {};
  /* 🖼️ per-item rows: saree name, SKU, photo preview + WhatsApp share photo */
  const rows = (o.items || []).map(i => {
    const p = byId(i.id) || {};
    /* 🔧 fix TDZ shadowing: capture the global img() fallback BEFORE naming a
       local const — a product missing from the catalog used to crash the card */
    const fallbackPic = (typeof img === 'function') ? img('printed-cotton.jpg') : 'images/products/printed-cotton.jpg';
    const pic = p.img || i.img || fallbackPic;
    const sku = p.sku || i.sku || i.id || '';
    const prodLink = (p.img ? (repoBase() + 'product.html?id=' + encodeURIComponent(i.id)) : '#');
    /* generic share (no target number) → admin can forward to anyone / any group */
    const shareMsg = 'https://wa.me/?text=' + encodeURIComponent('🪡 SK Sarees — ' + (i.name || '') + '\nSKU: ' + (sku || '') + '\nPrice: ' + money(i.price || 0) + (p.img ? '\n👉 ' + location.origin + prodLink : '') + '\n\nஉங்களுக்கு இந்த சேலை பிடிச்சிருக்கா? சொல்லுங்க! 😊');
    return '<div class="order-item">' +
      '<a href="' + prodLink + '" target="_blank" rel="noopener" title="Open product page"><img src="' + esc(pic) + '" alt="' + esc(i.name) + '" loading="lazy" decoding="async" width="100" height="100" style="width:100px;height:100px;object-fit:cover;border-radius:8px" onerror="imgSafe(this)" onload="imgLoaded(this)"></a>' +
      '<div class="oi-info"><b>' + esc(i.name) + '</b>' +
      '<small>SKU: ' + esc(sku) + (i.colour ? ' • 🎨 ' + esc(i.colour) : '') + '</small>' +
      '<small>' + money(i.price || 0) + ' × ' + (i.qty || 1) + '</small></div>' +
      '<a class="btn btn-wa btn-sm" style="width:auto;min-width:0;padding:6px 10px;font-size:.7rem" href="' + shareMsg + '" target="_blank" rel="noopener" title="Share saree photo on WhatsApp">📤 Share</a>' +
    '</div>';
  }).join('');
  return '<div class="order-card">' +
    '<div class="oc-top"><b>#' + o.id + '</b><span class="status-pill status-' + st + '">' + esc(st.replace(/_/g, ' ')) + '</span></div>' +
    (o.paidConfirmed ? '<div class="oc-items" style="color:var(--green);font-weight:800">✅ Customer says PAID — verify & confirm</div>' : '') +
    '<div class="oc-items">' + fmtDT(o.date || o.createdAt) + '<br>' +
      '👤 <b style="color:#000">' + esc(c.name || '') + '</b><br>' +
      '📞 ' + esc(c.phone || '') + '<br>' +
      '🏠 <b style="color:#000;font-weight:800">' + esc(c.address || '') + ' — ' + esc(c.pincode || '') + '</b><br>' +
      '<b>' + money(t.grand || 0) + '</b> (' + (o.payment || '').toUpperCase() + ')</div>' +
    '<div class="order-items">' + rows + '</div>' +
    '<select data-status="' + o.id + '">' +
      '<option value="placed"' + (st === 'placed' ? ' selected' : '') + '>Placed</option>' +
      '<option value="pending"' + (st === 'pending' ? ' selected' : '') + '>⏳ Payment Pending</option>' +
      '<option value="confirmed"' + (st === 'confirmed' ? ' selected' : '') + '>Confirmed</option>' +
      '<option value="shipped"' + (st === 'shipped' ? ' selected' : '') + '>Shipped</option>' +
      '<option value="delivered"' + (st === 'delivered' ? ' selected' : '') + '>Delivered</option>' +
      '<option value="cancelled"' + (st === 'cancelled' ? ' selected' : '') + '>❌ Cancelled</option>' +
    '</select>' +
    '<div class="oc-btns">' +
      '<a class="btn btn-wa btn-sm" href="' + waLink(TPL_CONFIRM(o), c.phone) + '" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true" style="vertical-align:-2px;margin-right:4px"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>Send Confirmation</a>' +
      '<a class="btn btn-outline btn-sm" href="' + waLink(TPL_DELIVERY(o), c.phone) + '" target="_blank" rel="noopener">🚚 Send Delivery Reminder</a>' +
      '<button type="button" class="btn btn-buy btn-sm" data-label="' + esc(o.id) + '" style="width:auto">🧾 Courier Label</button>' +
    '</div></div>';
}

function updateStatus(id, status){
  /* find in cloud orders (fsOrders) OR device orders (Store.orders) */
  const fi = (fsOrders || []).findIndex(x => x.id === id);
  const o = fi >= 0 ? fsOrders[fi] : Store.orders.find(x => x.id === id);
  if (!o) return;
  o.status = status;
  if (status === 'shipped'){
    dispatchOrder(o);
    o.dispatchedAt = o.dispatchedAt || new Date().toISOString();
    /* 🚚 auto-delivery: mark delivered automatically 7 days after dispatch */
    if (!o.deliverBy) o.deliverBy = new Date(Date.now() + 7 * 864e5).toISOString();
    /* 💰 order shipped → reseller margin confirmed (was pending) */
    try{ confirmMarginOnShip(id); }catch(e){}
  }
  if (status === 'delivered') o.deliveredAt = o.deliveredAt || new Date().toISOString();
  if (status === 'cancelled'){ try{ cancelResellerMargin(id); }catch(e){} }
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

/* ============================ 🎨 AUTO COLOUR DETECTION ============================
   Reads a saree photo and finds its dominant colours (client-side, no server).
   The names match the shop's Colour filter, so detected colours automatically
   appear in the filter + product page colour chips. Works with:
     • same-origin images (your host, e.g. https://www.sksaree.shop/images/...)
     • CORS-enabled image hosts (img.crossOrigin)
     • data: URIs
   If the photo host blocks canvas reading (CORS), it falls back gracefully. */
const COLOR_PALETTE = [
  ['Red', 198, 40, 40], ['Maroon', 128, 0, 32], ['Wine', 114, 47, 55],
  ['Rose Pink', 233, 30, 99], ['Pink', 244, 143, 177], ['Magenta', 194, 24, 91],
  ['Purple', 123, 31, 162], ['Lavender', 156, 122, 200],
  ['Royal Blue', 25, 58, 148], ['Blue', 25, 118, 210], ['Sky Blue', 79, 195, 247], ['Navy', 26, 35, 126],
  ['Teal', 0, 137, 123], ['Peacock', 0, 105, 92],
  ['Emerald', 4, 99, 7], ['Green', 46, 125, 50], ['Sage', 140, 150, 120],
  ['Gold', 212, 175, 55], ['Mustard', 201, 162, 39], ['Yellow', 249, 168, 37],
  ['Orange', 239, 108, 0], ['Saffron', 245, 124, 0], ['Rust', 183, 65, 14], ['Coral', 255, 112, 67],
  ['Peach', 255, 204, 188], ['Brown', 109, 76, 65], ['Beige', 201, 183, 156],
  ['Cream', 245, 235, 220], ['Champagne', 247, 231, 206], ['Grey', 117, 117, 117],
  ['Silver', 176, 190, 197], ['Black', 33, 33, 33], ['White', 245, 245, 245],
];
/* nearest named colour (redmean weighted RGB distance) */
function nearestColourName(r, g, b){
  let best = 'Multi', bestD = Infinity;
  for (const c of COLOR_PALETTE){
    const dr = r - c[1], dg = g - c[2], db = b - c[3];
    const rm = (r + c[1]) / 2;
    const d = (2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db;
    if (d < bestD){ bestD = d; best = c[0]; }
  }
  return best;
}
/* detect dominant colours → array of names (up to 4) or null on failure */
function detectColoursFromImage(src, cb){
  try{
    src = String(src || '').trim();
    if (!src){ cb(null); return; }
    const img = new Image();
    const t = setTimeout(() => { try{ img.src = ''; }catch(e){} cb(null); }, 8000);
    if (/^https?:/i.test(src)) img.crossOrigin = 'anonymous';   /* data:/blob: cannot use crossOrigin */
    img.onload = function(){
      try{
        const W = 48, H = 48;
        const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
        const ctx = cv.getContext('2d', { willReadFrequently: true });
        if (!ctx){ clearTimeout(t); cb(null); return; }
        ctx.drawImage(img, 0, 0, W, H);
        let data;
        try{ data = ctx.getImageData(0, 0, W, H).data; }
        catch(e){ clearTimeout(t); cb(null); return; }           /* CORS-blocked */
        const buckets = {};
        const total = W * H;
        for (let i = 0; i < data.length; i += 4){
          const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
          if (a < 128) continue;
          const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
          const val = mx / 255;
          const sat = mx === 0 ? 0 : (mx - mn) / mx;
          if (val > 0.93 && sat < 0.12) continue;   /* white studio background */
          if (val < 0.06 || sat < 0.10) continue;   /* near-black / grey */
          if (mx === mn) continue;
          const d = mx - mn;
          let hue = (mx === r) ? ((g - b) / d) % 6 : (mx === g) ? (b - r) / d + 2 : (r - g) / d + 4;
          hue = (hue * 60 + 360) % 360;
          const key = Math.round(hue / 30);         /* 12 hue buckets */
          const bk = buckets[key] || (buckets[key] = { count: 0, sr: 0, sg: 0, sb: 0, sv: 0 });
          bk.count++; bk.sr += r; bk.sg += g; bk.sb += b; bk.sv += val;
        }
        const entries = Object.keys(buckets).map(k => {
          const bk = buckets[k];
          return { count: bk.count, score: bk.count * (bk.sv / bk.count), r: bk.sr / bk.count, g: bk.sg / bk.count, b: bk.sb / bk.count };
        }).sort((x, y) => y.score - x.score);
        const picked = [];
        entries.slice(0, 8).forEach(e => {
          if (e.count < total * 0.025) return;      /* ignore tiny specks */
          const name = nearestColourName(e.r, e.g, e.b);
          if (name && picked.indexOf(name) === -1) picked.push(name);
        });
        clearTimeout(t);
        cb(picked.length ? picked.slice(0, 4) : null);
      }catch(e){ clearTimeout(t); cb(null); }
    };
    img.onerror = function(){ clearTimeout(t); cb(null); };
    img.src = src;
  }catch(e){ cb(null); }
}
/* wires the 🎨 Auto-detect button + auto-run when an image URL is entered */
function wireAutoColour(imgId, colorsId, btnId){
  const btn = document.getElementById(btnId);
  const imgEl = document.getElementById(imgId);
  const colEl = document.getElementById(colorsId);
  if (!imgEl || !colEl) return;
  let timer = null;
  const run = (silent) => {
    const src = imgEl.value.trim();
    if (!src){ toast('⚠️ Add the image URL first'); return; }
    if (btn){ btn.disabled = true; btn.textContent = '⏳ Detecting colours…'; }
    detectColoursFromImage(src, names => {
      if (btn){ btn.disabled = false; btn.textContent = '🎨 Auto-detect colour from photo'; }
      if (names && names.length){
        colEl.value = names.join(', ');
        if (!silent) toast('🎨 Detected: ' + names.join(', ') + ' — saved to Colours ✔');
      } else if (!silent) {
        toast('⚠️ Could not read colours from this photo — type them manually');
      }
    });
  };
  if (btn) btn.addEventListener('click', () => run(false));
  imgEl.addEventListener('input', () => {          /* auto-run when URL pasted & Colours empty */
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (!colEl.value.trim() && /^https?:|^data:image\//i.test(imgEl.value.trim())) run(true);
    }, 700);
  });
  imgEl.addEventListener('blur', () => { if (!colEl.value.trim()) run(true); });
}

/* ============================ PRODUCTS ============================ */
function renderProducts(){
  document.getElementById('tabBody').innerHTML =
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">' +
      '<button type="button" class="btn btn-maroon btn-sm" id="btnAddProd" style="flex:1;min-width:130px">➕ Add Product</button>' +
      '<button type="button" class="btn btn-outline btn-sm" id="btnBulk" style="flex:1;min-width:130px">📥 Bulk Upload</button>' +
      '<button type="button" class="btn btn-ghost btn-sm" id="btnHideSel" style="flex:1;min-width:130px;color:#6b4c05;border:1.5px solid #e4c96a">🚫 Hide Selected (<span id="hideSelCount">0</span>)</button>' +
      '<button type="button" class="btn btn-ghost btn-sm" id="btnShowSel" style="flex:1;min-width:130px;color:var(--green);border:1.5px solid #bfe6cf">👁️ Show Selected</button>' +
      '<button type="button" class="btn btn-ghost btn-sm" id="btnDelSel" style="flex:1;min-width:130px;color:var(--red);border:1.5px solid #f0c4c4">🗑️ Delete Selected (<span id="delSelCount">0</span>)</button>' +
    '</div>' +
    '<p class="small muted" style="margin:2px 0 8px">🚫 Hidden products <b>never appear in the shop/feeds</b> and their links redirect customers to the home page. Use the checkboxes + Hide/Show/Delete buttons, or the 👁️/🚫 per-row toggle.</p>' +
    '<p class="small" id="storeHint" style="margin:0 0 8px;color:var(--maroon);font-weight:800"></p>' +
    '<input id="prodSearch" type="search" placeholder="🔍 Search products — name, SKU, category, colour…" autocomplete="off" value="' + esc(prodSearch) + '" style="width:100%;border:1.5px solid var(--line);border-radius:11px;padding:11px 13px;background:#fff;outline:none;margin-bottom:10px;font-size:15px">' +
    '<div class="bulk-panel" id="bulkPanel" style="display:none;background:#fff;border:1.5px dashed #d8b24e;border-radius:var(--r);padding:14px;margin-bottom:12px">' +
      '<h3 style="font-size:.95rem;margin-bottom:6px">📥 Bulk Upload Products</h3>' +
      '<p class="small muted" style="margin:6px 0">One product per line — <b>Name, Price, MRP, Image URL, Category, Badge</b> (SKU auto-generated). <b>To EDIT existing products</b>: download the CSV, edit, re-upload — rows matching an existing <b>SKU/id are updated</b> (name, price, stock, badge…), new ids are added. <b>🎨 Colours are auto-detected from each photo.</b></p>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">' +
        '<button type="button" class="btn btn-maroon btn-sm" id="btnExportCsv" style="width:auto">⬇️ Download Products CSV (edit)</button>' +
        '<button type="button" class="btn btn-outline btn-sm" id="btnCsv" style="width:auto">📄 Upload CSV File (add/update)</button>' +
        '<button type="button" class="btn btn-outline btn-sm" id="btnCatalog" style="width:auto">📦 Upload catalog.json</button>' +
        '<button type="button" class="btn btn-buy btn-sm" id="btnExportCatalog" style="width:auto">⬇️ Download catalog.json (for GitHub)</button>' +
        '<a class="btn btn-ghost btn-sm" id="btnCsvTpl" href="#" style="width:auto">⬇️ CSV template</a>' +
      '</div>' +
      '<textarea id="bulkText" placeholder="Soft Silk Saree, 1499, 2299, https://…, soft-silk, New&#10;Wedding Kanjivaram, 2899, 4599, https://…, bridal-sarees, Bestseller&#10;https://www.sksaree.shop/images/products/kanchipuram-silk.jpg" style="width:100%;border:1.5px solid var(--line);border-radius:11px;padding:10px;min-height:110px;font-size:.8rem;background:#fff;outline:none;font-family:inherit"></textarea>' +
      '<button type="button" class="btn btn-maroon btn-sm" id="btnImport" style="margin-top:10px">📥 Import &amp; Auto-detect Colours</button>' +
      '<p class="small" id="bulkResult" style="margin-top:8px"></p></div>' +
    '<div class="prod-table-wrap"><table class="prod-table"><thead><tr><th style="width:38px"><input type="checkbox" id="prodSelAll" title="Select all"></th><th>Photo</th><th>Product</th><th>Price</th><th>Stock</th><th>Badge</th><th>Status</th><th></th></tr></thead><tbody id="prodBody"></tbody></table></div>' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;gap:8px;flex-wrap:wrap">' +
      '<p class="small muted" id="prodCount" style="margin:0"></p>' +
      '<button type="button" class="btn btn-outline btn-sm" id="moreProds" style="display:none">Load More Products ↓</button>' +
    '</div>';
  renderProdBody();
  /* 💾 storage hint — uploaded photos live in this browser (no server) */
  try{
    const h = document.getElementById('storeHint');
    if (h){
      const mb = storageMB();
      const imgCount = PRODUCTS.filter(p => /^data:image\//.test(p.img || '')).length;
      h.innerHTML = '💾 This browser stores <b>' + PRODUCTS.length + ' products</b>' +
        (imgCount ? ' • <b>' + imgCount + ' uploaded photos</b>' : '') +
        ' • used <b>' + mb.toFixed(1) + ' MB</b> of ~5 MB' +
        (mb > 3.5 ? ' <span style="color:var(--red)">⚠️ getting full — use image URLs (https://…sksaree.shop/images/) for new products, or export catalog.json &amp; clear the browser once deployed.</span>' : '');
    }
  }catch(e){}
  document.getElementById('btnAddProd').addEventListener('click', openAddProduct);
  document.getElementById('btnBulk').addEventListener('click', () => { document.getElementById('bulkPanel').style.display = document.getElementById('bulkPanel').style.display === 'none' ? 'block' : 'none'; });
  document.getElementById('btnImport').addEventListener('click', importBulk);
  /* ⬇️ export catalog.json for GitHub — refresh + download */
  const expCsv = document.getElementById('btnExportCsv');
  if (expCsv) expCsv.addEventListener('click', () => { try{ exportProductsCsv(); }catch(e){ toast('⚠️ Export failed'); } });
  const expBtn = document.getElementById('btnExportCatalog');
  if (expBtn) expBtn.addEventListener('click', () => {
    refreshFeedCache();
    const blob = new Blob([feedJson()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'catalog.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    toast('⚡ catalog.json downloaded — upload to your GitHub repo root');
  });
  /* 📄 CSV file upload */
  const csvIn = document.createElement('input');
  csvIn.type = 'file'; csvIn.accept = '.csv,.tsv,.txt'; csvIn.style.display = 'none';
  document.body.appendChild(csvIn);
  csvIn.addEventListener('change', () => { const f = csvIn.files && csvIn.files[0]; if (f) importCsvFile(f); csvIn.value = ''; });
  document.getElementById('btnCsv').addEventListener('click', () => csvIn.click());
  /* 📦 catalog.json upload */
  const catIn = document.createElement('input');
  catIn.type = 'file'; catIn.accept = '.json'; catIn.style.display = 'none';
  document.body.appendChild(catIn);
  catIn.addEventListener('change', () => { const f = catIn.files && catIn.files[0]; if (f) importCatalogFile(f); catIn.value = ''; });
  document.getElementById('btnCatalog').addEventListener('click', () => catIn.click());
  /* ⬇️ CSV template */
  const tpl = document.getElementById('btnCsvTpl');
  if (tpl) tpl.addEventListener('click', e => {
    e.preventDefault();
    const csv = 'Name,Price,MRP,Image URL,Category,Badge,SKU,Stock,Colours\nSoft Silk Saree,1499,2299,https://www.sksaree.shop/images/products/kanchipuram-silk.jpg,soft-silk,New,,10,"Red, Gold"\nWedding Kanjivaram,2899,4599,https://www.sksaree.shop/images/products/banarasi-purple.jpg,bridal-sarees,Bestseller,,8,Maroon\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'sk-sarees-products-template.csv';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  });
  document.getElementById('prodSearch').addEventListener('input', e => { prodSearch = e.target.value; prodPage = 1; renderProdBody(); });
  document.getElementById('btnDelSel').addEventListener('click', () => {
    const sel = Array.from(document.querySelectorAll('.prod-sel:checked')).map(cb => cb.value);
    if (!sel.length){ toast('⚠️ Select products first'); return; }
    if (!confirm('Delete ' + sel.length + ' selected product(s)?')) return;
    PRODUCTS = PRODUCTS.filter(p => !sel.includes(p.id));
    saveProducts(PRODUCTS); refreshFeedCache(); prodPage = 1; renderProdBody(); toast('🗑️ ' + sel.length + ' deleted');
  });
  /* 🚫 hide selected / 👁️ show selected (bulk) */
  const bulkHide = (hidden) => {
    const sel = Array.from(document.querySelectorAll('.prod-sel:checked')).map(cb => cb.value);
    if (!sel.length){ toast('⚠️ Tick products first'); return; }
    PRODUCTS.forEach(p => { if (sel.includes(p.id)) p.hidden = hidden; });
    saveProducts(PRODUCTS); refreshFeedCache(); renderProdBody();
    toast(hidden ? '🚫 ' + sel.length + ' hidden — links go to home' : '👁️ ' + sel.length + ' shown again');
  };
  const btnHide = document.getElementById('btnHideSel');
  if (btnHide) btnHide.addEventListener('click', () => bulkHide(true));
  const btnShow = document.getElementById('btnShowSel');
  if (btnShow) btnShow.addEventListener('click', () => bulkHide(false));
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
    '<tr' + (p.hidden ? ' style="opacity:.55;background:var(--bg)"' : '') + '><td><input type="checkbox" class="prod-sel" value="' + esc(p.id) + '"' + (p.hidden ? ' data-hid="1"' : '') + '></td>' +
    '<td><img src="' + esc(p.img) + '" alt="" loading="lazy" decoding="async" width="100" height="100" style="width:100px;height:100px;object-fit:cover;border-radius:8px" onerror="imgSafe(this)" onload="imgLoaded(this)"></td>' +
    '<td style="min-width:180px"><b>' + esc(p.name) + '</b><br><small class="muted">SKU: ' + esc(p.sku || p.id) + (p.hidden ? ' • 🚫 HIDDEN' : '') + '</small></td>' +
    '<td>' + money(p.price) + '</td>' +
    '<td class="' + (p.stock <= 5 ? 'low' : '') + '">' + (p.stock <= 5 ? '🔥 ' + p.stock : p.stock) + '</td>' +
    '<td>' + (p.badge ? esc(p.badge) : '—') + '</td>' +
    '<td>' + (p.hidden ? '<span class="status-pill status-placed">🚫 Hidden</span>' : '<span class="status-pill status-delivered">👁️ Visible</span>') + '</td>' +
    '<td><div style="display:flex;gap:6px"><button type="button" class="btn btn-outline btn-sm" data-editprod="' + p.id + '">✏️ Edit</button>' +
    '<button type="button" class="btn btn-ghost btn-sm" data-togglehide="' + p.id + '" title="' + (p.hidden ? 'Show again' : 'Hide — link goes to home') + '">' + (p.hidden ? '👁️' : '🚫') + '</button>' +
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
    '<div class="field"><label>🖼️ Main Image — upload from phone/computer <b>or</b> paste URL</label><input id="apImg" placeholder="Paste https://… or tap Upload Photo"></div>' +
    '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:-2px 0 10px">' +
      '<button type="button" class="btn btn-maroon btn-sm" id="apPhoto" style="width:auto;min-width:0;min-height:32px;padding:5px 14px;font-size:.74rem">📷 Upload Photo</button>' +
      '<button type="button" class="btn btn-ghost btn-sm" id="apAutoCol" style="width:auto;min-width:0;min-height:30px;padding:4px 12px;font-size:.72rem">🎨 Auto-detect colour from photo</button>' +
      '<small class="muted" style="color:var(--green);font-weight:700" id="apPhotoHint" style="display:none">✅ Photo ready — auto-detect colours!</small>' +
    '</div>' +
    '<div class="field"><label>➕ Extra Image 1 (optional — gallery thumbnail)</label><input id="apImg2" placeholder="https://…"></div>' +
    '<div class="field"><label>➕ Extra Image 2 (optional — gallery thumbnail)</label><input id="apImg3" placeholder="https://…"></div>' +
    '<div class="field"><label>Video URL (YouTube — optional)</label><input id="apVideo" placeholder="https://youtube.com/watch?v=…"></div>' +
    '<div class="field"><label>🎨 Colours (comma separated)</label><input id="apColors" placeholder="e.g. Red, Gold — or tap Auto-detect"></div>' +
    '<div class="field"><label>Colour-wise stock (optional — auto-deduct on order)</label><input id="apColStock" placeholder="e.g. Red:3, Blue:2 — leave empty to use single stock"></div>' +
    '<div class="field"><label>Stock</label><input id="apStock" type="number" value="10"></div>' +
    '<label style="display:flex;gap:8px;align-items:center;font-size:.85rem;font-weight:700;margin-bottom:10px"><input type="checkbox" id="apHidden" style="width:18px;height:18px"> 🚫 Hidden — customers get redirected to home, hidden from shop/feeds</label>' +
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
      colors: document.getElementById('apColors').value.split(',').map(s => s.trim()).filter(Boolean),
      colourStock: document.getElementById('apColStock').value,
      hidden: document.getElementById('apHidden').checked,
    });
    PRODUCTS.unshift(np); saveProducts(PRODUCTS);
    refreshFeedCache();
    closeModal(); prodPage = 1; renderProdBody(); toast('✅ Product added');
  });
  wireAutoColour('apImg', 'apColors', 'apAutoCol');
  wirePhotoUpload('apImg', 'apPhoto', 'apPhotoHint');
}
/* 📷 photo upload from phone/computer → resized data-URI (no server needed).
   Max width/height 900px, JPEG q0.82 — small enough for localStorage & catalog.json */
function photoToDataURI(file, cb){
  try{
    if (!file || !/^image\//.test(file.type)){ cb(null, '⚠️ Not an image file'); return; }
    const rd = new FileReader();
    rd.onload = () => {
      const img = new Image();
      const t = setTimeout(() => cb(null, '⚠️ Could not read image (timeout)'), 8000);   /* 🔥 never hang */
      img.onload = () => {
        clearTimeout(t);
        try{
          const MAX = 900;
          let w = img.width, h = img.height;
          if (Math.max(w, h) > MAX){ const s = MAX / Math.max(w, h); w = Math.round(w * s); h = Math.round(h * s); }
          const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
          const ctx = cv.getContext('2d');
          if (!ctx){ cb(null, '⚠️ Canvas not available'); return; }
          ctx.drawImage(img, 0, 0, w, h);
          const uri = cv.toDataURL('image/jpeg', 0.82);
          cb(uri, null);
        }catch(e){ cb(null, '⚠️ Could not process image'); }
      };
      img.onerror = () => { clearTimeout(t); cb(null, '⚠️ Could not read image'); };
      img.src = String(rd.result || '');
    };
    rd.onerror = () => cb(null, '⚠️ Could not read file');
    rd.readAsDataURL(file);
  }catch(e){ cb(null, '⚠️ Upload failed'); }
}
function wirePhotoUpload(imgId, btnId, hintId){
  const btn = document.getElementById(btnId);
  const imgEl = document.getElementById(imgId);
  const hint = document.getElementById(hintId);
  if (!btn || !imgEl) return;
  const fileIn = document.createElement('input');
  fileIn.type = 'file';
  fileIn.accept = 'image/*';
  fileIn.style.display = 'none';
  document.body.appendChild(fileIn);
  fileIn.addEventListener('change', () => {
    const f = fileIn.files && fileIn.files[0];
    if (!f) return;
    btn.disabled = true; btn.textContent = '⏳ Uploading…';
    photoToDataURI(f, (uri, err) => {
      btn.disabled = false; btn.textContent = '📷 Upload Photo';
      if (err){ toast(err); return; }
      imgEl.value = uri;
      if (hint) hint.style.display = 'block';
      toast('✅ Photo ready — now tap "🎨 Auto-detect colour from photo"');
      /* auto-detect colours from the uploaded photo too */
      try{
        const colEl = document.getElementById(imgId === 'apImg' ? 'apColors' : 'epColors');
        if (colEl && !colEl.value.trim() && typeof detectColoursFromImage === 'function'){
          detectColoursFromImage(uri, names => { if (names && names.length) colEl.value = names.join(', '); });
        }
      }catch(e){}
    });
  });
  btn.addEventListener('click', () => fileIn.click());
}
/* current localStorage usage (MB) — shows how much room photos have left */
function storageMB(){
  try{
    let bytes = 0;
    for (let i = 0; i < localStorage.length; i++){
      const k = localStorage.key(i);
      bytes += (k.length + (localStorage.getItem(k) || '').length) * 2;
    }
    return bytes / (1024 * 1024);
  }catch(e){ return 0; }
}
/* one bulk line/row → product (throws Error with message) */
function bulkPartsToProduct(parts){
  if (!parts || !parts.length) throw new Error('empty');
  const url = (parts.find(x => /^https?:\/\//i.test(x)) || '').trim();
  if (!url) throw new Error('no image URL');
  let name, price, mrp, cat, badge, sku, stock, colors, colourStock;
  if (parts.length >= 3 && !/^https?:\/\//i.test(parts[0])){
    /* standard: Name, Price, MRP, Image, Category, Badge, SKU, Stock, Colours */
    name = parts[0];
    price = +parts[1] || 0;
    mrp = +parts[2] || 0;
    cat = parts[3] || 'daily';
    badge = parts[5] || '';
    sku = parts[6] || '';
    stock = +parts[7];
    colors = parts[8] || '';
  } else {
    /* short line: image URL (+ optional name / price) */
    const nonUrl = parts.filter(x => !/^https?:\/\//i.test(x));
    const nums = nonUrl.map(x => +x).filter(Number.isFinite);
    name = nonUrl.find(x => !Number.isFinite(+x)) || '';
    price = nums[0] || 999;
    mrp = nums[1] || Math.round(price * 1.6);
    cat = 'daily';
    badge = '';
    sku = '';
    stock = 0;
  }
  if (!name){ sku = sku || nextSku(); name = 'Saree ' + sku; }
  if (!(price > 0)) price = 999;
  if (!(mrp > price)) mrp = Math.round(price * 1.6);
  const np = normalizeProduct({ name, price, mrp, cat, img: url, badge, sku, stock: stock || undefined, colors: colors || undefined });
  if (!np.id) throw new Error('no id');
  return np;
}
function importBulk(){
  const res = document.getElementById('bulkResult'); if (!res) return;
  const lines = document.getElementById('bulkText').value.trim().split(/\r?\n/).filter(l => l.trim());
  let added = 0, errors = [], imported = [];
  lines.forEach((line, i) => {
    try{
      const parts = line.includes('\t') ? line.split('\t').map(x => x.trim()).filter(Boolean) : parseCsvLine(line);
      const np = bulkPartsToProduct(parts);
      PRODUCTS.unshift(np);
      imported.push(np);
      added++;
    }catch(e){ errors.push('Line ' + (i + 1)); }
  });
  finishBulkImport(imported, errors, added, res);
}
/* shared finish: save + refresh + 🎨 auto-detect colours from each photo */
function finishBulkImport(imported, errors, added, res){
  if (!res) res = document.getElementById('bulkResult');
  if (added){ saveProducts(PRODUCTS); refreshFeedCache(); prodPage = 1; renderProdBody(); }
  if (!added){ res.innerHTML = '⚠️ Nothing imported' + (errors.length ? ': ' + errors.join('; ') : '') + ' — check the format (Name, Price, MRP, Image URL…)'; return; }
  res.innerHTML = '✅ Imported <b>' + added + '</b> products' +
    '<br><small class="muted">SKUs auto-generated • 🎨 detecting colours from photos…</small>';
  toast('📥 ' + added + ' imported — detecting colours…');
  let done = 0, okCol = 0;
  const next = (idx) => {
    if (idx >= imported.length){
      res.innerHTML = '✅ Imported <b>' + added + '</b> products • 🎨 colours detected on <b>' + okCol + '/' + added + '</b>' + (errors.length ? ' • ⚠️ ' + errors.join('; ') : '');
      toast('📥 ' + added + ' imported • 🎨 colours: ' + okCol + '/' + added);
      return;
    }
    const p = imported[idx];
    const nextOne = () => { done++; next(idx + 1); };
    if (!p.img || (p.colors && p.colors.length > 1)){
      nextOne(); return;
    }
    detectColoursFromImage(p.img, names => {
      if (names && names.length){
        p.colors = names;
        p.color = names.join(' / ');
        okCol++;
      }
      done++;
      if (done % 5 === 0 || idx === imported.length - 1){
        try{ saveProducts(PRODUCTS); refreshFeedCache(); renderProdBody(); }catch(e){}
        res.innerHTML = '✅ Imported <b>' + added + '</b> products • 🎨 detecting colours… <b>' + done + '/' + added + '</b>';
      }
      next(idx + 1);
    });
  };
  next(0);
}
/* 📄 CSV/TSV file upload — works with Excel-exported files */
/* ⬇️ EXPORT products → CSV (edit in Excel/Sheets, re-upload to update) */
function exportProductsCsv(){
  try{
    const cols = ['id','sku','name','price','mrp','stock','cat','badge','fabric','color','colors','colourStock','img','desc'];
    const esc = v => { const s = String(v == null ? '' : v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s; };
    const rows = [cols.join(',')];
    PRODUCTS.filter(p => !p.hidden).forEach(p => {
      rows.push([p.id, p.sku || p.id, p.name, p.price, p.mrp || '', p.stock != null ? p.stock : '', p.cat || 'daily', p.badge || '',
        p.fabric || '', p.color || '', (p.colors || []).join('|'), p.colourStock ? Object.keys(p.colourStock).map(k=>k+':'+p.colourStock[k]).join('|') : '', p.img || '', p.desc || ''].map(esc).join(','));
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'sk-sarees-products-' + new Date().toISOString().slice(0,10) + '.csv';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    toast('⬇️ Products CSV downloaded (' + (PRODUCTS.filter(p=>!p.hidden).length) + ' rows) — edit & re-upload');
  }catch(e){ toast('⚠️ Could not export CSV'); }
}
function importCsvFile(file){
  let res = document.getElementById('bulkResult');
  if (!res){ /* panel not open — create a hidden result target so import still works */
    res = document.createElement('p'); res.id = 'bulkResult'; res.style.display = 'none'; document.body.appendChild(res);
  }
  const rd = new FileReader();
  rd.onload = () => {
    try{
      const text = String(rd.result || '');
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l && !/^\s*[,;\t]*\s*$/.test(l));
      if (!lines.length){ res.innerHTML = '⚠️ CSV file is empty'; return; }
      let imported = [], errors = [], added = 0, start = 0;
      /* header row detection: name/product … price … image */
      const first = parseCsvLine(lines[0]);
      const isHeader = first.some(h => /^(name|product|title)$/i.test(h)) && first.some(h => /^price$/i.test(h));
      if (isHeader) start = 1;
      let updated = 0, newCount = 0;
      for (let i = start; i < lines.length; i++){
        try{
          const parts = parseCsvLine(lines[i]);
          if (!parts || !parts.length) continue;
          /* EDIT mode first: if the FIRST column matches an existing product
             id or sku → update that product in place (name, price, stock…).
             Otherwise treat the row as a new product (add format). */
          const existing = PRODUCTS.find(x => x.id === parts[0] || x.sku === parts[0]);
          let np;
          if (existing){
            const c = existing;
            if (parts[1]) c.name = parts[1];
            if (parts[2]) c.price = Math.max(0, +parts[2] || c.price);
            if (parts[3]) c.mrp = Math.max(c.price, +parts[3] || c.mrp || c.price);
            if (parts[4] !== '') c.stock = Math.max(0, +parts[4] || c.stock || 0);
            if (parts[5]) c.cat = parts[5];
            if (parts[6] !== undefined) c.badge = parts[6] || '';
            if (parts[7]) c.fabric = parts[7];
            if (parts[8]) c.color = parts[8];
            if (parts[9]) c.colors = String(parts[9]).split('|').map(x=>x.trim()).filter(Boolean);
            if (parts[10]){
              const m = {};
              String(parts[10]).split('|').forEach(kv => { const x = kv.split(':'); if (x.length===2){ const k=x[0].trim(); m[k]=Math.max(0,+x[1]||0); } });
              c.colourStock = m;
            }
            if (parts[11]) c.img = parts[11];
            if (parts[12]) c.desc = parts[12];
            imported.push(c); updated++;
          } else {
            np = bulkPartsToProduct(parts);
            PRODUCTS.unshift(np);
            imported.push(np);
            newCount++;
          }
        }catch(e){ errors.push('Row ' + (i + 1)); }
      }
      added = newCount;
      if (isHeader) res.innerHTML = '📄 CSV processed: ' + updated + ' updated • ' + newCount + ' added';
      if (updated){ saveProducts(PRODUCTS); refreshFeedCache(); prodPage = 1; renderProdBody(); }
      finishBulkImport(imported, errors, added, res);
    }catch(e){ res.innerHTML = '⚠️ Could not read CSV file'; }
  };
  rd.onerror = () => res.innerHTML = '⚠️ Could not read file';
  rd.readAsText(file);
}
/* 📦 catalog.json upload — import the whole catalog from another device */
function importCatalogFile(file){
  const res = document.getElementById('bulkResult'); if (!res) return;
  const rd = new FileReader();
  rd.onload = () => {
    try{
      const data = JSON.parse(String(rd.result || ''));
      const list = Array.isArray(data) ? data : (data && Array.isArray(data.products) ? data.products : []);
      if (!list.length){ res.innerHTML = '⚠️ No products found in catalog.json'; return; }
      let added = 0, skipped = 0;
      list.forEach(raw => {
        try{
          if (!raw || !raw.id) return;
          if (isSampleId(raw.id)){ skipped++; return; }   /* never import demo products */
          const np = normalizeProduct(raw);
          const i = PRODUCTS.findIndex(x => x.id === np.id);
          if (i >= 0) PRODUCTS[i] = np; else PRODUCTS.unshift(np);
          added++;
        }catch(e){ skipped++; }
      });
      if (added){ saveProducts(PRODUCTS); refreshFeedCache(); prodPage = 1; renderProdBody(); }
      res.innerHTML = added ? '✅ catalog.json imported — <b>' + added + '</b> products loaded' + (skipped ? ' (' + skipped + ' demo/skipped)' : '') : '⚠️ Nothing to import';
      toast('📦 catalog.json — ' + added + ' products');
    }catch(e){ res.innerHTML = '⚠️ Invalid catalog.json — not a valid JSON file'; }
  };
  rd.onerror = () => res.innerHTML = '⚠️ Could not read file';
  rd.readAsText(file);
}
/* tiny CSV line parser (handles quoted commas) */
function parseCsvLine(line){
  const out = []; let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++){
    const ch = line[i];
    if (inQ){
      if (ch === '"'){ if (line[i + 1] === '"'){ cur += '"'; i++; } else inQ = false; }
      else cur += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ','){ out.push(cur.trim()); cur = ''; }
    else cur += ch;
  }
  out.push(cur.trim());
  return out;
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
    '<div class="field"><label>🖼️ Main Image — upload from phone/computer <b>or</b> paste URL</label><input id="epImg" value="' + esc(p.img) + '"></div>' +
    '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:-2px 0 10px">' +
      '<button type="button" class="btn btn-maroon btn-sm" id="epPhoto" style="width:auto;min-width:0;min-height:32px;padding:5px 14px;font-size:.74rem">📷 Upload Photo</button>' +
      '<button type="button" class="btn btn-ghost btn-sm" id="epAutoCol" style="width:auto;min-width:0;min-height:30px;padding:4px 12px;font-size:.72rem">🎨 Auto-detect colour from photo</button>' +
      '<small class="muted" style="color:var(--green);font-weight:700" id="epPhotoHint" style="display:none">✅ Photo ready — auto-detect colours!</small>' +
    '</div>' +
    '<div class="field"><label>➕ Extra Image 1</label><input id="epImg2" value="' + esc((p.images || [])[1] || '') + '" placeholder="https://…"></div>' +
    '<div class="field"><label>➕ Extra Image 2</label><input id="epImg3" value="' + esc((p.images || [])[2] || '') + '" placeholder="https://…"></div>' +
    '<div class="field"><label>Video URL (YouTube — optional)</label><input id="epVideo" value="' + esc(p.video ? 'https://www.youtube.com/watch?v=' + p.video : '') + '" placeholder="https://youtube.com/watch?v=…"></div>' +
    '<div class="field"><label>🎨 Colours (comma separated)</label><input id="epColors" value="' + esc((p.colors || []).join(', ')) + '"></div>' +
    '<div class="field"><label>Colour-wise stock (optional — auto-deduct on order)</label><input id="epColStock" value="' + esc(p.colourStock ? Object.keys(p.colourStock).map(k => k + ':' + p.colourStock[k]).join(', ') : '') + '" placeholder="e.g. Red:3, Blue:2"></div>' +
    '<label style="display:flex;gap:8px;align-items:center;font-size:.85rem;font-weight:700;margin-bottom:10px"><input type="checkbox" id="epHidden"' + (p.hidden ? ' checked' : '') + ' style="width:18px;height:18px"> 🚫 Hidden — customers get redirected to home, hidden from shop/feeds</label>' +
    '<button type="button" class="btn btn-maroon" id="epSave">💾 Save Changes</button>');
  document.getElementById('epSave').addEventListener('click', () => {
    const name = document.getElementById('epName').value.trim();
    const price = +document.getElementById('epPrice').value;
    if (!name || !(price > 0)){ toast('⚠️ Name and Price required'); return; }
    const idx = PRODUCTS.findIndex(x => x.id === id);
    if (idx >= 0){
      let csMap = null;
      try{
        const raw = String(document.getElementById('epColStock').value || '').trim();
        if (raw){
          const m = {};
          raw.split(',').forEach(part => {
            const kv = String(part).split(':');
            if (kv.length === 2){
              const k = kv[0].trim(), v = Math.round(+kv[1]);
              if (k && Number.isFinite(v)) m[k] = Math.max(0, v);
            }
          });
          if (Object.keys(m).length) csMap = m;
        }
      }catch(e){}
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
        colors: document.getElementById('epColors').value.split(',').map(s => s.trim()).filter(Boolean),
        colourStock: csMap,
        hidden: document.getElementById('epHidden').checked,
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
      refreshFeedCache();
      closeModal(); renderProdBody(); toast('✅ Product updated');
    }
  });
  wireAutoColour('epImg', 'epColors', 'epAutoCol');
  wirePhotoUpload('epImg', 'epPhoto', 'epPhotoHint');
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
  const page = (CONFIG.siteUrl || (location.origin + location.pathname.replace(/[^/]*$/, ''))) + '/';
  /* ✅ correct URL: product.html?id=X&coupon=Y — never a second ? */
  const link = page + 'product.html?id=' + encodeURIComponent(p.id) + (coupon ? '&coupon=' + encodeURIComponent(coupon) : '');
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
    const msg = '🎉 Hi ' + (r.name || 'there') + '! Your SK Sarees 5% OFF coupon (' + (r.code || 'SHARE50') + ') is ready — shop now & save! 🪡\n\n👉 https://www.sksaree.shop/shop.html';
    return '<div class="order-card">' +
      '<div class="oc-top"><b>👤 ' + esc(r.name || 'Customer') + '</b><span class="status-pill status-delivered">🎟️ ' + esc(r.code || 'SHARE50') + '</span></div>' +
      '<div class="oc-items">📱 ' + esc(r.phone) + ' • ' + when + '</div>' +
      '<div class="oc-btns" style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">' +
        '<a class="btn btn-wa btn-sm" style="width:auto" href="' + waLink(msg, r.phone) + '" target="_blank" rel="noopener">💬 Send Offer</a>' +
        '<a class="btn btn-gold btn-sm" style="width:auto" href="tel:+91' + esc(String(r.phone).replace(/\D/g, '')) + '">📞 Call</a>' +
        '<a class="btn btn-outline btn-sm" style="width:auto" href="sms:+91' + esc(String(r.phone).replace(/\D/g, '')) + '?body=' + encodeURIComponent('Hi! Your 5% OFF coupon is ready: ' + (r.code || 'SHARE50')) + '">📱 SMS</a>' +
      '</div></div>';
  }).join('');
}

/* 🖼️ feed/product image URL — Google needs REAL image files at
   https://www.sksaree.shop/product/<sku>.jpg. data: URIs are NEVER used in
   feeds; a product photo that is a data URI is referenced as its sku.jpg
   file instead. (Product page links use the classic product.html?id= format.) */
function feedImg(p, base){
  try{
    const raw = String(p && p.img || '').trim();
    const skuFile = base + 'product/' + encodeURIComponent(p.id) + '.jpg';
    if (/^data:image\//i.test(raw)) return skuFile;      /* no data URIs in feeds */
    if (/^https?:/i.test(raw)) return raw;               /* already hosted remotely */
    return skuFile;                                      /* local relative → sku.jpg */
  }catch(e){ return (base || '') + 'product/' + (p && p.id) + '.jpg'; }
}

/* ============================ CATALOG FEED (Facebook/Instagram Shopping XML) ============================ */
function feedXml(){
  const escX = s => String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
  /* 🔴 absolute site URL (not localhost) so GOOGLE can reach every product */
  const base = feedBase();
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n<channel>\n<title>SK Sarees Catalog</title>\n<link>' + escX(base) + '</link>\n<description>Saree catalog for Facebook & Instagram Shopping</description>\n';
  PRODUCTS.filter(p => !p.hidden).slice(0, 500).forEach(p => {
    const imgAbs = feedImg(p, base);
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
  /* 🔴 absolute site URL — same domain as Google Merchant Center (feedBase) */
  const base = feedBase();
  const lines = ['id\ttitle\tdescription\tprice\tcondition\tlink\tavailability\timage_link'];
  PRODUCTS.filter(p => !p.hidden).slice(0, 500).forEach(p => {
    const imgAbs = feedImg(p, base);
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
/* 🌐 feed domain — the SAME domain must be used in Google Merchant Center +
   the feed links, or GMC shows "Website link mismatch". Pick whichever domain
   you verified (with or without www) and it is used everywhere. */
function feedBase(){
  try{
    const d = localStorage.getItem('sk_feed_domain');
    if (d) return String(d).replace(/\/+$/, '') + '/';
  }catch(e){}
  return (CONFIG.siteUrl || (location.origin + location.pathname.replace(/[^/]*$/, ''))) + '/';
}
function setFeedDomain(d){ try{ localStorage.setItem('sk_feed_domain', String(d || '').trim()); }catch(e){} }
/* catalog.json content (exact shape the store + Google/Meta can consume) —
   hidden products are NEVER included */
function feedJson(){
  return JSON.stringify(PRODUCTS.filter(p => !p.hidden).map(p => ({
    id: p.id, sku: p.sku, name: p.name, price: p.price, mrp: p.mrp, cat: p.cat,
    img: feedImg(p, feedBase()), images: p.images ? p.images.map(u => String(u || '').indexOf('data:image/') === 0 ? feedImg(p, feedBase()) : u) : [feedImg(p, feedBase())], stock: p.stock,
    fabric: p.fabric, color: p.color, colors: p.colors || [],
    colourStock: p.colourStock || null,
    border: p.border, blouse: p.blouse, length: p.length, weight: p.weight,
    wash: p.wash, desc: p.desc, rating: p.rating, reviews: p.reviews, badge: p.badge, status: 'Active',
  })));
}
/* 🔍 feed validation — final link + image URL per product, so you can spot
   broken links / localhost / missing images before submitting to Google/Meta */
function feedIssues(){
  const base = feedBase();
  const out = [];
  PRODUCTS.filter(p => !p.hidden).slice(0, 200).forEach(p => {
    const link = base + 'product.html?id=' + encodeURIComponent(p.id);
    const img = feedImg(p, base);
    const issues = [];
    if (/localhost|127\.0\.0\.1|file:\/\//i.test(link)) issues.push('🔴 link uses localhost');
    if (!/^https:/i.test(link)) issues.push('⚠️ link not HTTPS');
    if (!/^https:/i.test(img)) issues.push('⚠️ image not HTTPS');
    out.push({ id: p.id, name: p.name, link, img, issues: issues.join(', ') });
  });
  return out;
}
/* 🔄 AUTO-UPDATE feeds: regenerate all 3 feed files into this browser whenever
   a product is saved/deleted/imported, so Admin → Catalog Feed and feed.html
   always show the latest catalog. Upload the files to your host to update
   Google Merchant Center / Meta (their scheduled fetch = automatic). */
function refreshFeedCache(){
  try{
    const json = feedJson();
    const prev = localStorage.getItem('sk_feed_json') || '';
    const changed = prev !== json;                 /* only remind when the catalog actually changed */
    localStorage.setItem('sk_feed_xml', feedXml());
    localStorage.setItem('sk_feed_txt', feedTxt());
    localStorage.setItem('sk_feed_json', json);
    localStorage.setItem('sk_feed_updated', new Date().toISOString());
    if (changed){
      try{ toast('⚠️ Catalog changed — tap ⬇️ Download catalog.json & upload to your host so www.sksaree.shop updates instantly'); }catch(e){}
    }
    return true;
  }catch(e){ return false; }
}
/* ⚠️ Is the catalog.json LIVE on the site up to date with this browser's
   products? (Run inside Admin → Catalog Feed.) If the uploaded catalog.json is
   older, customers would not see new products — this flags it + says what to do. */
async function checkCatalogSync(){
  const el = document.getElementById('catalogSyncNote');
  if (!el) return;
  const mine = PRODUCTS.filter(p => !p.hidden);
  const mineIds = new Set(mine.map(p => String(p.id)));
  if (!mine.length){ el.innerHTML = ''; return; }
  try{
    const r = await fetch('catalog.json', { cache: 'no-cache' });
    if (!r.ok){ el.innerHTML = '<p class="small muted" style="margin-top:6px">🩺 Could not read catalog.json from this site (status ' + r.status + '). It will work after upload.</p>'; return; }
    const data = await r.json();
    const list = Array.isArray(data) ? data : (data && Array.isArray(data.products) ? data.products : []);
    const liveIds = new Set(list.map(p => p && p.id ? String(p.id) : '').filter(Boolean));
    const missing = [...mineIds].filter(id => !liveIds.has(id));
    const extra = [...liveIds].filter(id => !mineIds.has(id));
    if (!missing.length && !extra.length){
      el.innerHTML = '<p class="small" style="color:var(--green);font-weight:800;margin-top:6px">✅ catalog.json on this site is UP TO DATE — <b>' + liveIds.size + '</b> products, same as here. Customers see everything instantly.</p>';
    } else {
      el.innerHTML = '<p class="small" style="color:var(--red);font-weight:800;margin-top:6px">⚠️ <b>catalog.json is OUT OF DATE</b> — it has <b>' + liveIds.size + '</b> products but your Admin has <b>' + mineIds.size + '</b>.' +
        (missing.length ? '<br>❌ Missing on the site: <b>' + missing.slice(0, 8).join(', ') + '</b>' + (missing.length > 8 ? '…' : '') : '') +
        '<br>👉 Tap <b>⚡ catalog.json (instant load)</b> below, then upload the new file to your host root (same folder as index.html) — customers see the new sarees immediately.</p>';
    }
  }catch(e){
    el.innerHTML = '<p class="small muted" style="margin-top:6px">🩺 catalog.json sync check needs the live site (works after upload). Here in preview it can\'t reach the file.</p>';
  }
}
function renderFeed(){
  const body = document.getElementById('tabBody');
  const count = PRODUCTS.length;
  body.innerHTML =
    '<div class="form-card"><h3>📦 Catalog Feed — Facebook / Instagram Shopping</h3>' +
      '<p class="small muted">Generate the product XML feed, upload it to your hosting root as <b>products-feed.xml</b>, then connect it in Meta Commerce Manager (Catalog → Data source → Product feed). This lets customers <b>tag &amp; buy sarees directly on Instagram/Facebook</b>.</p>' +
      '<p class="small" style="margin-top:6px">Currently <b>' + count + '</b> products will be in the feed (hidden products excluded).</p>' +
      '<div class="field" style="margin-top:8px"><label>🌐 Feed domain — <b>must match your Google Merchant Center website</b></label>' +
        '<select id="feedDomain" style="width:100%;border:1.5px solid var(--line);border-radius:10px;padding:11px 12px;background:#fff">' +
          '<option value="https://www.sksaree.shop" data-www="1">https://www.sksaree.shop (with www)</option>' +
          '<option value="https://sksaree.shop">https://sksaree.shop (without www)</option>' +
        '</select>' +
        '<p class="small" style="color:var(--red);font-weight:800;margin-top:4px">⚠️ If Google Merchant Center shows <b>"Website link mismatch"</b>: use the exact domain you verified in GMC here — the feed links will then match your GMC website and the error disappears.</p></div>' +
      '<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">' +
        '<button type="button" class="btn btn-maroon" id="feedDownload" style="width:auto;min-width:230px">⬇️ products-feed.xml</button>' +
        '<button type="button" class="btn btn-gold" id="feedTxtDownload" style="width:auto;min-width:240px">⬇️ Google Merchant (TXT)</button>' +
        '<button type="button" class="btn btn-buy" id="feedJsonDownload" style="width:auto;min-width:220px">⚡ catalog.json (instant load)</button>' +
        '<button type="button" class="btn btn-outline" id="feedSave" style="width:auto;min-width:230px">💾 Save feeds to this browser</button>' +
        '<button type="button" class="btn btn-ghost" id="feedCopy" style="width:auto;min-width:180px">📋 Copy XML</button>' +
      '</div>' +
      '<p class="small" style="margin-top:8px;color:var(--green);font-weight:800">🔄 Feeds auto-refresh whenever you save / delete / hide / import a product.</p>' +
      '<p id="catalogSyncNote"></p>' +
      '<p class="small muted" id="feedNote" style="margin-top:4px">1. Pick the feed domain above. 2. Tap <b>💾 Save feeds to this browser</b> (or just save a product — automatic). 3. Download the 3 files → upload to your host root (same folder as index.html). 4. <b>Google Merchant Center:</b> Products → Feeds → scheduled fetch → <b>' + esc(feedBase() + 'google-merchant-feed.txt') + '</b> → refresh daily = automatic updates. <b>Meta:</b> Commerce Manager → add feed URL <b>' + esc(feedBase() + 'products-feed.xml') + '</b>. Public feed page: <a href="feed.html" target="_blank" style="color:var(--maroon);font-weight:800">' + esc(feedBase() + 'feed.html') + '</a></p></div>' +
    '<div class="form-card"><h3>🔍 Feed preview (first 3)</h3><div style="overflow:auto;max-height:260px;font-size:.68rem;background:var(--bg);border-radius:10px;padding:10px"><pre style="white-space:pre-wrap">' + esc(feedXml().slice(0, 2000)) + '</pre></div></div>' +
    '<div class="form-card"><h3>🩺 Feed link check (first 15) — <span style="color:var(--green)">no localhost, all HTTPS</span></h3><div id="feedCheck" style="overflow:auto;max-height:280px;font-size:.72rem"></div></div>' +
    '<p class="small muted" style="margin-top:6px">🔗 Product links use the classic format: <b>product.html?id=SK75279</b> — works everywhere, no extra files.</p>';
  /* 🌐 domain picker — re-render feed preview + check with the chosen domain */
  const domSel = document.getElementById('feedDomain');
  if (domSel){
    try{ const cur = localStorage.getItem('sk_feed_domain'); if (cur) domSel.value = cur; }catch(e){}
    domSel.addEventListener('change', () => {
      setFeedDomain(domSel.value);
      renderFeed();
      toast('🌐 Feed domain → ' + domSel.value);
    });
  }
  /* 🩺 link check list */
  try{
    const fc = document.getElementById('feedCheck');
    if (fc){
      const rows = feedIssues().slice(0, 15).map(r =>
        '<div style="padding:6px 0;border-bottom:1px dashed var(--line)"><b>' + esc(r.id) + '</b> — ' + esc(r.name) + (r.issues ? '<br><span style="color:var(--red)">' + esc(r.issues) + '</span>' : '<br><span style="color:var(--green)">✅ OK</span>') +
        '<br><small class="muted">🔗 ' + esc(r.link) + '</small>' +
        '<br><small class="muted">🖼️ ' + esc(r.img) + '</small></div>').join('');
      fc.innerHTML = rows || '<p class="small muted">No products yet.</p>';
    }
  }catch(e){}
  const saveBtn = document.getElementById('feedSave');
  if (saveBtn) saveBtn.addEventListener('click', () => {
    const ok = refreshFeedCache();
    toast(ok ? '💾 Feeds saved to this browser (' + count + ' products)' : '⚠️ Could not save feeds');
  });
  document.getElementById('feedDownload').addEventListener('click', () => {
    refreshFeedCache();
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
    refreshFeedCache();
    const blob = new Blob([feedJson()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'catalog.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    toast('⚡ catalog.json downloaded — upload to site root for instant product load!');
  });
  const txtBtn = document.getElementById('feedTxtDownload');
  if (txtBtn) txtBtn.addEventListener('click', () => {
    refreshFeedCache();
    const blob = new Blob([feedTxt()], { type: 'text/tab-separated-values' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'google-merchant-feed.txt';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    toast('✅ google-merchant-feed.txt downloaded (' + PRODUCTS.length + ' products)');
  });
  /* ⚠️ live catalog.json sync check — tells you when the site file is old */
  try{ checkCatalogSync(); }catch(e){}
}

/* ============================ 📈 GROWTH ============================
   Daily marketing engine: 2 Reels/day ideas + captions (Instagram algorithm
   friendly), SEO keyword titles, and traffic-source plan. All copy-ready. */
function growthDaily(){
  const d = new Date();
  const dayIdx = Math.floor(Date.now() / 864e5);
  const prod = PRODUCTS.filter(p => !p.hidden && p.img)[dayIdx % Math.max(1, PRODUCTS.filter(p=>!p.hidden&&p.img).length)];
  const reels = [
    { title: '₹999 Soft Silk Saree', idea: 'Show the saree + price card. Fast cuts, trending audio.', caption: 'இந்த சேலை முழு collection பார்க்க 👇\n\nsksaree.shop\n\n#SKSarees #SoftSilkSaree #SareeUnder1000' },
    { title: 'New Collection வந்தாச்சு', idea: 'Quick montage of 3-4 new sarees with countdown sticker.', caption: 'New Collection 🎉 full பார்க்க 👇\n\nsksaree.shop\n\n#NewSareeCollection #SKSarees' },
    { title: 'இந்த color எப்படி இருக்கு?', idea: 'Colour close-ups + poll sticker (Red vs Green).', caption: 'எந்த color ரொம்ப நல்லா இருக்கு? Comment பண்ணுங்க 👇\n\nsksaree.shop\n\n#SareeColours #SKSarees' },
    { title: 'COD Available', idea: 'Show the COD badge + packing → delivery clip.', caption: '💵 COD Available • UPI உண்டு • Fast Delivery 🚚\n\nsksaree.shop\n\n#CODSaree #SKSarees' },
    { title: 'Tamil Nadu Full Delivery', idea: 'Map/states animation + "Order from anywhere".', caption: '📍 Tamil Nadu Full Delivery • All India 🚚\n\nsksaree.shop\n\n#SKSarees #TamilNadu' },
    { title: 'Deal of the Day', idea: 'Show the discounted saree + "today only" urgency.', caption: '🔥 Deal of the day — today only! 👇\n\nsksaree.shop\n\n#SareeDeal #SKSarees' },
  ];
  const r1 = reels[dayIdx % reels.length];
  const r2 = reels[(dayIdx + 1) % reels.length];
  return { r1, r2, prod, link: (CONFIG.siteUrl || location.origin) + '/product.html?id=' + (prod ? encodeURIComponent(prod.id) : '') };
}
function renderGrowth(){
  const body = document.getElementById('tabBody');
  const g = growthDaily();
  const seoTitle = g.prod ? (String(g.prod.fabric || '').indexOf('Silk') !== -1 ? 'Soft Silk Saree for Women | SK Sarees' : (g.prod.name + ' | SK Sarees')) : 'Soft Silk Saree for Women | SK Sarees';
  body.innerHTML =
    '<div class="form-card"><h3>📈 Daily Growth Engine — 2 Reels / day</h3>' +
      '<p class="small muted">Instagram algorithm loves <b>daily short Reels with trending audio + keyword captions + your URL on screen</b>. Post these 2 reels today — fastest reach for a saree business.</p>' +
      '<div style="display:grid;gap:10px;grid-template-columns:1fr 1fr">' +
        '<div style="border:1px solid var(--line);border-radius:12px;padding:10px"><b>🎬 Reel 1 — ' + esc(g.r1.title) + '</b><p class="small muted" style="margin:6px 0">' + esc(g.r1.idea) + '</p>' +
          '<textarea id="gCap1" rows="5" readonly style="width:100%;border:1.5px solid var(--line);border-radius:10px;padding:8px;font-size:.72rem;background:var(--bg);outline:none;font-family:inherit">' + esc(g.r1.caption.replace('sksaree.shop', (CONFIG.siteUrl || location.origin).replace(/^https?:\/\//,'') + ' • ' + g.link)) + '</textarea>' +
          '<button type="button" class="btn btn-maroon btn-sm" data-copy-g="gCap1" style="margin-top:6px">📋 Copy Caption</button></div>' +
        '<div style="border:1px solid var(--line);border-radius:12px;padding:10px"><b>🎬 Reel 2 — ' + esc(g.r2.title) + '</b><p class="small muted" style="margin:6px 0">' + esc(g.r2.idea) + '</p>' +
          '<textarea id="gCap2" rows="5" readonly style="width:100%;border:1.5px solid var(--line);border-radius:10px;padding:8px;font-size:.72rem;background:var(--bg);outline:none;font-family:inherit">' + esc(g.r2.caption.replace('sksaree.shop', (CONFIG.siteUrl || location.origin).replace(/^https?:\/\//,'') + ' • ' + g.link)) + '</textarea>' +
          '<button type="button" class="btn btn-maroon btn-sm" data-copy-g="gCap2" style="margin-top:6px">📋 Copy Caption</button></div>' +
      '</div>' +
      '<p class="small muted" style="margin-top:8px">💡 <b>In the video, show the website URL</b> on screen for 3+ seconds — viewers who see the URL are 2× more likely to visit.</p></div>' +
    '<div class="form-card"><h3>🔍 SEO Product Titles (Google)</h3>' +
      '<p class="small muted">Keyword-first titles rank better. Example: <b>❌ "Saree 101"</b> → <b>✅ "Soft Silk Saree for Women | SK Sarees"</b> or <b>"Elampillai Semi Silk Saree Online Tamil Nadu | SK Sarees"</b>.</p>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><b style="flex:1;min-width:200px">' + esc(seoTitle) + '</b><button type="button" class="btn btn-outline btn-sm" data-copy-g="seoTxt" style="width:auto">📋 Copy</button></div>' +
      '<p class="small muted" id="seoTxt" style="display:none">' + esc(seoTitle) + '</p>' +
      '<p class="small muted" style="margin-top:6px">Titles are generated automatically on each product page (Admin → add/edit product → the product page <code>&lt;title&gt;</code> uses fabric+colour keywords).</p></div>' +
    '<div class="form-card"><h3>🎯 Recommended Traffic Mix</h3>' +
      '<div style="display:grid;gap:6px;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));margin-top:8px">' +
        '<div style="background:var(--bg);border:1px solid var(--line);border-radius:10px;padding:10px;text-align:center"><b style="font-size:1.3rem;color:var(--maroon)">40%</b><span class="muted small" style="display:block">📱 Instagram Reels</span></div>' +
        '<div style="background:var(--bg);border:1px solid var(--line);border-radius:10px;padding:10px;text-align:center"><b style="font-size:1.3rem;color:var(--maroon)">30%</b><span class="muted small" style="display:block">📣 Facebook Ads</span></div>' +
        '<div style="background:var(--bg);border:1px solid var(--line);border-radius:10px;padding:10px;text-align:center"><b style="font-size:1.3rem;color:var(--maroon)">20%</b><span class="muted small" style="display:block">🔍 Google Search (SEO)</span></div>' +
        '<div style="background:var(--bg);border:1px solid var(--line);border-radius:10px;padding:10px;text-align:center"><b style="font-size:1.3rem;color:var(--maroon)">10%</b><span class="muted small" style="display:block">💬 WhatsApp Sharing</span></div>' +
      '</div></div>' +
    '<div class="form-card"><h3>✅ Homepage Trust (already live)</h3><p class="small muted">COD Available • Tamil Nadu Delivery • Secure Order via WhatsApp • Customer Reviews • Real Saree Photos • Call &amp; WhatsApp buttons • Clear shipping charges (₹30 TN / ₹40 AP/KA / ₹60 others / free ₹999+) — all shown on the homepage trust strip.</p></div>';
  document.querySelectorAll('[data-copy-g]').forEach(b => b.addEventListener('click', () => {
    const id = b.dataset.copyG;
    const el = document.getElementById(id);
    if (el) copyText(el.value || el.textContent);
    toast('📋 Copied!');
  }));
}

/* ============================ 📱 DAILY STATUS POSTS ============================
   Viral content for social media — a new post every day (auto-rotates by date).
   Pick a saree (or 🎲 Surprise me) → ready viral Tamil+English caption →
   copy text / share on WhatsApp / download a shareable STATUS IMAGE (1080×1080
   with the saree photo, name, price & offers). Share daily on WhatsApp status,
   Instagram, Facebook → more visitors & orders. */
function statusPostFor(p){
  const off = offPct(p);
  const price = money(p.price), mrp = p.mrp ? money(p.mrp) : '';
  const d = new Date();
  const dateStr = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' });
  const link = (CONFIG.siteUrl || location.origin) + '/product.html?id=' + encodeURIComponent(p.id);
  const text =
    '🪡 ** இன்றைய சேலை ஸ்பெஷல் — ' + dateStr + ' ** 🎉\n\n' +
    '✨ ' + p.name + '\n' +
    '💰 விலை: ' + price + (off ? ' (' + off + '% OFF)' : '') + (mrp ? ' | MRP ' + mrp : '') + '\n' +
    '🧵 ' + (p.fabric || 'Premium') + (p.color ? ' • ' + p.color : '') + '\n' +
    '🚚 ₹999+ மேல இலவச டெலிவரி • 💵 COD & UPI உண்டு\n' +
    '✅ 7 நாள் ரிட்டர்ன் • ⏱ 24–48 மணி நேர டிஸ்பாட்ச்\n' +
    'South India-வின் நம்பர் 1 சேலை ஸ்டோர் 🏆\n\n' +
    '👉 ' + link + '\n\n' +
    '🔥 WhatsApp-ல பகிருங்க — உங்களுக்கும் ' + (CONFIG.resellerMarginPct || 5) + '% மார்கின்! 🎁\n' +
    '#SKSarees #SareeOfTheDay #SalemSarees #SouthIndiaSarees #WeddingSarees #Pongal #Diwali';
  return { text, link, dateStr, off };
}
/* render a 1080×1080 status image (canvas) → download as JPG */
function statusImage(p){
  return new Promise(resolve => {
    try{
      const W = 1080, H = 1080;
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      const ctx = cv.getContext('2d');
      if (!ctx){ resolve(null); return; }
      /* background gradient */
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, '#8f1d3a'); g.addColorStop(1, '#5c0f26');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      /* gold inner border */
      ctx.strokeStyle = '#e8c66a'; ctx.lineWidth = 14;
      ctx.strokeRect(26, 26, W - 52, H - 52);

      const draw = (img, imgOk) => {
        try{
          /* 🖼️ ORIGINAL product photo — top area, cover-cropped into a rounded card */
          const phTop = 74, phH = 470, phPad = 74, phW = W - phPad * 2;
          ctx.fillStyle = '#faf7f2'; ctx.fillRect(phPad, phTop, phW, phH);
          ctx.save();
          roundRect(ctx, phPad, phTop, phW, phH, 24); ctx.clip();
          if (imgOk && img){
            const iw = img.width || 800, ih = img.height || 600;
            const s = Math.max(phW / iw, phH / ih);
            const dw = iw * s, dh = ih * s;
            ctx.drawImage(img, phPad + (phW - dw) / 2, phTop + (phH - dh) / 2, dw, dh);
          } else {
            /* fallback: clean SK monogram */
            ctx.fillStyle = 'rgba(143,29,58,.12)'; ctx.fillRect(phPad, phTop, phW, phH);
            ctx.fillStyle = '#8f1d3a'; ctx.font = 'bold 190px Georgia, serif'; ctx.textAlign = 'center';
            ctx.fillText('SK', W / 2, phTop + phH / 2 + 60);
          }
          ctx.restore();
          ctx.strokeStyle = 'rgba(232,198,106,.6)'; ctx.lineWidth = 3;
          roundRect(ctx, phPad, phTop, phW, phH, 24); ctx.stroke();

          /* ✍️ TEXT — clean centered alignment with generous spacing */
          const cx = W / 2;
          let y = phTop + phH + 66;
          ctx.textAlign = 'center';
          /* store line */
          ctx.fillStyle = '#e8c66a'; ctx.font = 'bold 44px Georgia, serif';
          ctx.fillText('🪡 SK SAREES — SALEM', cx, y); y += 66;
          /* saree name (wrapped, max 3 lines) */
          ctx.fillStyle = '#fff'; ctx.font = 'bold 60px Georgia, serif';
          const nameLines = wrapLines(ctx, String(p.name || 'Saree'), W - 200, 3);
          nameLines.forEach(l => { ctx.fillText(l, cx, y); y += 66; });
          y += 16;
          /* price + discount pill */
          ctx.fillStyle = '#ffe9a8'; ctx.font = 'bold 84px Arial, sans-serif';
          ctx.fillText('₹' + Number(p.price || 0).toLocaleString('en-IN'), cx, y); y += 40;
          if (p.mrp > p.price){
            ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.font = '44px Arial, sans-serif';
            const off = offPct(p);
            ctx.fillText('MRP ₹' + Number(p.mrp).toLocaleString('en-IN') + (off ? '   •   ' + off + '% OFF' : ''), cx, y); y += 10;
          }
          y += 26;
          /* offers card */
          const oy = y;
          const oLines = ['🚚 Free delivery above ₹999  •  💵 COD & UPI', '✅ 7-day returns  •  ⏱ 24–48h dispatch'];
          const oh = 46 * oLines.length + 44;
          roundRect(ctx, 90, oy, W - 180, oh, 22);
          ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fill();
          ctx.strokeStyle = 'rgba(232,198,106,.5)'; ctx.lineWidth = 2; ctx.stroke();
          ctx.fillStyle = '#fff'; ctx.font = '38px Arial, sans-serif';
          oLines.forEach((l, i) => ctx.fillText(l, cx, oy + 62 + i * 48));
          y = oy + oh + 58;
          /* bottom line */
          ctx.fillStyle = '#e8c66a'; ctx.font = 'bold 46px Arial, sans-serif';
          ctx.fillText("🏆 South India's #1 saree store", cx, y); y += 54;
          ctx.fillStyle = '#ffe9a8'; ctx.font = 'bold 40px Arial, sans-serif';
          ctx.fillText('www.sksaree.shop', cx, y);
        }catch(e){}
        try{ resolve(cv.toDataURL('image/jpeg', 0.9)); }catch(e){ resolve(null); }
      };

      const img = new Image();
      img.crossOrigin = /^https:/i.test(String(p.img || '')) ? 'anonymous' : '';
      const t = setTimeout(() => draw(null, false), 6000);
      img.onload = () => { clearTimeout(t); draw(img, true); };
      img.onerror = () => { clearTimeout(t); draw(null, false); };
      img.src = String(p.img || '');
    }catch(e){ resolve(null); }
  });
}
/* canvas rounded-rect helper */
function roundRect(ctx, x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function wrapLines(ctx, text, maxW, maxLines){
  const words = String(text).split(' ');
  const out = []; let line = '';
  for (const w of words){
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && line){
      out.push(line); line = w;
      if (out.length >= maxLines) return out;
    } else line = test;
  }
  if (line) out.push(line);
  return out;
}
function wrapText(ctx, text, x, y, maxW, lineH, maxLines){
  const words = String(text).split(' ');
  let line = '', n = 0;
  for (const w of words){
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && line){
      ctx.fillText(line, x, y); y += lineH; line = w; n++;
      if (n >= maxLines) return;
    } else line = test;
  }
  if (line) ctx.fillText(line, x, y);
}
function renderStatusPosts(){
  const body = document.getElementById('tabBody');
  const pool = PRODUCTS.filter(p => !p.hidden && p.stock > 0 && p.img);
  const day = Math.floor(Date.now() / 864e5);
  const defId = pool.length ? pool[day % pool.length].id : '';
  body.innerHTML =
    '<div class="form-card"><h3>📱 Daily Status Post — viral content for social media</h3>' +
      '<p class="small muted">Share this on <b>WhatsApp Status, Instagram, Facebook</b> every day — auto-rotates to a new saree daily. Customers see a fresh saree + offer → more visits & orders.</p>' +
      '<div style="display:grid;gap:10px;grid-template-columns:1fr 1fr;margin-top:8px">' +
        '<div class="field" style="margin:0"><label>🎀 Choose saree</label><select id="spProd" style="width:100%;border:1.5px solid var(--line);border-radius:10px;padding:11px 12px;background:#fff">' +
          pool.map(x => '<option value="' + esc(x.id) + '"' + (x.id === defId ? ' selected' : '') + '>' + esc(x.name) + ' — ' + money(x.price) + '</option>').join('') +
        '</select></div>' +
        '<div class="field" style="margin:0"><label>🎲 or</label><button type="button" class="btn btn-outline" id="spSurprise" style="width:100%">🎲 Surprise Me (random saree)</button></div>' +
      '</div>' +
      '<div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">' +
        '<button type="button" class="btn btn-maroon" id="spCopy" style="width:auto;min-width:170px">📋 Copy Caption</button>' +
        '<button type="button" class="btn btn-wa" id="spWa" style="width:auto;min-width:220px">💬 Share on WhatsApp</button>' +
        '<button type="button" class="btn btn-buy" id="spImg" style="width:auto;min-width:240px">🖼️ Download Status Image (JPG)</button>' +
      '</div>' +
      '<p class="small muted" id="spInfo" style="margin-top:8px"></p></div>' +
    '<div class="form-card"><h3>📝 Caption preview</h3><textarea id="spText" rows="10" readonly style="width:100%;border:1.5px solid var(--line);border-radius:10px;padding:10px;font-size:.78rem;background:var(--bg);outline:none;font-family:inherit"></textarea></div>' +
    '<div class="form-card"><h3>🖼️ Image preview</h3><img id="spPreview" alt="Status image preview" style="max-width:min(340px,100%);border-radius:12px;border:1px solid var(--line)"></div>';
  const refill = () => {
    const id = document.getElementById('spProd').value;
    const p = byId(id);
    if (!p) return;
    const sp = statusPostFor(p);
    document.getElementById('spText').value = sp.text;
    document.getElementById('spInfo').innerHTML = '📅 Today: <b>' + sp.dateStr + '</b> • Saree of the day • Auto-rotates daily';
    /* image preview + download */
    statusImage(p).then(uri => {
      const im = document.getElementById('spPreview');
      if (im && uri) im.src = uri;
      if (im && !uri) im.style.display = 'none';
      document.getElementById('spImg').dataset.uri = uri || '';
    });
  };
  document.getElementById('spProd').addEventListener('change', refill);
  document.getElementById('spSurprise').addEventListener('click', () => {
    const pool2 = PRODUCTS.filter(x => !x.hidden && x.stock > 0 && x.img);
    if (!pool2.length) return;
    const r = pool2[Math.floor(Math.random() * pool2.length)];
    document.getElementById('spProd').value = r.id;
    refill();
    toast('🎲 ' + r.name);
  });
  document.getElementById('spCopy').addEventListener('click', () => {
    copyText(document.getElementById('spText').value);
    toast('📋 Caption copied — paste on WhatsApp Status!');
  });
  document.getElementById('spWa').addEventListener('click', () => {
    const txt = document.getElementById('spText').value;
    try{ window.open('https://wa.me/?text=' + encodeURIComponent(txt), '_blank', 'noopener'); }catch(e){}
  });
  document.getElementById('spImg').addEventListener('click', () => {
    const uri = document.getElementById('spImg').dataset.uri;
    if (!uri){ toast('⏳ Image not ready yet — wait a second'); return; }
    const a = document.createElement('a');
    a.href = uri; a.download = 'sk-status-' + new Date().toISOString().slice(0, 10) + '.jpg';
    document.body.appendChild(a); a.click(); a.remove();
    toast('🖼️ Status image downloaded — share it!');
  });
  refill();
}

/* ============================ RESELLERS (Share & Earn) ============================
   Shows every reseller: name, phone, code, orders count, total margin, and the
   order details they brought in — so the owner can pay commission via GPay. */
let fsResellers = [];
let rsPage = 1;                        /* resellers pagination: 10 at a time */
const RS_PAGE_SIZE = 10;
function renderResellers(){
  const body = document.getElementById('tabBody');
  /* merge local + Firestore resellers (dedupe by code) */
  const all = allResellers().slice().sort((a, b) => (b.margin || 0) - (a.margin || 0));
  const totalMargin = all.reduce((s, r) => s + (r.margin || 0), 0);
  body.innerHTML =
    '<div class="form-card"><h3>💰 Resellers — Share &amp; Earn</h3>' +
      '<p class="small muted">Resellers earn <b>' + (CONFIG.resellerMarginPct || 5) + '%</b> of every <b>UPI</b> order through their share link (<code>?ref=CODE</code>) — <b>confirmed when the order ships</b> (COD orders earn nothing). Payout via <b>GPay only</b>, when a reseller\'s confirmed commission reaches <b>₹' + (CONFIG.resellerMinPayout || 100) + '</b>. Confirmed to pay: <b style="color:var(--green)">' + money(totalMargin) + '</b> <span class="muted">(pending: ' + money(all.reduce((s2, r2) => s2 + (r2.pendingMargin || 0), 0)) + ')</span>.</p></div>' +
    '<div id="rsList"></div>' +
    '<div style="text-align:center;margin-top:10px"><button type="button" class="btn btn-outline" id="moreResellers" style="width:auto;min-width:200px">Load More Resellers ↓</button></div>';
  const wrap = document.getElementById('rsList');
  if (!all.length){
    wrap.innerHTML = '<div class="empty"><div class="e-ic">💰</div><b>No resellers yet</b>Share the Share &amp; Earn page (share-earn.html) so people can join!</div>';
    const mo2 = document.getElementById('moreResellers'); if (mo2) mo2.style.display = 'none';
    return;
  }
  const visibleRs = all.slice(0, rsPage * RS_PAGE_SIZE);
  wrap.innerHTML = visibleRs.map((r, i) => {
    /* 📦 ALL orders via this reseller (cloud + local, deduped by id) */
    const allOrders = adminAllOrders().filter(o => o.reseller && o.reseller.code === r.code);
    const orderLines = allOrders.length
      ? allOrders.slice(0, 10).map(o => '<div style="font-size:.75rem;padding:3px 0;border-bottom:1px dashed var(--line)">#' + esc(o.id) + ' • ' + fmtDT(o.date) + ' • ' + money((o.totals||{}).grand||0) + ' (' + esc(o.payment||'').toUpperCase() + ') • ' + esc((o.customer||{}).name||'') + ' • <b style="color:var(--green)">+' + money(o.margin||0) + '</b></div>').join('')
      : '<p class="small muted" style="margin-top:4px">No orders via this code yet.</p>';
    /* 💸 commission send log (this browser) */
    let pays = [];
    try{ pays = JSON.parse(localStorage.getItem('sk_reseller_payments') || '[]').filter(x => x.code === r.code); }catch(e){}
    const payLines = pays.length
      ? pays.slice().reverse().slice(0, 6).map(x => '<div style="font-size:.75rem;padding:3px 0;border-bottom:1px dashed var(--line)">💸 Sent ' + fmtDT(x.date) + ' — <b style="color:var(--green)">' + money(x.amount) + '</b></div>').join('')
      : '<p class="small muted" style="margin-top:4px">No commission sent yet.</p>';
    return '<div class="order-card">' +
      '<div class="oc-top"><b>💰 ' + esc(r.name) + '</b><span class="status-pill status-delivered">' + (r.orders||0) + ' orders • ' + money(r.margin||0) + ' confirmed • 👁 ' + (r.views||0) + ' views</span></div>' +
      ((r.pendingMargin||0) > 0 ? '<div class="oc-items" style="color:var(--maroon);font-weight:800">⏳ Pending (till shipped): ' + money(r.pendingMargin) + '</div>' : '') +
      '<div class="oc-items">📱 ' + esc(r.phone) + ' • Code: <b>' + esc(r.code) + '</b> • Joined ' + fmtDate(r.date) +
        ' • UPI: <b>' + esc(resellerUpiId(r)) + '</b>' +
        ((r.paidTotal || 0) > 0 ? ' • <span style="color:var(--green);font-weight:800">Paid so far: ' + money(r.paidTotal) + (r.lastPaid ? ' (' + fmtDate(r.lastPaid) + ')' : '') + '</span>' : '') + '</div>' +
      '<div class="oc-items" style="margin-top:6px"><b>📦 Referral orders (' + allOrders.length + '):</b>' + orderLines + '</div>' +
      '<div class="oc-items" style="margin-top:6px"><b>💸 Commission sent:</b>' + payLines + '</div>' +
      '<div class="oc-btns" style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">' +
        '<a class="btn btn-wa btn-sm" style="width:auto" href="' + waLink('🎉 Hi ' + r.name + '! Your SK Sarees commission ' + money(r.margin||0) + ' for ' + (r.orders||0) + ' order(s) is ready. Please confirm your GPay details 🙏') + '" target="_blank" rel="noopener">💬 Notify on WhatsApp</a>' +
        '<a class="btn btn-gold btn-sm" style="width:auto" href="' + resellerPayLink(r, r.margin) + '">💸 Pay ' + money(r.margin||0) + ' via GPay</a>' +
        '<button type="button" class="btn btn-ghost btn-sm" style="width:auto" data-copyupi="' + esc(resellerUpiId(r)) + '">📋 Copy UPI</button>' +
        (r.margin > 0 ? '<button type="button" class="btn btn-maroon btn-sm" style="width:auto" data-resetpaid="' + esc(r.code) + '">✅ Mark Paid &amp; Reset</button>' : '') +

        '<a class="btn btn-outline btn-sm" style="width:auto" href="tel:+91' + esc(r.phone) + '">📞 Call</a>' +
      '</div></div>';
  }).join('');
  const mo2 = document.getElementById('moreResellers');
  if (mo2){
    const hasMore = rsPage * RS_PAGE_SIZE < all.length;
    mo2.style.display = hasMore ? 'inline-flex' : 'none';
    mo2.onclick = () => { rsPage++; renderResellers(); };
  }
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
  /* 🚫/👁️ per-row hide toggle */
  const th = e.target.closest('[data-togglehide]');
  if (th){
    const id = th.dataset.togglehide;
    const p = byId(id);
    if (!p) return;
    p.hidden = !p.hidden;
    saveProducts(PRODUCTS); refreshFeedCache(); renderProdBody();
    toast(p.hidden ? '🚫 ' + id + ' hidden — links go to home' : '👁️ ' + id + ' visible again');
    return;
  }
  const delp = e.target.closest('[data-delprod]');
  if (delp){
    if (!confirm('Delete this product?')) return;
    const id = delp.dataset.delprod;
    PRODUCTS = PRODUCTS.filter(p => p.id !== id);
    saveProducts(PRODUCTS);
    refreshFeedCache();
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
  /* ✅ reseller margin paid → reset count */
  const lbl = e.target.closest('[data-label]');
  if (lbl){ printOrderLabel(lbl.dataset.label); return; }
  const cu = e.target.closest('[data-copyupi]');
  if (cu){ copyText(cu.dataset.copyupi); toast('📋 UPI ID copied: ' + cu.dataset.copyupi); return; }
  const rp = e.target.closest('[data-resetpaid]');
  if (rp){
    if (confirm('Mark this commission as PAID and reset the margin count to ₹0?')){
      const ok = markResellerPaid(rp.dataset.resetpaid);
      toast(ok ? '✅ Paid recorded — margin reset to ₹0' : '⚠️ Reseller not found');
      renderResellers();
    }
    return;
  }
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
