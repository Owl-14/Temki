# Инкубатор

Лендинг — место, где люди собираются и создают свои стартапы и темки.

## Проекты

- **Падел** — клуб для предпринимателей, 4 турнира в неделю
- **Cloacc** — VPN-бот в Telegram
- **ИИ базис-мебельщик** — ИИ проектировщик мебели

## GitHub Pages

Репозиторий: https://github.com/Owl-14/Temki

Сайт: https://owl-14.github.io/Temki/ (после включения Pages в Settings → Pages → branch `main`)

## Статистика

Подключена [Яндекс.Метрика](https://metrika.yandex.ru) — бесплатно, считает визиты и клики.

### Настройка (5 минут)

1. Зайди на https://metrika.yandex.ru и создай счётчик для `owl-14.github.io/Temki`
2. Скопируй номер счётчика (число вроде `12345678`)
3. Вставь его в `analytics.config.js` вместо `0`
4. Запушь изменения на GitHub

### Что отслеживается

- **Визиты** — автоматически
- **Клики по ссылкам** — автоматически (`trackLinks`)
- **Карта кликов** — где на странице жмут
- **Цели** (отдельно по темкам):
  - `padel_image` — клик по картинке Падел
  - `padel_link` — кнопка Падел
  - `cloacc_image` — клик по картинке Cloacc
  - `cloacc_link` — кнопка Cloacc

Цели появятся в Метрике сами после первых кликов. Смотри в разделе «Цели» и «Содержание → Переходы по ссылкам».

## Счётчик «Сейчас на сайте»

Метрика не умеет показывать онлайн прямо на странице — только в личном кабинете. Поэтому счётчик онлайн работает через **Firebase Realtime Database** (бесплатно).

### Настройка Firebase (5–10 минут)

1. Создай проект на https://console.firebase.google.com
2. **Build → Realtime Database → Create Database** (режим test на старте)
3. **Project settings → Your apps → Web** — зарегистрируй приложение и скопируй `firebaseConfig`
4. Вставь конфиг в `presence.config.js`:

```js
window.FIREBASE_CONFIG = {
  apiKey: "...",
  authDomain: "...",
  databaseURL: "https://....firebaseio.com",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

5. В Realtime Database → **Rules** вставь:

```json
{
  "rules": {
    "presence": {
      ".read": true,
      "$uid": {
        ".write": true,
        ".validate": "newData.isNumber()"
      }
    }
  }
}
```

6. Запушь на GitHub

После этого в правом верхнем углу появится бейдж: **«Сейчас на сайте N человек»** с зелёной точкой. Счётчик обновляется в реальном времени.
