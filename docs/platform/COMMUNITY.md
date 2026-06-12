# Комьюнити

## Вопросы (Q&A)

Коллекция `egg_questions`:

```js
{ eggId, authorId, authorUsername, text, answerText?, answeredAt?, createdAt }
```

Отдельно от комментариев. Создатель отвечает официально через `answerEggQuestion`.

**Владелец яйца не может задать вопрос сам себе:**

- UI: форма скрыта, подсказка «Вопросы задают другие — отвечай в списке ниже».
- API: `addEggQuestion` → ошибка `OWN_EGG`.
- Firestore: create только если `eggOwner(eggId) != auth.uid`.
- Тепло и квест «Задай вопрос» — не начисляются.

## Комментарии

Коллекция `egg_comments` — обсуждение, ответы @username, лайки.

## Подписки

`follows/{followerUid}_{targetUid}` — подписка на основателя.

Лента: `activity.html` — вылупления и вехи от подписок.

## Уведомления

`notifications/{id}`:

```js
{ uid, type, eggId?, fromUid?, text, read, createdAt }
```

Типы: `question_answered`, `new_question`, `egg_hatched`, `tester_signed_up`, `invest_interest`, `new_follower`.

### Счётчик 🔔 в nav

- При открытии `notifications.html` все непрочитанные помечаются прочитанными (`markAllNotificationsRead`).
- Значок обновляется через `refreshNavBadge` (`nav.js`) — без перезагрузки страницы.
- На `pageshow` (кнопка «Назад») badge пересчитывается.

**Не** полагаться только на клик по уведомлению — переход по ссылке может прервать запрос до `markNotificationRead`.

## Тестирование

`egg_testers/{eggId}_{uid}`:

```js
{ eggId, uid, username, status, feedback?, rating?, createdAt }
```

UI: блок «Попробовать» на `egg.html`, список в `my-eggs.html`.

## Вехи

`egg_milestones/{id}`:

```js
{ eggId, message, createdAt }
```

## Смена статуса

`greetsya` → `tsyplenok` (вылупление, создатель + условия) → `kuritsa` (курица, **только администратор**).

Условия и лента: [HATCH.md](../eggs/HATCH.md), страница [hatch-rules.html](../../pages/hatch-rules.html).

Запись в `egg_updates` с типом `hatched` / `status`.
