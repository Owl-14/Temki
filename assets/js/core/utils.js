var RESERVED_USERNAMES = [
  'admin', 'inkubator', 'incubator', 'api', 'auth', 'settings',
  'profile', 'lay-egg', 'eggs', 'index', 'www'
];

export function normalizeUsername(value) {
  return String(value || '').trim().toLowerCase();
}

export function validateDisplayName(name) {
  var value = String(name || '').trim();

  if (!value) {
    return 'Введи имя';
  }
  if (value.length > 40) {
    return 'Имя — до 40 символов';
  }
  return null;
}

export function validateUsername(username, label) {
  var fieldLabel = label || 'Юзернейм';
  var normalized = normalizeUsername(username);

  if (normalized.length < 3 || normalized.length > 20) {
    return fieldLabel + ': от 3 до 20 символов';
  }
  if (!/^[a-z0-9_]+$/.test(normalized)) {
    return fieldLabel + ': только латиница';
  }
  if (RESERVED_USERNAMES.indexOf(normalized) !== -1) {
    return 'Этот ' + fieldLabel.toLowerCase() + ' занят системой';
  }
  return null;
}

export function validateEmail(email) {
  var value = String(email || '').trim().toLowerCase();

  if (!value) {
    return 'Укажи email';
  }
  if (value.length > 254) {
    return 'Слишком длинный email';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return 'Некорректный email';
  }
  return null;
}

export function validatePassword(password, minLength) {
  var min = minLength || 8;
  var value = String(password || '');

  if (!value) {
    return 'Введи пароль';
  }
  if (value.length < min) {
    return 'Пароль минимум ' + min + ' символов';
  }
  return null;
}

export function setFormFieldError(formEl, fieldName, message) {
  if (!formEl) {
    return;
  }

  var input = formEl.querySelector('[name="' + fieldName + '"]');
  if (!input) {
    return;
  }

  var wrapper = input.closest('.form__field');
  if (!wrapper) {
    return;
  }

  var errorEl = wrapper.querySelector('.form__field-error');
  if (!errorEl) {
    return;
  }

  if (message) {
    wrapper.classList.add('form__field--invalid');
    input.setAttribute('aria-invalid', 'true');
    errorEl.textContent = message;
    errorEl.hidden = false;
  } else {
    wrapper.classList.remove('form__field--invalid');
    input.removeAttribute('aria-invalid');
    errorEl.textContent = '';
    errorEl.hidden = true;
  }
}

export function clearFormFieldErrors(formEl) {
  if (!formEl) {
    return;
  }

  formEl.querySelectorAll('.form__field').forEach(function (wrapper) {
    wrapper.classList.remove('form__field--invalid');
    var input = wrapper.querySelector('.form__input, .form__textarea');
    var errorEl = wrapper.querySelector('.form__field-error');

    if (input) {
      input.removeAttribute('aria-invalid');
    }
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.hidden = true;
    }
  });
}

export function statusLabel(status) {
  if (status === 'tsyplenok') {
    return 'цыплёнок';
  }
  if (status === 'kuritsa') {
    return 'курица';
  }
  return 'греется';
}

export function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

export function formatDate(timestamp) {
  if (!timestamp || !timestamp.toDate) {
    return '';
  }

  return timestamp.toDate().toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function viewsLabel(count) {
  var n = count || 0;
  var mod10 = n % 10;
  var mod100 = n % 100;

  if (mod100 >= 11 && mod100 <= 14) {
    return n + ' просмотров';
  }
  if (mod10 === 1) {
    return n + ' просмотр';
  }
  if (mod10 >= 2 && mod10 <= 4) {
    return n + ' просмотра';
  }
  return n + ' просмотров';
}

export var MAX_AVATAR_DATA_URL_BYTES = 280000;
export var MAX_EGG_DATA_URL_BYTES = 450000;

export function blobToDataUrl(blob) {
  return new Promise(function (resolve, reject) {
    var reader = new FileReader();

    reader.onload = function () {
      resolve(reader.result);
    };

    reader.onerror = function () {
      reject(new Error('Не удалось прочитать изображение'));
    };

    reader.readAsDataURL(blob);
  });
}

export async function blobToSizedDataUrl(blob, maxBytes) {
  var dataUrl = await blobToDataUrl(blob);

  if (dataUrl.length > maxBytes) {
    throw new Error('Фото слишком большое — выбери другое или меньшее');
  }

  return dataUrl;
}

export function resizeImageFile(file, maxSize) {
  return new Promise(function (resolve, reject) {
    var reader = new FileReader();

    reader.onload = function (event) {
      var img = new Image();

      img.onload = function () {
        var size = maxSize || 400;
        var scale = Math.min(1, size / Math.max(img.width, img.height));
        var width = Math.round(img.width * scale);
        var height = Math.round(img.height * scale);
        var canvas = document.createElement('canvas');

        canvas.width = width;
        canvas.height = height;

        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(function (blob) {
          if (!blob) {
            reject(new Error('Не удалось обработать изображение'));
            return;
          }
          resolve(blob);
        }, 'image/webp', maxSize >= 600 ? 0.78 : 0.85);
      };

      img.onerror = function () {
        reject(new Error('Неверный формат изображения'));
      };

      img.src = event.target.result;
    };

    reader.onerror = function () {
      reject(new Error('Не удалось прочитать файл'));
    };

    reader.readAsDataURL(file);
  });
}

export function showMessage(element, text, type) {
  if (!element) {
    return;
  }
  element.textContent = text;
  element.hidden = !text;
  element.className = 'form-message form-message--' + (type || 'info');
}
