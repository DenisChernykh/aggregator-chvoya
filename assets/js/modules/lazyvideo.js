const ensureLoaded = (v) => {
  if (v.dataset.loading === "1" || v.dataset.loaded === "1") return;

  const sources = v.querySelectorAll("source[data-src]");
  if (sources.length > 0) {
    sources.forEach((s) => {
      s.src = s.dataset.src;
      s.removeAttribute("data-src");
    });

    v.dataset.loading = "1";

    v.muted = true;
    v.setAttribute("muted", "");
    v.playsInline = true;
    v.setAttribute("playsinline", "");

    try {
      v.load();
    } catch {}

    const markLoaded = () => {
      v.dataset.loaded = "1";
      v.removeEventListener("loadedmetadata", markLoaded);
    };

    if (v.readyState >= 1) markLoaded();
    else v.addEventListener("loadedmetadata", markLoaded, { once: true });
  }
};

const playSafely = (v) => {
  const tryPlay = () => v.play().catch(() => {});
  if (v.readyState >= 2) return tryPlay();

  v.addEventListener("canplay", tryPlay, { once: true });
  // Не вызываем load() повторно, если ensureLoaded уже вызван
};

const resetVideo = (v) => {
  const doReset = () => {
    try {
      v.currentTime = 0;
      v.pause();
    } catch {}
  };
  if (v.readyState < 1) {
    v.addEventListener("loadedmetadata", doReset, { once: true });
  } else {
    doReset();
  }
};

export function initLazyVideo() {
  const isMobile = window.innerWidth <= 768;
  const videos = document.querySelectorAll("video[data-lazyvideo]");
  const anchorToVideo = new WeakMap();

  const onEnter = (v) => {
    v._inView = true;
    clearTimeout(v._resetTimer);

    // Если это интерактивное видео и оно еще не запущено — НЕ ТРОГАЕМ
    // Это гарантирует, что постер не моргнет от v.load() при скролле
    const parent = v.closest("[data-lazyvideo-click], [data-lazyvideo-button]");
    if (parent && !parent.classList.contains("is-started")) return;

    ensureLoaded(v);
    v.preload = "auto";

    const isResetMode = v.getAttribute("data-lazyvideo") === "reset";
    if (!isResetMode && v.ended && !v.loop) return;

    if (v.getAttribute("data-lazyvideo-autoplay") !== "false") {
      playSafely(v);
    } else {
      v.pause();
      v.currentTime = 0;
    }
  };

  const onLeave = (v) => {
    v._inView = false;
    if (v.closest(".is-started")) return;

    v.pause();
    v.preload = "none";

    if (v.getAttribute("data-lazyvideo") !== "reset") return;

    clearTimeout(v._resetTimer);
    v._resetTimer = setTimeout(() => {
      if (!v._inView) resetVideo(v);
    }, 1000);
  };

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const v = anchorToVideo.get(entry.target);
        if (!v) return;
        if (entry.isIntersecting) onEnter(v);
        else onLeave(v);
      });
    },
    {
      rootMargin: isMobile ? "190px 0px" : "400px 0px",
      threshold: 0,
    },
  );

  videos.forEach((v) => {
    const anchor = v.dataset.lazyanchor
      ? document.querySelector(v.dataset.lazyanchor)
      : v;
    if (!anchor) return;
    anchorToVideo.set(anchor, v);
    io.observe(anchor);
  });
}

export function initVideoInteractions() {
  const interactiveVideos = document.querySelectorAll("video[data-lazyvideo]");

  interactiveVideos.forEach((video) => {
    const btn = video.parentElement.querySelector("[data-lazyvideo-button]");
    const clickZone = video.closest("[data-lazyvideo-click]");

    if (clickZone) {
      clickZone.addEventListener("click", function (e) {
        if (this.classList.contains("is-started")) return;

        startVideoFlow(video, btn, this);
      });
    } else if (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        const container = btn.parentElement;

        if (container.classList.contains("is-started")) return;

        startVideoFlow(video, btn, container);
      });
    }
  });

  function startVideoFlow(video, btn, container) {
    const hasPlayableSource = Boolean(
      video.currentSrc ||
        video.querySelector("source[src], source[data-src]") ||
        video.getAttribute("src"),
    );

    if (!hasPlayableSource) return;

    container.classList.add("is-started");

    ensureLoaded(video);

    video.muted = false;
    video.removeAttribute("muted");

    setTimeout(() => {
      playSafely(video);
      video.controls = true;
    }, 50);

    if (btn) {
      btn.style.opacity = "0";
      setTimeout(() => (btn.style.display = "none"), 300);
    }
  }
}

export function initVideo() {
  initLazyVideo();
  initVideoInteractions();
}
