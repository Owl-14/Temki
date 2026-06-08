import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getDatabase,
  onDisconnect,
  onValue,
  ref,
  remove,
  set
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js';

var config = window.FIREBASE_CONFIG;
var counter = document.getElementById('online-counter');
var countEl = document.getElementById('online-count');
var labelEl = document.getElementById('online-label');

if (!config || !config.apiKey || !config.databaseURL) {
  if (counter) {
    counter.hidden = true;
  }
} else {
  var app = initializeApp(config);
  var db = getDatabase(app);
  var sessionId = crypto.randomUUID();
  var presenceRef = ref(db, 'presence/' + sessionId);
  var activeMs = 45000;
  var heartbeatMs = 20000;

  function pluralize(count) {
    var mod10 = count % 10;
    var mod100 = count % 100;

    if (mod100 >= 11 && mod100 <= 19) {
      return 'человек';
    }
    if (mod10 === 1) {
      return 'человек';
    }
    if (mod10 >= 2 && mod10 <= 4) {
      return 'человека';
    }
    return 'человек';
  }

  function renderCount(count) {
    if (!countEl || !labelEl) {
      return;
    }

    countEl.textContent = String(count);
    labelEl.textContent = 'Сейчас на сайте ' + pluralize(count) + ':';
    if (counter) {
      counter.hidden = false;
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
    if (counter) {
      counter.hidden = true;
    }
  });

  window.addEventListener('pagehide', function () {
    remove(presenceRef).catch(function () {});
  });
}
