/* ── LOAD PROMOS ── */
async function loadPromos(){
  if(!FB_ON)return;
  try{
    const snap=await window.FB_DB.collection('promos').where('enabled','==',true).get();
    activePromos=snap.docs.map(d=>({id:d.id,...d.data()}));
  }catch(e){console.error('loadPromos:',e)}
}

document.addEventListener('DOMContentLoaded',()=>{
  initCarousel();
  startTimer();
  renderHome();
  badges();
  initFB();
  loadLiveProducts(); // listen for admin product updates (syncs cart + detail page)
  loadLiveOrders();   // listen for admin order status updates
  loadPromos();       // load active promo codes
  openFromHash();     // open shared product link if present
  applyLang();        // apply saved language
});
