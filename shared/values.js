/* Horang Universe 공용 예시 값 — 세계 간에 공유되는 손님·가게·주소만 둔다.
   내부망 주소, 바이트 수, 세계 안에서만 쓰는 값은 각 세계 content.js 에 둔다.
   세계는 쓰는 벌을 content.js meta.values 에 적는다. check_registry 가 존재를 확인한다.
   문서용 대역만 쓴다: 도메인 .example / example.com, 공인 IP 203.0.113.0/24 (RFC 5737), MAC 00:00:5e:00:53:xx (RFC 7042). */
(function(){
"use strict";

window.SHARED = {
  /* 가게(서비스) 벌 */
  shops: {
    "shop-web": { name: "my-shop 가게", real: "my-shop (쇼핑 서비스)",
      domain: "my-shop.example.com", publicIp: "203.0.113.42",
      pods: { front: "shop-front", order: "order-api" },
      note: "우편 도시·항구·공항이 같은 가게를 본다. network-layers 만 my-shop.example 예외(D22)." },
    "pay-app":  { name: "my-pay 결제소", real: "my-pay (결제 서비스)",
      domain: "pay.example.com", db: "my_pay", table: "wallets",
      note: "도서관의 손님이 쓰는 서비스. 주문 가게가 결제를 부탁하는 관계(D23)." }
  },

  /* 손님 벌 */
  guests: {
    "guest-browser": { name: "손님", real: "Browser (웹 브라우저)",
      note: "주소창에 가게 이름을 치는 사람. 우편 도시·항구·공항의 손님." },
    "guest-app":     { name: "손님", real: "Client (my-pay-app)",
      users: ["mina", "joon"],
      note: "도서관에 SQL 을 들고 오는 앱. 사람 이름 두 개는 동시성 장면용." }
  },

  /* 공인 주소 끝자리 분배 — 세계마다 다른 값을 써서 겹치지 않게 */
  publicIps: {
    "shop-web":      "203.0.113.42",
    "ops-ingress":   "203.0.113.10",
    "pay-app":       "203.0.113.77"
  },

  /* 문서용 대역 안내 (사람이 읽는 참고) */
  ranges: {
    domainTld: ".example / example.com",
    publicIp: "203.0.113.0/24",
    mac: "00:00:5e:00:53:xx"
  }
};
})();
