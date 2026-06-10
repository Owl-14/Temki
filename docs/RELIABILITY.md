# Надёжность загрузки — инструкция для разработки

Чеклист и правила, чтобы лента, профили и Firebase **не падали** и **не показывали пустоту** из‑за багов.

Читай этот файл перед любыми правками: `firebase-app.js`, `home.js`, `profile.js`, `public-profile.js`, `presence.js`, Firestore-запросов, auth.

---

## 1. Firebase — один App на всю страницу

**Проблема:** `presence.js` и `firebase-app.js` грузятся параллельно. Двойной `initializeApp()` → `duplicate-app` → лента/профиль не грузятся **иногда**.

**Правило:** инициализация только так:

```js
import { initializeApp, getApps } from 'firebase/app';
var app = getApps().length ? getApps()[0] : initializeApp(config);
```

- `firebase-app.js` — единственное место инициализации для Firestore/Auth
- `presence.js` — только `getApps()[0]`, **никогда** второй `initializeApp` без проверки

**Порядок скриптов в HTML:**

```html
<script src="../config/firebase.config.js?v=N"></script>
<script type="module" src="../assets/js/core/presence.js"></script>
<script type="module" src="../assets/js/pages/home.js"></script>
```

`firebase.config.js` **всегда до** ES-модулей.

---

## 2. API-ключ — без опечаток

**Проблема:** `F04g` (ноль) вместо `FO4g` (буква O) → `auth/api-key-not-valid`.

**Правило:**

- Копировать `firebaseConfig` только из [Firebase → Project settings](https://console.firebase.google.com/project/temki-1409/settings/general)
- Обновлять **оба**: `firebase.config.js` и `presence.config.js` (если ещё используется)
- После смены ключа — bump `?v=N` на `firebase.config.js` во всех HTML

---

## 3. Firestore — запросы для гостей (без входа)

**Проблема:** гость не может читать `eggs where ownerId == uid` без `published == true` → «Профиль не найден» / «Не удалось загрузить яйца».

**Правило безопасности запросов:**

| Кто | Что можно запросить |
|-----|---------------------|
| Гость | `eggs` с `where('published', '==', true)` |
| Гость | `users/{uid}`, `usernames/{name}` — read: true |
| Владелец | свои яйца включая черновики (если появятся) |

**Паттерн `fetchUserEggs(uid)`:**

1. Прямой запрос: `ownerId == uid` **и** `published == true`
2. При ошибке (нет индекса / сеть) — fallback: `fetchPublishedEggs` + filter по `ownerId`
3. **3 повтора** с паузой 400 ms

**Индекс:** `firebase/firestore.indexes.json` — поля `ownerId` + `published`. Деплой:

```powershell
firebase deploy --only firestore:indexes --project temki-1409
```

---

## 4. Ошибки ≠ пустая лента

**Проблема:** `catch` показывал «Пока пусто» при сбое сети — яйца «пропадали».

**Правило:**

| Ситуация | Показывать |
|----------|------------|
| Загрузка | «Загружаем яйца...» |
| Успех, 0 яиц | «Пока пусто — снеси первое яйцо» |
| Ошибка сети/Firebase | «Не удалось загрузить» + кнопка **Повторить** |
| Профиль не найден | Только если `getUserByUsername` вернул `null` |

Никогда не вызывать `showEmptyFeed()` в `catch`.

---

## 5. Гонки Auth и повторные загрузки

**Проблема:** `onAuthStateChanged` срабатывает несколько раз → параллельные запросы → последний ответ с ошибкой затирает успех.

**Правило для `profile.js`:**

```js
var profileTask = Promise.resolve();
onAuthStateChanged(auth, function (user) {
  profileTask = profileTask.then(function () {
    return renderProfile(user);
  });
});
```

**Правило для `home.js`:** флаг `loading` — не запускать второй `loadFeed` пока первый не завершён.

---

## 6. CSS и `hidden`

**Проблема:** `.form { display: flex }` перебивает HTML-атрибут `hidden` → на auth видны обе формы.

**Правило:** всегда держать в `style.css`:

```css
.form[hidden] {
  display: none !important;
}
```

Табы auth переключают `panel.hidden`, не только классы.

---

## 7. Кэш браузера

**Проблема:** после деплоя старый JS — «Перейти в Telegram» вместо «Ссылка».

**Правило:**

- Bump `?v=N` на **entry**-скриптах в HTML: `home.js`, `profile.js`, `auth.js`, `firebase.config.js`, `style.css`
- Не полагаться на `?v=` в `import '../eggs.js?v=3'` — не везде работает; меняй версию **родительского** модуля в HTML

---

## 8. Картинки — Firestore, не Storage

Storage требует Blaze. Аватары и обложки — **data URL** в `avatarUrl` / `imageUrl`.

- Сжатие: `resizeImageFile` → webp
- Лимиты: `MAX_AVATAR_DATA_URL_BYTES`, `MAX_EGG_DATA_URL_BYTES`
- Документ Firestore max 1 MB

---

## 9. Публичный профиль

Документация блока: [blocks/public-profile.md](blocks/public-profile.md)

**Правило:**

- URL: `profile.html?u=username`
- Гость видит: аватар, имя, bio, опубликованные яйца
- Кнопки редактирования — **только** если `auth.uid === profile.uid`
- На странице профиля не показывать `@username` на карточках своих яиц (избыточно)
- Пустой список: гость — «Тут пока нет яиц», владелец — «снеси своё»

---

## 10. Чеклист перед пушем

Проверить **без входа** (инкогнито):

- [ ] Главная — яйца грузятся, после 5× F5 не пропадают
- [ ] Клик `@username` → профиль с яйцами, не «не найден»
- [ ] Auth — одна форма (вход / регистрация)
- [ ] Кнопка ссылки — «Ссылка»

Проверить **под аккаунтом**:

- [ ] Свой профиль — кнопки «Снести яйцо», «Настройки»
- [ ] Чужой профиль — без кнопок редактирования
- [ ] Settings — только свой профиль

Консоль F12 — нет `duplicate-app`, `permission-denied`, `api-key-not-valid`.

---

## 11. Файлы — кто за что отвечает

| Файл | Не ломать |
|------|-----------|
| `assets/js/core/firebase-app.js` | init app, все Firestore-запросы, retry |
| `assets/js/pages/home.js` | лента, loading, retry |
| `assets/js/profile/public-profile.js` | публичный профиль, яйца |
| `assets/js/pages/profile.js` | очередь auth-загрузок |
| `assets/js/core/presence.js` | только `getApps()[0]` |
| `firebase/firestore.rules` | read users всем, eggs — published |
| `firebase/firestore.indexes.json` | индекс ownerId+published |

---

## 12. Диагностика

```powershell
python scripts/check_firebase.py
```

| Ошибка | Действие |
|--------|----------|
| `duplicate-app` | П.1 — getApps |
| `permission-denied` на eggs | П.3 — добавить `published == true` |
| `failed-precondition` | Задеплоить индексы |
| `api-key-not-valid` | П.2 — сверить ключ |
| Пусто после F5 | П.4, П.5 — retry и loading guard |
