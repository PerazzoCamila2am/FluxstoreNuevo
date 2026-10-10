/* Fluxstore · Nueva experiencia de compra
 * Catálogo local (catalog-data.js) + stock/reseñas/pedidos vía Google Apps Script.
 * IMPORTANTE: las peticiones POST no-cors no permiten confirmar que Sheets haya guardado datos.
 * El mensaje final de WhatsApp es el paso de confirmación del pedido.
 */
const WHATSAPP_NUMBER = '5493415907913';
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyZNkj8BfUgq2NM4AggunkNID8LKdevR06TO4XgNdp7VaZUnedwaAmS8gGDndKMhCaFJw/exec';
const SHIPPING_PRICES = {Rosario:5000,'Villa Gobernador Gálvez':5000,Funes:6000,'Pérez':6000};
const PAYMENT_ALIAS = 'fluxstorevap';
const PAYMENT_HOLDER = 'Constanza Malvina Pompei';
const PAYMENT_CVU = '3840200500000015731294';
const $ = selector => document.querySelector(selector);
const money = value => new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(value);
const waLink = message => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
const normalize = text => String(text ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const getProduct = id => products.find(product=>product.id===id);
let stockStatus='loading';
let stockRequest=null;
let cart=loadCart();
let filters={query:'',brand:'all',puffs:'all',sort:'default',available:false};
const expandedProducts=new Set();
const flavorQueries=new Map();
let currentOrder=null;
let toastTimer;

function loadCart(){
  let stored=[];
  try{ stored=JSON.parse(localStorage.getItem('fluxstoreCart')||'[]'); }catch(_error){return []}
  if(!Array.isArray(stored))return [];
  const entries=new Map();
  for(const item of stored){
    const id=item.productId||item.id;
    const product=getProduct(id);
    if(!product)continue;
    const flavor=(product.flavorOptions||[]).find(f=>normalize(f.name)===normalize(item.flavorName||item.selectedFlavor));
    if(!flavor)continue;
    const quantity=Math.min(99,Math.max(0,Math.trunc(Number(item.qty)||0)));
    if(!quantity)continue;
    const key=`${id}::${flavor.name}`;
    const previous=entries.get(key);
    entries.set(key,{productId:id,flavorName:flavor.name,qty:Math.min(99,quantity+(previous?.qty||0))});
  }
  return Array.from(entries.values());
}
function persistCart(){
  try{localStorage.setItem('fluxstoreCart',JSON.stringify(cart))}catch(_error){}
  if(currentOrder){currentOrder=null;$('#confirmation').hidden=true;$('#checkoutFormArea').hidden=false;}
  renderCart();
}
function countCart(){return cart.reduce((sum,item)=>sum+item.qty,0)}
function itemPrice(item){return getProduct(item.productId)?.price||0}
function getCartTotal(){
  let total=0;const grouped=new Map();
  cart.forEach(item=>{const product=getProduct(item.productId);if(!product)return;
    if(product.promoQty&&product.promoPrice){grouped.set(product.id,(grouped.get(product.id)||0)+item.qty)}
    else total+=product.price*item.qty;
  });
  grouped.forEach((qty,id)=>{const p=getProduct(id);const bundles=Math.floor(qty/p.promoQty);total+=bundles*p.promoPrice+(qty%p.promoQty)*p.price});
  return total;
}
function shippingFor(city){return SHIPPING_PRICES[city]??0}
function toast(message){const element=$('#toast');element.textContent=message;element.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>element.hidden=true,2700)}
function statusMessage(text,type=''){const el=$('#stockStatus');el.className=`status-bar ${type}`;el.innerHTML=escapeHtml(text)+(type==='error'? ' <button class="button-link" id="retryStock" type="button">Reintentar ↻</button>':'')}

function initializeFilters(){
  const brands=[...new Set(products.map(p=>p.name))].sort((a,b)=>a.localeCompare(b,'es'));
  const puffs=[...new Set(products.map(p=>p.puffs))].sort((a,b)=>Number(b.replace('k',''))-Number(a.replace('k','')));
  $('#brandFilter').insertAdjacentHTML('beforeend',brands.map(name=>`<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join(''));
  $('#puffFilter').insertAdjacentHTML('beforeend',puffs.map(p=>`<option value="${escapeHtml(p)}">${escapeHtml(p.toUpperCase())}</option>`).join(''));
  $('#productSearch').addEventListener('input',e=>{filters.query=e.target.value;renderProducts()});
  $('#brandFilter').addEventListener('change',e=>{filters.brand=e.target.value;renderProducts()});
  $('#puffFilter').addEventListener('change',e=>{filters.puffs=e.target.value;renderProducts()});
  $('#sortFilter').addEventListener('change',e=>{filters.sort=e.target.value;renderProducts()});
  $('#availableOnly').addEventListener('change',e=>{filters.available=e.target.checked;renderProducts()});
  $('#resetFilters').addEventListener('click',()=>{
    filters={query:'',brand:'all',puffs:'all',sort:'default',available:false};
    $('#productSearch').value='';$('#brandFilter').value='all';$('#puffFilter').value='all';$('#sortFilter').value='default';$('#availableOnly').checked=false;renderProducts();
  });
}
function getFilteredProducts(){
  const term=normalize(filters.query);
  let list=products.filter(p=>{
    if(filters.brand!=='all'&&p.name!==filters.brand)return false;
    if(filters.puffs!=='all'&&p.puffs!==filters.puffs)return false;
    if(filters.available&&stockStatus==='ready'&&!p.flavorOptions.some(f=>Number(f.stock)>0))return false;
    const text=[p.name,p.puffs,p.flavors,...(p.flavorOptions||[]).map(f=>f.name)].join(' ');
    return !term||normalize(text).includes(term);
  });
  switch(filters.sort){
    case 'price-asc':list.sort((a,b)=>a.price-b.price);break;
    case 'price-desc':list.sort((a,b)=>b.price-a.price);break;
    case 'name':list.sort((a,b)=>a.name.localeCompare(b.name,'es'));break;
    default:if(stockStatus==='ready')list.sort((a,b)=>Number(countAvailable(b)>0)-Number(countAvailable(a)>0));break;
  }
  return list;
}
function countAvailable(product){return(product.flavorOptions||[]).filter(f=>Number(f.stock)>0).length}
function renderProducts(){
  const selected=getFilteredProducts();
  const active=filters.query.trim()||filters.brand!=='all'||filters.puffs!=='all'||filters.sort!=='default'||filters.available;
  $('#resetFilters').hidden=!active;
  $('#resultsCount').textContent=`${selected.length} ${selected.length===1?'modelo':'modelos'}`;
  $('#filterSummary').textContent=active?'Resultados según tus filtros':'Mostrando todos los modelos';
  $('#productGrid').innerHTML=selected.length?selected.map(product=>{
    const available=countAvailable(product);
    const ready=stockStatus==='ready';
    const expanded=expandedProducts.has(product.id);
    const soldout=ready&&available===0;
    const note=!ready?(stockStatus==='error'?'Stock sin verificar':'Verificando stock...'):(soldout?'Sin stock':`${available} ${available===1?'sabor disponible':'sabores disponibles'}`);
    return `<article class="product-card" data-id="${escapeHtml(product.id)}">
      <div class="product-top"><div class="product-image"><img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)} ${escapeHtml(product.puffs.toUpperCase())}" loading="lazy" decoding="async"></div>
        <div class="product-meta"><span class="puffs">${escapeHtml(product.puffs.toUpperCase())} PUFFS</span><h3>${escapeHtml(product.name)}</h3><div class="product-price">${product.oldPrice?`<small>${money(product.oldPrice)}</small>`:''}${money(product.price)}</div><span class="stock-note ${soldout?'unavailable':ready?'available':''}">${escapeHtml(note)}</span></div></div>
      <div class="product-foot"><p class="flavor-short">${(product.flavorOptions||[]).length} variedades · Elegí tu sabor</p>
        <button class="expand-flavors" data-action="expand" data-product="${escapeHtml(product.id)}" aria-controls="flavors-${escapeHtml(product.id)}" aria-expanded="${expanded}" ${soldout?'disabled':''}>${expanded?'Ocultar sabores':'Ver y elegir sabores'} <span class="chevron" aria-hidden="true">⌄</span></button></div>
      <div class="flavor-panel" id="flavors-${escapeHtml(product.id)}" ${expanded?'':'hidden'}>${expanded?renderFlavors(product):''}</div>
    </article>`;
  }).join(''):`<div class="empty-products"><h3>No encontramos coincidencias</h3><p>Probá cambiar el término de búsqueda o limpiá los filtros.</p><button class="button-link" type="button" data-action="reset">Limpiar filtros →</button></div>`;
  // Dos columnas independientes: abrir los sabores de una tarjeta no estira
  // la tarjeta vecina ni deja huecos entre los productos de su columna.
  // En celulares conservamos el orden original en una sola columna.
  if(!window.matchMedia('(max-width: 620px)').matches && selected.length){
    const grid=$('#productGrid');
    const columns=[document.createElement('div'),document.createElement('div')];
    for(const col of columns)col.className='product-column';
    [...grid.children].forEach((card,index)=>columns[index%2].appendChild(card));
    grid.replaceChildren(...columns);
  }
}
function renderFlavors(product){
  if(stockStatus!=='ready')return `<div class="empty-flavors">${stockStatus==='error'?'No pudimos comprobar el stock. Reintentá desde el aviso superior.':'Consultando stock para mostrar los sabores disponibles...'}</div>`;
  const searchTerm=filters.query.trim();
  const searchIsForFlavor=Boolean(searchTerm&&!normalize(`${product.name} ${product.puffs}`).includes(normalize(searchTerm)));
  const query=flavorQueries.has(product.id)?flavorQueries.get(product.id):(searchIsForFlavor?searchTerm:'');
  const indexed=(product.flavorOptions||[]).map((flavor,index)=>({...flavor,index})).sort((a,b)=>Number(b.stock||0)-Number(a.stock||0));
  const filtered=indexed.filter(flavor=>normalize(flavor.name).includes(normalize(query)));
  return `<div class="flavor-panel-label"><span>Sabores y disponibilidad</span><span>${countAvailable(product)} disponibles</span></div>
    ${(product.flavorOptions||[]).length>7?`<input class="flavor-search" type="search" data-flavor-search="${escapeHtml(product.id)}" value="${escapeHtml(query)}" aria-label="Buscar sabor de ${escapeHtml(product.name)}" placeholder="Filtrar sabores..." autocomplete="off">`:''}
    <div class="flavor-list">${filtered.length?filtered.map(flavor=>{
      const available=Number(flavor.stock)>0;
      const [name,...other]=flavor.name.split('/');
      const inCart=cart.find(i=>i.productId===product.id&&normalize(i.flavorName)===normalize(flavor.name))?.qty||0;
      return `<div class="flavor-row"><img src="${escapeHtml(flavor.image)}" alt="" loading="lazy" decoding="async"><div class="flavor-row-title"><strong>${escapeHtml(name)}</strong><small>${escapeHtml(other.join('/')||(!available?'Sin stock':`${flavor.stock} disp.`))}${other.length?` · ${available?`${flavor.stock} disp.`:'Sin stock'}`:''}${inCart?` · ${inCart} en pedido`:''}</small></div><button type="button" class="flavor-add" data-action="add" data-product="${escapeHtml(product.id)}" data-index="${flavor.index}" ${available&&inCart<Number(flavor.stock)?'':'disabled'} aria-label="${available?'Agregar':'No disponible'}: ${escapeHtml(name)}" title="${available?'Agregar':'Sin stock'}">${available?'+':'—'}</button></div>`;
    }).join(''):'<div class="empty-flavors">No hay sabores que coincidan con tu búsqueda.</div>'}</div>`;
}
function refreshFlavorPanel(id) {
  const product = getProduct(id);
  const panel = document.getElementById(`flavors-${id}`);

  if (!product || !panel || panel.hidden) return;

  // Generamos la lista actualizada de sabores.
  const temp = document.createElement('div');
  temp.innerHTML = renderFlavors(product);

  const currentList = panel.querySelector('.flavor-list');
  const updatedList = temp.querySelector('.flavor-list');

  // Actualizamos únicamente los sabores.
  // No recreamos el buscador ni modificamos el foco.
  if (currentList && updatedList) {
    currentList.replaceWith(updatedList);
  } else {
    panel.innerHTML = temp.innerHTML;
  }
}
function addFlavor(id,index){
  const product=getProduct(id);const flavor=product?.flavorOptions?.[index];
  if(!product||!flavor||stockStatus!=='ready'){toast('No se pudo verificar este sabor.');return}
  const stock=Number(flavor.stock)||0;
  const found=cart.find(item=>item.productId===id&&normalize(item.flavorName)===normalize(flavor.name));
  if(stock<=0||((found?.qty||0)>=stock)){toast('No quedan más unidades de este sabor.');return}
  if(found)found.qty++;else cart.push({productId:id,flavorName:flavor.name,qty:1});
  persistCart();refreshFlavorPanel(id);toast('Sabor agregado a tu pedido ✓');
}
function updateQty(id,flavor,delta){
  const item=cart.find(i=>i.productId===id&&i.flavorName===flavor);
  if(!item)return;
  const product=getProduct(id),option=product?.flavorOptions?.find(f=>f.name===flavor);
  const limit=Number(option?.stock)||0;
  if(delta>0&&(stockStatus!=='ready'||item.qty>=limit)){toast('No hay más unidades disponibles.');return}
  item.qty+=delta;
  cart=cart.filter(i=>i.qty>0);
  persistCart();refreshFlavorPanel(id);
}
function renderCart(){
  const quantity=countCart(),total=getCartTotal();
  $('#headerCount').textContent=quantity;
  $('#cartCountBadge').textContent=quantity;
  $('#cartTotal').textContent=money(total);
  $('#clearCart').hidden=quantity===0;
  $('#goToCheckout').disabled=quantity===0;
  $('#mobileCartBar').hidden=quantity===0;
  $('#mobileCartCount').textContent=`${quantity} ${quantity===1?'artículo':'artículos'}`;
  $('#mobileCartTotal').textContent=money(total);
  $('#cartItems').innerHTML=quantity?cart.map(item=>{
    const p=getProduct(item.productId);const [label]=item.flavorName.split('/');
    return `<div class="cart-item"><div class="cart-item-head"><strong>${escapeHtml(p.name)} · ${escapeHtml(p.puffs.toUpperCase())}</strong><button type="button" class="remove-item" data-action="remove" data-product="${escapeHtml(item.productId)}" data-flavor="${escapeHtml(item.flavorName)}" aria-label="Quitar ${escapeHtml(p.name)} ${escapeHtml(label)}">×</button></div>
      <p class="cart-flavor">${escapeHtml(label)}</p><div class="cart-item-bottom"><div class="qty-control"><button type="button" data-action="decrement" data-product="${escapeHtml(item.productId)}" data-flavor="${escapeHtml(item.flavorName)}" aria-label="Restar una unidad">−</button><span>${item.qty}</span><button type="button" data-action="increment" data-product="${escapeHtml(item.productId)}" data-flavor="${escapeHtml(item.flavorName)}" aria-label="Sumar una unidad">+</button></div><b>${money(item.qty*p.price)}</b></div></div>`;
  }).join(''):`<div class="empty-cart"><span aria-hidden="true">◇</span><strong>Tu pedido está vacío</strong><p>Elegí un producto y sumá el sabor que más te guste.</p><a href="#catalogo">Ver productos →</a></div>`;
  updateCheckoutTotals();
}
function validateCart(){
  if(stockStatus!=='ready')return 'No pudimos verificar el stock. Tocá «Reintentar» e intentá nuevamente.';
  if(!cart.length)return 'Sumá algún producto para continuar.';
  for(const item of cart){
    const product=getProduct(item.productId);
    const flavor=product?.flavorOptions?.find(f=>normalize(f.name)===normalize(item.flavorName));
    if(!flavor)return 'Uno de los sabores del pedido ya no está disponible.';
    if(item.qty>Number(flavor.stock||0))return `Stock actualizado: ${product.name} (${flavor.name.split('/')[0]}) tiene ${Number(flavor.stock||0)} unidades disponibles. Modificá tu pedido.`;
  }
  return '';
}
function showCheckout(){
  if(!cart.length)return;
  $('#checkout').hidden=false;
  $('#confirmation').hidden=true;
  $('#checkoutFormArea').hidden=false;
  $('#checkoutFeedback').hidden=true;
  updateCheckoutTotals();
  $('#checkout').scrollIntoView({behavior:'smooth',block:'start'});
}
function updateCheckoutTotals(){
  if(!$('#checkoutCity'))return;
  const city=$('#checkoutCity').value;
  const sum=getCartTotal();
  $('#checkoutProductsTotal').textContent=money(sum);
  $('#checkoutShippingTotal').textContent=city?money(shippingFor(city)):'Elegí ciudad';
  $('#checkoutResumeTotal').textContent=money(sum+(city?shippingFor(city):0));
  $('#checkoutItems').innerHTML=cart.map(item=>{
    const p=getProduct(item.productId);return `<div class="summary-product"><span>${item.qty} × ${escapeHtml(p.name)} · ${escapeHtml(item.flavorName.split('/')[0])}</span><strong>${money(item.qty*p.price)}</strong></div>`;
  }).join('');
}
function showCheckoutError(message){const el=$('#checkoutFeedback');el.hidden=false;el.textContent=message;el.scrollIntoView({behavior:'smooth',block:'nearest'})}
function createOrderId(){const now=new Date();const date=[now.getFullYear().toString().slice(-2),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('');const time=[now.getHours(),now.getMinutes(),now.getSeconds()].map(n=>String(n).padStart(2,'0')).join('');return `FX-${date}-${time}-${Math.random().toString(36).slice(2,6).toUpperCase()}`}
function buildOrder(data){
  const shipping=shippingFor(data.ciudad),subtotal=getCartTotal();
  const itemText=cart.map(item=>{const p=getProduct(item.productId);return `${item.qty} x ${p.name} ${p.puffs.toUpperCase()} (${item.flavorName}) - ${money(item.qty*p.price)}`}).join(' | ');
  const state=data.pago==='Transferencia'?'Pendiente de transferencia':'Pago en efectivo al recibir';
  return {pedidoId:createOrderId(),nombre:data.nombre,whatsapp:data.whatsapp,email:data.email,ciudad:data.ciudad,direccion:`${data.ciudad} - ${data.direccion}`,direccionSimple:data.direccion,pago:data.pago,horario:data.horario,productos:`${itemText} | Envío ${data.ciudad}: ${money(shipping)}`,productosDetalle:itemText,subtotal:money(subtotal),envio:money(shipping),total:money(subtotal+shipping),observaciones:`${data.observaciones||''} | Estado de pago: ${state}`};
}
function createWhatsappText(data,order){
  const detail=cart.map(item=>{const p=getProduct(item.productId);return `• ${item.qty} × ${p.name} ${p.puffs.toUpperCase()} — ${item.flavorName.split('/')[0]} — ${money(item.qty*p.price)}`}).join('\n');
  return `Hola Fluxstore, quiero confirmar este pedido (${order.pedidoId}):\n\n${detail}\n\nSubtotal: ${order.subtotal}\nEnvío estimado (${data.ciudad}): ${order.envio}\nTotal estimado: ${order.total}\n\nNombre: ${data.nombre}\nWhatsApp: ${data.whatsapp}\n${data.email?`Email: ${data.email}\n`:''}Dirección: ${data.ciudad}, ${data.direccion}\nForma de pago: ${data.pago}\nHorario: ${data.horario||'A coordinar'}\nObservaciones: ${data.observaciones||'Ninguna'}\n\n¿Podés confirmar la disponibilidad, el total final y la entrega?`;
}
async function submitToSheet(payload){
  try{await fetch(GOOGLE_SCRIPT_URL,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload)});return true}
  catch(error){console.warn('No se pudo contactar la planilla:',error);return false}
}
async function ensureStock(force=false){
  if(stockRequest)return stockRequest;
  if(stockStatus==='ready'&&!force)return true;
  stockStatus='loading';statusMessage('Consultando disponibilidad actual...');renderProducts();
  stockRequest=(async()=>{
    try{
      const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),12000);
      let data;
      try{const response=await fetch(`${GOOGLE_SCRIPT_URL}?type=stock&v=${Date.now()}`,{signal:controller.signal,cache:'no-store'});if(!response.ok)throw new Error('HTTP '+response.status);data=await response.json()}
      finally{clearTimeout(timeout)}
      if(!data.ok||!Array.isArray(data.stock))throw new Error('Formato de stock inválido');
      const index=new Map(data.stock.map(item=>[`${normalize(item.productId)}::${normalize(item.flavor)}`,Math.max(0,Math.trunc(Number(item.stock)||0))]));
      for(const product of products){for(const flavor of product.flavorOptions||[]){flavor.stock=index.get(`${normalize(product.id)}::${normalize(flavor.name)}`)??0}product.soldOut=countAvailable(product)===0}
      stockStatus='ready';statusMessage('Disponibilidad actualizada. Los sabores agotados aparecen deshabilitados.','success');renderProducts();return true;
    }catch(error){console.warn('Error consultando stock:',error);stockStatus='error';statusMessage('No se pudo consultar el stock; evitamos mostrar disponibilidad sin verificar.','error');renderProducts();return false}
    finally{stockRequest=null}
  })();
  return stockRequest;
}
async function handleCheckoutSubmit(event){
  event.preventDefault();
  if(!event.currentTarget.reportValidity())return;
  const phone=$('#checkoutWhatsapp').value.replace(/\D/g,'');
  if(phone.length<8){showCheckoutError('Ingresá un número de WhatsApp válido.');return}
  const data={nombre:$('#checkoutName').value.trim(),whatsapp:$('#checkoutWhatsapp').value.trim(),email:$('#checkoutEmail').value.trim(),ciudad:$('#checkoutCity').value,direccion:$('#checkoutAddress').value.trim(),pago:$('#checkoutPayment').value,horario:$('#checkoutTime').value.trim(),observaciones:$('#checkoutNotes').value.trim()};
  if(data.nombre.length<2||data.direccion.length<3){showCheckoutError('Completá el nombre y una dirección válida.');return}
  const button=$('#submitOrder');button.disabled=true;button.textContent='Verificando disponibilidad...';$('#checkoutFeedback').hidden=true;
  try{
    if(!(await ensureStock(true))){showCheckoutError('No se pudo verificar disponibilidad. Probá de nuevo o consultá por WhatsApp.');return}
    const invalid=validateCart();if(invalid){showCheckoutError(invalid);return}
    const order=buildOrder(data);
    button.textContent='Preparando pedido...';
    const requested=await submitToSheet(order);
    currentOrder={order,data,requested};
    $('#checkoutOrderId').textContent=order.pedidoId;
    $('#checkoutPaymentTotal').textContent=order.total;
    $('#checkoutAlias').textContent=PAYMENT_ALIAS;
    $('#checkoutHolder').textContent=PAYMENT_HOLDER;
    $('#checkoutCvu').textContent=PAYMENT_CVU;
    $('#bankBox').hidden=data.pago!=='Transferencia';
    $('#confirmationMessage').textContent=requested?'Enviá el resumen por WhatsApp para que confirmemos stock, precio final y entrega.':'No pudimos contactar la planilla. Enviá igualmente el resumen por WhatsApp para que podamos ayudarte.';
    $('#checkoutWhatsappReceipt').href=waLink(createWhatsappText(data,order));
    $('#checkoutFormArea').hidden=true;$('#confirmation').hidden=false;
    $('#checkout').scrollIntoView({behavior:'smooth',block:'start'});
  }finally{button.disabled=false;button.innerHTML='Preparar confirmación <span aria-hidden="true">→</span>'}
}
function renderReviews(reviews){
  if(!Array.isArray(reviews)||!reviews.length){$('#reviewsGrid').innerHTML='<p class="reviews-empty">Todavía no hay reseñas publicadas.</p>';$('#averageRating').textContent='—';$('#averageStars').textContent='';$('#reviewCount').textContent='0 reseñas';return}
  const ratings=reviews.map(r=>Math.min(5,Math.max(0,Number(r.estrellas)||0)));
  $('#averageRating').textContent=(ratings.reduce((a,b)=>a+b,0)/ratings.length).toFixed(1);
  $('#averageStars').textContent='★'.repeat(Math.round(ratings.reduce((a,b)=>a+b,0)/ratings.length));
  $('#reviewCount').textContent=`${reviews.length} reseñas`;
  $('#reviewsGrid').innerHTML=reviews.slice(0,6).map(r=>`<article class="review-card"><span class="review-stars" aria-label="${Number(r.estrellas)||0} de 5 estrellas">${'★'.repeat(Math.max(0,Math.min(5,Math.floor(Number(r.estrellas)||0))))}</span><p>${escapeHtml(r.comentario||'Dejó su valoración sin comentario.')}</p><strong>${escapeHtml(r.nombre||'Cliente Fluxstore')}</strong></article>`).join('');
}
async function loadReviews(){try{const response=await fetch(GOOGLE_SCRIPT_URL);if(!response.ok)throw new Error('Sin respuesta');const data=await response.json();renderReviews(data.ok&&Array.isArray(data.reviews)?data.reviews:[])}catch(_error){$('#reviewsGrid').innerHTML='<p class="reviews-empty">Las reseñas no están disponibles en este momento.</p>';$('#reviewCount').textContent='Sin datos';}}
async function handleReview(event){
  event.preventDefault();const button=event.currentTarget.querySelector('button[type=submit]');
  const data={type:'review',nombre:$('#reviewName').value.trim()||'Cliente Fluxstore',estrellas:Number($('#reviewRating').value),comentario:$('#reviewComment').value.trim()};
  button.disabled=true;button.textContent='Enviando...';
  const sent=await submitToSheet(data);
  const feedback=$('#reviewFeedback');feedback.hidden=false;feedback.className=`form-feedback ${sent?'success':''}`;feedback.textContent=sent?'Reseña enviada para procesar. Puede demorar en aparecer.':'No pudimos enviar la reseña. Intentá nuevamente.';
  if(sent){$('#reviewForm').reset();setTimeout(loadReviews,1500)}
  button.disabled=false;button.textContent='Enviar reseña';
}
function trackClick(action,detail=''){void submitToSheet({type:'click',action,detail,page:window.location.href})}
function bindEvents(){
  $('#productGrid').addEventListener('click',event=>{
    const button=event.target.closest('[data-action]');if(!button)return;
    const action=button.dataset.action,id=button.dataset.product;
    if(action==='reset'){$('#resetFilters').click();return}
    if(action==='expand'){
      const product=getProduct(id);
      if(!product)return;
      const expanded=!expandedProducts.has(id);
      if(expanded)expandedProducts.add(id);else expandedProducts.delete(id);
      const panel=document.getElementById(`flavors-${id}`);
      if(panel){panel.hidden=!expanded;panel.innerHTML=expanded?renderFlavors(product):''}
      button.setAttribute('aria-expanded',String(expanded));
      button.innerHTML=`${expanded?'Ocultar sabores':'Ver y elegir sabores'} <span class="chevron" aria-hidden="true">⌄</span>`;
      return;
    }
    if(action==='add')addFlavor(id,Number(button.dataset.index));
  });
  $('#productGrid').addEventListener('input',event=>{
    const id=event.target.dataset.flavorSearch;if(!id)return;
    flavorQueries.set(id,event.target.value);
    const field=event.target;const cursor=field.selectionStart;
    const panel=document.getElementById(`flavors-${id}`);const p=getProduct(id);
    if(!panel||!p)return;
    panel.innerHTML=renderFlavors(p);
    const replacement=panel.querySelector('.flavor-search');
    if(replacement){replacement.focus();replacement.setSelectionRange(cursor,cursor)}
  });
  $('#cartItems').addEventListener('click',event=>{
    const button=event.target.closest('button[data-action]');if(!button)return;
    const {action,product,flavor}=button.dataset;
    if(action==='remove'){cart=cart.filter(i=>i.productId!==product||i.flavorName!==flavor);persistCart();refreshFlavorPanel(product)}
    if(action==='increment'||action==='decrement')updateQty(product,flavor,action==='increment'?1:-1);
  });
  $('#clearCart').addEventListener('click',()=>{cart=[];persistCart();expandedProducts.forEach(refreshFlavorPanel);toast('Pedido vaciado')});
  $('#goToCheckout').addEventListener('click',showCheckout);
  $('#backToCart').addEventListener('click',()=>{$('#checkout').hidden=true;$('#pedido').scrollIntoView({behavior:'smooth',block:'start'})});
  $('#checkoutCity').addEventListener('change',updateCheckoutTotals);
  $('#checkoutForm').addEventListener('submit',handleCheckoutSubmit);
  $('#copyCheckoutAlias').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(PAYMENT_ALIAS);toast('Alias copiado ✓')}catch(_error){toast('Seleccioná el alias y copialo manualmente.')}});
  $('#checkoutWhatsappReceipt').addEventListener('click',()=>{trackClick('Confirmación WhatsApp',currentOrder?.order?.pedidoId||'');cart=[];currentOrder=null;try{localStorage.setItem('fluxstoreCart','[]')}catch(_error){}renderCart()});
  $('#startNewOrder').addEventListener('click',()=>{$('#checkout').hidden=true;$('#catalogo').scrollIntoView({behavior:'smooth',block:'start'})});
  $('#reviewForm').addEventListener('submit',handleReview);
  $('#stockStatus').addEventListener('click',event=>{if(event.target.closest('#retryStock'))void ensureStock(true)});
  const helpText='Hola Fluxstore, tengo una consulta sobre los productos y sabores disponibles.';
  $('#contactWhatsapp').href=waLink(helpText);$('#catalogHelpWhatsapp').href=waLink(helpText);
  $('#contactWhatsapp').addEventListener('click',()=>trackClick('WhatsApp','Contacto'));
  $('#catalogHelpWhatsapp').addEventListener('click',()=>trackClick('WhatsApp','Catálogo'));
}
function setup(){
  initializeFilters();bindEvents();renderCart();renderProducts();
  // Reorganizar el catálogo al pasar de una a dos columnas (o viceversa).
  window.matchMedia('(max-width: 620px)').addEventListener('change',renderProducts);
  void ensureStock();void loadReviews();
}
document.addEventListener('DOMContentLoaded',setup);
