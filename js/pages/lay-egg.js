import {
  auth,
  onAuthStateChanged,
  getUserProfile,
  createEgg
} from '../firebase-app.js';
import { startLayEggWarming } from '../lay-egg/warming-animation.js';
import { resizeImageFile, showMessage } from '../utils.js';
import { initNav } from '../nav.js';

var messageEl = document.getElementById('lay-egg-message');
var form = document.getElementById('lay-egg-form');
var pageHeader = document.querySelector('.page__header');
var coverInput = document.getElementById('egg-cover-input');
var coverPreview = document.getElementById('egg-cover-preview');
var pendingCoverBlob = null;
var profile = null;
var isSubmitting = false;

onAuthStateChanged(auth, async function (user) {
  if (!user) {
    window.location.href = 'auth.html';
    return;
  }

  profile = await getUserProfile(user.uid);

  if (!profile || !profile.username) {
    window.location.href = 'settings.html?onboarding=1';
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

function getWarmingImage() {
  if (profile && profile.avatarUrl) {
    return profile.avatarUrl;
  }

  var previewImg = coverPreview.querySelector('img');

  if (previewImg && previewImg.src.indexOf('egg-placeholder') === -1) {
    return previewImg.src;
  }

  return null;
}

function resetFormState() {
  isSubmitting = false;
  form.hidden = false;
  if (pageHeader) {
    pageHeader.hidden = false;
  }
  form.querySelector('.form__submit').disabled = false;
}

form.addEventListener('submit', async function (event) {
  event.preventDefault();

  if (isSubmitting) {
    return;
  }

  var user = auth.currentUser;
  if (!user || !profile) {
    return;
  }

  var title = form.title.value.trim();
  var description = form.description.value.trim();
  var link = form.link.value.trim();

  if (!title || !description) {
    showMessage(messageEl, 'Название и описание обязательны', 'error');
    return;
  }

  isSubmitting = true;
  form.querySelector('.form__submit').disabled = true;
  showMessage(messageEl, '', 'info');
  form.hidden = true;
  if (pageHeader) {
    pageHeader.hidden = true;
  }

  var warming = startLayEggWarming(getWarmingImage());

  try {
    var eggId = await createEgg(user.uid, profile, {
      title: title,
      description: description,
      link: link
    }, pendingCoverBlob);

    await warming.complete();
    window.location.href = 'egg.html?id=' + encodeURIComponent(eggId);
  } catch (error) {
    warming.cancel();
    resetFormState();
    showMessage(messageEl, error.message || 'Не удалось создать яйцо', 'error');
  }
});

initNav();
