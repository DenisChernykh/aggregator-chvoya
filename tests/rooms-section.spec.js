import { expect, test } from "@playwright/test";

async function openPage(page) {
  await page.addInitScript(() => {
    window.sessionStorage.setItem("ageGate", "passed");
    document.cookie = "cookieConsent=accepted; path=/; SameSite=Lax";
  });

  await page.goto("/");
  await page.waitForFunction(() => window.Modals?._isInitialized === true);
}

async function expectElementsInsideViewport(page, locator) {
  const viewport = page.viewportSize();
  const boxes = await locator.evaluateAll((elements) =>
    elements.map((element) => {
      const rect = element.getBoundingClientRect();

      return {
        left: rect.left,
        right: rect.right,
        width: rect.width,
      };
    }),
  );

  for (const box of boxes) {
    expect(box.width).toBeGreaterThan(0);
    expect(box.left).toBeGreaterThanOrEqual(0);
    expect(box.right).toBeLessThanOrEqual(viewport.width + 1);
  }
}

test.describe("rooms section", () => {
  test("renders with a single rooms anchor", async ({ page }) => {
    await openPage(page);

    await expect(page.locator("#rooms")).toHaveCount(1);
    await expect(page.locator("section.rooms#rooms")).toBeVisible();
  });

  test("keeps cards and categories inside viewport", async ({ page }, testInfo) => {
    await openPage(page);

    const rooms = page.locator("#rooms");
    await expect(rooms).toBeVisible();

    await expectElementsInsideViewport(page, rooms.locator(".room-card.active").first());
    await expectElementsInsideViewport(page, rooms.locator(".rooms__categories"));
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth),
      )
      .toBeLessThanOrEqual(1);

    if (testInfo.project.name === "mobile") {
      await expect(rooms.locator(".rooms__grid")).toHaveCSS("display", "flex");

      const categoriesCanScroll = await rooms.locator(".rooms__categories").evaluate(
        (element) => element.scrollWidth > element.clientWidth,
      );
      expect(categoriesCanScroll).toBe(true);
    }
  });

  test("rooms row uses Swiper drag without opening room modal", async ({ page }) => {
    await openPage(page);

    const rooms = page.locator("#rooms");
    const viewport = rooms.locator(".rooms__viewport");
    const firstCardBody = rooms.locator(".room-card.active .room-card__body").first();
    const roomModal = page.locator('[data-modal="modalRoom"]');

    await expect(viewport).toHaveClass(/swiper-initialized/);
    await expect
      .poll(() =>
        viewport.evaluate((element) =>
          Boolean(element.swiper.params.freeMode?.enabled),
        ),
      )
      .toBe(false);
    await firstCardBody.scrollIntoViewIfNeeded();
    const box = await firstCardBody.boundingBox();
    expect(box).not.toBeNull();

    const startTranslate = await viewport.evaluate((element) => element.swiper.translate);
    const y = box.y + box.height / 2;
    const startX = box.x + box.width * 0.75;
    const endX = box.x + box.width * 0.25;

    await page.mouse.move(startX, y);
    await page.mouse.down();
    await page.mouse.move(endX, y, { steps: 8 });
    await page.mouse.up();

    await expect
      .poll(() => viewport.evaluate((element) => element.swiper.translate))
      .toBeLessThan(startTranslate - 40);
    await expect
      .poll(() =>
        viewport.evaluate((element) => {
          const { activeIndex, snapGrid, translate } = element.swiper;

          return Math.abs(translate + snapGrid[activeIndex]);
        }),
      )
      .toBeLessThanOrEqual(1);
    await expect(roomModal).toBeHidden();
  });

  test("rooms Swiper keeps card overflow visible for the layout", async ({ page }, testInfo) => {
    await openPage(page);

    const rooms = page.locator("#rooms");
    const viewport = rooms.locator(".rooms__viewport");

    await expect(viewport).toHaveClass(/swiper-initialized/);
    await expect(viewport).toHaveCSS("overflow-x", "visible");
    await expect(viewport).toHaveCSS("overflow-y", "visible");

    const cardSpacing = await rooms.locator(".room-card.active").first().evaluate((card) => {
      const title = card.querySelector(".room-card__title");
      const text = card.querySelector(".room-card__text");
      const more = card.querySelector(".room-card__more");
      const titleRect = title.getBoundingClientRect();
      const textRect = text.getBoundingClientRect();
      const moreRect = more.getBoundingClientRect();

      return {
        titleToText: textRect.top - titleRect.bottom,
        textToMore: moreRect.top - textRect.bottom,
      };
    });

    expect(cardSpacing.titleToText).toBeGreaterThan(cardSpacing.textToMore);

    const activeCardHeights = await rooms
      .locator(".room-card.active")
      .evaluateAll((cards) =>
        cards.map((card) => Math.round(card.getBoundingClientRect().height)),
      );
    expect(new Set(activeCardHeights).size).toBe(1);

    if (testInfo.project.name === "desktop") {
      const arrowAlignment = await rooms.evaluate((section) => {
        const media = section.querySelector(".room-card.active .room-card__media");
        const arrow = section.querySelector(".rooms__arrow--next");
        const mediaRect = media.getBoundingClientRect();
        const arrowRect = arrow.getBoundingClientRect();

        return {
          arrowCenterToMediaBottom:
            arrowRect.top + arrowRect.height / 2 - mediaRect.bottom,
        };
      });

      expect(Math.abs(arrowAlignment.arrowCenterToMediaBottom)).toBeLessThanOrEqual(16);
    }
  });

  test("room photo edge swipe stays inside the nested gallery", async ({ page }) => {
    await openPage(page);

    const rooms = page.locator("#rooms");
    const viewport = rooms.locator(".rooms__viewport");
    const firstCard = rooms.locator(".room-card.active").first();
    const photoSlider = firstCard.locator(".room-card__slider");
    const media = firstCard.locator(".room-card__media");

    await expect(photoSlider).toHaveClass(/swiper-initialized/);
    await photoSlider.evaluate((slider) => {
      slider.swiper.slideToLoop(4, 0);
    });

    await media.scrollIntoViewIfNeeded();
    const outerTranslateBefore = await viewport.evaluate(
      (element) => element.swiper.translate,
    );
    const box = await media.boundingBox();
    expect(box).not.toBeNull();

    const y = box.y + box.height / 2;
    const startX = box.x + box.width * 0.75;
    const endX = box.x + box.width * 0.25;

    await page.mouse.move(startX, y);
    await page.mouse.down();
    await page.mouse.move(endX, y, { steps: 10 });
    await page.mouse.up();

    await expect
      .poll(() => photoSlider.evaluate((slider) => slider.swiper.realIndex))
      .toBe(0);
    await expect
      .poll(() => viewport.evaluate((element) => element.swiper.translate))
      .toBe(outerTranslateBefore);
  });

  test("room photo sliders switch images with pagination bullets", async ({ page }, testInfo) => {
    await openPage(page);

    const rooms = page.locator("#rooms");
    const cards = rooms.locator(".room-card");
    const categories = rooms.locator(".rooms__category");
    const prevArrow = rooms.locator(".rooms__arrow--prev");
    const nextArrow = rooms.locator(".rooms__arrow--next");
    const categoryIds = ["all", "couple", "family", "hot-tub", "pet-friendly"];

    await expect(categories).toHaveCount(5);
    await expect(cards).toHaveCount(8);

    for (const [index, categoryId] of categoryIds.entries()) {
      if (index > 0) {
        await page.waitForTimeout(350);
      }

      await categories.nth(index).click();

      const activeCards = rooms.locator(".room-card.active");
      const card = categoryId === "all"
        ? activeCards.first()
        : rooms.locator(`.room-card[data-tab="${categoryId}"]`).first();

      await expect(categories.nth(index)).toHaveClass(/active/);
      await expect(card).toBeVisible();
      await expect(activeCards).toHaveCount(categoryId === "all" ? 8 : 2);

      if (testInfo.project.name === "desktop") {
        if (categoryId === "all") {
          await expect(prevArrow).toBeVisible();
          await expect(nextArrow).toBeVisible();
        } else {
          await expect(prevArrow).toBeHidden();
          await expect(nextArrow).toBeHidden();
        }
      }

      if (categoryId !== "all") {
        await expect
          .poll(() =>
            activeCards.evaluateAll((elements) =>
              elements.map((element) => element.getAttribute("data-tab")),
            ),
          )
          .toEqual([categoryId, categoryId]);
      }
      await expect(card.locator(".room-card__media .swiper.swiper-initialized")).toHaveCount(1);
      await expect(
        card.locator("[data-room-slider-pagination].swiper-pagination-bullets-dynamic"),
      ).toHaveCount(0);
      await expect(
        card.locator("[data-room-slider-pagination] .swiper-pagination-bullet"),
      ).toHaveCount(5);
      await expect(
        card.locator(
          "[data-room-slider-pagination] .swiper-pagination-bullet:nth-child(4)",
        ),
      ).toHaveClass(/swiper-pagination-bullet-active/);
    }

    await page.waitForTimeout(350);
    await categories.nth(1).click();

    const firstCard = rooms.locator('.room-card[data-tab="couple"]').first();
    await expect(firstCard).toBeVisible();
    const firstSlider = firstCard.locator(".room-card__slider");
    const bullets = firstCard.locator(
      "[data-room-slider-pagination] .swiper-pagination-bullet",
    );
    const expectedImagesByBullet = [
      "a-frame-hot-tub",
      "forest-villa",
      "a-frame-hot-tub",
      "panoramic-a-frame",
      "forest-villa",
    ];

    await bullets.nth(4).click();
    await expect
      .poll(() => firstCard.locator(".swiper-slide-active img").getAttribute("src"))
      .toContain("forest-villa");
    await expect(
      firstCard.locator("[data-room-slider-pagination] .swiper-pagination-bullet-active"),
    ).toHaveCount(1);

    for (let index = 0; index < expectedImagesByBullet.length; index += 1) {
      await firstSlider.evaluate((slider, slideIndex) => {
        slider.swiper.slideToLoop(slideIndex, 0);
      }, index);

      await page.waitForTimeout(250);
      await expect(
        firstCard.locator("[data-room-slider-pagination] .swiper-pagination-bullet-active"),
      ).toHaveCount(1);

      const paginationState = await firstCard
        .locator("[data-room-slider-pagination]")
        .evaluate((pagination) => ({
          className: pagination.className,
          width: pagination.getBoundingClientRect().width,
          inlineWidth: pagination.style.width,
          bulletOffsets: Array.from(
            pagination.querySelectorAll(".swiper-pagination-bullet"),
          ).map((bullet) => bullet.style.left),
        }));

      expect(paginationState.className).not.toContain("swiper-pagination-bullets-dynamic");
      expect(paginationState.width).toBeGreaterThan(0);
      expect(paginationState.inlineWidth).toBe("");
      expect(paginationState.bulletOffsets.some(Boolean)).toBe(false);

      await expect
        .poll(() => firstCard.locator(".swiper-slide-active img").getAttribute("src"))
        .toContain(expectedImagesByBullet[index]);
    }
  });

  test("room booking opens contact modal while details opens room modal", async ({ page }) => {
    await openPage(page);

    const rooms = page.locator("#rooms");
    const roomModal = page.locator('[data-modal="modalRoom"]');
    const contactModal = page.locator('[data-modal="modalContact"]');
    const urlBefore = page.url();

    await rooms.getByRole("button", { name: "Выбрать" }).first().click();
    await expect(roomModal).toBeHidden();
    await expect(contactModal).toBeVisible();
    await expect(contactModal.getByText("Мы всегда на связи")).toBeVisible();
    await contactModal.getByRole("button", { name: "Закрыть" }).click();
    await expect(contactModal).toBeHidden();

    await rooms.getByRole("button", { name: "Подробнее" }).first().click();
    await expect(roomModal).toBeVisible();
    expect(page.url()).toBe(urlBefore);
    await expect(page.locator("body")).toHaveClass(/modal-opened/);
  });
});
