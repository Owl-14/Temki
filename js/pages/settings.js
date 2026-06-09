import {
  auth,
  onAuthStateChanged,
  getUserProfile,
  createUserProfile,
  updateUserProfile,
  uploadAvatar,
  sendPasswordResetEmail
} from '../firebase-app.js';
import { getQueryParam, validateUsername, resizeImageFile, showMessage } from '../utils.js';
import { initNav } from '../nav.js';

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

  currentProfile = await getUserProfile(user.uid);
  var onboarding = getQueryParam('onboarding') === '1';

  if (!currentProfile) {
    document.getElementById('settings-title').textContent = onboarding
      ? 'Допиши профиль'
      : 'Создай профиль';
    renderAvatar(null);
    return;
  }

  form.displayName.value = currentProfile.displayName || '';
  form.username.value = currentProfile.username || '';
  form.bio.value = currentProfile.bio || '';
  renderAvatar(currentProfile.avatarUrl);

  if (getQueryParam('done') === '1') {
    showMessage(messageEl, 'Аккаунт создан. Можно добавить аватарку.', 'success');
  }
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
  var usernameError = validateUsername(username);

  if (!displayName) {
    showMessage(messageEl, 'Введи имя', 'error');
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
    await sendPasswordResetEmail(auth, user.email);
    showMessage(messageEl, 'Письмо для сброса пароля отправлено', 'success');
  } catch (error) {
    showMessage(messageEl, error.message, 'error');
  }
});

initNav();
