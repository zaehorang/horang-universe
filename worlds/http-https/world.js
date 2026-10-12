/* 우편 도시 — 지도 그리기 · 배경 움직임 · 기준 상태 · 사건별 장면 움직임
   왼쪽 내 브라우저 집 → 가운데 공용 도로(엿보는 사람) → 오른쪽 my-shop 가게(80번 문 · 443번 문 · 문지기)
   위쪽(뒤) 이름 찾기 구역(안내소 · 관청 3곳) · 신분증 발급소 */
(function(){
"use strict";
var ISO = window.ISO;
var iso = ISO.iso, isoL = ISO.isoL, el = ISO.el, box = ISO.box, flat = ISO.flat, faceR = ISO.faceR, faceL = ISO.faceL, C = ISO.C, act = ISO.act;

var SHOP = window.SHARED.shops["shop-web"];
var SHOP_IP = window.SHARED.publicIps["shop-web"];

var ROAD_Y = 512;   /* 도로 가운데 화면 높이 (gx+gy = 780) */

/* 길 위를 날아가는 작은 봉투 + 이름표 */
function envelope(parent, text, dark){
  var g = el("g", {"class":"env", opacity:0}, parent);
  el("rect", {x:-17, y:-11, width:34, height:22, rx:3, fill:"#fff", stroke:"#334155", "stroke-width":1.6}, g);
  el("path", {d:"M-17,-11 L0,2 L17,-11", fill:"none", stroke:"#334155", "stroke-width":1.4}, g);
  var w = text.length * 8 + 16;
  el("rect", {x:-w/2, y:-36, width:w, height:20, rx:10, fill:dark || "#1d2b3a"}, g);
  ISO.text(g, 0, -22, text, "envt");
  return g;
}
/* 봉인 상자 — 안이 보이지 않는다 */
function lockBox(parent){
  var g = el("g", {"class":"lbox", opacity:0}, parent);
  box(g, isoL, -14, -12, 0, 28, 24, 22, ["#f3c969","#c99a2e","#b4881f"]);
  var c = isoL(14, 0, 12);
  g.shackle = el("path", {d:"M" + (c[0]-5) + "," + (c[1]-4) + " v-5 a5,5 0 0 1 10,0 v5", fill:"none", stroke:"#1d2b3a", "stroke-width":2.4}, g);
  el("rect", {x:c[0]-7, y:c[1]-5, width:14, height:11, rx:2, fill:"#1d2b3a"}, g);
  el("circle", {cx:c[0], cy:c[1], r:1.8, fill:"#f3c969"}, g);
  return g;
}
/* 엽서 — 내용이 그대로 보인다 */
function postcard(parent, lines, accent){
  var g = el("g", {"class":"pcard", opacity:0}, parent);
  var w = 190, h = 18 + lines.length * 16;
  el("rect", {x:-w/2, y:-h/2, width:w, height:h, rx:5, fill:"#fffdf5", stroke:accent || "#b45309", "stroke-width":1.8}, g);
  el("rect", {x:w/2 - 22, y:-h/2 + 5, width:16, height:18, rx:2, fill:"none", stroke:accent || "#b45309", "stroke-width":1.2, "stroke-dasharray":"2 2"}, g);
  lines.forEach(function(s, i){ ISO.text(g, -w/2 + 9, -h/2 + 20 + i*16, s, "pct"); });
  return g;
}
/* 열쇠 */
function key(parent, x, y){
  var g = el("g", {"class":"key", opacity:0, transform:"translate(" + x + "," + y + ")"}, parent);
  var b = el("g", {}, g);
  el("circle", {cx:-9, cy:0, r:7, fill:"none", stroke:"#a16207", "stroke-width":4}, b);
  el("path", {d:"M-2,0 H14 M10,0 v6 M14,0 v5", fill:"none", stroke:"#a16207", "stroke-width":4, "stroke-linecap":"round"}, b);
  el("circle", {cx:-9, cy:0, r:7, fill:"none", stroke:"#facc15", "stroke-width":2}, b);
  g.body = b;
  return g;
}
/* 작은 표지판 글자 (건물 위) */
function sign(parent, x, y, s, w){
  var g = el("g", {}, parent);
  el("rect", {x:x - w/2, y:y - 11, width:w, height:22, rx:6, fill:"#1d2b3a"}, g);
  ISO.text(g, x, y + 1, s, "sgn");
  return g;
}

/* 신분증 카드 — 날아다니는 인증서. bad 는 큰 빨간 ✗ (처음엔 숨김) */
function idCard(parent, name, issuer, stampFill, stampTxt){
  var g = el("g", {"class":"idc", opacity:0}, parent);
  el("rect", {x:-80, y:-32, width:160, height:64, rx:6, fill:"#fef3c7", stroke:"#a16207", "stroke-width":1.8}, g);
  ISO.text(g, -70, -13, "신분증", "idt");
  ISO.text(g, -70, 6, name, "idl");
  ISO.text(g, -70, 22, issuer, "idl");
  el("circle", {cx:60, cy:-14, r:12, fill:stampFill}, g);
  ISO.text(g, 60, -10.5, stampTxt, "idst");
  g.bad = ISO.text(g, 0, 0, "✗", "idx", {opacity:0});
  return g;
}

/* 확인 목록 한 줄에 ✓(맞음)·✗(틀림) 붙이기 */
function mark(tl, t, ok, at){
  tl.call(function(){ t.textContent = t.textContent.replace(/^([✓✗] )?/, ok ? "✓ " : "✗ "); t.setAttribute("class", ok ? "s ok" : "s bad"); }, null, at);
}

/* 중계소 불빛이 봉투가 지나는 순간 커졌다 돌아온다 (깜빡임은 ambient 가 opacity 로 따로 돌린다) */
function hop(tl, light, at){
  tl.to(light, {attr:{r:10}, duration:.25, yoyo:true, repeat:1, ease:"power1.out"}, at);
}

window.WORLD = {
  home:{x:800, y:500, s:1.08},

  build:function(api){
    var L = api.L, R = {};

    /* 땅 */
    box(L.ground, iso, -60, -60, -30, 880, 840, 30, C.grass);
    for(var t = 0; t < 14; t++){
      var tp = iso((t * 97) % 820 - 40, (t * 61) % 300 + 440 + (t % 2) * 200, 0);
      if(tp[1] < 560 && tp[1] > 470) continue;
      el("circle", {cx:tp[0], cy:tp[1], r:5, fill:"#7fb862"}, L.ground);
      el("circle", {cx:tp[0] + 7, cy:tp[1] + 2, r:4, fill:"#93c977"}, L.ground);
    }

    /* 이름 찾기 구역 바닥 */
    flat(L.ground, -10, 130, 0.5, 300, 270, {fill:"#eef3e2", stroke:"#8aa36b", "stroke-width":2.2, "stroke-dasharray":"10 7"});

    /* 공용 도로 — 화면에서 가로로 곧게 뻗는 길 (gx+gy 750~810) */
    function onLine(sum, X){ var d = (X - 800) / 0.866; return iso((sum + d) / 2, (sum - d) / 2, 0); }
    var rp = [onLine(750, 420), onLine(750, 1172), onLine(810, 1172), onLine(810, 420)];
    el("polygon", {points:ISO.pts(rp), fill:"#c3cad2"}, L.ground);
    el("line", {x1:440, y1:ROAD_Y, x2:1160, y2:ROAD_Y, stroke:"#fff", "stroke-width":2.4, "stroke-dasharray":"14 12"}, L.ground);
    /* 가게 앞 보도 */
    flat(L.ground, 590, 180, 0.4, 200, 50, {fill:"#d9dee3"});

    /* 다른 사람들의 패킷 — 배경 교통 */
    R.traffic = [0,1,2,3].map(function(i){
      return el("rect", {"class":"traffic", x:-5, y:-4, width:10, height:8, rx:2, fill:i % 2 ? "#94a3b8" : "#cbd5e1", transform:"translate(440," + (ROAD_Y + (i % 2 ? 9 : -9)) + ")"}, L.ground);
    });

    /* ── 이름 찾기 구역 ── */
    /* 주소 관청 3곳 (Root · TLD · Authoritative) */
    var hall = act(L.back, "namehall", "주소 관청 3곳");
    R.kiosks = [];
    [[20,"·","#7c3aed"],[100,".com","#2563eb"],[180,"example.com","#0f766e"]].forEach(function(k, i){
      var gx = k[0];
      box(hall, iso, gx, 160, 0, 44, 40, 40, C.white);
      box(hall, iso, gx - 4, 156, 40, 52, 48, 7, [k[2], k[2], k[2]]);
      faceL(hall, gx + 14, 200, 0, 16, 24, "#2e4a6b");
      var sp = iso(gx + 22, 180, 70);
      sign(hall, sp[0], sp[1], i === 0 ? "루트 ." : k[1], i === 2 ? 108 : 58);
      R.kiosks.push(iso(gx + 22, 180, 52));
    });

    /* 동네 안내소 (Resolver) */
    var res = act(L.back, "resolver", "동네 안내소");
    box(res, iso, 40, 290, 0, 80, 70, 56, C.wall);
    box(res, iso, 34, 284, 56, 92, 82, 8, C.teal);
    faceR(res, 120, 300, 14, 22, 24, "#8cc0ee"); faceR(res, 120, 330, 14, 22, 24, "#8cc0ee");
    faceL(res, 66, 360, 0, 24, 36, "#2e4a6b");
    var ip = iso(80, 325, 64);
    el("circle", {cx:ip[0], cy:ip[1] - 18, r:13, fill:"#0f766e"}, res);
    ISO.text(res, ip[0], ip[1] - 13, "?", "sgnq");
    ISO.person(res, iso(140, 372, 0)[0], iso(140, 372, 0)[1], {body:"#14b8a6"});
    R.resolverPt = iso(80, 325, 70);

    /* ── 신분증 발급소 (CA) ── */
    var ca = act(L.back, "ca", "신분증 발급소");
    box(ca, iso, 330, -40, 0, 70, 60, 58, C.white);
    box(ca, iso, 324, -46, 58, 82, 72, 8, C.purple);
    faceL(ca, 352, 20, 0, 22, 34, "#4c1d95");
    var sl = iso(400, -10, 30);
    el("circle", {cx:sl[0] + 1, cy:sl[1], r:12, fill:"#fde68a", stroke:"#a16207", "stroke-width":2}, ca);
    ISO.text(ca, sl[0] + 1, sl[1] + 4.5, "✓", "sgnq", {fill:"#a16207"});
    R.caPt = iso(365, -10, 66);

    /* ── 내 브라우저 집 ── */
    var home = act(L.mid, "browser", "내 브라우저");
    box(home, iso, 50, 590, 0, 100, 100, 64, C.wall);
    /* 지붕 */
    var r1 = iso(44, 584, 64), r2 = iso(156, 584, 64), r3 = iso(156, 696, 64), r4 = iso(44, 696, 64), rt1 = iso(44, 640, 104), rt2 = iso(156, 640, 104);
    el("polygon", {points:ISO.pts([r4, r3, rt2, rt1]), fill:"#c4614a"}, home);
    el("polygon", {points:ISO.pts([r2, r3, rt2]), fill:"#b0553f"}, home);
    el("polygon", {points:ISO.pts([r1, r2, rt2, rt1]), fill:"#e07a5f"}, home);
    faceL(home, 70, 690, 0, 24, 40, "#7c4a35");
    faceR(home, 150, 612, 18, 56, 34, "#2e4a6b");
    R.screen = faceR(home, 150, 612, 18, 56, 34, "#bfe3ff"); R.screen.setAttribute("opacity", 0);
    var sc = iso(150, 640, 35);
    R.screenTxt = ISO.text(home, sc[0], sc[1] + 4, SHOP.shortName, "scrt", {opacity:0});
    var up = iso(176, 660, 0);
    ISO.person(home, up[0], up[1], {body:"#6366f1"});
    R.housePt = iso(150, 640, 48);
    R.houseTop = iso(100, 640, 104);
    /* 수첩 (HSTS 기록) */
    R.hsts = el("g", {opacity:0}, L.fx);
    var hp = iso(100, 640, 150);
    el("rect", {x:hp[0] - 58, y:hp[1] - 40, width:116, height:30, rx:6, fill:"#fef3c7", stroke:"#b45309", "stroke-width":1.5}, R.hsts);
    ISO.text(R.hsts, hp[0], hp[1] - 20, "수첩: 항상 https", "hstst");

    /* ── 공용 도로 · 중계소 (Router) ── */
    var road = act(L.mid, "road", "공용 도로 · 중계소");
    R.routerLights = [];
    [[244,476],[476,244]].forEach(function(q){
      box(road, iso, q[0] - 10, q[1] - 10, 0, 20, 20, 74, C.stone);
      box(road, iso, q[0] - 16, q[1] - 16, 74, 32, 32, 14, C.navy);
      var a = iso(q[0], q[1], 88), a2 = iso(q[0], q[1], 112);
      el("line", {x1:a[0], y1:a[1], x2:a2[0], y2:a2[1], stroke:"#334155", "stroke-width":2.5}, road);
      R.routerLights.push(el("circle", {cx:a2[0], cy:a2[1], r:4.5, fill:"#22c55e"}, road));
    });

    /* ── my-shop 가게 ── */
    var shop = act(L.mid, "shop", SHOP.name);
    box(shop, iso, 600, 60, 0, 180, 120, 104, C.wall);
    box(shop, iso, 594, 54, 104, 192, 132, 9, C.roofB);
    faceR(shop, 780, 80, 40, 30, 30, "#8cc0ee"); faceR(shop, 780, 130, 40, 30, 30, "#8cc0ee");
    R.shopLight = el("g", {opacity:0}, shop);
    faceR(R.shopLight, 780, 80, 40, 30, 30, "#fde68a"); faceR(R.shopLight, 780, 130, 40, 30, 30, "#fde68a");
    faceL(shop, 650, 180, 64, 30, 22, "#8cc0ee");
    var ss = iso(780, 120, 92);
    ISO.text(shop, ss[0] + 4, ss[1] - 2, SHOP.shortName, "shopt");
    R.shopPt = iso(690, 120, 104);

    /* 80번 문 */
    var d80 = act(L.front, "door80", "80번 문");
    faceL(d80, 610, 180, 0, 30, 46, "#94a3b8");
    faceL(d80, 614, 180, 0, 22, 40, "#64748b");
    var s80 = iso(625, 180, 60); sign(d80, s80[0], s80[1], "80", 34);
    R.door80Pt = iso(625, 180, 22);

    /* 443번 문 */
    var d443 = act(L.front, "door443", "443번 문");
    faceL(d443, 686, 180, 0, 34, 50, "#1d2b3a");
    faceL(d443, 690, 180, 0, 26, 44, "#334155");
    var s443 = iso(703, 180, 64); sign(d443, s443[0], s443[1], "443", 42);
    R.door443Pt = iso(703, 180, 22);

    /* 가게 신분증 (인증서) — 문 옆 액자 */
    var cert = act(L.front, "cert", "가게 신분증");
    faceL(cert, 734, 180, 16, 30, 40, "#a16207");
    faceL(cert, 737, 180, 19, 24, 34, "#fef3c7");
    var cp = iso(749, 180, 38);
    el("circle", {cx:cp[0], cy:cp[1] + 6, r:5, fill:"#dc2626"}, cert);
    el("line", {x1:cp[0] - 6, y1:cp[1] - 6, x2:cp[0] + 6, y2:cp[1] - 2, stroke:"#94a3b8", "stroke-width":1.6}, cert);
    R.certPt = iso(749, 180, 40);

    /* 문지기 (TLS) */
    var guard = act(L.front, "guard", "문지기");
    var gp = iso(712, 214, 0);
    ISO.person(guard, gp[0], gp[1], {body:"#0f172a", hard:false, hair:"#111827", clip:true});
    R.guardPt = [gp[0], gp[1] - 56];

    /* 엿보는 사람 */
    var snoop = act(L.front, "snoop", "엿보는 사람");
    var np = iso(425, 430, 0);
    ISO.person(snoop, np[0], np[1], {body:"#7f1d1d", hair:"#111827"});
    el("circle", {cx:np[0] - 14, cy:np[1] - 40, r:7, fill:"rgba(191,219,254,.6)", stroke:"#334155", "stroke-width":2.4}, snoop);
    el("line", {x1:np[0] - 9, y1:np[1] - 35, x2:np[0] - 3, y2:np[1] - 28, stroke:"#334155", "stroke-width":3}, snoop);
    R.snoopPt = [np[0], np[1] - 60];
    R.bang = ISO.bang(L.fx, np[0] + 16, np[1] - 74);

    /* ── 구름 ── */
    var clouds = el("g", {opacity:.85}, L.labels);
    [[240,150],[1330,170],[1450,380]].forEach(function(c){
      var g = el("g", {"class":"cloud", transform:"translate(" + c[0] + "," + c[1] + ")"}, clouds);
      el("ellipse", {cx:0, cy:0, rx:46, ry:16, fill:"#fff"}, g);
      el("ellipse", {cx:-24, cy:6, rx:30, ry:12, fill:"#fff"}, g);
      el("ellipse", {cx:26, cy:5, rx:32, ry:12, fill:"#fff"}, g);
    });

    /* ── 라벨 ── */
    var p;
    p = iso(-10, 400, 0); api.label(p[0] + 30, p[1] - 6, "이름 찾기 구역", "DNS", true);
    p = iso(80, 360, 0);  api.label(p[0] - 10, p[1] + 26, "동네 안내소", "DNS Resolver");
    p = R.kiosks[2];      api.label(p[0] + 175, p[1] + 10, "주소 관청 3곳", "Root · TLD · Authoritative");
    p = iso(365, 20, 0);  api.label(p[0] + 20, p[1] + 24, "신분증 발급소", "Certificate Authority");
    p = iso(100, 640, 104); api.label(p[0] - 70, p[1] - 22, "내 브라우저", "Web Browser");
    api.label(585, 574, "공용 도로 · 중계소", "Internet (Router)", true);
    api.label(np[0] + 40, np[1] + 28, "엿보는 사람", "eavesdropper");
    api.label(R.door80Pt[0] - 70, R.door80Pt[1] + 50, "80번 문", "TCP :80");
    api.label(gp[0] - 66, gp[1] + 30, "443번 문", "TCP :443");
    api.label(gp[0] + 40, gp[1] + 30, "문지기", "TLS");
    p = iso(780, 120, 0); api.label(p[0] - 5, p[1] + 76, SHOP.name, "Web Server");
    p = iso(760, 180, 50); api.label(p[0] + 60, p[1] - 18, "신분증", "Certificate");

    /* ── 움직이는 물체 ── */
    R.conn443 = el("path", {"class":"conn", d:"M420," + ROAD_Y + " L1150," + ROAD_Y + " Q1215," + ROAD_Y + " " + R.door443Pt[0] + "," + (R.door443Pt[1] + 6), opacity:0}, L.fx);
    R.conn80 = el("path", {"class":"conn", d:"M420," + (ROAD_Y + 4) + " L" + R.door80Pt[0] + "," + (R.door80Pt[1] + 10), opacity:0}, L.fx);
    R.q = envelope(L.fx, SHOP.domain + " ?");
    R.ans = envelope(L.fx, SHOP_IP, "#0f766e");
    R.syn = envelope(L.fx, "SYN");
    R.synack = envelope(L.fx, "SYN-ACK");
    R.ack = envelope(L.fx, "ACK");
    R.chello = envelope(L.fx, "ClientHello");
    R.shello = envelope(L.fx, "ServerHello", "#a16207");
    R.fin = envelope(L.fx, "Finished", "#16a34a");
    R.reqBox = lockBox(L.fx);
    R.resBox = lockBox(L.fx);
    R.card = postcard(L.fx, ["GET / HTTP/1.1", "Host: " + SHOP.domain, "Cookie: sid=7f3a9c2e41"]);
    R.card301 = postcard(L.fx, ["HTTP/1.1 301", "Location: https://" + SHOP.shortName + "…"], "#b45309");
    R.keyH = key(L.fx, R.houseTop[0] + 70, R.houseTop[1] - 10);
    R.keyS = key(L.fx, R.guardPt[0] + 34, R.guardPt[1] - 20);
    /* ── 신분증이 틀리면? · 두 번째 방문 에서 쓰는 것 ── */
    R.fakeCard = idCard(L.fx, SHOP.domain, "도장: 내가 직접", "#7f1d1d", "자작");
    R.copyCard = idCard(L.fx, SHOP.domain, "도장: Let's Encrypt", "#15803d", "LE");
    R.alert = envelope(L.fx, "alert · 연결 끊기", "#dc2626");
    R.chelloP = envelope(L.fx, "ClientHello + 티켓");
    R.shelloP = envelope(L.fx, "ServerHello · 티켓 OK", "#a16207");
    R.r304 = envelope(L.fx, "304 Not Modified", "#16a34a");
    /* 경고 화면 (집 창문) */
    R.warn = el("g", {opacity:0}, L.fx);
    faceR(R.warn, 150, 612, 18, 56, 34, "#fecaca");
    var wc = iso(150, 640, 35);
    ISO.text(R.warn, wc[0], wc[1] + 7, "⚠", "warnt");
    /* 신분증 액자 위 빨간 표시 */
    R.certBad = el("g", {opacity:0}, L.fx);
    faceL(R.certBad, 737, 180, 19, 24, 34, "#fecaca");
    var cbp = iso(749, 180, 36);
    R.certBadTxt = ISO.text(R.certBad, cbp[0], cbp[1] + 7, "✗", "certx");
    /* 수첩 (캐시) — 두 번째 방문에서 쓰는 기록들 */
    R.memo = el("g", {opacity:0}, L.fx);
    var mp = iso(100, 640, 150);
    el("rect", {x:mp[0] - 186, y:mp[1] - 122, width:252, height:106, rx:8, fill:"#fef3c7", stroke:"#b45309", "stroke-width":1.5}, R.memo);
    ISO.text(R.memo, mp[0] - 174, mp[1] - 100, "수첩 (캐시)", "memot");
    R.memoL = ["번호 " + SHOP_IP + " · TTL 300초", "HSTS · 항상 https", "세션 티켓 · 5분", "페이지 사본 · ETag"].map(function(t, i){
      return ISO.text(R.memo, mp[0] - 174, mp[1] - 78 + i * 18, "· " + t, "memol");
    });
    R.memoPt = [mp[0] - 60, mp[1] - 70];

    R.movers = [R.q, R.ans, R.syn, R.synack, R.ack, R.chello, R.shello, R.fin, R.reqBox, R.resBox, R.card, R.card301,
      R.fakeCard, R.copyCard, R.alert, R.chelloP, R.shelloP, R.r304];
    return R;
  },

  ambient:function(api, R){
    var w = document.getElementById("world");
    gsap.to(w.querySelectorAll(".bob"), {y:-1.6, duration:.9, yoyo:true, repeat:-1, ease:"sine.inOut", stagger:{each:.3, from:"random"}});
    gsap.to(w.querySelectorAll(".cloud"), {x:"+=60", duration:18, yoyo:true, repeat:-1, ease:"sine.inOut", stagger:3});
    gsap.to(R.routerLights, {opacity:.25, duration:.6, yoyo:true, repeat:-1, stagger:.4});
    R.traffic.forEach(function(c, i){
      var y = ROAD_Y + (i % 2 ? 9 : -9), fwd = i % 2 === 0;
      gsap.fromTo(c, {attr:{transform:"translate(" + (fwd ? 440 : 1150) + "," + y + ")"}}, {attr:{transform:"translate(" + (fwd ? 1150 : 440) + "," + y + ")"}, duration:11, delay:i * 2.7, repeat:-1, ease:"none"});
    });
  },

  reset:function(api, R){
    R.movers.forEach(function(m){ gsap.killTweensOf(m); gsap.set(m, {opacity:0, x:0, y:0, scale:1}); });
    R.routerLights.forEach(function(l){ gsap.killTweensOf(l, "attr"); l.setAttribute("r", 4.5); });
    gsap.set(R.reqBox.shackle, {y:0});
    gsap.set(R.resBox.shackle, {y:0});
    [R.keyH, R.keyS].forEach(function(k){ gsap.killTweensOf(k.body); gsap.set(k, {opacity:0}); gsap.set(k.body, {scale:1, x:0}); });
    [R.conn443, R.conn80].forEach(function(c){ gsap.set(c, {opacity:0}); c.classList.remove("sealed"); c.classList.remove("open"); });
    gsap.set([R.screen, R.screenTxt, R.shopLight, R.hsts, R.bang], {opacity:0, y:0});
    [R.fakeCard, R.copyCard].forEach(function(c){ gsap.set(c.bad, {opacity:0}); });
    gsap.set([R.warn, R.certBad, R.memo], {opacity:0, scale:1});
    R.certBadTxt.textContent = "✗";
    R.memoL.forEach(function(t){ t.setAttribute("class", "memol"); });
  },

  scenes:{
    https:[
      /* 1. 주소 입력 → 수첩 확인 → 안내소에 질문 */
      function(tl, api, R){
        tl.add(api.camTo(470, 400, 1.3, 1.2));
        var h = R.houseTop;
        var b = api.bubble(h[0] - 250, h[1] - 170, 280, 92, [h[0] - 70, h[1] - 78, h[0] - 50, h[1] - 52, h[0] - 40, h[1] - 78]);
        api.text(b.inner, h[0] - 232, h[1] - 140, "https://" + SHOP.domain, "m", {"font-weight":"700"});
        api.text(b.inner, h[0] - 232, h[1] - 116, "수첩(캐시)에 번호 없음", "s");
        api.text(b.inner, h[0] - 232, h[1] - 95, "→ 안내소에 물어보기", "t");
        api.pop(tl, b, "-=.6");
        var o = [R.houseTop[0] + 30, R.houseTop[1] - 6], d = [R.resolverPt[0], R.resolverPt[1] - 10];
        api.showLink(tl, "b-res", o, d, "+=.4");
        tl.set(R.q, {x:o[0], y:o[1], opacity:0, scale:.4}, "<");
        tl.to(R.q, {opacity:1, scale:1, duration:.4, ease:"back.out(2)"}, "<");
        api.fly(tl, R.q, o, d, {duration:1.6, lift:80});
      },
      /* 2. 안내소 → 관청 3곳 차례로 → 답 */
      function(tl, api, R){
        tl.add(api.camTo(640, 330, 1.25, 1.2));
        api.clearBubbles(tl, "<");
        var r = [R.resolverPt[0], R.resolverPt[1] - 10];
        var K = R.kiosks.map(function(k){ return [k[0], k[1] - 8]; });
        var said = ["'.com 은 저기'", "'example.com 은 저기'", SHOP_IP];
        var prev = r;
        K.forEach(function(k, i){
          api.showLink(tl, "res-k" + i, r, k, i ? "+=.1" : ">");
          api.fly(tl, R.q, prev, k, {duration:.8, lift:50}, "<");
          var b = api.bubble(k[0] + 18, k[1] - 104, i === 2 ? 150 : 176, 40, [k[0] + 24, k[1] - 64, k[0] + 6, k[1] - 40, k[0] + 44, k[1] - 64]);
          api.text(b.inner, k[0] + 32, k[1] - 79, said[i], i === 2 ? "t" : "s", i === 2 ? {fill:"#0f766e"} : {});
          api.pop(tl, b, "+=.05");
          if(i < 2) api.hideLinks(tl, ["res-k" + i], "+=.35");
          prev = k;
        });
        tl.to(R.q, {opacity:0, scale:.4, duration:.3});
        var h = [R.houseTop[0] + 30, R.houseTop[1] - 6];
        tl.set(R.ans, {x:K[2][0], y:K[2][1], opacity:1, scale:1});
        api.fly(tl, R.ans, K[2], r, {duration:.9, lift:40});
        api.fly(tl, R.ans, r, h, {duration:1.1, lift:60});
        api.hideLinks(tl, ["res-k2"], "<");
      },
      /* 3. TCP 3단계 악수 → 연결 */
      function(tl, api, R){
        tl.add(api.camTo(820, 470, 1.1, 1.3));
        api.clearBubbles(tl, "<");
        api.hideLinks(tl, ["b-res"], 0);
        tl.to(R.ans, {opacity:0, duration:.3}, 0);
        var h = [R.housePt[0] + 30, ROAD_Y - 6], d = [R.door443Pt[0] - 8, R.door443Pt[1] - 6];
        tl.set(R.syn, {x:h[0], y:h[1], opacity:1});
        api.fly(tl, R.syn, h, d, {duration:1.5, lift:30});
        tl.to(R.syn, {opacity:0, duration:.2});
        tl.set(R.synack, {x:d[0], y:d[1], opacity:1});
        api.fly(tl, R.synack, d, h, {duration:1.5, lift:30});
        tl.to(R.synack, {opacity:0, duration:.2});
        tl.set(R.ack, {x:h[0], y:h[1], opacity:1});
        api.fly(tl, R.ack, h, d, {duration:1.5, lift:30});
        tl.to(R.ack, {opacity:0, duration:.2});
        tl.to(R.conn443, {opacity:1, duration:.5});
        var dp = R.door443Pt;
        var b = api.bubble(dp[0] - 210, 350, 230, 62, [dp[0] - 28, 412, dp[0], dp[1] - 76, dp[0] + 12, 412]);
        api.text(b.inner, dp[0] - 192, 376, "연결됨 (ESTABLISHED)", "t", {fill:"#16a34a"});
        api.text(b.inner, dp[0] - 192, 398, "아직 봉인은 없어요", "s");
        api.pop(tl, b, "+=.1");
      },
      /* 4. TLS — ClientHello / ServerHello → 양쪽이 같은 열쇠 */
      function(tl, api, R){
        tl.add(api.camTo(820, 460, 1.1, 1.0));
        api.clearBubbles(tl, "<");
        var h = [R.housePt[0] + 30, ROAD_Y - 6], d = [R.guardPt[0] - 6, R.guardPt[1] - 4];
        var b = api.bubble(560, 392, 268, 66, [600, 458, 540, 490, 640, 458]);
        api.text(b.inner, 578, 418, "ClientHello", "t");
        api.text(b.inner, 578, 442, "가게 이름 · 쓸 수 있는 암호 · 열쇠 재료 A", "s");
        tl.set(R.chello, {x:h[0], y:h[1], opacity:1});
        api.pop(tl, b, "<");
        api.fly(tl, R.chello, h, d, {duration:1.8, lift:40}, "<");
        tl.to(R.chello, {opacity:0, duration:.2});
        var b2 = api.bubble(930, 340, 268, 66, [1100, 406, 1140, 440, 1130, 406]);
        api.text(b2.inner, 948, 366, "ServerHello", "t");
        api.text(b2.inner, 948, 390, "고른 암호 · 열쇠 재료 B", "s");
        api.pop(tl, b2, "<");
        tl.set(R.shello, {x:d[0], y:d[1], opacity:1});
        api.fly(tl, R.shello, d, h, {duration:1.8, lift:40});
        tl.to(R.shello, {opacity:0, duration:.2});
        tl.addLabel("keys", "+=.2");
        [R.keyH, R.keyS].forEach(function(k){
          tl.to(k, {opacity:1, duration:.3}, "keys");
          tl.fromTo(k.body, {scale:.3}, {scale:1.2, duration:.5, ease:"back.out(3)", transformOrigin:"50% 50%"}, "keys");
        });
        var b3 = api.bubble(640, 600, 330, 50, null);
        api.text(b3.inner, 660, 631, "A + B → 양쪽에 같은 열쇠 (길 위엔 없음)", "t", {fill:"#a16207"});
        api.pop(tl, b3, "keys+=.4");
      },
      /* 5. 신분증 확인 → Finished → 봉인 완료 */
      function(tl, api, R){
        tl.add(api.camTo(800, 400, 1.05, 1.2));
        api.clearBubbles(tl, "<");
        api.showLink(tl, "ca-b", R.caPt, [R.houseTop[0] + 20, R.houseTop[1] - 20], ">", "alt");
        var h = R.houseTop;
        var b = api.bubble(h[0] - 110, h[1] - 196, 290, 128, [h[0] - 10, h[1] - 68, h[0] + 10, h[1] - 40, h[0] + 30, h[1] - 68]);
        api.text(b.inner, h[0] - 92, h[1] - 168, "신분증 확인", "t");
        var c1 = api.text(b.inner, h[0] - 92, h[1] - 143, "이름 " + SHOP.domain, "s");
        var c2 = api.text(b.inner, h[0] - 92, h[1] - 121, "기한 2026-12-30 까지", "s");
        var c3 = api.text(b.inner, h[0] - 92, h[1] - 99, "도장 Let's Encrypt — 목록에 있음", "s");
        api.pop(tl, b, "+=.1");
        [c1, c2, c3].forEach(function(c){
          tl.call(function(){ c.textContent = c.textContent.replace(/^(✓ )?/, "✓ "); c.setAttribute("class", "s ok"); }, null, "+=.5");
        });
        var cb = api.bubble(950, 200, 240, 46, [1020, 246, 1060, 266, 1050, 246]);
        api.text(cb.inner, 968, 229, "도장 목록은 미리 배포됨", "s");
        api.pop(tl, cb, "<");
        var hh = [R.housePt[0] + 30, ROAD_Y - 6], d = [R.guardPt[0] - 6, R.guardPt[1] - 4];
        tl.set(R.fin, {x:hh[0], y:hh[1], opacity:1}, "+=.3");
        api.fly(tl, R.fin, hh, d, {duration:1.4, lift:30});
        tl.to(R.fin, {opacity:0, duration:.2});
        tl.call(function(){ R.conn443.classList.add("sealed"); });
        tl.fromTo(R.conn443, {opacity:.4}, {opacity:1, duration:.4});
      },
      /* 6. 봉인 상자가 길을 감 — 엿보는 사람에게 보이는 것 */
      function(tl, api, R){
        tl.add(api.camTo(800, 450, 1.15, 1.2));
        api.clearBubbles(tl, "<");
        api.hideLinks(tl, ["ca-b"], 0);
        var h = [R.housePt[0] + 30, ROAD_Y - 8], m = [800, ROAD_Y - 8], d = [R.door443Pt[0] - 10, R.door443Pt[1] - 8];
        tl.set(R.reqBox, {x:h[0], y:h[1], opacity:1, scale:1.2});
        var t0 = tl.duration();
        api.fly(tl, R.reqBox, h, m, {duration:1.6, lift:20});
        hop(tl, R.routerLights[0], t0 + .8);
        tl.fromTo(R.bang, {opacity:0, y:6}, {opacity:1, y:0, duration:.35, ease:"back.out(3)"});
        var s = R.snoopPt;
        var b = api.bubble(s[0] - 170, s[1] - 166, 340, 104, [s[0] - 10, s[1] - 62, s[0] - 20, s[1] - 30, s[0] + 14, s[1] - 62]);
        api.text(b.inner, s[0] - 152, s[1] - 140, "보이는 것: " + SHOP_IP + " :443", "s");
        api.text(b.inner, s[0] - 152, s[1] - 118, "가게 이름(SNI) · 크기 91바이트", "s");
        api.text(b.inner, s[0] - 152, s[1] - 90, "안 보이는 것: 경로 · 쿠키 · 내용", "t", {fill:"#16a34a"});
        api.pop(tl, b, "<");
        var t1 = tl.duration() + .8;
        api.fly(tl, R.reqBox, m, d, {duration:1.4, lift:20}, "+=.8");
        hop(tl, R.routerLights[1], t1 + .5);
      },
      /* 7. 가게가 열어 처리 → 봉인된 응답 → 화면 */
      function(tl, api, R){
        tl.add(api.camTo(840, 440, 1.1, 1.2));
        api.clearBubbles(tl, "<");
        tl.to(R.bang, {opacity:0, duration:.3}, 0);
        tl.to(R.reqBox.shackle, {y:-5, duration:.3});
        tl.to(R.reqBox, {opacity:0, scale:.5, duration:.4});
        tl.to(R.shopLight, {opacity:1, duration:.4});
        var p = R.shopPt;
        var b = api.bubble(p[0] - 30, p[1] - 130, 220, 70, [p[0] + 10, p[1] - 60, p[0] + 20, p[1] - 30, p[0] + 40, p[1] - 60]);
        api.text(b.inner, p[0] - 12, p[1] - 103, "GET / → 200 OK", "t", {fill:"#16a34a"});
        api.text(b.inner, p[0] - 12, p[1] - 80, "페이지를 다시 봉인해서", "s");
        api.pop(tl, b, "<");
        var d = [R.door443Pt[0] - 10, R.door443Pt[1] - 8], h = [R.housePt[0] + 30, ROAD_Y - 8];
        tl.set(R.resBox, {x:d[0], y:d[1], opacity:1, scale:1.2}, "+=.4");
        api.fly(tl, R.resBox, d, h, {duration:2.2, lift:20});
        tl.to(R.resBox, {opacity:0, scale:.5, duration:.3});
        tl.to([R.screen, R.screenTxt], {opacity:1, duration:.5});
        var hb = R.houseTop;
        var b2 = api.bubble(hb[0] - 120, hb[1] - 120, 240, 60, [hb[0] - 10, hb[1] - 60, hb[0], hb[1] - 30, hb[0] + 20, hb[1] - 60]);
        api.text(b2.inner, hb[0] - 102, hb[1] - 84, "🔒 " + SHOP.shortName + " 화면 표시", "t");
        api.pop(tl, b2, "<");
      }
    ],

    http:[
      /* 1. 80번 문과 TCP 연결 (봉인 없음) */
      function(tl, api, R){
        tl.add(api.camTo(820, 470, 1.1, 1.3));
        var h = [R.housePt[0] + 30, ROAD_Y - 6], d = [R.door80Pt[0] - 8, R.door80Pt[1] - 4];
        var hb = R.houseTop;
        var b0 = api.bubble(hb[0] - 120, hb[1] - 110, 260, 50, [hb[0] - 10, hb[1] - 60, hb[0], hb[1] - 30, hb[0] + 20, hb[1] - 60]);
        api.text(b0.inner, hb[0] - 102, hb[1] - 80, "번호는 있고 HSTS 기록은 지워짐", "s");
        api.pop(tl, b0, "-=.5");
        [R.syn, R.synack, R.ack].forEach(function(e, i){
          var a = i === 1 ? d : h, z = i === 1 ? h : d;
          tl.set(e, {x:a[0], y:a[1], opacity:1});
          api.fly(tl, e, a, z, {duration:1.2, lift:30});
          tl.to(e, {opacity:0, duration:.2});
        });
        tl.call(function(){ R.conn80.classList.add("open"); });
        tl.to(R.conn80, {opacity:1, duration:.5});
        var b = api.bubble(960, 340, 240, 62, [1120, 402, 1170, 450, 1150, 402]);
        api.text(b.inner, 978, 366, "연결됨 — 바로 요청", "t");
        api.text(b.inner, 978, 388, "문지기 · 신분증 · 열쇠 없음", "s");
        api.pop(tl, b, "+=.1");
      },
      /* 2. 엽서가 길을 감 — 다 읽힘 */
      function(tl, api, R){
        tl.add(api.camTo(800, 450, 1.2, 1.2));
        api.clearBubbles(tl, "<");
        var h = [R.housePt[0] + 60, ROAD_Y - 20], m = [800, ROAD_Y - 24], d = [R.door80Pt[0] - 40, R.door80Pt[1] - 20];
        tl.set(R.card, {x:h[0], y:h[1], opacity:1, scale:.9});
        api.fly(tl, R.card, h, m, {duration:1.6, lift:20});
        tl.fromTo(R.bang, {opacity:0, y:6}, {opacity:1, y:0, duration:.35, ease:"back.out(3)"});
        api.showLink(tl, "snoop", R.snoopPt, m, "<", "warn");
        var s = R.snoopPt;
        var b = api.bubble(s[0] + 60, s[1] - 10, 250, 74, [s[0] + 60, s[1] + 14, s[0] + 26, s[1] + 22, s[0] + 60, s[1] + 34]);
        api.text(b.inner, s[0] + 78, s[1] + 18, "경로 · 쿠키 다 보여요", "t", {fill:"#dc2626"});
        api.text(b.inner, s[0] + 78, s[1] + 42, "바꿔치기도 가능", "s");
        api.pop(tl, b, "<");
        api.fly(tl, R.card, m, d, {duration:1.3, lift:20}, "+=1");
        api.hideLinks(tl, ["snoop"], "<");
        tl.to(R.card, {opacity:0, scale:.5, duration:.3});
      },
      /* 3. 301 로 돌려보냄 */
      function(tl, api, R){
        tl.add(api.camTo(900, 450, 1.1, 1.2));
        api.clearBubbles(tl, "<");
        tl.to(R.bang, {opacity:0, duration:.3}, 0);
        var d = [R.door80Pt[0] - 40, R.door80Pt[1] - 20], h = [R.housePt[0] + 70, ROAD_Y - 24];
        var b = api.bubble(1030, 372, 250, 64, [1150, 436, 1185, 450, 1190, 436]);
        api.text(b.inner, 1048, 398, "301 → https 로 다시 오세요", "t");
        api.text(b.inner, 1048, 422, "Location: https://" + SHOP.shortName + "…", "m");
        api.pop(tl, b, "-=.3");
        tl.set(R.card301, {x:d[0], y:d[1], opacity:1, scale:.9});
        api.fly(tl, R.card301, d, h, {duration:2, lift:20});
      },
      /* 4. https 로 다시 → HSTS 를 수첩에 */
      function(tl, api, R){
        tl.add(api.camTo(780, 430, 1.1, 1.2));
        api.clearBubbles(tl, "<");
        tl.to(R.card301, {opacity:0, duration:.3}, 0);
        tl.to(R.conn80, {opacity:.25, duration:.4}, 0);
        tl.call(function(){ R.conn443.classList.add("sealed"); });
        tl.to(R.conn443, {opacity:1, duration:.5});
        [R.keyH, R.keyS].forEach(function(k){ tl.to(k, {opacity:1, duration:.3}, "<"); });
        var d = [R.door443Pt[0] - 10, R.door443Pt[1] - 8], h = [R.housePt[0] + 30, ROAD_Y - 8];
        tl.set(R.resBox, {x:d[0], y:d[1], opacity:1, scale:1.2});
        api.fly(tl, R.resBox, d, h, {duration:1.8, lift:20});
        tl.to(R.resBox, {opacity:0, scale:.5, duration:.3});
        tl.fromTo(R.hsts, {opacity:0, y:10}, {opacity:1, y:0, duration:.5, ease:"back.out(2)"});
        tl.to([R.screen, R.screenTxt], {opacity:1, duration:.4}, "<");
        var b = api.bubble(190, 566, 290, 66, [300, 566, 330, 530, 360, 566]);
        api.text(b.inner, 208, 592, "Strict-Transport-Security", "m", {"font-weight":"700"});
        api.text(b.inner, 208, 616, "다음부턴 길에 나가기 전에 https로", "s");
        api.pop(tl, b, "+=.1");
      }
    ],

    badcert:[
      /* 1. 카페 와이파이 — 엿보는 사람이 ClientHello 를 가로챔 */
      function(tl, api, R){
        tl.add(api.camTo(600, 440, 1.2, 1.2));
        tl.set(R.hsts, {opacity:1}, 0);
        var h = [R.housePt[0] + 30, ROAD_Y - 6], s = [R.snoopPt[0] - 4, R.snoopPt[1] + 4];
        tl.set(R.chello, {x:h[0], y:h[1], opacity:1});
        api.fly(tl, R.chello, h, s, {duration:1.6, lift:30});
        tl.fromTo(R.bang, {opacity:0, y:6}, {opacity:1, y:0, duration:.35, ease:"back.out(3)"});
        var sp = R.snoopPt;
        var b = api.bubble(sp[0] - 30, sp[1] - 160, 290, 70, [sp[0] - 6, sp[1] - 90, sp[0] - 8, sp[1] - 12, sp[0] + 24, sp[1] - 90]);
        api.text(b.inner, sp[0] - 12, sp[1] - 132, "가로챘다 — 내가 " + SHOP.shortName + "!", "t", {fill:"#dc2626"});
        api.text(b.inner, sp[0] - 12, sp[1] - 108, "가게까지 안 보내고 여기서 답할게요", "s");
        api.pop(tl, b, "<");
      },
      /* 2. 가짜 신분증 — 도장이 목록에 없음 */
      function(tl, api, R){
        tl.add(api.camTo(760, 400, 1.05, 1.2));
        api.clearBubbles(tl, "<");
        tl.to([R.chello, R.hsts], {opacity:0, duration:.3}, 0);
        var s = [R.snoopPt[0], R.snoopPt[1] - 30], c = [R.houseTop[0] + 175, R.houseTop[1] + 34];
        tl.set(R.fakeCard, {x:s[0], y:s[1], opacity:0, scale:.5});
        tl.to(R.fakeCard, {opacity:1, scale:.9, duration:.4});
        api.fly(tl, R.fakeCard, s, c, {duration:1.5, lift:40});
        api.showLink(tl, "ca-b", R.caPt, [R.houseTop[0] + 20, R.houseTop[1] - 20], ">", "alt");
        var h = R.houseTop;
        var b = api.bubble(h[0] - 230, h[1] - 206, 310, 128, [h[0] - 20, h[1] - 78, h[0] + 2, h[1] - 40, h[0] + 20, h[1] - 78]);
        api.text(b.inner, h[0] - 212, h[1] - 178, "받은 신분증 확인", "t");
        var c1 = api.text(b.inner, h[0] - 212, h[1] - 153, "이름 " + SHOP.domain, "s");
        var c2 = api.text(b.inner, h[0] - 212, h[1] - 131, "기한 남아 있음", "s");
        var c3 = api.text(b.inner, h[0] - 212, h[1] - 109, "도장 '내가 직접' — 목록에 없음", "s");
        api.pop(tl, b, "<");
        mark(tl, c1, true, "+=.4"); mark(tl, c2, true, "+=.4"); mark(tl, c3, false, "+=.5");
        tl.to(R.fakeCard.bad, {opacity:1, duration:.3});
        var cb = api.bubble(950, 200, 260, 46, [1020, 246, 1060, 266, 1050, 246]);
        api.text(cb.inner, 968, 229, "목록에 있는 도장만 믿어요", "s");
        api.pop(tl, cb, "<");
      },
      /* 3. 진짜 신분증 복사본 — CertificateVerify 서명을 못 만듦 */
      function(tl, api, R){
        tl.add(api.camTo(790, 420, 1.05, 1.2));
        api.clearBubbles(tl, "<");
        api.hideLinks(tl, ["ca-b"], 0);
        tl.to(R.fakeCard, {opacity:0, duration:.3}, 0);
        var k = [R.certPt[0], R.certPt[1] - 10], s = [R.snoopPt[0], R.snoopPt[1] - 30], c = [R.houseTop[0] + 175, R.houseTop[1] + 34];
        tl.set(R.copyCard, {x:k[0], y:k[1], opacity:0, scale:.5});
        tl.to(R.copyCard, {opacity:1, scale:.9, duration:.4});
        api.fly(tl, R.copyCard, k, s, {duration:1.4, lift:70});
        var g = R.guardPt;
        var gb = api.bubble(g[0] - 250, g[1] - 160, 270, 64, [g[0] - 50, g[1] - 96, g[0] - 6, g[1] - 14, g[0] - 22, g[1] - 96]);
        api.text(gb.inner, g[0] - 232, g[1] - 134, "비밀 열쇠는 문지기만", "t");
        api.text(gb.inner, g[0] - 232, g[1] - 110, "privkey.pem 은 가게 밖으로 안 나가요", "s");
        api.pop(tl, gb, "<");
        api.fly(tl, R.copyCard, s, c, {duration:1.3, lift:40}, "+=.3");
        var h = R.houseTop;
        var b = api.bubble(h[0] - 170, h[1] - 184, 370, 106, [h[0] - 20, h[1] - 78, h[0] + 2, h[1] - 40, h[0] + 20, h[1] - 78]);
        api.text(b.inner, h[0] - 152, h[1] - 156, "복사한 진짜 신분증 확인", "t");
        var c1 = api.text(b.inner, h[0] - 152, h[1] - 131, "이름 · 기한 · 도장 모두 진짜", "s");
        var c2 = api.text(b.inner, h[0] - 152, h[1] - 109, "CertificateVerify 서명 — 못 만듦 (decrypt_error)", "s");
        api.pop(tl, b, "<");
        mark(tl, c1, true, "+=.4"); mark(tl, c2, false, "+=.6");
        tl.to(R.copyCard.bad, {opacity:1, duration:.3});
      },
      /* 4. alert 로 연결을 끊고 경고 화면 */
      function(tl, api, R){
        tl.add(api.camTo(560, 450, 1.2, 1.2));
        api.clearBubbles(tl, "<");
        tl.to(R.copyCard, {opacity:0, duration:.3}, 0);
        var h = [R.housePt[0] + 30, ROAD_Y - 6], s = [R.snoopPt[0] - 4, R.snoopPt[1] + 4];
        tl.set(R.alert, {x:h[0], y:h[1], opacity:1});
        api.fly(tl, R.alert, h, s, {duration:1.3, lift:30});
        tl.to([R.alert, R.bang], {opacity:0, duration:.3});
        tl.to(R.warn, {opacity:1, duration:.4});
        var w = R.housePt;
        var b = api.bubble(140, 572, 340, 70, [330, 572, w[0], w[1] + 14, 370, 572]);
        api.text(b.inner, 158, 598, "NET::ERR_CERT_AUTHORITY_INVALID", "m", {"font-weight":"700", fill:"#dc2626"});
        api.text(b.inner, 158, 622, "GET · 쿠키는 한 글자도 안 나갔어요", "s");
        api.pop(tl, b, "<");
      },
      /* 5. 기한이 지난 진짜 신분증 */
      function(tl, api, R){
        tl.add(api.camTo(1160, 440, 1.25, 1.2));
        api.clearBubbles(tl, "<");
        tl.to([R.warn, R.alert, R.bang], {opacity:0, duration:.3}, 0);
        tl.to(R.conn443, {opacity:1, duration:.4});
        tl.to(R.certBad, {opacity:1, duration:.4}, "+=.2");
        var p = R.certPt;
        var b = api.bubble(p[0] + 10, p[1] - 196, 290, 116, [p[0] + 24, p[1] - 80, p[0] + 2, p[1] - 14, p[0] + 54, p[1] - 80]);
        api.text(b.inner, p[0] + 28, p[1] - 168, "신분증 기한 지남", "t", {fill:"#dc2626"});
        api.text(b.inner, p[0] + 28, p[1] - 144, "notAfter 2026-12-30 · 오늘 2027-01-05", "s");
        api.text(b.inner, p[0] + 28, p[1] - 122, "갱신을 잊은 가게 — 공격자는 없음", "s");
        api.text(b.inner, p[0] + 28, p[1] - 99, "NET::ERR_CERT_DATE_INVALID", "m", {"font-weight":"700"});
        api.pop(tl, b, "<");
      },
      /* 6. 이름이 다른 신분증 */
      function(tl, api, R){
        tl.add(api.camTo(790, 420, 1.05, 1.2));
        api.clearBubbles(tl, "<");
        tl.to(R.certBad, {opacity:0, duration:.3}, 0);
        var h = R.houseTop;
        var b = api.bubble(h[0] - 170, h[1] - 150, 320, 64, [h[0] - 20, h[1] - 86, h[0] + 2, h[1] - 40, h[0] + 20, h[1] - 86]);
        api.text(b.inner, h[0] - 152, h[1] - 124, "www." + SHOP.domain, "m", {"font-weight":"700"});
        api.text(b.inner, h[0] - 152, h[1] - 101, "이 이름이 신분증에 있나?", "s");
        api.pop(tl, b, "<");
        tl.call(function(){ R.certBadTxt.textContent = "≠"; });
        tl.to(R.certBad, {opacity:1, duration:.4}, "+=.5");
        var p = R.certPt;
        var b2 = api.bubble(p[0] - 160, p[1] - 206, 310, 116, [p[0] - 6, p[1] - 90, p[0] + 2, p[1] - 14, p[0] + 24, p[1] - 90]);
        api.text(b2.inner, p[0] - 142, p[1] - 178, "신분증 이름 (subjectAltName)", "t");
        api.text(b2.inner, p[0] - 142, p[1] - 154, SHOP.domain + " 뿐", "s");
        api.text(b2.inner, p[0] - 142, p[1] - 132, "✗ www." + SHOP.shortName + "… 은 없음", "s bad");
        api.text(b2.inner, p[0] - 142, p[1] - 109, "NET::ERR_CERT_COMMON_NAME_INVALID", "m", {"font-weight":"700"});
        api.pop(tl, b2, "<");
      },
      /* 7. 정리 — 하나라도 틀리면 끊음 · HSTS 면 계속 버튼 없음 */
      function(tl, api, R){
        tl.add(api.camTo(660, 490, 1.1, 1.2));
        api.clearBubbles(tl, "<");
        tl.to([R.certBad, R.conn443], {opacity:0, duration:.3}, 0);
        tl.to([R.hsts, R.warn], {opacity:1, duration:.4});
        var b = api.bubble(420, 576, 380, 150, [440, 576, R.housePt[0] + 6, R.housePt[1] + 16, 480, 576]);
        api.text(b.inner, 440, 602, "세 가지 확인 — 하나라도 틀리면 끊기", "t");
        api.text(b.inner, 440, 626, "✗ 도장 → ERR_CERT_AUTHORITY_INVALID", "s");
        api.text(b.inner, 440, 648, "✗ 기한 → ERR_CERT_DATE_INVALID", "s");
        api.text(b.inner, 440, 670, "✗ 이름 → ERR_CERT_COMMON_NAME_INVALID", "s");
        api.text(b.inner, 440, 702, "HSTS 가게는 '그래도 계속' 버튼 없음", "t", {fill:"#dc2626"});
        api.pop(tl, b, "<");
      }
    ],

    revisit:[
      /* 1. 30초 뒤 /menu — 열린 연결을 그대로 */
      function(tl, api, R){
        tl.add(api.camTo(800, 440, 1.05, 1.2));
        tl.call(function(){ R.conn443.classList.add("sealed"); }, null, 0);
        tl.set([R.conn443, R.keyH, R.keyS, R.screen, R.screenTxt, R.memo], {opacity:1}, 0);
        var h = [R.housePt[0] + 30, ROAD_Y - 8], d = [R.door443Pt[0] - 10, R.door443Pt[1] - 8];
        var b = api.bubble(830, 398, 290, 64, [900, 462, 930, ROAD_Y - 12, 940, 462]);
        api.text(b.inner, 848, 424, "/menu — 같은 연결 그대로", "t");
        api.text(b.inner, 848, 448, "TCP 악수 0번 · 봉인 0번 (keep-alive)", "s");
        api.pop(tl, b, "+=.2");
        tl.set(R.reqBox, {x:h[0], y:h[1], opacity:1, scale:1.2}, "<");
        api.fly(tl, R.reqBox, h, d, {duration:1.6, lift:20});
        tl.to(R.reqBox, {opacity:0, scale:.5, duration:.3});
        tl.set(R.resBox, {x:d[0], y:d[1], opacity:1, scale:1.2});
        api.fly(tl, R.resBox, d, h, {duration:1.6, lift:20});
        tl.to(R.resBox, {opacity:0, scale:.5, duration:.3});
      },
      /* 2. 조용하면 가게가 연결을 닫음 — 수첩은 남음 */
      function(tl, api, R){
        tl.add(api.camTo(820, 420, 1.05, 1.2));
        api.clearBubbles(tl, "<");
        var dp = R.door443Pt;
        var b = api.bubble(dp[0] - 240, 360, 250, 62, [dp[0] - 40, 422, dp[0] - 6, dp[1] - 34, dp[0] - 14, 422]);
        api.text(b.inner, dp[0] - 222, 386, "75초 조용 → 연결 닫기", "t");
        api.text(b.inner, dp[0] - 222, 408, "세션 열쇠도 함께 버려요", "s");
        api.pop(tl, b, "+=.1");
        tl.to(R.conn443, {opacity:0, duration:1}, "+=.4");
        tl.to([R.keyH, R.keyS], {opacity:0, duration:.6}, "<");
        tl.call(function(){ R.conn443.classList.remove("sealed"); });
        tl.to(R.memo, {scale:1.08, svgOrigin:R.memoPt[0] + " " + R.memoPt[1], duration:.35, yoyo:true, repeat:1, ease:"power1.inOut"});
        var m = R.memoPt;
        var b2 = api.bubble(m[0] - 112, m[1] - 132, 224, 40, null);
        api.text(b2.inner, m[0] - 96, m[1] - 106, "수첩은 그대로 남아요", "s", {"font-weight":"700"});
        api.pop(tl, b2, "<");
      },
      /* 3. 수첩만으로 — HSTS 로 https, 번호도 수첩에서 */
      function(tl, api, R){
        tl.add(api.camTo(520, 420, 1.2, 1.2));
        api.clearBubbles(tl, "<");
        tl.call(function(){ R.memoL[0].setAttribute("class", "memol on"); R.memoL[1].setAttribute("class", "memol on"); }, null, "+=.2");
        var w = R.housePt;
        var b = api.bubble(130, 572, 360, 70, [320, 572, w[0], w[1] + 14, 360, 572]);
        api.text(b.inner, 148, 598, "http:// → https:// (집 안에서 307)", "t");
        api.text(b.inner, 148, 622, "번호도 수첩에서 · 80번 문엔 안 감", "s");
        api.pop(tl, b, "<");
        var m = [R.memoPt[0] - 20, R.memoPt[1] - 4], h = [R.housePt[0] + 30, ROAD_Y - 6];
        tl.set(R.ans, {x:m[0], y:m[1], opacity:0, scale:.4}, "+=.2");
        tl.to(R.ans, {opacity:1, scale:1, duration:.4, ease:"back.out(2)"});
        api.fly(tl, R.ans, m, h, {duration:1.2, lift:30});
        var r = R.resolverPt;
        var rb = api.bubble(r[0] + 44, r[1] + 70, 170, 40, [r[0] + 60, r[1] + 70, r[0] + 30, r[1] + 40, r[0] + 84, r[1] + 70]);
        api.text(rb.inner, r[0] + 60, r[1] + 96, "안내소: 질문 0건", "s", {"font-weight":"700"});
        api.pop(tl, rb, "<");
      },
      /* 4. 닫힌 연결은 다시 — TCP 악수 */
      function(tl, api, R){
        tl.add(api.camTo(820, 470, 1.1, 1.2));
        api.clearBubbles(tl, "<");
        tl.to(R.ans, {opacity:0, duration:.3}, 0);
        var h = [R.housePt[0] + 30, ROAD_Y - 6], d = [R.door443Pt[0] - 8, R.door443Pt[1] - 6];
        [R.syn, R.synack, R.ack].forEach(function(e, i){
          var a = i === 1 ? d : h, z = i === 1 ? h : d;
          tl.set(e, {x:a[0], y:a[1], opacity:1});
          api.fly(tl, e, a, z, {duration:1.1, lift:30});
          tl.to(e, {opacity:0, duration:.2});
        });
        tl.to(R.conn443, {opacity:1, duration:.5});
        var dp = R.door443Pt;
        var b = api.bubble(dp[0] - 230, 350, 250, 62, [dp[0] - 28, 412, dp[0], dp[1] - 76, dp[0] + 12, 412]);
        api.text(b.inner, dp[0] - 212, 376, "새 연결 (포트 54126)", "t");
        api.text(b.inner, dp[0] - 212, 398, "이 한 번의 왕복은 매번 해요", "s");
        api.pop(tl, b, "+=.1");
      },
      /* 5. 세션 티켓(PSK)으로 짧은 봉인 */
      function(tl, api, R){
        tl.add(api.camTo(820, 440, 1.05, 1.0));
        api.clearBubbles(tl, "<");
        tl.call(function(){ R.memoL[2].setAttribute("class", "memol on"); }, null, 0);
        var h = [R.housePt[0] + 30, ROAD_Y - 6], d = [R.guardPt[0] - 6, R.guardPt[1] - 4];
        tl.set(R.chelloP, {x:h[0], y:h[1], opacity:1});
        api.fly(tl, R.chelloP, h, d, {duration:1.6, lift:40});
        tl.to(R.chelloP, {opacity:0, duration:.2});
        tl.set(R.shelloP, {x:d[0], y:d[1], opacity:1});
        api.fly(tl, R.shelloP, d, h, {duration:1.6, lift:40});
        tl.to(R.shelloP, {opacity:0, duration:.2});
        tl.addLabel("keys", "+=.1");
        [R.keyH, R.keyS].forEach(function(k){ tl.to(k, {opacity:1, duration:.3}, "keys"); });
        tl.call(function(){ R.conn443.classList.add("sealed"); }, null, "keys");
        tl.fromTo(R.conn443, {opacity:.4}, {opacity:1, duration:.4}, "keys");
        var p = R.certPt;
        var b = api.bubble(p[0] - 150, p[1] - 176, 270, 64, [p[0] + 4, p[1] - 112, p[0] + 2, p[1] - 14, p[0] + 30, p[1] - 112]);
        api.text(b.inner, p[0] - 132, p[1] - 150, "신분증 · 서명 생략", "t", {fill:"#16a34a"});
        api.text(b.inner, p[0] - 132, p[1] - 126, "티켓 = 이미 확인한 손님 표시", "s");
        api.pop(tl, b, "keys");
        var b3 = api.bubble(560, 600, 400, 50, null);
        api.text(b3.inner, 580, 631, "0-RTT: 첫 상자를 ClientHello 와 함께 (켠 가게만)", "s", {"font-weight":"700"});
        api.pop(tl, b3, "keys+=.4");
      },
      /* 6. ETag 로 물어 304 — 사본으로 화면 */
      function(tl, api, R){
        tl.add(api.camTo(840, 440, 1.1, 1.2));
        api.clearBubbles(tl, "<");
        tl.call(function(){ R.memoL[3].setAttribute("class", "memol on"); }, null, 0);
        var h = [R.housePt[0] + 30, ROAD_Y - 8], d = [R.door443Pt[0] - 10, R.door443Pt[1] - 8];
        tl.set(R.reqBox, {x:h[0], y:h[1], opacity:1, scale:1.2});
        api.fly(tl, R.reqBox, h, d, {duration:1.8, lift:20});
        tl.to(R.reqBox, {opacity:0, scale:.5, duration:.3});
        tl.to(R.shopLight, {opacity:1, duration:.4});
        var p = R.shopPt;
        var b = api.bubble(p[0] - 110, p[1] - 140, 260, 76, [p[0] + 10, p[1] - 64, p[0] + 20, p[1] - 30, p[0] + 40, p[1] - 64]);
        api.text(b.inner, p[0] - 92, p[1] - 112, "If-None-Match 일치 → 304", "t", {fill:"#16a34a"});
        api.text(b.inner, p[0] - 92, p[1] - 88, "본문은 안 보내요 (0바이트)", "s");
        api.pop(tl, b, "<");
        tl.set(R.r304, {x:d[0], y:d[1], opacity:1}, "+=.3");
        api.fly(tl, R.r304, d, h, {duration:1.8, lift:30});
        tl.to(R.r304, {opacity:0, duration:.3});
        tl.to([R.screen, R.screenTxt], {opacity:1, duration:.4}, "<");
        var w = R.housePt;
        var b2 = api.bubble(205, 572, 340, 70, [320, 572, w[0], w[1] + 14, 360, 572]);
        api.text(b2.inner, 223, 598, "사본으로 화면 그리기", "t");
        api.text(b2.inner, 223, 622, "style.css 는 max-age 안 — 묻지도 않음", "s");
        api.pop(tl, b2, "<");
      },
      /* 7. 첫 방문과 비교 */
      function(tl, api, R){
        tl.add(api.camTo(660, 490, 1.1, 1.2));
        api.clearBubbles(tl, "<");
        tl.to(R.shopLight, {opacity:0, duration:.3}, 0);
        tl.call(function(){ R.memoL.forEach(function(t){ t.setAttribute("class", "memol on"); }); }, null, 0);
        var b = api.bubble(420, 560, 420, 170, [440, 560, R.housePt[0] + 6, R.housePt[1] + 16, 480, 560]);
        api.text(b.inner, 440, 586, "첫 방문 → 4분 뒤 다시", "t");
        api.text(b.inner, 440, 610, "http→https  80번 문 + 301 → 집 안 (HSTS)", "s");
        api.text(b.inner, 440, 632, "DNS  안내소·관청 3곳 → 수첩 (TTL)", "s");
        api.text(b.inner, 440, 654, "TCP  악수 → 다시 악수 (생략 불가)", "s");
        api.text(b.inner, 440, 676, "TLS  신분증 확인 → 세션 티켓 (PSK)", "s");
        api.text(b.inner, 440, 698, "HTTP  본문 5123바이트 → 304 (0바이트)", "s");
        api.pop(tl, b, "<");
      }
    ]
  }
};
})();
