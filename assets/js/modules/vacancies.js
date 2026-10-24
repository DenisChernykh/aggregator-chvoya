const modalSelector = '[data-modal="modalVacancy"]';

function setText(modal, selector, value) {
  const target = modal.querySelector(selector);
  if (!target) return;

  target.textContent = value || "";
}

function setHtml(modal, selector, value) {
  const target = modal.querySelector(selector);
  if (!target) return;

  target.innerHTML = value || "";
}

function getVacancyHtml(card) {
  const template = card.querySelector(".vacancy-card__modal-content");

  if (template instanceof HTMLTemplateElement) {
    return template.innerHTML.trim();
  }

  return "";
}

function updateVacanciesSlider() {
  const slider = document.querySelector("[data-vacancies-slider]");

  if (slider?.swiper) {
    slider.swiper.update();
  }
}

function cleanupAfterVacancyModalClose() {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }

  updateVacanciesSlider();

  window.setTimeout(() => {
    updateVacanciesSlider();
  }, 400);
}

function fillVacancyModal(card, modal) {
  setText(modal, "[data-vacancy-modal-title]", card.dataset.vacancyTitle);
  setHtml(
    modal,
    "[data-vacancy-modal-description]",
    getVacancyHtml(card),
  );
  setText(modal, "[data-vacancy-modal-contact]", card.dataset.vacancyContact);

  modal.querySelector(".vacancy-modal__details")?.scrollTo({ top: 0 });
}

function observeVacancyModalClose(modal) {
  let wasOpened = modal.classList.contains("opened");

  const observer = new MutationObserver(() => {
    const isOpened = modal.classList.contains("opened");

    if (wasOpened && !isOpened) {
      requestAnimationFrame(cleanupAfterVacancyModalClose);
    }

    wasOpened = isOpened;
  });

  observer.observe(modal, {
    attributes: true,
    attributeFilter: ["class", "aria-hidden"],
  });
}

export function initVacancies() {
  const modal = document.querySelector(modalSelector);
  const vacancies = document.querySelector("[data-vacancies]");

  if (!modal || !vacancies) return;

  document.addEventListener(
    "click",
    (event) => {
      if (!(event.target instanceof Element)) return;

      const trigger = event.target.closest(
        '.vacancy-card__hitarea[data-modal-id="modalVacancy"]',
      );
      const card = trigger?.closest(".vacancy-card");
      if (!(card instanceof HTMLElement)) return;

      fillVacancyModal(card, modal);
    },
    true,
  );

  observeVacancyModalClose(modal);

  const firstCard = vacancies.querySelector(".vacancy-card");
  if (firstCard instanceof HTMLElement) {
    fillVacancyModal(firstCard, modal);
  }
}
