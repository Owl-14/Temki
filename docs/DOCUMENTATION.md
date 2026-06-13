# Документация «Инкубатор»

Полный справочник: что за что отвечает, как связаны части проекта, как запускать и деплоить.

**Репозиторий:** https://github.com/Owl-14/Temki  
**Продакшен:** https://owl-14.github.io/Temki/  
**Firebase-проект:** `temki-1409`

---

## Содержание

**Оглавление всей документации:** [docs/README.md](README.md)

0. **[Надёжность загрузки (обязательно)](RELIABILITY.md)** — правила, чтобы лента и профили не падали; §14 — деплой Firestore rules
1. [Статус и что должно быть включено в Firebase](#1-статус-и-что-должно-быть-включено-в-firebase)
2. [Архитектура](#2-архитектура)
3. [Страницы сайта](#3-страницы-сайта)
4. [JavaScript-модули](#4-javascript-модули)
5. [Firebase: коллекции и правила](#5-firebase-коллекции-и-правила)
6. [Картинки (без Storage)](#6-картинки-без-storage)
7. [CSS и UI-блоки](#7-css-и-ui-блоки)
8. [Аналитика (Яндекс.Метрика)](#8-аналитика-яндексметрика)
9. [Счётчик онлайн (Realtime Database)](#9-счётчик-онлайн-realtime-database)
10. [Локальная разработка](#10-локальная-разработка)
11. [Деплой на GitHub Pages](#11-деплой-на-github-pages)
12. [Чеклист «всё работает»](#12-чеклист-всё-работает)

---

## 1. Статус и что должно быть включено в Firebase

| Функция | Статус | Где включить |
|---------|--------|--------------|
| **Firestore** (профили, яйца) | ✅ API включён | [Firestore](https://console.firebase.google.com/project/temki-1409/firestore) |
| **Auth Email/Password** | Нужно включить вручную | [Sign-in method](https://console.firebase.google.com/project/temki-1409/authentication/providers) |
| **Домены** `localhost`, `127.0.0.1`, `owl-14.github.io` | Добавить вручную | [Auth settings → Authorized domains](https://console.firebase.google.com/project/temki-1409/authentication/settings) |
| **Realtime Database** (онлайн) | ✅ Работает | [Realtime Database](https://console.firebase.google.com/project/temki-1409/database) |
| **Storage** | ❌ Не используем | Картинки в Firestore (data URL) |
| **Правила Firestore** | Вставить из репо | `firebase/firestore.rules` → [Rules](https://console.firebase.google.com/project/temki-1409/firestore/rules) |
| **Public-facing name** | ✅ `Инкубатор` | [Project settings → General](https://console.firebase.google.com/project/temki-1409/settings/general) → синхрон с `config/brand.config.js` |
| **Auth Sender name** | ✅ `Инкубатор` | [Templates → Template settings](https://console.firebase.google.com/project/temki-1409/authentication/emails) |
| **Password reset subject** | ✅ `Инкубатор — сброс пароля` | Templates → Password reset |
| **Verification subject** | `Verify your email for Инкубатор` | Шаблон Firebase (текст письма не редактируется) |

**Поддоменов нет** — один статический сайт на GitHub Pages. Все «разделы» — это HTML-страницы и якоря (`#projects`), не отдельные домены.

---

## 2. Архитектура

```
┌─────────────────────────────────────────────────────────────┐
│  GitHub Pages (статика)                                     │
│  index · auth · profile · egg · edit-egg · settings · lay-egg │
└──────────────────────────┬──────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
   Firebase Auth    Firestore DB      Realtime DB
   (вход/регистр)   (users, eggs)     (presence)
         │                 │
         └──────── картинки как data URL в Firestore
```

| Слой | Папка | Роль |
|------|-------|------|
| **HTML** | `pages/` | Разметка страниц |
| **Стили** | `assets/css/` | Визуал, анимации, формы |
| **Логика** | `assets/js/` | ES-модули (core, eggs, platform, pages) |
| **Картинки** | `assets/images/` | Плейсхолдеры и статика |
| **Vendor** | `assets/vendor/` | Метрика, `effects.js` |
| **Конфиг** | `config/` | Firebase, brand, presence |
| **Бэкенд** | `firebase/` + облако | Правила Firestore |

Карта папок: [README.md](../README.md)

---

## 3. Страницы сайта

| Файл | URL | Назначение | Скрипты |
|------|-----|------------|---------|
| `pages/index.html` | `/pages/index.html` | Главная: hero, инкубация, цыплята | `assets/js/pages/home.js` |
| `pages/auth.html` | `/pages/auth.html` | Вход и регистрация | `assets/js/pages/auth.js` |
| `pages/profile.html` | `/pages/profile.html?u=` | Публичный профиль | `assets/js/pages/profile.js` |
| `pages/egg.html` | `/pages/egg.html?id=` | Страница яйца | `assets/js/pages/egg.js` |
| `settings.html` | `/pages/settings.html` | Настройки профиля, удаление аккаунта | `assets/js/pages/settings.js` |
| `pages/lay-egg.html` | `/pages/lay-egg.html` | Снести яйцо | `assets/js/pages/lay-egg.js` |
| `pages/edit-egg.html` | `/pages/edit-egg.html?id=` | Редактирование, вылупление | `assets/js/pages/edit-egg.js` |
| `pages/hatch-rules.html` | `/pages/hatch-rules.html?from=` | Правила вылупления (ссылка с edit-egg) | `assets/js/pages/hatch-rules.js` |
| `pages/chamber.html` | `/pages/chamber.html` | Камера, фильтры | `assets/js/pages/chamber.js` |
| `pages/my-eggs.html` | `/pages/my-eggs.html` | Кабинет основателя | `assets/js/pages/my-eggs.js` |
| `legend.html` | `/legend.html` | Концепция (онбординг): стадии проекта, роли | статика + `nav.js` |
| `hall.html` | `/hall.html` | Зал славы: лидерборды, горячая камера, недавно вылупились | `hall.js` — см. [platform/HALL.md](platform/HALL.md) |
| `notifications.html` | `/notifications.html` | Уведомления | `notifications.js` |
| `activity.html` | `/activity.html` | Подписки и лента обновлений | `activity.js` |
| `investors.html` | `/investors.html` | Заглушка «Раздел в разработке» | `investors.js` |

**Платформа (дорожная карта):** [docs/platform/README.md](platform/README.md)

**Блок «публичный профиль»:** [docs/blocks/public-profile.md](blocks/public-profile.md)

**Яйца (просмотр, редактирование, комментарии):** [docs/eggs/README.md](eggs/README.md)

### Блоки на главной (`index.html`)

| Блок | Селектор / id | Что делает |
|------|---------------|------------|
| **Сцена** | `.scene` | Фон: сетка, яйца, орбы, тепло |
| **Навигация** | `.nav`, `#nav-auth-slot` | Логотип + счётчик онлайн + вход/профиль |
| **Hero** | `.hero`, `#home` | Заголовок, текст, CTA «Смотреть яйца» |
| **Задания** | `#quests-widget` | Ежедневные квесты (залогиненные) |
| **Инкубация** | `#projects`, `#eggs-feed` | Первый блок ленты: яйца `greetsya`, новые сверху |
| **Цыплята** | `#chicks`, `#chicks-feed` | Второй блок: `tsyplenok` и `kuritsa`, по дате вылупления |
| **Горячая камера** *(скрыто)* | `#hot`, `#hot-feed` | Перенесено на `hall.html`; на главной — `HOME_FEEDS.hot` |
| **Недавно вылупились** *(скрыто)* | `#hatched`, `#hatched-feed` | Перенесено на `hall.html`; на главной — `HOME_FEEDS.hatched` |
| **Подвал** | `.footer` | Футер |

### Навигация (все страницы)

| Состояние | Что в `#nav-auth-slot` |
|-----------|--------------------------|
| Наблюдатель | «Яйца» + кнопка «Погреться» |
| Авторизован, профиль неполный | «Дописать профиль» |
| Авторизован | Аватар + `@username` + dropdown |

Dropdown: Профиль · Мои яйца · Снести яйцо · Активность · Зал славы · Инвесторам · Настройки · Выйти

Глобальные ссылки: Камера · Зал славы · Концепция · Яйца · 🔔 уведомления

### `js/platform/` — платформа

| Модуль | Назначение |
|--------|------------|
| `platform-api.js` | Вехи, статусы, Q&A, тестеры, подписки, уведомления, тепло, бейджи, invest_interest |
| `egg-sections.js` | UI-секции на `egg.html`: вопросы, попробовать, тепло |
| `hatch-animation.js` | Ритуал вылупления на `edit-egg.html` |
| `quests.js` | Ежедневные задания (localStorage + тепло) |

---

## 4. JavaScript-модули

### `firebase.config.js`

Глобальный конфиг Firebase (`window.FIREBASE_CONFIG`). Подключается **до** ES-модулей на каждой странице с Firebase.

### `js/firebase-app.js` — ядро бэкенда

| Экспорт | Назначение |
|---------|------------|
| `app`, `auth`, `db` | Инициализация Firebase |
| `getUserProfile(uid)` | Профиль по uid |
| `getUserByUsername(username)` | Профиль по @username (через `usernames/`) |
| `createUserProfile(uid, data)` | Создание профиля + резерв username (только после verify) |
| `savePendingProfile` / `finalizePendingProfile` / `fetchPendingProfile` | Данные регистрации: localStorage + `pending_profiles/{uid}` → профиль после verify |
| `deleteUserAccount(user)` | Удаление аккаунта: яйца, follows, notifications, badges, `users`, `usernames`, Auth |
| `updateUserProfile(uid, data, currentUsername)` | Обновление, смена username |
| `uploadAvatar(uid, blob)` | Blob → data URL (в Firestore, не Storage) |
| `createEgg(uid, profile, data, imageBlob)` | Новое яйцо в ленте + запись в `egg_updates` |
| `updateEgg(eggId, uid, data, imageBlob)` | Редактирование яйца владельцем + `egg_updates` |
| `deleteEgg(eggId, uid)` | Удаление яйца владельцем |
| `fetchPublishedEggs(max)` | Все опубликованные яйца |
| `fetchUserEggs(uid)` | Яйца одного автора |
| `waitForAuth()` | Promise с текущим пользователем |

### `js/core/confirm-modal.js`

| Экспорт | Назначение |
|---------|------------|
| `showConfirmModal(options)` | Модальное «Вы точно…?» — удаление яйца, удаление аккаунта; Escape / фон / «Отмена» |

Используется в `egg-detail.js`, `edit-egg.js`, `public-profile.js`, `settings.js`.

### `js/utils.js` — утилиты

| Функция | Назначение |
|---------|------------|
| `normalizeUsername()` | lowercase + trim |
| `validateUsername(username, label?)` | 3–20 символов, `a-z0-9_`, запрещённые имена; `label` — слово в ошибках («Тег» / «Юзернейм») |
| `statusLabel(status)` | `greetsya` → «греется», `tsyplenok` → «цыплёнок», `kuritsa` → «курица» |
| `escapeHtml()` | Защита от XSS в шаблонах |
| `getQueryParam(name)` | Чтение `?u=`, `?id=` и др. |
| `formatDate(timestamp)` | Дата для комментариев и истории |
| `viewsLabel(count)` | «N просмотр / просмотра / просмотров» |
| `validateDisplayName()` | Имя при регистрации (любые символы) |
| `resizeImageFile(file, maxSize)` | Сжатие в webp через canvas |
| `blobToDataUrl()` / `blobToSizedDataUrl()` | Картинка → строка для Firestore |
| `showMessage(el, text, type)` | Сообщения форм (info/success/error) |

### `js/nav.js`

| Функция | Назначение |
|---------|------------|
| `initNav()` | Рендер `#nav-auth-slot`; ссылки: Камера, **Зал славы** (`hall.html`), **Концепция** (`legend.html`) |

### `js/eggs.js` — карточки яиц

| Экспорт | Назначение |
|---------|------------|
| `renderEggCard(egg)` | HTML карточки (ссылки на `egg.html`, кнопка «Редактировать» если `editable`) |
| `renderEggs(container, eggs)` | Вставка в DOM + `initEggTilt` |
| `mapFirestoreEgg(data)` | Документ Firestore → формат карточки |

### `js/egg/egg-api.js` — API страницы яйца

| Экспорт | Назначение |
|---------|------------|
| `getEggById(eggId)` | Чтение яйца |
| `recordEggView(eggId, user, profile)` | Уникальный просмотр (+1) |
| `fetchEggComments` / `addEggComment` | Комментарии и ответы (`replyToUsername`) |
| `fetchEggCommentReactions` / `setCommentVote` | Лайки и дизлайки |
| `fetchEggUpdates` | История обновлений |

### `js/egg/egg-detail.js` — UI страницы яйца

Рендер hero, истории, плоского списка комментариев с @-ответами и голосованием.

### `js/lay-egg/warming-animation.js`

| Экспорт | Назначение |
|---------|------------|
| `startLayEggWarming(imageUrl)` | Оверлей прогрева, `--warm` 0→1, возвращает `{ complete, cancel }` |

Подробнее: [eggs/README.md](eggs/README.md), [eggs/LAY_EGG.md](eggs/LAY_EGG.md)

### `js/presence.js`

Счётчик «тут щас **N**» в pill «Инкубатор». Пишет timestamp в `presence/{sessionId}`, слушает всю ветку `presence`, считает активных за 45 с.

### `js/profile/public-profile.js` — публичный профиль

| Экспорт | Назначение |
|---------|------------|
| `loadPublicProfile(username, elements)` | Загрузка профиля и яиц по `@username` |
| `renderProfileHeader(profile, elements)` | Аватар, имя, bio |
| `loadProfileFollowerCount(uid, el)` | Счётчик подписчиков в шапке |
| `renderOwnerActions(profile, actionsEl, user, options)` | «Снести яйцо», «Настройки» — только владельцу; подписка + `onFollowChange` |
| `loadProfileEggs(...)` | Яйца автора; `editable: true` для владельца |
| `emptyEggsMessage(isOwner)` | Текст пустого списка яиц |

Подробнее: [blocks/public-profile.md](blocks/public-profile.md)

### `js/pages/*.js` — логика страниц

| Файл | Страница | Основной поток |
|------|----------|----------------|
| `home.js` | `index.html` | `fetchIncubatingEggs`, `fetchChicks`; `fetchHotEggs` / `fetchRecentlyHatched` — только если `HOME_FEEDS` |
| `hall.js` | `hall.html` | Лидерборды, горячая камера, недавно вылупились; `HALL_COPY`, карточки людей |
| `auth.js` | `auth.html` | Вход, регистрация, сброс пароля по email |
| `settings.js` | `settings.html` | Профиль, аватар (data URL), сброс пароля, **удаление аккаунта** (модальное подтверждение) |
| `profile.js` | `profile.html` | Публичный профиль по `?u=`, яйца автора |
| `lay-egg.js` | `lay-egg.html` | Создание яйца, +1 тепла и бейдж «Снес своё», анимация прогрева → `egg.html?id=` |
| `edit-egg.js` | `edit-egg.html` | Редактирование яйца → `updateEgg` → страница яйца |
| `egg.js` | `egg.html` | Загрузка яйца, просмотр, комментарии, история |

### `effects.js`

| Глобал | Назначение |
|--------|------------|
| `window.initEggTilt(root)` | 3D-наклон карточек `[data-tilt]` при наведении |

### `analytics.js` + `analytics.config.js`

Яндекс.Метрика: счётчик `109729158`, клики по `data-track`, цели по яйцам.

### Устаревшие (не подключать на новых страницах)

| Файл | Примечание |
|------|------------|
| `presence.config.js` | Дубликат `firebase.config.js` |
| `presence.js` (корень) | Старая копия; актуальная: `js/presence.js` |

---

## 5. Firebase: коллекции и правила

### Firestore

#### `users/{uid}`

```js
{
  uid, displayName, username, bio,
  avatarUrl,  // null или "data:image/webp;base64,..."
  heat,       // личное тепло (начисляется клиентом, +1…+10 за запрос — rules)
  createdAt, updatedAt
}
```

#### `pending_profiles/{uid}`

Данные регистрации до подтверждения email. Read/write — только свой uid. После verify → `finalizePendingProfile()` создаёт `users` и `usernames`.

```js
{ displayName, username, bio, createdAt }
```

#### `usernames/{username}`

Индекс уникальности. Document id = username.

```js
{ uid, createdAt }
```

#### `eggs/{eggId}`

```js
{
  ownerId, ownerUsername,
  title, description, link,
  imageUrl,   // null, placeholder или data URL
  status,     // greetsya | tsyplenok | kuritsa
  published,  // true = в ленте
  viewCount,  // уникальные просмотры зарегистрированных
  createdAt, updatedAt
}
```

Коллекции яйца — см. [docs/eggs/DATA_MODEL.md](eggs/DATA_MODEL.md):

| Коллекция | Назначение |
|-----------|------------|
| `egg_views` | Уникальные просмотры (1 на пользователя) |
| `egg_comments` | Комментарии и ответы (`replyToUsername`) |
| `egg_comment_reactions` | Лайки / дизлайки на комментарии |
| `egg_updates` | История: создание, редактирование, вехи, вылупление |
| `egg_milestones` | Вехи яйца |
| `egg_questions` | Q&A (отдельно от комментариев) |
| `egg_testers` | Заявки и отзывы тестеров |
| `follows` | Подписки на пользователей |
| `notifications` | Уведомления |
| `invest_interest` | Интерес инвестора без денег |
| `heat_events` | События начисления тепла |
| `user_badges` | Бейджи пользователей |

Поля `eggs`: `tags[]` (список в `EGG_TAGS` в `platform-api.js`), `seeking[]` (`team`, `testers`, `feedback`, `invest` — подписи в `SEEKING_OPTIONS`), `heat`, `demoUrl`, `hatchedAt`

### Правила

- `firebase/firestore.rules` — все коллекции выше; анти-накрутка тепла, whitelist полей яйца, verify email
- `firebase/storage.rules` — на будущее (сейчас Storage не используется)
- Подробная таблица: [platform/SECURITY.md](platform/SECURITY.md), [firebase/README.md](../firebase/README.md)

Деплой правил (после `firebase login`):

```powershell
.\scripts\deploy_firebase.ps1
```

На Windows, если `firebase` не в PATH:

```powershell
$env:Path = "C:\Program Files\nodejs;$env:APPDATA\npm;" + $env:Path
firebase.cmd deploy --only firestore:rules --project temki-1409
```

Скрипт `scripts/deploy_firebase.ps1` сам добавляет пути к Node и npm.

### Realtime Database

```
presence/{sessionId} = timestamp (number)
```

Правила: read `presence`, write только своя сессия.

---

## 6. Картинки (без Storage)

Firebase Storage требует Blaze. Вместо него:

1. Пользователь выбирает файл
2. `resizeImageFile()` — webp, аватар 400px, обложка 640px
3. `blobToSizedDataUrl()` — проверка размера (лимит документа Firestore 1 MB)
4. Строка сохраняется в `avatarUrl` / `imageUrl`
5. `<img src="data:image/webp;base64,...">` — работает на GitHub Pages

| Тип | Макс. строка | Поле |
|-----|--------------|------|
| Аватар | ~280 KB | `users.avatarUrl` |
| Обложка яйца | ~450 KB | `eggs.imageUrl` |

Плейсхолдер обложки: `assets/images/egg-placeholder.svg`.

---

## 7. CSS и UI-блоки

Файл: `style.css`

| Секция | Классы | Назначение |
|--------|--------|------------|
| Переменные | `:root` | Цвета, радиусы, тени |
| Фон | `.scene`, `.scene__*` | Анимированный фон |
| Nav | `.nav`, `.nav__brand`, `.nav__actions`, `.nav__user`, `.nav__dropdown` | Шапка и меню пользователя |
| Онлайн | `.online-counter__*` | Текст и точка в pill; на мобиле текст **виден** (компактный размер) |
| Модалки | `.confirm-modal__*` | Подтверждение удаления яйца / аккаунта |
| Настройки | `.settings-danger__*` | Блок «Опасная зона», удаление аккаунта |
| Hero | `.hero`, `.hero__*` | Главный экран |
| Кнопки | `.btn`, `.btn--primary`, `.btn--warm` | CTA |
| Яйца | `.egg`, `.egg__*`, `.egg__actions`, `.egg__edit` | Карточки стартапов |
| Страница яйца | `.egg-page__*` | Hero, комментарии, голоса |
| Прогрев яйца | `.lay-egg-warming__*` | Оверлей после «Снести яйцо» |
| Формы | `.form`, `.auth-tabs`, `.form-message` | Auth, settings, lay-egg, edit-egg |
| Профиль | `.profile-header`, `.profile-eggs` | Страница профиля |
| Страницы | `.page`, `.page--narrow` | Общий layout внутренних страниц |

Бренд и термины: **[meta/CONCEPT.md](../meta/CONCEPT.md)**  
План профилей (исторический): **`PROFILE_PLAN.md`**

---

## 8. Аналитика (Яндекс.Метрика)

| Файл | Назначение |
|------|------------|
| `analytics.config.js` | `window.ANALYTICS_COUNTER_ID = 109729158` |
| `analytics.js` | Инициализация, `trackLinks`, цели |

Цели по кликам: атрибут `data-track` на ссылках (если задан в карточке).

---

## 9. Счётчик онлайн (Realtime Database)

- Текст: **«тут щас N»** (люди в инкубаторе, не «яйца»)
- Расположение: только в oval `.nav__brand` рядом с «Инкубатор»
- Элементы: `#online-text`, `#online-heat`
- Heartbeat: каждые 20 с, активность 45 с
- На экранах ≤768px счётчик остаётся в nav (не скрывается)

---

## 10. Локальная разработка

```powershell
cd "d:\cursor project vpn\site"
python -m http.server 5500
```

Открыть: http://localhost:5500

> Порт **8080** — другой проект, не использовать.

Проверка Firebase API:

```powershell
python scripts/check_firebase.py
```

---

## 11. Деплой на GitHub Pages

```powershell
git add .
git commit -m "..."
git push origin main
```

Или скрипт с `gh` (если Pages ещё не включены): `.\deploy.ps1`

Сайт: https://owl-14.github.io/Temki/

После пуша убедись, что в Firebase Auth → Settings есть домен `owl-14.github.io`.

---

## 12. Чеклист «всё работает»

- [ ] http://localhost:5500 — главная: **Яйца в инкубаторе**, затем **Цыплята** (без горячей камеры на главной)
- [ ] `/hall.html` — зал славы: люди (карточки), яйца, горячая камера, недавно вылупились; текст на русском, не `???`
- [ ] Nav: **Зал славы**, **Концепция** (`legend.html`); регистрация — поле **Тег**
- [ ] Счётчик «тут щас N» появляется в nav (десктоп и мобила)
- [ ] `/auth.html` — регистрация → verify → профиль создаётся; до verify нет тепла/комментариев; «Отправить ещё раз» — cooldown 60 с (120 с при rate limit)
- [ ] После изменения `firestore.rules` — деплой правил (`email_verified`, whitelist яиц, лимиты heat)
- [ ] `/settings.html` — имя, username, аватар сохраняются; **удаление аккаунта** — модалка → полное удаление данных
- [ ] `/profile.html?u=USERNAME` — профиль, яйца, счётчик подписчиков; на своём — «Редактировать»
- [ ] `/lay-egg.html` — анимация прогрева, +1 личного тепла, бейдж «Снес своё», яйцо на главной и в профиле
- [ ] Удаление яйца из профиля / edit-egg / страницы яйца — **модальное подтверждение**
- [ ] `/egg.html?id=...` — страница яйца, просмотры, комментарии
- [ ] Подписка на профиле → счётчик +1, `/activity.html` — список подписок и обновления яиц
- [ ] Комментарий под чужим яйцом → +2 тепла; после 5 таких — бейдж «Голос инкубатора»
- [ ] `/edit-egg.html?id=...` — сохранение названия и описания; ссылка «Правила вылупления» → `hatch-rules.html`
- [ ] https://owl-14.github.io/Temki/ — то же после деплоя

### Типичные ошибки

| Симптом | Решение |
|---------|---------|
| `permission-denied` в Firestore | Опубликовать `firebase/firestore.rules` |
| Auth не пускает | Включить Email/Password, добавить домен |
| «Фото слишком большое» | Другое фото или меньшее разрешение |
| Счётчик не виден | Проверить `databaseURL` в `firebase.config.js` |
| На `hall.html` вместо русского — `???` | Кириллица в `hall.html` повреждена — править только `HALL_COPY` в `hall.js`, HTML держать ASCII-only; см. [RELIABILITY.md](RELIABILITY.md) |

---

## Связанные файлы в репозитории

```
site/
├── index.html, auth.html, profile.html, settings.html
├── lay-egg.html, egg.html, edit-egg.html
├── index.html          (редирект → pages/)
├── pages/              (все HTML)
├── assets/
│   ├── css/style.css
│   ├── js/core|eggs|platform|profile|lay-egg|pages
│   ├── images/
│   └── vendor/         (effects.js, analytics)
├── config/             (firebase.config.js)
├── firebase/           (firestore.rules, indexes)
├── scripts/            (deploy_firebase.ps1)
├── docs/
├── meta/               (CONCEPT.md, PROFILE_PLAN.md)
└── README.md           (карта проекта)
```
