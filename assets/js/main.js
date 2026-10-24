import 'modules-vg-reels/styles.css';

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/free-mode';
import 'swiper/css/mousewheel';
import 'swiper/css/autoplay';
import 'swiper/css/thumbs';
import 'swiper/css/effect-creative';
import 'swiper/css/effect-fade';
import 'swiper/css/effect-cube';

import '../scss/theme.scss';
import '../scss/generated-tokens.scss';
import '../scss/style.scss';

import { setupReels } from 'modules-vg-reels';
import { initDev } from './libs/dev';
import { initCommon } from './modules/common';
import { initVgmodals } from './libs/vgmodals/initVgmodals.js';
import { initModalAge } from './modules/modal-age.js';
import { initCookieConsent } from './libs/cookie-consent/cookie';
import { initMovers } from './libs/elementsmover/initMover.js';
import { getRem } from './utils';

// import { reelsMock } from './moks.js';

async function init() {
  initDev();
  initCommon();
  initMovers();

  if (document.querySelector('[data-modal]')) {
    await initVgmodals();
  }

  if (document.querySelector('[data-collapse]')) {
    const { initCollapse } = await import('./libs/collapse.js');
    initCollapse();
  }

  if (document.querySelector('[data-animated]')) {
    const { initSectionAnimated } = await import('./utils.js');
    initSectionAnimated();
  }

  if (document.querySelector('[data-tab]')) {
    const { initTabs } = await import('./utils.js');
    initTabs();
  }

  if (document.querySelector('[data-textarea-autoresize]')) {
    const { initTextareaAutoResize } = await import('./utils.js');
    initTextareaAutoResize();
  }

  if (
    document.querySelector('[data-modal="modalReviews"]') &&
    document.querySelector('.reviews__more')
  ) {
    const { initReviews } = await import('./modules/reviews');
    initReviews();
  }

  if (
    document.querySelector('[data-modal="modalRoom"]') &&
    document.querySelector('.room-card')
  ) {
    const { initRooms } = await import('./modules/rooms.js');
    initRooms();
  }

  if (document.querySelector('[data-swiper], .swiper')) {
    const { initSliders } = await import('./modules/sliders');
    initSliders();
  }

  if (document.querySelector('[data-lazyvideo]')) {
    const { initVideo } = await import('./modules/lazyvideo.js');
    initVideo();
  }

  if (document.querySelector('[data-transfer-item]')) {
    const { initModalDataTransfer } =
      await import('./modules/modal-data-transfer.js');
    initModalDataTransfer();
  }

  if (document.querySelector('[data-vacancies]')) {
    const { initVacancies } = await import('./modules/vacancies.js');
    initVacancies();
  }

  if (document.querySelector('[data-map]')) {
    const { initVGMap } = await import('./libs/victorymap/victorymap.js');
    initVGMap();
  }

  const reelsMock = window.__REELS_MOCK__;
  if (reelsMock?.length) {
    await setupReels(reelsMock, {
      previewSwiper: {
        centerInsufficientSlides: true,
        slidesPerView: 'auto',
        spaceBetween: 12,
        breakpoints: {
          768: { slidesPerView: 'auto', spaceBetween: 20 },
          600: { slidesPerView: 'auto', spaceBetween: 20 },
        },
      },
      modalSwiper: {
        spaceBetween: 30,
        speed: 800,
        breakpoints: {
          1200: { slidesPerView: 4 },
          1920: { slidesPerView: 8 },
        },
      },
    });
  }

  const setupCookieConsent = () => {
    const phpSettings = window.themeSettings?.cookieConsent;

    if (!phpSettings) return;

    initCookieConsent({
      expireDays: 1,
      ...phpSettings,

      onAccept: () => {},
    });
  };

  setupCookieConsent();
}

document.addEventListener('DOMContentLoaded', () => {
  init();
});
