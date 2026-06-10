import { auth, onAuthStateChanged } from '../core/firebase-app.js';
import { getQueryParam } from '../core/utils.js';
import { initNav } from '../core/nav.js';
import { loadPublicProfile } from '../profile/public-profile.js';

var username = getQueryParam('u');
var profileView = document.getElementById('profile-view');
var notFound = document.getElementById('profile-not-found');
var profileTask = Promise.resolve();

var elements = {
  header: {
    name: document.getElementById('profile-name'),
    username: document.getElementById('profile-username'),
    bio: document.getElementById('profile-bio'),
    heat: document.getElementById('profile-heat'),
    avatar: document.getElementById('profile-avatar')
  },
  badges: document.getElementById('profile-badges'),
  actions: document.getElementById('profile-actions'),
  eggs: document.getElementById('profile-eggs')
};

function showNotFound() {
  profileView.hidden = true;
  notFound.hidden = false;
}

function showProfile() {
  notFound.hidden = true;
  profileView.hidden = false;
}

async function renderProfile(user) {
  var profile = await loadPublicProfile(username, elements, user);

  if (!profile) {
    showNotFound();
    return;
  }

  showProfile();
}

onAuthStateChanged(auth, function (user) {
  if (!username) {
    showNotFound();
    return;
  }

  profileTask = profileTask
    .then(function () {
      return renderProfile(user);
    })
    .catch(function (error) {
      console.error(error);
      showNotFound();
    });
});

initNav();
