import {
  auth,
  onAuthStateChanged,
  getUserProfile,
  updateEgg,
  deleteEgg,
  redirectIfUnverified
} from '../core/firebase-app.js';
import { getEggById } from '../eggs/egg-api.js';
import { getQueryParam, resizeImageFile, showMessage, statusLabel } from '../core/utils.js';
import {
  EGG_TAGS,
  SEEKING_OPTIONS,
  changeEggStatus,
  addMilestone,
  hasExternalProductUrl
} from '../platform/platform-api.js';
import { playHatchAnimation } from '../platform/hatch-animation.js';
import { initNav } from '../core/nav.js';

var eggId = getQueryParam('id');
var messageEl = document.getElementById('edit-egg-message');
var form = document.getElementById('edit-egg-form');
var coverInput = document.getElementById('edit-egg-cover-input');
var coverPreview = document.getElementById('edit-egg-cover-preview');
var notFound = document.getElementById('edit-egg-not-found');
var editView = document.getElementById('edit-egg-view');
var cancelLink = document.getElementById('edit-egg-cancel');
var statusLabelEl = document.getElementById('edit-egg-status-label');
var statusActions = document.getElementById('edit-egg-status-actions');
var tagsField = document.getElementById('edit-egg-tags-field');
var seekingField = document.getElementById('edit-egg-seeking-field');
var pendingCoverBlob = null;
var profile = null;
var egg = null;

function showNotFound() {
  notFound.hidden = false;
  editView.hidden = true;
}

function getSelectedTags() {
  var tags = [];
  tagsField.querySelectorAll('input[type="checkbox"]:checked').forEach(function (cb) {
    tags.push(cb.value);
  });
  return tags;
}

function getSelectedSeeking() {
  var seeking = [];
  seekingField.querySelectorAll('input[type="checkbox"]:checked').forEach(function (cb) {
    seeking.push(cb.value);
  });
  return seeking;
}

function renderTagSeekingFields(data) {
  tagsField.innerHTML = '<legend class="form__label">Теги</legend>' +
    EGG_TAGS.map(function (tag) {
      var checked = data.tags && data.tags.indexOf(tag) !== -1 ? ' checked' : '';
      return '<label class="form__checkbox"><input type="checkbox" value="' + tag + '"' + checked + '> ' + tag + '</label>';
    }).join('');

  seekingField.innerHTML = '<legend class="form__label">Что ищу</legend>' +
    SEEKING_OPTIONS.map(function (opt) {
      var checked = data.seeking && data.seeking.indexOf(opt.id) !== -1 ? ' checked' : '';
      return '<label class="form__checkbox"><input type="checkbox" value="' + opt.id + '"' + checked + '> ' + opt.label + '</label>';
    }).join('');
}

function getFormProductUrls() {
  return {
    link: form.link.value.trim()
  };
}

function isHatchFormReady() {
  var urls = getFormProductUrls();
  if (!hasExternalProductUrl(urls)) {
    return false;
  }
  var publicCheck = document.getElementById('hatch-check-public');
  var scenarioCheck = document.getElementById('hatch-check-scenario');
  return !!(publicCheck && publicCheck.checked && scenarioCheck && scenarioCheck.checked);
}

function updateHatchButtonState() {
  var hatchBtn = document.getElementById('hatch-btn');
  var urlHint = document.getElementById('hatch-url-hint');
  if (!hatchBtn) {
    return;
  }
  var hasUrl = hasExternalProductUrl(getFormProductUrls());
  hatchBtn.disabled = !isHatchFormReady();
  if (urlHint) {
    urlHint.hidden = hasUrl;
  }
}

function bindHatchControls() {
  ['hatch-check-public', 'hatch-check-scenario'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', updateHatchButtonState);
    }
  });
  form.link.addEventListener('input', updateHatchButtonState);
}

function renderStatusActions(currentStatus) {
  statusLabelEl.textContent = statusLabel(currentStatus);
  var html = '';

  if (currentStatus === 'greetsya') {
    html =
      '<div class="edit-egg__hatch-checklist">' +
        '<p class="edit-egg__hint">Перед вылуплением заполни ссылку на продукт в форме ниже и подтверди условия:</p>' +
        '<p class="edit-egg__hatch-url-hint" id="hatch-url-hint" hidden>Нужна ссылка на продукт</p>' +
        '<label class="form__checkbox edit-egg__hatch-check">' +
          '<input type="checkbox" id="hatch-check-public"> Продукт доступен незнакомым людям (не только друзьям)' +
        '</label>' +
        '<label class="form__checkbox edit-egg__hatch-check">' +
          '<input type="checkbox" id="hatch-check-scenario"> Работает минимум один сценарий — не заглушка' +
        '</label>' +
      '</div>' +
      '<div class="edit-egg__hatch-row">' +
        '<button type="button" class="btn btn--warm" id="hatch-btn" disabled>🐣 Отметить вылупление</button>' +
        '<a class="edit-egg__hatch-rules" href="hatch-rules.html?from=' +
          encodeURIComponent('edit-egg.html?id=' + egg.id) +
          '">Правила вылупления</a>' +
      '</div>';
  } else if (currentStatus === 'tsyplenok') {
    html = '<p class="edit-egg__hint">Цыплёнок на свободе. Статус «курица» назначает администратор.</p>';
  } else {
    html = '<p class="edit-egg__hint">Курица — стадия с теплом кормильцев, назначается администратором.</p>';
  }

  statusActions.innerHTML = html;

  var hatchBtn = document.getElementById('hatch-btn');
  if (hatchBtn) {
    hatchBtn.addEventListener('click', handleHatch);
    bindHatchControls();
    updateHatchButtonState();
  }
}

async function handleHatch() {
  var user = auth.currentUser;
  if (!user || !egg) {
    return;
  }
  if (!isHatchFormReady()) {
    showMessage(messageEl, 'Заполни ссылку на продукт и отметь условия вылупления', 'error');
    updateHatchButtonState();
    return;
  }
  if (!window.confirm('Отметить вылупление? Яйцо станет цыплёнком. Это нельзя отменить.')) {
    return;
  }

  var title = form.title.value.trim();
  var description = form.description.value.trim();
  var urls = getFormProductUrls();

  if (!title || !description) {
    showMessage(messageEl, 'Название и описание обязательны', 'error');
    return;
  }

  showMessage(messageEl, 'Готовим вылупление...', 'info');

  try {
    await updateEgg(eggId, user.uid, {
      title: title,
      description: description,
      link: urls.link,
      tags: getSelectedTags(),
      seeking: getSelectedSeeking()
    }, pendingCoverBlob);

    egg = await getEggById(eggId);
    await playHatchAnimation(egg.imageUrl || null);
    var result = await changeEggStatus(eggId, user.uid, 'tsyplenok');
    egg.status = result.status;
    renderStatusActions(egg.status);
    showMessage(messageEl, 'Вылупилось! В ленту на главной попадёшь после интереса сообщества.', 'info');
  } catch (error) {
    console.error(error);
    if (error.message === 'HATCH_NO_URL') {
      showMessage(messageEl, 'Нужна ссылка на внешний продукт', 'error');
      return;
    }
    showMessage(messageEl, 'Не удалось сменить статус', 'error');
  }
}

function fillForm(data) {
  form.title.value = data.title || '';
  form.description.value = data.description || '';
  form.link.value = data.link || '';

  var imageSrc = data.imageUrl || '../assets/images/egg-placeholder.svg';
  coverPreview.innerHTML = '<img src="' + imageSrc + '" alt="Обложка яйца">';
  cancelLink.href = 'egg.html?id=' + encodeURIComponent(eggId);
  renderTagSeekingFields(data);
  renderStatusActions(data.status || 'greetsya');
}

onAuthStateChanged(auth, async function (user) {
  if (!user) {
    window.location.href = 'auth.html';
    return;
  }
  if (redirectIfUnverified(user)) {
    return;
  }

  if (!eggId) {
    showNotFound();
    return;
  }

  profile = await getUserProfile(user.uid);

  if (!profile || !profile.username) {
    window.location.href = 'settings.html?onboarding=1';
    return;
  }

  try {
    egg = await getEggById(eggId);

    if (!egg || egg.ownerId !== user.uid) {
      showNotFound();
      return;
    }

    notFound.hidden = true;
    editView.hidden = false;
    fillForm(egg);
  } catch (error) {
    console.error(error);
    showNotFound();
  }
});

coverInput.addEventListener('change', async function () {
  var file = coverInput.files[0];
  if (!file) {
    return;
  }
  try {
    pendingCoverBlob = await resizeImageFile(file, 640);
    coverPreview.innerHTML = '<img src="' + URL.createObjectURL(pendingCoverBlob) + '" alt="Обложка яйца">';
  } catch (error) {
    showMessage(messageEl, error.message, 'error');
  }
});

document.getElementById('edit-milestone-form').addEventListener('submit', async function (event) {
  event.preventDefault();
  var user = auth.currentUser;
  if (!user) {
    return;
  }
  var input = event.target.querySelector('input');
  try {
    await addMilestone(eggId, user.uid, input.value);
    input.value = '';
    showMessage(messageEl, 'Веха добавлена', 'info');
  } catch (error) {
    showMessage(messageEl, 'Не удалось добавить веху', 'error');
  }
});

form.addEventListener('submit', async function (event) {
  event.preventDefault();

  var user = auth.currentUser;
  if (!user || !profile || !egg) {
    return;
  }

  var title = form.title.value.trim();
  var description = form.description.value.trim();
  var link = form.link.value.trim();

  if (!title || !description) {
    showMessage(messageEl, 'Название и описание обязательны', 'error');
    return;
  }

  showMessage(messageEl, 'Сохраняем...', 'info');

  try {
    await updateEgg(eggId, user.uid, {
      title: title,
      description: description,
      link: link,
      tags: getSelectedTags(),
      seeking: getSelectedSeeking()
    }, pendingCoverBlob);

    window.location.href = 'egg.html?id=' + encodeURIComponent(eggId);
  } catch (error) {
    if (error.message === 'EGG_NOT_FOUND') {
      showNotFound();
      return;
    }
    showMessage(messageEl, error.message || 'Не удалось сохранить', 'error');
  }
});

document.getElementById('edit-egg-delete').addEventListener('click', async function () {
  var user = auth.currentUser;
  if (!user || !profile || !egg) {
    return;
  }
  if (!window.confirm('Удалить яйцо из инкубатора? Это нельзя отменить.')) {
    return;
  }
  var deleteBtn = document.getElementById('edit-egg-delete');
  deleteBtn.disabled = true;
  showMessage(messageEl, 'Удаляем...', 'info');
  try {
    await deleteEgg(eggId, user.uid);
    window.location.href = 'profile.html?u=' + encodeURIComponent(profile.username);
  } catch (error) {
    deleteBtn.disabled = false;
    showMessage(messageEl, 'Не удалось удалить', 'error');
  }
});

initNav();
