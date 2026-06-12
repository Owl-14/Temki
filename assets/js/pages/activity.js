import { auth, onAuthStateChanged, redirectIfUnverified } from '../core/firebase-app.js';
import { fetchFollowedActivity, toggleFollow } from '../platform/platform-api.js';
import { escapeHtml, formatDate } from '../core/utils.js';
import { initNav } from '../core/nav.js';

var feed = document.getElementById('activity-feed');
var subscriptionsSection = document.getElementById('activity-subscriptions');
var followingList = document.getElementById('activity-following-list');
var currentUid = null;

function showLoading() {
  if (feed) {
    feed.innerHTML = '<p class="empty-state">Загружаем...</p>';
  }
}

function renderFollowingList(follows) {
  if (!subscriptionsSection || !followingList) {
    return;
  }

  if (!follows.length) {
    subscriptionsSection.hidden = true;
    followingList.innerHTML = '';
    return;
  }

  subscriptionsSection.hidden = false;
  followingList.innerHTML = follows.map(function (f) {
    var username = f.targetUsername || 'user';
    return '<li class="activity-following-item">' +
      '<a class="activity-following-item__user" href="profile.html?u=' + encodeURIComponent(username) + '">@' +
        escapeHtml(username) +
      '</a>' +
      '<button type="button" class="btn btn--ghost btn--sm activity-unfollow-btn" data-target-uid="' +
        escapeHtml(f.targetUid) + '" data-target-username="' + escapeHtml(username) + '">' +
        'Отписаться' +
      '</button>' +
    '</li>';
  }).join('');

  followingList.querySelectorAll('.activity-unfollow-btn').forEach(function (btn) {
    btn.addEventListener('click', async function () {
      if (!currentUid || btn.disabled) {
        return;
      }
      btn.disabled = true;
      try {
        await toggleFollow(currentUid, btn.getAttribute('data-target-uid'), btn.getAttribute('data-target-username'));
        await loadActivity();
      } catch (error) {
        console.error(error);
        btn.disabled = false;
      }
    });
  });
}

function renderFeed(events) {
  if (!feed) {
    return;
  }

  if (!events.length) {
    feed.innerHTML =
      '<p class="empty-state">Пока нет обновлений. Подпишись на основателей в их профилях — ' +
      'здесь появятся вехи, вылупления и новые яйца.</p>' +
      '<p class="activity-feed__hint"><a class="btn btn--warm" href="chamber.html">Открыть камеру</a></p>';
    return;
  }

  feed.innerHTML = events.map(function (e) {
    var userLine = e.ownerUsername
      ? '<a class="activity-item__user" href="profile.html?u=' + encodeURIComponent(e.ownerUsername) + '">@' +
          escapeHtml(e.ownerUsername) + '</a>'
      : '';
    var eggLine = '<a class="activity-item__egg" href="egg.html?id=' + encodeURIComponent(e.eggId) + '">' +
      escapeHtml(e.eggTitle || 'Яйцо') + '</a>';
    return '<article class="activity-item">' +
      '<p class="activity-item__meta">' + userLine + ' · ' + eggLine + '</p>' +
      '<p class="activity-item__message">' + escapeHtml(e.message || 'Обновление') + '</p>' +
      '<time>' + escapeHtml(formatDate(e.createdAt)) + '</time>' +
    '</article>';
  }).join('');
}

async function loadActivity() {
  if (!currentUid) {
    return;
  }
  showLoading();
  try {
    var data = await fetchFollowedActivity(currentUid, 30);
    renderFollowingList(data.follows);
    renderFeed(data.events);
  } catch (error) {
    console.error(error);
    if (feed) {
      feed.innerHTML =
        '<p class="empty-state">Не удалось загрузить. ' +
        '<button type="button" class="btn btn--warm" id="activity-retry">Повторить</button></p>';
      var retry = document.getElementById('activity-retry');
      if (retry) {
        retry.addEventListener('click', loadActivity);
      }
    }
  }
}

onAuthStateChanged(auth, function (user) {
  if (!user) {
    window.location.href = 'auth.html';
    return;
  }
  if (redirectIfUnverified(user)) {
    return;
  }
  currentUid = user.uid;
  loadActivity();
});

initNav();
