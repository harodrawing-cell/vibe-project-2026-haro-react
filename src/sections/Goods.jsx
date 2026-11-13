import { catalog } from "../services/product-catalog";
import { Link } from "react-router-dom";
import Carousel from "../components/Carousel";
import { SwiperSlide } from "swiper/react";

export default function Goods() {
  return (
    <section className={"goods"} id={"goods"} aria-labelledby={"goods-title"}>
      <h2 className={"goods__title"} id={"goods-title"} data-reveal={""}>
        {"GOODS"}
      </h2>
      <span className={"goods__rule"} aria-hidden={"true"}></span>
      {"\n\n        "}
      <div
        className={"goods__carousel"}
        role={"group"}
        aria-label={"굿즈 상품 캐러셀"}
      >
        <button
          className={"goods__arrow goods__arrow--prev"}
          type={"button"}
          data-goods-prev={""}
          aria-label={"이전 상품"}
        >
          <span aria-hidden={"true"}></span>
        </button>
        {"\n\n          "}
        <Carousel kind="goods" className="goods__viewport swiper">
          {catalog.featuredProductIds.map((id) => {
            const product = catalog.products[id];
            return (
              <SwiperSlide className="goods-card" key={id}>
                <Link className="goods-card__link" to={"/goods?id=" + id}>
                  <img
                    className="goods-card__media"
                    src={"./" + product.images[0]}
                    alt={product.name}
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="goods-card__copy">
                    <h3 className="goods-card__title">
                      {product.name}
                      {id === "sticky-cleaner" && product.price !== null && (
                        <>
                          <br />
                          <span>{product.price.toLocaleString("ko-KR")}원</span>
                        </>
                      )}
                    </h3>
                  </div>
                </Link>
              </SwiperSlide>
            );
          })}
        </Carousel>
        {"\n\n          "}
        <button
          className={"goods__arrow goods__arrow--next"}
          type={"button"}
          data-goods-next={""}
          aria-label={"다음 상품"}
        >
          <span aria-hidden={"true"}></span>
        </button>
      </div>
      {"\n\n        "}
      <a
        className={"goods__shop-link"}
        href={catalog.storeUrl}
        target={"_blank"}
        rel={"noopener noreferrer"}
        data-reveal={""}
      >
        {"\n          굿즈 보러가기\n        "}
      </a>
    </section>
  );
}
