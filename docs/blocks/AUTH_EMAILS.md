# Письма Firebase Auth — тексты «Инкубатора»

Стандартные письма Firebase приходят на английском. Тексты ниже — **русские**, в тоне [CONCEPT.md](../../meta/CONCEPT.md).

Шаблоны настраиваются **вручную** в [Firebase Console → Authentication → Templates](https://console.firebase.google.com/project/temki-1409/authentication/emails).

---

## ⚠️ Ограничение Firebase (важно)

Google **намеренно блокирует** редактирование **текста** письма **Email address verification** (и смены email) — антиспам. Красная плашка *«This template cannot be edited»* на этом шаблоне — **норма**, не баг проекта.

| Шаблон | Тема (Subject) | Текст письма (Message) |
|--------|----------------|------------------------|
| **Email address verification** | иногда можно | ❌ **нельзя** — только английский шаблон Firebase |
| **Password reset** | ✅ можно | ✅ **можно** — вставь русский текст |
| **Email address change** | иногда можно | ❌ нельзя |

**Без своего бэкенда** полностью русское письмо подтверждения email **невозможно**. Варианты — см. раздел «Полное решение» ниже.

### Что сделать прямо сейчас (бесплатно)

**Настроено в консоли** (синхрон с `config/brand.config.js`):

| Параметр | Значение |
|----------|----------|
| **Public-facing name** | `Инкубатор` |
| **Sender name** | `Инкубатор` |
| **Password reset subject** | `Инкубатор — сброс пароля` |
| **Verification subject** | `Verify your email for Инкубатор` (шаблон Firebase, тело на англ.) |

Если меняешь названия в Firebase — обнови **`config/brand.config.js`** и подсказки подтянутся через `assets/js/core/brand.js`.

1. **Шестерёнка → Template settings** — Sender name: `Инкубатор`
2. **Project settings → General** — Public-facing name: `Инкубатор`
3. **Password reset** — Subject и Message из [`password-reset-*.txt`](../../firebase/auth-email-templates/)

---

## Полное решение: своё письмо подтверждения

Чтобы verification был **полностью на русском** и в стиле бренда:

1. Тариф **Blaze** (pay-as-you-go, бесплатная квота Functions обычно хватает)
2. **Cloud Function** + Firebase Admin SDK:
   - `generateEmailVerificationLink(email)`
   - отправка через **Resend** / SendGrid / SMTP (Trigger Email extension)
3. На клиенте вместо `sendEmailVerification()` — вызов функции

Пока этого нет — verification остаётся английским от Firebase, reset password можно русифицировать в консоли.

---

## 1. Имя отправителя (для всех писем)

**Authentication → Templates → шестерёнка (Template settings)**

| Поле | Значение |
|------|----------|
| **Sender name** | `Инкубатор` |
| **From** | `noreply@temki-1409.firebaseapp.com` (системный, менять нельзя без Custom SMTP) |
| **Reply-to** | по желанию — рабочая почта команды |

В [Project settings → General](https://console.firebase.google.com/project/temki-1409/settings/general) → **Public-facing name** тоже поставь **Инкубатор** — подставляется в `%APP_NAME%`, если используешь.

---

## 2. Подтверждение email (регистрация)

**Template:** Email address verification

> Текст письма **заблокирован Firebase**. Доступно только:
> - Sender name «Инкубатор» (шестерёнка)
> - Public-facing name «Инкубатор» → `%APP_NAME%` в теме
>
> Русский текст из [`verification-body.txt`](../../firebase/auth-email-templates/verification-body.txt) — **для будущей Cloud Function**, не для консоли.

**Action URL:** `https://owl-14.github.io/Temki/pages/auth.html` (или customize action URL в консоли, если доступно).

---

## 3. Сброс пароля ✅ редактируется

**Template:** Password reset → **Edit** (карандаш)

| Поле | Текст |
|------|-------|
| **Subject** | `Инкубатор — сброс пароля` |
| **Message** | см. [`password-reset-body.txt`](../../firebase/auth-email-templates/password-reset-body.txt) |

```
Привет!

Кто-то (надеемся, ты) попросил новый пароль для %EMAIL% в инкубаторе.

Задай его по ссылке — и снова сможешь погреться и работать со своими яйцами:

%LINK%

Ссылка живёт недолго. Не ты запрашивал — смело игнорируй: пароль не поменяется.

Инкубатор — греем идеи до вылупления
```

---

## 4. Смена email (если включишь позже)

**Template:** Email address change

| Поле | Текст |
|------|-------|
| **Subject** | `Инкубатор — подтверди новый email` |
| **Message** | [`email-change-body.txt`](../../firebase/auth-email-templates/email-change-body.txt) |

---

## Плейсхолдеры Firebase

| Тег | Где |
|-----|-----|
| `%LINK%` | Кнопка/ссылка действия — **обязательно** оставить |
| `%EMAIL%` | Email пользователя |
| `%NEW_EMAIL%` | Новый email (смена адреса) |
| `%APP_NAME%` | Public-facing name проекта |

---

## Оформление и лимиты

- Firebase оборачивает текст в **свою обёртку** (логотип Google/Firebase). Полностью свой HTML-дизайн — только **Custom SMTP** (Blaze + домен).
- Для MVP достаточно: **Sender name «Инкубатор»** + русская тема + текст выше.
- После правок отправь себе тест: регистрация / «Забыл пароль?».

---

## Проверка

- [ ] В «Входящих» тема начинается с **Инкубатор —**
- [ ] Отображается отправитель **Инкубатор**, не голый `noreply@…`
- [ ] Текст письма на русском, с `%LINK%`
- [ ] Ссылка из письма открывает `auth.html` и действие срабатывает

См. также: [auth.md](auth.md) — поведение на сайте.
