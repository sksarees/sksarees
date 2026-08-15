import io

# ============ app.js — engagement + SEO + trust ============
p = 'app.js'
s = io.open(p, encoding='utf-8').read()

# 1) SEO keyword product title — replace generic title set
old = """  document.title = p.name + ' — SK Sarees';"""
new = """  /* 🔍 SEO keyword title: "Soft Silk Saree for Women | SK Sarees"
     (keyword-first — Google search terms in the title boost organic traffic) */
  document.title = seoProductTitle(p);"""
assert old in s
s = s.replace(old, new)

# 2) add seoProductTitle + Memory Game + Daily Tip + Birthday coupon + gallery + trust + per-product countdown
anchor = """/* ============================ 🎉 ENGAGEMENT ============================ */"""
addition = """/* 🔍 keyword-first product title for SEO: "Soft Silk Saree for Women | SK Sarees" */
function seoProductTitle(p){
  try{
    const f = String(p.fabric || '').trim();
    const c = String(p.color || '').split('/')[0].trim();
    const occ = { wedding:'Bridal', party:'Party Wear', office:'Office Wear', festival:'Festival', daily:'Daily Wear', kanchipuram:'Kanchipuram Silk', silk:'Silk', cotton:'Cotton', soft:'Soft Silk', linen:'Linen' };
    const kw = [];
    if (c && c !== 'Multi' && c !== 'Multiple options') kw.push(c);
    if (f && f.indexOf('Silk') !== -1) kw.push('Silk Saree');
    else if (f && f.indexOf('Cotton') !== -1) kw.push('Cotton Saree');
    else if (f) kw.push(f + ' Saree');
    else kw.push('Saree');
    kw.push('for Women');
    const base = kw.join(' ');
    return base + ' | SK Sarees - ' + (occ[p.cat] || 'Online') + ' Tamil Nadu';
  }catch(e){ return p.name + ' | SK Sarees'; }
}

/* 🎮 SAREES MATCH — mini memory game (6 tiles). Win → a coupon hint. */
function openMatchGame(){
  try{
    const emojis = ['👰','🪡','✨','🛒','💃','💛'];
    const deck = emojis.concat(emojis).sort(() => Math.random() - 0.5);
    openModal('<h2 style="font-size:1.05rem;font-weight:800;margin-bottom:4px">🎮 Sarees Match — memory game</h2>' +
      '<p class="small muted" style="margin-bottom:10px">Match the pairs in as few moves as you can. Win = extra confidence you will love our sarees! 😄</p>' +
      '<div class="game-grid" id="gameGrid">' + deck.map((e, i) => '<button type="button" class="game-tile" data-i="' + i + '" data-e="' + e + '">?</button>').join('') + '</div>' +
      '<p class="small" id="gameInfo" style="text-align:center;margin-top:8px;font-weight:800">Moves: 0 • Pairs: 0/6</p>');
    let open1 = null, lock = false, moves = 0, pairs = 0;
    const tiles = document.querySelectorAll('.game-tile');
    const flip = (t, show) => { t.textContent = show ? t.dataset.e : '?'; t.classList.toggle('on', show); };
    tiles.forEach(t => t.addEventListener('click', () => {
      if (lock || t.classList.contains('on') || t.classList.contains('done')) return;
      flip(t, true);
      if (!open1){ open1 = t; return; }
      moves++;
      if (open1.dataset.e === t.dataset.e){
        open1.classList.add('done'); t.classList.add('done'); pairs++;
        open1 = null;
        if (pairs === 6){ document.getElementById('gameInfo').textContent = '🎉 You won in ' + moves + ' moves! You are a true saree lover!'; }
        else document.getElementById('gameInfo').textContent = 'Moves: ' + moves + ' • Pairs: ' + pairs + '/6';
      } else {
        lock = true;
        setTimeout(() => { flip(open1, false); flip(t, false); open1 = null; lock = false; document.getElementById('gameInfo').textContent = 'Moves: ' + moves + ' • Pairs: ' + pairs + '/6'; }, 700);
      }
    }));
  }catch(e){}
}

/* 📱 DAILY STYLE TIP — tip of the day + WhatsApp share (auto message) */
function dailyStyleTip(){
  const tips = [
    '🌸 Drape tip: pin the pallu at your shoulder for a fresh all-day look.',
    '🪡 New saree? Iron on low heat while slightly damp for a crisp fall.',
    '💛 Gold zari sarees pair beautifully with maroon blouses.',
    '🌿 Cotton sarees get softer with every wash — keep them for daily wear.',
    '✨ For weddings, go heavy on the pallu border — it photographs best.',
    '💃 Receptions: choose a lighter silk so you can dance all night!',
    '🪡 Store sarees in a dry, folded bundle — never hang silk (it stretches).',
    '🌸 A thin belt under the blouse keeps pleats in place all day.',
  ];
  const idx = Math.floor(Date.now() / 864e5) % tips.length;
  return tips[idx];
}
function renderStyleTip(){
  try{
    const el = document.getElementById('styleTip'); if (!el) return;
    const tip = dailyStyleTip();
    el.innerHTML = '💡 <b>Daily Style Tip:</b> ' + tip + ' &nbsp;<a class="btn btn-wa btn-sm" style="width:auto;min-width:0;padding:4px 10px;font-size:.68rem" href="' + waLink('🪡 SK Sarees Style Tip: ' + tip) + '" target="_blank" rel="noopener">Share 💬</a>';
  }catch(e){}
}

/* 🎁 BIRTHDAY COUPON — profile: enter DOB → BDAY coupon 5% (once) */
function birthdayCouponFor(dob){
  try{
    if (!dob) return null;
    const d = new Date(dob);
    if (isNaN(d.getTime())) return null;
    const now = new Date();
    if (d.getMonth() === now.getMonth() && d.getDate() === now.getDate()){
      const list = getCoupons();
      if (!list.some(c => c.code === 'BDAY5')){
        list.push({ code:'BDAY5', type:'percent', value:5, min:0, active:true, label:'🎂 Happy Birthday — 5% off', maxUses:0, expiry:'' });
        saveCoupons(list);
      }
      return 'BDAY5';
    }
    return null;
  }catch(e){ return null; }
}

/* 📸 CUSTOMER GALLERY — "Real customer saree photos" strip + WhatsApp upload CTA */
function customerGalleryHTML(){
  try{
    const picks = PRODUCTS.filter(p => !p.hidden && p.img && p.reviews > 10).slice(0, 6);
    if (picks.length < 2) return '';
    return '<section class="sec"><div class="sec-head"><h2><span class="tick"></span>📸 Real Customers • Real Sarees</h2><a href="shop.html">' + t('viewAll') + '</a></div>' +
      '<div class="gal-row">' + picks.map(p =>
        '<a class="gal-card" href="' + productUrl(p) + '"><img src="' + esc(p.img) + '" alt="' + esc(p.name) + '" loading="lazy" onerror="imgSafe(this)" onload="imgLoaded(this)">' +
        '<small>⭐ ' + (p.rating || 4.5) + ' • ' + (p.reviews || 0) + ' bought</small></a>').join('') + '</div>' +
      '<div style="text-align:center;margin-top:8px"><a class="btn btn-outline btn-sm" href="' + waLink('📸 Hi! I bought a saree from SK Sarees and want to share my photo for your gallery!') + '" target="_blank" rel="noopener" style="width:auto">📤 Share YOUR saree photo on WhatsApp</a></div></section>';
  }catch(e){ return ''; }
}

/* 🧧 FESTIVAL COUNTDOWN BANNER — big urgency strip on home */
function festivalCountdownStrip(){
  try{
    const end = festivalDeadline();
    const fname = festivalName(currentFestival());
    return '<section class="fest-count" id="festCount"><div><b>🧧 ' + esc(fname) + ' ends in</b><span class="fc-time" id="fcTime">…</span></div></section>';
  }catch(e){ return ''; }
}
function tickFestivalCountdownStrip(){
  try{
    const el = document.getElementById('fcTime'); if (!el) return;
    const end = festivalDeadline();
    const tick = () => {
      const diff = end.getTime() - Date.now();
      if (diff <= 0){ el.textContent = 'Order now!'; return; }
      const dd = Math.floor(diff / 864e5), hh = Math.floor(diff / 36e5) % 24, mm = Math.floor(diff / 6e4) % 60, ss = Math.floor(diff / 1e3) % 60;
      const p2 = n => String(n).padStart(2, '0');
      el.textContent = dd + 'd ' + p2(hh) + 'h ' + p2(mm) + 'm ' + p2(ss) + 's';
    };
    tick(); setInterval(tick, 1000);
  }catch(e){}
}

/* ⏰ FLASH SALE COUNTDOWN PER PRODUCT — ends tonight 11:59pm (urgency) */
function productFlashCountdown(p){
  try{
    if (!p) return '';
    const end = new Date(); end.setHours(23, 59, 59, 0);
    return '<div class="flash-prod"><b>⚡ Flash Sale — today only</b><span class="fp-time" data-fend="' + end.getTime() + '">…</span></div>';
  }catch(e){ return ''; }
}
function tickFlashProducts(){
  try{
    document.querySelectorAll('.fp-time').forEach(el => {
      const end = +el.dataset.fend || 0;
      const diff = end - Date.now();
      if (diff <= 0){ el.textContent = 'Ended — order on WhatsApp!'; return; }
      const hh = Math.floor(diff / 36e5) % 24, mm = Math.floor(diff / 6e4) % 60, ss = Math.floor(diff / 1e3) % 60;
      const p2 = n => String(n).padStart(2, '0');
      el.textContent = p2(hh) + ':' + p2(mm) + ':' + p2(ss);
    });
  }catch(e){}
}

/* 🏆 REFERRAL LEADERBOARD (share-earn / home) — top 3 resellers by confirmed margin */
function referralLeaderboardHTML(){
  try{
    const top = allResellers().slice().sort((a, b) => (b.margin || 0) - (a.margin || 0)).filter(r => (r.margin || 0) > 0).slice(0, 3);
    if (!top.length) return '';
    return '<section class="sec"><div class="sec-head"><h2><span class="tick"></span>🏆 Top Earners This Month</h2></div>' +
      '<div class="lb-row">' + top.map((r, i) =>
        '<div class="lb-card"><span class="lb-rank">' + (i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉') + '</span>' +
        '<b>' + esc(r.name || 'Reseller') + '</b><small>' + (r.orders || 0) + ' orders • ' + money(r.margin || 0) + ' earned</small></div>').join('') + '</div>' +
      '<p class="small muted" style="text-align:center;margin-top:6px">Join &amp; earn — <a href="share-earn.html" style="color:var(--maroon);font-weight:800">Share &amp; Earn →</a></p></section>';
  }catch(e){ return ''; }
}

/* ============================ 🎉 ENGAGEMENT ============================ */"""
assert anchor in s
s = s.replace(anchor, addition, 1)

# 3) Home: add festival countdown strip, style tip, gallery, leaderboard, trust strip + game button
old2 = """  const forYou = forYouHTML();   /* 🤖 personalized strip (viewed/wishlist based) */
  app.innerHTML = forYou +"""
new2 = """  const forYou = forYouHTML();   /* 🤖 personalized strip (viewed/wishlist based) */
  app.innerHTML = festivalCountdownStrip() + forYou +"""
assert old2 in s
s = s.replace(old2, new2)

# trust strip + style tip + gallery + leaderboard near hero
old3 = """      '<div class="fun-row">' +
        '<button type="button" class="btn btn-gold btn-sm" id="funSpin" style="width:auto">🎁 Try Your Luck — Coupon</button>' +
        '<button type="button" class="btn btn-maroon btn-sm" id="funQuiz" style="width:auto">✨ Find Your Perfect Saree</button>' +
      '</div>' +"""
new3 = """      '<div class="fun-row">' +
        '<button type="button" class="btn btn-gold btn-sm" id="funSpin" style="width:auto">🎁 Try Your Luck — Coupon</button>' +
        '<button type="button" class="btn btn-maroon btn-sm" id="funQuiz" style="width:auto">✨ Find Your Perfect Saree</button>' +
        '<button type="button" class="btn btn-outline btn-sm" id="funGame" style="width:auto">🎮 Play Sarees Match</button>' +
      '</div>' +
      '<div class="trust-strip">' +
        '<span>💵 COD Available</span><span>📍 Tamil Nadu Delivery</span><span>🔒 Secure Order via WhatsApp</span>' +
        '<span>⭐ Real Customer Reviews</span><span>📸 Real Saree Photos</span><span>📞 ' + CONFIG.waDisplay + '</span>' +
        '<span>🚚 Shipping: ₹30 TN • ₹40 AP/KA • ₹60 Others • Free ₹999+</span>' +
      '</div>' +
      '<div id="styleTip" class="style-tip"></div>' +"""
assert old3 in s
s = s.replace(old3, new3)

# gallery + leaderboard + footer of home (after deals, before weaver) — add near end of renderHome
old4 = """    '<div class="feat-row">' +"""
new4 = """    customerGalleryHTML() +
    referralLeaderboardHTML() +
    '<div class="feat-row">' +"""
assert old4 in s
s = s.replace(old4, new4)

# wire game button + style tip + festival countdown tick + flash tick
old5 = """  try{
    const fs2 = document.getElementById('funSpin'); if (fs2) fs2.addEventListener('click', () => openLuckySpin());
    const fq = document.getElementById('funQuiz'); if (fq) fq.addEventListener('click', () => openStyleQuiz());
  }catch(e){}"""
new5 = """  try{
    const fs2 = document.getElementById('funSpin'); if (fs2) fs2.addEventListener('click', () => openLuckySpin());
    const fq = document.getElementById('funQuiz'); if (fq) fq.addEventListener('click', () => openStyleQuiz());
    const fg = document.getElementById('funGame'); if (fg) fg.addEventListener('click', () => openMatchGame());
  }catch(e){}
  try{ renderStyleTip(); }catch(e){}
  try{ tickFestivalCountdownStrip(); }catch(e){}
  try{ tickFlashProducts(); setInterval(tickFlashProducts, 1000); }catch(e){}"""
assert old5 in s
s = s.replace(old5, new5)

# product page: flash countdown under price + birthday coupon box on profile
old6 = """        '<div class="social-proof">' + socialProofHTML(p) + '</div>' +"""
new6 = """        '<div class="social-proof">' + socialProofHTML(p) + '</div>' +
        productFlashCountdown(p) +"""
assert old6 in s
s = s.replace(old6, new6)

io.open(p, 'w', encoding='utf-8').write(s)
print('app.js engagement+seo+trust added')
