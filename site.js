'use strict';
const data = window.studioData || {email:'',artworks:[]};
const works = Array.isArray(data.artworks) ? data.artworks.filter(work=>work && typeof work.title==='string' && typeof work.image==='string') : [];
const grid = document.querySelector('#artwork-grid');
const dialog = document.getElementById('artwork-dialog');
if(grid){
 const filters = document.querySelector('.filter-row');
 const status = document.querySelector('#gallery-status');
 let shown = [...works],currentIndex = 0,lastFocus=null;
 filters.hidden=works.length===0;
 const img = document.getElementById('dialog-image');
 const dialogTitle=document.getElementById('dialog-title');
 const dialogLink=document.getElementById('dialog-inquire');
 const dialogDetails=document.getElementById('dialog-details');
 const dialogAvailability=document.getElementById('dialog-availability');
 const dialogCondition=document.getElementById('dialog-condition');
 const dialogDescription=document.getElementById('dialog-description');
 const label = work => [work.year,work.medium,work.dimensions].filter(Boolean).join(' · ');
 const availability = work => typeof work.originalAvailable==='boolean' ?
  (work.originalAvailable ? 'Original available' : 'Original unavailable') : '';
 const inquiry = work => 'contact.html?topic='+(work.originalAvailable===false?'general':'artwork')+'&work='+encodeURIComponent(work.title);
 const inquiryLabel = work => work.originalAvailable===false ? 'Contact the studio ↗' : 'Inquire about this work ↗';
 function selectImage(index){
  if(!shown.length) return;
  currentIndex=(index+shown.length)%shown.length;
  const work=shown[currentIndex];
  img.src=work.image;img.alt=work.alt||work.title+' by Uriel Alexander';
  dialogTitle.textContent=work.title;dialogLink.href=inquiry(work);dialogLink.textContent=inquiryLabel(work);
  dialogDetails.textContent=label(work);
  dialogAvailability.textContent=[availability(work),work.framing].filter(Boolean).join(' · ');
  dialogCondition.textContent=[work.completion,work.finish].filter(Boolean).join(' · ');
  dialogCondition.hidden=!dialogCondition.textContent;
  dialogDescription.textContent=work.description||'';dialogDescription.hidden=!work.description;
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
  shown=works.filter(w=>category==='all'||(Array.isArray(w.categories)&&w.categories.includes(category)));
  grid.replaceChildren();
  status.textContent=shown.length?shown.length+(shown.length===1?' painting':' paintings'):'No paintings match this selection.';
  shown.forEach((work,index)=>{
   const card=document.createElement('article');card.className='art-card launch-art-card';
   const open=document.createElement('button');open.type='button';open.className='launch-art-image-button';open.setAttribute('aria-label','View complete painting: '+work.title);
   const photo=document.createElement('img');photo.className='artwork-photo';photo.src=work.image;photo.alt=work.alt||work.title+' by Uriel Alexander';photo.loading='lazy';photo.decoding='async';
   photo.addEventListener('error',()=>{const notice=document.createElement('span');notice.className='image-notice';notice.textContent='Artwork photograph temporarily unavailable.';photo.replaceWith(notice)},{once:true});
   const zoom=document.createElement('span');zoom.className='launch-art-zoom';zoom.textContent='View full artwork ↗';open.append(photo,zoom);
   open.addEventListener('click',()=>openImage(index,open));
   const meta=document.createElement('div');meta.className='art-meta';
   const text=document.createElement('div'),title=document.createElement('h2'),detail=document.createElement('p'),original=document.createElement('p'),link=document.createElement('a');
   title.className='art-title';title.textContent=work.title;detail.className='art-details';
   detail.textContent=label(work)||'Original artwork · Uriel Alexander';
   original.className='art-details launch-art-availability';original.textContent=availability(work);original.hidden=!original.textContent;
   text.append(title,detail,original);link.href=inquiry(work);link.className='launch-art-inquire';link.textContent=inquiryLabel(work);meta.append(text,link);card.append(open,meta);grid.append(card);
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

// Netlify processes HTML forms. Do not intercept the POST or pretend a message was sent.
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
