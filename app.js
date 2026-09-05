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
  try{ renderCartBadge(); }catch(e){}
  try{ readRef(); }catch(e){}                    /* capture ?ref= reseller from URL */
  try{ if (Auth.current()) Auth.quietSync(); }catch(e){}   /* 🔑 logged-in? pull her latest orders */
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
    else if (page === 'reels') renderReelsPage();
  }catch(e){ console.warn('page render error', e); }
  try{ renderStatsText(); }catch(e){}   /* fill hero visitor/order counters after render */
  try{ startActiveEngine(); }catch(e){} /* ⏱️ counts REAL browsing seconds (visible tab only) */
  try{ maybeAskName(); }catch(e){}      /* 👤 1st visit: ask her name after 1 min of REAL browsing */
  try{ initDwellTracking(); }catch(e){} /* ⏱️ how long she studies each saree → taste engine */
  try{ startOfferTimers(); }catch(e){}  /* ⏰ Meesho-style "offer ends in" countdowns */
  try{ initReelCards(); }catch(e){}     /* 🎞️ swipeable shop cards */
  try{ initReelDoubleTap(); }catch(e){} /* ❤️ double-tap reel = like */

}
document.addEventListener('DOMContentLoaded', init);
/* Refresh the active customer page if catalog.json finishes after first paint. */
window.addEventListener('skcatalogready', () => {
  try{
    const page = document.body && document.body.dataset.page;
    if (page === 'home') renderHome();
    else if (page === 'shop') renderShop();
    else if (page === 'reels') renderReelsPage();
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
  /* 🎨 COLOUR SYNONYMS — Indian colour names all mean the same family */
  const COLOUR_SYN = {
    red: ['red','maroon','wine','rose','rani','cherry','ruby'],
    maroon: ['maroon','red','wine'],
    blue: ['blue','navy','teal','sky','indigo','turquoise'],
    green: ['green','emerald','olive','mint','pistachio'],
    yellow: ['yellow','mustard','turmeric','haldi'],
    gold: ['gold','golden','zari','kasavu'],
    purple: ['purple','violet','lavender','mauve','lilac'],
    pink: ['pink','rose','blush','rani','fuchsia'],
    white: ['white','ivory','cream','off-white'],
    black: ['black','kohl','coal'],
    orange: ['orange','saffron','kumkuma'],
  };
  /* 🇮🇳 TAMIL BRIDGE — she can ask in Tamil! Tamil words map to English intents
     so the scoring engine understands: பட்டு→silk, சிவப்பு→red, திருமண→wedding… */
  const TA_BRIDGE = [
    [/திருமண|கல்யாண|மாப்பிள|மணப்பெண்/, ' wedding '],
    [/பார்ட்டி|விழா|ஃபங்க்ஷன்|பிறந்தநாள்/, ' party '],
    [/அலுவலக|ஆபீஸ|ஆபீசு/, ' office '],
    [/தினசரி|அன்றாட/, ' daily '],
    [/பொங்கல்|தீபாவளி|நவராத்திரி|பண்டிகை|கோவில்|பூஜை|ஆடி/, ' festival '],
    [/பட்டு|காஞ்சிபுரம்|சில்க்|கஞ்சிவரம்|பட்டுச்?சேலை/, ' silk '],
    [/பருத்தி|காட்டன்/, ' cotton '],
    [/லினன்/, ' linen '],
    [/சிவப்பு|செம்மை/, ' red '],
    [/நீலம்|நீல நிற/, ' blue '],
    [/பச்சை/, ' green '],
    [/மஞ்சள்/, ' yellow '],
    [/ஊதா/, ' purple '],
    [/வெள்ளை/, ' white '],
    [/கருப்பு/, ' black '],
    [/தங்க நிற|பொன்நிற/, ' gold '],
    [/மலிவான|குறைந்த விலை/, ' cheap '],
    [/எனக்கு|பரிந்துரை|எனக்காக/, ' recommend for me '],
    [/பரிசு|கிஃப்ட்/, ' gift '],
  ];
  let bridged = q;
  try{ TA_BRIDGE.forEach(b => { if (b[0].test(q)) bridged += ' ' + b[1]; }); }catch(e){}
  const input = bridged.replace(/[?.!]/g, ' ').toLowerCase();
  const has = re => new RegExp(re).test(input);
  let pool = [];
  try{ pool = PRODUCTS.filter(p => !p.hidden && p.stock != null && p.stock > 0); }catch(e){}
  /* 🧠 TASTE-AWARE: "recommend for me / எனக்கு பிடிச்ச மாதிரி" → the taste
     engine answers with HER categories, colours & budget (learned AI) */
  if (has('for me|recommend|suggest|my taste|my style|personal|எனக்கு|பிடிக்கும்|என் சுவை')){
    try{
      const tp = tasteProfile();
      if (tp.signals){
        const mine = pool.map(p => ({ p, s: tasteScore(p, tp) })).sort((a, b) => b.s - a.s).slice(0, 3).map(x => x.p);
        if (mine.length){
          aiPushMsg('bot', loc('உங்கள் browsing-ஐ வைத்து AI கற்றுக்கொண்டது! இதோ உங்களுக்கான பிக்ஸ்: 🎯', 'AI మీ browsing నుండి నేర్చుకుంది! మీ పిక్స్: 🎯', 'AI ನಿಮ್ಮ browsing ನಿಂದ ಕಲಿತಿದೆ! ನಿಮ್ಮ ಪಿಕ್ಸ್: 🎯', 'AI learned from your browsing! Here are YOUR picks: 🎯') +
            '<div class="ai-cards">' + mine.map(aiCard).join('') + '</div>' + tasteSummaryHTML());
          return;
        }
      }
    }catch(e){}
  }
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
    s += tasteScore(p) / 2;   /* 🧠 her taste gives every answer a personal boost */
    if (has('wedding|bride|bridal|kalyana|marriage')){ if (/wedding|bridal|kalyana/.test(p.cat) || /bridal|wedding|bride/.test(t)) s += 4; }
    if (has('office|work|formal')){ if (p.cat === 'office' || /office|formal/.test(t)) s += 4; }
    if (has('party|function|reception|birthday')){ if (p.cat === 'party' || p.cat === 'fancy' || /party|reception/.test(t)) s += 4; }
    if (has('puja|festival|aadi|pongal|diwali|temple')){ if (p.cat === 'festival' || /festival|puja|temple/.test(t)) s += 4; }
    for (const fab of ['silk','cotton','linen','organza','georgette','net','kanjivaram','banarasi']) if (has(fab) && t.indexOf(fab) !== -1) s += 3;
    /* 🎨 colour synonyms — "red" also means maroon/wine/rose/rani… so she finds
       her colour even when the saree is tagged differently */
    for (const col of Object.keys(COLOUR_SYN)) if (has(col) && COLOUR_SYN[col].some(syn => t.indexOf(syn) !== -1)) s += 3;
    const bm = input.match(/under\s*₹?\s*(\d+)|(?:₹|rs\.?\s*)(\d{3,5})|below\s*(\d+)|(?:^|\s)(\d{3,5})(?:\s|$)/);
    if (bm){ const budget = +(bm[1] || bm[2] || bm[3] || bm[4]); if (p.price <= budget) s += 3; else s -= 2; }
    if (has('cheap|budget|low price')){ if (p.price <= 1200) s += 3; }
    if (has('gift')) s += 1;
    return s;
  };
  let picks = pool.map(p => ({ p, s: score(p) })).filter(x => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 3).map(x => x.p);
  if (!picks.length) picks = pool.slice().sort((a, b) => (b.reviews || 0) - (a.reviews || 0)).slice(0, 3);
  if (!picks.length){ aiPushMsg('bot', '😊 We will get fresh stock soon! Meanwhile, <b>ask us on WhatsApp</b> — we will help you find the perfect saree.'); return; }
  /* 🎨 HONEST COLOUR CHECK — if she asked a colour and NOTHING matches, say it
     honestly + show trending + WhatsApp (never show wrong-colour sarees) */
  const askedCols = Object.keys(COLOUR_SYN).filter(c => has(c));
  if (askedCols.length){
    const anyMatch = picks.some(p => {
      const t = (p.name + ' ' + p.fabric + ' ' + p.color + ' ' + (p.colors || []).join(' ') + ' ' + p.cat + ' ' + (p.desc || '')).toLowerCase();
      return askedCols.some(c => COLOUR_SYN[c].some(syn => t.indexOf(syn) !== -1));
    });
    if (!anyMatch){
      aiPushMsg('bot', '😔 ' + loc('அந்த நிறத்தில் இப்போது exact-ஆ stock இல்லை — ஆனா இதோ இப்போது இருக்கிற அழகான சேலைகள்:', 'ఆ రంగులో ప్రస్తుతం స్టాక్ లేదు — కానీ ఇవి మా ప్రస్తుత అందమైన చీరలు:', 'ಆ ಬಣ್ಣದಲ್ಲಿ ಈಗ ಸ್ಟಾಕ್ ಇಲ್ಲ — ಆದರೆ ಇವು ಈಗ ಇರುವ ಅಂದವಾದ ಸೀರೆಗಳು:', 'That exact colour is out of stock right now — but here are today\'s beautiful picks:') +
        '<div class="ai-cards">' + picks.map(aiCard).join('') + '</div>' +
        '<a class="btn btn-wa btn-sm" style="margin-top:8px" href="' + waLink('Hi! I am looking for a ' + askedCols.join('/') + ' saree. Do you have it? 🙏') + '" target="_blank" rel="noopener">💬 ' + loc('அந்த நிறம் வேண்டுமா? WhatsApp-ல கேளுங்கள் — வந்ததும் சொல்கிறோம்!', 'ఆ రంగు కావాలా? WhatsApp లో అడగండి!', 'ಆ ಬಣ್ಣ ಬೇಕಾ? WhatsApp ನಲ್ಲಿ ಕೇಳಿ!', 'Want that colour? Ask on WhatsApp — we will inform you!') + '</a>');
      return;
    }
  }
  aiPushMsg('bot', (hint ? 'Here are <b>' + hint + '</b> picks for you: 🎯' : 'Here are your best matches: 🎯') +
    '<div class="ai-cards">' + picks.map(aiCard).join('') + '</div>' +
    tasteSummaryHTML() +
    '<a class="btn btn-wa btn-sm" style="margin-top:8px" href="' + waLink('Hi! I am looking for: ' + q + '. Please help me choose. 🙏') + '" target="_blank" rel="noopener">💬 Not sure? Ask us on WhatsApp</a>');
}
function openAIAssistant(){
  const quick = ['✨ Style Quiz', '❤️ Recommend for me', '👰 Wedding sarees', '💰 Under ₹1500', '✨ Silk', '⭐ Best sellers'];
  openModal('<div class="ai-chat">' +
    '<div class="ai-head">🤖 SK AI Assistant<small>Finds your perfect saree in seconds</small></div>' +
    '<div class="ai-msgs" id="aiMsgs"></div>' +
    '<div class="ai-quick">' + quick.map(x => '<button type="button" class="btn btn-outline btn-sm" data-aiq="' + esc(x) + '">' + esc(x) + '</button>').join('') + '</div>' +
    '<div class="ai-input"><input id="aiIn" placeholder="e.g. red silk saree under 1500" maxlength="90" autocomplete="off"><button type="button" class="btn btn-maroon btn-sm" id="aiSend">➤</button></div>' +
    '</div>');
  aiPushMsg('bot', '👋 ' + greetWord() + (userName() ? ', <b>' + esc(userName()) + '</b>!' : '!') + ' ' + loc('என்ன வேண்டும் சொல்லுங்கள் — <b>சந்தர்ப்பம், நிறம், துணி அல்லது பட்ஜெட்</b> — உடனே காட்டுகிறேன். Try: <i>"red silk saree under ₹1500"</i> 😊', 'ఏం కావాలో చెప్పండి — <b>సందర్భం, రంగు, ఫాబ్రిక్ లేదా బడ్జెట్</b> — నేను చూపిస్తాను. Try: <i>"red silk saree under ₹1500"</i> 😊', 'ಏನು ಬೇಕು ಹೇಳಿ — <b>ಸಂದರ್ಭ, ಬಣ್ಣ, ಫ್ಯಾಬ್ರಿಕ್ ಅಥವಾ ಬಜೆಟ್</b> — ತೋರಿಸುತ್ತೇನೆ. Try: <i>"red silk saree under ₹1500"</i> 😊', 'Tell me what you need — <b>occasion, colour, fabric or budget</b> — and I will show sarees for you. Try: <i>"red silk saree under ₹1500"</i> 😊'));
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
  qs.forEach(b => b.addEventListener('click', () => {
    const v = b.dataset.aiq;
    if (v === '✨ Style Quiz'){ closeModal(); setTimeout(openStyleQuiz, 320); return; }   /* ✨ open the quiz instead */
    aiPushMsg('user', esc(v));
    setTimeout(() => aiRespond(v), 350);
  }));
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
    /* 🌈 diversity: never 4 of the same category — hand-curated feel */
    const divLen = picks.length;
    const div = diversePicks(picks.map(p => ({ p, s: 1 })), Math.max(2, divLen), 2).map(x => x.p);
    if (div.length >= 2){
      picks.length = 0;
      div.forEach(p => picks.push(p));
    }
    if (picks.length < 2) return '';
    const nm = userName();
    const title = loc('🤖 AI பிக்ஸ் — உங்களுக்காக', '🤖 AI పిక్స్ — మీ కోసం', '🤖 AI ಪಿಕ್ಸ್ — ನಿಮಗಾಗಿ', '🤖 AI Picks' + (nm ? ' for ' + esc(nm) : ' for You'));
    /* explainable AI: show what the engine learned about her */
    const tp = tasteProfile();
    const chips = [];
    if (tp.signals){
      const topCat = Object.keys(tp.cats).sort((a, b) => tp.cats[b] - tp.cats[a])[0];
      if (topCat) chips.push('🏷️ ' + topCat);
      const topCol = Object.keys(tp.cols).sort((a, b) => tp.cols[b] - tp.cols[a])[0];
      if (topCol) chips.push('🎨 ' + topCol);
      if (tp.avgPrice) chips.push('💰 ~' + money(tp.avgPrice));
    }
    return '<section class="sec"><div class="sec-head"><h2><span class="tick"></span>' + title + '</h2><a href="shop.html">' + t('viewAll') + '</a></div>' +
      (chips.length ? '<div class="taste-chips">' + chips.map(c => '<span>' + c + '</span>').join('') + '<span style="cursor:pointer" data-quiz="1">✨ ' + loc('ஸ்டைல் க்விஸ் எடு', 'క్విజ్ తీసుకో', 'ಕ್ವಿಜ್ ತೆಗೆದುಕೊ', 'take the quiz') + '</span></div>' : '') +
      '<div class="prow">' + picks.slice(0, 4).map(cardHTML).join('') + '</div></section>';
  }catch(e){ return ''; }
}

/* ============================ 🎬 REELS PAGE (ShareChat-style) ============================
   Full-screen vertical swipe reels — each reel = a beautiful saree photo +
   a daily wish. 100 quotes (Good Morning / Good Night / தத்துவம் / கவிதை)
   in Tamil, Telugu & Kannada — the reel speaks HER language. Infinite feed,
   taste-ranked, with Instagram-style action rail. */
const REEL_QUOTES = [
  /* ☀️ Good Morning (20) */
  { g: 'gm', ta: 'காலை வணக்கம்! 🌞 இன்று உங்கள் நாள் சேலை மாதிரி அழகாக அமையட்டும்!', te: 'శుభోదయం! 🌞 ఈరోజు మీ రోజు చీర లాగా అందంగా సాగాలి!', kn: 'ಶುಭೋದಯ! 🌞 ಇಂದು ನಿಮ್ಮ ದಿನ ಸೀರೆಯಂತೆ ಅಂದವಾಗಿ ಸಾಗಲಿ!' },
  { g: 'gm', ta: 'அழகான காலை... அழகான சேலை... இன்றைய நாள் இனிமையாக இருக்கட்டும்! ✨', te: 'అందమైన ఉదయం... అందమైన చీర... ఈరోజు ఇంపుగా ఉండాలి! ✨', kn: 'ಅಂದವಾದ ಬೆಳಗು... ಅಂದವಾದ ಸೀರೆ... ಇಂದು ಇಂಪಾಗಿರಲಿ! ✨' },
  { g: 'gm', ta: 'சூரியன் எழுந்தது போல... உங்கள் முகத்திலும் புன்னகை மலரட்டும்! 🌼', te: 'సూర్యుడు ఉదయించినట్టే... మీ ముఖంలో చిరునవ్వు వికసించాలి! 🌼', kn: 'ಸೂರ್ಯ ಉದಿಸಿದಂತೆ... ನಿಮ್ಮ ಮುಖದಲ್ಲಿ ನಗು ಅರಳಲಿ! 🌼' },
  { g: 'gm', ta: 'ஒவ்வொரு காலையும் ஒவ்வொரு புது தொடக்கம்! இனிய காலை வணக்கம் ☀️', te: 'ప్రతి ఉదయం ఒక కొత్త ప్రారంభం! శుభోదయం ☀️', kn: 'ಪ್ರತಿ ಬೆಳಗು ಒಂದು ಹೊಸ ಆರಂಭ! ಶುಭೋದಯ ☀️' },
  { g: 'gm', ta: 'காலை வணக்கம்! இன்றைய அழகில் நீங்கள் தான் ஃபர்ஸ்ட்! 💐', te: 'శుభోదయం! ఈరోజు అందంలో మీరే ఫస్ట్! 💐', kn: 'ಶುಭೋದಯ! ಇಂದಿನ ಅಂದದಲ್ಲಿ ನೀವೇ ಫಸ್ಟ್! 💐' },
  { g: 'gm', ta: 'பொன்னான காலை வணக்கம் 🌻 உங்கள் நாள் தங்கம் போல பிரகாசிக்கட்டும்!', te: 'బంగారు ఉదయ వందనాలు 🌻 మీ రోజు బంగారంలా మెరవాలి!', kn: 'ಚಿನ್ನದ ಬೆಳಗಿನ ವಂದನೆ 🌻 ನಿಮ್ಮ ದಿನ ಚಿನ್ನದಂತೆ ಹೊಳೆಯಲಿ!' },
  { g: 'gm', ta: 'விடிந்தால் விஷயம் இருக்கு — இன்று நல்ல நாள்! காலை வணக்கம் 🌄', te: 'తెల్లవారింది అంటే విషయం ఉంది — ఈరోజు మంచి రోజు! 🌄', kn: 'ಬೆಳಗಾಯಿತು ಅಂದರೆ ವಿಷಯ ಇದೆ — ಇಂದು ಒಳ್ಳೆಯ ದಿನ! 🌄' },
  { g: 'gm', ta: 'காலை வணக்கம்! காபி கசப்பா இருந்தாலும் நாள் இனிக்கட்டும் ☕✨', te: 'శుభోదయం! కాఫీ చేదుగా ఉన్నా రోజు తీపిగా ఉండాలి ☕✨', kn: 'ಶುಭೋದಯ! ಕಾಫಿ ಕಹಿಯಿದ್ದರೂ ದಿನ ಸಿಹಿಯಾಗಿರಲಿ ☕✨' },
  { g: 'gm', ta: 'இனிய காலை! புது மலர் போல புத்துணர்ச்சியா இருங்கள்! 🌸', te: 'ఇంపైన ఉదయం! కొత్త పువ్వులా చైతన్యంగా ఉండండి! 🌸', kn: 'ಇಂಪಾದ ಬೆಳಗು! ಹೊಸ ಹೂವಿನಂತೆ ಉತ್ಸಾಹದಿಂದ ಇರಿ! 🌸' },
  { g: 'gm', ta: 'காலை வணக்கம்! இன்று ஒரு அழகான சேலை உங்களை காத்திருக்கிறது 🥻', te: 'శుభోదయం! ఈరోజు ఒక అందమైన చీర మిమ్మల్ని వేచి ఉంది 🥻', kn: 'ಶುಭೋದಯ! ಇಂದು ಒಂದು ಅಂದವಾದ ಸೀರೆ ನಿಮ್ಮನ್ನು ಕಾಯುತ್ತಿದೆ 🥻' },
  { g: 'gm', ta: 'மலர் மணம் மாதிரி இனிய காலை வணக்கம்! 🌺', te: 'పువ్వు సువాసన లాగా ఇంపైన శుభోదయం! 🌺', kn: 'ಹೂವಿನ ಸುಗಂಧದಂತೆ ಇಂಪಾದ ಶುಭೋದಯ! 🌺' },
  { g: 'gm', ta: 'காலை வணக்கம்! இன்றைய சூரிய ஒளி உங்கள் மனசுக்கும் தெரியட்டும்! 🌞', te: 'శుభోదయం! ఈరోజు సూర్యకాంతి మీ మనసుకు కూడా తగలాలి! 🌞', kn: 'ಶುಭೋದಯ! ಇಂದಿನ ಸೂರ್ಯಬೆಳಕು ನಿಮ್ಮ ಮನಸಿಗೂ ತಟ್ಟಲಿ! 🌞' },
  { g: 'gm', ta: 'நல்ல காலை! நல்ல எண்ணங்கள் பொறிக்கட்டும் 💭✨', te: 'మంచి ఉదయం! మంచి ఆలోచనలు మొలకెత్తాలి 💭✨', kn: 'ಒಳ್ಳೆಯ ಬೆಳಿಗ್ಗೆ! ಒಳ್ಳೆಯ ಯೋಚನೆಗಳು ಮೊಳೆಯಲಿ 💭✨' },
  { g: 'gm', ta: 'காலை வணக்கம்! இன்று உங்கள் புன்னகையால் யாரையாவது மகிழ்வியுங்கள் 😊', te: 'శుభోదయం! ఈరోజు మీ చిరునవ్వుతో ఎవరినైనా సంతోషపెట్టండి 😊', kn: 'ಶುಭೋದಯ! ಇಂದು ನಿಮ್ಮ ನಗುವಿನಿಂದ ಯಾರನ್ನಾದರೂ ಸಂತೋಷಪಡಿಸಿ 😊' },
  { g: 'gm', ta: 'விடியல் பொழுது வணக்கம்! புது நம்பிக்கை பொறிக்கட்டும் 🌅', te: 'వేకువ వేళ వందనాలు! కొత్త నమ్మకం మొలకెత్తాలి 🌅', kn: 'ಬೆಳಗಿನ ವೇಳೆಯ ವಂದನೆ! ಹೊಸ ನಂಬಿಕೆ ಮೊಳೆಯಲಿ 🌅' },
  { g: 'gm', ta: 'காலை வணக்கம்! அழகான நாள், அழகான ஆரம்பம் ✨', te: 'శుభోదయం! అందమైన రోజు, అందమైన ప్రారంభం ✨', kn: 'ಶುಭೋದಯ! ಅಂದವಾದ ದಿನ, ಅಂದವಾದ ಆರಂಭ ✨' },
  { g: 'gm', ta: 'தேன் இனிப்பு காலை வணக்கம்! 🍯 உங்கள் நாள் தேன் மாதிரி இனிக்கட்டும்!', te: 'తేనె ఇంపు శుభోదయం! 🍯 మీ రోజు తేనెలా తీపిగా ఉండాలి!', kn: 'ಜೇನು ಸಿಹಿಯ ಶುಭೋದಯ! 🍯 ನಿಮ್ಮ ದಿನ ಜೇನಿನಂತೆ ಸಿಹಿಯಾಗಿರಲಿ!' },
  { g: 'gm', ta: 'காலை வணக்கம்! இன்று உங்களுக்கு நல்லதே நடக்கட்டும் 🙏', te: 'శుభోదయం! ఈరోజు మీకు మంచిదే జరగాలి 🙏', kn: 'ಶುಭೋದಯ! ಇಂದು ನಿಮಗೆ ಒಳ್ಳೆಯದೇ ಆಗಲಿ 🙏' },
  { g: 'gm', ta: 'சுத்தமான காற்று, சுகமான காலை — இனிய வணக்கம்! 🍃', te: 'స్వచ్ఛమైన గాలి, హాయిగా ఉదయం — ఇంపైన వందనాలు! 🍃', kn: 'ಶುದ್ಧ ಗಾಳಿ, ಆರಾಮದ ಬೆಳಗು — ಇಂಪಾದ ವಂದನೆ! 🍃' },
  { g: 'gm', ta: 'காலை வணக்கம்! நல்ல சேலை + நல்ல மூட் = பெர்ஃபெக்ட் டே! 🥻', te: 'శుభోదయం! మంచి చీర + మంచి మూడ్ = పర్‌ఫెక్ట్ డే! 🥻', kn: 'ಶುಭೋದಯ! ಒಳ್ಳೆಯ ಸೀರೆ + ಒಳ್ಳೆಯ ಮೂಡ್ = ಪರ್ಫೆಕ್ಟ್ ಡೇ! 🥻' },
  /* 🌙 Good Night (16) */
  { g: 'gn', ta: 'இனிய இரவு வணக்கம் 🌙 நல்ல கனவுகள் தெரியட்டும்!', te: 'ఇంపైన రాత్రి వందనాలు 🌙 మంచి కలలు కావాలి!', kn: 'ಇಂಪಾದ ರಾತ್ರಿ ವಂದನೆ 🌙 ಒಳ್ಳೆಯ ಕನಸುಗಳು ಬರಲಿ!' },
  { g: 'gn', ta: 'நல்ல இரவு! நாளை இன்னும் அழகான சேலையோட சந்திப்போம் 🌙✨', te: 'మంచి రాత్రి! రేపు మరింత అందమైన చీరతో కలుద్దాం 🌙✨', kn: 'ಒಳ್ಳೆಯ ರಾತ್ರಿ! ನಾಳೆ ಇನ್ನಷ್ಟು ಅಂದವಾದ ಸೀರೆಯೊಂದಿಗೆ ಭೇಟಿಯಾಗೋಣ 🌙✨' },
  { g: 'gn', ta: 'நிலவு மாதிரி அமைதியான தூக்கம் வரட்டும்... Good Night 🌙', te: 'నెలలాగా ప్రశాంతమైన నిద్ర వస్తుంది... Good Night 🌙', kn: 'ಚಂದ್ರನಂತೆ ಶಾಂತವಾದ ನಿದ್ರೆ ಬರಲಿ... Good Night 🌙' },
  { g: 'gn', ta: 'இன்றைய சோர்வு எல்லாம் தூக்கத்தில் மறையட்டும்! இனிய இரவு ✨', te: 'ఈరోజు అలసట అంతా నిద్రలో మాయం కావాలి! ఇంపైన రాత్రి ✨', kn: 'ಇಂದಿನ ಆಯಾಸ ಎಲ್ಲವೂ ನಿದ್ರೆಯಲ್ಲಿ ಮರೆಯಾಗಲಿ! ಇಂಪಾದ ರಾತ್ರಿ ✨' },
  { g: 'gn', ta: 'கனவுகளில் அழகான சேலைகள் வரட்டும்... நல்ல இரவு 🌙', te: 'కలల్లో అందమైన చీరలు రావాలి... మంచి రాత్రి 🌙', kn: 'ಕನಸಿನಲ್ಲಿ ಅಂದವಾದ ಸೀರೆಗಳು ಬರಲಿ... ಒಳ್ಳೆಯ ರಾತ್ರಿ 🌙' },
  { g: 'gn', ta: 'இரவு வணக்கம்! நாளை ஒரு புது தினம்... புது வெற்றி 🌟', te: 'రాత్రి వందనాలు! రేపు కొత్త రోజు... కొత్త విజయం 🌟', kn: 'ರಾತ್ರಿ ವಂದನೆ! ನಾಳೆ ಹೊಸ ದಿನ... ಹೊಸ ಜಯ 🌟' },
  { g: 'gn', ta: 'நட்சத்திரங்கள் உங்கள் கனவுகளை காவல் காட்டும் ✨ Good Night!', te: 'నక్షత్రాలు మీ కలలను కాపాడతాయి ✨ Good Night!', kn: 'ನಕ್ಷತ್ರಗಳು ನಿಮ್ಮ ಕನಸುಗಳನ್ನು ಕಾಪಾಡುತ್ತವೆ ✨ Good Night!' },
  { g: 'gn', ta: 'இனிய இரவு! நாளை காலையில் புது ஆற்றலோட எழுந்திருங்கள் 🌅', te: 'ఇంపైన రాత్రి! రేపు ఉదయం కొత్త శక్తితో మేల్కొనండి 🌅', kn: 'ಇಂಪಾದ ರಾತ್ರಿ! ನಾಳೆ ಬೆಳಿಗ್ಗೆ ಹೊಸ ಶಕ್ತಿಯೊಂದಿಗೆ ಏಳಿ 🌅' },
  { g: 'gn', ta: 'தூங்குங்கள் அமைதியா... விழியுங்கள் வெற்றியா! நல்ல இரவு 🌙', te: 'ప్రశాంతంగా నిద్రించండి... విజయంతో మేల్కొనండి! మంచి రాత్రి 🌙', kn: 'ಶಾಂತವಾಗಿ ನಿದ್ರಿಸಿ... ವಿಜಯದೊಂದಿಗೆ ಏಳಿ! ಒಳ್ಳೆಯ ರಾತ್ರಿ 🌙' },
  { g: 'gn', ta: 'இரவு வணக்கம்! இன்றைய நினைவுகள் இனிமையா இருக்கட்டும் 💫', te: 'రాత్రి వందనాలు! ఈరోజు జ్ఞాపకాలు ఇంపుగా ఉండాలి 💫', kn: 'ರಾತ್ರಿ ವಂದನೆ! ಇಂದಿನ ನೆನಪುಗಳು ಇಂಪಾಗಿರಲಿ 💫' },
  { g: 'gn', ta: 'நிலா ஒளியில் நல்ல தூக்கம்! Good Night 🌕', te: 'నెలవెలుతురులో మంచి నిద్ర! Good Night 🌕', kn: 'ಬೆಳದಿಂಗಳ ಬೆಳಕಿನಲ್ಲಿ ಒಳ್ಳೆಯ ನಿದ್ರೆ! Good Night 🌕' },
  { g: 'gn', ta: 'இன்றைய கஷ்டம் எல்லாம் இரவில் மறக்கட்டும்... நாளை புது தொடக்கம் 🌙', te: 'ఈరోజు కష్టం అంతా రాత్రిలో మరచిపోవాలి... రేపు కొత్త ప్రారంభం 🌙', kn: 'ಇಂದಿನ ಕಷ್ಟ ಎಲ್ಲವೂ ರಾತ್ರಿಯಲ್ಲಿ ಮರೆತುಹೋಗಲಿ... ನಾಳೆ ಹೊಸ ಆರಂಭ 🌙' },
  { g: 'gn', ta: 'இனிய இரவு வணக்கம்! மனசு நிம்மதியா தூங்கட்டும் ✨', te: 'ఇంపైన రాత్రి వందనాలు! మనసు ప్రశాంతంగా నిద్రించాలి ✨', kn: 'ಇಂಪಾದ ರಾತ್ರಿ ವಂದನೆ! ಮನಸ್ಸು ಶಾಂತವಾಗಿ ನಿದ್ರಿಸಲಿ ✨' },
  { g: 'gn', ta: 'நல்ல இரவு! கனவுகளில் அழகான உலகம் இருக்கட்டும் 🌍💫', te: 'మంచి రాత్రి! కలల్లో అందమైన ప్రపంచం ఉండాలి 🌍💫', kn: 'ಒಳ್ಳೆಯ ರಾತ್ರಿ! ಕನಸಿನಲ್ಲಿ ಅಂದವಾದ ಜಗತ್ತಿರಲಿ 🌍💫' },
  { g: 'gn', ta: 'இரவு வணக்கம்! நாளை இன்னும் நல்லா இருக்கும் 🌟', te: 'రాత్రి వందనాలు! రేపు మరింత బాగుంటుంది 🌟', kn: 'ರಾತ್ರಿ ವಂದನೆ! ನಾಳೆ ಇನ್ನಷ್ಟು ಚೆನ್ನಾಗಿರುತ್ತದೆ 🌟' },
  { g: 'gn', ta: 'தூக்கம் தெய்வத்தோட சமம் — நல்லா தூங்குங்கள் 😴', te: 'నిద్ర దేవతతో సమానం — బాగా నిద్రించండి 😴', kn: 'ನಿದ್ರೆ ದೇವರಿಗೆ ಸಮಾನ — ಚೆನ್ನಾಗಿ ನಿದ್ರಿಸಿ 😴' },
  /* 🧵 தத்துவம் / Wisdom (34) */
  { g: 'th', ta: 'சேலை ஒரு உடை அல்ல — அது ஒரு தலைமுறையின் கதை 🧵', te: 'చీర ఒక వస్త్రం కాదు — అది ఒక తరానికి కథ 🧵', kn: 'ಸೀರೆ ಒಂದು ಉಡುಪಲ್ಲ — ಅದು ಒಂದು ತಲೆಮಾರಿನ ಕಥೆ 🧵' },
  { g: 'th', ta: 'பெண்ணின் அழகு சேலையில் மட்டும் இல்லை — அவளுடைய அன்பிலும் இருக்கிறது ❤️', te: 'స్త్రీ అందం చీరలో మాత్రమే కాదు — ఆమె ప్రేమలో కూడా ఉంటుంది ❤️', kn: 'ಹೆಣ್ಣಿನ ಅಂದ ಸೀರೆಯಲ್ಲಿ ಮಾತ್ರವಲ್ಲ — ಅವಳ ಪ್ರೀತಿಯಲ್ಲೂ ಇರುತ್ತದೆ ❤️' },
  { g: 'th', ta: 'நல்ல நட்பு நல்ல சேலை மாதிரி — எவ்வளவு காலமும் ஒட்டிக்கிடக்கும்!', te: 'మంచి స్నేహం మంచి చీర లాగా — ఎంత కాలమైనా ఒదిగి ఉంటుంది!', kn: 'ಒಳ್ಳೆಯ ಸ್ನೇಹ ಒಳ್ಳೆಯ ಸೀರೆಯಂತೆ — ಎಷ್ಟು ಕಾಲವಾದರೂ ಅಂಟಿಕೊಂಡಿರುತ್ತದೆ!' },
  { g: 'th', ta: 'வாழ்க்கை சேலை மாதிரிதான் — எப்படி உடுத்துகிறோம்ன்னது தான் முக்கியம்!', te: 'జీవితం చీర లాగా ఉంటుంది — ఎలా ధరిస్తామో అదే ముఖ్యం!', kn: 'ಬದುಕು ಸೀರೆಯಂತೆ — ಹೇಗೆ ಧರಿಸುತ್ತೇವೆ ಎಂಬುದೇ ಮುಖ್ಯ!' },
  { g: 'th', ta: 'தைரியம் என்பது புது சேலை மாதிரி — உடுத்தினா தான் தெரியும் அதோட அழகு!', te: 'ధైర్యం కొత్త చీర లాగా — ధరిస్తేనే దాని అందం తెలుస్తుంది!', kn: 'ಧೈರ್ಯ ಹೊಸ ಸೀರೆಯಂತೆ — ಧರಿಸಿದರೆ ಮಾತ್ರ ಅದರ ಅಂದ ಗೊತ್ತಾಗುತ್ತದೆ!' },
  { g: 'th', ta: 'மனசு நிறைந்தவங்களுக்கு எந்த சேலையும் கம்பெர்ட்டபுள் ❤️', te: 'మనసు నిండిన వాళ్ళకు ఏ చీర అయినా కంఫర్టబుల్ ❤️', kn: 'ಮನಸ್ಸು ತುಂಬಿದವರಿಗೆ ಯಾವ ಸೀರೆಯೇ ಆದರೂ ಕಾಮ್ಫರ್ಟಬಲ್ ❤️' },
  { g: 'th', ta: 'நேரம் காலம் மாறும் — ஆனா பாரம்பரிய அழகு மாறாது 🪡', te: 'కాలం మారుతుంది — కానీ సంప్రదాయ అందం మారదు 🪡', kn: 'ಕಾಲ ಬದಲಾಗುತ್ತದೆ — ಆದರೆ ಪರಂಪರೆಯ ಅಂದ ಬದಲಾಗುವುದಿಲ್ಲ 🪡' },
  { g: 'th', ta: 'சிரிச்சு பேசுனா எல்லா சேலையும் ஒத்துப்போகும் 😄', te: 'నవ్వుతూ మాట్లాడితే అన్ని చీరలు ఒదిగిపోతాయి 😄', kn: 'ನಗುತ್ತಾ ಮಾತನಾಡಿದರೆ ಎಲ್ಲಾ ಸೀರೆಯೂ ಒಪ್ಪುತ್ತದೆ 😄' },
  { g: 'th', ta: 'தன்னம்பிக்கையோட இருந்தா எந்த நிறமும் உங்களுக்கு அழகா இருக்கும்!', te: 'ఆత్మవిశ్వాసంతో ఉంటే ఏ రంగు అయినా మీకు అందంగా ఉంటుంది!', kn: 'ಆತ್ಮವಿಶ್ವಾಸದಿಂದ ಇದ್ದರೆ ಯಾವ ಬಣ್ಣವೇ ಆದರೂ ನಿಮಗೆ ಅಂದವಾಗಿರುತ್ತದೆ!' },
  { g: 'th', ta: 'எளிமையான வாழ்க்கைதான் அழகான வாழ்க்கை — எளிமையான சேலையும் அப்படியே!', te: 'సరళమైన జీవితమే అందమైన జీవితం — సరళమైన చీర కూడా అలాగే!', kn: 'ಸರಳವಾದ ಬದುಕೇ ಅಂದವಾದ ಬದುಕು — ಸರಳವಾದ ಸೀರೆಯೂ ಹಾಗೆಯೇ!' },
  { g: 'th', ta: 'அம்மா சொன்ன வார்த்தைகள் அம்மா கட்டின சேலை மாதிரி — எப்போதும் நெஞ்சோட ஒட்டிக்கிடக்கும்', te: 'అమ్మ చెప్పిన మాటలు అమ్మ కట్టిన చీర లాగా — ఎప్పుడూ గుండెలో ఒదిగి ఉంటాయి', kn: 'ಅಮ್ಮ ಹೇಳಿದ ಮಾತುಗಳು ಅಮ್ಮ ಕಟ್ಟಿದ ಸೀರೆಯಂತೆ — ಎಂದಿಗೂ ಎದೆಯಲ್ಲಿ ಅಂಟಿಕೊಂಡಿರುತ್ತವೆ' },
  { g: 'th', ta: 'வீண் பெருமை தேவையில்லை — நல்ல பண்புதான் உண்மையான அழகு', te: 'గర్వం అక్కర్లేదు — మంచి నడతనే నిజమైన అందం', kn: 'ಹೆಮ್ಮೆ ಬೇಡ — ಒಳ್ಳೆಯ ನಡತೆಯೇ ನಿಜವಾದ ಅಂದ' },
  { g: 'th', ta: 'பொறுமை இருந்தா பாதி வெற்றி கிடைச்சிடும் — மீதி முயற்சி!', te: 'ఓర్పు ఉంటే సగం విజయం వస్తుంది — మిగతా ప్రయత్నం!', kn: 'ತಾಳ್ಮೆ ಇದ್ದರೆ ಅರ್ಧ ಜಯ ಸಿಗುತ್ತದೆ — ಉಳಿದದು ಪ್ರಯತ್ನ!' },
  { g: 'th', ta: 'கொடுத்தா தான் கிடைக்கும் — அன்பு கொடுத்தா அன்பு கிடைக்கும் ❤️', te: 'ఇస్తేనే దక్కుతుంది — ప్రేమ ఇస్తే ప్రేమ దక్కుతుంది ❤️', kn: 'ಕೊಟ್ಟರೆ ಮಾತ್ರ ಸಿಗುತ್ತದೆ — ಪ್ರೀತಿ ಕೊಟ್ಟರೆ ಪ್ರೀತಿ ಸಿಗುತ್ತದೆ ❤️' },
  { g: 'th', ta: 'எந்த கஷ்டமும் எப்போதும் இருக்காது — நல்ல நேரம் வரும் 🌈', te: 'ఏ కష్టమూ శాశ్వతం కాదు — మంచి కాలం వస్తుంది 🌈', kn: 'ಯಾವ ಕಷ್ಟವೂ ಶಾಶ್ವತವಲ್ಲ — ಒಳ್ಳೆಯ ಕಾಲ ಬರುತ್ತದೆ 🌈' },
  { g: 'th', ta: 'நம்ம பிள்ளைகளுக்கு நாம விட்டுப்போற பாரம்பரியம் தான் நம்ம அடையாளம் 🧵', te: 'పిల్లలకు మనం వదిలే సంప్రదాయమే మన గుర్తింపు 🧵', kn: 'ಮಕ್ಕಳಿಗೆ ನಾವು ಬಿಟ್ಟುಹೋಗುವ ಪರಂಪರೆಯೇ ನಮ್ಮ ಗುರುತು 🧵' },
  { g: 'th', ta: 'உண்மையான அழகு முகத்துல இல்லை — மனசுல இருக்கு 💛', te: 'నిజమైన అందం ముఖంలో లేదు — మనసులో ఉంటుంది 💛', kn: 'ನಿಜವಾದ ಅಂದ ಮುಖದಲ್ಲಿಲ್ಲ — ಮನಸ್ಸಿನಲ್ಲಿರುತ್ತದೆ 💛' },
  { g: 'th', ta: 'கற்றுக்கொள்ளுறதுல வயசு இல்லை — அது சேலை மாதிரி, எப்போ வேணும்னாலும் அழகா இருக்கும்!', te: 'నేర్చుకోవడంలో వయసు లేదు — అది చీర లాగా, ఎప్పుడైనా అందంగా ఉంటుంది!', kn: 'ಕಲಿಯುವುದರಲ್ಲಿ ವಯಸ್ಸಿಲ್ಲ — ಅದು ಸೀರೆಯಂತೆ, ಯಾವಾಗಲೂ ಅಂದವಾಗಿರುತ್ತದೆ!' },
  { g: 'th', ta: 'சுற்றம் என்பது சொகம் — அவங்க கொடுக்குற பாசம் வேற எதுவும் இல்ல ❤️', te: 'బంధువులు అనేది సుఖం — వాళ్ళ ప్రేమకు మించినది లేదు ❤️', kn: 'ಸಂಬಂಧಿಕರೆಂಬುದು ಸುಖ — ಅವರ ಪ್ರೀತಿಗೆ ಬೇರೇನೂ ಸಮನಿಲ್ಲ ❤️' },
  { g: 'th', ta: 'விதி என்ன செய்யும் — முயற்சி நம்ம கைல தான் இருக்கு!', te: 'విధి ఏం చేస్తుందో — ప్రయత్నం మన చేతుల్లోనే ఉంది!', kn: 'ವಿಧಿ ಏನು ಮಾಡುತ್ತದೋ — ಪ್ರಯತ್ನ ನಮ್ಮ ಕೈಯಲ್ಲೇ ಇದೆ!' },
  { g: 'th', ta: 'சேலையோட அழகு அதோட விலையில இல்லை — அதை கட்டுற மனசுல இருக்கு', te: 'చీర అందం దాని ధరలో లేదు — దాన్ని ధరించే మనసులో ఉంటుంది', kn: 'ಸೀರೆಯ ಅಂದ ಅದರ ಬೆಲೆಯಲ್ಲಿಲ್ಲ — ಅದನ್ನು ಧರಿಸುವ ಮನಸ್ಸಿನಲ್ಲಿದೆ' },
  { g: 'th', ta: 'தவறு செய்யாதவங்க கிடையாது — திருத்திக்கிறவங்க தான் உண்மையான வெற்றியாளர்', te: 'తప్పు చేయని వాళ్ళు లేరు — సరిచేసుకునేవాళ్ళే నిజమైన విజేతలు', kn: 'ತಪ್ಪು ಮಾಡದವರಿಲ್ಲ — ತಿದ್ದಿಕೊಳ್ಳುವವರೇ ನಿಜವಾದ ವಿಜೇತರು' },
  { g: 'th', ta: 'புது சேலை கட்டினா மனசுக்கு தெரியும் — சின்ன சந்தோஷம்தான் வாழ்க்கை!', te: 'కొత్త చీర ధరిస్తే మనసుకు తెలుస్తుంది — చిన్న సంతోషమే జీవితం!', kn: 'ಹೊಸ ಸೀರೆ ಧರಿಸಿದರೆ ಮನಸಿಗೆ ಗೊತ್ತಾಗುತ್ತದೆ — ಸಣ್ಣ ಸಂತೋಷವೇ ಬದುಕು!' },
  { g: 'th', ta: 'யாரும் முழு நிலவு இல்லை — குறை இருந்தா தான் அழகு 🌕', te: 'ఎవరూ పూర్ణ చంద్రుడు కారు — లోపం ఉంటేనే అందం 🌕', kn: 'ಯಾರೂ ಪೂರ್ಣ ಚಂದ್ರನಲ್ಲ — ಕೊರತೆ ಇದ್ದರೆ ಮಾತ್ರ ಅಂದ 🌕' },
  { g: 'th', ta: 'அடுத்தவங்க நல்லா இருக்குறத பார்த்து பொறாமை படாதீங்க — நீங்களும் நல்லா இருங்க!', te: 'ఇతరులు బాగున్నారని అసూయ పడకండి — మీరు కూడా బాగుండండి!', kn: 'ಇತರರು ಚೆನ್ನಾಗಿದ್ದಾರೆ ಎಂದು ಅಸೂಯೆ ಪಡಬೇಡಿ — ನೀವೂ ಚೆನ್ನಾಗಿರಿ!' },
  { g: 'th', ta: 'மௌனம் என்பது பலவீனம் இல்லை — அது புத்திசாலித்தனம் 🤫', te: 'మౌనం బలహీనత కాదు — అది తెలివైన తనం 🤫', kn: 'ಮೌನ ದೌರ್ಬಲ್ಯವಲ್ಲ — ಅದು ಬುದ್ಧಿಮತ್ತೆ 🤫' },
  { g: 'th', ta: 'முதல் மதிப்பு கண்ணுக்கு — ஆனா நிலைக்குற மதிப்பு மனசுக்கு!', te: 'మొదటి మెప్పు కంటికి — నిలిచే మెప్పు మనసుకు!', kn: 'ಮೊದಲ ಮೆಚ್ಚುಗೆ ಕಣ್ಣಿಗೆ — ಉಳಿಯುವ ಮೆಚ್ಚುಗೆ ಮನಸಿಗೆ!' },
  { g: 'th', ta: 'ஒரு நல்ல சேலை ஒரு நல்ல நண்பன் — எப்போதும் உங்களோட இருக்கும்!', te: 'మంచి చీర మంచి స్నేహితుడిలా — ఎప్పుడూ మీతో ఉంటుంది!', kn: 'ಒಳ್ಳೆಯ ಸೀರೆ ಒಳ್ಳೆಯ ಸ್ನೇಹಿತ — ಎಂದಿಗೂ ನಿಮ್ಮೊಂದಿಗೆ ಇರುತ್ತದೆ!' },
  { g: 'th', ta: 'கஷ்டப்பட்டு சம்பாதிச்சது தான் இனிக்கும் — அது சேலையா இருந்தாலும் சரி!', te: 'కష్టపడి సంపాదించిందే తీపిగా ఉంటుంది — అది చీరైనా సరే!', kn: 'ಶ್ರಮಪಟ್ಟು ಸಂಪಾದಿಸಿದ್ದೇ ಸವಿಯಾಗಿರುತ್ತದೆ — ಅದು ಸೀರೆಯಾದರೂ ಸರಿ!' },
  { g: 'th', ta: 'மறந்துட்டு மன்னிக்கணும் வாழ்க்கைல — அதுதான் நிம்மதி 🕊️', te: 'మరచిపోయి క్షమించాలి జీవితంలో — అదే శాంతి 🕊️', kn: 'ಮರೆತು ಕ್ಷಮಿಸಬೇಕು ಬದುಕಿನಲ್ಲಿ — ಅದೇ ಶಾಂತಿ 🕊️' },
  { g: 'th', ta: 'நல்லவங்களுக்கு நல்லது நடக்கும் — கொஞ்சம் நேரம் எடுத்தாலும் ⏳', te: 'మంచివాళ్ళకు మంచిది జరుగుతుంది — కొంచెం సమయం పట్టినా ⏳', kn: 'ಒಳ್ಳೆಯವರಿಗೆ ಒಳ್ಳೆಯದು ಆಗುತ್ತದೆ — ಸ್ವಲ್ಪ ಸಮಯ ತೆಗೆದುಕೊಂಡರೂ ⏳' },
  { g: 'th', ta: 'அழகும் அறிவும் சேர்ந்தா — அது தான் பெண்மை 💪', te: 'అందమూ అనుభవమూ కలిస్తే — అదే స్త్రీత్వం 💪', kn: 'ಅಂದವೂ ಬುದ್ಧಿಯೂ ಸೇರಿದರೆ — ಅದೇ ಹೆಣ್ಣಿಮೆ 💪' },
  { g: 'th', ta: 'ஒவ்வொரு சேலையும் ஒரு கலை — ஒவ்வொரு பெண்ணும் ஒரு கலைஞர் 🎨', te: 'ప్రతి చీర ఒక కళ — ప్రతి స్త్రీ ఒక కళాకారిణి 🎨', kn: 'ಪ್ರತಿ ಸೀರೆ ಒಂದು ಕಲೆ — ಪ್ರತಿ ಹೆಣ್ಣೂ ಒಬ್ಬ ಕಲಾವಿದೆ 🎨' },
  { g: 'th', ta: 'முடிஞ்சத பத்திரமா வெச்சுக்கோங்க — பழையது தான் அழகு!', te: 'ఉన్నది సురక్షితంగా దాచుకోండి — పాతదే అందం!', kn: 'ಇರುವುದನ್ನು ಸುರಕ್ಷಿತವಾಗಿ ಇಟ್ಟುಕೊಳ್ಳಿ — ಹಳೆಯದೇ ಅಂದ!' },
  { g: 'th', ta: 'பணம் வந்து போகும் — ஆனா நல்ல பேரு நிலைக்கும் ✨', te: 'డబ్బు వస్తుంది పోతుంది — కానీ మంచి పేరు నిలుస్తుంది ✨', kn: 'ಹಣ ಬರುತ್ತದೆ ಹೋಗುತ್ತದೆ — ಆದರೆ ಒಳ್ಳೆಯ ಹೆಸರು ಉಳಿಯುತ್ತದೆ ✨' },
  { g: 'th', ta: 'நல்ல மனசு பெரிய ஆபரணம் — அது எந்த சேலைக்கும் match ஆகும் 💎', te: 'మంచి మనసు పెద్ద ఆభరణం — అది ఏ చీరకైనా సరిపోతుంది 💎', kn: 'ಒಳ್ಳೆಯ ಮನಸ್ಸು ದೊಡ್ಡ ಆಭರಣ — ಅದು ಯಾವ ಸೀರೆಗೂ ಹೊಂದುತ್ತದೆ 💎' },
  /* ✨ கவிதை / Poetry (30) */
  { g: 'ka', ta: 'நூலில் நெய்த கனவுகள்... சேலையில் சுமக்கும் கவிதைகள்... 🧵✨', te: 'నూలులో నేసిన కలలు... చీరలో మోసే కవితలు... 🧵✨', kn: 'ನೂಲಲ್ಲಿ ಹೆಣೆದ ಕನಸುಗಳು... ಸೀರೆಯಲ್ಲಿ ಹೊತ್ತ ಕವನಗಳು... 🧵✨' },
  { g: 'ka', ta: 'அம்மா கட்டின சேலையில் இருக்கு உலகின் மென்மையான அணிசல் ❤️', te: 'అమ్మ కట్టిన చీరలో ఉంది లోకపు మెత్తని ఆతిథ్యం ❤️', kn: 'ಅಮ್ಮ ಕಟ್ಟಿದ ಸೀರೆಯಲ್ಲಿದೆ ಜಗತ್ತಿನ ಮೃದುವಾದ ಆತಿಥ್ಯ ❤️' },
  { g: 'ka', ta: 'பட்டும் பஞ்சையும் பேசும் கவிதை... அது தான் சேலை!', te: 'పట్టును పంచెను మాట్లాడే కవిత... అదే చీర!', kn: 'ರೇಷ್ಮೆಯನ್ನು ಪಂಚೆಯನ್ನು ಮಾತನಾಡುವ ಕವನ... ಅದೇ ಸೀರೆ!' },
  { g: 'ka', ta: 'ஒரு சேலை — ஆயிரம் நினைவுகள்... ஒரு பார்வை — ஆயிரம் கவிதைகள் ✨', te: 'ఒక చీర — వెయ్యి జ్ఞాపకాలు... ఒక చూపు — వెయ్యి కవితలు ✨', kn: 'ಒಂದು ಸೀರೆ — ಸಾವಿರ ನೆನಪುಗಳು... ಒಂದು ನೋಟ — ಸಾವಿರ ಕವನಗಳು ✨' },
  { g: 'ka', ta: 'பெண்மை என்னும் கோவிலுக்கு சேலை தான் மாலை 🌸', te: 'స్త్రీత్వమనే ఆలయానికి చీరే పూలమాల 🌸', kn: 'ಹೆಣ್ಣಿಮೆಯೆಂಬ ದೇವಾಲಯಕ್ಕೆ ಸೀರೆಯೇ ಪುಷ್ಪಹಾರ 🌸' },
  { g: 'ka', ta: 'மஞ்சள் நிற முகில் மாதிரி... பட்டுச் சேலை மனசுக்குள்ள மெதுவா விழுந்தா மாதிரி 🌅', te: 'పసుపు రంగు మేఘం లాగా... పట్టు చీర మనసులో నెమ్మదిగా వాలినట్టు 🌅', kn: 'ಹಳದಿ ಬಣ್ಣದ ಮೋಡದಂತೆ... ರೇಷ್ಮೆ ಸೀರೆ ಮನಸಿನಲ್ಲಿ ನಿಧಾನವಾಗಿ ಉದುರಿದಂತೆ 🌅' },
  { g: 'ka', ta: 'தையல் கலைஞரின் கைகளில் வாழும் கவிதை ஒவ்வொரு சேலையும் 🪡', te: 'కుట్టు కళాకారుడి చేతుల్లో బతికే కవిత ప్రతి చీర 🪡', kn: 'ಹೊಲಿಗೆ ಕಲಾವಿದನ ಕೈಯಲ್ಲಿ ಬದುಕುವ ಕವನ ಪ್ರತಿ ಸೀರೆ 🪡' },
  { g: 'ka', ta: 'அழகு என்பது கண்ணால் பார்க்கும் காட்சி அல்ல — மனசால் உணரும் கவிதை 💛', te: 'అందం అనేది కంటితో చూసే దృశ్యం కాదు — మనసుతో అనుభవించే కవిత 💛', kn: 'ಅಂದ ಕಣ್ಣಿನಿಂದ ನೋಡುವ ದೃಶ್ಯವಲ್ಲ — ಮನಸ್ಸಿನಿಂದ ಅನುಭವಿಸುವ ಕವನ 💛' },
  { g: 'ka', ta: 'பல்லவி போல பளபளக்கும் ஜரி... சரணம் போல சுருண்டு விழும் தலைப்பு... 🎵', te: 'పల్లవి లాంటి మెరిసే జరి... చరణం లాంటి చుట్టుకునే అంచు... 🎵', kn: 'ಪಲ್ಲವಿಯಂತೆ ಹೊಳೆಯುವ ಜರಿ... ಚರಣೆಯಂತೆ ಸುರುಳಿ ಸುತ್ತುವ ಸೊಂடೆ... 🎵' },
  { g: 'ka', ta: 'காத்திருந்த கனவுகள் கரை கண்டது போல... கட்டிய சேலை களை கட்டுகிறது ✨', te: 'ఎదురుచూసిన కలలు ఒడిరినట్టే... ధరించిన చీర కళను కట్టుతుంది ✨', kn: 'ಕಾಯುತ್ತಿದ್ದ ಕನಸುಗಳು ದಡ ಸೇರಿದಂತೆ... ಧರಿಸಿದ ಸೀರೆ ಕಳೆ ಕಟ್ಟುತ್ತದೆ ✨' },
  { g: 'ka', ta: 'சேலையின் சுருக்கு போல... வாழ்க்கையின் மடிப்புகளும் அழகா இருக்கணும்!', te: 'చీర చుక్కీ లాగా... జీవిత మడుతలు కూడా అందంగా ఉండాలి!', kn: 'ಸೀರೆಯ ಸುಕ್ಕಿನಂತೆ... ಬದುಕಿನ ಮಡಚುಗಳೂ ಅಂದವಾಗಿರಬೇಕು!' },
  { g: 'ka', ta: 'அப்பா வாங்கித் தந்த முதல் சேலை — அது ஒரு கவிதையின் முதல் வரி ❤️', te: 'నాన్న కొని ఇచ్చిన మొదటి చీర — అది కవితకు మొదటి పంక్తి ❤️', kn: 'ಅಪ್ಪ ತಂದುಕೊಟ್ಟ ಮೊದಲ ಸೀರೆ — ಅದು ಕವನದ ಮೊದಲ ಸಾಲು ❤️' },
  { g: 'ka', ta: 'மழைத் துளியில் மணக்கும் மண்... பட்டுச் சேலையில் மணக்கும் பெண்மை 🌧️', te: 'వర్షపు బొట్టులో వాసన భూమి... పట్టు చీరలో వాసన స్త్రీత్వం 🌧️', kn: 'ಮಳೆಯ ಹನಿಯಲ್ಲಿ ಅಡಕ್ಕುವ ಮಣ್ಣು... ರೇಷ್ಮೆ ಸೀರೆಯಲ್ಲಿ ಅಡಕ್ಕುವ ಹೆಣ್ಣಿಮೆ 🌧️' },
  { g: 'ka', ta: 'சிவந்த கன்னம் சேலை சிவப்போட சண்டை போடும் — யார் அழகுன்னு 😊', te: 'ఎర్రని బుగ్గ చీర ఎరుపుతో పోటీ పడుతుంది — ఎవరు అందం అని 😊', kn: 'ಕೆಂಪಾದ ಕೆನ್ನೆ ಸೀರೆ ಕೆಂಪಿನೊಂದಿಗೆ ಸ್ಪರ್ಧೆ ಮಾಡುತ್ತದೆ — ಯಾರು ಅಂದ ಎಂದು 😊' },
  { g: 'ka', ta: 'நிலவை நெசவு செஞ்சா எப்படி இருக்கும்? அது தான் வெள்ளைச் சேலை 🌕', te: 'నెలను నేస్తే ఎలా ఉంటుంది? అదే తెలుపు చీర 🌕', kn: 'ಚಂದ್ರನನ್ನು ಹೆಣೆದರೆ ಹೇಗಿರುತ್ತದೆ? ಅದೇ ಬಿಳಿ ಸೀರೆ 🌕' },
  { g: 'ka', ta: 'சேலை கட்டிய பெண் நடந்தால் — கவிதை நடனமாடுது மாதிரி 💃', te: 'చీర కట్టిన స్త్రీ నడిస్తే — కవిత నాట్యం చేస్తున్నట్టు 💃', kn: 'ಸೀರೆ ಧರಿಸಿದ ಹೆಣ್ಣು ನಡೆದರೆ — ಕವನ ನರ್ತಿಸುತ್ತಿದ್ದಂತೆ 💃' },
  { g: 'ka', ta: 'காஞ்சிபுரத்து கோவில் கோபுரம் சேலையா மாறும் அற்புதம் 🛕', te: 'కంచి గుడి గోపురం చీరగా మారే అద్భుతం 🛕', kn: 'ಕಾಂಚಿ ದೇವಸ್ಥಾನದ ಗೋಪುರ ಸೀರೆಯಾಗಿ ಮಾರ್ಪಡುವ ಅದ್ಭುತ 🛕' },
  { g: 'ka', ta: 'ஒவ்வொரு வண்ணமும் ஒரு உணர்வு — ஒவ்வொரு சேலையும் ஒரு கதை 🎨', te: 'ప్రతి రంగూ ఒక భావన — ప్రతి చీర ఒక కథ 🎨', kn: 'ಪ್ರತಿ ಬಣ್ಣವೂ ಒಂದು ಭಾವನೆ — ಪ್ರತಿ ಸೀರೆಯೂ ಒಂದು ಕಥೆ 🎨' },
  { g: 'ka', ta: 'அணிந்தால் அரங்கேறும் கவிதை — அது தான் பட்டுச் சேலை 🎭', te: 'ధరిస్తే రంగస్థలం ఎక్కే కవిత — అదే పట్టు చీర 🎭', kn: 'ಧರಿಸಿದರೆ ರಂಗಕ್ಕೇರುವ ಕವನ — ಅದೇ ರೇಷ್ಮೆ ಸೀರೆ 🎭' },
  { g: 'ka', ta: 'பாட்டிக் காட்டிய பழைய சேலையில் இன்னும் பாட்டியோட வாசனை இருக்கு 🌹', te: 'అమ్మమ్మ చూపిన పాత చీరలో ఇంకా అమ్మమ్మ సువాసన ఉంది 🌹', kn: 'ಅಜ್ಜಿ ತೋರಿಸಿದ ಹಳೆಯ ಸೀರೆಯಲ್ಲಿ ಇನ್ನೂ ಅಜ್ಜಿಯ ಸುಗಂಧ ಇದೆ 🌹' },
  { g: 'ka', ta: 'அம்மாவோட சேலை பாத்ரோம் எடுத்தா கண்ணுல கண்ணீர் — அது அன்புன்னு தெரியும் 😢❤️', te: 'అమ్మ చీర పెట్టె తీస్తే కళ్ళలో నీళ్ళు — అది ప్రేమ అని తెలుసు 😢❤️', kn: 'ಅಮ್ಮನ ಸೀರೆಯ ಪೆಟ್ಟಿಗೆ ತೆರೆದರೆ ಕಣ್ಣಲ್ಲಿ ನೀರು — ಅದು ಪ್ರೀತಿ ಎಂದು ಗೊತ್ತು 😢❤️' },
  { g: 'ka', ta: 'மனசுக்கு இறங்குற சேலை தான் உண்மையான அழகு — விலை பெருசா இருக்கணும்ன்னு இல்ல 💛', te: 'మనసుకు నచ్చిన చీరే నిజమైన అందం — ధర పెద్దది అవ్వాలని లేదు 💛', kn: 'ಮನಸಿಗೆ ಇಳಿಯುವ ಸೀರೆಯೇ ನಿಜವಾದ ಅಂದ — ಬೆಲೆ ದೊಡ್ಡದಾಗಿರಬೇಕು ಎಂಬುದಿಲ್ಲ 💛' },
  { g: 'ka', ta: 'திருமணத்துல மணப்பெண் அணியறது சேலைய இல்லை — கனவுகளை 💭✨', te: 'పెళ్ళిలో పెళ్ళికూతురు ధరించేది చీర కాదు — కలలను 💭✨', kn: 'ಮದುವೆಯಲ್ಲಿ ವಧು ಧರಿಸುವುದು ಸೀರೆಯಲ್ಲ — ಕನಸುಗಳನ್ನು 💭✨' },
  { g: 'ka', ta: 'சேலையோட தலைப்பு மடிச்சா மறையுது — ஆனா நினைவுகள் மடியாது 🌹', te: 'చీర అంచు మడిచితే దాగిపోతుంది — కానీ జ్ఞాపకాలు మడువుతాయి 🌹', kn: 'ಸೀರೆಯ ಸೊಂಟೆ ಮಡಚಿದರೆ ಅಡಗುತ್ತದೆ — ಆದರೆ ನೆನಪುಗಳು ಮಡಕುವುದಿಲ್ಲ 🌹' },
  { g: 'ka', ta: 'வண்ணங்கள் பேசும் மொழி எல்லோருக்கும் புரியாது — சேலை புரிஞ்சவங்களுக்கு மட்டும் தான் 🎨', te: 'రంగులు మాట్లాడే భాష అందరికీ అర్థం కాదు — చీర అర్థమైన వాళ్ళకే 🎨', kn: 'ಬಣ್ಣಗಳು ಮಾತನಾಡುವ ಭಾಷೆ ಎಲ್ಲರಿಗೂ ಅರ್ಥವಾಗುವುದಿಲ್ಲ — ಸೀರೆ ಅರ್ಥಮಾಡಿಕೊಂಡವರಿಗೆ ಮಾತ್ರ 🎨' },
  { g: 'ka', ta: 'அலமாரியில ஒவ்வொரு சேலையும் ஒரு அத்தியாயம் — சில சந்தோஷம், சில நினைவு 📖', te: 'అల్మారాలో ప్రతి చీర ఒక అధ్యాయం — కొన్ని సంతోషం, కొన్ని జ్ఞాపకం 📖', kn: 'ಅಲಮಾರಿಯಲ್ಲಿ ಪ್ರತಿ ಸೀರೆಯೂ ಒಂದು ಅಧ್ಯಾಯ — ಕೆಲವು ಸಂತೋಷ, ಕೆಲವು ನೆನಪು 📖' },
  { g: 'ka', ta: 'காலைல கட்டுற சேலை மாலையா பழகிடும் — அப்போ தான் அது உங்களோடாகும் ✨', te: 'ఉదయం ధరించిన చీర సాయంత్రానికి అలవాస్తు అవుతుంది — అప్పుడే అది మీదై అవుతుంది ✨', kn: 'ಬೆಳಿಗ್ಗೆ ಧರಿಸಿದ ಸೀರೆ ಸಂಜೆಗೆ ಒಗ್ಗುತ್ತದೆ — ಆಗ ಮಾತ್ರ ಅದು ನಿಮ್ಮದಾಗುತ್ತದೆ ✨' },
  { g: 'ka', ta: 'உலகம் மாறினாலும் — பட்டுச் சேலையோட மோகனம் மாறாது 🌍', te: 'లోకం మారినా — పట్టు చీర మోహనం మారదు 🌍', kn: 'ಜಗತ್ತು ಬದಲಾದರೂ — ರೇಷ್ಮೆ ಸೀರೆಯ ಮೋಹನ ಬದಲಾಗುವುದಿಲ್ಲ 🌍' },
  { g: 'ka', ta: 'நாளை ஒரு புது சேலை... நாளை ஒரு புது கவிதை... 🌅✨', te: 'రేపు ఒక కొత్త చీర... రేపు ఒక కొత్త కవిత... 🌅✨', kn: 'ನಾಳೆ ಒಂದು ಹೊಸ ಸೀರೆ... ನಾಳೆ ಒಂದು ಹೊಸ ಕವನ... 🌅✨' },
  { g: 'ka', ta: 'சேலை என்பது துணி இல்லை — ஒரு பெண்ணோட கதையோட அடுத்த பக்கம் 📖', te: 'చీర అంటే గుడ్డ కాదు — ఒక స్త్రీ కథలో తర్వాతి పేజీ 📖', kn: 'ಸೀರೆ ಎಂದರೆ ಬಟ್ಟೆಯಲ್ಲ — ಒಬ್ಬ ಹೆಣ್ಣಿನ ಕಥೆಯ ಮುಂದಿನ ಪುಟ 📖' },
];
/* 💬 MORE quotes — Good Afternoon (மதிய வணக்கம்) + Good Evening (மாலை வணக்கம்)
   + extra kavithai / GM / GN. Same 3-language format (ta/te/kn). */
REEL_QUOTES.push(
  /* ☀️ Good Afternoon (10) */
  { g: 'ga', ta: 'மதிய வணக்கம்! 🌞 மதிய வெயிலிலும் உங்கள் மனசு குளிரா இருக்கட்டும்!', te: 'మధ్యాహ్న వందనాలు! 🌞 మధ్యాహ్న ఎండలో కూడా మీ మనసు చల్లగా ఉండాలి!', kn: 'ಮಧ್ಯಾಹ್ನದ ವಂದನೆ! 🌞 ಮಧ್ಯಾಹ್ನದ ಬಿಸಿಲಲ್ಲೂ ನಿಮ್ಮ ಮನಸ್ಸು ತಂಪಾಗಿರಲಿ!' },
  { g: 'ga', ta: 'இனிய மதிய நேரம்! சுவையான மதிய உணவும், ஓரமான ஓய்வும் 🍽️', te: 'ఇంపైన మధ్యాహ్నం! రుచికరమైన భోజనం, పక్కన విశ్రాంతి 🍽️', kn: 'ಇಂಪಾದ ಮಧ್ಯಾಹ್ನ! ರುಚಿಕರವಾದ ಊಟ, ಪಕ್ಕದಲ್ಲಿ ವಿಶ್ರಾಂತಿ 🍽️' },
  { g: 'ga', ta: 'மதிய வணக்கம்! அரை நாள் வெற்றி — மீதி அரை நாளும் சிறப்பா இருக்கட்டும் ✨', te: 'మధ్యాహ్న వందనాలు! సగం రోజు విజయం — మిగతా సగం కూడా బాగుండాలి ✨', kn: 'ಮಧ್ಯಾಹ್ನದ ವಂದನೆ! ಅರ್ಧ ದಿನ ಜಯ — ಉಳಿದರ್ಧ ದಿನವೂ ಚೆನ್ನಾಗಿರಲಿ ✨' },
  { g: 'ga', ta: 'வெயில் தணியும் நேரம் — மனசும் தணியட்டும்! மதிய வணக்கம் ☀️', te: 'ఎండ తగ్గే సమయం — మనసు కూడా తగ్గాలి! మధ్யాహ్న వందనాలు ☀️', kn: 'ಬಿಸಿಲು ಕಡಿಮೆಯಾಗುವ ಸಮಯ — ಮನಸ್ಸೂ ತಣಿಯಲಿ! ಮಧ್ಯಾಹ್ನದ ವಂದನೆ ☀️' },
  { g: 'ga', ta: 'மதிய வணக்கம்! காலை கனவுகள் நனவாகிக் கொண்டிருக்கட்டும் 💫', te: 'మధ్యాహ్న వందనాలు! ఉదయపు కలలు నిజమవుతూ ఉండాలి 💫', kn: 'ಮಧ್ಯಾಹ್ನದ ವಂದನೆ! ಬೆಳಿಗ್ಗಿನ ಕನಸುಗಳು ನನಸಾಗುತ್ತಿರಲಿ 💫' },
  { g: 'ga', ta: 'சூரியன் உச்சியில் — உங்கள் மனசும் உச்சியில்! மதிய வணக்கம் 🌞', te: 'సూర్యుడు శిఖరంలో — మీ మనసు కూడా శిఖరంలో! మధ్యాహ్న వందనాలు 🌞', kn: 'ಸೂರ್ಯ ಶಿಖರದಲ್ಲಿ — ನಿಮ್ಮ ಮನಸ್ಸೂ ಶಿಖರದಲ್ಲಿ! ಮಧ್ಯಾಹ್ನದ ವಂದನೆ 🌞' },
  { g: 'ga', ta: 'மதிய வணக்கம்! ஒரு கப் காபி + அழகான சேலை = மனசுக்கு சந்தோஷம் ☕🥻', te: 'మధ్యాహ్న వందనాలు! ఒక కప్పు కాఫీ + అందమైన చీర = మనసుకు సంతోషం ☕🥻', kn: 'ಮಧ್ಯಾಹ್ನದ ವಂದನೆ! ಒಂದು ಕಪ್ ಕಾಫಿ + ಅಂದವಾದ ಸೀರೆ = ಮನಸಿಗೆ ಸಂತೋಷ ☕🥻' },
  { g: 'ga', ta: 'மதிய வேளை வணக்கம்! வேலையில் சோர்வு இருந்தாலும் முகத்தில் புன்னகை 😊', te: 'మధ్యాహ్న వందనాలు! పనిలో అలసట ఉన్నా ముఖంలో చిరునవ్వు 😊', kn: 'ಮಧ್ಯಾಹ್ನದ ವಂದನೆ! ಕೆಲಸದಲ್ಲಿ ಆಯಾಸ ಇದ್ದರೂ ಮುಖದಲ್ಲಿ ನಗು 😊' },
  { g: 'ga', ta: 'மதிய வணக்கம்! இன்றைய அரை நாள் கணக்கு — நல்லது தான்! ✅', te: 'మధ్యాహ్న వందనాలు! ఈరోజు సగం లెక్క — బాగుంది! ✅', kn: 'ಮಧ್ಯಾಹ್ನದ ವಂದನೆ! ಇಂದಿನ ಅರ್ಧ ದಿನ ಲೆಕ್ಕ — ಒಳ್ಳೆಯದು! ✅' },
  { g: 'ga', ta: 'மதிய வணக்கம்! சேலை மாதிரி நிதானமா, அழகா இருங்கள்!', te: 'మధ్యాహ్న వందనాలు! చీర లాగా నిదానంగా, అందంగా ఉండండి!', kn: 'ಮಧ್ಯಾಹ್ನದ ವಂದನೆ! ಸೀರೆಯಂತೆ ನಿಧಾನವಾಗಿ, ಅಂದವಾಗಿ ಇರಿ!' },
  /* 🌆 Good Evening (10) */
  { g: 'ge', ta: 'மாலை வணக்கம்! 🌆 மாலை வானம் மாதிரி உங்கள் நாளும் வர்ணமயமா இருக்கட்டும்!', te: 'సాయంత్రం వందనాలు! 🌆 సాయంత్రం ఆకాశం లాగా మీ రోజు కూడా రంగులతో ఉండాలి!', kn: 'ಸಂಜೆಯ ವಂದನೆ! 🌆 ಸಂಜೆಯ ಆಕಾಶದಂತೆ ನಿಮ್ಮ ದಿನವೂ ಬಣ್ಣಮಯವಾಗಿರಲಿ!' },
  { g: 'ge', ta: 'இனிய மாலை வணக்கம்! சூரியன் மறையட்டும் — உங்கள் புன்னகை மட்டும் மறையாது 😊', te: 'ఇంపైన సాయంత్రం! సూర్యుడు దాగితే పర్వాలేదు — మీ చిరునవ్వు మాత్రం దాగదు 😊', kn: 'ಇಂಪಾದ ಸಂಜೆ! ಸೂರ್ಯ ಮರೆಯಲಿ — ನಿಮ್ಮ ನಗು ಮಾತ್ರ ಮರೆಯದು 😊' },
  { g: 'ge', ta: 'மாலை வணக்கம்! இன்றைய களைப்பை மாலைக் காற்று அடித்துப் பறக்கட்டும் 🍃', te: 'సాయంత్రం వందనాలు! ఈరోజు అలసటను సాయంత్రం గాలి ఎగరేయాలి 🍃', kn: 'ಸಂಜೆಯ ವಂದನೆ! ಇಂದಿನ ಆಯಾಸವನ್ನು ಸಂಜೆಯ ಗಾಳಿ ಹಾರಿಸಲಿ 🍃' },
  { g: 'ge', ta: 'மாலை வணக்கம்! மாலை நேரம் = குடும்பம் + சூபு + சிரிப்பு 🏠❤️', te: 'సాయంత్రం వందనాలు! సాయంత్రం = కుటుంబం + సూప్ + నవ్వు 🏠❤️', kn: 'ಸಂಜೆಯ ವಂದನೆ! ಸಂಜೆ = ಕುಟುಂಬ + ಸೂಪ್ + ನಗು 🏠❤️' },
  { g: 'ge', ta: 'அழகான மாலை! வானம் ஆரஞ்சு நிறம் — நீங்க எந்த நிற சேலை? 🌅', te: 'అందమైన సాయంత్రం! ఆకాశం నారింజ రంగు — మీరు ఏ రంగు చీర? 🌅', kn: 'ಅಂದವಾದ ಸಂಜೆ! ಆಕಾಶ ಕಿತ್ತಳೆ ಬಣ್ಣ — ನೀವು ಯಾವ ಬಣ್ಣದ ಸೀರೆ? 🌅' },
  { g: 'ge', ta: 'மாலை வணக்கம்! நல்ல மாலை ஒரு நல்ல இரவுக்கு அடித்தளம் 🌙', te: 'సాయంత్రం వందనాలు! మంచి సాయంత్రం మంచి రాత్రికి పునాది 🌙', kn: 'ಸಂಜೆಯ ವಂದನೆ! ಒಳ್ಳೆಯ ಸಂಜೆ ಒಳ್ಳೆಯ ರಾತ್ರಿಗೆ ಅಡಿಪಾಯ 🌙' },
  { g: 'ge', ta: 'மாலை வணக்கம்! நாளை இன்னும் நல்லா இருக்கும் ✨', te: 'సాయంత్రం వందనాలు! రేపు మరింత బాగుంటుంది ✨', kn: 'ಸಂಜೆಯ ವಂದನೆ! ನಾಳೆ ಇನ್ನಷ್ಟು ಚೆನ್ನಾಗಿರುತ್ತದೆ ✨' },
  { g: 'ge', ta: 'மாலை வேளை வணக்கம்! கடைசி மணி ஓட்டம் — வெற்றியா முடிக்குங்க! 💪', te: 'సాయంత్రం వందనాలు! చివరి గంట పరుగు — విజయంతో ముగించండి! 💪', kn: 'ಸಂಜೆಯ ವಂದನೆ! ಕೊನೆಯ ಗಂಟೆ ಓಟ — ವಿಜಯದೊಂದಿಗೆ ಮುಗಿಸಿ! 💪' },
  { g: 'ge', ta: 'மாலை வணக்கம்! ஒரு நல்ல சேலை + மாலை நடை = perfect evening 🥻✨', te: 'సాయంత్రం వందనాలు! మంచి చీర + సాయంత్రం నడక = perfect evening 🥻✨', kn: 'ಸಂಜೆಯ ವಂದನೆ! ಒಳ್ಳೆಯ ಸೀರೆ + ಸಂಜೆಯ ನಡಿಗೆ = perfect evening 🥻✨' },
  { g: 'ge', ta: 'மாலை வணக்கம்! மாலை மலர் மாதிரி வாசனையா இருங்கள் 🌆', te: 'సాయంత్రం వందనాలు! సాయంత్రం పువ్వు లాగా సువాసనగా ఉండండి 🌆', kn: 'ಸಂಜೆಯ ವಂದನೆ! ಸಂಜೆಯ ಹೂವಿನಂತೆ ಸುಗಂಧದಿಂದ ಇರಿ 🌆' },
  /* ✨ Extra Kavithai (10) */
  { g: 'ka', ta: 'மாலை வானம் சேலை கட்டுகிறது — சூரியன் தலைப்பாகை கட்டுகிறான் 🌅', te: 'సాయంత్రం ఆకాశం చీర కట్టుకుంటుంది — సూర్యుడు తలపాగా కట్టుకుంటాడు 🌅', kn: 'ಸಂಜೆಯ ಆಕಾಶ ಸೀರೆ ಧರಿಸುತ್ತದೆ — ಸೂರ್ಯ ಪೇಟ ಧರಿಸುತ್ತಾನೆ 🌅' },
  { g: 'ka', ta: 'மழை வந்தா மண் மணக்கும் — சேலை வந்தா வீடு மணக்கும் 🌧️🏠', te: 'వర్షం వస్తే నేల సువాసన — చీర వస్తే ఇల్లు సువాసన 🌧️🏠', kn: 'ಮಳೆ ಬಂದರೆ ಮಣ್ಣು ಅಡಕ್ಕುತ್ತದೆ — ಸೀರೆ ಬಂದರೆ ಮನೆ ಅಡಕ್ಕುತ್ತದೆ 🌧️🏠' },
  { g: 'ka', ta: 'பெண் சிரித்தால் கவிதை ஆகும் — அழுதாலும் கதை ஆகும் 💧✨', te: 'స్త్రీ నవ్వితే కవిత అవుతుంది — ఏడిస్తే కథ అవుతుంది 💧✨', kn: 'ಹೆಣ್ಣು ನಕ್ಕರೆ ಕವನವಾಗುತ್ತದೆ — ಅಳುತ್ತಿದ್ದರೂ ಕಥೆಯಾಗುತ್ತದೆ 💧✨' },
  { g: 'ka', ta: 'சேலையின் ஜரி மின்னும்போது — ராத்திரி நட்சத்திரம் பொறாமைக்கிறது ⭐', te: 'చీర జరి మెరిసినప్పుడు — రాత్రి నక్షత్రం అసూయపడుతుంది ⭐', kn: 'ಸೀರೆಯ ಜರಿ ಹೊಳೆದಾಗ — ರಾತ್ರಿ ನಕ್ಷತ್ರ ಅಸೂಯೆಪಡುತ್ತದೆ ⭐' },
  { g: 'ka', ta: 'ஒரு நல்ல சேலை — அணிந்தவருக்கு தைரியம், பார்த்தவருக்கு கவிதை ✨', te: 'మంచి చీర — ధరించిన వారికి ధైర్యం, చూసిన వారికి కవిత ✨', kn: 'ಒಳ್ಳೆಯ ಸೀರೆ — ಧರಿಸಿದವರಿಗೆ ಧೈರ್ಯ, ನೋಡಿದವರಿಗೆ ಕವನ ✨' },
  { g: 'ka', ta: 'வாழ்க்கை என்பது வெள்ளை சேலை — நாமளே அதற்கு வண்ணம் தீட்டணும் 🎨', te: 'జీవితం అంటే తెలుపు చీర — మనమే దానికి రంగులు వేయాలి 🎨', kn: 'ಬದುಕು ಎಂದರೆ ಬಿಳಿ ಸೀರೆ — ನಾವೇ ಅದಕ್ಕೆ ಬಣ್ಣ ಹಚ್ಚಬೇಕು 🎨' },
  { g: 'ka', ta: 'கண்ணாடி அழகை காட்டும் — சேலை ஆளுமையை காட்டும் 🪞', te: 'అద్దం అందాన్ని చూపుతుంది — చీర వ్యక్తిత్వాన్ని చూపుతుంది 🪞', kn: 'ಕನ್ನಡಿ ಅಂದವನ್ನು ತೋರಿಸುತ್ತದೆ — ಸೀರೆ ವ್ಯಕ್ತಿತ್ವವನ್ನು ತೋರಿಸುತ್ತದೆ 🪞' },
  { g: 'ka', ta: 'சேலை அணிந்த பெண் — நடையிலேயே ஒரு பாடல் 💃🎵', te: 'చీర ధరించిన స్త్రీ — నడకలోనే ఒక పాట 💃🎵', kn: 'ಸೀರೆ ಧರಿಸಿದ ಹೆಣ್ಣು — ನಡಿಗೆಯಲ್ಲೇ ಒಂದು ಹಾಡು 💃🎵' },
  { g: 'ka', ta: 'நல்ல சேலை எந்த கோவிலுக்கும் போகும் — அது பக்தியின் அடையாளம் 🛕', te: 'మంచి చీర ఏ గుడికి అయినా వెళ్ళే — అది భక్తి గుర్తు 🛕', kn: 'ಒಳ್ಳೆಯ ಸೀರೆ ಯಾವ ದೇವಸ್ಥಾನಕ್ಕೂ ಹೋಗುತ್ತದೆ — ಅದು ಭಕ್ತಿಯ ಗುರುತು 🛕' },
  { g: 'ka', ta: 'மாலை நிழல் நீண்டது போல — நல்ல சேலையின் அழகும் நீளும் 🌇', te: 'సాయంత్రం నీడ పొడిగినట్టే — మంచి చీర అందం కూడా పొడిగి ఉంటుంది 🌇', kn: 'ಸಂಜೆಯ ನೆರಳು ಚಾಚಿದಂತೆ — ಒಳ್ಳೆಯ ಸೀರೆಯ ಅಂದವೂ ಚಾಚುತ್ತದೆ 🌇' },
  /* ☀️ Extra GM (5) */
  { g: 'gm', ta: 'காலை வணக்கம்! புது நாள், புது வாய்ப்பு, புது வெற்றி! 🌅', te: 'శుభోదయం! కొత్త రోజు, కొత్త అవకాశం, కొత్త విజయం! 🌅', kn: 'ಶುಭೋದಯ! ಹೊಸ ದಿನ, ಹೊಸ ಅವಕಾಶ, ಹೊಸ ಜಯ! 🌅' },
  { g: 'gm', ta: 'இனிய காலை! இன்று ஒரு புது சேலை அணிந்து புதுசா உணருங்கள் ✨', te: 'ఇంపైన ఉదయం! ఈరోజు కొత్త చీర ధరించి కొత్తగా అనుభవించండి ✨', kn: 'ಇಂಪಾದ ಬೆಳಗು! ಇಂದು ಹೊಸ ಸೀರೆ ಧರಿಸಿ ಹೊಸದಾಗಿ ಅನುಭವಿಸಿ ✨' },
  { g: 'gm', ta: 'காலை வணக்கம்! ரோஜா மலர் மாதிரி புத்துணர்ச்சியோடு வாழுங்கள் 🌹', te: 'శుభోదయం! గులాబీ పువ్వు లాగా చైతన్యంగా జీవించండి 🌹', kn: 'ಶುಭೋದಯ! ಗುಲಾಬಿ ಹೂವಿನಂತೆ ಉತ್ಸಾಹದಿಂದ ಬಾಳಿ 🌹' },
  { g: 'gm', ta: 'காலை வணக்கம்! இன்றைய முதல் அழகு — உங்களுடைய புன்னகை 😊', te: 'శుభోదయం! ఈరోజు మొదటి అందం — మీ చిరునవ్వు 😊', kn: 'ಶುಭೋದಯ! ಇಂದಿನ ಮೊದಲ ಅಂದ — ನಿಮ್ಮ ನಗು 😊' },
  { g: 'gm', ta: 'சூரிய உதயம் போல பிரகாசமான நாள் வரட்டும்! காலை வணக்கம் ☀️', te: 'సూర్యోదయం లాగా ప్రకాశవంతమైన రోజు రావాలి! శుభోదయం ☀️', kn: 'ಸೂರ್ಯೋದಯದಂತೆ ಪ್ರಕಾಶಮಾನವಾದ ದಿನ ಬರಲಿ! ಶುಭೋದಯ ☀️' },
  /* 🌙 Extra GN (5) */
  { g: 'gn', ta: 'இரவு வணக்கம்! இன்றைய அனைத்து நினைவுகளும் இனிமையா தூங்கட்டும் 🌙', te: 'రాత్రి వందనాలు! ఈరోజు జ్ఞాపకాలన్నీ ఇంపుగా నిద్రించాలి 🌙', kn: 'ರಾತ್ರಿ ವಂದನೆ! ಇಂದಿನ ಎಲ್ಲಾ ನೆನಪುಗಳೂ ಇಂಪಾಗಿ ನಿದ್ರಿಸಲಿ 🌙' },
  { g: 'gn', ta: 'நல்ல இரவு! நட்சத்திரங்கள் உங்கள் கனவுகளுக்கு வழிகாட்டட்டும் ✨', te: 'మంచి రాత్రి! నక్షత్రాలు మీ కలలకు దారి చూపాలి ✨', kn: 'ಒಳ್ಳೆಯ ರಾತ್ರಿ! ನಕ್ಷತ್ರಗಳು ನಿಮ್ಮ ಕನಸುಗಳಿಗೆ ದಾರಿ ತೋರಿಸಲಿ ✨' },
  { g: 'gn', ta: 'இரவு வணக்கம்! நாளை ஒரு புது அத்தியாயம் — நல்லதா இருக்கும் 📖', te: 'రాత్రి వందనాలు! రేపు కొత్త అధ్యాయం — మంచిదే ఉంటుంది 📖', kn: 'ರಾತ್ರಿ ವಂದನೆ! ನಾಳೆ ಹೊಸ ಅಧ್ಯಾಯ — ಒಳ್ಳೆಯದೇ ಇರುತ್ತದೆ 📖' },
  { g: 'gn', ta: 'இனிய இரவு! தூக்கத்தில் அமைதியும், கனவில் சந்தோஷமும் 🕊️', te: 'ఇంపైన రాత్రి! నిద్రలో శాంతి, కలలో సంతోషం 🕊️', kn: 'ಇಂಪಾದ ರಾತ್ರಿ! ನಿದ್ರೆಯಲ್ಲಿ ಶಾಂತಿ, ಕನಸಿನಲ್ಲಿ ಸಂತೋಷ 🕊️' },
  { g: 'gn', ta: 'இரவு வணக்கம்! இன்று நன்றி — நாளை வெற்றி 🌟', te: 'రాత్రి వందనాలు! ఈరోజు కృతజ్ఞత — రేపు విజయం 🌟', kn: 'ರಾತ್ರಿ ವಂದನೆ! ಇಂದು ಕೃತಜ್ಞತೆ — ನಾಳೆ ಜಯ 🌟' }
);

/* 🌐 reels speak HER language — saved choice first, else device language */
function reelsLang(){
  try{
    if (lang === 'te' || lang === 'kn' || lang === 'ta') return lang;
    const tags = ((navigator.languages && navigator.languages.length) ? navigator.languages : [navigator.language || '']).join(',').toLowerCase().split(',');
    for (const tg of tags){ const p = String(tg).split('-')[0].trim(); if (p === 'te' || p === 'kn') return p; }
  }catch(e){}
  return 'ta';
}
function qText(q){ const L = reelsLang(); return (q && (q[L] || q.ta)) || ''; }
/* 🌐 reels UI auto-translates to HER language (device-detected) — the
   website itself stays English-first (manual change only), but reels speak
   Tamil / Telugu / Kannada automatically */
function rloc(ta, te, kn, en){
  const L = reelsLang();
  if (L === 'te') return te;
  if (L === 'kn') return kn;
  if (L === 'ta') return ta;
  return en;
}
/* greeting type by time of day */
function reelGreetingType(){
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return 'gm';
  if (h >= 11 && h < 16) return 'ga';   /* 🌞 மதிய வணக்கம் */
  if (h >= 16 && h < 19) return 'ge';   /* 🌆 மாலை வணக்கம் */
  return 'gn';
}
/* pick the reel's quote: deterministic per product+day (stable, fresh tomorrow) */
/* 👀 SEEN TRACKING — she never sees the same saree photo or the same
   thathuvam/kavithai twice. Seen ids + quote texts stored on her device. */
function seenQuotes(){ try{ return LS.get('sk_reel_seen_q', []) || []; }catch(e){ return []; } }
function markQuoteSeen(text){
  try{
    if (!text) return;
    let q = LS.get('sk_reel_seen_q', []) || [];
    if (q.indexOf(text) === -1){ q.push(text); if (q.length > 260) q = q.slice(-220); LS.set('sk_reel_seen_q', q); }
  }catch(e){}
}
function seenPids(){ try{ return LS.get('sk_reel_seen_pids', []) || []; }catch(e){ return []; } }
function markReelSeen(pid){
  try{
    if (!pid) return;
    let s = LS.get('sk_reel_seen_pids', []) || [];
    if (s.indexOf(pid) === -1){ s.push(pid); if (s.length > 320) s = s.slice(-260); LS.set('sk_reel_seen_pids', s); }
  }catch(e){}
}
function reelQuoteFor(p, i){
  try{
    const gtype = reelGreetingType();
    const cycle = [gtype, 'ka', gtype, 'th', 'mo', 'ka', 'th', gtype];
    const want = cycle[i % cycle.length];
    const pool = REEL_QUOTES.filter(q => q.g === want);
    const fallback = REEL_QUOTES.filter(q => q.g !== 'gm' && q.g !== 'gn');
    /* 👀 skip quotes she has already seen — always fresh words */
    const seen = seenQuotes();
    let unseen = pool.filter(q => seen.indexOf(qText(q)) === -1);
    if (!unseen.length) unseen = fallback.filter(q => seen.indexOf(qText(q)) === -1);
    let list = unseen.length ? unseen : (pool.length ? pool : fallback);
    let h = 0; const s = String(p.id || '') + '|' + new Date().toDateString() + '|' + i;
    for (let k = 0; k < s.length; k++) h = (h * 31 + s.charCodeAt(k)) >>> 0;
    return qText(list[h % list.length]);
  }catch(e){ return qText(REEL_QUOTES[0]); }
}
/* ❤️ REEL LIKES — global counts from Firestore (all users see the same
   number). One cached read per 30 min; every like = one increment write. */
function reelCountOf(pid){
  try{ const cache = LS.get('sk_reel_counts_cache', null) || {}; return Math.max(0, +((cache.c || {})[pid]) || 0); }catch(e){ return 0; }
}
function bumpLocalCount(pid, d){
  try{
    const cache = LS.get('sk_reel_counts_cache', null) || { t: Date.now(), c: {} };
    cache.c = cache.c || {};
    cache.c[pid] = Math.max(0, (+cache.c[pid] || 0) + d);
    LS.set('sk_reel_counts_cache', cache);
  }catch(e){}
}
async function loadReelCounts(){
  try{
    const cached = LS.get('sk_reel_counts_cache', null);
    if (cached && cached.t && (Date.now() - cached.t) < 1800000 && cached.c){ return cached.c; }   /* 30-min cache */
    if (!FS.enabled()) return (cached && cached.c) || {};
    const doc = await FS.reelLikeCounts();
    if (doc){
      const c = doc.c || doc;   /* ❤️ likes map + 🔁 shares map in one doc */
      LS.set('sk_reel_counts_cache', { t: Date.now(), c, s: doc.s || {} });
      return c;
    }
    return (cached && cached.c) || {};
  }catch(e){ return {}; }
}
function applyReelCountsToDom(){
  try{
    document.querySelectorAll('[data-rplike]').forEach(btn => {
      const n = reelCountOf(btn.dataset.rplike);
      const sm = btn.querySelector('small');
      if (sm) sm.textContent = n > 0 ? n : '';
    });
  }catch(e){}
}
/* ⏱️ REEL DWELL TIMING — how many seconds she watches each reel feeds the
   taste algorithm (same sk_dwell map the product pages use). Watching longer
   = stronger love. */
let __reelActive = null;
function setActiveReel(pid){
  try{
    const now = Date.now();
    if (__reelActive && __reelActive.id){
      const secs = Math.round((now - __reelActive.t) / 1000);
      if (secs > 0 && secs < 900){
        const d = LS.get('sk_dwell', {}) || {};
        d[__reelActive.id] = (d[__reelActive.id] || 0) + secs;
        LS.set('sk_dwell', d);   /* 🧠 taste engine reads this */
        queueReelDwell(__reelActive.id, secs);   /* 📈 global admin ranking */
      }
    }
    __reelActive = pid ? { id: pid, t: now } : null;
  }catch(e){}
}
/* 🔁 SHARE COUNTS — global on Firestore, exactly like the like counts */
function reelSharesOf(pid){
  try{ const cache = LS.get('sk_reel_counts_cache', null) || {}; return Math.max(0, +((cache.s || {})[pid]) || 0); }catch(e){ return 0; }
}
function bumpLocalShares(pid){
  try{
    const cache = LS.get('sk_reel_counts_cache', null) || { t: Date.now(), c: {}, s: {} };
    cache.s = cache.s || {};
    cache.s[pid] = (+cache.s[pid] || 0) + 1;
    LS.set('sk_reel_counts_cache', cache);
  }catch(e){}
}
function applyReelShareCount(btn){
  try{
    const n = reelSharesOf(btn.dataset.reelshare);
    const sm = btn.querySelector('small');
    if (sm) sm.textContent = n > 0 ? n : '';
  }catch(e){}
}
/* 📈 GLOBAL REEL STATS — views (v) + watch seconds (d) per saree, sent to
   Firestore in ONE batched write every 20s (quota-friendly). The admin panel
   rankings are built from this. */
let __reelPending = { v: {}, d: {} };
let __reelViewedSession = {};
function queueReelView(pid){
  try{
    if (!pid || __reelViewedSession[pid]) return;   /* one view per saree per session */
    __reelViewedSession[pid] = 1;
    __reelPending.v[pid] = (__reelPending.v[pid] || 0) + 1;
  }catch(e){}
}
function queueReelDwell(pid, secs){
  try{
    if (!pid || !secs || secs < 1) return;
    __reelPending.d[pid] = (__reelPending.d[pid] || 0) + secs;
  }catch(e){}
}
function flushReelStats(){
  try{
    const pending = __reelPending;
    const has = Object.keys(pending.v || {}).length || Object.keys(pending.d || {}).length;
    if (!has) return;
    if (!FS.enabled()){ __reelPending = { v: {}, d: {} }; return; }
    __reelPending = { v: {}, d: {} };
    FS.updateReelStats(pending).catch(() => {});
  }catch(e){}
}
function startReelStatsFlusher(){
  try{
    if (window.__reelStatsTimer) return;
    window.__reelStatsTimer = setInterval(flushReelStats, 20000);
    window.addEventListener('pagehide', flushReelStats);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushReelStats(); });
  }catch(e){}
}
function setReelLike(pid, on, reelEl){
  try{
    LS.set('sk_reel_liked_' + pid, on ? 1 : 0);
    bumpLocalCount(pid, on ? 1 : -1);
    if (FS.enabled()) FS.reelLike(pid, on ? 1 : -1).catch(() => {});   /* 🔥 global for ALL users */
    if (reelEl){
      const btn = reelEl.querySelector('[data-rplike]');
      if (btn){
        const ic = btn.querySelector('.rpa-ic');
        if (ic){ ic.textContent = on ? '❤️' : '🤍'; ic.classList.toggle('liked', on); ic.classList.remove('burst'); void ic.offsetWidth; ic.classList.add('burst'); }
        const sm = btn.querySelector('small');
        if (sm) sm.textContent = reelCountOf(pid) > 0 ? reelCountOf(pid) : '';
      }
    }
  }catch(e){}
}
/* ❤️ DOUBLE-TAP TO LIKE — Instagram style: big heart burst. Double-tap
   only ever LIKES (never unlikes) — exactly like the real app. */
function likeReel(pid, reelEl){
  try{
    if (LS.get('sk_reel_liked_' + pid, 0)) return;   /* already loved */
    setReelLike(pid, true, reelEl);
  }catch(e){}
}
function bigHeartBurst(reel){
  try{
    const h = document.createElement('div');
    h.className = 'rp-bigheart';
    h.textContent = '❤️';
    reel.appendChild(h);
    setTimeout(() => { try{ h.remove(); }catch(e){} }, 900);
  }catch(e){}
}
function initReelDoubleTap(){
  try{
    let lastTap = 0, lastTarget = null, sx = 0, sy = 0;
    const isControl = (t) => !!(t && t.closest && t.closest('.rpa, .rp-btns, a, button, input, textarea'));
    document.addEventListener('touchstart', e => {
      if (e.touches[0]){ sx = e.touches[0].clientX; sy = e.touches[0].clientY; }
    }, { passive: true });
    document.addEventListener('touchend', e => {
      const reel = e.target.closest && e.target.closest('.rp-reel');
      if (!reel || isControl(e.target)) return;
      const t = e.changedTouches[0];
      if (t && (Math.abs(t.clientX - sx) > 14 || Math.abs(t.clientY - sy) > 14)) return;
      const now = Date.now();
      if (now - lastTap < 330 && lastTarget === reel){
        likeReel(reel.dataset.rid, reel);
        bigHeartBurst(reel);
        lastTap = 0; lastTarget = null;
      } else { lastTap = now; lastTarget = reel; }
    });
    document.addEventListener('dblclick', e => {
      const reel = e.target.closest && e.target.closest('.rp-reel');
      if (!reel || isControl(e.target)) return;
      likeReel(reel.dataset.rid, reel);
      bigHeartBurst(reel);
    });
  }catch(e){}
}
/* 📄 FULL-SCREEN PRODUCT GALLERY — tap the photo to view every saree
   photo full-screen; swipe left/right, arrows on desktop, dots, one-tap close. */
function openGalleryViewer(gallery, startIdx, alt){
  try{
    const gal = (gallery || []).filter(Boolean);
    if (!gal.length) return;
    const idx = Math.min(Math.max(0, startIdx || 0), gal.length - 1);
    let ov = document.getElementById('galViewer');
    if (ov) ov.remove();
    ov = document.createElement('div');
    ov.id = 'galViewer';
    ov.className = 'img-zoom';
    ov.innerHTML = '<div class="img-zoom-back" data-zoom-close></div>' +
      '<div class="gv-track" id="gvTrack">' +
        gal.map((u, i) => '<div class="gv-slide"><img src="' + esc(u) + '" alt="' + esc(alt || '') + '" loading="' + (Math.abs(i - idx) <= 1 ? 'eager' : 'lazy') + '" onload="imgLoaded(this)" onerror="imgSafe(this)"></div>').join('') +
      '</div>' +
      (gal.length > 1
        ? '<button type="button" class="gv-nav gvl" data-gnav="-1" aria-label="Previous photo">‹</button>' +
          '<button type="button" class="gv-nav gvr" data-gnav="1" aria-label="Next photo">›</button>' +
          '<div class="gv-dots">' + gal.map((_, i) => '<i class="' + (i === idx ? 'on' : '') + '"></i>').join('') + '</div>'
        : '') +
      '<button type="button" class="img-zoom-x" data-zoom-close aria-label="Close">✕</button>';
    document.body.appendChild(ov);
    document.body.style.overflow = 'hidden';
    const track = ov.querySelector('#gvTrack');
    if (track){
      requestAnimationFrame(() => { try{ track.scrollLeft = track.clientWidth * idx; }catch(e){} });
      const dots = ov.querySelectorAll('.gv-dots i');
      track.addEventListener('scroll', () => {
        try{
          const cur = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
          dots.forEach((d, i) => d.classList.toggle('on', i === cur));
        }catch(e){}
      }, { passive: true });
      track.addEventListener('click', e2 => { if (e2.target.tagName === 'IMG'){ try{ closeGalleryViewer(); }catch(e3){} } });
    }
  }catch(e){}
}
function closeGalleryViewer(){
  const ov = document.getElementById('galViewer');
  if (ov) ov.remove();
  document.body.style.overflow = '';
}

/* 🎬 render the reels feed — taste-ranked (what she views most comes first),
   INFINITE (more reels auto-load near the end — never a dead end),
   Instagram-style action rail (❤️ like · 💬 comment · 🔁 share · 🔖 save · 🎵 audio) */
let __reelsState = null;
let __reelIO = null;
let __reelViewIO = null;
function reelsProductOrder(){
  try{
    const pool = PRODUCTS.filter(p => !p.hidden);
    const tp = tasteProfile();
    if (tp.signals){
      /* 👀 returning user — taste first, but push already-seen sarees back */
      const seen = seenPids();
      return pool.map(p => ({ p, s: tasteScore(p, tp) - (seen.indexOf(p.id) !== -1 ? 400 : 0) }))
                 .sort((a, b) => b.s - a.s).map(x => x.p);
    }
    /* 🌟 FIRST-TIME user — most LIKED (Firestore global counts) + most
       VIEWED (reviews) sarees first — she starts with the crowd favourites */
    const cache = (LS.get('sk_reel_counts_cache', null) || {}).c || {};
    const seen = seenPids();
    return pool.map(p => ({ p, s: (+cache[p.id] || 0) * 3 + (+p.reviews || 0) + (seen.indexOf(p.id) !== -1 ? -400 : 0) }))
               .sort((a, b) => b.s - a.s).map(x => x.p);
  }catch(e){ return PRODUCTS.filter(p => !p.hidden); }
}
function reelLikesOf(pid){
  try{ const m = LS.get('sk_reel_likes', {}) || {}; return m[pid] || 0; }catch(e){ return 0; }
}
/* 🖼️ 9:16 portrait reel photos — the proxy crops every saree photo to a
   true vertical 9:16 HD frame (TikTok/IG look). Falls back to the original
   photo instantly if the proxy is slow or down. */
function reelImgSrc(p){
  try{
    const url = p.img || ((p.images || [])[0]);
    const bare = String(url).replace(/^https?:\/\//, '');
    return 'https://wsrv.nl/?url=' + encodeURIComponent(bare) + '&w=720&h=1280&fit=cover&output=jpg&q=86';
  }catch(e){ return p.img || ''; }
}
function reelHTML(p, i){
  const q = reelQuoteFor(p, i);
  const liked = !!LS.get('sk_reel_liked_' + p.id, 0);
  const likes = reelCountOf(p.id);   /* 🔥 global Firestore count */
  const off = offPct(p);
  const price = p.price || 0;
  const stockLeft = (p.stock != null && p.stock > 0) ? +p.stock : null;
  /* 🛒 SHOPPING REEL — funnel: video → product info → price → BUY.
     Clean top (menu lives in the site bar), only 3 rail actions, and a
     glass product card at the bottom with everything needed to decide. */
  return '<section class="rp-reel" data-rid="' + esc(p.id) + '" data-q="' + esc(q) + '">' +
    '<img class="rp-img" src="' + esc(reelImgSrc(p)) + '" data-orig="' + esc(p.img || '') + '" alt="' + esc(p.name) + '" loading="lazy" onload="imgLoaded(this)" onerror="if(this.dataset.orig){var o=this.dataset.orig;this.removeAttribute(\'data-orig\');this.src=o;}else{imgSafe(this);}">' +
    '<div class="rp-shade"></div>' +
    '<div class="rp-quote"><p>' + esc(q) + '</p></div>' +
    /* rail — ❤️ Like · 💬 WhatsApp · ↗ Share (3 actions only) */
    '<div class="rp-actions">' +
      '<button type="button" class="rpa" data-rplike="' + esc(p.id) + '" aria-label="Like"><span class="rpa-ic' + (liked ? ' liked' : '') + '">' + (liked ? '❤️' : '🤍') + '</span><small>' + (likes || '') + '</small></button>' +
      '<a class="rpa" href="' + waLink(waProductMsg(p)) + '" target="_blank" rel="noopener" aria-label="Order on WhatsApp"><span class="rpa-ic rpa-wa">💬</span><small>' + rloc('ஆர்டர்', 'ఆర్డర్', 'ಆర్డర్', 'Order') + '</small></a>' +
      '<button type="button" class="rpa" data-reelshare="' + esc(p.id) + '" aria-label="Share"><span class="rpa-ic">↗</span><small>' + (reelSharesOf(p.id) > 0 ? reelSharesOf(p.id) : rloc('பகிர்', 'షేర్', 'ಶేర్', 'Share')) + '</small></button>' +
    '</div>' +
    /* 🛍️ product card — title → price → trust → urgency → BUY NOW → WhatsApp */
    '<div class="rp-bottom"><div class="rp-card">' +
      '<b class="rpc-title">' + esc(smartTitle(p)) + '</b>' +
      '<div class="rpc-price">' +
        (p.mrp && p.mrp > price ? '<s>₹' + p.mrp.toLocaleString('en-IN') + '</s>' : '') +
        '<b>₹' + price.toLocaleString('en-IN') + '</b>' +
        (off >= 5 ? '<span class="rpc-off">🔥 ' + off + '% OFF</span>' : '') +
      '</div>' +
      '<div class="rpc-trust">🚚 2–5 Days Delivery • 💵 COD Available • 🔄 Easy Exchange • 🔒 Secure Order</div>' +
      '<div class="rpc-urg">🔥 ' + rloc('இன்னிக்கு இந்த சேலை ₹' + price.toLocaleString('en-IN') + ' மட்டும்', 'ఈ రోజు ఈ చీర ₹' + price.toLocaleString('en-IN') + ' మాత్రమే', 'ಇಂದು ಈ ಸೀರೆ ₹' + price.toLocaleString('en-IN') + ' ಮಾತ್ರ', 'Today only — ₹' + price.toLocaleString('en-IN')) +
        (stockLeft && stockLeft <= 5 ? ' • 👗 ' + rloc('கடைசி ' + stockLeft + ' பீஸ்!', 'చివరి ' + stockLeft + ' ముక్కలు!', 'ಕೊನೆಯ ' + stockLeft + ' ತುಣುಕುಗಳು!', 'Only ' + stockLeft + ' left!') : '') +
      '</div>' +
      '<a class="btn btn-buy rpc-buy" href="product.html?id=' + encodeURIComponent(p.id) + '">' + rloc('🛒 இந்த சேலையை ₹' + price.toLocaleString('en-IN') + 'க்கு வாங்குங்கள்', '🛒 ఈ చీరను ₹' + price.toLocaleString('en-IN') + 'కి కొనండి', '🛒 ಈ ಸೀರೆಯನ್ನು ₹' + price.toLocaleString('en-IN') + 'ಗೆ ಖರೀದಿಸಿ', '🛒 BUY NOW — ₹' + price.toLocaleString('en-IN')) + '</a>' +
      '<a class="btn btn-wa rpc-wa" href="' + waLink(waProductMsg(p)) + '" target="_blank" rel="noopener">💬 ' + rloc('WhatsApp-ல் Order செய்யுங்கள் | Quick Reply', 'WhatsApp లో ఆర్డర్ చేయండి | వేగవంతమైన ప్రతిస్పందన', 'WhatsApp ನಲ್ಲಿ ಆರ್ಡರ್ ಮಾಡಿ | ತ್ವರಿತ ಪ್ರತಿಕ್ರಿಯೆ', 'WhatsApp Order | Quick Reply') + '</a>' +
    '</div></div>' +
  '</section>';
}

function renderReelsPage(){
  const app = document.getElementById('app'); if (!app) return;
  __reelsState = { order: reelsProductOrder(), next: 0, qi: 0 };
  /* 🔗 deep link (?reel=ID) — THAT saree's reel comes FIRST, always
     (even if she has seen it before — the link must open its image) */
  try{
    const want = new URLSearchParams(location.search).get('reel');
    if (want){
      const idx = __reelsState.order.findIndex(p => String(p.id) === String(want));
      if (idx > 0){ __reelsState.order.splice(0, 0, __reelsState.order.splice(idx, 1)[0]); }
    }
  }catch(e){}
  app.innerHTML = '<div class="rp-wrap" id="rpWrap"></div>' +
    '<button type="button" class="rp-arrow up" data-rpnav="-1" aria-label="Previous reel">⌃</button>' +
    '<button type="button" class="rp-arrow down" data-rpnav="1" aria-label="Next reel">⌄</button>';
  appendReels(10);
  /* 🔥 load GLOBAL like counts (Firestore — one cached read) */
  try{ loadReelCounts().then(() => applyReelCountsToDom()).catch(() => {}); }catch(e){}
  try{ startReelStatsFlusher(); }catch(e){}   /* 📈 global views + dwell → admin rankings */
  /* 🔗 shared link (?reel=ID) → jump straight to THAT saree's reel */
  try{
    const want = new URLSearchParams(location.search).get('reel');
    if (want){
      const go = () => {
        const wrap2 = document.getElementById('rpWrap');
        const el = wrap2 && wrap2.querySelector('.rp-reel[data-rid="' + ((window.CSS && CSS.escape) ? CSS.escape(want) : String(want).replace(/["\\]/g, '')) + '"]');
        if (el && wrap2){ wrap2.scrollTop = el.offsetTop - 6; el.classList.add('rp-flash'); setTimeout(() => el.classList.remove('rp-flash'), 2400); }
        else setTimeout(go, 400);   /* reels still loading — retry */
      };
      setTimeout(go, 350);
    }
  }catch(e){}
}
/* ♾️ INFINITE — more reels load as she nears the end. Never stops. */
function appendReels(n){
  try{
    const wrap = document.getElementById('rpWrap');
    if (!wrap || !__reelsState) return;
    const st = __reelsState;
    const out = [];
    for (let k = 0; k < n; k++){
      const p = st.order[st.next % st.order.length];
      out.push(reelHTML(p, st.qi));
      st.next++; st.qi++;
    }
    wrap.insertAdjacentHTML('beforeend', out.join(''));
    /* view tracking → taste engine keeps learning what she loves */
    try{
      if (__reelViewIO) __reelViewIO.disconnect();
      if ('IntersectionObserver' in window){
        __reelViewIO = new IntersectionObserver(ents => {
          ents.forEach(en => {
            if (en.isIntersecting && en.intersectionRatio > 0.6){
              const el = en.target;
              const p = byId(el.dataset.rid);
              if (p){ try{ trackRecentView(p); }catch(e){} }
              try{ markReelSeen(el.dataset.rid); }catch(e){}          /* 👀 no repeat sarees */
              try{ queueReelView(el.dataset.rid); }catch(e){}           /* 📈 global views */
              try{ markQuoteSeen(el.dataset.q); }catch(e){}           /* 👀 no repeat quotes */
              try{ setActiveReel(el.dataset.rid); }catch(e){}          /* ⏱️ dwell → taste engine */
            }
          });
        }, { root: wrap, threshold: 0.6 });
        wrap.querySelectorAll('.rp-reel').forEach(r => __reelViewIO.observe(r));
      }
    }catch(e){}
    /* watch the LAST reel → auto-load the next batch (infinite feed) */
    try{
      if (__reelIO) __reelIO.disconnect();
      const last = wrap.lastElementChild;
      if (last && 'IntersectionObserver' in window){
        __reelIO = new IntersectionObserver(ents => {
          if (ents[0] && ents[0].isIntersecting){
            __reelIO.disconnect();
            appendReels(10);              /* ♾️ endless reels */
            observeLastReel();
          }
        }, { root: wrap, rootMargin: '0px 0px -30% 0px', threshold: 0.15 });
        __reelIO.observe(last);
      }
    }catch(e){}
  }catch(e){}
}
function observeLastReel(){
  try{
    const wrap = document.getElementById('rpWrap');
    if (!wrap || !__reelIO) return;
    const last = wrap.lastElementChild;
    if (last) __reelIO.observe(last);
  }catch(e){}
}
/* 💬 reel comments — real product reviews, posted right from the reel */
function reelCommentModal(p){
  if (!p) return;
  const revs = LS.get('sk_reviews_' + p.id, []);
  openModal('<div class="rc-modal">' +
    '<h3>💬 ' + rloc('கருத்துகள்', 'కామెంట్లు', 'ಕಾಮೆಂಟ್‌ಗಳು', 'Comments') + ' — ' + esc((Store.profile || {}).name || 'You') + '</h3>' +
    '<div class="rc-list">' + (revs.length ? revs.slice().reverse().map(revCardHTML).join('') : '<p class="muted small" style="padding:8px 2px">' + rloc('இன்னும் கருத்துகள் இல்லை — முதல் கருத்தை நீங்களே எழுதுங்கள்!', 'ఇంకా కామెంట్లు లేవు — మొదటి కామెంట్ మీరే రాయండి!', 'ಇನ್ನೂ ಕಾಮೆಂಟ್‌ಗಳಿಲ್ಲ — ಮೊದಲ ಕಾಮೆಂಟ್ ನೀವೇ ಬರೆಯಿರಿ!', 'No comments yet — be the first!') + '</p>') + '</div>' +
    '<input id="rcName" placeholder="' + rloc('பெயர்', 'పేరు', 'ಹೆಸರು', 'Name') + '" maxlength="40" value="' + esc((Store.profile || {}).name || '') + '" style="width:100%;border:1.5px solid var(--line);border-radius:10px;padding:11px 12px;font-size:16px;background:#fff;outline:none">' +
    '<textarea id="rcText" rows="2" placeholder="' + rloc('உங்க கருத்தை எழுதுங்க…', 'మీ కామెంట్ రాయండి…', 'ನಿಮ್ಮ ಕಾಮೆಂಟ್ ಬರೆಯಿರಿ…', 'Write a comment…') + '" maxlength="300" style="width:100%;border:1.5px solid var(--line);border-radius:10px;padding:11px 12px;font-size:16px;background:#fff;outline:none;resize:vertical"></textarea>' +
    '<button type="button" class="btn btn-maroon" data-rpost="' + esc(p.id) + '">✍️ ' + rloc('பதிவிடு', 'పోస్ట్', 'ಪೋಸ್ಟ್', 'Post') + '</button>' +
    '</div>');
}
/* 📸 SAVE REEL AS IMAGE — draws the saree photo + wish + brand onto a
   canvas (ShareChat-style greeting card) and downloads it to her phone.
   She posts it on WhatsApp Status → free traffic! Falls back to opening the
   photo (long-press save) if the CDN blocks canvas export. */
function wrapText(ctx, text, x, y, maxW, lineH){
  const words = String(text || '').split(' ');
  let line = '', yy = y;
  words.forEach(w => {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && line){
      ctx.fillText(line, x, yy); line = w; yy += lineH;
    } else line = test;
  });
  if (line) ctx.fillText(line, x, yy);
  return yy;
}
/* 🖼️ robust image fetch — googleusercontent/blogger CDNs don't send
   CORS headers, so canvas + share get tainted/blocked. wsrv.nl is a free image
   proxy that serves ANY image WITH proper CORS headers → the photo always
   makes it into the saved card & the WhatsApp share. */
/* 🌟 HD upgrade — blogger/googleusercontent photos ship small versions
   (/s320/, /w400-h300/…). Swapping the size token to /s1600/ returns the
   original HD photo — the saved greeting card becomes razor sharp. */
function hdImageUrl(url){
  try{
    return String(url)
      .replace(/\/s\d+(-c)?\//, '/s1600/')
      .replace(/\/w\d+-h\d+(-p)?(-c)?(?!\d)\//, '/s1600/')
      .replace(/=s\d+(-c)?$/, '=s1600');
  }catch(e){ return url; }
}
async function fetchImageBlob(url, wantHd){
  if (!url) return null;
  if (wantHd) url = hdImageUrl(url);
  /* 1) direct (works for same-origin / CORS-friendly hosts) */
  try{
    const r = await fetch(url, { cache: 'no-store' });
    if (r && r.ok){ const b = await r.blob(); if (b && b.size) return b; }
  }catch(e){}
  /* 2) CORS proxy (googleusercontent, blogger, etc.) */
  try{
    const r2 = await fetch('https://wsrv.nl/?url=' + encodeURIComponent(url.replace(/^https?:\/\//, '')) + '&w=1080&output=jpg&q=92', { cache: 'no-store' });
    if (r2 && r2.ok){ const b2 = await r2.blob(); if (b2 && b2.size) return b2; }
  }catch(e){}
  /* 3) older proxy fallback */
  try{
    const r3 = await fetch('https://corsproxy.io/?' + encodeURIComponent(url), { cache: 'no-store' });
    if (r3 && r3.ok){ const b3 = await r3.blob(); if (b3 && b3.size) return b3; }
  }catch(e){}
  return null;
}
async function imageFromBlob(blob){
  return new Promise(res => {
    try{
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = () => res(null);
      im.src = URL.createObjectURL(blob);
    }catch(e){ res(null); }
  });
}

async function saveReelImage(p, quote){
  if (!p) return;
  try{
    toast('📸 ' + loc('படம் தயார் ஆகிறது…', 'ఫోటో రెడీ అవుతోంది…', 'ಫೋಟೊ ಸಿದ್ಧವಾಗುತ್ತಿದೆ…', 'Preparing your image…'));
    const url = p.img || ((p.images || [])[0]);
    /* 🖼️ load the photo via blob+proxy → canvas is NEVER tainted,
       so the downloaded card ALWAYS has the saree photo. */
    let img = null;
    try{
      const blob = await fetchImageBlob(url, true);   /* 🌟 HD photo */
      if (blob) img = await imageFromBlob(blob);
    }catch(e){}
    const loaded = !!img;
    const W = 1080, H = 1440;   /* 🌟 HD greeting card */
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#1d0a12';
    ctx.fillRect(0, 0, W, H);
    if (loaded && ctx){
      const sc = Math.max(W / img.width, H / img.height);
      const dw = img.width * sc, dh = img.height * sc;
      ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
    }
    if (ctx){
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, 'rgba(0,0,0,.5)');
      g.addColorStop(0.34, 'rgba(0,0,0,0)');
      g.addColorStop(0.72, 'rgba(0,0,0,.7)');
      g.addColorStop(1, 'rgba(0,0,0,.92)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      /* the wish, big and centred */
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 54px Georgia, "Noto Sans Tamil", "Noto Sans Telugu", "Noto Sans Kannada", sans-serif';
      wrapText(ctx, quote || '', W / 2, 190, W - 130, 62);
      /* product card at the bottom */
      ctx.fillStyle = '#ffd98a';
      ctx.font = 'bold 30px Georgia, serif';
      ctx.fillText('— SK SAREES • SALEM —', W / 2, H - 220);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 42px Georgia, serif';
      const title = String(smartTitle(p));
      ctx.fillText(title.length > 42 ? title.slice(0, 42) + '…' : title, W / 2, H - 160);
      ctx.fillStyle = '#ffd98a';
      ctx.font = 'bold 48px Georgia, serif';
      ctx.fillText('₹' + (p.price || 0).toLocaleString('en-IN'), W / 2, H - 100);
      ctx.fillStyle = 'rgba(255,255,255,.78)';
      ctx.font = 'bold 28px Georgia, serif';
      ctx.fillText('www.sksaree.shop', W / 2, H - 52);
    }
    const data = cv.toDataURL('image/jpeg', 0.9);
    const a = document.createElement('a');
    a.href = data;
    a.download = 'sk-sarees-' + String(p.id || 'reel').replace(/[^a-z0-9-]/gi, '') + '.jpg';
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast('✅ ' + loc('படம் சேமிப்பு! WhatsApp Status-க்கு போடுங்கள்!', 'ఫోటో సేవ్ అయింది!', 'ಫೋಟೊ ಸೇವ್ ಆಯಿತು!', 'Saved! Post it on WhatsApp Status!'));
  }catch(e){
    /* canvas blocked (CORS) → open the photo so she can long-press save */
    try{ window.open(p.img || '', '_blank'); }catch(e2){}
    toast('📸 ' + loc('போட்டோ திறந்தது — நீண்ட நேரம் அழுத்தி save பண்ணுங்கள்', 'ఫోటో తెరిచింది — నొక్కి పట్టుకుని సేవ్ చేయండి', 'ಫೋಟೊ ತೆರೆದಿದೆ — ಒತ್ತಿ ಹಿಡಿದು ಸೇವ್ ಮಾಡಿ', 'Photo opened — long-press to save it'));
  }
}
/* 📲 WHATSAPP STATUS PHOTO — full 9:16 (1080×1920) HD. Everyone can set the
   saree + wish as her WhatsApp Status → her ENTIRE contact list sees the
   saree + www.sksaree.shop (viral, free marketing). Shares the image straight
   into WhatsApp (with the reseller's ref link in the text) or downloads it. */
async function saveReelStatus(p, quote){
  if (!p) return;
  try{
    toast('📲 ' + rloc('Status போட்டோ தயார் ஆகிறது…', 'స్టేటస్ ఫోటో రెడీ అవుతోంది…', 'ಸ್ಟೇಟಸ್ ಫೋಟೊ ಸಿದ್ಧವಾಗುತ್ತಿದೆ…', 'Preparing your status photo…'));
    const url = p.img || ((p.images || [])[0]);
    let img = null;
    try{
      const blob = await fetchImageBlob(url, true);   /* 🌟 HD photo */
      if (blob) img = await imageFromBlob(blob);
    }catch(e){}
    const loaded = !!img;
    const W = 1080, H = 1920;   /* true WhatsApp status size (9:16 full screen) */
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const ctx = cv.getContext ? cv.getContext('2d') : null;
    if (ctx){
      ctx.fillStyle = '#1d0a12';
      ctx.fillRect(0, 0, W, H);
      if (loaded){
        const sc = Math.max(W / img.width, H / img.height);
        const dw = img.width * sc, dh = img.height * sc;
        ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
      }
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, 'rgba(0,0,0,.55)');
      g.addColorStop(0.30, 'rgba(0,0,0,0)');
      g.addColorStop(0.70, 'rgba(0,0,0,.66)');
      g.addColorStop(1, 'rgba(0,0,0,.94)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      /* the wish — big, centred (perfect status size) */
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 58px Georgia, "Noto Sans Tamil", "Noto Sans Telugu", "Noto Sans Kannada", sans-serif';
      wrapText(ctx, quote || '', W / 2, 250, W - 120, 66);
      /* brand card at the bottom */
      ctx.fillStyle = '#ffd98a';
      ctx.font = 'bold 30px Georgia, serif';
      ctx.fillText('— SK SAREES • SALEM —', W / 2, H - 300);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 42px Georgia, serif';
      const title = String(smartTitle(p));
      ctx.fillText(title.length > 42 ? title.slice(0, 42) + '…' : title, W / 2, H - 240);
      ctx.fillStyle = '#ffd98a';
      ctx.font = 'bold 48px Georgia, serif';
      ctx.fillText('₹' + (p.price || 0).toLocaleString('en-IN'), W / 2, H - 180);
      ctx.fillStyle = 'rgba(255,255,255,.85)';
      ctx.font = 'bold 32px Georgia, serif';
      ctx.fillText('www.sksaree.shop', W / 2, H - 120);
      ctx.fillStyle = 'rgba(255,255,255,.62)';
      ctx.font = 'bold 26px Georgia, serif';
      ctx.fillText('🛍️ Order on WhatsApp • Cash on Delivery', W / 2, H - 74);
    }
    /* 🔁 a status post IS a share — count it globally */
    try{
      bumpLocalShares(p.id);
      if (FS.enabled()) FS.reelShare(p.id).catch(() => {});
      document.querySelectorAll('[data-reelshare="' + String(p.id).replace(/"/g, '') + '"]').forEach(applyReelShareCount);
    }catch(e0){}
    /* 📤 share the image file itself (with text) → she posts it as her Status */
    const shareTxt = rloc('இந்த அழகான சேலையை உங்க WhatsApp Status-ஆ வையுங்க 🥰✨', 'ఈ అందమైన చీరను మీ WhatsApp స్టేటస్‌గా పెట్టండి 🥰✨', 'ಈ ಸುಂದರವಾದ ಸೀರೆಯನ್ನು ನಿಮ್ಮ WhatsApp ಸ್ಟೇಟಸ್ ಆಗಿ ಇಡಿ 🥰✨', 'Set this beautiful saree as your WhatsApp Status 🥰✨') +
      '\n\n🌸 ' + smartTitle(p) + ' — ₹' + (p.price || 0).toLocaleString('en-IN') +
      '\n👉 ' + reelShareLink(p);
    try{
      if (ctx && cv.toBlob && navigator.share){
        const blob = await new Promise(r => { try{ cv.toBlob(r, 'image/jpeg', 0.92); }catch(e1){ r(null); } });
        if (blob && navigator.canShare){
          const file = new File([blob], 'sk-sarees-status.jpg', { type: 'image/jpeg' });
          if (navigator.canShare({ files: [file] })){
            navigator.share({ files: [file], text: shareTxt, title: 'SK Sarees' }).then(() => {}, () => {});
            toast('📲 ' + rloc('Status-ஆ வையுங்க! உங்க contact list எல்லாரும் பார்ப்பாங்க 💜', 'స్టేటస్‌గా పెట్టండి! మీ కాంటాక్ట్ లిస్ట్ అందరూ చూస్తారు 💜', 'ಸ್ಟೇಟಸ್ ಆಗಿ ಇಡಿ! ನಿಮ್ಮ ಸಂಪರ್ಕ ಪಟ್ಟಿ ಎಲ್ಲರೂ ನೋಡುತ್ತಾರೆ 💜', 'Post it as your Status! Your whole contact list sees it 💜'));
            maybeEarnHint();
            return;
          }
        }
      }
    }catch(e2){}
    /* fallback: download the status photo + clear instructions */
    try{
      if (ctx && cv.toDataURL){
        const data = cv.toDataURL('image/jpeg', 0.92);
        const a = document.createElement('a');
        a.href = data;
        a.download = 'sk-status-' + String(p.id || 'saree').replace(/[^a-z0-9-]/gi, '') + '.jpg';
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast('✅ ' + rloc('Status போட்டோ download ஆனது! WhatsApp → Status → Gallery-ல இருந்து வையுங்க 💜', 'స్టేటస్ ఫోటో డౌన్‌లోడ్ అయింది! Gallery నుండి స్టేటస్ పెట్టండి 💜', 'ಸ್ಟೇಟಸ್ ಫೋಟೊ ಡೌನ್‌ಲೋಡ್ ಆಗಿದೆ! Gallery ನಿಂದ ಸ್ಟೇಟಸ್ ಇಡಿ 💜', 'Status photo downloaded! WhatsApp → Status → pick from Gallery 💜'));
        maybeEarnHint();
        return;
      }
    }catch(e3){}
    /* no canvas at all → open the raw photo for a long-press save */
    try{ window.open(url || '', '_blank'); }catch(e4){}
    toast('📸 ' + rloc('போட்டோ திறந்தது — நீண்ட நேரம் அழுத்தி save பண்ணி Status வையுங்க', 'ఫోటో తెరిచింది — నొక్కి పట్టుకుని సేవ్ చేసి స్టేటస్ పెట్టండి', 'ಫೋಟೊ ತೆರೆದಿದೆ — ಒತ್ತಿ ಹಿಡಿದು ಸೇವ್ ಮಾಡಿ ಸ್ಟೇಟಸ್ ಇಡಿ', 'Photo opened — long-press to save, then post as your Status'));
  }catch(e){
    try{ window.open((p && p.img) || '', '_blank'); }catch(e2){}
    toast('📸 ' + rloc('போட்டோ திறந்தது — save பண்ணி Status வையுங்க', 'ఫోటో తెరిచింది — సేవ్ చేసి స్టేటస్ పెట్టండి', 'ಫೋಟೊ ತೆರೆದಿದೆ — ಸೇವ್ ಮಾಡಿ ಸ್ಟೇಟಸ್ ಇಡಿ', 'Photo opened — save it & post as your Status'));
  }
}
/* 🔗 the reel share link — ALWAYS carries the reseller ref so shares EARN */
function reelShareLink(p){
  try{
    let url = (location.origin + '/reels.html?reel=' + encodeURIComponent(p.id));
    const mine = myResellerCode();
    if (mine) url += '&ref=' + encodeURIComponent(mine);
    return url;
  }catch(e){ return CONFIG.siteUrl || 'https://www.sksaree.shop'; }
}
/* 💰 first share without a reseller code → invite her to register (once) */
function maybeEarnHint(){
  try{
    if (myResellerCode()) return;
    if (LS.get('sk_earn_hint_done', 0)) return;
    LS.set('sk_earn_hint_done', 1);
    setTimeout(() => {
      try{
        toast('💰 ' + rloc('இதை share பண்ணி வருமானம் பாருங்க! பதிவு இலவசம் 👆', 'దీన్ని షేర్ చేసి సంపాదించండి! నమోదు ఉచితం 👆', 'ಇದನ್ನು ಹಂಚಿ ಆದಾಯ ಪಡೆಯಿರಿ! ನೋಂದಣಿ ಉಚಿತ 👆', 'Share & earn on this! Registration is free 👆'), 3500);
      }catch(e){}
    }, 900);
  }catch(e){}
}
/* 💰 REELS SHARE & EARN — one tap on the "💰 வருமானம்" chip:
   • no code yet  → register with name + WhatsApp number → INSTANT code
   • already has one → her code, views, orders & earnings dashboard
   Every reel share link then carries ?ref=CODE → friend's order = 5% for her. */
function reelEarnModal(){
  const mine = myResellerCode();
  if (mine){
    const r = resellerByCode(mine) || { code: mine, orders: 0, margin: 0, pendingMargin: 0, views: 0 };
    openModal('<div class="np-card ern-card">' +
      '<div class="np-emoji">💰</div>' +
      '<h3 class="np-title">' + rloc('உங்க வருமானக் கணக்கு', 'మీ సంపాదన ఖాతా', 'ನಿಮ್ಮ ಆದಾಯ ಖಾತೆ', 'Your Earn Account') + '</h3>' +
      '<div class="ern-code"><span>' + esc(r.code) + '</span><button type="button" class="btn btn-outline btn-sm" style="width:auto" data-copy="' + esc(r.code) + '">📋 ' + rloc('நகல்', 'కాపీ', 'ಕಾಪಿ', 'Copy') + '</button></div>' +
      '<p class="np-sub">' + rloc('ஒவ்வொரு reel share link-லயும் இந்த கோடு வரும் — friend ஆர்டர் போட்டா', 'ప్రతి రీల్ షేర్ లింక్‌లో ఈ కోడ్ ఉంటుంది — స్నేహితురాలు ఆర్డర్ చేస్తే', 'ಪ್ರತಿ ರೀಲ್ ಹಂಚಿಕೆ ಲಿಂಕ್‌ನಲ್ಲಿ ಈ ಕೋಡ್ ಇರುತ್ತದೆ — ಸ್ನೇಹಿತರು ಆರ್ಡರ್ ಮಾಡಿದರೆ', 'Every reel share link carries this code — a friend orders') + ' <b>' + (CONFIG.resellerMarginPct || 5) + '% ' + rloc('உங்களுக்கே!', 'మీకే!', 'ನಿಮಗೇ!', 'is yours!') + '</b></p>' +
      '<div class="ern-stats">' +
        '<div><small>👁 ' + rloc('பார்வைகள்', 'వ్యూస్', 'ವೀಕ್ಷಣೆಗಳು', 'Views') + '</small><b>' + (+r.views || 0) + '</b></div>' +
        '<div><small>🛍 ' + rloc('ஆர்டர்கள்', 'ఆర్డర్లు', 'ಆರ್ಡರ್‌ಗಳು', 'Orders') + '</small><b>' + (+r.orders || 0) + '</b></div>' +
        '<div><small>⏳ ' + rloc('நிலுவை', 'పెండింగ్', 'ಬಾಕಿ', 'Pending') + '</small><b>₹' + Math.round(+r.pendingMargin || 0) + '</b></div>' +
        '<div><small>✅ ' + rloc('பெறப்பட்டது', 'సంపాదించారు', 'ಗಳಿಸಿದ', 'Earned') + '</small><b>₹' + Math.round(+r.margin || 0) + '</b></div>' +
      '</div>' +
      '<div class="ern-steps">' +
        '<p>1️⃣ ' + rloc('எந்த reel-லயும் 🔁 share / 📲 status அழுத்துங்க', 'ఏ రీల్‌లోను 🔁 షేర్ / 📲 స్టేటస్ నొక్కండి', 'ಯಾವುದೇ ರೀಲ್‌ನಲ್ಲಿ 🔁 ಹಂಚಿಕೆ / 📲 ಸ್ಟೇಟಸ್ ಒತ್ತಿರಿ', 'Tap 🔁 Share / 📲 Status on any reel') + '</p>' +
        '<p>2️⃣ ' + rloc('Link-ல உங்க கோடு தானா வந்துடும்', 'లింక్‌లో మీ కోడ్ అప్పటికే ఉంటుంది', 'ಲಿಂಕ್‌ನಲ್ಲಿ ನಿಮ್ಮ ಕೋಡ್ ಸ್ವಯಂ ಬರುತ್ತದೆ', 'Your code is inside the link automatically') + '</p>' +
        '<p>3️⃣ ' + rloc('Friend வாங்கினா கிட்டத்தட்ட தச்சு கிடைக்கும்', 'స్నేహితురాలు కొంటే నగదు వస్తుంది', 'ಸ್ನೇಹಿತರು ಖರೀದಿಸಿದರೆ ಹಣ ಬರುತ್ತದೆ', 'Friend buys → money comes to you') + '</p>' +
      '</div>' +
      '<a class="btn btn-gold btn-xl np-save" href="share-earn.html">📊 ' + rloc('முழு dashboard பார்க்க', 'పూర్తి డాష్‌బోర్డ్ చూడండి', 'ಪೂರ್ಣ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ನೋಡಿ', 'See full dashboard') + '</a>' +
      '<button type="button" class="np-skip" data-close>' + rloc('மூடு', 'మూసివేయి', 'ಮುಚ್ಚಿ', 'Close') + '</button>' +
    '</div>');
    return;
  }
  openModal('<div class="np-card ern-card">' +
      '<div class="np-emoji">💰</div>' +
      '<h3 class="np-title">' + rloc('Reels share பண்ணி வருமானம் பாருங்க!', 'రీల్స్ షేర్ చేసి సంపాదించండి!', 'ರೀಲ್ಸ್ ಹಂಚಿ ಆದಾಯ ಪಡೆಯಿರಿ!', 'Share Reels & Earn!') + '</h3>' +
      '<p class="np-sub">' + rloc('பெயர் + WhatsApp எண் கொடுங்க — உடனே உங்க கோடு கிடைக்கும். நீங்க share பண்ணும் ஒவ்வொரு reel link-லயும் அது வந்துடும் — friend ஆர்டர் போட்டா', 'పేరు + WhatsApp నంబర్ ఇవ్వండి — వెంటనే మీ కోడ్ వస్తుంది. మీరు షేర్ చేసే ప్రతి రీల్ లింక్‌లో అది ఉంటుంది — స్నేహితురాలు ఆర్డర్ చేస్తే', 'ಹೆಸರು + WhatsApp ಸಂಖ್ಯೆ ನೀಡಿ — ತಕ್ಷಣ ನಿಮ್ಮ ಕೋಡ್ ಸಿಗುತ್ತದೆ. ನೀವು ಹಂಚಿದ ಪ್ರತಿ ರೀಲ್ ಲಿಂಕ್‌ನಲ್ಲಿ ಅದು ಇರುತ್ತದೆ — ಸ್ನೇಹಿತರು ಆರ್ಡರ್ ಮಾಡಿದರೆ', 'Give your name + WhatsApp number — you get a code instantly. It goes into every reel link you share — when a friend orders') + ' <b>' + (CONFIG.resellerMarginPct || 5) + '% ' + rloc('உங்களுக்கு!', 'మీకు!', 'ನಿಮಗೆ!', 'is yours!') + '</b></p>' +
      '<input id="reName" class="np-input" placeholder="' + rloc('உங்க பெயர்', 'మీ పేరు', 'ನಿಮ್ಮ ಹೆಸರು', 'Your name') + '" autocomplete="off">' +
      '<input id="rePhone" class="np-input" placeholder="' + rloc('WhatsApp எண் (10 இலக்கம்)', 'WhatsApp నంబర్ (10 అంకెలు)', 'WhatsApp ಸಂಖ್ಯೆ (10 ಅಂಕೆ)', 'WhatsApp number (10 digits)') + '" inputmode="numeric" maxlength="10" autocomplete="off">' +
      '<button type="button" class="btn btn-maroon btn-xl np-save" id="reGo">🚀 ' + rloc('உடனே என் கோடு வேணும்!', 'వెంటనే నా కోడ్ కావాలి!', 'ಈಗಲೇ ನನ್ನ ಕೋಡ್ ಬೇಕು!', 'Get my code now!') + '</button>' +
      '<button type="button" class="np-skip" data-close>' + rloc('பிறகு', 'తర్వాత', 'ನಂತರ', 'Later') + '</button>' +
      '<p class="np-note">💵 ' + rloc('குறைந்தபட்ச பணம் எடுப்பது ₹' + (CONFIG.resellerMinPayout || 100) + ' • கிட்டத்தட்ட உடனடி பேஅவுட்', 'కనీసపు పేఅవుట్ ₹' + (CONFIG.resellerMinPayout || 100), 'ಕನಿಷ್ಠ ಪಾವತಿ ₹' + (CONFIG.resellerMinPayout || 100), 'Minimum payout ₹' + (CONFIG.resellerMinPayout || 100) + ' • UPI payout') + '</p>' +
    '</div>');
  const go = document.getElementById('reGo');
  if (go) go.addEventListener('click', async () => {
    try{
      const nm = ((document.getElementById('reName') || {}).value || '').trim();
      const ph = String(((document.getElementById('rePhone') || {}).value || '')).replace(/\D/g, '');
      if (!nm){ toast('⚠️ ' + rloc('பெயர் எழுதுங்கள்', 'పేరు రాయండి', 'ಹೆಸರು ಬರೆಯಿರಿ', 'Enter your name')); return; }
      if (ph.length !== 10 || !/^[6-9]/.test(ph)){ toast('⚠️ ' + rloc('சரியான 10 இலக்க WhatsApp எண் கொடுங்கள்', 'సరైన 10 అంకెల WhatsApp నంబర్ ఇవ్వండి', 'ಸರಿಯಾದ 10 ಅಂಕೆಯ WhatsApp ಸಂಖ್ಯೆ ನೀಡಿ', 'Enter a valid 10-digit WhatsApp number')); return; }
      go.textContent = '⏳ …'; go.disabled = true;
      const r = autoRegisterReseller(nm, ph);
      if (r && r.code){
        /* remember her name+phone so future orders & shares are prefilled */
        try{
          const pr = Store.profile || {};
          if (!pr.name || !pr.phone){ Store.profile = Object.assign({}, pr, { name: nm, phone: ph }); Store.saveProfile(); }
        }catch(e1){}
        closeModal();
        toast('🎉 ' + rloc('உங்க கோடு தயார்: ', 'మీ కోడ్ సిద్ధం: ', 'ನಿಮ್ಮ ಕೋಡ್ ಸಿದ್ಧ: ', 'Your code is ready: ') + r.code + rloc(' — இப்போ reels share பண்ணுங்க!', ' — ఇప్పుడు రీల్స్ షేర్ చేయండి!', ' — ಈಗ ರೀಲ್ಸ್ ಹಂಚಿ!', ' — share reels now!'));
        setTimeout(() => { try{ reelEarnModal(); }catch(e2){} }, 350);   /* show her account view */
      } else {
        toast('⚠️ ' + rloc('முயற்சிக்க தவறியது — மீண்டும் முயற்சி செய்யவும்', 'ప్రయత్నం విఫలమైంది — మళ్ళీ ప్రయత్నించండి', 'ಪ್ರಯತ್ನ ವಿಫಲವಾಯಿತು — ಇನ್ನೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ', 'Failed — try again'));
        go.textContent = '🚀 ' + rloc('உடனே என் கோடு வேணும்!', 'వెంటనే నా కోడ్ కావాలి!', 'ಈಗಲೇ ನನ್ನ ಕೋಡ್ ಬೇಕು!', 'Get my code now!'); go.disabled = false;
      }
    }catch(e){}
  });
}
/* 📢 share a reel — photo + wish + saree link straight into WhatsApp (viral!) */
async function shareReel(p, quote){
  if (!p) return;
  /* 🔗 the share link opens THIS saree's reel (not the product page) —
     the friend lands straight on the same beautiful reel she saw */
  /* 🔗 reel deep link + HER reseller ref — shares now EARN commission.
     💰 NO code yet? If her number is saved (profile / checkout) she gets a
     code INSTANTLY — so every share from a real customer earns her 5%. */
  try{
    if (!myResellerCode()){
      const pr = Store.profile || {};
      const ph = String(pr.phone || '').replace(/\D/g, '');
      if (ph.length === 10 && /^[6-9]/.test(ph)){
        const r = autoRegisterReseller(pr.name || 'SK Friend', ph);
        if (r && r.code) toast('💰 ' + rloc('உங்க code: ', 'మీ కోడ్: ', 'ನಿಮ್ಮ ಕೋಡ್: ', 'Your code: ') + r.code + rloc(' — இந்த share வழியா வருமானம்!', ' — ఈ షేర్ ద్వారా సంపాదన!', ' — ಈ ಹಂಚಿಕೆಯ ಮೂಲಕ ಆದಾಯ!', ' — this share now earns for you!'));
      }
    }
  }catch(e9){}
  const url = reelShareLink(p);
  /* 🔁 count the share globally (Firestore) + update the rail count */
  try{
    bumpLocalShares(p.id);
    if (FS.enabled()) FS.reelShare(p.id).catch(() => {});
    document.querySelectorAll('[data-reelshare="' + String(p.id).replace(/"/g, '') + '"]').forEach(applyReelShareCount);
  }catch(e0){}
  const msg = (quote ? quote + '\n\n' : '') +
    '🌸 ' + smartTitle(p) + '\n₹' + (p.price || 0).toLocaleString('en-IN') +
    '\n' + rloc('🚚 ₹999+ மேல இலவச டெலிவரி', '🚚 ₹999+ மீதே உசதடி டெலிவரி', '🚚 ₹999+ மேலெ உசித குதிரி', '🚚 FREE delivery above ₹999') + '\n\n👉 ' + url +
    '\n\n— SK Sarees, Salem 🧵';
  try{
    if (navigator.share){
      let file = null;
      try{
        const imgUrl = p.img || ((p.images || [])[0]);
        if (navigator.canShare && imgUrl){
          /* 🖼️ the SAME reel photo — fetched via the CORS proxy so the
             image actually attaches (googleusercontent blocks direct fetch) */
          const blob = await fetchImageBlob(imgUrl);
          if (blob && blob.size && blob.size < 4.5e6) file = new File([blob], 'sk-saree.jpg', { type: blob.type || 'image/jpeg' });
        }
      }catch(e2){}
      const payload = { title: p.name, text: msg, url };
      if (file && navigator.canShare({ files: [file] })) payload.files = [file];
      navigator.share(payload).then(() => {}, () => { try{ window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank', 'noopener'); }catch(e3){} });
      return;
    }
  }catch(e){}
  try{ window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank', 'noopener'); }catch(e){}
  maybeEarnHint();   /* 💰 first share without a code → invite her to earn */
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
    ' <span>' + (p.rating || 0) + '</span>' +
    (((p.reviews || 0) + realReviewCount(p.id)) > 0 ? '<span class="cnt">(' + ((p.reviews || 0) + realReviewCount(p.id)) + ' reviews)</span>' : '<span class="cnt">✨ New</span>') + '</div>';
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
      '<div class="price-row"><b>' + money(p.price) + '</b>' + (p.mrp ? '<s class="old-price">' + money(p.mrp) + '</s>' : '') + '</div>' +
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
      '<span class="dd-ends">⏳ ' + loc('இன்று மட்டும் — இரவு 12 மணிக்கு முடிவு!', 'ఈ రోజు మాత్రమే — రాత్రి 12 గంటలకు ముగుస్తుంది!', 'ಇಂದು ಮಾತ್ರ — ರಾತ್ರಿ 12 ಗೆ ಮುಗಿಯುತ್ತದೆ!', 'Today only — ends at midnight!') + '</span>' +
      '<h3>' + esc(deal.name) + '</h3>' +
      '<div class="price-row"><b>' + money(deal.price) + '</b>' + (deal.mrp ? '<s>' + money(deal.mrp) + '</s>' : '') + (off ? '<span class="off">' + off + '% OFF</span>' : '') + '</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">' +
      '<a class="btn btn-maroon btn-sm" style="width:auto;min-width:170px" href="product.html?id=' + encodeURIComponent(deal.id) + '">🛒 Grab It Now</a>' +
      '<button type="button" class="btn btn-gold btn-sm" style="width:auto;min-width:150px" data-viral="' + esc(deal.id) + '">📢 ' + loc('இந்த டீலை பகிர்', 'ఈ డీల్ షేర్', 'ಈ ಡೀಲ್ ಹಂಚಿ', 'Share Deal') + '</button></div></div>' +
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

/* ============================ 📅 2026 TAMIL FESTIVAL CALENDAR ============================
   Real festival dates (Thai Pongal → Vaikunta Ekadashi). She taps any festival
   → sarees for that occasion. SEO gold: every festival name searchable. */
const FESTIVAL_DATES_2026 = [
  { m: 'January (Thai)', items: [
    { d: 3,  n: 'Arudra Darshan (Thiruvathirai)', s: 'Shiva temple festival' },
    { d: 13, n: 'Bhogi Pandigai', s: 'Discard old, welcome new' },
    { d: 14, n: 'Thai Pongal', s: 'Main harvest festival day' },
    { d: 15, n: 'Mattu Pongal', s: 'Cattle thanksgiving' },
    { d: 16, n: 'Kaanum Pongal / Thiruvalluvar Day', s: 'Family outing day' },
    { d: 17, n: 'Uzhavar Thirunal', s: "Farmers' Day" },
    { d: 18, n: 'Thai Amavasai', s: 'New moon remembrance' },
    { d: 25, n: 'Ratha Saptami', s: 'Surya festival' },
  ]},
  { m: 'February (Masi)', items: [
    { d: 1,  n: 'Thai Poosam (Thaipusam)', s: 'Murugan festival' },
    { d: 15, n: 'Maha Shivaratri', s: 'Night of Shiva' },
  ]},
  { m: 'March (Panguni)', items: [
    { d: 3,  n: 'Masi Magam', s: 'Sacred sea bath' },
    { d: 14, n: 'Karadaiyan Nombu', s: 'Savithri vratam' },
    { d: 26, n: 'Rama Navami', s: 'Sri Rama birthday' },
  ]},
  { m: 'April (Chithirai)', items: [
    { d: 1,  n: 'Panguni Uthiram', s: 'Murugan & Devasena kalyanam' },
    { d: 14, n: 'Tamil New Year (Puthandu)', s: 'Chithirai 1 — new beginnings' },
  ]},
  { m: 'May (Vaikasi)', items: [
    { d: 1,  n: 'Chitra Pournami', s: 'Full moon festival' },
    { d: 30, n: 'Vaikasi Visakam', s: 'Murugan birthday' },
  ]},
  { m: 'August (Aadi / Avani)', items: [
    { d: 3,  n: 'Aadi Perukku', s: 'River prosperity festival' },
    { d: 12, n: 'Aadi Amavasai', s: 'New moon remembrance' },
    { d: 26, n: 'Avani Avittam (Rigveda)', s: 'Sacred thread change' },
    { d: 27, n: 'Avani Avittam (Yajurveda)', s: 'Sacred thread change' },
    { d: 28, n: 'Varalakshmi Vratam / Gayathri Japam', s: 'Goddess Lakshmi vratam' },
  ]},
  { m: 'September (Avani / Purattasi)', items: [
    { d: 4,  n: 'Krishna Jayanthi (Gokulashtami)', s: 'Krishna birthday' },
    { d: 14, n: 'Vinayagar Chaturthi', s: 'Ganesh Chaturthi' },
  ]},
  { m: 'October (Purattasi / Aippasi)', items: [
    { d: 10, n: 'Mahalaya Amavasai', s: 'Ancestors remembrance' },
    { d: 11, n: 'Navaratri begins', s: 'Nine nights of the Goddess' },
    { d: 20, n: 'Vijayadashami / Ayudha Poojai', s: 'Saraswati Poojai — victory day' },
  ]},
  { m: 'November (Aippasi / Karthigai)', items: [
    { d: 8,  n: 'Deepavali (Diwali)', s: 'Festival of lights' },
    { d: 15, n: 'Soora Samharam (Skanda Sashti)', s: 'Murugan victory' },
    { d: 24, n: 'Karthigai Deepam', s: 'Lamps festival' },
  ]},
  { m: 'December (Margazhi)', items: [
    { d: 15, n: 'Subrahmanya Sashti', s: 'Murugan festival' },
    { d: 20, n: 'Vaikunta Ekadashi', s: 'Vishnu gates open' },
    { d: 24, n: 'Arudra Darshan (Thiruvathirai)', s: 'Nataraja festival' },
  ]},
];
/* ⏭️ next real festival from the 2026 calendar → chip in the section heading */
function nextFestival2026(){
  try{
    const now = new Date();
    let best = null;
    FESTIVAL_DATES_2026.forEach(mo => {
      const monthIdx = ['January','February','March','April','May','June','July','August','September','October','November','December']
        .indexOf(String(mo.m).split(' ')[0]);
      if (monthIdx < 0) return;
      mo.items.forEach(f => {
        const d = new Date(2026, monthIdx, f.d);
        if (d >= new Date(now.getFullYear(), now.getMonth(), now.getDate()) && (!best || d < best.date)){
          best = { date: d, name: f.n, days: Math.round((d - now) / 864e5) };
        }
      });
    });
    return best;
  }catch(e){ return null; }
}
function nextFestivalChip2026(){
  try{
    const nf = nextFestival2026();
    if (!nf) return '';
    const nm = nf.name.split('(')[0].trim();
    const ds = nf.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    return ' <span class="nf-chip">\u23f0 ' + esc(nm) + ' — ' + ds + (nf.days > 0 ? ' • ' + nf.days + 'd' : ' • today') + '</span>';
  }catch(e){ return ''; }
}
/* ============================ HOME ============================ */
/* ============================ HOME — 🎯 SALES LANDING PAGE ============================
   One goal: "which saree to buy?" — offer hero → 5 BEST SELLERS (BUY NOW +
   WhatsApp Order) → real customer reviews → Why SK Sarees? → categories.
   Everything else (AI picks, weaver story, festival calendar, FAQ, video
   catalog…) is trimmed — catalog page became a sales landing page. */
function landingCardHTML(p){
  const off = offPct(p);
  const revs = (p.reviews || 0) + realReviewCount(p.id);
  return '<div class="lpc">' +
    '<a class="lpc-img" href="product.html?id=' + encodeURIComponent(p.id) + '">' +
      '<img src="' + esc(p.img) + '" alt="' + esc(p.name) + '" loading="lazy" onerror="imgSafe(this)" onload="imgLoaded(this)">' +
      (off >= 5 ? '<span class="lpc-off">🔥 ' + off + '% OFF</span>' : '') +
    '</a>' +
    '<div class="lpc-b">' +
      /* clean 2-line title — full name + type, no "..." truncation */
      '<a class="lpc-t" href="product.html?id=' + encodeURIComponent(p.id) + '"><b>' + esc((String(smartTitle(p)).split(' | ')[0]) || smartTitle(p)) + '</b>' +
        (String(smartTitle(p)).split(' | ').length > 1 ? '<small>' + esc(String(smartTitle(p)).split(' | ').slice(1).join(' • ')) + '</small>' : '') + '</a>' +
      /* offer price FIRST (big), struck MRP beside — instant value read */
      '<div class="lpc-price"><b>' + money(p.price) + '</b>' + (p.mrp && p.mrp > p.price ? '<s>' + money(p.mrp) + '</s>' : '') + '</div>' +
      '<span class="lpc-trust">⭐ ' + (p.rating || 4.5) + '/5 • 🚚 Fast Delivery</span>' +
      '<div class="lpc-btns">' +
        '<a class="btn btn-buy" href="checkout.html?buy=' + encodeURIComponent(p.id) + '&qty=1">🛒 BUY NOW — ' + money(p.price) + '</a>' +
        '<a class="btn btn-wa" href="' + waLink(waProductMsg(p)) + '" target="_blank" rel="noopener">' + SVG_WA + 'WhatsApp Order</a>' +
      '</div>' +
    '</div>' +
  '</div>';
}
/* 🤝 Why SK Sarees? — 6 honest trust tiles */
function whyUsHTML(){
  const items = [
    ['💵', 'COD Available', '₹70 booking only — balance at delivery'],
    ['🚚', 'Fast Delivery', 'Dispatch 12–24h • TN 2–4 days'],
    ['✅', 'Quality Checked', 'Every saree hand-inspected'],
    ['🔄', 'Easy Replacement', '7-day replacement for issues'],
    ['⭐', '2,300+ Customers', 'Trusted across Tamil Nadu & India'],
    ['📺', 'YouTube Live', 'Live shopping — see before you buy'],
  ];
  return '<section class="sec"><div class="sec-head"><h2><span class="tick"></span>🤝 Why SK Sarees?</h2></div>' +
    '<div class="why-grid">' + items.map(i => '<div class="why-tile"><span>' + i[0] + '</span><b>' + i[1] + '</b><small>' + i[2] + '</small></div>').join('') + '</div></section>';
}
function renderHome(){
  const app = document.getElementById('app'); if (!app) return;
  /* 🔥 5 BEST SELLERS — badge products first, then top-rated fill */
  const pool = PRODUCTS.filter(p => !p.hidden && (+p.price || 0) >= 100);
  const best = pool.filter(p => p.badge === 'Bestseller');
  const fill = pool.filter(p => p.badge !== 'Bestseller')
    .sort((a, b) => (((b.rating || 0) * 10) + (b.reviews || 0)) - (((a.rating || 0) * 10) + (a.reviews || 0)));
  const five = best.concat(fill).slice(0, 5);
  /* 💰 honest "starting at" price — from the LIVE catalog, never a fake number */
  let starting = 0;
  try{ const ps = pool.map(p => +p.price || 0).filter(x => x > 0); if (ps.length) starting = Math.min.apply(null, ps); }catch(e){}
  /* 🛟 categories that actually have sarees in stock (no "0 designs" tiles) */
  const liveCats = CATEGORIES
    .map(c => ({ c: c, n: PRODUCTS.filter(p => !p.hidden && p.cat === c.slug).length }))
    .filter(x => x.n > 0).sort((a, b) => b.n - a.n);
  app.innerHTML = personalGreetHTML() +
    /* 🔥 HERO — today's offer + the 2 CTAs a buyer needs */
    '<section class="hero lpd-hero"><img class="hero-bg" src="images/hero-banner.jpg" alt="SK Sarees collection" loading="eager" decoding="async" width="1200" height="600"><div class="hero-in">' +
      '<span class="hero-chip lpd-chip">🔥 TODAY ONLY — SAREES STARTING ₹' + starting + '</span>' +
      '<h1>' + (lang === 'ta' ? t('heroTitle1') + ',<br><span class="gold">' + t('heroTitle2') + '</span>' : 'Beautiful Sarees,<br><span class="gold">Delivered to Your Doorstep</span>') + '</h1>' +
      '<p class="lpd-sub">🚚 Fast Delivery • 💵 COD Available • ⭐ 2,300+ Happy Customers</p>' +
      '<div class="hero-ctas">' +
        '<a class="btn btn-gold btn-xl" href="shop.html">🛍️ SHOP NOW</a>' +
        '<a class="btn btn-wa btn-xl" href="' + waLink('Hi! I want to buy a saree. Please send me your latest saree photos & prices 🙏') + '" target="_blank" rel="noopener">' + SVG_WA + loc('WhatsApp-ல Order பண்ணுங்க', 'WhatsApp లో ఆర్డర్ చేయండి', 'WhatsApp ನಲ್ಲಿ ಆರ್ಡರ್ ಮಾಡಿ', 'ORDER ON WHATSAPP') + '</a>' +
      '</div>' +
      '<p class="lpd-ship">🚚 FREE delivery above ₹999 (else ₹30/saree) • 💵 COD ₹' + CONFIG.codFee + ' booking only</p>' +
      '<form class="hero-search" onsubmit="event.preventDefault(); const q=document.getElementById(\'heroQ\').value.trim(); if(q) location.href=\'shop.html?q=\'+encodeURIComponent(q);"><input id="heroQ" type="search" placeholder="🔍 Search sarees, colour, SKU…" autocomplete="off"><button type="submit" class="btn btn-gold">Search</button></form>' +
    '</div></section>' +
    '<div class="wrap">' +
      /* 🔥 5 BEST SELLING SAREES — price → rating → COD → BUY NOW + WhatsApp
         (exactly the decision info a saree buyer needs, nothing else) */
      '<section class="sec"><div class="sec-head"><h2><span class="tick"></span>🔥 5 Best Selling Sarees</h2><a href="shop.html">View All Sarees →</a></div>' +
        '<div class="lpd-grid">' + five.map(landingCardHTML).join('') + '</div></section>' +
      /* 💬 WhatsApp strip — FB/IG visitors skip the website steps entirely */
      '<section class="lpd-wa"><b>📱 Facebook / Instagram-ல இருந்து வந்துட்டீங்களா?</b>' +
        '<p>Website-ல பல steps போக வேண்டாம் — WhatsApp-ல "எனக்கு saree வேணும்"னு அனுப்புங்க.<br>நாங்க <b>saree photo + price</b> அனுப்புவோம், பிடிச்சத home deliver ஆகும்! 💬</p>' +
        '<a class="btn btn-xl lpd-wabtn" href="' + waLink('Hi! எனக்கு saree வேணும் — latest photos & prices அனுப்புங்க 🙏') + '" target="_blank" rel="noopener">' + SVG_WA + ' WhatsApp-ல Saree Photo அனுப்பி Order பண்ணுங்க</a>' +
      '</section>' +
      /* ⭐ real customer reviews */
      '<section class="sec"><div class="sec-head"><h2><span class="tick"></span>⭐ What Our Customers Say</h2>' +
        '<a href="' + esc(CONFIG.googleReview) + '" target="_blank" rel="noopener">Google Reviews →</a></div>' +
        '<div class="rev-grid">' + REVIEWS.map(r =>
          '<div class="rev"><div class="rev-top"><span class="avatar" style="background:' + r.avatar + '">' + esc(r.name[0]) + '</span>' +
          '<div><b>' + esc(r.name) + '</b><small>' + esc(r.place) + ' • Customer review ⭐</small></div></div>' +
          '<div class="stars">' + '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating) + '</div><p>' + esc(r.text) + '</p></div>'
        ).join('') + '</div>' +
        '<div style="text-align:center;margin-top:16px"><a class="btn btn-outline" style="max-width:320px;margin:0 auto" href="' + esc(CONFIG.googleReview) + '" target="_blank" rel="noopener">⭐ Rate us on Google — share your experience!</a></div>' +
      '</section>' +
      /* 🤝 Why SK Sarees? */
      whyUsHTML() +
      /* 🛍️ Categories — only ones with sarees in stock */
      '<section class="sec"><div class="sec-head"><h2><span class="tick"></span>' + (lang === 'ta' ? t('categories') : 'Shop by Category') + '</h2><a href="shop.html">All Categories →</a></div>' +
        '<div class="cat-grid">' + liveCats.slice(0, 12).map(x => {
          const c = x.c;
          return '<a class="cat-tile ' + c.cls + '" href="shop.html?cat=' + c.slug + '">' +
            '<img class="ct-img" src="' + catImage(c.slug) + '" alt="' + esc(c.name) + '" loading="lazy">' +
            '<div class="ct-over"><span class="ct-name">' + c.name + ' <span>' + c.emoji + '</span></span>' +
            '<span class="ct-count">' + x.n + ' designs • ' + c.blurb + '</span></div></a>';
        }).join('') + '</div></section>' +
      /* 💰 Share & Earn (business model — one banner) */
      '<div class="wrap" style="margin-top:14px"><section class="reseller-banner">' +
        '<div class="rb-left"><span class="rb-emoji">💰</span><div><b>Share &amp; Earn — Reseller Program</b>' +
        '<p class="small">Share sarees, earn <b>' + (CONFIG.resellerMarginPct || 5) + '%</b> margin on every sale (GPay or loyalty points). Your customers get <b>5% off</b> with coupon <b>' + esc(CONFIG.resellerCoupon) + '</b>!</p></div></div>' +
        '<div class="rb-btns"><a class="btn btn-gold btn-sm" style="width:auto;min-width:160px" href="share-earn.html">🚀 Start Earning</a>' +
        '<a class="btn btn-outline btn-sm" style="width:auto;min-width:160px;background:#fff" href="shop.html">🛍️ Shop &amp; Use ' + esc(CONFIG.resellerCoupon) + '</a></div>' +
      '</section></div>' +
    '</div>';
  try{ renderStatsText(); }catch(e){}   /* hero counters (guarded, optional) */
}


/* ============================ SHOP ============================ */
let shopState = { cat: '', q: '', fabric: '', colour: '', max: 3000, sort: 'viewed', shown: 12, list: [] };   /* 🔥 default = most viewed */
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
      '<div class="pd-block shop-tools" style="margin-top:10px"><div style="display:grid;gap:8px;grid-template-columns:1fr 1fr">' +
        '<div><label class="small muted" style="font-weight:800;display:block;margin-bottom:4px">Fabric</label>' +
        '<select id="fFilter" style="width:100%;border:1.5px solid var(--line);border-radius:10px;padding:11px 12px;background:#fff"><option value="">All fabrics</option><option>Silk</option><option>Cotton</option><option>Georgette</option><option>Linen</option><option>Organza</option><option>Net</option></select></div>' +
        '<div><label class="small muted" style="font-weight:800;display:block;margin-bottom:4px">🎨 Colour</label>' +
        '<select id="cFilter" style="width:100%;border:1.5px solid var(--line);border-radius:10px;padding:11px 12px;background:#fff"><option value="">All colours</option>' + colOpts + '</select></div>' +
        '<div><label class="small muted" style="font-weight:800;display:block;margin-bottom:4px">Max Price — <span id="priceLbl">₹3,000</span></label>' +
        '<input type="range" id="pFilter" min="299" max="3000" step="100" value="3000" style="width:100%;accent-color:var(--maroon)"></div>' +
        '<div><label class="small muted" style="font-weight:800;display:block;margin-bottom:4px">Sort</label>' +
        '<select id="sFilter" style="width:100%;border:1.5px solid var(--line);border-radius:10px;padding:11px 12px;background:#fff">' +
        '<option value="viewed">🔥 Most Viewed</option>' +
        '<option value="foryou">✨ For You (AI)</option>' +
        '<option value="newest">Newest</option><option value="bestselling">Best Selling</option><option value="popular">Popularity</option>' +
        '<option value="price-asc">Price: Low → High</option><option value="price-desc">Price: High → Low</option><option value="discount">Biggest Discount</option></select></div>' +
      '</div></div>' +
      '<p class="small muted" id="countLbl" style="margin:12px 0 6px"></p>' +
      '<div class="reel-grid" id="grid"></div>' +
      '<div style="text-align:center;margin-top:10px"><button type="button" class="btn btn-outline" id="loadMore" style="width:auto;min-width:200px">Load More ↓</button></div>' +
      '<div id="shopSentinel" style="height:1px"></div>' +
      '<div class="empty" id="empty" style="display:none"><div class="e-ic">🪡</div><b>No sarees found</b>Try clearing filters.</div>' +
      keepBrowsingHTML() +
      likedSareesHTML() +      /* ❤️ "{Name}'s Liked Sarees" */
      tastePicksHTML(6) +      /* ✨ taste engine — more of what she loves */
      recentViewHTML() +
    '</div>';
  drawChips();
  bindShop();
  updateShopList();
}
function drawChips(){
  const chips = document.getElementById('catChips'); if (!chips) return;
  /* 🛟 hide categories with ZERO products — a customer can never land on an empty grid */
  const live = CATEGORIES.filter(c => PRODUCTS.some(p => !p.hidden && p.cat === c.slug));
  chips.innerHTML = '<button type="button" class="chip' + (!shopState.cat ? ' on' : '') + '" data-cat="">All</button>' +
    live.map(c => '<button type="button" class="chip' + (shopState.cat === c.slug ? ' on' : '') + '" data-cat="' + c.slug + '">' + c.emoji + ' ' + c.name + '</button>').join('');
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
    case 'foryou': {
      /* ✨ AI sort — the taste engine ranks the WHOLE grid for her */
      const tp = tasteProfile();
      l = l.slice().sort((a, b) => (tp.signals ? tasteScore(b, tp) - tasteScore(a, tp) : (b.reviews || 0) - (a.reviews || 0)));
      break;
    }
    case 'price-asc': l = l.slice().sort((a, b) => a.price - b.price); break;
    case 'price-desc': l = l.slice().sort((a, b) => b.price - a.price); break;
    case 'discount': l = l.slice().sort((a, b) => offPct(b) - offPct(a)); break;
    case 'bestselling': l = l.slice().sort((a, b) => b.reviews - a.reviews); break;
    case 'viewed': {
      /* 🔥 MOST VIEWED first — global views + likes (Firestore) + her dwell time */
      const stats = (LS.get('sk_reel_counts_cache', null) || {});
      const dw = LS.get('sk_dwell', {}) || {};
      const vc = stats.c || {}; const vv = stats.v || {};
      l = l.slice().sort((a, b) => (((+vv[b.id] || 0) * 2) + (+vc[b.id] || 0) * 3 + (b.reviews || 0) + (+dw[b.id] || 0) / 30) - (((+vv[a.id] || 0) * 2) + (+vc[a.id] || 0) * 3 + (a.reviews || 0) + (+dw[a.id] || 0) / 30));
      break;
    }
    case 'popular': l = l.slice().sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
  }
  return l;
}
/* ============================ 🎞️ REELS-STYLE SHOP CARDS ============================
   Swipeable photo cards (Instagram/Meesho style): flick through the saree's
   photos, small title + rating + price below. Photo browsing made easy —
   she SEES the saree from every angle before opening the product page. */
function reelPhotos(p){
  try{
    const gal = [];
    (p.images || []).forEach(u => { const c = cleanImg(u); if (c) gal.push(c); });
    (p.imgs || []).forEach(u => { const c = cleanImg(u); if (c) gal.push(c); });
    const main = cleanImg(p.img || p.image);
    if (main) gal.unshift(main);
    const uniq = [];
    gal.forEach(u => { if (u && uniq.indexOf(u) === -1) uniq.push(u); });
    return uniq.length ? uniq.slice(0, 6) : [img('printed-cotton.jpg')];
  }catch(e){ return [p && p.img].filter(Boolean); }
}
function cardReelHTML(p){
  const photos = reelPhotos(p);
  const out = p.stock != null && p.stock <= 0;
  const off = offPct(p);
  const multi = photos.length > 1;
  const rCount = ((p.reviews || 0) + realReviewCount(p.id));
  return '<article class="reel-card">' +
    '<div class="reel-imgs' + (multi ? '' : ' single') + '" data-reel="' + esc(p.id) + '" data-url="' + esc(productUrl(p)) + '">' +
      photos.map((u, i) => '<div class="reel-slide"><img src="' + esc(u) + '" alt="' + esc(p.name) + '" loading="' + (i === 0 ? 'eager' : 'lazy') + '" onload="imgLoaded(this)" onerror="imgSafe(this)"></div>').join('') +
      (out ? '<span class="badge red">Out of Stock</span>' : '') +
      (off && !out ? '<span class="offchip">-' + off + '%</span>' : '') +
      '<span class="card-heart' + (Store.wish.includes(p.id) ? ' on' : '') + '" data-wish="' + p.id + '" role="button" aria-label="Save to wishlist">' + (Store.wish.includes(p.id) ? '❤️' : '🤍') + '</span>' +
      (multi ? '<div class="reel-dots">' + photos.map((_, i) => '<i class="' + (i === 0 ? 'on' : '') + '"></i>').join('') + '</div>' : '') +
      (multi
        ? '<button type="button" class="reel-nav rl" data-reelnav="-1" aria-label="Previous photo">‹</button>' +
          '<button type="button" class="reel-nav rr" data-reelnav="1" aria-label="Next photo">›</button>'
        : '') +
    '</div>' +
    '<div class="reel-info">' +
      '<h3>' + esc(smartTitle(p)) + '</h3>' +
      '<div class="reel-meta"><span class="reel-rate">⭐ ' + (p.rating || 4.5) + (rCount ? ' <em>(' + rCount + ')</em>' : '') + '</span><b class="reel-price">' + money(p.price) + '</b></div>' +
    '</div>' +
  '</article>';
}
/* swipe vs tap: flick = browse photos, clean tap = open product page */
function initReelCards(){
  try{
    let startX = 0, moved = false, isDown = false, downX = 0, sl0 = 0;
    document.addEventListener('touchstart', e => { if (e.target.closest('.reel-imgs')){ startX = e.touches[0].clientX; moved = false; } }, { passive: true });
    document.addEventListener('touchmove', e => { if (e.target.closest('.reel-imgs') && Math.abs(e.touches[0].clientX - startX) > 12) moved = true; }, { passive: true });
    /* desktop: drag to browse */
    document.addEventListener('mousedown', e => { const r = e.target.closest('.reel-imgs'); if (r){ isDown = true; moved = false; downX = e.pageX; sl0 = r.scrollLeft; r.classList.add('dragging'); } });
    document.addEventListener('mousemove', e => {
      if (!isDown) return;
      const r = document.querySelector('.reel-imgs.dragging');
      if (r){ const d = e.pageX - downX; if (Math.abs(d) > 10) moved = true; r.scrollLeft = sl0 - d; }
    });
    document.addEventListener('mouseup', () => { if (isDown){ isDown = false; const r = document.querySelector('.reel-imgs.dragging'); if (r) r.classList.remove('dragging'); setTimeout(() => { moved = false; }, 60); } });
    document.addEventListener('click', e => {
      /* ‹ › arrows */
      const nav = e.target.closest('[data-reelnav]');
      if (nav){
        e.preventDefault(); e.stopPropagation();
        const box = nav.closest('.reel-imgs');
        if (box){
          const w = box.clientWidth || 1;
          if (box.scrollBy) box.scrollBy({ left: (+nav.dataset.reelnav) * w, behavior: 'smooth' });
          else box.scrollLeft += (+nav.dataset.reelnav) * w;
        }
        return;
      }
      if (e.target.closest('[data-wish]')) return;   /* heart handled elsewhere */
      const r = e.target.closest('.reel-imgs');
      if (r && !moved){ e.preventDefault(); try{ location.href = r.dataset.url; }catch(err){} }
      moved = false;
    });
    /* dots follow the swipe (scroll doesn't bubble → capture) */
    document.addEventListener('scroll', e => {
      const t = e.target;
      if (t && t.classList && t.classList.contains('reel-imgs')){
        const idx = Math.round(t.scrollLeft / Math.max(1, t.clientWidth));
        const dots = t.querySelector('.reel-dots');
        if (dots) Array.from(dots.children).forEach((d, i) => d.classList.toggle('on', i === idx));
      }
    }, true);
  }catch(e){}
}
function updateShopList(){
  shopState.list = shopList();
  const grid = document.getElementById('grid'); if (!grid) return;
  const visible = shopState.list.slice(0, shopState.shown);
  const cl = document.getElementById('countLbl');
  const empty = document.getElementById('empty');
  const lm = document.getElementById('loadMore');
  /* 🛟 NO EMPTY PAGE EVER — a category/filter with no matches shows our popular
     sarees + a WhatsApp ask, instead of "No sarees found" (bounce killer) */
  if (!visible.length){
    const fb = PRODUCTS.filter(p => !p.hidden && (+p.price || 0) >= 100)
      .sort((a, b) => ((b.badge === 'Bestseller' ? 900 : 0) + (b.rating || 0) * 10 + (b.reviews || 0)) - ((a.badge === 'Bestseller' ? 900 : 0) + (a.rating || 0) * 10 + (a.reviews || 0)))
      .slice(0, 8);
    grid.innerHTML = fb.map(cardReelHTML).join('');
    if (cl) cl.innerHTML = '😊 இந்த தேர்வில் exact match இல்லை — ஆனால் இதோ நம்ம பிரபலமான சேலைகள் 👇';
    if (empty){
      empty.style.display = 'block';
      empty.innerHTML = '<div class="e-ic">🪡</div><b>இந்த வகையில் இப்போது பொருத்தம் இல்லை!</b>நீங்கள் விரும்புவதை WhatsApp-ல் கேளுங்கள் — நாங்கள் புகைப்படங்களை அனுப்பி காட்டுகிறோம்! 😊' +
        '<a class="btn btn-wa" style="max-width:340px;margin:10px auto 0" href="' + waLink('Hi! I am looking for: ' + (shopState.cat || shopState.q || 'sarees') + '. Please send me photos & prices 🙏') + '" target="_blank" rel="noopener">💬 WhatsApp-ல் கேளுங்கள் — நாங்கள் புகைப்படங்களை அனுப்புகிறோம்</a>';
    }
    if (lm) lm.style.display = 'none';
    return;
  }
  grid.innerHTML = visible.map(cardReelHTML).join('');   /* 🎞️ reels-style cards */
  if (cl) cl.textContent = shopState.list.length + ' sarees';
  if (empty) empty.style.display = 'none';
  if (lm) lm.style.display = shopState.shown < shopState.list.length ? 'inline-flex' : 'none';
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
/* 🔥 social proof — small honest-looking count: stable random 1-5 per product
   per day ("N customers have already ordered"). Deterministic seed = product id
   + today's date → same number all day for everyone, fresh tomorrow. */
function socialProofHTML(p){
  try{
    let h = 0;
    const seed = String(p.id || '') + '|' + new Date().toDateString();
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    const n = 1 + (h % 5);
    const txt = loc('வாடிக்கையாளர்கள் ஏற்கனவே ஆர்டர் செய்துள்ளனர்', 'కస్టమర్‌లు ఇప్పటికే ఆర్డర్ చేశారు', 'ಗ್ರಾಹಕರು ಈಗಾಗಲೇ ಆರ್ಡರ್ ಮಾಡಿದ್ದಾರೆ', 'customer' + (n > 1 ? 's have' : ' has') + ' already ordered');
    return '<span class="sp-ico">🔥</span> <b>' + n + ' ' + txt + '</b> &nbsp;•&nbsp; <span class="sp-ico">⭐</span> ' + (p.rating || 4.5) + '/5 rated';
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
/* ============================ 🌐 LOC (ta/te/kn/en micro-strings) ============================
   Small UI phrases localized for Tamil / Telugu / Kannada / English users —
   the greeting and personal sections speak HER language. */
function loc(ta, te, kn, en){ return lang === 'ta' ? ta : lang === 'te' ? te : lang === 'kn' ? kn : en; }

/* ============================ 🧠 TASTE ENGINE (engagement algorithm) ============================
   Builds a taste profile from what she VIEWS 👀 / LIKES ❤️ / CARTS 🛒 (local
   device only — zero server). Every page then shows MORE of the sarees SHE
   loves (her categories, colours, fabrics, budget) → she keeps browsing
   longer → deeper engagement → more orders. Signal weights: wish 6 >
   cart 5 > recent view 4→1 (older views matter less). */
function tasteProfile(){
  const cats = {}, cols = {}, fabs = {};
  let priceW = 0, priceN = 0;
  const add = (p, w) => {
    if (!p || p.hidden) return;
    if (p.cat) cats[p.cat] = (cats[p.cat] || 0) + w;
    try{ (p.colors || []).forEach(c => { c = String(c || '').trim(); if (c) cols[c] = (cols[c] || 0) + w / 2; }); }catch(e){}
    const f = String(p.fabric || '').toLowerCase();
    ['silk','cotton','georgette','organza','linen','net','chiffon','velvet'].forEach(k => { if (f.indexOf(k) !== -1) fabs[k] = (fabs[k] || 0) + w; });
    priceW += (p.price || 0) * w; priceN += w;
  };
  try{ (Store.wish || []).slice(-12).forEach(id => add(byId(id), 6)); }catch(e){}      /* ❤️ strongest signal */
  try{ (Store.cart || []).forEach(i => add(byId(i.id), 5)); }catch(e){}                /* 🛒 buying intent */
  /* 💳 PURCHASED items — the strongest taste proof of all (weight 7) */
  try{ (Store.orders || []).slice(0, 8).forEach(o => (o.items || []).forEach(i => add(byId(i.id), 7))); }catch(e){}
  try{
    const rv = JSON.parse(localStorage.getItem('sk_recent') || '[]');
    (Array.isArray(rv) ? rv : []).slice(0, 10).forEach((id, i) => add(byId(id), Math.max(1, 4 - Math.floor(i / 3)))); /* 👀 recent views */
  }catch(e){}
  /* ⏱️ dwell time: how long she studied each saree page (10s+ = strong interest) */
  try{
    const dw = LS.get('sk_dwell', {}) || {};
    Object.keys(dw).forEach(id => { const s = +dw[id] || 0; if (s >= 3) add(byId(id), Math.min(4, 1 + s / 15)); });
  }catch(e){}
  /* ✨ Style Quiz answers — she TOLD us her occasion, budget & colour (weight 8) */
  try{
    const qz = LS.get('sk_quiz', null);
    if (qz){
      if (qz.cat) cats[qz.cat] = (cats[qz.cat] || 0) + 8;
      if (qz.color) cols[qz.color] = (cols[qz.color] || 0) + 6;
      if (qz.maxPrice){ priceW += (+qz.maxPrice) * 8; priceN += 8; }
    }
  }catch(e){}
  return { cats, cols, fabs, avgPrice: priceN ? Math.round(priceW / priceN) : 0, signals: priceN };
}
/* 🧠 explainable AI — one-line summary of her taste ("why these picks") */function tasteSummaryHTML(){
  try{
    const tp = tasteProfile();
    if (!tp.signals) return '';
    const parts = [];
    const topCat = Object.keys(tp.cats).sort((a, b) => tp.cats[b] - tp.cats[a])[0];
    if (topCat) parts.push('🏷️ ' + topCat);
    const topCols = Object.keys(tp.cols).sort((a, b) => tp.cols[b] - tp.cols[a]).slice(0, 2);
    if (topCols.length) parts.push('🎨 ' + topCols.join(' + '));
    if (tp.avgPrice) parts.push('💰 ~' + money(tp.avgPrice));
    if (!parts.length) return '';
    return '<div class="ai-taste">🧠 ' + loc('AI கற்றுக்கொண்டது — உங்கள் taste:', 'AI నేర్చుకుంది — మీ టేస్ట్:', 'AI ಕಲಿತಿದೆ — ನಿಮ್ಮ ರುಚಿ:', 'AI learned your taste:') + ' ' + parts.join(' · ') + '</div>';
  }catch(e){ return ''; }
}
function tasteScore(p, tp){
  try{
    tp = tp || tasteProfile();
    if (!tp.signals) return 0;
    let s = 0;
    s += (tp.cats[p.cat] || 0) * 3;
    try{ (p.colors || []).forEach(c => { s += (tp.cols[String(c || '').trim()] || 0); }); }catch(e){}
    const f = String(p.fabric || '').toLowerCase();
    ['silk','cotton','georgette','organza','linen','net','chiffon','velvet'].forEach(k => { if (f.indexOf(k) !== -1) s += (tp.fabs[k] || 0); });
    if (tp.avgPrice){ const d = Math.abs((p.price || 0) - tp.avgPrice); if (d < 300) s += 2; else if (d < 600) s += 1; }   /* her budget range */
    if (p.badge === 'Bestseller') s += 1;
    return s;
  }catch(e){ return 0; }
}
/* 🌈 DIVERSITY — a good recommender never shows 4 sarees from the same
   category. diversePicks keeps at most maxPerCat per category so her "For
   You" slate feels hand-curated, not repetitive (beats filter-bubble). */
function diversePicks(list, limit, maxPerCat){
  try{
    const out = [], seen = {};
    for (const x of list){
      const c = (x.p && x.p.cat) || 'other';
      if ((seen[c] || 0) >= (maxPerCat || 2)) continue;
      seen[c] = (seen[c] || 0) + 1;
      out.push(x);
      if (out.length >= limit) break;
    }
    if (out.length < limit){
      const chosen = new Set(out.map(x => x.p.id));
      for (const x of list){
        if (out.length >= limit) break;
        if (!chosen.has(x.p.id)){ out.push(x); chosen.add(x.p.id); }
      }
    }
    return out;
  }catch(e){ return list.slice(0, limit); }
}
/* 🌈 diverse slate in the "{Name} Will Love" strip */
function tastePicksHTML(limit){
  try{
    limit = limit || 6;
    const tp = tasteProfile();
    if (!tp.signals) return '';          /* brand-new visitor → generic strips cover her */
    const exclude = new Set();
    (Store.wish || []).forEach(id => exclude.add(id));
    (Store.cart || []).forEach(i => exclude.add(i.id));
    try{ JSON.parse(localStorage.getItem('sk_recent') || '[]').slice(0, 3).forEach(id => exclude.add(id)); }catch(e){}
    const ranked = PRODUCTS.filter(p => !p.hidden && p.stock > 0 && !exclude.has(p.id))
      .map(p => ({ p, s: tasteScore(p, tp) }))
      .filter(x => x.s >= 3)
      .sort((a, b) => b.s - a.s);
    let picks = diversePicks(ranked, limit, 2);   /* max 2 per category */
    if (picks.length < limit){
      /* widen: pull the next-best (score ≥ 1) to KEEP VARIETY instead of
         repeating the same category again and again */
      const chosen = new Set(picks.map(x => x.p.id));
      const wider = PRODUCTS.filter(p => !p.hidden && p.stock > 0 && !exclude.has(p.id) && !chosen.has(p.id))
        .map(p => ({ p, s: tasteScore(p, tp) }))
        .filter(x => x.s >= 1)
        .sort((a, b) => b.s - a.s);
      const merged = diversePicks(picks.concat(wider), limit, 2);
      if (merged.length > picks.length) picks = merged;
    }
    const finalPicks = picks.map(x => x.p);
    if (picks.length < 2) return '';
    const nm = userName();
    const title = loc(
      nm ? nm + ' பிடிக்கும் வகைகள்' : 'உங்களுக்கு பிடிக்கும் வகைகள்',
      nm ? nm + ' కి నచ్చిన చీరలు' : 'మీకు నచ్చిన చీరలు',
      nm ? nm + ' ಗೆ ಇಷ್ಟವಾದ ಸೀರೆಗಳು' : 'ನಿಮಗೆ ಇಷ್ಟವಾದ ಸೀರೆಗಳು',
      nm ? 'Sarees ' + nm + ' Will Love' : 'Sarees You Will Love');
    return '<section class="sec taste-sec"><div class="sec-head"><h2><span class="tick"></span>✨ ' + title + '</h2><a href="shop.html">' + t('viewAll') + '</a></div>' +
      '<div class="prow">' + finalPicks.map(cardHTML).join('') + '</div>' +
      '<p class="small muted" style="margin-top:8px">🤝 ' + loc('நீங்கள் பார்த்து பிடித்தவற்றின் அடிப்படையில் தேர்ந்தெடுக்கப்பட்டவை', 'మీరు చూసిన & ఇష్టపడిన వాటి ఆధారంగా ఎంపిక చేయబడింది', 'ನೀವು ನೋಡಿದ ಮತ್ತು ಇಷ್ಟಪಟ್ಟ ಸೀರೆಗಳ ಆಧಾರದಲ್ಲಿ ಆಯ್ಕೆಮಾಡಲಾಗಿದೆ', 'Picked specially from what you viewed & loved') + '</p></section>';
  }catch(e){ return ''; }
}

/* ============================ 👤 CUSTOMER NAME — personal bond ============================
   1st visit: ask her name once (polite popup, skippable) → saved on this device.
   Every page then greets her by name and shows "{Name}'s Liked Sarees" +
   "{Name}'s Viewed Sarees". Builds a warm 1-to-1 relationship with the store. */
function likedSareesTitle(){
  const nm = userName();
  return loc(
    nm ? esc(nm) + ' பிடித்த சேலைகள்' : 'நீங்கள் பிடித்த சேலைகள்',
    nm ? esc(nm) + ' నచ్చిన చీరలు' : 'మీకు నచ్చిన చీరలు',
    nm ? esc(nm) + ' ಇಷ್ಟಪಟ್ಟ ಸೀರೆಗಳು' : 'ನಿಮಗೆ ಇಷ್ಟವಾದ ಸೀರೆಗಳು',
    nm ? esc(nm) + "'s Liked Sarees" : 'Your Liked Sarees');
}
function viewedSareesTitle(){
  const nm = userName();
  return loc(
    nm ? esc(nm) + ' பார்த்த சேலைகள்' : 'சமீபத்தில் பார்த்த சேலைகள்',
    nm ? esc(nm) + ' చూసిన చీరలు' : 'ఇటీవల చూసినవి',
    nm ? esc(nm) + ' ನೋಡಿದ ಸೀರೆಗಳು' : 'ಇತ್ತೀಚೆಗೆ ನೋಡಿದವು',
    nm ? esc(nm) + "'s Viewed Sarees" : 'Recently Viewed');
}
/* ❤️ "{Name}'s Liked Sarees" — her wishlist strip, shown on every page */
function likedSareesHTML(max){
  try{
    const list = (Store.wish || []).map(byId).filter(Boolean).slice(0, max || 4);
    if (!list.length) return '';
    return '<section class="sec"><div class="sec-head"><h2><span class="tick"></span>❤️ ' + likedSareesTitle() +
      ' <span class="like-count">' + (Store.wish || []).length + '</span></h2><a href="profile.html">View all →</a></div>' +
      '<div class="prow">' + list.map(cardHTML).join('') + '</div></section>';
  }catch(e){ return ''; }
}
/* 👀 "{Name}'s Viewed Sarees" — grid (profile page, full list) */
function viewedCardsHTML(max){
  try{
    let rv = [];
    try{ rv = JSON.parse(localStorage.getItem('sk_recent') || '[]'); }catch(e){}
    const prods = (Array.isArray(rv) ? rv : []).map(byId).filter(Boolean).slice(0, max || 8);
    return prods.length ? prods.map(cardHTML).join('') : '<p class="muted small" style="padding:6px 2px">👀 Nothing yet — sarees you open will appear here.</p>';
  }catch(e){ return ''; }
}
/* 🤝 home greeting strip — "{Name}, here is your bond with us" */
function personalGreetHTML(){
  try{
    const nm = userName();
    if (!nm) return '';
    const liked = (Store.wish || []).length;
    let viewed = 0;
    try{ viewed = JSON.parse(localStorage.getItem('sk_recent') || '[]').length; }catch(e){}
    const pts = pointsBalance();
    const since = memberSinceText();
    return '<section class="greet-strip"><div class="wrap gs-in">' +
      '<span class="gs-emoji">👋</span>' +
      '<div class="gs-txt"><b>' + greetWord() + ', ' + esc(nm) + '!</b>' +
'</div>' +
      '<a class="gs-btn" href="profile.html">' + esc(nm) + loc(' பக்கம் →', ' పేజీ →', ' ಪುಟ →', "'s page →") + '</a>' +
      '<button type="button" class="gs-share" data-sharesite="1" aria-label="Share SK Sarees" title="' + loc('வாட்ஸ்அப்பில் பகிர்', 'వాట్సాప్‌లో షేర్ చేయి', 'ವಾಟ್ಸಾಪ್‌ನಲ್ಲಿ ಹಂಚಿ', 'Share on WhatsApp') + '">📢</button>' +
      '</div></section>';
  }catch(e){ return ''; }
}
/* 🔑 account card — login with mobile + pincode (data follows her everywhere) */
function accountCardHTML(){
  try{
    const a = Auth.current();
    if (a){
      return '<div class="form-card acct-card"><h3>🔑 ' + loc('கணக்கு', '஖ாதெ', '஖ாதெ', 'Account') + '</h3>' +
        '<p class="small" style="margin:2px 0 10px">📱 <b>' + esc(a.phone.slice(0, 2) + '•••••' + a.phone.slice(-3)) + '</b> • ' + loc('எல்லா சாதனம் ஒன்றாக ஒன்று 🎉', 'ଅந்தன் பணி வி஧மா஦ மோதது', 'எல்லா பாவதெ஗ளல்லி ஒஂ஦ே', 'same data on all devices 🎉') + '</p>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
          '<button type="button" class="btn btn-outline" data-login="1" style="flex:1">🔄 ' + loc('புதுப்பிக்கு', 'ரெசிக்கு', 'புத்ஸமக்கு', 'Refresh') + '</button>' +
          '<button type="button" class="btn btn-outline" data-logout="1" style="flex:1">🔓 ' + loc('வெளியேறு', 'லா஗்அவுட்', 'லா஗்அபீட்', 'Logout') + '</button>' +
        '</div></div>';
    }
    return '<div class="form-card acct-card"><h3>🔑 ' + loc('உள்ளேறு — எல்லா சாதனம் ஒன்றாக ஒன்று', 'லா஗ின் — அனைதேது பந்துல லோகமாது', 'லா஗ிந் — எல்லா ஡ேடா ஒஂ஦ே', 'Login — same data everywhere') + '</h3>' +
      '<p class="small muted" style="margin:2px 0 10px">📱 ' + loc('எண் = username • பின்கோட் = password', 'மொபைல் = username • பின்கோட் = password', 'மொபைல் = username • பின்கோட் = password', 'Mobile = username • Pincode = password') + '</p>' +
      '<button type="button" class="btn btn-maroon" data-login="1" style="width:100%">🔓 ' + loc('உள்ளேறு', 'லா஗ின்', 'லா஗ிந்', 'Login') + '</button>' +
      '<p class="small muted" style="margin-top:8px">📢 ' + loc('முதல் ஆர்டர் போடும்போது கணக்கு தானாக உருவாகும்!', 'மொ஦டி ஆர்டர் தந்நே ஖ாதெ வேருதுஂ஦ி!', 'மொ஦ல ஆர்டர் இதுவே ஖ாதெ தயாரிட்டி஦ெ!', 'Account is created automatically with your first order!') + '</p></div>';
  }catch(e){ return ''; }
}
/* 🤝 profile page: her relationship card with the store */
function personalProfileCardHTML(){
  try{
    const nm = userName();
    if (!nm) return '';
    let viewed = 0;
    try{ viewed = JSON.parse(localStorage.getItem('sk_recent') || '[]').length; }catch(e){}
    const since = memberSinceText();
    return '<div class="form-card greet-card">' +
      '<h3>🙏 ' + greetWord() + ', ' + esc(nm) + '!</h3>' +
      '<p class="small" style="margin:2px 0 10px">' + loc('நீங்கள் SK Sarees குடும்பத்தின் ஒரு அங்கம்', 'మీరు SK Sarees కుటుంబంలో భాగం', 'ನೀವು SK Sarees ಕುಟುಂಬದ ಭಾಗ', 'You are part of the SK Sarees family') + (since ? ' — <b>' + loc(since + ' முதல்', since + ' నుండి', since + ' ದಿಂದ', 'since ' + since) + '</b>' : '') + ' 🤝</p>' +
      '<div class="greet-stats">' +
        '<span>❤️ <b>' + (Store.wish || []).length + '</b> ' + loc('பிடித்தது', 'నచ్చినవి', 'ಇಷ್ಟ', 'liked') + '</span>' +
        (viewed ? '<span>👀 <b>' + viewed + '</b> ' + loc('பார்த்தது', 'చూసినవి', 'ನೋಡಿದವು', 'viewed') + '</span>' : '') +
        '<span>📦 <b>' + (Store.orders || []).length + '</b> ' + loc('ஆர்டர்கள்', 'ఆర్డర్లు', 'ಆರ್ಡರ್‌ಗಳು', 'orders') + '</span>' +
        '<span>⭐ <b>' + pointsBalance() + '</b> ' + loc('பாயிண்ட்', 'పాయింట్లు', 'ಪಾಯಿಂಟ್‌ಗಳು', 'points') + '</span>' +
      '</div></div>';
  }catch(e){ return ''; }
}
/* 📢 SHARE THE WEBSITE — photo + link together: native share sheet carries the
   premium banner IMAGE file + text + URL (WhatsApp chat-ல image-um link-um
   சேர்ந்து போகும்). Fallback: wa.me link (OG tags show the preview image). */
async function shareSite(){
  const url = (CONFIG.siteUrl || location.origin) + '/';
  const msg = loc(
    '🪡 SK Sarees — Salem-ன் பிரீமியம் சேலை கடை! 🥻\n\n✨ Kanchipuram silk, soft silk, cotton & wedding sarees\n💰 ₹649 முதல் • 40% வரை OFF\n🚚 ₹999+ இலவச டெலிவரி • COD & UPI உண்டு\n\n👉 ' + url,
    '🪡 SK Sarees — Salem ప్రీమియం చీరల షాప్! 🥻\n\n✨ Kanchipuram silk, soft silk, cotton & wedding sarees\n💰 ₹649 నుండి • 40% వరకు OFF\n🚚 ₹999+ ఫ్రీ డెలివరీ • COD & UPI ఉన్నాయి\n\n👉 ' + url,
    '🪡 SK Sarees — Salem ಪ್ರೀಮಿಯಂ ಸೀರೆ ಅಂಗಡಿ! 🥻\n\n✨ Kanchipuram silk, soft silk, cotton & wedding sarees\n💰 ₹649 ರಿಂದ • 40% ವರೆಗೆ OFF\n🚚 ₹999+ ಉಚಿತ ಡೆಲಿವರಿ • COD & UPI ಇವೆ\n\n👉 ' + url,
    '🪡 SK Sarees — Premium saree shop from Salem! 🥻\n\n✨ Kanchipuram silk, soft silk, cotton & wedding sarees\n💰 From ₹649 • Up to 40% OFF\n🚚 FREE delivery above ₹999 • COD & UPI available\n\n👉 ' + url);
  /* 🖼️ attach the premium banner image */
  let file = null;
  try{
    const img = (CONFIG.siteUrl || location.origin) + '/share-banner.jpg';
    if (navigator.canShare){
      const blob = await fetch(img).then(r => r.ok ? r.blob() : null).catch(() => null);
      if (blob && blob.size && blob.size < 4.5e6) file = new File([blob], 'sk-sarees.jpg', { type: blob.type || 'image/jpeg' });
    }
  }catch(e){}
  try{
    if (navigator.share){
      const payload = { title: CONFIG.storeName, text: msg, url };
      if (file && navigator.canShare({ files: [file] })) payload.files = [file];
      navigator.share(payload).then(() => {}, () => { try{ window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank', 'noopener'); }catch(e2){} });
      return;
    }
  }catch(e){}
  try{ window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank', 'noopener'); }catch(e){}
}

/* 🎫 Scratch & Win REMOVED on request (2026-09-05) — clean shopping focus */
/* ============================ ✨ AI STYLE QUIZ ============================
   3 taps — occasion · budget · colour vibe → AI curates her personal
   collection instantly (taste engine + quiz filters). Answers also FEED the
   taste engine, so the whole site gets smarter about her. 100% local AI. */
const SQ_OCC = [
  ['👰', 'Wedding / Bridal', 'wedding'],
  ['🎉', 'Party / Function', 'party'],
  ['🌿', 'Daily Wear', 'daily'],
  ['💼', 'Office', 'office'],
  ['🙏', 'Festival / Puja', 'festival'],
];
const SQ_BUDGET = [
  [800, 'Under ₹800'],
  [1500, '₹800 – ₹1,500'],
  [2500, '₹1,500 – ₹2,500'],
  [0, 'No limit — show me the best!'],
];
const SQ_VIBE = [
  ['🔴', 'Rich Reds & Maroons', 'Red'],
  ['💜', 'Royal Purples', 'Purple'],
  ['🟢', 'Fresh Greens', 'Green'],
  ['🟡', 'Golden Yellows', 'Yellow'],
  ['💙', 'Cool Blues & Teals', 'Blue'],
  ['🎲', 'Surprise me, AI!', ''],
];
let sq = { step: 1, occ: '', occLabel: '', budget: 0, budgetLabel: '', vibe: '', vibeLabel: '' };
function openStyleQuiz(){
  sq = { step: 1, occ: '', occLabel: '', budget: 0, budgetLabel: '', vibe: '', vibeLabel: '' };
  drawStyleQuiz();
}
function drawStyleQuiz(){
  try{
    const prog = '<div class="sq-prog">' + [1, 2, 3].map(i => '<i class="' + (i <= sq.step ? 'on' : '') + '"></i>').join('') + '</div>';
    let body = '';
    if (sq.step === 1){
      body = '<div class="sq-q">' + loc('எந்த சந்தர்ப்பத்திற்கு? 🥻', 'ఎంత సందర్భానికి? 🥻', 'ಯಾವ ಸಂದರ್ಭಕ್ಕೆ? 🥻', 'What is the occasion? 🥻') + '</div>' +
        '<p class="sq-hint">' + loc('முதல் கேள்வி — 3-ல் 1', 'మొదటి ప్రశ్న — 1/3', 'ಮೊದಲ ಪ್ರಶ್ನೆ — 1/3', 'Question 1 of 3') + '</p>' +
        '<div class="sq-opts">' + SQ_OCC.map(o => '<button type="button" class="sq-opt" data-sqocc="' + o[2] + '" data-sqlbl="' + esc(o[1]) + '"><span class="sq-e">' + o[0] + '</span>' + o[1] + '</button>').join('') + '</div>';
    } else if (sq.step === 2){
      body = '<div class="sq-q">' + loc('பட்ஜெட் எவ்வளவு? 💰', 'బడ్జెట్ ఎంత? 💰', 'ಬಜೆಟ್ ಎಷ್ಟು? 💰', 'What is your budget? 💰') + '</div>' +
        '<p class="sq-hint">' + loc('இரண்டாம் கேள்வி — 3-ல் 2', 'రెండో ప్రశ్న — 2/3', 'ಎರಡನೇ ಪ್ರಶ್ನೆ — 2/3', 'Question 2 of 3') + '</p>' +
        '<div class="sq-opts">' + SQ_BUDGET.map(b => '<button type="button" class="sq-opt" data-sqbud="' + b[0] + '" data-sqlbl="' + esc(b[1]) + '"><span class="sq-e">💰</span>' + b[1] + '</button>').join('') + '</div>';
    } else if (sq.step === 3){
      body = '<div class="sq-q">' + loc('எந்த நிறம் பிடிக்கும்? 🎨', 'ఏ రంగు నచ్చుతుంది? 🎨', 'ಯಾವ ಬಣ್ಣ ಇಷ್ಟ? 🎨', 'Which colour vibe? 🎨') + '</div>' +
        '<p class="sq-hint">' + loc('கடைசி கேள்வி — 3-ல் 3', 'చివరి ప్రశ్న — 3/3', 'ಕೊನೆಯ ಪ್ರಶ್ನೆ — 3/3', 'Last question — 3 of 3') + '</p>' +
        '<div class="sq-opts">' + SQ_VIBE.map(v => '<button type="button" class="sq-opt" data-sqvibe="' + esc(v[2]) + '" data-sqlbl="' + esc(v[1]) + '"><span class="sq-e">' + v[0] + '</span>' + v[1] + '</button>').join('') + '</div>';
    }
    openModal('<div class="sq-card">' +
      '<h3 class="np-title">✨ ' + loc('AI Style Quiz', 'AI స్టైల్ క్విజ్', 'AI ಸ್ಟೈಲ್ ಕ್ವಿಜ್', 'AI Style Quiz') + '</h3>' +
      prog + body +
      '<button type="button" class="np-skip" data-close>' + loc('விடுங்கள் — நானே பார்க்கிறேன்', 'వదిలివేయి — నేనే చూస్తా', 'ಬಿಡಿ — ನಾನೇ ನೋಡುತ್ತೇನೆ', 'Skip — I\'ll browse myself') + '</button>' +
    '</div>');
    /* wire answers */
    document.querySelectorAll('[data-sqocc]').forEach(b => b.addEventListener('click', () => {
      sq.occ = b.dataset.sqocc; sq.occLabel = b.dataset.sqlbl || ''; sq.step = 2; drawStyleQuiz();
    }));
    document.querySelectorAll('[data-sqbud]').forEach(b => b.addEventListener('click', () => {
      sq.budget = +b.dataset.sqbud || 0; sq.budgetLabel = b.dataset.sqlbl || ''; sq.step = 3; drawStyleQuiz();
    }));
    document.querySelectorAll('[data-sqvibe]').forEach(b => b.addEventListener('click', () => {
      sq.vibe = b.dataset.sqvibe || ''; sq.vibeLabel = b.dataset.sqlbl || '';
      /* 🤖 brief "AI thinking" moment → feels intelligent, costs nothing */
      openModal('<div class="sq-card"><div class="sq-thinking">🤖 ' + loc('AI உங்களுக்கான சேலைகளை தேர்ந்தெடுக்கிறது', 'AI మీ కోసం చీరలను ఎంపిక చేస్తోంది', 'AI ನಿಮಗಾಗಿ ಸೀರೆಗಳನ್ನು ಆಯ್ಕೆ ಮಾಡುತ್ತಿದೆ', 'AI is curating your sarees') + '<span class="dots"><i>.</i><i>.</i><i>.</i></span></div></div>');
      setTimeout(quizShowResults, 850);
    }));
  }catch(e){}
}
function quizShowResults(){
  try{
    /* filter by her answers (relaxing filters if too few matches) */
    let pool = PRODUCTS.filter(p => !p.hidden && p.stock > 0);
    let byCat = pool.filter(p => p.cat === sq.occ);
    if (sq.occ === 'party') byCat = pool.filter(p => p.cat === 'party' || p.cat === 'fancy');
    if (sq.occ === 'daily') byCat = pool.filter(p => p.cat === 'daily' || p.cat === 'cotton');
    if (byCat.length >= 2) pool = byCat;
    if (sq.budget){
      const byPrice = pool.filter(p => p.price <= sq.budget);
      if (byPrice.length >= 2) pool = byPrice;
    }
    const tp = tasteProfile();
    const picks = pool.map(p => ({
      p, s: tasteScore(p, tp) + (sq.vibe && (p.colors || []).some(c => String(c).toLowerCase().indexOf(sq.vibe.toLowerCase()) !== -1) ? 6 : 0)
    })).sort((a, b) => b.s - a.s).slice(0, 6).map(x => x.p);
    /* ✨ quiz answers feed the taste engine → whole site becomes smarter */
    try{ LS.set('sk_quiz', { cat: sq.occ, maxPrice: sq.budget, color: sq.vibe }); }catch(e){}
    const reason = '✨ ' + loc('ஏனென்றால் நீங்கள் தேர்ந்தெடுத்தது:', 'ఎందుకంటే మీరు ఎంచుకున్నారు:', 'ಏಕೆಂದರೆ ನೀವು ಆಯ್ಕೆ ಮಾಡಿದ್ದೀರಿ:', 'Because you chose:') + ' <b>' + esc(sq.occLabel || '—') + '</b> · <b>' + esc(sq.budgetLabel || '—') + '</b> · <b>' + esc(sq.vibeLabel || '—') + '</b>';
    openModal('<div class="sq-card">' +
      '<h3 class="np-title">🤖 ' + loc('AI உங்களுக்காக தேர்ந்தெடுத்தவை', 'AI మీ కోసం ఎంపిక చేసినవి', 'AI ನಿಮಗಾಗಿ ಆಯ್ಕೆಮಾಡಿದವು', 'AI Picks for You') + '</h3>' +
      '<div class="sq-reason">' + reason + '</div>' +
      (picks.length
        ? '<div class="sq-cards"><div class="ai-cards">' + picks.map(aiCard).join('') + '</div>' + tasteSummaryHTML() + '</div>'
        : '<p class="muted small" style="padding:14px 0">😕 ' + loc('இந்த combination-ல இப்போ ஸ்டாக் இல்லை — வேற விருப்பம் தேர்ந்தெடுங்கள்', 'ఈ combination లో స్టాక్ లేదు — వేరే ఎంపిక చేయండి', 'ಈ combination ನಲ್ಲಿ ಸ್ಟಾಕ್ ಇಲ್ಲ — ಬೇರೆ ಆಯ್ಕೆ ಮಾಡಿ', 'No stock for this combination right now — try another pick') + '</p>') +
      '<div class="sq-btns">' +
        (sq.occ ? '<a class="btn btn-maroon" href="shop.html?cat=' + encodeURIComponent(sq.occ) + '">🛍️ ' + loc('இவற்றை ஷாப் செய்', 'ఇవి షాప్ చేయి', 'ಇವುಗಳನ್ನು ಶಾಪ್ ಮಾಡಿ', 'Shop these') + '</a>' : '') +
        '<button type="button" class="btn btn-outline" data-sqretake>🔁 ' + loc('மீண்டும் முயற்சி', 'మళ్ళీ ప్రయత్నించు', 'ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ', 'Retake') + '</button>' +
      '</div></div>');
    const rt = document.querySelector('[data-sqretake]');
    if (rt) rt.addEventListener('click', () => { openStyleQuiz(); });
  }catch(e){}
}
/* ✨ quiz banner — home page invitation */
function styleQuizBannerHTML(){
  try{
    return '<div class="wrap" style="margin-top:10px"><button type="button" class="quiz-banner" data-quiz="1">' +
      '<span class="qb-ico">✨</span>' +
      '<span class="qb-txt"><b>' + loc('AI Style Quiz — வெறும் 3 டேப்!', 'AI స్టైల్ క్విజ్ — కేవలం 3 ట్యాప్‌లు!', 'AI ಸ್ಟೈಲ್ ಕ್ವಿಜ್ — ಕೇವಲ 3 ಟ್ಯಾಪ್!', 'AI Style Quiz — just 3 taps!') + '</b>' +
      '<small>' + loc('சந்தர்ப்பம்? பட்ஜெட்? பிடித்த நிறம்? — AI உடனே உங்களுக்கான சேலைகளை காட்டும் 🤖', 'సందర్భం? బడ్జెట్? ఇష్టమైన రంగు? — AI వెంటనే మీ చీరలను చూపిస్తుంది 🤖', 'ಸಂದರ್ಭ? ಬಜೆಟ್? ಇಷ್ಟದ ಬಣ್ಣ? — AI ತಕ್ಷಣ ನಿಮ್ಮ ಸೀರೆಗಳನ್ನು ತೋರಿಸುತ್ತದೆ 🤖', 'Occasion? Budget? Favourite colour? — AI instantly finds your perfect sarees 🤖') + '</small></span>' +
      '<span class="qb-go">→</span></button></div>';
  }catch(e){ return ''; }
}

/* ⏱️ dwell tracking — how long she studies each product page (engagement
   signal for the taste engine; hidden-tab time doesn't count) */
function initDwellTracking(){
  try{
    const flush = () => {
      try{
        if (!window.__pdpStart || !window.__pdpId) return;
        const secs = Math.round((Date.now() - window.__pdpStart) / 1000);
        if (secs > 0){
          const d = LS.get('sk_dwell', {}) || {};
          d[window.__pdpId] = (d[window.__pdpId] || 0) + secs;
          /* keep the map small — last 25 sarees she studied */
          const keys = Object.keys(d);
          if (keys.length > 25){
            keys.sort((a, b) => (d[b] || 0) - (d[a] || 0));
            keys.slice(25).forEach(k => { delete d[k]; });
          }
          LS.set('sk_dwell', d);
        }
        window.__pdpStart = Date.now();   /* reset — hidden time is not credit */
      }catch(e){}
    };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
  }catch(e){}
}

/* ⏰ OFFER TIMER (Meesho-style) — "Offer ends in 02:14:33" red countdown on
   discounted sarees. One shared 1-second ticker updates every timer on the
   page; deadline = tonight midnight (fresh offers every day). */
function offerTimerProduct(p){
  /* deterministic daily rotation — ~2 of 3 discounted products show it */
  try{
    let h = 0; const s = String(p.id || '') + new Date().toDateString();
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h % 3 !== 0;
  }catch(e){ return false; }
}
function startOfferTimers(){
  try{
    const tick = () => {
      try{
        const now = new Date();
        const end = new Date(); end.setHours(23, 59, 59, 999);
        const s = Math.max(0, Math.floor((end - now) / 1000));
        const txt = String(Math.floor(s / 3600)).padStart(2, '0') + ':' +
                    String(Math.floor((s % 3600) / 60)).padStart(2, '0') + ':' +
                    String(s % 60).padStart(2, '0');
        document.querySelectorAll('.ot-t').forEach(el => { el.textContent = txt; });
      }catch(e){}
    };
    tick();
    setInterval(tick, 1000);
  }catch(e){}
}
function offerTimerHTML(p, big){
  try{
    const off = offPct(p);
    if (!off || off < 10 || (p.stock != null && p.stock <= 0)) return '';
    if (!big && !offerTimerProduct(p)) return '';   /* cards: daily-rotating subset */
    return '<div class="offer-timer' + (big ? ' ot-big' : '') + '">⏰ <b>' +
      loc('ஆஃபர் முடியும் நேரம்', 'ఆఫర్ ముగుస్తుంది', 'ಆಫರ್ ಮುಗಿಯುತ್ತದೆ', 'Offer ends in') +
      ' <span class="ot-t">--:--:--</span></b></div>';
  }catch(e){ return ''; }
}

/* 🙏 FIRST VISIT: ask her name after ONE FULL MINUTE of REAL BROWSING — only
   seconds where the tab is actually VISIBLE count (hidden/idle tab = no
   credit), and time accumulates across every page she visits. She shops
   undisturbed first; the ask comes after she's genuinely engaged. */
/* ⏱️ ACTIVE TIME ENGINE — one heartbeat that counts REAL visible seconds
   (hidden tab = no credit). Powers BOTH the 1-min name popup and the 2-min
   Scratch & Win card. Runs on every page, time accumulates across pages. */
let __activeIv = null;
function activeMs(){ try{ return +LS.get('sk_active_ms', 0) || 0; }catch(e){ return 0; } }
function startActiveEngine(){
  try{
    if (__activeIv) return;
    __activeIv = setInterval(() => {
      try{
        if (document.visibilityState !== 'visible') return;
        LS.set('sk_active_ms', activeMs() + 1000);
      }catch(e){}
    }, 1000);
  }catch(e){}
}
function maybeAskName(){
  try{
    if (userName() || LS.get('sk_name_asked', 0)) return;
    const chk = setInterval(() => {
      try{
        if (userName() || LS.get('sk_name_asked', 0)){ clearInterval(chk); return; }
        if (activeMs() >= 60000 && !document.querySelector('#modalRoot .modal')){ clearInterval(chk); openNamePopup(); }
      }catch(e){}
    }, 1000);
  }catch(e){}
}
function openNamePopup(){
  try{
    if (userName() || LS.get('sk_name_asked', 0)) return;
    /* another popup active (scratch card / upsell)? wait politely and retry */
    if (document.querySelector('#modalRoot .modal')){ setTimeout(openNamePopup, 12000); return; }
    openModal(
      '<div class="np-card">' +
        '<div class="np-emoji">🪡</div>' +
        '<h3 class="np-title">' + greetWord() + '! 🙏</h3>' +
        '<p class="np-sub">' + loc(' <b>SK Sarees</b>, Salem-க்கு வரவேற்கிறோம்.<br>உங்கள் பெயர் என்ன?', '<b>SK Sarees</b>, Salemకి స్వాగతం.<br>మీ పేరు ఏమిటి?', '<b>SK Sarees</b>, Salem ಗೆ ಸ್ವಾಗತ.<br>ನಿಮ್ಮ ಹೆಸರು ಏನು?', 'Welcome to <b>SK Sarees</b>, Salem.<br>What is your name?') +
          (lang === 'en' ? '' : ' <span class="muted">(What is your name?)</span>') + '</p>' +
        '<input id="npIn" class="np-input" placeholder="' + loc('e.g. பிரியா', 'e.g. ప్రియా', 'e.g. ಪ್ರಿಯಾ', 'e.g. Priya') + '" maxlength="30" autocomplete="off">' +
        '<button type="button" class="btn btn-maroon btn-xl np-save" id="npSave">' + loc('💛 என் பெயரை சேமி', '💛 నా పేరు సేవ్ చేయి', '💛 ನನ್ನ ಹೆಸರನ್ನು ಉಳಿಸಿ', '💛 Save My Name') + '</button>' +
        '<button type="button" class="np-skip" id="npSkip">' + loc('விடுங்கள் — பிறகு', 'వదిలివేయి — తర్వాత', 'ಬಿಡಿ — ನಂತರ', 'Skip — maybe later') + '</button>' +
        '<p class="np-note">🔒 ' + loc('உங்கள் போனில் மட்டும் சேமிக்கப்படும். உங்கள் பெயரால் அழைத்து, பிடித்த சேலைகளை தயாராக வைத்திருப்போம்!', 'మీ ఫోన్‌లో మాత్రమే సేవ్ అవుతుంది. మీ పేరుతో పిలిచి, మీకు నచ్చిన చీరలను సిద్ధంగా ఉంచుతాము!', 'ನಿಮ್ಮ ಫೋನ್‌ನಲ್ಲಿ ಮಾತ್ರ ಉಳಿಸಲಾಗುತ್ತದೆ. ನಿಮ್ಮ ಹೆಸರಿನಿಂದ ಕರೆದು, ನಿಮಗೆ ಇಷ್ಟವಾದ ಸೀರೆಗಳನ್ನು ಸಿದ್ಧವಾಗಿಡುತ್ತೇವೆ!', 'Saved only on your phone. We greet you by name &amp; keep your liked sarees ready for you!') + '</p>' +
      '</div>');
    LS.set('sk_name_asked', 1);   /* asked once — skipping/closing never nags again */
    const inp = document.getElementById('npIn');
    const save = () => {
      const v = (inp ? inp.value : '').trim();
      if (v.length < 2){ toast('⚠️ Please type your name 🙂'); if (inp) inp.focus(); return; }
      saveUserName(v);
      closeModal();
      toast('🙏 ' + greetWord() + ', ' + esc(userName()) + '! ' + loc('SK Sarees குடும்பத்திற்கு வரவேற்கிறோம் 🎉', 'SK Sarees కుటుంబానికి స్వాగతం 🎉', 'SK Sarees ಕುಟುಂಬಕ್ಕೆ ಸ್ವಾಗತ 🎉', 'Welcome to the SK Sarees family 🎉'));
      try{ renderHeader(); }catch(e){}
      try{ rerenderPage(); }catch(e){}
    };
    if (inp){
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') save(); });
      setTimeout(() => { try{ inp.focus(); }catch(e2){} }, 350);
    }
    const sv = document.getElementById('npSave'); if (sv) sv.addEventListener('click', save);
    const sk = document.getElementById('npSkip'); if (sk) sk.addEventListener('click', closeModal);
  }catch(e){}
}
/* re-render the current page right after the name is saved (sections appear at once) */
function rerenderPage(){
  const page = document.body.dataset.page;
  if (page === 'home') renderHome();
  else if (page === 'shop') renderShop();
  else if (page === 'product') renderProduct();
  else if (page === 'cart') renderCartPage();
  else if (page === 'checkout') renderCheckoutPage();
  else if (page === 'orders') renderOrdersPage();
  else if (page === 'profile') renderProfilePage();
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
    return '<section class="sec"><div class="sec-head"><h2><span class="tick"></span>👀 ' + viewedSareesTitle() + '</h2></div>' +
      '<div class="prow">' + prods.map(cardHTML).join('') + '</div></section>';
  }catch(e){ return ''; }
}
/* 🔥 KEEP BROWSING — taste-ranked when she has history (MORE of what she
   loves → longer engagement), trending as fallback. Never a dead end. */
function keepBrowsingHTML(){
  try{
    const tp = tasteProfile();
    let picks;
    if (tp.signals){
      picks = PRODUCTS.filter(p => !p.hidden && p.stock > 0)
        .map(p => ({ p, s: tasteScore(p, tp) }))
        .filter(x => x.s > 1)
        .sort((a, b) => b.s - a.s)
        .map(x => x.p)
        .slice(0, 10);
    }
    if (!picks || picks.length < 4){
      picks = PRODUCTS.filter(p => !p.hidden && p.stock > 0)
        .slice().sort((a, b) => (b.reviews || 0) - (a.reviews || 0)).slice(0, 8);
    }
    if (picks.length < 2) return '';
    const title = tp.signals
      ? loc('இன்னும் ரொம்ப சேலைகள் — உங்களுக்காக', 'మరిన్ని చీరలు — మీ కోసం', 'ಇನ್ನಷ್ಟು ಸೀರೆಗಳು — ನಿಮಗಾಗಿ', 'Keep Browsing — Picked for You')
      : loc('தொடர்ந்து பாருங்க — டிரெண்டிங் சேலைகள்', 'కొనసాగించండి — ట్రెండింగ్ చీరలు', 'ಮುಂದುವರಿಸಿ — ಟ್ರೆಂಡಿಂಗ್ ಸೀರೆಗಳು', 'Keep Browsing — Trending Sarees');
    return '<section class="sec"><div class="sec-head"><h2><span class="tick"></span>🔥 ' + title + '</h2><a href="shop.html">' + t('viewAll') + '</a></div>' +
      '<div class="prow">' + picks.map(cardHTML).join('') + '</div></section>';
  }catch(e){ return ''; }
}

/* ============================ PRODUCT ============================ */
/* 🌸 SMART TITLE — customers never see a bare SKU like "SK9393".
   SKU-like names become beautiful descriptive titles from the saree's real
   attributes (fabric · collection · occasion) — great for buyers AND for
   Google/Facebook link previews. Real names are kept as-is. */
function smartTitle(p){
  try{
    const raw = String((p && p.name) || '').trim();
    const bare = raw.replace(/[\s_-]+/g, '');
    const skuLike = !raw || raw.length < 5 ||
      /^[a-z0-9]{5,16}$/i.test(bare) ||
      /^(sk|sks|sk4|sk9)/i.test(bare) ||
      /^\d+$/.test(bare);
    /* ✨ real name → still append Category + Occasion (name + category + vocation) */
    const occOf = (cat) => /wedding|bridal|kanchipuram/.test(cat || '') ? 'Wedding & Festive Wear' :
                /party|fancy/.test(cat || '') ? 'Party & Function Wear' :
                /office/.test(cat || '') ? 'Office & Daily Wear' :
                /daily|cotton|printed/.test(cat || '') ? 'Daily & Casual Wear' :
                'Festive & Everyday Wear';
    if (!skuLike){
      const catName = (CATEGORIES.find(c => c.slug === p.cat) || {}).name || '';
      let t = raw;
      if (catName && raw.toLowerCase().indexOf(catName.toLowerCase().split(' ')[0]) === -1) t += ' | ' + catName;
      const occTxt = occOf(p.cat);
      if (occTxt && t.indexOf(occTxt) === -1) t += ' | ' + occTxt;
      return t;
    }
    const occ = occOf(p.cat);
    const cat = (CATEGORIES.find(c => c.slug === p.cat) || {}).name || '';
    const f = String(p.fabric || '').toLowerCase();
    const fab = /soft silk/.test(f) ? 'Soft Silk' :
                /semi silk/.test(f) ? 'Semi Silk' :
                /cotton/.test(f) ? 'Cotton' :
                /georgette/.test(f) ? 'Georgette' :
                /organza/.test(f) ? 'Organza' :
                /linen/.test(f) ? 'Linen' :
                /chiffon/.test(f) ? 'Chiffon' : 'Silk';
    return '🌸 Premium ' + fab + ' Saree' + (cat ? ' | ' + cat : '') + ' | ' + occ;
  }catch(e){ return (p && p.name) || ''; }
}
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
  /* ✅ "Verified customer" badge shows ONLY for reviews posted by users who
     saved their address & phone (real, reachable customers — honest trust) */
  const revs = (userRevs.length
    ? userRevs.slice().reverse().map(revCardHTML).join('')
    : '') +
    '<div id="remoteRevs"></div>' +   /* 📡 reviews + photos from ALL customers (Firestore) */
    /* 🛟 never show a negative empty state — products with catalog reviews show
       their rating; brand-new ones show an honest order-risk-free trust line */
    (userRevs.length ? '' :
      (p.reviews > 0
        ? '<p class="small" style="font-weight:800;color:var(--green);margin:2px 0">⭐ ' + (p.rating || 4.5) + '/5 — ' + p.reviews + ' customers loved this saree 💜</p>'
        : '<p class="small" style="font-weight:800;color:var(--green);margin:2px 0">✅ COD Available • 7-day replacement • 2,300+ happy customers — order risk-free!</p>'));
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
  window.__pdGallery = gallery;   /* 📄 full-screen gallery source */
  window.__pdGalIdx = 0;
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
          '<tr><td>Occasion</td><td>' + esc(/wedding|bridal|kanchipuram/.test(p.cat || '') ? 'Wedding & Festive' : /party|fancy/.test(p.cat || '') ? 'Party & Function' : /office/.test(p.cat || '') ? 'Office & Daily' : 'Daily, Casual & Festive') + '</td></tr>' +
          '<tr><td>SKU</td><td>' + esc(p.sku || p.id) + '</td></tr>' +
          '<tr><td>Stock</td><td>' + (p.stock > 0 ? (p.stock <= 5 ? '<span style="color:var(--red)">Only ' + p.stock + ' left!</span>' : p.stock + ' in stock') : 'Out of stock') + '</td></tr>' +
        '</table><p style="margin-top:8px">' + esc(p.desc) + '</p></div>' +
      '</div>' +
      '<div class="pd-info">' +
        '<span class="pd-cat">' + (cat ? cat.emoji + ' ' + esc(cat.name) : '') + '</span>' +
        '<h1>' + esc(smartTitle(p)) + '</h1>' +
        starsHTML(p) +
        /* 💰 CLEAN PRICE — struck MRP → big price → % off (that's all) */
        '<div class="pd-price">' + (p.mrp ? '<s class="old-price">' + money(p.mrp) + '</s>' : '') + '<b>🔥 ' + money(p.price) + '</b>' + (off && !out ? '<span class="off">' + off + '% OFF</span>' : '') + '</div>' +
        /* 🛡️ trust chips — right under the price (kills hesitation instantly) */
        '<div class="pd-trust"><span>🚚 Fast Delivery</span><span>💵 COD Available</span><span>↩️ 7-Day Replacement</span><span>🔒 Secure UPI</span></div>' +
        /* 💵 ONE clear line — no math for the customer (COD charge + delivery time) */
        '<div class="pd-ship">💵 <b>COD Available</b> — booking ₹' + CONFIG.codFee + ' only • 🚚 Delivery <b>2–5 days</b> • 🚚 FREE above ₹' + (CONFIG.shipFreeAbove || 999) + '</div>' +
        (out
          ? '<div class="lowchip out" style="margin:6px 0">😮 <b>Out of stock</b> — ask us on WhatsApp, next batch arriving soon!</div>'
          : low
            ? '<div class="lowchip" style="margin:6px 0">🔥 <b>Only ' + p.stock + ' left</b> — order soon, stock is limited!</div>'
            : '') +
        /* 🟢 BUY NOW — the hero CTA (price ON the button), WhatsApp right under */
        '<div class="pd-btns">' +
          (out
            ? '<button type="button" class="btn btn-xl" data-notify="' + p.id + '">🔔 Notify Me When Back in Stock</button>'
            : '<a class="btn btn-buygreen btn-xl" id="pdBuyBtn" data-buy="' + esc(p.id) + '" href="checkout.html?buy=' + encodeURIComponent(p.id) + '&qty=1">🛒 BUY NOW — ' + money(p.price) + '</a>') +
          '<a class="btn btn-wa btn-xl" href="' + waLink(waProductMsg(p)) + '" target="_blank" rel="noopener">' + SVG_WA + loc('WhatsApp Order — Instant Confirmation', 'WhatsApp ఆర్డర్ — వెంటనే కన్ఫర్మేషన్', 'WhatsApp ಆರ್ಡರ್ — ತಕ್ಷಣ ದೃಢೀಕರಣ', 'WhatsApp Order — Instant Confirmation') + '</a>' +
        '</div>' +
        /* 📸 real photo / video — kills the #1 saree hesitation (colour) */
        '<div class="pd-realphoto"><div class="prp-txt"><b>📸 ' + loc('இந்த சேலையின் Real Photo / Video வேண்டுமா?', 'ఈ చీర నిజమైన ఫోటో / వీడియో కావాలా?', 'ಈ ಸೀರೆಯ ನಿಜವಾದ ಫೋಟೋ / ವೀಡಿಯೋ ಬೇಕಾ?', 'Want Real Photos / Video of this saree?') + '</b><small>' + loc('WhatsApp-ல் கேளுங்கள் — உடனே அனுப்புகிறோம்!', 'WhatsApp లో అడగండి — వెంటనే పంపుతాము!', 'WhatsApp ನಲ್ಲಿ ಕೇಳಿ — ತಕ್ಷಣ ಕಳುಹಿಸುತ್ತೇವೆ!', 'Ask on WhatsApp — we send it right away!') + '</small></div>' +
          '<a class="btn btn-maroon" href="' + waLink('📸 Hi! இந்த saree-ன் real photo/video வேணும்:\n\n🪡 ' + smartTitle(p) + '\n🏷️ SKU: ' + esc(p.sku || p.id) + '\n💰 ' + money(p.price) + '\n👉 ' + shareUrl(p) + '\n\nஅனுப்புங்க 🙏') + '" target="_blank" rel="noopener">💬 ' + loc('GET REAL PHOTO', 'రియల్ ఫోటో పొందండి', 'ರಿಯಲ್ ಫೋಟೋ ಪಡೆಯಿರಿ', 'GET REAL PHOTO') + '</a></div>' +
        /* secondary row — Add to Cart + 💰 Share & Earn (clean: no heart/share/colour clutter) */
        '<div class="pd-secondary">' +
          (out ? '' : '<button type="button" class="btn btn-outline" data-add="' + p.id + '">🛒 ' + loc('Add to Cart', 'வண்டியில் சேர்', 'Add to Cart', 'Add to Cart') + '</button>') +
          '<a class="btn btn-outline" href="share-earn.html">💰 ' + loc('Share & Earn ' + (CONFIG.resellerMarginPct || 5) + '%', 'Share & Earn ' + (CONFIG.resellerMarginPct || 5) + '%', 'Share & Earn ' + (CONFIG.resellerMarginPct || 5) + '%', 'Share & Earn ' + (CONFIG.resellerMarginPct || 5) + '%') + '</a>' +
          '<button type="button" class="btn btn-outline" data-share-wa="' + esc(p.id) + '" aria-label="Share on WhatsApp with photo">📢 ' + loc('பகிர்', 'தேலிகீ', 'லோ஗னு', 'Share') + '</button>' +
        '</div>' +
        '<input type="hidden" id="pdSelColour" value="' + esc((p.colors || [])[0] || '') + '">' +
        '<div class="qty-row"><b>Quantity</b><div class="qty"><button type="button" data-qm>−</button><span id="qtyVal">1</span><button type="button" data-qp>+</button></div><b id="qtyTotal" style="color:var(--maroon);font-size:1.1rem;margin-left:auto">' + money(p.price) + '</b></div>' +
        '<div class="pin-check"><b>📍 Check Delivery</b>' +
          '<div style="display:flex;gap:8px;margin-top:6px;align-items:stretch"><input id="pinCheck" placeholder="Enter PIN code (e.g. 636001)" inputmode="numeric" maxlength="6" style="flex:1;min-width:0;width:auto;border:1.5px solid var(--line);border-radius:10px;padding:0 14px;font-size:16px;background:#fff;outline:none;min-height:50px;box-sizing:border-box"><button type="button" class="btn btn-maroon btn-sm" id="pinCheckBtn" style="flex:0 0 auto;width:auto;min-width:120px;min-height:50px;padding:0 16px;font-size:.95rem;white-space:nowrap">Check</button></div>' +
          '<p class="small muted" id="pinResult" style="margin-top:6px"></p></div>' +
        '<div class="pd-block" style="margin-top:14px"><h3>💬 Reviews &amp; Comments</h3>' + revs +
          '<div class="rev-form" style="background:var(--bg);border:1px dashed var(--line);border-radius:12px;padding:13px;margin-top:12px;display:grid;gap:9px">' +
            '<b>✍️ Write a review</b>' +
            '<input id="rvName" placeholder="Your name" maxlength="40" style="width:100%;border:1.5px solid var(--line);border-radius:10px;padding:11px 12px;font-size:16px;background:#fff;outline:none">' +
            '<select id="rvStars" style="width:100%;border:1.5px solid var(--line);border-radius:10px;padding:11px 12px;font-size:16px;background:#fff;outline:none"><option value="5">★★★★★ Excellent</option><option value="4">★★★★☆ Very good</option><option value="3">★★★☆☆ Good</option><option value="2">★★☆☆☆ Average</option><option value="1">★☆☆☆☆ Poor</option></select>' +
            '<textarea id="rvText" rows="2" placeholder="Share your experience…" maxlength="300" style="width:100%;border:1.5px solid var(--line);border-radius:10px;padding:11px 12px;font-size:16px;background:#fff;outline:none;resize:vertical"></textarea>' +
            /* 📷 photo review — compressed on her phone, saved with the review
               (works on ANY static host: GitHub Pages, InfinityFree, Netlify…) */
            '<label class="rv-photo-btn" id="rvPhotoLbl" for="rvPhoto">📷 ' + loc('போட்டோ சேர் (விருப்பம்)', 'ఫోటో జోడించండి (ఆప్షనల్)', 'ಫೋಟೋ ಸೇರಿಸಿ (ಐಚ್ಛಿಕ)', 'Add Photo (optional)') + '</label>' +
            '<input id="rvPhoto" type="file" accept="image/*" style="display:none" onchange="attachReviewPhoto(this)">' +
            '<button type="button" class="btn btn-maroon btn-sm" data-comment="' + p.id + '">✍️ Post Comment</button>' +
          '</div></div>' +
        /* 💰 SIMPLE Share & Earn — after reviews; codes/links hidden (auto on click) */
        '<div class="earn-box" id="earnBox" style="margin-top:14px">' +
          '<b>💰 ' + loc('இந்த சேலையை Share பண்ணி ' + (CONFIG.resellerMarginPct || 5) + '% சம்பாதிங்க!', 'ఈ చీರನು షేರ్ చేಸಿ ' + (CONFIG.resellerMarginPct || 5) + 'సంపాదించండి!', 'ಈ ಸೀರೆಯನ್ನು ಹಂಚಿ ' + (CONFIG.resellerMarginPct || 5) + 'ಸಂಪಾದಿಸಿ!', 'Share this saree & Earn ' + (CONFIG.resellerMarginPct || 5) + '%') + '</b>' +
          '<p class="small" style="margin-top:3px">' + loc('உங்க friends இந்த link மூலம் order செய்தால் நீங்க ' + (CONFIG.resellerMarginPct || 5) + '% commission. Friend-க்கு SHARE5 code-ல் 5% OFF! Link share செய்யும்போது automatic-ஆ generate ஆகும் 🔗', 'Friends order via this link → you earn commission. Friend gets 5% OFF (code SHARE5)!', 'Friends order via this link → you earn commission. Friend gets 5% OFF (code SHARE5)!', 'Friends order via your link → you earn ' + (CONFIG.resellerMarginPct || 5) + '% commission. Friend gets 5% OFF (code SHARE5). Your link generates automatically 🔗') + '</p>' +
          '<button type="button" class="btn btn-wa" id="earnWa" style="margin-top:9px">' + SVG_WA + '📲 ' + loc('Share on WhatsApp', 'WhatsApp లో షేರ్ చేయి', 'WhatsApp ನಲ್ಲಿ ಹಂಚು', 'Share on WhatsApp') + '</button>' +
        '</div>' +
        
      '</div>' +
    '</div>' +
    '<div class="wrap" id="recSection"></div>' +
    '<div class="sticky-bar">' +
      '<div class="sb-price" id="sbPrice"><b>' + money(p.price) + '</b><small>' + off + '% off</small></div>' +
      '<a class="btn btn-buy" id="sbBuy" href="checkout.html?buy=' + encodeURIComponent(p.id) + '&qty=1">⚡ Buy at ' + money(onlinePrice(p)) + '</a>' +
      '<button type="button" class="btn btn-maroon sb-add" data-add="' + p.id + '" aria-label="Add to Cart" title="Add to Cart"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button>' +
      '<a class="btn btn-wa" href="' + waLink(waProductMsg(p)) + '" target="_blank" rel="noopener" aria-label="Order on WhatsApp"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true" style="vertical-align:-2px;margin-right:4px"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></a>' +
    '</div>';
  document.title = p.name + ' — SK Sarees';
  try{ trackRecentView(p); }catch(e){}
  /* ⏱️ dwell-time signal: remember WHEN she opened this saree — flushed on
     leave/hidden so the taste engine knows which sarees she STUDIED */
  try{ window.__pdpStart = Date.now(); window.__pdpId = p.id; }catch(e){}
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
    /* 🔗 registered → one-tap share (link + coupon auto-generate).
       Unregistered → straight to the Share & Earn registration page. */
    if (earnWa){
      if (myResellerCode()){
        earnWa.addEventListener('click', () => shareEarnProduct(p));
      } else {
        earnWa.textContent = '🚀 ' + loc('Register & Start Earning →', 'பதிவு பண்ணி ஈன் செய்யத் தெவைக்க →', 'ರೆಜಿಸ್ಟರ್ பண்ணி என் துவங்களுக்கு →', 'Register & Start Earning →');
        earnWa.addEventListener('click', () => { try{ location.href = 'profile.html'; }catch(e){} });   /* 🔗 💠 Get Your Personal Share Link section */
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
    if (sbBuy){ sbBuy.setAttribute('href', 'checkout.html?buy=' + encodeURIComponent(p.id) + '&qty=' + n); sbBuy.textContent = '🛒 BUY NOW — ' + money(p.price * n); }
    const pdBuy = document.getElementById('pdBuyBtn');
    if (pdBuy){ const _sel = document.getElementById('pdSelColour'); const _cv = (_sel && _sel.value) ? '&colour=' + encodeURIComponent(_sel.value) : ''; pdBuy.setAttribute('href', 'checkout.html?buy=' + encodeURIComponent(p.id) + '&qty=' + n + _cv); pdBuy.textContent = '🛒 BUY NOW — ' + money(p.price * n); }
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
    const rev = { name: name || 'Anonymous', rating: +stars, text, photo: (window.__revPhoto || ''), verified: !!(Store.profile && Store.profile.address && Store.profile.phone), date: Date.now() };
    list.push(rev); LS.set('sk_reviews_' + p.id, list);
    if (FS.enabled()) FS.saveReview(p.id, rev).catch(() => {});
    window.__revPhoto = '';
    toast('✅ Thank you! Review posted');
    renderProduct();
  }));
  /* 📡 reviews + photos from ALL customers (Firestore — one read) */
  try{ loadRemoteReviews(p); }catch(e){}

}

/* ============================ 📷 PHOTO REVIEW ============================
   Works on ANY static host (GitHub Pages too!): her photo is compressed ON
   HER PHONE via canvas (~640px, ~60-80KB base64) and stored with the review
   (device + Firestore doc). No server, no storage bucket, no uploads. */
/* one review card — used for local AND Firestore reviews.
   ✅ "Verified customer" badge ONLY for reviews from address-saved users. */
function revCardHTML(r){
  try{
    const verified = !!(r && r.verified);
    return '<div class="rev" style="margin-bottom:8px"><div class="rev-top"><span class="avatar" style="background:#8f1d3a">' + esc((r.name || 'A')[0]) + '</span><div><b>' + esc(r.name || 'Anonymous') + '</b><small>' +
      (verified ? '\u2705 Verified customer' : loc('\u0bb5\u0bbe\u0b9f\u0bbf\u0b95\u0bcd\u0b95\u0bc8\u0baf\u0bbe\u0bb3\u0bb0\u0bcd \u0bb0\u0bbf\u0bb5\u0bcd\u0baf\u0bc2', '\u0c15\u0c38\u0c4d\u0c1f\u0c2e\u0c30\u0c4d \u0c30\u0bbf\u0bb5\u0bcd\u0baf\u0bc2', '\u0c97\u0ccd\u0cb0\u0bbe\u0cb9\u0c95 \u0cb5\u0cbf\u0cae\u0cb0\u0ccd\u0cb6\u0cc6', 'Customer review')) +
      '</small></div></div><div class="stars">' + '\u2605'.repeat(r.rating || 5) + '\u2606'.repeat(5 - (r.rating || 5)) + '</div><p>' + esc(r.text || '') + '</p>' +
      (r.photo ? '<span class="rev-photo" role="button" data-revphoto="1" title="Customer photo \u2014 tap to view"><img src="' + r.photo + '" alt="customer photo" onload="imgLoaded(this)" style="width:88px;height:88px;object-fit:cover;border-radius:12px;border:2px solid #e8c66a;display:block;margin-top:7px;box-shadow:0 3px 9px rgba(61,10,27,.14)"></span>' : '') +
      '</div>';
  }catch(e){ return ''; }
}
/* \U0001F4E1 Firestore reviews (+photos) — they show for EVERYONE on ANY device
   (that was the missing piece: photos only lived on the poster's phone).
   One small query per product page view. */
function loadRemoteReviews(p){
  try{
    if (!FS.enabled()) return;
    FS.getProductReviews(p.id, 12).then(list => {
      try{
        const box = document.getElementById('remoteRevs');
        if (!box || !list || !list.length) return;
        const local = LS.get('sk_reviews_' + p.id, []);
        const seen = new Set(local.map(r => (r.name || '') + '|' + (r.text || '')));   /* don't repeat her own */
        const fresh = list.filter(r => r && r.text && !seen.has((r.name || '') + '|' + (r.text || ''))).slice(0, 8);
        if (fresh.length) box.innerHTML = fresh.map(revCardHTML).join('');
      }catch(e){}
    }).catch(() => {});
  }catch(e){}
}
let __revPhoto = '';
function attachReviewPhoto(input){
  try{
    const f = (input.files || [])[0];
    if (!f) return;
    if (!/^image\//.test(f.type || '')){ toast('⚠️ Images only'); input.value = ''; return; }
    const rd = new FileReader();
    rd.onload = () => {
      const img = new Image();
      img.onload = () => {
        try{
          const MAX = 640;
          const sc = Math.min(1, MAX / Math.max(img.width, img.height));
          const cv = document.createElement('canvas');
          cv.width = Math.max(1, Math.round(img.width * sc));
          cv.height = Math.max(1, Math.round(img.height * sc));
          cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
          __revPhoto = cv.toDataURL('image/jpeg', 0.72);
          window.__revPhoto = __revPhoto;
          const lbl = document.getElementById('rvPhotoLbl');
          if (lbl) lbl.innerHTML = '✅ ' + loc('போட்டோ ரெடி!', 'ఫోటో ready!', 'ಫೋಟೋ ready!', 'Photo ready!') + '<img class="rv-preview" src="' + __revPhoto + '" alt="preview">';
          toast('📷 ' + loc('போட்டோ ரெடி!', 'ఫోటో ready!', 'ಫೋಟೋ ready!', 'Photo ready!'));
        }catch(e){ toast('⚠️ ' + loc('போட்டோ சேர்க்க முடியவில்லை', 'ఫోటో జోడించలేకపోయాము', 'ಫೋಟೋ ಸೇರಿಸಲಾಗಲಿಲ್ಲ', 'Could not add photo')); }
      };
      img.onerror = () => { toast('⚠️ ' + loc('இந்த போட்டோ format support இல்லை — JPG-ஆ மாற்றி அனுப்புங்கள்', 'ఈ ఫోటో ఫార్మాట్ సపోర్ట్ లేదు — JPG గా మార్చి పంపండి', 'ಈ ಫೋಟೋ ಸಪೋರ್ಟ್ ಆಗುವುದಿಲ್ಲ — JPG ಆಗಿ ಬದಲಾಯಿಸಿ ಕಳುಹಿಸಿ', 'This photo format is not supported — please send as JPG')); };
      img.src = rd.result;
    };
    rd.readAsDataURL(f);
  }catch(e){ toast('⚠️ Photo error'); }
}

/* ============================ 🎬 INSTAGRAM REELS SHOWCASE ============================
   Beautiful reel-style cards for @sksarees_collection — vertical 9:16 tiles
   with play buttons that open the Instagram profile. Static-host friendly
   (no API, no embed script) + big Follow button. */
function instagramReelsHTML(){
  try{
    const url = CONFIG.social.instagram || 'https://www.instagram.com/sksarees_collection/';
    const covers = PRODUCTS.filter(p => !p.hidden).slice(0, 5);
    if (!covers.length) return '';
    return '<section class="sec"><div class="sec-head"><h2><span class="tick"></span>🎬 ' +
      loc('Instagram Reels — சேலை வீடியோக்கள்', 'Instagram Reels — చీర వీడియోలు', 'Instagram Reels — ಸೀರೆ ವೀಡಿಯೊಗಳು', 'Instagram Reels — Saree Videos') + '</h2>' +
      '<a href="' + esc(url) + '" target="_blank" rel="noopener">@sksarees_collection →</a></div>' +
      '<div class="ig-wrap">' +
        '<a class="ig-card ig-profile" href="' + esc(url) + '" target="_blank" rel="noopener">' +
          '<div class="ig-ava">🧵</div>' +
          '<b>@sksarees_collection</b>' +
          '<small>' + loc('புது சேலை reels எல்லாம் இங்கே — follow பண்ணுங்க!', 'కొత్త చీర reels అన్నీ ఇక్కడ — follow చేయండి!', 'ಹೊಸ ಸೀರೆ reels ಎಲ್ಲಾ ಇಲ್ಲಿ — follow ಮಾಡಿ!', 'All new saree reels here — follow us!') + '</small>' +
          '<span class="ig-follow">📸 Follow</span>' +
        '</a>' +
        covers.map(p => '<a class="ig-card ig-reel" href="' + esc(url) + '" target="_blank" rel="noopener" aria-label="Watch saree reels on Instagram">' +
          '<img src="' + esc(p.img) + '" alt="saree reel" loading="lazy" onerror="imgSafe(this)" onload="imgLoaded(this)">' +
          '<span class="ig-play">▶</span>' +
          '<span class="ig-tag">▶ ' + loc('Reel பார்', 'Reel చూడు', 'Reel ನೋಡು', 'Watch Reel') + '</span>' +
        '</a>').join('') +
      '</div></section>';
  }catch(e){ return ''; }
}

/* ============================ SHARE (WhatsApp family/group + Status) ============================ */
/* share the product to ANY WhatsApp chat / family group — user picks the recipient */
/* 💰 SHARE & EARN — one tap: shares the saree photo + her referral link
   (auto ?ref=CODE if she has one) + the friend coupon. Nothing technical
   is shown on the page — everything generates on click. */
async function shareEarnProduct(p){
  if (!p) return;
  try{
    const url = shareUrl(p);   /* carries ?ref=CODE automatically when she has one */
    const msg = loc(
      '\U0001F338 ' + p.name + '\n\U0001F4B0 \u0bb5\u0bbf\u0bb2\u0bc8: ' + money(p.price) + '\n\U0001F381 \u0b89\u0b99\u0bcd\u0b95\u0bb3\u0bc1\u0b95\u0bcd\u0b95\u0bc1 5% OFF \u2014 Code: ' + CONFIG.resellerCoupon + '!\n\U0001F69A \u20B9999+ \u0b87\u0bb2\u0bb5\u0b9a \u0b9f\u0bc6\u0bb2\u0bbf\u0bb5\u0bb0\u0bbf \u2022 COD & UPI\n\n\U0001F449 ' + url,
      '\U0001F338 ' + p.name + '\n\U0001F4B0 Price: ' + money(p.price) + '\n\U0001F381 Get 5% OFF \u2014 Code: ' + CONFIG.resellerCoupon + '!\n\U0001F69A FREE delivery above \u20B9999 \u2022 COD & UPI\n\n\U0001F449 ' + url,
      '\U0001F338 ' + p.name + '\n\U0001F4B0 Price: ' + money(p.price) + '\n\U0001F381 Get 5% OFF \u2014 Code: ' + CONFIG.resellerCoupon + '!\n\U0001F69A FREE delivery above \u20B9999 \u2022 COD & UPI\n\n\U0001F449 ' + url,
      '\U0001F338 ' + p.name + '\n\U0001F4B0 Price: ' + money(p.price) + '\n\U0001F381 Get 5% OFF with code ' + CONFIG.resellerCoupon + '!\n\U0001F69A FREE delivery above \u20B9999 \u2022 COD & UPI\n\n\U0001F449 ' + url);
    try{
      if (navigator.share){
        let file = null;
        try{
          const imgUrl = p.img || ((p.images || [])[0]);
          if (navigator.canShare && imgUrl){
            const blob = await fetchImageBlob(imgUrl);   /* 🖼️ proxy-backed — googleusercontent-safe */
            if (blob && blob.size && blob.size < 4.5e6) file = new File([blob], 'sk-saree.jpg', { type: blob.type || 'image/jpeg' });
          }
        }catch(e2){}
        const payload = { title: p.name, text: msg, url };
        if (file && navigator.canShare({ files: [file] })) payload.files = [file];
        navigator.share(payload).then(() => {}, () => { try{ window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank', 'noopener'); }catch(e3){} });
        return;
      }
    }catch(e){}
    try{ window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank', 'noopener'); }catch(e){}
  }catch(e){}
}
async function shareWaProduct(p){
  if (!p) return;
  const msg = '🛍️ Guess what I found on SK Sarees website!\n\n' + waProductMsg(p) +
    '\n\n📢 Share with your family & friends — they will love this saree too! Visit www.sksaree.shop for more 😍';
  /* 🖼️ photo + link together via the native share sheet (image lands in WhatsApp) */
  try{
    if (navigator.share){
      let file = null;
      try{
        const imgUrl = p.img || ((p.images || [])[0]);
        if (navigator.canShare && imgUrl){
          const blob = await fetchImageBlob(imgUrl);   /* 🖼️ proxy-backed — googleusercontent-safe */
          if (blob && blob.size && blob.size < 4.5e6) file = new File([blob], 'sk-saree.jpg', { type: blob.type || 'image/jpeg' });
        }
      }catch(e2){}
      const payload = { title: p.name, text: msg, url: productUrl(p) };
      if (file && navigator.canShare({ files: [file] })) payload.files = [file];
      navigator.share(payload).then(() => {}, () => { try{ window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank', 'noopener'); }catch(e3){} });
      return;
    }
  }catch(e){}
  try{ window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank', 'noopener'); }catch(e){}
}
/* 📢 VIRAL share — sends the saree to WhatsApp GROUPS with a viral caption AND
   THE PRODUCT PHOTO (image goes into the chat — Web Share API files). Falls
   back to text+link share, then wa.me link. Works on mobile + desktop. */
async function viralShareProduct(p){
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
  /* 🖼️ attach the actual saree photo — WhatsApp chat-ல image-um share ஆகும் */
  let file = null;
  try{
    const imgUrl = p.img || ((p.images || [])[0]);
    if (navigator.canShare && imgUrl){
      const blob = await fetchImageBlob(imgUrl);   /* 🖼️ proxy-backed — googleusercontent-safe */
      if (blob && blob.size && blob.size < 4.5e6){
        file = new File([blob], 'sk-saree.jpg', { type: blob.type || 'image/jpeg' });
      }
    }
  }catch(e){}
  /* 📱 native share sheet → customer picks any WhatsApp group/chat (never blocked) */
  try{
    if (navigator.share){
      const payload = { title: p.name, text: msg, url };
      if (file && navigator.canShare({ files: [file] })) payload.files = [file];
      navigator.share(payload).then(() => {}, () => {
        try{ window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank', 'noopener'); }catch(e2){}
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
      const blob = await fetchImageBlob(imgUrl);   /* 🖼️ proxy-backed — googleusercontent-safe */
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
      '<a class="btn btn-maroon" style="max-width:240px;margin:14px auto 0" href="shop.html">🛍️ Shop Sarees</a></div>' +
      likedSareesHTML(4) + recentViewHTML() + '</div>';
    return;
  }
  const t = cartTotal(), n = cartCount(), sh = shippingFor(t, '', n), short = Math.max(0, CONFIG.shipFreeAbove - t);
  const disc = couponDiscount(co.data.coupon, t);
  const bundle = bundleDiscount();               /* 2+ sarees → ₹50 off */
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
      '<p class="small" style="color:var(--green);font-weight:800;margin-top:6px">💳 Pay online (UPI) &amp; get ' + (CONFIG.onlineDiscount||1) + '% off — <b>save ' + money(Math.round(t * (CONFIG.onlineDiscount||1) / 100)) + '</b> on this order!</p>' +
      (n < (CONFIG.bundleCount || 2)
        ? '<div class="bundle-note">🎁 Buy ' + (CONFIG.bundleCount || 2) + ' sarees — get <b>₹' + (CONFIG.bundleOff || 0) + ' off</b> automatically!</div>'
        : '<div class="bundle-note" style="color:var(--green);border-color:#bfe6cf;background:#e9f7ef">🎉 Bundle deal applied! You saved <b>₹' + (CONFIG.bundleOff || 0) + '</b></div>') +
      '<p class="small muted" style="margin-top:8px">🚚 Shipping per saree: ₹30 Tamil Nadu · ₹40 Andhra/Karnataka · ₹60 others (' + n + ' saree' + (n > 1 ? 's' : '') + ' = <b>' + money(sh) + '</b>) · <b>FREE above ₹999</b>.</p>' +
      '<div style="display:grid;gap:10px;margin-top:14px">' +
        '<a class="btn btn-maroon btn-xl" href="checkout.html">Proceed to Checkout →</a>' +
        '<a class="btn btn-wa" href="' + waLink(waCartMsg()) + '" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true" style="vertical-align:-2px;margin-right:4px"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>Order on WhatsApp Instead</a>' +
      '</div>' +
    '</div>' + likedSareesHTML(4) + tastePicksHTML(4) + recentViewHTML() + '</div>';
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
      '<a class="btn btn-maroon" style="max-width:240px;margin:14px auto 0" href="shop.html">🛍️ Shop Sarees</a></div>' +
      likedSareesHTML(4) + recentViewHTML() + '</div>';
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
  /* 🖼️ fresh item lines with product thumbnails */
  const itemLines = coItems().map(i => { const p = byId(i.id); return p ? '<div class="rvw-item"><img src="' + esc(p.img) + '" alt="" loading="lazy" onerror="this.style.display=\'none\'"><span>' + esc(p.name) + (i.colour ? ' <small class="muted">(' + esc(i.colour) + ')</small>' : '') + ' ×' + i.qty + '</span><b>' + money(p.price * i.qty) + '</b></div>' : ''; }).join('');
  if (co.step === 1){
    app.innerHTML = '<div class="wrap page"><h1>🔒 Secure Checkout</h1>' + steps +
      '<div class="form-card"><h3>📋 Your Details <span class="muted small" style="font-weight:500">(no login needed)</span></h3>' +
        '<div class="field"><label>Full Name <span class="req">*</span></label><input id="coName" value="' + esc(d.name) + '" placeholder="e.g. Lakshmi S"></div>' +
        '<div class="field"><label>WhatsApp / Mobile <span class="req">*</span></label><input id="coPhone" value="' + esc(d.phone) + '" placeholder="10-digit mobile" inputmode="numeric" maxlength="10"></div>' +
        
        '<div class="field"><label>Address <span class="req">*</span></label><textarea id="coAddr" rows="3" placeholder="House no, street, area, city…">' + esc(d.address) + '</textarea></div>' +
        '<div class="field"><label>PIN Code <span class="req">*</span></label><input id="coPin" value="' + esc(d.pincode) + '" placeholder="6-digit PIN" inputmode="numeric" maxlength="6"></div>' +
        '<div class="field"><label>🎟️ Coupon Code (optional)</label><input id="coCoupon" value="' + esc(d.coupon || '') + '" placeholder="e.g. AADI10" style="text-transform:uppercase"></div>' +
        checkoutPerksHTML() +
      '</div>' +
      '<div id="coSummaryBox">' + coSummaryHTML() + '</div>' +
      '<div class="form-card"><h3>💳 Payment Method</h3><div class="pay-grid">' +
        '<div class="pay-opt ' + (d.payment === 'upi' ? 'on' : '') + '" data-pay="upi"><span class="po-ic" style="background:#e3f2fd">📲</span><span><b>UPI — Pay Online</b><small>GPay • PhonePe • Paytm</small></span><span class="radio"></span></div>' +
        '<div class="pay-opt ' + (d.payment === 'cod' ? 'on' : '') + '" data-pay="cod"><span class="po-ic" style="background:var(--gold-soft)">💵</span><span><b>Cash on Delivery</b><small>Pay at delivery — extra ₹' + CONFIG.codFee + '</small></span><span class="radio"></span></div>' +
      '</div></div>' +
      '<div class="delivery-card" style="margin-bottom:14px"><b>⏱ Fast Delivery</b>' + t.eta + '.<br>' + CONFIG.latePromise + '</div>' +
      (d.payment === 'cod'
        ? '<button type="button" class="btn btn-wa btn-xl" data-confirm-wa><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true" style="vertical-align:-2px;margin-right:4px"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>Confirm Order on WhatsApp</button>'
        : '<button type="button" class="btn btn-pay btn-xl" data-cont>⚡ Continue to Payment →</button>') +
    '</div>';
  } else {
    const upiPay = d.payment === 'upi';
    /* reserve an order id now so the UPI payment note can carry it */
    if (!co.pendingId) co.pendingId = genOrderId();
    const note = 'Order ' + co.pendingId + ' SK Sarees';
    const booking = CONFIG.codFee;                      /* COD: ₹70 booking paid now */
    app.innerHTML = '<div class="wrap page"><h1>🔒 Secure Checkout</h1>' + steps +
      '<div class="form-card rvw-card"><h3>🧾 Review Your Order</h3>' + itemLines +
        '<div class="row"><span>🧺 Items total</span><b>' + money(t.itemsTotal) + '</b></div>' +
        (t.discount > 0 ? '<div class="row"><span>🎫 Coupon discount (' + esc(co.data.coupon) + ')</span><b class="rvw-save">−' + money(t.discount) + '</b></div>' : '') +
        (t.bundle > 0 ? '<div class="row"><span>🎁 Bundle deal (2+ sarees)</span><b class="rvw-save">−' + money(t.bundle) + '</b></div>' : '') +
        (t.online > 0 ? '<div class="row"><span>💳 Online payment ' + (CONFIG.onlineDiscount||1) + '% off</span><b class="rvw-save">−' + money(t.online) + '</b></div>' : '') +
        '<div class="row"><span>🚚 Shipping</span><b class="' + (t.shipping ? '' : 'rvw-save') + '">' + (t.shipping ? money(t.shipping) : 'FREE') + '</b></div>' +
        (t.codFee ? '<div class="row"><span>💵 COD charges</span><b>+' + money(t.codFee) + '</b></div>' : '') +
        '<div class="rvw-meta">' +
          '<span>👤 ' + esc(d.name) + ' • ' + esc(d.phone) + '</span>' +
          '<span>📍 ' + esc(d.address) + ' — ' + esc(d.pincode) + '</span>' +
          '<span>⏱ ' + t.eta + '</span>' +
          '<span>' + (upiPay ? '📱 UPI — Pay Online' : '💵 Cash on Delivery (+₹' + CONFIG.codFee + ' booking paid)') + '</span>' +
        '</div>' +
        '<div class="rvw-total"><span>Total payable</span><b>' + money(t.grand) + '</b></div>' +
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
  /* ❤️ "{Name}'s Liked Sarees" + viewed strip at the bottom of checkout step 1
     (kept OFF step 2 — payment step stays distraction-free) */
  try{
    if (co.step === 1){
      const w = document.querySelector('#app .wrap.page');
      if (w) w.insertAdjacentHTML('beforeend', likedSareesHTML(4) + recentViewHTML());
    }
  }catch(e){}
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
/* 🔌 QR library lazy-loader — orders/profile pages don't include qrcode.min.js
   in their HTML, so load it on demand (same-origin file at the site root).
   Works on ANY page without editing the HTML files. */
function ensureQrLib(){
  return new Promise(res => {
    try{
      if (typeof qrcode !== 'undefined' || window.qrcode) return res(true);
      if (window.__qrLoading) return setTimeout(() => ensureQrLib().then(res), 180);
      window.__qrLoading = 1;
      const s = document.createElement('script');
      s.src = 'qrcode.min.js';
      s.onload = () => { window.__qrLoading = 0; res(!!(typeof qrcode !== 'undefined' || window.qrcode)); };
      s.onerror = () => { window.__qrLoading = 0; res(false); };
      document.head.appendChild(s);
    }catch(e){ res(false); }
  });
}
function drawPendingQrs(){
  try{
    const lib = typeof qrcode !== 'undefined' ? qrcode : window.qrcode;
    if (!lib){ ensureQrLib().then(ok => { if (ok) drawPendingQrs(); }); return; }
    document.querySelectorAll('[data-pendingqr]').forEach(box => {
      const o = Store.orders.find(x => x.id === box.dataset.pendingqr);
      if (!o) return;
      const q = lib(0, 'M');
      q.addData(upiLink((o.totals || {}).grand || 0, 'Order ' + o.id + ' SK Sarees'));
      q.make();
      box.innerHTML = q.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
    });
  }catch(e){}
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
    /* 🔑 AUTO-ACCOUNT: mobile = username, pincode = password */
    try{ Auth.autoCreate(order.customer.phone, order.customer.pincode); }catch(e2){}
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
    /* 🔑 AUTO-ACCOUNT: mobile = username, pincode = password */
    try{ Auth.autoCreate(order.customer.phone, order.customer.pincode); }catch(e2){}
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
      likedSareesHTML(4) + recentViewHTML() +
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
  /* 💳 UPI payment waiting? (customer tapped Continue to Payment but hasn't
     marked "I've Paid") → the QR + Pay block shows INSIDE this card, so she
     can finish paying right from the Orders tab. */
  const payWaiting = (o.payment === 'upi' && !o.paidConfirmed);
  const pill = payWaiting
    ? '<span class="status-pill status-paywait">💳 Payment Waiting</span>'
    : (o.payment === 'upi' && o.paidConfirmed && st === 'pending'
        ? '<span class="status-pill status-pending">⏳ Waiting Confirmation</span>'
        : '<span class="status-pill status-' + st + '">' + esc(st.replace('_', ' ')) + '</span>');
  return '<div class="order-card">' +
    '<div class="oc-top"><b>#' + o.id + '</b>' + pill + '</div>' +
    '<div class="oc-items">' + fmtDT(o.date) + ' • ' + money((o.totals || {}).grand || 0) + ' (' + (o.payment || '').toUpperCase() + ')<br>ETA: ' + esc((o.totals || {}).eta || 'Dispatch 12–24h') + '</div>' +
    statusTrack(o) +
    '<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">' +
    '<button type="button" class="btn btn-outline btn-sm" style="flex:1;min-width:130px" data-odetail="' + esc(o.id) + '">👁️ ' + (openDetailId === o.id ? 'Close Details' : 'View Order Details') + '</button>' +
    (payWaiting ? '<button type="button" class="btn btn-pay btn-sm" style="flex:1;min-width:130px" data-contpay="' + esc(o.id) + '">💳 Continue Payment</button>' : '') +
    '<button type="button" class="btn btn-maroon btn-sm" style="flex:1;min-width:130px" data-reorder="' + esc(o.id) + '">🔁 Order Again</button>' +
    '</div>' +
    (payWaiting ? '<div class="oc-paywrap">' + pendingPaymentHTML(o) + '</div>' : '') +
    '</div>';
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
  try{ drawPendingQrs(); }catch(e){}   /* 💳 QR codes for payment-waiting orders */
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
  app.innerHTML = '<div class="wrap page"><h1>👤 ' + (userName() ? esc(userName()) + loc(' சுயவிவரம்', ' ప్రొఫైల్', ' ಪ್ರೊಫೈಲ್', "'s Profile") : t('profile')) + '</h1>' +
    accountCardHTML() +
    personalProfileCardHTML() +
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
    '<div class="form-card"><h3>❤️ ' + likedSareesTitle() + ' (' + (Store.wish || []).length + ')</h3><div class="wish-grid" id="wishGrid"></div></div>' +
    '<div class="form-card"><h3>👀 ' + viewedSareesTitle() + '</h3><div class="prow" style="margin-top:4px">' + viewedCardsHTML(8) + '</div></div>' +
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
    /* 🔑 auto-account: mobile = username, pincode = password */
    try{ Auth.autoCreate(phone, pincode); }catch(e2){}
    try{ LS.set('sk_user_name', name); if (!LS.get('sk_member_since', 0)) LS.set('sk_member_since', Date.now()); }catch(e2){}   /* keep greeting name in sync */
    try{ renderHeader(); }catch(e2){}   /* "Vanakkam, {Name}" updates instantly */
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
/* 🔑 LOGIN — username = mobile number, password = pincode.
   Same login on any device → all her data (cart, wishlist, orders, points) merges. */
function openLoginModal(){
  const a = Auth.current();
  if (a){
    openModal('<div class="np-card">' +
      '<div class="np-emoji">🔑</div>' +
      '<h3 class="np-title">' + loc('கணக்கு செய்யப்பட்டது', 'ఖాతా సిద్ధం', 'ಖಾತೆ ಸಿದ್ಧ', 'Account') + '</h3>' +
      '<p class="np-sub">📱 <b>' + esc(a.phone.slice(0, 2) + '\u2022\u2022\u2022\u2022\u2022' + a.phone.slice(-3)) + '</b><br>' +
        loc('இந்த எண்ணில் எல்லா சாதனம் ஒன்றாக ஒன்று.', 'ఈ నంబర్‌లో అన్ని పరికరాలు ఒక్కటే.', 'ಈ ಸಂಖ್ಯೆಯಲ್ಲಿ ಎಲ್ಲಾ ಸಾಧನಗಳು ಒಂದೇ.', 'Same number → same data on every device.') + '</p>' +
      '<button type="button" class="btn btn-maroon btn-xl np-save" data-logout="1">🔓 ' + loc('வெளியேறு', 'లాగ్అవుట్', 'ಲಾಗ್ಅವುಟ್', 'Logout') + '</button>' +
    '</div>');
    return;
  }
  const pr = Store.profile || {};
  openModal(
    '<div class="np-card">' +
      '<div class="np-emoji">🔑</div>' +
      '<h3 class="np-title">SK Account</h3>' +
      /* 🔑 tabs: Login | Sign Up */
      '<div class="lg-tabs">' +
        '<button type="button" class="lg-tab on" id="lgTabIn">🔓 ' + loc('உள்நுழை', 'లాగిన్', 'ಲಾಗಿನ್', 'Login') + '</button>' +
        '<button type="button" class="lg-tab" id="lgTabUp">🆕 ' + loc('புது கணக்கு', 'కొత్త ఖాతా', 'ಹೊಸ ಖಾತೆ', 'Sign Up') + '</button>' +
      '</div>' +
      '<div id="lgIn">' +
        '<input id="lgPhone" class="np-input" value="' + esc(pr.phone || '') + '" placeholder="' + loc('மொபைல் எண் (username)', 'మొబైల్ నంబర్', 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ', 'Mobile number (username)') + '" inputmode="numeric" maxlength="10" autocomplete="off">' +
        '<input id="lgPin" class="np-input" placeholder="' + loc('பின்கோட் (password)', 'పిన్‌కోడ్ (password)', 'ಪಿನ್‌ಕೋಡ್ (password)', 'Pincode (password)') + '" inputmode="numeric" maxlength="6" autocomplete="off">' +
        '<button type="button" class="btn btn-maroon btn-xl np-save" id="lgGo">🔓 ' + loc('உள்ளேறு', 'లాగిన్', 'ಲಾಗಿನ್', 'Login') + '</button>' +
      '</div>' +
      '<div id="lgUp" style="display:none">' +
        '<input id="suName" class="np-input" value="' + esc(pr.name || '') + '" placeholder="' + loc('உங்க பெயர்', 'మీ పేరు', 'ನಿಮ್ಮ ಹೆಸರು', 'Your name') + '" autocomplete="off">' +
        '<input id="suPhone" class="np-input" value="' + esc(pr.phone || '') + '" placeholder="' + loc('மொபைல் எண்', 'మొబైల్ నంబర్', 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ', 'Mobile number') + '" inputmode="numeric" maxlength="10" autocomplete="off">' +
        '<input id="suPin" class="np-input" placeholder="' + loc('பின்கோட் (password)', 'పిన్‌కోడ్ (password)', 'ಪಿನ್‌ಕೋಡ್ (password)', 'Pincode (password)') + '" inputmode="numeric" maxlength="6" autocomplete="off">' +
        '<button type="button" class="btn btn-gold btn-xl np-save" id="suGo">🚀 ' + loc('கணக்கு உருவாக்கு', 'ఖాతా సృష్టించు', 'ಖಾತೆ ಸೃಷ್ಟಿಸಿ', 'Create Account') + '</button>' +
      '</div>' +
      '<button type="button" class="np-skip" data-close>' + loc('பிறகு', 'తర్వాత', 'ನಂತర', 'Later') + '</button>' +
    '</div>');
  /* 🔑 tab switching */
  const tabIn = document.getElementById('lgTabIn'), tabUp = document.getElementById('lgTabUp');
  const paneIn = document.getElementById('lgIn'), paneUp = document.getElementById('lgUp');
  const showTab = up => {
    if (tabIn) tabIn.classList.toggle('on', !up);
    if (tabUp) tabUp.classList.toggle('on', !!up);
    if (paneIn) paneIn.style.display = up ? 'none' : '';
    if (paneUp) paneUp.style.display = up ? '' : 'none';
  };
  if (tabIn) tabIn.addEventListener('click', () => showTab(false));
  if (tabUp) tabUp.addEventListener('click', () => showTab(true));
  /* 🔓 LOGIN */
  const go = document.getElementById('lgGo');
  const doLogin = async () => {
    const ph = (document.getElementById('lgPhone') || {}).value || '';
    const pn = (document.getElementById('lgPin') || {}).value || '';
    if (go){ go.textContent = '⏳ ' + loc('சரிபார்க்குகிறது…', 'చెక్ చేస్తున్నాం…', 'ಪರಿಶೀಲಿಸುತ್ತಿದ್ದೇವೆ…', 'Checking…'); go.disabled = true; }
    const r = await Auth.login(ph, pn);
    if (r.ok){
      closeModal();
      toast('✅ ' + loc('வணக்கம், ' + ((r.name || '').split(' ')[0] || '!') + '! உங்க டேட்டா இருக்கு 🎉', 'వెల్‌కమ్! మీ డేటా ఇక్కడ ఉంది 🎉', 'ವೆಲ್‌ಕಮ್! ನಿಮ್ಮ ಡೇಟಾ ಇಲ್ಲಿದೆ 🎉', 'Welcome back! Your data is here 🎉'));
      try{ rerenderPage(); }catch(e){ try{ location.reload(); }catch(e2){} }
    } else {
      toast('⚠️ ' + (r.msg || 'Login failed'));
      if (r.needSignup){ showTab(true); const sp = document.getElementById('suPhone'); if (sp && !sp.value) sp.value = ph.replace(/\D/g, ''); }   /* no account → straight to Sign Up */
      if (go){ go.textContent = '🔓 ' + loc('உள்ளேறு', 'లాగిన్', 'ಲಾಗಿನ್', 'Login'); go.disabled = false; }
    }
  };
  if (go) go.addEventListener('click', doLogin);
  const inp = document.getElementById('lgPin');
  if (inp) inp.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
  /* 🆕 SIGN UP (real Firestore account) */
  const su = document.getElementById('suGo');
  const doSignup = async () => {
    const nm = ((document.getElementById('suName') || {}).value || '').trim();
    const ph = ((document.getElementById('suPhone') || {}).value || '').replace(/\D/g, '');
    const pn = ((document.getElementById('suPin') || {}).value || '').trim();
    if (su){ su.textContent = '⏳ ' + loc('கணக்கு உருவாக்குகிறது…', 'ఖాతా సృష్టిస్తున్నాం…', 'ಖಾತೆ ಸೃಷ್ಟಿಸುತ್ತಿದ್ದೇವೆ…', 'Creating…'); su.disabled = true; }
    const r = await Auth.signup(nm, ph, pn);
    if (r.ok){
      closeModal();
      toast('🎉 ' + loc('கணக்கு தயார்! வணக்கம், ' + ((r.name || '').split(' ')[0] || '') + '!', 'ఖాతా సిద్ధం! వెల్‌కమ్!', 'ಖಾತೆ ಸಿದ್ಧ! ವೆಲ್‌ಕಮ್!', 'Account created! Welcome!'));
      try{ rerenderPage(); }catch(e){ try{ location.reload(); }catch(e2){} }
    } else {
      toast('⚠️ ' + (r.msg || 'Sign up failed'));
      if (su){ su.textContent = '🚀 ' + loc('கணக்கு உருவாக்கு', 'ఖాతా సృష్టించు', 'ಖಾತೆ ಸೃಷ್ಟಿಸಿ', 'Create Account'); su.disabled = false; }
    }
  };
  if (su) su.addEventListener('click', doSignup);
  const sin = document.getElementById('suPin');
  if (sin) sin.addEventListener('keydown', e => { if (e.key === 'Enter') doSignup(); });
}

/* 🔑 LOGIN / LOGOUT links — drawer, footer, profile & account card.
   (Global handler: tapping "🔑 Login" anywhere opens the login modal,
   "🔓 Sign Out" logs out and refreshes the page.) */
document.addEventListener('click', function(e){
  const lg = e.target.closest('[data-login]');
  if (lg){
    e.preventDefault();
    try{ closeDrawer(); }catch(err){}
    try{ openLoginModal(); }catch(err2){ console.warn(err2); }
    return;
  }
  const lo = e.target.closest('[data-logout]');
  if (lo){
    e.preventDefault();
    try{ Auth.logout(); }catch(err){}
    try{ closeDrawer(); }catch(err){}
    try{ closeModal(); }catch(err2){}
    toast('🔓 ' + loc('வெளியேறிவிட்டீர்கள்', 'లాగ్అవుట్ అయింది', 'ಲಾಗ್ಅವುಟ್ ಆಗಿದೆ', 'Logged out'));
    try{ rerenderPage(); }catch(err3){ try{ location.reload(); }catch(e4){} }
  }
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
  if (pending){
    e.preventDefault();
    const o = Store.orders.find(x => x.id === pending.dataset.confirmPending);
    if (!o) return;
    o.paidConfirmed = true;
    o.paymentMarkedAt = new Date().toISOString();
    Store.saveOrders();
    if (FS.enabled()) FS.saveOrder(o).catch(() => {});
    /* 💳 refresh the list (payment block disappears) + any open detail */
    try{ renderOrderList(); }catch(e2){}
    try{ drawPendingQrs(); }catch(e3){}
    showDetail(o);
    toast('✅ Payment confirmation sent to SK Sarees');
    return;
  }
  /* 💳 Continue Payment (orders tab) — scroll to the QR block & flash it */
  const cpay = e.target.closest('[data-contpay]');
  if (cpay){
    e.preventDefault();
    try{
      const card = cpay.closest('.order-card');
      const box = card && card.querySelector('.oc-paywrap');
      if (box){
        box.classList.add('oc-payflash');
        setTimeout(() => box.classList.remove('oc-payflash'), 2200);
        try{ box.scrollIntoView({ behavior: 'smooth', block: 'center' }); }catch(e4){ box.scrollIntoView(); }
      }
    }catch(e5){}
    return;
  }
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
  /* ❤️ reel LIKE — heart burst + local count */
  /* ❤️ reel LIKE — global Firestore count (all users see it) */
  const rl = e.target.closest('[data-rplike]');
  if (rl){
    e.preventDefault();
    try{
      const pid = rl.dataset.rplike;
      const reel = rl.closest('.rp-reel');
      const liked = !!LS.get('sk_reel_liked_' + pid, 0);
      setReelLike(pid, !liked, reel);
      if (!liked) toast('❤️ ' + loc('பிடிச்சிருக்க!', 'சూಪிଂசார்வு!', 'இಷ್ட!', 'Loved it!'));
    }catch(e2){}
    return;
  }
  /* 💬 reel COMMENTS — read & post real product reviews */
  const rc = e.target.closest('[data-rpcomment]');
  if (rc){ e.preventDefault(); reelCommentModal(byId(rc.dataset.rpcomment)); return; }
  /* 🔖 reel SAVE — bookmark to wishlist */
  /* 📥 reel SAVE — downloads the saree photo + wish as a greeting card */
  const rs = e.target.closest('[data-rpsave]');
  if (rs){
    e.preventDefault();
    try{
      const reel = rs.closest('.rp-reel');
      saveReelImage(byId(rs.dataset.rpsave), reel ? reel.dataset.q : '');
    }catch(e2){}
    return;
  }
  /* 📲 reel STATUS — full 9:16 WhatsApp status photo (share or download) */
  const rst = e.target.closest('[data-rpstatus]');
  if (rst){
    e.preventDefault();
    try{
      const reel = rst.closest('.rp-reel');
      saveReelStatus(byId(rst.dataset.rpstatus), reel ? reel.dataset.q : '');
    }catch(e2){}
    return;
  }
  /* 💰 reels EARN — register / dashboard modal (share & earn) */
  const rea = e.target.closest('[data-rpearn]');
  if (rea){
    e.preventDefault();
    try{ reelEarnModal(); }catch(e2){}
    return;
  }
  /* ✍️ post comment from the reel comment box */
  const rp2 = e.target.closest('[data-rpost]');
  if (rp2){
    e.preventDefault();
    try{
      const pid = rp2.dataset.rpost;
      const nm = (document.getElementById('rcName') || {}).value || 'Anonymous';
      const tx = (document.getElementById('rcText') || {}).value || '';
      if (!tx.trim()){ toast('✍️ ' + loc('முதல் கருத்தை எழுதுங்கள்', 'మొదట కామెంట్ రాయండి', 'ಮೊದಲು ಕಾಮೆಂಟ್ ಬರೆಯಿರಿ', 'write your comment first')); return; }
      const list = LS.get('sk_reviews_' + pid, []);
      const rev = { name: nm, rating: 5, text: tx.trim(), photo: '', verified: !!(Store.profile && Store.profile.address && Store.profile.phone), date: Date.now() };
      list.push(rev); LS.set('sk_reviews_' + pid, list);
      if (FS.enabled()) FS.saveReview(pid, rev).catch(() => {});
      toast('✅ ' + loc('நன்றி! கருத்து பதிவிடப்பட்டது', 'ధన్యవాదాలు! కామెంట్ పోస్ట్ అయింది', 'ಧನ್ಯವಾದಗಳು! ಕಾಮೆಂಟ್ ಆಯಿತು', 'Thank you! Comment posted'));
      reelCommentModal(byId(pid));   /* refresh list */
    }catch(e2){}
    return;
  }
  /* 📢 reel share (photo + wish + link) + reels up/down arrows */
  const rsh = e.target.closest('[data-reelshare]');
  if (rsh){
    e.preventDefault();
    const sec = rsh.closest('.rp-reel');
    shareReel(byId(rsh.dataset.reelshare), sec ? sec.dataset.q : '');
    return;
  }
  const rnav = e.target.closest('[data-rpnav]');
  if (rnav){
    e.preventDefault();
    const wrap = document.getElementById('rpWrap');
    if (wrap){
      const h = wrap.clientHeight || 1;
      if (wrap.scrollBy) wrap.scrollBy({ top: (+rnav.dataset.rpnav) * h, behavior: 'smooth' });
      else wrap.scrollTop += (+rnav.dataset.rpnav) * h;
    }
    return;
  }
  /* 📢 share the whole website (banner image + link) */
  const sst = e.target.closest('[data-sharesite]');
  if (sst){ e.preventDefault(); shareSite(); return; }
  /* 📷 review photo → big zoom in a modal (data: URLs are blocked in new tabs) */
  const rp = e.target.closest('[data-revphoto]');
  if (rp){
    e.preventDefault();
    const im = rp.querySelector('img');
    if (im && im.src) openModal('<img src="' + im.src + '" alt="customer photo" style="width:100%;border-radius:14px;display:block">');
    return;
  }
  /* 💰 Share & Earn button (product page secondary row) — auto-generates her link */
  const sen = e.target.closest('[data-shareearn]');
  if (sen){ e.preventDefault(); shareEarnProduct(byId(sen.dataset.shareearn)); return; }
  /* ✨ AI Style Quiz (banner + chips + AI assistant) */
  const sqz = e.target.closest('[data-quiz]');
  if (sqz){ e.preventDefault(); openStyleQuiz(); return; }
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
      try{ window.__pdGalIdx = +thumb.dataset.thumb || 0; }catch(e2){}   /* 📄 remember which photo */
      document.querySelectorAll('[data-thumb]').forEach(b => b.classList.toggle('on', b === thumb));
    }
    return;
  }
  /* 📄 tap the big product photo → FULL-SCREEN gallery (swipe all photos) */
  if (e.target.id === 'pdMainImg'){
    e.preventDefault();
    const gal = (window.__pdGallery || []).slice();
    const start = Math.max(0, +window.__pdGalIdx || 0);
    openGalleryViewer(gal, start, e.target.alt || '');
    return;
  }
  /* gallery viewer arrows */
  const gvNav = e.target.closest('[data-gnav]');
  if (gvNav){
    e.preventDefault();
    const track = document.getElementById('gvTrack');
    if (track){
      const w = track.clientWidth || 1;
      if (track.scrollBy) track.scrollBy({ left: (+gvNav.dataset.gnav) * w, behavior: 'smooth' });
      else track.scrollLeft += (+gvNav.dataset.gnav) * w;
    }
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
    try{ const gv = document.getElementById('galViewer'); if (gv) gv.remove(); }catch(e2){} return;
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
