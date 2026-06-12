# Вылупление (`hatch-animation`)

Ритуал при смене статуса `greetsya` → `tsyplenok` на `edit-egg.html`.

## Файлы

| Путь | Роль |
|------|------|
| `pages/edit-egg.html` | Разметка `#hatch-overlay` |
| `assets/js/platform/hatch-animation.js` | `playHatchAnimation(imageUrl)` |
| `assets/js/pages/edit-egg.js` | Кнопка «Отметить вылупление», передаёт `egg.imageUrl` |
| `assets/css/style.css` | `.hatch-overlay__*` |

Эталон по картинке внутри яйца: [LAY_EGG.md](LAY_EGG.md) (анимация прогрева).

## Правила и условия вылупления

Страница: `pages/hatch-rules.html` — ссылка справа от кнопки «Отметить вылупление» на `edit-egg.html` (та же вкладка, «Назад» ведёт на редактирование через `?from=`).

### Обязательно (создатель)

- Заполнено поле **«Ссылка»** — внешний продукт, не канал «о проекте».
- Чекбоксы: продукт для незнакомых; работает минимум один сценарий.
- Статус меняется только `greetsya` → `tsyplenok`, **без отката**.
- **`kuritsa`** — только администратор (`changeEggStatus` → `STATUS_ADMIN_ONLY`).

### Лента «Недавно вылупились» (мягкая проверка)

Отображается на **`hall.html`** (блок «Недавно вылупились»). На главной скрыта — см. `HOME_FEEDS.hatched` в `home.js`, [platform/HALL.md](../platform/HALL.md).

`qualifiesForFeaturedHatch(egg)` в `platform-api.js`:

- есть `link`;
- `viewCount >= 3` **или** `heat >= 8`;
- `kuritsa` — всегда в ленте (назначена админом).

## Этапы анимации

| Фаза | Класс на `#hatch-overlay` | Визуал | Текст |
|------|----------------------------|--------|-------|
| Старт | `is-visible` `is-cracking` | Трещины (SVG), лёгкое покачивание | «Трещина...» |
| Раскрытие | + `is-opening` | Половинки скорлупы расходятся, 🐣 | «Скорлупа расходится...» |
| Финиш | + `is-hatched` | Скорлупа исчезает, цыплёнок подпрыгивает | «Вылупилось! Цыплёнок на свободе» |

Длительность: ~4.2 с (`HATCH_MS` в `hatch-animation.js`).

## Слои (важно — не ломать при доработках)

```
.hatch-overlay__egg (200×260, без overflow:hidden — половинки должны разъезжаться)
├── .hatch-overlay__aura          ← оранжевая обводка и внешнее свечение (целое яйцо)
├── .hatch-overlay__glow          ← пульс изнутри (круг, не в половинках)
├── .hatch-overlay__shell--left   ← overflow:hidden, только клип контента
│   └── .hatch-overlay__body
│       ├── .hatch-overlay__avatar-wrap  ← обложка проекта
│       └── .hatch-overlay__shell-glaze  ← лёгкий блик, без оранжевого ореола
├── .hatch-overlay__shell--right  ← зеркально, body с margin-left: -100px
├── .hatch-overlay__cracks (SVG)
└── .hatch-overlay__chick
```

### Правила вёрстки (исправленные баги)

1. **Не класть `box-shadow` и оранжевые `radial-gradient` внутрь `.hatch-overlay__shell`**
   - Половинки обрезают содержимое прямоугольником `width: 50%` + `overflow: hidden`.
   - Ореол обрезается **вертикальной линией по центру** и выглядит как полупрозрачный квадрат.
   - Внешнее тепло и обводка — только на `.hatch-overlay__aura` (целое яйцо, `border-radius: var(--egg-radius)`).

2. **Аватарка проекта обязательна**
   - `playHatchAnimation(egg.imageUrl)` — та же логика, что `startLayEggWarming(imageUrl)` при сносе.
   - Без картинки — плейсхолдер `.hatch-overlay__avatar-placeholder`.
   - Размер и inset аватара как у прогрева: `inset: 18% 22% 14%`, `border-radius: var(--egg-radius)`.

3. **Не ставить `overflow: hidden` на `.hatch-overlay__egg`**
   - Иначе половинки не смогут разъехаться за пределы силуэта при раскрытии.

4. **`.hatch-overlay__body` — без тени и без оранжевой заливки**
   - Только клип аватара и тонкий блик `.hatch-overlay__shell-glaze`.

5. **При раскрытии `.hatch-overlay__aura` гаснет** (`opacity: 0`), свет даёт `.hatch-overlay__glow`.

## Чеклист перед новой анимацией яйца

- [ ] Свечение/градиенты на слое **целого яйца**, не внутри клипующих половинок?
- [ ] Картинка передаётся в JS и дублируется в обе половинки (или один общий слой без дубля)?
- [ ] Форма яйца через `var(--egg-radius)`, не прямоугольник?
- [ ] Тест: нет вертикального «среза» ореола по центру?
- [ ] Тест на `edit-egg.html` с реальной обложкой яйца?
