# Вход, регистрация и сброс пароля

Страница `auth.html`, модуль `assets/js/pages/auth.js`, Firebase Authentication (Email/Password).

**Тексты писем (тема, русский текст, тон бренда):** [AUTH_EMAILS.md](AUTH_EMAILS.md) — настраиваются в Firebase Console.

## Регистрация и подтверждение email

### Поля формы «Регистрация»

| Поле | Подпись в UI | Подсказка | В Firestore / Auth |
|------|--------------|-----------|---------------------|
| Имя | Имя | любые символы — до 40 | `users.displayName` |
| Тег | **Тег** (не «Юзернейм») | латиница — от 3 до 20 | `users.username`, резерв `usernames/{tag}` |
| Email | Email | на этот адрес придёт письмо для подтверждения | Firebase Auth |
| Пароль | Пароль | минимум 8 символов | Firebase Auth |
| О себе | О себе | — | `users.bio` |

- Поле `name="username"` в HTML — техническое имя; в интерфейсе регистрации показывается **«Тег»**.
- Валидация: `validateUsername(value, label)` в `utils.js` — на регистрации второй аргумент `'Тег'` (сообщения об ошибках с этим словом).
- В **Настройках** (`settings.html`) подпись поля по-прежнему **«Юзернейм»** — тот же `username` в базе.

1. Заполни форму **Регистрация** → **Создать аккаунт**
2. Ошибки показываются **под полем** и обновляются при вводе (имя, **тег**, email, пароль)
3. Создаётся только **Firebase Auth** (логин/пароль); данные профиля сохраняются в **localStorage** + **`pending_profiles/{uid}`** до verify
4. На email — письмо с ссылкой подтверждения
5. После **emailVerified** → `finalizePendingProfile()` создаёт `users/{uid}` и резервирует `@username` из данных регистрации
6. Данные регистрации дублируются в **localStorage** и **`pending_profiles/{uid}`** (Firestore, без `email_verified`) — чтобы профиль создался даже после перехода по ссылке из письма в другой вкладке
7. Перед записью в Firestore вызывается **`getIdToken(true)`** — иначе rules могут отклонить create с `permission-denied`
8. Пока email **не подтверждён** — нет профиля, **нет тепла**, комментариев, подписок (Firestore: `email_verified` на `users` / `usernames`)

**Firestore rules:** все записи (кроме read публичных данных) требуют `request.auth.token.email_verified == true`.

Кнопки на экране подтверждения:

| Кнопка | Действие |
|--------|----------|
| **Отправить ещё раз** | `requestEmailVerification(currentUser)` — кнопка неактивна **60 сек** после отправки; при `auth/too-many-requests` — **120 сек** |
| **Я подтвердил — проверить** | `reloadAuthUser()` → если `emailVerified`, редирект в профиль |
| **Выйти** | `signOut` → форма входа |

Лента, профили и яйца **без входа** по-прежнему доступны гостям.

## Сброс пароля

1. **Вход** → «Забыл пароль?»
2. Email → **Отправить письмо**
3. Письмо от **Инкубатор** (`noreply@temki-1409.firebaseapp.com`) со ссылкой
4. Новый пароль → вход на `auth.html`

Тот же API из **Настройки** (`settings.js` → `requestPasswordReset`).

## Если письмо не приходит

| Причина | Что сделать |
|---------|-------------|
| **Спам / «Промоакции»** | Ищи письма от **Инкубатор**; verification: `Verify your email for Инкубатор`, reset: `Инкубатор — сброс пароля` |
| **Другой email** | Тот же адрес, что при регистрации — [Users](https://console.firebase.google.com/project/temki-1409/authentication/users) |
| **Шаблон не настроен** | [AUTH_EMAILS.md](AUTH_EMAILS.md) → Templates в консоли |
| **Слишком много запросов** | Подожди 15–30 мин (`auth/too-many-requests`); кнопка «Отправить ещё раз» сама блокируется на 60 сек |
| **Email/Password выключен** | [Sign-in method](https://console.firebase.google.com/project/temki-1409/authentication/providers) |
| **Домен не авторизован** | [Authorized domains](https://console.firebase.google.com/project/temki-1409/authentication/settings): `localhost`, `127.0.0.1`, `owl-14.github.io` |

## Код (`firebase-app.js`)

| Функция | Назначение |
|---------|------------|
| `requestEmailVerification(user)` | Письмо подтверждения email |
| `reloadAuthUser()` | Обновить `emailVerified` после клика по ссылке |
| `savePendingProfile` / `finalizePendingProfile` / `fetchPendingProfile` | Профиль Firestore только после verify; fallback из Firestore |
| `deleteUserAccount(user)` | Полное удаление данных и Auth-аккаунта |
| `needsEmailVerification(user)` | `true` для password-провайдера без `emailVerified` |
| `redirectIfUnverified(user)` | Редирект на `auth.html?verify=1` |
| `requestPasswordReset(email)` | Сброс пароля |
| `validateEmail(email)` | Проверка формата в `utils.js` |

Continue URL для писем → `pages/auth.html` на текущем хосте.

## Удаление аккаунта

Страница **Настройки** (`settings.html`), блок «Опасная зона» — виден только при созданном профиле.

1. Кнопка **Удалить аккаунт** → модальное окно на сайте: «Вы точно хотите удалить аккаунт?»
2. **Отмена** / клик по фону / Escape — закрыть без удаления
3. **Да, удалить аккаунт** — только тогда запускается `deleteUserAccount()`: яйца, подписки, уведомления, бейджи, `users/{uid}`, `usernames/{tag}`, Firebase Auth

При `auth/requires-recent-login` — нужно выйти и войти снова.

## Старые аккаунты

Пользователи, зарегистрированные до проверки email, при следующем входе увидят экран подтверждения. Нужно нажать **«Отправить ещё раз»** и перейти по ссылке.
