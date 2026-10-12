import {existsSync,readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import {root,registry,content,shared,validId,kinds,isMain} from './lib.mjs';
const keys=(obj,allow,label,err)=>{for(const k of Object.keys(obj||{}))if(!allow.includes(k))err(`${label}: 허용되지 않은 키 ${k}`)};
const color=v=>typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v);
const pos=v=>Array.isArray(v)&&v.length===2&&v.every(Number.isFinite);
const date=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
export function checkRegistry(){
 const errors=[],warnings=[],invalidDrafts=new Set(),err=x=>errors.push(x),warn=x=>warnings.push(x);let reg;
 try{reg=registry()}catch(e){return {errors:[`worlds.json: ${e.message}`],warnings}};
 keys(reg,['$schema','name','regions','hub','worlds'],'root',err);
 if(typeof reg.name!=='string'||!Array.isArray(reg.regions)||!Array.isArray(reg.worlds)||!reg.hub||typeof reg.hub!=='object')return {errors:['worlds.json 필수 필드 형식 오류'],warnings};
 for(const f of ['index.html','404.html','worlds/hub/index.html','worlds/hub/content.js','worlds/hub/world.js','worlds/hub/world.css'])if(!existsSync(join(root,f)))err(`허브 파일 없음: ${f}`);
 keys(reg.hub,['id','status','sea','seaDeep','shore'],'hub',err);
 if(reg.hub.id!=='hub'||!['draft','verified','archived'].includes(reg.hub.status))err('hub id/status 오류');
 for(const f of ['sea','seaDeep','shore'])if(!color(reg.hub[f]))err(`hub.${f} 색 오류`);
 const regions=new Map(),records=new Map(),contents=new Map(),positions=new Map();
 for(const r of reg.regions){
  if(!r||typeof r!=='object'){err('지역 형식 오류');continue}
  keys(r,['id','name','pos','tone','hint','toneDeep','texture'],`regions.${r.id}`,err);
  if(!validId(r.id)||regions.has(r.id))err(`지역 id 오류/중복: ${r.id}`);
  regions.set(r.id,r);
  if(typeof r.name!=='string')err(`regions.${r.id}.name 문자열 아님`);
  if(!pos(r.pos))err(`regions.${r.id}.pos 좌표 오류`);
  if(!color(r.tone))err(`regions.${r.id}.tone 색 오류`);
  if(r.toneDeep!==undefined&&!color(r.toneDeep))err(`regions.${r.id}.toneDeep 색 오류`);
  if(r.hint!==undefined&&typeof r.hint!=='string')err(`regions.${r.id}.hint 문자열 아님`);
  if(!['dots','waves','paper','hatch'].includes(r.texture))err(`regions.${r.id}.texture 오류: dots/waves/paper/hatch 중 하나 필요`);
 }
 const values=shared(),valueKeys=new Set([...Object.keys(values.shops||{}),...Object.keys(values.guests||{})]);
 for(const w of reg.worlds){if(!w||typeof w!=='object'){err('세계 형식 오류');continue}keys(w,['id','region','pos','status','redirect','since'],`worlds.${w.id}`,err);if(!validId(w.id)||w.id==='hub'||records.has(w.id))err(`세계 id 오류/중복: ${w.id}`);records.set(w.id,w);if(!regions.has(w.region))err(`${w.id}: 알 수 없는 지역 ${w.region}`);if(!['draft','verified','archived'].includes(w.status))err(`${w.id}: status 오류`);const contentError=x=>{if(w.status==='draft'){warn(x);invalidDrafts.add(w.id)}else err(x)};if(w.since!==undefined){if(!date(w.since))err(`${w.id}: since 날짜 오류`);else if(w.status==='draft'&&Date.now()-Date.parse(w.since+'T00:00:00Z')>30*86400000)warn(`${w.id}: draft 30일 초과`)}
  if(w.status==='archived'){if(!validId(w.redirect))err(`${w.id}: archived redirect 없음`);continue}
  if(w.redirect!==undefined)err(`${w.id}: archived 아닌데 redirect 있음`);
  if(!pos(w.pos))err(`${w.id}: pos 오류`);else{const key=JSON.stringify(w.pos);if(positions.has(key))err(`${w.id}: pos 겹침 (${positions.get(key)})`);positions.set(key,w.id)}
  const dir=join(root,'worlds',w.id);if(!existsSync(dir)){err(`${w.id}: 폴더 없음`);continue}if(!existsSync(join(dir,'content.js'))){contentError(`${w.id}: content.js 없음`);continue}
  let c;try{c=content(w.id);contents.set(w.id,c)}catch(e){contentError(`${w.id}: content.js 로드 실패: ${e.message}`);continue}
  if(!c?.meta||!Array.isArray(c.meta.concepts)||!Array.isArray(c.meta.values)||!Array.isArray(c.meta.doors))contentError(`${w.id}: meta 형식 오류`);
  if(c?.meta?.hubColor!=null&&!color(c.meta.hubColor))contentError(`${w.id}: meta.hubColor 색 오류`);
  if(c?.meta?.guest&&!c.actors?.[c.meta.guest])contentError(`${w.id}: guest actor 없음: ${c.meta.guest}`);
  for(const v of Array.isArray(c?.meta?.values)?c.meta.values:[])if(!valueKeys.has(v))contentError(`${w.id}: 값 벌 없음: ${v}`);
  const eventIds=new Set(),eventKinds=new Set();for(const e of Array.isArray(c?.events)?c.events:[]){if(!e||!validId(e.id)||eventIds.has(e.id))contentError(`${w.id}: 사건 id 오류/중복 ${e?.id}`);eventIds.add(e?.id);if(!kinds.has(e?.kind))contentError(`${w.id}: 사건 kind 오류 ${e?.kind}`);else eventKinds.add(e.kind)}
  if(eventKinds.size<3)warn(`${w.id}: 사건 유형 셋 미만${w.status==='draft'?' (draft)':''}`);
 }
 for(const w of reg.worlds.filter(w=>w.status==='archived'))if(!records.has(w.redirect)||records.get(w.redirect).status!=='verified')err(`${w.id}: redirect 대상은 verified 세계여야 함: ${w.redirect}`);
 const declarations=[];
 for(const [id,c] of contents)for(const d of Array.isArray(c.meta?.doors)?c.meta.doors:[]){const report=x=>{if(records.get(id).status==='draft'){warn(x);invalidDrafts.add(id)}else err(x)};if(!d||typeof d!=='object'){report(`${id}: 문 형식 오류`);continue}if(!c.actors?.[d.from])report(`${id}: 문 출발 actor 없음 ${d.from}`);const m=/^([a-z0-9-]+):([a-z0-9-]+)(?:@([a-z0-9-]+))?$/.exec(d.to||'');if(!m){report(`${id}: 문 참조 오류 ${d.to}`);continue}declarations.push([id,d.from,m[1],m[2]]);const target=records.get(m[1]);if(!target||target.status==='archived'){report(`${id}: 문 상대 세계 없음/archived ${m[1]}`);continue}const tc=contents.get(m[1]);if(!tc)report(`${id}: 문 상대 세계 내용 확인 불가 ${m[1]}`);else if(!tc.actors?.[m[2]])report(`${id}: 문 상대 actor 없음 ${d.to}`);if(tc&&m[3]&&!tc.events?.some(e=>e.id===m[3]))report(`${id}: 문 상대 사건 없음 ${d.to}`)}
 for(const [a,actor,b,other] of declarations)if(a<b&&declarations.some(x=>x[0]===b&&x[1]===other&&x[2]===a&&x[3]===actor))warn(`${a}:${actor} ↔ ${b}:${other}: 문 양쪽 중복 선언`);
 // 등록부에 없는 폴더도 Pages 업로드에 그대로 포함되므로 알린다. 이관 중 작업 폴더가 있을 수 있어 경고로 둔다.
 const registered=new Set(reg.worlds.map(w=>w?.id));
 for(const entry of readdirSync(join(root,'worlds'),{withFileTypes:true}))if(entry.isDirectory()&&entry.name!=='hub'&&!entry.name.startsWith('.')&&!registered.has(entry.name))warn(`worlds/${entry.name}: 등록부에 없는 폴더 — 허브에는 없지만 Pages 에는 공개됨`);
 return {errors,warnings,invalidDrafts};
}
if(isMain(import.meta.url)){const r=checkRegistry();for(const x of r.errors)console.error('✗',x);for(const x of r.warnings)console.warn('?',x);if(r.errors.length)process.exitCode=1;else console.log('OK registry')}
