import { fetchPublishedEggs } from '../firebase-app.js';
import { initNav } from '../nav.js';
import { LEGACY_EGGS, renderEggs, mapFirestoreEgg } from '../eggs.js';

var container = document.getElementById('eggs-feed');

async function loadFeed() {
  if (!container) {
    return;
  }

  try {
    var userEggs = await fetchPublishedEggs(50);
    var mapped = userEggs.map(mapFirestoreEgg);
    var allEggs = LEGACY_EGGS.concat(mapped);
    renderEggs(container, allEggs);
  } catch (error) {
    renderEggs(container, LEGACY_EGGS);
    console.error(error);
  }
}

initNav();
loadFeed();
