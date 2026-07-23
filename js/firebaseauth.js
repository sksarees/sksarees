/* ── FIREBASE AUTH ── */
function initFB(){
  if(!FB_ON){console.warn('Firebase not configured. Fill FIREBASE_CONFIG in index.html.');return;}
  fbAuth=firebase.auth();
  fbAuth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
  fbAuth.onAuthStateChanged(user=>{
    curUser=user;
    updateProfileHeader(user);
    renderProfileStrip();
    badges();
    // Save user contact info and load orders after login
    if(user){
      if(user.phoneNumber) localStorage.setItem('sk_last_phone', user.phoneNumber);
      if(user.email) localStorage.setItem('sk_last_email', user.email);
      // Load orders for the logged-in user
      setTimeout(()=>{
        fetchOrdersNow();
        loadLiveOrders();
        if(curPage==='orders') renderOrders();
      }, 300);
    }
  });
}
function openAuth(){
  if(!FB_ON){alert('Firebase not configured!\n\n1. Go to console.firebase.google.com\n2. Create a project\n3. Enable Email/Password & Phone Auth\n4. Paste config into index.html');return;}
  if(curUser){if(confirm(`Signed in as ${curUser.displayName||curUser.email||curUser.phoneNumber}\n\nSign out?`))signOut();return;}
  resetAuth();document.getElementById('authModal').classList.add('open');document.body.style.overflow='hidden';
}
function closeAuth(){document.getElementById('authModal').classList.remove('open');document.body.style.overflow='';clearInterval(resendInt)}
function resetAuth(){
  ['stepEmail','stepPhone','stepOTP','stepSuccess'].forEach(id=>{const el=document.getElementById(id);if(el)el.className='auth-step'});
  showAuthTab('email');
  const pi=document.getElementById('phoneInput');if(pi)pi.value='';
  const ei=document.getElementById('emailInput');if(ei)ei.value='';
  const ps=document.getElementById('passInput');if(ps)ps.value='';
  for(let i=0;i<6;i++){const b=document.getElementById('o'+i);if(b){b.value='';b.classList.remove('filled')}}
  confirmRes=null;const sb=document.getElementById('sendOTPBtn');if(sb)sb.disabled=true;
}
function showAuthTab(tab){
  document.getElementById('stepEmail').className='auth-step'+(tab==='email'?' show':'');
  document.getElementById('stepPhone').className='auth-step'+(tab==='phone'?' show':'');
  const te=document.getElementById('tabEmail'),tp=document.getElementById('tabPhone');
  if(te){te.style.color=tab==='email'?'var(--M)':'#aaa';te.style.borderBottomColor=tab==='email'?'var(--M)':'transparent';}
  if(tp){tp.style.color=tab==='phone'?'var(--M)':'#aaa';tp.style.borderBottomColor=tab==='phone'?'var(--M)':'transparent';}
  if(tab==='phone') setTimeout(initRecap,200);
}
async function emailLogin(){
  if(!FB_ON) return;
  const email=document.getElementById('emailInput').value.trim();
  const pass=document.getElementById('passInput').value;
  if(!email||!pass){toast('Enter email and password','err');return;}
  if(pass.length<6){toast('Password must be at least 6 characters','err');return;}
  const btn=document.getElementById('emailLoginBtn');
  btn.disabled=true;btn.innerHTML='<div class="spin"></div> Logging in…';
  try{
    let res; let isNewUser=false;
    try{ res=await fbAuth.signInWithEmailAndPassword(email,pass); }
    catch(e){
      if(e.code==='auth/user-not-found'||e.code==='auth/invalid-credential'){
        res=await fbAuth.createUserWithEmailAndPassword(email,pass);
        isNewUser=true;
        const nm=prompt('Welcome! Enter your name:','');
        if(nm&&nm.trim()) await res.user.updateProfile({displayName:nm.trim()});
        // Send email verification
        try{
          await res.user.sendEmailVerification();
          toast('📧 Verification email sent! Check your inbox.','info');
        }catch(ve){console.error('Verification email error:',ve);}
        toast('Account created! Please verify your email. 🎉');
      } else throw e;
    }
    const user=res.user;
    const notice=document.getElementById('verifyNotice');
    // Send verification for existing unverified users too
    if(!isNewUser && !user.emailVerified){
      try{
        await user.sendEmailVerification();
        toast('📧 Verification email sent. Check inbox for link.','info');
      }catch(ve){console.error('sendEmailVerification error:',ve);}
    }
    document.getElementById('succName').textContent=`Welcome, ${user.displayName||user.email}! 🎉`;
    if(user.emailVerified){
      document.getElementById('succPhone').innerHTML=(user.email||'')+' <span style="color:#2e7d32;font-weight:700;">✅ Verified</span>';
      if(notice) notice.style.display='none';
    } else {
      document.getElementById('succPhone').innerHTML=(user.email||'')+' <span style="color:#e65100;font-weight:700;">⏳ Not verified</span>';
      if(notice) notice.style.display='block';
    }
    showStep('Success');updateProfileHeader(user);
    toast('Login successful! 🎉');
  } catch(e){
    console.error(e);
    const M={'auth/invalid-email':'Invalid email address','auth/wrong-password':'Wrong password','auth/email-already-in-use':'Email already registered. Try logging in.','auth/weak-password':'Password too weak (min 6 chars)','auth/too-many-requests':'Too many attempts. Wait a moment.','auth/network-request-failed':'Network error. Check connection.','auth/operation-not-allowed':'Email/Password login not enabled in Firebase Console → Authentication → Sign-in method.'};
    toast(M[e.code]||'Error: '+e.message,'err');
  }
  btn.disabled=false;btn.innerHTML='🔐 Login / Sign Up';
}
async function resendVerify(){
  if(!fbAuth||!fbAuth.currentUser){toast('Please log in first','err');return;}
  const btn=document.getElementById('resendVerifyBtn');
  if(btn){btn.disabled=true;btn.textContent='Sending…';}
  try{
    await fbAuth.currentUser.sendEmailVerification();
    toast('📧 Verification email re-sent! Check your inbox & spam.','ok');
  }catch(e){
    console.error(e);
    toast(e.code==='auth/too-many-requests'?'Please wait a bit before resending.':'Could not send: '+e.message,'err');
  }
  if(btn){btn.disabled=false;btn.textContent='🔄 Resend Verification Email';}
}
function showStep(name){['Email','Phone','OTP','Success'].forEach(s=>{const el=document.getElementById('step'+s);if(el)el.className='auth-step'+(s===name?' show':'')})}
function clearRecap(){
  try{ if(rcVerifier){ rcVerifier.clear(); rcVerifier=null; } }catch(e){}
  const c=document.getElementById('recap-container'); if(c) c.innerHTML='';
}
function initRecap(){
  if(!FB_ON)return;
  clearRecap();
  try{
    // Invisible reCAPTCHA works best on mobile — no checkbox needed
    rcVerifier=new firebase.auth.RecaptchaVerifier('recap-container',{
      size:'invisible',
      callback:()=>{},
      'expired-callback':()=>{ clearRecap(); initRecap(); }
    });
    rcVerifier.render();
  }catch(e){console.error('recaptcha init',e)}
}
function validatePhone(){const ph=document.getElementById('phoneInput').value.trim();document.getElementById('sendOTPBtn').disabled=!(ph.length===10&&/^[6-9]\d{9}$/.test(ph))}
async function sendOTP(){
  if(!FB_ON){toast('Login not available — Firebase not configured','err');return;}
  const ph=document.getElementById('phoneInput').value.trim();
  if(ph.length!==10||!/^[6-9]\d{9}$/.test(ph)){toast('Enter a valid 10-digit Indian mobile number','err');return;}
  const btn=document.getElementById('sendOTPBtn');btn.disabled=true;btn.innerHTML='<div class="spin"></div> Sending…';
  try{
    if(!rcVerifier) initRecap();
    confirmRes=await fbAuth.signInWithPhoneNumber('+91'+ph,rcVerifier);
    document.getElementById('otpSentTo').textContent=`Enter the 6-digit OTP sent to +91 ${ph}`;
    showStep('OTP');startCountdown();document.getElementById('o0').focus();
    toast('OTP sent! 📨');
    btn.disabled=false;btn.innerHTML='Send OTP →';
  }catch(e){
    console.error('sendOTP',e);
    btn.disabled=false;btn.innerHTML='Send OTP →';
    handleFBErr(e);
    clearRecap();initRecap();
  }
}
async function resendOTP(){
  if(!FB_ON)return;const ph=document.getElementById('phoneInput').value.trim();if(!ph)return;
  document.getElementById('resendBtn').disabled=true;
  try{
    clearRecap();initRecap();
    confirmRes=await fbAuth.signInWithPhoneNumber('+91'+ph,rcVerifier);
    startCountdown();toast('OTP resent! 📨');
    for(let i=0;i<6;i++){const b=document.getElementById('o'+i);if(b){b.value='';b.classList.remove('filled')}}
    document.getElementById('verifyBtn').disabled=true;document.getElementById('o0').focus();
  }catch(e){handleFBErr(e);document.getElementById('resendBtn').disabled=false;clearRecap();initRecap();}
}
function startCountdown(){
  clearInterval(resendInt);let t=60;
  const cd=document.getElementById('countdown'),tt=document.getElementById('timerTxt'),rb=document.getElementById('resendBtn');
  if(tt)tt.style.display='inline';if(rb){rb.style.display='none';rb.disabled=true}
  resendInt=setInterval(()=>{t--;if(cd)cd.textContent=t+'s';if(t<=0){clearInterval(resendInt);if(tt)tt.style.display='none';if(rb){rb.style.display='inline';rb.disabled=false}}},1000);
}
function backToPhone(){showStep('Phone');clearInterval(resendInt);confirmRes=null;initRecap()}
function oi(i){const b=document.getElementById('o'+i);b.value=b.value.replace(/\D/g,'').slice(-1);b.classList.toggle('filled',b.value!=='');if(b.value&&i<5)document.getElementById('o'+(i+1)).focus();checkOTP()}
function ok(e,i){if(e.key==='Backspace'&&!document.getElementById('o'+i).value&&i>0){const p=document.getElementById('o'+(i-1));p.value='';p.classList.remove('filled');p.focus()}if(e.key==='Enter')verifyOTP()}
function getOTP(){let s='';for(let i=0;i<6;i++)s+=document.getElementById('o'+i).value;return s}
function checkOTP(){document.getElementById('verifyBtn').disabled=getOTP().length!==6}
async function verifyOTP(){
  if(!confirmRes){toast('Please request an OTP first','err');return;}
  const otp=getOTP();if(otp.length!==6){toast('Enter all 6 digits','err');return;}
  const btn=document.getElementById('verifyBtn');btn.disabled=true;btn.innerHTML='<div class="spin"></div> Verifying…';
  try{const res=await confirmRes.confirm(otp);const user=res.user;clearInterval(resendInt);
    if(!user.displayName){const nm=prompt('Welcome! Enter your name:','');if(nm&&nm.trim())await user.updateProfile({displayName:nm.trim()})}
    document.getElementById('succName').textContent=`Welcome, ${user.displayName||'SK Sarees Customer'}! 🎉`;
    document.getElementById('succPhone').textContent=user.phoneNumber;
    showStep('Success');updateProfileHeader(user);toast('Login successful! Welcome to SK Sarees 🎉')}
  catch(e){console.error(e);btn.disabled=false;btn.innerHTML='✅ Verify & Login';handleFBErr(e);const row=document.getElementById('otpRow');if(row){row.style.animation='shake .4s';setTimeout(()=>row.style.animation='',500)}for(let i=0;i<6;i++){const b=document.getElementById('o'+i);if(b){b.value='';b.classList.remove('filled')}}document.getElementById('verifyBtn').disabled=true;document.getElementById('o0').focus()}
}
async function signOut(){if(fbAuth){await fbAuth.signOut();toast('Signed out successfully');updateProfileHeader(null);renderProfileStrip()}}
async function editName(){if(!curUser)return;const n=prompt('Enter your name:',curUser.displayName||'');if(n&&n.trim()&&n.trim()!==curUser.displayName){await curUser.updateProfile({displayName:n.trim()});updateProfileHeader(fbAuth.currentUser);toast('Name updated!')}}
function handleFBErr(e){const M={'auth/invalid-phone-number':'Invalid phone number. Enter a valid 10-digit Indian number.','auth/too-many-requests':'Too many attempts. Please wait a few minutes.','auth/invalid-verification-code':'Wrong OTP. Please try again.','auth/code-expired':'OTP expired. Request a new one.','auth/network-request-failed':'Network error. Check your connection.','auth/captcha-check-failed':'reCAPTCHA failed. Please try again.','auth/operation-not-allowed':'Phone login not enabled. Enable it in Firebase Console → Authentication → Sign-in method → Phone.','auth/billing-not-enabled':'Phone auth needs Firebase Blaze plan. Use Email login instead.','auth/quota-exceeded':'SMS quota exceeded. Try later or use Email login.'};toast(M[e.code]||'Auth error: '+(e.message||e.code),'err')}

/* ── AUTH MODAL BACKDROP ── */
document.getElementById('authModal').addEventListener('click',function(e){if(e.target===this)closeAuth()});

/* ── SHAKE KEYFRAME ── */
const sk=document.createElement('style');sk.textContent='@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}';document.head.appendChild(sk);

/* ── TOUCH SWIPE CAROUSEL ── */
let tx=0;
document.querySelector('.hero-wrap').addEventListener('touchstart',e=>{tx=e.touches[0].clientX},{passive:true});
document.querySelector('.hero-wrap').addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-tx;if(Math.abs(dx)>40)slide(dx<0?1:-1)},{passive:true});
