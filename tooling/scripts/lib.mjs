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
 if(problems.length)throw Error(`${label}: ${problems.join(', ')}`);
 return html;
}
