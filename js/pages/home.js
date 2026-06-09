import { fetchPublishedEggs } from '../firebase-app.js';
import { initNav } from '../nav.js';
import { renderEggs, mapFirestoreEgg } from '../eggs.js?v=3';

var container = document.getElementById('eggs-feed');
var loading = false;

function showLoadingFeed() {
  if (!container) {
    return;
  }
  container.innerHTML = '<p class="empty-state">Загружаем яйца...</p>';
}

function showEmptyFeed() {
  if (!container) {
    return;
  }
  container.innerHTML = '<p class="empty-state">Пока пусто — снеси первое яйцо</p>';
}

function showFeedError() {
  if (!container) {
    return;
  }
  container.innerHTML =
    '<p class="empty-state">Не удалось загрузить яйца. ' +
    '<button class="btn btn--warm feed-retry" type="button">Повторить</button></p>';

  var retryBtn = container.querySelector('.feed-retry');
  if (retryBtn) {
    retryBtn.addEventListener('click', loadFeed);
  }
}

async function loadFeed() {
  if (!container || loading) {
    return;
  }

  loading = true;
  showLoadingFeed();

  try {
    var userEggs = await fetchPublishedEggs(50);
    var mapped = userEggs.map(mapFirestoreEgg);

    if (!mapped.length) {
      showEmptyFeed();
      return;
    }

    renderEggs(container, mapped);
  } catch (error) {
    showFeedError();
    console.error(error);
  } finally {
    loading = false;
  }
}

initNav();
loadFeed();
