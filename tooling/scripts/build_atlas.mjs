import {writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {root,registry,content,isMain} from './lib.mjs';
export function buildAtlas(){const reg=registry(),regions=reg.regions,worlds=[],doors=[];
 for(const w of reg.worlds){if(w.status==='archived')continue;let c;try{c=content(w.id)}catch(e){if(w.status!=='draft')throw e}if(!c||typeof c!=='object')c={};const meta=c.meta&&typeof c.meta==='object'?c.meta:{};const events=Array.isArray(c.events)?c.events:[],region=regions.find(r=>r.id===w.region);worlds.push({...w,title:c.title||w.id,subtitle:c.subtitle||'',logo:c.logo||'',roof:meta.hubColor||region.toneDeep||region.tone,regionName:region.name,concepts:Array.isArray(meta.concepts)?meta.concepts:[],events:events.filter(e=>e&&typeof e==='object').map(e=>({id:e.id,title:e.title,kind:e.kind,beats:e.beats?.length||0})),guest:meta.guest||null,values:Array.isArray(meta.values)?meta.values:[]});
 for(const d of Array.isArray(meta.doors)?meta.doors:[]){const m=/^([^:]+):([^@]+)(?:@(.+))?$/.exec(d?.to||'');if(!m)continue;doors.push({from:{world:w.id,actor:d.from},to:{world:m[1],actor:m[2],event:m[3]||null},why:d.why||'',whyBack:d.whyBack||''})}}
 for(const d of doors){ if(d.whyBack!==undefined&&!d.generated){ /* 역방향 생성 뒤 원본에서 제거 */ } }
 for(const d of [...doors]){const reverse=doors.some(x=>x.from.world===d.to.world&&x.from.actor===d.to.actor&&x.to.world===d.from.world&&x.to.actor===d.from.actor);if(!reverse)doors.push({from:{world:d.to.world,actor:d.to.actor},to:{world:d.from.world,actor:d.from.actor,event:null},why:d.whyBack||d.why,generated:true})}
 for(const d of doors){const w=worlds.find(x=>x.id===d.to.world);d.to.name=w?.title||d.to.world;d.tone=regions.find(r=>r.id===w?.region)?.tone||'#2563eb'}
 // archived 는 허브에 그리지 않고, 404.html 이 옛 주소를 합쳐진 세계로 보내는 데만 쓴다.
 const archived=reg.worlds.filter(w=>w.status==='archived').map(w=>({id:w.id,redirect:w.redirect,title:worlds.find(x=>x.id===w.redirect)?.title||w.redirect}));
 return {name:reg.name,hub:reg.hub,regions,worlds,doors,archived};}
export function serialize(a){return JSON.stringify(a,null,2)+'\n'}
export function writeAtlas(){const a=buildAtlas();writeFileSync(join(root,'atlas.json'),serialize(a));writeFileSync(join(root,'atlas.js'),'window.ATLAS = '+JSON.stringify(a)+';\n');return a}
if(isMain(import.meta.url)){const a=writeAtlas();console.log(`OK atlas: 지역 ${a.regions.length}, 세계 ${a.worlds.length}, 문 ${a.doors.length}`)}
