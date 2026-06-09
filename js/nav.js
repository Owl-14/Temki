import {
  auth,
  signOut,
  onAuthStateChanged,
  getUserProfile
} from './firebase-app.js';
import { escapeHtml } from './utils.js';

function renderGuestNav(slot) {
  slot.innerHTML =
    '<a class="nav__link" href="index.html#projects">Яйца</a>' +
    '<a class="btn btn--warm nav__auth-btn" href="auth.html">Погреться</a>';
}

function renderUserNav(slot, profile) {
  var avatar = profile.avatarUrl
    ? '<img class="nav__avatar" src="' + escapeHtml(profile.avatarUrl) + '" alt="">'
    : '<span class="nav__avatar nav__avatar--empty" aria-hidden="true"></span>';

  slot.innerHTML =
    '<a class="nav__link" href="index.html#projects">Яйца</a>' +
    '<div class="nav__user">' +
      '<button class="nav__user-btn" type="button" id="nav-user-btn" aria-expanded="false">' +
        avatar +
        '<span>@' + escapeHtml(profile.username) + '</span>' +
      '</button>' +
      '<div class="nav__dropdown" id="nav-dropdown" hidden>' +
        '<a href="profile.html?u=' + escapeHtml(profile.username) + '">Профиль</a>' +
        '<a href="lay-egg.html">Снести яйцо</a>' +
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

export function initNav() {
  var slot = document.getElementById('nav-auth-slot');

  if (!slot) {
    return;
  }

  onAuthStateChanged(auth, async function (user) {
    if (!user) {
      renderGuestNav(slot);
      return;
    }

    var profile = await getUserProfile(user.uid);

    if (!profile || !profile.username) {
      slot.innerHTML =
        '<a class="nav__link" href="settings.html">Дописать профиль</a>';
      return;
    }

    renderUserNav(slot, profile);
  });
}
