import { auth, onAuthStateChanged } from '../core/firebase-app.js';
import { fetchNotifications, markNotificationRead } from '../platform/platform-api.js';
import { escapeHtml, formatDate } from '../core/utils.js';
import { initNav } from '../core/nav.js';

var list = document.getElementById('notifications-list');

async function load(user) {
  list.innerHTML = '<p class="empty-state">Загружаем...</p>';
  try {
    var items = await fetchNotifications(user.uid);
    if (!items.length) {
      list.innerHTML = '<p class="empty-state">Пока тихо в инкубаторе</p>';
      return;
    }
    list.innerHTML = items.map(function (n) {
      var link = n.eggId ? 'egg.html?id=' + encodeURIComponent(n.eggId) : '#';
      var unread = n.read ? '' : ' notification-item--unread';
      return '<article class="notification-item' + unread + '" data-id="' + escapeHtml(n.id) + '">' +
        '<a href="' + link + '">' + escapeHtml(n.text) + '</a>' +
        '<time>' + escapeHtml(formatDate(n.createdAt)) + '</time>' +
      '</article>';
    }).join('');

    list.querySelectorAll('.notification-item--unread').forEach(function (el) {
      el.addEventListener('click', function () {
        var id = el.getAttribute('data-id');
        markNotificationRead(id).catch(console.error);
      });
    });
  } catch (error) {
    console.error(error);
    list.innerHTML = '<p class="empty-state">Не удалось загрузить</p>';
  }
}

onAuthStateChanged(auth, function (user) {
  if (!user) {
    window.location.href = 'auth.html';
    return;
  }
  load(user);
});

initNav();
