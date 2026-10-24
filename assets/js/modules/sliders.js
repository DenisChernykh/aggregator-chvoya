import { getRem } from '../utils';

const parseSlidesPerView = (value, fallback = 'auto') => {
  if (value === 'auto') return 'auto';

  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export async function initUniversalSliders() {
  const allSliders = document.querySelectorAll('[data-slider]');
  if (allSliders.length === 0) return;

  const { default: Swiper } = await import('swiper');
  const { Navigation, Pagination, Autoplay, Keyboard, Mousewheel, FreeMode } =
    await import('swiper/modules');

  allSliders.forEach((container) => {
    const swiperElement = container.querySelector('.swiper');
    if (!swiperElement || swiperElement.swiper) return;

    const gap = (parseFloat(container.dataset.sliderGap) || 0) * getRem();
    const gapMobile =
      (parseFloat(container.dataset.sliderGapMobile) || 0) * getRem();
    const gapTablet =
      (parseFloat(container.dataset.sliderGapTablet) || 0) * getRem();
    const perView = parseSlidesPerView(container.dataset.sliderPerview);
    const perViewMobile = parseSlidesPerView(
      container.dataset.sliderPerviewMobile,
      perView,
    );
    const perViewTablet = parseSlidesPerView(
      container.dataset.sliderPerviewTablet,
      perView !== 'auto' ? perView / 2 : perView,
    );
    const speed = parseInt(container.dataset.sliderSpeed) || 600;
    const isAutoplay = container.dataset.sliderAutoplay === 'true';
    const isLoop = container.dataset.sliderLoop === 'true';

    new Swiper(swiperElement, {
      modules: [
        Navigation,
        Pagination,
        Autoplay,
        Keyboard,
        Mousewheel,
        FreeMode,
      ],
      slidesPerView: perViewMobile,
      centeredSlides: container.dataset.sliderCentered === 'true',
      spaceBetween: gapMobile,
      speed: speed,
      loop: isLoop,
      watchOverflow: true,
      grabCursor: true,
      watchSlidesProgress: true,
      navigation: {
        nextEl: container.querySelector('[data-slider-btn-next]'),
        prevEl: container.querySelector('[data-slider-btn-prev]'),
      },
      pagination: {
        el: container.querySelector('[data-slider-pagination]'),
        clickable: true,
      },
      autoplay: isAutoplay
        ? { delay: 3000, disableOnInteraction: false }
        : false,
      breakpoints: {
        368: {
          slidesPerView: perViewMobile,
          spaceBetween: gapMobile || (gap > 0 ? gap / 2 : 0),
        },
        768: {
          slidesPerView: perViewTablet,
          spaceBetween: gapTablet || (gap > 0 ? gap / 2 : 0),
        },
        1200: { slidesPerView: perView, spaceBetween: gap },
      },
    });
  });
}

export async function initGallerySlider() {
  const galleries = document.querySelectorAll('[data-gallery-slider]');
  if (galleries.length === 0) return;

  const { default: Swiper } = await import('swiper');
  const { FreeMode, Navigation, Pagination, Thumbs } =
    await import('swiper/modules');

  galleries.forEach((gallery) => {
    const mainElement = gallery.querySelector('[data-gallery-main]');
    const thumbsElement = gallery.querySelector('[data-gallery-thumbs]');

    if (!mainElement || mainElement.swiper) return;

    let thumbsSwiper = null;

    if (thumbsElement) {
      thumbsSwiper = new Swiper(thumbsElement, {
        modules: [FreeMode],
        slidesPerView: 'auto',
        spaceBetween: 8 * getRem(),
        freeMode: true,
        watchSlidesProgress: true,
        slideToClickedSlide: true,
        breakpoints: {
          768: {
            spaceBetween: 8 * getRem(),
          },
        },
      });
    }

    const initialSlide = parseInt(gallery.dataset.galleryInitial, 10) || 0;
    const paginationElement = gallery.querySelector('[data-gallery-pagination]');

    new Swiper(mainElement, {
      modules: [Navigation, Pagination, Thumbs],
      slidesPerView: 'auto',
      centeredSlides: true,
      loop: true,
      initialSlide,
      speed: 700,
      spaceBetween: 8 * getRem(),
      watchOverflow: true,
      grabCursor: true,
      watchSlidesProgress: true,
      navigation: {
        nextEl: gallery.querySelector('[data-gallery-next]'),
        prevEl: gallery.querySelector('[data-gallery-prev]'),
      },
      ...(paginationElement
        ? {
            pagination: {
              el: paginationElement,
              clickable: true,
            },
          }
        : {}),
      ...(thumbsSwiper
        ? {
            thumbs: {
              swiper: thumbsSwiper,
              autoScrollOffset: 1,
            },
          }
        : {}),
      breakpoints: {
        768: {
          spaceBetween: 20 * getRem(),
        },
      },
    });
  });
}

export async function initArticlesSlider() {
  const sliderElements = document.querySelectorAll('[data-articles-slider]');
  if (sliderElements.length === 0) return;

  const { default: Swiper } = await import('swiper');
  const { FreeMode } = await import('swiper/modules');
  const mobileQuery = window.matchMedia('(max-width: 767px)');

  const syncArticlesSliders = () => {
    sliderElements.forEach((sliderElement) => {
      if (mobileQuery.matches) {
        if (sliderElement.swiper) return;

        new Swiper(sliderElement, {
          modules: [FreeMode],
          slidesPerView: 'auto',
          spaceBetween: 12,
          freeMode: true,
          grabCursor: true,
          watchSlidesProgress: true,
        });

        return;
      }

      if (sliderElement.swiper) {
        sliderElement.swiper.destroy(true, true);
      }
    });
  };

  syncArticlesSliders();
  mobileQuery.addEventListener('change', syncArticlesSliders);
}

export async function initVacanciesSlider() {
  const sliderElements = document.querySelectorAll('[data-vacancies-slider]');
  if (sliderElements.length === 0) return;

  const { default: Swiper } = await import('swiper');
  const { FreeMode } = await import('swiper/modules');
  const mobileQuery = window.matchMedia('(max-width: 767px)');

  const syncVacanciesSliders = () => {
    sliderElements.forEach((sliderElement) => {
      if (mobileQuery.matches) {
        if (sliderElement.swiper) return;

        new Swiper(sliderElement, {
          modules: [FreeMode],
          slidesPerView: 'auto',
          spaceBetween: 12,
          freeMode: true,
          grabCursor: true,
          watchSlidesProgress: true,
        });

        return;
      }

      if (sliderElement.swiper) {
        sliderElement.swiper.destroy(true, true);
      }
    });
  };

  syncVacanciesSliders();
  mobileQuery.addEventListener('change', syncVacanciesSliders);
}

export async function singlePostArticlesSlider() {
  const containers = document.querySelectorAll('[data-single-post-articles]');
  if (containers.length === 0) return;

  const { default: Swiper } = await import('swiper');
  const { Navigation, FreeMode } = await import('swiper/modules');

  containers.forEach((container) => {
    const sliderElement = container.querySelector(
      '[data-single-post-articles-slider]',
    );

    if (!sliderElement || sliderElement.swiper) return;

    new Swiper(sliderElement, {
      modules: [Navigation, FreeMode],
      slidesPerView: 'auto',
      spaceBetween: 12,
      speed: 800,
      freeMode: true,
      watchOverflow: true,
      grabCursor: true,
      watchSlidesProgress: true,
      navigation: {
        nextEl: container.querySelector('[data-single-post-articles-next]'),
        prevEl: container.querySelector('[data-single-post-articles-prev]'),
      },
      breakpoints: {
        768: {
          spaceBetween: 20 * getRem(),
        },
      },
    });
  });
}

export async function reviewsSlider() {
  const reviewsSliderContainer = document.querySelector('.reviews__slider');

  if (reviewsSliderContainer) {
    const { default: Swiper } = await import('swiper');
    const { Navigation, Autoplay } = await import('swiper/modules');

    const reviewsSlider = new Swiper('.reviews__slider', {
      modules: [Navigation, Autoplay],
      loop: false,
      speed: 800,
      watchOverflow: true,
      watchSlidesProgress: true,
      watchSlidesVisibility: true,
      slidesPerView: 'auto',
      spaceBetween: 12 * getRem(),
      breakpoints: {
        1200: {
          slidesPerView: 'auto',
          spaceBetween: 20 * getRem(),
        },
        768: {
          slidesPerView: 2,
          spaceBetween: 20 * getRem(),
        },
        368: {
          slidesPerView: 'auto',
          spaceBetween: 12 * getRem(),
        },
      },
      navigation: {
        nextEl: '.reviews__arrow--next',
        prevEl: '.reviews__arrow--prev',
      },
    });
  }
}

export async function roomsCardsSlider() {
  const roomsSections = document.querySelectorAll('.rooms');
  if (roomsSections.length === 0) return;

  const { default: Swiper } = await import('swiper');
  const { Navigation } = await import('swiper/modules');

  roomsSections.forEach((section) => {
    const swiperElement = section.querySelector('.rooms__viewport.swiper');
    if (!swiperElement || swiperElement.swiper) return;

    new Swiper(swiperElement, {
      modules: [Navigation],
      slidesPerView: 'auto',
      spaceBetween: 12,
      speed: 600,
      grabCursor: true,
      noSwipingSelector: '.room-card__media',
      watchOverflow: true,
      watchSlidesProgress: true,
      navigation: {
        nextEl: section.querySelector('.rooms__arrow--next'),
        prevEl: section.querySelector('.rooms__arrow--prev'),
      },
      breakpoints: {
        768: {
          spaceBetween: 20 * getRem(),
        },
      },
      on: {
        init(swiper) {
          swiper.slideTo(0, 0);
        },
      },
    });
  });
}

export async function roomsPhotoSliders() {
  const roomSliders = document.querySelectorAll('.room-card__media .swiper');
  if (roomSliders.length === 0) return;

  const { default: Swiper } = await import('swiper');
  const { Pagination } = await import('swiper/modules');

  roomSliders.forEach((swiperElement) => {
    if (swiperElement.classList.contains('swiper-initialized')) return;

    const container = swiperElement.closest('.room-card__media');
    const pagination = container?.querySelector(
      '[data-room-slider-pagination]',
    );
    const slidesCount = swiperElement.querySelectorAll('.swiper-slide').length;

    if (!pagination) return;

    new Swiper(swiperElement, {
      modules: [Pagination],

      slidesPerView: 1,
      speed: 600,
      initialSlide: 3,
      loop: slidesCount > 1,
      loopAdditionalSlides: slidesCount > 3 ? 1 : 0,
      longSwipesRatio: 0.25,
      nested: true,
      grabCursor: true,
      touchEventsTarget: 'container',
      touchMoveStopPropagation: true,
      pagination: {
        el: pagination,
        clickable: true,
      },
    });
  });
}

export async function initSliders() {
  initUniversalSliders();
  initGallerySlider();
  initArticlesSlider();
  initVacanciesSlider();
  singlePostArticlesSlider();
  reviewsSlider();
  roomsCardsSlider();
  roomsPhotoSliders();
}
