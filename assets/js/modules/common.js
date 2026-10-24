export function initCommon() {
  initHeaderMenu();
  initHeaderModes();
  setHeaderHeight();
  setScrollbarWidth();
  initBottomMenuVisibility();
  copyLink();
  panelContacts();
}

function setHeaderHeight() {
  const header = document.querySelector("header, .header");

  if (!header) return;

  const mobileHeader = header.querySelector(".header__mobile");
  const mobileBar = header.querySelector(".header__mobile-bar");
  const isMobileHeaderVisible =
    mobileHeader && window.getComputedStyle(mobileHeader).display !== "none";
  let height = header.offsetHeight;

  if (isMobileHeaderVisible && mobileBar) {
    const mobileHeaderStyles = window.getComputedStyle(mobileHeader);
    const paddingTop = parseFloat(mobileHeaderStyles.paddingTop) || 0;
    const paddingBottom =
      parseFloat(mobileHeaderStyles.paddingBottom) || paddingTop;

    height = mobileBar.offsetHeight + paddingTop + paddingBottom;
  }

  document.documentElement.style.setProperty("--header-height", `${height}px`);
}

function setScrollbarWidth() {
  const outer = document.createElement("div");

  outer.style.visibility = "hidden";
  outer.style.overflow = "scroll";
  outer.style.msOverflowStyle = "scrollbar";
  outer.style.position = "absolute";
  outer.style.top = "-9999px";
  outer.style.width = "100px";

  document.body.appendChild(outer);

  const scrollbarWidth = outer.offsetWidth - outer.clientWidth;

  document.body.removeChild(outer);

  document.documentElement.style.setProperty(
    "--scrollbar-width",
    `${scrollbarWidth}px`,
  );

  return scrollbarWidth;
}

function initHeaderMenu() {
  const header = document.querySelector("[data-header]");
  const toggles = [...document.querySelectorAll("[data-header-menu-toggle]")];
  const menu = document.querySelector("[data-header-menu]");

  if (!header || !toggles.length || !menu) return;

  const mobileMedia = window.matchMedia("(max-width: 767px)");

  const setOpen = (isOpen) => {
    header.classList.toggle("header--menu-open", isOpen);
    if (isOpen) header.classList.remove("header--scrolling");
    document.body.classList.toggle("is-locked", isOpen && mobileMedia.matches);
    toggles.forEach((toggle) => {
      toggle.setAttribute("aria-expanded", String(isOpen));
      toggle.setAttribute("aria-label", isOpen ? "Закрыть меню" : "Открыть меню");
    });
    menu.setAttribute("aria-hidden", String(!isOpen));
    setHeaderHeight();
  };

  setOpen(false);

  toggles.forEach((toggle) => toggle.addEventListener("click", () => {
    setOpen(!header.classList.contains("header--menu-open"));
  }));

  menu.querySelectorAll("a, [data-modal-id]").forEach((control) => {
    control.addEventListener("click", () => setOpen(false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false);
  });

  document.addEventListener("click", (event) => {
    if (
      mobileMedia.matches &&
      header.classList.contains("header--menu-open") &&
      !header.contains(event.target)
    ) {
      setOpen(false);
    }
  });

  const handleMobileChange = () => {
    setOpen(header.classList.contains("header--menu-open"));
  };

  mobileMedia.addEventListener?.("change", handleMobileChange);
  window.addEventListener("resize", setHeaderHeight);
}

function initHeaderModes() {
  const header = document.querySelector("[data-header]");
  const surfaces = [...document.querySelectorAll("[data-header-surface]")];

  if (!header) return;

  const desktopMedia = window.matchMedia("(min-width: 768px)");
  let scrollTimer = null;
  let surfaceFrame = null;

  const getProbeY = () => {
    const headerBox = header.getBoundingClientRect();
    // Anchor scrolling leaves a small gap below the fixed header.
    const surfaceProbeOffset = 24;

    return Math.min(window.innerHeight - 1, headerBox.bottom + surfaceProbeOffset);
  };

  const updateSurface = () => {
    if (!surfaces.length) {
      header.classList.remove("header--surface-light");
      return;
    }

    const probeY = getProbeY();
    const activeSurface = surfaces.find((surface) => {
      const box = surface.getBoundingClientRect();

      return box.top <= probeY && box.bottom > probeY;
    });
    const nextSurface =
      activeSurface ||
      surfaces.find((surface) => surface.getBoundingClientRect().top > probeY) ||
      surfaces[surfaces.length - 1];

    header.classList.toggle(
      "header--surface-light",
      nextSurface?.dataset.headerSurface === "light",
    );
  };

  const scheduleSurfaceUpdate = () => {
    if (surfaceFrame) return;

    surfaceFrame = window.requestAnimationFrame(() => {
      surfaceFrame = null;
      updateSurface();
    });
  };

  const stopScrolling = () => {
    header.classList.remove("header--scrolling");
  };

  const handleScroll = () => {
    window.clearTimeout(scrollTimer);

    if (
      desktopMedia.matches &&
      window.scrollY > 1 &&
      !header.classList.contains("header--menu-open")
    ) {
      header.classList.add("header--scrolling");
      scrollTimer = window.setTimeout(stopScrolling, 100);
    } else {
      stopScrolling();
    }

    updateSurface();
  };

  updateSurface();
  window.addEventListener("scroll", handleScroll, { passive: true });
  window.addEventListener("resize", scheduleSurfaceUpdate);
  desktopMedia.addEventListener?.("change", () => {
    stopScrolling();
    scheduleSurfaceUpdate();
  });
}

function initBottomMenuVisibility() {
  const bottomMenu = document.querySelector(".bottom-menu");
  const footer = document.querySelector(".footer");

  if (!bottomMenu || !footer) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        bottomMenu.classList.toggle(
          "bottom-menu--hidden",
          entry.isIntersecting,
        );
      });
    },
    {
      threshold: 0,
    },
  );

  observer.observe(footer);
}

function copyLink() {
  const links = document.querySelectorAll("[data-copy-link]");

  if (!links.length) return;

  const markCopied = (link) => {
    link.classList.add("is-copied");
    window.setTimeout(() => link.classList.remove("is-copied"), 1800);
  };

  const fallbackCopy = (url) => {
    const textarea = document.createElement("textarea");
    textarea.value = url;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "-1000px";
    textarea.style.left = "-1000px";

    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  };

  links.forEach((link) => {
    link.addEventListener("click", async (event) => {
      event.preventDefault();

      const url = window.location.href;

      try {
        await navigator.clipboard.writeText(url);
      } catch {
        fallbackCopy(url);
      }

      markCopied(link);
    });
  });
}

export function panelContacts() {
  const panelContact = document.querySelector(".panel-contact");

  if (panelContact) {
    const buttons = panelContact.querySelectorAll(".panel-contact__button");
    if (!buttons.length) return;

    const overlapVisibleAmount = 10;

    const getGapValue = () => {
      const style = window.getComputedStyle(panelContact);
      const gap = parseFloat(style.gap) || 0;
      return gap;
    };

    const lastButton = buttons[buttons.length - 1];

    const getButtonHeight = () => lastButton.getBoundingClientRect().height;

    const getCollapsedHeight = () =>
      getButtonHeight() + (buttons.length - 1) * overlapVisibleAmount;

    const collapseButtons = () => {
      const gap = getGapValue();
      const btnH = getButtonHeight();

      buttons.forEach((button, index) => {
        if (index !== buttons.length - 1) {
          const offset =
            (buttons.length - 1 - index) * (btnH + gap - overlapVisibleAmount);
          button.style.transform = `translateY(${offset}px)`;
          button.style.pointerEvents = "none";
          button.setAttribute("aria-hidden", "true");
          button.tabIndex = -1;
        } else {
          button.style.pointerEvents = "auto";
          button.removeAttribute("aria-hidden");
          button.removeAttribute("tabindex");
        }
      });
      panelContact.style.transition = "height 0.3s ease";
      panelContact.style.height = `${getCollapsedHeight()}px`;
    };

    const expandButtons = () => {
      buttons.forEach((button) => {
        button.style.transform = "translateY(0)";
        button.style.pointerEvents = "auto";
        button.removeAttribute("aria-hidden");
        button.removeAttribute("tabindex");
      });

      // возвращаем естественную высоту
      panelContact.style.height = "";
      panelContact.style.overflow = "";
    };

    collapseButtons();

    panelContact.addEventListener("mouseenter", () => {
      expandButtons();
    });

    panelContact.addEventListener("mouseleave", () => {
      collapseButtons();
    });

    window.addEventListener("resize", () => {
      collapseButtons();
    });
  }
}
