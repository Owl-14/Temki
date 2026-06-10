import { auth, onAuthStateChanged } from '../core/firebase-app.js';
import { fetchFollowing } from '../platform/platform-api.js';
import { db } from '../core/firebase-app.js';
import { collection, query, where, limit, getDocs } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { escapeHtml, formatDate } from '../core/utils.js';
import { initNav } from '../core/nav.js';

var feed = document.getElementById('activity-feed');

async function fetchRecentActivity() {
  var q = query(collection(db, 'egg_updates'), limit(50));
  var snap = await getDocs(q);
  return snap.docs.map(function (d) {
    return Object.assign({ id: d.id }, d.data());
  }).filter(function (e) {
    return e.type === 'hatched' || e.type === 'milestone' || e.type === 'status';
  }).sort(function (a, b) {
    var aT = a.createdAt && a.createdAt.toMillis ? a.createdAt.toMillis() : 0;
    var bT = b.createdAt && b.createdAt.toMillis ? b.createdAt.toMillis() : 0;
    return bT - aT;
  }).slice(0, 30);
}

onAuthStateChanged(auth, async function (user) {
  if (!user) {
    window.location.href = 'auth.html';
    return;
  }
  feed.innerHTML = '<p class="empty-state">Загружаем...</p>';
  try {
    await fetchFollowing(user.uid);
    var events = await fetchRecentActivity();
    if (!events.length) {
      feed.innerHTML = '<p class="empty-state">Пока нет событий</p>';
      return;
    }
    feed.innerHTML = events.map(function (e) {
      return '<article class="activity-item">' +
        '<a href="egg.html?id=' + encodeURIComponent(e.eggId) + '">' + escapeHtml(e.message) + '</a>' +
        '<time>' + escapeHtml(formatDate(e.createdAt)) + '</time>' +
      '</article>';
    }).join('');
  } catch (error) {
    console.error(error);
    feed.innerHTML = '<p class="empty-state">Не удалось загрузить</p>';
  }
});

initNav();
