const cfg=window.ALBIRRU_CONFIG;
const fallbackProducts=[
 {id:'kapal',name:'Kapal Selam',price:18000,icon:'🥚',description:'Pempek besar dengan isian telur',active:true},
 {id:'telur',name:'Telur Kecil',price:6000,icon:'🍳',description:'Pempek telur ukuran kecil',active:true},
 {id:'lenjer',name:'Lenjer',price:4000,icon:'🥖',description:'Pempek klasik berbentuk panjang',active:true},
 {id:'keriting',name:'Keriting',price:4000,icon:'🌼',description:'Tekstur unik, gurih dan kenyal',active:true},
 {id:'adaan',name:'Adaan',price:4000,icon:'🟠',description:'Bulat, gurih dan harum bawang',active:true},
 {id:'otak',name:'Otak-Otak Tenggiri',price:4000,icon:'🐟',description:'Aroma panggang yang menggoda',active:true},
 {id:'kulit',name:'Pempek Kulit',price:3000,icon:'🟫',description:'Gurih dan renyah saat digoreng',active:true}
];
let products=[];
let cart=JSON.parse(localStorage.getItem('albirru-cart')||'{}');
const rupiah=n=>'Rp'+Number(n).toLocaleString('id-ID');
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const productKey=id=>String(id);

async function loadProducts(){
  try{
    const response=await fetch(`${cfg.supabaseUrl}/rest/v1/products?select=id,name,description,price,icon,image_url,active,sort_order&active=eq.true&order=sort_order.asc`,{headers:{apikey:cfg.publishableKey}});
    if(!response.ok)throw new Error(`HTTP ${response.status}`);
    products=await response.json();
    if(!products.length)throw new Error('Menu kosong');
  }catch(error){
    console.warn('Memakai menu cadangan:',error.message);
    products=fallbackProducts;
  }
  renderMenu();renderCart();
}

function renderMenu(){
  const menu=document.getElementById('menuGrid');
  menu.innerHTML=products.map(p=>`<article class="menu-card">${p.image_url?`<img class="menu-photo" src="${esc(p.image_url)}" alt="${esc(p.name)}" loading="lazy">`:`<div class="menu-icon">${esc(p.icon||'🐟')}</div>`}<h3>${esc(p.name)}</h3><p>${esc(p.description||'Pempek ikan tenggiri asli')}</p><footer><span class="price">${rupiah(p.price)}</span><button class="add" data-add="${esc(productKey(p.id))}" aria-label="Tambah ${esc(p.name)}">+</button></footer></article>`).join('');
}

function save(){localStorage.setItem('albirru-cart',JSON.stringify(cart));renderCart()}
function add(id){cart[id]=(cart[id]||0)+1;save();const t=document.getElementById('toast');t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1400)}
function renderCart(){
  const entries=products.filter(p=>cart[productKey(p.id)]);
  const count=entries.reduce((n,p)=>n+cart[productKey(p.id)],0);
  document.getElementById('cartCount').textContent=count;
  document.getElementById('cartItems').innerHTML=entries.length?entries.map(p=>{const key=productKey(p.id),qty=cart[key];return `<div class="cart-row"><div><b>${esc(p.name)}</b><p>${rupiah(p.price)} × ${qty}</p></div><div class="qty"><button data-minus="${esc(key)}">−</button><b>${qty}</b><button data-add="${esc(key)}">+</button></div></div>`}).join(''):'<div class="empty">Keranjang masih kosong.<br>Yuk, pilih pempek favoritmu!</div>';
  const total=entries.reduce((n,p)=>n+Number(p.price)*cart[productKey(p.id)],0);
  document.getElementById('cartTotal').textContent=rupiah(total);
}

document.addEventListener('click',e=>{
  const addId=e.target.dataset.add,minusId=e.target.dataset.minus;
  if(addId)add(addId);
  if(minusId){cart[minusId]--;if(cart[minusId]<=0)delete cart[minusId];save()}
  const close=e.target.dataset.close;if(close)document.getElementById(close).close();
});
const customerName=document.getElementById('customerName');
const otherDate=document.getElementById('otherDate');
const otherDateWrap=document.getElementById('otherDateWrap');
const cartError=document.getElementById('cartError');
const todayIso=()=>{
  const today=new Date();
  return `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
};
const clearCartError=()=>{
  cartError.textContent='';
  customerName.classList.remove('field-invalid');
  otherDate.classList.remove('field-invalid');
};
const showCartError=(message,field)=>{
  cartError.textContent=message;
  if(field){field.classList.add('field-invalid');field.focus();field.scrollIntoView({behavior:'smooth',block:'center'})}
};
const openCart=()=>{
  clearCartError();
  otherDate.min=todayIso();
  document.getElementById('cartDialog').showModal();
};
document.getElementById('openCart').onclick=openCart;
document.getElementById('heroOpenCart').onclick=openCart;
document.getElementById('floatingOpenCart').onclick=openCart;
document.getElementById('showQris').onclick=()=>document.getElementById('qrisDialog').showModal();
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d)d.close()}));
document.querySelectorAll('input[name="orderDay"]').forEach(input=>input.addEventListener('change',()=>{
  const chooseDate=input.value==='Hari lain'&&input.checked;
  otherDateWrap.classList.toggle('show',chooseDate);
  otherDate.required=chooseDate;
  if(!chooseDate){otherDate.value='';otherDate.classList.remove('field-invalid')}
  clearCartError();
}));
document.querySelectorAll('input[name="servingType"],input[name="referral"]').forEach(input=>input.addEventListener('change',clearCartError));
customerName.addEventListener('input',clearCartError);
otherDate.addEventListener('input',clearCartError);
document.getElementById('checkout').onclick=()=>{
  const entries=products.filter(p=>cart[productKey(p.id)]);
  clearCartError();
  if(!entries.length){showCartError('Keranjang masih kosong. Pilih menu terlebih dahulu.');return}
  const name=customerName.value.trim().replace(/\s+/g,' ');
  const serving=document.querySelector('input[name="servingType"]:checked');
  const orderDay=document.querySelector('input[name="orderDay"]:checked');
  if(!name){showCartError('Nama wajib diisi.',customerName);return}
  if(!serving){showCartError('Pilih penyajian: Goreng, Rebus hangat, atau Beku vakum.');return}
  if(!orderDay){showCartError('Pilih waktu pesanan: Hari ini, Besok, Lusa, atau Hari lain.');return}
  if(orderDay.value==='Hari lain'&&!otherDate.value){showCartError('Pilih tanggal pesanan.',otherDate);return}
  if(orderDay.value==='Hari lain'&&otherDate.value<todayIso()){showCartError('Tanggal pesanan tidak boleh sebelum hari ini.',otherDate);return}
  const total=entries.reduce((n,p)=>n+Number(p.price)*cart[productKey(p.id)],0);
  const notes=document.getElementById('orderNotes').value.trim();
  const referrals=[...document.querySelectorAll('input[name="referral"]:checked')].map(input=>input.value);
  let deliveryDay=orderDay.value;
  if(orderDay.value==='Hari lain'){
    const chosen=new Date(`${otherDate.value}T00:00:00`);
    deliveryDay=chosen.toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  }
  const lines=[
    'Halo Pempek Albirru, saya mau pesan:',
    '',
    `Nama: ${name}`,
    `Penyajian: ${serving.value}`,
    `Pesanan untuk: ${deliveryDay}`,
    referrals.length?`Kenal dari: ${referrals.join(', ')}`:'',
    '',
    ...entries.map((p,i)=>{const qty=cart[productKey(p.id)];return `${i+1}. ${p.name} — ${qty} pcs × ${rupiah(p.price)} = ${rupiah(qty*p.price)}`}),
    '',
    `Total sementara: ${rupiah(total)}`,
    notes?`Catatan: ${notes}`:'',
    '',
    'Mohon konfirmasi stok, ongkir, dan total akhirnya. Terima kasih.'
  ].filter((line,index,all)=>line!==''||all[index-1]!=='');
  window.open(`https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent(lines.join('\n'))}`,'_blank');
};
loadProducts();
