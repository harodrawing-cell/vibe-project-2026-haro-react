const test = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs");
const catalog = JSON.parse(fs.readFileSync("data/products.json", "utf8"));
const { catalog: expected } = require("./helpers/goods-expected.cjs");
const repository = async () => {
  const { createRepository } = await import("../src/services/shop.js");
  const memory = new Map();
  const options = {
    getStorage: () => ({
      getItem: (k) => memory.get(k) ?? null,
      setItem: (k, v) => memory.set(k, v),
    }),
    loadCatalog: async () => catalog,
  };
  return { shop: createRepository(options), memory, createRepository, options };
};
test("approved catalog prices, mirror metadata, IDs, options and actual images", () => {
  assert.deepEqual(catalog, expected);
  assert.equal(catalog.products.length, 8);
  for (const p of catalog.products) {
    assert.equal(
      p.price,
      p.id.endsWith("-sticker")
        ? 3150
        : p.id === "sticky-cleaner"
          ? 4800
          : 4500,
    );
    for (const image of p.images) assert.ok(fs.existsSync(image), image);
  }
  assert.equal(
    catalog.products.find((p) => p.id === "sticky-cleaner").images.length,
    5,
  );
  assert.ok(
    catalog.products
      .find((p) => p.id === "sticky-cleaner")
      .specifications.includes("판매 상태: 판매 중"),
  );
});
test("static common catalog matches cart source without CMS imports", async () => {
  const { catalog: shared } =
    await import("../src/services/product-catalog.js");
  assert.deepEqual(
    shared.productOrder,
    catalog.products.map((p) => p.id),
  );
  assert.deepEqual(
    shared.products["sticky-cleaner"],
    catalog.products.find((p) => p.id === "sticky-cleaner"),
  );
  for (const p of [
    "src/pages/ProductPage.jsx",
    "src/sections/Goods.jsx",
    "src/contexts/CartContext.jsx",
    "src/services/product-catalog.js",
  ])
    assert.doesNotMatch(
      fs.readFileSync(p, "utf8"),
      /ContentContext|cms-schema|cms-config/,
    );
});
test("two mirrors cost 9600 plus one shipping fee, quantities and deletion", async () => {
  const { shop } = await repository();
  await shop.add("sticky-cleaner", "default", 2);
  assert.equal((await shop.getCart()).subtotal, 9600);
  assert.equal((await shop.getCart()).shipping, 3000);
  assert.equal((await shop.getCart()).total, 12600);
  await shop.setQuantity("sticky-cleaner", "default", 3);
  assert.equal((await shop.getCart()).total, 17400);
  await shop.remove("sticky-cleaner", "default");
  assert.equal((await shop.getCart()).total, 0);
});
test("mixed cart and reload preserve existing product quantities and storage schema", async () => {
  const { shop, createRepository, options, memory } = await repository();
  await shop.add("haro-note", "white-105-148", 1);
  await shop.add("sticky-cleaner", "default", 2);
  assert.equal((await shop.getCart()).total, 17100);
  const reloaded = createRepository(options);
  assert.equal((await reloaded.getCart()).total, 17100);
  await reloaded.remove("sticky-cleaner", "default");
  assert.deepEqual(JSON.parse(memory.get("haro-cart-v1")), [
    { productId: "haro-note", optionId: "white-105-148", quantity: 1 },
  ]);
});
test("all six stickers can share one order with one shipping fee", async () => {
  const { shop } = await repository();
  for (const p of catalog.products.filter((p) => p.id.endsWith("-sticker")))
    await shop.add(p.id, p.options[0].id, 1);
  assert.equal((await shop.getCart()).subtotal, 18900);
  assert.equal((await shop.getCart()).total, 21900);
});
test("unsafe amount is rejected; no real checkout path or payment action added", async () => {
  const { createRepository, options } = await repository();
  const shop = createRepository({
    ...options,
    loadCatalog: async () => ({
      ...catalog,
      products: catalog.products.map((p) =>
        p.id === "sticky-cleaner"
          ? { ...p, price: Number.MAX_SAFE_INTEGER }
          : p,
      ),
    }),
  });
  await shop.add("sticky-cleaner", "default", 2);
  await assert.rejects(shop.getCart(), /계산 범위/);
  assert.doesNotMatch(
    fs.readFileSync("src/App.jsx", "utf8"),
    /CheckoutPage|path="checkout"/,
  );
  assert.doesNotMatch(
    fs.readFileSync("src/pages/CartPage.jsx", "utf8"),
    /checkoutEnabled/,
  );
});
