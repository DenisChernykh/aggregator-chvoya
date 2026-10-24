import { expect, test } from "@playwright/test";

const longRoomDescription =
  "Панорамный номер с продуманной планировкой для семейного отдыха, отдельной гостиной, рабочей зоной у окна и спальными местами для детей. В пространстве предусмотрены глубокая шумоизоляция, несколько сценариев освещения, плотные блэкаут-шторы, вместительный гардероб, кофейная станция и ванная комната с натуральным камнем. Такой формат подходит для длительного проживания, деловой поездки и спокойного уикенда в центре города.";

const longReviewText =
  "Мы приехали на длинные выходные и особенно оценили, что команда заранее уточнила все детали поездки: время прибытия, пожелания по тишине, детскую кроватку и ранний завтрак. Номер оказался просторным, с удобной рабочей зоной и очень хорошей шумоизоляцией. Вечером консьерж помог быстро забронировать столик рядом с театром, а утром подготовили ланч-бокс перед ранней прогулкой. Это тот случай, когда сервис не выглядит навязчивым, но всё происходит вовремя и спокойно. После выезда мы ещё оставляли багаж на несколько часов, и это тоже прошло без лишних объяснений.";

const longVacancyTitle =
  "Старший менеджер по работе с корпоративными гостями и мероприятиями";

const sectionSelectors = [
  "#rooms",
  ".reels",
  "#promos",
  "#services",
  "#hotel-benefits",
  "#reviews",
  "#gallery",
  "#blog",
  "#vacancies",
  "#faq",
];

const stressCounts = {
  compact: {
    article: 1,
    benefit: 3,
    faq: 3,
    gallery: 1,
    promo: 1,
    reels: 1,
    review: 2,
    service: 3,
    vacancy: 1,
  },
  intermediate: {
    article: 2,
    benefit: 4,
    faq: 5,
    gallery: 7,
    promo: 2,
    reels: 7,
    review: 4,
    service: 4,
    vacancy: 3,
  },
  mixed: {
    article: 4,
    benefit: 4,
    faq: 5,
    gallery: 3,
    promo: 4,
    reels: 3,
    review: 4,
    service: 8,
    vacancy: 3,
  },
  dense: {
    article: 8,
    benefit: 10,
    faq: 9,
    gallery: 12,
    promo: 6,
    reels: 12,
    review: 7,
    service: 10,
    vacancy: 8,
  },
};

async function openPage(page, variant) {
  await page.addInitScript(() => {
    window.sessionStorage.setItem("ageGate", "passed");
    document.cookie = "cookieConsent=accepted; path=/; SameSite=Lax";
  });

  if (variant) {
    await addDynamicContentInitScript(page, variant);
  }

  await page.goto("/");
  await page.waitForFunction(() => window.Modals?._isInitialized === true);
  await page.waitForTimeout(500);
}

async function expectNoHorizontalPageScroll(page) {
  const metrics = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    scrollX: window.scrollX,
  }));

  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
  expect(metrics.scrollX).toBe(0);
}

async function expectInsideViewport(page, locator) {
  const viewport = page.viewportSize();
  const box = await locator.boundingBox();

  expect(box).not.toBeNull();
  expect(box.width).toBeGreaterThan(0);
  expect(box.x).toBeGreaterThanOrEqual(-1);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
}

async function expectVisibleBoxes(locator) {
  const boxes = await locator.evaluateAll((elements) =>
    elements.map((element) => {
      const rect = element.getBoundingClientRect();

      return {
        height: rect.height,
        width: rect.width,
      };
    }),
  );

  expect(boxes.length).toBeGreaterThan(0);

  for (const box of boxes) {
    expect(box.width).toBeGreaterThan(0);
    expect(box.height).toBeGreaterThan(0);
  }
}

async function addDynamicContentInitScript(page, variant) {
  const counts = stressCounts[variant];

  await page.addInitScript(
    ({ counts, longRoomDescription, longReviewText, longVacancyTitle, variant }) => {
      document.addEventListener("DOMContentLoaded", () => {
      const makeNodeList = (count, createNode) =>
        Array.from({ length: count }, (_, index) => createNode(index));

      const setText = (root, selector, value) => {
        const target = root.querySelector(selector);
        if (target) target.textContent = value;
      };

      const resetSwiper = (element) => {
        const swiper = element?.swiper;
        swiper?.update?.();
        swiper?.updateSlidesClasses?.();
      };

      const restartSliders = () => {
        window.dispatchEvent(new Event("resize"));

        document.querySelectorAll(".swiper").forEach((swiperElement) => {
          swiperElement.swiper?.update?.();
        });
      };

      const roomCategories = [
        "Все дома",
        "Для двоих",
        "Семейные",
        "С купелью",
        "Pet-friendly",
      ];
      const roomCategoryIds = [
        "all",
        "couple",
        "family",
        "hot-tub",
        "pet-friendly",
      ];

      const roomData = [
        {
          title: "А-фрейм с купелью",
          description: "Дом с приватной террасой, купелью фурако и панорамным видом на лес.",
          features: ["Площадь: 45 м²", "Кол-во гостей: до 3", "Купель фурако"],
          price: "от 18 500 ₽",
        },
        {
          title: "Лесная вилла для семьи и друзей",
          description:
            "Просторный дом с двумя спальнями, полноценной кухней и зоной барбекю для длинного отдыха.",
          features: ["Площадь: 75 м²", "Кол-во гостей: до 5", "Своя кухня"],
          price: "от 24 500 ₽",
        },
        {
          title: "Панорамный А-фрейм с очень длинным названием дома",
          description: longRoomDescription,
          features: ["Площадь: 35 м²", "Кол-во гостей: до 3", "Дровяной камин"],
          price: "от 12 500 ₽",
        },
        {
          title: "Вилла pet-friendly",
          description:
            "Дом для отдыха с питомцем: рядом прогулочные тропы, приватная терраса и место для лежанки.",
          features: ["Площадь: 62 м²", "Кол-во гостей: до 4", "Можно с питомцем"],
          price: "от 21 500 ₽",
        },
      ];

      const rooms = document.querySelector("#rooms");
      if (rooms) {
        const categories = rooms.querySelector(".rooms__categories");
        if (categories) {
          categories.replaceChildren(
            ...roomCategories.map((label, index) => {
              const button = document.createElement("button");
              button.className = `rooms__category${index === 0 ? " active" : ""}`;
              button.type = "button";
              button.dataset.tabId = roomCategoryIds[index];
              button.textContent = label;
              return button;
            }),
          );
        }

        rooms.querySelectorAll(".room-card").forEach((card, index) => {
          const item = roomData[index % roomData.length];
          setText(card, ".room-card__title", item.title);
          setText(card, ".room-card__text", item.description);
          setText(card, ".room-card__price span", item.price);

          const features = card.querySelector(".room-card__features");
          if (features) {
            features.replaceChildren(
              ...item.features.map((feature) => {
                const li = document.createElement("li");
                li.textContent = feature;
                return li;
              }),
            );
          }
        });
      }

      const promoTexts = [
        ["Раннее бронирование", "Скидка при планировании поездки заранее."],
        [
          "Длинные выходные в центре Москвы",
          "Тариф для гостей, которые хотят спокойно провести несколько дней рядом с театрами, ресторанами и музеями.",
        ],
        [
          "Семейный тариф с завтраками, поздним выездом и трансфером",
          "В предложение входят завтраки для взрослых и детей, поздний выезд при наличии свободных номеров, трансфер от вокзала или аэропорта и помощь консьержа с маршрутом на выходные. Можно добавить детскую кроватку, меню подушек и заранее подготовленный комплимент в номер.",
        ],
        ["Проживание на неделю", "Специальный тариф для долгих поездок."],
        ["День рождения", "Комплимент, десерт и персональные условия для именинника."],
        ["SPA-пакет", "Проживание с wellness-программой и вечерним массажем."],
      ];

      const promos = document.querySelector("#promos .promos__list");
      if (promos) {
        const template = promos.querySelector(".promo-card");
        promos.replaceChildren(
          ...makeNodeList(counts.promo, (index) => {
            const card = template.cloneNode(true);
            const [title, text] = promoTexts[index % promoTexts.length];
            setText(card, ".promo-card__title", title);
            setText(card, ".promo-card__text", text);
            return card;
          }),
        );
      }

      const serviceTexts = [
        ["Wi-Fi", "Быстрый интернет."],
        ["Парковка", ""],
        ["Трансфер из аэропорта", "Встретим с табличкой и довезем до отеля."],
        [
          "Персональный консьерж для маршрутов, билетов и особых поручений",
          "Поможем собрать маршрут, забронировать столик, подготовить документы к встрече и организовать нестандартный запрос.",
        ],
        ["Room Service 24/7", "Доставка блюд и напитков в номер в любое время."],
        ["Прачечная", "Аккуратный уход за вещами."],
        ["Экскурсии", "Индивидуальные и групповые прогулки по городу."],
        ["SPA", "Массаж и восстановительные программы."],
        ["Прокат автомобиля", "Автомобили разных классов по запросу."],
        ["Детские принадлежности", "Кроватка, стульчик и наборы для комфортного проживания с детьми."],
      ];

      const hydrateCardList = (containerSelector, cardSelector, titleSelector, textSelector, count) => {
        const container = document.querySelector(containerSelector);
        const template = container?.querySelector(cardSelector);
        if (!container || !template) return;

        container.replaceChildren(
          ...makeNodeList(count, (index) => {
            const card = template.cloneNode(true);
            const [title, text] = serviceTexts[index % serviceTexts.length];
            setText(card, titleSelector, title);
            setText(card, textSelector, text);
            return card;
          }),
        );
      };

      hydrateCardList(
        "#services .services__grid",
        ".service-card",
        ".service-card__title",
        ".service-card__text",
        counts.service,
      );
      hydrateCardList(
        "#hotel-benefits .hotel-benefits__cards",
        ".hotel-benefits__card",
        ".hotel-benefits__card-title",
        ".hotel-benefits__card-text",
        counts.benefit,
      );

      const reviewData = [
        ["Анна", "Очень спокойно, чисто и удобно.", "2026-01-16"],
        ["Екатерина Александровна, постоянный гость отеля", longReviewText, "2026-02-24"],
        [
          "Максим",
          "Хорошее расположение, внимательный сервис, быстрый заезд и приятный завтрак. Для короткой деловой поездки всё оказалось под рукой.",
          "2026-03-12",
        ],
        [
          "Мария и Алексей",
          `${longReviewText} Особенно понравилось, что поздний выезд согласовали заранее и не пришлось менять планы.`,
          "2026-04-02",
        ],
        ["Ольга", "Вернёмся ещё.", "2026-04-08"],
        [
          "Илья",
          "Номер был готов раньше, документы оформили быстро, а вечером помогли с билетами.",
          "2026-04-11",
        ],
        [
          "Семья Новиковых",
          "Отдыхали с ребенком, поэтому особенно оценили тишину, подушки, быстрый room service и возможность оставить багаж после выезда.",
          "2026-04-18",
        ],
      ];

      const reviewsSlider = document.querySelector("#reviews .reviews__slider");
      const reviewsWrapper = reviewsSlider?.querySelector(".swiper-wrapper");
      const reviewTemplate = reviewsWrapper?.querySelector(".reviews__card");
      if (reviewsSlider && reviewsWrapper && reviewTemplate) {
        resetSwiper(reviewsSlider);
        reviewsWrapper.replaceChildren(
          ...makeNodeList(counts.review, (index) => {
            const card = reviewTemplate.cloneNode(true);
            const [name, text, date] = reviewData[index % reviewData.length];
            setText(card, ".reviews__name", name);
            setText(card, ".reviews__card-text", text);
            const time = card.querySelector(".reviews__date");
            if (time) {
              time.dateTime = date;
              time.textContent = date.split("-").reverse().join(".");
            }
            return card;
          }),
        );
      }

      const vacancyData = [
        {
          title: "Повар",
          experience: "можно без опыта",
          schedule: "2/2",
          salary: "по итогам собеседования",
        },
        {
          title: longVacancyTitle,
          experience: "опыт в премиальном гостиничном сервисе от 5 лет",
          schedule: "сменный график с вечерними мероприятиями и редкими командировками",
          salary: "от 160 000 ₽",
        },
        {
          title: "SPA-терапевт",
          experience: "опыт от 3 лет",
          schedule: "график 2/2",
          salary: "от 120 000 ₽",
        },
        {
          title: "Супервайзер номерного фонда",
          experience: "опыт от 2 лет",
          schedule: "график 2/2",
          salary: "от 85 000 ₽",
        },
        {
          title: "Менеджер ресторана",
          experience: "опыт от 4 лет",
          schedule: "плавающий график",
          salary: "от 140 000 ₽",
        },
        {
          title: "Консьерж",
          experience: "английский язык и опыт от 3 лет",
          schedule: "дневные и вечерние смены",
          salary: "от 110 000 ₽",
        },
        {
          title: "Администратор SPA-комплекса",
          experience: "опыт от 1 года",
          schedule: "график 2/2",
          salary: "от 80 000 ₽",
        },
        {
          title: "Официант ресторана",
          experience: "опыт от 1 года",
          schedule: "сменный график",
          salary: "от 80 000 ₽",
        },
      ];

      const vacancyLists = {
        duties: [
          "Встречать гостей, принимать запросы и передавать задачи смежным службам.",
          "Координировать бронирования, мероприятия, трансферы и специальные поручения.",
          "Вести отчетность, следить за стандартами сервиса и качеством коммуникации.",
          "Обновлять базу предпочтений постоянных гостей.",
          "Поддерживать связь с партнерами и поставщиками услуг.",
          "Готовить персональные сценарии обслуживания для VIP-заездов.",
          "Контролировать сроки выполнения задач.",
          "Участвовать в обучении новых сотрудников.",
        ],
        requirements: [
          "Грамотная речь и спокойная коммуникация.",
          "Опыт работы в отелях, ресторанах или премиальном сервисе.",
          "Умение работать с нестандартными запросами гостей.",
          "Внимательность к деталям и аккуратность.",
          "Готовность к сменному графику.",
          "Базовый английский язык.",
          "Навык работы с офисными инструментами.",
          "Понимание стандартов гостеприимства.",
        ],
        offer: [
          "Официальное оформление и стабильный доход.",
          "Корпоративное питание и стильная форма.",
          "Обучение стандартам отеля.",
          "Скидки на услуги комплекса.",
          "Понятная система премирования.",
          "Комфортная рабочая среда.",
          "Возможность роста внутри команды.",
          "Поддержка руководителя на старте.",
        ],
      };

      const vacancySlider = document.querySelector("#vacancies [data-vacancies-slider]");
      const vacanciesWrapper = vacancySlider?.querySelector(".vacancies__cards");
      const vacancyTemplate = vacanciesWrapper?.querySelector(".vacancy-card");
      if (vacancySlider && vacanciesWrapper && vacancyTemplate) {
        resetSwiper(vacancySlider);
        vacanciesWrapper.replaceChildren(
          ...makeNodeList(counts.vacancy, (index) => {
            const item = vacancyData[index % vacancyData.length];
            const card = vacancyTemplate.cloneNode(true);
            const listCount = [1, 3, 8][index % 3];
            card.dataset.vacancyTitle = item.title;
            card.dataset.vacancyExperience = item.experience;
            card.dataset.vacancySchedule = item.schedule;
            card.dataset.vacancySalary = item.salary;
            card.dataset.vacancyDescription =
              "Вакансия для внимательного специалиста, который умеет работать с гостями, поддерживать премиальный сервис и спокойно вести несколько задач одновременно.";
            card.dataset.vacancyDuties = JSON.stringify(vacancyLists.duties.slice(0, listCount));
            card.dataset.vacancyRequirements = JSON.stringify(vacancyLists.requirements.slice(0, listCount));
            card.dataset.vacancyOffer = JSON.stringify(vacancyLists.offer.slice(0, listCount));
            card.dataset.vacancyContact = "Отправляйте резюме или звоните по телефону: +7 999 999-99-99";
            const modalTemplate = card.querySelector(".vacancy-card__modal-content");
            const renderItems = (items) => items.map((text) => `<li>${text}</li>`).join("");
            if (modalTemplate instanceof HTMLTemplateElement) {
              modalTemplate.innerHTML = `
                <p>${card.dataset.vacancyDescription}</p>
                <h3>Обязанности:</h3>
                <ul>${renderItems(vacancyLists.duties.slice(0, listCount))}</ul>
                <h3>Требования:</h3>
                <ul>${renderItems(vacancyLists.requirements.slice(0, listCount))}</ul>
                <h3>Мы&nbsp;предлагаем:</h3>
                <ul>${renderItems(vacancyLists.offer.slice(0, listCount))}</ul>
              `;
            }
            setText(card, ".vacancy-card__title", item.title);
            const meta = card.querySelectorAll(".vacancy-card__meta-item span:last-child");
            if (meta[0]) meta[0].textContent = item.experience;
            if (meta[1]) meta[1].textContent = item.schedule;
            setText(card, ".vacancy-card__salary", item.salary);
            const hitarea = card.querySelector(".vacancy-card__hitarea");
            if (hitarea) hitarea.setAttribute("aria-label", `Читать полностью: ${item.title}`);
            return card;
          }),
        );
      }

      const articleData = [
        [
          "Маршрут на выходные: музеи, рестораны и тихие улицы рядом с отелем",
          "Готовый план на два дня: прогулки, культурные остановки и спокойные ужины без долгих переездов.",
          "12 мин",
          "12840",
          "28.04.2026",
        ],
        ["Завтрак перед прогулкой", "Короткая заметка.", "1 мин", "8", "01.04.2026"],
        [
          "Как выбрать номер для деловой поездки и не потерять рабочий ритм",
          "На что обратить внимание, если в поездке важны тишина, быстрый интернет, удобный стол и позднее возвращение после встреч.",
          "7 мин",
          "340",
          "15.03.2026",
        ],
        [
          "Семейный уикенд",
          "Идеи для отдыха с детьми рядом с отелем, включая музеи, тихие кафе и прогулочные маршруты.",
          "5 мин",
          "75",
          "05.09.2025",
        ],
        ["SPA после перелета", "Как восстановиться после дороги.", "3 мин", "92", "21.02.2026"],
        [
          "Театральный вечер",
          "Несколько сценариев ужина и прогулки до спектакля.",
          "4 мин",
          "140",
          "14.02.2026",
        ],
        ["Долгое проживание", "Как устроить быт в отеле на неделю.", "6 мин", "510", "07.02.2026"],
        [
          "Город без суеты",
          "Тихие улицы, маленькие галереи и места, где можно провести день в своем темпе.",
          "9 мин",
          "980",
          "30.01.2026",
        ],
      ];

      const articlesSection = document.querySelector("#blog");
      const articlesSlider = articlesSection?.querySelector("[data-articles-slider]");
      const articlesWrapper = articlesSlider?.querySelector(".articles__grid") ?? articlesSection?.querySelector(".articles__grid");
      const articleTemplate = articlesWrapper?.querySelector(".articles__slide") ?? articlesWrapper?.querySelector(".articles__item");
      if (articlesWrapper && articleTemplate) {
        if (articlesSlider) resetSwiper(articlesSlider);
        articlesWrapper.replaceChildren(
          ...makeNodeList(counts.article, (index) => {
            const node = articleTemplate.cloneNode(true);
            const [title, text, minutes, views, date] = articleData[index % articleData.length];
            const card = node.matches?.(".article-card") ? node : node.querySelector(".article-card");
            if (card) card.setAttribute("href", `/blog/dynamic-article-${index + 1}/`);
            setText(node, ".article-card__title", title);
            setText(node, ".article-card__text", text);
            const meta = node.querySelectorAll(".article-card__meta-item");
            if (meta[0]) meta[0].textContent = minutes;
            if (meta[1]) meta[1].textContent = views;
            if (meta[2]) meta[2].textContent = date;
            return node;
          }),
        );
      }

      const faqData = [
        ["Есть парковка?", ["Да, парковка доступна по предварительному запросу."]],
        [
          "Можно ли оформить ранний заезд, поздний выезд и оставить багаж до заселения?",
          [
            "Ранний заезд и поздний выезд зависят от загрузки отеля, но команда всегда проверяет возможность заранее.",
            "Багаж можно оставить у консьержа до заселения и после выезда.",
            "Для особых запросов свяжитесь с нами по телефону +7 (999) 999-99-99 или по почте pr@victoryagency.ru.",
          ],
        ],
        [
          "Как организовать трансфер?",
          ["Сообщите номер рейса, время прибытия и количество гостей, чтобы мы подготовили автомобиль подходящего класса."],
        ],
        [
          "Есть ли детские принадлежности?",
          ["По запросу подготовим кроватку, стульчик, халат и дополнительные полотенца."],
        ],
        [
          "Можно ли жить с питомцем?",
          ["Размещение возможно по предварительному согласованию с указанием породы и размера питомца."],
        ],
        [
          "Как заказать room service ночью?",
          ["Позвоните на ресепшн из номера, и команда подскажет доступные позиции ночного меню."],
        ],
        [
          "Можно ли провести деловую встречу?",
          ["Да, подберем переговорную зону, поможем с техникой, водой, кофе-брейком и навигацией для гостей."],
        ],
        [
          "Как работает SPA?",
          ["Расписание процедур зависит от дня недели, поэтому лучше забронировать удобное время заранее."],
        ],
        [
          "Какие документы нужны для заселения?",
          ["Понадобится паспорт каждого гостя, а для детей — свидетельство о рождении или другой документ."],
        ],
      ];

      const faqList = document.querySelector("#faq .faq__list");
      const faqTemplate = faqList?.querySelector(".faq__item");
      if (faqList && faqTemplate) {
        faqList.replaceChildren(
          ...makeNodeList(counts.faq, (index) => {
            const [question, answers] = faqData[index % faqData.length];
            const item = faqTemplate.cloneNode(true);
            const id = `dynamic-faq-${variant}-${index}`;
            item.removeAttribute("data-collapse-prepared");
            item.classList.toggle("active", index === 0);
            const button = item.querySelector(".faq__question");
            const answer = item.querySelector(".faq__answer");
            if (button) {
              button.id = `${id}-question`;
              button.setAttribute("aria-expanded", index === 0 ? "true" : "false");
              button.setAttribute("aria-controls", `${id}-answer`);
            }
            setText(item, ".faq__question-text", question);
            if (answer) {
              answer.id = `${id}-answer`;
              answer.setAttribute("aria-labelledby", `${id}-question`);
              answer.removeAttribute("data-sliding");
              answer.style.cssText = index === 0 ? "display: block;" : "display: none;";
              answer.replaceChildren(
                ...answers.map((text) => {
                  const paragraph = document.createElement("p");
                  paragraph.textContent = text;
                  return paragraph;
                }),
              );
            }
            return item;
          }),
        );
      }

      const gallerySlider = document.querySelector("#gallery [data-gallery-main]");
      const galleryThumbs = document.querySelector("#gallery [data-gallery-thumbs]");
      const galleryWrapper = gallerySlider?.querySelector(".swiper-wrapper");
      const galleryThumbsWrapper = galleryThumbs?.querySelector(".swiper-wrapper");
      const gallerySlideTemplate = galleryWrapper?.querySelector(".gallery__slide");
      const galleryThumbTemplate = galleryThumbsWrapper?.querySelector(".gallery__thumb");
      if (gallerySlider && galleryWrapper && gallerySlideTemplate) {
        resetSwiper(gallerySlider);
        if (galleryThumbs) resetSwiper(galleryThumbs);
        const count = counts.gallery;
        galleryWrapper.replaceChildren(
          ...makeNodeList(count, (index) => {
            const slide = gallerySlideTemplate.cloneNode(true);
            const img = slide.querySelector("img");
            if (img) img.alt = `Динамическое фото отеля ${index + 1}`;
            return slide;
          }),
        );
        if (galleryThumbsWrapper && galleryThumbTemplate) {
          galleryThumbsWrapper.replaceChildren(
            ...makeNodeList(count, () => galleryThumbTemplate.cloneNode(true)),
          );
        }
      }

      const reelsWrapper = document.querySelector("[data-reels-preview-wrapper]");
      const reelsTemplate = reelsWrapper?.querySelector("template");
      const reelImg = document.querySelector("[data-reels-preview-wrapper] template img");
      const fallbackPreview =
        reelImg?.getAttribute("src") ||
        document.querySelector("#gallery img")?.getAttribute("src") ||
        "/assets/images/gallery/lounge.webp";

      if (reelsWrapper && reelsTemplate) {
        reelsWrapper
          .querySelectorAll("[data-dynamic-reel], .swiper-slide")
          .forEach((slide) => slide.remove());
        makeNodeList(counts.reels, (index) => {
          const fragment = reelsTemplate.content.cloneNode(true);
          const slide = fragment.querySelector("[data-reels-preview-trigger]");
          const title = fragment.querySelector("[data-reel='title']");
          const image = fragment.querySelector("[data-reel='preview']");
          if (slide) slide.setAttribute("data-dynamic-reel", "");
          if (title) {
            title.textContent =
              index % 2 === 0
                ? "Утренний завтрак, спа и вечерний вид из панорамного номера"
                : "Рилс";
          }
          if (image) image.setAttribute("src", fallbackPreview);
          reelsWrapper.appendChild(fragment);
        });
      }

      restartSliders();
      }, { once: true });
    },
    {
      counts,
      longRoomDescription,
      longReviewText,
      longVacancyTitle,
      variant,
    },
  );
}

async function expectDynamicCounts(page, variant) {
  const counts = stressCounts[variant];

  await expect(page.locator("#promos .promo-card")).toHaveCount(counts.promo);
  await expect(page.locator("#services .service-card")).toHaveCount(counts.service);
  await expect(page.locator("#hotel-benefits .hotel-benefits__card")).toHaveCount(counts.benefit);
  await expect(page.locator("#reviews .reviews__card")).toHaveCount(counts.review);
  await expect(page.locator("#vacancies .vacancy-card")).toHaveCount(counts.vacancy);
  await expect(page.locator("#faq .faq__item")).toHaveCount(counts.faq);
  await expect(page.locator("#blog .article-card")).toHaveCount(counts.article);
  await expect(page.locator("#gallery .gallery__slide")).toHaveCount(counts.gallery);
  await expect(page.locator(".reels [data-dynamic-reel]")).toHaveCount(counts.reels);
}

test.describe("dynamic content stress check", () => {
  for (const variant of ["compact", "intermediate"]) {
    test(`renders ${variant} content set from initial HTML`, async ({ page }) => {
      await openPage(page, variant);
      await expectDynamicCounts(page, variant);
      await expectNoHorizontalPageScroll(page);
    });
  }

  test("keeps key dynamic blocks stable with mixed content lengths", async ({ page }, testInfo) => {
    await openPage(page, "mixed");

    for (const selector of sectionSelectors) {
      await expect(page.locator(selector)).toBeVisible();
    }

    await expect(page.locator("#rooms .rooms__category")).toHaveCount(5);
    await expect(page.locator("#rooms .room-card")).toHaveCount(8);
    await expectDynamicCounts(page, "mixed");

    await expectVisibleBoxes(page.locator("#rooms .room-card.active"));
    await expectVisibleBoxes(page.locator("#promos .promo-card"));
    await expectVisibleBoxes(page.locator("#services .service-card"));
    await expectVisibleBoxes(page.locator("#hotel-benefits .hotel-benefits__card"));
    await expectVisibleBoxes(page.locator("#reviews .reviews__card"));
    await expectVisibleBoxes(page.locator("#vacancies .vacancy-card"));
    await expectVisibleBoxes(page.locator("#blog .article-card"));
    await expectVisibleBoxes(page.locator(".reels [data-dynamic-reel] .reels-item"));
    await expectNoHorizontalPageScroll(page);

    if (testInfo.project.name === "mobile") {
      await expect(page.locator("#blog .articles__slider.swiper-initialized")).toHaveCount(0);
      await expect(page.locator("#vacancies .vacancies__slider.swiper-initialized")).toHaveCount(1);
    }

    await expectInsideViewport(page, page.locator("#rooms .rooms__categories"));
    await expectInsideViewport(page, page.locator("#reviews .reviews__card").first());
    await expectInsideViewport(page, page.locator("#blog .article-card").first());
  });

  test("keeps dense dynamic lists and shared modals usable", async ({ page }) => {
    await openPage(page, "dense");
    await expectDynamicCounts(page, "dense");
    await expectNoHorizontalPageScroll(page);

    const roomModal = page.locator('[data-modal="modalRoom"]');
    await page.locator("#rooms [data-tab-id='family']").click();
    await page.locator("#rooms .room-card.active").first().locator(".room-card__more").click();
    await expect(roomModal).toBeVisible();
    await expect(roomModal.getByRole("heading", { name: /Лесная вилла/ })).toBeVisible();
    await expect(roomModal.locator(".room-modal__text")).toContainText("двумя спальнями");
    await roomModal.getByRole("button", { name: "Закрыть" }).click();
    await expect(roomModal).toBeHidden();

    const reviewsModal = page.locator('[data-modal="modalReviews"]');
    await page.locator("#reviews .reviews__more").nth(1).click();
    await expect(reviewsModal).toBeVisible();
    await expect(reviewsModal.locator(".reviews-modal__text")).toContainText("сервис не выглядит навязчивым");
    await page.keyboard.press("Escape");
    await expect(reviewsModal).toBeHidden();

    const vacancyModal = page.locator('[data-modal="modalVacancy"]');
    await page.locator("#vacancies .vacancy-card").nth(1).click();
    await expect(vacancyModal).toBeVisible();
    await expect(
      vacancyModal.getByRole("heading", { name: /Старший менеджер по работе/ }),
    ).toBeVisible();
    await expect(vacancyModal.locator(".vacancy-modal__details")).toHaveCSS("overflow-y", "auto");
    await vacancyModal.getByRole("button", { name: "Закрыть" }).click();
    await expect(vacancyModal).toBeHidden();

    const faq = page.locator("#faq");
    await faq.getByRole("button", { name: /Можно ли оформить ранний заезд/ }).click();
    await expect(faq.getByRole("button", { name: /Можно ли оформить ранний заезд/ })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await expect(faq.getByText("Багаж можно оставить")).toBeVisible();
    await expectNoHorizontalPageScroll(page);
  });
});
