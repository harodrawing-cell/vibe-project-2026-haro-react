import source from "../../data/products.json" with { type: "json" };
// Static GOODS data only. No CMS, authentication, remote readers or mutable client prices.
export const catalog = Object.freeze({
  currency: source.currency,
  shipping: source.shipping,
  storeUrl: "https://marpple.shop/kr/mandaco",
  productOrder: source.products.map((product) => product.id),
  featuredProductIds: source.products.map((product) => product.id),
  products: Object.fromEntries(
    source.products.map((product) => [product.id, product]),
  ),
});
