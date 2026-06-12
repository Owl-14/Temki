import { initNav } from '../core/nav.js';
import { getQueryParam } from '../core/utils.js';

function resolveBackHref() {
  var from = getQueryParam('from');
  if (from && !/^([a-z]+:)?\/\//i.test(from)) {
    return from;
  }

  if (document.referrer) {
    try {
      var ref = new URL(document.referrer);
      if (ref.origin === window.location.origin) {
        var pagesIdx = ref.pathname.indexOf('/pages/');
        if (pagesIdx !== -1) {
          return ref.pathname.slice(pagesIdx + 7) + ref.search + ref.hash;
        }
      }
    } catch (err) {
      // ignore bad referrer
    }
  }

  return 'index.html';
}

var backLink = document.getElementById('hatch-rules-back');
if (backLink) {
  backLink.href = resolveBackHref();
}

initNav();
