# Модель данных — яйца

## `eggs/{eggId}` (расширение)

```js
{
  ownerId: string,
  ownerUsername: string,
  title: string,
  description: string,
  link: string | null,
  imageUrl: string | null,
  status: 'greetsya' | 'tsyplenok' | 'kuritsa',
  published: boolean,
  viewCount: number,        // уникальные просмотры зарегистрированных
  createdAt: timestamp,
  updatedAt: timestamp
}
```

`viewCount` по умолчанию `0` при создании.

---

## `egg_views/{eggId}_{uid}`

Уникальный просмотр: один документ = один пользователь + одно яйцо.

```js
{
  eggId: string,
  uid: string,
  username: string,
  viewedAt: timestamp
}
```

Document id: `{eggId}_{uid}` — нельзя посмотреть дважды.

---

## `egg_comments/{commentId}`

```js
{
  eggId: string,
  authorId: string,
  authorUsername: string,
  authorDisplayName: string,
  text: string,           // 1–500 символов
  replyToUsername: string | null, // @кому ответ
  createdAt: timestamp
}
```

Запрос: `where eggId == id`, плоский список, сортировка на клиенте (новые сверху).

Устаревшее поле `parentId` (старые ответы) — @username для отображения берётся из родителя.

---

## `egg_comment_reactions/{commentId}_{uid}`

Голос пользователя на комментарий.

```js
{
  commentId: string,
  eggId: string,
  uid: string,
  vote: 'like' | 'dislike',
  createdAt: timestamp
}
```

Document id: `{commentId}_{uid}` — один голос на пользователя.

---

## `egg_updates/{updateId}`

```js
{
  eggId: string,
  type: 'created' | 'edited' | 'status',
  message: string,
  createdAt: timestamp
}
```

| Событие | type | message |
|---------|------|---------|
| `createEgg` | `created` | «Яйцо добавлено в инкубатор» |
| `updateEgg` | `edited` | «Описание обновлено» |
| смена статуса (позже) | `status` | «Статус: …» |
