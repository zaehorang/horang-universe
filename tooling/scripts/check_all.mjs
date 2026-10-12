import {readFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {root,registry} from './lib.mjs';
import {checkRegistry} from './check_registry.mjs';
import {checkWorld} from './check_world.mjs';
import {buildAtlas,serialize} from './build_atlas.mjs';
import {renderHubIndex} from './build_hub_index.mjs';
import {renderWorldTemplate} from './build_world_index.mjs';

const engineIndex=readFileSync(join(root,'tooling/engine/index.html'),'utf8');
const errors=[],warnings=[];
const render=fn=>{try{return fn(engineIndex)}catch(e){errors.push(`렌더 실패 — ${e.message}`);return null}};
const expectedTemplate=render(renderWorldTemplate),expectedHub=render(renderHubIndex);
if(expectedTemplate!==null&&readFileSync(join(root,'tooling/templates/world-index.html'),'utf8')!==expectedTemplate)errors.push('world-index.html 이 엔진 index 와 다름: build_world_index.mjs 실행');
const hubPath=join(root,'worlds/hub/index.html');
if(expectedHub!==null&&existsSync(hubPath)&&readFileSync(hubPath,'utf8')!==expectedHub)errors.push('허브 index.html 이 엔진 index 와 다름: build_hub_index.mjs 실행');
const add=r=>{errors.push(...r.errors);warnings.push(...r.warnings)};
const registryResult=checkRegistry();add(registryResult);
const invalidDrafts=registryResult.invalidDrafts||new Set();
const withoutInvalidDrafts=atlas=>({...atlas,
 worlds:atlas.worlds.filter(w=>!invalidDrafts.has(w.id)),
 doors:atlas.doors.filter(d=>!invalidDrafts.has(d?.from?.world)&&!invalidDrafts.has(d?.to?.world))});
function checkAtlasFile(file,atlas,expected,decode){
 const path=join(root,file);
 if(!existsSync(path)){errors.push(`${file} 없음: build_atlas.mjs 실행`);return}
 const actual=readFileSync(path,'utf8');
 if(!invalidDrafts.size){if(actual!==expected)errors.push(`${file} 오래됨: build_atlas.mjs 실행`);return}
 let decoded;try{decoded=decode(actual)}catch(e){errors.push(`${file} 형식 오류: ${e.message}`);return}
 if(!decoded||!Array.isArray(decoded.worlds)||!Array.isArray(decoded.doors)){
  errors.push(`${file} 형식 오류: worlds/doors 배열 없음`);return;
 }
 if(JSON.stringify(withoutInvalidDrafts(decoded))!==JSON.stringify(withoutInvalidDrafts(atlas)))
  errors.push(`${file} 오래됨: draft 오류와 무관한 데이터가 어긋남`);
 else if(actual!==expected)warnings.push(`${file}: 내용 오류가 있는 draft와 그 문만 stale 비교에서 제외`);
}
if(!errors.length){
 for(const w of registry().worlds)if(w.status!=='archived')add(checkWorld(w.id,{draft:w.status==='draft'}));
 if(!errors.length){
  const atlas=buildAtlas();
  checkAtlasFile('atlas.json',atlas,serialize(atlas),JSON.parse);
  checkAtlasFile('atlas.js',atlas,'window.ATLAS = '+JSON.stringify(atlas)+';\n',source=>{
   const prefix='window.ATLAS = ',suffix=';\n';
   if(!source.startsWith(prefix)||!source.endsWith(suffix))throw Error('window.ATLAS 생성물 형식 아님');
   return JSON.parse(source.slice(prefix.length,-suffix.length));
  });
 }
}
for(const w of warnings)console.warn('?',w);
for(const e of errors)console.error('✗',e);
if(errors.length)process.exitCode=1;else console.log('OK check_all');
