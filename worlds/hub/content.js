(function(){'use strict';
const atlas=window.ATLAS,actors={};
for(const r of atlas.regions){actors[`region-${r.id}`]={name:r.name,real:r.id,tip:r.hint||'',what:r.hint||r.name,talks:[['지역','안내',r.name]],steps:['지도의 건물을 눌러 세계를 고른다.'],xr:[{l:'지역 id',code:r.id}],myth:'이 지역의 세계는 계속 추가될 수 있습니다.'}}
for(const w of atlas.worlds){
 const concepts=w.concepts?.length?w.concepts.join(', '):'준비 중';
 const events=w.events?.length?w.events.map(e=>e.title):['준비 중'];
 actors[w.id]={name:w.title||w.id,real:w.regionName,tip:w.status==='draft'?'공사 중인 세계입니다.':w.subtitle||'',
  what:`<b>개념</b> · ${concepts}<br><a class="enter-world" href="../${encodeURIComponent(w.id)}/">세계 들어가기 →</a>`,
  talks:[['지역',w.regionName,concepts]],steps:events,xr:[{l:'세계 주소',code:`worlds/${w.id}/`}],myth:w.status==='draft'?'준비 중입니다.':'지도에서 건물을 누르면 이곳으로 들어올 수 있습니다.'};
}
window.CONTENT={title:'Horang Universe',subtitle:'세계를 잇는 탐험 지도책',logo:'◆',lang:'ko',
 intro:{title:'Horang Universe',body:'세 지역을 둘러보고 세계를 탐험해 보세요.',sub:'지도의 건물을 누르면 설명을 볼 수 있어요.'},
 actors,events:[],names:{},meta:{concepts:[],guest:null,values:[],doors:[]}};
})();
