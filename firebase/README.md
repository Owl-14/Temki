# firebase/

Инфраструктура Firebase (не фронтенд).

| Файл | Назначение |
|------|------------|
| `firestore.rules` | Правила доступа к коллекциям |
| `firestore.indexes.json` | Составные индексы Firestore |
| `storage.rules` | На будущее (картинки пока в Firestore) |

Деплой: `scripts/deploy_firebase.ps1` или `firebase.cmd deploy --only firestore:rules`
