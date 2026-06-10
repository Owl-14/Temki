import { fetchLeaderboardUsers, fetchLeaderboardEggs } from '../platform/platform-api.js';
import { escapeHtml } from '../core/utils.js';
import { initNav } from '../core/nav.js';

var usersEl = document.getElementById('hall-users');
var eggsEl = document.getElementById('hall-eggs');

async function load() {
  try {
    var users = await fetchLeaderboardUsers(10);
    usersEl.innerHTML = users.map(function (u, i) {
      return '<li><span class="hall-rank">' + (i + 1) + '</span> ' +
        '<a href="profile.html?u=' + escapeHtml(u.username) + '">@' + escapeHtml(u.username) + '</a> — 🔥 ' + (u.heat || 0) +
      '</li>';
    }).join('') || '<li>Пока пусто</li>';

    var eggs = await fetchLeaderboardEggs(10);
    eggsEl.innerHTML = eggs.map(function (e, i) {
      return '<li><span class="hall-rank">' + (i + 1) + '</span> ' +
        '<a href="egg.html?id=' + escapeHtml(e.id) + '">' + escapeHtml(e.title) + '</a> — 🔥 ' + (e.heat || 0) +
      '</li>';
    }).join('') || '<li>Пока пусто</li>';
  } catch (error) {
    console.error(error);
    usersEl.innerHTML = '<li>Ошибка загрузки</li>';
    eggsEl.innerHTML = '<li>Ошибка загрузки</li>';
  }
}

initNav();
load();
