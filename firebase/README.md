# firebase/

Инфраструктура Firebase (не фронтенд).

| Файл | Назначение |
|------|------------|
| `firestore.rules` | Правила доступа к коллекциям |
| `firestore.indexes.json` | Составные индексы Firestore |
| `storage.rules` | На будущее (картинки пока в Firestore) |

Деплой: `scripts/deploy_firebase.ps1` или `firebase.cmd deploy --only firestore:rules`

На Windows, если `.ps1` заблокирован политикой:

```powershell
& "$env:APPDATA\npm\firebase.cmd" deploy --only firestore:rules --project temki-1409
```

## Анти-фарм (правила в `firestore.rules`)

| Коллекция / поле | Ограничение |
|------------------|-------------|
| `egg_views` create | `eggOwner(eggId) != request.auth.uid` |
| `eggs.viewCount` bump | `resource.data.ownerId != request.auth.uid` |
| `egg_questions` create | `eggOwner(eggId) != request.auth.uid` |

Клиент дублирует проверки; rules обязательны в проде. См. `docs/eggs/VIEWS.md`, `docs/platform/GAMIFICATION.md`.
