import {readFileSync,realpathSync,existsSync} from 'node:fs';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {resolve,join} from 'node:path';
import vm from 'node:vm';
export const root=resolve(fileURLToPath(new URL('../..',import.meta.url)));
export const isMain=url=>process.argv[1]&&realpathSync(process.argv[1])===realpathSync(fileURLToPath(url));
export const idRE=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const kinds=new Set(['normal','failure','scale','attack','recovery','revisit','tour']);
export const registry=()=>JSON.parse(readFileSync(join(root,'worlds.json'),'utf8'));
export function content(id){
 const context=vm.createContext({window:{SHARED:shared()},console});
 vm.runInContext(readFileSync(join(root,'worlds',id,'content.js'),'utf8'),context,{filename:`${id}/content.js`});
 return context.window.CONTENT;
}
export function shared(){const context=vm.createContext({window:{}});vm.runInContext(readFileSync(join(root,'shared/values.js'),'utf8'),context);return context.window.SHARED;}
export function validId(v){return typeof v==='string'&&idRE.test(v)}
export const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
// 엔진 index 를 세계·허브용으로 바꾸는 치환 도우미. 일치하지 않으면 조용히 넘어가지 않고 실패한다.
export function substitute(source,steps,label){
 let out=source;
 for(const [from,to,all] of steps){
  if(!out.includes(from))throw Error(`${label}: 엔진 index 에서 치환 대상 '${from}' 을 찾지 못함`);
  out=all?out.replaceAll(from,to):out.replace(from,to);
 }
 return out;
}
// 공유 미리보기: 엔진 index 의 상대 경로 og:image 를 등록부 site 기준 절대 주소로 바꾼다(크롤러는 절대 주소만 읽는다).
export const OG_IMAGE='../../assets/og.png';
export const siteImageStep=()=>[`content="${OG_IMAGE}"`,`content="${registry().site}assets/og.png"`];
// 페이지의 og:image · twitter:image 가 등록부 site 아래 주소이고 저장소에 그 파일이 있는지 확인한다.
export function shareImageProblems(html,label){
 const site=registry().site,problems=[];
 for(const m of html.matchAll(/<meta\s+(?:property|name)="(?:og:image|twitter:image)"\s+content="([^"]+)"/g)){
  const url=m[1];
  if(!site||!url.startsWith(site)){problems.push(`${label}: 공유 이미지 ${url} 가 등록부 site(${site}) 아래가 아님`);continue}
  if(!existsSync(join(root,url.slice(site.length))))problems.push(`${label}: 공유 이미지 파일 없음 ${url.slice(site.length)}`);
 }
 return problems;
}
// worlds/<id>/ 에 놓일 페이지의 참조가 모두 실제 파일을 가리키는지 확인한다.
// 세계 자신의 파일(local)과 생성물 atlas.* 는 존재 검사에서 뺀다(atlas 는 check_all 이 따로 본다).
export function assertPageRefs(html,label,local){
 const refs=[...html.matchAll(/\b(?:src|href)="([^"]+)"/g),...html.matchAll(/\b(?:import|fetch)\(\s*'([^']+)'\s*\)/g)].map(m=>m[1]);
 const problems=[];
 for(const ref of refs){
  if(local.has(ref))continue;
  if(!ref.startsWith('../../')){problems.push(`원형 경로 남음 ${ref}`);continue}
  if(/^\.\.\/\.\.\/atlas\.(?:js|json)$/.test(ref))continue;
  if(!existsSync(join(root,'worlds','_',ref)))problems.push(`참조 파일 없음 ${ref}`);
 }
 problems.push(...shareImageProblems(html,label).map(p=>p.slice(label.length+2)));
 if(problems.length)throw Error(`${label}: ${problems.join(', ')}`);
 return html;
}
