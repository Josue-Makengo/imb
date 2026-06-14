/**
 * IMB — Module Toast
 * Notifications visuelles non-bloquantes
 * Pattern : Module
 */

'use strict';

/** Icônes Font Awesome par type */
const TYPE_ICONS = {
  success: 'fa-circle-check',
  error:   'fa-circle-xmark',
  info:    'fa-circle-info',
  warn:    'fa-triangle-exclamation',
};

/**
 * Affiche une notification toast
 * @param {string}  message
 * @param {'success'|'error'|'info'|'warn'} type
 * @param {number}  duration — millisecondes avant disparition
 */
export function showToast(message, type = 'success', duration = 3500) {
  // Créer le conteneur si absent
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id        = 'toast-container';
    container.className = 'toast-container';
    container.setAttribute('role',       'status');
    container.setAttribute('aria-live',  'polite');
    container.setAttribute('aria-atomic','false');
    document.body.appendChild(container);
  }

  // Créer le toast
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('data-type', type);

  toast.innerHTML = `
    <i class="fa-solid ${TYPE_ICONS[type] ?? 'fa-bell'}" aria-hidden="true"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  // Retirer après la durée
  setTimeout(() => {
    toast.style.animation = 'toast-slide-out 300ms var(--ease) forwards';
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, duration);
}
