import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getDatabase,
  onDisconnect,
  onValue,
  ref,
  remove,
  set
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js';

var config = window.FIREBASE_CONFIG;
var textEl = document.getElementById('online-text');
var heatEl = document.getElementById('online-heat');

if (!config || !config.apiKey || !config.databaseURL) {
  if (textEl) {
    textEl.hidden = true;
  }
  if (heatEl) {
    heatEl.hidden = true;
  }
} else {
  var app = getApps().length ? getApps()[0] : initializeApp(config);
  var db = getDatabase(app);
  var sessionId = crypto.randomUUID();
  var presenceRef = ref(db, 'presence/' + sessionId);
  var activeMs = 45000;
  var heartbeatMs = 20000;

  function renderCount(count) {
    if (!textEl) {
      return;
    }

    textEl.innerHTML = 'тут щас <strong>' + count + '</strong>';
    textEl.hidden = false;
    if (heatEl) {
      heatEl.hidden = false;
    }
  }

  function countOnline(snapshot) {
    var now = Date.now();
    var data = snapshot.val() || {};
    var total = 0;

    Object.keys(data).forEach(function (key) {
      if (now - data[key] < activeMs) {
        total += 1;
      }
    });

    renderCount(total);
  }

  function heartbeat() {
    return set(presenceRef, Date.now());
  }

  heartbeat().then(function () {
    onDisconnect(presenceRef).remove();
    onValue(ref(db, 'presence'), countOnline);
    setInterval(function () {
      heartbeat().catch(function () {});
    }, heartbeatMs);
  }).catch(function () {
    if (textEl) {
      textEl.hidden = true;
    }
    if (heatEl) {
      heatEl.hidden = true;
    }
  });

  window.addEventListener('pagehide', function () {
    remove(presenceRef).catch(function () {});
  });
}
