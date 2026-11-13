import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import Message from "../components/Message";
import "../styles/product-detail.css";
import { catalog } from "../services/product-catalog";
export default function ProductPage() {
  const [params] = useSearchParams(),
    id = params.get("id"),
    { shop } = useCart();
  const [product, setProduct] = useState(null),
    [image, setImage] = useState(""),
    [option, setOption] = useState(""),
    [quantity, setQuantity] = useState(1),
    [message, setMessage] = useState("상품 정보를 불러오는 중입니다."),
    [error, setError] = useState(false),
    [busy, setBusy] = useState(false),
    [added, setAdded] = useState(false);
  const lock = useRef(false);
  const [activeSection, setActiveSection] = useState("product-details");
  function goToSection(event, anchor) {
    event.preventDefault();
    setActiveSection(anchor);
    const target = document.getElementById(anchor);
    if (target?.tagName === "DETAILS") target.open = true;
    target?.focus({ preventScroll: true });
    target?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
      block: "start",
    });
  }
  useEffect(() => {
    let active = true;
    setProduct(null);
    setAdded(false);
    setError(false);
    setQuantity(1);
    setActiveSection("product-details");
    Promise.resolve(catalog.products[id] || null)
      .then((value) => {
        if (!active) return;
        if (!value) throw new Error("해당 상품을 찾을 수 없습니다.");
        setProduct(value);
        setImage(value.images[0]);
        setOption("");
        setMessage("");
      })
      .catch((e) => {
        if (active) {
          setMessage(e.message);
          setError(true);
        }
      });
    return () => {
      active = false;
    };
  }, [id, catalog]);
  async function add(event) {
    event.preventDefault();
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(false);
    try {
      await shop.add(id, option, Number(quantity));
      setAdded(true);
      setMessage("장바구니에 담았습니다.");
    } catch (e) {
      setMessage(e.message);
      setError(true);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  const validQuantity =
    Number.isInteger(Number(quantity)) && quantity >= 1 && quantity <= 99;
  const related = catalog.productOrder
    .filter((key) => key !== id)
    .slice(0, 3)
    .map((key) => catalog.products[key])
    .filter(Boolean);
  return (
    <main id="main-content" tabIndex={-1} className="shop-page product-page">
      <nav className="shop-breadcrumb" aria-label="현재 위치">
        <Link to="/">HOME</Link>
        <span aria-hidden="true">›</span>
        <Link to="/#goods">GOODS</Link>
        <span aria-hidden="true">›</span>
        <span aria-current="page">{product?.name || "상품 상세"}</span>
      </nav>
      {message && <Message error={error}>{message}</Message>}
      {product && (
        <>
          <section className="product-panel" aria-labelledby="product-name">
            <div className="product-gallery">
              <img
                className="product-main-image"
                src={shop.assetUrl(image)}
                alt={product.name}
              />
              <div
                className="product-thumbnails"
                role="group"
                aria-label="상품 이미지 선택"
              >
                {product.images.map((src, i) => (
                  <button
                    className="product-thumbnail"
                    key={src}
                    type="button"
                    aria-label={"상품 이미지 " + (i + 1)}
                    aria-pressed={image === src}
                    onClick={() => setImage(src)}
                  >
                    <img src={shop.assetUrl(src)} alt="" />
                  </button>
                ))}
              </div>
            </div>
            <div className="product-info">
              <p className="product-eyebrow">HARO GOODS</p>
              <h1 id="product-name">{product.name}</h1>
              {product.description && (
                <p className="product-description">{product.description}</p>
              )}
              <p className="product-price">{shop.money(product.price)}</p>
              <form onSubmit={add}>
                <fieldset className="product-form-fieldset" disabled={busy}>
                  {product.options.length > 0 && (
                    <div className="product-field">
                      <label htmlFor="product-option">옵션</label>
                      <select
                        id="product-option"
                        value={option}
                        onChange={(e) => setOption(e.target.value)}
                        required
                      >
                        <option value="">옵션을 선택해 주세요</option>
                        {product.options.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="product-field">
                    <label htmlFor="product-quantity">수량</label>
                    <div className="quantity-control">
                      <button
                        type="button"
                        aria-label="상품 수량 줄이기"
                        disabled={quantity <= 1}
                        onClick={() => setQuantity(Number(quantity) - 1)}
                      >
                        −
                      </button>
                      <input
                        id="product-quantity"
                        type="number"
                        min="1"
                        max="99"
                        step="1"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        inputMode="numeric"
                        required
                      />
                      <button
                        type="button"
                        aria-label="상품 수량 늘리기"
                        disabled={quantity >= 99}
                        onClick={() => setQuantity(Number(quantity) + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="product-shipping">
                    <span>배송 정보</span>
                    <p>
                      CJ대한통운 · 기본 배송비{" "}
                      {shop.money(catalog.shipping.fee)}
                      <small>주문 1건당 1회 적용</small>
                    </p>
                  </div>
                  <div className="product-total">
                    <span>총 상품금액</span>
                    <strong>
                      {product.price === null
                        ? shop.money(null)
                        : validQuantity
                          ? shop.money(product.price * Number(quantity))
                          : "수량을 확인해 주세요"}
                    </strong>
                  </div>
                  {product.price === null && (
                    <p className="shop-muted">
                      가격이 등록되지 않아 장바구니에 담을 수 없습니다.
                    </p>
                  )}
                  <div className="shop-actions">
                    <button
                      className="shop-button"
                      type="submit"
                      disabled={
                        product.price === null || !option || !validQuantity
                      }
                    >
                      {busy ? "담는 중…" : "장바구니 담기"}
                    </button>
                    <button
                      className="shop-button shop-button--primary"
                      type="button"
                      disabled
                      aria-describedby="product-payment-note"
                    >
                      바로 구매 (미지원)
                    </button>
                  </div>
                </fieldset>
              </form>
              <p id="product-payment-note" className="shop-muted">
                실제 주문·결제·배송은 제공하지 않는 검수용 화면입니다.
              </p>
              {added && (
                <p>
                  <Link className="shop-button" to="/cart">
                    장바구니 보기
                  </Link>
                </p>
              )}
            </div>
          </section>
          <div className="product-content">
            <nav className="product-tabs" aria-label="상품 정보">
              {[
                ["product-details", "상품 상세"],
                ["product-specifications", "제품 정보"],
                ["product-delivery", "배송 안내"],
                ["product-returns", "교환·반품"],
              ].map(([anchor, title]) => (
                <a
                  key={anchor}
                  href={"#" + anchor}
                  aria-current={
                    activeSection === anchor ? "location" : undefined
                  }
                  onClick={(e) => goToSection(e, anchor)}
                >
                  {title}
                </a>
              ))}
            </nav>
            <section
              id="product-details"
              className="product-section product-story"
              tabIndex={-1}
              aria-labelledby="product-details-title"
            >
              <div className="product-story-copy">
                <p className="product-eyebrow">A LITTLE HARO, EVERY DAY</p>
                <h2 id="product-details-title">상품 상세</h2>
                {product.description && <p>{product.description}</p>}
                {product.specifications.length > 0 && (
                  <ul>
                    {product.specifications.map((text) => (
                      <li key={text}>{text}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="product-story-images">
                {product.images.map((src, i) => (
                  <img
                    className="product-detail-image"
                    key={src}
                    src={shop.assetUrl(src)}
                    alt={
                      product.name +
                      (i === 0 ? " 대표 이미지" : " 상세 이미지 " + i)
                    }
                    loading="lazy"
                  />
                ))}
              </div>
            </section>
            <div className="product-information-layout">
              <section
                id="product-specifications"
                className="product-section"
                tabIndex={-1}
                aria-labelledby="product-specifications-title"
              >
                <h2 id="product-specifications-title">제품 정보</h2>
                <dl className="product-specification-list">
                  <div>
                    <dt>상품명</dt>
                    <dd>{product.name}</dd>
                  </div>
                  <div>
                    <dt>가격</dt>
                    <dd>{shop.money(product.price)}</dd>
                  </div>
                  {product.options.length > 0 && (
                    <div>
                      <dt>등록 옵션</dt>
                      <dd>{product.options.map((o) => o.label).join(" / ")}</dd>
                    </div>
                  )}
                  {product.specifications.length > 0 && (
                    <div>
                      <dt>규격·제품 안내</dt>
                      <dd>
                        <ul>
                          {product.specifications.map((text) => (
                            <li key={text}>{text}</li>
                          ))}
                        </ul>
                      </dd>
                    </div>
                  )}
                </dl>
                <p className="shop-muted">등록된 상품 정보만 표시합니다.</p>
              </section>
              <div className="product-guides">
                <details
                  id="product-delivery"
                  className="product-guide"
                  tabIndex={-1}
                >
                  <summary>
                    배송 안내<span aria-hidden="true">+</span>
                  </summary>
                  <div>
                    <p>배송사: CJ대한통운</p>
                    <p>
                      기본 배송비: 주문 1건당 {shop.money(catalog.shipping.fee)}{" "}
                      1회
                    </p>
                    <p>
                      무료배송 기준과 제주·도서산간 추가 배송비는 아직 확정되지
                      않았습니다.
                    </p>
                    <p className="shop-muted">
                      현재 배송비는 장바구니·모의 주문서 계산 기준이며 실제
                      배송은 진행하지 않습니다.
                    </p>
                  </div>
                </details>
                <details
                  id="product-returns"
                  className="product-guide"
                  tabIndex={-1}
                >
                  <summary>
                    교환·반품 안내<span aria-hidden="true">+</span>
                  </summary>
                  <div>
                    <p>
                      현재 상품 데이터에 등록된 교환·반품 정책이 없습니다. 실제
                      판매 전 확정된 안내가 필요합니다.
                    </p>
                    <p className="shop-muted">
                      이 검수용 화면에서는 실제 주문·교환·반품을 접수하지
                      않습니다.
                    </p>
                  </div>
                </details>
                <details className="product-guide">
                  <summary>
                    유의사항<span aria-hidden="true">+</span>
                  </summary>
                  <div>
                    <p>
                      옵션과 수량을 선택해 장바구니에 담을 수 있으며 같은
                      상품·옵션은 수량이 합산됩니다.
                    </p>
                    <p>
                      가격 미등록 상품은 장바구니에 담을 수 없습니다. 실제
                      결제는 지원하지 않습니다.
                    </p>
                  </div>
                </details>
              </div>
            </div>
            {related.length > 0 && (
              <section
                className="product-related"
                aria-labelledby="related-title"
              >
                <h2 id="related-title">함께 보면 좋은 상품</h2>
                <div className="product-related-grid">
                  {related.map((item) => (
                    <Link
                      className="product-related-card"
                      key={item.id}
                      to={"/goods?id=" + encodeURIComponent(item.id)}
                    >
                      <div className="product-related-image">
                        <img
                          src={shop.assetUrl(item.images[0])}
                          alt={item.name}
                          loading="lazy"
                        />
                      </div>
                      <h3>{item.name}</h3>
                      <p>{shop.money(item.price)}</p>
                      <span className="product-related-link" aria-hidden="true">
                        상품 보기 ↗
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        </>
      )}
      <p className="product-back">
        <Link className="shop-button" to="/#goods">
          GOODS 목록으로
        </Link>
      </p>
    </main>
  );
}
