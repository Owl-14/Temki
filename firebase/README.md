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

## Анти-фарм (правила в `firestore.rules`)

| Коллекция / поле | Ограничение |
|------------------|-------------|
| **Все записи** | `isVerified()` — `email_verified` в JWT; без подтверждённого email нет write |
| `egg_views` create | `eggOwner(eggId) != request.auth.uid` |
| `eggs.viewCount` bump | `resource.data.ownerId != request.auth.uid` |
| `egg_questions` create | `eggOwner(eggId) != request.auth.uid` |

Клиент дублирует проверки; rules обязательны в проде. См. `docs/eggs/VIEWS.md`, `docs/platform/GAMIFICATION.md`.
