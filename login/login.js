const cfg=window.ALBIRRU_CONFIG;
const form=document.getElementById('loginForm'),message=document.getElementById('message'),button=document.getElementById('loginButton');
const saved=JSON.parse(localStorage.getItem('albirru_admin_session')||'null');
if(saved?.access_token&&saved?.expires_at>Date.now())location.replace('../admin/');
form.addEventListener('submit',async event=>{
  event.preventDefault();message.textContent='';button.disabled=true;button.textContent='Memeriksa akun…';
  try{
    const response=await fetch(`${cfg.supabaseUrl}/auth/v1/token?grant_type=password`,{method:'POST',headers:{apikey:cfg.publishableKey,'Content-Type':'application/json'},body:JSON.stringify({email:document.getElementById('email').value.trim(),password:document.getElementById('password').value})});
    const data=await response.json();
    if(!response.ok)throw new Error(data.error_description||data.msg||'Email atau password tidak sesuai.');
    const adminCheck=await fetch(`${cfg.supabaseUrl}/rest/v1/rpc/is_admin`,{method:'POST',headers:{apikey:cfg.publishableKey,Authorization:`Bearer ${data.access_token}`,'Content-Type':'application/json'},body:'{}'});
    if(!adminCheck.ok)throw new Error('Gagal memeriksa hak admin.');
    const isAdmin=await adminCheck.json();
    if(!isAdmin){await fetch(`${cfg.supabaseUrl}/auth/v1/logout`,{method:'POST',headers:{apikey:cfg.publishableKey,Authorization:`Bearer ${data.access_token}`}});throw new Error('Akun ini belum terdaftar sebagai admin.');}
    localStorage.setItem('albirru_admin_session',JSON.stringify({access_token:data.access_token,refresh_token:data.refresh_token,user:data.user,expires_at:Date.now()+(data.expires_in*1000)-60000}));
    location.replace('../admin/');
  }catch(error){message.textContent=error.message;button.disabled=false;button.textContent='Masuk ke Dashboard'}
});
