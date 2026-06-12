import {
  auth,
  signOut,
  onAuthStateChanged,
  getUserProfile
} from './firebase-app.js';
import { countUnreadNotifications } from '../platform/platform-api.js';
import { escapeHtml } from './utils.js';

var NAV_LINKS =
  '<a class="nav__link" href="chamber.html">Камера</a>' +
  '<a class="nav__link" href="index.html#hot">Горячие</a>' +
  '<a class="nav__link" href="legend.html">Легенда</a>';

function ensureNavMobileShell() {
  var nav = document.querySelector('.nav');
  if (!nav || nav.dataset.shellReady) {
    return null;
  }

  var brand = nav.querySelector('.nav__brand');
  var slot = document.getElementById('nav-auth-slot');
  if (!brand || !slot) {
    return null;
  }

  nav.dataset.shellReady = '1';

  var top = document.createElement('div');
  top.className = 'nav__top';
  nav.insertBefore(top, brand);
  top.appendChild(brand);

  var toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'nav__toggle';
  toggle.setAttribute('aria-label', 'Меню');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', 'nav-auth-slot');
  toggle.innerHTML =
    '<span class="nav__toggle-bar"></span>' +
    '<span class="nav__toggle-bar"></span>' +
    '<span class="nav__toggle-bar"></span>';
  top.appendChild(toggle);

  function closeNavMenu() {
    nav.classList.remove('nav--open');
    toggle.setAttribute('aria-expanded', 'false');
  }

  toggle.addEventListener('click', function () {
    var open = nav.classList.toggle('nav--open');
    toggle.setAttribute('aria-expanded', String(open));
  });

  document.addEventListener('click', function (event) {
    if (!nav.contains(event.target)) {
      closeNavMenu();
    }
  });

  slot.addEventListener('click', function (event) {
    if (event.target.closest('#nav-user-btn')) {
      return;
    }
    if (event.target.closest('a, button')) {
      closeNavMenu();
    }
  });

  return { nav: nav, closeNavMenu: closeNavMenu };
}

function renderGuestNav(slot) {
  slot.innerHTML = NAV_LINKS +
    '<a class="nav__link" href="index.html#projects">Яйца</a>' +
    '<a class="btn btn--warm nav__auth-btn" href="auth.html">Погреться</a>';
}

function renderUserNav(slot, profile, unread) {
  var avatar = profile.avatarUrl
    ? '<img class="nav__avatar" src="' + escapeHtml(profile.avatarUrl) + '" alt="">'
    : '<span class="nav__avatar nav__avatar--empty" aria-hidden="true"></span>';

  var bellBadge = unread > 0
    ? '<span class="nav__bell-count">' + unread + '</span>'
    : '';

  slot.innerHTML = NAV_LINKS +
    '<a class="nav__link" href="index.html#projects">Яйца</a>' +
    '<a class="nav__bell" href="notifications.html" title="Уведомления">🔔' + bellBadge + '</a>' +
    '<div class="nav__user">' +
      '<button class="nav__user-btn" type="button" id="nav-user-btn" aria-expanded="false">' +
        avatar +
        '<span>@' + escapeHtml(profile.username) + '</span>' +
      '</button>' +
      '<div class="nav__dropdown" id="nav-dropdown" hidden>' +
        '<a href="profile.html?u=' + escapeHtml(profile.username) + '">Профиль</a>' +
        '<a href="my-eggs.html">Мои яйца</a>' +
        '<a href="lay-egg.html">Снести яйцо</a>' +
        '<a href="activity.html">Активность</a>' +
        '<a href="hall.html">Зал славы</a>' +
        '<a href="investors.html">Инвесторам</a>' +
        '<a href="settings.html">Настройки</a>' +
        '<button type="button" id="nav-logout-btn">Выйти</button>' +
      '</div>' +
    '</div>';

  var userBtn = document.getElementById('nav-user-btn');
  var dropdown = document.getElementById('nav-dropdown');
  var logoutBtn = document.getElementById('nav-logout-btn');

  userBtn.addEventListener('click', function () {
    var isOpen = !dropdown.hidden;
    dropdown.hidden = isOpen;
    userBtn.setAttribute('aria-expanded', String(!isOpen));
  });

  document.addEventListener('click', function (event) {
    if (!slot.contains(event.target)) {
      dropdown.hidden = true;
      userBtn.setAttribute('aria-expanded', 'false');
    }
  });

  logoutBtn.addEventListener('click', function () {
    signOut(auth).then(function () {
      window.location.href = 'index.html';
    });
  });
}

export async function refreshNavBadge(uid) {
  if (!uid) {
    return;
  }

  var bell = document.querySelector('.nav__bell');
  if (!bell) {
    return;
  }

  var unread = 0;
  try {
    unread = await countUnreadNotifications(uid);
  } catch (e) {
    console.error(e);
    return;
  }

  var badge = bell.querySelector('.nav__bell-count');
  if (unread > 0) {
    if (badge) {
      badge.textContent = String(unread);
    } else {
      bell.insertAdjacentHTML('beforeend', '<span class="nav__bell-count">' + unread + '</span>');
    }
    return;
  }

  if (badge) {
    badge.remove();
  }
}

export function initNav() {
  var slot = document.getElementById('nav-auth-slot');

  if (!slot) {
    return;
  }

  ensureNavMobileShell();

  onAuthStateChanged(auth, async function (user) {
    if (!user) {
      renderGuestNav(slot);
      return;
    }

    var profile = await getUserProfile(user.uid);

    if (!profile || !profile.username) {
      slot.innerHTML = NAV_LINKS +
        '<a class="nav__link" href="settings.html">Дописать профиль</a>';
      return;
    }

    var unread = 0;
    try {
      unread = await countUnreadNotifications(user.uid);
    } catch (e) {
      console.error(e);
    }

    renderUserNav(slot, profile, unread);

    if (document.getElementById('notifications-list')) {
      refreshNavBadge(user.uid);
    }
  });

  window.addEventListener('pageshow', function () {
    if (auth.currentUser) {
      refreshNavBadge(auth.currentUser.uid);
    }
  });
}
