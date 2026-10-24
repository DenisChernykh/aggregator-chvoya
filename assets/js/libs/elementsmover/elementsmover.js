/**
 * Adaptive Mover
 * Перемещает элементы по DOM на основе медиа-запросов и возвращает их обратно с поддержкой диапазонов (min/max), оберток и кастомных классов.
 */
export class ElementsMover {
  constructor(defaultMax = 768) {
    this.defaultMax = defaultMax;
    this.items = [];
    this.init();
  }

  init() {
    const actions = {
      "data-move-after": "after",
      "data-move-before": "before",
      "data-move-append": "append",
      "data-move-prepend": "prepend",
      "data-move-to": "append",
    };

    Object.entries(actions).forEach(([attr, method]) => {
      document.querySelectorAll(`[${attr}]`).forEach((el) => {
        const selector = this.normalizeSelector(el.getAttribute(attr));
        const target = document.querySelector(selector);

        if (!target) return;

        // Собираем условия
        // Если data-move-breakpoint еще используется, берем его как max
        const max =
          el.getAttribute("data-move-max") ||
          el.getAttribute("data-move-breakpoint") ||
          this.defaultMax;
        const min = el.getAttribute("data-move-min");

        const wrapperClass = el.getAttribute("data-move-wrapper");
        const customClass = el.getAttribute("data-move-class");

        // Формируем гибкий MediaQuery
        const query = this.buildQuery(min, max);

        const placeholder = document.createElement("div");
        placeholder.style.display = "none";
        placeholder.setAttribute("data-move-placeholder", "");
        el.before(placeholder);

        const item = {
          el,
          target,
          method,
          placeholder,
          wrapperClass,
          customClass,
          wrapper: null,
          mql: window.matchMedia(query),
        };

        item.mql.addEventListener("change", () => this.updateItem(item));
        this.items.push(item);
        this.updateItem(item);
      });
    });
  }

  // Вспомогательный метод для сборки строки запроса
  buildQuery(min, max) {
    const parts = [];
    if (min) parts.push(`(min-width: ${min}px)`);
    if (max) parts.push(`(max-width: ${max}px)`);
    return parts.join(" and ");
  }

  updateItem(item) {
    if (item.mql.matches) {
      this.moveToTarget(item);
    } else {
      this.moveBack(item);
    }
  }

  moveToTarget(item) {
    let elementToMove = item.el;

    // Навешиваем кастомный класс, если он указан
    if (item.customClass) {
      item.el.classList.add(...item.customClass.split(" "));
    }

    // Обработка обертки
    if (item.wrapperClass && !item.wrapper) {
      item.wrapper = document.createElement("div");
      item.wrapper.className = item.wrapperClass;
    }

    if (item.wrapper) {
      item.wrapper.appendChild(item.el);
      elementToMove = item.wrapper;
    }

    const { target, method } = item;
    if (elementToMove.parentNode !== target) {
      target[method](elementToMove);
    }
  }

  moveBack(item) {
    // Возвращаем на место
    if (
      item.placeholder &&
      item.el.parentNode !== item.placeholder.parentNode
    ) {
      item.placeholder.before(item.el);
    }

    // Удаляем кастомный класс
    if (item.customClass) {
      item.el.classList.remove(...item.customClass.split(" "));
    }

    // Чистим обертку
    if (item.wrapper) {
      item.wrapper.remove();
      item.wrapper = null;
    }
  }

  normalizeSelector(selector) {
    if (!selector) return null;
    let clean = selector.replace(/['"]/g, "").trim();
    return clean.startsWith(".") || clean.startsWith("#") ? clean : "." + clean;
  }
}

// Использование:
// new ElementsMover(768);

export async function initMovers() {
  const movers = document.querySelector(
    "[data-move-after],[data-move-before],[data-move-prepend],[data-move-append],[data-move-to]",
  );

  if (movers) {
    const { ElementsMover } = await import("./elementsmover.js");
    new ElementsMover();
  }
}
