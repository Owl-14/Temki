import {
  auth,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  requestPasswordReset,
  requestEmailVerification,
  reloadAuthUser,
  needsEmailVerification,
  getUserProfile,
  savePendingProfile,
  getPendingProfile,
  fetchPendingProfile,
  finalizePendingProfile
} from '../core/firebase-app.js';
import {
  validateDisplayName,
  validateUsername,
  validateEmail,
  validatePassword,
  setFormFieldError,
  clearFormFieldErrors,
  showMessage
} from '../core/utils.js';
import {
  AUTH_EMAIL_VERIFY_SUBJECT,
  AUTH_EMAIL_RESET_SUBJECT,
  authEmailInboxHint
} from '../core/brand.js';
import { initNav } from '../core/nav.js';

var messageEl = document.getElementById('auth-message');
var loginForm = document.getElementById('login-form');
var registerForm = document.getElementById('register-form');
var resetForm = document.getElementById('reset-form');
var verifyPanel = document.getElementById('auth-verify-panel');
var verifyEmailEl = document.getElementById('verify-email');
var verifyResendBtn = document.getElementById('verify-resend-btn');
var verifyResendBtnText = verifyResendBtn
  ? verifyResendBtn.querySelector('.btn__text')
  : null;
var verifyResendCooldownTimer = null;
var VERIFY_RESEND_COOLDOWN_SEC = 60;
var VERIFY_RESEND_COOLDOWN_KEY = 'auth_verify_resend_until';
var verifyResendDefaultLabel = verifyResendBtnText
  ? verifyResendBtnText.textContent.trim()
  : 'Отправить ещё раз';
var verifyCheckBtn = document.getElementById('verify-check-btn');
var verifyLogoutBtn = document.getElementById('verify-logout-btn');
var forgotBtn = document.getElementById('auth-forgot-btn');
var resetBackBtn = document.getElementById('reset-back-btn');
var tabs = document.querySelectorAll('[data-auth-tab]');
var panels = document.querySelectorAll('[data-auth-panel]');
var authTabsEl = document.querySelector('.auth-tabs');

function bindLiveFieldValidation(form, fieldDefs) {
  var touched = {};

  fieldDefs.forEach(function (def) {
    touched[def.name] = false;
    var input = form.elements[def.name];
    if (!input) {
      return;
    }

    function runValidate(force) {
      var value = input.value;
      var hasContent = typeof value === 'string' ? value.trim().length > 0 : value.length > 0;

      if (!force && !touched[def.name] && !hasContent) {
        setFormFieldError(form, def.name, null);
        return null;
      }

      var err = def.validate(input);
      setFormFieldError(form, def.name, err);
      return err;
    }

    input.addEventListener('input', function () {
      touched[def.name] = true;
      runValidate(true);
    });

    input.addEventListener('blur', function () {
      touched[def.name] = true;
      runValidate(true);
    });
  });

  return {
    touchAll: function () {
      fieldDefs.forEach(function (def) {
        touched[def.name] = true;
      });
    },
    validateAll: function () {
      fieldDefs.forEach(function (def) {
        touched[def.name] = true;
      });

      var firstInvalid = null;
      var hasError = false;

      fieldDefs.forEach(function (def) {
        var input = form.elements[def.name];
        if (!input) {
          return;
        }
        var err = def.validate(input);
        setFormFieldError(form, def.name, err);
        if (err && !firstInvalid) {
          firstInvalid = def.name;
        }
        if (err) {
          hasError = true;
        }
      });

      return { hasError: hasError, firstInvalid: firstInvalid };
    }
  };
}

function getRegisterValues() {
  return {
    displayName: registerForm.displayName.value.trim(),
    username: registerForm.username.value.trim(),
    email: registerForm.email.value.trim().toLowerCase(),
    password: registerForm.password.value
  };
}

var registerValidation = bindLiveFieldValidation(registerForm, [
  {
    name: 'displayName',
    validate: function () {
      return validateDisplayName(getRegisterValues().displayName);
    }
  },
  {
    name: 'username',
    validate: function () {
      return validateUsername(getRegisterValues().username, 'Тег');
    }
  },
  {
    name: 'email',
    validate: function () {
      return validateEmail(getRegisterValues().email);
    }
  },
  {
    name: 'password',
    validate: function (input) {
      return validatePassword(input.value);
    }
  }
]);

var loginValidation = bindLiveFieldValidation(loginForm, [
  {
    name: 'email',
    validate: function (input) {
      return validateEmail(input.value.trim());
    }
  },
  {
    name: 'password',
    validate: function (input) {
      if (!input.value) {
        return 'Введи пароль';
      }
      return null;
    }
  }
]);

var resetValidation = bindLiveFieldValidation(resetForm, [
  {
    name: 'email',
    validate: function (input) {
      return validateEmail(input.value.trim());
    }
  }
]);

function switchAuthTab(target) {
  authTabsEl.hidden = target === 'reset' || target === 'verify';
  tabs.forEach(function (item) {
    item.classList.toggle('is-active', item.getAttribute('data-auth-tab') === target);
  });
  panels.forEach(function (panel) {
    panel.hidden = panel.getAttribute('data-auth-panel') !== target;
  });

  if (target === 'login') {
    clearFormFieldErrors(registerForm);
  }
  if (target === 'register') {
    clearFormFieldErrors(loginForm);
  }
}

function getVerifyResendUntil() {
  try {
    var until = parseInt(localStorage.getItem(VERIFY_RESEND_COOLDOWN_KEY), 10);
    return until > Date.now() ? until : 0;
  } catch (error) {
    return 0;
  }
}

function setVerifyResendUntil(until) {
  try {
    if (until > Date.now()) {
      localStorage.setItem(VERIFY_RESEND_COOLDOWN_KEY, String(until));
    } else {
      localStorage.removeItem(VERIFY_RESEND_COOLDOWN_KEY);
    }
  } catch (error) {
    /* ignore */
  }
}

function updateVerifyResendCooldownUI(until) {
  if (!verifyResendBtn) {
    return;
  }

  if (verifyResendCooldownTimer) {
    clearInterval(verifyResendCooldownTimer);
    verifyResendCooldownTimer = null;
  }

  function tick() {
    var leftSec = Math.ceil((until - Date.now()) / 1000);
    if (leftSec <= 0) {
      verifyResendBtn.disabled = false;
      if (verifyResendBtnText) {
        verifyResendBtnText.textContent = verifyResendDefaultLabel;
      }
      setVerifyResendUntil(0);
      if (verifyResendCooldownTimer) {
        clearInterval(verifyResendCooldownTimer);
        verifyResendCooldownTimer = null;
      }
      return;
    }

    verifyResendBtn.disabled = true;
    if (verifyResendBtnText) {
      verifyResendBtnText.textContent = 'Отправить через ' + leftSec + ' сек';
    }
  }

  tick();
  verifyResendCooldownTimer = setInterval(tick, 1000);
}

function startVerifyResendCooldown(seconds) {
  var duration = typeof seconds === 'number' ? seconds : VERIFY_RESEND_COOLDOWN_SEC;
  var until = Date.now() + duration * 1000;
  setVerifyResendUntil(until);
  updateVerifyResendCooldownUI(until);
}

function restoreVerifyResendCooldown() {
  var until = getVerifyResendUntil();
  if (until) {
    updateVerifyResendCooldownUI(until);
    return true;
  }
  return false;
}

function showVerifyPanel(email) {
  if (verifyEmailEl) {
    verifyEmailEl.textContent = email || '';
  }
  switchAuthTab('verify');
  restoreVerifyResendCooldown();
}

async function continueAfterAuth(user) {
  if (needsEmailVerification(user)) {
    showVerifyPanel(user.email);
    return;
  }

  try {
    var profile = await finalizePendingProfile(user);
    if (!profile) {
      profile = await getUserProfile(user.uid);
    }

    if (!profile || !profile.username) {
      window.location.href = 'settings.html?onboarding=1';
      return;
    }

    window.location.href = 'profile.html?u=' + encodeURIComponent(profile.username);
  } catch (error) {
    console.error(error);
    if (error.message === 'USERNAME_TAKEN') {
      var pending = await fetchPendingProfile(user.uid);
      showMessage(
        messageEl,
        'Тег @' + (pending && pending.username ? pending.username : '') + ' уже занят — выбери другой в настройках',
        'error'
      );
    } else {
      showMessage(messageEl, 'Не удалось создать профиль — допиши данные в настройках', 'error');
    }
    window.location.href = 'settings.html?onboarding=1';
  }
}

async function completeEmailVerification(user) {
  try {
    var profile = await finalizePendingProfile(user);
    if (profile) {
      showMessage(messageEl, 'Email подтверждён — профиль создан!', 'success');
      window.location.href = 'profile.html?u=' + encodeURIComponent(profile.username);
      return true;
    }
    showMessage(messageEl, 'Email подтверждён!', 'success');
    await continueAfterAuth(user);
    return true;
  } catch (error) {
    if (error.message === 'USERNAME_TAKEN') {
      var pending = await fetchPendingProfile(user.uid);
      showMessage(
        messageEl,
        'Email подтверждён, но @' + (pending && pending.username ? pending.username : 'username') + ' уже занят — выбери другой в настройках',
        'error'
      );
      window.location.href = 'settings.html?onboarding=1';
      return false;
    }
    throw error;
  }
}

tabs.forEach(function (tab) {
  tab.addEventListener('click', function () {
    switchAuthTab(tab.getAttribute('data-auth-tab'));
  });
});

if (forgotBtn) {
  forgotBtn.addEventListener('click', function () {
    var email = loginForm.email.value.trim();
    if (email) {
      resetForm.email.value = email;
    }
    showMessage(messageEl, '', 'info');
    messageEl.hidden = true;
    switchAuthTab('reset');
    resetForm.email.focus();
  });
}

if (resetBackBtn) {
  resetBackBtn.addEventListener('click', function () {
    switchAuthTab('login');
  });
}

if (verifyResendBtn) {
  verifyResendBtn.addEventListener('click', async function () {
    if (getVerifyResendUntil()) {
      return;
    }

    var user = auth.currentUser;
    if (!user) {
      showMessage(messageEl, 'Сессия истекла — войди снова', 'error');
      switchAuthTab('login');
      return;
    }

    verifyResendBtn.disabled = true;
    showMessage(messageEl, 'Отправляем письмо...', 'info');

    try {
      await requestEmailVerification(user);
      startVerifyResendCooldown();
      showMessage(messageEl, authEmailInboxHint(AUTH_EMAIL_VERIFY_SUBJECT), 'success');
    } catch (error) {
      if (error.code === 'auth/too-many-requests') {
        startVerifyResendCooldown(120);
      } else {
        verifyResendBtn.disabled = false;
        if (verifyResendBtnText) {
          verifyResendBtnText.textContent = verifyResendDefaultLabel;
        }
      }
      showMessage(messageEl, mapAuthError(error), 'error');
    }
  });
}

if (verifyCheckBtn) {
  verifyCheckBtn.addEventListener('click', async function () {
    verifyCheckBtn.disabled = true;
    showMessage(messageEl, 'Проверяем...', 'info');

    try {
      var user = await reloadAuthUser();
      if (!user) {
        showMessage(messageEl, 'Сессия истекла — войди снова', 'error');
        switchAuthTab('login');
        return;
      }
      if (needsEmailVerification(user)) {
        showMessage(messageEl, 'Email ещё не подтверждён — перейди по ссылке из письма', 'error');
        return;
      }
      await completeEmailVerification(user);
    } catch (error) {
      showMessage(messageEl, mapAuthError(error), 'error');
    } finally {
      verifyCheckBtn.disabled = false;
    }
  });
}

if (verifyLogoutBtn) {
  verifyLogoutBtn.addEventListener('click', async function () {
    try {
      await signOut(auth);
    } catch (error) {
      console.error(error);
    }
    showMessage(messageEl, '', 'info');
    messageEl.hidden = true;
    switchAuthTab('login');
  });
}

switchAuthTab('login');

loginForm.addEventListener('submit', async function (event) {
  event.preventDefault();
  clearFormFieldErrors(loginForm);

  var validation = loginValidation.validateAll();
  if (validation.hasError) {
    showMessage(messageEl, 'Исправь поля с ошибками', 'error');
    if (validation.firstInvalid) {
      loginForm.elements[validation.firstInvalid].focus();
    }
    return;
  }

  showMessage(messageEl, 'Входим...', 'info');

  var email = loginForm.email.value.trim();

  try {
    var password = loginForm.password.value;
    var cred = await signInWithEmailAndPassword(auth, email, password);

    if (needsEmailVerification(cred.user)) {
      showVerifyPanel(cred.user.email);
      showMessage(
        messageEl,
        'Подтверди email — без этого войти нельзя. Если письма нет, нажми «Отправить ещё раз».',
        'info'
      );
      return;
    }

    await continueAfterAuth(cred.user);
  } catch (error) {
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
      setFormFieldError(loginForm, 'email', 'Неверный email или пароль');
      setFormFieldError(loginForm, 'password', 'Неверный email или пароль');
    }
    showMessage(messageEl, mapAuthError(error), 'error');
  }
});

resetForm.addEventListener('submit', async function (event) {
  event.preventDefault();
  clearFormFieldErrors(resetForm);

  var resetResult = resetValidation.validateAll();
  if (resetResult.hasError) {
    showMessage(messageEl, 'Исправь поле email', 'error');
    resetForm.email.focus();
    return;
  }

  var email = resetForm.email.value.trim();
  showMessage(messageEl, 'Отправляем письмо...', 'info');

  try {
    var result = await requestPasswordReset(email);
    var hint = authEmailInboxHint(AUTH_EMAIL_RESET_SUBJECT) + ' Email должен совпадать с регистрацией. Подожди 2–5 минут.';
    if (result.fallbackLink) {
      hint += ' Ссылка в письме ведёт через firebaseapp.com — это нормально.';
    }
    showMessage(messageEl, hint, 'success');
  } catch (error) {
    showMessage(messageEl, mapAuthError(error), 'error');
  }
});

registerForm.addEventListener('submit', async function (event) {
  event.preventDefault();

  var validation = registerValidation.validateAll();
  if (validation.hasError) {
    showMessage(messageEl, 'Исправь поля с ошибками', 'error');
    if (validation.firstInvalid) {
      registerForm.elements[validation.firstInvalid].focus();
    }
    return;
  }

  showMessage(messageEl, 'Создаём аккаунт...', 'info');

  var values = getRegisterValues();
  var displayName = values.displayName;
  var username = values.username;
  var email = values.email;
  var password = values.password;

  try {
    var cred = await createUserWithEmailAndPassword(auth, email, password);
    await savePendingProfile(cred.user.uid, {
      displayName: displayName,
      username: username,
      bio: registerForm.bio.value
    });
    await requestEmailVerification(cred.user);

    showVerifyPanel(cred.user.email);
    startVerifyResendCooldown();
    showMessage(
      messageEl,
      'Подтверди email — после этого создадим профиль. ' + authEmailInboxHint(AUTH_EMAIL_VERIFY_SUBJECT),
      'success'
    );
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      setFormFieldError(registerForm, 'email', 'Email уже зарегистрирован');
      registerForm.email.focus();
    } else if (error.code === 'auth/weak-password') {
      setFormFieldError(registerForm, 'password', 'Слишком слабый пароль');
      registerForm.password.focus();
    } else if (error.code === 'auth/invalid-email') {
      setFormFieldError(registerForm, 'email', 'Некорректный email');
      registerForm.email.focus();
    }
    showMessage(messageEl, mapAuthError(error), 'error');
  }
});

onAuthStateChanged(auth, async function (user) {
  if (!user) {
    return;
  }

  if (needsEmailVerification(user)) {
    showVerifyPanel(user.email);
    try {
      var refreshed = await reloadAuthUser();
      if (refreshed && !needsEmailVerification(refreshed)) {
        await completeEmailVerification(refreshed);
      }
    } catch (error) {
      console.error(error);
    }
    return;
  }

  var profile = await getUserProfile(user.uid);
  if (!profile) {
    var pending = await fetchPendingProfile(user.uid);
    if (pending) {
      await continueAfterAuth(user);
    }
  }
});

function mapAuthError(error) {
  if (error.message === 'USERNAME_TAKEN') {
    return 'Этот тег уже занят';
  }
  if (
    error.code === 'auth/api-key-not-valid' ||
    error.code === 'auth/invalid-api-key'
  ) {
    return 'API-ключ Firebase не принимает Auth. Открой Google Cloud → Credentials → Browser key: включи Identity Toolkit API и домены localhost + owl-14.github.io. Либо скопируй свежий firebaseConfig из Firebase → Project settings.';
  }
  if (error.code === 'auth/email-already-in-use') {
    return 'Email уже зарегистрирован';
  }
  if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
    return 'Неверный email или пароль';
  }
  if (error.code === 'auth/invalid-email') {
    return 'Некорректный email';
  }
  if (error.code === 'auth/user-not-found') {
    return 'Аккаунт с таким email не найден — проверь адрес или зарегистрируйся';
  }
  if (error.message === 'EMAIL_REQUIRED') {
    return 'Укажи email';
  }
  if (error.message === 'AUTH_REQUIRED') {
    return 'Нужен вход в аккаунт';
  }
  if (error.code === 'auth/too-many-requests') {
    return 'Слишком много попыток — подожди 15–30 мин или используй другой email';
  }
  if (error.code === 'auth/weak-password') {
    return 'Слишком слабый пароль';
  }
  if (error.code === 'auth/operation-not-allowed') {
    return 'Вход по email не включён. Firebase → Authentication → Sign-in method → Email/Password';
  }
  return error.message || 'Что-то пошло не так';
}

initNav();
