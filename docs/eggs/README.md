# Документация: страницы яиц

Отдельный раздел про **яйца** — просмотр, редактирование, статистика, история, комментарии.

## Документы

| Документ | О чём |
|----------|--------|
| [PAGE.md](PAGE.md) | Страница яйца: URL, блоки UI, сценарии |
| [LAY_EGG.md](LAY_EGG.md) | Создание яйца и анимация прогрева |
| [HATCH.md](HATCH.md) | Вылупление: оверлей, слои, anti-clipping |
| [ANIMATIONS.md](ANIMATIONS.md) | Общие правила анимаций яйца |
| [EDIT.md](EDIT.md) | Редактирование и удаление яйца |
| [DATA_MODEL.md](DATA_MODEL.md) | Коллекции Firestore |
| [VIEWS.md](VIEWS.md) | Уникальные просмотры зарегистрированных |
| [COMMENTS.md](COMMENTS.md) | Комментарии, ответы, лайки |
| [UPDATES.md](UPDATES.md) | История обновлений |

## Страницы и код

| Путь | Роль |
|------|------|
| `egg.html` | Страница яйца (просмотр) |
| `edit-egg.html` | Редактирование яйца (только владелец) |
| `lay-egg.html` | Создание яйца |
| `js/pages/egg.js` | Точка входа страницы яйца |
| `js/pages/edit-egg.js` | Точка входа редактирования |
| `js/pages/lay-egg.js` | Создание яйца, запуск анимации |
| `js/lay-egg/warming-animation.js` | Оверлей прогрева `--warm` |
| `js/egg/egg-detail.js` | Рендер страницы, комментарии, голоса |
| `js/egg/egg-api.js` | Firestore: яйцо, просмотры, комментарии, реакции |
| `js/eggs.js` | Карточки в ленте и профиле, ссылки, «Редактировать» |
| `js/firebase-app.js` | `createEgg`, `updateEgg`, `deleteEgg`, `deleteUserAccount` |
| `js/core/confirm-modal.js` | Подтверждение удаления яйца |
| `firebase/firestore.rules` | Правила коллекций яиц — [SECURITY.md](../platform/SECURITY.md) |

## URL

| Страница | URL |
|----------|-----|
| Просмотр | `/egg.html?id={eggId}` |
| Редактирование | `/edit-egg.html?id={eggId}` |
| Создание | `/lay-egg.html` |

Пример: https://owl-14.github.io/Temki/egg.html?id=abc123
