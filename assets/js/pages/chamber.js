import { fetchEggsFiltered, EGG_TAGS } from '../platform/platform-api.js';
import { renderEggs, mapFirestoreEgg } from '../core/eggs.js';
import { initNav } from '../core/nav.js';

var container = document.getElementById('chamber-feed');
var form = document.getElementById('chamber-filters');
var tagSelect = document.getElementById('chamber-tag');

function showLoading() {
  container.innerHTML = '<p class="empty-state">Ищем в камере...</p>';
}

function showEmpty() {
  container.innerHTML = '<p class="empty-state">Ничего не найдено — попробуй другие фильтры</p>';
}

function showError() {
  container.innerHTML =
    '<p class="empty-state">Не удалось загрузить. <button class="btn btn--warm" type="button" id="chamber-retry">Повторить</button></p>';
  document.getElementById('chamber-retry').addEventListener('click', loadFromForm);
}

function populateTags() {
  tagSelect.innerHTML = '<option value="">Все теги</option>' +
    EGG_TAGS.map(function (tag) {
      return '<option value="' + tag + '">' + tag + '</option>';
    }).join('');
}

async function loadFromForm() {
  showLoading();
  var data = new FormData(form);
  try {
    var eggs = await fetchEggsFiltered({
      search: data.get('search'),
      status: data.get('status') || null,
      tag: data.get('tag') || null,
      seeking: data.get('seeking') || null,
      sort: data.get('sort') || 'new',
      limit: 50
    });
    if (!eggs.length) {
      showEmpty();
      return;
    }
    renderEggs(container, eggs.map(mapFirestoreEgg));
  } catch (error) {
    console.error(error);
    showError();
  }
}

form.addEventListener('submit', function (event) {
  event.preventDefault();
  loadFromForm();
});

populateTags();
initNav();
loadFromForm();
