# Reels Module

Модуль рилсов для сайтов на обычной верстке и WordPress.

Поддерживает:

- отрисовку превью
- открытие модального окна
- последовательное проигрывание фото и видео
- прогресс-бары
- навигацию по сегментам

## Оглавление

- [Зависимости](#зависимости)
- [Возможности](#возможности)
- [Формат данных](#формат-данных)
- [Обязательная разметка](#обязательная-разметка)
- [Разметка для заполнения](#разметка-для-заполнения)
- [Архитектура](#архитектура)
- [Подключение модуля](#подключение-модуля)
- [Статичные данные](#статичные-данные)
- [WordPress](#wordpress)

## Зависимости

Обязательные зависимости:

- `swiper` — для слайдера превью и модального слайдера
- `vgmodals` — для открытия и закрытия модального окна

## Возможности

Возможности модуля:

- открытие модального окна на нужной истории
- поддержка нескольких медиа в одной истории
- автоматическое переключение сегментов внутри истории
- автоматический переход к следующей истории
- отдельная длительность для изображений
- использование реальной длительности для видео
- прогресс-бары по каждому сегменту
- перемотка текущего сегмента по клику на активный прогресс-бар
- переход к нужному сегменту по клику на неактивный прогресс-бар
- пауза при удержании
- навигация по левой и правой части истории
- поддержка фото и видео без явного `type`, по `src`

## Формат данных

Модуль работает с единым форматом данных:

```js
[
  {
    id: 'reel-1',
    title: 'Погружение в вкус Азии',
    text: 'Приятного аппетита с азиатским акцентом',
    avatar: './images/reels/avatar.webp',
    preview: './images/reels/preview.webp',
    items: [
      { src: './images/reels/reel-1.webp', duration: 5000 },
      { src: './files/reels.webm', duration: 0 },
      { src: './images/reels/reel-2.webp', duration: 3500 },
    ],
  },
];
```

!avatar - обязательно должен быть обернут в div, так как если путь до изображения не задан, то data- атрибут удаляет родительский элемент из DOM.

## Особенности

- duration используется только для изображений
- для видео используется реальная длина видеофайла
- тип медиа определяется автоматически по src

## Обязательная разметка

### data-reels-preview-wrapper

Обязательный дата атрибут для обертки кнопок рилсов, включая template.
Дата атрибут служит для заполнения объекта слайдерами.

```html
<div class="swiper-wrapper" data-reels-preview-wrapper>
  <template> ... </template>
</div>
```

### data-reels-preview-trigger

Дата атрибут навешивается на триггерную область для открытия модального окна с историями. Может навешиваться не только на swiper-slide.

```html
<template>
  <div class="swiper-slide" data-reels-preview-trigger>...</div>
</template>
```

### data-reels-modal-wrapper

Обязательный дата атрибут для обертки слайдов с историями, включая template.
Дата атрибут служит для заполнения объекта слайдерами.

```html
<div class="swiper-wrapper" data-reels-modal-wrapper>
  <template> ... </template>
</div>
```

### data-reel-progress-bars

Дата-атрибут, который создает прогресс бары в зависимости от кол-ва медиафайлов.
За основу можно использовать готовый стиль, изменяя его под свои нужды.

```html
<div class="reels-modal__bars" data-reel-progress-bars></div>
```

```scss
&__bars {
  display: flex;
  gap: 10rem;

  button {
    --progress: 0%;
    cursor: pointer;
    position: relative;
    flex: 1;
    height: 4rem;
    background-color: red;
    margin-bottom: 10rem;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      width: var(--progress);
      background-color: var(--white);
    }
  }
}
```

### data-reel-medias

Дата атрибут служит для того, чтобы отрендерить медиафайлы в одну историю.
Одина история может содержать более одного медиафайла.

В качестве стиля можно использовать базовый вариант, изменяя его под себя.

```html
<div class="reels-modal__contents" data-reel-medias></div>
```

```scss
&__contents {
  width: 100%;
  height: 100%;

  > div {
    width: 100%;
    height: 100%;
    background-color: var(--black);
    display: none;
    align-items: center;
    justify-content: center;
    overflow: hidden;

    video,
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    &.active {
      display: flex;
    }
  }
}
```

### data-reels-nav="prev" | data-reels-nav="next"

Данный блок используется для перелистывания медиафайлов по нажатию на края экранов.
Элемент является необязательным, при удалении он не будет влиять на логику работы.

```html
<div class="reels-modal__nav">
  <button
    type="button"
    class="reels-modal__nav-zone reels-modal__nav-zone--prev"
    data-reels-nav="prev"
  ></button>
  <button
    type="button"
    class="reels-modal__nav-zone reels-modal__nav-zone--next"
    data-reels-nav="next"
  ></button>
</div>
```

```scss
&__nav {
  display: flex;
  justify-content: space-between;
  position: absolute;
  inset: 0;
  z-index: 2;
}

&__nav-zone {
  width: 10%;
  border: 0;
  padding: 0;
  background: transparent;
  cursor: pointer;
  background-color: green;
}
```

### data-swiper="reels" | data-swiper="reels-modal"

Обязательный атрибут для настроек swiper.

data-swiper="reels" - настройки свайпера для превью.
data-swiper="reels-modal" - настройки свайпера историй в модальном окне.

```html
<div class="swiper" data-swiper="reels-modal">
  <div class="swiper-wrapper" data-reels-modal-wrapper>
    <template></template>
  </div>
</div>
```

### data-modal="reels"

Используется для привязки функционала модального окна.
При нажатии на элемент с дата атрибутом data-reels-preview-trigger будет открываться модальное окно со слайдами риллсов.

```html
<div class="modal reels-modal" data-modal="reels">
  <button class="modal__close icon icon--x" data-modal-close="reels"></button>
  <div class="modal__block reels-modal__block">...</div>
</div>
```

Обязательный атрибут для настроек swiper.

### data-close-reels

Используется для закрытия сторис по нажатию на кнопку.

## Разметка для заполнения

- data-reel="preview" + data-reel-attr="src":
  добавляется на тэг img, который должен быть обернут в div.

- data-reel="title":
  добавляется на любой тэг.

- data-reel="avatar" + data-reel-attr="src":
  добавляется на тэг img, который должен быть обернут в div.

- data-reel="text":
  добавляется на любой тэг.

## Архитектура

Модуль построен по принципу "composition over inheritance".

### Layers:

- facade — публичный вход и orchestration
- composition — основное поведение модуля
- strategy — логика playback для image и video
- render — рендер DOM
- adapter — преобразование данных
- helpers — небольшие утилиты

# Подключение модуля

## Статичные данные

### 1 - Установить библиотеку

Для установки используем данную команду:

- `npm i https://github.com/VICTORY-digital/modules-vg-reels.git`

Также необходимо установить зависимые библиотеки:

- `npm i swiper` - используется для переключения слайдов.
- `https://github.com/VICTORY-digital/vgmodals` - для открытия модальных окон.

### 2 - Добавить HTML в верстку

Добавьте в проект готовую html разметку. Ниже представлен пример. При необходимости можно изменять разметку под свои нужды, главное соблюдать расстановку обязательных data-атрибутов.

<details>
<summary>Пример блока HTML</summary>

```html
<section class="reels section-reels">
  <div class="container-reels">
    <div class="swiper-shell" data-swiper="reels">
      <div class="swiper">
        <div class="swiper-wrapper" data-reels-preview-wrapper>
          <template>
            <div class="swiper-slide" data-reels-preview-trigger>
              <div class="reels__item">
                <div class="reels__preview">
                  <img data-reel="preview" data-reel-attr="src" alt="Рилс" loading="lazy" />
                </div>
                <div class="reels__description" data-reel="title"></div>
              </div>
            </div>
          </template>
        </div>
      </div>
      <div class="swiper-buttons">
        <button class="swiper-btn swiper-btn--left swiper-btn-reels-prev" type="button"></button>
        <button class="swiper-btn swiper-btn-reels-next" type="button"></button>
      </div>
    </div>
  </div>
</section>

<div class="reels-modal" data-modal="reels">
  <button class="reels-modal__close" data-modal-close="reels"></button>
  <div class="reels-modal__block">
    <div class="swiper" data-swiper="reels-modal">
      <div class="swiper-wrapper" data-reels-modal-wrapper>
        <template>
          <div class="swiper-slide">
            <div class="reels-modal__item">
              <div class="reels-modal__header">
                <div class="reels-modal__bars" data-reel-progress-bars></div>
                <div class="reels-modal__title">
                  <div class="reels-modal__avatar">
                    <img data-reel="avatar" data-reel-attr="src" alt="" loading="lazy" />
                  </div>
                  <div class="" data-reel="title"></div>
                </div>
              </div>
              <div class="reels-modal__footer"><div data-reel="text"></div></div>
              <div class="reels-modal__contents" data-reel-medias></div>
              <div class="reels-modal__nav">
                <button
                  type="button"
                  class="reels-modal__nav-zone reels-modal__nav-zone--prev"
                  data-reels-nav="prev"
                ></button>
                <button
                  type="button"
                  class="reels-modal__nav-zone reels-modal__nav-zone--next"
                  data-reels-nav="next"
                ></button>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</div>
```

</details>

### 3 - Подключение SCSS стилей

В пакете стили уже есть. Для того, чтобы потянуть их в проект необходимо сделать импорт в главном js файле.

```js
import 'modules-vg-reels/styles.css';
```

Также можно подключить стили собственноручно, добавив блок кода ниже, в проект.

<details>
<summary>Пример блока SCSS</summary>

```scss
.reels,
.reels-modal {
  --r-section-padding: 40rem 0;
  --r-container-width: 1460rem;
  --r-preview-height: 200rem;

  --r-position-top-swiper-btn-preview: 75rem;

  --r-modal-blackout: rgba(21, 21, 21, 0.5);

  --r-close-color: black;
  --r-close-bg: white;

  --r-nav-zone-bg: transparent;
  --r-nav-zone-width: 10%;

  --r-progress-bg: grey;
  --r-progress-foreground: white;

  --r-avatar-size: 50rem;

  --r-swiper-btn-color: #5f3420;
  --r-swiper-btn-bg: white;
  --r-swiper-btn-color-hover: #e1d3c7;
  --r-swiper-btn-bg-hover: #5f3420;
  --r-swiper-btn-color-focus: #e1d3c7;
  --r-swiper-btn-bg-focus: #5f3420;
  --r-swiper-btn-color-disabled: #e1d3c7;
  --r-swiper-btn-bg-disabled: white;
}

html:has(.reels-modal.opened) {
  scrollbar-gutter: stable;
}

.reels {
  &.section-reels {
    position: relative;
    padding: var(--r-section-padding);
  }

  .container-reels {
    width: var(--r-container-width);
    padding: 0;
    position: relative;
    margin-inline: auto;
  }

  &__item {
    cursor: pointer;
  }

  &__preview {
    height: var(--r-preview-height);
    margin-bottom: 10rem;
    transition: all 0.3s ease;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      will-change: transform;
    }
  }

  &__description {
    padding-inline: 5rem;
    text-align: center;

    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
  }

  .swiper {
    overflow: visible;
  }

  .swiper-shell {
    position: relative;
  }

  .swiper-buttons {
    display: flex;
    top: var(--r-position-top-swiper-btn-preview);
    pointer-events: none;
    z-index: 10;
    position: absolute;
    display: flex;
    justify-content: space-between;
    width: 100%;

    button {
      &:nth-of-type(1) {
        margin-left: -25rem;
      }

      &:nth-of-type(2) {
        margin-right: -25rem;
      }
    }
  }

  .swiper-btn {
    z-index: 5;
    cursor: pointer;
    align-items: center;
    justify-content: center;
    width: 50rem;
    height: 50rem;
    border: 1rem solid var(--r-swiper-btn-color);
    background-color: var(--r-swiper-btn-bg);
    color: var(--r-swiper-btn-color);
    transition: all 0.3s ease;
    pointer-events: auto;

    &::after {
      content: '';
      display: block;
      -webkit-mask-image: url('data:image/svg+xml,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M8%204L16%2012L8%2020%22%20stroke%3D%22white%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22square%22%2F%3E%3C%2Fsvg%3E');
      mask-image: url('data:image/svg+xml,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M8%204L16%2012L8%2020%22%20stroke%3D%22white%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22square%22%2F%3E%3C%2Fsvg%3E');
      background-color: currentColor;
      -webkit-mask-repeat: no-repeat;
      mask-repeat: no-repeat;
      mask-position: center;
      -webkit-mask-size: contain;
      mask-size: contain;

      width: 24rem;
      height: 24rem;
    }

    &:hover {
      color: var(--r-swiper-btn-color-hover);
      background-color: var(--r-swiper-btn-bg-hover);
      border: transparent;
    }

    &:active {
      color: var(--r-swiper-btn-color-focus);
      background-color: var(--r-swiper-btn-bg-focus);
      border: transparent;
    }

    &:focus {
      color: var(--r-swiper-btn-color-focus);
      background-color: var(--r-swiper-btn-bg-focus);
      border: transparent;
    }

    &:disabled {
      border: 1rem solid var(--r-swiper-btn-color-disabled);
      background-color: var(--r-swiper-btn-bg-disabled);
      color: #e1d3c7;
    }

    &--left {
      transform: rotate(180deg);
    }
  }
}

.reels-modal {
  position: relative;
  z-index: 100;
  position: fixed;
  inset: 0;
  opacity: 0;
  pointer-events: none;

  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--r-modal-blackout);

  transition: all 0.3s ease;

  &.opened {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(0);

    .reels-modal__block {
      transform: translateY(0);
      opacity: 1;
    }
  }

  &:not(.opened) .swiper-btn {
    pointer-events: none;
  }

  &__block {
    position: relative;
    padding: 0;
    background-color: transparent;
    width: 100%;
    max-width: 100%;
    transform: translateY(100rem);
    transition: all 0.3s ease;
  }

  &__close {
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    position: absolute;
    border: 1rem solid var(--r-close-color);
    background-color: var(--r-close-bg);

    right: 20rem;
    top: 20rem;
    width: 40rem;
    height: 40rem;

    &::before {
      content: '';
      display: block;
      width: 32rem;
      height: 32rem;
      background-color: currentColor;

      -webkit-mask-repeat: no-repeat;
      mask-repeat: no-repeat;
      -webkit-mask-position: center;
      mask-position: center;
      -webkit-mask-size: contain;
      mask-size: contain;

      -webkit-mask-image: url('data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%2024%2024%27%20fill%3D%27none%27%3E%3Cpath%20d%3D%27M6%206L18%2018M18%206L6%2018%27%20stroke%3D%27white%27%20stroke-width%3D%271.5%27%20stroke-linecap%3D%27square%27%2F%3E%3C%2Fsvg%3E');
      mask-image: url('data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%2024%2024%27%20fill%3D%27none%27%3E%3Cpath%20d%3D%27M6%206L18%2018M18%206L6%2018%27%20stroke%3D%27white%27%20stroke-width%3D%271.5%27%20stroke-linecap%3D%27square%27%2F%3E%3C%2Fsvg%3E');
    }
  }

  &__item {
    cursor: pointer;
    position: relative;
    transform: scale(0.8);
    transition: all 0.3s ease;
    background-color: #000;
    height: 100%;
    aspect-ratio: 9 / 16;

    @media (max-width: 767px) {
      height: 85dvh;
      width: 100%;
    }

    &::before {
      content: '';
      pointer-events: none;
      position: absolute;
      inset: 0 0 auto 0;
      height: 160rem;
      background: linear-gradient(
        to bottom,
        rgba(0, 0, 0, 0.8) 0%,
        rgba(0, 0, 0, 0.6) 45%,
        rgba(0, 0, 0, 0) 100%
      );
    }

    &::after {
      content: '';
      pointer-events: none;
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      transition: opacity 0.3s ease;
      pointer-events: none;
    }
  }

  .swiper-slide-active {
    .reels-modal__nav {
      display: flex;
    }

    @media (max-width: 767px) {
      .reels-modal__item {
        transform: scale(1);
      }
    }
  }

  &__nav {
    display: none;
    justify-content: space-between;
    position: absolute;
    inset: 0;
    z-index: 2;
  }

  &__nav-zone {
    width: var(--r-nav-zone-width);
    border: 0;
    padding: 0;
    background: transparent;
    cursor: pointer;
    background-color: var(--r-nav-zone-bg);
  }

  &__header {
    position: absolute;
    z-index: 50;
    top: 20rem;
    left: 30rem;
    right: 30rem;
    user-select: none;
  }

  &__footer {
    display: flex;
    flex-direction: column;
    gap: 10rem;
    position: absolute;
    bottom: 20rem;
    left: 30rem;
    color: #fff;
  }

  &__title {
    display: flex;
    align-items: center;
    gap: 10rem;
    color: #fff;
  }

  &__avatar {
    width: var(--r-avatar-size);
    height: var(--r-avatar-size);
    border-radius: 50%;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__bars {
    display: flex;
    gap: 10rem;

    button {
      --progress: 0%;
      cursor: pointer;
      position: relative;
      flex: 1;
      height: 4rem;
      background-color: var(--r-progress-bg);
      margin-bottom: 10rem;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        width: var(--progress);
        background-color: var(--r-progress-foreground);
      }
    }
  }

  &__contents {
    width: 100%;
    height: 100%;

    > div {
      width: 100%;
      height: 100%;
      background-color: #000;
      display: none;
      align-items: center;
      justify-content: center;
      overflow: hidden;

      video,
      img {
        user-select: none;
        width: 100%;
        height: 100%;
        object-fit: contain;
      }

      &.active {
        display: flex;
      }
    }
  }

  .swiper-slide {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15rem;
  }

  .swiper-slide-active {
    .reels-modal__name {
      display: none;
    }

    .reels-modal__item {
      cursor: default;
      transform: scale(1);

      &::after {
        opacity: 0;
      }
    }
  }
}

.swiper-btn {
  display: flex;
}
```

</details>

### 4 - Заполнить массив статическими данными

Для статических данных необходимо создать моковый массив и передать его аргументом в вызов функции setupReels(mock).

Массив должен быть в формате:

```js
  {
    id: string,
    title: string,
    text: string,
    avatar: string,
    preview: string,
    items: [
      {
        src: string,
        duration: number,
      }
    ],
  },
```

Ниже представлен пример js файла с моковыми данными. Используйте его, заменив пути на свои.

<details>
<summary>Пример блока JS</summary>

```js
export const reelsMock = [
  {
    id: 'reel-1',
    title: 'Погружение в вкус Азии',
    text: 'Приятного аппетита с азиатским акцентом',
    avatar: './images/reels/reel.webp',
    preview: './images/reels/reel.webp',
    items: [{ src: './images/reels/reel.webp', duration: 2000 }],
  },
  {
    id: 'reel-2',
    title: 'Ваш азиатский гастрономический тур',
    text: 'Открывайте новые сочетания каждый день',
    avatar: '',
    preview: './images/reels/reel.webp',
    items: [
      { src: './images/reels/reel.webp', duration: 5000 },
      { src: '/bonsai/files/reels.webm', duration: 3000 },
      { src: './images/reels/reel.webp', duration: 1000 },
    ],
  },
];
```

</details>

### 5 - Подключение js

Для того, чтобы проект видел данный модуль его необходимо подключить в главном index.js файле
в DOMContentLoaded.

`setupReels` - принимает моковые данные, инстанс класса модалки из vg-modals, настройки свайпера для превью и настройки свайпера для сторисов.
\*Если не передавать настройки свайпера, то будут применяться дефолтные.

```js
import './libs/vgmodals';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { setupReels } from './module-reels/setup-reels';
import { reelsMock } from './module-reels/adapter/static/reels.mock';

document.addEventListener('DOMContentLoaded', async () => {
  await setupReels(reelsMock, {
    previewSwiper: {
      slidesPerView: 4,
      spaceBetween: 12,
      breakpoints: {
        768: { slidesPerView: 5 },
        1280: { slidesPerView: 7, spaceBetween: 24 },
      },
    },
    modalSwiper: {
      slidesPerView: 1,
      spaceBetween: 40,
      centeredSlides: true,
      slideToClickedSlide: true,
      watchSlidesProgress: true,
      watchOverflow: true,
      breakpoints: {
        768: {
          slidesPerView: 2.5,
        },
        1200: {
          slidesPerView: 3.8,
        },
      },
    },
  });
});
```

## Wordpress

### 1 - Установить библиотеку

Для установки используем данную команду:

- `npm i https://github.com/VICTORY-digital/modules-vg-reels.git`

Также необходимо установить зависимые библиотеки:

- `npm i swiper` - используется для переключения слайдов.
- `https://github.com/VICTORY-digital/vgmodals` - для открытия модальных окон.

### 2 - Добавить HTML в верстку

Добавьте в проект готовую html разметку. Ниже представлен пример. При неободимости можно изменять разметку под свои нужды, главное соблюдать расстановку обязательных data-атрибутов.

<details>
<summary>Пример блока HTML</summary>

```html
<section class="reels section-reels">
  <div class="container-reels">
    <div class="swiper-shell" data-swiper="reels">
      <div class="swiper">
        <div class="swiper-wrapper" data-reels-preview-wrapper>
          <template>
            <div class="swiper-slide" data-reels-preview-trigger>
              <div class="reels__item">
                <div class="reels__preview">
                  <img data-reel="preview" data-reel-attr="src" alt="Рилс" loading="lazy" />
                </div>
                <div class="reels__description" data-reel="title"></div>
              </div>
            </div>
          </template>
        </div>
      </div>
      <div class="swiper-buttons">
        <button class="swiper-btn swiper-btn--left swiper-btn-reels-prev" type="button"></button>
        <button class="swiper-btn swiper-btn-reels-next" type="button"></button>
      </div>
    </div>
  </div>
</section>

<div class="reels-modal" data-modal="reels">
  <button class="reels-modal__close" data-modal-close="reels"></button>
  <div class="reels-modal__block">
    <div class="swiper" data-swiper="reels-modal">
      <div class="swiper-wrapper" data-reels-modal-wrapper>
        <template>
          <div class="swiper-slide">
            <div class="reels-modal__item">
              <div class="reels-modal__header">
                <div class="reels-modal__bars" data-reel-progress-bars></div>
                <div class="reels-modal__title">
                  <div class="reels-modal__avatar">
                    <img data-reel="avatar" data-reel-attr="src" alt="" loading="lazy" />
                  </div>
                  <div class="" data-reel="title"></div>
                </div>
              </div>
              <div class="reels-modal__footer"><div data-reel="text"></div></div>
              <div class="reels-modal__contents" data-reel-medias></div>
              <div class="reels-modal__nav">
                <button
                  type="button"
                  class="reels-modal__nav-zone reels-modal__nav-zone--prev"
                  data-reels-nav="prev"
                ></button>
                <button
                  type="button"
                  class="reels-modal__nav-zone reels-modal__nav-zone--next"
                  data-reels-nav="next"
                ></button>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</div>
```

</details>

### 3 - Подключение SCSS стилей

В пакете стили уже есть. Для того, чтобы потянуть их в проект необходимо сделать импорт в главном js файле.

```js
import 'modules-vg-reels/styles.css';
```

Также можно подключить стили собсвенноручно, добавив блок кода ниже, в проект.

<details>
<summary>Пример блока SCSS</summary>

```scss
.reels,
.reels-modal {
  --r-section-padding: 40rem 0;
  --r-container-width: 1460rem;
  --r-preview-height: 200rem;

  --r-position-top-swiper-btn-preview: 75rem;

  --r-modal-blackout: rgba(21, 21, 21, 0.5);

  --r-close-color: black;
  --r-close-bg: white;

  --r-nav-zone-bg: transparent;
  --r-nav-zone-width: 10%;

  --r-progress-bg: grey;
  --r-progress-foreground: white;

  --r-avatar-size: 50rem;

  --r-swiper-btn-color: #5f3420;
  --r-swiper-btn-bg: white;
  --r-swiper-btn-color-hover: #e1d3c7;
  --r-swiper-btn-bg-hover: #5f3420;
  --r-swiper-btn-color-focus: #e1d3c7;
  --r-swiper-btn-bg-focus: #5f3420;
  --r-swiper-btn-color-disabled: #e1d3c7;
  --r-swiper-btn-bg-disabled: white;
}

html:has(.reels-modal.opened) {
  scrollbar-gutter: stable;
}

.reels {
  &.section-reels {
    position: relative;
    padding: var(--r-section-padding);
  }

  .container-reels {
    width: var(--r-container-width);
    padding: 0;
    position: relative;
    margin-inline: auto;
  }

  &__item {
    cursor: pointer;
  }

  &__preview {
    height: var(--r-preview-height);
    margin-bottom: 10rem;
    transition: all 0.3s ease;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      will-change: transform;
    }
  }

  &__description {
    padding-inline: 5rem;
    text-align: center;

    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
  }

  .swiper {
    overflow: visible;
  }

  .swiper-shell {
    position: relative;
  }

  .swiper-buttons {
    display: flex;
    top: var(--r-position-top-swiper-btn-preview);
    pointer-events: none;
    z-index: 10;
    position: absolute;
    display: flex;
    justify-content: space-between;
    width: 100%;

    button {
      &:nth-of-type(1) {
        margin-left: -25rem;
      }

      &:nth-of-type(2) {
        margin-right: -25rem;
      }
    }
  }

  .swiper-btn {
    z-index: 5;
    cursor: pointer;
    align-items: center;
    justify-content: center;
    width: 50rem;
    height: 50rem;
    border: 1rem solid var(--r-swiper-btn-color);
    background-color: var(--r-swiper-btn-bg);
    color: var(--r-swiper-btn-color);
    transition: all 0.3s ease;
    pointer-events: auto;

    &::after {
      content: '';
      display: block;
      -webkit-mask-image: url('data:image/svg+xml,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M8%204L16%2012L8%2020%22%20stroke%3D%22white%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22square%22%2F%3E%3C%2Fsvg%3E');
      mask-image: url('data:image/svg+xml,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M8%204L16%2012L8%2020%22%20stroke%3D%22white%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22square%22%2F%3E%3C%2Fsvg%3E');
      background-color: currentColor;
      -webkit-mask-repeat: no-repeat;
      mask-repeat: no-repeat;
      mask-position: center;
      -webkit-mask-size: contain;
      mask-size: contain;

      width: 24rem;
      height: 24rem;
    }

    &:hover {
      color: var(--r-swiper-btn-color-hover);
      background-color: var(--r-swiper-btn-bg-hover);
      border: transparent;
    }

    &:active {
      color: var(--r-swiper-btn-color-focus);
      background-color: var(--r-swiper-btn-bg-focus);
      border: transparent;
    }

    &:focus {
      color: var(--r-swiper-btn-color-focus);
      background-color: var(--r-swiper-btn-bg-focus);
      border: transparent;
    }

    &:disabled {
      border: 1rem solid var(--r-swiper-btn-color-disabled);
      background-color: var(--r-swiper-btn-bg-disabled);
      color: #e1d3c7;
    }

    &--left {
      transform: rotate(180deg);
    }
  }
}

.reels-modal {
  position: relative;
  z-index: 100;
  position: fixed;
  inset: 0;
  opacity: 0;
  pointer-events: none;

  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--r-modal-blackout);

  transition: all 0.3s ease;

  &.opened {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(0);

    .reels-modal__block {
      transform: translateY(0);
      opacity: 1;
    }
  }

  &:not(.opened) .swiper-btn {
    pointer-events: none;
  }

  &__block {
    position: relative;
    padding: 0;
    background-color: transparent;
    width: 100%;
    max-width: 100%;
    transform: translateY(100rem);
    transition: all 0.3s ease;
  }

  &__close {
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    position: absolute;
    border: 1rem solid var(--r-close-color);
    background-color: var(--r-close-bg);

    right: 20rem;
    top: 20rem;
    width: 40rem;
    height: 40rem;

    &::before {
      content: '';
      display: block;
      width: 32rem;
      height: 32rem;
      background-color: currentColor;

      -webkit-mask-repeat: no-repeat;
      mask-repeat: no-repeat;
      -webkit-mask-position: center;
      mask-position: center;
      -webkit-mask-size: contain;
      mask-size: contain;

      -webkit-mask-image: url('data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%2024%2024%27%20fill%3D%27none%27%3E%3Cpath%20d%3D%27M6%206L18%2018M18%206L6%2018%27%20stroke%3D%27white%27%20stroke-width%3D%271.5%27%20stroke-linecap%3D%27square%27%2F%3E%3C%2Fsvg%3E');
      mask-image: url('data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%2024%2024%27%20fill%3D%27none%27%3E%3Cpath%20d%3D%27M6%206L18%2018M18%206L6%2018%27%20stroke%3D%27white%27%20stroke-width%3D%271.5%27%20stroke-linecap%3D%27square%27%2F%3E%3C%2Fsvg%3E');
    }
  }

  &__item {
    cursor: pointer;
    position: relative;
    transform: scale(0.8);
    transition: all 0.3s ease;
    background-color: #000;
    height: 100%;
    aspect-ratio: 9 / 16;

    @media (max-width: 767px) {
      height: 85dvh;
      width: 100%;
    }

    &::before {
      content: '';
      pointer-events: none;
      position: absolute;
      inset: 0 0 auto 0;
      height: 160rem;
      background: linear-gradient(
        to bottom,
        rgba(0, 0, 0, 0.8) 0%,
        rgba(0, 0, 0, 0.6) 45%,
        rgba(0, 0, 0, 0) 100%
      );
    }

    &::after {
      content: '';
      pointer-events: none;
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      transition: opacity 0.3s ease;
      pointer-events: none;
    }
  }

  .swiper-slide-active {
    .reels-modal__nav {
      display: flex;
    }

    @media (max-width: 767px) {
      .reels-modal__item {
        transform: scale(1);
      }
    }
  }

  &__nav {
    display: none;
    justify-content: space-between;
    position: absolute;
    inset: 0;
    z-index: 2;
  }

  &__nav-zone {
    width: var(--r-nav-zone-width);
    border: 0;
    padding: 0;
    background: transparent;
    cursor: pointer;
    background-color: var(--r-nav-zone-bg);
  }

  &__header {
    position: absolute;
    z-index: 50;
    top: 20rem;
    left: 30rem;
    right: 30rem;
    user-select: none;
  }

  &__footer {
    display: flex;
    flex-direction: column;
    gap: 10rem;
    position: absolute;
    bottom: 20rem;
    left: 30rem;
    color: #fff;
  }

  &__title {
    display: flex;
    align-items: center;
    gap: 10rem;
    color: #fff;
  }

  &__avatar {
    width: var(--r-avatar-size);
    height: var(--r-avatar-size);
    border-radius: 50%;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__bars {
    display: flex;
    gap: 10rem;

    button {
      --progress: 0%;
      cursor: pointer;
      position: relative;
      flex: 1;
      height: 4rem;
      background-color: var(--r-progress-bg);
      margin-bottom: 10rem;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        width: var(--progress);
        background-color: var(--r-progress-foreground);
      }
    }
  }

  &__contents {
    width: 100%;
    height: 100%;

    > div {
      width: 100%;
      height: 100%;
      background-color: #000;
      display: none;
      align-items: center;
      justify-content: center;
      overflow: hidden;

      video,
      img {
        user-select: none;
        width: 100%;
        height: 100%;
        object-fit: contain;
      }

      &.active {
        display: flex;
      }
    }
  }

  .swiper-slide {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15rem;
  }

  .swiper-slide-active {
    .reels-modal__name {
      display: none;
    }

    .reels-modal__item {
      cursor: default;
      transform: scale(1);

      &::after {
        opacity: 0;
      }
    }
  }
}

.swiper-btn {
  display: flex;
}
```

</details>

### 4 - Подключить PHP файлы для админ-панели

Папка с php файлами находится по ссылке:

- `https://github.com/VICTORY-digital/modules-vg-reels/tree/main/wp-reels`

Чтобы установить интеграцию историй с админ-панелью WordPress, необходимо перенести корневую папку `wp-reels` в папку `functions` вашего проекта. Это является только рекомендацией, главное обращайте внимание на путь при подключении файлов в functions.php.

Финальным шагом будет подключение php файлов в `functions.php`.

```php
if (file_exists(__DIR__ . '/functions/wp-reels/reels-bridge.php')) {
	require_once __DIR__ . '/functions/wp-reels/reels-bridge.php';

	if (function_exists('modules_vg_reels_bootstrap')) {
		modules_vg_reels_bootstrap([
			'scriptHandle' => 'theme-main',
		]);
	}
}
```

!!! Обратите внимание на 'scriptHandle' => 'theme-main'.
`theme-main` - должен соответствовать вашему обработчику, который вы регистрировали раннее, как например:

```php
add_action('wp_enqueue_scripts', function (): void {
	$dist_path = get_template_directory() . '/assets/build';

	Vite\enqueue_asset(
		$dist_path,
		'assets/js/src/main.ts',
		[
			'handle'    => 'theme-main',
			'in-footer' => true,
		]
	);
}, 10);
```

### 5 - Подключение js

Для того, чтобы проект видел данный модуль его необходимо подключить в главном index.js файле
в DOMContentLoaded.

`setupReels` - принимает моковые данные, инстанс класса модалки из vg-modals, настройки свайпера для превью и настройки свайпера для сторисов.
\*Если не передавать настройки свайпера, то будут применяться дефолтные.

```js
import { setupReels, fromWpData } from 'modules-vg-reels';
import './libs/vgmodals';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

if (document.querySelector('[data-reels-preview-wrapper]')) {
  const reels = fromWpData(window.themeData?.reels || []);
  await setupReels(reels, {
    previewSwiper: {
      slidesPerView: 4,
      spaceBetween: 12,
      breakpoints: {
        768: { slidesPerView: 5 },
        1280: { slidesPerView: 7, spaceBetween: 24 },
      },
    },
    modalSwiper: {
      slidesPerView: 1,
      spaceBetween: 40,
      centeredSlides: true,
      slideToClickedSlide: true,
      watchSlidesProgress: true,
      watchOverflow: true,
      breakpoints: {
        768: {
          slidesPerView: 2.5,
        },
        1200: {
          slidesPerView: 3.8,
        },
      },
    },
  });
}
```

### 6 - Заполнение админ-панели

В админ-панели появиться вкладка Список историй, в которой можно заполнять данные, которые будут отображаться в блоке историй.
