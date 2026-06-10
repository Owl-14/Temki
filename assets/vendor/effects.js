(function () {
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function bindTilt(root) {
    if (prefersReducedMotion) {
      return;
    }

    var scope = root || document;
    scope.querySelectorAll('[data-tilt]').forEach(function (card) {
      if (card.dataset.tiltBound === '1') {
        return;
      }
      card.dataset.tiltBound = '1';

      card.addEventListener('mousemove', function (event) {
        var rect = card.getBoundingClientRect();
        var x = event.clientX - rect.left;
        var y = event.clientY - rect.top;
        var rotateX = ((y / rect.height) - 0.5) * -7;
        var rotateY = ((x / rect.width) - 0.5) * 7;

        card.style.transform = 'perspective(900px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) translateY(-5px)';
      });

      card.addEventListener('mouseleave', function () {
        card.style.transform = '';
      });
    });
  }

  window.initEggTilt = bindTilt;
  bindTilt(document);
})();
