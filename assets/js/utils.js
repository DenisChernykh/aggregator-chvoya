import { default as GLightbox } from "glightbox";

export const lightbox = GLightbox({
  touchNavigation: true,
  autoplayVideos: true,
});

window.lightbox = lightbox;

export function getRem() {
  return parseFloat(getComputedStyle(document.documentElement).fontSize);
}

export function setCookie(name, value, hours) {
  const date = new Date();
  date.setTime(date.getTime() + hours * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${date.toUTCString()};path=/`;
}

export function getCookie(name) {
  const cookies = document.cookie.split(";");
  for (let cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split("=");
    if (cookieName === name) return cookieValue;
  }
  return null;
}

export function initTextareaAutoResize() {
  document.addEventListener("input", (e) => {
    const target = e.target;
    if (target.matches("[data-textarea-autoresize]")) {
      target.style.height = "auto";
      target.style.height = `${target.scrollHeight}px`;
    }
  });

  setTimeout(() => {
    document.querySelectorAll("[data-textarea-autoresize]").forEach((el) => {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    });
  }, 0);
}

export function initTabs() {
  const tabLinks = document.querySelectorAll("[data-tab-id]");

  if (tabLinks.length === 0) {
    // console.warn("Предупреждение: Кнопки табов ([data-tab-id]) не найдены.");
    return;
  }

  const getTargetTabs = (commonParent, tabId) => {
    if (tabId === "all") {
      return commonParent.querySelectorAll("[data-tab]");
    }

    return commonParent.querySelectorAll(`[data-tab="${tabId}"]`);
  };

  // Находим все уникальные контейнеры меню, чтобы обработать их независимо
  const menus = new Set(
    Array.from(tabLinks).map(
      (link) => link.closest(".faq__tabs-menu") || link.parentElement,
    ),
  );

  menus.forEach((menu) => {
    const activeLink = menu.querySelector("[data-tab-id].active");
    if (!activeLink) {
      const firstLink = menu.querySelector("[data-tab-id]");
      if (firstLink) {
        // Устанавливаем актив для кнопки
        firstLink.classList.add("active");

        // Находим общий контейнер и активируем соответствующий таб
        const commonParent =
          firstLink.closest("section") || firstLink.parentElement.parentElement;
        getTargetTabs(commonParent, firstLink.dataset.tabId).forEach((tab) => {
          tab.classList.add("active");
          tab.style.display = "";
        });
      }
    }
  });

  let animating = false;

  tabLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      if (animating || link.classList.contains("active")) return;

      const commonParent =
        link.closest("section") || link.parentElement.parentElement;
      const targetTabs = getTargetTabs(commonParent, link.dataset.tabId);

      if (!targetTabs.length) {
        console.warn(`Контент для таба "${link.dataset.tabId}" не найден.`);
        return;
      }

      animating = true;

      // Переключаем кнопки
      const menu = link.closest(".tabmenu") || link.parentElement;
      menu
        .querySelectorAll("[data-tab-id].active")
        .forEach((el) => el.classList.remove("active"));
      link.classList.add("active");

      // Переключаем контент
      const currentTabs = commonParent.querySelectorAll("[data-tab].active");

      // Скрываем старые табы
      currentTabs.forEach((tab) => {
        tab.classList.remove("active");
        tab.style.display = "none";
      });

      // Показываем новые
      targetTabs.forEach((tab) => {
        tab.style.display = ""; // Убираем display: none
        requestAnimationFrame(() => {
          tab.classList.add("active");
          tab.querySelectorAll(".swiper").forEach((swiperElement) => {
            swiperElement.swiper?.update?.();
            swiperElement.swiper?.updateSlidesClasses?.();
            swiperElement.swiper?.pagination?.render?.();
            swiperElement.swiper?.pagination?.update?.();
          });
        });
      });

      // Сбрасываем флаг анимации быстро
      setTimeout(() => {
        animating = false;
      }, 300);
    });
  });
}

export function initSectionAnimated() {
  const animatedSections = document.querySelectorAll("[data-animated]");

  if (animatedSections.length === 0) return;

  animatedSections.forEach((section) => {
    const thresholdAttr = section.getAttribute("data-animated") || "center";

    const delayAttr = section.getAttribute("data-animated-delay");
    // Преобразуем секунды в миллисекунды
    const delay = delayAttr ? parseFloat(delayAttr) * 1000 : 0;

    let rootMargin = "0px 0px 0px 0px";

    switch (thresholdAttr) {
      case "top":
        // Сдвигаем нижнюю границу вьюпорта вверх
        rootMargin = "-30% 0px 30% 0px";
        break;

      case "center":
        // Центр — нейтральное значение
        rootMargin = "0px 0px 0px 0px";
        break;

      case "bottom":
        // Триггер срабатывает позже, когда элемент почти снизу
        rootMargin = "35% 0px -35% 0px";
        break;
    }

    const threshold = window.innerWidth <= 768 ? 0.25 : 0.45;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Очищаем предыдущий таймер, если он есть
          if (entry.target._animationTimer) {
            clearTimeout(entry.target._animationTimer);
            delete entry.target._animationTimer;
          }

          if (entry.isIntersecting) {
            // Если есть задержка, устанавливаем таймаут
            if (delay > 0) {
              entry.target._animationTimer = setTimeout(() => {
                entry.target.classList.add("animated");
                delete entry.target._animationTimer;
              }, delay);
            } else {
              entry.target.classList.add("animated");
            }
          } else {
            entry.target.classList.remove("animated");
          }
        });
      },
      {
        threshold,
        rootMargin,
      },
    );

    observer.observe(section);
  });
}
