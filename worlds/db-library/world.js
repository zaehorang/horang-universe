/* 데이터베이스 도서관 — 지도 그리기 · 배경 움직임 · 기준 상태 · 사건별 장면 움직임
   왼쪽: 질의 처리(정문·문장 검사·길 고르기) · 가운데: 열람실(메모리) · 오른쪽: 서고(디스크) · 위: 일지 보관소(디스크) */
(function(){
"use strict";

var PAY = window.SHARED.shops["pay-app"];
var GUEST = window.SHARED.guests["guest-app"];
var APP_NAME = PAY.appName;
var DB_HOST = PAY.dbHost;
var DB_USER = PAY.dbUser;

var ISO = window.ISO;
var iso = ISO.iso, isoL = ISO.isoL, el = ISO.el, box = ISO.box, flat = ISO.flat, faceR = ISO.faceR, faceL = ISO.faceL, C = ISO.C, act = ISO.act;

var BOOK = ["#fca5a5","#f87171","#ef4444"];

/* 말풍선 — 줄 목록으로 높이를 정하고, 꼬리는 target 쪽 변에서 뽑는다 */
function say(api, x, y, w, lines, target){
  var h = 18 + lines.length * 22, tail = null;
  if(target){
    var tx = target[0], ty = target[1];
    if(ty > y + h){ var bx = Math.max(x + 22, Math.min(x + w - 22, tx)); tail = [bx - 11, y + h - 1, tx, ty, bx + 11, y + h - 1]; }
    else if(ty < y){ var bx2 = Math.max(x + 22, Math.min(x + w - 22, tx)); tail = [bx2 - 11, y + 1, tx, ty, bx2 + 11, y + 1]; }
    else if(tx < x){ var by = Math.max(y + 16, Math.min(y + h - 16, ty)); tail = [x + 1, by - 10, tx, ty, x + 1, by + 10]; }
    else { var by2 = Math.max(y + 16, Math.min(y + h - 16, ty)); tail = [x + w - 1, by2 - 10, tx, ty, x + w - 1, by2 + 10]; }
  }
  var b = api.bubble(x, y, w, h, tail);
  b.lines = lines.map(function(l, i){ return api.text(b.inner, x + 16, y + 30 + i * 22, l[0], l[1] || "s", l[2]); });
  return b;
}

/* 사서·담당자 — 위치는 GSAP x/y (속성 transform 없음) */
function walker(parent, actor, name, o){
  var g = act(parent, actor, name);
  ISO.person(g, 0, 0, o);
  return g;
}

/* 책 한 권 = 데이터 페이지 8KB */
function book(parent, mark){
  var g = el("g", {"class":"book"}, parent);
  box(g, isoL, -12, -18, 0, 24, 36, 10, BOOK);
  var t = isoL(0, 18, 4);
  ISO.text(g, t[0] - 2, t[1] + 3, mark, "bk", {"text-anchor":"middle"});
  g.dirty = el("rect", {x:-16, y:-15, width:32, height:5, rx:2, fill:"#dc2626", opacity:0}, g);
  return g;
}
/* 일지 쪽지 */
function card(parent){
  var g = el("g", {opacity:0}, parent);
  el("rect", {x:-12, y:-8, width:24, height:16, rx:2, fill:"#fef3c7", stroke:"#b45309", "stroke-width":1.4}, g);
  el("line", {x1:-7, y1:-2, x2:7, y2:-2, stroke:"#b45309", "stroke-width":1.2}, g);
  el("line", {x1:-7, y1:3, x2:4, y2:3, stroke:"#b45309", "stroke-width":1.2}, g);
  return g;
}

window.WORLD = {
  home:{x:850, y:450, s:1.1},

  build:function(api){
    var L = api.L, R = {}, p;
    api.defs.insertAdjacentHTML("beforeend",
      "<radialGradient id='glowY'><stop offset='0' stop-color='#fde68a' stop-opacity='.95'/><stop offset='1' stop-color='#fde68a' stop-opacity='0'/></radialGradient>");

    /* 땅 · 길 */
    box(L.ground, iso, -100, 0, -30, 900, 720, 30, ["#ece3cf","#d6c9ab","#c4b694"]);
    flat(L.ground, -95, 300, 0.3, 70, 400, {fill:"#c9ced6"});
    for(var r=0;r<6;r++){ var a1 = iso(-60, 320 + r*65, 0.4), a2 = iso(-60, 352 + r*65, 0.4);
      el("line", {x1:a1[0], y1:a1[1], x2:a2[0], y2:a2[1], stroke:"#fff", "stroke-width":2.4}, L.ground); }

    /* 구역 바닥 */
    flat(L.ground, 0, 300, 0.5, 255, 400, {fill:"#e6ddf3", stroke:"#b7a6d6", "stroke-width":2});
    flat(L.ground, 270, 210, 0.5, 270, 300, {fill:"#e9cfa6", stroke:"#c49a62", "stroke-width":2});
    flat(L.ground, 570, 100, 0.5, 225, 420, {fill:"#cdd3da", stroke:"#8f99a5", "stroke-width":2});
    flat(L.ground, 40, 20, 0.5, 290, 180, {fill:"#cdd3da", stroke:"#8f99a5", "stroke-width":2});
    for(var q=1;q<9;q++){ var w1 = iso(270 + q*30, 210, 0.6), w2 = iso(270 + q*30, 510, 0.6);
      el("line", {x1:w1[0], y1:w1[1], x2:w2[0], y2:w2[1], stroke:"#d8b98c", "stroke-width":1.2}, L.ground); }

    /* 일지 보관소 (WAL · pg_wal) */
    var wal = act(L.back, "wal", "변경 일지");
    box(wal, iso, 80, 50, 0, 130, 90, 78, C.conc);
    box(wal, iso, 74, 44, 78, 142, 102, 8, C.stone);
    faceL(wal, 120, 140, 0, 34, 46, "#5b636e");
    faceR(wal, 210, 66, 30, 22, 22, "#8cc0ee"); faceR(wal, 210, 104, 30, 22, 22, "#8cc0ee");
    box(wal, iso, 236, 150, 0, 30, 24, 36, C.wood);
    var lb = iso(251, 162, 36);
    R.walGlow = el("circle", {cx:lb[0], cy:lb[1] - 6, r:46, fill:"url(#glowY)", opacity:0}, wal);
    el("path", {d:"M" + (lb[0]-22) + "," + (lb[1]-4) + " l22,-10 l22,10 l-22,10 Z", fill:"#fff", stroke:"#334155", "stroke-width":1.6}, wal);
    el("line", {x1:lb[0], y1:lb[1]-14, x2:lb[0], y2:lb[1]+6, stroke:"#334155", "stroke-width":1.4}, wal);
    for(var k=0;k<3;k++) el("line", {x1:lb[0]-16 + k*2, y1:lb[1]-5 + k*3 - 4, x2:lb[0]-5, y2:lb[1]-10 + k*3, stroke:"#94a3b8", "stroke-width":1}, wal);
    R.walPt = [lb[0], lb[1] - 8];

    /* 복구 담당 (startup process) */
    var sp = iso(300, 130, 0);
    var st = act(L.back, "startup", "복구 담당");
    ISO.person(st, sp[0], sp[1], {body:"#0d9488", clip:true});
    R.startupPt = [sp[0], sp[1] - 52];
    R.startupBang = ISO.bang(st, sp[0] + 14, sp[1] - 72);

    /* 일지 바구니 (wal_buffers, 메모리) */
    var wb = act(L.back, "walbuf", "일지 바구니");
    box(wb, iso, 288, 236, 0, 36, 30, 18, ["#e0b97a","#c4955a","#b0844c"]);
    for(var m=0;m<3;m++){ var c1 = iso(288 + m*12, 266, 4), c2 = iso(288 + m*12, 266, 15); el("line", {x1:c1[0], y1:c1[1], x2:c2[0], y2:c2[1], stroke:"#8a6235", "stroke-width":1}, wb); }
    R.basketPt = iso(306, 251, 22);

    /* 정문 (postmaster) */
    var gate = act(L.mid, "gate", "정문 안내원");
    box(gate, iso, 20, 500, 0, 90, 80, 66, C.white);
    box(gate, iso, 14, 494, 66, 102, 92, 8, C.purple);
    faceL(gate, 46, 580, 0, 36, 44, "#4c1d95");
    faceR(gate, 110, 515, 24, 22, 18, "#8cc0ee"); faceR(gate, 110, 545, 24, 22, 18, "#8cc0ee");
    var gp = iso(65, 580, 58);
    ISO.text(gate, gp[0] - 4, gp[1] + 4, "5432", "door", {"text-anchor":"middle"});
    var gk = iso(30, 610, 0);
    ISO.person(gate, gk[0], gk[1], {body:"#7c3aed"});
    R.gatePt = iso(65, 540, 74);

    /* 문장 검사 데스크 (parser) */
    var ps = act(L.mid, "parser", "문장 검사 데스크");
    box(ps, iso, 90, 400, 0, 70, 50, 28, C.wood);
    var pp = iso(110, 415, 28);
    el("rect", {x:pp[0] - 9, y:pp[1] - 7, width:18, height:12, rx:2, fill:"#fff", stroke:"#64748b"}, ps);
    var lp = iso(145, 410, 28);
    el("line", {x1:lp[0], y1:lp[1], x2:lp[0], y2:lp[1] - 24, stroke:"#475569", "stroke-width":2}, ps);
    el("path", {d:"M" + (lp[0]-9) + "," + (lp[1]-22) + " l9,-10 l9,10 Z", fill:"#facc15"}, ps);
    R.parserPt = iso(125, 425, 34);

    /* 길 고르는 지도 테이블 (planner) */
    var pl = act(L.mid, "planner", "길 고르는 지도 테이블");
    box(pl, iso, 160, 300, 0, 90, 60, 26, C.navy);
    flat(pl, 168, 306, 26.5, 74, 48, {fill:"#f8fafc"});
    var r1 = iso(175, 315, 27), r2 = iso(235, 345, 27), r3 = iso(175, 345, 27);
    el("path", {d:"M" + r1 + " L" + r2, stroke:"#dc2626", "stroke-width":2, "stroke-dasharray":"4 3", fill:"none"}, pl);
    el("path", {d:"M" + r3 + " L" + r2, stroke:"#16a34a", "stroke-width":2.4, fill:"none"}, pl);
    R.plannerPt = iso(205, 330, 32);

    /* 열람 책상 (shared_buffers) */
    var desk = act(L.mid, "buffer", "열람 책상");
    box(desk, iso, 340, 300, 0, 160, 100, 24, C.wood);
    R.slots = [];
    for(var s=0;s<4;s++){
      var sx = 370 + s*36;
      flat(desk, sx - 14, 325, 24.5, 28, 40, {fill:"none", stroke:"#8a6235", "stroke-width":1.2, "stroke-dasharray":"4 3"});
      R.slots.push(iso(sx, 345, 24));
    }
    R.deskPt = iso(420, 350, 30);

    /* 잠금 대기표 (row-level lock) */
    var lk = act(L.mid, "lock", "잠금 표지판");
    var lkp = iso(296, 466, 0);
    el("rect", {x:lkp[0] - 2.5, y:lkp[1] - 46, width:5, height:46, fill:"#475569"}, lk);
    el("rect", {x:lkp[0] - 22, y:lkp[1] - 74, width:44, height:30, rx:5, fill:"#fff", stroke:"#475569", "stroke-width":2}, lk);
    ISO.text(lk, lkp[0], lkp[1] - 54, "🔒", "", {"text-anchor":"middle", "font-size":"15"});

    /* 서고 책장 (heap 데이터 파일) */
    var heap = act(L.mid, "heap", "서고 책장");
    var spines = ["#60a5fa","#f59e0b","#34d399","#a78bfa","#f87171","#22d3ee","#fbbf24"];
    [150, 245, 340].forEach(function(gy, row){
      box(heap, iso, 610, gy, 0, 170, 30, 84, C.wood);
      [6, 34, 62].forEach(function(z){
        for(var b=0;b<9;b++){
          if(row === 2 && z === 34 && b === 2) continue;   /* 7번 책 자리 */
          faceL(heap, 618 + b*18, gy + 30, z, 13, 20, spines[(b + row*3 + z) % spines.length]);
        }
      });
    });
    R.shelfPt = iso(660, 376, 40);

    /* 색인 서랍 (B-tree index) */
    var ix = act(L.mid, "index", "색인 서랍");
    box(ix, iso, 600, 440, 0, 90, 60, 64, C.wood);
    for(var d=0;d<3;d++) for(var e=0;e<3;e++){
      faceL(ix, 608 + e*28, 500, 8 + d*19, 22, 14, "#e7c79c");
      var kn = iso(619 + e*28, 500, 15 + d*19); el("circle", {cx:kn[0], cy:kn[1], r:1.8, fill:"#6b4a2b"}, ix);
    }
    R.indexPt = iso(645, 470, 70);

    /* 정리 담당 (checkpointer) */
    R.ck = walker(L.fx, "checkpointer", "정리 담당", {body:"#ea580c", hard:true});
    R.ckHome = iso(540, 280, 0); R.ckAtDesk = iso(540, 372, 0);

    /* 손님 (클라이언트 연결) */
    var ca = iso(-60, 470, 0), cb = iso(-60, 580, 0);
    var cA = act(L.front, "client", "손님 A");
    ISO.person(cA, ca[0], ca[1], {body:"#2563eb", clip:true});
    R.cliB = act(L.front, "client", "손님 B");
    ISO.person(R.cliB, cb[0], cb[1], {body:"#db2777", clip:true});
    R.cliA = [ca[0], ca[1] - 52]; R.cliBpt = [cb[0], cb[1] - 52];

    /* 전담 사서 (backend process) — A 는 늘, B 는 동시성 사건에서만 */
    R.libA = walker(L.fx, "backend", "전담 사서 A", {body:"#1d4ed8", clip:true});
    R.libB = walker(L.fx, "backend", "전담 사서 B", {body:"#be185d", clip:true});
    R.aHome = iso(150, 490, 0); R.bHome = iso(232, 560, 0);
    R.atParser = iso(130, 475, 0); R.atPlanner = iso(215, 392, 0); R.atIndex = iso(645, 528, 0);
    R.atDeskA = iso(390, 425, 0); R.atDeskB = iso(512, 418, 0);
    R.gateDoor = iso(65, 590, 0);
    R.hourglass = el("g", {opacity:0}, L.fx);
    ISO.text(R.hourglass, 0, 0, "⌛", "", {"text-anchor":"middle", "font-size":"20"});

    /* 움직이는 물체 */
    R.others = [book(L.fx, "3"), book(L.fx, "12")];
    R.book7 = book(L.fx, "7");
    R.slip = ISO.paper(L.fx, "SQL");
    R.res = ISO.paper(L.fx, "1 row");
    R.copy = ISO.paper(L.fx, "p.7");
    R.cards = [card(L.fx), card(L.fx), card(L.fx)];
    R.padlock = act(L.fx, "lock", "행 잠금");
    R.shackle = el("path", {d:"M-6,-8 V-13 A6,6 0 0 1 6,-13 V-8", fill:"none", stroke:"#475569", "stroke-width":3}, R.padlock);
    el("rect", {x:-9, y:-9, width:18, height:14, rx:3, fill:"#f59e0b", stroke:"#b45309", "stroke-width":1.5}, R.padlock);
    R.blackout = flat(L.fx, 270, 210, 40, 270, 300, {fill:"#0b1220", opacity:0, "pointer-events":"none"});

    /* 라벨 */
    p = iso(0, 700, 0);   api.label(p[0] + 210, p[1] + 60, "질의 처리", "inside backend", true);
    p = iso(540, 510, 0); api.label(p[0] - 100, p[1] + 26, "열람실 · 메모리", "RAM", true);
    p = iso(795, 250, 0); api.label(p[0] + 60, p[1] + 34, "서고 · 디스크", "data files", true);
    p = iso(40, 200, 0);  api.label(p[0] - 50, p[1] + 20, "일지 보관소 · 디스크", "pg_wal", true);
    p = iso(145, 95, 86); api.label(p[0], p[1] - 22, "변경 일지", "WAL");
    api.label(sp[0] + 70, sp[1] + 10, "복구 담당", "startup process");
    p = R.basketPt; api.label(p[0] - 30, p[1] + 50, "일지 바구니", "wal_buffers");
    p = iso(110, 590, 0); api.label(p[0] + 20, p[1] + 22, "정문 안내원", "postmaster");
    p = iso(125, 425, 28); api.label(p[0] - 70, p[1] - 30, "문장 검사 데스크", "parser");
    p = iso(205, 330, 26); api.label(p[0] + 6, p[1] - 38, "길 고르는 지도 테이블", "planner");
    p = iso(340, 400, 0); api.label(p[0] - 40, p[1] + 26, "열람 책상", "shared_buffers");
    api.label(lkp[0] - 70, lkp[1] + 6, "잠금 표지판", "row-level lock");
    p = iso(780, 150, 84); api.label(p[0] + 30, p[1] - 22, "서고 책장", "heap");
    p = iso(690, 500, 0); api.label(p[0] + 66, p[1] + 10, "색인 서랍", "B-tree index");
    api.label(ca[0], ca[1] - 86, "손님", `${APP_NAME}`);
    R.ckLabel = api.label(R.ckHome[0], R.ckHome[1] - 86, "정리 담당", "checkpointer");
    R.aLabel = api.label(R.aHome[0] + 70, R.aHome[1] + 6, "전담 사서", "backend");
    return R;
  },

  ambient:function(api, R){
    var w = document.getElementById("world");
    gsap.to(w.querySelectorAll(".bob"), {y:-1.6, duration:.9, yoyo:true, repeat:-1, ease:"sine.inOut", stagger:{each:.3, from:"random"}});
  },

  reset:function(api, R){
    var all = [R.libA, R.libB, R.ck, R.slip, R.res, R.copy, R.book7, R.padlock, R.shackle, R.hourglass, R.blackout, R.walGlow, R.startupBang, R.cliB, R.aLabel, R.ckLabel]
      .concat(R.cards, R.others, [R.book7.dirty]);
    gsap.killTweensOf(all);
    gsap.set(R.libA, {x:R.aHome[0], y:R.aHome[1], autoAlpha:1});
    gsap.set(R.libB, {x:R.bHome[0], y:R.bHome[1], autoAlpha:0});
    gsap.set(R.cliB, {autoAlpha:0});
    gsap.set(R.ck, {x:R.ckHome[0], y:R.ckHome[1]});
    gsap.set([R.aLabel, R.ckLabel], {opacity:1});
    [R.slip, R.res, R.copy].forEach(function(n){ gsap.set(n, {opacity:0, x:0, y:0, scale:1}); gsap.set(n.seal, {opacity:0}); });
    R.cards.forEach(function(c){ gsap.set(c, {opacity:0, x:0, y:0, scale:1}); });
    R.others.forEach(function(b, i){ gsap.set(b, {x:R.slots[i][0], y:R.slots[i][1], opacity:1}); });
    gsap.set(R.book7, {x:R.shelfPt[0], y:R.shelfPt[1], opacity:1, scale:1});
    gsap.set(R.book7.dirty, {opacity:0});
    gsap.set(R.padlock, {x:R.slots[2][0], y:R.slots[2][1] - 30, autoAlpha:0, scale:1});
    gsap.set(R.shackle, {y:0});
    gsap.set(R.hourglass, {opacity:0, x:0, y:0, scale:1});
    gsap.set(R.blackout, {opacity:0});
    gsap.set([R.walGlow, R.startupBang], {opacity:0});
  },

  scenes:{
    /* ① 책 찾기 — SELECT 한 번 */
    select:[
      /* 1. 정문이 연결을 받아 전담 사서 배정 */
      function(tl, api, R){
        tl.add(api.camTo(470, 380, 1.35, 1.2));
        api.showLink(tl, "conn", R.cliA, R.gatePt, ">");
        tl.set(R.libA, {x:R.gateDoor[0], y:R.gateDoor[1]}, "<");
        tl.to(R.aLabel, {opacity:0, duration:.2}, "<");
        var b = say(api, 250, 170, 300, [["새 연결 → 전담 사서 한 명", "t"], [`${APP_NAME} → :5432`, "m"], ["사서 A = 이 연결만 맡는 프로세스", "s"]], [R.gatePt[0], R.gatePt[1] - 6]);
        api.pop(tl, b, "+=.2");
        tl.to(R.libA, {x:R.aHome[0], y:R.aHome[1], duration:1.2, ease:"power1.inOut"}, "+=.3");
        tl.to(R.aLabel, {opacity:1, duration:.3});
      },
      /* 2. 문장 검사 */
      function(tl, api, R){
        tl.add(api.camTo(560, 360, 1.4, 1.1));
        api.clearBubbles(tl, "<");
        api.hideLinks(tl, ["conn"], "<");
        tl.to(R.libA, {x:R.atParser[0], y:R.atParser[1], duration:.7}, "<");
        tl.to(R.aLabel, {opacity:0, duration:.2}, "<");
        tl.set(R.slip, {x:R.cliA[0], y:R.cliA[1], opacity:0, scale:.4});
        tl.to(R.slip, {opacity:1, scale:1.1, duration:.35, ease:"back.out(2)"});
        api.fly(tl, R.slip, R.cliA, R.parserPt, {duration:1.4, lift:90});
        var b = say(api, 400, 140, 330, [["SQL 신청서 검사", "t"], [`SELECT balance FROM ${PAY.table}`, "m"], [`WHERE owner = '${GUEST.users[0]}';`, "m"], [`✓ 문법  ✓ ${PAY.table} 표  ✓ 열 이름`, "s"]], [R.parserPt[0], R.parserPt[1] - 14]);
        api.pop(tl, b, "+=.1");
        tl.to(R.slip.seal, {opacity:1, duration:.3}, "+=.3");
      },
      /* 3. 길 고르기 — 비용 비교 */
      function(tl, api, R){
        tl.add(api.camTo(760, 420, 1.15, 1.2));
        api.clearBubbles(tl, "<");
        tl.to(R.libA, {x:R.atPlanner[0], y:R.atPlanner[1], duration:.8}, "<");
        api.fly(tl, R.slip, R.parserPt, R.plannerPt, {duration:.9, lift:50}, "<");
        api.showLink(tl, "seq", R.plannerPt, R.shelfPt, "+=.2", "warn");
        api.showLink(tl, "idx", R.plannerPt, R.indexPt, "+=.3", "alt");
        var b = say(api, 520, 165, 330, [["길 고르기 — 싼 쪽으로", "t"], ["① 책장 전부 훑기   비용 2137", "m", {fill:"#dc2626"}], ["② 색인 서랍 보기   비용 8.31 ★", "m", {fill:"#16a34a", "font-weight":"700"}], ["통계로 어림한 비용이에요", "s"]], [R.plannerPt[0], R.plannerPt[1] - 10]);
        api.pop(tl, b, "+=.1");
        api.hideLinks(tl, ["seq"], "+=.8");
      },
      /* 4. 색인 서랍 — B-tree 따라 내려가기 */
      function(tl, api, R){
        tl.add(api.camTo(900, 560, 1.3, 1.3));
        api.clearBubbles(tl, "<");
        api.hideLinks(tl, ["idx"], "<");
        tl.to(R.slip, {opacity:0, duration:.3}, "<");
        tl.to(R.libA, {x:R.atIndex[0], y:R.atIndex[1], duration:1.3, ease:"power1.inOut"}, "<");
        var x = 800, y = 335, b = api.bubble(x, y, 320, 196, [920, y + 195, R.indexPt[0], R.indexPt[1] - 8, 944, y + 195]), g = b.inner;
        api.text(g, x + 16, y + 28, `색인 서랍 (B-tree) — ${GUEST.users[0]} 찾기`, "t");
        var root = el("rect", {x:x + 100, y:y + 44, width:120, height:28, rx:6, fill:"#f1f5f9", stroke:"#64748b"}, g);
        api.text(g, x + 160, y + 63, "jae | mia", "m", {"text-anchor":"middle"});
        var leaves = [["ari … jae", x + 14], ["jae … mia", x + 116], ["mia … soo", x + 218]].map(function(lf){
          var r = el("rect", {x:lf[1], y:y + 108, width:90, height:28, rx:6, fill:"#f1f5f9", stroke:"#64748b"}, g);
          api.text(g, lf[1] + 45, y + 127, lf[0], "m", {"text-anchor":"middle"});
          return r;
        });
        [x + 59, x + 161, x + 263].forEach(function(lx){ el("line", {x1:x + 160, y1:y + 72, x2:lx, y2:y + 108, stroke:"#cbd5e1", "stroke-width":1.5}, g); });
        var path = el("line", {x1:x + 160, y1:y + 72, x2:x + 263, y2:y + 108, stroke:"#16a34a", "stroke-width":3, opacity:0}, g);
        var hit = api.text(g, x + 16, y + 168, `${GUEST.users[0]} → (7,3)  = 7번 책 3번째 줄`, "m", {fill:"#16a34a", "font-weight":"700", opacity:0});
        api.text(g, x + 16, y + 186, "≥ mia 이므로 오른쪽으로 · 두 번 만에 도착", "s");
        api.pop(tl, b, "+=.1");
        tl.to(root, {attr:{fill:"#dcfce7", stroke:"#16a34a"}, duration:.3}, "+=.3");
        tl.to(path, {opacity:1, duration:.3}, "+=.3");
        tl.to(leaves[2], {attr:{fill:"#dcfce7", stroke:"#16a34a"}, duration:.3});
        tl.to(hit, {opacity:1, duration:.3});
      },
      /* 5. 열람 책상 — 없으면 서고에서 가져온다 */
      function(tl, api, R){
        tl.add(api.camTo(960, 470, 1.25, 1.2));
        api.clearBubbles(tl, "<");
        tl.to(R.libA, {x:R.atDeskA[0], y:R.atDeskA[1], duration:1, ease:"power1.inOut"}, "<");
        var b = say(api, 720, 290, 320, [["열람 책상 (메모리)", "t"], ["7번 책 있나? → 없음 (miss)", "m", {fill:"#dc2626"}], ["서고에서 한 권(8KB)째 가져와요", "s"]], [R.slots[2][0], R.slots[2][1] - 12]);
        api.pop(tl, b, "+=.1");
        api.fly(tl, R.book7, R.shelfPt, R.slots[2], {duration:1.4, lift:110}, "+=.4");
        tl.call(function(){ b.lines[2].textContent = "도착 — 이제 책상 위에서 읽어요"; }, null, "+=.1");
      },
      /* 6. 결과를 손님에게 */
      function(tl, api, R){
        tl.add(api.camTo(620, 400, 1.15, 1.3));
        api.clearBubbles(tl, "<");
        var from = [R.slots[2][0], R.slots[2][1] - 16];
        tl.set(R.res, {x:from[0], y:from[1], opacity:0, scale:.4}, ">");
        tl.to(R.res, {opacity:1, scale:1.1, duration:.3});
        api.fly(tl, R.res, from, R.cliA, {duration:1.6, lift:120});
        var b = say(api, 400, 140, 280, [["결과 1줄", "t"], [" balance", "m"], ["   50000", "m", {"font-weight":"700"}], ["다음엔 책상에서 바로 (hit)", "s"]], [R.cliA[0] + 8, R.cliA[1] - 4]);
        api.pop(tl, b, "+=.1");
      }
    ],

    /* ② 책 고치기 — 트랜잭션 · 일지 · 커밋 */
    update:[
      /* 1. BEGIN */
      function(tl, api, R){
        tl.set(R.book7, {x:R.slots[2][0], y:R.slots[2][1]});
        tl.set(R.libA, {x:R.atDeskA[0], y:R.atDeskA[1]});
        tl.set(R.aLabel, {opacity:0});
        tl.add(api.camTo(620, 420, 1.25, 1.2));
        tl.set(R.slip, {x:R.cliA[0], y:R.cliA[1], opacity:0, scale:.4});
        tl.to(R.slip, {opacity:1, scale:1.1, duration:.35, ease:"back.out(2)"});
        api.fly(tl, R.slip, R.cliA, [R.atDeskA[0], R.atDeskA[1] - 52], {duration:1.5, lift:100});
        tl.to(R.slip, {opacity:0, duration:.3});
        var b = say(api, 520, 220, 310, [["BEGIN — 묶음 시작", "t"], ["COMMIT까지는 전부 아니면 전무", "s"], ["번호(xid)는 처음 고칠 때 받아요", "s"]], [R.atDeskA[0], R.atDeskA[1] - 60]);
        api.pop(tl, b, "+=.1");
      },
      /* 2. 두 줄 고치기 — 새 버전 · 빨간 띠 */
      function(tl, api, R){
        tl.add(api.camTo(880, 440, 1.3, 1.2));
        api.clearBubbles(tl, "<");
        var b = say(api, 700, 200, 380, [["7번 책 — 지우지 않고 새 줄을 써요", "t"],
          [`(7,3)  ${GUEST.users[0]} 50000  xmax 812`, "m", {fill:"#64748b"}], [`(7,41) ${GUEST.users[0]} 40000  xmin 812 ← 새`, "m"],
          [`(7,5)  ${GUEST.users[1]} 20000  xmax 812`, "m", {fill:"#64748b"}], [`(7,42) ${GUEST.users[1]} 30000  xmin 812 ← 새`, "m"],
          ["빨간 띠 = 고쳤지만 서고엔 아직 (dirty)", "s"]], [R.slots[2][0], R.slots[2][1] - 14]);
        api.pop(tl, b, "+=.1");
        tl.fromTo(R.book7.dirty, {opacity:0}, {opacity:1, duration:.3, repeat:2, yoyo:true}, "+=.4");
        tl.set(R.book7.dirty, {opacity:1});
      },
      /* 3. 일지 쪽지 → 바구니(메모리) */
      function(tl, api, R){
        tl.add(api.camTo(840, 400, 1.35, 1.2));
        api.clearBubbles(tl, "<");
        var from = [R.slots[2][0], R.slots[2][1] - 14];
        [0, 1].forEach(function(i){
          var c = R.cards[i];
          tl.set(c, {x:from[0], y:from[1], opacity:1}, i ? "<+=.3" : ">");
          api.fly(tl, c, from, [R.basketPt[0] + (i ? 6 : -6), R.basketPt[1] - 8], {duration:1, lift:60}, "<");
        });
        var b = say(api, 900, 220, 310, [["일지 쪽지 2장 → 바구니", "t"], ["HOT_UPDATE blk 7 off 3→41", "m"], ["HOT_UPDATE blk 7 off 5→42", "m"], ["바구니는 아직 메모리예요", "s"]], [R.basketPt[0] + 14, R.basketPt[1] - 8]);
        api.pop(tl, b, "+=.1");
      },
      /* 4. COMMIT — 일지를 디스크에 확정 */
      function(tl, api, R){
        tl.add(api.camTo(800, 330, 1.3, 1.2));
        api.clearBubbles(tl, "<");
        var bp = [R.basketPt[0], R.basketPt[1] - 8];
        tl.set(R.cards[2], {x:bp[0], y:bp[1] - 10, opacity:0}, ">");
        tl.to(R.cards[2], {opacity:1, duration:.3});
        R.cards.forEach(function(c, i){
          api.fly(tl, c, [bp[0] + (i - 1) * 6, bp[1]], R.walPt, {duration:1, lift:50}, i ? "<+=.2" : ">");
        });
        tl.to(R.cards, {opacity:0, scale:.5, duration:.3});
        tl.fromTo(R.walGlow, {opacity:0}, {opacity:1, duration:.3, yoyo:true, repeat:1}, "<");
        var b = say(api, 950, 120, 340, [["COMMIT = 일지를 디스크에 확정", "t"], ["0/01A2A0F0  HOT_UPDATE  812", "m"], ["0/01A2A168  HOT_UPDATE  812", "m"], ["0/01A2A1E0  COMMIT      812", "m", {fill:"#16a34a", "font-weight":"700"}], ["이제 정전에도 살아남아요", "s"]], [R.walPt[0] + 20, R.walPt[1]]);
        api.pop(tl, b, "+=.1");
      },
      /* 5. 정리 담당이 나중에 서고에 베껴 둔다 */
      function(tl, api, R){
        tl.add(api.camTo(980, 470, 1.25, 1.2));
        api.clearBubbles(tl, "<");
        tl.to(R.ckLabel, {opacity:0, duration:.2}, "<");
        tl.to(R.ck, {x:R.ckAtDesk[0], y:R.ckAtDesk[1], duration:.9, ease:"power1.inOut"}, "<");
        var from = [R.slots[2][0], R.slots[2][1] - 14];
        tl.set(R.copy, {x:from[0], y:from[1], opacity:0, scale:.4});
        tl.to(R.copy, {opacity:1, scale:1, duration:.3});
        api.fly(tl, R.copy, from, R.shelfPt, {duration:1.3, lift:90});
        tl.to(R.copy, {opacity:0, scale:.4, duration:.3});
        tl.to(R.book7.dirty, {opacity:0, duration:.4}, "<");
        var ckh = [R.ckAtDesk[0] + 8, R.ckAtDesk[1] - 40];
        var b = say(api, 1010, 280, 330, [["정리 담당: 서고에 베껴 둬요", "t"], ["책은 책상에 그대로 · 빨간 띠만 떼요", "s"], ["checkpoint complete: wrote 1 buffers", "m"], ["일지는 이 지점(redo)부터만 있으면 돼요", "s"]], ckh);
        api.pop(tl, b, "+=.1");
      }
    ],

    /* ③ 두 사람이 동시에 — 잠금 · MVCC */
    race:[
      /* 1. 세션 A 가 고치는 중 → 잠금 */
      function(tl, api, R){
        tl.set(R.book7, {x:R.slots[2][0], y:R.slots[2][1]});
        tl.set(R.libA, {x:R.atDeskA[0], y:R.atDeskA[1]});
        tl.set([R.libB, R.cliB], {autoAlpha:1});
        tl.set(R.aLabel, {opacity:0});
        tl.add(api.camTo(820, 450, 1.2, 1.2));
        tl.fromTo(R.padlock, {autoAlpha:0, y:R.slots[2][1] - 90}, {autoAlpha:1, y:R.slots[2][1] - 30, duration:.6, ease:"bounce.out"}, "+=.2");
        var b = say(api, 920, 220, 330, [[`세션 A: ${GUEST.users[0]}에서 30000 빼는 중`, "t"], [`(7,43) ${GUEST.users[0]} 10000  xmin 901`, "m"], [`🔒 ${GUEST.users[0]} 줄 잠금 — COMMIT 전까지`, "s"]], [R.slots[2][0] + 10, R.slots[2][1] - 38]);
        api.pop(tl, b, "+=.1");
      },
      /* 2. 세션 B 가 읽기 — 기다리지 않고 옛 버전 */
      function(tl, api, R){
        tl.add(api.camTo(760, 470, 1.2, 1.2));
        api.clearBubbles(tl, "<");
        tl.to(R.libB, {x:R.atDeskB[0], y:R.atDeskB[1], duration:1.2, ease:"power1.inOut"}, "<");
        var b = say(api, 480, 210, 340, [["세션 B 읽기: 어느 버전이 보이나?", "t"], ["(7,41) 40000  xmin 812 커밋됨 ✓", "m", {fill:"#16a34a"}], ["(7,43) 10000  xmin 901 진행 중 ✗", "m", {fill:"#64748b"}], ["→ 40000 · 잠금을 기다리지 않음", "t"]], [R.slots[2][0] - 8, R.slots[2][1] - 12]);
        api.pop(tl, b, "+=.1");
      },
      /* 3. 세션 B 가 쓰기 — 잠금에 막혀 대기 */
      function(tl, api, R){
        tl.add(api.camTo(800, 470, 1.2, 1.2));
        api.clearBubbles(tl, "<");
        var bh = [R.atDeskB[0], R.atDeskB[1] - 52];
        api.showLink(tl, "wait", bh, [R.slots[2][0], R.slots[2][1] - 30], ">", "warn");
        tl.set(R.hourglass, {x:bh[0] + 18, y:bh[1] - 16});
        tl.to(R.hourglass, {opacity:1, duration:.3});
        tl.to(R.hourglass, {scale:1.3, duration:.4, yoyo:true, repeat:3}, "+=.1");
        var b = say(api, 950, 250, 320, [[`세션 B: ${GUEST.users[0]}에서 5000 빼기`, "t"], ["🔒 잠금에 막힘 → 901이 끝나길 대기", "s"], ["wait_event: Lock / transactionid", "m"]], [R.slots[2][0] + 10, R.slots[2][1] - 38]);
        api.pop(tl, b, "+=.1");
      },
      /* 4. 세션 A COMMIT → 잠금 풀림 */
      function(tl, api, R){
        tl.add(api.camTo(820, 460, 1.2, 1.2));
        api.clearBubbles(tl, "<");
        var b = say(api, 950, 240, 300, [["세션 A: COMMIT", "t"], ["일지 확정과 함께 잠금이 풀려요", "s"], ["COMMIT  901", "m", {fill:"#16a34a", "font-weight":"700"}]], [R.slots[2][0] + 10, R.slots[2][1] - 38]);
        api.pop(tl, b, ">");
        tl.to(R.shackle, {y:-7, duration:.4}, "+=.3");
        tl.to(R.padlock, {y:"-=12", duration:.4, ease:"back.out(2)"}, "<");
        api.hideLinks(tl, ["wait"], "<");
      },
      /* 5. 세션 B 가 최신 버전에서 다시 계산 */
      function(tl, api, R){
        tl.add(api.camTo(820, 480, 1.2, 1.2));
        api.clearBubbles(tl, "<");
        tl.to(R.hourglass, {opacity:0, duration:.3}, "<");
        tl.to(R.padlock, {autoAlpha:0, duration:.3}, "<");
        tl.to(R.libB, {y:"-=10", duration:.2, yoyo:true, repeat:1}, ">");
        var bh = [R.atDeskB[0] + 6, R.atDeskB[1] - 56];
        var b = say(api, 920, 290, 340, [["세션 B: 최신 버전에서 다시 계산", "t"], ["(7,43) 10000 → (7,44) 5000", "m"], ["xmin 902 · UPDATE 1 · COMMIT", "m", {fill:"#16a34a"}], ["REPEATABLE READ였다면 여기서 오류", "s"]], bh);
        api.pop(tl, b, "+=.1");
      }
    ],

    /* ④ 정전 후 복구 — 일지 다시 읽기 */
    crash:[
      /* 1. 정전 — 메모리가 사라진다 */
      function(tl, api, R){
        tl.set(R.book7, {x:R.slots[2][0], y:R.slots[2][1]});
        tl.set(R.book7.dirty, {opacity:1});
        tl.add(api.camTo(850, 430, 1.15, 1.2));
        tl.to(R.blackout, {opacity:.85, duration:.15}, "+=.3");
        tl.to(R.blackout, {opacity:.2, duration:.15, yoyo:true, repeat:2});
        tl.to([R.book7].concat(R.others), {opacity:0, duration:.2}, "<");
        tl.to(R.libA, {autoAlpha:0, duration:.2}, "<");
        tl.to(R.aLabel, {opacity:0, duration:.2}, "<");
        tl.to(R.blackout, {opacity:0, duration:.6}, "+=.2");
        var b = say(api, 980, 170, 320, [["⚡ 정전!", "t", {fill:"#dc2626"}], ["책상 · 바구니 (메모리) → 사라짐", "s"], ["서고 · 일지 (디스크) → 그대로", "s"]], [R.deskPt[0] + 30, R.deskPt[1] - 10]);
        api.pop(tl, b, "+=.1");
      },
      /* 2. 복구 담당이 일지를 읽는다 */
      function(tl, api, R){
        tl.add(api.camTo(900, 310, 1.3, 1.2));
        api.clearBubbles(tl, "<");
        tl.fromTo(R.startupBang, {opacity:0, y:6}, {opacity:1, y:0, duration:.35, ease:"back.out(3)"}, ">");
        api.showLink(tl, "read", R.startupPt, R.walPt, "+=.2");
        var b = say(api, 990, 80, 390, [["복구 담당: 일지를 어디서부터?", "t"], ["REDO location   0/1A2B3C8", "m", {"font-weight":"700"}],
          ["0/01A2B470 HOT_UPDATE 41→43  901", "m"], ["0/01A2B4E8 COMMIT  901", "m", {fill:"#16a34a"}],
          ["0/01A2B520 HOT_UPDATE 43→44  902", "m"], ["0/01A2B598 COMMIT  902", "m", {fill:"#16a34a"}],
          ["0/01A2B5D0 HOT_UPDATE 42→45  903", "m"], ["903은 COMMIT 기록이 없어요", "s", {fill:"#dc2626"}]], [R.startupPt[0] + 10, R.startupPt[1] + 4]);
        api.pop(tl, b, "+=.1");
      },
      /* 3. 다시 쓰기 (redo) */
      function(tl, api, R){
        tl.add(api.camTo(960, 440, 1.2, 1.2));
        api.clearBubbles(tl, "<");
        api.hideLinks(tl, ["read"], "<");
        tl.to(R.startupBang, {opacity:0, duration:.3}, "<");
        tl.set(R.book7.dirty, {opacity:0});
        tl.set(R.book7, {x:R.shelfPt[0], y:R.shelfPt[1], opacity:1});
        api.showLink(tl, "redo", R.startupPt, R.deskPt, ">", "alt");
        api.fly(tl, R.book7, R.shelfPt, R.slots[2], {duration:1.4, lift:110}, "<");
        var b = say(api, 1000, 250, 340, [["다시 쓰기 (redo)", "t"], ["서고의 7번 책(정리 때 버전)을 올리고", "s"], ["일지의 변경을 순서대로 다시 적용", "s"], ["redo done at 0/1A2B5D0", "m"]], [R.startupPt[0] - 10, R.startupPt[1] + 10]);
        api.pop(tl, b, "+=.1");
        tl.to(R.book7.dirty, {opacity:1, duration:.3}, "+=.3");
      },
      /* 4. 커밋 없는 903 은 숨긴다 */
      function(tl, api, R){
        tl.add(api.camTo(880, 440, 1.25, 1.2));
        api.clearBubbles(tl, "<");
        api.hideLinks(tl, ["redo"], "<");
        var b = say(api, 700, 190, 400, [["7번 책 — 누가 보이나?", "t"], [`(7,44) ${GUEST.users[0]}    5000  902 커밋 ✓`, "m", {fill:"#16a34a"}], [`(7,42) ${GUEST.users[1]}   30000  812 커밋 ✓`, "m", {fill:"#16a34a"}],
          [`(7,45) ${GUEST.users[1]} 1030000  903 커밋 없음 ✗`, "m"], ["지우지 않고 '중단된 번호'로 보고 숨겨요", "s"]], [R.slots[2][0], R.slots[2][1] - 14]);
        api.pop(tl, b, "+=.1");
        tl.to(b.lines[3], {attr:{fill:"#dc2626"}, duration:.25, repeat:3, yoyo:true}, "+=.3");
        tl.set(b.lines[3], {attr:{fill:"#dc2626", "text-decoration":"line-through"}});
      },
      /* 5. 다시 문을 연다 */
      function(tl, api, R){
        tl.add(api.camTo(540, 380, 1.3, 1.2));
        api.clearBubbles(tl, "<");
        api.showLink(tl, "open", R.gatePt, R.cliA, ">", "alt");
        var b = say(api, 470, 180, 400, [["정문 다시 열림", "t"], ["…is ready to accept connections", "m", {fill:"#16a34a"}], [`커밋된 것만 남음: ${GUEST.users[0]} 5000 · ${GUEST.users[1]} 30000`, "s"]], [R.gatePt[0], R.gatePt[1] - 8]);
        api.pop(tl, b, "+=.1");
      }
    ]
  }
};
})();
