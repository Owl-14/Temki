# План: система профилей «Инкубатор»

Инструкция для реализации. Перед началом работы читай вместе с `CONCEPT.md`.

---

## Цель

Пользователь может:
1. **Зарегистрироваться / войти**
2. Иметь **профиль**: имя, username, аватар, «о себе»
3. **Снести яйцо** — добавить свой стартап в инкубатор
4. Смотреть **публичный профиль** по `@username`
5. Видеть **свои яйца** в профиле

---

## Ограничения и выбор стека

| Факт | Решение |
|------|---------|
| Сайт на **GitHub Pages** (статика) | Бэкенд = **Firebase** (уже подключён) |
| Уже есть Firebase project `temki-1409` | Расширяем, не заводим новый |
| Сейчас: Realtime DB для presence | Добавляем **Auth + Firestore + Storage** |
| Нет сервера для SSR | SPA-подход: отдельные HTML-страницы + JS-модули |

**Почему не свой бэкенд:** GitHub Pages не запускает Node/Python. Firebase закрывает auth, БД, файлы аватарок без сервера.

**Почему Firestore, а не RTDB для профилей:** удобнее структурированные документы, запросы по username, правила безопасности.

---

## Архитектура (высокий уровень)

```
┌─────────────────────────────────────────────────────────┐
│  GitHub Pages (статика)                                 │
│  index.html · profile.html · auth.html · lay-egg.html   │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│  Firebase                                               │
│  ├── Authentication (email + Google опционально)        │
│  ├── Firestore (users, eggs, usernames)                 │
│  ├── Storage (avatars/{uid}.webp)                       │
│  └── Realtime DB (presence — как сейчас)                │
└─────────────────────────────────────────────────────────┘
```

---

## Модель данных (Firestore)

### Коллекция `users/{uid}`

```js
{
  uid: string,              // = document id
  displayName: string,      // «Иван Петров»
  username: string,         // «ivan_p» lowercase, уникальный
  bio: string,              // до 280 символов
  avatarUrl: string | null, // URL из Storage
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Коллекция `usernames/{username}` (индекс уникальности)

```js
{
  uid: string,
  createdAt: timestamp
}
```

Документ id = сам username. При регистрации — транзакция: создать `users/{uid}` + занять `usernames/{username}`.

### Коллекция `eggs/{eggId}`

```js
{
  id: string,
  ownerId: string,          // uid автора
  ownerUsername: string,    // денормализация для карточек
  title: string,            // название яйца
  description: string,
  imageUrl: string | null,  // картинка яйца (Storage)
  link: string | null,      // Telegram / сайт
  status: 'greetetsya' | 'tsyplenok' | 'kuritsa',  // греется / цыплёнок / курица
  createdAt: timestamp,
  updatedAt: timestamp,
  published: boolean        // false = черновик, true = в ленте
}
```

### Связь пользователь ↔ яйца

Запрос: `eggs` where `ownerId == uid` and `published == true`

Главная страница: `eggs` where `published == true` orderBy `createdAt` desc  
+ **legacy-яйца** (Падел, Cloacc, Bazis) пока хардкод в `index.html` или мигрировать в Firestore вручную.

---

## Firebase Storage

```
avatars/{uid}.webp          — аватар пользователя (max 2 MB)
eggs/{eggId}/cover.webp     — обложка яйца (max 5 MB)
```

Клиент сжимает изображение перед загрузкой (canvas → webp, ~400px для аватара).

---

## Страницы сайта

| Файл | URL | Назначение |
|------|-----|------------|
| `index.html` | `/` | Главная + лента яиц (как сейчас + динамические) |
| `auth.html` | `/auth.html` | Вход / регистрация |
| `profile.html` | `/profile.html?u=username` | Публичный профиль |
| `settings.html` | `/settings.html` | Редактирование своего профиля (только свой) |
| `lay-egg.html` | `/lay-egg.html` | Форма «снести яйцо» (только авторизован) |

### Навигация (обновить шапку)

Не авторизован:
- `Инкубатор` · `Яйца` · **Войти**

Авторизован:
- `Инкубатор` · `Яйца` · аватар + **@username** (dropdown: профиль, снести яйцо, настройки, выйти)

---

## Пользовательские сценарии

### 1. Регистрация

1. `auth.html` → email + пароль (мин. 8 символов)
2. Шаг 2 onboarding (можно на `settings.html`):
   - displayName (обязательно)
   - username (обязательно, проверка уникальности)
   - bio (опционально)
   - аватар (опционально)
3. Редирект на `/profile.html?u={username}`

**Альтернатива позже:** Google Sign-In (одна кнопка в `auth.html`).

### 2. Профиль (публичный)

- Аватар (или заглушка — силуэт яйца)
- displayName
- @username
- bio
- Сетка **яиц пользователя** (карточки как на главной)
- Кнопка «Снести яйцо» — только если смотришь свой профиль

### 3. Настройки профиля

- Редактировать: имя, username (с пересозданием `usernames/`), bio, аватар
- Смена пароля через Firebase `sendPasswordResetEmail`
- Удаление аккаунта — **фаза 2**

### 4. Снести яйцо

Форма `lay-egg.html`:
- Название (обязательно)
- Описание (обязательно)
- Ссылка (опционально)
- Картинка (опционально, иначе дефолтная яйцевидная заглушка)
- Статус по умолчанию: `greetetsya` (бейдж «греется»)

После submit → яйцо в Firestore → редирект в профиль.

---

## Структура файлов (план)

```
site/
├── index.html
├── auth.html
├── profile.html
├── settings.html
├── lay-egg.html
├── style.css              — общие стили
├── auth.css               — опционально, страницы форм
├── js/
│   ├── firebase.js        — init app, auth, firestore, storage
│   ├── auth.js            — login, register, logout
│   ├── profile.js         — загрузка/рендер профиля
│   ├── settings.js        — сохранение профиля, аватар
│   ├── lay-egg.js         — создание яйца
│   ├── eggs.js            — рендер карточек яиц (общий модуль)
│   ├── nav-auth.js        — состояние шапки (вошёл/нет)
│   ├── presence.js        — как сейчас
│   └── utils.js           — username validate, image resize
├── presence.config.js
└── images/
    └── default-avatar.png — заглушка
```

---

## Правила безопасности Firebase

### Firestore Rules (черновик)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{uid} {
      allow read: if true;
      allow create: if request.auth != null && request.auth.uid == uid;
      allow update: if request.auth != null && request.auth.uid == uid;
      allow delete: if false;
    }

    match /usernames/{username} {
      allow read: if true;
      allow create: if request.auth != null
        && request.resource.data.uid == request.auth.uid;
      allow update, delete: if false;
    }

    match /eggs/{eggId} {
      allow read: if resource.data.published == true
        || (request.auth != null && resource.data.ownerId == request.auth.uid);
      allow create: if request.auth != null
        && request.resource.data.ownerId == request.auth.uid;
      allow update, delete: if request.auth != null
        && resource.data.ownerId == request.auth.uid;
    }
  }
}
```

### Storage Rules (черновик)

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /avatars/{fileName} {
      allow read: if true;
      allow write: if request.auth != null
        && fileName == request.auth.uid + '.webp'
        && request.resource.size < 2 * 1024 * 1024
        && request.resource.contentType.matches('image/.*');
    }
    match /eggs/{eggId}/{fileName} {
      allow read: if true;
      allow write: if request.auth != null
        && request.resource.size < 5 * 1024 * 1024;
    }
  }
}
```

---

## Валидация username

- 3–20 символов
- Только `a-z`, `0-9`, `_`
- Lowercase при сохранении
- Зарезервированные: `admin`, `inkubator`, `incubator`, `api`, `auth`, `settings`, `profile`, `lay-egg`, `eggs`
- Проверка занятости: документ `usernames/{username}` exists?

---

## UI / дизайн

Сверяться с `CONCEPT.md`:
- Тёмный digital-минимализм, тёплые акценты
- Формы: стеклянные карточки, те же кнопки `.btn--primary`, `.btn--warm`
- Профиль: аватар круглый (или яйцевидный — опционально, обсудить)
- Пустой профиль без яиц: «Яиц пока нет — снеси первое»
- Кнопка «Снести яйцо» — главный CTA в профиле и в hero для авторизованных

### Тексты (бренд)

| Действие | Текст |
|----------|-------|
| Регистрация | «Войти в инкубатор» |
| Создать яйцо | «Снести яйцо» |
| Пустой профиль | «Тут пока пусто — снеси своё» |
| Сохранить профиль | «Сохранить» |
| Статус нового яйца | бейдж `греется` |

---

## Этапы реализации (порядок работ)

### Фаза 0 — Подготовка Firebase (ручная, ~30 мин)
- [ ] Включить **Authentication** → Email/Password
- [ ] Создать **Firestore Database** (europe-west1)
- [ ] Включить **Storage**
- [ ] Применить Security Rules (Firestore + Storage)
- [ ] Добавить домены в Authorized domains: `owl-14.github.io`, `localhost`

### Фаза 1 — Auth + базовый профиль
- [ ] `js/firebase.js` — единая инициализация
- [ ] `auth.html` + `js/auth.js` — регистрация, вход, выход
- [ ] `js/nav-auth.js` — шапка реагирует на auth state
- [ ] `settings.html` + `js/settings.js` — имя, username, bio
- [ ] Firestore: создание `users/` + `usernames/` при регистрации

### Фаза 2 — Аватар
- [ ] Загрузка в Storage `avatars/{uid}.webp`
- [ ] `js/utils.js` — resize изображения на клиенте
- [ ] Превью + заглушка если нет аватара
- [ ] Показ аватара в шапке и профиле

### Фаза 3 — Публичный профиль
- [ ] `profile.html` + `js/profile.js`
- [ ] URL: `?u=username`
- [ ] 404-состояние: «Такого наседки нет» (шутливо) / «Пользователь не найден»
- [ ] Сетка яиц пользователя (пока пустая)

### Фаза 4 — Снести яйцо
- [ ] `lay-egg.html` + `js/lay-egg.js`
- [ ] CRUD яйца в Firestore
- [ ] Загрузка обложки в Storage (опционально)
- [ ] Карточки яиц в профиле

### Фаза 5 — Лента на главной
- [ ] `js/eggs.js` — общий рендер карточек
- [ ] `index.html` — подгружать яйца из Firestore + legacy-хардкод
- [ ] Сортировка: новые сверху

### Фаза 6 — Полировка
- [ ] Google Sign-In (опционально)
- [ ] Редактирование / удаление своего яйца
- [ ] Смена статуса яйца (греется → цыплёнок → курица) — только владелец или админ
- [ ] Миграция Падел / Cloacc / Bazis в Firestore как «системные» яйца

---

## Что НЕ делаем в первой версии (v1)

- Комментарии, лайки, подписки
- Модерация яиц (все `published: true` сразу)
- Уведомления
- Чат
- Мобильное приложение
- Отдельный бэкенд / API

---

## Риски и как закрыть

| Риск | Решение |
|------|---------|
| Username занят | Транзакция Firestore + проверка перед сохранением |
| Спам-регистрации | Firebase App Check (фаза 2), rate limit по правилам |
| Большие аватары | Resize на клиенте + лимит 2 MB в Storage rules |
| GitHub Pages нет rewrite для `/u/ivan` | Используем `profile.html?u=ivan` (query param) |
| API keys в коде | Firebase keys публичные по дизайну; защита = Rules |

---

## Чеклист перед началом кодинга

- [ ] Прочитать `CONCEPT.md`
- [ ] Прочитать этот файл
- [ ] Пользователь включил Auth / Firestore / Storage в Firebase Console
- [ ] Согласовать: email-only или сразу Google?
- [ ] Согласовать: аватар круглый или яйцевидный?

---

## Ссылки для реализации

- [Firebase Auth Web](https://firebase.google.com/docs/auth/web/start)
- [Firestore Get Started](https://firebase.google.com/docs/firestore/quickstart)
- [Storage Web Upload](https://firebase.google.com/docs/storage/web/upload-files)
- Существующий конфиг: `presence.config.js` → переименовать/объединить в `firebase.config.js`

---

*Документ создан для поэтапной реализации. Не пушить на GitHub до явного запроса пользователя.*
