/* ── Open product from shared link (#product/SKU) ── */
function openFromHash(){
  const m=location.hash.match(/#product\/(.+)/);
  if(m&&m[1]){
    const sku=decodeURIComponent(m[1]);
    // Wait a moment for products to load, then open
    const tryOpen=(attempt)=>{
      const p=GP().find(x=>x.sku===sku);
      if(p){ openProduct(sku); }
      else if(attempt<20){ setTimeout(()=>tryOpen(attempt+1),150); }
    };
    tryOpen(0);
  }
}
window.addEventListener('hashchange',openFromHash);
