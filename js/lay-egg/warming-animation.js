var WARMING_MS = 4200;

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function setWarmProgress(stage, egg, warm) {
  var value = String(warm);
  stage.style.setProperty('--warm', value);
  egg.style.setProperty('--warm', value);
}

function runWarmProgress(stage, egg, duration) {
  return new Promise(function (resolve) {
    var start = performance.now();

    setWarmProgress(stage, egg, 0);

    function frame(now) {
      var t = Math.min(1, (now - start) / duration);
      var warm = easeOutCubic(t);
      setWarmProgress(stage, egg, warm);

      if (t < 1) {
        window.requestAnimationFrame(frame);
      } else {
        resolve();
      }
    }

    window.requestAnimationFrame(frame);
  });
}

export function startLayEggWarming(imageUrl) {
  var overlay = document.getElementById('lay-egg-warming');
  var avatarWrap = document.getElementById('warming-avatar-wrap');
  var text = document.getElementById('warming-text');
  var stage = overlay && overlay.querySelector('.lay-egg-warming__stage');
  var egg = overlay && overlay.querySelector('.lay-egg-warming__egg');
  var startTime = Date.now();
  var timers = [];
  var settled = false;
  var doneResolve;
  var progressPromise = null;

  var donePromise = new Promise(function (resolve) {
    doneResolve = resolve;
  });

  function settle() {
    if (settled) {
      return;
    }
    settled = true;
    timers.forEach(clearTimeout);
    overlay.classList.remove('is-visible');
    document.body.classList.remove('lay-egg-warming-active');
    window.setTimeout(function () {
      overlay.classList.remove('is-active');
      if (egg) {
        egg.classList.remove('is-warming');
        egg.classList.remove('is-warm');
        stage.style.removeProperty('--warm');
        egg.style.removeProperty('--warm');
      }
      doneResolve();
    }, 300);
  }

  if (!overlay || !stage || !egg || !avatarWrap || !text) {
    doneResolve();
    return {
      complete: function () {
        return Promise.resolve();
      },
      cancel: function () {}
    };
  }

  avatarWrap.innerHTML = '';

  if (imageUrl) {
    var img = document.createElement('img');
    img.className = 'lay-egg-warming__avatar';
    img.src = imageUrl;
    img.alt = '';
    avatarWrap.appendChild(img);
  } else {
    var placeholder = document.createElement('span');
    placeholder.className = 'lay-egg-warming__avatar-placeholder';
    placeholder.setAttribute('aria-hidden', 'true');
    avatarWrap.appendChild(placeholder);
  }

  text.textContent = 'Холодное яйцо...';
  text.classList.remove('is-hot');
  egg.classList.remove('is-warm');
  egg.classList.remove('is-warming');
  setWarmProgress(stage, egg, 0);
  overlay.classList.add('is-active');
  document.body.classList.add('lay-egg-warming-active');

  window.requestAnimationFrame(function () {
    window.requestAnimationFrame(function () {
      overlay.classList.add('is-visible');
      egg.classList.add('is-warming');
      text.textContent = 'Греем яйцо...';
      progressPromise = runWarmProgress(stage, egg, WARMING_MS - 500);
    });
  });

  timers.push(window.setTimeout(function () {
    if (parseFloat(egg.style.getPropertyValue('--warm') || '0') > 0.55) {
      text.textContent = 'Согревается...';
    }
  }, WARMING_MS * 0.35));

  timers.push(window.setTimeout(function () {
    text.textContent = 'Яйцо согрелось!';
    text.classList.add('is-hot');
    egg.classList.add('is-warm');
  }, WARMING_MS - 500));

  timers.push(window.setTimeout(settle, WARMING_MS));

  return {
    complete: function () {
      var remaining = WARMING_MS - (Date.now() - startTime);
      if (remaining <= 0) {
        return donePromise;
      }
      return new Promise(function (resolve) {
        window.setTimeout(function () {
          donePromise.then(resolve);
        }, remaining);
      });
    },
    cancel: function () {
      if (progressPromise) {
        progressPromise = null;
      }
      settle();
    }
  };
}
