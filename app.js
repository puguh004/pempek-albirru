const products=[
 {id:'kapal',name:'Kapal Selam',price:18000,icon:'🥚',desc:'Pempek besar dengan isian telur'},
 {id:'telur',name:'Telur Kecil',price:6000,icon:'🍳',desc:'Pempek telur ukuran kecil'},
 {id:'lenjer',name:'Lenjer',price:4000,icon:'🥖',desc:'Pempek klasik berbentuk panjang'},
 {id:'keriting',name:'Keriting',price:4000,icon:'🌼',desc:'Tekstur unik, gurih dan kenyal'},
 {id:'adaan',name:'Adaan',price:4000,icon:'🟠',desc:'Bulat, gurih dan harum bawang'},
 {id:'otak',name:'Otak-Otak Tenggiri',price:4000,icon:'🐟',desc:'Aroma panggang yang menggoda'},
 {id:'kulit',name:'Pempek Kulit',price:3000,icon:'🟫',desc:'Gurih dan renyah saat digoreng'}
];
let cart=JSON.parse(localStorage.getItem('albirru-cart')||'{}');
const rupiah=n=>'Rp'+n.toLocaleString('id-ID');
const menu=document.getElementById('menuGrid');
menu.innerHTML=products.map(p=>`<article class="menu-card"><div class="menu-icon">${p.icon}</div><h3>${p.name}</h3><p>${p.desc}</p><footer><span class="price">${rupiah(p.price)}</span><button class="add" data-add="${p.id}" aria-label="Tambah ${p.name}">+</button></footer></article>`).join('');
function save(){localStorage.setItem('albirru-cart',JSON.stringify(cart));renderCart()}
function add(id){cart[id]=(cart[id]||0)+1;save();const t=document.getElementById('toast');t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1400)}
function renderCart(){const entries=products.filter(p=>cart[p.id]);const count=entries.reduce((n,p)=>n+cart[p.id],0);document.getElementById('cartCount').textContent=count;document.getElementById('cartItems').innerHTML=entries.length?entries.map(p=>`<div class="cart-row"><div><b>${p.name}</b><p>${rupiah(p.price)} × ${cart[p.id]}</p></div><div class="qty"><button data-minus="${p.id}">−</button><b>${cart[p.id]}</b><button data-add="${p.id}">+</button></div></div>`).join(''):'<div class="empty">Keranjang masih kosong.<br>Yuk, pilih pempek favoritmu!</div>';const total=entries.reduce((n,p)=>n+p.price*cart[p.id],0);document.getElementById('cartTotal').textContent=rupiah(total)}
document.addEventListener('click',e=>{const addId=e.target.dataset.add,minusId=e.target.dataset.minus;if(addId)add(addId);if(minusId){cart[minusId]--;if(cart[minusId]<=0)delete cart[minusId];save()}const close=e.target.dataset.close;if(close)document.getElementById(close).close()});
const openCart=()=>document.getElementById('cartDialog').showModal();
document.getElementById('openCart').onclick=openCart;
document.getElementById('heroOpenCart').onclick=openCart;
document.getElementById('floatingOpenCart').onclick=openCart;
document.getElementById('showQris').onclick=()=>document.getElementById('qrisDialog').showModal();
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d)d.close()}));
document.getElementById('checkout').onclick=()=>{const entries=products.filter(p=>cart[p.id]);if(!entries.length){alert('Keranjang masih kosong.');return}const total=entries.reduce((n,p)=>n+p.price*cart[p.id],0);const notes=document.getElementById('orderNotes').value.trim();const lines=['Halo Pempek Albirru, saya mau pesan:','',...entries.map((p,i)=>`${i+1}. ${p.name} — ${cart[p.id]} pcs × ${rupiah(p.price)} = ${rupiah(cart[p.id]*p.price)}`),'',`Total sementara: ${rupiah(total)}`,notes?`Catatan: ${notes}`:'','', 'Mohon konfirmasi stok, ongkir, dan total akhirnya. Terima kasih.'].filter(Boolean);window.open(`https://wa.me/6283182435471?text=${encodeURIComponent(lines.join('\n'))}`,'_blank')};
renderCart();
