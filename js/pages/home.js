import { fetchPublishedEggs } from '../firebase-app.js';
import { initNav } from '../nav.js';
import { renderEggs, mapFirestoreEgg } from '../eggs.js?v=3';

var container = document.getElementById('eggs-feed');

function showEmptyFeed() {
  if (!container) {
    return;
  }
  container.innerHTML = '<p class="empty-state">Пока пусто — снеси первое яйцо</p>';
}

async function loadFeed() {
  if (!container) {
    return;
  }

  try {
    var userEggs = await fetchPublishedEggs(50);
    var mapped = userEggs.map(mapFirestoreEgg);

    if (!mapped.length) {
      showEmptyFeed();
      return;
    }

    renderEggs(container, mapped);
  } catch (error) {
    showEmptyFeed();
    console.error(error);
  }
}

initNav();
loadFeed();
