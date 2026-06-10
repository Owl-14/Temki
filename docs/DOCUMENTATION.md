# Документация «Инкубатор»

Полный справочник: что за что отвечает, как связаны части проекта, как запускать и деплоить.

**Репозиторий:** https://github.com/Owl-14/Temki  
**Продакшен:** https://owl-14.github.io/Temki/  
**Firebase-проект:** `temki-1409`

---

## Содержание

**Оглавление всей документации:** [docs/README.md](README.md)

0. **[Надёжность загрузки (обязательно)](RELIABILITY.md)** — правила, чтобы лента и профили не падали
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
| **Домены** `localhost`, `owl-14.github.io` | Добавить вручную | [Auth settings](https://console.firebase.google.com/project/temki-1409/authentication/settings) |
| **Realtime Database** (онлайн) | ✅ Работает | [Realtime Database](https://console.firebase.google.com/project/temki-1409/database) |
| **Storage** | ❌ Не используем | Картинки в Firestore (data URL) |
| **Правила Firestore** | Вставить из репо | `firebase/firestore.rules` → [Rules](https://console.firebase.google.com/project/temki-1409/firestore/rules) |

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

| Слой | Файлы | Роль |
|------|-------|------|
| **HTML** | `*.html` | Разметка страниц, подключение скриптов |
| **Стили** | `style.css` | Визуал, анимации, формы, профиль |
| **Эффекты** | `effects.js` | Наклон карточек яиц (`data-tilt`) |
| **Логика** | `js/**/*.js` | Auth, профили, яйца, навигация |
| **Конфиг** | `firebase.config.js`, `analytics.config.js` | Ключи Firebase и Метрики |
| **Бэкенд** | Firebase (облако) | Без своего сервера |

---

## 3. Страницы сайта

| Файл | URL | Назначение | Скрипты |
|------|-----|------------|---------|
| `index.html` | `/` | Главная: hero, лента яиц, счётчик в nav | `home.js`, `presence.js`, `effects.js` |
| `auth.html` | `/auth.html` | Вход и регистрация | `auth.js`, `presence.js` |
| `profile.html` | `/profile.html?u=username` | Публичный профиль и яйца пользователя | `profile.js`, `presence.js`, `effects.js` |
| `egg.html` | `/egg.html?id={eggId}` | Страница яйца: описание, просмотры, история, комментарии | `egg.js`, `presence.js` |
| `settings.html` | `/settings.html` | Редактирование своего профиля | `settings.js`, `presence.js` |
| `lay-egg.html` | `/lay-egg.html` | Форма «Снести яйцо» | `lay-egg.js`, `presence.js` |
| `edit-egg.html` | `/edit-egg.html?id={eggId}` | Редактирование яйца (только владелец) | `edit-egg.js`, `presence.js` |

**Блок «публичный профиль»:** [docs/blocks/public-profile.md](blocks/public-profile.md)

**Яйца (просмотр, редактирование, комментарии):** [docs/eggs/README.md](eggs/README.md)

### Блоки на главной (`index.html`)

| Блок | Селектор / id | Что делает |
|------|---------------|------------|
| **Сцена** | `.scene` | Фон: сетка, яйца, орбы, тепло |
| **Навигация** | `.nav`, `#nav-auth-slot` | Логотип + счётчик онлайн + вход/профиль |
| **Hero** | `.hero`, `#home` | Заголовок, текст, CTA «Смотреть яйца» |
| **Камера яиц** | `.chamber`, `#projects` | Секция ленты стартапов |
| **Лента** | `#eggs-feed` | Карточки яиц из Firestore |
| **Подвал** | `.footer` | Футер |

### Навигация (все страницы)

| Состояние | Что в `#nav-auth-slot` |
|-----------|--------------------------|
| Гость | «Яйца» + кнопка «Войти» |
| Авторизован, профиль неполный | «Дописать профиль» |
| Авторизован | Аватар + `@username` + dropdown |

Dropdown: Профиль · Снести яйцо · Настройки · Выйти

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
| `createUserProfile(uid, data)` | Создание профиля + резерв username (транзакция) |
| `updateUserProfile(uid, data, currentUsername)` | Обновление, смена username |
| `uploadAvatar(uid, blob)` | Blob → data URL (в Firestore, не Storage) |
| `createEgg(uid, profile, data, imageBlob)` | Новое яйцо в ленте + запись в `egg_updates` |
| `updateEgg(eggId, uid, data, imageBlob)` | Редактирование яйца владельцем + `egg_updates` |
| `fetchPublishedEggs(max)` | Все опубликованные яйца |
| `fetchUserEggs(uid)` | Яйца одного автора |
| `waitForAuth()` | Promise с текущим пользователем |

### `js/utils.js` — утилиты

| Функция | Назначение |
|---------|------------|
| `normalizeUsername()` | lowercase + trim |
| `validateUsername()` | 3–20 символов, `a-z0-9_`, запрещённые имена |
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
| `initNav()` | Рендер `#nav-auth-slot` по состоянию Auth |

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

Подробнее: [eggs/README.md](eggs/README.md)

### `js/presence.js`

Счётчик «тут щас **N**» в pill «Инкубатор». Пишет timestamp в `presence/{sessionId}`, слушает всю ветку `presence`, считает активных за 45 с.

### `js/profile/public-profile.js` — публичный профиль

| Экспорт | Назначение |
|---------|------------|
| `loadPublicProfile(username, elements)` | Загрузка профиля и яиц по `@username` |
| `renderProfileHeader(profile, elements)` | Аватар, имя, bio |
| `renderOwnerActions(profile, actionsEl, user)` | «Снести яйцо», «Настройки» — только владельцу |
| `loadProfileEggs(...)` | Яйца автора; `editable: true` для владельца |
| `emptyEggsMessage(isOwner)` | Текст пустого списка яиц |

Подробнее: [blocks/public-profile.md](blocks/public-profile.md)

### `js/pages/*.js` — логика страниц

| Файл | Страница | Основной поток |
|------|----------|----------------|
| `home.js` | `index.html` | `fetchPublishedEggs` → `#eggs-feed` |
| `auth.js` | `auth.html` | Вход → профиль; регистрация → `createUserProfile` → settings |
| `settings.js` | `settings.html` | Профиль, аватар (data URL), сброс пароля |
| `profile.js` | `profile.html` | Публичный профиль по `?u=`, яйца автора |
| `lay-egg.js` | `lay-egg.html` | Создание яйца → редирект на `egg.html?id=` |
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
  createdAt, updatedAt
}
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
| `egg_updates` | История: создание, редактирование |

### Правила

- `firebase/firestore.rules` — профили, яйца, просмотры, комментарии, история
- `firebase/storage.rules` — на будущее (сейчас Storage не используется)

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

Плейсхолдер обложки: `images/egg-placeholder.svg`.

---

## 7. CSS и UI-блоки

Файл: `style.css`

| Секция | Классы | Назначение |
|--------|--------|------------|
| Переменные | `:root` | Цвета, радиусы, тени |
| Фон | `.scene`, `.scene__*` | Анимированный фон |
| Nav | `.nav`, `.nav__brand`, `.nav__actions`, `.nav__user`, `.nav__dropdown` | Шапка и меню пользователя |
| Онлайн | `.online-counter__*` | Текст и точка в pill |
| Hero | `.hero`, `.hero__*` | Главный экран |
| Кнопки | `.btn`, `.btn--primary`, `.btn--warm` | CTA |
| Яйца | `.egg`, `.egg__*`, `.egg__actions`, `.egg__edit` | Карточки стартапов |
| Страница яйца | `.egg-page__*` | Hero, комментарии, голоса |
| Формы | `.form`, `.auth-tabs`, `.form-message` | Auth, settings, lay-egg, edit-egg |
| Профиль | `.profile-header`, `.profile-eggs` | Страница профиля |
| Страницы | `.page`, `.page--narrow` | Общий layout внутренних страниц |

Бренд и термины: **`CONCEPT.md`**  
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

- [ ] http://localhost:5500 — главная, лента яиц из Firestore
- [ ] Счётчик «тут щас N» появляется в nav
- [ ] `/auth.html` — регистрация нового email
- [ ] `/settings.html` — имя, username, аватар сохраняются
- [ ] `/profile.html?u=USERNAME` — профиль и яйца; на своём — «Редактировать»
- [ ] `/lay-egg.html` — яйцо на главной и в профиле
- [ ] `/egg.html?id=...` — страница яйца, просмотры, комментарии
- [ ] `/edit-egg.html?id=...` — сохранение названия и описания
- [ ] https://owl-14.github.io/Temki/ — то же после деплоя

### Типичные ошибки

| Симптом | Решение |
|---------|---------|
| `permission-denied` в Firestore | Опубликовать `firebase/firestore.rules` |
| Auth не пускает | Включить Email/Password, добавить домен |
| «Фото слишком большое» | Другое фото или меньшее разрешение |
| Счётчик не виден | Проверить `databaseURL` в `firebase.config.js` |

---

## Связанные файлы в репозитории

```
site/
├── index.html, auth.html, profile.html, settings.html
├── lay-egg.html, egg.html, edit-egg.html
├── style.css, effects.js
├── firebase.config.js, analytics.config.js, analytics.js
├── firebase.json, .firebaserc
├── firebase/
│   ├── firestore.rules
│   ├── firestore.indexes.json
│   └── storage.rules
├── js/
│   ├── firebase-app.js, utils.js, nav.js, eggs.js, presence.js
│   ├── egg/     (egg-api.js, egg-detail.js)
│   ├── profile/ (public-profile.js)
│   └── pages/   (home, auth, settings, profile, lay-egg, egg, edit-egg)
├── images/      (egg-placeholder.svg и др.)
├── scripts/     (deploy_firebase.ps1, check_firebase.py)
├── docs/
│   ├── DOCUMENTATION.md, RELIABILITY.md
│   ├── blocks/  (public-profile.md)
│   └── eggs/    (PAGE, EDIT, COMMENTS, VIEWS, DATA_MODEL, UPDATES)
├── CONCEPT.md
└── PROFILE_PLAN.md
```
