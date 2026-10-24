export function initCookieConsent(options = {}) {
  // Параметры по умолчанию
  const defaults = {
    type: 'column',
    theme: 'light',
    showDelay: 300,
    showIcon: true,
    showButtonClose: true,
    showButtonReject: true,
    buttonAcceptClass: 'cookie-consent-accept',
    buttonRejectClass: 'cookie-consent-reject',
    buttonAcceptHtml: null,
    buttonRejectHtml: null,
    positionX: 'right',
    positionY: 'bottom',
    cookieTitle: 'Сайт использует cookie',
    cookieTextHTML: `<p>Мы используем файлы cookie, чтобы сайт работал лучше,
			а вы — комфортнее. Продолжая пользоваться сайтом,
			вы соглашаетесь с политикой обработки данных.</p>`,
    buttonAcceptText: 'Согласен',
    buttonRejectText: 'Не согласен',
    expireDays: 30,
    cookieCustom: '',
    onAccept: () => {},
  };

  const config = { ...defaults, ...options };

  if (getCookie('cookieConsent') === 'accepted') {
    config.onAccept();
    return;
  }

  const prepareButton = (html, defaultText, defaultClass, dataAttr) => {
    if (html) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html.trim();
      const btn = tempDiv.firstElementChild;
      if (btn) {
        if (!btn.hasAttribute(dataAttr)) btn.setAttribute(dataAttr, '');
        return btn.outerHTML;
      }
    }
    return `<button class="button cookie-consent-button ${defaultClass}" ${dataAttr} role="button" aria-label="${defaultText}">${defaultText}</button>`;
  };

  const UI = {
    icon: config.showIcon ? '<div class="cookie-consent-icon"></div>' : '',
    title: config.cookieTitle
      ? `<div class="cookie-consent-title">${config.cookieTitle}</div>`
      : '',
    text: config.cookieTextHTML
      ? `<div class="cookie-consent-text">${config.cookieTextHTML}</div>`
      : '',
    closeBtn: config.showButtonClose
      ? '<button class="cookie-consent-close" data-cookie-close aria-label="Закрыть"></button>'
      : '',
    acceptBtn: prepareButton(
      config.buttonAcceptHtml,
      config.buttonAcceptText,
      config.buttonAcceptClass,
      'data-cookie-accept',
    ),
    rejectBtn: config.showButtonReject
      ? prepareButton(
          config.buttonRejectHtml,
          config.buttonRejectText,
          config.buttonRejectClass,
          'data-cookie-reject',
        )
      : '',
  };

  const templates = {
    column: `
      ${UI.icon}
      <div class="cookie-consent-content">${UI.title}${UI.text}</div>
      <div class="cookie-consent-buttons">${UI.acceptBtn}${UI.rejectBtn}</div>
      ${UI.closeBtn}`,
    row: `
      ${UI.icon}
      <div class="cookie-consent-content">${UI.title}${UI.text}</div>
      <div class="cookie-consent-buttons">${UI.acceptBtn}${UI.rejectBtn}</div>
      ${UI.closeBtn}`,
    mixed: `
      ${UI.icon}
      <div class="cookie-consent-content">
        ${UI.title}${UI.text}
        <div class="cookie-consent-buttons">${UI.acceptBtn}${UI.rejectBtn}</div>
      </div>
      ${UI.closeBtn}`,
  };

  const cookieBanner = document.createElement('div');
  cookieBanner.id = 'cookie-consent-banner';
  cookieBanner.className = `cookie-consent cookie-consent-${config.theme} cookie-consent-${config.type} cookie-consent-${config.positionX} cookie-consent-${config.positionY} cookie-consent-hidden`;
  cookieBanner.innerHTML = templates[config.type] || config.cookieCustom;

  document.body.appendChild(cookieBanner);

  setTimeout(
    () => cookieBanner.classList.remove('cookie-consent-hidden'),
    config.showDelay,
  );

  const closeBanner = (saveCookie = false) => {
    cookieBanner.classList.add('cookie-consent-hidden');

    const handleTransitionEnd = (e) => {
      if (e.target !== cookieBanner) return;

      cookieBanner.style.display = 'none';
      cookieBanner.remove();
    };

    cookieBanner.addEventListener('transitionend', handleTransitionEnd, {
      once: true,
    });

    setTimeout(() => {
      if (document.body.contains(cookieBanner)) {
        cookieBanner.style.display = 'none';
        cookieBanner.remove();
      }
    }, 600);

    if (saveCookie) {
      setCookie('cookieConsent', 'accepted', config.expireDays);
      config.onAccept();
    }
  };

  cookieBanner.addEventListener('click', (e) => {
    if (e.target.closest('[data-cookie-accept]')) {
      closeBanner(true);
    } else if (
      e.target.closest('[data-cookie-reject]') ||
      e.target.closest('[data-cookie-close]')
    ) {
      closeBanner(false);
    }
  });

  function getCookie(name) {
    const matches = document.cookie.match(
      new RegExp(
        '(?:^|; )' +
          name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') +
          '=([^;]*)',
      ),
    );
    return matches ? decodeURIComponent(matches[1]) : undefined;
  }

  function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${name}=${value}; ${expires}; path=/; SameSite=Lax`;
  }
}
