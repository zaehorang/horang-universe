/* 층층 우체국 빌딩 — 지도 그리기 · 배경 움직임 · 기준 상태 · 사건별 장면 움직임
   왼쪽 내 노트북 빌딩(7층) → 케이블 도로 → 동네 분류소(스위치) → 교차로 우체국(라우터) → 오른쪽 my-shop 서버 빌딩(7층)
   층마다 봉투 하나를 씌우거나 벗긴다. 같은 높이의 층끼리 짝(peer)이다. */
(function(){
"use strict";
var ISO = window.ISO;
var SHOP_NAME = window.SHARED.shops["shop-web"].shortName;
var iso = ISO.iso, isoL = ISO.isoL, el = ISO.el, box = ISO.box, flat = ISO.flat, faceR = ISO.faceR, faceL = ISO.faceL, C = ISO.C, act = ISO.act;

var FH = 40;   /* 층 높이 */
var BW = 80;   /* 빌딩 너비 */
var FLOOR_ACT = [null, "phy", "eth", "ip", "tcp", "upper56", "upper56", "app"];
var FLOOR_NAME = [null, "1층 물리", "2층 데이터 링크", "3층 네트워크", "4층 전송", "5층 세션", "6층 표현", "7층 응용"];
var FLOOR_C = [null,
  ["#e2e8f0","#94a3b8","#7c8a9c"],
  ["#bbf7d0","#4ade80","#22c55e"],
  ["#e9d5ff","#c084fc","#a855f7"],
  ["#fed7aa","#fb923c","#ea7c26"],
  ["#fef3c7","#fcd9a8","#f2c48d"],
  ["#fef3c7","#fcd9a8","#f2c48d"],
  ["#ffedd5","#fdcfa1","#f4b97f"]];

function zOf(i){ return (i - .5) * FH; }
/* 봉투가 머무는 자리 — 왼쪽 빌딩 오른쪽 벽 앞 · 오른쪽 빌딩 왼쪽 벽 앞 */
function LP(i){ return iso(235, 565, zOf(i)); }
function RP(i){ return iso(565, 235, zOf(i)); }

/* 7층 빌딩 */
function building(parent, gx, gy, side){
  for(var i = 1; i <= 7; i++){
    var a = act(parent, FLOOR_ACT[i], FLOOR_NAME[i]);
    var z = (i - 1) * FH;
    box(a, iso, gx, gy, z, BW, BW, FH - 2, FLOOR_C[i]);
    box(a, iso, gx - 2, gy - 2, z + FH - 2, BW + 4, BW + 4, 2, ["#64748b","#475569","#3f4a59"]);
    faceL(a, gx + 14, gy + BW, z + 11, 20, 16, "#8cc0ee");
    faceL(a, gx + 46, gy + BW, z + 11, 20, 16, "#8cc0ee");
    faceR(a, gx + BW, gy + 14, z + 11, 20, 16, "#8cc0ee");
    faceR(a, gx + BW, gy + 46, z + 11, 20, 16, "#8cc0ee");
    var np = side === "L" ? iso(gx + BW, gy + BW - 4, z + 15) : iso(gx + 4, gy + BW, z + 15);
    ISO.text(a, np[0] + (side === "L" ? 7 : -7), np[1], String(i), "floorNo");
  }
  box(parent, iso, gx - 4, gy - 4, 7 * FH, BW + 8, BW + 8, 6, ["#475569","#334155","#2b3644"]);
}

/* 겹겹이 봉투 — 가운데 편지(HTTP) · TCP · IP · Ethernet */
function packet(parent){
  var g = el("g", {"class":"pk", opacity:0}, parent);
  function env(x, y, w, h, fill, stroke, label){
    var e = el("g", {opacity:0}, g);
    el("rect", {x:x, y:y, width:w, height:h, rx:6, fill:fill, stroke:stroke, "stroke-width":2}, e);
    e.tag = ISO.text(e, x + 6, y + 10, label, "ptab", {fill:stroke});
    return e;
  }
  g.eth = env(-56, -57, 112, 84, "#bbf7d0", "#15803d", "ETH →…53:01");
  g.ip  = env(-45, -43, 90, 66, "#e9d5ff", "#7e22ce", "IP →10.0.2.10");
  g.tcp = env(-34, -29, 68, 48, "#fed7aa", "#c2410c", "TCP →:80");
  var l = el("g", {}, g);
  el("rect", {x:-23, y:-15, width:46, height:30, rx:3, fill:"#fff", stroke:"#334155", "stroke-width":1.6}, l);
  ISO.text(l, 0, -2, "GET /", "pletter");
  el("line", {x1:-15, y1:7, x2:15, y2:7, stroke:"#94a3b8", "stroke-width":1.6}, l);
  g.letter = l;
  var sl = el("g", {opacity:0}, g);
  el("rect", {x:-25, y:-17, width:50, height:34, rx:4, fill:"#f3c969", stroke:"#a16207", "stroke-width":2}, sl);
  ISO.text(sl, 0, 0, "🔒 TLS", "pletter");
  g.seal = sl;
  return g;
}

/* 전기 신호 줄 */
function bits(parent){
  var g = el("g", {opacity:0}, parent);
  el("rect", {x:-50, y:-11, width:100, height:22, rx:11, fill:"#0f172a"}, g);
  ISO.text(g, 0, 1, "1011 0010 0110…", "bitsT");
  return g;
}

/* 짧은 메시지 카드 — SYN · ARP · ClientHello 같은 제어 메시지 */
function card(parent){
  var g = el("g", {opacity:0}, parent);
  g.r = el("rect", {x:-50, y:-15, width:100, height:30, rx:8, fill:"#fff", "stroke-width":2.4}, g);
  g.t = ISO.text(g, 0, 1, "", "cardT");
  return g;
}
function setCard(c, text, color){
  var w = tagW(text);
  c.r.setAttribute("x", -w/2); c.r.setAttribute("width", w); c.r.setAttribute("stroke", color);
  c.t.textContent = text; c.t.setAttribute("style", "fill:" + color);
}
/* 4층 연결 상태 표 */
function stateTag(parent, x, y){
  var g = el("g", {"class":"stTag", opacity:0, transform:"translate(" + x + "," + y + ")"}, parent);
  g.r = el("rect", {x:-66, y:-14, width:132, height:28, rx:14}, g);
  g.t = ISO.text(g, 0, 1, "", "");
  return g;
}
function setState(tg, text, color){ tg.t.textContent = text; tg.r.setAttribute("style", "fill:" + color); }
/* 자물쇠 */
function lockIcon(parent, x, y){
  var g = el("g", {opacity:0, transform:"translate(" + x + "," + y + ")"}, parent);
  el("path", {d:"M-7,-4 v-6 a7,7 0 0 1 14,0 v6", fill:"none", stroke:"#1d2b3a", "stroke-width":3}, g);
  el("rect", {x:-11, y:-5, width:22, height:18, rx:3, fill:"#f3c969", stroke:"#a16207", "stroke-width":1.6}, g);
  el("circle", {cx:0, cy:3, r:2.6, fill:"#1d2b3a"}, g);
  return g;
}

/* ── 층 안의 방 (빌딩 안 둘러보기) ──────────────
   방은 왼쪽 빌딩 오른쪽 하늘에 펼쳐진다. 좌표는 방 모서리(RO) 기준 isoL.
   벽 A = 뒤 오른쪽(gy=0), 벽 B = 뒤 왼쪽(gx=0). */
var RW = 280, RD = 200, RH = 110, RO = [720, 170];
function P(x, y, z){ return isoL(x, y, z); }
function poly(parent, a, attrs){ attrs.points = ISO.pts(a); return el("polygon", attrs, parent); }
function tagW(s){ var w = 0; for(var i = 0; i < s.length; i++) w += /[ㄱ-힝]/.test(s.charAt(i)) ? 13.6 : 7.8; return w + 20; }
function roomTag(parent, anchor, off, text){
  var g = el("g", {"class":"rtag", opacity:0}, parent);
  var x = anchor[0] + off[0], y = anchor[1] + off[1], w = tagW(text);
  el("line", {x1:anchor[0], y1:anchor[1], x2:x, y2:y, stroke:"#1d2b3a", "stroke-width":1.4, opacity:.55}, g);
  el("circle", {cx:anchor[0], cy:anchor[1], r:3, fill:"#1d2b3a"}, g);
  el("rect", {x:x - w/2, y:y - 13, width:w, height:26, rx:13}, g);
  ISO.text(g, x, y + 1, text, "");
  return g;
}
function textLines(parent, c, lines){
  lines.forEach(function(s, i){ ISO.text(parent, c[0], c[1] + (i - (lines.length - 1) / 2) * 16, s, "rtxt"); });
}
function room(parent, key, name, floorPt, color, spec){
  var outer = el("g", {transform:"translate(" + RO[0] + "," + RO[1] + ")", opacity:0, visibility:"hidden"}, parent);
  var fp = [floorPt[0] - RO[0], floorPt[1] - RO[1]];
  [P(0, RD, RH), P(RW, RD, 0)].forEach(function(c){
    el("line", {"class":"rguide", x1:fp[0], y1:fp[1], x2:c[0], y2:c[1]}, outer);
  });
  var inner = act(outer, key, name);
  poly(inner, [P(0,0,0), P(RW,0,0), P(RW,RD,0), P(0,RD,0)], {fill:color, stroke:"#1d2b3a", "stroke-opacity":.15});
  poly(inner, [P(0,0,0), P(RW,0,0), P(RW,0,RH), P(0,0,RH)], {fill:"#eef2f6"});
  poly(inner, [P(0,0,0), P(0,RD,0), P(0,RD,RH), P(0,0,RH)], {fill:"#dfe6ee"});
  var tags = [];
  spec.items.forEach(function(it){
    var a, c = null;
    if(it.t === "box"){
      box(inner, isoL, it.x, it.y, 0, it.w, it.d, it.h, it.c);
      a = P(it.x + it.w/2, it.y + it.d/2, it.h);
      if(it.top) ISO.text(inner, a[0], a[1], it.top, "rtxt");
      if(!it.mast) a = P(it.x + it.w, it.y + it.d/2, it.h/2);
      if(it.mast){ var m = P(it.x + it.w/2, it.y + it.d/2, it.h + it.mast);
        el("line", {x1:a[0], y1:a[1], x2:m[0], y2:m[1], stroke:"#334155", "stroke-width":3}, inner);
        el("circle", {cx:m[0], cy:m[1], r:4, fill:"#f43f5e"}, inner); a = m; }
    } else if(it.t === "wa"){
      poly(inner, [P(it.x,1,it.z), P(it.x+it.w,1,it.z), P(it.x+it.w,1,it.z+it.h), P(it.x,1,it.z+it.h)], {fill:it.fill, stroke:"#1d2b3a", "stroke-opacity":.25});
      c = P(it.x + it.w/2, 1, it.z + it.h/2); a = P(it.x + it.w/2, 1, it.z + it.h);
    } else {
      poly(inner, [P(1,it.y,it.z), P(1,it.y+it.d,it.z), P(1,it.y+it.d,it.z+it.h), P(1,it.y,it.z+it.h)], {fill:it.fill, stroke:"#1d2b3a", "stroke-opacity":.25});
      c = P(1, it.y + it.d/2, it.z + it.h/2); a = P(1, it.y + it.d/2, it.z + it.h);
      if(it.wave){
        var pts = [];
        for(var k = 0; k <= 24; k++){ var yy = it.y + 8 + k * (it.d - 16) / 24; pts.push(P(1, yy, it.z + it.h/2 + (k % 4 < 2 ? 12 : -12))); }
        el("polyline", {points:ISO.pts(pts), fill:"none", stroke:"#0ea5e9", "stroke-width":2.4}, inner);
      }
    }
    if(it.lines) textLines(inner, c || a, it.lines);
    if(it.tag) tags.push(roomTag(inner, a, it.t === "box" ? it.off : [it.off[0], it.off[1] + it.h/2], it.tag));
  });
  var hp = P(0, 0, RH);
  var hw = tagW(spec.title) + 10;
  var head = el("g", {"class":"rhead"}, inner);
  el("rect", {x:hp[0] - hw/2, y:hp[1] - 44, width:hw, height:30, rx:15}, head);
  ISO.text(head, hp[0], hp[1] - 28, spec.title, "");
  if(spec.big) ISO.text(inner, spec.big[0][0], spec.big[0][1], spec.big[1], "rbig");
  return {outer:outer, inner:inner, fp:fp, tags:tags};
}

var WOOD = ["#d6a873","#b3824f","#9c6f41"];
var ROOMS = [
  {key:"app", name:"7층 응용 안", floor:7, hl:[7], title:"🔍 7층 응용 — 안", items:[
    {t:"wa", x:30, z:35, w:170, h:60, fill:"#fff", lines:["HTTP 80 · HTTPS 443","DNS 53 · SSH 22"], tag:"규칙마다 기본 포트", off:[10,-72]},
    {t:"wb", y:30, z:15, d:140, h:85, fill:"#fff", lines:["2xx 성공","3xx 이동","4xx 요청 오류","5xx 서버 오류"], tag:"응답 상태 코드", off:[-60,-88]},
    {t:"box", x:130, y:80, w:70, d:50, h:28, c:WOOD, top:"GET /", tag:"요청 = 메서드 · 경로 · 헤더", off:[120,18]},
    {t:"box", x:215, y:150, w:28, d:28, h:18, c:C.coral, tag:"DNS: 이름 → IP 주소", off:[110,28]}]},
  {key:"upper56", name:"6·5층 안", floor:5.5, hl:[6,5], title:"🔍 6층 표현 · 5층 세션 — 안", big:[[-10,165], "OSI에만 있는 층"], items:[
    {t:"box", x:110, y:70, w:60, d:50, h:46, c:C.gold, top:"TLS", tag:"TLS 봉인기 — https 일 때만", off:[130,-8]},
    {t:"wa", x:160, z:40, w:110, h:50, fill:"#fff", lines:["gzip","UTF-8"], tag:"압축·인코딩은 HTTP 헤더로", off:[40,-80]},
    {t:"wb", y:50, z:40, d:110, h:50, fill:"#fff", lines:["쿠키"], tag:"대화 유지는 쿠키·연결 재사용", off:[-50,-78]}]},
  {key:"tcp", name:"4층 전송 안", floor:4, hl:[4], title:"🔍 4층 전송 — 안", items:[
    {t:"wa", x:30, z:30, w:140, h:65, fill:"#fff7ed", lines:["22   80   443","51514   …"], tag:"포트 = 프로그램별 우편함", off:[10,-72]},
    {t:"wb", y:50, z:25, d:100, h:60, fill:"#e0f2fe", lines:["UDP"], tag:"UDP: 빠르지만 보장 없음", off:[-60,-76]},
    {t:"box", x:110, y:50, w:60, d:40, h:26, c:WOOD, top:"seq 1:79", tag:"seq · ack 순서 번호", off:[120,-10]},
    {t:"box", x:215, y:135, w:45, d:40, h:50, c:C.gray, tag:"ack 안 오면 재전송", off:[100,30]},
    {t:"box", x:40, y:140, w:34, d:34, h:40, c:C.teal, tag:"창 크기: 한 번에 보낼 양", off:[60,86]}]},
  {key:"ip", name:"3층 네트워크 안", floor:3, hl:[3], title:"🔍 3층 네트워크 — 안", items:[
    {t:"wa", x:20, z:25, w:170, h:75, fill:"#f5f3ff", lines:["10.0.1.0/24","10.0.2.0/24"], tag:"IP 주소 + /24 = 동네 범위", off:[10,-76]},
    {t:"wb", y:30, z:30, d:140, h:65, fill:"#fff", lines:["default via","10.0.1.1"], tag:"라우팅 표 · 기본 게이트웨이", off:[-60,-82]},
    {t:"box", x:150, y:100, w:44, d:44, h:30, c:C.purple, top:"TTL 64", tag:"TTL: 라우터마다 −1", off:[120,8]},
    {t:"box", x:60, y:150, w:30, d:30, h:44, c:C.navy, tag:"ICMP: ping · traceroute", off:[-90,72]}]},
  {key:"eth", name:"2층 데이터 링크 안", floor:2, hl:[2], title:"🔍 2층 데이터 링크 — 안", items:[
    {t:"wa", x:25, z:30, w:175, h:70, fill:"#f0fdf4", lines:["10.0.1.1 → …53:01","10.0.1.23 → …53:23"], tag:"ARP 표: IP → MAC", off:[10,-74]},
    {t:"wb", y:60, z:30, d:100, h:60, fill:"#fff", lines:["VLAN 10","VLAN 20"], tag:"VLAN: 한 스위치를 여러 동네로", off:[-60,-78]},
    {t:"box", x:90, y:140, w:36, d:36, h:30, c:C.coral, tag:"ARP 요청 = 동네 전체 방송", off:[-90,66]},
    {t:"box", x:190, y:100, w:44, d:30, h:18, c:C.white, top:"MAC", tag:"MAC: 랜카드에 새긴 주소", off:[120,10]}]},
  {key:"phy", name:"1층 물리 안", floor:1, hl:[1], title:"🔍 1층 물리 — 안", items:[
    {t:"box", x:50, y:60, w:40, d:40, h:30, c:C.gray},
    {t:"box", x:50, y:120, w:40, d:40, h:30, c:C.coral, tag:"UTP 케이블 · 광케이블", off:[-90,70]},
    {t:"box", x:210, y:70, w:30, d:30, h:20, c:C.conc, mast:50, tag:"Wi-Fi = 전파로 하는 1층", off:[100,64]},
    {t:"wa", x:140, z:45, w:120, h:50, fill:"#fff", lines:["1000Mb/s","Full duplex"], tag:"속도 · 송수신 방식", off:[40,-82]},
    {t:"wb", y:30, z:40, d:140, h:50, fill:"#fff", wave:true, tag:"0·1 → 전압 변화", off:[-60,-72]}]}
];

/* 앞 방에서 나와 → 이 층 앞으로 다가가 → 방이 펼쳐진다 */
function tourBeat(n){
  return function(tl, api, R){
    var r = R.rooms[n], prev = n ? R.rooms[n - 1] : null, fp = r.floorPt;
    if(prev){
      tl.to(prev.inner, {scale:.05, svgOrigin:prev.fp[0] + " " + prev.fp[1], duration:.5, ease:"power2.in"});
      tl.to(prev.outer, {autoAlpha:0, duration:.25}, "-=.2");
      prev.spec.hl.forEach(function(f){ tl.to(R.hl[f], {opacity:0, duration:.3}, "<"); });
    }
    tl.add(api.camTo(fp[0], fp[1], 2.1, .8));
    r.spec.hl.forEach(function(f){ tl.to(R.hl[f], {opacity:.55, duration:.3}, "<+.3"); });
    tl.addLabel("open", "+=.1");
    tl.add(api.camTo(700, 250, 1.35, 1.1), "open");
    tl.set(r.outer, {autoAlpha:1}, "open");
    tl.fromTo(r.inner, {scale:.05, svgOrigin:r.fp[0] + " " + r.fp[1]}, {scale:1, duration:1, ease:"power2.out"}, "open");
    tl.to(r.tags, {opacity:1, duration:.3, stagger:.25}, "open+=.9");
  };
}

window.WORLD = {
  home:{x:705, y:445, s:1.05},

  /* ── 지도 그리기 (한 번) ───────────────────── */
  build:function(api){
    var L = api.L, R = {};

    /* 땅 · 두 동네 · 케이블 도로 */
    box(L.ground, iso, 0, 0, -30, 700, 700, 30, C.grass);
    flat(L.ground, 20, 285, 0.3, 435, 405, {fill:"#d9efc7"});
    flat(L.ground, 455, 20, 0.3, 235, 265, {fill:"#cfe3f3"});
    var road = act(L.ground, "phy", "케이블 도로");
    var rp = [[161,561],[561,161],[579,179],[179,579]].map(function(q){ return iso(q[0], q[1], 0.6); });
    el("polygon", {points:ISO.pts(rp), fill:"#8b97a6"}, road);
    var c1 = iso(170, 570, 0.8), c2 = iso(570, 170, 0.8);
    el("line", {x1:c1[0], y1:c1[1], x2:c2[0], y2:c2[1], stroke:"#fff", "stroke-width":2, "stroke-dasharray":"12 10"}, road);

    /* 빌딩 두 채 */
    building(L.mid, 90, 530, "L");
    building(L.mid, 530, 90, "R");

    /* 옥상 사람 — curl · nginx */
    var cl = act(L.mid, "client", "요청 프로그램");
    var cp = iso(130, 570, 7 * FH + 6);
    ISO.person(cl, cp[0], cp[1], {body:"#6366f1", clip:true});
    R.clientPt = [cp[0], cp[1] - 40];
    var sv = act(L.mid, "server", SHOP_NAME + " 서버 프로그램");
    var sp = iso(570, 130, 7 * FH + 6);
    ISO.person(sv, sp[0], sp[1], {body:"#16a34a", chef:true});
    R.serverPt = [sp[0], sp[1] - 40];

    /* 동네 분류소 (스위치) */
    var sw = act(L.front, "sw", "동네 분류소");
    box(sw, iso, 273, 423, 0, 44, 44, 34, C.navy);
    R.swLeds = [];
    for(var k = 0; k < 5; k++){
      var lp = iso(317, 429 + k * 7, 14);
      R.swLeds.push(el("circle", {"class":"led", cx:lp[0], cy:lp[1], r:2.2, fill:"#4ade80"}, sw));
    }
    R.swPt = iso(295, 445, 46);
    R.swLamp = el("circle", {cx:R.swPt[0], cy:R.swPt[1] - 4, r:30, fill:"url(#glow)", opacity:0}, sw);

    /* 교차로 우체국 (라우터) */
    var rt = act(L.front, "router", "교차로 우체국");
    box(rt, iso, 427, 257, 0, 56, 56, 58, C.white);
    box(rt, iso, 423, 253, 58, 64, 64, 8, C.roofR);
    faceL(rt, 440, 313, 0, 22, 30, "#7c4a35");
    faceR(rt, 483, 270, 24, 26, 18, "#8cc0ee");
    [[440,270],[470,270]].forEach(function(q){
      var a1 = iso(q[0], q[1], 66), a2 = iso(q[0], q[1], 98);
      el("line", {x1:a1[0], y1:a1[1], x2:a2[0], y2:a2[1], stroke:"#475569", "stroke-width":3}, rt);
      el("circle", {"class":"led", cx:a2[0], cy:a2[1], r:3.4, fill:"#f43f5e"}, rt);
    });
    R.rtPt = iso(455, 285, 70);
    R.rtLamp = el("circle", {cx:R.rtPt[0], cy:R.rtPt[1] - 10, r:44, fill:"url(#glow)", opacity:0}, rt);

    /* 옆자리 PC — 같은 동네의 다른 컴퓨터 (방송을 받는 쪽) */
    var nc1 = iso(317, 467, 1), nc2 = iso(400, 470, 1);
    el("line", {x1:nc1[0], y1:nc1[1], x2:nc2[0], y2:nc2[1], stroke:"#64748b", "stroke-width":3, "stroke-linecap":"round"}, L.ground);
    var nb = el("g", {}, L.front);
    box(nb, iso, 400, 450, 0, 34, 34, 22, C.gray);
    box(nb, iso, 408, 458, 22, 18, 6, 18, C.navy);
    R.nbPt = iso(417, 467, 40);
    R.nbBang = ISO.bang(nb, R.nbPt[0] + 16, R.nbPt[1] - 14);

    /* 구름 */
    var clouds = el("g", {opacity:.85}, L.base);
    [[300,70],[1180,60],[860,150]].forEach(function(c){
      var g = el("g", {"class":"cloud", transform:"translate(" + c[0] + "," + c[1] + ")"}, clouds);
      el("ellipse", {cx:0, cy:0, rx:46, ry:15, fill:"#fff"}, g);
      el("ellipse", {cx:-24, cy:6, rx:30, ry:11, fill:"#fff"}, g);
      el("ellipse", {cx:26, cy:5, rx:32, ry:11, fill:"#fff"}, g);
    });

    /* TCP/IP 4계층 묶음 괄호 (오른쪽 빌딩 오른쪽) */
    var bx = 1278, base = iso(610, 90, 0)[1];
    function bracket(lo, hi){
      var y1 = base - lo * FH + 3, y2 = base - (hi - 1) * FH - 3;
      el("path", {"class":"brk", d:"M" + bx + "," + y1 + " h8 V" + y2 + " h-8"}, L.ground);
      return (y1 + y2) / 2;
    }

    /* 라벨 */
    var p, i;
    api.label(262, base - 7 * FH - 30, "OSI 7계층", "OSI model", true);
    for(i = 7; i >= 1; i--){
      p = iso(90, 610, zOf(i));
      api.label(p[0] - 92, p[1], FLOOR_NAME[i].replace("층", ""), ["", "L1 Physical", "L2 Data Link", "L3 Network", "L4 Transport", "L5 Session", "L6 Presentation", "L7 Application"][i]);
    }
    api.label(1366, base - 7 * FH - 30, "TCP/IP 4계층", "TCP/IP model", true);
    api.label(1366, bracket(7, 5), "응용 계층", "Application");
    api.label(1366, bracket(4, 4), "전송 계층", "Transport");
    api.label(1366, bracket(3, 3), "인터넷 계층", "Internet");
    api.label(1366, bracket(2, 1), "네트워크 접근", "Link");
    api.label(cp[0] + 96, cp[1] - 34, "요청 프로그램", "curl");
    api.label(sp[0] - 100, sp[1] - 34, SHOP_NAME + " 서버", "nginx");
    p = iso(170, 610, 0); api.label(p[0] - 30, p[1] + 26, "내 노트북", "client host");
    p = iso(610, 170, 0); api.label(p[0] + 30, p[1] + 26, "서버 컴퓨터", "server host");
    p = iso(295, 445, 0); api.label(p[0] - 6, p[1] + 52, "동네 분류소", "Switch");
    p = iso(455, 285, 0); api.label(p[0] + 4, p[1] + 52, "교차로 우체국", "Router");
    p = iso(417, 467, 0); api.label(p[0] + 8, p[1] + 34, "옆자리 PC", "10.0.1.31");
    p = iso(120, 420, 0); api.label(p[0], p[1], "1번 동네", "10.0.1.0/24", true);
    p = iso(650, 250, 0); api.label(p[0], p[1] + 12, "2번 동네", "10.0.2.0/24", true);

    /* 움직이는 물체 */
    R.pk = packet(L.fx);
    R.bits = bits(L.fx);

    /* 빌딩 안 둘러보기 — 층 강조 · 방 */
    R.hl = {};
    var hlg = el("g", {"class":"hl"}, L.mid);
    for(i = 1; i <= 7; i++){
      var hz = (i - 1) * FH;
      R.hl[i] = el("g", {opacity:0}, hlg);
      faceR(R.hl[i], 170, 530, hz, BW, FH - 2, "#fde047");
      faceL(R.hl[i], 90, 610, hz, BW, FH - 2, "#fde047");
    }
    R.rooms = ROOMS.map(function(s){
      var fpt = iso(170, 570, zOf(s.floor));
      var r = room(L.fx, s.key, s.name, fpt, FLOOR_C[Math.ceil(s.floor)][0], s);
      r.spec = s; r.floorPt = fpt;
      return r;
    });

    /* 연결 맺기 · ARP · HTTPS — 메시지 카드 · 4층 상태 · 자물쇠 */
    R.cards = [card(L.fx), card(L.fx), card(L.fx)];
    var l4 = LP(4), r4 = RP(4);
    R.stL = stateTag(L.fx, l4[0] + 118, l4[1] - 52);
    R.stR = stateTag(L.fx, r4[0] - 118, r4[1] - 52);
    var l56 = LP(5.5), r56 = RP(5.5);
    R.locks = [lockIcon(L.fx, l56[0] - 64, l56[1] + 20), lockIcon(L.fx, r56[0] + 64, r56[1] + 20)];
    return R;
  },

  /* ── 배경 움직임 ── */
  ambient:function(api, R){
    var w = document.getElementById("world");
    gsap.to(w.querySelectorAll(".led"), {opacity:.25, duration:.45, yoyo:true, repeat:-1, ease:"power1.inOut", stagger:{each:.17, from:"random"}});
    gsap.to(w.querySelectorAll(".cloud"), {x:"+=60", duration:20, yoyo:true, repeat:-1, ease:"sine.inOut", stagger:4});
    gsap.to(w.querySelectorAll(".bob"), {y:-1.6, duration:.9, yoyo:true, repeat:-1, ease:"sine.inOut", stagger:{each:.3, from:"random"}});
  },

  /* ── 기준 상태 ── */
  reset:function(api, R){
    var pk = R.pk;
    gsap.killTweensOf([pk, pk.eth, pk.ip, pk.tcp, pk.letter, R.bits, R.swLamp, R.rtLamp]);
    var s = LP(7);
    gsap.set(pk, {x:s[0], y:s[1], opacity:0, scale:1});
    gsap.set([pk.eth, pk.ip, pk.tcp], {opacity:0, scale:1, y:0});
    gsap.set(pk.letter, {opacity:1, scale:1});
    pk.eth.tag.textContent = "ETH →…53:01";
    gsap.set(R.bits, {opacity:0, x:0, y:0});
    gsap.set([R.swLamp, R.rtLamp], {opacity:0});
    R.rooms.forEach(function(r){
      gsap.killTweensOf([r.outer, r.inner].concat(r.tags));
      gsap.set(r.outer, {autoAlpha:0});
      gsap.set(r.inner, {scale:1});
      gsap.set(r.tags, {opacity:0});
    });
    for(var i = 1; i <= 7; i++){ gsap.killTweensOf(R.hl[i]); gsap.set(R.hl[i], {opacity:0}); }
    gsap.killTweensOf(R.cards.concat([R.stL, R.stR, R.nbBang, pk.seal]).concat(R.locks));
    R.cards.forEach(function(c){ gsap.set(c, {opacity:0, x:0, y:0, scale:1}); setCard(c, "", "#1d2b3a"); });
    setState(R.stL, "", "#64748b"); setState(R.stR, "", "#64748b");
    gsap.set([R.stL, R.stR, R.nbBang].concat(R.locks), {opacity:0});
    gsap.set(pk.seal, {opacity:0});
    pk.tcp.tag.textContent = "TCP →:80";
  },

  /* ── 사건별 장면 — content.js 의 beats 와 개수·순서가 같다 ── */
  scenes:{
    request:[
      /* 1. 7층 응용 — HTTP 편지 쓰기 */
      function(tl, api, R){
        var p = LP(7);
        tl.set(R.pk, {x:p[0], y:p[1], opacity:0, scale:.4});
        tl.add(api.camTo(600, 250, 1.45, 1.3));
        tl.to(R.pk, {opacity:1, scale:1, duration:.5, ease:"back.out(2)"}, "-=.3");
        var b = api.bubble(588, 150, 290, 124, [588, 214, 548, 236, 588, 232]);
        api.text(b.inner, 606, 178, "📝 7층 · HTTP 요청 편지", "t");
        api.text(b.inner, 606, 202, "GET / HTTP/1.1", "m");
        api.text(b.inner, 606, 220, "Host: my-shop.example", "m");
        api.text(b.inner, 606, 238, "User-Agent: curl/8.5.0", "m");
        api.text(b.inner, 606, 256, "Accept: */*   (78바이트)", "m");
        api.pop(tl, b, "+=.1");
      },
      /* 2. 6·5층 — 손대지 않고 통과 */
      function(tl, api, R){
        tl.add(api.camTo(600, 290, 1.45, 1));
        api.clearBubbles(tl, "<");
        var p = LP(5);
        tl.to(R.pk, {y:LP(6)[1], duration:.7, ease:"power1.inOut"}, "-=.4");
        tl.to(R.pk, {y:p[1], duration:.7, ease:"power1.inOut"}, "+=.25");
        var b = api.bubble(588, 222, 300, 96, [588, 282, 550, 300, 588, 300]);
        api.text(b.inner, 606, 250, "6층 · 5층 — 그냥 통과", "t");
        api.text(b.inner, 606, 274, "http:// 라 봉인할 것이 없어요", "s");
        api.text(b.inner, 606, 296, "https:// 였다면 여기서 TLS가 봉인", "s");
        api.pop(tl, b, "-=.3");
      },
      /* 3. 4층 전송 — TCP 봉투 */
      function(tl, api, R){
        tl.add(api.camTo(600, 320, 1.45, 1));
        api.clearBubbles(tl, "<");
        tl.to(R.pk, {y:LP(4)[1], duration:.7, ease:"power1.inOut"}, "-=.4");
        tl.fromTo(R.pk.tcp, {opacity:0, scale:1.5, transformOrigin:"50% 50%"}, {opacity:1, scale:1, duration:.5, ease:"back.out(2)"});
        var b = api.bubble(588, 262, 300, 104, [588, 322, 556, 340, 588, 340]);
        api.text(b.inner, 606, 290, "📮 4층 · TCP 봉투", "t");
        api.text(b.inner, 606, 314, "포트  51514 → 80", "m");
        api.text(b.inner, 606, 334, "순서 번호  seq 1:79", "m");
        api.text(b.inner, 606, 354, "서버의 어느 프로그램에게? = 포트", "s");
        api.pop(tl, b, "+=.1");
      },
      /* 4. 3층 네트워크 — IP 봉투 */
      function(tl, api, R){
        tl.add(api.camTo(600, 350, 1.45, 1));
        api.clearBubbles(tl, "<");
        tl.to(R.pk, {y:LP(3)[1], duration:.7, ease:"power1.inOut"}, "-=.4");
        tl.fromTo(R.pk.ip, {opacity:0, scale:1.5, transformOrigin:"50% 50%"}, {opacity:1, scale:1, duration:.5, ease:"back.out(2)"});
        var b = api.bubble(588, 300, 310, 104, [588, 362, 560, 380, 588, 380]);
        api.text(b.inner, 606, 328, "🏷 3층 · IP 봉투", "t");
        api.text(b.inner, 606, 352, "10.0.1.23 → 10.0.2.10", "m");
        api.text(b.inner, 606, 372, "TTL 64", "m");
        api.text(b.inner, 606, 392, "다른 동네 → 길목 10.0.1.1 로 보내기", "s");
        api.pop(tl, b, "+=.1");
      },
      /* 5. 2층 데이터 링크 — Ethernet 봉투 */
      function(tl, api, R){
        tl.add(api.camTo(600, 380, 1.45, 1));
        api.clearBubbles(tl, "<");
        tl.to(R.pk, {y:LP(2)[1], duration:.7, ease:"power1.inOut"}, "-=.4");
        tl.fromTo(R.pk.eth, {opacity:0, scale:1.5, transformOrigin:"50% 50%"}, {opacity:1, scale:1, duration:.5, ease:"back.out(2)"});
        var b = api.bubble(588, 330, 330, 104, [588, 392, 566, 410, 588, 410]);
        api.text(b.inner, 606, 358, "🚚 2층 · Ethernet 봉투", "t");
        api.text(b.inner, 606, 382, "받는 MAC …53:01 (길목 라우터)", "m");
        api.text(b.inner, 606, 402, "보내는 MAC …53:23 (나)", "m");
        api.text(b.inner, 606, 422, "서버 MAC이 아니에요 — 바로 옆까지만", "s", {style:"fill:#dc2626"});
        api.pop(tl, b, "+=.1");
      },
      /* 6. 1층 물리 — 신호가 되어 도로로 */
      function(tl, api, R){
        tl.add(api.camTo(620, 410, 1.3, 1.1));
        api.clearBubbles(tl, "<");
        var p1 = LP(1), road = [p1[0] + 30, 490];
        tl.to(R.pk, {y:p1[1], duration:.6, ease:"power1.inOut"}, "-=.4");
        tl.to(R.pk, {scale:.3, opacity:0, duration:.4});
        tl.set(R.bits, {x:road[0], y:road[1]}, "<");
        tl.to(R.bits, {opacity:1, duration:.3}, "<");
        var b = api.bubble(470, 330, 300, 78, [560, 408, 556, 470, 590, 408]);
        api.text(b.inner, 488, 358, "⚡ 1층 · 0과 1의 전기 신호", "t");
        api.text(b.inner, 488, 382, "봉투도 헤더도 비트의 줄일 뿐", "s");
        api.pop(tl, b, "<");
        tl.to(R.bits, {x:R.swPt[0], y:490, duration:1.3, ease:"none"}, "+=.3");
      },
      /* 7. 동네 분류소 — 겉봉투(MAC)만 보고 넘긴다 */
      function(tl, api, R){
        tl.add(api.camTo(760, 380, 1.4, 1));
        api.clearBubbles(tl, "<");
        var s = R.swPt;
        tl.to(R.bits, {opacity:0, duration:.3}, "-=.3");
        tl.set(R.pk, {x:s[0], y:s[1] - 30, scale:.8}, "<");
        tl.to(R.pk, {opacity:1, duration:.35}, "<");
        tl.to(R.swLamp, {opacity:1, duration:.3}, "<");
        var b = api.bubble(560, 230, 300, 112, [650, 342, 664, 378, 690, 342]);
        api.text(b.inner, 578, 258, "🗂 분류소는 겉봉투만 읽어요", "t");
        api.text(b.inner, 578, 282, "받는 MAC …53:01 → Gi0/3", "m");
        api.text(b.inner, 578, 302, "MAC 표  …53:23 Gi0/1", "m");
        api.text(b.inner, 578, 322, "        …53:01 Gi0/3 ★", "m", {style:"fill:#16a34a;font-weight:700"});
        api.pop(tl, b, "+=.1");
        api.fly(tl, R.pk, [s[0], s[1] - 30], [R.rtPt[0], R.rtPt[1] - 20], {duration:1.3, lift:60}, "+=.6");
        tl.to(R.swLamp, {opacity:0, duration:.3}, "<");
      },
      /* 8. 교차로 우체국 — 겉봉투를 버리고 IP를 읽고 새 겉봉투로 */
      function(tl, api, R){
        tl.add(api.camTo(930, 360, 1.35, 1));
        api.clearBubbles(tl, "<");
        tl.to(R.rtLamp, {opacity:1, duration:.3}, "<");
        tl.to(R.pk.eth, {opacity:0, y:-30, duration:.5}, "+=.1");
        var b = api.bubble(640, 150, 320, 132, [880, 282, 900, 318, 920, 282]);
        api.text(b.inner, 658, 178, "🧭 IP 봉투까지 열어 봐요", "t");
        api.text(b.inner, 658, 202, "받는 IP 10.0.2.10", "m");
        api.text(b.inner, 658, 222, " → 10.0.2.0/24 는 eth1 쪽", "m");
        var ttl = api.text(b.inner, 658, 242, "TTL 64", "m");
        api.text(b.inner, 658, 264, "새 겉봉투 …53:02 → …53:10", "m", {style:"fill:#15803d;font-weight:700"});
        api.pop(tl, b, "<");
        tl.call(function(){ ttl.textContent = "TTL 64 → 63"; ttl.setAttribute("style", "fill:#dc2626"); }, null, "+=.6");
        tl.call(function(){ R.pk.eth.tag.textContent = "ETH →…53:10"; }, null, "+=.4");
        tl.fromTo(R.pk.eth, {opacity:0, y:0, scale:1.5, transformOrigin:"50% 50%"}, {opacity:1, scale:1, duration:.5, ease:"back.out(2)"}, "<");
        var r1 = RP(1);
        api.fly(tl, R.pk, [R.rtPt[0], R.rtPt[1] - 20], r1, {duration:1.3, lift:50}, "+=.5");
        tl.to(R.pk, {scale:1, duration:.4}, "<");
        tl.to(R.rtLamp, {opacity:0, duration:.3}, "<");
      },
      /* 9. 서버 빌딩 — 아래층부터 하나씩 벗겨 올라간다 */
      function(tl, api, R){
        tl.add(api.camTo(800, 270, 1.05, 1.2));
        api.clearBubbles(tl, "<");
        var pk = R.pk;
        var b = api.bubble(560, 34, 400, 138, [960, 120, 1162, 166, 960, 150]);
        api.text(b.inner, 580, 62, "서버 빌딩: 아래층부터 하나씩 벗겨요", "t");
        var rows = [
          api.text(b.inner, 580, 86, "2층 받는 MAC …53:10 = 나 ✓ (라우터가 쓴 봉투)", "m", {opacity:.15}),
          api.text(b.inner, 580, 106, "3층 받는 IP 10.0.2.10 = 나 ✓", "m", {opacity:.15}),
          api.text(b.inner, 580, 126, "4층 포트 80 → nginx 에게", "m", {opacity:.15}),
          api.text(b.inner, 580, 150, "7층 GET / → 200 OK", "m", {opacity:.15, style:"fill:#16a34a;font-weight:700"})];
        api.pop(tl, b, "<");
        var steps = [[2, pk.eth, "p2", R.rtPt, "alt"], [3, pk.ip, "p3", LP(3)], [4, pk.tcp, "p4", LP(4)]];
        steps.forEach(function(s, i){
          tl.to(pk, {y:RP(s[0])[1], duration:.6, ease:"power1.inOut"}, "+=.3");
          tl.to(s[1], {opacity:0, scale:1.4, transformOrigin:"50% 50%", duration:.45});
          tl.to(rows[i], {opacity:1, duration:.3}, "<");
          api.showLink(tl, s[2], RP(s[0]), [s[3][0], s[3][1] - (s[4] ? 10 : 0)], "<", s[4]);
        });
        tl.to(pk, {y:RP(7)[1], duration:1, ease:"power1.inOut"}, "+=.3");
        tl.to(rows[3], {opacity:1, duration:.3});
        api.showLink(tl, "p7", RP(7), LP(7), "<");
        tl.to(pk, {x:R.serverPt[0], y:R.serverPt[1] + 10, scale:.5, opacity:0, duration:.6}, "+=.3");
      }
    ],
    /* TCP 연결 맺기 — 4층끼리 SYN · SYN-ACK · ACK */
    handshake:[
      /* 1. SYN */
      function(tl, api, R){
        var c = R.cards[0], a = LP(4), b = RP(4);
        tl.call(function(){ setCard(c, "SYN", "#c2410c"); setState(R.stL, "CLOSED", "#64748b"); setState(R.stR, "LISTEN", "#2563eb"); });
        tl.add(api.camTo(800, 300, 1.15, 1.2));
        tl.to([R.stL, R.stR], {opacity:1, duration:.3}, "<+.6");
        tl.set(c, {x:a[0], y:a[1]});
        tl.to(c, {opacity:1, duration:.3});
        tl.call(function(){ setState(R.stL, "SYN-SENT", "#c2410c"); });
        api.fly(tl, c, a, b, {duration:1.6, lift:170});
        var bb = api.bubble(640, 100, 320, 96, [780, 196, 800, 226, 820, 196]);
        api.text(bb.inner, 658, 128, "① SYN — 연결하자", "t");
        api.text(bb.inner, 658, 152, "seq 3172449120 (내 시작 번호)", "m");
        api.text(bb.inner, 658, 174, "노트북 4층: SYN-SENT", "s");
        api.pop(tl, bb, "<+.4");
      },
      /* 2. SYN-ACK */
      function(tl, api, R){
        var c = R.cards[0], a = RP(4), b = LP(4);
        api.clearBubbles(tl, "<");
        tl.call(function(){ setCard(c, "SYN-ACK", "#2563eb"); setState(R.stR, "SYN-RECEIVED", "#2563eb"); });
        api.fly(tl, c, a, b, {duration:1.6, lift:170}, "+=.3");
        var bb = api.bubble(640, 90, 320, 112, [780, 202, 800, 230, 820, 202]);
        api.text(bb.inner, 658, 118, "② SYN-ACK — 좋아, 받았어", "t");
        api.text(bb.inner, 658, 142, "seq 2841067534 (서버 시작 번호)", "m");
        api.text(bb.inner, 658, 162, "ack 3172449121 (네 번호 + 1)", "m");
        api.text(bb.inner, 658, 184, "서버 4층: SYN-RECEIVED", "s");
        api.pop(tl, bb, "<+.4");
      },
      /* 3. ACK */
      function(tl, api, R){
        var c = R.cards[0], a = LP(4), b = RP(4);
        api.clearBubbles(tl, "<");
        tl.call(function(){ setCard(c, "ACK", "#15803d"); setState(R.stL, "ESTABLISHED", "#15803d"); });
        api.fly(tl, c, a, b, {duration:1.6, lift:170}, "+=.3");
        tl.call(function(){ setState(R.stR, "ESTABLISHED", "#15803d"); });
        tl.to(c, {opacity:0, duration:.3}, "+=.2");
        var bb = api.bubble(640, 100, 320, 96, [780, 196, 800, 226, 820, 196]);
        api.text(bb.inner, 658, 128, "③ ACK — 확인했어", "t");
        api.text(bb.inner, 658, 152, "ack 2841067535 (네 번호 + 1)", "m");
        api.text(bb.inner, 658, 174, "양쪽 4층: ESTABLISHED", "s");
        api.pop(tl, bb, "<-1.4");
      },
      /* 4. 연결 = 양쪽 4층의 기록 */
      function(tl, api, R){
        api.clearBubbles(tl, "<");
        api.showLink(tl, "conn", LP(4), RP(4), "+=.2", "alt");
        var bb = api.bubble(620, 70, 360, 124, [780, 194, 800, 226, 820, 194]);
        api.text(bb.inner, 640, 98, "연결 = 양쪽 4층이 가진 기록", "t");
        api.text(bb.inner, 640, 122, "10.0.1.23:51514 ↔ 10.0.2.10:80", "m");
        api.text(bb.inner, 640, 144, "다음에 보낼 번호 · 받을 번호 · 창 크기", "s");
        api.text(bb.inner, 640, 166, "분류소·우체국은 이 연결을 몰라요", "s", {style:"fill:#dc2626"});
        api.pop(tl, bb, "<");
      }
    ],
    /* 옆 장비 MAC 찾기 — ARP 방송과 응답 */
    arp:[
      /* 1. 3층이 길목을 정했지만 2층은 MAC을 모른다 */
      function(tl, api, R){
        var c = R.cards[0], a = LP(3), b = LP(2);
        tl.call(function(){ setCard(c, "10.0.1.1 의 MAC?", "#7e22ce"); });
        tl.add(api.camTo(600, 400, 1.45, 1.2));
        tl.set(c, {x:a[0] + 40, y:a[1]});
        tl.to(c, {opacity:1, duration:.3});
        tl.to(c, {y:b[1], duration:.8, ease:"power1.inOut"}, "+=.3");
        var bb = api.bubble(640, 290, 300, 96, [640, 360, 610, 380, 640, 378]);
        api.text(bb.inner, 658, 318, "3층 → 2층: 길목 10.0.1.1 로", "t");
        api.text(bb.inner, 658, 342, "ARP 표가 비어 있어 MAC을 몰라요", "s");
        api.text(bb.inner, 658, 364, "→ 겉봉투를 쓸 수 없어요", "s", {style:"fill:#dc2626"});
        api.pop(tl, bb, "<");
      },
      /* 2. ARP 요청 — 동네 전체에 묻기 */
      function(tl, api, R){
        var c = R.cards[0], a = [LP(2)[0] + 40, LP(2)[1]];
        api.clearBubbles(tl, "<");
        tl.add(api.camTo(640, 420, 1.4, 1));
        tl.call(function(){ setCard(c, "ARP 요청: 누가 10.0.1.1?", "#15803d"); }, null, "<");
        api.fly(tl, c, a, [R.swPt[0], R.swPt[1] - 26], {duration:1.4, lift:40});
        var bb = api.bubble(470, 250, 320, 96, [560, 346, 590, 400, 600, 346]);
        api.text(bb.inner, 488, 278, "받는 MAC ff:ff:ff:ff:ff:ff", "m");
        api.text(bb.inner, 488, 300, "= 동네 전체 (브로드캐스트)", "s");
        api.text(bb.inner, 488, 322, "보내는 MAC …53:23 (나)", "m");
        api.pop(tl, bb, "<+.2");
      },
      /* 3. 분류소가 모든 출구로 복사 · 옆자리 PC는 버림 */
      function(tl, api, R){
        var s = [R.swPt[0], R.swPt[1] - 26];
        api.clearBubbles(tl, "<");
        tl.add(api.camTo(800, 420, 1.35, 1));
        tl.to(R.swLamp, {opacity:1, duration:.3}, "<");
        tl.call(function(){ [1, 2].forEach(function(n){ setCard(R.cards[n], "ARP 요청: 누가 10.0.1.1?", "#15803d"); }); }, null, "<");
        tl.set([R.cards[1], R.cards[2]], {x:s[0], y:s[1], opacity:1, scale:.8});
        tl.to(R.cards[0], {opacity:0, duration:.2}, "<");
        api.fly(tl, R.cards[1], s, [R.rtPt[0], R.rtPt[1] - 20], {duration:1.3, lift:50}, "+=.2");
        api.fly(tl, R.cards[2], s, [R.nbPt[0], R.nbPt[1] - 10], {duration:1.3, lift:30}, "<");
        tl.to(R.nbBang, {opacity:1, duration:.3});
        tl.to(R.cards[2], {opacity:0, duration:.4}, "+=.3");
        var bb = api.bubble(560, 270, 260, 68, [640, 338, 668, 412, 680, 338]);
        api.text(bb.inner, 578, 298, "배움: …53:23 은 Gi0/1", "m");
        api.text(bb.inner, 578, 320, "받는 칸이 '전체' → 모든 출구로", "s");
        api.pop(tl, bb, "<-1");
        var nb = api.bubble(700, 560, 180, 46, [750, 560, 756, 536, 770, 560]);
        api.text(nb.inner, 716, 589, "✗ 나 아님 → 버림", "t", {style:"fill:#dc2626"});
        api.pop(tl, nb, "<");
      },
      /* 4. 라우터가 노트북에게만 응답 */
      function(tl, api, R){
        var c = R.cards[1], r = [R.rtPt[0], R.rtPt[1] - 20], s = [R.swPt[0], R.swPt[1] - 26], l = [LP(2)[0] + 40, LP(2)[1]];
        api.clearBubbles(tl, "<");
        tl.add(api.camTo(780, 400, 1.3, 1));
        tl.to([R.swLamp, R.nbBang], {opacity:0, duration:.3}, "<");
        tl.to(R.rtLamp, {opacity:1, duration:.3}, "<");
        tl.call(function(){ setCard(c, "ARP 응답: 10.0.1.1 은 …53:01", "#15803d"); }, null, "<");
        var bb = api.bubble(800, 230, 300, 92, [880, 322, 920, 380, 920, 322]);
        api.text(bb.inner, 818, 258, "'10.0.1.1 은 나' → 노트북에게만", "t");
        api.text(bb.inner, 818, 282, "받는 MAC …53:23", "m");
        api.text(bb.inner, 818, 302, "보내는 MAC …53:01", "m");
        api.pop(tl, bb, "+=.1");
        api.fly(tl, c, r, s, {duration:1, lift:40}, "+=.5");
        api.fly(tl, c, s, l, {duration:1.3, lift:40});
        tl.to(R.rtLamp, {opacity:0, duration:.3}, "<");
      },
      /* 5. ARP 표에 적기 */
      function(tl, api, R){
        var c = R.cards[1];
        api.clearBubbles(tl, "<");
        tl.add(api.camTo(600, 400, 1.45, 1));
        tl.to(c, {scale:.3, opacity:0, duration:.4}, "-=.4");
        var b2 = LP(2);
        var bb = api.bubble(640, 300, 330, 96, [640, 372, 600, b2[1] - 6, 640, 390]);
        api.text(bb.inner, 658, 328, "📒 2층 ARP 표", "t");
        api.text(bb.inner, 658, 352, "10.0.1.1 → 00:00:5e:00:53:01", "m", {style:"fill:#15803d;font-weight:700"});
        api.text(bb.inner, 658, 374, "이제 겉봉투를 쓸 수 있어요", "s");
        api.pop(tl, bb, "<");
      }
    ],
    /* HTTPS로 봉인하기 — 6·5층 자리의 TLS */
    tls:[
      /* 1. ClientHello */
      function(tl, api, R){
        var c = R.cards[0], a = LP(5.5), b = RP(5.5);
        tl.call(function(){ setCard(c, "ClientHello", "#a16207"); R.pk.tcp.tag.textContent = "TCP →:443"; });
        tl.add(api.camTo(800, 280, 1.15, 1.2));
        tl.set(c, {x:a[0], y:a[1]});
        tl.to(c, {opacity:1, duration:.3});
        api.fly(tl, c, a, b, {duration:1.6, lift:100});
        var bb = api.bubble(620, 100, 360, 116, [780, 216, 800, 250, 820, 216]);
        api.text(bb.inner, 640, 128, "① ClientHello (아직 봉인 전)", "t");
        api.text(bb.inner, 640, 152, "TLS 1.3 · 암호 방식 후보", "s");
        api.text(bb.inner, 640, 172, "열쇠 재료 (key_share)", "s");
        api.text(bb.inner, 640, 196, "SNI: my-shop.example ← 길에서 보여요", "m");
        api.pop(tl, bb, "<+.4");
      },
      /* 2. ServerHello + 인증서 */
      function(tl, api, R){
        var c = R.cards[0], a = RP(5.5), b = LP(5.5);
        api.clearBubbles(tl, "<");
        tl.call(function(){ setCard(c, "ServerHello + 🔒인증서", "#a16207"); });
        api.fly(tl, c, a, b, {duration:1.6, lift:100}, "+=.3");
        var bb = api.bubble(620, 110, 360, 100, [780, 210, 800, 244, 820, 210]);
        api.text(bb.inner, 640, 138, "② ServerHello — 방식 결정", "t");
        api.text(bb.inner, 640, 162, "열쇠 재료를 주고받아 같은 키를 계산", "s");
        api.text(bb.inner, 640, 186, "🔒 인증서부터는 이미 암호화", "s", {style:"fill:#a16207;font-weight:700"});
        api.pop(tl, bb, "<+.4");
      },
      /* 3. 인증서 확인 → 자물쇠 */
      function(tl, api, R){
        api.clearBubbles(tl, "<");
        tl.to(R.cards[0], {opacity:0, duration:.3}, "<");
        tl.add(api.camTo(640, 300, 1.35, 1));
        var bb = api.bubble(600, 170, 330, 124, [600, 260, 540, 300, 600, 280]);
        api.text(bb.inner, 618, 198, "노트북 TLS: 인증서 확인", "t");
        api.text(bb.inner, 618, 222, "✓ 이름 my-shop.example", "m");
        api.text(bb.inner, 618, 242, "✓ Example CA 서명 (믿는 목록)", "m");
        api.text(bb.inner, 618, 262, "✓ 유효 기간 안", "m");
        api.text(bb.inner, 618, 284, "→ Finished 교환, 봉인 준비 끝", "s");
        api.pop(tl, bb, "+=.1");
        tl.to(R.locks, {opacity:1, duration:.4, stagger:.2}, "+=.6");
      },
      /* 4. 편지를 봉인 */
      function(tl, api, R){
        var pk = R.pk, p7 = LP(7), p56 = LP(5.5);
        api.clearBubbles(tl, "<");
        tl.set(pk, {x:p7[0], y:p7[1], opacity:0, scale:1});
        tl.add(api.camTo(620, 280, 1.45, 1));
        tl.to(pk, {opacity:1, duration:.3});
        tl.to(pk, {y:p56[1], duration:.8, ease:"power1.inOut"});
        tl.to(pk.seal, {opacity:1, duration:.5});
        var bb = api.bubble(600, 170, 300, 74, [600, 220, 560, 300, 600, 236]);
        api.text(bb.inner, 618, 198, "편지를 TLS 봉인 상자에", "t");
        api.text(bb.inner, 618, 222, "경로 · 헤더 · 쿠키가 모두 이 안에", "s");
        api.pop(tl, bb, "<");
      },
      /* 5. 아래층 봉투를 쓰고 길 위로 — 무엇이 보이나 */
      function(tl, api, R){
        var pk = R.pk, r = [R.rtPt[0], R.rtPt[1] - 20];
        api.clearBubbles(tl, "<");
        tl.add(api.camTo(800, 380, 1.2, 1.1));
        tl.to(pk, {y:LP(4)[1], duration:.4}, "<");
        tl.to(pk.tcp, {opacity:1, duration:.25});
        tl.to(pk, {y:LP(3)[1], duration:.3});
        tl.to(pk.ip, {opacity:1, duration:.25});
        tl.to(pk, {y:LP(2)[1], duration:.3});
        tl.to(pk.eth, {opacity:1, duration:.25});
        api.fly(tl, pk, LP(2), r, {duration:1.5, lift:30}, "+=.2");
        tl.to(pk, {scale:.8, duration:.4}, "<");
        var bb = api.bubble(640, 150, 360, 150, [900, 300, 930, 346, 940, 300]);
        api.text(bb.inner, 660, 178, "길 위에서 보이는 것", "t");
        api.text(bb.inner, 660, 200, "10.0.1.23 → 10.0.2.10 · 포트 443", "m");
        api.text(bb.inner, 660, 220, "SNI my-shop.example", "m");
        api.text(bb.inner, 660, 248, "보이지 않는 것", "t", {style:"fill:#a16207"});
        api.text(bb.inner, 660, 270, "경로 / · 헤더 · 쿠키 · 본문", "m");
        api.pop(tl, bb, "+=.1");
      },
      /* 6. 서버가 아래층부터 벗기고 봉인을 푼다 */
      function(tl, api, R){
        var pk = R.pk;
        api.clearBubbles(tl, "<");
        tl.add(api.camTo(1000, 300, 1.2, 1.1));
        tl.call(function(){ pk.eth.tag.textContent = "ETH →…53:10"; }, null, "<");
        api.fly(tl, pk, [R.rtPt[0], R.rtPt[1] - 20], RP(1), {duration:1.1, lift:40}, "<+.3");
        tl.to(pk, {scale:1, duration:.3}, "<");
        [[2, pk.eth], [3, pk.ip], [4, pk.tcp]].forEach(function(q){
          tl.to(pk, {y:RP(q[0])[1], duration:.3});
          tl.to(q[1], {opacity:0, duration:.25});
        });
        tl.to(pk, {y:RP(5.5)[1], duration:.4});
        tl.to(pk.seal, {opacity:0, duration:.5});
        tl.to(pk, {y:RP(7)[1], duration:.5}, "+=.2");
        tl.to(pk, {x:R.serverPt[0], y:R.serverPt[1] + 10, scale:.5, opacity:0, duration:.6}, "+=.2");
        var bb = api.bubble(760, 80, 340, 74, [1100, 110, 1162, 166, 1100, 140]);
        api.text(bb.inner, 778, 108, "서버 TLS가 봉인을 풀어 nginx에게", "t");
        api.text(bb.inner, 778, 132, "봉인은 6·5층 위만 — 아래 봉투는 늘 보여요", "s");
        api.pop(tl, bb, "<");
      }
    ],
    /* 빌딩 안 둘러보기 — 7층부터 1층까지, 들어갔다 나오기 */
    tour:ROOMS.map(function(s, n){ return tourBeat(n); })
  }
};
})();
