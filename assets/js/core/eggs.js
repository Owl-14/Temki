import { escapeHtml, statusLabel } from './utils.js';

function eggHref(egg) {
  if (egg.id) {
    return 'egg.html?id=' + encodeURIComponent(egg.id);
  }
  return null;
}

function renderImage(egg) {
  var alt = escapeHtml(egg.title);
  var src = escapeHtml(egg.imageUrl || '');
  var href = eggHref(egg);
  var imgClass = 'egg__image' + (egg.contain ? ' egg__image--contain' : '');

  if (href) {
    return '<a class="egg__image-link" href="' + href + '">' +
      '<img class="' + imgClass + '" src="' + src + '" alt="' + alt + '">' +
      '</a>';
  }

  return '<div class="egg__image-wrap">' +
    '<img class="' + imgClass + '" src="' + src + '" alt="' + alt + '">' +
    '</div>';
}

function renderLink(egg) {
  if (!egg.link) {
    return '';
  }

  var trackLink = egg.trackLink ? ' data-track="' + egg.trackLink + '"' : '';

  return '<a class="btn btn--warm egg__link" href="' + escapeHtml(egg.link) + '" target="_blank" rel="noopener noreferrer"' + trackLink + '>' +
    '<span class="btn__shine" aria-hidden="true"></span>' +
    '<span class="btn__text">Ссылка</span>' +
    '<span class="btn__icon" aria-hidden="true">→</span>' +
    '</a>';
}

function renderOwnerButtons(egg) {
  if (!egg.editable || !egg.id) {
    return '';
  }

  return '<a class="btn btn--ghost egg__edit" href="edit-egg.html?id=' + encodeURIComponent(egg.id) + '">' +
      '<span class="btn__text">Редактировать</span>' +
    '</a>' +
    '<button type="button" class="btn btn--ghost egg__delete" data-action="delete-egg" data-egg-id="' +
      escapeHtml(egg.id) + '">' +
      '<span class="btn__text">Удалить</span>' +
    '</button>';
}

export function renderEggCard(egg) {
  var description = egg.description
    ? '<p class="egg__description">' + escapeHtml(egg.description) + '</p>'
    : '';

  var owner = egg.ownerUsername
    ? '<a class="egg__owner" href="profile.html?u=' + escapeHtml(egg.ownerUsername) + '">@' + escapeHtml(egg.ownerUsername) + '</a>'
    : '';

  var titleHtml = egg.id
    ? '<h3 class="egg__title"><a class="egg__title-link" href="' + eggHref(egg) + '">' + escapeHtml(egg.title) + '</a></h3>'
    : '<h3 class="egg__title">' + escapeHtml(egg.title) + '</h3>';

  var heatBadge = egg.heat ? '<span class="egg__heat">🔥 ' + egg.heat + '</span>' : '';

  return '<article class="egg" data-tilt>' +
    '<div class="egg__shell">' +
      '<div class="egg__warmth" aria-hidden="true"></div>' +
      '<div class="egg__badges">' +
        '<span class="egg__status">' + escapeHtml(statusLabel(egg.status)) + '</span>' +
        heatBadge +
      '</div>' +
      renderImage(egg) +
      '<div class="egg__body">' +
        titleHtml +
        owner +
        description +
        '<div class="egg__actions">' +
          renderOwnerButtons(egg) +
          renderLink(egg) +
        '</div>' +
      '</div>' +
    '</div>' +
  '</article>';
}

export function renderEggs(container, eggs) {
  if (!container) {
    return;
  }

  container.innerHTML = eggs.map(renderEggCard).join('');

  if (window.initEggTilt) {
    window.initEggTilt(container);
  }
}

export function mapFirestoreEgg(data) {
  return {
    id: data.id,
    title: data.title,
    description: data.description || '',
    imageUrl: data.imageUrl || '../assets/images/egg-placeholder.svg',
    link: data.link || null,
    status: data.status || 'greetsya',
    heat: data.heat || 0,
    contain: !data.imageUrl,
    ownerUsername: data.ownerUsername || null
  };
}
