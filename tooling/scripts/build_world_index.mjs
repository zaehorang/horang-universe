import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {root,registry,isMain,substitute,assertPageRefs} from './lib.mjs';

// 세계 index 템플릿 치환은 이 함수 한 곳에서 관리한다. 공통 마크업은 엔진 index 가 정본이다.
export function renderWorldTemplate(engineIndex){
 const html=substitute(engineIndex,[
  ['../vendor/','../../tooling/vendor/',true],
  ['href="style.css"','href="../../tooling/engine/style.css"'],
  ['src="iso.js"','src="../../tooling/engine/iso.js"'],
  ['src="content.js"','src="../../shared/values.js"></script>\n<script src="content.js"'],
  ['src="world.js"></script>','src="world.js"></script>\n<script src="../../atlas.js"></script>'],
  ['src="engine.js"','src="../../tooling/engine/engine.js"'],
 ],'world-index.html');
 return assertPageRefs(html,'world-index.html',new Set(['world.css','content.js','world.js']));
}

if(isMain(import.meta.url)){
 const args=process.argv.slice(2),dryRun=args.includes('--dry-run'),only=args.filter(arg=>arg!=='--dry-run');
 if(only.some(arg=>arg.startsWith('-')))throw Error('사용법: build_world_index.mjs [--dry-run] [id...]');
 const template=renderWorldTemplate(readFileSync(join(root,'tooling/engine/index.html'),'utf8'));
 const templatePath=join(root,'tooling/templates/world-index.html');
 const worlds=registry().worlds.filter(w=>w.status!=='archived');
 for(const id of only)if(!worlds.some(w=>w.id===id))throw Error(`${id}: 등록부에 없거나 archived`);
 // 쓰기 전에 대상 전부를 검사한다. 하나라도 문제면 아무것도 쓰지 않는다.
 const targets=worlds.filter(w=>!only.length||only.includes(w.id));
 const missing=targets.filter(w=>!existsSync(join(root,'worlds',w.id))).map(w=>w.id);
 if(missing.length)throw Error(`세계 폴더 없음: ${missing.join(', ')} — 아무 파일도 쓰지 않음`);
 const writes=[];
 if(readFileSync(templatePath,'utf8')!==template)writes.push([templatePath,'tooling/templates/world-index.html']);
 for(const world of targets){
  const target=join(root,'worlds',world.id,'index.html');
  if(!existsSync(target)||readFileSync(target,'utf8')!==template)writes.push([target,`${world.id}/index.html`]);
 }
 for(const [path,name] of writes){
  if(!dryRun)writeFileSync(path,template);
  console.log(`${dryRun?'변경 예정':'갱신'} ${name}`);
 }
 const count=writes.filter(([path])=>path!==templatePath).length;
 console.log(`OK world index ${dryRun?'변경 예정':'갱신'} ${count}개`);
}
