/* ============================================================================
   SK SAREES — AI-style "Similar Saree" Recommendation Engine (rec.js)
   ----------------------------------------------------------------------------
   Hybrid approach, runs 100% client-side (no backend needed on static hosts):
   · Content-based: weighted attribute similarity (fabric, color, design,
     occasion, price, work-type, blouse) — priority order per business spec.
   · Collaborative boost: your own view/order history ("users who viewed this
     also viewed…") + popular items, so personalization improves over time.
   · Cold-start safe: works for brand-new / Firestore-only products because it
     extracts attributes from name/desc/fabric/color keywords — no schema needed.
   · Fast: attributes are memoized once; fabric/color/occasion buckets narrow
     candidates to a few dozen before scoring; similarity can be precomputed.
   API:
     REC.attrs(p)                 → normalized attribute vector {fabric,color,…}
     REC.similarity(a, b)         → {score:0-100, reason:"…"}
     REC.recommendFor(p, n)       → [{id,name,img,price,score,reason},…] top-n
     REC.renderSimilar(p, el)     → renders the "✨ Similar Sarees" section
     REC.invalidate()             → clear memo/index (call after admin saves)
   ========================================================================== */
'use strict';

/* catalog version — bump via REC.invalidate() when products change */
let PRODUCTS_VERSION = 1;

const REC = (function(){
  /* ---------- 1. attribute extraction (keyword → normalized value) ---------- */
  const FABRIC_MAP = [
    [/kanjivaram|kanchi/i, 'kanjivaram'], [/banarasi|kadhwa/i, 'banarasi'],
    [/tussar/i, 'tussar'], [/chiffon/i, 'chiffon'], [/organza/i, 'organza'],
    [/georgette/i, 'georgette'], [/velvet/i, 'velvet'], [/net\b/i, 'net'],
    [/linen/i, 'linen'], [/silk/i, 'silk'], [/cotton/i, 'cotton'],
  ];
  const COLOR_MAP = [
    [/maroon|burgundy|wine|red/i, 'red'], [/pink|rose|magenta/i, 'pink'],
    [/emerald|green|peacock|teal|mint|sage/i, 'green'],
    [/navy|blue|turquoise|sky/i, 'blue'], [/purple|lavender|violet|grape/i, 'purple'],
    [/gold|yellow|mustard|ochre|antique/i, 'gold'], [/white|cream|ivory/i, 'white'],
    [/beige|brown|tan|taupe/i, 'brown'], [/black|grey|gray|charcoal/i, 'dark'],
    [/orange|peach|coral/i, 'orange'], [/champagne/i, 'champagne'], [/multi/i, 'multi'],
  ];
  const COMPLEMENTARY = {
    red:['gold','white','pink'], green:['gold','white','yellow'], blue:['white','silver','gold'],
    purple:['gold','silver','pink'], pink:['gold','white','purple'], gold:['red','green','maroon'],
    white:['gold','red','blue','pink'], brown:['gold','beige','green'], dark:['gold','white','red'],
    orange:['gold','white','brown'], champagne:['gold','white','pink'], multi:['gold','red','green'],
  };
  const DESIGN_MAP = [
    [/print|floral|flower|butta/i, 'printed'], [/stripe|check|checked|geometric|paisley/i, 'geometric'],
    [/embroider|zardozi|thread work/i, 'embroidered'], [/sequin|stone|pearl|bead|mirror/i, 'embellished'],
    [/temple|zari border|border heavy|brocade/i, 'zari'], [/plain|minimal|solid/i, 'plain'],
    [/traditional|motif|classic/i, 'traditional'], [/designer|contemporary|modern/i, 'contemporary'],
  ];
  const WORK_MAP = [
    [/zari|kanjivaram|banarasi|kadhwa|brocade/i, 'zari'], [/sequin/i, 'sequin'],
    [/stone|gem|kundan/i, 'stone'], [/pearl/i, 'pearl'], [/embroider|thread/i, 'embroidery'],
    [/lace/i, 'lace'], [/print/i, 'print'],
  ];
  const OCC_MAP = [
    [/bridal|wedding|bride|engagement/i, 'wedding'], [/party|cocktail|evening/i, 'party'],
    [/office|formal|work/i, 'office'], [/festival|puja|aadi|pongal|diwali/i, 'festival'],
    [/daily|casual|everyday/i, 'casual'],
  ];
  const CAT_OCC = {
    'wedding':'wedding','bridal-sarees':'wedding','party':'party','fancy':'party','designer':'party',
    'office':'office','daily':'casual','printed':'casual','cotton':'casual','kids':'casual',
    'kanchipuram':'festival','silk':'festival','soft-silk':'festival','gayathri-silk':'festival',
    'samuthrika':'festival','half-saree':'festival','georgette':'party','men-dhoti':'casual',
    'blouse':'casual','accessories':'casual',
  };

  function firstMatch(text, map){
    for (const [re, val] of map) if (re.test(text)) return val;
    return '';
  }
  function fam(p, map, keys){
    const src = keys.map(k => p && p[k]).filter(Boolean).join(' ').toLowerCase();
    return firstMatch(src, map);
  }
  /* color family: check the array first, then the joined color string */
  function colorFam(p){
    const arr = (Array.isArray(p.colors) && p.colors.length) ? p.colors : [p.color || ''];
    for (const c of arr){ const f = firstMatch(String(c), COLOR_MAP); if (f) return f; }
    return firstMatch(String(p.color || ''), COLOR_MAP) || 'multi';
  }
  /* price band: cheap < 700 · mid 700–1400 · premium 1400–2200 · luxury > 2200 */
  function priceBand(price){
    if (price < 700) return 'cheap';
    if (price < 1400) return 'mid';
    if (price < 2200) return 'premium';
    return 'luxury';
  }
  function occ(p){
    const kw = fam(p, OCC_MAP, ['name','desc']);
    return kw || CAT_OCC[p.cat] || 'casual';
  }
  function design(p){
    return fam(p, DESIGN_MAP, ['name','desc','border','badge']) || 'plain';
  }
  function work(p){
    return fam(p, WORK_MAP, ['name','desc','border']) || 'plain';
  }
  function fabric(p){
    return fam(p, FABRIC_MAP, ['fabric','name','desc']) || 'other';
  }

  /* ---------- 2. memoized attribute vector ---------- */
  const attrCache = new Map();
  function attrs(p){
    if (!p || !p.id) return null;
    if (attrCache.has(p.id)) return attrCache.get(p.id);
    const a = {
      fabric: fabric(p), color: colorFam(p), design: design(p),
      occasion: occ(p), work: work(p),
      band: priceBand(+p.price || 0),
      price: +p.price || 0,
      blouse: String(p.blouse || '').toLowerCase(),
      rating: +p.rating || 0,
    };
    attrCache.set(p.id, a);
    return a;
  }

  /* ---------- 3. similarity scoring (0–100) with human reasons ---------- */
  /* weights per the business priority order */
  const W = { fabric: 30, color: 20, design: 15, occasion: 15, price: 10, work: 10 };
  const CLOSE_COLORS = ['gold','white','champagne'];

  function similarity(a, b){
    const reasons = [];
    let score = 0;

    /* 1) fabric (30) */
    if (a.fabric && a.fabric === b.fabric){
      score += W.fabric;
      reasons.push('Same ' + a.fabric + ' fabric');
    } else if (a.fabric && b.fabric && (a.fabric === 'silk' && b.fabric === 'kanjivaram' || b.fabric === 'silk' && a.fabric === 'kanjivaram' || a.fabric === 'silk' && b.fabric === 'banarasi' || b.fabric === 'silk' && a.fabric === 'banarasi')){
      score += Math.round(W.fabric * 0.6);
      reasons.push('Similar silk weave');
    }

    /* 2) color family (20) — same = full, complementary = 60% */
    if (a.color && a.color === b.color){
      score += W.color;
      reasons.push('Same ' + a.color + ' colour family');
    } else if (a.color && b.color){
      const comp = (COMPLEMENTARY[a.color] || []).indexOf(b.color) !== -1;
      const close = (CLOSE_COLORS.indexOf(a.color) !== -1 && CLOSE_COLORS.indexOf(b.color) !== -1);
      if (comp || close){
        score += Math.round(W.color * 0.6);
        reasons.push(a.color + ' & ' + b.color + ' go well together');
      }
    }

    /* 3) design type (15) */
    if (a.design && a.design === b.design){
      score += W.design;
      reasons.push('Same ' + a.design + ' design style');
    }

    /* 4) occasion (15) */
    if (a.occasion && a.occasion === b.occasion){
      score += W.occasion;
      reasons.push('Perfect for ' + a.occasion + ' occasions');
    }

    /* 5) price band (10) — full if same band, partial if within ±30% */
    if (a.band === b.band){
      score += W.price;
      reasons.push('Similar price range');
    } else if (a.price && b.price){
      const diff = Math.abs(a.price - b.price) / Math.max(a.price, b.price);
      if (diff <= 0.3){ score += Math.round(W.price * 0.6); reasons.push('In your budget'); }
    }

    /* 6) work type (10) */
    if (a.work && a.work === b.work && a.work !== 'plain'){
      score += W.work;
      reasons.push('Same ' + a.work + ' work');
    } else if (a.work === 'plain' && b.work === 'plain'){
      score += Math.round(W.work * 0.5);
    }

    /* bonus: blouse style mention */
    if (a.blouse && b.blouse && a.blouse === b.blouse) score += 2;

    return { score: Math.max(0, Math.min(100, Math.round(score))), reasons: reasons.slice(0, 2) };
  }

  /* ---------- 4. candidate narrowing + recommend ---------- */
  let index = null;
  function buildIndex(){
    index = { fabric: {}, color: {}, occ: {}, id: new Map() };
    PRODUCTS.forEach(p => {
      const a = attrs(p); if (!a) return;
      index.id.set(p.id, a);
      (index.fabric[a.fabric] = index.fabric[a.fabric] || []).push(p.id);
      (index.color[a.color] = index.color[a.color] || []).push(p.id);
      (index.occ[a.occasion] = index.occ[a.occasion] || []).push(p.id);
    });
  }
  function candidates(p){
    if (!index) buildIndex();
    const a = attrs(p); if (!a) return [];
    const seen = new Set();
    const ids = [];
    const add = list => (list || []).forEach(id => { if (id !== p.id && !seen.has(id)){ seen.add(id); ids.push(id); } });
    add(index.fabric[a.fabric]);
    add(index.color[a.color]);
    add(index.occ[a.occasion]);
    /* + same price band as a tiebreaker pool */
    PRODUCTS.forEach(x => { if (attrs(x) && attrs(x).band === a.band) add([x.id]); });
    return ids.slice(0, 80);
  }

  /* ---------- 5. collaborative history (view + order co-occurrence) ---------- */
  function historyBoost(p){
    let boost = 0;
    try{
      const viewed = JSON.parse(localStorage.getItem('sk_viewed') || '[]');
      /* co-viewed around this product → small boost */
      const idx = viewed.findIndex(v => v.id === p.id);
      if (idx >= 0){
        const near = viewed.slice(Math.max(0, idx - 8), idx + 8).map(v => v.id);
        return Math.min(4, near.filter(id => id !== p.id).length * 0.5);
      }
      /* popular items (ordered often) get a tiny nudge for new visitors */
      const orders = JSON.parse(localStorage.getItem('sk_orders') || '[]');
      const count = orders.reduce((s, o) => s + (o.items || []).filter(i => String(i.id) === String(p.id)).length, 0);
      boost += Math.min(3, count);
    }catch(e){}
    return boost;
  }

  /* ---------- 6. public API ---------- */
  function recommendFor(p, n){
    if (!p) return [];
    const a = attrs(p); if (!a) return [];
    /* client cache: repeat views are instant, no recompute (TTL 24h) */
    try{
      const key = 'sk_rec_' + p.id;
      const hit = localStorage.getItem(key);
      if (hit){
        const c = JSON.parse(hit);
        if (c && c.v === PRODUCTS_VERSION && c.t > Date.now() - 864e5) return c.items.slice(0, n || 8);
      }
    }catch(e){}
    const out = [];
    const cand = candidates(p);
    for (const id of cand){
      const x = byId(id); if (!x) continue;
      const s = similarity(a, attrs(x));
      const boosted = Math.min(100, s.score + historyBoost(x));
      out.push({ id, name: x.name, img: x.img, price: x.price, score: boosted, reason: s.reasons[0] || 'Popular choice' });
    }
    out.sort((x, y) => y.score - x.score || (y.rating || 0) - (x.rating || 0));
    const items = out.slice(0, n || 8);
    try{
      localStorage.setItem('sk_rec_' + p.id, JSON.stringify({ v: PRODUCTS_VERSION, t: Date.now(), items }));
    }catch(e){}
    return items;
  }

  /* ---------- 7. render the "✨ Similar Sarees" section ---------- */
  function renderSimilar(p, container){
    if (!container) return;
    const recs = recommendFor(p, 8);
    if (recs.length < 2){ container.innerHTML = ''; return; }
    container.innerHTML =
      '<section class="sec"><div class="sec-head"><h2><span class="tick"></span>✨ Similar Sarees</h2>' +
      '<span class="small muted">matched by fabric, colour, design &amp; budget</span></div>' +
      '<div class="prow">' + recs.map(r => {
        const prod = byId(r.id) || {};
        return '<article class="pcard rec-card">' +
          '<a class="pcard-img" href="product.html?id=' + encodeURIComponent(r.id) + '">' +
            '<img src="' + esc(r.img) + '" alt="' + esc(r.name) + '" loading="lazy" decoding="async" width="800" height="600">' +
            '<span class="match-chip">' + r.score + '% match</span>' +
          '</a>' +
          '<div class="pcard-body">' +
            '<h3><a href="product.html?id=' + encodeURIComponent(r.id) + '">' + esc(r.name) + '</a></h3>' +
            '<div class="price-row"><b>' + money(r.price) + '</b></div>' +
            (r.reason ? '<p class="match-reason">💡 ' + esc(r.reason) + '</p>' : '') +
            '<div class="p-actions">' +
              '<button type="button" class="btn btn-outline" data-add="' + esc(r.id) + '">Add to Cart</button>' +
              '<a class="btn btn-wa" href="' + waLink(waProductMsg(prod)) + '" target="_blank" rel="noopener" aria-label="Order on WhatsApp"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true" style="vertical-align:-2px"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></a>' +
            '</div>' +
          '</div></article>';
      }).join('') + '</div></section>';
  }

  /* ---------- 8. view tracking (feeds collaborative part) ---------- */
  function trackView(id){
    try{
      if (!id) return;
      let viewed = JSON.parse(localStorage.getItem('sk_viewed') || '[]');
      viewed = viewed.filter(v => v.id !== id);
      viewed.unshift({ id, t: Date.now() });
      localStorage.setItem('sk_viewed', JSON.stringify(viewed.slice(0, 60)));
    }catch(e){}
  }

  function invalidate(){ attrCache.clear(); index = null; try{ PRODUCTS_VERSION = PRODUCTS_VERSION + 1; }catch(e){} try{ const k = localStorage; const toRm = []; for (let i = 0; i < k.length; i++){ if (k.key(i).indexOf('sk_rec_') === 0) toRm.push(k.key(i)); } toRm.forEach(x => k.removeItem(x)); }catch(e){} }

  return { attrs, similarity, recommendFor, renderSimilar, trackView, invalidate };
})();
window.REC = REC;
