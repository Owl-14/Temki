# config/

Публичные конфиги (ключи Firebase видны в браузере — это норма для клиентского SDK).

| Файл | Назначение |
|------|------------|
| `firebase.config.js` | `window.FIREBASE_CONFIG` — Auth, Firestore, RTDB |
| `presence.config.js` | Дубликат для presence (legacy) |

Подключать **до** ES-модулей: `<script src="../config/firebase.config.js">`
