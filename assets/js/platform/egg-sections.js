import {
  fetchEggQuestions,
  addEggQuestion,
  answerEggQuestion,
  fetchMilestones,
  applyAsTester,
  submitTesterFeedback,
  getTesterStats,
  expressInvestInterest,
  hasInvestInterest,
  BADGE_LABELS
} from './platform-api.js';
import { escapeHtml, formatDate, showMessage } from '../core/utils.js';
import { trackQuestAction } from './quests.js';

export function renderTags(tags) {
  if (!tags || !tags.length) {
    return '';
  }
  return '<div class="egg-page__tags">' + tags.map(function (tag) {
    return '<span class="egg-page__tag">' + escapeHtml(tag) + '</span>';
  }).join('') + '</div>';
}

export function renderSeeking(seeking) {
  if (!seeking || !seeking.length) {
    return '';
  }
  var labels = { testers: 'ищу тестеров', feedback: 'ищу фидбек', invest: 'ищу тепло' };
  return '<div class="egg-page__seeking">' + seeking.map(function (s) {
    return '<span class="egg-page__seeking-badge">' + escapeHtml(labels[s] || s) + '</span>';
  }).join('') + '</div>';
}

function renderQuestionItem(q, isOwner) {
  var answered = q.answerText
    ? '<div class="egg-page__answer"><strong>Ответ создателя:</strong> ' + escapeHtml(q.answerText) + '</div>'
    : (isOwner
      ? '<form class="form egg-page__answer-form" data-question-id="' + escapeHtml(q.id) + '" novalidate>' +
          '<textarea class="form__input form__textarea" maxlength="500" rows="2" placeholder="Официальный ответ..."></textarea>' +
          '<button class="btn btn--primary btn--sm" type="submit">Ответить</button>' +
        '</form>'
      : '');
  return '<article class="egg-page__question">' +
    '<header class="egg-page__comment-header">' +
      '<a class="egg-page__comment-author" href="profile.html?u=' + escapeHtml(q.authorUsername) + '">@' +
        escapeHtml(q.authorUsername) + '</a>' +
      '<time class="egg-page__comment-time">' + escapeHtml(formatDate(q.createdAt)) + '</time>' +
    '</header>' +
    '<p class="egg-page__comment-text">' + escapeHtml(q.text) + '</p>' +
    answered +
  '</article>';
}

export async function loadQuestionsSection(eggId, container, user, egg) {
  var questions = await fetchEggQuestions(eggId);
  var isOwner = user && user.uid === egg.ownerId;
  var pinned = questions.filter(function (q) {
    return q.answerText;
  });
  var open = questions.filter(function (q) {
    return !q.answerText;
  });
  var sorted = pinned.concat(open);

  if (!sorted.length) {
    container.innerHTML = '<p class="egg-page__empty">Пока нет вопросов</p>';
    return;
  }

  container.innerHTML = sorted.map(function (q) {
    return renderQuestionItem(q, isOwner);
  }).join('');

  container.querySelectorAll('.egg-page__answer-form').forEach(function (form) {
    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      var qid = form.getAttribute('data-question-id');
      var text = form.querySelector('textarea').value.trim();
      if (!text) {
        return;
      }
      try {
        await answerEggQuestion(qid, eggId, user.uid, text);
        await loadQuestionsSection(eggId, container, user, egg);
      } catch (error) {
        console.error(error);
      }
    });
  });
}

export async function loadMilestonesSection(eggId, container) {
  var milestones = await fetchMilestones(eggId);
  if (!milestones.length) {
    container.innerHTML = '<p class="egg-page__empty">Вехи появятся по мере развития</p>';
    return;
  }
  container.innerHTML = milestones.map(function (m) {
    return '<article class="egg-page__update">' +
      '<time class="egg-page__update-time">' + escapeHtml(formatDate(m.createdAt)) + '</time>' +
      '<p class="egg-page__update-text">' + escapeHtml(m.message) + '</p>' +
    '</article>';
  }).join('');
}

export async function loadTrySection(eggId, container, user, profile, egg) {
  var stats = await getTesterStats(eggId);
  var html = '<p class="egg-page__stats-line">🍽 ' + stats.count + ' дегустаторов';
  if (stats.avgRating) {
    html += ' · ★ ' + stats.avgRating;
  }
  html += '</p>';

  if (!user) {
    html += '<p class="egg-page__guest"><a href="auth.html">Погрейся</a>, чтобы попробовать</p>';
    container.innerHTML = html;
    return;
  }

  if (user.uid === egg.ownerId) {
    html += '<p class="egg-page__hint">Список тестеров — в <a href="my-eggs.html">Мои яйца</a></p>';
    container.innerHTML = html;
    return;
  }

  var testerRef = eggId + '_' + user.uid;
  html += '<div id="try-actions"></div><div id="try-feedback" hidden></div>';
  container.innerHTML = html;

  var actions = container.querySelector('#try-actions');
  var feedbackEl = container.querySelector('#try-feedback');

  actions.innerHTML = '<button type="button" class="btn btn--warm" id="try-apply-btn">Хочу попробовать</button>';

  actions.querySelector('#try-apply-btn').addEventListener('click', async function () {
    try {
      var result = await applyAsTester(eggId, profile);
      if (result.already) {
        showFeedbackForm(feedbackEl, eggId, user.uid);
      } else {
        actions.innerHTML = '<p class="egg-page__hint">Заявка отправлена! Когда попробуешь — оставь отзыв.</p>';
        showFeedbackForm(feedbackEl, eggId, user.uid);
      }
    } catch (error) {
      console.error(error);
    }
  });
}

function showFeedbackForm(container, eggId, uid) {
  container.hidden = false;
  container.innerHTML =
    '<form class="form" id="feedback-form" novalidate>' +
      '<label class="form__field"><span class="form__label">Оценка (1–5)</span>' +
        '<input class="form__input" type="number" min="1" max="5" required></label>' +
      '<label class="form__field"><span class="form__label">Отзыв</span>' +
        '<textarea class="form__input form__textarea" maxlength="500" rows="2"></textarea></label>' +
      '<button class="btn btn--primary btn--sm" type="submit">Отправить отзыв</button>' +
    '</form>';

  container.querySelector('#feedback-form').addEventListener('submit', async function (event) {
    event.preventDefault();
    var form = event.target;
    var rating = form.querySelector('input[type="number"]').value;
    var text = form.querySelector('textarea').value;
    try {
      await submitTesterFeedback(eggId, uid, rating, text);
      container.innerHTML = '<p class="egg-page__hint">Спасибо за отзыв! +тепло</p>';
    } catch (error) {
      console.error(error);
    }
  });
}

export async function loadInvestSection(eggId, container, user, profile, egg) {
  if (!user) {
    container.innerHTML = '<p class="egg-page__guest"><a href="auth.html">Погрейся</a>, чтобы выразить интерес</p>';
    return;
  }
  if (user.uid === egg.ownerId) {
    container.innerHTML = '<p class="egg-page__hint">Заинтересованные — в <a href="my-eggs.html">Мои яйца</a></p>';
    return;
  }
  var already = await hasInvestInterest(eggId, user.uid);
  if (already) {
    container.innerHTML = '<p class="egg-page__hint">Ты уже отметил интерес к этому яйцу</p>';
    return;
  }
  container.innerHTML =
    '<form class="form" id="invest-form" novalidate>' +
      '<label class="form__field"><span class="form__label">Сообщение (необязательно)</span>' +
        '<textarea class="form__input form__textarea" maxlength="300" rows="2" placeholder="Чем интересен проект..."></textarea></label>' +
      '<button class="btn btn--warm" type="submit">Интересуюсь теплом</button>' +
    '</form>';

  container.querySelector('#invest-form').addEventListener('submit', async function (event) {
    event.preventDefault();
    var msg = container.querySelector('textarea').value;
    try {
      await expressInvestInterest(eggId, profile, msg);
      container.innerHTML = '<p class="egg-page__hint">Интерес отправлен создателю</p>';
    } catch (error) {
      console.error(error);
    }
  });
}

export function bindQuestionForm(eggId, form, messageEl, user, profile, egg, onDone) {
  if (!form || form.dataset.bound === '1') {
    return;
  }
  form.dataset.bound = '1';
  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (!user || !profile) {
      showMessage(messageEl, 'Погрейся, чтобы задать вопрос', 'error');
      return;
    }
    if (egg && user.uid === egg.ownerId) {
      showMessage(messageEl, 'На своём яйце вопросы задают другие', 'error');
      return;
    }
    var text = form.querySelector('textarea').value.trim();
    if (!text) {
      showMessage(messageEl, 'Напиши вопрос', 'error');
      return;
    }
    try {
      await addEggQuestion(eggId, profile, text);
      trackQuestAction('questions');
      form.querySelector('textarea').value = '';
      showMessage(messageEl, '', 'info');
      if (onDone) {
        await onDone();
      }
    } catch (error) {
      if (error && error.message === 'OWN_EGG') {
        showMessage(messageEl, 'На своём яйце вопросы задают другие', 'error');
        return;
      }
      showMessage(messageEl, 'Не удалось отправить', 'error');
    }
  });
}

export function renderBadges(badges) {
  if (!badges || !badges.length) {
    return '';
  }
  return badges.map(function (b) {
    var label = BADGE_LABELS[b.badgeId] || b.badgeId;
    return '<span class="profile-badge" title="' + escapeHtml(label) + '">' + escapeHtml(label) + '</span>';
  }).join('');
}
