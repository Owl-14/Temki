# Комьюнити

## Вопросы (Q&A)

Коллекция `egg_questions`:

```js
{ eggId, authorId, authorUsername, text, answerText?, answeredAt?, createdAt }
```

Отдельно от комментариев. Создатель отвечает официально через `answerEggQuestion`.

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

`greetsya` → `tsyplenok` (вылупление) → `kuritsa` (курица).

Запись в `egg_updates` с типом `hatched` / `status`.
