import { auth, onAuthStateChanged, getUserProfile, fetchUserEggs } from '../core/firebase-app.js';
import {
  fetchEggQuestions,
  fetchEggTesters,
  fetchInvestInterest,
  getTesterStats
} from '../platform/platform-api.js';
import { escapeHtml, statusLabel } from '../core/utils.js';
import { initNav } from '../core/nav.js';

var list = document.getElementById('my-eggs-list');

function renderEggDashboard(egg, stats) {
  return '<article class="my-egg-card">' +
    '<h2 class="my-egg-card__title"><a href="egg.html?id=' + escapeHtml(egg.id) + '">' + escapeHtml(egg.title) + '</a></h2>' +
    '<p class="my-egg-card__meta">' + escapeHtml(statusLabel(egg.status)) + ' · 🔥 ' + (egg.heat || 0) + ' · 👁 ' + (egg.viewCount || 0) + '</p>' +
    '<p class="my-egg-card__meta">❓ ' + stats.unanswered + ' вопросов без ответа · 🍽 ' + stats.testers + ' тестеров' +
      (stats.avgRating ? ' · ★ ' + stats.avgRating : '') + '</p>' +
    '<p class="my-egg-card__meta">💡 ' + stats.investors + ' интерес к теплу</p>' +
    '<div class="my-egg-card__actions">' +
      '<a class="btn btn--ghost btn--sm" href="edit-egg.html?id=' + escapeHtml(egg.id) + '">Редактировать</a>' +
    '</div>' +
  '</article>';
}

async function loadDashboard(user) {
  list.innerHTML = '<p class="empty-state">Загружаем...</p>';
  try {
    var eggs = await fetchUserEggs(user.uid);
    if (!eggs.length) {
      list.innerHTML = '<p class="empty-state">Пока нет яиц — <a href="lay-egg.html">снеси первое</a></p>';
      return;
    }

    var cards = await Promise.all(eggs.map(async function (egg) {
      var questions = await fetchEggQuestions(egg.id);
      var unanswered = questions.filter(function (q) {
        return !q.answerText;
      }).length;
      var testers = await fetchEggTesters(egg.id);
      var testerStats = await getTesterStats(egg.id);
      var investors = await fetchInvestInterest(egg.id);
      return renderEggDashboard(egg, {
        unanswered: unanswered,
        testers: testers.length,
        avgRating: testerStats.avgRating,
        investors: investors.length
      });
    }));

    list.innerHTML = cards.join('');
  } catch (error) {
    console.error(error);
    list.innerHTML = '<p class="empty-state">Не удалось загрузить</p>';
  }
}

onAuthStateChanged(auth, async function (user) {
  if (!user) {
    window.location.href = 'auth.html';
    return;
  }
  var profile = await getUserProfile(user.uid);
  if (!profile || !profile.username) {
    window.location.href = 'settings.html?onboarding=1';
    return;
  }
  await loadDashboard(user);
});

initNav();
