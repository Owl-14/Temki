# assets/js/eggs/

Всё про страницу одного яйца.

| Файл | Назначение |
|------|------------|
| `egg-api.js` | Чтение яйца, просмотры, комментарии, реакции |
| `egg-detail.js` | Рендер `egg.html`, вкладки, запись просмотра |

## `egg-detail.js` — просмотры и награды

- `tryRecordView` / `recordIfNeeded`: владелец своего яйца — без записи и без квеста.
- Квест просмотров: `trackEggViewQuest(eggId)`, не `trackQuestAction('views')`.
- Комментарий: тепло и квест только если `user.uid !== egg.ownerId`.

Документация: `docs/eggs/VIEWS.md`, `docs/eggs/COMMENTS.md`.

## `egg-api.js` — `recordEggView`

Ранний выход при `ownerId === user.uid` (в транзакции). См. `docs/eggs/VIEWS.md`.
