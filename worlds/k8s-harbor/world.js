/* 쿠버네티스 항구 — 지도 그리기 · 배경 움직임 · 기준 상태 · 사건별 장면 움직임
   규칙
   - 클릭할 물체는 ISO.act(부모, 키, 이름) 로 만든다. 키는 content.js actors 의 키와 같다.
   - 장면 함수 개수·순서는 content.js 의 같은 사건 beats 와 같다.
   - 장면이 바꾼 것은 reset 에서 모두 되돌린다 (이전·점 이동이 reset 후 앞 장면을 다시 실행해 상태를 만든다).
   - 움직일 물체는 ISO.mover 로 만들어 위치(바깥)와 애니메이션(body)을 나눈다. */
(function(){
"use strict";

var SHOP = window.SHARED.shops["shop-web"];
var GUEST = window.SHARED.guests["guest-browser"];
var GUEST_NAME = "바깥 " + GUEST.name;   /* 항구 바깥 ↔ 항구 안 대비를 이름에 남긴다 */
var ISO = window.ISO;
var iso = ISO.iso, isoL = ISO.isoL, el = ISO.el, box = ISO.box, flat = ISO.flat, faceR = ISO.faceR, faceL = ISO.faceL, C = ISO.C;

/* 컨테이너 상자 (Pod) — 바깥 그룹은 위치, 안쪽(body)은 애니메이션 */
function container(parent, id){
  var outer = ISO.mover(parent, {id:id, "class":"ctr ctr-ghost act nohit", "data-actor":"pod", tabindex:"0", role:"button", "aria-label":"컨테이너 묶음(Pod) 알아보기"});
  var g = outer.body;
  box(g, isoL, 0, 0, 0, 56, 36, 30, C.coral);
  for(var i=1;i<4;i++){
    var a = isoL(56, i*9, 4), b = isoL(56, i*9, 26);
    el("line", {"class":"door", x1:a[0], y1:a[1], x2:b[0], y2:b[1]}, g);
  }
  var tp = isoL(28, 36, 15);
  ISO.text(g, tp[0], tp[1] + 4, "my-shop", "door", {"text-anchor":"middle", "font-size":"8.5", "font-weight":"800", fill:"#fff", "font-family":"monospace"});
  return outer;
}
/* 편지 (HTTP 요청) */
function envelope(parent){
  var g = el("g", {opacity:0}, parent);
  el("rect", {x:-15, y:-10, width:30, height:20, rx:3, fill:"#fff", stroke:"#334155", "stroke-width":1.6}, g);
  el("path", {d:"M-15,-10 L0,2 L15,-10", fill:"none", stroke:"#334155", "stroke-width":1.4}, g);
  el("rect", {x:7, y:-7, width:6, height:6, fill:"#ef4444"}, g);
  return g;
}
/* 동그란 표 — 이름 질문(?)과 답(IP) */
function token(parent, mark, fill){
  var g = el("g", {opacity:0}, parent);
  el("circle", {cx:0, cy:0, r:13, fill:fill, stroke:"#fff", "stroke-width":2.4}, g);
  ISO.text(g, 0, 5, mark, "", {"text-anchor":"middle", "font-size":mark.length > 1 ? "9.5" : "15", "font-weight":"900", fill:"#fff"});
  return g;
}

/* 크레인 지브 — hook(gx,gy,gz) 를 따라 다시 그린다 */
function drawCrane(R){
  var h = R.hook, T = R.craneTop;
  var tip = iso(h.gx, h.gy, 256), hk = iso(h.gx, h.gy, h.gz + 2);
  var dx = tip[0] - T[0], dy = tip[1] - T[1];
  var cx = T[0] - dx * 0.22, cy = T[1] - dy * 0.22;
  function ln(e, x1, y1, x2, y2){ e.setAttribute("x1", x1); e.setAttribute("y1", y1); e.setAttribute("x2", x2); e.setAttribute("y2", y2); }
  ln(R.jibLine, T[0], T[1], tip[0], tip[1]);
  ln(R.jibLine2, T[0], T[1] - 1, tip[0], tip[1] - 1);
  ln(R.jibCounter, T[0], T[1], cx, cy);
  R.weight.setAttribute("x", cx - 8); R.weight.setAttribute("y", cy - 4);
  R.trolley.setAttribute("x", tip[0] - 6); R.trolley.setAttribute("y", tip[1] - 2);
  ln(R.cable, tip[0], tip[1] + 4, hk[0], hk[1] - 10);
  R.hookEl.setAttribute("transform", "translate(" + hk[0] + "," + (hk[1] - 12) + ")");
  if(R.carry) ISO.place(R.carry, h.gx - 28, h.gy - 18, h.gz - 30);
}
function placeRobot(R){ ISO.place(R.robot, R.robotPos.gx, 252, 26); }
function robotPt(R){ var p = iso(R.robotPos.gx, 252, 26); return [p[0], p[1] - 50]; }

/* 대기 구역 자리 — 상자 0~2 는 배포하기, 3·4 는 늘리기·복구에서 새로 생기는 상자 */
var YARD = [[350,228],[412,228],[350,276],[350,228],[412,228]];
/* 부두마다 자리 4칸: 부두 1(worker-1) = piers[0], 부두 2(worker-2) = piers[1].
   부두 1의 맨 앞 칸(3번)에는 주문 앱이 이미 있다 — 맨 앞이라 다른 상자에 글자가 가리지 않는다 */
var PLAN = [{pier:1, slot:0, ip:"10.244.2.4"}, {pier:0, slot:0, ip:"10.244.1.5"}, {pier:1, slot:1, ip:"10.244.2.5"}];
var SCALE_PLAN = [{pier:0, slot:1, ip:"10.244.1.6"}, {pier:1, slot:2, ip:"10.244.2.6"}];
var HEAL_PLAN = [{pier:0, slot:1, ip:"10.244.1.7"}, {pier:0, slot:2, ip:"10.244.1.8"}];

function slotOf(R, p){ return R.piers[p.pier].slots[p.slot]; }
function ctrPt(s){ return iso(s[0] + 28, s[1] + 18, 34); }
function tagAt(R, i, text, s){
  var t = R.ipTags[i], p = iso(s[0] + 56, s[1] + 18, 14);   /* 상자 오른쪽 — 위아래 칸 꼬리표가 겹치지 않게 */
  t.querySelector("text").textContent = text;
  t.setAttribute("transform", "translate(" + (p[0] + 46) + "," + p[1] + ")");
}
/* 앞 사건(앱 배포하기)이 끝난 상태 — my-shop 3개가 부두에서 돌고 있다 */
function deployed(tl, R){
  tl.call(function(){
    [0,1,2].forEach(function(i){
      var s = slotOf(R, PLAN[i]), c = R.ctrs[i];
      ISO.place(c, s[0], s[1], 0);
      c.classList.remove("ctr-ghost");
      gsap.set(c.body, {opacity:1, y:0, scale:1});
      tagAt(R, i, PLAN[i].ip, s);
      gsap.set(R.ipTags[i], {opacity:1});
    });
    R.piers.forEach(function(P){ P.cable.classList.add("live"); gsap.set(P.whLight, {opacity:1}); });
  }, null, 0);
}
/* 크레인이 상자 하나를 집어 옮긴다 (그림일 뿐 — 실제로는 nodeName 한 줄) */
function carry(tl, R, c, from, to){
  var hk = R.hook, draw = function(){ drawCrane(R); };
  tl.to(hk, {gx:from[0] + 28, gy:from[1] + 18, gz:130, duration:.7, ease:"power2.inOut", onUpdate:draw});
  tl.to(hk, {gz:30, duration:.35, ease:"power1.in", onUpdate:draw});
  tl.call(function(){ R.carry = c; });
  tl.to(hk, {gz:130, duration:.35, ease:"power1.out", onUpdate:draw});
  tl.to(hk, {gx:to[0] + 28, gy:to[1] + 18, duration:.9, ease:"power2.inOut", onUpdate:draw});
  tl.to(hk, {gz:30, duration:.35, ease:"power1.in", onUpdate:draw});
  tl.call(function(){ R.carry = null; ISO.place(c, to[0], to[1], 0); });
}
function craneHome(tl, R){ tl.to(R.hook, {gx:430, gy:250, gz:150, duration:.8, ease:"power2.inOut", onUpdate:function(){ drawCrane(R); }}); }
/* 금고 장부 말풍선 */
function ledger(api, want, cur, curColor){
  var b = api.bubble(1000, 150, 250, 122, [1000, 214, 975, 236, 1000, 232]);
  api.text(b.inner, 1020, 180, "📒 금고 장부", "t");
  api.text(b.inner, 1020, 206, "deployment / my-shop", "m");
  var w = api.text(b.inner, 1020, 230, "원하는 수   " + want, "m", {fill:"#2563eb"});
  var c = api.text(b.inner, 1020, 252, "현재 수     " + cur, "m", {fill:curColor || "#dc2626"});
  b.want = w; b.cur = c;
  return b;
}
/* 순찰 로봇이 대기 구역으로 다가가 차이를 말한다 */
function robotSees(tl, api, R, title, line){
  tl.call(function(){ if(R.patrol) R.patrol.pause(); });
  tl.add(api.camTo(820, 380, 1.42, 1.2));
  api.clearBubbles(tl, "<");
  tl.to(R.robotPos, {gx:230, duration:1, ease:"power2.inOut", onUpdate:function(){ placeRobot(R); }}, "<");
  api.showLink(tl, "robot", function(){ return robotPt(R); }, R.towerPt, ">");
  var rp = iso(230, 252, 26);
  var b = api.bubble(rp[0] - 270, rp[1] - 112, 228, 68, [rp[0] - 46, rp[1] - 76, rp[0] - 20, rp[1] - 60, rp[0] - 46, rp[1] - 60]);
  api.text(b.inner, rp[0] - 252, rp[1] - 86, title, "t");
  var bl = api.text(b.inner, rp[0] - 252, rp[1] - 62, line, "s");
  api.pop(tl, b, "+=.2");
  return bl;
}
/* 새 상자 두 개(3·4번)가 대기 구역에 점선으로 생긴다 */
function dropNew(tl, R){
  [3,4].forEach(function(i, n){
    var c = R.ctrs[i];
    tl.call(function(){ ISO.place(c, YARD[i][0], YARD[i][1], 0); }, null, n ? "-=.25" : "+=.5");
    tl.fromTo(c.body, {opacity:0, y:-40}, {opacity:1, y:0, duration:.55, ease:"bounce.out"}, "<");
  });
}
/* 반장이 새 상자를 실행 — 점선 → 색 채움, IP 꼬리표 */
function runNew(tl, R, plan, label, base){
  [3,4].forEach(function(i, n){
    var c = R.ctrs[i], s = slotOf(R, plan[n]), t = R.ipTags[i], a = label + "+=" + (base + n * .35), b = label + "+=" + (base + n * .35 + .3);
    tl.call(function(){ c.classList.remove("ctr-ghost"); }, null, a);
    tl.fromTo(c.body, {scale:1.15, transformOrigin:"50% 100%"}, {scale:1, duration:.5, ease:"back.out(3)"}, a);
    tl.call(function(){ tagAt(R, i, plan[n].ip, s); }, null, b);
    tl.to(t, {opacity:1, duration:.3}, b);
  });
}

window.WORLD = {
  home:{x:800, y:468, s:1.08},

  /* ── 지도 그리기 (한 번) ───────────────────── */
  build:function(api){
    var L = api.L, R = {};
    var defs = api.defs;
    defs.insertAdjacentHTML("beforeend",
      "<linearGradient id='beamGrad' x1='0' y1='0' x2='1' y2='0'><stop offset='0' stop-color='#fff8d6' stop-opacity='.75'/><stop offset='1' stop-color='#fff8d6' stop-opacity='0'/></linearGradient>");

    /* 바다 잔물결 */
    for(var i=0;i<46;i++){
      var x = (i*137) % 1700 - 50, y = 560 + ((i*89) % 470);
      if(i % 3 === 0) y = (i*53) % 520;
      el("path", {"class":"wave", d:"M" + x + "," + y + " q8,-6 16,0 q8,-6 16,0", fill:"none", stroke:"rgba(255,255,255,.55)", "stroke-width":2, "stroke-linecap":"round"}, L.base);
    }

    /* 땅 · 도로 · 언덕 */
    box(L.ground, iso, 0, 0, -36, 700, 650, 36, C.sand);
    flat(L.ground, 150, 350, 0, 552, 34, {fill:"#cfd5db"});
    var r1 = iso(160, 367, 0), r2 = iso(700, 367, 0);
    el("line", {x1:r1[0], y1:r1[1], x2:r2[0], y2:r2[1], stroke:"#fff", "stroke-width":2.4, "stroke-dasharray":"14 12"}, L.ground);
    flat(L.ground, 330, 205, 0, 34, 150, {fill:"#cfd5db"});
    flat(L.ground, 322, 384, 0, 36, 236, {fill:"#cfd5db"});      /* 정문으로 가는 길 */
    var hill = ISO.act(L.ground, "hill", "관제 언덕");
    box(hill, iso, 30, 30, 0, 290, 240, 26, C.grass);
    [[80,220],[260,60],[300,230],[60,120],[200,240]].forEach(function(q){
      var c = iso(q[0], q[1], 26); el("circle", {cx:c[0], cy:c[1], r:5, fill:"#7fb862"}, L.ground);
      el("circle", {cx:c[0]+7, cy:c[1]+2, r:4, fill:"#93c977"}, L.ground);
    });

    /* 대기 구역 (Pending) */
    var yard = ISO.act(L.ground, "yard", "대기 구역");
    flat(yard, 340, 210, 0.5, 148, 118, {fill:"#fbf1d0", stroke:"#e0a82e", "stroke-width":2.4, "stroke-dasharray":"10 7"});
    for(var k=0;k<5;k++){
      var s1 = iso(352 + k*28, 214, 0.6), s2 = iso(340 + k*28, 226, 0.6);
      el("line", {x1:s1[0], y1:s1[1], x2:s2[0], y2:s2[1], stroke:"#f0c75e", "stroke-width":3}, yard);
    }

    /* 관제탑 (kube-apiserver) */
    var tower = ISO.act(L.back, "tower", "관제탑 접수 창구");
    box(tower, iso, 108, 98, 26, 68, 68, 112, C.white);
    faceL(tower, 128, 166, 26, 26, 38, "#2e4a6b");
    faceL(tower, 132, 166, 70, 18, 14, "#8cc0ee");
    faceR(tower, 176, 112, 82, 16, 14, "#8cc0ee"); faceR(tower, 176, 138, 82, 16, 14, "#8cc0ee");
    box(tower, iso, 98, 88, 138, 88, 88, 40, C.glass);
    box(tower, iso, 94, 84, 178, 96, 96, 8, C.navy);
    var at = iso(142, 132, 186), at2 = iso(142, 132, 222);
    el("line", {x1:at[0], y1:at[1], x2:at2[0], y2:at2[1], stroke:"#334155", "stroke-width":3}, tower);
    R.beacon = el("circle", {cx:at2[0], cy:at2[1], r:5, fill:"#ef4444"}, tower);
    R.towerPt = iso(142, 132, 158);
    R.towerDoor = iso(141, 166, 40);
    var bo = iso(142, 132, 172);
    var beam = el("g", {transform:"translate(" + bo[0] + "," + bo[1] + ")"}, L.back);
    R.beamRot = el("polygon", {points:"0,0 -330,150 -300,215", fill:"url(#beamGrad)", opacity:.55}, beam);

    /* 금고 (etcd) */
    var vault = ISO.act(L.back, "vault", "금고 장부");
    box(vault, iso, 222, 66, 26, 74, 60, 38, C.stone);
    var vd = iso(296, 96, 45);
    el("ellipse", {cx:vd[0], cy:vd[1], rx:13, ry:16, fill:"#e0b44c", stroke:"#a77d22", "stroke-width":2.5}, vault);
    el("circle", {cx:vd[0], cy:vd[1], r:4, fill:"#7a5a14"}, vault);
    R.vaultGlow = el("circle", {cx:vd[0], cy:vd[1], r:40, fill:"url(#glow)", opacity:0}, vault);
    R.vaultPt = iso(259, 96, 64);

    /* 순찰 로봇 (controller-manager) */
    R.robot = ISO.act(L.mid, "robot", "순찰 로봇");
    ISO.robot(R.robot);
    ISO.label(R.robot, 0, -84, "순찰 로봇", "controller-manager");
    R.robotPos = {gx:80};

    /* 배포 사무소 (kubectl) */
    var office = ISO.act(L.mid, "office", "배포 사무소");
    box(office, iso, 70, 440, 0, 100, 80, 52, C.wall);
    box(office, iso, 64, 434, 52, 112, 92, 7, C.roofR);
    faceR(office, 170, 452, 16, 22, 20, "#8cc0ee"); faceR(office, 170, 486, 16, 22, 20, "#8cc0ee");
    faceL(office, 92, 520, 0, 22, 34, "#7c4a35");
    var op = iso(196, 512, 0);
    ISO.person(office, op[0], op[1], {body:"#6366f1", clip:true});
    R.officePt = iso(120, 480, 66);

    /* 크레인 (kube-scheduler) */
    var crane = ISO.act(L.mid, "crane", "크레인 배치원");
    box(crane, iso, 516, 250, 0, 40, 40, 12, C.conc);
    box(crane, iso, 528, 262, 12, 16, 16, 232, C.yellow);
    for(var j=0;j<11;j++){
      var z0 = 16 + j*21, a1 = iso(544, 262, z0), a2 = iso(544, 278, z0 + 21);
      el("line", {x1:a1[0], y1:a1[1], x2:a2[0], y2:a2[1], stroke:"#b7830f", "stroke-width":1.5}, crane);
      var b1 = iso(528, 278, z0), b2 = iso(544, 278, z0 + 21);
      el("line", {x1:b1[0], y1:b1[1], x2:b2[0], y2:b2[1], stroke:"#b7830f", "stroke-width":1.5}, crane);
    }
    box(crane, iso, 522, 256, 244, 28, 28, 20, C.navy);
    faceR(crane, 550, 262, 250, 16, 9, "#8cc0ee");
    R.craneTop = iso(536, 270, 256);
    var jib = el("g", {}, L.fx);
    R.jibCounter = el("line", {stroke:"#c4911c", "stroke-width":5, "stroke-linecap":"round"}, jib);
    R.weight = el("rect", {width:16, height:12, rx:2, fill:"#475569"}, jib);
    R.jibLine = el("line", {stroke:"#dba62b", "stroke-width":6, "stroke-linecap":"round"}, jib);
    R.jibLine2 = el("line", {stroke:"#f7c948", "stroke-width":2, "stroke-linecap":"round"}, jib);
    R.cable = el("line", {stroke:"#334155", "stroke-width":1.6}, jib);
    R.trolley = el("rect", {width:12, height:7, rx:2, fill:"#334155"}, jib);
    R.hookEl = el("path", {d:"M-5,0 L5,0 L5,5 L0,10 L-5,5 Z", fill:"#475569"}, jib);
    R.hook = {gx:430, gy:250, gz:150};

    /* 항구 정문 (Ingress Controller) — 바깥 손님이 들어오는 유일한 문 */
    var gate = ISO.act(L.mid, "gate", "항구 정문");
    box(gate, iso, 300, 618, 0, 14, 14, 58, C.white);
    box(gate, iso, 366, 618, 0, 14, 14, 58, C.white);
    box(gate, iso, 296, 614, 58, 88, 22, 12, C.roofB);
    faceL(gate, 318, 636, 61, 44, 7, "#fde68a");
    R.gatePt = iso(340, 625, 22);
    R.gateTop = iso(340, 625, 72);

    /* 안내소 (CoreDNS) · 우편함 (Service) */
    var booth = ISO.act(L.mid, "booth", "안내소");
    box(booth, iso, 560, 478, 0, 46, 46, 40, C.wall);
    box(booth, iso, 554, 472, 40, 58, 58, 8, C.teal);
    faceR(booth, 606, 488, 12, 26, 18, "#8cc0ee");
    R.boothPt = iso(583, 501, 56);
    var mb = ISO.act(L.mid, "mailbox", "고정 우편함");
    var mp = iso(630, 590, 0);
    el("ellipse", {cx:mp[0], cy:mp[1], rx:12, ry:5, fill:"rgba(0,0,0,.2)"}, mb);
    el("rect", {x:mp[0]-2.5, y:mp[1]-26, width:5, height:26, fill:"#475569"}, mb);
    el("rect", {x:mp[0]-13, y:mp[1]-48, width:26, height:24, rx:8, fill:"#2563eb"}, mb);
    el("rect", {x:mp[0]-8, y:mp[1]-41, width:16, height:3, rx:1.5, fill:"#1e3a8a"}, mb);
    R.mailPt = [mp[0], mp[1] - 40];

    /* 부두 (Worker Node) */
    R.piers = [];
    [110, 390].forEach(function(g0, n){
      var P = {};
      var pg = el("g", {}, L.front); P.g = pg;
      var deck = ISO.act(pg, "pier", "부두");
      box(deck, iso, 700, g0, -32, 190, 190, 32, C.wood);
      for(var q=1;q<8;q++){ var w1 = iso(700 + q*24, g0, 0.3), w2 = iso(700 + q*24, g0+190, 0.3);
        el("line", {x1:w1[0], y1:w1[1], x2:w2[0], y2:w2[1], stroke:"#b88654", "stroke-width":1.2}, deck); }
      var c1 = iso(772, g0+95, 1), c2 = iso(814, g0+95, 1), c3 = iso(814, g0+14, 1), c4 = iso(814, g0+182, 1);
      P.cable = el("path", {"class":"cable act nohit", "data-actor":"cni", d:"M" + c1 + " L" + c2 + " M" + c3 + " L" + c4}, pg);
      var wh = ISO.act(pg, "pier", "부두");
      box(wh, iso, 712, g0+14, 0, 60, 162, 60, C.wall);
      box(wh, iso, 708, g0+10, 60, 68, 170, 8, C.roofB);
      faceR(wh, 772, g0+40, 0, 40, 44, "#94a3b8");
      faceR(wh, 772, g0+110, 26, 30, 18, "#8cc0ee");
      P.whLight = faceR(wh, 772, g0+110, 26, 30, 18, "#fde68a"); P.whLight.setAttribute("opacity", 0);
      P.slots = [];
      for(var s=0;s<4;s++){
        var sy = g0 + 12 + s*44;
        flat(pg, 822, sy, 0.6, 58, 38, {fill:"none", stroke:"#fff", "stroke-width":2, "stroke-dasharray":"6 5", opacity:.8});
        P.slots.push([823, sy + 1]);
      }
      var mach = ISO.act(pg, "machine", "하역 기계");
      box(mach, iso, 780, g0+138, 0, 32, 32, 30, C.gray);
      var gp = iso(796, g0+154, 30);
      P.gear = el("g", {transform:"translate(" + gp[0] + "," + (gp[1]-2) + ")"}, mach);
      el("circle", {cx:0, cy:0, r:9, fill:"none", stroke:"#334155", "stroke-width":5, "stroke-dasharray":"3.5 2.6"}, P.gear);
      el("circle", {cx:0, cy:0, r:3, fill:"#334155"}, P.gear);
      P.machPt = iso(796, g0+154, 34);
      var fm = ISO.act(pg, "foreman", "부두 반장");
      var fp = iso(800, g0+58, 0);
      ISO.person(fm, fp[0], fp[1], {hard:true, clip:true, body:"#f97316"});
      P.foremanPt = [fp[0], fp[1] - 50];
      P.bang = ISO.bang(fm, fp[0] + 14, fp[1] - 70);
      /* 길 안내판 (kube-proxy) — 부두 입구, 부두마다 하나 */
      var sg = ISO.act(pg, "proxy", "길 안내판");
      var sp = iso(705, g0+184, 0);
      el("ellipse", {cx:sp[0], cy:sp[1], rx:9, ry:3.5, fill:"rgba(0,0,0,.2)"}, sg);
      el("rect", {x:sp[0]-2, y:sp[1]-46, width:4, height:46, fill:"#475569"}, sg);
      el("path", {d:"M" + (sp[0]-18) + "," + (sp[1]-58) + " h30 l8,8 l-8,8 h-30 Z", fill:"#0f766e", stroke:"#fff", "stroke-width":1.5}, sg);
      ISO.text(sg, sp[0] - 4, sp[1] - 46, "↪", "", {"text-anchor":"middle", "font-size":"12", "font-weight":"900", fill:"#fff"});
      P.signPt = [sp[0], sp[1] - 60];
      api.label(fp[0] - 64, fp[1] - 64, "부두 반장", "kubelet");
      api.label(gp[0] - 60, gp[1] + 46, "하역 기계", "containerd");
      var pl = iso(895, g0+95, -14);
      var pb = iso(742, g0 + 95, 92);   /* 창고 지붕 위 — 오른쪽 끝이 좁은 창에서 잘리지 않게 */
      api.label(pb[0], pb[1], "부두 " + (n+1), "worker-" + (n+1), true);
      P.labelPt = [pl[0] + 66, pl[1] + 22];   /* 말풍선 기준점 (부두 오른쪽 바다) */
      P.roofPt = iso(742, g0 + 95, 132);
      R.piers.push(P);
    });

    /* 주문 앱 (다른 팀의 Pod) — 부두 1의 맨 앞 칸에 처음부터 돌고 있다 */
    var oa = ISO.act(R.piers[0].g, "orderapp", "주문 앱");
    var os = R.piers[0].slots[3];
    box(oa, iso, os[0], os[1], 0, 56, 36, 30, C.purple);
    var ot = iso(os[0] + 28, os[1] + 36, 15);
    ISO.text(oa, ot[0], ot[1] + 4, "order-api", "", {"text-anchor":"middle", "font-size":"8.5", "font-weight":"800", fill:"#fff", "font-family":"monospace"});
    R.orderPt = ctrPt(os);

    /* 이미지 저장소 선박 (Registry) */
    var ship = ISO.act(L.front, "ship", "이미지 저장소선");
    var sh = el("g", {}, ship); R.shipBody = sh;
    box(sh, iso, 560, 700, -16, 170, 60, 24, C.navy);
    faceR(sh, 730, 700, -8, 60, 5, "#ef4444");
    [[575,708,C.green],[612,708,C.gold],[575,732,C.purple],[649,708,C.coral]].forEach(function(q){ box(sh, iso, q[0], q[1], 8, 34, 22, 18, q[2]); });
    box(sh, iso, 690, 706, 8, 26, 48, 36, C.white);
    faceR(sh, 716, 714, 30, 30, 8, "#8cc0ee");
    R.smokeAt = iso(703, 718, 52);
    R.shipPt = iso(640, 725, 34);

    /* 바깥 손님 (Client) — 항구 밖 바다에서 온 작은 배 */
    var guest = ISO.act(L.front, "guest", GUEST_NAME);
    var gb = el("g", {}, guest); R.guestBoat = gb;
    box(gb, iso, 430, 690, -12, 80, 34, 16, C.roofR);   /* 정문 오른쪽 앞바다 — 좁은 창에서도 사건 패널에 가리지 않게 */
    box(gb, iso, 440, 696, 4, 30, 22, 2, C.wood);
    var gpp = iso(470, 706, 6);
    ISO.person(gb, gpp[0], gpp[1], {body:"#0ea5e9", hair:"#1f2937"});
    R.guestPt = [gpp[0], gpp[1] - 52];

    /* 구름 · 갈매기 */
    var clouds = el("g", {opacity:.8}, L.labels);
    [[260,140],[1260,110],[1420,330]].forEach(function(c){
      var g = el("g", {"class":"cloud", transform:"translate(" + c[0] + "," + c[1] + ")"}, clouds);
      el("ellipse", {cx:0, cy:0, rx:46, ry:16, fill:"#fff"}, g);
      el("ellipse", {cx:-24, cy:6, rx:30, ry:12, fill:"#fff"}, g);
      el("ellipse", {cx:26, cy:5, rx:32, ry:12, fill:"#fff"}, g);
    });
    R.gulls = el("g", {}, L.labels);
    [[0,0],[30,14],[58,4]].forEach(function(q){
      el("path", {d:"M" + q[0] + "," + q[1] + " q7,-7 14,0 q7,-7 14,0", fill:"none", stroke:"#334155", "stroke-width":2.2, "stroke-linecap":"round"}, R.gulls);
    });

    /* 라벨 */
    var p;
    p = iso(30, 270, 0); api.label(p[0] - 6, p[1] + 34, "관제 언덕", "Control Plane", true);
    p = iso(142, 132, 196); api.label(p[0] + 92, p[1] + 10, "관제탑 접수 창구", "kube-apiserver");
    p = iso(259, 96, 64); api.label(p[0] - 4, p[1] - 44, "금고 장부", "etcd");
    p = R.craneTop; api.label(p[0] + 82, p[1] + 70, "크레인 배치원", "kube-scheduler");
    p = iso(414, 330, 0); api.label(p[0] - 30, p[1] + 16, "대기 구역", "Pending Pods");
    p = iso(120, 480, 60); api.label(p[0], p[1] - 22, "배포 사무소", "kubectl");
    p = iso(583, 501, 48); api.label(p[0], p[1] - 22, "안내소", "CoreDNS");
    p = iso(630, 590, 0); api.label(p[0] - 4, p[1] - 70, "고정 우편함", "Service");
    p = iso(640, 730, 60); api.label(p[0] + 24, p[1] - 30, "이미지 저장소선", "Registry");
    p = R.gateTop; api.label(p[0] + 84, p[1] - 8, "항구 정문", "Ingress");
    p = iso(470, 724, -12); api.label(p[0] - 6, p[1] + 26, GUEST_NAME, "client");

    /* 움직이는 물체 */
    R.ctrs = [0,1,2,3,4].map(function(n){ return container(L.fx, "c" + (n + 1)); });
    R.ipTags = [0,1,2,3,4].map(function(){
      var g = el("g", {"class":"tag-dark", opacity:0}, L.fx);
      g.inner = el("g", {}, g);                       /* 위치는 바깥(속성), 튀는 움직임은 안쪽 */
      el("rect", {x:-44, y:-11, width:88, height:22, rx:11, fill:"var(--dark2)"}, g.inner);
      el("text", {x:0, y:1, fill:"currentColor", "text-anchor":"middle", "dominant-baseline":"central"}, g.inner);
      return g;
    });
    R.doc = ISO.paper(L.fx, "×3");
    R.doc5 = ISO.paper(L.fx, "×5");
    R.crates = [0,1].map(function(){
      var g = el("g", {opacity:0}, L.fx);
      box(g, isoL, -9, -7, 0, 18, 14, 14, ["#ffd8c9","#ffb59a","#f29a7a"]);
      return g;
    });
    R.mail = envelope(L.fx);
    R.ask = token(L.fx, "?", "#2563eb");
    R.ans = token(L.fx, "IP", "#16a34a");
    /* 부두 2 위 'NotReady' 표 */
    R.nrTag = el("g", {"class":"nrtag", opacity:0}, L.fx);
    var rp2 = R.piers[1].roofPt;   /* 부두 2 창고 지붕 위 */
    el("rect", {x:rp2[0] - 50, y:rp2[1] - 12, width:100, height:24, rx:12}, R.nrTag);
    ISO.text(R.nrTag, rp2[0], rp2[1] + 1, "NotReady", "");
    drawCrane(R);
    return R;
  },

  /* ── 배경 움직임 — 아무것도 안 해도 살아 있게 ── */
  ambient:function(api, R){
    gsap.to(R.beamRot, {rotation:46, transformOrigin:"100% 0%", duration:5.5, yoyo:true, repeat:-1, ease:"sine.inOut"});
    gsap.to(R.beacon, {opacity:.15, duration:.7, yoyo:true, repeat:-1, ease:"power1.inOut"});
    R.patrol = gsap.to(R.robotPos, {gx:290, duration:7, yoyo:true, repeat:-1, ease:"sine.inOut", onUpdate:function(){ placeRobot(R); }});
    var w = document.getElementById("world");
    gsap.to(w.querySelectorAll(".eye"), {scaleY:.1, transformOrigin:"50% 50%", duration:.08, yoyo:true, repeat:-1, repeatDelay:3.2});
    gsap.to(w.querySelectorAll(".bulb"), {opacity:.3, duration:.5, yoyo:true, repeat:-1});
    gsap.to(R.shipBody, {y:4, duration:2.2, yoyo:true, repeat:-1, ease:"sine.inOut"});
    gsap.to(R.guestBoat, {y:3, duration:1.9, yoyo:true, repeat:-1, ease:"sine.inOut"});
    gsap.to(w.querySelectorAll(".wave"), {x:"+=12", opacity:.15, duration:2.6, yoyo:true, repeat:-1, ease:"sine.inOut", stagger:{each:.18, from:"random"}});
    gsap.to(w.querySelectorAll(".cloud"), {x:"+=70", duration:18, yoyo:true, repeat:-1, ease:"sine.inOut", stagger:3});
    gsap.to(w.querySelectorAll(".bob"), {y:-1.6, duration:.9, yoyo:true, repeat:-1, ease:"sine.inOut", stagger:{each:.3, from:"random"}});
    gsap.fromTo(R.gulls, {x:-260, y:330}, {x:1900, y:170, duration:30, repeat:-1, ease:"none"});
    gsap.to(R.gulls.querySelectorAll("path"), {scaleY:.4, transformOrigin:"50% 100%", duration:.35, yoyo:true, repeat:-1, stagger:.12});
    var sm = R.smokeAt;
    for(var i=0;i<3;i++){
      var c = ISO.el("circle", {cx:sm[0], cy:sm[1], r:7, fill:"#e2e8f0", opacity:0}, R.shipBody);
      gsap.fromTo(c, {attr:{cy:sm[1], r:5}, opacity:.8}, {attr:{cy:sm[1] - 60, r:15}, x:-24, opacity:0, duration:3, repeat:-1, delay:i, ease:"power1.out"});
    }
  },

  /* ── 기준 상태 — 사건 시작·장면 이동마다 여기로 돌아온다 ── */
  reset:function(api, R){
    gsap.killTweensOf([R.doc, R.doc5, R.hook, R.mail, R.ask, R.ans, R.nrTag]);
    R.carry = null;
    R.hook.gx = 430; R.hook.gy = 250; R.hook.gz = 150; drawCrane(R);
    R.ctrs.forEach(function(c, i){
      gsap.killTweensOf(c.body);
      c.classList.add("ctr-ghost");
      ISO.place(c, YARD[i][0], YARD[i][1], 0);
      gsap.set(c.body, {opacity:0, y:0, scale:1});
    });
    R.ipTags.forEach(function(t){
      gsap.killTweensOf([t, t.inner]); t.classList.remove("pod-terminating"); gsap.set(t, {opacity:0}); gsap.set(t.inner, {scale:1});
      t.querySelector("text").textContent = ""; t.setAttribute("transform", "translate(0,0)");
    });
    [R.doc, R.doc5].forEach(function(d){ gsap.set(d, {opacity:0, x:0, y:0, scale:1}); gsap.set(d.seal, {opacity:0}); });
    [R.mail, R.ask, R.ans].forEach(function(m){ gsap.set(m, {opacity:0, x:0, y:0, scale:1, rotation:0}); });
    gsap.set(R.nrTag, {opacity:0, scale:1});
    R.piers.forEach(function(P){
      gsap.killTweensOf([P.gear, P.cable]);
      P.g.classList.remove("pier-off");
      P.cable.classList.remove("live"); gsap.set(P.cable, {opacity:1});
      gsap.set(P.whLight, {opacity:0}); gsap.set(P.bang, {opacity:0});
    });
    R.crates.forEach(function(c){ gsap.set(c, {opacity:0}); });
    gsap.set(R.vaultGlow, {opacity:0});
    if(R.patrol) R.patrol.play();
  },
  afterEvent:function(api, R){ if(R.patrol) R.patrol.play(); },

  /* ── 사건별 장면 — content.js 의 beats 와 개수·순서가 같아야 한다 ── */
  scenes:{
    deploy:[
      /* 1. 요청서 보내기 */
      function(tl, api, R){
        tl.add(api.camTo(660, 310, 1.32, 1.3));
        var o = [R.officePt[0], R.officePt[1] - 10], d = [R.towerDoor[0], R.towerDoor[1] - 6];
        tl.set(R.doc, {x:o[0], y:o[1], opacity:0, scale:.3});
        tl.to(R.doc, {opacity:1, scale:1.25, duration:.5, ease:"back.out(2)"}, "-=.3");
        api.fly(tl, R.doc, o, d, {duration:2.2, lift:150});
        tl.to(R.doc, {scale:.9, duration:.3}, "-=.3");
      },
      /* 2. 창구 검사 — 도장 3개 */
      function(tl, api, R){
        tl.add(api.camTo(630, 175, 1.55, 1.2));
        var b = api.bubble(430, 34, 320, 214, [748, 108, 790, 150, 748, 142]), g = b.inner, el = api.el;
        api.text(g, 452, 66, "관제탑 접수 창구 안", "t");
        api.text(g, 452, 87, "도장 세 개를 모두 받아야 통과해요", "s");
        var dg = el("g", {transform:"translate(452,104)"}, g);
        el("rect", {x:0, y:0, width:30, height:38, rx:3, fill:"#fff", stroke:"#334155", "stroke-width":1.5}, dg);
        [10,17,24].forEach(function(yy){ el("line", {x1:5, y1:yy, x2:25, y2:yy, stroke:"#94a3b8", "stroke-width":1.8}, dg); });
        api.text(g, 495, 120, "my-shop.yaml", "m");
        api.text(g, 495, 138, "replicas: 3", "m", {fill:"#2563eb"});
        var inks = [["신원","인증"],["권한","인가 · RBAC"],["규칙","승인 제어"]].map(function(n, i){
          var cx = 496 + i*92, cy = 190;
          var s = el("g", {"class":"stamp"}, g);
          el("circle", {cx:cx, cy:cy, r:27}, s);
          api.text(s, cx, cy + 5, n[0], "");
          api.text(g, cx, cy + 44, n[1], "s", {"text-anchor":"middle"});
          var ink = el("g", {"class":"stamp stamp-on", opacity:0}, g);
          el("circle", {cx:cx, cy:cy, r:27}, ink);
          api.text(ink, cx, cy - 1, n[0], "");
          api.text(ink, cx, cy + 14, "✓", "", {"text-anchor":"middle", "font-size":"13", fill:"#dc2626", "font-weight":"900"});
          return ink;
        });
        api.pop(tl, b, "-=.5");
        inks.forEach(function(ink, i){
          tl.fromTo(ink, {opacity:0, scale:2.2, rotation:-25, transformOrigin:"50% 50%"}, {opacity:1, scale:1, rotation:-8, duration:.42, ease:"power3.in"}, "+=" + (i ? .5 : .7));
          tl.to(b.inner, {x:2, duration:.05, yoyo:true, repeat:3}, ">-0.02");
        });
        tl.to(R.doc.seal, {opacity:1, duration:.3}, "+=.2");
      },
      /* 3. 금고 장부에 기록 */
      function(tl, api, R){
        tl.add(api.camTo(800, 290, 1.2, 1.2));
        api.clearBubbles(tl, "<");
        var d = [R.towerDoor[0], R.towerDoor[1] - 6], v = [R.vaultPt[0] + 36, R.vaultPt[1] - 2];
        api.fly(tl, R.doc, d, v, {duration:1.4, lift:90}, "-=.6");
        tl.to(R.doc, {scale:.2, opacity:0, duration:.4});
        tl.fromTo(R.vaultGlow, {opacity:0}, {opacity:1, duration:.3, yoyo:true, repeat:1}, "<");
        api.pop(tl, ledger(api, 3, 0), "-=.1");
        var o = R.officePt;
        var r = api.bubble(o[0] - 120, o[1] - 120, 290, 62, [o[0] - 10, o[1] - 58, o[0] + 2, o[1] - 36, o[0] + 14, o[1] - 58]);
        api.text(r.inner, o[0] - 104, o[1] - 94, "deployment.apps/my-shop created", "m", {fill:"#16a34a", "font-weight":"700"});
        api.text(r.inner, o[0] - 104, o[1] - 72, "접수 완료 — 사무소의 일은 여기서 끝", "s");
        api.pop(tl, r, "+=.4");
      },
      /* 4. 순찰 로봇이 차이를 발견 → 자리 미정 컨테이너 3개 */
      function(tl, api, R){
        var bl = robotSees(tl, api, R, "원하는 3  ·  현재 0", "차이 발견! 3개 만들게요");
        [0,1,2].forEach(function(i){
          tl.fromTo(R.ctrs[i].body, {opacity:0, y:-40}, {opacity:1, y:0, duration:.55, ease:"bounce.out"}, i ? "-=.25" : "+=.5");
        });
        tl.call(function(){ bl.textContent = "만들었어요 — 아직 자리는 미정"; }, null, "+=.2");
      },
      /* 5. 크레인 배치원 — 거르기·점수·배치 */
      function(tl, api, R){
        tl.add(api.camTo(1050, 540, 1.08, 1.4));
        api.clearBubbles(tl, "<");
        api.hideLinks(tl, ["robot"], "<");
        api.showLink(tl, "crane", [R.craneTop[0], R.craneTop[1] + 20], R.towerPt, ">");
        var b = api.bubble(1250, 330, 262, 104, null);
        api.text(b.inner, 1270, 360, "어느 부두에 둘까?", "t");
        api.text(b.inner, 1270, 386, "부두 1  거르기 ✓  점수 72", "m");
        var best = api.text(b.inner, 1270, 410, "부두 2  거르기 ✓  점수 85 ★", "m", {fill:"#2563eb", "font-weight":"700"});
        api.pop(tl, b, "+=.1");
        tl.fromTo(best, {opacity:0}, {opacity:1, duration:.3, repeat:2, yoyo:true}, "+=.3");
        [0,1,2].forEach(function(i){ carry(tl, R, R.ctrs[i], YARD[i], slotOf(R, PLAN[i])); });
        craneHome(tl, R);
      },
      /* 6. 부두 반장 → 하역 기계 → 이미지 → 실행 */
      function(tl, api, R){
        tl.add(api.camTo(1060, 640, 1.12, 1.3));
        api.clearBubbles(tl, "<");
        api.hideLinks(tl, ["crane"], "<");
        R.piers.forEach(function(P, n){
          api.showLink(tl, "f" + (n + 1), P.foremanPt, R.towerPt, n ? "<" : ">");
          tl.fromTo(P.bang, {opacity:0, y:6}, {opacity:1, y:0, duration:.35, ease:"back.out(3)"}, "<");
        });
        tl.addLabel("pull", "+=.5");
        R.piers.forEach(function(P, n){
          var cr = R.crates[n];
          tl.set(cr, {x:R.shipPt[0], y:R.shipPt[1], opacity:0}, "pull");
          tl.to(cr, {opacity:1, duration:.2}, "pull");
          api.fly(tl, cr, R.shipPt, P.machPt, {duration:1.5, lift:160}, "pull");
          tl.to(cr, {opacity:0, scale:.5, duration:.25}, "pull+=1.5");
          tl.to(P.gear, {rotation:"+=540", transformOrigin:"50% 50%", duration:1.4, ease:"power1.inOut"}, "pull+=1.4");
        });
        tl.addLabel("run", "pull+=2.6");
        [0,1,2].forEach(function(i){
          var c = R.ctrs[i], s = slotOf(R, PLAN[i]), t = R.ipTags[i], at = "run+=" + (i * .35);
          tl.call(function(){ c.classList.remove("ctr-ghost"); }, null, at);
          tl.fromTo(c.body, {scale:1.15, transformOrigin:"50% 100%"}, {scale:1, duration:.5, ease:"back.out(3)"}, at);
          tl.call(function(){ tagAt(R, i, PLAN[i].ip, s); }, null, "run+=" + (i * .35 + .3));
          tl.to(t, {opacity:1, duration:.3}, "run+=" + (i * .35 + .3));
        });
        R.piers.forEach(function(P){
          tl.call(function(){ P.cable.classList.add("live"); }, null, "run");
          tl.to(P.whLight, {opacity:1, duration:.4}, "run");
          tl.to(P.bang, {opacity:0, duration:.3}, "run+=.8");
        });
      },
      /* 7. 보고 → 장부 현재 수 3 */
      function(tl, api, R){
        tl.add(api.camTo(880, 450, 0.98, 1.4));
        api.clearBubbles(tl, "<");
        api.hideLinks(tl, ["f1", "f2"], "<");
        R.piers.forEach(function(P, n){ api.showLink(tl, "r" + (n + 1), P.foremanPt, R.vaultPt, n ? "<" : ">", "alt"); });
        var b = ledger(api, 3, 0);
        api.pop(tl, b, "+=.3");
        [1,2,3].forEach(function(n){
          tl.call(function(){ b.cur.textContent = "현재 수     " + n + (n === 3 ? "  ✓" : ""); if(n === 3) b.cur.setAttribute("fill", "#16a34a"); }, null, "+=.45");
        });
        var rp = robotPt(R);
        var rb = api.bubble(rp[0] - 230, rp[1] - 70, 196, 50, [rp[0] - 40, rp[1] - 20, rp[0] - 16, rp[1] - 6, rp[0] - 40, rp[1] - 32]);
        api.text(rb.inner, rp[0] - 214, rp[1] - 40, "3 = 3 · 다시 지켜보기", "t", {fill:"#16a34a"});
        api.pop(tl, rb, "+=.2");
        api.hideLinks(tl, ["r1", "r2"], "+=1.2");
      }
    ],

    request:[
      /* 1. 바깥 손님이 편지를 정문으로 */
      function(tl, api, R){
        deployed(tl, R);
        tl.add(api.camTo(520, 560, 1.4, 1.3), 0);
        var g = R.guestPt, d = R.gatePt;
        var b = api.bubble(g[0] - 320, g[1] - 120, 262, 88, [g[0] - 70, g[1] - 32, g[0] - 14, g[1] - 4, g[0] - 46, g[1] - 32]);
        api.text(b.inner, g[0] - 302, g[1] - 94, "GET /  HTTP/1.1", "m");
        api.text(b.inner, g[0] - 302, g[1] - 74, ("Host: " + SHOP.domain), "m", {fill:"#2563eb"});
        api.text(b.inner, g[0] - 302, g[1] - 52, "받는 곳: 정문 공인 주소", "s");
        api.pop(tl, b, "+=.1");
        tl.set(R.mail, {x:g[0], y:g[1], opacity:0, scale:.4});
        tl.to(R.mail, {opacity:1, scale:1.2, duration:.45, ease:"back.out(2)"}, "+=.2");
        api.fly(tl, R.mail, g, d, {duration:1.5, lift:90});
        tl.to(R.mail, {scale:.9, duration:.3}, "-=.2");
      },
      /* 2. 정문 안내판 — Ingress 규칙 */
      function(tl, api, R){
        tl.add(api.camTo(600, 500, 1.5, 1.1));
        api.clearBubbles(tl, "<");
        var t = R.gateTop;
        var b = api.bubble(t[0] + 40, t[1] - 168, 268, 132, [t[0] + 50, t[1] - 36, t[0] + 8, t[1] - 4, t[0] + 84, t[1] - 36]);
        api.text(b.inner, t[0] + 60, t[1] - 140, "정문 안내판 (Ingress 규칙)", "t");
        api.text(b.inner, t[0] + 60, t[1] - 114, ("host  " + SHOP.domain), "m");
        api.text(b.inner, t[0] + 60, t[1] - 94, "path  /", "m");
        var hit = api.text(b.inner, t[0] + 60, t[1] - 70, "→ Service my-shop : 80", "m", {fill:"#2563eb", "font-weight":"700"});
        api.text(b.inner, t[0] + 60, t[1] - 50, "이름표 보고 갈 곳 찾기", "s");
        api.pop(tl, b, "+=.1");
        tl.fromTo(hit, {opacity:0}, {opacity:1, duration:.3, repeat:2, yoyo:true}, "+=.3");
      },
      /* 3. 정문이 주소 목록에서 하나를 골라 바로 배달 */
      function(tl, api, R){
        tl.add(api.camTo(980, 470, 0.98, 1.4));
        api.clearBubbles(tl, "<");
        api.showLink(tl, "gw", R.towerPt, R.gateTop, ">");
        var t = R.gateTop;
        var b = api.bubble(t[0] - 290, t[1] - 196, 252, 112, [t[0] - 90, t[1] - 84, t[0] - 16, t[1] - 10, t[0] - 60, t[1] - 84]);
        api.text(b.inner, t[0] - 272, t[1] - 168, "주소 목록 (EndpointSlice)", "t");
        api.text(b.inner, t[0] - 272, t[1] - 142, "10.244.1.5  ← 이번엔 여기", "m", {fill:"#2563eb", "font-weight":"700"});
        api.text(b.inner, t[0] - 272, t[1] - 122, "10.244.2.4", "m");
        api.text(b.inner, t[0] - 272, t[1] - 102, "10.244.2.5", "m");
        api.pop(tl, b, "+=.1");
        var to = ctrPt(slotOf(R, PLAN[1]));
        api.fly(tl, R.mail, R.gatePt, [to[0], to[1] - 8], {duration:2, lift:200}, "+=.4");
        tl.fromTo(R.ctrs[1].body, {scale:1}, {scale:1.15, transformOrigin:"50% 100%", duration:.2, yoyo:true, repeat:1});
        var ok = api.bubble(to[0] - 40, to[1] - 110, 150, 44, [to[0] - 6, to[1] - 66, to[0] + 2, to[1] - 40, to[0] + 14, to[1] - 66]);
        api.text(ok.inner, to[0] - 24, to[1] - 82, "200 OK → 손님", "t", {fill:"#16a34a"});
        api.pop(tl, ok, "<");
        api.fly(tl, R.mail, [to[0], to[1] - 8], R.guestPt, {duration:1.6, lift:200}, "+=.3");
        tl.to(R.mail, {opacity:0, duration:.3});
      },
      /* 4. 항구 안 손님(주문 앱) — 이름만 안다 → 안내소에 질문 */
      function(tl, api, R){
        tl.add(api.camTo(1130, 540, 1.15, 1.4));
        api.clearBubbles(tl, "<");
        api.hideLinks(tl, ["gw"], "<");
        var o = R.orderPt;
        var b = api.bubble(o[0] + 34, o[1] - 112, 250, 70, [o[0] + 44, o[1] - 42, o[0] + 14, o[1] - 6, o[0] + 74, o[1] - 42]);
        api.text(b.inner, o[0] + 52, o[1] - 84, "GET http://my-shop/", "m");
        api.text(b.inner, o[0] + 52, o[1] - 60, "이름만 알아요 — 주소는?", "s");
        api.pop(tl, b, "+=.1");
        tl.set(R.ask, {x:o[0], y:o[1] - 20, opacity:0, scale:.4}, "+=.3");
        tl.to(R.ask, {opacity:1, scale:1.2, duration:.4, ease:"back.out(2)"});
        api.fly(tl, R.ask, [o[0], o[1] - 20], R.boothPt, {duration:1.6, lift:120});
      },
      /* 5. 안내소가 우편함 주소를 알려 줌 */
      function(tl, api, R){
        tl.add(api.camTo(1000, 520, 1.25, 1.2));
        api.clearBubbles(tl, "<");
        tl.to(R.ask, {opacity:0, duration:.3}, "<");
        api.showLink(tl, "dns", R.boothPt, R.towerPt, ">");
        var p = R.boothPt;
        var b = api.bubble(p[0] - 150, p[1] - 176, 300, 112, [p[0] - 14, p[1] - 64, p[0], p[1] - 22, p[0] + 16, p[1] - 64]);
        api.text(b.inner, p[0] - 132, p[1] - 148, "안내소 — 우편함 이름 찾기", "t");
        api.text(b.inner, p[0] - 132, p[1] - 122, "my-shop.default.svc.cluster.local", "m");
        api.text(b.inner, p[0] - 132, p[1] - 100, "→ 10.96.0.12", "m", {fill:"#2563eb", "font-weight":"700"});
        api.text(b.inner, p[0] - 132, p[1] - 78, "우편함 주소예요 (상자 주소 아님)", "s");
        api.pop(tl, b, "+=.1");
        tl.set(R.ans, {x:p[0], y:p[1], opacity:0, scale:.4}, "+=.4");
        tl.to(R.ans, {opacity:1, scale:1.2, duration:.4, ease:"back.out(2)"});
        api.fly(tl, R.ans, p, [R.orderPt[0], R.orderPt[1] - 20], {duration:1.5, lift:120});
        tl.to(R.ans, {opacity:0, duration:.3}, "+=.2");
      },
      /* 6. 길 안내판이 받는 곳을 고쳐 씀 (DNAT) */
      function(tl, api, R){
        tl.add(api.camTo(1150, 470, 1.1, 1.2));
        api.clearBubbles(tl, "<");
        api.hideLinks(tl, ["dns"], "<");
        var o = R.orderPt, s = R.piers[0].signPt;
        api.showLink(tl, "kp", s, R.towerPt, ">");
        tl.set(R.mail, {x:o[0], y:o[1] - 20, opacity:0, scale:.4});
        tl.to(R.mail, {opacity:1, scale:1.1, duration:.4, ease:"back.out(2)"});
        api.fly(tl, R.mail, [o[0], o[1] - 20], [s[0] + 10, s[1] - 14], {duration:1.3, lift:80});
        var b = api.bubble(s[0] - 330, s[1] - 150, 290, 116, [s[0] - 70, s[1] - 34, s[0] - 14, s[1] - 6, s[0] - 46, s[1] - 34]);
        api.text(b.inner, s[0] - 312, s[1] - 122, "길 안내판 — 부두 1 커널 규칙", "t");
        var from = api.text(b.inner, s[0] - 312, s[1] - 96, "받는 곳 10.96.0.12:80", "m", {fill:"#dc2626"});
        var to = api.text(b.inner, s[0] - 312, s[1] - 74, "→ 10.244.2.4:80 로 고쳐 씀", "m", {fill:"#2563eb", "font-weight":"700", opacity:0});
        api.text(b.inner, s[0] - 312, s[1] - 52, "우편함은 편지를 받지 않아요", "s");
        api.pop(tl, b, "+=.1");
        tl.to(from, {opacity:.45, duration:.3}, "+=.5");
        tl.to(to, {opacity:1, duration:.4});
        tl.to(R.mail, {rotation:360, duration:.5, ease:"power2.inOut"}, "<");
      },
      /* 7. 배선을 따라 부두 2 상자에 도착 */
      function(tl, api, R){
        tl.add(api.camTo(1200, 600, 1.2, 1.2));
        api.clearBubbles(tl, "<");
        api.hideLinks(tl, ["kp"], "<");
        var s = R.piers[0].signPt, to = ctrPt(slotOf(R, PLAN[0]));
        R.piers.forEach(function(P){ tl.fromTo(P.cable, {opacity:.3}, {opacity:1, duration:.35, repeat:2, yoyo:true}, "<"); });
        api.fly(tl, R.mail, [s[0] + 10, s[1] - 14], [to[0], to[1] - 8], {duration:1.6, lift:60}, ">");
        tl.fromTo(R.ctrs[0].body, {scale:1}, {scale:1.15, transformOrigin:"50% 100%", duration:.2, yoyo:true, repeat:1});
        var b = api.bubble(to[0] + 96, to[1] - 44, 236, 72, [to[0] + 96, to[1] - 22, to[0] + 10, to[1] + 6, to[0] + 96, to[1] + 2]);
        api.text(b.inner, to[0] + 114, to[1] - 16, "도착 — 10.244.2.4", "t");
        api.text(b.inner, to[0] + 114, to[1] + 8, "200 OK · 보낸 곳 10.244.1.9", "m", {fill:"#16a34a"});
        api.pop(tl, b, "<");
        api.fly(tl, R.mail, [to[0], to[1] - 8], [R.orderPt[0], R.orderPt[1] - 20], {duration:1.4, lift:90}, "+=.4");
        tl.to(R.mail, {opacity:0, duration:.3});
      }
    ],

    scale:[
      /* 1. 숫자만 바꾼 요청서 */
      function(tl, api, R){
        deployed(tl, R);
        tl.add(api.camTo(660, 310, 1.32, 1.3), 0);
        var o = [R.officePt[0], R.officePt[1] - 10], d = [R.towerDoor[0], R.towerDoor[1] - 6];
        var b = api.bubble(o[0] - 210, o[1] + 40, 380, 66, [o[0] - 20, o[1] + 40, o[0] - 4, o[1] + 18, o[0] + 12, o[1] + 40]);
        api.text(b.inner, o[0] - 192, o[1] + 66, "$ kubectl scale deploy my-shop --replicas=5", "m");
        api.text(b.inner, o[0] - 192, o[1] + 90, "설계도는 그대로, 원하는 수만 3 → 5", "s");
        api.pop(tl, b, "+=.1");
        tl.set(R.doc5, {x:o[0], y:o[1], opacity:0, scale:.3});
        tl.to(R.doc5, {opacity:1, scale:1.25, duration:.5, ease:"back.out(2)"}, "+=.3");
        api.fly(tl, R.doc5, o, d, {duration:2, lift:150});
        tl.to(R.doc5, {scale:.9, duration:.3}, "-=.3");
      },
      /* 2. 장부의 원하는 수 3 → 5 */
      function(tl, api, R){
        tl.add(api.camTo(800, 290, 1.2, 1.2));
        api.clearBubbles(tl, "<");
        var d = [R.towerDoor[0], R.towerDoor[1] - 6], v = [R.vaultPt[0] + 36, R.vaultPt[1] - 2];
        api.fly(tl, R.doc5, d, v, {duration:1.4, lift:90}, "-=.6");
        tl.to(R.doc5, {scale:.2, opacity:0, duration:.4});
        tl.fromTo(R.vaultGlow, {opacity:0}, {opacity:1, duration:.3, yoyo:true, repeat:1}, "<");
        var b = ledger(api, 3, 3);
        api.pop(tl, b, "-=.1");
        tl.call(function(){ b.want.textContent = "원하는 수   5  (3 → 5)"; }, null, "+=.6");
        tl.fromTo(b.want, {opacity:.2}, {opacity:1, duration:.4}, "<");
      },
      /* 3. 순찰 로봇 — 차이 2 → 새 상자 2개 */
      function(tl, api, R){
        var bl = robotSees(tl, api, R, "원하는 5  ·  현재 3", "차이 2! 2개 더 만들게요");
        dropNew(tl, R);
        tl.call(function(){ bl.textContent = "같은 설계도라 같은 묶음(7d9f6c)"; }, null, "+=.2");
      },
      /* 4. 크레인 배치원 — 두 부두에 나눠 둠 */
      function(tl, api, R){
        tl.add(api.camTo(1050, 540, 1.08, 1.4));
        api.clearBubbles(tl, "<");
        api.hideLinks(tl, ["robot"], "<");
        api.showLink(tl, "crane", [R.craneTop[0], R.craneTop[1] + 20], R.towerPt, ">");
        var b = api.bubble(1250, 330, 270, 104, null);
        api.text(b.inner, 1270, 360, "한쪽에 몰리지 않게", "t");
        api.text(b.inner, 1270, 386, "새 상자 1 → 부두 1 ★", "m", {fill:"#2563eb"});
        api.text(b.inner, 1270, 410, "새 상자 2 → 부두 2 ★", "m", {fill:"#2563eb"});
        api.pop(tl, b, "+=.1");
        [3,4].forEach(function(i, n){ carry(tl, R, R.ctrs[i], YARD[i], slotOf(R, SCALE_PLAN[n])); });
        craneHome(tl, R);
      },
      /* 5. 반장이 실행 — 이미지는 이미 부두에 있다 */
      function(tl, api, R){
        tl.add(api.camTo(1080, 600, 1.12, 1.3));
        api.clearBubbles(tl, "<");
        api.hideLinks(tl, ["crane"], "<");
        R.piers.forEach(function(P, n){
          api.showLink(tl, "f" + (n + 1), P.foremanPt, R.towerPt, n ? "<" : ">");
          tl.fromTo(P.bang, {opacity:0, y:6}, {opacity:1, y:0, duration:.35, ease:"back.out(3)"}, "<");
        });
        var m = R.piers[1].machPt;
        var b = api.bubble(m[0] - 330, m[1] - 20, 270, 66, [m[0] - 60, m[1] - 4, m[0] - 14, m[1] + 2, m[0] - 60, m[1] + 18]);
        api.text(b.inner, m[0] - 312, m[1] + 6, "nginx:1.27 이미 있음", "t");
        api.text(b.inner, m[0] - 312, m[1] + 30, "저장소선에서 다시 받지 않아요", "s");
        api.pop(tl, b, "+=.2");
        tl.addLabel("run", "+=.4");
        R.piers.forEach(function(P){ tl.to(P.gear, {rotation:"+=360", transformOrigin:"50% 50%", duration:.9, ease:"power1.inOut"}, "run"); });
        runNew(tl, R, SCALE_PLAN, "run", .6);
        R.piers.forEach(function(P){ tl.to(P.bang, {opacity:0, duration:.3}, "run+=1.6"); });
      },
      /* 6. 우편함 목록에 합류 */
      function(tl, api, R){
        tl.add(api.camTo(1000, 590, 1.05, 1.3));
        api.clearBubbles(tl, "<");
        api.hideLinks(tl, ["f1", "f2"], "<");
        var mp = R.mailPt;
        var b = api.bubble(mp[0] - 330, mp[1] - 60, 290, 140, [mp[0] - 40, mp[1] - 8, mp[0] - 12, mp[1], mp[0] - 40, mp[1] + 14]);
        api.text(b.inner, mp[0] - 312, mp[1] - 32, "우편함 my-shop · 10.96.0.12", "t");
        api.text(b.inner, mp[0] - 312, mp[1] - 8, "10.244.1.5  10.244.2.4", "m");
        api.text(b.inner, mp[0] - 312, mp[1] + 12, "10.244.2.5", "m");
        var n1 = api.text(b.inner, mp[0] - 312, mp[1] + 34, "+ 10.244.1.6  + 10.244.2.6", "m", {fill:"#16a34a", "font-weight":"700", opacity:0});
        api.text(b.inner, mp[0] - 312, mp[1] + 58, "준비(Ready) 되면 목록에 합류", "s");
        api.pop(tl, b, "+=.1");
        [3,4].forEach(function(i, n){
          var to = ctrPt(slotOf(R, SCALE_PLAN[n]));
          api.showLink(tl, "e" + (n + 1), R.mailPt, to, n ? "<" : "+=.4", "alt");
        });
        tl.to(n1, {opacity:1, duration:.4}, "+=.3");
      },
      /* 7. 장부 현재 수 5 */
      function(tl, api, R){
        tl.add(api.camTo(880, 450, 0.98, 1.4));
        api.clearBubbles(tl, "<");
        api.hideLinks(tl, ["e1", "e2"], "<");
        R.piers.forEach(function(P, n){ api.showLink(tl, "r" + (n + 1), P.foremanPt, R.vaultPt, n ? "<" : ">", "alt"); });
        var b = ledger(api, 5, 3);
        api.pop(tl, b, "+=.3");
        [4,5].forEach(function(n){
          tl.call(function(){ b.cur.textContent = "현재 수     " + n + (n === 5 ? "  ✓" : ""); if(n === 5) b.cur.setAttribute("fill", "#16a34a"); }, null, "+=.45");
        });
        var rp = robotPt(R);
        var rb = api.bubble(rp[0] - 230, rp[1] - 70, 196, 50, [rp[0] - 40, rp[1] - 20, rp[0] - 16, rp[1] - 6, rp[0] - 40, rp[1] - 32]);
        api.text(rb.inner, rp[0] - 214, rp[1] - 40, "5 = 5 · 다시 지켜보기", "t", {fill:"#16a34a"});
        api.pop(tl, rb, "+=.2");
        api.hideLinks(tl, ["r1", "r2"], "+=1.2");
      }
    ],

    nodedown:[
      /* 1. 부두 2 전원 꺼짐 */
      function(tl, api, R){
        deployed(tl, R);
        tl.add(api.camTo(1100, 620, 1.12, 1.3), 0);
        var P = R.piers[1], lp = P.labelPt;
        tl.call(function(){ P.g.classList.add("pier-off"); P.cable.classList.remove("live"); }, null, "+=.3");
        tl.to(P.whLight, {opacity:0, duration:.3}, "<");
        tl.to([R.ctrs[0].body, R.ctrs[2].body], {opacity:.45, duration:.4}, "<");
        var b = api.bubble(lp[0] + 120, lp[1] - 130, 268, 70, [lp[0] + 120, lp[1] - 110, lp[0] - 40, lp[1] - 116, lp[0] + 120, lp[1] - 86]);
        api.text(b.inner, lp[0] + 138, lp[1] - 102, "⚡ 부두 2 (worker-2) 꺼짐", "t", {fill:"#dc2626"});
        api.text(b.inner, lp[0] + 138, lp[1] - 78, "반장도 멈춰 — 보고가 끊겨요", "s");
        api.pop(tl, b, "+=.2");
      },
      /* 2. 순찰 로봇(노드 담당) — 생존 신호 없음 → NotReady */
      function(tl, api, R){
        tl.call(function(){ if(R.patrol) R.patrol.pause(); });
        tl.add(api.camTo(940, 480, 0.98, 1.3));
        api.clearBubbles(tl, "<");
        tl.to(R.robotPos, {gx:230, duration:1, ease:"power2.inOut", onUpdate:function(){ placeRobot(R); }}, "<");
        api.showLink(tl, "robot", function(){ return robotPt(R); }, R.towerPt, ">");
        var rp = iso(230, 252, 26);
        var b = api.bubble(rp[0] - 330, rp[1] - 112, 288, 68, [rp[0] - 46, rp[1] - 76, rp[0] - 20, rp[1] - 60, rp[0] - 46, rp[1] - 60]);
        api.text(b.inner, rp[0] - 312, rp[1] - 86, "worker-2 생존 신호 40초째 없음", "t");
        api.text(b.inner, rp[0] - 312, rp[1] - 62, "→ NotReady · 출입 금지 표시(taint)", "s");
        api.pop(tl, b, "+=.2");
        tl.fromTo(R.nrTag, {opacity:0, scale:.5, transformOrigin:"50% 50%"}, {opacity:1, scale:1, duration:.45, ease:"back.out(2)"}, "+=.3");
      },
      /* 3. 우편함 목록 — 부두 2 주소는 '준비 안 됨' */
      function(tl, api, R){
        tl.add(api.camTo(1000, 600, 1.08, 1.2));
        api.clearBubbles(tl, "<");
        api.hideLinks(tl, ["robot"], "<");
        var mp = R.mailPt;
        var b = api.bubble(mp[0] - 330, mp[1] - 60, 290, 118, [mp[0] - 40, mp[1] - 8, mp[0] - 12, mp[1], mp[0] - 40, mp[1] + 14]);
        api.text(b.inner, mp[0] - 312, mp[1] - 32, "우편함 my-shop 목록", "t");
        api.text(b.inner, mp[0] - 312, mp[1] - 8, "10.244.1.5  ready ✓", "m", {fill:"#16a34a"});
        var x1 = api.text(b.inner, mp[0] - 312, mp[1] + 12, "10.244.2.4  ready ✓", "m");
        var x2 = api.text(b.inner, mp[0] - 312, mp[1] + 32, "10.244.2.5  ready ✓", "m");
        api.pop(tl, b, "+=.1");
        [0,2].forEach(function(i, n){ api.showLink(tl, "x" + (n + 1), R.mailPt, ctrPt(slotOf(R, PLAN[i])), n ? "<" : "+=.3", "warn"); });
        tl.call(function(){ [x1, x2].forEach(function(t){ t.textContent = t.textContent.replace("✓", "✗ 빠짐"); t.setAttribute("fill", "#dc2626"); }); }, null, "+=.4");
      },
      /* 4. 5분 뒤 축출 — Terminating */
      function(tl, api, R){
        tl.add(api.camTo(1130, 640, 1.25, 1.2));
        api.clearBubbles(tl, "<");
        api.hideLinks(tl, ["x1", "x2"], "<");
        var lp = R.piers[1].labelPt;
        var b = api.bubble(lp[0] + 120, lp[1] - 130, 262, 70, [lp[0] + 120, lp[1] - 110, lp[0] - 40, lp[1] - 116, lp[0] + 120, lp[1] - 86]);
        api.text(b.inner, lp[0] + 138, lp[1] - 102, "⏱ 5분(300초) 기다림 끝", "t");
        api.text(b.inner, lp[0] + 138, lp[1] - 78, "상자 2개 축출 → Terminating", "s");
        api.pop(tl, b, "+=.1");
        [0,2].forEach(function(i, n){
          var c = R.ctrs[i], t = R.ipTags[i], a = "+=" + (n ? .1 : .5);
          tl.call(function(){ c.classList.add("ctr-ghost"); t.classList.add("pod-terminating"); t.querySelector("text").textContent = "Terminating"; }, null, a);
          tl.fromTo(t.inner, {scale:1.3, transformOrigin:"50% 50%"}, {scale:1, duration:.35, ease:"back.out(2)"}, "<");
        });
      },
      /* 5. 순찰 로봇(ReplicaSet 담당) — 살아 있는 수 1 → 2개 새로 */
      function(tl, api, R){
        var bl = robotSees(tl, api, R, "원하는 3  ·  살아 있는 1", "차이 2! 2개 새로 만들게요");
        dropNew(tl, R);
        tl.call(function(){ bl.textContent = "만들었어요 — 아직 자리는 미정"; }, null, "+=.2");
      },
      /* 6. 크레인 배치원 — 부두 2는 거르기에서 탈락 */
      function(tl, api, R){
        tl.add(api.camTo(1050, 540, 1.08, 1.4));
        api.clearBubbles(tl, "<");
        api.hideLinks(tl, ["robot"], "<");
        api.showLink(tl, "crane", [R.craneTop[0], R.craneTop[1] + 20], R.towerPt, ">");
        var b = api.bubble(1250, 330, 280, 104, null);
        api.text(b.inner, 1270, 360, "어느 부두에 둘까?", "t");
        api.text(b.inner, 1270, 386, "부두 1  거르기 ✓  → 둘 다", "m", {fill:"#2563eb", "font-weight":"700"});
        api.text(b.inner, 1270, 410, "부두 2  거르기 ✗  출입 금지", "m", {fill:"#dc2626"});
        api.pop(tl, b, "+=.1");
        [3,4].forEach(function(i, n){ carry(tl, R, R.ctrs[i], YARD[i], slotOf(R, HEAL_PLAN[n])); });
        craneHome(tl, R);
      },
      /* 7. 부두 1 반장이 실행 */
      function(tl, api, R){
        tl.add(api.camTo(1220, 520, 1.2, 1.3));
        api.clearBubbles(tl, "<");
        api.hideLinks(tl, ["crane"], "<");
        var P = R.piers[0];
        api.showLink(tl, "f1", P.foremanPt, R.towerPt, ">");
        tl.fromTo(P.bang, {opacity:0, y:6}, {opacity:1, y:0, duration:.35, ease:"back.out(3)"}, "<");
        var m = P.machPt;
        var b = api.bubble(m[0] + 230, m[1] - 150, 250, 66, [m[0] + 230, m[1] - 128, m[0] + 8, m[1] - 8, m[0] + 230, m[1] - 104]);
        api.text(b.inner, m[0] + 248, m[1] - 124, "nginx:1.27 이미 있음", "t");
        api.text(b.inner, m[0] + 248, m[1] - 100, "부두 1에서 바로 실행", "s");
        api.pop(tl, b, "+=.2");
        tl.addLabel("run", "+=.4");
        tl.to(P.gear, {rotation:"+=360", transformOrigin:"50% 50%", duration:.9, ease:"power1.inOut"}, "run");
        runNew(tl, R, HEAL_PLAN, "run", .6);
        tl.to(P.bang, {opacity:0, duration:.3}, "run+=1.6");
      },
      /* 8. 우편함 목록 갱신 */
      function(tl, api, R){
        tl.add(api.camTo(1040, 560, 1.0, 1.3));
        api.clearBubbles(tl, "<");
        api.hideLinks(tl, ["f1"], "<");
        var mp = R.mailPt;
        var b = api.bubble(mp[0] - 350, mp[1] - 60, 310, 140, [mp[0] - 40, mp[1] - 8, mp[0] - 12, mp[1], mp[0] - 40, mp[1] + 14]);
        api.text(b.inner, mp[0] - 332, mp[1] - 32, "우편함 my-shop · 10.96.0.12", "t");
        api.text(b.inner, mp[0] - 332, mp[1] - 8, "10.244.1.5  ready ✓", "m", {fill:"#16a34a"});
        var n1 = api.text(b.inner, mp[0] - 332, mp[1] + 12, "10.244.1.7  ready ✓  새로", "m", {fill:"#16a34a", "font-weight":"700", opacity:0});
        var n2 = api.text(b.inner, mp[0] - 332, mp[1] + 32, "10.244.1.8  ready ✓  새로", "m", {fill:"#16a34a", "font-weight":"700", opacity:0});
        api.text(b.inner, mp[0] - 332, mp[1] + 56, "부두 2 주소 2개는 terminating", "s");
        api.pop(tl, b, "+=.1");
        [1,3,4].forEach(function(i, n){
          var s = i === 1 ? slotOf(R, PLAN[1]) : slotOf(R, HEAL_PLAN[i - 3]);
          api.showLink(tl, "e" + (n + 1), R.mailPt, ctrPt(s), n ? "<" : "+=.3", "alt");
        });
        tl.to([n1, n2], {opacity:1, duration:.4, stagger:.3}, "+=.2");
      }
    ]
  }
};
})();
