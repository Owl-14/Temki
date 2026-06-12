import {
  fetchLeaderboardUsers,
  fetchLeaderboardEggs,
  fetchHotEggs,
  fetchRecentlyHatched
} from '../platform/platform-api.js';
import { escapeHtml } from '../core/utils.js';
import { renderEggs, mapFirestoreEgg } from '../core/eggs.js';
import { initNav } from '../core/nav.js';

var HALL_COPY = {
  documentTitle: '\u0417\u0430\u043b \u0441\u043b\u0430\u0432\u044b \u2014 \u0418\u043d\u043a\u0443\u0431\u0430\u0442\u043e\u0440',
  navLogo: '\u0418\u043d\u043a\u0443\u0431\u0430\u0442\u043e\u0440',
  pageTitle: '\u0417\u0430\u043b \u0441\u043b\u0430\u0432\u044b',
  pageLead: '\u0422\u043e\u043f \u043f\u043e \u0442\u0435\u043f\u043b\u0443 \u2014 \u043b\u044e\u0434\u0438 \u0438 \u044f\u0439\u0446\u0430, \u0433\u043e\u0440\u044f\u0447\u0430\u044f \u043a\u0430\u043c\u0435\u0440\u0430 \u0438 \u0441\u0432\u0435\u0436\u0438\u0435 \u0432\u044b\u043b\u0443\u043f\u043b\u0435\u043d\u0438\u044f',
  usersHeading: '\u041b\u044e\u0434\u0438',
  eggsHeading: '\u042f\u0439\u0446\u0430',
  hotHeading: '\u0413\u043e\u0440\u044f\u0447\u0430\u044f \u043a\u0430\u043c\u0435\u0440\u0430',
  hotSubtitle: '\u0422\u043e\u043f \u044f\u0438\u0446 \u043f\u043e \u0442\u0435\u043f\u043b\u0443 \u0437\u0430 \u043d\u0435\u0434\u0435\u043b\u044e',
  hatchedHeading: '\u041d\u0435\u0434\u0430\u0432\u043d\u043e \u0432\u044b\u043b\u0443\u043f\u0438\u043b\u0438\u0441\u044c',
  footer: '\u0418\u043d\u043a\u0443\u0431\u0430\u0442\u043e\u0440 \u2014 \u0433\u0440\u0435\u0435\u043c \u044f\u0439\u0446\u0430 \u0434\u043e \u0432\u044b\u043b\u0443\u043f\u043b\u0435\u043d\u0438\u044f'
};

function initHallCopy() {
  document.title = HALL_COPY.documentTitle;

  var fields = [
    ['hall-nav-logo', HALL_COPY.navLogo],
    ['hall-page-title', HALL_COPY.pageTitle],
    ['hall-page-lead', HALL_COPY.pageLead],
    ['hall-users-heading', HALL_COPY.usersHeading],
    ['hall-eggs-heading', HALL_COPY.eggsHeading],
    ['hall-hot-heading', HALL_COPY.hotHeading],
    ['hall-hot-subtitle', HALL_COPY.hotSubtitle],
    ['hall-hatched-heading', HALL_COPY.hatchedHeading],
    ['hall-footer-text', HALL_COPY.footer]
  ];

  fields.forEach(function (pair) {
    var el = document.getElementById(pair[0]);
    if (el) {
      el.textContent = pair[1];
    }
  });
}

var usersEl = document.getElementById('hall-users');
var eggsEl = document.getElementById('hall-eggs');
var hotContainer = document.getElementById('hall-hot-feed');
var hatchedContainer = document.getElementById('hall-hatched-feed');

function showLoadingFeed(el, text) {
  if (!el) {
    return;
  }
  el.innerHTML = '<p class="empty-state">' + (text || 'Загружаем...') + '</p>';
}

function showEmptyFeed(el, text) {
  if (!el) {
    return;
  }
  el.innerHTML = '<p class="empty-state">' + (text || 'Пока пусто') + '</p>';
}

function showFeedError(el, retryFn) {
  if (!el) {
    return;
  }
  el.innerHTML =
    '<p class="empty-state">Не удалось загрузить. ' +
    '<button class="btn btn--warm feed-retry" type="button">Повторить</button></p>';
  var retryBtn = el.querySelector('.feed-retry');
  if (retryBtn && retryFn) {
    retryBtn.addEventListener('click', retryFn);
  }
}

function renderHallUserCard(user, index) {
  var username = user.username || '';
  var profileUrl = 'profile.html?u=' + encodeURIComponent(username);
  var avatarHtml = user.avatarUrl
    ? '<img src="' + escapeHtml(user.avatarUrl) + '" alt="">'
    : '<span class="hall-user-card__avatar-placeholder" aria-hidden="true"></span>';

  var nameHtml = '';
  var tagHtml = '';

  if (user.displayName) {
    nameHtml = '<span class="hall-user-card__name">' + escapeHtml(user.displayName) + '</span>';
    if (username) {
      tagHtml = '<span class="hall-user-card__tag">@' + escapeHtml(username) + '</span>';
    }
  } else if (username) {
    nameHtml = '<span class="hall-user-card__name hall-user-card__name--tag">@' + escapeHtml(username) + '</span>';
  }

  return '<a class="hall-user-card" href="' + escapeHtml(profileUrl) + '">' +
    '<span class="hall-user-card__rank">' + (index + 1) + '</span>' +
    '<div class="hall-user-card__avatar">' + avatarHtml + '</div>' +
    '<div class="hall-user-card__body">' +
      nameHtml +
      tagHtml +
      '<span class="hall-user-card__heat">🔥 ' + (user.heat || 0) + '</span>' +
    '</div>' +
  '</a>';
}

async function loadLeaderboards() {
  try {
    var users = await fetchLeaderboardUsers(10);
    if (!users.length) {
      usersEl.innerHTML = '<p class="empty-state">Пока пусто</p>';
    } else {
      usersEl.innerHTML = users.map(renderHallUserCard).join('');
    }

    var eggs = await fetchLeaderboardEggs(10);
    eggsEl.innerHTML = eggs.map(function (e, i) {
      return '<li><span class="hall-rank">' + (i + 1) + '</span> ' +
        '<a href="egg.html?id=' + escapeHtml(e.id) + '">' + escapeHtml(e.title) + '</a> — 🔥 ' + (e.heat || 0) +
      '</li>';
    }).join('') || '<li>Пока пусто</li>';
  } catch (error) {
    console.error(error);
    usersEl.innerHTML = '<p class="empty-state">Не удалось загрузить</p>';
    eggsEl.innerHTML = '<li>Не удалось загрузить</li>';
  }
}

async function loadHot() {
  if (!hotContainer) {
    return;
  }
  showLoadingFeed(hotContainer, 'Греем...');
  try {
    var hot = await fetchHotEggs(6);
    if (!hot.length) {
      showEmptyFeed(hotContainer, 'Пока холодно');
      return;
    }
    renderEggs(hotContainer, hot.map(mapFirestoreEgg));
  } catch (error) {
    console.error(error);
    showFeedError(hotContainer, loadHot);
  }
}

async function loadHatched() {
  if (!hatchedContainer) {
    return;
  }
  showLoadingFeed(hatchedContainer);
  try {
    var hatched = await fetchRecentlyHatched(6);
    if (!hatched.length) {
      showEmptyFeed(hatchedContainer, 'Пока пусто');
      return;
    }
    renderEggs(hatchedContainer, hatched.map(mapFirestoreEgg));
  } catch (error) {
    console.error(error);
    showFeedError(hatchedContainer, loadHatched);
  }
}

initHallCopy();
initNav();
loadLeaderboards();
loadHot();
loadHatched();
