import {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  getUserProfile,
  createUserProfile
} from '../firebase-app.js';
import { validateUsername, showMessage } from '../utils.js';
import { initNav } from '../nav.js';

var messageEl = document.getElementById('auth-message');
var loginForm = document.getElementById('login-form');
var registerForm = document.getElementById('register-form');
var tabs = document.querySelectorAll('[data-auth-tab]');
var panels = document.querySelectorAll('[data-auth-panel]');

function switchAuthTab(target) {
  tabs.forEach(function (item) {
    item.classList.toggle('is-active', item.getAttribute('data-auth-tab') === target);
  });
  panels.forEach(function (panel) {
    panel.hidden = panel.getAttribute('data-auth-panel') !== target;
  });
}

tabs.forEach(function (tab) {
  tab.addEventListener('click', function () {
    switchAuthTab(tab.getAttribute('data-auth-tab'));
  });
});

switchAuthTab('login');

loginForm.addEventListener('submit', async function (event) {
  event.preventDefault();
  showMessage(messageEl, 'Входим...', 'info');

  try {
    var email = loginForm.email.value.trim();
    var password = loginForm.password.value;
    var cred = await signInWithEmailAndPassword(auth, email, password);
    var profile = await getUserProfile(cred.user.uid);

    if (!profile || !profile.username) {
      window.location.href = 'settings.html?onboarding=1';
      return;
    }

    window.location.href = 'profile.html?u=' + encodeURIComponent(profile.username);
  } catch (error) {
    showMessage(messageEl, mapAuthError(error), 'error');
  }
});

registerForm.addEventListener('submit', async function (event) {
  event.preventDefault();
  showMessage(messageEl, 'Создаём аккаунт...', 'info');

  var displayName = registerForm.displayName.value.trim();
  var username = registerForm.username.value.trim();
  var usernameError = validateUsername(username);

  if (!displayName) {
    showMessage(messageEl, 'Введи имя', 'error');
    return;
  }
  if (usernameError) {
    showMessage(messageEl, usernameError, 'error');
    return;
  }

  try {
    var email = registerForm.email.value.trim();
    var password = registerForm.password.value;

    if (password.length < 8) {
      showMessage(messageEl, 'Пароль минимум 8 символов', 'error');
      return;
    }

    var cred = await createUserWithEmailAndPassword(auth, email, password);
    var profile = await createUserProfile(cred.user.uid, {
      displayName: displayName,
      username: username,
      bio: registerForm.bio.value
    });

    window.location.href = 'settings.html?onboarding=1&done=1&u=' + encodeURIComponent(profile.username);
  } catch (error) {
    showMessage(messageEl, mapAuthError(error), 'error');
  }
});

function mapAuthError(error) {
  if (error.message === 'USERNAME_TAKEN') {
    return 'Этот юзернейм уже занят';
  }
  if (error.code === 'auth/email-already-in-use') {
    return 'Email уже зарегистрирован';
  }
  if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
    return 'Неверный email или пароль';
  }
  if (error.code === 'auth/weak-password') {
    return 'Слишком слабый пароль';
  }
  return error.message || 'Что-то пошло не так';
}

initNav();
