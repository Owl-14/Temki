# assets/js/core/

Общие модули для всех страниц.

| Файл | Назначение |
|------|------------|
| `firebase-app.js` | Auth, Firestore, профили, CRUD яиц |
| `brand.js` | Имя «Инкубатор», темы писем Auth (`config/brand.config.js`) |
| `utils.js` | username, escapeHtml, даты, сжатие картинок |
| `confirm-modal.js` | Модальное подтверждение (удаление яйца и др.) |
| `nav.js` | Меню, колокольчик, dropdown; на мобиле — бургер и выезжающее меню |
| `eggs.js` | Рендер карточек яиц в ленте |

## `nav.js` — уведомления

- `refreshNavBadge(uid)` — обновляет цифру на 🔔 без перерисовки всего меню.
- Вызывается из `notifications.js` после `markAllNotificationsRead`.

## `eggs.js` — бейджи на карточке

Статус и 🔥 тепло в общем блоке `.egg__badges` (колонка), не в одной точке `top-right` — иначе наложение. См. `style.css` `.egg__badges`.
| `presence.js` | Счётчик «тут щас N» (Realtime DB) |
