import { fetchEggsFiltered, fetchEggQuestions, getTesterStats } from '../platform/platform-api.js';
import { escapeHtml, statusLabel, viewsLabel } from '../core/utils.js';
import { initNav } from '../core/nav.js';

var grid = document.getElementById('investor-grid');
var form = document.getElementById('investor-filters');

function renderInvestorCard(egg, metrics) {
  return '<article class="investor-card">' +
    '<h3><a href="egg.html?id=' + escapeHtml(egg.id) + '">' + escapeHtml(egg.title) + '</a></h3>' +
    '<p>@' + escapeHtml(egg.ownerUsername) + ' · ' + escapeHtml(statusLabel(egg.status)) + '</p>' +
    '<ul class="investor-card__metrics">' +
      '<li>👁 ' + viewsLabel(egg.viewCount || 0) + '</li>' +
      '<li>🔥 ' + (egg.heat || 0) + '</li>' +
      '<li>❓ ' + metrics.questions + ' / ' + metrics.answered + ' ответов</li>' +
      '<li>🍽 ' + metrics.testers + (metrics.avgRating ? ' · ★ ' + metrics.avgRating : '') + '</li>' +
    '</ul>' +
    '<a class="btn btn--warm btn--sm" href="egg.html?id=' + escapeHtml(egg.id) + '#invest">Интересуюсь</a>' +
  '</article>';
}

async function load() {
  grid.innerHTML = '<p class="empty-state">Загружаем...</p>';
  var data = new FormData(form);
  try {
    var eggs = await fetchEggsFiltered({
      status: data.get('status') || null,
      sort: data.get('sort') || 'hot',
      seeking: 'invest',
      limit: 30,
      max: 80
    });

    if (!eggs.length) {
      eggs = await fetchEggsFiltered({
        status: data.get('status') || 'tsyplenok',
        sort: data.get('sort') || 'hot',
        limit: 30,
        max: 80
      });
    }

    if (!eggs.length) {
      grid.innerHTML = '<p class="empty-state">Пока нет яиц для витрины</p>';
      return;
    }

    var cards = await Promise.all(eggs.map(async function (egg) {
      var questions = await fetchEggQuestions(egg.id);
      var answered = questions.filter(function (q) {
        return q.answerText;
      }).length;
      var testerStats = await getTesterStats(egg.id);
      return renderInvestorCard(egg, {
        questions: questions.length,
        answered: answered,
        testers: testerStats.count,
        avgRating: testerStats.avgRating
      });
    }));

    grid.innerHTML = cards.join('');
  } catch (error) {
    console.error(error);
    grid.innerHTML = '<p class="empty-state">Не удалось загрузить</p>';
  }
}

form.addEventListener('submit', function (event) {
  event.preventDefault();
  load();
});

initNav();
load();
