# Безопасность Firestore (prod)

Клиентский код виден всем — **правила в `firebase/firestore.rules` обязательны** в проде. Деплой после каждого изменения rules:

```powershell
firebase.cmd deploy --only firestore:rules --project temki-1409
```

Полная таблица ограничений также в [`firebase/README.md`](../../firebase/README.md).

## Базовые требования

| Правило | Смысл |
|---------|--------|
| `isVerified()` | Любой **write** только с `request.auth.token.email_verified == true` |
| Гостевой read | `users`, `usernames`, опубликованные `eggs`, комментарии, реакции — read: true |
| Черновики яиц | read только владельцу (`ownerId == auth.uid`) |

## Пользователи

| Операция | Ограничение |
|----------|-------------|
| `users` create | Только поля профиля; **`heat` нельзя** задать при создании |
| `users` update | Профиль **или** инкремент `heat` на **+1…+10** за запрос (не произвольное число) |
| `pending_profiles/{uid}` | create/update — только свой uid до finalize профиля; read — только владелец |
| `usernames/{tag}` | create при регистрации; delete — только владелец тега |

## Яйца

| Операция | Ограничение |
|----------|-------------|
| `eggs` create | `heat: 0`, `viewCount: 0`, `status: greetsya`; нельзя сразу «курица» или накрутить тепло |
| `eggs` update (владелец) | Whitelist полей; **`heat`, `viewCount`, `kuritsa` не меняются** через edit |
| `eggs.heat` bump | Отдельный путь: только поле `heat`, **+1…+10** за запрос |
| `egg_views` create | Нельзя на **своём** яйце (`eggOwner != auth.uid`) |
| `egg_questions` create | Нельзя на **своём** яйце |

## Социальное и геймификация

| Коллекция | Ограничение |
|-----------|-------------|
| `notifications` create | `fromUid == auth.uid`; получатель — владелец яйца или подписчик |
| `user_badges` create | Только ID: `first_comment`, `laid_egg`, `hatched` |
| `heat_events` create | `amount` 1…10, свой `uid` |

**Бейджи:** rules разрешают только три ID; **условия выдачи** (5 комментариев, снес яйцо и т.д.) проверяет клиент. Полная защита от накрутки бейджей потребует Cloud Functions.

## Что клиент дублирует

- Анти-фарм на своих яйцах: просмотры, комментарии, вопросы, квесты — см. [GAMIFICATION.md](GAMIFICATION.md)
- `changeEggStatus` → `kuritsa` только админ (`STATUS_ADMIN_ONLY`)
- Модальные подтверждения перед удалением яйца и аккаунта — UX, не security boundary

## Ограничения модели (известные)

| Риск | Статус |
|------|--------|
| API key в репо | Норма для Firebase web; защита — **rules**, не секрет ключа |
| Спам комментариев / heat_events | Частично: лимит +1…+10 за запрос; rate limit на уровне Firebase |
| Подделка бейджа без условия | Rules проверяют только ID бейджа, не счётчик комментариев |
| DDoS на read | Публичные read; при росте — App Check, кэш, Cloud Functions |

## Storage

`firebase/storage.rules` — запись в `eggs/{eggId}` только владельцу. **Storage на проекте не включён** — картинки в Firestore (data URL). См. [DOCUMENTATION.md §6](../DOCUMENTATION.md#6-картинки-без-storage).

## Связанные документы

- [RELIABILITY.md](../RELIABILITY.md) — гостевые запросы, retry, `permission-denied`
- [GAMIFICATION.md](GAMIFICATION.md) — тепло и бейджи
- [blocks/auth.md](../blocks/auth.md) — verify email, `pending_profiles`
- [eggs/VIEWS.md](../eggs/VIEWS.md), [eggs/COMMENTS.md](../eggs/COMMENTS.md) — анти-фарм
