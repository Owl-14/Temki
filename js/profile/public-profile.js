import {
  auth,
  onAuthStateChanged,
  getUserByUsername,
  fetchUserEggs,
  waitForAuth
} from '../firebase-app.js';
import { escapeHtml } from '../utils.js';
import { renderEggs, mapFirestoreEgg } from '../eggs.js?v=3';

export function emptyEggsMessage(isOwner) {
  if (isOwner) {
    return 'Тут пока пусто — снеси своё';
  }
  return 'Тут пока нет яиц';
}

export function renderProfileHeader(profile, elements) {
  document.title = profile.displayName + ' — Инкубатор';

  elements.name.textContent = profile.displayName;
  elements.username.textContent = '@' + profile.username;
  elements.bio.textContent = profile.bio || 'Пока без описания';

  if (profile.avatarUrl) {
    elements.avatar.innerHTML = '<img src="' + escapeHtml(profile.avatarUrl) + '" alt="">';
  } else {
    elements.avatar.innerHTML =
      '<span class="avatar-placeholder avatar-placeholder--large" aria-hidden="true"></span>';
  }
}

export function bindOwnerActions(profile, actionsEl) {
  onAuthStateChanged(auth, function (user) {
    if (user && user.uid === profile.uid) {
      actionsEl.innerHTML =
        '<a class="btn btn--primary" href="lay-egg.html">' +
          '<span class="btn__shine" aria-hidden="true"></span>' +
          '<span class="btn__text">Снести яйцо</span>' +
        '</a>' +
        '<a class="btn btn--warm" href="settings.html">Настройки</a>';
      return;
    }

    actionsEl.innerHTML = '';
  });
}

export async function loadPublicProfile(username, elements) {
  if (!username) {
    return null;
  }

  var profile = await getUserByUsername(username);

  if (!profile) {
    return null;
  }

  renderProfileHeader(profile, elements.header);
  bindOwnerActions(profile, elements.actions);

  var eggs = await fetchUserEggs(profile.uid);
  var mapped = eggs.map(function (egg) {
    var card = mapFirestoreEgg(egg);
    card.ownerUsername = null;
    return card;
  });

  if (!mapped.length) {
    var user = await waitForAuth();
    var isOwner = user && user.uid === profile.uid;
    elements.eggs.innerHTML =
      '<p class="empty-state">' + emptyEggsMessage(isOwner) + '</p>';
    return profile;
  }

  renderEggs(elements.eggs, mapped);
  return profile;
}
