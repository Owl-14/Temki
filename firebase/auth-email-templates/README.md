# auth-email-templates/

Русские тексты писем Firebase Authentication для проекта **Инкубатор**.

Скопируй в [Firebase Console → Authentication → Templates](https://console.firebase.google.com/project/temki-1409/authentication/emails).

| Файл | Шаблон в консоли |
|------|------------------|
| `verification-subject.txt` + `verification-body.txt` | Email address verification — **текст в консоли заблокирован**; файлы для Cloud Function |
| `password-reset-subject.txt` + `password-reset-body.txt` | Password reset |
| `email-change-subject.txt` + `email-change-body.txt` | Email address change |

**Sender name:** `Инкубатор` — настроено в консоли, дублируется в `config/brand.config.js`.

Полная инструкция: [`docs/blocks/AUTH_EMAILS.md`](../docs/blocks/AUTH_EMAILS.md).
