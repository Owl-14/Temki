# assets/js/lay-egg/

| Файл | Назначение |
|------|------------|
| `warming-animation.js` | Полноэкранный прогрев при «Снести яйцо» |

Эталон для картинки в яйце и слоёв свечения. Вылупление (`hatch-animation.js`) повторяет те же принципы.

**Картинка в оверлее:** обложка с формы (`lay-egg.js` → `getWarmingImage()`), не аватар профиля.

**Anti-clipping:** `box-shadow` и оранжевый ореол — на целой скорлупе (`.lay-egg-warming__shell`), не внутри клипующих половинок. Подробнее: `docs/eggs/ANIMATIONS.md`, `docs/eggs/HATCH.md`.
