# Инкубатор

Площадка, где выращивают **яйца** — стартапы от идеи до вылупления.

**Сайт:** https://owl-14.github.io/Temki/  
**Репозиторий:** https://github.com/Owl-14/Temki

## Возможности

- Лента яиц (legacy + пользовательские из Firestore)
- Регистрация и вход (Firebase Auth)
- Профиль: имя, @username, bio, аватар
- «Снести яйцо» — добавить свой стартап
- Счётчик онлайн в навигации
- Яндекс.Метрика

## Документация

Полный справочник по страницам, модулям, Firebase и деплою:

**[docs/DOCUMENTATION.md](docs/DOCUMENTATION.md)**

Бренд и термины: **[CONCEPT.md](CONCEPT.md)**

## Быстрый старт (локально)

```powershell
python -m http.server 5500
```

http://localhost:5500

## Firebase (`temki-1409`)

| Сервис | Нужен | Ссылка |
|--------|-------|--------|
| Auth (Email) | ✅ | [Providers](https://console.firebase.google.com/project/temki-1409/authentication/providers) |
| Firestore | ✅ | [Database](https://console.firebase.google.com/project/temki-1409/firestore) |
| Realtime DB | ✅ (онлайн) | [Database](https://console.firebase.google.com/project/temki-1409/database) |
| Storage | ❌ | Картинки в Firestore |

Конфиг: `firebase.config.js`

## Деплой

```powershell
git push origin main
```

Правила Firestore (после `firebase login`):

```powershell
.\scripts\deploy_firebase.ps1
```
