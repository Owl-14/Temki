import { auth, onAuthStateChanged } from '../core/firebase-app.js';
import { fetchHotEggs, fetchRecentlyHatched, fetchIncubatingEggs, fetchChicks } from '../platform/platform-api.js';
import { renderQuestsWidget } from '../platform/quests.js';
import { initNav } from '../core/nav.js';
import { renderEggs, mapFirestoreEgg } from '../core/eggs.js';

/** Блоки главной: включить и убрать hidden с секций в index.html */
var HOME_FEEDS = {
  hot: false,
  hatched: false
};

var container = document.getElementById('eggs-feed');
var hotContainer = document.getElementById('hot-feed');
var hatchedContainer = document.getElementById('hatched-feed');
var chicksContainer = document.getElementById('chicks-feed');
var questsWidget = document.getElementById('quests-widget');
var loading = false;

function showLoadingFeed(el, text) {
  if (!el) {
    return;
  }
  el.innerHTML = '<p class="empty-state">' + (text || 'Загружаем яйца...') + '</p>';
}

function showEmptyFeed(el, text) {
  if (!el) {
    return;
  }
  el.innerHTML = '<p class="empty-state">' + (text || 'Пока пусто') + '</p>';
}

function showFeedError(el) {
  if (!el) {
    return;
  }
  el.innerHTML =
    '<p class="empty-state">Не удалось загрузить. ' +
    '<button class="btn btn--warm feed-retry" type="button">Повторить</button></p>';
  var retryBtn = el.querySelector('.feed-retry');
  if (retryBtn) {
    retryBtn.addEventListener('click', loadFeed);
  }
}

async function loadHot() {
  if (!hotContainer) {
    return;
  }
  showLoadingFeed(hotContainer, 'Греем...');
  try {
    var hot = await fetchHotEggs(6);
    if (!hot.length) {
      showEmptyFeed(hotContainer, 'Пока холодно');
      return;
    }
    renderEggs(hotContainer, hot.map(mapFirestoreEgg));
  } catch (error) {
    console.error(error);
    showEmptyFeed(hotContainer, 'Не удалось загрузить');
  }
}

async function loadHatched() {
  if (!hatchedContainer) {
    return;
  }
  showLoadingFeed(hatchedContainer);
  try {
    var hatched = await fetchRecentlyHatched(6);
    if (!hatched.length) {
      showEmptyFeed(hatchedContainer, 'Пока нет отобранных вылуплений — нужен продукт по ссылке и интерес сообщества');
      return;
    }
    renderEggs(hatchedContainer, hatched.map(mapFirestoreEgg));
  } catch (error) {
    console.error(error);
    showEmptyFeed(hatchedContainer);
  }
}

async function loadFeed() {
  if (!container || loading) {
    return;
  }

  loading = true;
  showLoadingFeed(container);

  try {
    var incubating = await fetchIncubatingEggs(50);
    var mapped = incubating.map(mapFirestoreEgg);

    if (!mapped.length) {
      showEmptyFeed(container, 'Пока пусто — снеси первое яйцо');
      return;
    }

    renderEggs(container, mapped);
  } catch (error) {
    showFeedError(container);
    console.error(error);
  } finally {
    loading = false;
  }
}

async function loadChicks() {
  if (!chicksContainer) {
    return;
  }
  showLoadingFeed(chicksContainer, 'Ищем цыплят...');
  try {
    var chicks = await fetchChicks(50);
    if (!chicks.length) {
      showEmptyFeed(chicksContainer, 'Пока никто не вылупился');
      return;
    }
    renderEggs(chicksContainer, chicks.map(mapFirestoreEgg));
  } catch (error) {
    console.error(error);
    showEmptyFeed(chicksContainer, 'Не удалось загрузить');
  }
}

onAuthStateChanged(auth, function (user) {
  if (user && questsWidget) {
    questsWidget.hidden = false;
    renderQuestsWidget(questsWidget, user.uid);
  } else if (questsWidget) {
    questsWidget.hidden = true;
  }
});

initNav();
if (HOME_FEEDS.hot) {
  loadHot();
}
if (HOME_FEEDS.hatched) {
  loadHatched();
}
loadFeed();
loadChicks();
