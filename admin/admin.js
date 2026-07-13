const cfg=window.ALBIRRU_CONFIG;
let session=JSON.parse(localStorage.getItem('albirru_admin_session')||'null');
const statusEl=document.getElementById('status'),listEl=document.getElementById('productList');
const productDialog=document.getElementById('productDialog'),deleteDialog=document.getElementById('deleteDialog');
let products=[],deleteId=null;
const rupiah=n=>'Rp'+Number(n).toLocaleString('id-ID');
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const headers=(extra={})=>({apikey:cfg.publishableKey,Authorization:`Bearer ${session?.access_token||''}`,...extra});
function forceLogin(){localStorage.removeItem('albirru_admin_session');location.replace('../login/')}

async function api(path,options={}){
  const response=await fetch(`${cfg.supabaseUrl}${path}`,{...options,headers:headers(options.headers||{})});
  if(response.status===401)forceLogin();
  const text=await response.text(),data=text?JSON.parse(text):null;
  if(!response.ok)throw new Error(data?.message||data?.msg||data?.error||`Terjadi kesalahan (${response.status})`);
  return data;
}
async function init(){
  if(!session?.access_token)return forceLogin();
  try{
    if(session.expires_at<=Date.now())await refreshSession();
    await api('/auth/v1/user');
    const isAdmin=await api('/rest/v1/rpc/is_admin',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
    if(!isAdmin)return forceLogin();
    await loadProducts();
  }catch(error){statusEl.textContent=error.message}
}
async function refreshSession(){
  if(!session?.refresh_token)return forceLogin();
  const response=await fetch(`${cfg.supabaseUrl}/auth/v1/token?grant_type=refresh_token`,{method:'POST',headers:{apikey:cfg.publishableKey,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:session.refresh_token})});
  const data=await response.json();if(!response.ok)throw new Error('Sesi berakhir. Silakan masuk kembali.');
  session={access_token:data.access_token,refresh_token:data.refresh_token,user:data.user,expires_at:Date.now()+(data.expires_in*1000)-60000};
  localStorage.setItem('albirru_admin_session',JSON.stringify(session));
}
async function loadProducts(){
  statusEl.textContent='Memuat menu…';
  products=await api('/rest/v1/products?select=*&order=sort_order.asc,id.asc');
  render();statusEl.textContent='';
}
function render(){
  document.getElementById('totalProducts').textContent=products.length;
  document.getElementById('activeProducts').textContent=products.filter(p=>p.active).length;
  const latest=products.map(p=>new Date(p.updated_at||p.created_at)).sort((a,b)=>b-a)[0];
  document.getElementById('lastUpdated').textContent=latest?latest.toLocaleDateString('id-ID',{day:'numeric',month:'short'}):'–';
  listEl.innerHTML=products.length?products.map(p=>`<article class="product-row">${p.image_url?`<img class="product-image" src="${esc(p.image_url)}" alt="${esc(p.name)}">`:`<div class="product-emoji">${esc(p.icon||'🐟')}</div>`}<div class="product-info"><h3>${esc(p.name)}</h3><p>${esc(p.description||'Tanpa deskripsi')}</p></div><div class="product-meta"><strong>${rupiah(p.price)}</strong><span class="badge ${p.active?'':'off'}">${p.active?'Aktif':'Disembunyikan'}</span></div><div class="row-actions"><button data-edit="${p.id}">Edit</button><button class="remove" data-delete="${p.id}">Hapus</button></div></article>`).join(''):'<div class="empty-admin">Belum ada menu. Klik “Menu Baru” untuk menambahkan produk.</div>';
}
function resetForm(product=null){
  document.getElementById('productForm').reset();
  document.getElementById('productId').value=product?.id||'';
  document.getElementById('name').value=product?.name||'';
  document.getElementById('price').value=product?.price??'';
  document.getElementById('sortOrder').value=product?.sort_order??products.length+1;
  document.getElementById('description').value=product?.description||'';
  document.getElementById('icon').value=product?.icon||'';
  document.getElementById('active').checked=product?product.active:true;
  document.getElementById('activeText').textContent=document.getElementById('active').checked?'Aktif':'Disembunyikan';
  document.getElementById('imageName').textContent=product?.image_url?'Gambar saat ini akan dipertahankan jika tidak memilih file baru.':'';
  document.getElementById('formTitle').textContent=product?'Edit Menu':'Menu Baru';
  document.getElementById('formMessage').textContent='';productDialog.showModal();
}
async function uploadImage(file){
  if(!file)return null;if(file.size>5*1024*1024)throw new Error('Ukuran gambar maksimal 5 MB.');
  const ext=(file.name.split('.').pop()||'jpg').replace(/[^a-z0-9]/gi,'').toLowerCase();
  const fileName=`product-${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
  await api(`/storage/v1/object/product-images/${fileName}`,{method:'POST',headers:{'Content-Type':file.type||'application/octet-stream','x-upsert':'false'},body:file});
  return `${cfg.supabaseUrl}/storage/v1/object/public/product-images/${fileName}`;
}
document.getElementById('productForm').addEventListener('submit',async event=>{
  event.preventDefault();const save=document.getElementById('saveProduct'),msg=document.getElementById('formMessage');save.disabled=true;save.textContent='Menyimpan…';msg.textContent='';
  try{
    const id=document.getElementById('productId').value,current=products.find(p=>String(p.id)===id),file=document.getElementById('image').files[0];
    const uploaded=await uploadImage(file);
    const body={name:document.getElementById('name').value.trim(),description:document.getElementById('description').value.trim()||null,price:Number(document.getElementById('price').value),icon:document.getElementById('icon').value.trim()||'🐟',sort_order:Number(document.getElementById('sortOrder').value)||0,active:document.getElementById('active').checked,image_url:uploaded||current?.image_url||null,updated_at:new Date().toISOString()};
    if(id)await api(`/rest/v1/products?id=eq.${id}`,{method:'PATCH',headers:{'Content-Type':'application/json','Prefer':'return=minimal'},body:JSON.stringify(body)});
    else await api('/rest/v1/products',{method:'POST',headers:{'Content-Type':'application/json','Prefer':'return=minimal'},body:JSON.stringify(body)});
    productDialog.close();await loadProducts();
  }catch(error){msg.textContent=error.message}finally{save.disabled=false;save.textContent='Simpan Menu'}
});
document.addEventListener('click',event=>{
  const edit=event.target.dataset.edit,del=event.target.dataset.delete;
  if(edit)resetForm(products.find(p=>String(p.id)===edit));
  if(del){deleteId=del;const p=products.find(x=>String(x.id)===del);document.getElementById('deleteText').textContent=`Menu “${p?.name||''}” akan dihapus permanen.`;deleteDialog.showModal()}
});
document.getElementById('confirmDelete').onclick=async()=>{try{await api(`/rest/v1/products?id=eq.${deleteId}`,{method:'DELETE'});deleteDialog.close();await loadProducts()}catch(error){alert(error.message)}};
document.getElementById('newProduct').onclick=()=>resetForm();
document.getElementById('closeDialog').onclick=()=>productDialog.close();
document.getElementById('cancelForm').onclick=()=>productDialog.close();
document.getElementById('cancelDelete').onclick=()=>deleteDialog.close();
document.getElementById('active').onchange=e=>document.getElementById('activeText').textContent=e.target.checked?'Aktif':'Disembunyikan';
document.getElementById('image').onchange=e=>document.getElementById('imageName').textContent=e.target.files[0]?.name||'';
document.getElementById('logout').onclick=async()=>{try{await api('/auth/v1/logout',{method:'POST'})}catch{}forceLogin()};
init();
