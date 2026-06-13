# firebase/

Инфраструктура Firebase (не фронтенд).

| Файл | Назначение |
|------|------------|
| `firestore.rules` | Правила доступа к коллекциям |
| `firestore.indexes.json` | Составные индексы Firestore |
| `storage.rules` | На будущее (картинки пока в Firestore) |
| `auth-email-templates/` | Тексты писем Auth (подтверждение, сброс пароля) → вставить в [Firebase Templates](https://console.firebase.google.com/project/temki-1409/authentication/emails) |

Деплой: `scripts/deploy_firebase.ps1` или `firebase.cmd deploy --only firestore:rules`

**Письма Auth** не деплоятся с кодом — см. [`auth-email-templates/README.md`](auth-email-templates/README.md) и [`docs/blocks/AUTH_EMAILS.md`](../docs/blocks/AUTH_EMAILS.md).

На Windows, если `.ps1` заблокирован политикой:

```powershell
& "$env:APPDATA\npm\firebase.cmd" deploy --only firestore:rules --project temki-1409
```

## Анти-фарм и безопасность (`firestore.rules`)

| Коллекция / поле | Ограничение |
|------------------|-------------|
| **Все записи** | `isVerified()` — `email_verified` в JWT; без подтверждённого email нет write |
| `users` create | Только поля профиля, без `heat` |
| `users` update | Профиль **или** `heat` +1…+10 за запрос (не произвольное число) |
| `eggs` create | `heat: 0`, `viewCount: 0`, `status: greetsya`; нельзя сразу «курица» / 1000 тепла |
| `eggs` update (владелец) | Whitelist полей; `heat` / `viewCount` / `kuritsa` не меняются |
| `eggs.heat` bump | Только поле `heat`, +1…+10 за запрос |
| `egg_views` create | `eggOwner(eggId) != request.auth.uid` |
| `egg_questions` create | `eggOwner(eggId) != request.auth.uid` |
| `notifications` create | `fromUid == auth.uid`; получатель — владелец яйца или подписчик |
| `user_badges` create | Только `first_comment`, `laid_egg`, `hatched` (условия — в клиенте) |
| `heat_events` create | `amount` 1…10, свой `uid` |

Клиент дублирует проверки; **rules обязательны в prod**. Подробнее: [`docs/platform/SECURITY.md`](../docs/platform/SECURITY.md), `docs/eggs/VIEWS.md`, `docs/platform/GAMIFICATION.md`.
