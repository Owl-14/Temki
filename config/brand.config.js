/**
 * Бренд и тексты писем Auth — должны совпадать с Firebase Console:
 * - Project settings → Public-facing name
 * - Authentication → Templates → Template settings → Sender name
 * - Password reset → Subject (если русифицирован)
 */
window.BRAND_CONFIG = {
  appName: 'Инкубатор',
  authEmailSender: 'Инкубатор',
  authEmailFrom: 'noreply@temki-1409.firebaseapp.com',
  /** Тема verification: шаблон Firebase, %APP_NAME% = appName */
  authEmailVerifySubject: 'Verify your email for Инкубатор',
  authEmailResetSubject: 'Инкубатор — сброс пароля'
};
