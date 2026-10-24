import { expect, test } from "@playwright/test";

async function openPage(page) {
  await page.addInitScript(() => {
    window.sessionStorage.setItem("ageGate", "passed");
    document.cookie = "cookieConsent=accepted; path=/; SameSite=Lax";
  });

  await page.goto("/");
  await page.waitForFunction(() => window.Modals?._isInitialized === true);
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

test.describe("header modes", () => {
  test("desktop switches between figma header modes", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "Desktop-only header mode scenario");

    await openPage(page);

    const header = page.locator("[data-header]");
    const desktopBar = header.locator(".header__desktop");
    const logo = header.locator(".header__logo--desktop");
    const menuGroup = header.locator(".header__desktop-group--start");
    const actionGroup = header.locator(".header__desktop-group--end");
    const taxi = header.locator(".header__taxi-link");

    await expect(header).not.toHaveClass(/header--surface-light/);
    await expect(header).not.toHaveClass(/header--scrolling/);
    await expect(desktopBar).toHaveCSS("background-color", "rgba(0, 0, 0, 0.2)");
    await expect(taxi).toHaveCSS("color", "rgb(243, 246, 243)");

    const expandedBox = await desktopBar.boundingBox();
    const viewport = page.viewportSize();
    const remPx = viewport.width / 1920;

    expect(expandedBox).not.toBeNull();
    expect(Math.round(expandedBox.width)).toBeGreaterThan(1400);

    await page.evaluate(() => window.scrollBy({ top: 240, behavior: "instant" }));
    await expect(header).toHaveClass(/header--scrolling/);
    await expect(menuGroup).toHaveCSS("opacity", "0");
    await expect(actionGroup).toHaveCSS("opacity", "0");

    const scrollingBarBox = await desktopBar.boundingBox();
    const scrollingLogoBox = await logo.boundingBox();
    const expectRoundedPx = (actual, expected) => {
      expect(Math.abs(Math.round(actual) - Math.round(expected))).toBeLessThanOrEqual(1);
    };

    expect(scrollingBarBox).not.toBeNull();
    expect(scrollingLogoBox).not.toBeNull();
    expectRoundedPx(scrollingBarBox.width, 275 * remPx);
    expectRoundedPx(scrollingLogoBox.width, 135 * remPx);

    await expect(header).not.toHaveClass(/header--scrolling/, { timeout: 2000 });

    await page.locator("#booking-start").evaluate((element) => {
      element.scrollIntoView({ block: "start", behavior: "instant" });
    });
    await expect(header).toHaveClass(/header--surface-light/);
    await expect(header).not.toHaveClass(/header--scrolling/, { timeout: 2000 });
    await expect(desktopBar).toHaveCSS("background-color", "rgba(0, 0, 0, 0.1)");
    await expect(taxi).toHaveCSS("color", "rgb(20, 31, 22)");

    await page.locator("#booking-help").evaluate((element) => {
      element.scrollIntoView({ block: "start", behavior: "instant" });
    });
    await expect(header).not.toHaveClass(/header--surface-light/, { timeout: 1000 });
    await expect(taxi).toHaveCSS("color", "rgb(243, 246, 243)");
  });

  test("mobile header keeps menu usable without horizontal overflow", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Mobile-only header regression scenario");

    await openPage(page);

    const header = page.locator("[data-header]");

    await expect(header.locator(".header__mobile")).toBeVisible();
    await page.evaluate(() => window.scrollBy({ top: 320, behavior: "instant" }));
    await page.getByRole("button", { name: "Открыть меню" }).click();
    await expect(header).toHaveClass(/header--menu-open/);
    await expect(header.locator(".header__menu")).toBeVisible();
    await expectNoHorizontalPageScroll(page);
  });
});
