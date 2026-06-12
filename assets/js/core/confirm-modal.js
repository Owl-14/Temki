var modalEl = null;
var titleEl = null;
var textEl = null;
var cancelBtn = null;
var confirmBtn = null;
var pendingResolve = null;
var escapeHandler = null;
var lastFocused = null;

function finishConfirm(confirmed) {
  if (modalEl) {
    modalEl.hidden = true;
  }
  if (escapeHandler) {
    document.removeEventListener('keydown', escapeHandler);
    escapeHandler = null;
  }
  if (pendingResolve) {
    pendingResolve(confirmed);
    pendingResolve = null;
  }
  if (lastFocused && typeof lastFocused.focus === 'function') {
    lastFocused.focus();
    lastFocused = null;
  }
}

function ensureModal() {
  if (modalEl) {
    return modalEl;
  }

  modalEl = document.createElement('div');
  modalEl.className = 'confirm-modal';
  modalEl.hidden = true;
  modalEl.setAttribute('role', 'dialog');
  modalEl.setAttribute('aria-modal', 'true');
  modalEl.innerHTML =
    '<div class="confirm-modal__backdrop" data-confirm-close></div>' +
    '<div class="confirm-modal__panel">' +
    '<h2 class="confirm-modal__title" id="confirm-modal-title" data-confirm-title></h2>' +
    '<p class="confirm-modal__text" data-confirm-text hidden></p>' +
    '<div class="confirm-modal__actions">' +
    '<button class="btn btn--ghost" type="button" data-confirm-cancel>Отмена</button>' +
    '<button class="btn btn--danger" type="button" data-confirm-ok></button>' +
    '</div>' +
    '</div>';

  modalEl.setAttribute('aria-labelledby', 'confirm-modal-title');
  document.body.appendChild(modalEl);

  titleEl = modalEl.querySelector('[data-confirm-title]');
  textEl = modalEl.querySelector('[data-confirm-text]');
  cancelBtn = modalEl.querySelector('[data-confirm-cancel]');
  confirmBtn = modalEl.querySelector('[data-confirm-ok]');

  cancelBtn.addEventListener('click', function () {
    finishConfirm(false);
  });

  confirmBtn.addEventListener('click', function () {
    finishConfirm(true);
  });

  modalEl.querySelectorAll('[data-confirm-close]').forEach(function (el) {
    el.addEventListener('click', function () {
      finishConfirm(false);
    });
  });

  return modalEl;
}

/**
 * @param {{ title: string, text?: string, confirmLabel?: string, cancelLabel?: string }} options
 * @returns {Promise<boolean>}
 */
export function confirmAction(options) {
  ensureModal();

  titleEl.textContent = options.title || '';
  if (options.text) {
    textEl.textContent = options.text;
    textEl.hidden = false;
  } else {
    textEl.textContent = '';
    textEl.hidden = true;
  }

  confirmBtn.textContent = options.confirmLabel || 'Подтвердить';
  cancelBtn.textContent = options.cancelLabel || 'Отмена';

  lastFocused = document.activeElement;
  modalEl.hidden = false;
  confirmBtn.focus();

  if (escapeHandler) {
    document.removeEventListener('keydown', escapeHandler);
  }

  escapeHandler = function (event) {
    if (event.key === 'Escape' && modalEl && !modalEl.hidden) {
      finishConfirm(false);
    }
  };
  document.addEventListener('keydown', escapeHandler);

  return new Promise(function (resolve) {
    pendingResolve = resolve;
  });
}

export function confirmDeleteEgg() {
  return confirmAction({
    title: 'Вы точно хотите удалить своё яйцо?',
    text: 'Яйцо исчезнет из инкубатора без возможности восстановления.',
    confirmLabel: 'Да, удалить',
    cancelLabel: 'Отмена'
  });
}
