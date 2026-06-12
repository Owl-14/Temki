import {
  getUserByUsername,
  fetchUserEggs,
  deleteEgg,
  waitForAuth
} from '../core/firebase-app.js';
import { fetchUserBadges, toggleFollow, isFollowing, fetchFollowerCount } from '../platform/platform-api.js';
import { renderBadges } from '../platform/egg-sections.js';
import { escapeHtml } from '../core/utils.js';
import { confirmDeleteEgg } from '../core/confirm-modal.js';
import { renderEggs, mapFirestoreEgg } from '../core/eggs.js';

export function emptyEggsMessage(isOwner) {
  if (isOwner) {
    return 'Тут пока пусто — снеси своё';
  }
  return 'Тут пока нет яиц';
}

export function formatFollowerCount(count) {
  var n = Math.max(0, Number(count) || 0);
  var abs = n % 100;
  var last = abs % 10;

  if (abs > 10 && abs < 20) {
    return n + ' подписчиков';
  }
  if (last === 1) {
    return n + ' подписчик';
  }
  if (last >= 2 && last <= 4) {
    return n + ' подписчика';
  }
  return n + ' подписчиков';
}

export function renderProfileHeader(profile, elements) {
  document.title = profile.displayName + ' — Инкубатор';

  elements.name.textContent = profile.displayName;
  elements.username.textContent = '@' + profile.username;
  elements.bio.textContent = profile.bio || 'Пока без описания';

  if (elements.heat) {
    if (profile.heat) {
      elements.heat.hidden = false;
      elements.heat.textContent = '🔥 Тепло: ' + profile.heat;
    } else {
      elements.heat.hidden = true;
    }
  }

  if (profile.avatarUrl) {
    elements.avatar.innerHTML = '<img src="' + escapeHtml(profile.avatarUrl) + '" alt="">';
  } else {
    elements.avatar.innerHTML =
      '<span class="avatar-placeholder avatar-placeholder--large" aria-hidden="true"></span>';
  }
}

export async function loadProfileBadges(uid, badgesEl) {
  if (!badgesEl) {
    return;
  }
  try {
    var badges = await fetchUserBadges(uid);
    badgesEl.innerHTML = renderBadges(badges);
  } catch (e) {
    console.error(e);
  }
}

export async function loadProfileFollowerCount(uid, followersEl) {
  if (!followersEl) {
    return null;
  }

  followersEl.hidden = false;
  followersEl.textContent = '…';

  try {
    var count = await fetchFollowerCount(uid);
    followersEl.textContent = formatFollowerCount(count);
    return count;
  } catch (error) {
    console.error(error);
    followersEl.hidden = true;
    return null;
  }
}

export async function renderOwnerActions(profile, actionsEl, user, options) {
  if (user && user.uid === profile.uid) {
    actionsEl.innerHTML =
      '<a class="btn btn--primary" href="lay-egg.html">' +
        '<span class="btn__shine" aria-hidden="true"></span>' +
        '<span class="btn__text">Снести яйцо</span>' +
      '</a>' +
      '<a class="btn btn--warm" href="my-eggs.html">Мои яйца</a>' +
      '<a class="btn btn--warm" href="settings.html">Настройки</a>';
    return;
  }

  if (!user) {
    actionsEl.innerHTML = '<a class="btn btn--warm" href="auth.html">Погреться, чтобы подписаться</a>';
    return;
  }

  var following = await isFollowing(user.uid, profile.uid);
  actionsEl.innerHTML =
    '<button type="button" class="btn btn--warm" id="follow-btn">' +
      (following ? 'Отписаться' : 'Подписаться') +
    '</button>';

  document.getElementById('follow-btn').addEventListener('click', async function () {
    var result = await toggleFollow(user.uid, profile.uid, profile.username);
    document.getElementById('follow-btn').textContent = result.following ? 'Отписаться' : 'Подписаться';
    if (options && typeof options.onFollowChange === 'function') {
      await options.onFollowChange();
    }
  });
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
    bindOwnerEggActions(elements.eggs, profile, user, function () {
      return loadProfileEggs(profile, elements, user);
    });
  } catch (error) {
    console.error(error);
    showEggsError(elements, function () {
      loadProfileEggs(profile, elements, authUser);
    });
  }
}

export function bindOwnerEggActions(eggsContainer, profile, authUser, onChanged) {
  if (!eggsContainer || eggsContainer.dataset.deleteBound === '1') {
    return;
  }

  eggsContainer.dataset.deleteBound = '1';

  eggsContainer.addEventListener('click', async function (event) {
    var button = event.target.closest('[data-action="delete-egg"]');

    if (!button || button.disabled) {
      return;
    }

    if (!authUser || authUser.uid !== profile.uid) {
      return;
    }

    var eggId = button.getAttribute('data-egg-id');

    if (!eggId) {
      return;
    }

    var confirmed = await confirmDeleteEgg();
    if (!confirmed) {
      return;
    }

    button.disabled = true;

    try {
      await deleteEgg(eggId, authUser.uid);
      await onChanged();
    } catch (error) {
      console.error(error);
      button.disabled = false;
      window.alert('Не удалось удалить яйцо');
    }
  });
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
  await loadProfileBadges(profile.uid, elements.badges);
  await loadProfileFollowerCount(profile.uid, elements.header.followers);
  await renderOwnerActions(profile, elements.actions, authUser, {
    onFollowChange: function () {
      return loadProfileFollowerCount(profile.uid, elements.header.followers);
    }
  });
  await loadProfileEggs(profile, elements, authUser);

  return profile;
}
