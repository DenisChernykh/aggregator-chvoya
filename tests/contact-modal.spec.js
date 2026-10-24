import { expect, test } from "@playwright/test";

async function clearStartupOverlays(page) {
  await page.addInitScript(() => {
    window.sessionStorage.setItem("ageGate", "passed");
    document.cookie = "cookieConsent=accepted; path=/; SameSite=Lax";
  });

  await page.goto("/");

  const ageConfirm = page.getByRole("button", { name: "Мне есть 18 лет" });
  if (await ageConfirm.isVisible().catch(() => false)) {
    await ageConfirm.click();
  }

  const cookieAccept = page.getByRole("button", { name: "Принять и закрыть" });
  if (await cookieAccept.isVisible().catch(() => false)) {
    await cookieAccept.click();
  }

  await page.waitForFunction(() => window.Modals?._isInitialized === true);
}

async function openContactFromBookingHelp(page) {
  await page
    .locator("#booking-help")
    .getByRole("button", { name: "Связаться с нами" })
    .click();
}

async function expectContactModalOpen(page) {
  const modal = page.locator('[data-modal="modalContact"]');
  await expect(modal).toBeVisible();
  await expect(modal).toHaveAttribute("aria-hidden", "false");
  await expect(modal.getByText("Мы всегда на связи")).toBeVisible();
  await expect(modal.getByLabel("Имя")).toBeVisible();
  await expect(modal.getByLabel("Номер телефона")).toBeVisible();
  await expect(modal.getByRole("button", { name: "Оставить заявку" })).toBeVisible();
  await expect(page.locator("body")).toHaveClass(/modal-opened/);
}

test.describe("contact modal", () => {
  test("desktop booking help opens and closes contact modal", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "Desktop-only scenario");

    await clearStartupOverlays(page);
    await openContactFromBookingHelp(page);
    await expectContactModalOpen(page);

    const modal = page.locator('[data-modal="modalContact"]');
    await modal.getByRole("button", { name: "Закрыть" }).click();
    await expect(modal).toBeHidden();
    await expect(page.locator("body")).not.toHaveClass(/modal-opened/);
  });

  test("mobile booking help opens contact modal with usable layout", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Mobile-only scenario");

    await clearStartupOverlays(page);
    await openContactFromBookingHelp(page);
    await expectContactModalOpen(page);

    const modal = page.locator('[data-modal="modalContact"]');
    await expect(page.locator("[data-header]")).not.toHaveClass(/header--menu-open/);

    const box = await modal.locator(".modal-window").boundingBox();
    expect(box).not.toBeNull();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(412);
    expect(box.y + box.height).toBeLessThanOrEqual(844);

    await modal.getByRole("button", { name: "Закрыть" }).click();
    await expect(modal).toBeHidden();
  });

  test("mobile menu find room link closes menu and navigates to rooms", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Mobile-only scenario");

    await clearStartupOverlays(page);
    await page.getByRole("button", { name: "Открыть меню" }).click();
    await page.locator('.header__menu-nav-list a[href="#rooms"]').click();

    await expect(page.locator("[data-header]")).not.toHaveClass(/header--menu-open/);
    await expect(page).toHaveURL(/#rooms$/);
    await expect(page.locator('[data-modal="modalContact"]')).toBeHidden();
  });

  test("escape closes contact modal", async ({ page }, testInfo) => {
    await clearStartupOverlays(page);
    await openContactFromBookingHelp(page);

    const modal = page.locator('[data-modal="modalContact"]');
    await expect(modal).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(modal).toBeHidden();
  });

  test("contact modal phone accepts local code and checkbox toggles", async ({ page }, testInfo) => {
    await clearStartupOverlays(page);
    await openContactFromBookingHelp(page);

    const modal = page.locator('[data-modal="modalContact"]');
    await expect(modal).toBeVisible();

    const phoneInput = modal.getByLabel("Номер телефона");
    await phoneInput.fill("3433103838");
    await expect(phoneInput).toHaveValue("+7 (343) 310-38-38");

    const policyCheckbox = modal.locator('input[name="agree"]');
    await expect(policyCheckbox).not.toBeChecked();
    await policyCheckbox.click();
    await expect(policyCheckbox).toBeChecked();
  });

  test("contact modal validates empty submit before request", async ({ page }, testInfo) => {
    let didSubmit = false;
    await page.route("**/ajax/form", async (route) => {
      didSubmit = true;
      await route.fulfill({ status: 200, body: "{}" });
    });

    await clearStartupOverlays(page);
    await openContactFromBookingHelp(page);

    const modal = page.locator('[data-modal="modalContact"]');
    await modal.getByRole("button", { name: "Оставить заявку" }).click();

    await expect(modal).toBeVisible();
    await expect(modal.locator(".modal-form__field.error")).toHaveCount(2);
    await expect(modal.locator(".modal-form__policy.error")).toHaveCount(1);
    expect(didSubmit).toBe(false);
  });

  test("contact modal submits old server contract and opens success modal", async ({ page }, testInfo) => {
    let payload;

    await page.route("**/ajax/form", async (route) => {
      payload = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });

    await clearStartupOverlays(page);
    await openContactFromBookingHelp(page);

    const modal = page.locator('[data-modal="modalContact"]');
    await modal.getByLabel("Имя").fill("Иван");
    await modal.getByLabel("Номер телефона").fill("3433103838");
    await modal.locator('input[name="agree"]').check();

    await modal.getByRole("button", { name: "Оставить заявку" }).click();

    await expect(page.locator('[data-modal="modalSuccess"]')).toBeVisible();
    await expect(modal).toBeHidden();
    expect(payload).toMatchObject({
      name: "Иван",
      phone: "+7 (343) 310-38-38",
      agree: "on",
    });
  });
});
