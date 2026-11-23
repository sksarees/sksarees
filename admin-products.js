/* =============================================================================
   SK SAREES — ADVANCED PRODUCT MANAGEMENT SYSTEM  (V61)
   -----------------------------------------------------------------------------
   A real, working product manager for the admin panel (desktop table + mobile
   cards). Everything here talks to the EXISTING Firebase project
   (`sksareesapp`) and the EXISTING `products` collection / document shape:

     products/{id}  →  id, sku, name, desc, cat, price, mrp, stock, img,
                       images[], colors[], colourStock{}, fabric, length,
                       blouse, wash, weight, badge, video(s), status, hidden …

   New fields added by this module are ADDITIVE (sub, sizes, designs, shipping,
   seoTitle, seoDesc, archivedAt, sales) — old documents keep working, and old
   product ids / SKUs / image URLs are never rewritten.

   WRITES need a Firebase Auth session (Firestore rules: only an authorised
   admin may write `products`). The admin UI itself is unlocked with the PIN,
   so this module has a one-time "☁️ Connect" step (e-mail + password). If the
   signed-in uid is not allowed by the rules yet, the panel prints the exact
   3-line rule to paste in the Firebase Console — no laptop needed.

   Images: Firebase Storage is used when the project has it enabled. This
   project currently has NO Storage bucket, so uploads fall back to compressed
   JPEG data-URIs stored inside the product document (with a hard size guard),
   and any pasted image URL is kept exactly as it is.
   ========================================================================== */
(function(){
'use strict';

/* ---------------------------------------------------------------- helpers */
const E  = (typeof esc  === 'function') ? esc  : s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const M  = (typeof money === 'function') ? money : n => '\u20B9' + Math.round(+n || 0).toLocaleString('en-IN');
const T  = (typeof toast === 'function') ? toast : m => { try{ console.log(m); }catch(e){} };
/* Element has no getElementById, so a scoped lookup uses querySelector */
const $  = (id, root) => {
  let el = null;
  try{ if (root && root.querySelector) el = root.querySelector('#' + id); }catch(e){}
  return el || document.getElementById(id);
};
const QA = (sel, root) => Array.prototype.slice.call((root || document).querySelectorAll(sel));
const num = (v, d) => { const n = parseFloat(v); return Number.isFinite(n) ? n : d; };
const int = (v, d) => { const n = Math.round(parseFloat(v)); return Number.isFinite(n) ? n : d; };
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
const nowMs = () => Date.now();
const uidShort = s => String(s || '').slice(0, 28);
function fmtDate(ms){
  if (!ms) return '\u2014';
  const d = new Date(+ms);
  if (isNaN(d.getTime())) return '\u2014';
  return d.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'2-digit' });
}
function csvCell(v){
  const s = String(v == null ? '' : v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
function download(name, text, mime){
  try{
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: mime || 'text/csv;charset=utf-8' }));
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 8000);
    return true;
  }catch(e){ return false; }
}

/* ------------------------------------------------------------------ state */
const S = {
  list: [],            /* normalised products (customer-facing prices)        */
  raw: {},             /* id -> raw Firestore doc (kept so saves never lose
                          fields this module does not know about)             */
  loaded: false,
  loading: false,
  loadError: '',
  q: '', cat: 'all', status: 'all', stock: 'all', min: '', max: '',
  sort: 'newest',
  page: 1, per: 20,
  sel: {},             /* id -> true                                          */
  sales: {},           /* id -> units sold (from real orders only)            */
  editing: null,       /* product id being edited, or null for a new product  */
  images: [],          /* [{src, name, bytes, uploaded, path}]                */
  busy: false,
  storage: 'unknown',  /* unknown | on | off                                  */
  cloud: 'unknown',    /* unknown | none | ok | denied                        */
  deniedInfo: null,
};

const STATUSES = [
  { v:'active',   n:'Active',   e:'\uD83D\uDFE2' },
  { v:'draft',    n:'Draft',    e:'\uD83D\uDCDD' },
  { v:'inactive', n:'Inactive', e:'\u23F8' },
  { v:'archived', n:'Archived', e:'\uD83D\uDDC4' },
];
const stName = v => (STATUSES.find(x => x.v === v) || { n: v || 'Active', e:'' }).n;
const stEmoji = v => (STATUSES.find(x => x.v === v) || { e:'' }).e;
function normStatus(raw){
  const s = String((raw && (raw.status || raw.state)) || '').toLowerCase().trim();
  if (s === 'draft') return 'draft';
  if (s === 'inactive' || s === 'disabled') return 'inactive';
  if (s === 'archived' || s === 'deleted' || (raw && raw.archivedAt)) return 'archived';
  if (raw && raw.hidden === true) return 'inactive';
  return 'active';
}
/* one normalised row used by the whole manager */
function row(raw, id){
  const r = raw || {};
  /* 💯 V62 — the admin ALWAYS works with the REAL price (what the owner sets).
     The customer-facing +10% markup is applied only at render time by
     normalizeProduct(), so a row here must never carry it. `baked` marks an
     older document where a previous admin save wrote the marked-up price. */
  const p = (typeof normalizeProduct === 'function') ? normalizeProduct(Object.assign({}, r, { id: id, _mkUp: 1 })) : r;
  const realP = (typeof realPriceOf === 'function') ? realPriceOf(r) : Math.round(+r.price || 0);
  const realM = (typeof realMrpOf === 'function') ? realMrpOf(r) : Math.round(+(r.mrp != null ? r.mrp : r.op) || 0);
  const imgs = [];
  try{
    (Array.isArray(r.images) && r.images.length ? r.images : []).forEach(u => { if (u && imgs.indexOf(u) === -1) imgs.push(String(u)); });
  }catch(e){}
  [r.img, r.img2, r.img3, r.img4, p && p.img].forEach(u => { if (u && imgs.indexOf(String(u)) === -1) imgs.push(String(u)); });
  const status = normStatus(r);
  return {
    id: String(r.id || r.sku || id || p.id || ''),
    sku: String(r.sku || r.id || id || ''),
    name: String(p.name || r.name || 'Untitled'),
    desc: String(r.desc || p.desc || ''),
    cat: String(p.cat || r.cat || 'daily'),
    sub: String(r.sub || r.subcategory || ''),
    price: Math.max(0, Math.round(realP)),
    mrp: Math.max(0, Math.round(realM)),
    baked: !!r._mkUp,                              /* markup baked into the doc */
    stock: clamp(int(r.stock != null ? r.stock : p.stock, 10), 0, 999999),
    status: status,
    images: imgs,
    img: imgs[0] || '',
    colors: Array.isArray(p.colors) && p.colors.length ? p.colors.slice() : String(r.col || r.color || '').split('/').map(x => x.trim()).filter(Boolean),
    colourStock: r.colourStock || null,
    sizes: Array.isArray(r.sizes) ? r.sizes.slice() : String(r.sizes || '').split(',').map(x => x.trim()).filter(Boolean),
    designs: Array.isArray(r.designs) ? r.designs.slice() : String(r.designs || '').split(',').map(x => x.trim()).filter(Boolean),
    fabric: String(r.fabric || r.fab || p.fabric || ''),
    length: String(r.length || r.len || p.length || ''),
    blouse: String(r.blouse || p.blouse || ''),
    blouseIncluded: /no\s*blouse|without blouse|^no$/i.test(String(r.blouse || '')) ? false : (r.blouseIncluded !== false),
    wash: String(r.wash || r.care || p.wash || ''),
    border: String(r.border || p.border || ''),
    weight: int(r.weight || p.weight, 800),
    shipping: int(r.shipping != null ? r.shipping : r.ship, 0),
    badge: String(r.badge || p.badge || ''),
    video: String((Array.isArray(p.videos) && p.videos[0]) || r.video || ''),
    seoTitle: String(r.seoTitle || r.seo_title || ''),
    seoDesc: String(r.seoDesc || r.seo_description || r.metaDesc || ''),
    createdAt: +r.createdAt || 0,
    updatedAt: +r.updatedAt || 0,
    sales: int(r.sales, 0),
  };
}
/* the owner's display markup as a fraction (0.10 = +10%) */
function markupPct(){
  try{
    const f = (typeof markupFactor === 'function') ? markupFactor() : (parseFloat(CONFIG.displayMarkup) || 1);
    return Math.max(0, f - 1);
  }catch(e){ return 0; }
}
/* how many loaded documents still carry a baked-in markup (_mkUp stored in the DB) */
function bakedCount(){
  try{ return S.list.filter(p => p.baked).length; }catch(e){ return 0; }
}
/* one-tap repair: rewrite those docs with the REAL price and no _mkUp flag */
async function fixBaked(){
  const rows = S.list.filter(p => p.baked);
  if (!rows.length){ T('\u2705 Nothing to fix'); return; }
  const r = await confirmBox({
    title: '\uD83E\uDE7A Fix ' + rows.length + ' product price(s)',
    text: 'இந்த docs-ல +10% markup சேர்ந்தே store ஆகிருக்கு. இப்போ அவை <b>real price</b>-க்கு சரி ஆகும். Customer display price மாறாது — site இன்னும் +10% தான் காட்டும்.',
    okText: '\u2705 Fix now', cancelText: 'Cancel',
  });
  if (r !== 'yes') return;
  try{
    await cloud(() => writeBatch(rows.map(p => ({ id: p.id, doc: docFrom(p) }))));
    rows.forEach(p => { p.baked = false; applyLocal(p, false); });
    paint();
    T('\u2705 ' + rows.length + ' products repaired — stored price = your real rate');
  }catch(err){
    if (String(err && err.message) !== 'not-connected' && !isDenied(err))
      T('\u26A0\uFE0F Fix failed: ' + String((err && err.message) || err).slice(0, 60));
  }
}
/* what the customer will see for this row (real × display markup) */
function custPrice(p){
  try{ return (typeof displayPriceOf === 'function') ? displayPriceOf({ price: p.price }) : Math.round(p.price * 1.1); }catch(e){ return p.price; }
}

/* --------------------------------------------------------------- loading */
function salesFromOrders(){
  const out = {};
  try{
    const orders = (typeof adminAllOrders === 'function') ? adminAllOrders() : (Store.orders || []);
    (orders || []).forEach(o => {
      if (!o || /cancel|refund/i.test(String(o.status || ''))) return;
      (o.items || []).forEach(i => {
        const id = String(i && (i.id || i.sku) || '');
        if (!id) return;
        out[id] = (out[id] || 0) + clamp(int(i.qty, 1), 1, 999);
      });
    });
  }catch(e){}
  return out;
}

/* the device catalogue as manager rows (PRODUCTS is a lexical global in data.js,
   so it must be read by name — window.PRODUCTS does not exist) */
function localCatalogue(){
  const raw = {};
  let list = [];
  try{
    if (typeof PRODUCTS !== 'undefined' && Array.isArray(PRODUCTS))
      list = PRODUCTS.map(p => { raw[p.id] = p; return row(p, p.id); });
  }catch(e){}
  return [list, raw];
}

function load(force){
  if (S.loading || (S.loaded && !force)) return Promise.resolve();
  S.loading = true; S.loadError = '';
  paint();
  const done = (list, raw, from) => {
    S.list = list; S.raw = raw || {}; S.loaded = true; S.loading = false; S.loadedAt = nowMs();
    S.sales = salesFromOrders();
    try{ S.list.forEach(p => { if (S.sales[p.id]) p.sales = Math.max(p.sales, S.sales[p.id]); }); }catch(e){}
    paint();
    return from;
  };
  if (!(typeof FS !== 'undefined' && FS.enabled())){
    /* no Firebase at all → show the device catalogue so the page is not empty */
    return Promise.resolve(done(...localCatalogue(), 'local'));
  }
  return FS._getDb().then(db => {
    if (!db) throw new Error('Firestore unavailable');
    return db.collection('products').get();
  }).then(snap => {
    const raw = {}, list = [];
    const tomb = (()=>{ try{ return JSON.parse(localStorage.getItem('sk_deleted_products') || '[]').map(String); }catch(e){ return []; } })();
    snap.forEach(d => {
      const id = d.id, r = d.data() || {};
      if (tomb.indexOf(String(r.id || r.sku || id)) !== -1) return;   /* permanently deleted here */
      raw[id] = r;
      list.push(row(r, id));
    });
    return done(list, raw, 'cloud');
  }).catch(err => {
    S.loading = false;
    S.loadError = String((err && err.message) || err || 'load failed');
    /* fall back to whatever the device already has so the admin is not stuck */
    const loc = localCatalogue();
    S.list = loc[0]; S.raw = loc[1]; S.loaded = true; S.loadedAt = nowMs(); S.sales = salesFromOrders();
    paint();
  });
}

/* ------------------------------------------------------- filter + sorting */
function filtered(){
  const q = S.q.trim().toLowerCase();
  const mn = num(S.min, NaN), mx = num(S.max, NaN);
  let out = S.list.filter(p => {
    if (S.cat !== 'all' && p.cat !== S.cat) return false;
    /* "All statuses" = everything EXCEPT the archive (it has its own filter) */
    if (S.status === 'all' ? p.status === 'archived' : p.status !== S.status) return false;
    if (S.stock === 'out' && p.stock > 0) return false;
    if (S.stock === 'low' && !(p.stock > 0 && p.stock <= 5)) return false;
    if (S.stock === 'in' && !(p.stock > 0)) return false;
    if (Number.isFinite(mn) && p.price < mn) return false;
    if (Number.isFinite(mx) && p.price > mx) return false;
    if (q){
      const hay = (p.name + ' ' + p.sku + ' ' + p.id + ' ' + p.cat + ' ' + p.colors.join(' ') + ' ' + p.fabric).toLowerCase();
      if (hay.indexOf(q) === -1) return false;
    }
    return true;
  });
  const by = {
    newest:  (a, b) => (b.createdAt || b.updatedAt || 0) - (a.createdAt || a.updatedAt || 0),
    oldest:  (a, b) => (a.createdAt || a.updatedAt || 0) - (b.createdAt || b.updatedAt || 0),
    pricedesc:(a, b) => b.price - a.price,
    priceasc: (a, b) => a.price - b.price,
    best:    (a, b) => (b.sales || 0) - (a.sales || 0) || b.price - a.price,
    stockasc:(a, b) => a.stock - b.stock,
    name:    (a, b) => String(a.name).localeCompare(String(b.name)),
  }[S.sort] || ((a, b) => 0);
  out.sort(by);
  return out;
}
function selIds(){ return Object.keys(S.sel).filter(k => S.sel[k]); }
function selCount(){ return selIds().length; }

/* ----------------------------------------------------------------- stats */
function stats(){
  const live = S.list.filter(p => p.status !== 'archived');
  const recent = live.slice().sort((a, b) => (b.createdAt || b.updatedAt || 0) - (a.createdAt || a.updatedAt || 0)).slice(0, 5);
  return {
    total: live.length,
    active: live.filter(p => p.status === 'active').length,
    draft: live.filter(p => p.status === 'draft').length,
    inactive: live.filter(p => p.status === 'inactive').length,
    out: live.filter(p => p.status === 'active' && p.stock <= 0).length,
    low: live.filter(p => p.status === 'active' && p.stock > 0 && p.stock <= 5).length,
    archived: S.list.filter(p => p.status === 'archived').length,
    recent: recent,
  };
}

/* =========================================================== CLOUD WRITES */
function fb(){ return window.firebase || null; }
function auth(){ const f = fb(); try{ return (f && f.auth) ? f.auth() : null; }catch(e){ return null; } }
function currentUser(){ const a = auth(); try{ return a ? a.currentUser : null; }catch(e){ return null; } }

/* Ask for a Firebase sign-in (one time per device). Returns Promise<user|null>. */
function connect(){
  return new Promise(resolve => {
    const a = auth();
    if (!a){ overlay(cloudNoSdkHtml(), () => resolve(null)); return; }
    const u = currentUser();
    if (u){ S.cloud = 'ok'; resolve(u); return; }
    overlay(connectHtml(), root => {
      const em = $('pmscEmail', root), pw = $('pmscPass', root), msg = $('pmscMsg', root), btn = $('pmscGo', root);
      const say = (t, bad) => { if (msg){ msg.textContent = t || ''; msg.style.color = bad ? '#b3261e' : 'var(--green, #0e7d46)'; } };
      const go = () => {
        const email = String((em && em.value) || '').trim(), pass = String((pw && pw.value) || '');
        if (!email || !pass) return say('E-mail + password ரெண்டும் வேணும்.', true);
        if (btn){ btn.disabled = true; btn.textContent = 'Connecting\u2026'; }
        a.signInWithEmailAndPassword(email, pass).then(user => {
          S.cloud = 'ok'; closeOverlay(); resolve(user);
        }).catch(err => {
          if (btn){ btn.disabled = false; btn.textContent = 'Connect'; }
          const code = String((err && err.code) || '');
          say((err && err.message ? err.message : 'Sign-in failed') + (code ? '  (' + code + ')' : ''), true);
        });
      };
      if (btn) btn.addEventListener('click', go);
      if (pw) pw.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
    });
  });
}
function connectHtml(){
  return '<div class="pms-ov-card">' +
    '<button type="button" class="pms-ov-x" data-pmsclose>\u2715</button>' +
    '<h3>\u2601\uFE0F Connect to Firebase <span class="pms-tag">one time</span></h3>' +
    '<p class="pms-muted">Products-ஐ Firestore-ல save பண்ண உங்க admin account வேணும். இந்த device-ல ஒரு தடவை மட்டும்.</p>' +
    '<label class="pms-lab">Admin e-mail</label>' +
    '<input id="pmscEmail" type="email" autocomplete="username" placeholder="you@gmail.com">' +
    '<label class="pms-lab">Password</label>' +
    '<input id="pmscPass" type="password" autocomplete="current-password" placeholder="password">' +
    '<p class="pms-msg" id="pmscMsg"></p>' +
    '<button type="button" class="btn btn-maroon pms-btn" id="pmscGo">Connect</button>' +
    '<p class="pms-muted pms-small">PIN (admin page) வேற — இது Firestore write permission-க்கு மட்டும்.</p>' +
  '</div>';
}
function cloudNoSdkHtml(){
  return '<div class="pms-ov-card"><button type="button" class="pms-ov-x" data-pmsclose>\u2715</button>' +
    '<h3>\u26A0\uFE0F Firebase SDK load ஆகல</h3>' +
    '<p class="pms-muted">Internet connection / CDN block ஆகிருக்கலாம். Page-ஐ reload பண்ணி மறுபடி try பண்ணுங்க.</p></div>';
}
/* Firestore refused the write → show the exact rule fix (phone-friendly). */
function deniedPanel(err){
  const u = currentUser();
  const uid = u ? u.uid : '';
  const email = u ? (u.email || '') : '';
  const rule =
"function ownerUids() { return ['" + (uid || 'PASTE-YOUR-UID') + "']; }\n" +
"function isAdmin() {\n" +
"  return request.auth != null &&\n" +
"    (request.auth.token.admin == true ||\n" +
"     ownerUids().hasAny([request.auth.uid]));\n" +
"}";
  return '<div class="pms-ov-card">' +
    '<button type="button" class="pms-ov-x" data-pmsclose>\u2715</button>' +
    '<h3>\uD83D\uDD12 Firestore இந்த write-ஐ மறுத்துடுச்சு</h3>' +
    '<p class="pms-muted">' + E(String((err && err.message) || err || 'PERMISSION_DENIED').slice(0, 160)) + '</p>' +
    (uid ? '<p class="pms-small"><b>Sign-in ஆகிடுச்சு:</b> ' + E(email) + '<br><b>UID:</b> <code>' + E(uidShort(uid)) + '\u2026</code> <button type="button" class="pms-mini" data-pmscopy="' + E(uid) + '">copy uid</button></p>' : '') +
    '<p class="pms-muted">இது one-time setup. Rules-ல உங்க uid-ஐ சேர்த்தா போதும்:</p>' +
    '<ol class="pms-steps">' +
      '<li>Firebase Console \u2192 <b>Firestore Database \u2192 Rules</b></li>' +
      '<li>இருக்கற <code>function isAdmin() {\u2026}</code> வரியை கீழே இருக்கற 2 function-ஆல மாத்தி <b>Publish</b> அழுத்துங்க</li>' +
      '<li>இங்க திரும்பி \u201CSave\u201D அழுத்துங்க \u2014 வேலை செய்யும் \u2705</li>' +
    '</ol>' +
    '<pre class="pms-pre" id="pmsRule">' + E(rule) + '</pre>' +
    '<button type="button" class="btn btn-maroon pms-btn" data-pmscopyrule>\uD83D\uDCCB Copy this rule</button>' +
  '</div>';
}
function isDenied(err){
  const s = String((err && (err.code || err.message)) || err || '');
  return /permission[-_ ]?denied|PERMISSION_DENIED|Missing or insufficient/i.test(s);
}

/* write ONE product document (merge → never wipes fields we do not manage) */
function writeDoc(id, doc){
  if (!(typeof FS !== 'undefined' && FS.enabled())) return Promise.reject(new Error('Firestore is not connected'));
  return FS._getDb().then(db => {
    if (!db) throw new Error('Firestore unavailable');
    const payload = Object.assign({}, doc, { updatedAt: nowMs() });
    return db.collection('products').doc(String(id)).set(payload, { merge: true }).then(() => payload);
  });
}
/* batch write (chunked at 400 ops — Firestore allows 500) */
function writeBatch(ops){
  if (!(typeof FS !== 'undefined' && FS.enabled())) return Promise.reject(new Error('Firestore is not connected'));
  return FS._getDb().then(async db => {
    if (!db) throw new Error('Firestore unavailable');
    for (let i = 0; i < ops.length; i += 400){
      const b = db.batch();
      ops.slice(i, i + 400).forEach(op => {
        const ref = db.collection('products').doc(String(op.id));
        if (op.delete) b.delete(ref);
        else b.set(ref, Object.assign({}, op.doc, { updatedAt: nowMs() }), { merge: true });
      });
      await b.commit();
    }
    return ops.length;
  });
}
/* every cloud write goes through here so the "connect / rules" flow is consistent */
async function cloud(fn){
  if (S.busy) throw new Error('busy');
  const u = currentUser();
  if (!u){
    const c = await connect();
    if (!c) throw new Error('not-connected');
  }
  try{
    const r = await fn();
    S.cloud = 'ok'; S.deniedInfo = null;
    return r;
  }catch(err){
    if (String(err && err.message) === 'not-connected') throw err;
    if (isDenied(err)){ S.cloud = 'denied'; S.deniedInfo = err; overlay(deniedPanel(err)); }
    throw err;
  }
}

/* ------------------------------------------------------------ local state */
function applyLocal(p, remove){
  try{
    const i = S.list.findIndex(x => x.id === p.id);
    if (remove){ if (i >= 0) S.list.splice(i, 1); }
    else if (i >= 0) S.list[i] = p; else S.list.unshift(p);
    S.raw[p.id] = Object.assign({}, S.raw[p.id] || {}, p);
    /* keep the storefront catalogue on this device in sync immediately */
    if (typeof PRODUCTS !== 'undefined'){
      const j = PRODUCTS.findIndex(x => String(x.id) === String(p.id));
      /* 💯 V62 — the storefront copy is normalised WITHOUT `_mkUp`, so the
         customer-side +10% markup is applied exactly once. */
      const np = (typeof normalizeProduct === 'function')
        ? normalizeProduct(Object.assign({}, toStoredProduct(S.raw[p.id] || {}), { id: p.id, price: p.price, mrp: p.mrp || p.price }))
        : Object.assign({}, p);
      if (remove){ if (j >= 0) PRODUCTS.splice(j, 1); }
      else if (j >= 0) PRODUCTS[j] = np; else PRODUCTS.unshift(np);
      try{ LS.set('sk_products', PRODUCTS); }catch(e){}
      try{ if (window.REC && REC.invalidate) REC.invalidate(); }catch(e){}
    }
    S.sales = salesFromOrders();
  }catch(e){}
}
function tombstone(id){
  try{
    const t = JSON.parse(localStorage.getItem('sk_deleted_products') || '[]').map(String);
    if (t.indexOf(String(id)) === -1) t.push(String(id));
    localStorage.setItem('sk_deleted_products', JSON.stringify(t.slice(-1000)));
  }catch(e){}
}

/* ================================================================= IMAGES */
const MAX_DOC_BYTES = 780 * 1024;     /* Firestore hard limit is 1 MiB */
function approxBytes(list){
  let n = 0;
  (list || []).forEach(im => { n += (im.src || '').length * (im.src.indexOf('data:') === 0 ? 0.75 : 1) + 40; });
  return Math.round(n);
}
/* compress any image file to a JPEG data-URI (max side, quality) */
function compress(file, maxSide, quality, onProgress){
  return new Promise((resolve, reject) => {
    try{
      if (!file || !/^image\//.test(file.type || '')) return reject(new Error('Not an image file'));
      if (onProgress) onProgress(10);
      const rd = new FileReader();
      const timer = setTimeout(() => reject(new Error('Image read timed out')), 20000);
      rd.onload = () => {
        const img = new Image();
        img.onload = () => {
          try{
            let w = img.width, h = img.height;
            const ms = maxSide || 1100;
            if (Math.max(w, h) > ms){ const s = ms / Math.max(w, h); w = Math.round(w * s); h = Math.round(h * s); }
            const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
            const ctx = cv.getContext('2d');
            if (!ctx) throw new Error('Canvas not available');
            ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
            ctx.drawImage(img, 0, 0, w, h);
            if (onProgress) onProgress(70);
            const uri = cv.toDataURL('image/jpeg', quality || 0.78);
            if (onProgress) onProgress(100);
            resolve({ src: uri, bytes: Math.round(uri.length * 0.75), w: w, h: h });
          }catch(e){ clearTimeout(timer); reject(e); }
        };
        img.onerror = () => { clearTimeout(timer); reject(new Error('Could not read that image')); };
        img.src = String(rd.result || '');
      };
      rd.onerror = () => { clearTimeout(timer); reject(new Error('Could not open that file')); };
      rd.readAsDataURL(file);
    }catch(e){ reject(e); }
  });
}
/* try Firebase Storage; resolve {url, path} or null when Storage is unusable */
function storagePut(dataUri, id, name, onProgress){
  return new Promise(resolve => {
    if (S.storage === 'off') return resolve(null);
    const f = fb();
    let st = null;
    try{ st = (f && f.storage) ? f.storage() : null; }catch(e){ st = null; }
    if (!st){ S.storage = 'off'; return resolve(null); }
    try{
      const bin = atob(dataUri.split(',')[1] || '');
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      const path = 'products/' + String(id).replace(/[^A-Za-z0-9_-]/g, '') + '/' + nowMs() + '-' + String(name || 'img').replace(/[^A-Za-z0-9._-]/g, '').slice(-24) + '.jpg';
      const ref = st.ref(path);
      const task = ref.put(arr, { contentType: 'image/jpeg' });
      const to = setTimeout(() => { try{ task.cancel(); }catch(e){} S.storage = 'off'; resolve(null); }, 25000);
      task.on('state_changed',
        snap => { try{ if (onProgress && snap.totalBytes) onProgress(Math.round(snap.bytesTransferred / snap.totalBytes * 100)); }catch(e){} },
        () => { clearTimeout(to); S.storage = 'off'; resolve(null); },
        () => {
          ref.getDownloadURL().then(url => { clearTimeout(to); S.storage = 'on'; resolve({ url: url, path: path }); })
             .catch(() => { clearTimeout(to); S.storage = 'off'; resolve(null); });
        });
    }catch(e){ S.storage = 'off'; resolve(null); }
  });
}
/* delete a Storage object we uploaded (safe: only touches our own path) */
function storageDelete(path){
  if (!path || S.storage !== 'on') return Promise.resolve(false);
  const f = fb(); let st = null;
  try{ st = (f && f.storage) ? f.storage() : null; }catch(e){ st = null; }
  if (!st) return Promise.resolve(false);
  return st.ref(path).delete().then(() => true).catch(() => false);
}

/* add files to the image manager (compress → optional Storage upload) */
async function addFiles(files){
  const arr = Array.prototype.slice.call(files || []).filter(f => f && /^image\//.test(f.type || ''));
  if (!arr.length){ T('\u26A0\uFE0F Image files மட்டும் select பண்ணுங்க'); return; }
  const id = (S.editing || ($('pmsSku') && $('pmsSku').value.trim()) || 'new');
  const bar = $('pmsUpBar'), lbl = $('pmsUpLbl');
  let n = 0;
  for (const file of arr){
    n++;
    if (lbl) lbl.textContent = '\u23F3 ' + n + '/' + arr.length + ' \u2014 ' + (file.name || 'image');
    if (bar) bar.style.width = '5%';
    try{
      const c = await compress(file, 1100, 0.78, p => { if (bar) bar.style.width = Math.max(5, Math.min(60, p * 0.6)) + '%'; });
      if (bar) bar.style.width = '65%';
      const up = await storagePut(c.src, id, file.name, p => { if (bar) bar.style.width = (65 + p * 0.33) + '%'; });
      S.images.push({
        src: up ? up.url : c.src,
        path: up ? up.path : '',
        name: file.name || ('photo-' + n),
        bytes: up ? 0 : c.bytes,
        uploaded: !!up,
      });
    }catch(err){
      T('\u26A0\uFE0F ' + (file.name || 'image') + ': ' + String((err && err.message) || err).slice(0, 50));
    }
  }
  if (bar) bar.style.width = '100%';
  setTimeout(() => { if (bar) bar.style.width = '0%'; if (lbl) lbl.textContent = ''; }, 900);
  paintImages();
  T('\u2705 ' + n + ' image(s) ready' + (S.storage === 'off' ? ' (compressed, saved with the product)' : ''));
}
function paintImages(){
  const box = $('pmsImgs'); if (!box) return;
  if (!S.images.length){
    box.innerHTML = '<p class="pms-muted pms-small">இன்னும் image இல்ல \u2014 மேலே upload பண்ணுங்க அல்லது URL சேருங்க.</p>';
  }else{
    box.innerHTML = S.images.map((im, i) =>
      '<div class="pms-im' + (i === 0 ? ' pms-im-main' : '') + '" draggable="true" data-pmsi="' + i + '">' +
        '<img src="' + E(im.src) + '" alt="" loading="lazy" onerror="this.style.opacity=.25">' +
        (i === 0 ? '<span class="pms-im-tag">\u2B50 Main</span>' : '<button type="button" class="pms-im-star" data-pmsstar="' + i + '" title="Set as main image">\u2B50</button>') +
        '<div class="pms-im-bar">' +
          (i > 0 ? '<button type="button" data-pmsleft="' + i + '" title="Move left">\u2190</button>' : '<span></span>') +
          '<button type="button" data-pmsdel="' + i + '" title="Remove">\uD83D\uDDD1</button>' +
          (i < S.images.length - 1 ? '<button type="button" data-pmsright="' + i + '" title="Move right">\u2192</button>' : '<span></span>') +
        '</div>' +
      '</div>').join('');
  }
  const sz = $('pmsImgSize');
  if (sz){
    const b = approxBytes(S.images);
    sz.textContent = S.images.length + ' image(s) \u00B7 ' + (b > 1024 ? (b / 1024).toFixed(0) + ' KB' : b + ' B') +
      (b > MAX_DOC_BYTES ? '  \u26A0\uFE0F too big for one Firestore document \u2014 remove a photo or use an image URL' : '');
    sz.style.color = b > MAX_DOC_BYTES ? '#b3261e' : '';
  }
  /* drag & drop reorder */
  QA('[data-pmsi]', box).forEach(el => {
    el.addEventListener('dragstart', e => { try{ e.dataTransfer.setData('text/plain', el.dataset.pmsi); e.dataTransfer.effectAllowed = 'move'; }catch(_){} });
    el.addEventListener('dragover', e => { e.preventDefault(); el.classList.add('pms-im-over'); });
    el.addEventListener('dragleave', () => el.classList.remove('pms-im-over'));
    el.addEventListener('drop', e => {
      e.preventDefault(); el.classList.remove('pms-im-over');
      let from = -1; try{ from = parseInt(e.dataTransfer.getData('text/plain'), 10); }catch(_){}
      const to = parseInt(el.dataset.pmsi, 10);
      if (Number.isFinite(from) && Number.isFinite(to) && from !== to){
        const m = S.images.splice(from, 1)[0];
        S.images.splice(to, 0, m);
        paintImages();
      }
    });
  });
  QA('[data-pmsstar]', box).forEach(b => b.addEventListener('click', () => {
    const i = +b.dataset.pmsstar; const m = S.images.splice(i, 1)[0]; S.images.unshift(m); paintImages();
  }));
  QA('[data-pmsdel]', box).forEach(b => b.addEventListener('click', () => {
    const i = +b.dataset.pmsdel, im = S.images[i];
    if (!im) return;
    if (im.path) storageDelete(im.path);        /* only our own Storage object */
    S.images.splice(i, 1); paintImages();
  }));
  QA('[data-pmsleft]', box).forEach(b => b.addEventListener('click', () => {
    const i = +b.dataset.pmsleft; if (i > 0){ const t = S.images[i - 1]; S.images[i - 1] = S.images[i]; S.images[i] = t; paintImages(); }
  }));
  QA('[data-pmsright]', box).forEach(b => b.addEventListener('click', () => {
    const i = +b.dataset.pmsright; if (i < S.images.length - 1){ const t = S.images[i + 1]; S.images[i + 1] = S.images[i]; S.images[i] = t; paintImages(); }
  }));
}

/* ================================================================ OVERLAY */
let ovRoot = null;
function overlay(html, after){
  closeOverlay();
  ovRoot = document.createElement('div');
  ovRoot.className = 'pms-ov';
  ovRoot.innerHTML = html;
  document.body.appendChild(ovRoot);
  ovRoot.addEventListener('click', e => {
    if (e.target === ovRoot || e.target.closest('[data-pmsclose]')) closeOverlay();
    const cp = e.target.closest('[data-pmscopy]');
    if (cp){ try{ navigator.clipboard.writeText(cp.dataset.pmscopy); T('\uD83D\uDCCB Copied'); }catch(_){ } }
    const cr = e.target.closest('[data-pmscopyrule]');
    if (cr){ const pre = $('pmsRule'); if (pre){ try{ navigator.clipboard.writeText(pre.textContent); T('\uD83D\uDCCB Rule copied \u2014 Console \u2192 Firestore \u2192 Rules \u2192 paste \u2192 Publish'); }catch(_){ } } }
  });
  if (typeof after === 'function'){ try{ after(ovRoot); }catch(e){} }
  return ovRoot;
}
function closeOverlay(){
  if (ovRoot){ try{ ovRoot.remove(); }catch(e){} ovRoot = null; }
  QA('.pms-ov').forEach(x => { try{ x.remove(); }catch(e){} });
}
function confirmBox(opt){
  return new Promise(resolve => {
    const root = overlay(
      '<div class="pms-ov-card pms-confirm">' +
        '<h3>' + E(opt.title || 'Confirm') + '</h3>' +
        (opt.img ? '<img class="pms-cf-img" src="' + E(opt.img) + '" alt="" onerror="this.style.display=\'none\'">' : '') +
        (opt.name ? '<p class="pms-cf-name"><b>' + E(opt.name) + '</b><br><small class="pms-muted">' + E(opt.meta || '') + '</small></p>' : '') +
        '<p class="pms-muted">' + (opt.text || '') + '</p>' +
        '<div class="pms-cf-btns">' +
          '<button type="button" class="btn btn-ghost pms-btn" data-pmsno>' + E(opt.cancelText || 'Cancel') + '</button>' +
          (opt.danger2 ? '<button type="button" class="btn pms-btn pms-danger2" data-pmsno2>' + E(opt.danger2) + '</button>' : '') +
          '<button type="button" class="btn btn-maroon pms-btn pms-danger" data-pmsyes>' + E(opt.okText || 'Confirm') + '</button>' +
        '</div>' +
        (opt.note ? '<p class="pms-small pms-muted" style="margin-top:10px">' + opt.note + '</p>' : '') +
      '</div>',
      r => {
        const yes = r.querySelector('[data-pmsyes]'), no = r.querySelector('[data-pmsno]'), no2 = r.querySelector('[data-pmsno2]');
        if (yes) yes.addEventListener('click', () => { closeOverlay(); resolve('yes'); });
        if (no)  no.addEventListener('click',  () => { closeOverlay(); resolve('no'); });
        if (no2) no2.addEventListener('click', () => { closeOverlay(); resolve('yes2'); });
      });
    root.addEventListener('click', e => { if (e.target === root){ closeOverlay(); resolve('no'); } });
  });
}

/* ================================================================= RENDER */
function paint(){
  const host = $('tabBody'); if (!host) return;
  host.innerHTML = shellHtml();
  paintStats();          /* fills #pmsStats + #pmsRecent  */
  paintList();           /* fills #pmsBody + #pmsPager    */
  wireShell();           /* now every button exists       */
}
function shellHtml(){
  const cats = (typeof CATEGORIES !== 'undefined' ? CATEGORIES : []);
  return '' +
  /* ---- cloud / load banners ---- */
  (S.loading ? '<div class="pms-banner pms-b-load">\u23F3 Products load ஆகுது\u2026</div>' : '') +
  (S.loadError ? '<div class="pms-banner pms-b-warn">\u26A0\uFE0F Firestore products load ஆகல: ' + E(S.loadError.slice(0, 90)) +
    ' <button type="button" class="pms-mini" data-pmsretry>Retry</button></div>' : '') +
  (!currentUser() && !S.loading ? '<div class="pms-banner pms-b-info">\u2601\uFE0F Cloud save-க்கு ஒரு தடவை connect ஆகணும் ' +
    '<button type="button" class="pms-mini" data-pmsconnect>Connect</button></div>' : '') +
  (S.cloud === 'denied' ? '<div class="pms-banner pms-b-warn">\uD83D\uDD12 Firestore rules இந்த uid-ஐ அனுமதிக்கல ' +
    '<button type="button" class="pms-mini" data-pmsrules>Fix rules</button></div>' : '') +
  (bakedCount() ? '<div class="pms-banner pms-b-warn">\u26A0\uFE0F ' + bakedCount() + ' product(s)-ல பழைய save-ல +10% markup சேர்ந்தே store ஆகிருக்கு. ' +
    '<button type="button" class="pms-mini" data-pmsfixbaked>\uD83E\uDE7A Fix ' + bakedCount() + ' docs</button></div>' : '') +

  /* ---- 1. dashboard stats ---- */
  '<div class="pms-head">' +
    '<div><h2 class="pms-h">\uD83D\uDECD\uFE0F Product Management</h2>' +
      '<p class="pms-sub" id="pmsSub">\u2026</p></div>' +
    '<div class="pms-head-btns">' +
      '<button type="button" class="btn btn-outline btn-sm" id="pmsRefresh" title="Reload from Firestore">\uD83D\uDD04</button>' +
      '<button type="button" class="btn btn-maroon pms-add" id="pmsAdd">\uFF0B Add New Product</button>' +
    '</div>' +
  '</div>' +
  '<div class="pms-stats" id="pmsStats"></div>' +
  '<div class="pms-recent" id="pmsRecent"></div>' +

  /* ---- 6. search + filters ---- */
  '<div class="pms-tools">' +
    '<input id="pmsQ" type="search" placeholder="\uD83D\uDD0D Name / SKU / Product ID / colour\u2026" value="' + E(S.q) + '" autocomplete="off">' +
    '<select id="pmsCat"><option value="all">All categories</option>' +
      cats.map(c => '<option value="' + E(c.slug) + '"' + (S.cat === c.slug ? ' selected' : '') + '>' + E(c.name) + '</option>').join('') + '</select>' +
    '<select id="pmsStatus">' + [{ v:'all', n:'All statuses' }].concat(STATUSES).map(s =>
      '<option value="' + s.v + '"' + (S.status === s.v ? ' selected' : '') + '>' + s.n + '</option>').join('') + '</select>' +
    '<select id="pmsStock">' +
      '<option value="all"' + (S.stock === 'all' ? ' selected' : '') + '>Any stock</option>' +
      '<option value="in"' + (S.stock === 'in' ? ' selected' : '') + '>In stock</option>' +
      '<option value="low"' + (S.stock === 'low' ? ' selected' : '') + '>Low stock (\u22645)</option>' +
      '<option value="out"' + (S.stock === 'out' ? ' selected' : '') + '>Out of stock</option>' +
    '</select>' +
    '<input id="pmsMin" class="pms-price" type="number" inputmode="numeric" min="0" placeholder="\u20B9 min" value="' + E(S.min) + '">' +
    '<input id="pmsMax" class="pms-price" type="number" inputmode="numeric" min="0" placeholder="\u20B9 max" value="' + E(S.max) + '">' +
    '<select id="pmsSort">' +
      '<option value="newest"' + (S.sort === 'newest' ? ' selected' : '') + '>Newest first</option>' +
      '<option value="oldest"' + (S.sort === 'oldest' ? ' selected' : '') + '>Oldest first</option>' +
      '<option value="pricedesc"' + (S.sort === 'pricedesc' ? ' selected' : '') + '>Price: high \u2192 low</option>' +
      '<option value="priceasc"' + (S.sort === 'priceasc' ? ' selected' : '') + '>Price: low \u2192 high</option>' +
      '<option value="best"' + (S.sort === 'best' ? ' selected' : '') + '>Best selling</option>' +
      '<option value="stockasc"' + (S.sort === 'stockasc' ? ' selected' : '') + '>Stock: low \u2192 high</option>' +
      '<option value="name"' + (S.sort === 'name' ? ' selected' : '') + '>Name A\u2192Z</option>' +
    '</select>' +
    '<button type="button" class="btn btn-ghost btn-sm pms-clear" id="pmsClear">\u2715 Clear</button>' +
  '</div>' +

  /* ---- 5. bulk bar ---- */
  '<div class="pms-bulk" id="pmsBulk" style="display:none"></div>' +

  /* ---- table / cards ---- */
  '<div class="pms-table-wrap"><table class="pms-table"><thead><tr>' +
    '<th class="pms-c-sel"><input type="checkbox" id="pmsSelAll" title="Select all"></th>' +
    '<th>Product</th><th>Price</th><th>Stock</th><th>Status</th><th class="pms-c-act">Actions</th>' +
  '</tr></thead><tbody id="pmsBody"></tbody></table></div>' +
  '<div class="pms-foot">' +
    '<p class="pms-muted pms-small" id="pmsCount"></p>' +
    '<div class="pms-pager" id="pmsPager"></div>' +
  '</div>';
}

function paintStats(){
  const st = stats();
  const box = $('pmsStats'); if (!box) return;
  const card = (n, label, cls, filter) =>
    '<button type="button" class="pms-stat ' + (cls || '') + '" data-pmsstat="' + (filter || '') + '">' +
      '<b>' + n + '</b><span>' + label + '</span></button>';
  box.innerHTML =
    card(st.total, 'Total products', '', 'all') +
    card(st.active, 'Active', 'ok', 'active') +
    card(st.draft, 'Draft', 'warn', 'draft') +
    card(st.inactive, 'Inactive', '', 'inactive') +
    card(st.out, 'Out of stock', 'bad', 'out') +
    card(st.low, 'Low stock', 'warn', 'low') +
    card(st.archived, 'Archived', '', 'archived');
  const sub = $('pmsSub');
  if (sub) sub.textContent = S.loaded
    ? (currentUser() ? '\u2601\uFE0F Firestore connected' : '\uD83D\uDCF1 Device mode \u2014 connect to save to cloud') +
      ' \u00B7 ' + st.total + ' products'
    : 'Loading\u2026';
  /* recently added */
  const rc = $('pmsRecent');
  if (rc){
    rc.innerHTML = st.recent.length
      ? '<div class="pms-recent-h">🕒 Recently added</div><div class="pms-recent-row">' +
        st.recent.map(p =>
          '<button type="button" class="pms-rc" data-pmsedit="' + E(p.id) + '">' +
            '<img src="' + E(p.img) + '" alt="" loading="lazy" onerror="this.style.visibility=\'hidden\'">' +
            '<span>' + E(p.name.slice(0, 26)) + '</span><small>' + fmtDate(p.createdAt || p.updatedAt) + '</small>' +
          '</button>').join('') + '</div>'
      : '';
  }
}

function paintList(){
  const body = $('pmsBody'); if (!body) return;
  const list = filtered();
  const pages = Math.max(1, Math.ceil(list.length / S.per));
  S.page = clamp(S.page, 1, pages);
  const view = list.slice((S.page - 1) * S.per, S.page * S.per);
  if (!view.length){
    body.innerHTML = '<tr><td colspan="6" class="pms-empty">' +
      (S.list.length ? '🔍 இந்த filter-ல product இல்ல.' : '⏳ Products இல்ல — "＋ Add New Product" அழுத்துங்க.') + '</td></tr>';
  }else{
    body.innerHTML = view.map(p => {
      const disc = p.mrp > p.price ? Math.round((1 - p.price / p.mrp) * 100) : 0;
      return '<tr class="pms-row' + (S.sel[p.id] ? ' pms-row-sel' : '') + '" data-pmsrow="' + E(p.id) + '">' +
        '<td class="pms-c-sel" data-label=""><input type="checkbox" class="pms-sel" value="' + E(p.id) + '"' + (S.sel[p.id] ? ' checked' : '') + '></td>' +
        '<td data-label="Product"><div class="pms-cell-prod">' +
            '<img src="' + E(p.img) + '" alt="" loading="lazy" decoding="async" onerror="this.className=\'pms-noimg\'">' +
            '<div class="pms-cell-txt"><button type="button" class="pms-name" data-pmsedit="' + E(p.id) + '">' + E(p.name) + '</button>' +
            '<small class="pms-muted">SKU ' + E(p.sku || p.id) + ' · ' + E(p.cat) + (p.sub ? ' / ' + E(p.sub) : '') +
              (p.images.length > 1 ? ' · 🖼 ' + p.images.length : '') + (p.sales ? ' · 🛒 ' + p.sales + ' sold' : '') + '</small></div>' +
          '</div></td>' +
        '<td data-label="Price"><button type="button" class="pms-quick" data-pmsq="price" data-pmsid="' + E(p.id) + '">' + M(p.price) +
            '<small class="pms-cust">site ' + M(custPrice(p)) + '</small>' +
            (disc ? '<small class="pms-off">' + disc + '% off</small>' : '') +
            (p.baked ? '<small class="pms-baked" title="+10% already baked into this doc — open Edit → Save to repair">\u26A0 baked</small>' : '') + '</button></td>' +
        '<td data-label="Stock"><button type="button" class="pms-quick' + (p.stock <= 0 ? ' pms-q-bad' : p.stock <= 5 ? ' pms-q-low' : '') + '" data-pmsq="stock" data-pmsid="' + E(p.id) + '">' +
            (p.stock <= 0 ? 'Out' : p.stock) + '</button></td>' +
        '<td data-label="Status"><button type="button" class="pms-quick pms-st-' + p.status + '" data-pmsq="status" data-pmsid="' + E(p.id) + '">' +
            stEmoji(p.status) + ' ' + stName(p.status) + '</button></td>' +
        '<td class="pms-c-act" data-label="">' +
          '<div class="pms-acts">' +
            '<button type="button" class="btn btn-outline btn-sm" data-pmsedit="' + E(p.id) + '">✏️ Edit</button>' +
            (p.status === 'archived'
              ? '<button type="button" class="btn btn-outline btn-sm" data-pmsrestore="' + E(p.id) + '" title="Restore">♻️</button>'
              : '') +
            '<button type="button" class="btn btn-ghost btn-sm" data-pmsdel="' + E(p.id) + '" title="Delete / archive">🗑</button>' +
            '<a class="btn btn-ghost btn-sm" href="' + E((typeof productUrl === 'function') ? productUrl(p) : 'product.html?id=' + encodeURIComponent(p.id)) + '" target="_blank" rel="noopener" title="View on site">👁</a>' +
          '</div></td>' +
      '</tr>';
    }).join('');
  }
  const cnt = $('pmsCount');
  if (cnt) cnt.textContent = list.length + ' product(s)' + (list.length !== S.list.length ? ' of ' + S.list.length : '') +
    ' · page ' + S.page + '/' + pages + (selCount() ? ' · ' + selCount() + ' selected' : '');
  const pg = $('pmsPager');
  if (pg){
    let h = '';
    h += '<button type="button" class="pms-pg" data-pmspage="1"' + (S.page === 1 ? ' disabled' : '') + '>«</button>';
    h += '<button type="button" class="pms-pg" data-pmspage="' + (S.page - 1) + '"' + (S.page === 1 ? ' disabled' : '') + '>‹</button>';
    for (let i = Math.max(1, S.page - 2); i <= Math.min(pages, S.page + 2); i++)
      h += '<button type="button" class="pms-pg' + (i === S.page ? ' on' : '') + '" data-pmspage="' + i + '">' + i + '</button>';
    h += '<button type="button" class="pms-pg" data-pmspage="' + (S.page + 1) + '"' + (S.page === pages ? ' disabled' : '') + '>›</button>';
    h += '<button type="button" class="pms-pg" data-pmspage="' + pages + '"' + (S.page === pages ? ' disabled' : '') + '>»</button>';
    pg.innerHTML = h;
  }
  wireList();
  paintBulk();
}

function paintBulk(){
  const bar = $('pmsBulk'); if (!bar) return;
  const n = selCount();
  if (!n){ bar.style.display = 'none'; bar.innerHTML = ''; return; }
  bar.style.display = 'flex';
  const cats = (typeof CATEGORIES !== 'undefined' ? CATEGORIES : []);
  bar.innerHTML =
    '<b>' + n + ' selected</b>' +
    '<button type="button" class="pms-b" data-pmsbulk="activate">🟢 Activate</button>' +
    '<button type="button" class="pms-b" data-pmsbulk="deactivate">⏸ Deactivate</button>' +
    '<button type="button" class="pms-b" data-pmsbulk="draft">📝 Draft</button>' +
    (selIds().some(id => { const p = S.list.find(x => x.id === id); return p && p.status === 'archived'; })
      ? '<button type="button" class="pms-b" data-pmsbulk="restore">♻️ Restore</button>' : '') +
    '<button type="button" class="pms-b" data-pmsbulk="category">🗂 Category</button>' +
    '<button type="button" class="pms-b" data-pmsbulk="price">₹ Price</button>' +
    '<button type="button" class="pms-b" data-pmsbulk="stock">📦 Stock</button>' +
    '<button type="button" class="pms-b" data-pmsbulk="csv">⬇️ Export CSV</button>' +
    '<button type="button" class="pms-b pms-b-del" data-pmsbulk="delete">🗑 Delete</button>' +
    '<button type="button" class="pms-b" data-pmsbulk="clear">✕ Clear</button>' +
    '<span class="pms-bulk-cats" id="pmsBulkCats" style="display:none">' +
      '<select id="pmsBulkCatSel"><option value="">Choose category…</option>' + cats.map(c => '<option value="' + E(c.slug) + '">' + E(c.name) + '</option>').join('') + '</select>' +
      '<button type="button" class="pms-b" data-pmsbulk="category-apply">Apply</button></span>' +
    '<span class="pms-bulk-cats" id="pmsBulkVal" style="display:none">' +
      '<select id="pmsBulkMode"><option value="set">Set to</option><option value="inc">+ increase</option><option value="dec">− decrease</option><option value="pct">% change</option></select>' +
      '<input id="pmsBulkNum" type="number" inputmode="numeric" placeholder="value">' +
      '<button type="button" class="pms-b" data-pmsbulk="val-apply">Apply</button></span>';
  QA('[data-pmsbulk]', bar).forEach(b => b.addEventListener('click', () => bulkAction(b.dataset.pmsbulk)));
}

function wireShell(){
  const on = (id, ev, fn) => { const el = $(id); if (el) el.addEventListener(ev, fn); };
  on('pmsAdd', 'click', () => openForm(null));
  on('pmsRefresh', 'click', () => { S.loaded = false; load(true); });
  on('pmsQ', 'input', e => { S.q = e.target.value; S.page = 1; paintList(); });
  on('pmsCat', 'change', e => { S.cat = e.target.value; S.page = 1; paintList(); });
  on('pmsStatus', 'change', e => { S.status = e.target.value; S.page = 1; paintList(); });
  on('pmsStock', 'change', e => { S.stock = e.target.value; S.page = 1; paintList(); });
  on('pmsMin', 'input', e => { S.min = e.target.value; S.page = 1; paintList(); });
  on('pmsMax', 'input', e => { S.max = e.target.value; S.page = 1; paintList(); });
  on('pmsSort', 'change', e => { S.sort = e.target.value; S.page = 1; paintList(); });
  on('pmsClear', 'click', () => { S.q = ''; S.cat = 'all'; S.status = 'all'; S.stock = 'all'; S.min = ''; S.max = ''; S.sort = 'newest'; S.page = 1; paint(); });
  on('pmsSelAll', 'change', e => {
    const ids = filtered().slice((S.page - 1) * S.per, S.page * S.per).map(p => p.id);
    ids.forEach(id => { if (e.target.checked) S.sel[id] = true; else delete S.sel[id]; });
    paintList();
  });
  QA('[data-pmsstat]').forEach(b => b.addEventListener('click', () => {
    const v = b.dataset.pmsstat;
    if (v === 'out'){ S.status = 'active'; S.stock = 'out'; }
    else if (v === 'low'){ S.status = 'active'; S.stock = 'low'; }
    else if (v === 'all'){ S.status = 'all'; S.stock = 'all'; }
    else { S.status = v; S.stock = 'all'; }
    S.page = 1; paint();
  }));
  QA('[data-pmsretry]').forEach(b => b.addEventListener('click', () => { S.loaded = false; load(true); }));
  QA('[data-pmsconnect]').forEach(b => b.addEventListener('click', async () => {
    const u = await connect();
    if (u) T('☁️ Connected as ' + (u.email || u.uid));
    paint();
  }));
  QA('[data-pmsrules]').forEach(b => b.addEventListener('click', () => overlay(deniedPanel(S.deniedInfo))));
  QA('[data-pmsfixbaked]').forEach(b => b.addEventListener('click', () => fixBaked()));
  QA('[data-pmspage]', $('pmsPager') || document).forEach(b => b.addEventListener('click', () => {
    S.page = int(b.dataset.pmspage, 1); paintList();
    try{ window.scrollTo({ top: 0, behavior: 'smooth' }); }catch(e){}
  }));
}

function wireList(){
  QA('.pms-sel').forEach(cb => cb.addEventListener('change', () => {
    if (cb.checked) S.sel[cb.value] = true; else delete S.sel[cb.value];
    const tr = cb.closest('tr'); if (tr) tr.classList.toggle('pms-row-sel', cb.checked);
    paintBulk();
    const cnt = $('pmsCount');
    if (cnt){ const n = selCount(); cnt.textContent = cnt.textContent.replace(/· \d+ selected/, '') + (n ? ' · ' + n + ' selected' : ''); }
  }));
  QA('[data-pmsedit]').forEach(b => b.addEventListener('click', () => openForm(b.dataset.pmsedit)));
  QA('[data-pmsdel]').forEach(b => b.addEventListener('click', () => askDelete(b.dataset.pmsdel)));
  QA('[data-pmsrestore]').forEach(b => b.addEventListener('click', () => runRestore([b.dataset.pmsrestore])));
  QA('[data-pmsq]').forEach(b => b.addEventListener('click', () => quickEdit(b.dataset.pmsid, b.dataset.pmsq, b)));
}

/* ---------------------------------------------------- 7. inline quick edit */
function quickEdit(id, field, btn){
  const p = S.list.find(x => x.id === id); if (!p || !btn) return;
  if (btn.dataset.editing) return;
  const td = btn.closest('td') || btn.parentElement;
  const old = btn.outerHTML;          /* captured BEFORE the flag, so Cancel restores a live button */
  btn.dataset.editing = '1';
  if (field === 'status'){
    td.innerHTML = '<select class="pms-inline">' + STATUSES.filter(s => s.v !== 'archived')
      .map(s => '<option value="' + s.v + '"' + (s.v === p.status ? ' selected' : '') + '>' + s.e + ' ' + s.n + '</option>').join('') + '</select>' +
      '<div class="pms-inline-btns"><button type="button" class="pms-ok">Save</button><button type="button" class="pms-no">Cancel</button></div>';
  }else{
    td.innerHTML = '<input class="pms-inline" type="number" inputmode="numeric" min="0" value="' + (field === 'price' ? p.price : p.stock) + '">' +
      '<div class="pms-inline-btns"><button type="button" class="pms-ok">Save</button><button type="button" class="pms-no">Cancel</button></div>';
  }
  const inp = td.querySelector('.pms-inline');
  try{ inp.focus(); if (inp.select) inp.select(); }catch(e){}
  const restore = () => { td.innerHTML = old; wireList(); };
  td.querySelector('.pms-no').addEventListener('click', restore);
  td.querySelector('.pms-ok').addEventListener('click', async () => {
    const patch = {};
    if (field === 'status') patch.status = inp.value;
    else if (field === 'price'){
      const v = int(inp.value, -1);
      if (!(v > 0)){ T('⚠️ Price 1-க்கு மேல இருக்கணும்'); return restore(); }
      patch.price = v;
    }else{
      const v = int(inp.value, -1);
      if (v < 0){ T('⚠️ Stock 0-க்கு கீழ இருக்கக்கூடாது'); return restore(); }
      patch.stock = clamp(v, 0, 999999);
    }
    td.innerHTML = '<span class="pms-muted pms-small">⏳ saving…</span>';
    try{
      await savePatch(p, patch);
      T('✅ ' + (field === 'price' ? 'Price' : field === 'stock' ? 'Stock' : 'Status') + ' updated');
    }catch(err){
      if (String(err && err.message) !== 'not-connected') T('⚠️ Save failed: ' + String((err && err.message) || err).slice(0, 60));
    }
    paintList();
  });
  if (inp.tagName === 'INPUT') inp.addEventListener('keydown', e => {
    if (e.key === 'Enter') td.querySelector('.pms-ok').click();
    if (e.key === 'Escape') restore();
  });
}

/* build the Firestore document from a row */
function docFrom(p){
  const d = Object.assign({}, S.raw[p.id] || {});
  const disc = p.mrp > p.price ? Math.round((1 - p.price / p.mrp) * 100) : 0;
  Object.assign(d, {
    id: p.id, sku: p.sku, name: p.name, desc: p.desc,
    cat: p.cat, sub: p.sub || '',
    price: Math.round(p.price), mrp: Math.round(Math.max(p.price, p.mrp || p.price)),
    disc: disc,
    stock: clamp(int(p.stock, 0), 0, 999999),
    status: p.status,
    hidden: p.status !== 'active',
    img: p.images[0] || '',
    images: p.images.slice(0, 8),
    img2: p.images[1] || '', img3: p.images[2] || '',
    colors: (p.colors && p.colors.length ? p.colors : ['Multi']).slice(0, 12),
    col: (p.colors && p.colors.length ? p.colors : ['Multi']).join('/'),
    colourStock: (p.colourStock && Object.keys(p.colourStock).length) ? p.colourStock : null,
    sizes: (p.sizes || []).slice(0, 12),
    designs: (p.designs || []).slice(0, 12),
    fabric: p.fabric || 'Premium fabric',
    len: p.length || '6.3 m + blouse',
    length: p.length || '6.3 m + blouse',
    blouse: p.blouseIncluded ? (p.blouse && !/no\s*blouse/i.test(p.blouse) ? p.blouse : 'Blouse piece included') : 'No blouse piece',
    blouseIncluded: !!p.blouseIncluded,
    wash: p.wash || 'Normal wash',
    border: p.border || '—',
    weight: clamp(int(p.weight, 800), 50, 5000),
    shipping: clamp(int(p.shipping, 0), 0, 5000),
    badge: p.badge || '',
    video: p.video || '',
    seoTitle: p.seoTitle || '', seoDesc: p.seoDesc || '',
    _mkUp: 1,
    updatedAt: nowMs(),
  });
  /* 💯 V62 — the document stores the REAL price and must never carry a truthy
     `_mkUp` (that flag is in-memory only; storing it bakes the +10% into the
     database). A Firestore MERGE cannot remove a key, so it is written as null:
     normalizeProduct() checks `!!raw._mkUp`, so null = "apply the markup". */
  d._mkUp = null;
  d.realPrice = Math.round(p.price);
  d.realMrp = Math.max(Math.round(p.price), Math.round(p.mrp || p.price));
  /* leaving the archive must clear the flag, otherwise normStatus() would keep
     reading the product as archived forever */
  if (d.status !== 'archived') d.archivedAt = null;
  if (!d.createdAt) d.createdAt = nowMs();
  /* never store junk */
  ['img4'].forEach(k => { if (d[k] === '') delete d[k]; });
  return d;
}

/* write one row (used by quick edit + form save) */
async function saveRow(p, opts){
  opts = opts || {};
  const doc = docFrom(p);
  const bytes = JSON.stringify(doc).length;
  if (bytes > 1000000) throw new Error('Product too large (' + Math.round(bytes / 1024) + ' KB) — remove some photos');
  await cloud(() => writeDoc(p.id, doc));
  applyLocal(p, false);
  if (!opts.silent) try{ if (typeof refreshFeedCache === 'function') refreshFeedCache(); }catch(e){}
  return doc;
}
async function savePatch(p, patch){
  const next = Object.assign({}, p, patch);
  if (patch.status) next.hidden = patch.status !== 'active';
  await saveRow(next, { silent: true });
  const i = S.list.findIndex(x => x.id === p.id);
  if (i >= 0) S.list[i] = next; else S.list.unshift(next);
  return next;
}

/* ---------------------------------------------------- 2/3. add + edit form */
function openForm(id){
  const isNew = !id;
  const p = id ? S.list.find(x => x.id === id) : null;
  if (id && !p){ T('⚠️ Product not found — list-ஐ refresh பண்ணுங்க'); return; }
  S.editing = id || null;
  const cats = (typeof CATEGORIES !== 'undefined' ? CATEGORIES : []);
  const base = p || {
    id: '', sku: '', name: '', desc: '', cat: (cats[0] && cats[0].slug) || 'daily', sub: '',
    price: 0, mrp: 0, stock: 10, status: 'active', images: [], colors: [], sizes: [], designs: [],
    colourStock: null, fabric: 'Premium fabric', length: '6.3 m + blouse', blouseIncluded: true,
    wash: 'Normal wash', border: '', weight: 800, shipping: 0, badge: '', video: '', seoTitle: '', seoDesc: '',
  };
  S.images = (base.images || []).map(u => ({ src: u, path: '', name: '', bytes: 0, uploaded: false }));
  const autoId = (typeof nextSku === 'function') ? nextSku() : ('SK' + Math.floor(1000 + Math.random() * 9000));
  const opt = (v, n, sel) => '<option value="' + E(v) + '"' + (sel ? ' selected' : '') + '>' + E(n) + '</option>';

  overlay(
  '<div class="pms-sheet">' +
    '<div class="pms-sheet-top">' +
      '<button type="button" class="pms-ov-x" data-pmsclose>✕</button>' +
      '<h3>' + (isNew ? '➕ Add New Product' : '✏️ Edit Product') + '</h3>' +
      '<p class="pms-muted pms-small" id="pmsFormMeta">' + (isNew ? 'New product' : 'SKU ' + E(base.sku || base.id)) + '</p>' +
    '</div>' +
    '<div class="pms-sheet-body">' +
      '<p class="pms-err" id="pmsFormErr"></p>' +

      '<div class="pms-grid">' +
        '<div class="pms-f pms-f2"><label>Product Name *</label><input id="pmsName" maxlength="90" value="' + E(base.name) + '" placeholder="e.g. Kanchipuram Soft Silk Saree"></div>' +
        '<div class="pms-f"><label>Product ID / SKU *</label>' +
          '<div class="pms-row2"><input id="pmsSku" maxlength="40" value="' + E(base.sku || base.id) + '" placeholder="' + E(autoId) + '">' +
          '<button type="button" class="pms-mini" id="pmsSkuAuto" title="Auto-generate">🎲</button></div></div>' +
        '<div class="pms-f"><label>Category *</label><select id="pmsCatSel">' + cats.map(c => opt(c.slug, c.name, c.slug === base.cat)).join('') + '</select></div>' +
        '<div class="pms-f"><label>Subcategory</label><input id="pmsSub" value="' + E(base.sub) + '" placeholder="e.g. Wedding"></div>' +
        '<div class="pms-f pms-f2"><label>Description</label><textarea id="pmsDesc" rows="3" placeholder="Fabric, work, occasion…">' + E(base.desc) + '</textarea></div>' +
      '</div>' +

      /* ---- 8. image manager ---- */
      '<div class="pms-sec"><b>🖼 Product Images</b>' +
        '<div class="pms-drop" id="pmsDrop">' +
          '<p>📷 Photo-ஐ இங்க drop பண்ணுங்க <span class="pms-muted">அல்லது</span></p>' +
          '<button type="button" class="btn btn-outline btn-sm" id="pmsPick">Choose photos</button>' +
          '<div class="pms-row2" style="margin-top:8px"><input id="pmsImgUrl" placeholder="…அல்லது image URL paste பண்ணுங்க (https://…)">' +
          '<button type="button" class="pms-mini" id="pmsImgAdd">＋ Add</button></div>' +
          '<div class="pms-up"><div class="pms-up-bar" id="pmsUpBar"></div><span id="pmsUpLbl"></span></div>' +
        '</div>' +
        '<div class="pms-imgs" id="pmsImgs"></div>' +
        '<p class="pms-small pms-muted" id="pmsImgSize"></p>' +
        '<p class="pms-small pms-muted">⭐ = main image · ← → = reorder · பெரிய photo automatically compress ஆகும்.</p>' +
      '</div>' +

      /* ---- pricing ---- */
      '<div class="pms-sec"><b>💰 Pricing & Stock</b>' +
        '<div class="pms-grid">' +
          '<div class="pms-f"><label>Selling Price (₹) * <span class="pms-muted">— உங்க real rate</span></label><input id="pmsPrice" type="number" inputmode="numeric" min="1" value="' + (base.price || '') + '">' +
            '<small class="pms-hint" id="pmsCustHint"></small></div>' +
          '<div class="pms-f"><label>MRP / Original Price (₹)</label><input id="pmsMrp" type="number" inputmode="numeric" min="0" value="' + (base.mrp || '') + '"></div>' +
          '<div class="pms-f"><label>Discount % <span class="pms-muted">(auto)</span></label><input id="pmsDisc" type="number" inputmode="numeric" min="0" max="90" value=""></div>' +
          '<div class="pms-f"><label>Stock Quantity</label><input id="pmsStockQty" type="number" inputmode="numeric" min="0" value="' + int(base.stock, 10) + '"></div>' +
          '<div class="pms-f"><label>Status</label><select id="pmsStatusSel">' +
            STATUSES.filter(s => s.v !== 'archived').map(s => opt(s.v, s.e + ' ' + s.n, s.v === base.status)).join('') + '</select></div>' +
          '<div class="pms-f"><label>Badge</label><select id="pmsBadge">' +
            ['', 'New', 'Bestseller', 'Sale', 'Limited Stock'].map(b => opt(b, b || '— none —', b === base.badge)).join('') + '</select></div>' +
          '<div class="pms-f"><label>Shipping Charge (₹)</label><input id="pmsShip" type="number" inputmode="numeric" min="0" value="' + int(base.shipping, 0) + '"></div>' +
          '<div class="pms-f"><label>Weight (g)</label><input id="pmsWeight" type="number" inputmode="numeric" min="50" value="' + int(base.weight, 800) + '"></div>' +
        '</div>' +
        '<p class="pms-small pms-muted">💯 இங்க போடுறது <b>உங்க real rate</b>. Customer-க்கு site-ல அது + <b>' + Math.round(markupPct() * 100) + '%</b> markup-ஆ தானா காட்டும். Admin-ல எப்பவும் real rate தான் தெரியும்.</p>' +
      '</div>' +

      /* ---- saree details + variants ---- */
      '<div class="pms-sec"><b>🧵 Saree Details & Variants</b>' +
        '<div class="pms-grid">' +
          '<div class="pms-f"><label>Fabric</label><input id="pmsFabric" value="' + E(base.fabric) + '" placeholder="Soft Silk / Cotton…"></div>' +
          '<div class="pms-f"><label>Saree Length</label><input id="pmsLen" value="' + E(base.length) + '" placeholder="6.3 m + blouse"></div>' +
          '<div class="pms-f"><label>Blouse Included</label><select id="pmsBlouse">' +
            opt('yes', 'Yes — blouse piece included', base.blouseIncluded !== false) +
            opt('no', 'No blouse piece', base.blouseIncluded === false) + '</select></div>' +
          '<div class="pms-f"><label>Wash / Care</label><input id="pmsWash" value="' + E(base.wash) + '"></div>' +
          '<div class="pms-f pms-f2"><label>Colours (comma separated)</label><input id="pmsColors" value="' + E((base.colors || []).join(', ')) + '" placeholder="Red, Gold"></div>' +
          '<div class="pms-f"><label>Sizes (comma separated)</label><input id="pmsSizes" value="' + E((base.sizes || []).join(', ')) + '" placeholder="Free, XL"></div>' +
          '<div class="pms-f"><label>Designs (comma separated)</label><input id="pmsDesigns" value="' + E((base.designs || []).join(', ')) + '" placeholder="Temple, Floral"></div>' +
          '<div class="pms-f pms-f2"><label>Colour-wise stock</label><input id="pmsColStock" value="' + E(csToStr(base.colourStock)) + '" placeholder="Red:3, Blue:2 — optional"></div>' +
          '<div class="pms-f pms-f2"><label>Video URL (YouTube)</label><input id="pmsVideo" value="' + E(base.video) + '" placeholder="https://youtube.com/watch?v=…"></div>' +
        '</div>' +
      '</div>' +

      /* ---- SEO ---- */
      '<div class="pms-sec"><b>🔎 SEO</b>' +
        '<div class="pms-grid">' +
          '<div class="pms-f pms-f2"><label>SEO Title <span class="pms-muted" id="pmsSeoTLen"></span></label>' +
            '<input id="pmsSeoT" maxlength="70" value="' + E(base.seoTitle) + '" placeholder="Buy ' + E(base.name || 'Saree') + ' Online | SK Sarees"></div>' +
          '<div class="pms-f pms-f2"><label>SEO Description <span class="pms-muted" id="pmsSeoDLen"></span></label>' +
            '<textarea id="pmsSeoD" rows="2" maxlength="170" placeholder="One line that Google shows under the title…">' + E(base.seoDesc) + '</textarea></div>' +
        '</div>' +
        '<p class="pms-small pms-muted">காலியா விட்டா site product name/description-லேர்ந்தே SEO tag-ஐ உருவாக்கும்.</p>' +
      '</div>' +
    '</div>' +

    '<div class="pms-sheet-foot">' +
      '<button type="button" class="btn btn-ghost pms-btn" data-pmsclose>Cancel</button>' +
      '<button type="button" class="btn btn-outline pms-btn" id="pmsPreview">👁 Preview</button>' +
      '<button type="button" class="btn btn-outline pms-btn" id="pmsDraft">📝 Save as Draft</button>' +
      '<button type="button" class="btn btn-maroon pms-btn" id="pmsSave">💾 Save Product</button>' +
    '</div>' +
  '</div>', root => {
    paintImages();
    /* file picker + drag & drop */
    const fi = document.createElement('input');
    fi.type = 'file'; fi.accept = 'image/*'; fi.multiple = true; fi.style.display = 'none';
    document.body.appendChild(fi);
    fi.addEventListener('change', () => { addFiles(fi.files); fi.value = ''; });
    const pick = $('pmsPick', root); if (pick) pick.addEventListener('click', () => fi.click());
    const drop = $('pmsDrop', root);
    if (drop){
      ['dragenter','dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('pms-drop-on'); }));
      ['dragleave','drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('pms-drop-on'); }));
      drop.addEventListener('drop', e => { try{ addFiles(e.dataTransfer.files); }catch(_){} });
    }
    const addUrl = $('pmsImgAdd', root);
    if (addUrl) addUrl.addEventListener('click', () => {
      const u = String(($('pmsImgUrl', root) || {}).value || '').trim();
      if (!/^https?:\/\/|data:image\//i.test(u)){ T('⚠️ சரியான image URL கொடுங்க'); return; }
      S.images.push({ src: u, path: '', name: u.split('/').pop() || 'url', bytes: 0, uploaded: false });
      $('pmsImgUrl', root).value = '';
      paintImages();
    });
    const skuAuto = $('pmsSkuAuto', root);
    if (skuAuto) skuAuto.addEventListener('click', () => {
      const v = (typeof nextSku === 'function') ? nextSku() : ('SK' + Math.floor(1000 + Math.random() * 9000));
      $('pmsSku', root).value = v;
    });
    /* price ↔ mrp ↔ discount */
    const pr = $('pmsPrice', root), mr = $('pmsMrp', root), dc = $('pmsDisc', root);
    const syncDisc = () => {
      const a = num(pr.value, 0), b = num(mr.value, 0);
      if (dc && a > 0 && b > a) dc.value = Math.round((1 - a / b) * 100);
      const hint = $('pmsCustHint', root);
      if (hint){
        const pc = Math.round(markupPct() * 100);
        hint.textContent = a > 0
          ? ('\uD83D\uDC41 Customer-க்கு site-ல \u20B9' + Math.round(a * (1 + markupPct())).toLocaleString('en-IN') +
             ' தெரியும்  (real \u20B9' + Math.round(a).toLocaleString('en-IN') + ' + ' + pc + '%)')
          : '';
      }
    };
    if (pr) pr.addEventListener('input', syncDisc);
    if (mr) mr.addEventListener('input', syncDisc);
    if (dc) dc.addEventListener('input', () => {
      const a = num(pr.value, 0), d = clamp(num(dc.value, 0), 0, 90);
      if (a > 0 && d > 0 && mr) mr.value = Math.round(a * 100 / (100 - d));
    });
    syncDisc();
    /* seo counters */
    const st = $('pmsSeoT', root), sd = $('pmsSeoD', root);
    const cnt = () => {
      const a = $('pmsSeoTLen', root), b = $('pmsSeoDLen', root);
      if (a && st) a.textContent = '(' + st.value.length + '/70)';
      if (b && sd) b.textContent = '(' + sd.value.length + '/170)';
    };
    if (st) st.addEventListener('input', cnt);
    if (sd) sd.addEventListener('input', cnt);
    cnt();

    $('pmsSave', root).addEventListener('click', () => submitForm('active'));
    $('pmsDraft', root).addEventListener('click', () => submitForm('draft'));
    $('pmsPreview', root).addEventListener('click', () => previewForm());
  });
}
function csToStr(cs){
  if (!cs || typeof cs !== 'object') return '';
  return Object.keys(cs).map(k => k + ':' + cs[k]).join(', ');
}
function strToCs(s){
  const out = {};
  String(s || '').split(',').forEach(part => {
    const kv = part.split(':');
    if (kv.length === 2){
      const k = kv[0].trim(), v = Math.round(parseFloat(kv[1]));
      if (k && Number.isFinite(v)) out[k] = clamp(v, 0, 99999);
    }
  });
  return Object.keys(out).length ? out : null;
}
function readForm(statusOverride){
  const v = id => { const el = $(id); return el ? el.value : ''; };
  const sku = String(v('pmsSku') || '').trim() || String(v('pmsName') || '');
  const id = String(sku || '').trim();
  const price = int(v('pmsPrice'), 0);
  const mrp = Math.max(price, int(v('pmsMrp'), 0) || price);
  return {
    id: id, sku: id,
    name: String(v('pmsName') || '').trim(),
    desc: String(v('pmsDesc') || '').trim(),
    cat: String(v('pmsCatSel') || 'daily'),
    sub: String(v('pmsSub') || '').trim(),
    price: price, mrp: mrp,
    stock: clamp(int(v('pmsStockQty'), 0), 0, 999999),
    status: statusOverride || String(v('pmsStatusSel') || 'active'),
    images: S.images.map(im => im.src).filter(Boolean),
    colors: String(v('pmsColors') || '').split(',').map(x => x.trim()).filter(Boolean),
    colourStock: strToCs(v('pmsColStock')),
    sizes: String(v('pmsSizes') || '').split(',').map(x => x.trim()).filter(Boolean),
    designs: String(v('pmsDesigns') || '').split(',').map(x => x.trim()).filter(Boolean),
    fabric: String(v('pmsFabric') || '').trim(),
    length: String(v('pmsLen') || '').trim(),
    blouseIncluded: v('pmsBlouse') !== 'no',
    wash: String(v('pmsWash') || '').trim(),
    weight: clamp(int(v('pmsWeight'), 800), 50, 5000),
    shipping: clamp(int(v('pmsShip'), 0), 0, 5000),
    badge: String(v('pmsBadge') || ''),
    video: String(v('pmsVideo') || '').trim(),
    seoTitle: String(v('pmsSeoT') || '').trim(),
    seoDesc: String(v('pmsSeoD') || '').trim(),
    createdAt: (S.editing && (S.raw[S.editing] || {}).createdAt) || nowMs(),
  };
}
function validate(p, isNew){
  const errs = [];
  if (!p.name || p.name.length < 2) errs.push('Product Name வேணும் (2 எழுத்து மேல).');
  if (!/^[A-Za-z0-9_-]{3,40}$/.test(p.id)) errs.push('Product ID / SKU: 3–40 எழுத்து, A-Z 0-9 - _ மட்டும் (space வேண்டாம்).');
  if (!(p.price > 0)) errs.push('Selling Price 0-க்கு மேல இருக்கணும்.');
  if (p.mrp && p.mrp < p.price) errs.push('MRP selling price-ஐ விட குறைவா இருக்கு.');
  if (!(p.stock >= 0)) errs.push('Stock 0 அல்லது மேல.');
  if (!p.images.length) errs.push('ஒரு product image வேணும் (upload அல்லது URL).');
  if (typeof CATEGORIES !== 'undefined' && !CATEGORIES.some(c => c.slug === p.cat)) errs.push('Category சரியா இல்ல.');
  if (approxBytes(p.images.map(s => ({ src: s }))) > MAX_DOC_BYTES)
    errs.push('Images ரொம்ப பெருசு — photo-ஐ குறைங்க அல்லது image URL use பண்ணுங்க (Firestore 1 MB limit).');
  /* duplicate SKU / id */
  const dup = S.list.find(x => String(x.id).toLowerCase() === String(p.id).toLowerCase());
  if (dup && (isNew || dup.id !== S.editing)) errs.push('இந்த SKU/ID ஏற்கனவே இருக்கு: ' + dup.name + ' — duplicate வேண்டாம்.');
  /* duplicate name+price guard (helps avoid double-adds) */
  if (isNew){
    const same = S.list.find(x => x.name.toLowerCase() === p.name.toLowerCase() && x.price === p.price && x.cat === p.cat);
    if (same) errs.push('இதே name + price-ல ஒரு product ஏற்கனவே இருக்கு (' + same.id + '). இருந்தாலும் சேர்க்கணும்னா SKU-ஐ மாத்துங்க.');
  }
  return errs;
}
async function submitForm(statusOverride){
  const errBox = $('pmsFormErr');
  const say = t => { if (errBox){ errBox.innerHTML = t; errBox.style.display = t ? 'block' : 'none'; } };
  const isNew = !S.editing;
  const p = readForm(statusOverride);
  const errs = validate(p, isNew);
  if (errs.length){ say(errs.map(e => '• ' + E(e)).join('<br>')); try{ window.scrollTo(0, 0); }catch(_){} return; }
  say('');

  /* SKU changed on an existing product → the document id changes (URL changes) */
  let renameFrom = null;
  if (!isNew && S.editing && String(S.editing) !== String(p.id)){
    const ok2 = await confirmBox({
      title: 'SKU / Product ID மாறுது',
      name: p.name,
      text: 'பழைய ID <b>' + E(S.editing) + '</b> → புது ID <b>' + E(p.id) + '</b>.<br>Product URL-ம் மாறும் (Google-ல பழைய link வேலை செய்யாது).',
      okText: 'ஆமா, மாத்து', cancelText: 'வேண்டாம்',
    });
    if (ok2 !== 'yes') return;
    renameFrom = S.editing;
  }

  const btns = ['pmsSave', 'pmsDraft'].map($).filter(Boolean);
  btns.forEach(b => { b.disabled = true; b.dataset.t = b.textContent; b.textContent = '⏳ Saving…'; });
  const doc = docFrom(p);
  /* the form object has no `img`/`baked`/`sales` — rebuild a full row from the
     document we are about to store, so the list never loses its thumbnail */
  const fresh = row(doc, p.id);
  try{
    await cloud(async () => {
      await writeDoc(p.id, doc);
      if (renameFrom){
        await writeBatch([{ id: renameFrom, delete: true }]);
        tombstone(renameFrom);
        applyLocal({ id: renameFrom }, true);
      }
      return true;
    });
    applyLocal(fresh, false);
    try{ if (typeof refreshFeedCache === 'function') refreshFeedCache(); }catch(e){}
    closeOverlay();
    S.page = 1;
    paint();
    T((isNew ? '✅ Product added' : '✅ Product updated') + (p.status === 'draft' ? ' as draft' : '') + ' — ' + p.id);
  }catch(err){
    btns.forEach(b => { b.disabled = false; if (b.dataset.t) b.textContent = b.dataset.t; });
    if (String(err && err.message) === 'not-connected') return;
    if (isDenied(err)) return;                       /* the rules panel is already open */
    say('⚠️ Save ஆகல: ' + E(String((err && err.message) || err).slice(0, 120)));
    T('⚠️ Save failed');
  }
}
function previewForm(){
  const p = readForm();
  if (!p.name){ T('⚠️ முதல்ல name கொடுங்க'); return; }
  const saved = S.list.find(x => x.id === p.id);
  const url = (typeof productUrl === 'function') ? productUrl({ id: p.id }) : ('product.html?id=' + encodeURIComponent(p.id));
  if (!saved){
    T('👁 Preview-க்கு முதல்ல Save பண்ணுங்க (Draft-ஆக கூட save பண்ணலாம்)');
    return;
  }
  /* show an in-page preview of the UNSAVED values, plus a link to the live page */
  overlay('<div class="pms-ov-card pms-prev">' +
    '<button type="button" class="pms-ov-x" data-pmsclose>✕</button>' +
    '<h3>👁 Preview</h3>' +
    '<div class="pms-prev-imgs">' + (p.images.length ? p.images.map(u => '<img src="' + E(u) + '" alt="">').join('') : '<p class="pms-muted">No image</p>') + '</div>' +
    '<b class="pms-prev-name">' + E(p.name) + '</b>' +
    '<p class="pms-prev-price">' + M(p.price) + (p.mrp > p.price ? ' <s class="pms-muted">' + M(p.mrp) + '</s> <b class="pms-off">' + Math.round((1 - p.price / p.mrp) * 100) + '% off</b>' : '') + '</p>' +
    '<p class="pms-muted pms-small">' + E(p.cat) + (p.sub ? ' / ' + E(p.sub) : '') + ' · ' + E(p.fabric) + ' · ' + E(p.length) + ' · stock ' + p.stock + '</p>' +
    '<p class="pms-small">' + E(p.desc).slice(0, 220) + '</p>' +
    '<a class="btn btn-outline pms-btn" href="' + E(url) + '" target="_blank" rel="noopener">🌐 Open live product page</a>' +
    '<p class="pms-small pms-muted">Live page-ல save பண்ணது மட்டும் தான் தெரியும்.</p>' +
  '</div>');
}

/* ------------------------------------------------------- 4. safe deletion */
async function askDelete(id){
  const p = S.list.find(x => x.id === id);
  if (!p){ T('⚠️ Product not found'); return; }
  const r = await confirmBox({
    title: 'Are you sure you want to delete this product?',
    img: p.img, name: p.name,
    meta: 'SKU ' + (p.sku || p.id) + ' · ' + M(p.price) + ' · ' + p.cat,
    text: 'Default = <b>Archive</b> (site-ல இருந்து மறையும், data safe). வேணும்னா permanent-ஆ delete பண்ணலாம்.',
    okText: '🗄 Archive', danger2: '🗑 Delete forever', cancelText: 'Cancel',
    note: '🔒 இது <b>' + E(p.id) + '</b>-ஐ மட்டும் தான் தொடும்.',
  });
  if (r === 'no') return;
  if (r === 'yes2'){
    const r2 = await confirmBox({
      title: 'Permanent delete — முழுசா போயிடும்',
      img: p.img, name: p.name, meta: 'SKU ' + (p.sku || p.id),
      text: 'Firestore document-ம் delete ஆகும். <b>Undo கிடையாது.</b><br>Confirm பண்ண product name-ஐ type பண்ணுங்க:',
      okText: '🗑 Confirm Delete', cancelText: 'Cancel',
    });
    if (r2 !== 'yes') return;
    const typed = window.prompt('Type the product name exactly to delete:  ' + p.name);
    if (String(typed || '').trim().toLowerCase() !== String(p.name).trim().toLowerCase()){
      T('⚠️ Name match ஆகல — delete ஆகல');
      return;
    }
    await runDelete([p.id], true);
  }else{
    await runArchive([p.id]);
  }
}
async function runArchive(ids){
  const rows = ids.map(id => S.list.find(x => x.id === id)).filter(Boolean);
  if (!rows.length) return;
  try{
    await cloud(() => writeBatch(rows.map(p => ({
      id: p.id,
      doc: { status: 'archived', hidden: true, archivedAt: nowMs() },
    }))));
    rows.forEach(p => {
      p.status = 'archived'; p.hidden = true;
      const i = S.list.findIndex(x => x.id === p.id); if (i >= 0) S.list[i] = Object.assign({}, p);
      applyLocal(p, false);
    });
    ids.forEach(id => delete S.sel[id]);
    paint();
    T('🗄 ' + rows.length + ' product(s) archived — site-ல இருந்து மறைஞ்சிடுச்சு');
  }catch(err){
    if (String(err && err.message) !== 'not-connected' && !isDenied(err))
      T('⚠️ Archive failed: ' + String((err && err.message) || err).slice(0, 60));
  }
}
async function runRestore(ids){
  const rows = ids.map(id => S.list.find(x => x.id === id)).filter(Boolean);
  if (!rows.length) return;
  try{
    await cloud(() => writeBatch(rows.map(p => ({
      id: p.id, doc: { status: 'active', hidden: false, archivedAt: null },
    }))));
    rows.forEach(p => { p.status = 'active'; p.hidden = false; applyLocal(p, false); });
    ids.forEach(id => delete S.sel[id]);
    paint();
    T('✅ ' + rows.length + ' product(s) restored → Active');
  }catch(err){
    if (String(err && err.message) !== 'not-connected' && !isDenied(err))
      T('⚠️ Restore failed: ' + String((err && err.message) || err).slice(0, 60));
  }
}
async function runDelete(ids, permanent){
  const rows = ids.map(id => S.list.find(x => x.id === id)).filter(Boolean);
  if (!rows.length) return;
  try{
    const paths = [];
    rows.forEach(p => (p.images || []).forEach(u => { const r = S.raw[p.id] || {}; if (r._imgPaths && r._imgPaths[u]) paths.push(r._imgPaths[u]); }));
    await cloud(async () => {
      await writeBatch(rows.map(p => ({ id: p.id, delete: true })));
      return true;
    });
    rows.forEach(p => { tombstone(p.id); applyLocal(p, true); delete S.sel[p.id]; });
    paths.forEach(pt => storageDelete(pt));      /* only files WE uploaded */
    try{ if (typeof refreshFeedCache === 'function') refreshFeedCache(); }catch(e){}
    paint();
    T('🗑 ' + rows.length + ' product(s) permanently deleted');
  }catch(err){
    if (String(err && err.message) !== 'not-connected' && !isDenied(err))
      T('⚠️ Delete failed: ' + String((err && err.message) || err).slice(0, 60));
  }
}

/* ---------------------------------------------------------- 5. bulk stuff */
let bulkField = null;
async function bulkAction(act){
  const ids = selIds();
  if (!act) return;
  if (act === 'clear'){ S.sel = {}; paintList(); return; }
  if (!ids.length){ T('⚠️ முதல்ல products select பண்ணுங்க'); return; }

  if (act === 'csv') return exportCsv(ids);
  if (act === 'category'){
    const box = $('pmsBulkCats'); if (box) box.style.display = 'inline-flex';
    bulkField = 'cat';
    return;
  }
  if (act === 'category-apply'){
    const v = String(($('pmsBulkCatSel') || {}).value || '');
    if (!v){ T('⚠️ Category select பண்ணுங்க'); return; }
    return bulkPatch(ids, p => ({ cat: v }), 'category → ' + v);
  }
  if (act === 'price' || act === 'stock'){
    const box = $('pmsBulkVal'); if (box) box.style.display = 'inline-flex';
    bulkField = act;
    $('pmsBulkNum').placeholder = act === 'price' ? '₹ value' : 'stock value';
    return;
  }
  if (act === 'val-apply'){
    const mode = String(($('pmsBulkMode') || {}).value || 'set');
    const n = num(($('pmsBulkNum') || {}).value, NaN);
    if (!Number.isFinite(n)){ T('⚠️ Value கொடுங்க'); return; }
    if (bulkField === 'price'){
      return bulkPatch(ids, p => {
        let v = mode === 'set' ? n : mode === 'inc' ? p.price + n : mode === 'dec' ? p.price - n : Math.round(p.price * (1 + n / 100));
        v = Math.max(1, Math.round(v));
        return { price: v, mrp: Math.max(v, p.mrp || v) };
      }, 'price (' + mode + ' ' + n + ')');
    }
    return bulkPatch(ids, p => {
      let v = mode === 'set' ? n : mode === 'inc' ? p.stock + n : mode === 'dec' ? p.stock - n : Math.round(p.stock * (1 + n / 100));
      return { stock: clamp(Math.round(v), 0, 999999) };
    }, 'stock (' + mode + ' ' + n + ')');
  }
  if (act === 'restore') return runRestore(ids);
  if (act === 'activate' || act === 'deactivate' || act === 'draft'){
    const st = act === 'activate' ? 'active' : act === 'deactivate' ? 'inactive' : 'draft';
    const ok = await confirmBox({ title: 'Bulk status change', text: ids.length + ' products → <b>' + stName(st) + '</b>', okText: 'Apply', cancelText: 'Cancel' });
    if (ok !== 'yes') return;
    return bulkPatch(ids, () => ({ status: st, hidden: st !== 'active' }), 'status → ' + st);
  }
  if (act === 'delete'){
    const ok = await confirmBox({
      title: 'Bulk delete — ' + ids.length + ' products',
      text: 'Default = <b>Archive</b> (data safe, site-ல மறையும்).',
      okText: '🗄 Archive all', danger2: '🗑 Delete forever', cancelText: 'Cancel',
    });
    if (ok === 'no') return;
    if (ok === 'yes2'){
      const ok2 = await confirmBox({ title: 'Permanent bulk delete', text: ids.length + ' Firestore documents delete ஆகும். <b>Undo கிடையாது.</b>', okText: 'Yes, delete forever', cancelText: 'Cancel' });
      if (ok2 !== 'yes') return;
      return runDelete(ids, true);
    }
    return runArchive(ids);
  }
}
async function bulkPatch(ids, fn, label){
  const rows = ids.map(id => S.list.find(x => x.id === id)).filter(Boolean);
  if (!rows.length) return;
  try{
    const ops = [];
    rows.forEach(p => {
      const patch = fn(p) || {};
      const next = Object.assign({}, p, patch);
      ops.push({ id: p.id, doc: docFrom(next) });
      applyLocal(next, false);
      const i = S.list.findIndex(x => x.id === p.id); if (i >= 0) S.list[i] = next;
    });
    await cloud(() => writeBatch(ops));
    ids.forEach(id => delete S.sel[id]);
    try{ if (typeof refreshFeedCache === 'function') refreshFeedCache(); }catch(e){}
    paint();
    T('✅ ' + rows.length + ' products updated — ' + label);
  }catch(err){
    if (String(err && err.message) !== 'not-connected' && !isDenied(err))
      T('⚠️ Bulk update failed: ' + String((err && err.message) || err).slice(0, 60));
    paint();
  }
}
function exportCsv(ids){
  const rows = (ids && ids.length ? S.list.filter(p => ids.indexOf(p.id) !== -1) : filtered());
  if (!rows.length){ T('⚠️ Export-க்கு product இல்ல'); return; }
  const head = ['id','sku','name','category','subcategory','price','mrp','discount','stock','status','fabric','length','blouse','colours','sizes','designs','shipping','weight','badge','image','images','seoTitle','seoDesc','createdAt','updatedAt'];
  const lines = [head.join(',')];
  rows.forEach(p => {
    const disc = p.mrp > p.price ? Math.round((1 - p.price / p.mrp) * 100) : 0;
    lines.push([
      p.id, p.sku, p.name, p.cat, p.sub, p.price, p.mrp, disc, p.stock, p.status,
      p.fabric, p.length, p.blouseIncluded ? 'Yes' : 'No',
      (p.colors || []).join(' / '), (p.sizes || []).join(' / '), (p.designs || []).join(' / '),
      p.shipping, p.weight, p.badge, p.images[0] || '', (p.images || []).join(' | '),
      p.seoTitle, p.seoDesc, p.createdAt ? new Date(p.createdAt).toISOString() : '', p.updatedAt ? new Date(p.updatedAt).toISOString() : '',
    ].map(csvCell).join(','));
  });
  const ok = download('sk-sarees-products-' + new Date().toISOString().slice(0, 10) + '.csv', lines.join('\n'));
  T(ok ? '⬇️ CSV download ஆகுது (' + rows.length + ' products)' : '⚠️ Download ஆகல');
}

/* ------------------------------------------------------------ public API */
window.SKPM = {
  render(){
    paint();
    /* first visit, or data older than a minute → pull it again from Firestore */
    if (!S.loaded && !S.loading) load(false);
    else if (S.loaded && S.loadedAt && (nowMs() - S.loadedAt) > 60000) load(true);
  },
  reload(force){ return load(!!force); },
  state: S,
  stats: stats,
  exportCsv: () => exportCsv(null),
  openForm: openForm,
  /* used by tests */
  _test: { row: row, docFrom: docFrom, validate: validate, filtered: filtered, applyLocal: applyLocal, readForm: readForm },
};

/* Keep this manager in sync with the older catalogue paths (CSV bulk import,
   "Edit Selected", catalogue refresh) — they all end in saveProducts(), so we
   wrap it ONCE and reload the cloud list afterwards. */
try{
  let _sp = null;
  try{ _sp = (typeof saveProducts === 'function') ? saveProducts : null; }catch(e){}
  if (!_sp && typeof window.saveProducts === 'function') _sp = window.saveProducts;
  if (typeof _sp === 'function' && !_sp.__pmsWrapped){
    const wrapped = function(list){
      const r = _sp.apply(this, arguments);
      try{ if (S.loaded) load(true); }catch(e){}
      return r;
    };
    wrapped.__pmsWrapped = true;
    window.saveProducts = wrapped;
  }
}catch(e){}

try{ if (typeof window !== 'undefined') window.SKPM_READY = true; }catch(e){}
})();
