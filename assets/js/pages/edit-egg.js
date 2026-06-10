import {
  auth,
  onAuthStateChanged,
  getUserProfile,
  updateEgg,
  deleteEgg
} from '../core/firebase-app.js';
import { getEggById } from '../eggs/egg-api.js';
import { getQueryParam, resizeImageFile, showMessage, statusLabel } from '../core/utils.js';
import {
  EGG_TAGS,
  SEEKING_OPTIONS,
  changeEggStatus,
  addMilestone
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

function renderStatusActions(currentStatus) {
  statusLabelEl.textContent = statusLabel(currentStatus);
  var html = '';

  if (currentStatus === 'greetsya') {
    html = '<button type="button" class="btn btn--warm" id="hatch-btn">🐣 Отметить вылупление</button>';
  } else if (currentStatus === 'tsyplenok') {
    html = '<p class="edit-egg__hint">Цыплёнок на свободе. Статус «курица» — после инвестиций.</p>' +
      '<button type="button" class="btn btn--ghost" id="hen-btn">Стало курицей</button>';
  } else {
    html = '<p class="edit-egg__hint">Курица — финальная стадия с теплом кормильцев</p>';
  }

  statusActions.innerHTML = html;

  var hatchBtn = document.getElementById('hatch-btn');
  if (hatchBtn) {
    hatchBtn.addEventListener('click', handleHatch);
  }

  var henBtn = document.getElementById('hen-btn');
  if (henBtn) {
    henBtn.addEventListener('click', handleHen);
  }
}

async function handleHatch() {
  var user = auth.currentUser;
  if (!user || !egg) {
    return;
  }
  if (!window.confirm('Отметить вылупление? Яйцо станет цыплёнком.')) {
    return;
  }
  try {
    await playHatchAnimation();
    var result = await changeEggStatus(eggId, user.uid, 'tsyplenok');
    egg.status = result.status;
    renderStatusActions(egg.status);
    showMessage(messageEl, 'Вылупилось!', 'info');
  } catch (error) {
    console.error(error);
    showMessage(messageEl, 'Не удалось сменить статус', 'error');
  }
}

async function handleHen() {
  var user = auth.currentUser;
  if (!user || !egg) {
    return;
  }
  if (!window.confirm('Отметить статус «курица»?')) {
    return;
  }
  try {
    var result = await changeEggStatus(eggId, user.uid, 'kuritsa');
    egg.status = result.status;
    renderStatusActions(egg.status);
    showMessage(messageEl, 'Стало курицей!', 'info');
  } catch (error) {
    console.error(error);
    showMessage(messageEl, 'Не удалось сменить статус', 'error');
  }
}

function fillForm(data) {
  form.title.value = data.title || '';
  form.description.value = data.description || '';
  form.link.value = data.link || '';
  form.demoUrl.value = data.demoUrl || '';

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
  var demoUrl = form.demoUrl.value.trim();

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
      demoUrl: demoUrl,
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
