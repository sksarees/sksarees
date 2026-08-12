#!/usr/bin/env node
/* ============================================================================
   SK Sarees — product page + feed generator (run after updating catalog.json)
   ----------------------------------------------------------------------------
   node tools/generate-product-pages.js
   • generates product/<id>.html for every product — FULLY SELF-CONTAINED:
     style.css + data.js + rec.js + app.js are inlined into every page, so the
     page opens ANYWHERE (GitHub Pages, preview, offline, any host) — zero
     external files needed, instant load, never a blank page.
   • copies every product photo to product/<id>.jpg  (Google Merchant needs
     real image files at https://www.sksaree.shop/product/<sku>.jpg)
   • rewrites catalog.json img → product/<id>.jpg
   • regenerates products-feed.xml + google-merchant-feed.txt + sitemap.xml
   Upload the whole folder (incl. product/) to your host root.
   ========================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');

const SITE = (process.env.SITE_URL || 'https://www.sksaree.shop').replace(/\/+$/, '');
const ROOT = path.join(__dirname, '..');

const esc = s => String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const escT = v => String(v == null ? '' : v).replace(/\t/g, ' ').replace(/\n/g, ' ').replace(/\r/g, '');
const ext = { 'kanchipuram':'Kanchipuram Silk Sarees', 'bridal-sarees':'Bridal Sarees', 'silk-sarees':'Silk Sarees', 'soft-silk':'Soft Silk Sarees', 'cotton-silk':'Cotton Silk Sarees', 'handloom':'Handloom Cotton Sarees', 'printed':'Printed Cotton Sarees', 'georgette':'Georgette Sarees', 'party':'Party Wear Sarees', 'organza':'Organza Sarees', 'linen':'Linen Sarees', 'fancy':'Fancy Net Sarees', 'half-saree':'Half Sarees', 'kids':'Kids Sarees & Lehengas', 'dhoti':'Men Dhoti', 'blouse':'Blouse Material', 'accessories':'Accessories', 'daily':'Daily Wear Sarees', 'festival':'Festival Sarees', 'office':'Office Sarees', 'wedding':'Wedding Sarees' };

/* ---------- inline assets (read once) ---------- */
const CSS  = fs.readFileSync(path.join(ROOT, 'style.css'), 'utf8');
const DATA = fs.readFileSync(path.join(ROOT, 'data.js'), 'utf8');
const REC  = fs.readFileSync(path.join(ROOT, 'rec.js'), 'utf8');
const APP  = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
/* storage shim — lets the page work inside sandboxed previews (no localStorage) */
const SHIM = '(function(){try{if(window.localStorage){try{window.localStorage.getItem("__t");return;}catch(e){throw 0;}}}catch(e){}try{var m={},s={getItem:function(k){return Object.prototype.hasOwnProperty.call(m,k)?m[k]:null;},setItem:function(k,v){m[k]=String(v);},removeItem:function(k){delete m[k];},clear:function(){m={};},key:function(i){var ks=Object.keys(m);return ks[i]||null;},get length(){return Object.keys(m).length;}};Object.defineProperty(window,"localStorage",{value:s,configurable:true});var ms={},ss={getItem:function(k){return Object.prototype.hasOwnProperty.call(ms,k)?ms[k]:null;},setItem:function(k,v){ms[k]=String(v);},removeItem:function(k){delete ms[k];},clear:function(){ms={};},key:function(i){var ks=Object.keys(ms);return ks[i]||null;},get length(){return Object.keys(ms).length;}};Object.defineProperty(window,"sessionStorage",{value:ss,configurable:true});}catch(e){}})();\n';

const catalogRaw = JSON.parse(fs.readFileSync(path.join(ROOT, 'catalog.json'), 'utf8'));
let products = Array.isArray(catalogRaw) ? catalogRaw : (catalogRaw.products || []);
products = products.filter(p => p && p.id && !/-v[123]$/.test(p.id) && !p.hidden);

const productDir = path.join(ROOT, 'product');
fs.mkdirSync(productDir, { recursive: true });

function productPage(p){
  const pretty = SITE + '/product/' + encodeURIComponent(p.id) + '.html';  const img = SITE + '/product/' + encodeURIComponent(p.id) + '.jpg';
  const desc = String(p.desc || (p.name + ' — ' + (p.fabric || 'Premium') + ' saree from SK Sarees, Salem.')).replace(/"/g, "'");
  const price = p.price || 0, mrp = p.mrp || 0;
  const clean = Object.assign({}, p, { img, image: img, images: [img], hidden: false, colourStock: p.colourStock || null });
  const ld = { '@context':'https://schema.org','@type':'Product', name:p.name, image:img, sku:p.sku||p.id,
    brand:{'@type':'Brand',name:'SK Sarees'}, category: ext[p.cat] || 'Sarees',
    offers:{ '@type':'Offer', priceCurrency:'INR', price:price, availability:(p.stock!=null&&p.stock<=0)?'https://schema.org/OutOfStock':'https://schema.org/InStock', url:pretty, itemCondition:'https://schema.org/NewCondition' } };
  if (mrp>price) ld.offers.priceValidUntil = new Date(Date.now()+30*864e5).toISOString().slice(0,10);
  return '<!doctype html>\n<html lang="en">\n<head>\n' +
    '<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' +
    '<meta name="theme-color" content="#8f1d3a">\n<base href="../">\n' +
    '<link rel="manifest" href="manifest.webmanifest">\n<meta name="mobile-web-app-capable" content="yes">\n<meta name="apple-mobile-web-app-capable" content="yes">\n' +
    '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\n<meta name="apple-mobile-web-app-title" content="SK Sarees">\n' +
    '<link rel="apple-touch-icon" href="icons/icon-192.png">\n' +
    '<title>' + esc(p.name) + ' — SK Sarees</title>\n' +
    '<meta name="description" content="' + esc(desc.slice(0,155)) + '">\n' +
    '<link rel="canonical" href="' + esc(pretty) + '">\n' +
    '<meta property="og:type" content="product">\n<meta property="og:title" content="' + esc(p.name) + '">\n' +
    '<meta property="og:description" content="' + esc(desc.slice(0,155)) + '">\n' +
    '<meta property="og:image" content="' + esc(img) + '">\n<meta property="og:url" content="' + esc(pretty) + '">\n' +
    '<meta property="og:site_name" content="SK Sarees">\n<meta property="og:price:amount" content="' + price + '">\n<meta property="og:price:currency" content="INR">\n' +
    '<meta property="og:availability" content="' + ((p.stock!=null&&p.stock<=0)?'out of stock':'in stock') + '">\n' +
    '<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:title" content="' + esc(p.name) + '">\n<meta name="twitter:image" content="' + esc(img) + '">\n' +
    '<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Crect width=\'100\' height=\'100\' rx=\'20\' fill=\'%238f1d3a\'/%3E%3Ctext x=\'50\' y=\'68\' font-size=\'48\' text-anchor=\'middle\' fill=\'%23e8c66a\' font-family=\'Georgia\'%3ESK%3C/text%3E%3C/svg%3E">\n' +
    '<style>\n' + CSS + '\n</style>\n' +
    '<script type="application/ld+json">' + JSON.stringify(ld) + '</script>\n' +
    '</head>\n<body data-page="product">\n' +
    '<script>' + SHIM +
      'window.__PRODUCT_ID = ' + JSON.stringify(p.id) + '; window.__PRODUCT_DATA = ' + JSON.stringify(clean) + ';</script>\n' +
    '<main id="app">\n  <div class="wrap pd-wrap" style="margin-top:12px" id="pdWrap"></div>\n  <div class="sticky-bar" id="stickyBar"></div>\n</main>\n' +
    '<script>\n' + DATA + '\n</script>\n' +
    '<script>\n' + REC + '\n</script>\n' +
    '<script>\n' + APP + '\n</script>\n' +
    '</body>\n</html>\n';
}

/* 📂 product/index.html — folder listing. Fixes "Not found: /sksaree/product/"
   (hosts look for index.html when the folder URL is opened) and gives Google a
   page linking every product. Fully static + relative links → works under any
   subpath (github.io/sksaree/). */
function productIndexHTML(){
  const cards = products.map(p => {
    const img = p.id + '.jpg';
    const price = p.price || 0, mrp = p.mrp || 0;
    const off = (mrp > price) ? Math.round((1 - price / mrp) * 100) : 0;
    return '<a class="card" href="' + encodeURIComponent(p.id) + '.html">' +
      '<img src="' + encodeURIComponent(img) + '" alt="' + esc(p.name) + '" loading="lazy">' +
      '<div class="cb"><b>' + esc(p.name) + '</b>' +
      '<div class="pr"><span>₹' + price.toLocaleString('en-IN') + '</span>' + (mrp > price ? '<s>₹' + mrp.toLocaleString('en-IN') + '</s>' : '') + (off ? '<em>-' + off + '%</em>' : '') + '</div>' +
      '<small>View saree →</small></div></a>';
  }).join('');
  return '<!doctype html>\n<html lang="en">\n<head>\n' +
    '<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    '<title>All Sarees — SK Sarees</title>\n' +
    '<meta name="description" content="Browse every SK Sarees saree — Kanchipuram silk, soft silk, cotton, georgette, linen and more. Fast delivery across India.">\n' +
    '<link rel="canonical" href="' + esc(SITE + '/product/') + '">\n' +
    '<style>\n' +
    'body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#faf7f2;color:#33261f}\n' +
    '.top{background:linear-gradient(135deg,#8f1d3a,#5c0f26);color:#fff;padding:26px 18px;text-align:center}\n' +
    '.top h1{margin:0 0 4px;font-size:1.5rem;letter-spacing:.5px}\n' +
    '.top p{margin:0;font-size:.85rem;opacity:.9}\n' +
    '.grid{display:grid;gap:14px;padding:18px;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));max-width:1080px;margin:0 auto}\n' +
    '.card{background:#fff;border:1px solid #eadfcf;border-radius:14px;overflow:hidden;text-decoration:none;color:inherit;box-shadow:0 2px 10px rgba(60,20,20,.06);transition:.18s}\n' +
    '.card:hover{transform:translateY(-3px);box-shadow:0 8px 22px rgba(60,20,20,.14)}\n' +
    '.card img{width:100%;aspect-ratio:4/3;object-fit:cover;display:block;background:#f3eadf}\n' +
    '.cb{padding:10px 12px 12px}\n' +
    '.cb b{display:block;font-size:.82rem;line-height:1.35;min-height:2.4em}\n' +
    '.pr{margin:5px 0;display:flex;align-items:center;gap:6px;flex-wrap:wrap}\n' +
    '.pr span{color:#8f1d3a;font-weight:800;font-size:.95rem}\n' +
    '.pr s{color:#a89a86;font-size:.75rem}\n' +
    '.pr em{background:#ffe9a8;color:#6b4c05;font-style:normal;font-size:.68rem;font-weight:800;padding:2px 6px;border-radius:999px}\n' +
    '.cb small{color:#8f1d3a;font-weight:700;font-size:.72rem}\n' +
    '.back{display:block;text-align:center;padding:8px 0 26px;color:#8f1d3a;font-weight:800;text-decoration:none}\n' +
    '</style>\n</head>\n<body>\n' +
    '<div class="top"><h1>🪡 SK Sarees — All Products</h1><p>' + products.length + ' sarees • Tap any saree for photos, price &amp; order</p></div>\n' +
    '<div class="grid">' + cards + '</div>\n' +
    '<a class="back" href="../shop.html">← Back to full shop</a>\n' +
    '</body>\n</html>\n';
}

/* ---------- images → product/<id>.jpg ---------- */
function copyImage(p){
  const out = path.join(productDir, p.id + '.jpg');
  const src = String(p.img || '');
  if (/^data:image\/(jpeg|jpg);base64,/i.test(src)){
    fs.writeFileSync(out, Buffer.from(src.split(',')[1], 'base64'));
    return true;
  }
  if (/^https?:\/\//i.test(src)) return false;   /* remote: try fetch below */
  const local = path.join(ROOT, src.replace(/^\.?\//, ''));
  if (fs.existsSync(local)){ fs.copyFileSync(local, out); return true; }
  return false;
}
async function fetchRemote(p){
  const out = path.join(productDir, p.id + '.jpg');
  const src = String(p.img || '');
  if (!/^https?:\/\//i.test(src)) return false;
  try{
    const r = await fetch(src, { redirect: 'follow' });
    if (!r.ok) return false;
    const b = Buffer.from(await r.arrayBuffer());
    if (b.length < 100) return false;
    fs.writeFileSync(out, b);
    return true;
  }catch(e){ return false; }
}

(async () => {
  let pages = 0, imgs = 0, missing = [];
  fs.writeFileSync(path.join(productDir, 'index.html'), productIndexHTML());   /* fixes /product/ 404 */
  for (const p of products){
    fs.writeFileSync(path.join(productDir, p.id + '.html'), productPage(p));
    pages++;
    if (copyImage(p)){ imgs++; }
    else if (await fetchRemote(p)){ imgs++; }
    else missing.push(p.id);
    p.img = 'product/' + p.id + '.jpg';
    p.image = 'product/' + p.id + '.jpg';
    p.images = ['product/' + p.id + '.jpg'];
  }
  fs.writeFileSync(path.join(ROOT, 'catalog.json'), JSON.stringify(products));

  /* ---------- feeds ---------- */
  const escX = s => String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n<channel>\n<title>SK Sarees Catalog</title>\n<link>' + escX(SITE + '/') + '</link>\n<description>Saree catalog for Facebook & Instagram Shopping</description>\n';
  const txtLines = ['id\ttitle\tdescription\tprice\tcondition\tlink\tavailability\timage_link'];
  products.forEach(p => {
    const imgAbs = SITE + '/product/' + encodeURIComponent(p.id) + '.jpg';
    const linkAbs = SITE + '/product/' + encodeURIComponent(p.id) + '.html';
    xml += '<item>\n' +
      '<g:id>' + escX(p.id) + '</g:id>\n<g:title>' + escX(p.name) + '</g:title>\n' +
      '<g:description>' + escX((p.desc || p.name + ' from SK Sarees.') + ' ' + p.fabric + ' — ' + p.color) + '</g:description>\n' +
      '<g:link>' + escX(linkAbs) + '</g:link>\n<g:image_link>' + escX(imgAbs) + '</g:image_link>\n' +
      '<g:availability>' + ((p.stock != null && p.stock <= 0) ? 'out of stock' : 'in stock') + '</g:availability>\n' +
      '<g:price>' + p.price + ' INR</g:price>\n' +
      (p.mrp && p.mrp > p.price ? '<g:sale_price>' + p.price + ' INR</g:sale_price>\n<g:price>' + p.mrp + ' INR</g:price>\n' : '') +
      '<g:condition>new</g:condition>\n<g:brand>SK Sarees</g:brand>\n<g:mpn>' + escX(p.sku || p.id) + '</g:mpn>\n<g:item_group_id>' + escX(p.id) + '</g:item_group_id>\n' +
      '<g:google_product_category>Apparel & Accessories > Clothing > Traditional & Ceremonial Clothing</g:google_product_category>\n' +
      '<g:product_type>' + escX(p.cat || 'Sarees') + '</g:product_type>\n' +
      '<g:shipping><g:country>IN</g:country><g:service>Standard</g:service><g:price>30 INR</g:price></g:shipping>\n<g:identifier_exists>no</g:identifier_exists>\n</item>\n';
    txtLines.push([escT(p.id), escT(p.name), escT((p.desc || p.name + ' from SK Sarees.') + ' ' + p.fabric + ' - ' + p.color), p.price + ' INR', 'new', escT(linkAbs), (p.stock != null && p.stock <= 0) ? 'out of stock' : 'in stock', escT(imgAbs)].join('\t'));
  });
  xml += '</channel>\n</rss>';
  fs.writeFileSync(path.join(ROOT, 'products-feed.xml'), xml);
  fs.writeFileSync(path.join(ROOT, 'google-merchant-feed.txt'), txtLines.join('\n'));

  /* ---------- sitemap with product images (Google Images) ---------- */
  let sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';
  [['',1.0,'daily'],['shop.html',0.9,'daily'],['share-earn.html',0.8,'weekly'],['blog.html',0.8,'weekly'],['return-policy.html',0.6,'monthly'],['aadi-sale.html',0.7,'yearly'],['pongal-collection.html',0.7,'yearly'],['diwali-special.html',0.7,'yearly'],['bulk-wedding.html',0.8,'monthly'],['feed.html',0.6,'daily'],['catalog.json',0.5,'daily'],['products-feed.xml',0.5,'daily'],['google-merchant-feed.txt',0.5,'daily']].forEach(x => {
    sm += '  <url><loc>' + SITE + '/' + x[0] + '</loc><changefreq>' + x[2] + '</changefreq><priority>' + x[1] + '</priority></url>\n';
  });
  products.forEach(p => {
    sm += '  <url><loc>' + SITE + '/product/' + encodeURIComponent(p.id) + '.html</loc><changefreq>daily</changefreq><priority>0.9</priority>' +
      '<image:image><image:loc>' + SITE + '/product/' + encodeURIComponent(p.id) + '.jpg</image:loc><image:title>' + escX(p.name) + '</image:title></image:image></url>\n';
  });
  sm += '</urlset>\n';
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sm);

  console.log('✅ pages: ' + pages + ' (self-contained) + index.html | photos: ' + imgs + (missing.length ? ' | ⚠️ missing photos: ' + missing.join(', ') : ''));
  console.log('✅ catalog.json / products-feed.xml / google-merchant-feed.txt / sitemap.xml regenerated');
  console.log('📤 Upload the whole sksaree/ folder (including product/) to your host.');
})().catch(e => { console.error('FATAL', e); process.exit(1); });
