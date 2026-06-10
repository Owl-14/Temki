# Инкубатор

Статический сайт + Firebase. Стартапы как яйца: греются, вылупляются, становятся курицами.

**Прод:** https://owl-14.github.io/Temki/  
**Документация:** [docs/README.md](docs/README.md)

## Карта проекта

| Папка | За что отвечает |
|-------|-----------------|
| [pages/](pages/README.md) | HTML-страницы сайта |
| [assets/](assets/README.md) | CSS, JS, картинки, аналитика |
| [config/](config/README.md) | Ключи Firebase и presence |
| [firebase/](firebase/README.md) | Правила Firestore / Storage |
| [docs/](docs/README.md) | Подробная документация |
| [scripts/](scripts/README.md) | Деплой и проверки |
| [meta/](meta/README.md) | Бренд и исторические планы |

## Быстрый старт

```powershell
cd "d:\cursor project vpn\site"
python -m http.server 5500
```

Открыть: http://localhost:5500/pages/index.html

## Деплой

- **Сайт:** GitHub Pages (push в `main`)
- **Правила Firebase:** `scripts/deploy_firebase.ps1`
