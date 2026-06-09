import { escapeHtml, statusLabel } from './utils.js';

function renderImage(egg) {
  var trackImage = egg.trackImage ? ' data-track="' + egg.trackImage + '"' : '';
  var alt = escapeHtml(egg.title);
  var src = escapeHtml(egg.imageUrl || '');

  if (egg.link) {
    return '<a class="egg__image-link" href="' + escapeHtml(egg.link) + '" target="_blank" rel="noopener noreferrer"' + trackImage + '>' +
      '<img class="egg__image' + (egg.contain ? ' egg__image--contain' : '') + '" src="' + src + '" alt="' + alt + '">' +
      '</a>';
  }

  return '<div class="egg__image-wrap">' +
    '<img class="egg__image' + (egg.contain ? ' egg__image--contain' : '') + '" src="' + src + '" alt="' + alt + '">' +
    '</div>';
}

function renderLink(egg) {
  if (!egg.link) {
    return '';
  }

  var trackLink = egg.trackLink ? ' data-track="' + egg.trackLink + '"' : '';

  return '<a class="btn btn--warm egg__link" href="' + escapeHtml(egg.link) + '" target="_blank" rel="noopener noreferrer"' + trackLink + '>' +
    '<span class="btn__shine" aria-hidden="true"></span>' +
    '<span class="btn__text">Перейти в Telegram</span>' +
    '<span class="btn__icon" aria-hidden="true">→</span>' +
    '</a>';
}

export function renderEggCard(egg) {
  var description = egg.description
    ? '<p class="egg__description">' + escapeHtml(egg.description) + '</p>'
    : '';

  var owner = egg.ownerUsername
    ? '<a class="egg__owner" href="profile.html?u=' + escapeHtml(egg.ownerUsername) + '">@' + escapeHtml(egg.ownerUsername) + '</a>'
    : '';

  return '<article class="egg" data-tilt>' +
    '<div class="egg__shell">' +
      '<div class="egg__warmth" aria-hidden="true"></div>' +
      '<span class="egg__status">' + escapeHtml(statusLabel(egg.status)) + '</span>' +
      renderImage(egg) +
      '<div class="egg__body">' +
        '<h3 class="egg__title">' + escapeHtml(egg.title) + '</h3>' +
        owner +
        description +
        renderLink(egg) +
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
    imageUrl: data.imageUrl || 'images/egg-placeholder.svg',
    link: data.link || null,
    status: data.status || 'greetsya',
    contain: !data.imageUrl,
    ownerUsername: data.ownerUsername || null
  };
}
