(function(){'use strict';
const A=window.ATLAS,ISO=window.ISO;
const safeStore={get(){try{return localStorage.getItem('horang-last-world')}catch{return null}},set(id){try{localStorage.setItem('horang-last-world',id)}catch{}}};
function svg(tag,attrs,parent){return ISO.el(tag,attrs,parent)}
function path(parent,d,cls){return svg('path',{d,class:cls,fill:'none'},parent)}
function label(parent,x,y,text,cls){const n=svg('text',{x,y,class:cls,'text-anchor':'middle'},parent);n.textContent=text;return n}

// 상단 검색칸: shared/glossary.json 을 읽어 개념 → 세계·장면 목록을 보여 준다.
// 개념 줄을 고르면 그 개념이 있는 건물을 강조하고, 자리 줄을 고르면 그 건물을 강조한 뒤 세계 앵커로 이동한다.
const RM=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
const norm=s=>String(s||'').toLowerCase().replace(/[\s\-_./·:()]+/g,'');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function setupSearch(){
 const input=document.getElementById('hubSearch'),list=document.getElementById('hubResults'),box=input&&input.closest('.hub-search');
 if(!input||!list)return;
 const worldById=new Map(A.worlds.map(w=>[w.id,w]));
 let entries=[],options=[],active=-1;
 fetch('../../shared/glossary.json').then(r=>{if(!r.ok)throw new Error('glossary.json '+r.status);return r.json()}).then(g=>{
  const concepts=(g.concepts||[]).map(c=>({...c,kind:'concept'}));
  const loose=(g.loose||[]).map(p=>({id:`${p.world}:${p.actor}`,label:p.name,terms:p.real?[p.real]:[],aliases:[],places:[p],kind:'actor'}));
  entries=concepts.concat(loose).map(e=>({...e,places:e.places.filter(p=>worldById.has(p.world))})).filter(e=>e.places.length);
  for(const e of entries){e.keys=[e.label,e.id,...e.terms,...e.aliases].map(norm).filter(Boolean);e.names=e.places.flatMap(p=>[p.name,p.real]).map(norm).filter(Boolean)}
  input.disabled=false;input.placeholder='개념을 치면 그 세계로 (예: Ingress, DNS, 정문)';
  if(input.value)render();
 }).catch(error=>{console.error(error);input.placeholder='사전을 읽지 못했어요';input.setAttribute('aria-label','개념 검색, 사전을 읽지 못함')});
 function score(e,q){
  let best=0;
  for(const k of e.keys)best=Math.max(best,k===q?100:k.startsWith(q)?70:k.includes(q)?40:0);
  for(const k of e.names)best=Math.max(best,k===q?60:k.includes(q)?30:0);
  return best&&best+(e.kind==='concept'?5:0);
 }
 function highlight(ids){
  const set=new Set(ids);
  document.body.classList.toggle('hub-searching',set.size>0);
  for(const g of document.querySelectorAll('#world .hub-building'))g.classList.toggle('hub-found',set.has(g.getAttribute('data-actor')));
 }
 function setActive(i){
  options.forEach((o,k)=>o.el.classList.toggle('on',k===i));active=i;
  const o=options[i];
  if(!o){input.removeAttribute('aria-activedescendant');return}
  input.setAttribute('aria-activedescendant',o.el.id);o.el.scrollIntoView({block:'nearest'});
  highlight(o.place?[o.place.world]:o.entry.places.map(p=>p.world));
 }
 function show(open){list.hidden=!open;input.setAttribute('aria-expanded',String(open));box.classList.toggle('open',open)}
 function close(){show(false);options=[];active=-1;input.removeAttribute('aria-activedescendant')}
 function option(parent,entry,place,html){
  const el=document.createElement('div'),i=options.length;
  el.id=`hubOpt${i}`;el.setAttribute('role','option');el.className=place?'hub-res-place':'hub-res-concept';el.innerHTML=html;
  el.addEventListener('mousemove',()=>{if(active!==i)setActive(i)});
  el.addEventListener('click',()=>choose(i));
  parent.appendChild(el);options.push({el,entry,place});
 }
 function render(){
  const q=norm(input.value);
  list.innerHTML='';options=[];active=-1;input.removeAttribute('aria-activedescendant');
  if(!q){close();highlight([]);return}
  const hits=entries.map(e=>({e,s:score(e,q)})).filter(h=>h.s>0).sort((a,b)=>b.s-a.s||a.e.label.localeCompare(b.e.label)).slice(0,8);
  if(!hits.length){list.innerHTML='<li class="hub-res-empty" role="presentation">아직 지도에 없는 개념이에요</li>';show(true);highlight([]);return}
  for(const {e} of hits){
   const group=document.createElement('li');group.setAttribute('role','group');group.className='hub-res-group';list.appendChild(group);
   const worlds=new Set(e.places.map(p=>p.world)).size;
   const head=e.kind==='concept'?`<span class="n-o">${esc(e.label)}</span><small>${worlds===1?esc(worldById.get(e.places[0].world).title):`세계 ${worlds}곳`}</small>`:`<span class="n-c">${esc(e.label)}</span><small>${esc(e.terms[0]||'')}</small>`;
   option(group,e,null,head+(e.note?`<span class="hub-res-note">${esc(e.note)}</span>`:''));
   group.setAttribute('aria-labelledby',options[options.length-1].el.id);
   for(const p of e.places){
    const w=worldById.get(p.world),sc=p.scenes&&p.scenes[0];
    option(group,e,p,`<span class="hub-res-world">${esc(w.title)}</span>${p.name?`<span class="n-c">${esc(p.name)}</span>`:''}<small>${sc?`${esc(sc.title)} · ${sc.beat}장면`:'세계 입구'}</small>`);
   }
  }
  show(true);highlight(hits[0].e.places.map(p=>p.world));
 }
 function choose(i){
  const o=options[i];if(!o)return;
  setActive(i);
  if(!o.place)return;
  safeStore.set(o.place.world);
  const g=document.querySelector(`#world .hub-building[data-actor="${CSS.escape(o.place.world)}"]`);if(g)g.classList.add('hub-go');
  setTimeout(()=>{location.href='../../'+o.place.href},RM?0:420);
 }
 input.addEventListener('input',render);
 input.addEventListener('focus',()=>{if(input.value&&!options.length)render();else if(options.length)show(true)});
 input.addEventListener('blur',()=>{show(false)});
 list.addEventListener('mousedown',e=>e.preventDefault());
 input.addEventListener('keydown',e=>{
  e.stopPropagation(); // 엔진의 전역 단축키(?, Escape)가 입력 중에 끼어들지 않게
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){if(!options.length)return;e.preventDefault();if(list.hidden)show(true);const n=options.length;setActive(active<0?(e.key==='ArrowDown'?0:n-1):(active+(e.key==='ArrowDown'?1:-1)+n)%n)}
  else if(e.key==='Enter'){if(!options.length)return;e.preventDefault();choose(active<0?0:active)}
  else if(e.key==='Escape'){e.preventDefault();if(!list.hidden&&options.length)close();else{input.value='';render()}}
 });
}
function build(api){
 const root=document.documentElement.style;
 root.setProperty('--world-bg',A.hub.sea);root.setProperty('--world-bg-deep',A.hub.seaDeep);root.setProperty('--sea',A.hub.sea);root.setProperty('--sea-deep',A.hub.seaDeep);root.setProperty('--shore',A.hub.shore);
 for(const r of A.regions){root.setProperty(`--region-${r.id}`,r.tone);root.setProperty(`--region-${r.id}-deep`,r.toneDeep||r.tone)}
 const count=document.getElementById('hubCount');if(count)count.textContent=`지역 ${A.regions.length} · 세계 ${A.worlds.length}`;
 const regionById=new Map(A.regions.map(r=>[r.id,r]));
 const routes=new Set();for(const d of A.doors||[]){const wa=A.worlds.find(w=>w.id===d.from.world),wb=A.worlds.find(w=>w.id===d.to.world);if(!wa||!wb||wa.region===wb.region)continue;const key=[wa.region,wb.region].sort().join(':');if(routes.has(key))continue;routes.add(key);const ra=regionById.get(wa.region),rb=regionById.get(wb.region);if(!ra||!rb)continue;const [x1,y1]=ra.pos,[x2,y2]=rb.pos;path(api.L.base,`M${x1},${y1} Q${(x1+x2)/2},${Math.min(y1,y2)-110} ${x2},${y2}`,'hub-route');for(const [x,y] of [ra.pos,rb.pos])svg('circle',{cx:x,cy:y,r:8,class:'hub-buoy'},api.L.base)}
 for(const r of A.regions){const [x,y]=r.pos,ws=A.worlds.filter(w=>w.region===r.id),size=Math.max(190,140+ws.length*45),g=ISO.act(api.L.ground,`region-${r.id}`,r.name,'hub-region');g.setAttribute('transform',`translate(${x},${y})`);
  ISO.box(g,ISO.isoL,-size/2,-size/2,0,size,size,18,[A.hub.shore,A.hub.shore,A.hub.shore]);
  ISO.box(g,ISO.isoL,-size/2+14,-size/2+14,18,size-28,size-28,6,[r.tone,r.toneDeep||r.tone,r.toneDeep||r.tone]);
  const texture=svg('polygon',{points:ISO.pts([ISO.isoL(-size/2+14,-size/2+14,24),ISO.isoL(size/2-14,-size/2+14,24),ISO.isoL(size/2-14,size/2-14,24),ISO.isoL(-size/2+14,size/2-14,24)]),fill:`url(#tex-${r.texture})`,opacity:'.5'},g);
  texture.setAttribute('pointer-events','none');api.label(x,y-95,r.name,r.name,true);
  for(let i=1;i<ws.length;i++)path(api.L.ground,`M${ws[i-1].pos[0]},${ws[i-1].pos[1]} L${ws[i].pos[0]},${ws[i].pos[1]}`,'hub-road');
 }
 for(const w of A.worlds){const [x,y]=w.pos,g=ISO.act(api.L.mid,w.id,w.title||w.id,'hub-building');g.setAttribute('transform',`translate(${x},${y})`);
  if(w.status==='draft'){
   ISO.box(g,ISO.isoL,-38,-38,0,76,76,10,['url(#tex-hatch)','#a4afb8','#8996a2']);ISO.person(g,57,28,{hard:true});
   const sign=ISO.paper(g,'공사');sign.setAttribute('opacity','1');sign.setAttribute('transform','translate(-45,-25)');
  }else{ISO.box(g,ISO.isoL,-35,-35,0,70,70,48,ISO.C.wall);ISO.box(g,ISO.isoL,-39,-39,48,78,78,9,[w.roof,w.roof,w.roof])}
  label(g,0,75,w.title||w.id,'hub-building-label');
  g.addEventListener('click',()=>safeStore.set(w.id));
 }
 const last=A.worlds.find(w=>w.id===safeStore.get());if(last){const [x,y]=last.pos;ISO.person(api.L.front,x+50,y+65,{body:'#ff7a59'});path(api.L.front,`M${x+50},${y-30} l-9,-15 a12,12 0 1,1 18,0 Z`,'hub-here')}
 setupSearch();
 return {regions:A.regions.length,worlds:A.worlds.length};
}
window.WORLD={home:{x:800,y:500,s:1},build,reset:function(){},scenes:{}};
})();
