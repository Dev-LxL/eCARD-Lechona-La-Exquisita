'use strict';
// Only replace with the approved public HTTPS URL. Never derive a public URL from localhost.
const PUBLIC_ECARD_URL = '';
const WHATSAPP = 'https://wa.me/573165362096';
const iconNames={phone:'telephone',chat:'whatsapp',mail:'envelope',contact:'person-plus',grid:'grid',share:'share',play:'play-circle',wallet:'bank',home:'house',left:'chevron-left',right:'chevron-right',close:'x-lg',pin:'geo-alt',image:'image'};
function renderIcons(root=document){root.querySelectorAll('[data-icon]').forEach(host=>{
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  const name=iconNames[host.dataset.icon]||host.dataset.icon;
  for(const [key,value] of Object.entries({viewBox:'0 0 16 16',fill:'currentColor',class:'icon bi bi-'+name,'aria-hidden':'true',focusable:'false'}))svg.setAttribute(key,value);
  svg.innerHTML=BOOTSTRAP_ICONS[name]||BOOTSTRAP_ICONS['info-circle-fill'];host.replaceChildren(svg);
});}
renderIcons();
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
document.querySelectorAll('.track').forEach(track=>{
  const controls=document.querySelector(`[data-controls="${track.id}"]`);
  const buttons=controls.querySelectorAll('button');
  const update=()=>{buttons[0].disabled=track.scrollLeft<=2;buttons[1].disabled=track.scrollLeft+track.clientWidth>=track.scrollWidth-3;};
  const move=direction=>{const first=[...track.children].find(item=>!item.hidden);if(first)track.scrollBy({left:direction*(first.getBoundingClientRect().width+parseFloat(getComputedStyle(track).gap)),behavior:reduced()?'instant':'smooth'});};
  buttons.forEach(button=>button.addEventListener('click',()=>move(Number(button.dataset.direction))));
  track.addEventListener('keydown',event=>{if(event.target!==track)return;if(['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();move(event.key==='ArrowLeft'?-1:1);}});
  track.addEventListener('scroll',update,{passive:true});new ResizeObserver(update).observe(track);update();
});
let statusTimer;
function announce(text){const status=document.getElementById('status');clearTimeout(statusTimer);status.textContent=text;status.hidden=false;statusTimer=setTimeout(()=>{status.hidden=true;},7000);}
function openDialog(dialog){dialog.showModal();}
document.querySelectorAll('dialog').forEach(dialog=>{
  let opener;
  const original=dialog.showModal.bind(dialog);
  dialog.showModal=()=>{opener=document.activeElement;original();};
  dialog.querySelector('.close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();});
  dialog.addEventListener('close',()=>{if(opener?.isConnected)opener.focus();});
});
document.querySelectorAll('[data-product]').forEach(button=>button.addEventListener('click',()=>{
  const card=button.closest('.product'),image=card.querySelector('img');
  if(!image||button.disabled)return;
  document.getElementById('detail-title').textContent=card.querySelector('h3').textContent;
  const detailImage=document.getElementById('detail-image');detailImage.src=image.src;detailImage.alt=image.alt;
  document.getElementById('detail-whatsapp').href=card.querySelector('a').getAttribute('href');
  openDialog(document.getElementById('detail-dialog'));
}));
function publicUrl(){try{const u=new URL(PUBLIC_ECARD_URL);return u.protocol==='https:'&&!['localhost','127.0.0.1','[::1]'].includes(u.hostname)?u.href:'';}catch{return '';}}
async function share(){
  const url=publicUrl(),text='Lechona Tolimense La Exquisita · Fabricantes de lechona tolimense en Cali. WhatsApp: '+WHATSAPP;
  const data=url?{title:'La Exquisita · eCARD',text,url}:{title:'La Exquisita · Contacto',text};
  if(navigator.share){try{await navigator.share(data);return;}catch(error){if(error.name==='AbortError')return;}}
  document.getElementById('share-explanation').textContent=url?'Comparte nuestra eCARD.':'Comparte nuestro contacto por WhatsApp.';
  document.getElementById('share-text').value=text+(url?'\n'+url:'');
  openDialog(document.getElementById('share-dialog'));
}
document.querySelectorAll('#share,[data-share]').forEach(button=>button.addEventListener('click',share));
document.getElementById('copy-share').addEventListener('click',async()=>{
  const field=document.getElementById('share-text');
  try{await navigator.clipboard.writeText(field.value);announce('Contacto copiado.');}
  catch{field.focus();field.select();announce('Selecciona y copia el texto para compartirlo.');}
});

// Responsive sticky header.
(()=>{
  const header=document.querySelector('.site-header');
  if(!header)return;
  const toggle=header.querySelector('.header-menu-toggle'),nav=header.querySelector('#header-nav');
  const compact=matchMedia('(max-width: 860px)');
  let open=false;
  function measure(){
    const height=header.getBoundingClientRect?.().height||0;
    if(height>0)document.documentElement.style.setProperty('--header-height',Math.ceil(height)+'px');
  }
  function setOpen(value,returnFocus=false){
    open=Boolean(value&&compact.matches);
    nav.hidden=compact.matches&&!open;
    header.classList.toggle('menu-open',open);
    toggle.setAttribute('aria-expanded',String(open));
    toggle.setAttribute('aria-label',open?'Cerrar menú':'Abrir menú');
    toggle.querySelector('[data-icon]').dataset.icon=open?'close':'list';renderIcons(toggle);
    if(returnFocus&&compact.matches)toggle.focus?.({preventScroll:true});
  }
  function syncMode(){
    const focused=document.activeElement;
    toggle.hidden=!compact.matches;
    setOpen(false);
    if(compact.matches&&focused&&nav.contains(focused))toggle.focus?.({preventScroll:true});
    if(!compact.matches&&focused===toggle)header.querySelector('.brand').focus?.({preventScroll:true});
    measure();
  }
  toggle.addEventListener('click',()=>setOpen(!open));
  header.addEventListener('click',event=>{
    const link=event.target.closest?.('a[href^="#"]');
    if(!link||!header.contains(link)||!compact.matches)return;
    setOpen(false);
    const section=document.getElementById(link.getAttribute('href').slice(1));
    const target=section?.querySelector('h1,h2')||section;
    if(target){
      const temporary=!target.hasAttribute('tabindex');
      if(temporary)target.setAttribute('tabindex','-1');
      target.focus?.({preventScroll:true});
      if(temporary)target.addEventListener('blur',()=>target.removeAttribute('tabindex'),{once:true});
    }
    // Native anchor navigation uses scroll-padding-top and reduced-motion CSS.
  });
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&open){event.preventDefault();setOpen(false,true);}});
  document.addEventListener('click',event=>{if(open&&!header.contains(event.target))setOpen(false);});
  header.addEventListener('focusout',event=>{if(open&&event.relatedTarget&&!header.contains(event.relatedTarget))setOpen(false);});
  const shadow=()=>header.classList.toggle('is-scrolled',(window.scrollY||0)>4);
  window.addEventListener('scroll',shadow,{passive:true});
  if(compact.addEventListener)compact.addEventListener('change',syncMode);else compact.addListener?.(syncMode);
  if(typeof ResizeObserver!=='undefined')new ResizeObserver(measure).observe(header);
  document.fonts?.ready.then(measure);
  syncMode();shadow();
})();
