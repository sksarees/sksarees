/* ── LOAD LIVE PRODUCTS FROM FIRESTORE ── */
function mapFsProduct(doc){
  const d=doc.data();
  return {
    id:doc.id,
    sku:d.sku||'',
    name:d.name||'',
    desc:d.desc||d.description||'',
    price:Number(d.price)||0,
    op:Number(d.originalPrice||d.op)||Math.round((Number(d.price)||0)*1.5),
    disc:Number(d.disc||d.discountPercent)||Math.round((1-(Number(d.price)||1)/(Number(d.originalPrice||d.op)||Math.round((Number(d.price)||1)*1.5)))*100),
    cat:d.cat||d.categorySlug||(d.category?d.category.toLowerCase().replace(/\s*&\s*/g,'-').replace(/\s+/g,'-'):'cotton-sarees'),
    fab:d.fab||d.fabric||'Cotton',
    col:d.col||d.color||'',
    occ:d.occ||d.occasion||'Daily Wear',
    len:d.len||d.length||'6.3m',
    care:d.care||d.careInstructions||'',
    imgs:(Array.isArray(d.imgs)&&d.imgs.length?d.imgs:(Array.isArray(d.images)&&d.images.length?d.images:(d.image?[d.image]:['https://images.pexels.com/photos/12466121/pexels-photo-12466121.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=800&w=600']))),
    rat:Number(d.rat||d.rating)||4.5,
    rev:Number(d.rev||d.reviewCount)||0,
    bs:!!d.bs||!!d.bestSeller||!!d.featured,
    iN:!!d.iN||!!d.isNew,
    ft:!!d.ft||!!d.isFeatured,
    _status:d.status||'Active',
  };
}
function applyLiveProducts(docs){
  // Only show Active products on the store (hide Inactive/Out of Stock if desired — keep all for now)
  liveProducts = docs.map(mapFsProduct).filter(p=>p._status!=='Inactive');
  console.log('🔥 Loaded '+liveProducts.length+' products from Firestore');
  // Prune cart: remove items whose products have been deleted from Firestore
  if(cart.length){
    const liveIds=new Set(liveProducts.map(p=>String(p.id)));
    const before=cart.length;
    cart=cart.filter(i=>liveIds.has(String(i.id)));
    if(cart.length!==before){
      saveCart();
      toast('Some unavailable items were removed from your cart','info');
    }
  }
  if(curPage==='home') renderHome();
  if(curPage==='products') applyFilters();
  if(curPage==='cart') renderCart();
  if(curPage==='detail' && curProd!=null){
    const p=gP(curProd);
    if(!p){ go('products'); toast('This product is no longer available','info'); }
    else renderDetail(p);
  }
}
function loadLiveProducts(){
  if(!window.FB_DB) return;
  // Use a plain collection listener (no orderBy) so it works even if products
  // were seeded WITHOUT a createdAt field. We sort client-side afterwards.
  window.FB_DB.collection('products').onSnapshot(snap=>{
    if(snap.empty){ console.log('ℹ️ No products in Firestore yet — using default catalog.'); return; }
    // Sort newest-first client-side (handles missing createdAt gracefully)
    const docs=snap.docs.slice().sort((a,b)=>{
      const ca=a.data().createdAt||'', cb=b.data().createdAt||'';
      return String(cb).localeCompare(String(ca));
    });
    applyLiveProducts(docs);
  }, err=>{
    console.warn('Firestore products listener error:', err);
  });
}

/* ── Load orders from Firestore for the current logged-in user ── */
let ordersUnsub=null;
let lastOrderId='';
function loadLiveOrders(){
  if(!window.FB_DB) return;
  // Normalize phone: strip +91, spaces, dashes — so "9876543210" matches "+919876543210"
  const normPhone=(p)=>String(p||'').replace(/[\s\-\+]/g,'').replace(/^91/,'').replace(/\D/g,'').slice(-10);
  const getIdentifier=()=>{
    // Use current logged-in user AND the last-used checkout phone (for guests)
    const lastPhone=localStorage.getItem('sk_last_phone')||'';
    const lastEmail=localStorage.getItem('sk_last_email')||'';
    const userPhone=curUser?(curUser.phoneNumber||''):'';
    const userEmail=curUser?(curUser.email||''):'';
    return {
      phone: normPhone(userPhone||lastPhone),
      email: (userEmail||lastEmail).toLowerCase(),
      uid: curUser?curUser.uid||'':''
    };
  };
  const id=getIdentifier();
  const currentId=JSON.stringify(id);
  // Only re-subscribe if identifier changed
  if(currentId===lastOrderId && ordersUnsub) return;
  lastOrderId=currentId;
  // Unsubscribe previous listener
  if(ordersUnsub){ try{ordersUnsub();}catch(e){} ordersUnsub=null; }
  if(!id || (!id.phone && !id.email && !id.uid)){
    console.log('No identifier found, skipping orders subscription');
    return;
  }
  console.log('Subscribing to orders for:', id);
  // Listen to all orders; client filters by phone/email/uid match
  ordersUnsub=window.FB_DB.collection('orders').onSnapshot(snap=>{
    if(snap.empty) return;
    const remoteOrders=snap.docs.map(d=>({docId:d.id,...d.data()})).filter(o=>{
      const phone=normPhone(o.customerPhone);
      const email=(o.customerEmail||'').toLowerCase();
      const uid=o.customerUid||'';
      return (id.phone && phone && phone===id.phone) ||
             (id.email && email && email===id.email) ||
             (id.uid && uid && uid===id.uid);
    }).map(o=>({
      id: o.docId,
      num: o.num,
      items: o.items || [],
      addr: o.addr || {},
      customerName: o.customerName || '',
      customerPhone: o.customerPhone || '',
      pm: o.pm,
      status: o.status,
      ps: o.ps,
      payRef: o.payRef || '',
      tot: Number(o.tot)||0,
      sub: Number(o.sub)||0,
      del: Number(o.del)||0,
      disc: Number(o.disc)||0,
      date: o.date
    }));
    console.log('Firestore orders received:', remoteOrders.length);
    if(!remoteOrders.length) return;
    // Merge: Firestore orders override local ones (by order num)
    const localNums=new Set(orders.map(o=>o.num));
    // Update existing local orders from Firestore (status may have changed)
    orders=orders.map(lo=>{
      const match=remoteOrders.find(ro=>ro.num===lo.num);
      return match ? {...lo, status: match.status, ps: match.ps, payRef: match.payRef||lo.payRef} : lo;
    });
    // Add remote orders not already in local (by num)
    remoteOrders.forEach(ro=>{ if(!localNums.has(ro.num)) orders.unshift(ro); });
    // Sort newest first
    orders.sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
    saveOrders();
    if(curPage==='orders') renderOrders();
    badges();
  }, err=>{ console.warn('Orders listener error:', err); });
}

/* ── Fetch orders immediately from Firestore (for fresh data) ── */
async function fetchOrdersNow(){
  if(!window.FB_DB) return;
  const normPhone=(p)=>String(p||'').replace(/[\s\-\+]/g,'').replace(/^91/,'').replace(/\D/g,'').slice(-10);
  const lastPhone=localStorage.getItem('sk_last_phone')||'';
  const lastEmail=localStorage.getItem('sk_last_email')||'';
  const userPhone=curUser?(curUser.phoneNumber||''):'';
  const userEmail=curUser?(curUser.email||''):'';
  const id={
    phone: normPhone(userPhone||lastPhone),
    email: (userEmail||lastEmail).toLowerCase(),
    uid: curUser?curUser.uid||'':''
  };
  if(!id.phone && !id.email && !id.uid) return;
  
  try{
    console.log('Fetching orders now for:', id);
    const snap=await window.FB_DB.collection('orders').get();
    if(snap.empty) return;
    const remoteOrders=snap.docs.map(d=>({docId:d.id,...d.data()})).filter(o=>{
      const phone=normPhone(o.customerPhone);
      const email=(o.customerEmail||'').toLowerCase();
      const uid=o.customerUid||'';
      return (id.phone && phone && phone===id.phone) ||
             (id.email && email && email===id.email) ||
             (id.uid && uid && uid===id.uid);
    }).map(o=>({
      id: o.docId,
      num: o.num,
      items: o.items || [],
      addr: o.addr || {},
      customerName: o.customerName || '',
      customerPhone: o.customerPhone || '',
      pm: o.pm,
      status: o.status,
      ps: o.ps,
      payRef: o.payRef || '',
      tot: Number(o.tot)||0,
      sub: Number(o.sub)||0,
      del: Number(o.del)||0,
      disc: Number(o.disc)||0,
      date: o.date
    }));
    console.log('Fetched orders:', remoteOrders.length);
    if(!remoteOrders.length) return;
    // Merge with local orders
    const localNums=new Set(orders.map(o=>o.num));
    orders=orders.map(lo=>{
      const match=remoteOrders.find(ro=>ro.num===lo.num);
      return match ? {...lo, status: match.status, ps: match.ps, payRef: match.payRef||lo.payRef} : lo;
    });
    remoteOrders.forEach(ro=>{ if(!localNums.has(ro.num)) orders.unshift(ro); });
    orders.sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
    saveOrders();
    if(curPage==='orders') renderOrders();
    badges();
  }catch(err){
    console.warn('Fetch orders error:', err);
  }
}
