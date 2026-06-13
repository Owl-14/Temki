import {
  auth,
  onAuthStateChanged,
  getUserProfile,
  createEgg,
  redirectIfUnverified
} from '../core/firebase-app.js';
import { startLayEggWarming } from '../lay-egg/warming-animation.js';
import { resizeImageFile, showMessage } from '../core/utils.js';
import { EGG_TAGS, SEEKING_OPTIONS, awardBadge, addUserHeat } from '../platform/platform-api.js';
import { initNav } from '../core/nav.js';

var messageEl = document.getElementById('lay-egg-message');
var form = document.getElementById('lay-egg-form');
var pageHeader = document.querySelector('.page__header');
var coverInput = document.getElementById('egg-cover-input');
var coverPreview = document.getElementById('egg-cover-preview');
var pendingCoverBlob = null;
var profile = null;
var isSubmitting = false;

function renderTagSeekingFields() {
  var tagsField = document.getElementById('lay-egg-tags-field');
  var seekingField = document.getElementById('lay-egg-seeking-field');
  if (tagsField) {
    tagsField.innerHTML = '<legend class="form__label">Теги</legend>' +
      EGG_TAGS.map(function (tag) {
        return '<label class="form__checkbox"><input type="checkbox" value="' + tag + '"> ' + tag + '</label>';
      }).join('');
  }
  if (seekingField) {
    seekingField.innerHTML = '<legend class="form__label">Что ищу</legend>' +
      SEEKING_OPTIONS.map(function (opt) {
        return '<label class="form__checkbox"><input type="checkbox" value="' + opt.id + '"> ' + opt.label + '</label>';
      }).join('');
  }
}

function getCheckedValues(container) {
  var values = [];
  if (!container) {
    return values;
  }
  container.querySelectorAll('input[type="checkbox"]:checked').forEach(function (cb) {
    values.push(cb.value);
  });
  return values;
}

renderTagSeekingFields();

onAuthStateChanged(auth, async function (user) {
  if (!user) {
    window.location.href = 'auth.html';
    return;
  }
  if (redirectIfUnverified(user)) {
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
      link: link,
      tags: getCheckedValues(document.getElementById('lay-egg-tags-field')),
      seeking: getCheckedValues(document.getElementById('lay-egg-seeking-field'))
    }, pendingCoverBlob);

    try {
      await addUserHeat(user.uid, 1, 'laid_egg');
      await awardBadge(user.uid, 'laid_egg');
    } catch (e) {
      console.error(e);
    }

    await warming.complete();
    window.location.href = 'egg.html?id=' + encodeURIComponent(eggId);
  } catch (error) {
    warming.cancel();
    resetFormState();
    showMessage(messageEl, error.message || 'Не удалось создать яйцо', 'error');
  }
});

initNav();
