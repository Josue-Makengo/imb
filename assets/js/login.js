/**
 * IMB — Page de connexion Administrateur
 * Firebase Authentication — Email / Mot de passe
 */

'use strict';

import {
  AuthService,
  UserService,
} from './services/firebase.js';

/* ══════════════════════════════════════════════════
   ÉLÉMENTS DOM
   ══════════════════════════════════════════════════ */
const _form = document.getElementById('login-form');
const _emailInput = document.getElementById('login-email');
const _passInput = document.getElementById('login-password');
const _submitBtn = document.getElementById('login-submit');
const _errorBox = document.getElementById('login-error');
const _errorMsg = document.getElementById('login-error-msg');
const _successBox = document.getElementById('login-success');
const _eyeBtn = document.getElementById('password-eye');

/* ══════════════════════════════════════════════════
   MODULE — Messages UI
   ══════════════════════════════════════════════════ */
function showError(message) {
  if (_errorBox) _errorBox.setAttribute('data-visible', 'true');
  if (_errorMsg) _errorMsg.textContent = message;
  if (_successBox) _successBox.setAttribute('data-visible', 'false');
}

function hideError() {
  if (_errorBox) _errorBox.setAttribute('data-visible', 'false');
}

function showSuccess(message) {
  if (_successBox) {
    _successBox.setAttribute('data-visible', 'true');
    _successBox.querySelector('span').textContent = message;
  }
  if (_errorBox) _errorBox.setAttribute('data-visible', 'false');
}

function setLoading(loading) {
  if (!_submitBtn) return;
  _submitBtn.disabled = loading;
  _submitBtn.innerHTML = loading
    ? '<i class="fa-solid fa-circle-notch fa-spin" aria-hidden="true"></i> Connexion en cours…'
    : '<i class="fa-solid fa-arrow-right-to-bracket" aria-hidden="true"></i> Se connecter';
}

/* ══════════════════════════════════════════════════
   MODULE — Mappage des erreurs Firebase en français
   ══════════════════════════════════════════════════ */
function mapFirebaseError(code) {
  const errors = {
    'auth/invalid-email': 'Adresse email invalide.',
    'auth/user-not-found': 'Aucun compte trouvé avec cette adresse email.',
    'auth/wrong-password': 'Mot de passe incorrect.',
    'auth/invalid-credential': 'Email ou mot de passe incorrect.',
    'auth/too-many-requests': 'Trop de tentatives. Réessayez dans quelques minutes.',
    'auth/user-disabled': 'Ce compte a été désactivé. Contactez l\'administrateur.',
    'auth/network-request-failed': 'Erreur réseau. Vérifiez votre connexion internet.',
  };
  return errors[code] ?? 'Une erreur est survenue. Veuillez réessayer.';
}

/* ══════════════════════════════════════════════════
   MODULE — Soumission du formulaire
   ══════════════════════════════════════════════════ */
async function handleSubmit(event) {
  event.preventDefault();
  hideError();

  const email = _emailInput?.value.trim() ?? '';
  const password = _passInput?.value.trim() ?? '';

  // Validation basique
  if (!email || !password) {
    showError('Veuillez remplir l\'email et le mot de passe.');
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showError('Adresse email invalide.');
    return;
  }

  setLoading(true);

  try {
    // Connexion Firebase Auth
    const credential = await AuthService.login(email, password);
    const uid = credential.user.uid;

    // Vérifier le profil dans Firestore
    const profile = await UserService.getProfile(uid);

    if (!profile) {
      await AuthService.logout();
      showError('Aucun profil trouvé dans la base de données. Contactez le support IMB.');
      return;
    }

    if (profile.role !== 'admin') {
      await AuthService.logout();
      showError('Accès refusé — cette interface est réservée aux administrateurs.');
      return;
    }

    if (profile.status === 'inactive') {
      await AuthService.logout();
      showError('Votre compte est désactivé. Contactez le support IMB.');
      return;
    }

    // ✅ Connexion réussie
    showSuccess(`Bienvenue ${profile.firstName} ! Redirection…`);

    // Sauvegarder la session
    sessionStorage.setItem('imb_user', JSON.stringify({
      uid,
      role: profile.role,
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      schoolId: profile.schoolId,
    }));

    // Rediriger vers admin.html après 1 seconde
    setTimeout(() => {
      window.location.href = 'admin.html';
    }, 1000);

  } catch (error) {
    console.error('IMB Login error:', error.code, error.message);
    showError(mapFirebaseError(error.code));
  } finally {
    setLoading(false);
  }
}

/* ══════════════════════════════════════════════════
   MODULE — Afficher/masquer le mot de passe
   ══════════════════════════════════════════════════ */
function togglePassword() {
  if (!_passInput || !_eyeBtn) return;
  const isHidden = _passInput.type === 'password';
  _passInput.type = isHidden ? 'text' : 'password';
  const icon = _eyeBtn.querySelector('i');
  if (icon) icon.className = isHidden ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
  _eyeBtn.setAttribute('aria-label', isHidden ? 'Masquer le mot de passe' : 'Afficher le mot de passe');
}

/* ══════════════════════════════════════════════════
   VÉRIFIER SI DÉJÀ CONNECTÉ
   Si l'admin est déjà connecté → rediriger directement
   ══════════════════════════════════════════════════ */
function checkExistingSession() {
  AuthService.onAuthChange(async user => {
    if (!user) return;
    try {
      const profile = await UserService.getProfile(user.uid);
      if (profile?.role === 'admin' && profile?.status === 'active') {
        window.location.href = 'admin.html';
      }
    } catch {
      // Pas de session valide
    }
  });
}

/* ══════════════════════════════════════════════════
   BOOTSTRAP
   ══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  checkExistingSession();
  _form?.addEventListener('submit', handleSubmit);
  _eyeBtn?.addEventListener('click', togglePassword);

  // Focus automatique sur l'email
  _emailInput?.focus();

  // Footer année
  const yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});
