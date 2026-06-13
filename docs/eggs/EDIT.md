# Редактирование яйца (`edit-egg.html`)

Владелец может изменить название, описание, ссылку и обложку своего яйца.

## URL

```
edit-egg.html?id={eggId}
```

Доступ **только владельцу** (`eggs.ownerId === auth.uid`). Иначе — «Яйцо не найдено».

## Как попасть

| Способ | Где |
|--------|-----|
| Кнопка **«Редактировать»** | Свой профиль → карточка яйца |
| Прямая ссылка | `edit-egg.html?id=...` (если знаешь id) |

На чужих профилях и в ленте кнопки редактирования **нет**.

## Поля формы

| Поле | Обязательно | Макс. |
|------|-------------|-------|
| Название | да | 60 |
| Описание | да | 500 |
| Ссылка | нет | URL |
| Обложка | нет | webp data URL |

Если обложку не менять — остаётся прежняя.

## Удаление

- Кнопка **«Удалить»** на `edit-egg.html`, в своём профиле и на странице яйца
- Модальное окно через `showConfirmModal` (`confirm-modal.js`): «Вы точно хотите удалить своё яйцо?» — **Отмена** / клик по фону / Escape закрывают без удаления; **Да, удалить** запускает `deleteEgg`
- `deleteEgg(eggId, uid)` — удаляет документ из `eggs`
- После удаления — редирект в профиль

## После сохранения

1. Firestore: `updateDoc` на `eggs/{eggId}` (`title`, `description`, `link`, `imageUrl?`, `updatedAt`)
2. Запись в `egg_updates`: `type: 'edited'`, message: «Описание обновлено»
3. Редирект на `egg.html?id={eggId}`

## Файлы

| Путь | Роль |
|------|------|
| `edit-egg.html` | Разметка формы |
| `js/pages/edit-egg.js` | Загрузка яйца, проверка владельца, сохранение |
| `js/firebase-app.js` | `updateEgg(eggId, uid, data, imageBlob)` |
| `js/egg/egg-api.js` | `getEggById` — чтение для формы |
| `js/eggs.js` | Кнопка «Редактировать» при `egg.editable === true` |
| `js/core/confirm-modal.js` | `showConfirmModal` — подтверждение удаления |
| `js/profile/public-profile.js` | `editable: true` только для владельца профиля; удаление с модалкой |

## Вылупление

Кнопка **«🐣 Отметить вылупление»** (статус `greetsya`):

1. `playHatchAnimation(egg.imageUrl)` — полноэкранный оверлей
2. `changeEggStatus(eggId, uid, 'tsyplenok')` — после анимации

Подробно: слои, анти-clipping, картинка в яйце — [HATCH.md](HATCH.md), общие правила анимаций — [ANIMATIONS.md](ANIMATIONS.md).

## Правила Firestore

```
eggs:
  create: heat == 0, viewCount == 0, status == greetsya (rules)
  update (владелец): whitelist полей title, description, link, imageUrl, status, …
                      heat / viewCount / kuritsa — не через edit

egg_updates:
  create: владелец яйца (при сохранении редактирования)
```

Полная таблица: [platform/SECURITY.md](../platform/SECURITY.md).
