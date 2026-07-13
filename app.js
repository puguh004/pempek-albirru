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
const openCart=()=>document.getElementById('cartDialog').showModal();
document.getElementById('openCart').onclick=openCart;
document.getElementById('heroOpenCart').onclick=openCart;
document.getElementById('floatingOpenCart').onclick=openCart;
document.getElementById('showQris').onclick=()=>document.getElementById('qrisDialog').showModal();
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d)d.close()}));
document.getElementById('checkout').onclick=()=>{
  const entries=products.filter(p=>cart[productKey(p.id)]);
  if(!entries.length){alert('Keranjang masih kosong.');return}
  const total=entries.reduce((n,p)=>n+Number(p.price)*cart[productKey(p.id)],0);
  const notes=document.getElementById('orderNotes').value.trim();
  const lines=['Halo Pempek Albirru, saya mau pesan:','',...entries.map((p,i)=>{const qty=cart[productKey(p.id)];return `${i+1}. ${p.name} — ${qty} pcs × ${rupiah(p.price)} = ${rupiah(qty*p.price)}`}),'',`Total sementara: ${rupiah(total)}`,notes?`Catatan: ${notes}`:'','','Mohon konfirmasi stok, ongkir, dan total akhirnya. Terima kasih.'].filter(Boolean);
  window.open(`https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent(lines.join('\n'))}`,'_blank');
};
loadProducts();
