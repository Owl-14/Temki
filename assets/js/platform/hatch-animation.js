var HATCH_MS = 3500;

export function playHatchAnimation() {
  return new Promise(function (resolve) {
    var overlay = document.getElementById('hatch-overlay');
    if (!overlay) {
      resolve();
      return;
    }
    var text = overlay.querySelector('.hatch-overlay__text');
    if (text) {
      text.textContent = 'Трещина...';
    }
    overlay.classList.add('is-active');
    document.body.classList.add('lay-egg-warming-active');
    requestAnimationFrame(function () {
      overlay.classList.add('is-visible');
      overlay.classList.add('is-cracking');
    });
    setTimeout(function () {
      if (text) {
        text.textContent = 'Вылупилось! Цыплёнок на свободе';
      }
      overlay.classList.add('is-hatched');
    }, HATCH_MS * 0.55);
    setTimeout(function () {
      overlay.classList.remove('is-visible', 'is-cracking', 'is-hatched', 'is-active');
      document.body.classList.remove('lay-egg-warming-active');
      resolve();
    }, HATCH_MS);
  });
}
