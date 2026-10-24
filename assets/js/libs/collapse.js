/**********************************************************/
/*  @name  Collapse by VICTORY digital                    */
/*	@copyright	VICTORY group                             */
/*	@support	https://victoryagency.ru/digital            */
/**********************************************************/
function waitForTransition(el, duration) {
  return new Promise((resolve) => {
    // Ускоряем для людей с reduced motion
    const prefersReduced = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    )?.matches;
    if (prefersReduced) {
      resolve();
      return;
    }

    let done = false;
    const end = () => {
      if (done) return;
      done = true;
      resolve();
    };

    const onEnd = (e) => {
      if (e.target === el) {
        el.removeEventListener("transitionend", onEnd);
        end();
      }
    };

    el.addEventListener("transitionend", onEnd);
    // Фолбэк на случай, если transitionend не сработает
    setTimeout(() => {
      el.removeEventListener("transitionend", onEnd);
      end();
    }, duration + 80);
  });
}

export function slideUp(el, duration = 400) {
  if (!el || el._slidingPromise) return el?._slidingPromise;

  el.dataset.sliding = "true";
  el.style.height = el.offsetHeight + "px";
  // force reflow
  void el.offsetHeight;

  el.style.transitionProperty = "height, margin, padding";
  el.style.transitionDuration = duration + "ms";
  el.style.overflow = "hidden";
  el.style.height = 0;
  el.style.paddingTop = 0;
  el.style.paddingBottom = 0;
  el.style.marginTop = 0;
  el.style.marginBottom = 0;

  el._slidingPromise = waitForTransition(el, duration).then(() => {
    el.style.display = "none";
    el.style.removeProperty("height");
    el.style.removeProperty("overflow");
    el.style.removeProperty("transition-duration");
    el.style.removeProperty("transition-property");
    el.style.removeProperty("padding-top");
    el.style.removeProperty("padding-bottom");
    el.style.removeProperty("margin-top");
    el.style.removeProperty("margin-bottom");
    el.dataset.sliding = "false";
    el._slidingPromise = null;
    return false; // скрыт
  });

  return el._slidingPromise;
}

export function slideDown(el, duration = 300, displayStyle = "block") {
  if (!el || el._slidingPromise) return el?._slidingPromise;

  el.dataset.sliding = "true";
  el.style.removeProperty("display");
  let display = window.getComputedStyle(el).display;
  if (display === "none") display = displayStyle !== "flex" ? "block" : "flex";
  el.style.display = display;

  const height = el.scrollHeight;

  el.style.overflow = "hidden";
  el.style.height = 0;
  el.style.paddingTop = 0;
  el.style.paddingBottom = 0;
  el.style.marginTop = 0;
  el.style.marginBottom = 0;

  // force reflow
  void el.offsetHeight;

  el.style.transitionProperty = "height, margin, padding";
  el.style.transitionDuration = duration + "ms";
  el.style.height = height + "px";
  el.style.removeProperty("padding-top");
  el.style.removeProperty("padding-bottom");
  el.style.removeProperty("margin-top");
  el.style.removeProperty("margin-bottom");

  el._slidingPromise = waitForTransition(el, duration).then(() => {
    el.style.removeProperty("height");
    el.style.removeProperty("overflow");
    el.style.removeProperty("transition-duration");
    el.style.removeProperty("transition-property");
    el.dataset.sliding = "false";
    el._slidingPromise = null;
    return true; // показан
  });

  return el._slidingPromise;
}

export function slideToggle(el, duration = 300, displayStyle = "block") {
  if (!el || el._slidingPromise) return el?._slidingPromise;
  const isVisible = window.getComputedStyle(el).display !== "none";
  return isVisible
    ? slideUp(el, duration)
    : slideDown(el, duration, displayStyle);
}

export function initCollapse() {
  // collapse
  const collapse = document.querySelectorAll("[data-collapse]");
  if (collapse.length > 0) {
    const setExpanded = (trigger, isExpanded) => {
      if (trigger) {
        trigger.setAttribute("aria-expanded", String(isExpanded));
      }
    };

    collapse.forEach((el) => {
      let item = el.parentElement;
      let trigger = el.querySelector("[data-collapse-trigger]");
      const collapseGroup = el.dataset.collapse || "default";

      if (trigger) {
        item = el;
      } else {
        trigger = el;
      }

      setExpanded(trigger, item.classList.contains("active"));

      if (item.classList.contains("active")) {
        const targetBlock = item.querySelector("[data-collapse-block]");
        if (targetBlock) {
          targetBlock._slidingPromise = false;
          slideDown(targetBlock, 0);
        }
      }

      trigger.addEventListener("click", () => {
        const targetBlock = item.querySelector("[data-collapse-block]");

        if (targetBlock) {
          if (targetBlock._slidingPromise) return;
          // Определяем, будем мы открывать или закрывать
          const isExpanding = !item.classList.contains("active");
          // Если указана группа, закрываем другие блоки этой группы
          if (collapseGroup && collapseGroup !== "default") {
            document
              .querySelectorAll(`[data-collapse="${collapseGroup}"]`)
              .forEach((otherEl) => {
                if (otherEl !== item && otherEl.classList.contains("active")) {
                  const otherBlock = otherEl.querySelector(
                    "[data-collapse-block]",
                  );
                  const otherTrigger = otherEl.querySelector(
                    "[data-collapse-trigger]",
                  );
                  if (otherBlock && !otherBlock._slidingPromise) {
                    // Мгновенно убираем класс
                    otherEl.classList.remove("active");
                    setExpanded(otherTrigger, false);
                    slideUp(otherBlock);
                  }
                }
              });
          }

          item.classList.toggle("active", isExpanding);
          setExpanded(trigger, isExpanding);

          slideToggle(targetBlock);
        }
      });
    });
  }
}
