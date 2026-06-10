import {
  auth,
  onAuthStateChanged,
  getUserProfile,
  deleteEgg
} from '../firebase-app.js';
import {
  getEggById,
  recordEggView,
  fetchEggComments,
  fetchEggCommentReactions,
  buildReactionStats,
  addEggComment,
  setCommentVote,
  fetchEggUpdates
} from './egg-api.js';
import { escapeHtml, formatDate, viewsLabel, statusLabel, showMessage } from '../utils.js';

var commentState = {
  eggId: null,
  user: null,
  reactions: [],
  stats: { counts: {}, userVotes: {} }
};

export function eggPageUrl(eggId) {
  return 'egg.html?id=' + encodeURIComponent(eggId);
}

function renderUpdates(container, updates) {
  if (!updates.length) {
    container.innerHTML = '<p class="egg-page__empty">История пока пуста</p>';
    return;
  }

  container.innerHTML = updates.map(function (item) {
    return '<article class="egg-page__update">' +
      '<time class="egg-page__update-time">' + escapeHtml(formatDate(item.createdAt)) + '</time>' +
      '<p class="egg-page__update-text">' + escapeHtml(item.message) + '</p>' +
    '</article>';
  }).join('');
}

function voteCount(counts, commentId, type) {
  if (!counts[commentId]) {
    return 0;
  }
  return counts[commentId][type] || 0;
}

function resolveReplyToUsername(comment, byId) {
  if (comment.replyToUsername) {
    return comment.replyToUsername;
  }

  if (comment.parentId && byId[comment.parentId]) {
    return byId[comment.parentId].authorUsername;
  }

  return null;
}

function renderReplyMention(username) {
  if (!username) {
    return '';
  }

  return '<span class="egg-page__reply-to">' +
    '<a href="profile.html?u=' + escapeHtml(username) + '">@' + escapeHtml(username) + '</a>' +
  '</span> ';
}

function renderCommentItem(comment, byId) {
  var stats = commentState.stats;
  var userVote = stats.userVotes[comment.id] || null;
  var likeActive = userVote === 'like' ? ' is-active' : '';
  var dislikeActive = userVote === 'dislike' ? ' is-active' : '';
  var canInteract = commentState.user ? '' : ' disabled title="Погрейся, чтобы голосовать"';
  var replyDisabled = commentState.user ? '' : ' disabled title="Погрейся, чтобы ответить"';
  var replyTo = resolveReplyToUsername(comment, byId);

  return '<article class="egg-page__comment" data-comment-id="' + escapeHtml(comment.id) + '" data-author-username="' +
    escapeHtml(comment.authorUsername) + '">' +
    '<header class="egg-page__comment-header">' +
      '<a class="egg-page__comment-author" href="profile.html?u=' + escapeHtml(comment.authorUsername) + '">@' +
        escapeHtml(comment.authorUsername) + '</a>' +
      '<span class="egg-page__comment-name">' + escapeHtml(comment.authorDisplayName || '') + '</span>' +
      '<time class="egg-page__comment-time">' + escapeHtml(formatDate(comment.createdAt)) + '</time>' +
    '</header>' +
    '<p class="egg-page__comment-text">' + renderReplyMention(replyTo) + escapeHtml(comment.text) + '</p>' +
    '<div class="egg-page__comment-actions">' +
      '<button type="button" class="egg-page__vote egg-page__vote--like' + likeActive + '" data-action="vote" data-vote="like" data-comment-id="' +
        escapeHtml(comment.id) + '"' + canInteract + '>👍 <span>' + voteCount(stats.counts, comment.id, 'like') + '</span></button>' +
      '<button type="button" class="egg-page__vote egg-page__vote--dislike' + dislikeActive + '" data-action="vote" data-vote="dislike" data-comment-id="' +
        escapeHtml(comment.id) + '"' + canInteract + '>👎 <span>' + voteCount(stats.counts, comment.id, 'dislike') + '</span></button>' +
      '<button type="button" class="egg-page__reply-btn" data-action="reply" data-comment-id="' +
        escapeHtml(comment.id) + '" data-reply-to="' + escapeHtml(comment.authorUsername) + '"' + replyDisabled + '>Ответить</button>' +
    '</div>' +
    '<form class="form egg-page__reply-form" data-reply-form="' + escapeHtml(comment.id) + '" data-reply-to="' +
      escapeHtml(comment.authorUsername) + '" hidden novalidate>' +
      '<p class="egg-page__reply-hint">Ответ для <span>@' + escapeHtml(comment.authorUsername) + '</span></p>' +
      '<label class="form__field">' +
        '<textarea class="form__input form__textarea" maxlength="500" rows="2" placeholder="Ответ..."></textarea>' +
      '</label>' +
      '<p class="form-message egg-page__reply-message" hidden></p>' +
      '<div class="egg-page__reply-actions">' +
        '<button class="btn btn--primary" type="submit">Отправить</button>' +
        '<button class="btn btn--ghost" type="button" data-action="cancel-reply">Отмена</button>' +
      '</div>' +
    '</form>' +
  '</article>';
}

function buildCommentIndex(comments) {
  var byId = {};

  comments.forEach(function (comment) {
    byId[comment.id] = comment;
  });

  return byId;
}

function renderComments(container, comments) {
  if (!comments.length) {
    container.innerHTML = '<p class="egg-page__empty">Пока нет комментариев</p>';
    return;
  }

  var byId = buildCommentIndex(comments);
  container.innerHTML = comments.map(function (comment) {
    return renderCommentItem(comment, byId);
  }).join('');
}

async function refreshCommentsUI(elements) {
  var comments = await fetchEggComments(commentState.eggId);
  commentState.reactions = await fetchEggCommentReactions(commentState.eggId);
  commentState.stats = buildReactionStats(
    commentState.reactions,
    commentState.user ? commentState.user.uid : null
  );
  renderComments(elements.comments, comments);
}

export function renderEggPage(egg, elements) {
  document.title = egg.title + ' — Инкубатор';

  var imageSrc = egg.imageUrl || 'images/egg-placeholder.svg';
  elements.cover.innerHTML = '<img src="' + escapeHtml(imageSrc) + '" alt="' + escapeHtml(egg.title) + '">';
  elements.status.textContent = statusLabel(egg.status);
  elements.title.textContent = egg.title;
  elements.owner.innerHTML =
    '<a href="profile.html?u=' + escapeHtml(egg.ownerUsername) + '">@' + escapeHtml(egg.ownerUsername) + '</a>';
  elements.views.textContent = '👁 ' + viewsLabel(egg.viewCount || 0);
  elements.description.textContent = egg.description || '';

  if (egg.link) {
    elements.link.href = egg.link;
    elements.link.hidden = false;
  } else {
    elements.link.hidden = true;
  }
}

async function loadEggExtras(eggId, elements, user) {
  commentState.eggId = eggId;
  commentState.user = user;

  var updates = await fetchEggUpdates(eggId);
  renderUpdates(elements.updates, updates);
  await refreshCommentsUI(elements);

  if (user) {
    elements.commentGuest.hidden = true;
    elements.commentForm.hidden = false;
  } else {
    elements.commentGuest.hidden = false;
    elements.commentForm.hidden = true;
  }
}

async function tryRecordView(eggId, user, viewsEl) {
  if (!user) {
    return;
  }

  try {
    var profile = await getUserProfile(user.uid);

    if (!profile) {
      return;
    }

    var result = await recordEggView(eggId, user, profile);

    if (result && viewsEl) {
      viewsEl.textContent = '👁 ' + viewsLabel(result.viewCount);
    }
  } catch (error) {
    console.error(error);
  }
}

function bindCommentForm(eggId, elements) {
  if (elements.commentForm.dataset.bound === '1') {
    return;
  }
  elements.commentForm.dataset.bound = '1';

  elements.commentForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    var user = auth.currentUser;

    if (!user) {
      showMessage(elements.commentMessage, 'Погрейся, чтобы комментировать', 'error');
      return;
    }

    var text = elements.commentInput.value.trim();

    if (!text) {
      showMessage(elements.commentMessage, 'Напиши комментарий', 'error');
      return;
    }

    showMessage(elements.commentMessage, 'Отправляем...', 'info');

    try {
      var profile = await getUserProfile(user.uid);
      await addEggComment(eggId, profile, text);
      elements.commentInput.value = '';
      showMessage(elements.commentMessage, '', 'info');
      await refreshCommentsUI(elements);
    } catch (error) {
      if (error.message === 'COMMENT_INVALID') {
        showMessage(elements.commentMessage, 'Комментарий до 500 символов', 'error');
        return;
      }
      showMessage(elements.commentMessage, 'Не удалось отправить', 'error');
    }
  });
}

function bindCommentsInteractions(eggId, elements) {
  if (elements.comments.dataset.bound === '1') {
    return;
  }
  elements.comments.dataset.bound = '1';

  elements.comments.addEventListener('click', async function (event) {
    var target = event.target.closest('[data-action]');

    if (!target || target.disabled) {
      return;
    }

    var action = target.getAttribute('data-action');
    var commentId = target.getAttribute('data-comment-id');

    if (action === 'reply') {
      elements.comments.querySelectorAll('[data-reply-form]').forEach(function (form) {
        form.hidden = true;
      });

      var form = elements.comments.querySelector('[data-reply-form="' + commentId + '"]');

      if (form) {
        form.hidden = false;
        form.querySelector('textarea').focus();
      }
      return;
    }

    if (action === 'cancel-reply') {
      var replyForm = target.closest('[data-reply-form]');
      if (replyForm) {
        replyForm.hidden = true;
        replyForm.querySelector('textarea').value = '';
        var msg = replyForm.querySelector('.egg-page__reply-message');
        showMessage(msg, '', 'info');
      }
      return;
    }

    if (action === 'vote') {
      var user = auth.currentUser;

      if (!user) {
        return;
      }

      var vote = target.getAttribute('data-vote');
      target.disabled = true;

      try {
        await setCommentVote(commentId, eggId, user, vote);
        await refreshCommentsUI(elements);
      } catch (error) {
        console.error(error);
      } finally {
        target.disabled = false;
      }
    }
  });

  elements.comments.addEventListener('submit', async function (event) {
    var form = event.target.closest('[data-reply-form]');

    if (!form) {
      return;
    }

    event.preventDefault();

    var user = auth.currentUser;

    if (!user) {
      return;
    }

    var replyToUsername = form.getAttribute('data-reply-to');
    var textarea = form.querySelector('textarea');
    var messageEl = form.querySelector('.egg-page__reply-message');
    var text = textarea.value.trim();

    if (!text) {
      showMessage(messageEl, 'Напиши ответ', 'error');
      return;
    }

    showMessage(messageEl, 'Отправляем...', 'info');

    try {
      var profile = await getUserProfile(user.uid);
      await addEggComment(eggId, profile, text, replyToUsername);
      form.hidden = true;
      textarea.value = '';
      showMessage(messageEl, '', 'info');
      await refreshCommentsUI(elements);
    } catch (error) {
      if (error.message === 'COMMENT_INVALID') {
        showMessage(messageEl, 'Ответ до 500 символов', 'error');
        return;
      }
      showMessage(messageEl, 'Не удалось отправить', 'error');
    }
  });
}

function bindEggOwnerActions(egg, elements) {
  if (!elements.ownerActions || elements.ownerActions.dataset.bound === '1') {
    return;
  }

  elements.ownerActions.dataset.bound = '1';

  elements.ownerActions.addEventListener('click', async function (event) {
    var button = event.target.closest('[data-action="delete-egg"]');

    if (!button || button.disabled) {
      return;
    }

    var user = auth.currentUser;

    if (!user || user.uid !== egg.ownerId) {
      return;
    }

    if (!window.confirm('Удалить яйцо из инкубатора? Это нельзя отменить.')) {
      return;
    }

    button.disabled = true;

    try {
      await deleteEgg(egg.id, user.uid);
      window.location.href = 'profile.html?u=' + encodeURIComponent(egg.ownerUsername);
    } catch (error) {
      console.error(error);
      button.disabled = false;
      window.alert('Не удалось удалить яйцо');
    }
  });
}

function updateOwnerActions(egg, user, elements) {
  if (!elements.ownerActions) {
    return;
  }

  if (!user || user.uid !== egg.ownerId) {
    elements.ownerActions.hidden = true;
    elements.ownerActions.innerHTML = '';
    return;
  }

  elements.ownerActions.hidden = false;
  elements.ownerActions.innerHTML =
    '<a class="btn btn--ghost egg__edit" href="edit-egg.html?id=' + encodeURIComponent(egg.id) + '">' +
      '<span class="btn__text">Редактировать</span>' +
    '</a>' +
    '<button type="button" class="btn btn--ghost egg__delete" data-action="delete-egg">' +
      '<span class="btn__text">Удалить</span>' +
    '</button>';

  bindEggOwnerActions(egg, elements);
}

export async function initEggPage(eggId, elements) {
  var egg = await getEggById(eggId);

  if (!egg || egg.published !== true) {
    return null;
  }

  renderEggPage(egg, elements);
  bindCommentForm(eggId, elements);
  bindCommentsInteractions(eggId, elements);

  var viewRecorded = false;

  onAuthStateChanged(auth, async function (user) {
    try {
      updateOwnerActions(egg, user, elements);
      await loadEggExtras(eggId, elements, user);

      if (user && !viewRecorded) {
        viewRecorded = true;
        await tryRecordView(eggId, user, elements.views);
      }
    } catch (error) {
      console.error(error);
    }
  });

  return egg;
}
