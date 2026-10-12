import {existsSync,mkdirSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {root,registry,validId} from './lib.mjs';
import {writeAtlas} from './build_atlas.mjs';

const [id,flag,region]=process.argv.slice(2);
if(!validId(id)||flag!=='--region'||!validId(region))throw Error('사용법: new_world.mjs <id> --region <region>');
const reg=registry();
if(!reg.regions.some(r=>r.id===region))throw Error(`지역 없음: ${region}`);
if(reg.worlds.some(w=>w.id===id))throw Error(`세계 중복: ${id}`);

const dir=join(root,'worlds',id);
if(existsSync(dir))throw Error(`폴더 존재: ${dir}`);
const used=new Set(reg.worlds.filter(w=>w.region===region).map(w=>JSON.stringify(w.pos)));
const center=reg.regions.find(r=>r.id===region).pos;
let index=0,pos;
do{
  pos=[center[0]+(index%2?1:-1)*Math.ceil(index/2)*110,center[1]+45+Math.floor(index/4)*55];
  index++;
}while(used.has(JSON.stringify(pos)));

// atlas 생성까지 성공해야 등록부와 생성물이 함께 남는다.
const artifactNames=['worlds.json','atlas.json','atlas.js'];
const originals=artifactNames.map(name=>{
  const path=join(root,name);
  return {path,bytes:existsSync(path)?readFileSync(path):null};
});
mkdirSync(dir);
try{
  const regionRecord=reg.regions.find(r=>r.id===region);
  for(const f of ['index.html','content.js','world.js','world.css']){
    const template=f==='index.html'?'world-index.html':f;
    writeFileSync(join(dir,f),readFileSync(join(root,'tooling/templates',template),'utf8')
      .replaceAll('__WORLD_ID__',id)
      .replaceAll('__REGION_TONE_DEEP__',regionRecord.toneDeep||regionRecord.tone)
      .replaceAll('__REGION_TEXTURE__',regionRecord.texture)
      .replaceAll('__REGION_TONE__',regionRecord.tone));
  }
  reg.worlds.push({id,region,pos,status:'draft',since:new Date().toISOString().slice(0,10)});
  writeFileSync(join(root,'worlds.json'),JSON.stringify(reg,null,2)+'\n');
  writeAtlas();
}catch(error){
  const rollbackErrors=[];
  for(const {path,bytes} of originals){
    try{if(bytes===null)rmSync(path,{force:true});else writeFileSync(path,bytes)}
    catch(rollbackError){rollbackErrors.push(rollbackError)}
  }
  try{rmSync(dir,{recursive:true,force:true})}
  catch(rollbackError){rollbackErrors.push(rollbackError)}
  if(rollbackErrors.length)throw new AggregateError([error,...rollbackErrors],'세계 생성 실패와 롤백 실패');
  throw error;
}
console.log(`OK ${id} (${region} ${pos})`);
