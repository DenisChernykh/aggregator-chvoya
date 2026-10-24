# ТЗ: локальный Laravel Preview для CMS Blade-шаблонов

## 1. Назначение

Нужно создать отдельный локальный preview-проект для разработки CMS Blade-шаблонов конкретного сайта.

Проект нужен, чтобы верстать и проверять CMS-разметку локально, в нормальном редакторе, с подсветкой синтаксиса, Git, AI-агентом, локальными SCSS/JS и браузерной проверкой. Реальная CMS при этом используется только как место доставки готового кода, а не как среда разработки.

Главная цель: убрать двойной источник истины.

Текущая проблема:

```text
локальный HTML
реальный Blade-код в CMS
```

Если баг найден в CMS, приходится править и локальный HTML, и CMS-код.

Целевой процесс:

```text
локальный Blade-файл
локальный preview
проверка
build assets
перенос готового Blade и assets в CMS
```

Источник истины: Blade-файлы в локальном preview-проекте.

## 2. Архитектурное решение

Для каждого сайта создается отдельный Laravel preview-проект.

Например:

```text
hvoya-cms-preview/
grani-cms-preview/
edges-cms-preview/
```

Не нужно делать один общий проект, внутри которого лежат все сайты. У разных сайтов может отличаться структура CMS, названия блоков, формы, helper-шаблоны, наборы переменных, данные коллекций и логика вывода.

Общее можно переиспользовать только как starter/template для быстрого создания нового preview-проекта. После создания каждый preview-проект живет отдельно и повторяет структуру своей CMS.

## 3. Почему Laravel

В CMS-шаблонах используются Laravel/Blade-возможности:

```php
@extends()
@section()
@yield()
@include()
@csrf
csrf_token()
request()
url()
route()
View::getSections()
$__env->yieldContent()
Str::slug()
```

Поэтому standalone Blade-рендерер будет слишком быстро превращаться в самописную мини-версию Laravel. Лучше использовать настоящий Laravel, но только как локальный renderer и preview-среду.

Laravel preview-проект не является полноценной CMS. На первом этапе не нужны база данных, админка, авторизация, загрузка файлов и Docker.

## 4. Docker

Docker на старте не нужен.

MVP запускается локально:

```bash
composer create-project laravel/laravel hvoya-cms-preview
cd hvoya-cms-preview
php artisan serve
```

Docker можно добавить позже, если потребуется одинаковое окружение на разных машинах или фиксированная версия PHP/Node.

## 5. Структура проекта

Структура preview-проекта должна повторять структуру CMS конкретного сайта.

Пример для сайта, у которого CMS-дерево выглядит как `head`, `header`, `footer`, `helper`, `template`, `section`, `form`, `catalog`, `error`:

```text
hvoya-cms-preview/
  app/
    Support/
      CmsMock.php
      helpers.php

  fixtures/
    default.php
    edge-cases.php

  resources/
    views/
      head.blade.php
      header.blade.php
      footer.blade.php
      popups.blade.php
      scripts.blade.php

      helper/
        agreement.blade.php
        breadcrumbs.blade.php
        cookie.blade.php
        custom_styles.blade.php
        only-telephone.blade.php
        pagination.blade.php
        telephone-render.blade.php

      template/
        template-main.blade.php
        template-blog.blade.php

      section/
        section-benefits.blade.php
        section-blog.blade.php
        section-blog-container.blade.php
        section-booking-help.blade.php
        section-booking-panel.blade.php
        section-concept.blade.php
        section-contacts.blade.php
        section-faq.blade.php
        section-gallery.blade.php
        section-informations.blade.php
        section-intro.blade.php
        section-offers.blade.php
        section-other.blade.php
        section-reviews.blade.php
        section-rooms.blade.php
        section-services.blade.php
        section-stories.blade.php
        section-vacancies.blade.php
        section-video.blade.php
        socials.blade.php

      form/
        vacancy-modal.blade.php
        vacancy-common-modal.blade.php
        booking-table.blade.php
        booking-table-modal.blade.php
        callback-modal.blade.php

      catalog/
        catalog-blog-item.blade.php

      error/
        404.blade.php

      preview/
        layout.blade.php
        assets.blade.php
        section.blade.php
        page.blade.php

  routes/
    web.php

  public/
    assets/
      css/
      js/
      images/
      fonts/
```

Важно: если у другого сайта структура CMS другая, его preview-проект должен повторять именно его структуру, а не структуру этого примера.

## 6. Разделение CMS-кода и preview-кода

CMS-шаблоны должны быть максимально близки к коду, который будет вставлен на сайт.

Например:

```text
resources/views/section/section-faq.blade.php
resources/views/header.blade.php
resources/views/footer.blade.php
```

Эти файлы являются источником истины и переносятся в CMS.

Локальные preview-файлы не переносятся в CMS:

```text
resources/views/preview/layout.blade.php
resources/views/preview/assets.blade.php
resources/views/preview/section.blade.php
resources/views/preview/page.blade.php
```

Preview-файлы нужны только для локального просмотра и подключения dev/build assets.

Пример preview-страницы секции:

```blade
@extends('preview.layout')

@section('content')
    @include('section.section-faq')
@endsection
```

## 7. Mock-данные

Данные CMS имитируются через fixture-массивы.

Пример:

```php
return [
    'variables' => [
        'site_name' => 'Хвоя',
        'site_slogan' => 'Загородный отдых',
        'telephone' => '+7 (900) 900-90-90',
        'logo' => '/assets/images/header/logo-compact.svg',
        'telegram_link' => 'https://t.me/example',
        'vk_link' => '#',
        'rutube_link' => '#',
        'ok_link' => '#',
        'file_privacy' => '/privacy',
    ],

    'collections' => [
        'nav:nav' => [
            [
                'name' => 'Отзывы',
                'link' => '#reviews',
            ],
            [
                'name' => 'FAQ',
                'link' => '#faq',
            ],
        ],
    ],

    'collections_with_meta' => [
        'faq:faq' => [
            'active' => true,
            'meta' => [
                'title' => 'Ответы на часто задаваемые вопросы',
                'description' => 'Собрали главное перед поездкой.',
                'picture' => '',
            ],
            'items' => [
                [
                    'question' => 'Можно ли с питомцами?',
                    'answer' => 'Да, по предварительному согласованию.',
                ],
            ],
        ],

        'vacancies:vacancies' => [
            'active' => true,
            'meta' => [
                'title' => 'Вакансии',
                'description' => 'Присоединяйтесь к команде.',
            ],
            'items' => [
                [
                    'title' => 'Администратор',
                    'text' => 'Описание вакансии.',
                    'pay' => 'от 80 000 ₽',
                    'exp' => 'Без опыта',
                    'work_time' => '2/2',
                ],
            ],
        ],
    ],

    'platforms_with_reviews' => [
        'total_rating' => '5.0',
        'total_reviews' => 672,
        'ratings' => [
            [
                'image' => 'icon-2gis',
                'link' => 'https://2gis.ru/example',
            ],
            [
                'image' => 'icon-yandex',
                'link' => 'https://yandex.ru/maps/example',
            ],
        ],
        'reviews' => [
            [
                'name' => 'Самур А',
                'image' => '/assets/images/reviews/avatar.webp',
                'rating' => 5,
                'date' => '13.04.2026',
                'title' => '',
                'text' => 'Текст отзыва.',
            ],
        ],
    ],
];
```

Fixtures должны повторять не идеальные данные, а реальные данные CMS, включая edge cases:

```text
'#'
''
null
icon-yandex
icon-2gis
пустые картинки
JSON-строки
active: false
нет meta
нет items
битые/неполные ссылки
длинные тексты
```

## 8. CMS-хелперы

В preview-проекте нужно имитировать CMS-специфичные функции:

```php
get_variable()
get_collections()
get_collections_with_meta()
getPlatformsWithReviews()
assets_url()
get_view()
setting()
```

Laravel-функции мокать не нужно:

```php
route()
request()
url()
csrf_token()
@csrf
@include()
@extends()
@section()
@yield()
```

Пример логики:

```php
function get_variable(string $key, mixed $default = null): mixed
{
    return app(\App\Support\CmsMock::class)->variable($key, $default);
}

function get_collections(string $key, string $collection, array $fields = []): array
{
    return app(\App\Support\CmsMock::class)->collection($key, $collection, $fields);
}

function get_collections_with_meta(string $key, string $collection, array $fields = []): array
{
    return app(\App\Support\CmsMock::class)->collectionWithMeta($key, $collection, $fields);
}

function getPlatformsWithReviews(?string $platform = null): array
{
    return app(\App\Support\CmsMock::class)->platformsWithReviews($platform);
}

function assets_url(): string
{
    return app(\App\Support\CmsMock::class)->assetsUrl();
}

function get_view(string $name): string
{
    return str_replace('/', '.', $name);
}
```

## 9. Работа с SCSS и JS

Laravel preview-проект не должен собирать SCSS/JS.

Frontend-разработка остается в обычном frontend-проекте через Vite.

В dev-режиме запускаются два процесса:

```bash
# frontend-проект
npm run dev

# Laravel preview-проект
php artisan serve
```

Laravel рендерит Blade, а ассеты берет с Vite dev server.

Пример `.env`:

```env
CMS_PREVIEW_ASSETS_MODE=dev
FRONTEND_DEV_SERVER=http://127.0.0.1:5173
```

В `preview/assets.blade.php`:

```blade
@if(env('CMS_PREVIEW_ASSETS_MODE') === 'dev')
    <script type="module" src="{{ env('FRONTEND_DEV_SERVER') }}/@vite/client"></script>
    <script type="module" src="{{ env('FRONTEND_DEV_SERVER') }}/assets/js/main.js"></script>
@else
    <link rel="stylesheet" href="{{ assets_url() }}/css/{{ $mainCss }}">
    <link rel="stylesheet" href="{{ assets_url() }}/css/theme.css">
    <script type="module" src="{{ assets_url() }}/js/{{ $mainJs }}" defer></script>
@endif
```

Этот код хранится только локально в preview-слое. В CMS-блоки он не переносится.

## 10. Build-режим для CMS

Для CMS поставляются уже собранные assets:

```text
assets/css/main-xxxx.css
assets/css/theme.css
assets/js/main-xxxx.js
assets/images/...
assets/fonts/...
```

После завершения верстки:

```bash
npm run build
```

В CMS переносятся:

```text
готовый Blade-шаблон
production CSS
production JS
images
fonts
```

Preview-проект должен уметь переключаться в build-режим, чтобы проверить страницу с production assets:

```env
CMS_PREVIEW_ASSETS_MODE=build
```

## 11. Preview routes

В `routes/web.php` должны быть маршруты для просмотра отдельных блоков и страниц:

```text
/section/benefits
/section/faq
/section/reviews
/section/vacancies
/page/home
/page/blog
/page/blog/single
/error/404
```

На первом этапе достаточно одной секции:

```text
/section/faq
```

Дальше добавляются остальные блоки.

## 12. Проверки

Минимальные проверки:

```text
Blade рендерится без PHP-ошибок
подключаются dev assets
подключаются build assets
нет горизонтального overflow на мобильном
Swiper имеет .swiper-wrapper
карточки слайдера имеют .swiper-slide
модалки имеют нужные data-modal
кнопки имеют нужные data-* хуки
площадки отзывов получают классы reviews__platform-link--...
формы имеют нужные data-action и data-method
privacy/agreement helper рендерит ссылку на политику
```

Для слайдеров и интерактивных блоков желательно добавить Playwright-smoke:

```text
desktop preview открывается
mobile preview открывается
нет horizontal scroll
можно кликнуть стрелку слайдера
можно открыть/закрыть модалку
```

## 13. MVP

MVP считается готовым, если:

```text
создан отдельный Laravel preview-проект для одного сайта
структура views повторяет CMS этого сайта
работает get_variable()
работает get_collections()
работает get_collections_with_meta()
работает assets_url()
есть fixtures/default.php
есть fixtures/edge-cases.php
перенесена одна секция, например section-faq
секция открывается локально
стили и JS подтягиваются с Vite dev server
тот же Blade-файл можно перенести в CMS без ручной переписки
```

## 14. Рекомендуемый порядок внедрения

1. Создать отдельный Laravel preview-проект под конкретный сайт.
2. Настроить базовые helpers.
3. Создать `fixtures/default.php`.
4. Создать `fixtures/edge-cases.php`.
5. Настроить `preview/layout.blade.php`.
6. Настроить `preview/assets.blade.php`.
7. Подключить assets из Vite dev server.
8. Перенести одну простую секцию, например `section-faq`.
9. Проверить ее локально.
10. Перенести `section-benefits`.
11. Добавить `header`, `footer`, `scripts`, `popups`.
12. Собрать full-page preview.
13. Перенести сложные секции: reviews, vacancies, gallery, rooms.
14. Добавить проверки контрактов для Swiper, модалок, форм и platform-классов.
15. Добавить build-режим.
16. Проверить, что production assets работают так же, как в CMS.

## 15. Главные правила процесса

Не разрабатывать в CMS.

Не держать локальный HTML как отдельный источник истины.

Не переписывать Blade вручную при переносе.

Править баги только в локальном Blade-файле, затем повторно переносить готовый код в CMS.

CMS должна быть последним шагом доставки:

```text
Blade в repo
локальный preview
проверка
build assets
copy/paste в CMS
```

