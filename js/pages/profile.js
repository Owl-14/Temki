import { auth, onAuthStateChanged } from '../firebase-app.js';
import { getQueryParam } from '../utils.js';
import { initNav } from '../nav.js';
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
    avatar: document.getElementById('profile-avatar')
  },
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
