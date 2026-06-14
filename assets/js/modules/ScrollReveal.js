/**
 * IMB — Module ScrollReveal
 * Anime les éléments .reveal quand ils entrent dans le viewport
 * Pattern : Observer (IntersectionObserver)
 */

'use strict';

/**
 * Initialise les animations au scroll
 * @param {number} threshold — ratio de visibilité déclencheur (0–1)
 * @param {number} stagger   — délai entre éléments visibles en même temps (ms)
 */
export function initScrollReveal(threshold = 0.12, stagger = 80) {
  const elements = document.querySelectorAll('.reveal');
  if (!elements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, index) => {
        if (!entry.isIntersecting) return;
        setTimeout(
          () => entry.target.classList.add('in-view'),
          index * stagger
        );
        observer.unobserve(entry.target);
      });
    },
    { threshold }
  );

  elements.forEach(el => observer.observe(el));
}
