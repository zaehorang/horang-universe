import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {root,registry,content,isMain,validId} from './lib.mjs';

// 용어 사전 = 자동 대응(각 세계 meta.concepts × actors[].real) + 손 보강(shared/glossary.overrides.json).
// 자동 대응: 개념 id 를 '-' 없이 붙인 꼴이 real 의 연속 영문 토큰을 붙인 꼴과 같으면 그 actor 를 개념의 자리로 본다.
// 예: btree ↔ "B-tree index", shared-buffers ↔ "shared_buffers", route53 ↔ "Route 53". 같은 actor 에서 더 긴 개념에 포함된 짧은 개념은 버린다.
// 자동 대응은 사람이 검토한 것만 쓴다: overrides.autoAccepted(받아들임) 나 unlinks(버림)에 없는 새 자동 대응은 문제로 보고한다.
// 개념의 세계 소속은 세계 meta.concepts 만 정한다(D8). overrides 는 이미 소속된 개념에 actor·사건을 이어 줄 뿐이다.
export const GLOSSARY='shared/glossary.json',OVERRIDES='shared/glossary.overrides.json';
const HEADER='tooling/scripts/build_glossary.mjs 생성물 — 직접 편집 금지. 손 보강은 shared/glossary.overrides.json';
const MAX_SPAN=4;

function tokens(text){return [...String(text||'').matchAll(/[A-Za-z0-9]+/g)].map(m=>({t:m[0].toLowerCase(),start:m.index,end:m.index+m[0].length}))}
// real 에서 개념이 차지하는 토큰 범위와 원문 표기를 돌려준다. 없으면 null.
function findSpan(real,concept){
 const tk=tokens(real),want=concept.replaceAll('-','');
 for(let i=0;i<tk.length;i++){let s='';for(let j=i;j<Math.min(tk.length,i+MAX_SPAN);j++){s+=tk[j].t;if(s===want)return {i,j,text:real.slice(tk[i].start,tk[j].end)};if(!want.startsWith(s))break}}
 return null;
}
// 사건마다 이 actor 가 처음 주인공인 장면(1부터).
function scenesOf(events,actor){
 const out=[];
 for(const e of events){const k=(e.beats||[]).findIndex(b=>b&&b.actor===actor);if(k>=0)out.push({event:e.id,title:e.title||e.id,beat:k+1})}
 return out;
}
function href(world,scene){return `worlds/${world}/`+(scene?`#ev=${encodeURIComponent(scene.event)}&b=${scene.beat}`:'')}

export function readOverrides(){
 const path=join(root,OVERRIDES);
 if(!existsSync(path))return {};
 return JSON.parse(readFileSync(path,'utf8'));
}

// 사전을 계산한다. 손 보강이 가리키는 대상이 없으면 problems 에 남긴다(check_all 이 오류로 올린다).
export function computeGlossary(){
 const reg=registry(),ov=readOverrides(),problems=[];
 const merge=ov.merge||{},canon=id=>merge[id]||id;
 const worlds=[];
 for(const w of reg.worlds){
  if(w.status==='archived')continue;
  let c;try{c=content(w.id)}catch(e){if(w.status!=='draft')throw e;continue}
  if(!c||typeof c!=='object')continue;
  const concepts=Array.isArray(c.meta?.concepts)?c.meta.concepts.filter(validId):[];
  worlds.push({id:w.id,status:w.status,concepts,actors:c.actors&&typeof c.actors==='object'?c.actors:{},events:Array.isArray(c.events)?c.events.filter(e=>e&&typeof e==='object'&&e.id):[]});
 }
 const byWorld=new Map(worlds.map(w=>[w.id,w]));
 const known=new Set(worlds.flatMap(w=>w.concepts));
 for(const [from,to] of Object.entries(merge)){
  if(!known.has(from))problems.push(`merge: 개념 '${from}' 을 쓰는 세계가 없음`);
  if(!validId(to))problems.push(`merge: '${from}' → '${to}' 는 개념 id 문법이 아님`);
 }
 // links: 개념 → Set("world:actor")
 const links=new Map(),labelFrom=new Map(),worldsOf=new Map(),prefer=new Map(),entryEvent=new Map(),autoLinks=new Set();
 const linkKey=(world,actor)=>`${world}:${actor}`;
 const addLink=(concept,world,actor)=>{if(!links.has(concept))links.set(concept,new Set());links.get(concept).add(linkKey(world,actor))};
 for(const w of worlds){
  for(const raw of w.concepts){const id=canon(raw);if(!worldsOf.has(id))worldsOf.set(id,new Set());worldsOf.get(id).add(w.id)}
  for(const [key,a] of Object.entries(w.actors)){
   const hits=w.concepts.map(id=>({id,span:findSpan(a?.real,id)})).filter(h=>h.span);
   const kept=hits.filter(h=>!hits.some(o=>o!==h&&o.span.i<=h.span.i&&o.span.j>=h.span.j&&(o.span.j-o.span.i)>(h.span.j-h.span.i)));
   for(const h of kept){const id=canon(h.id);addLink(id,w.id,key);autoLinks.add(`${id} ${linkKey(w.id,key)}`);if(!labelFrom.has(id))labelFrom.set(id,h.span.text)}
  }
 }
 const checkTarget=(kind,o)=>{
  const w=byWorld.get(o?.world);
  if(!w){problems.push(`${kind}: 세계 '${o?.world}' 없음`);return false}
  if(o.actor!=null&&!Object.hasOwn(w.actors,o.actor)){problems.push(`${kind}: ${o.world} 에 actor '${o.actor}' 없음`);return false}
  if(!worldsOf.get(canon(o.concept))?.has(o.world)){problems.push(`${kind}: 개념 '${o.concept}' 이 ${o.world} 의 meta.concepts 에 없음 — 소속은 세계 meta 에 먼저 적는다`);return false}
  return true;
 };
 for(const o of ov.unlinks||[]){
  if(!checkTarget('unlinks',o))continue;
  const set=links.get(canon(o.concept));
  if(!set?.delete(linkKey(o.world,o.actor)))problems.push(`unlinks: ${o.concept} ↔ ${o.world}:${o.actor} 는 자동 대응에 없음(지워도 됨)`);
  autoLinks.delete(`${canon(o.concept)} ${linkKey(o.world,o.actor)}`);
 }
 // 자동 대응 검토: 받아들인 목록과 현재 자동 대응이 같아야 한다.
 const accepted=new Set(Object.entries(ov.autoAccepted||{}).flatMap(([id,list])=>list.map(t=>`${canon(id)} ${t}`)));
 for(const a of autoLinks)if(!accepted.has(a))problems.push(`새 자동 대응 검토 필요: ${a.replace(' ',' ↔ ')} — 맞으면 autoAccepted 에, 틀리면 unlinks 에 적는다`);
 for(const a of accepted)if(!autoLinks.has(a))problems.push(`autoAccepted: ${a.replace(' ',' ↔ ')} 는 더 이상 자동 대응이 아님(지우거나 links 로 옮김)`);
 for(const o of ov.links||[]){
  if(!checkTarget('links',o))continue;
  const id=canon(o.concept);
  // actor 없이 event 만 주면 세계 입구 자리를 그 사건 1장면으로 연다(건물 전체가 개념인 경우, 예: osi → tour).
  if(o.actor==null){
   if(!byWorld.get(o.world).events.some(e=>e.id===o.event))problems.push(`links: ${o.world} 에 사건 '${o.event}' 없음`);
   else entryEvent.set(`${id}|${o.world}`,o.event);
   continue;
  }
  if(links.get(id)?.has(linkKey(o.world,o.actor)))problems.push(`links: ${o.concept} ↔ ${o.world}:${o.actor} 는 이미 자동 대응됨(지워도 됨)`);
  addLink(id,o.world,o.actor);
  if(o.event!=null){
   if(!byWorld.get(o.world).events.some(e=>e.id===o.event))problems.push(`links: ${o.world} 에 사건 '${o.event}' 없음`);
   else if(!scenesOf(byWorld.get(o.world).events,o.actor).some(s=>s.event===o.event))problems.push(`links: ${o.world}:${o.actor} 는 사건 '${o.event}' 에 나오지 않음`);
   else prefer.set(`${id}|${linkKey(o.world,o.actor)}`,o.event);
  }
 }
 for(const field of ['labels','aliases','notes'])for(const id of Object.keys(ov[field]||{}))if(!worldsOf.has(id))problems.push(`${field}: 개념 '${id}' 을 쓰는 세계가 없음`);

 // links 의 event 는 그 개념에서 먼저 보여 줄 사건이다. 없으면 actor 가 처음 나오는 사건.
 // status 는 등록부 상태(draft 면 허브 검색이 '공사 중'으로 표시).
 const place=(world,actor,concept)=>{
  const w=byWorld.get(world);
  if(actor==null){
   const ev=w.events.find(e=>e.id===entryEvent.get(`${concept}|${world}`)),scenes=ev?[{event:ev.id,title:ev.title||ev.id,beat:1}]:[];
   return {world,status:w.status,actor:null,name:null,real:null,scenes,href:href(world,scenes[0])};
  }
  const a=w.actors[actor]||{},scenes=scenesOf(w.events,actor),first=prefer.get(`${concept}|${linkKey(world,actor)}`);
  if(first)scenes.sort((x,y)=>(y.event===first)-(x.event===first));
  return {world,status:w.status,actor,name:a.name||actor,real:a.real||'',scenes,href:href(world,scenes[0])};
 };
 const order=new Map(worlds.map((w,i)=>[w.id,i]));
 const actorOrder=(world,actor)=>Object.keys(byWorld.get(world).actors).indexOf(actor);
 const linked=new Set();
 const concepts=[...worldsOf.keys()].sort().map(id=>{
  const keys=[...(links.get(id)||[])].map(k=>k.split(':'));
  for(const [w,a] of keys)linked.add(linkKey(w,a));
  keys.sort((x,y)=>order.get(x[0])-order.get(y[0])||actorOrder(x[0],x[1])-actorOrder(y[0],y[1]));
  const places=keys.map(([w,a])=>place(w,a,id));
  // 개념을 적었지만 맞는 actor 가 없는 세계는 세계 입구를 자리로 둔다.
  for(const w of [...worldsOf.get(id)].sort((x,y)=>order.get(x)-order.get(y)))if(!places.some(p=>p.world===w))places.push(place(w,null,id));
  places.sort((x,y)=>order.get(x.world)-order.get(y.world));
  for(const key of entryEvent.keys()){const [c,w]=key.split('|');if(c===id&&places.some(p=>p.world===w&&p.actor!=null))problems.push(`links: ${id} 의 ${w} 세계 입구 연결은 actor 자리가 있어 쓰이지 않음`)}
  const terms=[...new Set(places.map(p=>p.real).filter(Boolean))];
  const entry={id,label:ov.labels?.[id]||labelFrom.get(id)||id,terms,aliases:ov.aliases?.[id]||[],places};
  if(ov.notes?.[id])entry.note=ov.notes[id];
  return entry;
 });
 const loose=[];
 for(const w of worlds)for(const key of Object.keys(w.actors))if(!linked.has(linkKey(w.id,key)))loose.push(place(w.id,key));
 const unlabeled=concepts.filter(c=>!ov.labels?.[c.id]&&!labelFrom.has(c.id)).map(c=>c.id);
 return {glossary:{$generated:HEADER,concepts,loose},problems,unlabeled};
}
export function serializeGlossary(g){return JSON.stringify(g,null,1)+'\n'}

if(isMain(import.meta.url)){
 const {glossary,problems,unlabeled}=computeGlossary();
 for(const p of problems)console.error('✗',p);
 if(problems.length){process.exitCode=1}
 else{
  writeFileSync(join(root,GLOSSARY),serializeGlossary(glossary));
  console.log(`OK glossary: 개념 ${glossary.concepts.length}, 묶이지 않은 actor ${glossary.loose.length}`+(unlabeled.length?` · 표시명 없는 개념(overrides labels 에 추가): ${unlabeled.join(', ')}`:''));
 }
}
