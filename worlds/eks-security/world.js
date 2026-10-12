/* EKS 보안 공항 — 지도 그리기 · 배경 움직임 · 기준 상태 · 사건별 장면 움직임 */
(function(){
"use strict";
var ISO = window.ISO;
var iso = ISO.iso, isoL = ISO.isoL, el = ISO.el, box = ISO.box, flat = ISO.flat, faceR = ISO.faceR, faceL = ISO.faceL, C = ISO.C, act = ISO.act;

var SHOP = window.SHARED.shops["shop-web"];
var GUEST = window.SHARED.guests["guest-browser"];
var INGRESS_IP = window.SHARED.publicIps["ops-ingress"];

/* namespace 색 — 차양 색이 곧 소속 구역 */
var NS = {shop:["#ff9f7a","#e8603f","#cf5133"], order:["#6fd3c4","#3ea597","#348d81"], sys:["#c3ccd6","#9aa6b2","#7a8794"]};

/* 가게(Pod) 하나 — 차양 색이 namespace. 경비원(사이드카)이 앞에 선다 */
function shop(parent, key, name, gx, gy, z, col, sign, guard){
  var g = ISO.act(parent, key, name);
  box(g, iso, gx, gy, z, 50, 50, 34, C.wall);
  box(g, iso, gx - 4, gy - 4, z + 34, 58, 58, 6, col);
  faceR(g, gx + 50, gy + 12, z + 4, 26, 22, "#8cc0ee");
  faceL(g, gx + 10, gy + 50, z, 30, 24, "#2e4a6b");
  var t = iso(gx + 25, gy + 25, z + 44);
  ISO.text(g, t[0], t[1], sign, "", {"text-anchor":"middle", "font-size":"11", "font-weight":"800", fill:"#1e293b", "font-family":"monospace"});
  var out = {front:iso(gx + 80, gy + 36, z), pt:iso(gx + 25, gy + 25, z + 40)};
  if(guard){
    var gp = iso(gx + 62, gy + 4, z);
    var gg = act(parent, "sidecar", "가게 경비원");
    ISO.person(gg, gp[0], gp[1], {body:"#1e3a8a", hair:"#111827"});
    var b = el("rect", {x:gp[0] - 4, y:gp[1] - 33, width:8, height:9, rx:2, fill:"#facc15", stroke:"#a16207", "stroke-width":1}, gg);
    out.guard = [gp[0], gp[1] - 40];
    out.guardBadge = b;
  }
  return out;
}

/* 작은 집 */
function house(parent, gx, gy, roof){
  box(parent, iso, gx, gy, 0, 40, 34, 28, C.wall);
  box(parent, iso, gx - 3, gy - 3, 28, 46, 40, 6, roof);
  faceR(parent, gx + 40, gy + 10, 8, 14, 12, "#8cc0ee");
}

/* 사람 하나를 담은 움직이는 묶음 — GSAP 이 x·y 를 직접 움직인다 */
function walker(parent, body, withBag){
  var g = ISO.act(parent, "user", GUEST.name, "nohit");
  ISO.person(g, 0, 0, {body:body});
  var R = {g:g};
  if(withBag){
    var bag = el("g", {transform:"translate(10,-14)"}, g);
    el("rect", {x:0, y:0, width:18, height:14, rx:3, fill:"#7c3aed", stroke:"#4c1d95", "stroke-width":1.2}, bag);
    el("rect", {x:6, y:-4, width:6, height:5, rx:1.5, fill:"none", stroke:"#4c1d95", "stroke-width":1.4}, bag);
    R.lock = el("g", {}, g);
    el("rect", {x:12, y:-38, width:14, height:11, rx:2, fill:"#facc15", stroke:"#a16207", "stroke-width":1.2}, R.lock);
    el("path", {d:"M15,-38 v-4 a4,4 0 0 1 8,0 v4", fill:"none", stroke:"#a16207", "stroke-width":2}, R.lock);
    R.open = el("g", {opacity:0}, g);
    el("rect", {x:12, y:-38, width:14, height:11, rx:2, fill:"#bbf7d0", stroke:"#15803d", "stroke-width":1.2}, R.open);
    el("path", {d:"M15,-38 v-4 a4,4 0 0 1 8,0", fill:"none", stroke:"#15803d", "stroke-width":2}, R.open);
  }
  return R;
}

/* 기록 종이 — 마지막 장면에서 상황실로 모인다 */
function logPaper(parent){
  var g = el("g", {opacity:0}, parent);
  el("rect", {x:-9, y:-11, width:18, height:22, rx:2, fill:"#fff", stroke:"#334155", "stroke-width":1.3}, g);
  [-5, 0, 5].forEach(function(y){ el("line", {x1:-5, y1:y, x2:5, y2:y, stroke:"#94a3b8", "stroke-width":1.5}, g); });
  return g;
}

var PT = {};   /* build 에서 채우는 지도 위 점들 */

/* 말풍선 — 글 줄 목록으로 만들고, 꼬리는 target 쪽 가장자리에서 뻗는다 */
function say(tl, api, x, y, w, lines, target, at){
  var h = 22 + lines.length * 24;
  var tail = null;
  if(target){
    var tx = target[0], ty = target[1], cx = Math.max(x + 24, Math.min(x + w - 24, tx));
    if(ty > y + h) tail = [cx - 12, y + h - 2, tx, ty, cx + 12, y + h - 2];
    else if(ty < y) tail = [cx - 12, y + 2, tx, ty, cx + 12, y + 2];
    else { var cy = Math.max(y + 20, Math.min(y + h - 20, ty)), ex = tx > x + w ? x + w - 2 : x + 2; tail = [ex, cy - 12, tx, ty, ex, cy + 12]; }
  }
  var b = api.bubble(x, y, w, h, tail);
  lines.forEach(function(l, i){ api.text(b.inner, x + 18, y + 30 + i * 24, l[0], l[1] || "s", l[2]); });
  api.pop(tl, b, at);
  return b;
}
function xMark(parent){
  var g = el("g", {opacity:0}, parent);
  el("circle", {cx:0, cy:0, r:15, fill:"#fee2e2", stroke:"#dc2626", "stroke-width":3}, g);
  el("path", {d:"M-6,-6 L6,6 M6,-6 L-6,6", stroke:"#dc2626", "stroke-width":3.5, "stroke-linecap":"round"}, g);
  return g;
}
function card(parent, fill, txt){
  var g = el("g", {opacity:0}, parent);
  el("rect", {x:-16, y:-11, width:32, height:22, rx:4, fill:fill, stroke:"#334155", "stroke-width":1.4}, g);
  ISO.text(g, 0, 4, txt, "", {"text-anchor":"middle", "font-size":"10", "font-weight":"800", fill:"#1e293b"});
  return g;
}
function crate(parent){
  var g = el("g", {opacity:0}, parent);
  box(g, isoL, -12, -9, 0, 24, 18, 18, ["#ffd8c9","#ffb59a","#f29a7a"]);
  g.seal = el("circle", {cx:10, cy:-14, r:6, fill:"#16a34a", stroke:"#fff", "stroke-width":1.5, opacity:0}, g);
  return g;
}

window.WORLD = {
  home:{x:930, y:455, s:1.1},

  /* ── 지도 그리기 (한 번) ───────────────────── */
  build:function(api){
    var L = api.L, R = {};
    var p, q;

    /* 가장자리 바다 띠 — 공항이 운영 항만(ops) 해안에 있다는 표시 */
    flat(L.base, -600, 660, -26, 1800, 700, {fill:"#7cc6d8"});
    flat(L.base, 910, -600, -26, 700, 1960, {fill:"#7cc6d8"});
    for(var i = 0; i < 18; i++){
      var w = iso(i % 2 ? 960 + (i * 53) % 160 : -300 + (i * 97) % 1250, i % 2 ? -200 + (i * 131) % 900 : 720 + (i * 61) % 180, -26);
      el("path", {"class":"wave", d:"M" + w[0] + "," + w[1] + " q8,-6 16,0 q8,-6 16,0", fill:"none", stroke:"rgba(255,255,255,.55)", "stroke-width":2, "stroke-linecap":"round"}, L.base);
    }

    /* AWS 구역 (울타리 밖, AWS 가 운영) */
    box(L.ground, iso, 140, -120, -18, 660, 225, 18, ["#e7e3f4","#cbc4e3","#b9b0d8"]);
    flat(L.ground, 150, -110, 0.3, 640, 205, {fill:"none", stroke:"#9b8fd0", "stroke-width":2, "stroke-dasharray":"8 6"});

    /* 바깥 도시 (인터넷) */
    box(L.ground, iso, -40, 320, -18, 250, 270, 18, C.grass);
    [[90,330],[20,520],[180,540],[-20,400]].forEach(function(t){
      var c = iso(t[0], t[1], 0); el("circle", {cx:c[0], cy:c[1] - 8, r:9, fill:"#7fb862"}, L.ground); el("circle", {cx:c[0] + 8, cy:c[1] - 4, r:7, fill:"#93c977"}, L.ground);
    });

    /* 공항 땅 (VPC) */
    var vpc = act(L.ground, "vpc", "공항 울타리");
    box(vpc, iso, 300, 140, -24, 570, 470, 24, C.conc);
    flat(vpc, 300, 140, 0.4, 92, 470, {fill:"#dbeafe"});                 /* 퍼블릭 서브넷 */
    flat(vpc, 800, 140, 0.4, 70, 470, {fill:"#ede9fe"});                 /* DB 서브넷 */
    flat(vpc, 300, 140, 0.6, 570, 470, {fill:"none", stroke:"#475569", "stroke-width":2.4, "stroke-dasharray":"3 7"});   /* 울타리 */
    [[300,140],[870,140],[300,610],[870,610],[585,140],[300,375]].forEach(function(f){
      var a = iso(f[0], f[1], 0), b = iso(f[0], f[1], 18);
      el("line", {x1:a[0], y1:a[1], x2:b[0], y2:b[1], stroke:"#475569", "stroke-width":2.4}, vpc);
    });

    /* 길: 도시 → 정문 → 터미널 */
    flat(L.ground, 200, 432, 0.5, 210, 36, {fill:"#cbd2da"});
    var r1 = iso(210, 450, 0.6), r2 = iso(400, 450, 0.6);
    el("line", {x1:r1[0], y1:r1[1], x2:r2[0], y2:r2[1], stroke:"#fff", "stroke-width":2, "stroke-dasharray":"12 10"}, L.ground);

    /* 손님의 집들 */
    house(L.back, 0, 340, C.roofR);
    house(L.back, 140, 360, C.roofB);
    house(L.mid, -10, 470, C.roofB);

    /* 안내 전광판 (Route 53) */
    var sign = act(L.mid, "route53", "안내 전광판");
    var sp = iso(70, 400, 0);
    el("rect", {x:sp[0] - 3, y:sp[1] - 92, width:6, height:92, fill:"#475569"}, sign);
    el("rect", {x:sp[0] - 74, y:sp[1] - 150, width:148, height:62, rx:8, fill:"#1e293b", stroke:"#0f172a", "stroke-width":2}, sign);
    ISO.text(sign, sp[0], sp[1] - 128, SHOP.domain, "", {"text-anchor":"middle", "font-size":"12", "font-weight":"700", fill:"#fde68a", "font-family":"monospace"});
    R.signAns = ISO.text(sign, sp[0], sp[1] - 106, "→ 정문", "", {"text-anchor":"middle", "font-size":"13", "font-weight":"700", fill:"#67e8f9", "font-family":"monospace"});
    PT.sign = [sp[0], sp[1] - 120];

    /* 정문 (ALB) — 기둥 둘과 지붕보 */
    var gate = act(L.mid, "alb", "정문");
    box(gate, iso, 352, 392, 0, 26, 26, 86, C.navy);
    box(gate, iso, 352, 486, 0, 26, 26, 86, C.navy);
    box(gate, iso, 348, 388, 86, 34, 128, 16, C.roofB);
    q = iso(365, 452, 104);
    ISO.text(gate, q[0] + 12, q[1] - 4, "443", "", {"text-anchor":"middle", "font-size":"12", "font-weight":"800", fill:"#fff", "font-family":"monospace"});
    PT.gate = iso(365, 452, 0);
    PT.gateTop = iso(365, 452, 110);
    PT.gateBefore = iso(318, 452, 0);
    PT.gateAfter = iso(392, 452, 0);

    /* 보안검색대 (WAF) — 정문 바로 뒤에 붙은 문틀 */
    var waf = act(L.mid, "waf", "보안검색대");
    box(waf, iso, 404, 426, 0, 12, 10, 52, C.gray);
    box(waf, iso, 404, 470, 0, 12, 10, 52, C.gray);
    box(waf, iso, 402, 424, 52, 16, 58, 8, C.gray);
    var w1 = iso(410, 436, 50), w2 = iso(410, 470, 50);
    R.wafLight = el("line", {x1:w1[0], y1:w1[1], x2:w2[0], y2:w2[1], stroke:"#94a3b8", "stroke-width":5, "stroke-linecap":"round"}, waf);
    var w3 = iso(410, 436, 4), w4 = iso(410, 470, 4);
    R.wafCurtain = el("polygon", {points:[w1, w2, w4, w3].map(function(a){ return a[0] + "," + a[1]; }).join(" "), fill:"#94a3b8", opacity:.12}, waf);
    PT.waf = iso(412, 452, 0);
    PT.wafTop = iso(410, 452, 62);

    /* 터미널 (Worker Node) 두 동 */
    R.nodes = [];
    [[440, "1", "ip-10-0-12-7"], [640, "2", "ip-10-0-22-9"]].forEach(function(n){
      var g0 = n[0];
      var tm = act(L.back, "node", "터미널");
      box(tm, iso, g0, 290, 0, 150, 280, 8, C.white);
      box(tm, iso, g0, 290, 8, 150, 26, 54, C.wall);
      for(var k = 0; k < 4; k++) faceL(tm, g0 + 10 + k * 34, 316, 26, 22, 18, "#8cc0ee");
      box(tm, iso, g0 - 4, 286, 62, 158, 34, 7, C.roofB);
      var lp = iso(g0, 570, 0);   /* 왼쪽 앞 모서리 */
      api.label(lp[0] - 20, lp[1] + 26, "터미널 " + n[1], n[2], true);
      R.nodes.push(tm);
    });

    /* 가게(Pod)들 — 터미널 1: 안내 데스크 · 쇼핑 가게 / 터미널 2: 쇼핑 가게 · 주문 가게 */
    var desk = shop(L.mid, "ingress", "안내 데스크", 470, 336, 8, NS.sys, "INGRESS", false);
    var dp = iso(520, 360, 8);
    ISO.person(act(L.mid, "ingress", "안내 데스크"), dp[0], dp[1], {body:"#64748b", clip:true});
    PT.desk = desk.front; PT.deskPt = [dp[0], dp[1] - 50];
    var f1 = shop(L.mid, "front", "쇼핑 가게", 470, 426, 8, NS.shop, "shop-front", true);
    var f2 = shop(L.mid, "front", "쇼핑 가게", 670, 336, 8, NS.shop, "shop-front", true);
    var od = shop(L.mid, "order", "주문 가게", 670, 426, 8, NS.order, "order-api", true);
    PT.front = f1.front; PT.frontPt = f1.pt; PT.frontGuard = f1.guard;
    PT.orderGuard = od.guard; PT.orderPt = od.pt;
    R.orderBadge = od.guardBadge; R.frontBadge = f1.guardBadge;

    /* 기록 금고 (RDS) + 문지기 (Security Group) */
    var vault = act(L.mid, "rds", "기록 금고");
    box(vault, iso, 808, 250, 0, 46, 74, 56, C.stone);
    var vd = iso(831, 324, 26);
    el("ellipse", {cx:vd[0], cy:vd[1], rx:12, ry:15, fill:"#e0b44c", stroke:"#a77d22", "stroke-width":2.5}, vault);
    el("circle", {cx:vd[0], cy:vd[1], r:4, fill:"#7a5a14"}, vault);
    var kp = iso(831, 287, 62);
    ISO.text(vault, kp[0], kp[1], "🔑 KMS", "", {"text-anchor":"middle", "font-size":"12", "font-weight":"800", fill:"#1e293b"});
    R.vaultGlow = el("circle", {cx:vd[0], cy:vd[1], r:42, fill:"url(#glow)", opacity:0}, vault);
    PT.vault = [vd[0], vd[1]];
    var sgp = iso(800, 350, 0);
    var sg = act(L.mid, "sg", "금고 문지기");
    ISO.person(sg, sgp[0], sgp[1], {hard:true, body:"#b45309", clip:true});
    PT.sg = [sgp[0], sgp[1] - 50];
    R.sgBang = ISO.bang(sg, sgp[0] + 14, sgp[1] - 72);

    /* AWS 구역 건물들 */
    /* 출입증 발급소 (IAM) */
    var iam = act(L.back, "iam", "출입증 발급소");
    box(iam, iso, 210, -40, 0, 80, 56, 44, C.wall);
    box(iam, iso, 206, -44, 44, 88, 64, 7, C.purple);
    faceL(iam, 230, 16, 0, 22, 30, "#2e4a6b");
    q = iso(290, -12, 26); el("rect", {x:q[0] + 4, y:q[1] - 12, width:22, height:15, rx:3, fill:"#facc15", stroke:"#a16207"}, iam);

    /* 관제탑 (EKS Control Plane) */
    var tower = act(L.back, "cp", "관제탑");
    box(tower, iso, 380, -50, 0, 70, 70, 20, C.conc);
    box(tower, iso, 400, -30, 20, 30, 30, 120, C.white);
    box(tower, iso, 388, -42, 140, 54, 54, 34, C.glass);
    box(tower, iso, 384, -46, 174, 62, 62, 7, C.navy);
    var ra = iso(415, -15, 181);
    R.radar = el("g", {transform:"translate(" + ra[0] + "," + (ra[1] - 6) + ")"}, tower);
    el("rect", {x:-16, y:-3, width:32, height:6, rx:3, fill:"#334155"}, R.radar);
    PT.tower = iso(415, -15, 150);

    /* 보안 상황실 (CloudWatch · CloudTrail · GuardDuty) */
    var watch = act(L.back, "watch", "보안 상황실");
    box(watch, iso, 560, -90, 0, 90, 64, 50, C.wall);
    box(watch, iso, 556, -94, 50, 98, 72, 7, C.navy);
    for(var m = 0; m < 3; m++) faceR(watch, 650, -80 + m * 18, 18, 14, 16, "#86efac");
    var cam = iso(570, -30, 0);
    el("rect", {x:cam[0] - 2.5, y:cam[1] - 80, width:5, height:80, fill:"#475569"}, watch);
    R.cctv = el("g", {transform:"translate(" + cam[0] + "," + (cam[1] - 80) + ")"}, watch);
    el("rect", {x:-4, y:-7, width:24, height:12, rx:3, fill:"#e2e8f0", stroke:"#475569", "stroke-width":1.5}, R.cctv);
    el("circle", {cx:18, cy:-1, r:3, fill:"#ef4444"}, R.cctv);
    PT.watch = iso(605, -58, 60);

    /* 열쇠 보관함 (Secrets Manager) */
    var sec = act(L.mid, "secrets", "열쇠 보관함");
    box(sec, iso, 700, -20, 0, 44, 44, 40, C.gold);
    var sk = iso(744, 2, 22);
    ISO.text(sec, sk[0] + 8, sk[1] + 4, "🔑", "", {"font-size":"15"});

    /* 짐 창고 (S3) */
    var s3 = act(L.mid, "s3", "짐 창고");
    box(s3, iso, 640, 40, 0, 76, 50, 42, C.green);
    box(s3, iso, 636, 36, 42, 84, 58, 6, ["#15803d","#166534","#14532d"]);
    faceL(s3, 660, 90, 0, 28, 26, "#14532d");

    /* 개발 사무소 — 운영자 · 배포 로봇(CI/CD) */
    box(L.ground, iso, 40, 120, -14, 125, 105, 14, C.grass);
    var dev = act(L.back, "ops", "운영자");
    box(dev, iso, 52, 128, 0, 56, 46, 40, C.wall);
    box(dev, iso, 48, 124, 40, 64, 54, 6, C.roofR);
    faceR(dev, 108, 138, 12, 18, 16, "#8cc0ee");
    var opp = iso(92, 205, 0);
    ISO.person(dev, opp[0], opp[1], {body:"#0ea5e9", clip:true});
    PT.ops = [opp[0], opp[1] - 50];
    var ci = act(L.mid, "ci", "배포 로봇");
    var cip = iso(142, 196, 0);
    ISO.robot(el("g", {transform:"translate(" + cip[0] + "," + cip[1] + ")"}, ci), "#f59e0b");
    PT.ci = [cip[0], cip[1] - 60];

    /* 이미지 창고 (ECR) */
    var ecr = act(L.mid, "ecr", "이미지 창고");
    box(ecr, iso, 480, 30, 0, 64, 50, 34, C.coral);
    box(ecr, iso, 476, 26, 34, 72, 58, 6, ["#c2410c","#9a3412","#7c2d12"]);
    faceL(ecr, 492, 80, 0, 26, 24, "#7c2d12");
    var eg = iso(512, 55, 40);
    R.ecrGlow = el("circle", {cx:eg[0], cy:eg[1], r:46, fill:"url(#glow)", opacity:0}, ecr);
    PT.ecr = [eg[0], eg[1] - 6];

    /* 규칙 검사관 (Admission · Pod Security) — 관제탑 앞 */
    var psa = act(L.mid, "psa", "규칙 검사관");
    var pp = iso(372, 36, 0);
    ISO.person(psa, pp[0], pp[1], {body:"#be123c", clip:true});
    PT.psa = [pp[0], pp[1] - 50];

    /* 구역 칸막이 (NetworkPolicy) — 터미널 1 의 my-shop 가게 옆 */
    var np = act(L.mid, "netpol", "구역 칸막이");
    var n1 = iso(578, 396, 8), n2 = iso(578, 500, 8), n3 = iso(578, 500, 50), n4 = iso(578, 396, 50);
    R.wall = el("polygon", {points:[n1, n2, n3, n4].map(function(a){ return a[0] + "," + a[1]; }).join(" "), fill:"#fb923c", opacity:.22, stroke:"#ea580c", "stroke-width":2, "stroke-dasharray":"6 4"}, np);
    PT.wall = iso(578, 448, 30);

    /* 뒷문 (VPC 엔드포인트) — 울타리 위쪽 가장자리 */
    var ep = act(L.mid, "vpc", "공항 울타리");
    box(ep, iso, 690, 128, 0, 34, 22, 30, C.purple);
    faceL(ep, 698, 150, 0, 16, 20, "#3b0764");
    PT.ep = iso(707, 139, 36);

    /* 노드 출입증 함 (IMDS) — 터미널 1 건물 끝 */
    faceR(R.nodes[0], 590, 296, 24, 18, 16, "#facc15");
    PT.imds = iso(590, 305, 32);

    /* 상황실 경보등 */
    var al = iso(605, -58, 64);
    R.alarm = el("circle", {cx:al[0], cy:al[1] - 6, r:7, fill:"#94a3b8", stroke:"#334155", "stroke-width":1.5}, watch);

    PT.iam = iso(250, -12, 50);
    PT.secrets = iso(722, 2, 44);
    PT.s3 = iso(678, 65, 48);
    PT.towerDoor = iso(415, 20, 30);
    PT.front2Pt = f2.pt;

    /* 라벨 */
    p = iso(140, 580, 0); api.label(p[0] + 40, p[1] + 28, "인터넷", "Internet", true);
    p = iso(300, 600, 0); api.label(p[0] - 20, p[1] + 40, "공항 울타리", "VPC", true);
    p = iso(140, -120, 0); api.label(p[0], p[1] - 22, "AWS 구역", "AWS 관리 서비스", true);
    p = iso(100, 225, 0); api.label(p[0] - 30, p[1] + 30, "개발 사무소", "운영자 · CI/CD", true);
    api.label(cip[0] + 70, cip[1] - 20, "배포 로봇", "CI/CD");
    q = iso(480, 80, 0); api.label(q[0] - 70, q[1] - 10, "이미지 창고", "ECR");
    api.label(pp[0] - 76, pp[1] + 6, "규칙 검사관", "Admission");
    api.label(n1[0] + 40, n1[1] + 8, "구역 칸막이", "NetworkPolicy");
    q = iso(724, 128, 30); api.label(q[0] + 80, q[1] + 22, "뒷문", "VPC Endpoint");
    api.label(sp[0], sp[1] - 172, "안내 전광판", "Route 53");
    api.label(PT.gateTop[0] - 120, PT.gateTop[1] + 10, "정문", "ALB");
    api.label(PT.wafTop[0] - 20, PT.wafTop[1] + 106, "보안검색대", "WAF");
    q = iso(470, 336, 48); api.label(q[0] - 10, q[1] - 34, "안내 데스크", "Ingress Controller");
    api.label(f1.front[0] + 30, f1.front[1] + 26, "쇼핑 가게", "shop-front Pod");
    api.label(od.front[0] + 44, od.front[1] + 26, "주문 가게", "order-api Pod");
    q = iso(808, 320, 56); api.label(q[0] + 96, q[1] - 30, "기록 금고", "RDS");
    api.label(sgp[0] + 6, sgp[1] + 22, "금고 문지기", "Security Group");
    q = iso(250, 16, 50); api.label(q[0] - 70, q[1] - 30, "출입증 발급소", "IAM");
    q = iso(415, -15, 190); api.label(q[0] + 100, q[1] + 60, "관제탑", "EKS Control Plane");
    q = iso(605, -26, 60); api.label(q[0] + 70, q[1] - 34, "보안 상황실", "CloudWatch·CloudTrail");
    q = iso(722, 2, 40); api.label(q[0] + 70, q[1] - 22, "열쇠 보관함", "Secrets Manager");
    q = iso(678, 65, 48); api.label(q[0] - 40, q[1] - 46, "짐 창고", "S3");
    q = iso(330, 230, 0); api.label(q[0] - 20, q[1] + 10, "퍼블릭 서브넷", "Public Subnet");

    /* 구름 · 비행기 */
    var clouds = el("g", {opacity:.85}, L.labels);
    [[250,120],[620,90],[1500,180]].forEach(function(c){
      var g = el("g", {"class":"cloud", transform:"translate(" + c[0] + "," + c[1] + ")"}, clouds);
      el("ellipse", {cx:0, cy:0, rx:46, ry:16, fill:"#fff"}, g);
      el("ellipse", {cx:-24, cy:6, rx:30, ry:12, fill:"#fff"}, g);
      el("ellipse", {cx:26, cy:5, rx:32, ry:12, fill:"#fff"}, g);
    });
    R.plane = el("g", {}, L.labels);
    el("path", {d:"M0,0 L34,-4 L40,0 L34,4 Z", fill:"#f8fafc", stroke:"#64748b", "stroke-width":1.2}, R.plane);
    el("path", {d:"M16,-2 L8,-14 L13,-14 L24,-2 Z M16,2 L8,14 L13,14 L24,2 Z", fill:"#cbd5e1", stroke:"#64748b", "stroke-width":1}, R.plane);

    /* 움직이는 것들 */
    R.pax = walker(L.fx, "#7c3aed", true);
    R.note = ISO.paper(L.fx, "");
    R.query = ISO.paper(L.fx, "SQL");
    R.logs = [0,1,2,3].map(function(){ return logPaper(L.fx); });
    PT.user = iso(110, 450, 0);
    R.card = card(L.fx, "#fde68a", "토큰");
    R.pass = card(L.fx, "#86efac", "1시간");
    R.key = card(L.fx, "#fcd34d", "🔑");
    R.req = ISO.paper(L.fx, "");
    R.crates = [crate(L.fx), crate(L.fx), crate(L.fx)];
    R.xs = [xMark(L.fx), xMark(L.fx), xMark(L.fx)];
    R.verTags = [PT.frontPt, PT.front2Pt].map(function(p){
      var g = el("g", {"class":"tag-dark", opacity:0, transform:"translate(" + p[0] + "," + (p[1] - 34) + ")"}, L.fx);
      el("rect", {x:-30, y:-11, width:60, height:22, rx:11}, g);
      ISO.text(g, 0, 1, "1.5.0", "", {"text-anchor":"middle", "dominant-baseline":"central"});
      return g;
    });
    R.attacker = ISO.act(L.fx, "attacker", "침입자", "nohit");
    el("circle", {cx:0, cy:-26, r:30, fill:"rgba(239,68,68,.12)", stroke:"#ef4444", "stroke-width":3, "stroke-dasharray":"5 4"}, R.attacker);
    ISO.person(R.attacker, 0, 0, {body:"#111827", hair:"#111827"});
    PT.atk = iso(530, 492, 8);
    return R;
  },

  /* ── 배경 움직임 ── */
  ambient:function(api, R){
    gsap.to(R.radar, {scaleX:-1, duration:1.6, yoyo:true, repeat:-1, ease:"sine.inOut"});
    gsap.to(R.cctv, {rotation:-28, duration:3, yoyo:true, repeat:-1, ease:"sine.inOut", transformOrigin:"0% 50%"});
    var w = document.getElementById("world");
    gsap.to(w.querySelectorAll(".cloud"), {x:"+=70", duration:18, yoyo:true, repeat:-1, ease:"sine.inOut", stagger:3});
    gsap.to(w.querySelectorAll(".bob"), {y:-1.6, duration:.9, yoyo:true, repeat:-1, ease:"sine.inOut", stagger:{each:.3, from:"random"}});
    gsap.fromTo(R.plane, {x:-120, y:260}, {x:1800, y:30, duration:26, repeat:-1, repeatDelay:4, ease:"none"});
  },

  /* ── 기준 상태 ── */
  reset:function(api, R){
    gsap.killTweensOf([R.pax.g, R.note, R.query, R.pax.lock, R.pax.open, R.wafLight, R.wafCurtain, R.vaultGlow, R.sgBang, R.signAns].concat(R.logs));
    gsap.set(R.pax.g, {x:PT.user[0], y:PT.user[1], opacity:1});
    gsap.set(R.pax.lock, {opacity:1}); gsap.set(R.pax.open, {opacity:0});
    gsap.set([R.note, R.query], {opacity:0, x:0, y:0, scale:1});
    gsap.set([R.note.seal, R.query.seal], {opacity:0});
    R.logs.forEach(function(l){ gsap.set(l, {opacity:0, x:0, y:0, scale:1}); });
    gsap.set(R.wafLight, {attr:{stroke:"#94a3b8"}}); gsap.set(R.wafCurtain, {attr:{fill:"#94a3b8"}, opacity:.12});
    gsap.set(R.vaultGlow, {opacity:0}); gsap.set(R.sgBang, {opacity:0});
    gsap.set(R.signAns, {attr:{fill:"#67e8f9"}});
    var mv = [R.card, R.pass, R.key, R.req, R.attacker].concat(R.crates, R.xs);
    gsap.killTweensOf(mv.concat([R.wall, R.alarm, R.ecrGlow], R.verTags));
    gsap.set(mv, {opacity:0, x:0, y:0, scale:1});
    gsap.set(R.req.seal, {opacity:0});
    R.crates.forEach(function(c){ gsap.set(c.seal, {opacity:0}); });
    gsap.set(R.verTags, {opacity:0});
    gsap.set(R.wall, {opacity:.22, attr:{fill:"#fb923c"}});
    gsap.set(R.alarm, {attr:{fill:"#94a3b8"}});
    gsap.set(R.ecrGlow, {opacity:0});
  },

  /* ── 사건별 장면 — content.js 의 beats 와 개수·순서가 같다 ── */
  scenes:{
    request:[
      /* 1. 전광판에 길 묻기 (DNS) */
      function(tl, api, R){
        tl.add(api.camTo(560, 330, 1.45, 1.3));
        var u = [PT.user[0], PT.user[1] - 50];
        api.showLink(tl, "dns", u, PT.sign, ">-.3");
        var b = api.bubble(PT.sign[0] + 92, PT.sign[1] - 60, 280, 96, [PT.sign[0] + 92, PT.sign[1] - 20, PT.sign[0] + 76, PT.sign[1] - 6, PT.sign[0] + 92, PT.sign[1] - 2]);
        api.text(b.inner, PT.sign[0] + 110, PT.sign[1] - 32, SHOP.domain + " 은요?", "s");
        api.text(b.inner, PT.sign[0] + 110, PT.sign[1] - 8, "→ 정문 " + INGRESS_IP, "m", {"font-weight":"700"});
        api.text(b.inner, PT.sign[0] + 110, PT.sign[1] + 18, "주소만 알려 줘요 · 검사 없음", "s");
        api.pop(tl, b, "+=.1");
        tl.to(R.signAns, {attr:{fill:"#fde68a"}, duration:.2, yoyo:true, repeat:3}, "<");
      },
      /* 2. 정문 — 자물쇠 풀기 (TLS 종료) */
      function(tl, api, R){
        tl.add(api.camTo(660, 430, 1.45, 1.3));
        api.clearBubbles(tl, "<");
        api.hideLinks(tl, ["dns"], "<");
        tl.to(R.pax.g, {x:PT.gateBefore[0], y:PT.gateBefore[1], duration:2, ease:"power1.inOut"}, "<");
        tl.to(R.pax.g, {x:PT.gate[0], y:PT.gate[1], duration:.7, ease:"power1.out"});
        var g = PT.gateTop;
        var b = api.bubble(g[0] - 300, g[1] - 70, 250, 96, [g[0] - 50, g[1] - 10, g[0] - 22, g[1] + 6, g[0] - 50, g[1] + 16]);
        api.text(b.inner, g[0] - 282, g[1] - 42, "🔒 → 🔓  자물쇠 풀기", "t");
        api.text(b.inner, g[0] - 282, g[1] - 16, "인증서 CN=" + SHOP.domain, "m");
        api.text(b.inner, g[0] - 282, g[1] + 8, "TLS 종료 — 안을 볼 수 있게 됨", "s");
        api.pop(tl, b, "+=.1");
        tl.to(R.pax.lock, {opacity:0, y:-10, duration:.4}, "+=.3");
        tl.to(R.pax.open, {opacity:1, duration:.4}, "<");
      },
      /* 3. 보안검색대 (WAF) */
      function(tl, api, R){
        tl.add(api.camTo(760, 470, 1.5, 1.2));
        api.clearBubbles(tl, "<");
        tl.to(R.pax.g, {x:PT.waf[0], y:PT.waf[1], duration:1.1, ease:"power1.inOut"}, "<");
        tl.to(R.wafCurtain, {opacity:.45, duration:.25, yoyo:true, repeat:3});
        tl.set(R.wafLight, {attr:{stroke:"#22c55e"}});
        tl.set(R.wafCurtain, {attr:{fill:"#22c55e"}, opacity:.25});
        var w = PT.wafTop;
        var b = api.bubble(w[0] + 50, w[1] - 110, 300, 118, [w[0] + 50, w[1] - 30, w[0] + 14, w[1] - 4, w[0] + 50, w[1] - 14]);
        api.text(b.inner, w[0] + 68, w[1] - 82, "검사: GET /orders", "t");
        api.text(b.inner, w[0] + 68, w[1] - 56, "SQL 인젝션 · 흔한 공격 → 없음", "s");
        api.text(b.inner, w[0] + 68, w[1] - 34, "✓ ALLOW", "m", {fill:"#16a34a", "font-weight":"800"});
        api.text(b.inner, w[0] + 68, w[1] - 12, "(id=1' OR '1'='1 였다면 → 403)", "s");
        api.pop(tl, b, "-=.2");
      },
      /* 4. 안내 데스크 (Ingress) — 길 나누기 */
      function(tl, api, R){
        tl.add(api.camTo(860, 520, 1.35, 1.3));
        api.clearBubbles(tl, "<");
        tl.set(R.wafLight, {attr:{stroke:"#94a3b8"}}, "<");
        tl.set(R.wafCurtain, {attr:{fill:"#94a3b8"}, opacity:.12}, "<");
        tl.to(R.pax.g, {x:PT.desk[0], y:PT.desk[1], duration:1.6, ease:"power1.inOut"}, "<");
        var d = PT.deskPt;
        var b = api.bubble(d[0] + 40, d[1] - 120, 290, 96, [d[0] + 40, d[1] - 50, d[0] + 12, d[1] - 20, d[0] + 60, d[1] - 24]);
        api.text(b.inner, d[0] + 58, d[1] - 92, SHOP.domain + "  /", "m");
        api.text(b.inner, d[0] + 58, d[1] - 68, "→ shop-front 가게로", "t");
        api.text(b.inner, d[0] + 58, d[1] - 44, "관제탑은 이 길에 없어요", "s");
        api.pop(tl, b, "+=.1");
        tl.to(R.pax.g, {x:PT.front[0], y:PT.front[1], duration:1.2, ease:"power1.inOut"}, "+=.6");
      },
      /* 5. 경비원끼리 봉인 쪽지 (mTLS) */
      function(tl, api, R){
        tl.add(api.camTo(990, 540, 1.3, 1.3));
        api.clearBubbles(tl, "<");
        var a = PT.frontGuard, o = PT.orderGuard;
        tl.set(R.note, {x:a[0], y:a[1] - 16, opacity:0, scale:.3});
        tl.to(R.note, {opacity:1, scale:1, duration:.4, ease:"back.out(2)"}, ">");
        tl.to(R.note.seal, {opacity:1, duration:.3}, "+=.2");
        tl.to([R.frontBadge, R.orderBadge], {scale:1.6, transformOrigin:"50% 50%", duration:.25, yoyo:true, repeat:1}, "<");
        api.showLink(tl, "mtls", a, o, "<", "alt");
        api.fly(tl, R.note, [a[0], a[1] - 16], [o[0], o[1] - 16], {duration:1.6, lift:80});
        var b = api.bubble(o[0] + 40, o[1] - 150, 330, 110, [o[0] + 40, o[1] - 70, o[0] + 12, o[1] - 34, o[0] + 60, o[1] - 40]);
        api.text(b.inner, o[0] + 58, o[1] - 122, "🔏 봉인된 쪽지 (mTLS)", "t");
        api.text(b.inner, o[0] + 58, o[1] - 96, "보낸이: ns/my-shop/sa/shop-front", "m");
        api.text(b.inner, o[0] + 58, o[1] - 72, "출입 명단에 있음 → ✓ 들여보냄", "s", {fill:"#16a34a"});
        api.pop(tl, b, "-=.3");
        tl.to(R.note, {opacity:0, scale:.4, duration:.3}, "+=.6");
      },
      /* 6. 금고 문지기 (Security Group) */
      function(tl, api, R){
        tl.add(api.camTo(1120, 560, 1.35, 1.3));
        api.clearBubbles(tl, "<");
        api.hideLinks(tl, ["mtls"], "<");
        var o = PT.orderGuard, s = PT.sg;
        tl.set(R.query, {x:o[0], y:o[1] - 16, opacity:0, scale:.3});
        tl.to(R.query, {opacity:1, scale:1, duration:.4, ease:"back.out(2)"}, ">");
        api.fly(tl, R.query, [o[0], o[1] - 16], [s[0] - 20, s[1] - 10], {duration:1.4, lift:70});
        tl.fromTo(R.sgBang, {opacity:0, y:6}, {opacity:1, y:0, duration:.3, ease:"back.out(3)"});
        var b = api.bubble(s[0] - 330, s[1] - 150, 290, 110, [s[0] - 40, s[1] - 40, s[0] - 14, s[1] - 22, s[0] - 60, s[1] - 40]);
        api.text(b.inner, s[0] - 312, s[1] - 122, "출발: 터미널 보안그룹", "s");
        api.text(b.inner, s[0] - 312, s[1] - 98, "포트: TCP 5432", "m");
        api.text(b.inner, s[0] - 312, s[1] - 72, "✓ 허용 목록에 있음 → 문 열기", "t", {fill:"#16a34a"});
        api.pop(tl, b, "<");
        tl.to(R.sgBang, {opacity:0, duration:.3}, "+=.5");
        api.fly(tl, R.query, [s[0] - 20, s[1] - 10], PT.vault, {duration:.8, lift:30});
        tl.to(R.query, {opacity:0, scale:.3, duration:.3});
        tl.fromTo(R.vaultGlow, {opacity:0}, {opacity:1, duration:.3, yoyo:true, repeat:1}, "<");
      },
      /* 7. 답 돌아가기 + 기록이 상황실로 */
      function(tl, api, R){
        tl.add(api.camTo(960, 400, 1.08, 1.4));
        api.clearBubbles(tl, "<");
        var f = PT.front;
        var r = api.bubble(f[0] + 26, f[1] - 104, 120, 44, [f[0] + 30, f[1] - 60, f[0] + 10, f[1] - 52, f[0] + 46, f[1] - 60]);
        api.text(r.inner, f[0] + 44, f[1] - 76, "200 OK ✓", "t", {fill:"#16a34a"});
        api.pop(tl, r, ">");
        var src = [PT.gateTop, PT.wafTop, PT.orderGuard, PT.sg];
        tl.addLabel("logs", "+=.4");
        src.forEach(function(s, i){
          var l = R.logs[i];
          tl.set(l, {x:s[0], y:s[1], opacity:0}, "logs");
          tl.to(l, {opacity:1, duration:.2}, "logs+=" + (i * .15));
          api.fly(tl, l, s, PT.watch, {duration:1.6, lift:80}, "logs+=" + (i * .15));
          tl.to(l, {opacity:0, scale:.4, duration:.25}, "logs+=" + (1.6 + i * .15));
        });
        var w = PT.watch;
        var bx = w[0] - 400, by = w[1] - 200;
        var b = api.bubble(bx, by, 300, 190, [bx + 300, by + 120, w[0] - 40, w[1] - 30, bx + 300, by + 150]);
        api.text(b.inner, bx + 18, by + 28, "이 요청이 지난 문", "t");
        [["Route 53", "길 안내만"], ["ALB", "도청 막기 (TLS)"], ["WAF", "공격 글자"], ["Envoy", "보낸이 신분 (mTLS)"], ["보안그룹", "출발지·포트"], ["KMS", "디스크 암호화"]].forEach(function(r, i){
          api.text(b.inner, bx + 18, by + 54 + i * 22, r[0], "m", {"font-weight":"700"});
          api.text(b.inner, bx + 110, by + 54 + i * 22, r[1], "s");
        });
        api.pop(tl, b, "logs+=2");
      }
    ],

    /* ── 사건 2: 가게가 금고 열기 (IRSA) ── */
    secret:[
      /* 1. order-api 에게 있는 것: 신분 토큰 */
      function(tl, api, R){
        tl.add(api.camTo(1040, 600, 1.4, 1.3));
        var o = PT.orderPt;
        tl.set(R.card, {x:o[0], y:o[1] - 30, opacity:0, scale:.3});
        tl.to(R.card, {opacity:1, scale:1.3, duration:.5, ease:"back.out(2)"}, ">");
        say(tl, api, o[0] - 380, o[1] - 170, 330, [
          ["🪪 신분 토큰 (ServiceAccount)", "t"],
          ["system:serviceaccount:my-order:order-api", "m"],
          ["DB 비밀번호는? → 코드·이미지 어디에도 없음", "s"]], [o[0] - 20, o[1] - 34], "+=.1");
      },
      /* 2. 발급소: 토큰 서명 확인 (OIDC) */
      function(tl, api, R){
        tl.add(api.camTo(1080, 370, 1.05, 1.4));
        api.clearBubbles(tl, "<");
        var o = PT.orderPt, i = PT.iam;
        api.fly(tl, R.card, [o[0], o[1] - 30], [i[0] + 30, i[1] + 20], {duration:1.8, lift:120}, "<");
        tl.to(R.card, {scale:1, duration:.3}, "<");
        api.showLink(tl, "oidc", PT.tower, i, ">", "alt");
        say(tl, api, i[0] - 360, i[1] + 40, 320, [
          ["서명 확인", "t"],
          ["관제탑이 공개한 열쇠(OIDC)로 검사", "s"],
          ["✓ 진짜 이 클러스터가 발급한 토큰", "s", {fill:"#16a34a"}]], [i[0] - 10, i[1] + 30], "+=.1");
      },
      /* 3. 발급소: 역할 확인 → 임시 출입증 */
      function(tl, api, R){
        tl.add(api.camTo(1080, 370, 1.05, .8));
        api.clearBubbles(tl, "<");
        api.hideLinks(tl, ["oidc"], "<");
        var o = PT.orderPt, i = PT.iam;
        say(tl, api, i[0] - 360, i[1] + 40, 330, [
          ["신뢰 정책: order-api-role", "t"],
          ["허용: my-order 의 order-api 만 → ✓", "s"],
          ["임시 출입증 발급 (1시간 뒤 만료)", "s", {fill:"#16a34a"}]], [i[0] - 10, i[1] + 30], ">");
        tl.to(R.card, {opacity:0, scale:.4, duration:.3}, "+=.4");
        tl.set(R.pass, {x:i[0] + 30, y:i[1] + 20, opacity:0, scale:.4});
        tl.to(R.pass, {opacity:1, scale:1.2, duration:.4, ease:"back.out(2)"});
        api.fly(tl, R.pass, [i[0] + 30, i[1] + 20], [o[0], o[1] - 30], {duration:1.8, lift:120}, "+=.2");
      },
      /* 4. 뒷문으로 열쇠 보관함에 가서 비밀 하나 꺼내기 */
      function(tl, api, R){
        tl.add(api.camTo(1210, 470, 1.15, 1.3));
        api.clearBubbles(tl, "<");
        var o = PT.orderPt, e = PT.ep, s = PT.secrets;
        tl.to(R.pass, {opacity:0, duration:.3}, "<");
        tl.set(R.req, {x:o[0], y:o[1] - 30, opacity:0, scale:.3});
        tl.to(R.req, {opacity:1, scale:1, duration:.4, ease:"back.out(2)"}, ">");
        api.fly(tl, R.req, [o[0], o[1] - 30], [e[0], e[1] - 6], {duration:1.2, lift:60});
        api.fly(tl, R.req, [e[0], e[1] - 6], [s[0] - 20, s[1] + 10], {duration:1, lift:50});
        tl.to(R.req, {opacity:0, duration:.25});
        say(tl, api, s[0] - 380, s[1] - 180, 330, [
          ["정책: my-shop/db 읽기만 → ✓", "t"],
          ["KMS 열쇠로 풀어서 전달", "s"],
          ["인터넷을 거치지 않음 (뒷문)", "s"]], [s[0] - 20, s[1] - 10], "<");
        tl.set(R.key, {x:s[0] - 20, y:s[1] + 10, opacity:1, scale:1.2}, "+=.4");
        api.fly(tl, R.key, [s[0] - 20, s[1] + 10], [e[0], e[1] - 6], {duration:1, lift:50});
        api.fly(tl, R.key, [e[0], e[1] - 6], [o[0], o[1] - 30], {duration:1.2, lift:60});
      },
      /* 5. CloudTrail 에 남은 기록 */
      function(tl, api, R){
        tl.add(api.camTo(1200, 360, 1.15, 1.3));
        api.clearBubbles(tl, "<");
        var w = PT.watch;
        [PT.iam, PT.secrets].forEach(function(s, i){
          var l = R.logs[i], at = i ? "<+=.2" : ">";
          tl.set(l, {x:s[0], y:s[1], opacity:1, scale:1}, at);
          api.fly(tl, l, s, w, {duration:1.4, lift:60}, "<");
        });
        tl.to([R.logs[0], R.logs[1]], {opacity:0, scale:.4, duration:.3});
        say(tl, api, w[0] - 420, w[1] + 60, 360, [
          ["📒 CloudTrail", "t"],
          ["AssumeRoleWithWebIdentity  order-api", "m"],
          ["GetSecretValue  my-shop/db", "m"],
          ["누가·언제·무엇을 꺼냈는지 남아요", "s"]], [w[0] - 30, w[1] + 20], "<");
      }
    ],

    /* ── 사건 3: 침입 시도 막기 ── */
    breach:[
      /* 1. 침입 */
      function(tl, api, R){
        tl.add(api.camTo(880, 580, 1.45, 1.3));
        var a = PT.atk;
        tl.set(R.attacker, {x:a[0], y:a[1], opacity:0, scale:.6});
        tl.to(R.attacker, {opacity:1, scale:1, duration:.6, ease:"back.out(2)"}, ">");
        say(tl, api, a[0] - 330, a[1] - 190, 300, [
          ["⚠ 침입자가 쇼핑 가게 안에", "t", {fill:"#dc2626"}],
          ["취약한 라이브러리를 통해 (가정)", "s"],
          ["권한: 일반 사용자 · 읽기 전용 디스크", "s"]], [a[0] - 10, a[1] - 60], "+=.1");
      },
      /* 2. 금고로 바로 가기 → 칸막이 */
      function(tl, api, R){
        tl.add(api.camTo(960, 560, 1.35, 1.2));
        api.clearBubbles(tl, "<");
        var a = PT.atk, w = PT.wall;
        api.showLink(tl, "atk", [a[0], a[1] - 30], PT.vault, "<", "warn");
        tl.to(R.wall, {opacity:.75, attr:{fill:"#ef4444"}, duration:.3, yoyo:true, repeat:3}, "+=.4");
        tl.set(R.wall, {opacity:.55, attr:{fill:"#ef4444"}});
        tl.set(R.xs[0], {x:w[0], y:w[1] - 10});
        tl.to(R.xs[0], {opacity:1, duration:.3}, "<");
        say(tl, api, w[0] + 60, w[1] - 220, 340, [
          ["→ 10.0.31.40:5432 (금고)", "m"],
          ["✗ 칸막이 허용 목록에 없음", "t", {fill:"#dc2626"}],
          ["보안그룹만 있었다면? 터미널에서", "s"],
          ["출발한 요청이라 통과했을 거예요", "s"]], [w[0] + 20, w[1] - 30], "+=.1");
      },
      /* 3. 노드 출입증 훔치기 → 응답 없음 */
      function(tl, api, R){
        tl.add(api.camTo(960, 520, 1.4, 1.1));
        api.clearBubbles(tl, "<");
        api.hideLinks(tl, ["atk"], "<");
        tl.to(R.xs[0], {opacity:0, duration:.3}, "<");
        var a = PT.atk, m = PT.imds;
        api.showLink(tl, "imds", [a[0], a[1] - 30], m, ">", "warn");
        tl.set(R.xs[1], {x:m[0], y:m[1] - 22});
        tl.to(R.xs[1], {opacity:1, duration:.3}, "+=.6");
        say(tl, api, m[0] + 30, m[1] - 190, 330, [
          ["노드 출입증 함 (IMDS)", "t"],
          ["169.254.169.254 → 응답 없음", "m"],
          ["Pod 에서는 닿지 않게 막아 둠 (홉 1)", "s"]], [m[0] + 10, m[1] - 30], "<");
      },
      /* 4. 가게 자기 출입증으로 더 많이 → 거부 */
      function(tl, api, R){
        tl.add(api.camTo(1130, 440, 1.0, 1.3));
        api.clearBubbles(tl, "<");
        api.hideLinks(tl, ["imds"], "<");
        tl.to(R.xs[1], {opacity:0, duration:.3}, "<");
        var a = PT.atk, s = PT.secrets;
        api.showLink(tl, "iamx", [a[0], a[1] - 30], s, ">", "warn");
        tl.set(R.xs[2], {x:s[0] - 20, y:s[1] - 30});
        tl.to(R.xs[2], {opacity:1, duration:.3}, "+=.6");
        say(tl, api, s[0] - 470, s[1] - 230, 400, [
          ["shop-front-role 의 출입증으로 시도", "t"],
          ["s3:ListAllMyBuckets → ✗ AccessDenied", "m", {fill:"#dc2626"}],
          ["my-shop/db 비밀 꺼내기 → ✗ AccessDenied", "m", {fill:"#dc2626"}],
          ["허락된 건 상품 이미지 버킷 읽기뿐", "s"]], [s[0] - 30, s[1] - 30], "<");
      },
      /* 5. GuardDuty 탐지 */
      function(tl, api, R){
        tl.add(api.camTo(1150, 400, 1.1, 1.3));
        api.clearBubbles(tl, "<");
        api.hideLinks(tl, ["iamx"], "<");
        tl.to(R.xs[2], {opacity:0, duration:.3}, "<");
        var a = PT.atk, w = PT.watch;
        api.showLink(tl, "cc", [a[0], a[1] - 30], w, ">", "warn");
        tl.to(R.alarm, {attr:{fill:"#ef4444"}, duration:.25, yoyo:true, repeat:5}, "+=.3");
        tl.set(R.alarm, {attr:{fill:"#ef4444"}});
        say(tl, api, w[0] - 430, w[1] - 190, 390, [
          ["🚨 GuardDuty 경보 (높음)", "t", {fill:"#dc2626"}],
          ["Backdoor:Runtime/C&CActivity.B!DNS", "m"],
          ["shop-front Pod 가 알려진 공격 서버 이름을 조회", "s"]], [w[0] - 30, w[1] - 20], "<");
      },
      /* 6. 운영자 대응 — 격리 후 교체 */
      function(tl, api, R){
        tl.add(api.camTo(960, 380, 0.98, 1.4));
        api.clearBubbles(tl, "<");
        api.hideLinks(tl, ["cc"], "<");
        var o = PT.ops, t = PT.towerDoor;
        api.showLink(tl, "alert", PT.watch, o, ">", "warn");
        tl.set(R.req, {x:o[0], y:o[1], opacity:0, scale:.4}, "+=.5");
        tl.to(R.req, {opacity:1, scale:1, duration:.4});
        api.fly(tl, R.req, o, t, {duration:1.6, lift:100});
        tl.to(R.req, {opacity:0, duration:.3});
        tl.to(R.attacker, {opacity:0, scale:.5, duration:.8}, "+=.3");
        tl.set(R.wall, {opacity:.22, attr:{fill:"#fb923c"}});
        tl.set(R.alarm, {attr:{fill:"#94a3b8"}});
        say(tl, api, o[0] - 210, o[1] + 60, 380, [
          ["운영자의 대응", "t"],
          ["① 격리 — 라벨을 바꿔 모든 통신 끊기", "s"],
          ["② 묶음에서 빠졌으니 새 Pod 가 자동으로 생김", "s"],
          ["   옛 Pod 는 증거를 모은 뒤 삭제", "s"],
          ["③ 다음: 고친 버전 배포 (다음 사건)", "s"]], [o[0], o[1] + 30], "<");
      }
    ],

    /* ── 사건 4: 새 버전 배포하기 ── */
    deploy:[
      /* 1. 이미지를 창고에 올리기 */
      function(tl, api, R){
        tl.add(api.camTo(1000, 320, 1.15, 1.3));
        var c = PT.ci, e = PT.ecr, k = R.crates[0];
        tl.set(k, {x:c[0], y:c[1] + 20, opacity:0, scale:.4});
        tl.to(k, {opacity:1, scale:1.2, duration:.4, ease:"back.out(2)"}, ">");
        api.fly(tl, k, [c[0], c[1] + 20], [e[0], e[1] - 10], {duration:2, lift:150});
        say(tl, api, c[0] - 170, c[1] - 140, 290, [
          ["docker push", "t"],
          ["shop-front:1.5.0", "m"],
          ["→ 이미지 창고 (ECR)", "s"]], [c[0], c[1] - 10], "<");
      },
      /* 2. 창고: 스캔 + 서명 */
      function(tl, api, R){
        tl.add(api.camTo(1180, 380, 1.45, 1.2));
        api.clearBubbles(tl, "<");
        var e = PT.ecr, k = R.crates[0];
        tl.set(k, {x:e[0], y:e[1] - 10, opacity:1});
        tl.to(R.ecrGlow, {opacity:1, duration:.4, yoyo:true, repeat:3}, ">");
        tl.to(k.seal, {opacity:1, duration:.3});
        say(tl, api, e[0] + 50, e[1] - 160, 300, [
          ["취약점 스캔", "t"],
          ["CRITICAL 0 · HIGH 0", "m", {fill:"#16a34a"}],
          ["✍ 서명 완료 — 우리 로봇이 만든 것", "s"]], [e[0] + 20, e[1] - 20], "<");
      },
      /* 3. 관제탑: 신원 + 권한 */
      function(tl, api, R){
        tl.add(api.camTo(1000, 280, 1.2, 1.3));
        api.clearBubbles(tl, "<");
        var c = PT.ci, t = PT.towerDoor;
        tl.set(R.req, {x:c[0], y:c[1], opacity:0, scale:.4});
        tl.to(R.req, {opacity:1, scale:1, duration:.4}, ">");
        api.fly(tl, R.req, c, t, {duration:1.8, lift:130});
        tl.to(R.req.seal, {opacity:1, duration:.3}, "+=.3");
        say(tl, api, t[0] - 450, t[1] + 30, 380, [
          ["① 신원 (IAM): my-shop-deployer → ✓", "t"],
          ["② 권한 (RBAC): my-shop 의 Deployment 수정 → ✓", "s"],
          ["다른 구역·Secret 은 손댈 수 없어요", "s"]], [t[0] - 20, t[1]], "<");
      },
      /* 4. 규칙 검사관 (Pod Security) */
      function(tl, api, R){
        tl.add(api.camTo(1080, 300, 1.5, 1.2));
        api.clearBubbles(tl, "<");
        tl.to(R.req, {opacity:0, duration:.3}, "<");
        var p = PT.psa;
        api.showLink(tl, "psa", PT.towerDoor, p, ">", "alt");
        say(tl, api, p[0] - 400, p[1] - 150, 340, [
          ["새 Pod 설계도 검사 (restricted)", "t"],
          ["root 아님 ✓ · 특권 없음 ✓", "s"],
          ["권한 상승 막음 ✓ · 서명된 이미지 ✓", "s"]], [p[0] - 10, p[1] - 10], "+=.2");
      },
      /* 5. 터미널: 이미지 받아서 교체 */
      function(tl, api, R){
        tl.add(api.camTo(1020, 480, 1.0, 1.4));
        api.clearBubbles(tl, "<");
        api.hideLinks(tl, ["psa"], "<");
        var e = PT.ecr;
        tl.to(R.crates[0], {opacity:0, duration:.3}, "<");
        [PT.frontPt, PT.front2Pt].forEach(function(p, i){
          var k = R.crates[i + 1];
          tl.set(k, {x:e[0], y:e[1] - 10, opacity:1, scale:1}, i ? "<" : ">");
          api.fly(tl, k, [e[0], e[1] - 10], [p[0], p[1] - 10], {duration:1.6, lift:120}, "<");
        });
        tl.to([R.crates[1], R.crates[2]], {opacity:0, scale:.4, duration:.3});
        tl.to(R.verTags, {opacity:1, duration:.4});
        var f = PT.front2Pt;
        say(tl, api, f[0] + 60, f[1] - 160, 290, [
          ["하나씩 교체 (rolling update)", "t"],
          ["1.4.0 → 1.5.0", "m"],
          ["새 가게가 준비되면 옛 가게를 닫아요", "s"]], [f[0] + 20, f[1] - 40], "<");
      },
      /* 6. 감사 기록 */
      function(tl, api, R){
        tl.add(api.camTo(1200, 330, 1.2, 1.3));
        api.clearBubbles(tl, "<");
        var t = PT.tower, w = PT.watch, l = R.logs[0];
        tl.set(l, {x:t[0], y:t[1], opacity:1, scale:1}, ">");
        api.fly(tl, l, t, w, {duration:1.4, lift:60});
        tl.to(l, {opacity:0, scale:.4, duration:.3});
        say(tl, api, w[0] - 430, w[1] + 50, 370, [
          ["📒 감사 로그 (audit)", "t"],
          ["patch deployments/shop-front", "m"],
          ["누가: my-shop-deployer · 결과 200", "s"],
          ["로봇도 정해진 일만 — 최소 권한", "s"]], [w[0] - 30, w[1] + 20], "<");
      }
    ]
  }
};
})();
