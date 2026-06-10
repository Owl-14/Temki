# scripts/

Скрипты для разработчика (не попадают на сайт).

| Файл | Назначение |
|------|------------|
| `deploy_firebase.ps1` | Деплой правил Firestore + Storage |
| `deploy_site.ps1` | Деплой сайта (если используется) |
| `check_firebase.py` | Проверка подключения к Firebase |
| `check_paths.py` | Проверка путей в HTML/JS после рефакторинга |

На Windows для Firebase CLI: `firebase.cmd`, не `firebase` (PowerShell execution policy).
