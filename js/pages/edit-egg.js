import {
  auth,
  onAuthStateChanged,
  getUserProfile,
  updateEgg,
  deleteEgg
} from '../firebase-app.js';
import { getEggById } from '../egg/egg-api.js';
import { getQueryParam, resizeImageFile, showMessage } from '../utils.js';
import { initNav } from '../nav.js';

var eggId = getQueryParam('id');
var messageEl = document.getElementById('edit-egg-message');
var form = document.getElementById('edit-egg-form');
var coverInput = document.getElementById('edit-egg-cover-input');
var coverPreview = document.getElementById('edit-egg-cover-preview');
var notFound = document.getElementById('edit-egg-not-found');
var editView = document.getElementById('edit-egg-view');
var cancelLink = document.getElementById('edit-egg-cancel');
var pendingCoverBlob = null;
var profile = null;
var egg = null;

function showNotFound() {
  notFound.hidden = false;
  editView.hidden = true;
}

function fillForm(data) {
  form.title.value = data.title || '';
  form.description.value = data.description || '';
  form.link.value = data.link || '';

  var imageSrc = data.imageUrl || 'images/egg-placeholder.svg';
  coverPreview.innerHTML = '<img src="' + imageSrc + '" alt="Обложка яйца">';
  cancelLink.href = 'egg.html?id=' + encodeURIComponent(eggId);
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
      link: link
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
