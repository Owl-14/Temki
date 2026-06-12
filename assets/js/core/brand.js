var cfg = typeof window !== 'undefined' && window.BRAND_CONFIG ? window.BRAND_CONFIG : {};

export var APP_NAME = cfg.appName || 'Инкубатор';
export var AUTH_EMAIL_SENDER = cfg.authEmailSender || APP_NAME;
export var AUTH_EMAIL_FROM = cfg.authEmailFrom || 'noreply@temki-1409.firebaseapp.com';
export var AUTH_EMAIL_VERIFY_SUBJECT =
  cfg.authEmailVerifySubject || 'Verify your email for ' + APP_NAME;
export var AUTH_EMAIL_RESET_SUBJECT =
  cfg.authEmailResetSubject || APP_NAME + ' — сброс пароля';

export function authEmailInboxHint(subject) {
  return (
    'Письмо отправлено. Ищи «' +
    subject +
    '» от «' +
    AUTH_EMAIL_SENDER +
    '» во «Входящих» и «Спам».'
  );
}
