/**********************************************************/
/*  @name  Modal Windows by VICTORY digital               */
/*	@copyright	VICTORY group                             */
/*	@support	https://victoryagency.ru/digital            */
/**********************************************************/

export class Modals {
  static _Instances = {};
  static _ActiveModal = null;
  static _isInitialized = false;

  /**
   * Инициализация делегирования событий.
   * Позволяет открывать/закрывать даже те модалки, которые созданы динамически.
   */
  static init() {
    // Если уже запускали — просто выходим
    if (this._isInitialized) return;

    document.addEventListener("click", (e) => {
      // Кнопки открытия: <button data-modal-id="login">
      const openBtn = e.target.closest("[data-modal-id]");
      if (openBtn) {
        e.preventDefault();
        this.getModal(openBtn.dataset.modalId)?.open();
      }

      // Кнопки закрытия: <button data-modal-close="login"> или просто <button data-modal-close>
      const closeBtn = e.target.closest("[data-modal-close], .modal-close");
      if (closeBtn) {
        e.preventDefault();
        const id = closeBtn.dataset.modalClose;
        // Если ID в атрибуте нет, закрываем текущую активную
        id ? this.getModal(id)?.close() : this._ActiveModal?.close();
      }
    });

    this._isInitialized = true;

    document.querySelectorAll(`[data-modal]`).forEach((modal) => {
      if (!modal.classList.contains("opened")) {
        modal.style.display = `none`;
      }
    });
  }

  /**
   * Получить экземпляр модалки. Если объекта нет, но в DOM есть разметка — создаст его.
   */
  static getModal(id) {
    if (this._Instances[id]) return this._Instances[id];

    const $el = document.querySelector(`[data-modal="${id}"]`);
    if ($el) {
      return new Modal($el);
    }

    console.warn(`[Modals] Окно "${id}" не найдено в DOM.`);
    return null;
  }

  /**
   * Закрыть все открытые модалки
   */
  static closeAll() {
    Object.values(this._Instances).forEach((modal) => modal.close());
  }

  /**
   * Обновить кнопки для всех существующих модалок
   * (полезно, если вы не используете Modals.init() и работаете по старинке)
   */
  static refreshAllButtons() {
    Object.values(this._Instances).forEach((modal) => modal.refreshButtons?.());
  }

  static addInstance(instance) {
    this._Instances[instance.id] = instance;
  }

  static setActive(instance) {
    this._ActiveModal = instance;
  }

  static getActiveModal() {
    return this._ActiveModal;
  }
}

export class Modal {
  constructor($modal) {
    this.$modal = $modal;
    this.id = $modal.dataset.modal;
    this.type = $modal.dataset.modalType || "default";

    if (!this.$modal.classList.contains("opened")) {
      this.$modal.style.display = "none";
    }

    // Состояние
    this.initialBodyPadding = 0;
    this.isMouseDownInside = false;

    // Callbacks
    this.onActionCallback = null;
    this.onOpenCallback = null;
    this.onCloseCallback = null;

    // Привязки
    this.open = this.open.bind(this);
    this.close = this.close.bind(this);
    this.handleOutsideClick = this.handleOutsideClick.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleTab = this.handleTab.bind(this);

    this._initInternalEvents();
    this._initAria();

    Modals.addInstance(this);
  }

  _initAria() {
    if (!this.$modal.hasAttribute("role"))
      this.$modal.setAttribute("role", "dialog");
    if (!this.$modal.hasAttribute("aria-modal"))
      this.$modal.setAttribute("aria-modal", "true");
    if (!this.$modal.hasAttribute("aria-hidden"))
      this.$modal.setAttribute("aria-hidden", "true");
    if (!this.$modal.hasAttribute("tabindex"))
      this.$modal.setAttribute("tabindex", "-1");
  }

  _initInternalEvents() {
    this.$modal.addEventListener("click", (e) => {
      const actionBtn = e.target.closest("[data-modal-action]");
      if (actionBtn) {
        const action = actionBtn.dataset.modalAction;
        this.onActionCallback
          ? this.onActionCallback(action, this)
          : this.close();
      }
    });
  }

  getScrollbarWidth() {
    const outer = document.createElement("div");
    outer.style.visibility = "hidden";
    outer.style.overflow = "scroll";
    document.body.appendChild(outer);
    const inner = document.createElement("div");
    outer.appendChild(inner);
    const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;
    outer.parentNode.removeChild(outer);
    return scrollbarWidth;
  }

  hasScrollbar() {
    return window.innerWidth > document.documentElement.clientWidth;
  }

  lockScroll() {
    const htmlStyles = window.getComputedStyle(document.documentElement);
    const bodyStyles = window.getComputedStyle(document.body);

    // Проверяем, зафиксирован ли скроллбар через CSS в html или body
    const isGutterStable =
      htmlStyles.scrollbarGutter === "stable" ||
      bodyStyles.scrollbarGutter === "stable";

    // Если gutter: stable НЕТ, тогда делаем старые добрые вычисления
    if (!isGutterStable) {
      const bodyWidth = parseInt(bodyStyles.width);
      const viewportWidth = Math.round(window.innerWidth);
      const bodyIs100vw = Math.abs(bodyWidth - viewportWidth) <= 1;

      if (!bodyIs100vw && this.hasScrollbar()) {
        const scrollbarWidth = this.getScrollbarWidth();
        this.initialBodyPadding = parseInt(bodyStyles.paddingRight) || 0;
        document.body.style.paddingRight = `${this.initialBodyPadding + scrollbarWidth}px`;

        if (document.documentElement) {
          document.documentElement.style.setProperty(
            "--scrollbar-width",
            `${scrollbarWidth}px`,
          );
        }
      }
    }

    // Класс добавляем в любом случае, так как он обычно отключает overflow: hidden
    document.body.classList.add("modal-opened");
  }

  unlockScroll() {
    const htmlStyles = window.getComputedStyle(document.documentElement);
    const bodyStyles = window.getComputedStyle(document.body);
    const isGutterStable =
      htmlStyles.scrollbarGutter === "stable" ||
      bodyStyles.scrollbarGutter === "stable";

    if (!isGutterStable) {
      document.body.style.paddingRight = this.initialBodyPadding
        ? `${this.initialBodyPadding}px`
        : "";
      document.documentElement.style.removeProperty("--scrollbar-width");
    }

    document.body.classList.remove("modal-opened");
  }

  // Логика событий

  getFocusableElements() {
    return Array.from(
      this.$modal.querySelectorAll(
        '.modal-close, [data-modal-close], [data-modal-action], a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => !el.hasAttribute("disabled") && !!el.offsetParent);
  }

  handleMouseDown(e) {
    const modalContent =
      this.$modal.querySelector(".modal-window") ||
      this.$modal.querySelector("div");
    this.isMouseDownInside = modalContent?.contains(e.target);
  }

  handleOutsideClick(e) {
    if (this.type === "confirm") return;

    // Логика проверки mouseDown, чтобы не закрывалось при выделении текста
    if (this.isMouseDownInside) {
      this.isMouseDownInside = false;
      return;
    }

    const modalContent =
      this.$modal.querySelector(".modal-window") ||
      this.$modal.querySelector("div");
    if (!modalContent.contains(e.target)) {
      this.close();
    }
  }

  handleKeyDown(e) {
    if (e.key === "Escape") {
      if (this.type === "confirm") return;
      this.close();
    }
    if (e.key === "Tab") this.handleTab(e);
  }

  handleTab(e) {
    const focusableElements = this.getFocusableElements();

    if (focusableElements.length === 0) {
      e.preventDefault();
      return;
    }

    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement;

    if (!this.$modal.contains(activeElement)) {
      e.preventDefault();
      first.focus();
      return;
    }

    if (e.shiftKey && activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  // Основные методы API

  onAction(callback) {
    this.onActionCallback = callback;
    return this;
  }
  onOpen(callback) {
    this.onOpenCallback = callback;
    return this;
  }
  onClose(callback) {
    this.onCloseCallback = callback;
    return this;
  }

  open(clear = false) {
    for (const id in Modals._Instances) {
      if (Modals._Instances[id] !== this) {
        Modals._Instances[id].close(false, undefined, true);
      }
    }

    this.$modal.style.display = "flex";

    this.$modal.offsetHeight;

    this.$modal.classList.add("opened");
    this.$modal.setAttribute("aria-hidden", "false");
    Modals.setActive(this);
    this.lockScroll();

    if (this.onOpenCallback) this.onOpenCallback(this);

    this.previousActiveElement = document.activeElement;

    requestAnimationFrame(() => {
      const focusableElements = this.getFocusableElements();
      if (focusableElements.length > 0) {
        try {
          focusableElements[0].focus({ preventScroll: true });
        } catch {
          focusableElements[0].focus();
        }
      } else {
        const modalWindow =
          this.$modal.querySelector(".modal-window") ||
          this.$modal.querySelector("div");
        if (modalWindow) {
          modalWindow.setAttribute("tabindex", "-1");
          modalWindow.focus({ preventScroll: true });
        }
      }
    });

    setTimeout(() => {
      document.addEventListener("mousedown", this.handleMouseDown);
      document.addEventListener("click", this.handleOutsideClick);
    }, 0);
    document.addEventListener("keydown", this.handleKeyDown);

    if (clear === true) this.clear();
    return this;
  }

  close(clear = false, e, isOpeningNew = false) {
    if (e !== undefined && e.type === "click") {
      const $target = e.target;
      if (
        this.isMouseDownInside &&
        !this.$modal.querySelector(".modal-close")?.contains($target)
      ) {
        this.isMouseDownInside = false;
        return;
      }

      const isLightBox =
        document.querySelector(".glightbox-container") ||
        $target.classList.contains("glightbox") ||
        document.querySelector(".bp") ||
        document.querySelector(".fancybox");

      const modalContent =
        this.$modal.querySelector(".modal-window") ||
        this.$modal.querySelector("div");
      const isClickInside = modalContent?.contains($target);
      const isCloseButton =
        $target.closest("[data-modal-close]") ||
        $target.closest(".modal-close");

      if (
        this.type === "confirm" &&
        !isCloseButton &&
        !$target.closest("[data-modal-action]")
      )
        return;
      if ((isClickInside && !isCloseButton) || isLightBox) return;
    }

    this.$modal.classList.remove("opened");
    this.$modal.setAttribute("aria-hidden", "true");

    if (!isOpeningNew && this.onCloseCallback) this.onCloseCallback(this);
    if (Modals.getActiveModal() === this) Modals.setActive(null);

    this.unlockScroll();

    document.removeEventListener("mousedown", this.handleMouseDown);
    document.removeEventListener("click", this.handleOutsideClick);
    document.removeEventListener("keydown", this.handleKeyDown);

    // Возврат фокуса
    if (
      !isOpeningNew &&
      this.previousActiveElement &&
      document.contains(this.previousActiveElement)
    ) {
      this.previousActiveElement.focus({ preventScroll: true });
    }

    if (clear === true) this.clear();
  }

  clear() {
    const $form =
      this.$modal.tagName === "FORM"
        ? this.$modal
        : this.$modal.querySelector("form");
    $form?.reset();
  }
}

// Авто-инициализация при подключении скрипта
if (typeof window !== "undefined") {
  // Проверяем, не инициализированы ли модалки уже (глобальный флаг)
  if (!window.__VGMODALS_INITIALIZED__) {
    // Ждем загрузки DOM, если скрипт подключен в head без defer/module
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => Modals.init());
    } else {
      Modals.init();
    }

    // Устанавливаем флаг и прокидываем класс в глобальную область
    window.__VGMODALS_INITIALIZED__ = true;
    window.Modals = Modals;
  }
}
