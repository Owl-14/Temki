import {
  auth,
  onAuthStateChanged,
  getUserProfile,
  createUserProfile,
  updateUserProfile,
  uploadAvatar,
  requestPasswordReset,
  redirectIfUnverified,
  getPendingProfile,
  finalizePendingProfile
} from '../core/firebase-app.js';
import { getQueryParam, validateDisplayName, validateUsername, resizeImageFile, showMessage } from '../core/utils.js';
import { AUTH_EMAIL_RESET_SUBJECT, authEmailInboxHint } from '../core/brand.js';
import { initNav } from '../core/nav.js';

var messageEl = document.getElementById('settings-message');
var form = document.getElementById('settings-form');
var avatarPreview = document.getElementById('avatar-preview');
var avatarInput = document.getElementById('avatar-input');
var resetPasswordBtn = document.getElementById('reset-password-btn');
var currentProfile = null;
var pendingAvatarBlob = null;

function renderAvatar(url) {
  if (url) {
    avatarPreview.innerHTML = '<img src="' + url + '" alt="Аватар">';
    return;
  }
  avatarPreview.innerHTML = '<span class="avatar-placeholder" aria-hidden="true"></span>';
}

onAuthStateChanged(auth, async function (user) {
  if (!user) {
    window.location.href = 'auth.html';
    return;
  }
  if (redirectIfUnverified(user)) {
    return;
  }

  currentProfile = await getUserProfile(user.uid);

  if (!currentProfile) {
    try {
      currentProfile = await finalizePendingProfile(user);
    } catch (error) {
      if (error.message === 'USERNAME_TAKEN') {
        showMessage(messageEl, 'Этот юзернейм уже занят — выбери другой', 'error');
      } else {
        console.error(error);
      }
    }
  }

  if (currentProfile) {
    form.displayName.value = currentProfile.displayName || '';
    form.username.value = currentProfile.username || '';
    form.bio.value = currentProfile.bio || '';
    renderAvatar(currentProfile.avatarUrl);

    if (getQueryParam('done') === '1') {
      showMessage(messageEl, 'Аккаунт создан. Можно добавить аватарку.', 'success');
    }
    return;
  }

  var onboarding = getQueryParam('onboarding') === '1';
  var pending = getPendingProfile(user.uid);

  if (pending) {
    form.displayName.value = pending.displayName || '';
    form.username.value = pending.username || '';
    form.bio.value = pending.bio || '';
  }

  document.getElementById('settings-title').textContent = onboarding || pending
    ? 'Заверши профиль'
    : 'Создай профиль';
  renderAvatar(null);
});

avatarInput.addEventListener('change', async function () {
  var file = avatarInput.files[0];
  if (!file) {
    return;
  }

  try {
    pendingAvatarBlob = await resizeImageFile(file, 400);
    avatarPreview.innerHTML = '<img src="' + URL.createObjectURL(pendingAvatarBlob) + '" alt="Аватар">';
  } catch (error) {
    showMessage(messageEl, error.message, 'error');
  }
});

form.addEventListener('submit', async function (event) {
  event.preventDefault();

  var user = auth.currentUser;
  if (!user) {
    return;
  }

  var displayName = form.displayName.value.trim();
  var username = form.username.value.trim();
  var bio = form.bio.value.trim();
  var displayNameError = validateDisplayName(displayName);
  var usernameError = validateUsername(username);

  if (displayNameError) {
    showMessage(messageEl, displayNameError, 'error');
    return;
  }
  if (usernameError) {
    showMessage(messageEl, usernameError, 'error');
    return;
  }

  showMessage(messageEl, 'Сохраняем...', 'info');

  try {
    var avatarUrl = currentProfile ? currentProfile.avatarUrl : null;

    if (pendingAvatarBlob) {
      avatarUrl = await uploadAvatar(user.uid, pendingAvatarBlob);
    }

    if (!currentProfile) {
      currentProfile = await createUserProfile(user.uid, {
        displayName: displayName,
        username: username,
        bio: bio
      });

      if (pendingAvatarBlob && avatarUrl) {
        currentProfile = await updateUserProfile(user.uid, {
          displayName: displayName,
          username: username,
          bio: bio,
          avatarUrl: avatarUrl
        }, currentProfile.username);
      }
    } else {
      currentProfile = await updateUserProfile(user.uid, {
        displayName: displayName,
        username: username,
        bio: bio,
        avatarUrl: avatarUrl
      }, currentProfile.username);
    }

    showMessage(messageEl, 'Профиль сохранён', 'success');
    setTimeout(function () {
      window.location.href = 'profile.html?u=' + encodeURIComponent(currentProfile.username);
    }, 500);
  } catch (error) {
    if (error.message === 'USERNAME_TAKEN') {
      showMessage(messageEl, 'Этот юзернейм уже занят', 'error');
      return;
    }
    showMessage(messageEl, error.message || 'Не удалось сохранить', 'error');
  }
});

resetPasswordBtn.addEventListener('click', async function () {
  var user = auth.currentUser;
  if (!user || !user.email) {
    return;
  }

  try {
    await requestPasswordReset(user.email);
    showMessage(messageEl, authEmailInboxHint(AUTH_EMAIL_RESET_SUBJECT), 'success');
  } catch (error) {
    showMessage(messageEl, error.message || 'Не удалось отправить письмо', 'error');
  }
});

initNav();
