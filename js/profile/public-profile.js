import {
  getUserByUsername,
  fetchUserEggs,
  waitForAuth
} from '../firebase-app.js';
import { escapeHtml } from '../utils.js';
import { renderEggs, mapFirestoreEgg } from '../eggs.js';

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

export function renderOwnerActions(profile, actionsEl, user) {
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
}

function showEggsLoading(elements) {
  elements.eggs.innerHTML = '<p class="empty-state">Загружаем яйца...</p>';
}

function showEggsError(elements, onRetry) {
  elements.eggs.innerHTML =
    '<p class="empty-state">Не удалось загрузить яйца. ' +
    '<button class="btn btn--warm profile-eggs-retry" type="button">Повторить</button></p>';

  var retryBtn = elements.eggs.querySelector('.profile-eggs-retry');
  if (retryBtn) {
    retryBtn.addEventListener('click', onRetry);
  }
}

export async function loadProfileEggs(profile, elements, authUser) {
  showEggsLoading(elements);

  try {
    var eggs = await fetchUserEggs(profile.uid);
    var user = authUser !== undefined ? authUser : await waitForAuth();
    var isOwner = user && user.uid === profile.uid;

    var mapped = eggs.map(function (egg) {
      var card = mapFirestoreEgg(egg);
      card.ownerUsername = null;
      card.editable = isOwner;
      return card;
    });

    if (!mapped.length) {
      elements.eggs.innerHTML =
        '<p class="empty-state">' + emptyEggsMessage(isOwner) + '</p>';
      return;
    }

    renderEggs(elements.eggs, mapped);
  } catch (error) {
    console.error(error);
    showEggsError(elements, function () {
      loadProfileEggs(profile, elements, authUser);
    });
  }
}

export async function loadPublicProfile(username, elements, authUser) {
  if (!username) {
    return null;
  }

  var profile = await getUserByUsername(username);

  if (!profile) {
    return null;
  }

  renderProfileHeader(profile, elements.header);
  renderOwnerActions(profile, elements.actions, authUser);
  await loadProfileEggs(profile, elements, authUser);

  return profile;
}
