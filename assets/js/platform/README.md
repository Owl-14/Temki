# assets/js/platform/

Фичи платформы поверх базовых яиц.

| Файл | Назначение |
|------|------------|
| `platform-api.js` | Firestore: вехи, Q&A, тестеры, подписки, тепло, invest |
| `egg-sections.js` | UI-блоки на egg.html: вопросы, попробовать, тепло |
| `hatch-animation.js` | Ритуал вылупления на edit-egg |
| `quests.js` | Ежедневные задания (localStorage) |

## Правила (не ломать)

### `quests.js`

- Просмотры: только `trackEggViewQuest(eggId)` — дедуп `viewedEggIds` за день.
- Не вызывать `trackQuestAction('views')` на `egg.html` без id яйца.

### `hatch-animation.js`

- `playHatchAnimation(imageUrl)` — обложка как при прогреве.
- Свечение на `.hatch-overlay__aura`, не в половинках скорлупы. → `docs/eggs/HATCH.md`

### `platform-api.js`

- `addEggQuestion` — отклонять `OWN_EGG` (владелец).
- `markAllNotificationsRead` — при открытии списка уведомлений.
- `changeEggStatus` — только `greetsya` → `tsyplenok` для владельца; `kuritsa` → `STATUS_ADMIN_ONLY`.
- `fetchHotEggs` — только `greetsya` (яйца в камере).
- `fetchIncubatingEggs` — лента «Яйца в инкубаторе» (`greetsya`).
- `fetchChicks` — лента «Цыплята» (`tsyplenok`, `kuritsa`).
- `qualifiesForFeaturedHatch` — лента «Недавно вылупились»; `hasExternalProductUrl`.

Документация: `docs/platform/GAMIFICATION.md`, `docs/eggs/VIEWS.md`, `docs/eggs/HATCH.md`
