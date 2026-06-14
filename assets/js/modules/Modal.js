/**
 * IMB — Module Modal
 * Ouverture, fermeture, focus trap et accessibilité ARIA
 * Pattern : Module
 */

'use strict';

/**
 * Ouvre une modal
 * @param {string} overlayId — id de l'élément .modal-overlay
 */
export function openModal(overlayId) {
  const overlay = document.getElementById(overlayId);
  if (!overlay) return;

  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  // Focus sur le premier élément interactif
  const focusable = overlay.querySelector(
    'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  setTimeout(() => focusable?.focus(), 60);
}

/**
 * Ferme une modal
 * @param {string} overlayId
 */
export function closeModal(overlayId) {
  const overlay = document.getElementById(overlayId);
  if (!overlay) return;

  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

/**
 * Initialise les comportements globaux des modals
 * À appeler une fois au chargement de la page
 */
export function initModals() {
  // Boutons [data-close]
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.close));
  });

  // Clic sur l'overlay (fond)
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', event => {
      if (event.target === overlay) closeModal(overlay.id);
    });
  });

  // Touche Escape
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    document.querySelectorAll('.modal-overlay[aria-hidden="false"]')
      .forEach(overlay => closeModal(overlay.id));
  });
}
