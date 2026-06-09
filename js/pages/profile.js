import {
  auth,
  onAuthStateChanged,
  getUserByUsername,
  fetchUserEggs
} from '../firebase-app.js';
import { getQueryParam, escapeHtml } from '../utils.js';
import { initNav } from '../nav.js';
import { renderEggs, mapFirestoreEgg } from '../eggs.js';

var username = getQueryParam('u');
var profileView = document.getElementById('profile-view');
var notFound = document.getElementById('profile-not-found');
var eggsContainer = document.getElementById('profile-eggs');
var actionsEl = document.getElementById('profile-actions');

async function loadProfile() {
  if (!username) {
    profileView.hidden = true;
    notFound.hidden = false;
    return;
  }

  var profile = await getUserByUsername(username);

  if (!profile) {
    profileView.hidden = true;
    notFound.hidden = false;
    return;
  }

  notFound.hidden = true;
  profileView.hidden = false;

  document.getElementById('profile-name').textContent = profile.displayName;
  document.getElementById('profile-username').textContent = '@' + profile.username;
  document.getElementById('profile-bio').textContent = profile.bio || 'Пока без описания';

  var avatarEl = document.getElementById('profile-avatar');
  if (profile.avatarUrl) {
    avatarEl.innerHTML = '<img src="' + escapeHtml(profile.avatarUrl) + '" alt="">';
  } else {
    avatarEl.innerHTML = '<span class="avatar-placeholder avatar-placeholder--large" aria-hidden="true"></span>';
  }

  onAuthStateChanged(auth, function (user) {
    if (user && user.uid === profile.uid) {
      actionsEl.innerHTML =
        '<a class="btn btn--primary" href="lay-egg.html">' +
          '<span class="btn__shine" aria-hidden="true"></span>' +
          '<span class="btn__text">Снести яйцо</span>' +
        '</a>' +
        '<a class="btn btn--warm" href="settings.html">Настройки</a>';
    } else {
      actionsEl.innerHTML = '';
    }
  });

  var eggs = await fetchUserEggs(profile.uid);
  var mapped = eggs.map(mapFirestoreEgg);

  if (!mapped.length) {
    eggsContainer.innerHTML = '<p class="empty-state">Тут пока пусто — снеси своё</p>';
    return;
  }

  renderEggs(eggsContainer, mapped);
}

loadProfile().catch(function () {
  profileView.hidden = true;
  notFound.hidden = false;
});

initNav();
