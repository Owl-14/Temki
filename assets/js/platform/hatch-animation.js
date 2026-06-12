var HATCH_MS = 4200;

function fillHatchAvatars(overlay, imageUrl) {
  var wraps = overlay.querySelectorAll('.hatch-overlay__avatar-wrap');
  wraps.forEach(function (wrap) {
    wrap.innerHTML = '';
    if (imageUrl) {
      var img = document.createElement('img');
      img.className = 'hatch-overlay__avatar';
      img.src = imageUrl;
      img.alt = '';
      wrap.appendChild(img);
      return;
    }
    var placeholder = document.createElement('span');
    placeholder.className = 'hatch-overlay__avatar-placeholder';
    placeholder.setAttribute('aria-hidden', 'true');
    wrap.appendChild(placeholder);
  });
}

export function playHatchAnimation(imageUrl) {
  return new Promise(function (resolve) {
    var overlay = document.getElementById('hatch-overlay');
    if (!overlay) {
      resolve();
      return;
    }

    var text = overlay.querySelector('.hatch-overlay__text');
    overlay.classList.remove('is-visible', 'is-cracking', 'is-opening', 'is-hatched', 'is-active');

    fillHatchAvatars(overlay, imageUrl || null);

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
      overlay.classList.add('is-opening');
      if (text) {
        text.textContent = 'Скорлупа расходится...';
      }
    }, HATCH_MS * 0.38);

    setTimeout(function () {
      if (text) {
        text.textContent = 'Вылупилось! Цыплёнок на свободе';
      }
      overlay.classList.add('is-hatched');
    }, HATCH_MS * 0.62);

    setTimeout(function () {
      overlay.classList.remove('is-visible', 'is-cracking', 'is-opening', 'is-hatched', 'is-active');
      document.body.classList.remove('lay-egg-warming-active');
      resolve();
    }, HATCH_MS);
  });
}
