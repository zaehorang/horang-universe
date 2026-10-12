(function(){'use strict';
const A=window.ATLAS,ISO=window.ISO;
const safeStore={get(){try{return localStorage.getItem('horang-last-world')}catch{return null}},set(id){try{localStorage.setItem('horang-last-world',id)}catch{}}};
function svg(tag,attrs,parent){return ISO.el(tag,attrs,parent)}
function path(parent,d,cls){return svg('path',{d,class:cls,fill:'none'},parent)}
function label(parent,x,y,text,cls){const n=svg('text',{x,y,class:cls,'text-anchor':'middle'},parent);n.textContent=text;return n}
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
 return {regions:A.regions.length,worlds:A.worlds.length};
}
window.WORLD={home:{x:800,y:500,s:1},build,reset:function(){},scenes:{}};
})();
