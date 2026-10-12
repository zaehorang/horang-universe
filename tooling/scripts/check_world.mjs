import {existsSync,readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import vm from 'node:vm';
import {root,content,shared,validId,kinds,isMain} from './lib.mjs';
const strip=s=>String(s||'').replace(/<[^>]+>/g,'').replace(/&[a-z]+;/g,'x');
function checkWorldRaw(id,{draft=false}={}){
 const errors=[],warnings=[],err=s=>errors.push(s),warn=s=>warnings.push(s),dir=join(root,'worlds',id);
 if(!existsSync(dir))return {errors:[`${id}: 폴더 없음`],warnings};
 const allowed=new Set(['index.html','content.js','world.js','world.css','NOTES.md']);
 for(const f of readdirSync(dir))if(!allowed.has(f)&&f!=='.DS_Store'&&f!=='.gitkeep')err(`${id}: 세계 폴더에 금지 파일 ${f}`);
 for(const f of ['index.html','content.js','world.js','world.css'])if(!existsSync(join(dir,f)))err(`${id}: ${f} 없음`);
 const template=readFileSync(join(root,'tooling/templates/world-index.html'),'utf8');
 if(existsSync(join(dir,'index.html'))){const index=readFileSync(join(dir,'index.html'),'utf8');if(index!==template)err(`${id}: index.html 템플릿과 다름: build_world_index.mjs ${id} 실행`)}
 if(errors.length){const structural=e=>e.includes('index.html')||e.includes('금지 파일');return draft?{errors:errors.filter(structural),warnings:[...warnings,...errors.filter(e=>!structural(e))]}:{errors,warnings}}
 const wsrc=readFileSync(join(dir,'world.js'),'utf8'),csrc=readFileSync(join(dir,'content.js'),'utf8');
 for(const [f,source] of [['world.js',wsrc],['content.js',csrc]])try{new vm.Script(source,{filename:f})}catch(e){err(`${id}: ${f} 문법 오류: ${e.message}`)}
 if(errors.length)return draft?{errors:[],warnings:[...warnings,...errors]}:{errors,warnings};
 let C,W;try{C=content(id);const ctx=vm.createContext({window:{ISO:new Proxy({},{get:()=>()=>({})}),SHARED:shared()},console});vm.runInContext(wsrc,ctx,{filename:'world.js'});W=ctx.window.WORLD}catch(e){err(`${id}: DOM 없는 로드 실패: ${e.message}`);return draft?{errors:[],warnings:[...warnings,...errors]}:{errors,warnings}}
 if(!C||!W){err(`${id}: CONTENT/WORLD 없음`);return draft?{errors:[],warnings:[...warnings,...errors]}:{errors,warnings}}
 for(const k of ['title','intro','actors','events'])if(!C[k])err(`${id}: CONTENT.${k} 없음`);
 if(!C.intro?.title||!C.intro?.body)err(`${id}: intro title/body 없음`);
 if(typeof W.build!=='function'||typeof W.reset!=='function')err(`${id}: WORLD build/reset 없음`);
 if(!C.meta||!Array.isArray(C.meta.concepts)||!Array.isArray(C.meta.values)||!Array.isArray(C.meta.doors))err(`${id}: meta 형식 오류`);
 if(C.meta?.hubColor!=null&&!/^#[0-9a-f]{6}$/i.test(C.meta.hubColor))err(`${id}: meta.hubColor 색 오류`);
 const actors=C.actors||{};
 for(const [key,a] of Object.entries(actors)){
  if(!validId(key))err(`${id}: actor 키 오류 ${key}`);
  for(const f of ['name','real','tip','what'])if(typeof a[f]!=='string')err(`${id}: actors.${key}.${f} 문자열 아님`);
  if(!Array.isArray(a.talks)||a.talks.some(t=>!Array.isArray(t)||t.length!==3))err(`${id}: actors.${key}.talks 형식 오류`);
  if(!Array.isArray(a.steps)||!a.steps.length)err(`${id}: actors.${key}.steps 없음`);
  if(!Array.isArray(a.xr)||a.xr.some(x=>!x.l||!x.code))err(`${id}: actors.${key}.xr 형식 오류`);
  if(!a.myth)warn(`${id}: actors.${key}.myth 없음`);
  if(strip(a.tip).length>90)warn(`${id}: actors.${key}.tip ${strip(a.tip).length}자 — 약 80자 권장`);
  if(strip(a.what).length>260)warn(`${id}: actors.${key}.what ${strip(a.what).length}자 — 2~3문장 권장`);
  if(a.steps?.length>8)warn(`${id}: actors.${key}.steps ${a.steps.length}개 — 7개 이하 권장`);
 }
 const ids=new Set();for(const ev of C.events||[]){
  if(!validId(ev.id)||ids.has(ev.id))err(`${id}: 사건 id 오류/중복 ${ev.id}`);ids.add(ev.id);
  if(!kinds.has(ev.kind))err(`${id}: ${ev.id} kind 오류`);
  if(ev.ready===false)continue;
  const scenes=W.scenes?.[ev.id];if(!Array.isArray(ev.beats)||!ev.beats.length||!Array.isArray(scenes)||scenes.length!==ev.beats.length){err(`${id}: ${ev.id} beats/scenes 불일치`);continue}
  if(ev.beats.length>9)warn(`${id}: ${ev.id} 장면 ${ev.beats.length}개 — 5~8개 권장`);
  ev.beats.forEach((b,i)=>{if(!actors[b.actor])err(`${id}: ${ev.id}[${i+1}] actor 없음 ${b.actor}`);if(!b.text)err(`${id}: ${ev.id}[${i+1}] text 없음`);else if(strip(b.text).length>170)warn(`${id}: ${ev.id}[${i+1}] 자막 ${strip(b.text).length}자 — 약 150자 권장`);if(!Array.isArray(b.xray)||!b.xray.length||b.xray.some(x=>!x.l||!x.code))err(`${id}: ${ev.id}[${i+1}] xray 형식 오류`)})
 }
 const wcode=wsrc.replace(/\/\*[\s\S]*?\*\/|(?<![:\\])\/\/[^\n]*/g,'');
 const used=new Set();for(const m of wcode.matchAll(/\b([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\.act\(\s*[^,]+,\s*["']([\w-]+)["'](?=\s*[,)])/g)){
  if(['ISO','api.ISO','window.ISO'].includes(m[1]))used.add(m[2]);
  else warn(`${id}: world.js 비 ISO .act 호출 ${m[1]}.act(${m[2]}) — actor 검사 제외`);
 }for(const m of wcode.matchAll(/["']data-actor["']\s*:\s*["']([\w-]+)["']/g))used.add(m[1]);
 // `var act = ISO.act` 같은 별칭 호출과, 키가 문자열이 아닌(계산된) 호출을 함께 본다.
 const aliases=new Set([...wcode.matchAll(/(?<![\w$.])([A-Za-z_$][\w$]*)\s*=\s*(?:(?:window|api)\.)?ISO\.act(?![\w$])/g)].map(m=>m[1]));
 for(const m of wcode.matchAll(/\{([^{}]*)\}\s*=\s*(?:(?:window|api)\.)?ISO\b/g))for(const part of m[1].split(','))if(/^\s*act\s*$/.test(part))aliases.add('act');
 const callee=['(?:(?:window|api)\\.)?ISO\\.act',...[...aliases].map(a=>a.replace(/\$/g,'\\$'))].map(c=>`(?<![\\w$.])${c}`).join('|');
 let computed=0;for(const m of wcode.matchAll(new RegExp(`(?:${callee})\\(\\s*[^,()]+(?:\\([^()]*\\)[^,()]*)*,\\s*(?:(["'])([\\w-]+)\\1(?=\\s*[,)])|(?=.))`,'g'))){if(m[2])used.add(m[2]);else computed++}
 for(const key of used)if(!actors[key])err(`${id}: world.js actor 없음 ${key}`);
 // 계산된 키는 정적으로 풀 수 없으므로 world.js 어딘가에 문자열로 나오는 actor 키를 클릭 물체로 간주한다.
 const literals=computed?new Set([...wcode.matchAll(/(["'])([\w-]+)\1/g)].map(m=>m[2])):new Set();
 if(computed)warn(`${id}: world.js 계산된 actor 키 act 호출 ${computed}곳 — world.js 의 문자열 리터럴로 근사 검사`);
 const prefixes=[...literals].filter(l=>/[-_]$/.test(l));
 for(const key of Object.keys(actors))if(!used.has(key)&&!literals.has(key)&&!prefixes.some(p=>key.startsWith(p)))warn(`${id}: actors.${key} 지도 클릭 물체 없음`);
 const N=C.names||{};for(const p of N.patterns||[]){try{new RegExp(p.re)}catch{err(`${id}: names.patterns 정규식 오류 ${p.re}`)}if(typeof p.parts!=='function')err(`${id}: names.patterns parts 함수 없음 ${p.re}`)}
 if(!N.examples)warn(`${id}: names.examples 없음`);
 if(/\bTODO\b/.test(csrc)||/\bTODO\b/.test(wsrc))warn(`${id}: TODO 남아 있음`);
 const allText=JSON.stringify(C);if(/\b(web|app|test|foo|bar)\.yaml\b/.test(allText))warn(`${id}: 예시 이름이 공식 용어처럼 보임`);
 const words=[...Object.keys(N.custom||{}),...Object.keys(N.auto||{}),...(N.projects||[]),...(N.official||[])].sort((a,b)=>b.length-a.length);
 const esc=t=>t.replace(/[.*+?^${}()|[\]\\\/]/g,'\\$&');
 const alts=(N.patterns||[]).filter(p=>{try{new RegExp(p.re);return true}catch{return false}}).map(p=>`(?:${p.re})`).concat(words.map(esc));
 const nameRe=alts.length?new RegExp(`(?<![\\w\\-.])(?:${alts.join('|')})(?![\\w\\-])`,'g'):null;
 const dash=/(?<![\w\-.\/])[a-z][a-z0-9]*(?:-[a-z0-9]+)+(?![\w\-]|\.[a-z])/g,host=/(?<![\w\-.@])(?:[a-z0-9][a-z0-9-]*\.)+(?:com|net|org|io|dev|app|local|internal|svc|test|example|invalid|kr)(?![\w\-])/g;
 const found=new Map();const scan=(code,where)=>{for(const seg of String(code).split(/(<[^>]+>)/)){if(seg.startsWith('<'))continue;const cover=nameRe?[...seg.matchAll(nameRe)].map(m=>[m.index,m.index+m[0].length]):[];for(const re of [dash,host])for(const m of seg.matchAll(re)){if(re===dash&&!m[0].split('-').slice(1).some(x=>/\d/.test(x)))continue;const a=m.index,b=a+m[0].length;if(cover.some(([x,y])=>x<=a&&y>=b))continue;if(!found.has(m[0]))found.set(m[0],[]);found.get(m[0]).push(where)}}};
 for(const [key,a] of Object.entries(actors))for(const [i,x] of (a.xr||[]).entries())scan(x.code,`${key}.xr[${i}]`);
 for(const ev of C.events||[])for(const [i,b] of (ev.beats||[]).entries())for(const [j,x] of (b.xray||[]).entries())scan(x.code,`${ev.id}[${i+1}].xray[${j}]`);
 for(const [token,where] of [...found].slice(0,8))warn(`${id}: xr/xray 이름 '${token}' 이 names 규칙 밖 (${where.slice(0,3).join(', ')})`);
 const heroes=new Set(),pending=[];for(const ev of C.events||[])if(ev.ready===false)pending.push(strip(ev.title));else for(const b of ev.beats||[])heroes.add(b.actor);
 if(heroes.size){const idle=[...used].filter(key=>actors[key]&&!heroes.has(key)&&!pending.some(t=>strip(actors[key].tip).includes(t)));if(idle.length)warn(`${id}: 장면 주인공이 아닌 지도 부품 ${idle.join(', ')}`)}
 if(draft&&!C.events?.length)warn(`${id}: 빈 draft 세계`);
 const css=readFileSync(join(dir,'world.css'),'utf8').replace(/\/\*[\s\S]*?\*\//g,'');
 const allowedVars=new Set(['--world-bg','--world-bg-deep','--world-ground','--world-texture','--acc']);
 const engineCss=readFileSync(join(root,'tooling/engine/style.css'),'utf8').replace(/\/\*[\s\S]*?\*\//g,'');
 const engineSelectors=new Set();
 for(const rule of engineCss.matchAll(/([^{}]+)\{[^{}]*\}/g))for(const token of rule[1].matchAll(/[.#][a-zA-Z_][\w-]*/g))engineSelectors.add(token[0]);
 for(const token of ['#stage','#app','#bg'])engineSelectors.add(token);
 for(const block of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)){
  const selector=block[1].trim();const engineTargets=[...selector.matchAll(/[.#][a-zA-Z_][\w-]*/g)].map(m=>m[0]).filter(token=>engineSelectors.has(token));
  if(/(?:^|[\s,>+~])(?:body|html)(?=$|[\s.#:[>+~,])/.test(selector))engineTargets.push('body/html');
  if(engineTargets.length)warn(`${id}: world.css 엔진 선택자 ${selector} (${[...new Set(engineTargets)].join(', ')})`);
  for(const declaration of block[2].split(';')){const m=/^\s*(--[\w-]+)\s*:\s*(.+?)\s*$/.exec(declaration);if(!m)continue;const [,key,value]=m;if(!allowedVars.has(key))warn(`${id}: world.css 허용 밖 변수 ${key} (${selector})`);if(key==='--acc'){const hex=/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value);if(!hex){warn(`${id}: --acc 색상 hue 검사 불가 ${value}`);continue}let h=hex[1];if(h.length===3)h=[...h].map(c=>c+c).join('');const [r,g,b]=[0,2,4].map(i=>parseInt(h.slice(i,i+2),16)/255),max=Math.max(r,g,b),min=Math.min(r,g,b),delta=max-min;let hue=0;if(delta){if(max===r)hue=((g-b)/delta)%6;else if(max===g)hue=(b-r)/delta+2;else hue=(r-g)/delta+4;hue=(hue*60+360)%360}if(hue<200||hue>230)warn(`${id}: --acc 색상 hue ${hue.toFixed(1)}° — 200–230° 밖`)}}
 }
 return draft?{errors:errors.filter(e=>e.includes('index.html 템플릿과 다름')),warnings:[...warnings,...errors.filter(e=>!e.includes('index.html 템플릿과 다름'))]}:{errors,warnings};
}
export function checkWorld(id,{draft=false}={}){
 try{return checkWorldRaw(id,{draft})}
 catch(e){const message=`${id}: 세계 내용 검사 실패: ${e.message}`;return draft?{errors:[],warnings:[message]}:{errors:[message],warnings:[]}}
}
if(isMain(import.meta.url)){const id=process.argv[2]?.replace(/^worlds\//,'');if(!id)throw Error('사용법: check_world.mjs <id>');const r=checkWorld(id,{draft:process.argv.includes('--draft')});for(const e of r.errors)console.error('✗',e);for(const w of r.warnings)console.warn('?',w);if(r.errors.length)process.exitCode=1;else console.log(`OK ${id}`)}
