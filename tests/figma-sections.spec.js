import { expect, test } from "@playwright/test";

const sectionIds = [
  "rooms",
  "booking-help",
  "promos",
  "services",
  "hotel-benefits",
  "information",
  "reviews",
  "atmosphere",
  "gallery",
  "booking",
  "blog",
  "vacancies",
  "faq",
];

async function openPage(page) {
  await page.addInitScript(() => {
    window.sessionStorage.setItem("ageGate", "passed");
    document.cookie = "cookieConsent=accepted; path=/; SameSite=Lax";
  });

  await page.goto("/");
  await page.waitForFunction(() => window.Modals?._isInitialized === true);
}

async function expectInsideViewport(page, locator) {
  const viewport = page.viewportSize();
  const box = await locator.boundingBox();

  expect(box).not.toBeNull();
  expect(box.width).toBeGreaterThan(0);
  expect(box.x).toBeGreaterThanOrEqual(-1);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
}

async function expectNoHorizontalPageScroll(page) {
  const metrics = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    scrollX: window.scrollX,
  }));

  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
  expect(metrics.scrollX).toBe(0);
}

async function swipeLeft(page, locator) {
  await locator.scrollIntoViewIfNeeded();

  const box = await locator.boundingBox();
  expect(box).not.toBeNull();

  const y = box.y + box.height / 2;
  const startX = box.x + box.width - 16;
  const endX = box.x + 16;

  let client;

  try {
    client = await page.context().newCDPSession(page);
    await client.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: startX, y }],
    });

    for (let step = 1; step <= 8; step += 1) {
      const x = startX + ((endX - startX) * step) / 8;
      await client.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x, y }],
      });
    }

    await client.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
  } catch {
    const advanced = await locator.evaluate((element) => {
      const swiper = element.swiper || element.closest(".swiper")?.swiper;

      if (!swiper) return false;

      if (swiper.params.loop && typeof swiper.slideToLoop === "function") {
        const realSlides =
          swiper.el.querySelectorAll(
            ":scope > .swiper-wrapper > .swiper-slide:not(.swiper-slide-duplicate)",
          ).length || swiper.slides.length;
        swiper.slideToLoop((swiper.realIndex + 1) % realSlides, 0, false);
      } else {
        swiper.slideTo(Math.min(swiper.activeIndex + 1, swiper.slides.length - 1), 0, false);
      }

      swiper.updateSlidesClasses();

      return true;
    });

    expect(advanced).toBe(true);
  } finally {
    await client?.detach();
  }

  await page.waitForTimeout(400);
}

test.describe("figma-driven homepage sections", () => {
  test("renders new sections in the requested order", async ({ page }) => {
    await openPage(page);

    for (const id of sectionIds) {
      await expect(page.locator(`#${id}`)).toHaveCount(1);
      await expect(page.locator(`#${id}`)).toBeVisible();
    }

    const ordered = await page.evaluate((ids) => {
      const nodes = ids.map((id) => document.getElementById(id));

      return nodes.every((node, index) => {
        if (!node) return false;
        const next = nodes[index + 1];
        if (!next) return true;

        return Boolean(
          node.compareDocumentPosition(next) &
            Node.DOCUMENT_POSITION_FOLLOWING,
        );
      });
    }, sectionIds);

    expect(ordered).toBe(true);
  });

  test("keeps key section surfaces inside the viewport", async ({ page }) => {
    await openPage(page);

    const selectors = [
      "#booking-help .booking-help__panel",
      "#hotel-benefits .hotel-benefits__cards",
      "#information .comfort-details__item",
      "#reviews > .container",
      "#atmosphere .atmosphere__video",
      "#gallery .gallery__main-wrap",
      "#booking .booking-panel__panel",
      "#blog .articles__body",
      "#faq > .container",
    ];

    for (const selector of selectors) {
      await expectInsideViewport(page, page.locator(selector).first());
    }
  });

  test("renders footer from Figma on desktop and mobile", async ({ page }, testInfo) => {
    await openPage(page);

    const footer = page.locator("#footer");
    await footer.scrollIntoViewIfNeeded();

    await expect(footer).toBeVisible();
    await expect(footer.getByRole("link", { name: "Хвоя" })).toHaveAttribute("href", "/");
    await expect(footer.getByRole("navigation", { name: "Навигация по странице" })).toBeVisible();
    await expect(footer.locator(".footer__nav-list a")).toHaveCount(8);
    await expect(footer.getByRole("link", { name: "Номера" })).toHaveAttribute("href", "#rooms");
    await expect(footer.getByText("г. Тула, ул. Советская 47")).toBeVisible();
    await expect(footer.getByText("ТЦ Гостиный двор 5 этаж")).toBeVisible();
    await expect(footer.getByRole("link", { name: /\+ 7\s*\(487\)\s*236/ })).toHaveAttribute(
      "href",
      "tel:+79990000000",
    );
    await expect(footer.getByRole("link", { name: "contact@example.test" })).toHaveAttribute(
      "href",
      "mailto:contact@example.test",
    );
    await expect(footer.locator(".footer__social")).toHaveCount(4);
    await expect(footer.getByRole("link", { name: "Политика конфиденциальности" })).toBeVisible();
    await expect(footer.getByText("© 2026, ООО")).toBeVisible();
    await expectInsideViewport(page, footer.locator(".footer__top"));
    await expectInsideViewport(page, footer.locator(".footer__media"));
    await expectNoHorizontalPageScroll(page);

    const layout = await footer.evaluate((node) => {
      const rect = (selector) => {
        const element = node.querySelector(selector);
        const box = element.getBoundingClientRect();

        return {
          x: Math.round(box.x),
          y: Math.round(box.y),
          width: Math.round(box.width),
          height: Math.round(box.height),
        };
      };

      return {
        top: rect(".footer__top"),
        media: rect(".footer__media"),
        contacts: rect(".footer__contacts"),
        nav: rect(".footer__nav"),
        legal: rect(".footer__legal"),
      };
    });

    if (testInfo.project.name === "desktop") {
      expect(layout.top.y).toBeLessThan(layout.media.y);
      expect(layout.media.y).toBeLessThan(layout.contacts.y);
      expect(layout.media.height).toBeGreaterThan(280);
      expect(layout.nav.x).toBeGreaterThan(layout.top.x);
    } else {
      expect(layout.top.y).toBeLessThan(layout.media.y);
      expect(layout.media.y).toBeLessThan(layout.contacts.y);
      expect(layout.contacts.y).toBeLessThan(layout.legal.y);
      expect(layout.media.height).toBe(350);
    }
  });

  test("initializes reviews slider and keeps cards visible", async ({ page }, testInfo) => {
    await openPage(page);

    const reviews = page.locator("#reviews");
    await expect(reviews.locator(".reviews__slider.swiper-initialized")).toHaveCount(1);
    await expect(reviews.locator(".reviews__card")).toHaveCount(4);

    await expectInsideViewport(page, reviews.locator(".reviews__card").first());

    if (testInfo.project.name === "desktop") {
      await reviews.getByRole("button", { name: "Следующий отзыв" }).click();
    } else {
      const cardBox = await reviews.locator(".reviews__card").first().boundingBox();
      expect(cardBox).not.toBeNull();
      await page.touchscreen.tap(cardBox.x + cardBox.width - 10, cardBox.y + 10);
    }

    await expectInsideViewport(page, reviews.locator(".reviews__card.swiper-slide-active"));
  });

  test("reviews read-more opens the shared review modal", async ({ page }) => {
    await openPage(page);

    const reviews = page.locator("#reviews");
    const modal = page.locator('[data-modal="modalReviews"]');

    await expect(modal).toHaveCount(1);
    await reviews.locator(".reviews__more").first().click();

    await expect(modal).toBeVisible();
    await expect(modal.locator(".reviews-modal__text")).toContainText("Искали место для годовщины");
    await expect(modal.locator(".reviews__more")).toHaveCount(0);

    await page.keyboard.press("Escape");
    await expect(modal).toBeHidden();
  });

  test("rooms cards open one shared room modal without hijacking slider bullets", async ({ page }, testInfo) => {
    let roomPayload;

    await page.route("**/ajax/form", async (route) => {
      roomPayload = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });

    await openPage(page);

    const rooms = page.locator("#rooms");
    const firstCard = rooms.locator(".room-card").first();
    const modal = page.locator('[data-modal="modalRoom"]');
    const contactModal = page.locator('[data-modal="modalContact"]');
    const successModal = page.locator('[data-modal="modalSuccess"]');

    await expect(modal).toHaveCount(1);
    await expect(contactModal).toHaveCount(1);
    await expect(page.locator('[data-modal="modalReviews"]')).toHaveCount(1);

    if (testInfo.project.name === "desktop") {
      await expect(firstCard.locator(".room-card__more")).toBeVisible();
      await expect(firstCard.locator(".room-card__more")).toHaveCSS("opacity", "1");
    } else {
      await expect(firstCard.locator(".room-card__more")).toHaveCSS("opacity", "1");
    }

    await firstCard.locator(".room-card__dots .swiper-pagination-bullet").nth(4).click();
    await expect(modal).toBeHidden();

    await firstCard.locator(".swiper-slide-active").click();
    await expect(modal).toBeVisible();
    await expect(modal.getByRole("heading", { name: "А-фрейм с купелью" })).toBeVisible();
    await expect
      .poll(() => modal.locator(".room-modal__slide").count())
      .toBeGreaterThanOrEqual(5);
    const modalImageBefore = await modal
      .locator(".room-modal__slide.swiper-slide-active img")
      .first()
      .getAttribute("src");
    await modal.getByRole("button", { name: "Следующее фото" }).click();
    await expect
      .poll(() =>
        modal
          .locator(".room-modal__slide.swiper-slide-active img")
          .first()
          .getAttribute("src"),
      )
      .not.toBe(modalImageBefore);
    await modal.getByRole("button", { name: "Закрыть" }).click();
    await expect(modal).toBeHidden();

    await firstCard.getByRole("button", { name: "Выбрать" }).click();
    await expect(modal).toBeHidden();
    await expect(contactModal).toBeVisible();
    await expect(contactModal.getByText("Мы всегда на связи")).toBeVisible();
    await contactModal.getByRole("button", { name: "Закрыть" }).click();
    await expect(contactModal).toBeHidden();

    if (testInfo.project.name === "desktop") {
      await firstCard.hover();
      await expect(firstCard.locator(".room-card__more")).toHaveCSS("opacity", "1");
      await expect(firstCard.locator(".swiper-slide-active img")).toHaveCSS("transform", "none");
    }

    await firstCard.locator(".room-card__title").click();
    await expect(modal).toBeVisible();
    await expect(modal.getByRole("heading", { name: "А-фрейм с купелью" })).toBeVisible();
    await expect(modal.getByText("Максимальное расслабление")).toBeVisible();
    await expect(modal.getByText("Купель фурако", { exact: true })).toBeVisible();
    await expect(modal.getByText("от 18 500 ₽ /ночь")).toBeVisible();

    if (testInfo.project.name === "desktop") {
      await expect(modal.locator(".room-modal__dots .swiper-pagination-bullet-active")).toHaveCount(1);

      const roomModalMetrics = await modal.evaluate((modalElement) => {
        const media = modalElement.querySelector(".room-modal__media");
        const dots = modalElement.querySelector(".room-modal__dots");
        const bottom = modalElement.querySelector(".modal-form__bottom--row");

        const mediaRect = media.getBoundingClientRect();
        const dotsRect = dots.getBoundingClientRect();

        return {
          formGap: Number.parseFloat(getComputedStyle(bottom).gap),
          rootFontSize: Number.parseFloat(getComputedStyle(document.documentElement).fontSize),
          mediaLeft: mediaRect.left,
          mediaRight: mediaRect.right,
          dotsLeft: dotsRect.left,
          dotsRight: dotsRect.right,
          dotsClassName: dots.className,
          bullets: [...modalElement.querySelectorAll(".room-modal__dots .swiper-pagination-bullet")]
            .map((bullet) => ({
              className: bullet.className,
              borderRadius: getComputedStyle(bullet).borderRadius,
              width: bullet.getBoundingClientRect().width,
              transform: getComputedStyle(bullet).transform,
            })),
        };
      });
      const activeBullet = roomModalMetrics.bullets.find((bullet) =>
        bullet.className.includes("swiper-pagination-bullet-active"),
      );
      const inactiveBullets = roomModalMetrics.bullets.filter((bullet) =>
        !bullet.className.includes("swiper-pagination-bullet-active"),
      );

      expect(roomModalMetrics.formGap).toBeCloseTo(16 * roomModalMetrics.rootFontSize, 1);
      expect(roomModalMetrics.dotsLeft).toBeGreaterThanOrEqual(roomModalMetrics.mediaLeft);
      expect(roomModalMetrics.dotsRight).toBeLessThanOrEqual(roomModalMetrics.mediaRight);
      expect(roomModalMetrics.dotsClassName).not.toContain("swiper-pagination-bullets-dynamic");
      expect(activeBullet).toBeTruthy();
      expect(activeBullet.width).toBeGreaterThan(Math.max(...inactiveBullets.map((bullet) => bullet.width)));
      expect(new Set(inactiveBullets.map((bullet) => Math.round(bullet.width))).size).toBe(1);
      expect(roomModalMetrics.bullets.every((bullet) => bullet.borderRadius !== "0px")).toBe(true);
      expect(inactiveBullets.every((bullet) => bullet.transform !== "none")).toBe(true);
    }

    await modal.getByRole("button", { name: "Бронировать" }).click();
    await expect(modal).toBeVisible();
    await expect(modal.locator(".modal-form__field.error")).toHaveCount(2);
    await expect(modal.locator(".modal-form__policy.error")).toHaveCount(1);
    expect(roomPayload).toBeUndefined();

    await modal.getByLabel("Имя").fill("Иван");
    await modal.getByLabel("Номер телефона").fill("3433103838");
    await modal.locator('input[name="agree"]').check();
    await modal.getByRole("button", { name: "Бронировать" }).click();

    await expect(successModal).toBeVisible();
    await expect(modal).toBeHidden();
    await expect(contactModal).toBeHidden();
    expect(roomPayload).toMatchObject({
      name: "Иван",
      phone: "+7 (343) 310-38-38",
      agree: "on",
    });

    await successModal.getByRole("button", { name: "Закрыть" }).click();
    await expect(successModal).toBeHidden();

    await firstCard.locator(".room-card__more").click();
    await expect(modal).toBeVisible();
    await expectNoHorizontalPageScroll(page);
  });

  test("promo cards reveal primary CTA and reuse contact modal", async ({ page }, testInfo) => {
    await openPage(page);

    const promoCard = page.locator("#promos .promo-card").first();
    const button = promoCard.getByRole("button", { name: /Забронировать дом|Выбрать/ });
    const modal = page.locator('[data-modal="modalContact"]');

    await expect(page.locator("#promos .promo-card")).toHaveCount(3);
    await expect(page.locator("#promos .promos__slider.swiper-initialized")).toHaveCount(1);

    if (testInfo.project.name === "desktop") {
      await promoCard.hover();
    }

    await expect(button).toBeVisible();

    await button.click();
    await expect(modal).toBeVisible();
    await expect(modal.getByText("Мы всегда на связи")).toBeVisible();
    await modal.getByRole("button", { name: "Закрыть" }).click();
    await expect(modal).toBeHidden();

    if (testInfo.project.name === "desktop") {
      const transformBefore = await page
        .locator("#promos .promos__list")
        .evaluate((node) => getComputedStyle(node).transform);

      await page.locator("#promos .promos__arrow--next").click();
      await expect
        .poll(() =>
          page
            .locator("#promos .promos__list")
            .evaluate((node) => getComputedStyle(node).transform),
        )
        .not.toBe(transformBefore);
    }

    await expect(page.locator("#promos .promo-card__link")).toHaveCount(0);
  });

  test("atmosphere poster is video-ready without breaking when no source is set", async ({ page }) => {
    await openPage(page);

    const atmosphere = page.locator("#atmosphere");
    await expect(atmosphere.getByRole("heading", { name: "Почувствуйте атмосферу" })).toBeVisible();
    await expect(atmosphere.getByRole("button", { name: "Смотреть" })).toBeVisible();

    const hasSource = await atmosphere
      .locator("video")
      .evaluate((video) => Boolean(video.currentSrc || video.querySelector("source")));

    await atmosphere.getByRole("button", { name: "Смотреть" }).click();

    if (hasSource) {
      await expect(atmosphere.locator(".atmosphere__video")).toHaveClass(/is-started/);
      await expect(atmosphere.locator("video")).toHaveJSProperty("controls", true);
    } else {
      await expect(atmosphere.locator(".atmosphere__video")).not.toHaveClass(/is-started/);
      await expect(atmosphere.getByRole("button", { name: "Смотреть" })).toBeVisible();
    }
  });

  test("initializes gallery with synced thumbnails", async ({ page }, testInfo) => {
    await openPage(page);

    const gallery = page.locator("#gallery");
    await expect(gallery.getByRole("heading", { name: "Магия момента в деталях" })).toBeVisible();
    await expect(gallery.locator(".gallery__main.swiper-initialized")).toHaveCount(1);
    await expect(gallery.locator(".gallery__arrow.slider-arrow")).toHaveCount(2);
    await expect(gallery.locator(".gallery__slide:not(.swiper-slide-duplicate)")).toHaveCount(5);
    await expect(gallery.locator(".gallery__slide:not(.swiper-slide-duplicate) .glightbox")).toHaveCount(5);

    const firstActiveSrc = await gallery
      .locator(".gallery__main .swiper-slide-active img")
      .first()
      .getAttribute("src");

    await gallery.locator(".gallery__main .swiper-slide-active .glightbox").first().click();
    await expect(page.locator(".glightbox-container")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator(".glightbox-container")).toHaveCount(0);

    if (testInfo.project.name === "desktop") {
      const galleryArrowBox = await gallery.locator(".gallery__arrow--next").boundingBox();
      const reviewsArrowBox = await page.locator("#reviews .reviews__arrow--next").boundingBox();
      expect(galleryArrowBox).not.toBeNull();
      expect(reviewsArrowBox).not.toBeNull();
      expect(Math.round(galleryArrowBox.width)).toBe(Math.round(reviewsArrowBox.width));
      expect(Math.round(galleryArrowBox.height)).toBe(Math.round(reviewsArrowBox.height));

      await gallery.getByRole("button", { name: "Следующее фото" }).click();
      await expect
        .poll(() =>
          gallery.locator(".gallery__main .swiper-slide-active img").first().getAttribute("src"),
        )
        .not.toBe(firstActiveSrc);
    } else {
      const beforeSwipeIndex = await gallery
        .locator("[data-gallery-main]")
        .evaluate((slider) => slider.swiper.realIndex);

      await swipeLeft(page, gallery.locator(".gallery__slide.swiper-slide-active"));
      await expect
        .poll(() => gallery.locator("[data-gallery-main]").evaluate((slider) => slider.swiper.realIndex))
        .not.toBe(beforeSwipeIndex);
      await expectNoHorizontalPageScroll(page);
    }
  });

  test("booking CTA targets rooms and articles expose future links", async ({ page }) => {
    await openPage(page);

    await expect(page.locator("#booking")).toHaveCount(1);
    await expect(page.locator("#booking-start")).toHaveCount(1);
    await expect(page.locator("#gallery")).toHaveCount(1);
    await expect(page.locator("#blog")).toHaveCount(1);
    await expect(page.locator("#reviews")).toHaveCount(1);

    const bookingStart = page.locator("#booking-start");
    await expect(bookingStart.getByRole("link", { name: "Забронировать дом" })).toHaveAttribute(
      "href",
      "#rooms",
    );
    await bookingStart.getByRole("link", { name: "Забронировать дом" }).click();
    await expect.poll(() => page.evaluate(() => window.location.hash)).toBe("#rooms");

    const booking = page.locator("#booking");
    await expect(booking.getByRole("link", { name: "Найти номер" })).toHaveAttribute(
      "href",
      "#rooms",
    );
    await booking.scrollIntoViewIfNeeded();
    await booking.getByRole("link", { name: "Найти номер" }).click();
    await expect.poll(() => page.evaluate(() => window.location.hash)).toBe("#rooms");

    await expect(page.locator("#blog .article-card")).toHaveCount(3);

    await expect
      .poll(() => page.locator("#blog .article-card").evaluateAll((cards) => cards.map((card) => card.getAttribute("href"))))
      .toEqual([
        "/blog/weekend-in-moscow/",
        "/blog/early-breakfast/",
        "/blog/family-weekend/",
      ]);
  });

  test("articles showcase stays stable on desktop and mobile", async ({ page }) => {
    await openPage(page);

    const articles = page.locator("#blog");

    await expect(articles.getByRole("heading", { name: /Новости хвойного леса/ })).toBeVisible();
    await expect(articles.locator(".articles__grid")).toBeVisible();
    await expect(articles.locator(".articles__side")).toBeVisible();
    await expect(articles.locator(".article-card")).toHaveCount(3);
    await expect(articles.locator(".articles__slider.swiper-initialized")).toHaveCount(0);
    await expectInsideViewport(page, articles.locator(".article-card").first());
    await expectNoHorizontalPageScroll(page);
  });

  test("faq accordion opens one item and syncs aria state", async ({ page }) => {
    await openPage(page);

    const faq = page.locator("#faq");
    await faq.scrollIntoViewIfNeeded();

    await expect(faq).toBeVisible();
    await expectInsideViewport(page, faq.locator(":scope > .container"));
    await expect(faq.getByRole("heading", { name: /Ответы на\s+часто\s+задаваемые вопросы/ })).toBeVisible();
    await expect(faq.locator(".faq__social")).toHaveCount(4);

    const parkingButton = faq.getByRole("button", {
      name: /Есть парковка\?/,
    });
    const checkinButton = faq.getByRole("button", {
      name: /Можно\s+ли оформить ранний заезд,\s+поздний выезд и\s+оставить багаж до\s+заселения\?/,
    });

    await expect(parkingButton).toHaveAttribute("aria-expanded", "false");
    await expect(checkinButton).toHaveAttribute("aria-expanded", "false");

    await parkingButton.click();
    await expect(parkingButton).toHaveAttribute("aria-expanded", "true");
    await expect(faq.locator("#faq-answer-parking")).toBeVisible();

    await checkinButton.click();

    await expect(checkinButton).toHaveAttribute("aria-expanded", "true");
    await expect(faq.locator("#faq-answer-checkin")).toBeVisible();
    await expect(parkingButton).toHaveAttribute("aria-expanded", "false");
    await expect(faq.locator("#faq-answer-parking")).toBeHidden();
    await expectInsideViewport(page, faq.locator(":scope > .container"));
    await expectNoHorizontalPageScroll(page);
  });

  test("vacancies use one modal populated from clicked card", async ({ page }, testInfo) => {
    await openPage(page);

    const vacancies = page.locator("#vacancies");
    const modal = page.locator('[data-modal="modalVacancy"]');
    const contactModal = page.locator('[data-modal="modalContact"]');
    const firstCard = vacancies.locator(".vacancy-card").first();
    const secondCard = vacancies.locator(".vacancy-card").nth(1);

    await expect(vacancies).toBeVisible();
    await expect(vacancies.locator(".vacancy-card")).toHaveCount(6);
    await expect(vacancies.locator(".vacancy-card__hitarea")).toHaveCount(6);
    await expect(firstCard.locator("h3.vacancy-card__title")).toHaveText("Разнорабочий рабочий");
    await expect(modal).toHaveCount(1);
    await expect(contactModal).toHaveCount(1);

    await vacancies.getByRole("button", { name: "Откликнуться" }).click();
    await expect(contactModal).toBeVisible();
    await expect(contactModal.getByText("Сделайте шаг к новой работе")).toBeVisible();
    await expect(contactModal.getByText("Заполните обязательные поля")).toBeVisible();
    await contactModal.getByRole("button", { name: "Закрыть" }).click();
    await expect(contactModal).toBeHidden();

    if (testInfo.project.name === "desktop") {
      await expect(firstCard.locator(".vacancy-card__more")).toHaveCSS("opacity", "1");
      await firstCard.hover();
      await expect(firstCard.locator(".vacancy-card__more")).toHaveCSS("opacity", "1");
      await expect(vacancies.locator(".vacancies__slider.swiper-initialized")).toHaveCount(0);
      await expect(vacancies.locator(".vacancies__cards")).toHaveCSS("display", "grid");
    } else {
      await expect(vacancies.locator(".vacancies__slider.swiper-initialized")).toHaveCount(1);
      await expect(firstCard.locator(".vacancy-card__more")).toBeVisible();
      await expect(firstCard.locator(".vacancy-card__more")).toHaveCSS("opacity", "1");

      const firstCardBox = await firstCard.boundingBox();
      const sliderBox = await vacancies.locator(".vacancies__slider").boundingBox();

      expect(firstCardBox).not.toBeNull();
      expect(sliderBox).not.toBeNull();
      expect(Math.round(firstCardBox.width)).toBe(320);
      expect(sliderBox.width).toBeGreaterThan(firstCardBox.width);
      expect(sliderBox.x + sliderBox.width).toBeLessThanOrEqual(page.viewportSize().width + 1);

      const sliderMetrics = await vacancies.locator(".vacancies__slider").evaluate((node) => ({
        clientWidth: node.clientWidth,
        slides: node.swiper?.slides?.length ?? 0,
        spaceBetween: node.swiper?.params?.spaceBetween ?? 0,
        trackWidth: node.querySelector(".vacancies__cards")?.scrollWidth ?? 0,
      }));
      expect(sliderMetrics.slides).toBe(6);
      expect(sliderMetrics.spaceBetween).toBe(12);
      expect(sliderMetrics.trackWidth).toBeGreaterThan(sliderMetrics.clientWidth);

      const swiperState = await vacancies.locator(".vacancies__slider").evaluate((slider) => ({
        enabled: slider.swiper?.enabled ?? false,
        isLocked: slider.swiper?.isLocked ?? true,
      }));
      expect(swiperState.enabled).toBe(true);
      expect(swiperState.isLocked).toBe(false);
    }

    await firstCard.click();
    await expect(modal).toBeVisible();
    await expect(modal).toHaveAttribute("aria-hidden", "false");
    await expect(modal.getByRole("heading", { name: "Разнорабочий рабочий" })).toBeVisible();
    await expect(modal.getByText("Мы ищем внимательного человека")).toBeVisible();
    await expect(modal.getByText("Помогать команде с хозяйственными задачами")).toBeVisible();
    await expect(modal.locator(".vacancy-modal__details")).toHaveCSS("overflow-y", "auto");

    const urlBefore = page.url();
    await modal.getByRole("button", { name: "Оставить заявку" }).click();
    await expect(modal).toBeHidden();
    await expect(contactModal).toBeVisible();
    await expect(contactModal.getByText("Сделайте шаг к новой работе")).toBeVisible();
    await expect(contactModal.getByText("Заполните обязательные поля")).toBeVisible();
    expect(page.url()).toBe(urlBefore);

    await page.keyboard.press("Escape");
    await expect(contactModal).toBeHidden();

    await secondCard.click();
    await expect(modal).toBeVisible();
    await expect(modal.getByRole("heading", { name: "Разнорабочий рабочий" })).toBeVisible();
    await expect(modal.getByText("Работу в спокойной команде")).toBeVisible();

    await modal.getByRole("button", { name: "Закрыть" }).click();
    await expect(modal).toBeHidden();
    await expectNoHorizontalPageScroll(page);
  });
});
