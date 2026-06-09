import { auth, onAuthStateChanged } from '../firebase-app.js';
import { getQueryParam } from '../utils.js';
import { initNav } from '../nav.js';
import { loadPublicProfile } from '../profile/public-profile.js';

var username = getQueryParam('u');
var profileView = document.getElementById('profile-view');
var notFound = document.getElementById('profile-not-found');

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

async function initProfile() {
  var profile = await loadPublicProfile(username, elements);

  if (!profile) {
    showNotFound();
    return;
  }

  showProfile();
}

initProfile().catch(showNotFound);

onAuthStateChanged(auth, function () {
  if (profileView.hidden || !username) {
    return;
  }

  loadPublicProfile(username, elements).catch(showNotFound);
});

initNav();
