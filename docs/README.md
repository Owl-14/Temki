# Документация проекта «Инкубатор»

## С чего начать

1. **[DOCUMENTATION.md](DOCUMENTATION.md)** — главный справочник: страницы, модули, Firebase, деплой
2. **[RELIABILITY.md](RELIABILITY.md)** — правила, чтобы лента и профили не падали

## Разделы по темам

| Раздел | Путь | О чём |
|--------|------|--------|
| Публичный профиль | [blocks/public-profile.md](blocks/public-profile.md) | `profile.html`, яйца автора, «Редактировать» |
| Вход / сброс пароля | [blocks/auth.md](blocks/auth.md) | `auth.html`, Firebase Auth |
| Письма Auth (тема, русский текст) | [blocks/AUTH_EMAILS.md](blocks/AUTH_EMAILS.md) | Firebase Console → Templates |
| Яйца | [eggs/README.md](eggs/README.md) | Просмотр, редактирование, комментарии, просмотры |
| **Платформа** | [platform/README.md](platform/README.md) | Видение, роли, UI, геймификация, зал славы, roadmap |

### Платформа — зал славы и главная

| Документ | Тема |
|----------|------|
| [platform/HALL.md](platform/HALL.md) | Зал славы, карточки людей, перенос лент с главной, `HALL_COPY` |

| Документ | Тема |
|----------|------|
| [eggs/PAGE.md](eggs/PAGE.md) | Страница `egg.html` |
| [eggs/LAY_EGG.md](eggs/LAY_EGG.md) | Создание `lay-egg.html`, анимация прогрева |
| [eggs/EDIT.md](eggs/EDIT.md) | Редактирование и удаление `edit-egg.html` |
| [eggs/COMMENTS.md](eggs/COMMENTS.md) | Комментарии, ответы, лайки |
| [eggs/VIEWS.md](eggs/VIEWS.md) | Уникальные просмотры |
| [eggs/UPDATES.md](eggs/UPDATES.md) | История обновлений |
| [eggs/DATA_MODEL.md](eggs/DATA_MODEL.md) | Коллекции Firestore |

## Вне `docs/`

| Путь | Назначение |
|------|------------|
| [README.md](../README.md) | Карта папок проекта |
| [meta/CONCEPT.md](../meta/CONCEPT.md) | Бренд и терминология |
| [meta/PROFILE_PLAN.md](../meta/PROFILE_PLAN.md) | Исторический план профилей |

## Как поддерживать актуальность

При добавлении страницы или фичи:

1. Обновить таблицу страниц в `DOCUMENTATION.md`
2. Добавить или дополнить тематический файл в `docs/eggs/` или `docs/blocks/`
3. При необходимости — чеклист в конце `DOCUMENTATION.md`

В Cursor для агента включено правило **`.cursor/rules/incubator-docs.mdc`** — при изменении функционала документация обновляется вместе с кодом.
