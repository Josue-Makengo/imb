/**
 * IMB — Landing page JavaScript
 * Header scroll · Menu mobile · Scroll reveal · Counters · Formulaire EmailJS
 */

'use strict';

/* ══════════════════════════════════════════════════
   MODULE — Header scroll
   ══════════════════════════════════════════════════ */
const Header = (() => {
  const _el = document.getElementById('header');
  let _scrolled = false;

  function _onScroll() {
    const should = window.scrollY > 60;
    if (should === _scrolled) return;
    _scrolled = should;
    _el?.classList.toggle('scrolled', _scrolled);
  }

  function init() {
    window.addEventListener('scroll', _onScroll, { passive: true });
    _onScroll();
  }

  return { init };
})();

/* ══════════════════════════════════════════════════
   MODULE — Menu mobile
   ══════════════════════════════════════════════════ */
const MobileMenu = (() => {
  const _burger = document.getElementById('burger');
  const _menu = document.getElementById('mobile-menu');
  const _overlay = document.getElementById('mobile-overlay');
  const _close = document.getElementById('mobile-close');

  function open() {
    _menu?.classList.add('open');
    _overlay?.classList.add('open');
    _burger?.setAttribute('aria-expanded', 'true');
    _menu?.removeAttribute('aria-hidden');
    document.body.style.overflow = 'hidden';
    _close?.focus();
  }

  function close() {
    _menu?.classList.remove('open');
    _overlay?.classList.remove('open');
    _burger?.setAttribute('aria-expanded', 'false');
    _menu?.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    _burger?.focus();
  }

  function init() {
    _burger?.addEventListener('click', open);
    _close?.addEventListener('click', close);
    _overlay?.addEventListener('click', close);

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') close();
    });

    // Fermer au clic sur un lien
    _menu?.querySelectorAll('.mobile-menu__link, .header__cta').forEach(link => {
      link.addEventListener('click', close);
    });
  }

  return { init };
})();

/* ══════════════════════════════════════════════════
   MODULE — Scroll Reveal
   Pattern : Observer (IntersectionObserver)
   ══════════════════════════════════════════════════ */
const ScrollReveal = (() => {
  function init() {
    const elements = document.querySelectorAll('.reveal');
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (!entry.isIntersecting) return;
          setTimeout(() => {
            entry.target.classList.add('in-view');
          }, i * 80);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12 }
    );

    elements.forEach(el => observer.observe(el));
  }

  return { init };
})();

/* ══════════════════════════════════════════════════
   MODULE — Compteurs animés
   ══════════════════════════════════════════════════ */
const Counters = (() => {
  /**
   * Anime un compteur de 0 à target
   * @param {HTMLElement} el
   * @param {number} target
   * @param {number} duration — ms
   */
  function _animateCount(el, target, duration = 2000) {
    if (target === 0) { el.textContent = '0'; return; }
    const start = performance.now();
    const easeOut = t => 1 - Math.pow(1 - t, 3);
    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      el.textContent = Math.round(easeOut(progress) * target).toLocaleString('fr-FR');
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /**
   * Attend que __IMB_STATS__ soit disponible puis anime
   * Réessaie toutes les 200ms pendant max 8 secondes
   */
  function _waitAndAnimate(el, statKey, maxWait = 8000) {
    const start = Date.now();
    function tryAnimate() {
      const stats = window.__IMB_STATS__;
      if (stats && stats[statKey] !== undefined) {
        _animateCount(el, stats[statKey]);
        return;
      }
      if (Date.now() - start < maxWait) {
        setTimeout(tryAnimate, 200);
      } else {
        // Firebase n'a pas répondu — afficher 0
        el.textContent = '0';
      }
    }
    tryAnimate();
  }

  const STAT_KEYS = {
    'stat-students': 'students',
    'stat-parents': 'parents',
    'stat-schools': 'schools',
  };

  function init() {
    const counters = document.querySelectorAll('.stat-counter');
    if (!counters.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const sectionId = el.closest('[id]')?.id;
          const statKey = STAT_KEYS[sectionId];
          if (statKey) {
            _waitAndAnimate(el, statKey);
          } else {
            _animateCount(el, parseInt(el.dataset.target, 10) || 0);
          }
          observer.unobserve(el);
        });
      },
      { threshold: 0.3 }
    );

    counters.forEach(el => observer.observe(el));
  }

  /**
   * Rafraîchir les compteurs depuis l'extérieur
   * Appelé depuis index.html après réception des stats Firebase
   */
  function refresh() {
    const stats = window.__IMB_STATS__;
    if (!stats) return;
    Object.entries(STAT_KEYS).forEach(([sectionId, statKey]) => {
      const el = document.querySelector(`#${sectionId} .stat-counter`);
      if (el) {
        const val = stats[statKey] ?? 0;
        // Forcer l'animation même si le compteur était à 0
        el.textContent = '0';
        _animateCount(el, val);
      }
    });
  }

  return { init, refresh };

  return { init };
})();

/* ══════════════════════════════════════════════════
   MODULE — Formulaire de contact (EmailJS)
   Envoie directement à josmakengim@gmail.com
   ══════════════════════════════════════════════════ */
const ContactForm = (() => {
  const _form = document.getElementById('contact-form');
  const _submit = document.getElementById('form-submit');
  const _success = document.getElementById('form-success');
  const _error = document.getElementById('form-error');
  const _errMsg = document.getElementById('form-error-msg');
  const _charCnt = document.getElementById('char-count');

  // ── Configuration EmailJS ──
  // 1. Créer un compte sur https://emailjs.com (gratuit jusqu'à 200 emails/mois)
  // 2. Ajouter un service Gmail
  // 3. Créer un template et copier les IDs ci-dessous
  const EMAILJS_SERVICE_ID = 'VOTRE_SERVICE_ID'; // ex: service_xxxxxxx
  const EMAILJS_TEMPLATE_ID = 'VOTRE_TEMPLATE_ID'; // ex: template_xxxxxxx
  const EMAILJS_PUBLIC_KEY = 'VOTRE_PUBLIC_KEY'; // ex: xxxxxxxxxxxxxx

  function _getVal(id) {
    return (document.getElementById(id)?.value ?? '').trim();
  }

  function _validate() {
    const firstname = _getVal('cf-firstname');
    const lastname = _getVal('cf-lastname');
    const email = _getVal('cf-email');
    const school = _getVal('cf-school');
    const role = _getVal('cf-role');
    const message = _getVal('cf-message');

    if (!firstname || !lastname || !email || !school || !role || !message) {
      _showError('Veuillez remplir tous les champs obligatoires.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      _showError('Veuillez entrer une adresse email valide.');
      return false;
    }

    return true;
  }

  function _showError(msg) {
    if (_error) _error.removeAttribute('hidden');
    if (_errMsg) _errMsg.textContent = msg;
  }

  function _hideError() {
    _error?.setAttribute('hidden', '');
  }

  function _setLoading(loading) {
    if (!_submit) return;
    _submit.disabled = loading;
    _submit.innerHTML = loading
      ? '<i class="fa-solid fa-circle-notch fa-spin" aria-hidden="true"></i> Envoi en cours…'
      : '<i class="fa-solid fa-paper-plane" aria-hidden="true"></i> Envoyer le message';
  }

  async function _handleSubmit(event) {
    event.preventDefault();
    _hideError();

    if (!_validate()) return;

    _setLoading(true);

    try {
      // Vérifier que EmailJS est chargé
      if (typeof emailjs === 'undefined') {
        throw new Error('EmailJS non chargé');
      }

      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          from_firstname: _getVal('cf-firstname'),
          from_lastname: _getVal('cf-lastname'),
          from_email: _getVal('cf-email'),
          from_school: _getVal('cf-school'),
          from_role: _getVal('cf-role'),
          from_phone: _getVal('cf-phone') || 'Non renseigné',
          message: _getVal('cf-message'),
          to_email: 'josmakengim@gmail.com',
          reply_to: _getVal('cf-email'),
        },
        EMAILJS_PUBLIC_KEY
      );

      // Succès
      _form.reset();
      if (_charCnt) _charCnt.textContent = '0';
      _success?.removeAttribute('hidden');
      _success?.scrollIntoView({ behavior: 'smooth', block: 'center' });

    } catch (err) {
      console.error('EmailJS error:', err);
      _showError(
        'Une erreur est survenue lors de l\'envoi. Contactez-nous directement à josmakengim@gmail.com'
      );
    } finally {
      _setLoading(false);
    }
  }

  function _initCharCount() {
    const textarea = document.getElementById('cf-message');
    textarea?.addEventListener('input', () => {
      if (_charCnt) _charCnt.textContent = textarea.value.length;
    });
  }

  function init() {
    _form?.addEventListener('submit', _handleSubmit);
    _initCharCount();
  }

  return { init };
})();

/* ══════════════════════════════════════════════════
   MODULE — Footer année
   ══════════════════════════════════════════════════ */
function initFooterYear() {
  const el = document.getElementById('footer-year');
  if (el) el.textContent = new Date().getFullYear();
}

/* ══════════════════════════════════════════════════
   BOOTSTRAP
   ══════════════════════════════════════════════════ */
// Écouter les stats Firebase dès que possible (avant DOMContentLoaded)
window.addEventListener('imb:stats-ready', () => {
  Counters.refresh();
});

document.addEventListener('DOMContentLoaded', () => {
  Header.init();
  MobileMenu.init();
  ScrollReveal.init();
  Counters.init();
  ContactForm.init();
  initFooterYear();

  // Si les stats sont déjà disponibles au chargement → rafraîchir immédiatement
  if (window.__IMB_STATS__) {
    Counters.refresh();
  }
});
