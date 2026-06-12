# Подписки на основателей

Лента **«Активность»** показывает обновления яиц только от тех, на кого ты **подписан**. Подписка — это следить за основателем, а не за отдельным яйцом.

См. также: [ROLES.md](ROLES.md) (роль **Участник**), [COMMUNITY.md](COMMUNITY.md) (уведомления).

---

## Как это работает для пользователя

1. Открой профиль основателя → `profile.html?u=username`
2. Нажми **«Подписаться»** (нужен вход)
3. Открой **Активность** в меню → `activity.html`
4. В блоке **«Мои подписки»** — список основателей; **«Отписаться»** снимает подписку
5. Ниже — **«Обновления»**: события по их яйцам

Без подписок лента пустая — подсказка ведёт в камеру или на профили.

---

## Какие события попадают в ленту

Источник — коллекция `egg_updates`, только яйца **опубликованных** проектов подписанных основателей.

| type | Когда | Пример message |
|------|-------|----------------|
| `created` | Снес новое яйцо | «Яйцо добавлено в инкубатор» |
| `edited` | Сохранил описание | «Описание обновлено» |
| `milestone` | Добавил веху | текст вехи |
| `hatched` | Отметил вылупление | «Яйцо вылупилось!» |
| `status` | Смена статуса | «Статус: …» |

Комментарии, вопросы и тесты **не** попадают в эту ленту — для них есть страница яйца и [уведомления](COMMUNITY.md).

---

## Модель данных

### `follows/{followerUid}_{targetUid}`

```js
{
  followerUid: string,   // кто подписался
  targetUid: string,     // на кого
  targetUsername: string,
  createdAt: Timestamp
}
```

- ID документа: `{followerUid}_{targetUid}` — одна подписка на пару
- Подписаться на себя нельзя (`toggleFollow` → `{ following: false }`)
- При подписке основателю уходит уведомление `new_follower`

### Связь с `egg_updates`

Запись в `egg_updates` содержит `eggId`, без `ownerId`. Лента:

1. Читает `follows` текущего пользователя
2. Для каждого `targetUid` — опубликованные яйца (`eggs` where `ownerId` + `published`)
3. Фильтрует `egg_updates` по `eggId` и типам из таблицы выше
4. Сортирует по `createdAt` desc, лимит 30

---

## API (`platform-api.js`)

| Функция | Назначение |
|---------|------------|
| `toggleFollow(followerUid, targetUid, targetUsername)` | Подписаться / отписаться |
| `isFollowing(followerUid, targetUid)` | Проверка подписки |
| `fetchFollowing(uid)` | Список подписок (до 100) |
| `fetchFollowerCount(targetUid)` | Число подписчиков (`getCountFromServer`) |
| `fetchFollowedActivity(uid, limit)` | `{ follows, events }` для `activity.html` |

---

## UI

| Страница | Блок |
|----------|------|
| `profile.html` | Кнопка «Подписаться» / «Отписаться», **счётчик подписчиков** (`public-profile.js`) |
| `activity.html` | «Мои подписки» + «Обновления» (`activity.js`) |
| nav dropdown | Ссылка «Активность» |

---

## Firestore rules

```js
match /follows/{followId} {
  allow read: if true;
  allow create: if isAuth()
    && request.resource.data.followerUid == request.auth.uid
    && followId == followerUid + '_' + targetUid;
  allow delete: if isAuth() && resource.data.followerUid == request.auth.uid;
  allow update: if false;
}
```

---

## Ограничения MVP

- Нет подписки на одно яйцо — только на основателя целиком
- Лента без `orderBy` в Firestore: выборка последних `egg_updates` + фильтр на клиенте (до ~200 записей)
- Push по подпискам не дублируется в 🔔 — только `new_follower` для основателя; события яиц — в **Активности**

---

## Файлы

| Файл | Роль |
|------|------|
| `pages/activity.html` | Страница ленты |
| `assets/js/pages/activity.js` | Рендер подписок и событий |
| `assets/js/profile/public-profile.js` | Кнопка подписки на профиле |
| `assets/js/platform/platform-api.js` | CRUD подписок, `fetchFollowedActivity` |
| `firebase/firestore.rules` | Правила `follows` |

---

## Проверка вручную

- [ ] Подписаться на профиле → счётчик подписчиков +1, в Активности появился @username
- [ ] Основатель добавил веху / вылупился → событие в ленте подписчика
- [ ] Отписаться на activity или профиле → события исчезают после перезагрузки
- [ ] Без подписок — пустое состояние с подсказкой
