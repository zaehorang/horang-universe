import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {root,isMain,substitute,assertPageRefs} from './lib.mjs';

// 허브 전용 치환은 이 함수 한 곳에서 관리한다. 공통 마크업은 엔진 index 가 정본이다.
export function renderHubIndex(engineIndex){
 const loader=`<script src="../../shared/values.js"></script>
<script type="module">
try {
  const response = await fetch('../../atlas.json');
  if (!response.ok) throw new Error('atlas.json 로드 실패');
  window.ATLAS = await response.json();
  await import('./content.js');
  await import('./world.js');
  await import('../../tooling/engine/engine.js');
  document.getElementById('introGo').click();
} catch (error) {
  console.error(error);
  document.getElementById('brandTitle').textContent = '지도를 읽지 못했습니다: ' + error.message;
}
</script>`;
 const scripts='<script src="content.js"></script>\n<script src="world.js"></script>\n<script src="engine.js"></script>';
 const html=substitute(engineIndex,[
  ['<title>탐험 지도</title>','<title>Horang Universe · 탐험 지도책</title>'],
  ['../vendor/','../../tooling/vendor/',true],
  ['href="style.css"','href="../../tooling/engine/style.css"'],
  ['src="iso.js"','src="../../tooling/engine/iso.js"'],
  ['  <div class="topright">','  <div class="hub-search"><span aria-hidden="true">⌕</span><input disabled aria-label="개념 검색, 준비 중" placeholder="개념을 치면 그 세계로 (곧 열려요)"></div>\n  <div class="hub-count" id="hubCount"></div>\n  <div class="topright">'],
  [scripts,loader],
 ],'허브 index.html');
 return assertPageRefs(html,'허브 index.html',new Set(['world.css','./content.js','./world.js']));
}

if(isMain(import.meta.url)){
 const engine=readFileSync(join(root,'tooling/engine/index.html'),'utf8');
 writeFileSync(join(root,'worlds/hub/index.html'),renderHubIndex(engine));
 console.log('OK hub index');
}
