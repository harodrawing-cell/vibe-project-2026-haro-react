const fs = require("node:fs"),
  path = require("node:path"),
  http = require("node:http"),
  assert = require("node:assert/strict");
const { chromium } = require("playwright");
(async () => {
  const root = path.resolve("dist");
  // Production GOODS build; external network is blocked by the test harness.
  const headers = { "Cache-Control": "no-store" };
  const mime = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".css": "text/css",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".woff2": "font/woff2",
  };
  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(
        new URL(req.url, "http://local").pathname,
      ),
      file = path.resolve(
        root,
        "." + (pathname === "/" ? "/index.html" : pathname),
      );
    if (
      !file.startsWith(root + path.sep) ||
      !fs.existsSync(file) ||
      !fs.statSync(file).isFile()
    )
      return res.writeHead(404, headers).end();
    res.writeHead(200, {
      ...headers,
      "Content-Type": mime[path.extname(file)] || "application/octet-stream",
    });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const origin = "http://127.0.0.1:" + server.address().port;

  const catalog = JSON.parse(fs.readFileSync("data/products.json", "utf8"));
  const browser = await chromium.launch({
    executablePath:
      "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    headless: true,
  });
  const checks = [],
    errors = [],
    external = [],
    missing = [];
  try {
    fs.mkdirSync("test-results/goods-browser", { recursive: true });
    const context = await browser.newContext({ reducedMotion: "reduce" });
    await context.route("**/*", (r) => {
      if (new URL(r.request().url()).origin === origin) return r.continue();
      external.push(new URL(r.request().url()).origin);
      return r.abort();
    });
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("response", (r) => {
      if (r.status() >= 400) missing.push(r.url());
    });
    await page.goto(origin + "/");
    await page.locator(".goods-card__link").first().waitFor();
    const listing=await page.locator(".goods-card__link").evaluateAll(els=>els.map(el=>({href:el.getAttribute("href"),text:el.innerText,image:decodeURIComponent(new URL(el.querySelector("img").src).pathname)})));
    assert.equal(listing.length,catalog.products.length);
    for (const item of catalog.products) {
      const card=listing.find(card=>card.href==="#/goods?id="+item.id);
      assert.ok(card?.text.includes(item.name));
      assert.equal(card.image,"/"+item.images[0]);
    }
    assert.ok(listing.find(card=>card.href==="#/goods?id=sticky-cleaner").text.includes("4,800원"));
    const seed = [
      { productId: "haro-note", optionId: "white-105-148", quantity: 2 },
    ];
    await page.goto(origin + "/#/cart");
    await page.evaluate(
      (seed) => localStorage.setItem("haro-cart-v1", JSON.stringify(seed)),
      seed,
    );
    const originalStorage = await page.evaluate(() =>
      localStorage.getItem("haro-cart-v1"),
    );
    let footer;
    for (const width of [1920, 1440, 1366, 1024, 768, 390]) {
      await page.setViewportSize({ width, height: width === 1366 ? 768 : 900 });
      await page.goto(origin + "/#/cart");
      await page.goto(origin + "/#/goods?id=haro-note");
      await page.locator("#product-name").waitFor();
      const product = catalog.products.find((p) => p.id === "haro-note");
      assert.equal(
        await page.locator("#product-name").innerText(),
        product.name,
      );
      assert.equal(await page.locator(".product-price").innerText(), "4,500원");
      assert.equal(
        await page.locator(".product-thumbnail").count(),
        product.images.length,
      );
      await page
        .getByRole("button", { name: "상품 이미지 2", exact: true })
        .click();
      assert.ok(
        (
          await page.locator(".product-main-image").getAttribute("src")
        ).endsWith(encodeURI(product.images[1])) ||
          (
            await page.locator(".product-main-image").getAttribute("src")
          ).endsWith(product.images[1]),
      );
      await page.locator(".product-main-image").evaluate((img) => img.decode());
      assert.equal(
        await page
          .getByRole("button", { name: "상품 이미지 2", exact: true })
          .getAttribute("aria-pressed"),
        "true",
      );
      await page.locator("#product-option").selectOption("white-105-148");
      await page.getByRole("button", { name: "상품 수량 늘리기" }).click();
      assert.equal(
        await page.locator(".product-total strong").innerText(),
        "9,000원",
      );
      await page.locator("#product-quantity").fill("0");
      assert.equal(
        await page
          .getByRole("button", { name: "장바구니 담기", exact: true })
          .isDisabled(),
        true,
      );
      await page.locator("#product-quantity").fill("2");
      assert.equal(
        await page
          .getByRole("button", { name: "바로 구매 (미지원)", exact: true })
          .isDisabled(),
        true,
      );
      const hash = await page.evaluate(() => location.hash);
      for (const [title, id] of [
        ["상품 상세", "product-details"],
        ["제품 정보", "product-specifications"],
        ["배송 안내", "product-delivery"],
        ["교환·반품", "product-returns"],
      ]) {
        await page
          .locator(".product-tabs")
          .getByRole("link", { name: title, exact: true })
          .click();
        assert.equal(await page.evaluate(() => location.hash), hash);
        assert.equal(
          await page.locator(".product-tabs a[aria-current]").innerText(),
          title,
        );
        if (id === "product-delivery" || id === "product-returns")
          assert.equal(await page.locator("#" + id).getAttribute("open"), "");
        const rect = await page.locator("#" + id).boundingBox();
        assert.ok(rect.y >= 50 && rect.y < 900, "section visible below header");
      }
      await page.locator("#product-returns summary").click();
      assert.equal(
        await page.locator("#product-returns").getAttribute("open"),
        null,
      );
      const related = await page
        .locator(".product-related-card")
        .evaluateAll((els) => els.map((e) => e.getAttribute("href")));
      assert.equal(related.length, 3);
      assert.ok(related.every((h) => !h.endsWith("id=haro-note")));
      const layout = await page.evaluate(() => {
        const main = document
            .querySelector(".product-main-image")
            .getBoundingClientRect(),
          info = document
            .querySelector(".product-info")
            .getBoundingClientRect();
        return {
          overflow: document.documentElement.scrollWidth > innerWidth,
          columns: info.left > main.left + main.width,
          thumbnailOverflow: getComputedStyle(
            document.querySelector(".product-thumbnails"),
          ).overflowX,
        };
      });
      assert.equal(layout.overflow, false);
      assert.equal(layout.columns, width > 768);
      assert.equal(layout.thumbnailOverflow, "auto");
      assert.equal(
        await page.evaluate(() => localStorage.getItem("haro-cart-v1")),
        originalStorage,
      );
      const currentFooter = await page
        .locator(".site-footer")
        .evaluate((el) => ({
          text: el.innerText,
          links: [...el.querySelectorAll("a")].map((a) =>
            a.getAttribute("href"),
          ),
        }));
      footer ??= currentFooter;
      assert.deepEqual(currentFooter, footer);
      await page.locator(".product-gallery").scrollIntoViewIfNeeded();
      await page.evaluate(() => {
        document.activeElement?.blur();
        scrollTo(0, 0);
      });
      await page.screenshot({
        path: "test-results/goods-browser/product-" + width + ".png",
        fullPage: true,
      });
      checks.push({
        width,
        columns: layout.columns,
        thumbnails: true,
        quantity: true,
        tabs: true,
        accordion: true,
        storageUnchanged: true,
        footerUnchanged: true,
        noOverflow: true,
      });
    }
    // Existing same-option aggregation and reload restoration.
    await page
      .getByRole("button", { name: "장바구니 담기", exact: true })
      .click();
    await page.getByText("장바구니에 담았습니다.", { exact: true }).waitFor();
    assert.deepEqual(
      await page.evaluate(() =>
        JSON.parse(localStorage.getItem("haro-cart-v1")),
      ),
      [{ ...seed[0], quantity: 4 }],
    );
    await page
      .getByRole("link", { name: "장바구니 보기", exact: true })
      .click();
    await page.locator(".cart-item").waitFor();
    await page.reload();
    await page.locator(".cart-item").waitFor();
    assert.equal(await page.locator(".cart-item input").inputValue(), "4");
    // Shared UI must stay data-driven across every registered product and viewport.
    const productChecks = [];
    const storedCart = await page.evaluate(() =>
      localStorage.getItem("haro-cart-v1"),
    );
    fs.mkdirSync("test-results/goods-browser/catalog", { recursive: true });
    for (const item of catalog.products) {
      await page.goto(origin + "/#/goods?id=" + item.id);
      await page.waitForFunction(
        (name) => document.querySelector("#product-name")?.textContent === name,
        item.name,
      );
      assert.equal(await page.locator("#product-quantity").inputValue(), "1");
      assert.equal(await page.locator("#product-option").inputValue(), "");
      for (const width of [1920, 1440, 1366, 1024, 768, 390]) {
        await page.setViewportSize({
          width,
          height: width === 1366 ? 768 : 900,
        });
        assert.equal(
          await page.locator("#product-name").innerText(),
          item.name,
        );
        assert.equal(
          await page.locator(".product-price").innerText(),
          item.price === null
            ? "가격 미등록"
            : item.price.toLocaleString("ko-KR") + "원",
        );
        assert.equal(
          await page.locator(".product-thumbnail").count(),
          item.images.length,
        );
        assert.deepEqual(
          await page
            .locator("#product-option option")
            .evaluateAll((els) =>
              els.slice(1).map((e) => ({ id: e.value, label: e.textContent })),
            ),
          item.options,
        );
        await page.locator("#product-option").selectOption(item.options[0].id);
        assert.equal(
          await page
            .getByRole("button", { name: "장바구니 담기", exact: true })
            .isDisabled(),
          item.price === null,
        );
        assert.equal(
          await page
            .getByRole("button", { name: "바로 구매 (미지원)", exact: true })
            .isDisabled(),
          true,
        );
        await page
          .locator(".product-main-image")
          .evaluate((img) => img.decode());
        const main = await page
          .locator(".product-main-image")
          .evaluate((img) => ({
            path: decodeURIComponent(new URL(img.src).pathname),
            fit: getComputedStyle(img).objectFit,
          }));
        assert.ok(
          main.path.endsWith("/" + item.images[0]),
          item.id + " main image mapping",
        );
        assert.equal(main.fit, "contain");
        const thumbnails = await page
          .locator(".product-thumbnail img")
          .evaluateAll((imgs) =>
            imgs.map((img) => decodeURIComponent(new URL(img.src).pathname)),
          );
        assert.deepEqual(
          thumbnails,
          item.images.map((src) => "/" + src),
        );
        const details = await page
          .locator(".product-detail-image")
          .evaluateAll((imgs) =>
            Promise.all(
              imgs.map(async (img) => {
                await img.decode();
                return decodeURIComponent(new URL(img.src).pathname);
              }),
            ),
          );
        assert.deepEqual(
          details,
          item.images.map((src) => "/" + src),
          item.id + " detail image mapping",
        );
        assert.equal(
          await page
            .locator(".product-gallery button:not(.product-thumbnail)")
            .count(),
          0,
        );
        assert.equal(
          await page.locator(".product-description").innerText(),
          item.description,
        );
        assert.equal(await page.locator(".product-tabs a").count(), 4);
        const related = await page
          .locator(".product-related-card")
          .evaluateAll((els) => els.map((e) => e.getAttribute("href")));
        assert.equal(related.length, Math.min(3, catalog.products.length - 1));
        assert.ok(related.every((h) => h !== "#/goods?id=" + item.id));
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          true,
          item.id + " " + width + " overflow",
        );
        const currentFooter = await page
          .locator(".site-footer")
          .evaluate((el) => ({
            text: el.innerText,
            links: [...el.querySelectorAll("a")].map((a) =>
              a.getAttribute("href"),
            ),
          }));
        assert.deepEqual(currentFooter, footer);
        assert.equal(
          await page.evaluate(() => localStorage.getItem("haro-cart-v1")),
          storedCart,
        );
        if ([1920, 1024, 390].includes(width)) {
          await page.evaluate(() => {
            document.activeElement?.blur();
            scrollTo(0, 0);
          });
          await page.screenshot({
            path:
              "test-results/goods-browser/catalog/" +
              item.id +
              "-" +
              width +
              ".png",
            fullPage: true,
          });
        }
        productChecks.push({
          id: item.id,
          width,
          images: item.images.length,
          price: item.price,
          addToCartEnabled: item.price !== null,
          correctMapping: true,
          footerUnchanged: true,
          noOverflow: true,
        });
      }
      // A new product must reset this previous selection.
      await page.locator("#product-quantity").fill("3");
    }
    await page.goto(origin + "/#/goods?id=haro-note");
    await page.locator("#product-name").waitFor();
    const next = await page
      .locator(".product-related-card")
      .first()
      .getAttribute("href");
    await page.locator(".product-related-card").first().click();
    await page.waitForURL((url) => url.hash === next);
    await page.waitForFunction(
      () =>
        document.querySelector("#product-name")?.textContent !==
        "Haro Note (105 × 148mm)",
    );
    assert.equal(await page.locator("#product-quantity").inputValue(), "1");
    assert.equal(await page.locator("#product-option").inputValue(), "");
    const isolated=await browser.newContext({viewport:{width:390,height:900},reducedMotion:"reduce"});
    await isolated.route("**/*",route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
    const mirrorPage=await isolated.newPage();
    await mirrorPage.goto(origin+"/#/goods?id=sticky-cleaner");
    await mirrorPage.locator("#product-name").waitFor();
    for(let index=0;index<5;index++){
      await mirrorPage.getByRole("button",{name:"상품 이미지 "+(index+1),exact:true}).click();
      await mirrorPage.locator(".product-main-image").evaluate(img=>img.decode());
    }
    await mirrorPage.locator("#product-option").selectOption("default");
    await mirrorPage.locator("#product-quantity").fill("2");
    assert.equal(await mirrorPage.locator(".product-total strong").innerText(),"9,600원");
    assert.equal(await mirrorPage.getByRole("button",{name:"바로 구매 (미지원)",exact:true}).isDisabled(),true);
    await mirrorPage.getByRole("button",{name:"장바구니 담기",exact:true}).click();
    await mirrorPage.getByRole("link",{name:"장바구니 보기",exact:true}).click();
    const waitTotal=amount=>mirrorPage.waitForFunction(amount=>document.querySelector(".cart-summary__total dd")?.textContent===amount,amount);
    await waitTotal("12,600원");
    assert.equal(await mirrorPage.getByRole("button",{name:"주문·결제 미지원",exact:true}).isDisabled(),true);
    await mirrorPage.getByRole("button",{name:"체크_하로 손거울 수량 늘리기",exact:true}).click();
    await waitTotal("17,400원");
    await mirrorPage.getByRole("button",{name:"체크_하로 손거울 수량 줄이기",exact:true}).click();
    await waitTotal("12,600원");
    await mirrorPage.reload();await waitTotal("12,600원");
    await mirrorPage.getByRole("button",{name:"체크_하로 손거울 장바구니에서 삭제",exact:true}).click();
    await mirrorPage.locator(".cart-empty").waitFor();
    await isolated.close();
    await page.goto(origin + "/#/goods?id=missing-product");
    await page
      .getByText("해당 상품을 찾을 수 없습니다.", { exact: true })
      .waitFor();
    assert.equal(await page.locator(".product-panel").count(), 0);
    assert.deepEqual(errors, []);
    // Baseline Auth/NOTICE may attempt reads; the route above aborts every external request.
    assert.deepEqual(missing, []);
    const report = {
      mode: "GOODS-only production build; all external requests blocked by test harness",
      checks,
      productRoutes: catalog.products.length,
      goodsListingVerified:true,mirrorTwoTotal:12600,realCheckoutDisabled:true,
      productChecks,
      cartAggregationAndReload: true,
      relatedNavigation: true,
      missingProductHandled: true,
      errors,
      external,
      missing,
    };
    fs.writeFileSync(
      "test-results/goods-browser/browser.json",
      JSON.stringify(report, null, 2),
    );
    console.log(
      JSON.stringify({
        responsiveChecks: checks.length,
        productRoutes: catalog.products.length,
        cartAndNavigation: true,
        blockedExternalRequests: external.length,
        errors: errors.length,
      }),
    );
  } finally {
    await browser.close();
    await new Promise((r) => server.close(r));
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
