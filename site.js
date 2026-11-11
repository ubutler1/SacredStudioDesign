'use strict';
const data = window.studioData || {email:'',artworks:[]};
const works = Array.isArray(data.artworks) ? data.artworks.filter(work=>work && typeof work.title==='string' && typeof work.image==='string') : [];
const artworkPage = work => 'artwork/' + work.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') + '.html';
const grid = document.querySelector('#artwork-grid');
// Structured collector details use only artist-confirmed fields. Omit unknowns.
const detailsFor = work => [
 ['Year', work.year],
 ['Medium', work.materials || work.medium],
 ['Support', [work.support, work.canvasDepth].filter(Boolean).join(' · ')],
 ['Dimensions', work.dimensions ? work.dimensions + ' (width × height)' : ''],
 ['Framing', work.framing],
 ['Finish', work.finish],
 ['Status', work.completion],
 ['Original', typeof work.originalAvailable === 'boolean' ? (work.originalAvailable ? 'Available' : 'Unavailable') : '']
].filter(([, value]) => value !== undefined && value !== null && value !== '');
const dialog = document.getElementById('artwork-dialog');
// These are copying deterrents, not access control. A public image and screenshots
// remain retrievable. Do not disable navigation, text copying or browser shortcuts.
const artSelector = '[data-studio-artwork]';
const artSurfaceSelector = '.studio-artwork-surface';
function protectArtwork(image) {
 image.setAttribute('data-studio-artwork', '');
 image.draggable = false;
 image.parentElement?.classList.add('studio-artwork-surface');
}
for (const image of document.querySelectorAll('img')) {
 if (works.some(work => image.getAttribute('src') === work.image)) protectArtwork(image);
}
function isArtworkTarget(target) {
 return target instanceof Element && Boolean(target.closest(artSelector + ',' + artSurfaceSelector));
}
let artworkNotice;
function explainImageRights() {
 if (!artworkNotice) {
  artworkNotice = document.createElement('p');
  artworkNotice.className = 'studio-artwork-notice';
  artworkNotice.setAttribute('role', 'status');
 }
 const container = dialog?.open ? dialog : document.body;
 if (artworkNotice.parentElement !== container) container.append(artworkNotice);
 artworkNotice.textContent = 'Artwork © Uriel Alexander. Please contact the studio for image permission.';
}
document.addEventListener('contextmenu', event => {
 if (!isArtworkTarget(event.target)) return;
 event.preventDefault(); explainImageRights();
});
document.addEventListener('dragstart', event => {
 if (isArtworkTarget(event.target)) { event.preventDefault(); explainImageRights(); }
});
document.addEventListener('copy', event => {
 if (event.target instanceof Element && event.target.closest('input,textarea,[contenteditable]:not([contenteditable="false"])')) return;
 const selection = window.getSelection();
 const includesArtwork = selection && Array.from({length:selection.rangeCount}, (_, i) => selection.getRangeAt(i))
  .some(range => Array.from(document.querySelectorAll(artSelector)).some(image => range.intersectsNode(image)));
 if (!isArtworkTarget(event.target) && !includesArtwork) return;
 // Preserve selected text, omitting embedded images from ordinary clipboard HTML.
 event.clipboardData?.setData('text/plain', selection?.toString() || 'Artwork © Uriel Alexander');
 event.preventDefault(); explainImageRights();
});
document.addEventListener('pointerdown', event => {
 if (artworkNotice && !isArtworkTarget(event.target)) artworkNotice.textContent = '';
});
if(grid){
 const galleryWorks = [...works].sort((a,b)=>Number(b.originalAvailable===true)-Number(a.originalAvailable===true));
 const filters = document.querySelector('.filter-row');
 const status = document.querySelector('#gallery-status');
 let shown = [...galleryWorks],currentIndex = 0,lastFocus=null;
 filters.hidden=works.length===0;
 const img = document.getElementById('dialog-image');
 const dialogTitle=document.getElementById('dialog-title');
 const dialogLink=document.getElementById('dialog-inquire');
 const dialogDetails=document.getElementById('dialog-details');
 const dialogDescription=document.getElementById('dialog-description');
 const label = work => [work.year,work.medium,work.dimensions].filter(Boolean).join(' · ');
 const availability = work => typeof work.originalAvailable==='boolean' ?
  (work.originalAvailable ? 'Original inquiries welcome' : 'Original unavailable') : '';
 const inquiry = work => 'contact.html?topic='+(work.originalAvailable===false?'general':'artwork')+'&work='+encodeURIComponent(work.title);
 const inquiryLabel = work => work.originalAvailable===false ? 'Contact the studio ↗' : 'Inquire about this work ↗';
 function selectImage(index){
  if(!shown.length) return;
  currentIndex=(index+shown.length)%shown.length;
  const work=shown[currentIndex];
  img.src=work.image;img.alt=work.alt||work.title+' by Uriel Alexander';
  protectArtwork(img);
  dialogTitle.textContent=work.title;dialogLink.href=inquiry(work);dialogLink.textContent=inquiryLabel(work);
  const pageLink = document.getElementById('dialog-artwork-page');
  if (pageLink) pageLink.href = artworkPage(work);
  dialogDetails.replaceChildren(...detailsFor(work).map(([name, detail]) => {
   const row=document.createElement('div'),term=document.createElement('dt'),value=document.createElement('dd');
   row.className='launch-work-detail';term.textContent=name;value.textContent=String(detail);
   if(name==='Original')value.id='dialog-availability';
   if(name==='Status')value.id='dialog-condition';
   row.append(term,value);return row;
  }));
  dialogDescription.textContent=work.description||'';dialogDescription.hidden=!work.description;
  document.getElementById('dialog-story').hidden=!work.description;
  dialog.scrollTop=0;
 }
 function openImage(index,trigger){
  if(!dialog || typeof dialog.showModal!=='function')return;
  lastFocus=trigger;selectImage(index);dialog.showModal();document.getElementById('dialog-close').focus();
 }
 document.getElementById('dialog-close')?.addEventListener('click',()=>dialog.close());
 document.getElementById('dialog-next')?.addEventListener('click',()=>selectImage(currentIndex+1));
 document.getElementById('dialog-prev')?.addEventListener('click',()=>selectImage(currentIndex-1));
 dialog?.addEventListener('close',()=>{if(lastFocus?.isConnected)lastFocus.focus();lastFocus=null});
 dialog?.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
 dialog?.addEventListener('keydown',e=>{
  if(e.key==='Tab'){
   const first=document.getElementById('dialog-close'),last=document.getElementById('dialog-next');
   const active=document.activeElement;
   if(e.shiftKey&&(active===first||active===dialog)){e.preventDefault();last.focus()}
   else if(!e.shiftKey&&(active===last||active===dialog)){e.preventDefault();first.focus()}
  }
  if(e.key==='ArrowRight'){e.preventDefault();selectImage(currentIndex+1)}
  if(e.key==='ArrowLeft'){e.preventDefault();selectImage(currentIndex-1)}
 });
 function render(category){
  shown=galleryWorks.filter(w=>category==='all'||(category==='originals' ? w.originalAvailable===true : Array.isArray(w.categories)&&w.categories.includes(category)));
  grid.replaceChildren();
  status.textContent=shown.length?shown.length+(shown.length===1?' painting':' paintings'):'No paintings match this selection.';
  shown.forEach((work,index)=>{
   const card=document.createElement('article');card.className='art-card launch-art-card';
   if(work.originalAvailable===true)card.setAttribute('data-original-inquiry','');
   const open=document.createElement('button');open.type='button';open.className='launch-art-image-button';open.setAttribute('aria-label','View complete painting: '+work.title);
   const photo=document.createElement('img');photo.className='artwork-photo';photo.src=work.image;photo.alt=work.alt||work.title+' by Uriel Alexander';photo.loading=index<2?'eager':'lazy';photo.decoding='async';
   photo.setAttribute('data-studio-artwork','');photo.draggable=false;open.classList.add('studio-artwork-surface');
   photo.addEventListener('error',()=>{const notice=document.createElement('span');notice.className='image-notice';notice.textContent='Artwork photograph temporarily unavailable.';photo.replaceWith(notice)},{once:true});
   const zoom=document.createElement('span');zoom.className='launch-art-zoom';zoom.textContent='View full artwork & details ↗';open.append(photo,zoom);
   open.addEventListener('click',()=>openImage(index,open));
   const meta=document.createElement('div');meta.className='art-meta';
   const text=document.createElement('div'),title=document.createElement('h2'),detail=document.createElement('p'),original=document.createElement('p'),link=document.createElement('a');
   title.className='art-title';title.textContent=work.title;detail.className='art-details';
   detail.textContent=label(work)||'Original artwork · Uriel Alexander';
   original.className='art-details launch-art-availability';original.textContent=availability(work);original.hidden=!original.textContent;
   const pageLink=document.createElement('a');pageLink.href=artworkPage(work);pageLink.className='studio-artwork-page-link';pageLink.textContent='Artwork page ↗';
   text.append(title,detail,original);link.href=inquiry(work);link.className='launch-art-inquire';link.textContent=inquiryLabel(work);meta.append(text,pageLink,link);card.append(open,meta);grid.append(card);
  });
 }
 filters.addEventListener('click',e=>{
  const button=e.target.closest('button[data-filter]');if(!button)return;
  for(const b of filters.querySelectorAll('button[data-filter]')){const active=b===button;b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',String(active))}
  render(button.dataset.filter);
 });
 render('all');
 const requested=new URLSearchParams(location.search).get('work');
 const position=shown.findIndex(w=>w.title===requested);
 if(position>=0){const btn=grid.querySelectorAll('.launch-art-image-button')[position];if(btn)openImage(position,btn)}
}

// The native Cloudflare handler processes HTML forms. Do not intercept the POST or fake a successful submission.
const form = document.querySelector('#inquiry-form');
if (form) {
  const params = new URLSearchParams(location.search);
  const topic = params.get('topic');
  if (['commission','artwork','prints','collaboration','general'].includes(topic)) form.elements.topic.value = topic;
  const work = params.get('work');
  const known = Array.isArray(data.artworks) && data.artworks.some(item => item.title === work);
  if (work && known) form.elements.message.value = 'I am interested in “' + work + '”.\n\n';
}

// Prevent an unsightly broken-image icon before web photographs are uploaded.
for (const image of document.querySelectorAll('.artwork-managed-image')) {
  image.addEventListener('error', () => {
    const notice = document.createElement('span');
    notice.className = 'home-image-unavailable';
    notice.textContent = 'Artwork image being prepared';
    image.replaceWith(notice);
  }, { once: true });
}
