const fs = require("node:fs"),
  path = require("node:path");
const original = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "../fixtures/goods-original-catalog.json"),
    "utf8",
  ),
);
const catalog = structuredClone(original);
for (const product of catalog.products) {
  if (product.id.endsWith("-sticker")) {
    product.price = 3150;
    product.priceSource = "사용자 확정 판매가 (3,150원)";
  }
}
catalog.products.find((p) => p.id === "matatabi-sticker").description =
  "머그컵 일러스트가 인쇄된 리무버블 스티커입니다. 실제 머그컵이 아닌 스티커 상품입니다.";
Object.assign(
  catalog.products.find((p) => p.id === "sticky-cleaner"),
  {
    id: "sticky-cleaner",
    name: "체크_하로 손거울",
    price: 4800,
    images: [
      "images/used/haro_check_compact_mirror_front.png",
      "images/used/haro_check_compact_mirror_front_01.jpg",
      "images/used/haro_check_compact_mirror_front_02.jpg",
      "images/used/haro_check_compact_mirror_front_03.png",
      "images/used/haro_check_compact_mirror_front_04.png",
    ],
    options: [
      {
        id: "default",
        label: "정사각형 / 7.2 × 7.2cm",
      },
    ],
    description:
      "하로 캐릭터가 그려진 휴대용 손거울 (정사각형)입니다. Compact Mirror.",
    specifications: [
      "상품 종류: 휴대용 손거울 (정사각형) / Compact Mirror",
      "규격: 7.2 × 7.2cm",
      "판매 상태: 판매 중",
    ],
    priceSource: "사용자 확정 판매가 (4,800원)",
    sourceUrl: null,
  },
);
module.exports = { original, catalog };
