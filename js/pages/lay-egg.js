import {
  auth,
  onAuthStateChanged,
  getUserProfile,
  createEgg
} from '../firebase-app.js';
import { resizeImageFile, showMessage } from '../utils.js';
import { initNav } from '../nav.js';

var messageEl = document.getElementById('lay-egg-message');
var form = document.getElementById('lay-egg-form');
var coverInput = document.getElementById('egg-cover-input');
var coverPreview = document.getElementById('egg-cover-preview');
var pendingCoverBlob = null;
var profile = null;

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

form.addEventListener('submit', async function (event) {
  event.preventDefault();

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

  showMessage(messageEl, 'Кладём яйцо в инкубатор...', 'info');

  try {
    await createEgg(user.uid, profile, {
      title: title,
      description: description,
      link: link
    }, pendingCoverBlob);

    window.location.href = 'profile.html?u=' + encodeURIComponent(profile.username);
  } catch (error) {
    showMessage(messageEl, error.message || 'Не удалось создать яйцо', 'error');
  }
});

initNav();
