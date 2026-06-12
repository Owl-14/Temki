# config/

Публичные конфиги (ключи Firebase видны в браузере — это норма для клиентского SDK).

| Файл | Назначение |
|------|------------|
| `firebase.config.js` | `window.FIREBASE_CONFIG` — Auth, Firestore, RTDB |
| `brand.config.js` | `window.BRAND_CONFIG` — имя «Инкубатор», темы писем Auth (синхрон с Firebase Console) |
| `presence.config.js` | Дубликат для presence (legacy) |

Подключать **до** ES-модулей: `<script src="../config/firebase.config.js">`
