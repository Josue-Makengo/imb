/**
 * IMB — Interface Administrateur
 * Mode démo fonctionnel + Firebase optionnel
 *
 * LOGIQUE : L'interface fonctionne TOUJOURS en mode démo.
 * Quand Firebase est configuré, les vraies données remplacent la démo.
 *
 * Patterns : Module, Singleton (DataStore), Observer, Factory
 */

'use strict';

import { closeModal, initModals, openModal } from './modules/Modal.js';
import { showToast } from './modules/Toast.js';
import { UserFactory } from './patterns/UserFactory.js';

/* ══════════════════════════════════════════════════
   DONNÉES DÉMO — Noms congolais authentiques
   Remplacées par Firebase quand configuré
   ══════════════════════════════════════════════════ */
const DEMO_TEACHERS = [
  {
    id: 'demo-t1', role: 'teacher', firstName: 'Alphonsine', lastName: 'Imbanzia',
    email: 'a.imbanzia@imb.cd', phone: '+243810001001',
    assignedClass: 'CM2 A', studentCount: 28, status: 'active',
    createdAt: '10/01/2026',
  },
  {
    id: 'demo-t2', role: 'teacher', firstName: 'Patient', lastName: 'Tshibangu',
    email: 'p.tshibangu@imb.cd', phone: '+243820002002',
    assignedClass: 'CM1 B', studentCount: 31, status: 'active',
    createdAt: '12/01/2026',
  },
  {
    id: 'demo-t3', role: 'teacher', firstName: 'Joséphine', lastName: 'Kambayolo',
    email: 'j.kambayolo@imb.cd', phone: '+243830003003',
    assignedClass: 'CE2 A', studentCount: 25, status: 'active',
    createdAt: '15/01/2026',
  },
  {
    id: 'demo-t4', role: 'teacher', firstName: 'Théodore', lastName: 'Mboti',
    email: 't.mboti@imb.cd', phone: '+243840004004',
    assignedClass: 'CP A', studentCount: 22, status: 'inactive',
    createdAt: '20/01/2026',
  },
];

const DEMO_PARENTS = [
  {
    id: 'demo-p1', role: 'parent', firstName: 'Clémentine', lastName: 'Tshibanda',
    email: 'c.tshibanda@gmail.com', phone: '+243810011011',
    parentId: 'IMB-PAR-10042', children: ['Lucas Tshibanda — CM2 A', 'Marie Tshibanda — CE2 A'],
    status: 'active', createdAt: '11/01/2026',
  },
  {
    id: 'demo-p2', role: 'parent', firstName: 'Emmanuel', lastName: 'Mbulu',
    email: 'e.mbulu@gmail.com', phone: '+243820022022',
    parentId: 'IMB-PAR-10043', children: ['Junior Mbulu — CM1 B'],
    status: 'active', createdAt: '13/01/2026',
  },
  {
    id: 'demo-p3', role: 'parent', firstName: 'Grâce', lastName: 'Bimbakila',
    email: 'g.bimbakila@gmail.com', phone: '+243830033033',
    parentId: 'IMB-PAR-10044', children: ['Espoir Bimbakila — CP A'],
    status: 'active', createdAt: '16/01/2026',
  },
  {
    id: 'demo-p4', role: 'parent', firstName: 'Rodrigue', lastName: 'Maghoma',
    email: 'r.maghoma@gmail.com', phone: '+243840044044',
    parentId: 'IMB-PAR-10045',
    children: ['Prince Maghoma — CM2 A', 'Gloire Maghoma — CM1 B', 'Séraphine Maghoma — CE2 A'],
    status: 'active', createdAt: '18/01/2026',
  },
];

const DEMO_FEED = [
  { type: 'create', text: '<strong>Compte créé</strong> — Alphonsine Imbanzia (Enseignante, CM2 A)' },
  { type: 'login',  text: '<strong>Connexion</strong> — Emmanuel Mbulu (Parent)' },
  { type: 'update', text: '<strong>Rapport soumis</strong> — Patient Tshibangu pour Lucas Tshibanda' },
  { type: 'create', text: '<strong>Nouveau parent</strong> — Rodrigue Maghoma — 3 enfants associés' },
  { type: 'login',  text: '<strong>Connexion</strong> — Joséphine Kambayolo (Enseignante)' },
];

/* ══════════════════════════════════════════════════
   SINGLETON — DataStore
   ══════════════════════════════════════════════════ */
const DataStore = (() => {
  // Récupérer depuis sessionStorage si disponible (persiste pendant la session)
  const _savedTeachers = sessionStorage.getItem('imb_teachers');
  const _savedParents  = sessionStorage.getItem('imb_parents');
  let _teachers = _savedTeachers ? JSON.parse(_savedTeachers) : [...DEMO_TEACHERS];
  let _parents  = _savedParents  ? JSON.parse(_savedParents)  : [...DEMO_PARENTS];
  let _students = [];
  let _schoolId = 'demo-school';
  let _isDemo   = true;
  const _subs   = new Set();

  function _notify(event, payload) {
    _subs.forEach(fn => fn(event, payload));
  }

  return {
    getTeachers: () => [..._teachers],
    getParents:  () => [..._parents],
    getStudents: () => [..._students],
    getSchoolId: () => _schoolId,
    isDemo:      () => _isDemo,

    setSchoolId(id)   { _schoolId = id; },
    setTeachers(list) { _teachers = list; _isDemo = false; _notify('teachers:loaded', list); },
    setParents(list)  { _parents  = list; _isDemo = false; _notify('parents:loaded',  list); },
    setStudents(list) { _students = list; _notify('students:loaded', list); },

    addTeacher(u) {
      _teachers.push(u);
      sessionStorage.setItem('imb_teachers', JSON.stringify(_teachers));
      _notify('teacher:add', u);
    },
    addParent(u) {
      _parents.push(u);
      sessionStorage.setItem('imb_parents', JSON.stringify(_parents));
      _notify('parent:add', u);
    },

    deleteTeacher(id) {
      _teachers = _teachers.filter(t => t.id !== id);
      sessionStorage.setItem('imb_teachers', JSON.stringify(_teachers));
      _notify('teacher:delete', { id });
    },
    deleteParent(id) {
      _parents = _parents.filter(p => p.id !== id);
      sessionStorage.setItem('imb_parents', JSON.stringify(_parents));
      _notify('parent:delete', { id });
    },

    toggleStatus(role, id) {
      const list = role === 'teacher' ? _teachers : _parents;
      const user = list.find(u => u.id === id);
      if (!user) return;
      user.status = user.status === 'active' ? 'inactive' : 'active';
      _notify(`${role}:update`, user);
    },

    counts() {
      return { teachers: _teachers.length, parents: _parents.length, students: _students.length };
    },

    subscribe(fn)   { _subs.add(fn); },
    unsubscribe(fn) { _subs.delete(fn); },
  };
})();

/* ══════════════════════════════════════════════════
   MODULE — Chargement Firebase (optionnel)
   ══════════════════════════════════════════════════ */
const DataLoader = {
  async tryLoadFirebase() {
    try {
      const { AuthService, UserService } = await import('./services/firebase.js');

      return new Promise(resolve => {
        // Timeout de sécurité — si Firebase ne répond pas en 8s → mode démo
        const timeout = setTimeout(() => {
          console.warn('IMB: Firebase timeout — mode démo maintenu');
          resolve(false);
        }, 8000);

        AuthService.onAuthChange(async user => {
          clearTimeout(timeout);

          if (!user) {
            // Pas connecté via Firebase → mode démo (pas de redirection ici)
            console.info('IMB: Aucun utilisateur connecté — mode démo actif');
            resolve(false);
            return;
          }

          try {
            console.info('IMB: Utilisateur Firebase détecté —', user.email);
            const profile = await UserService.getProfile(user.uid);

            if (!profile) {
              console.warn('IMB: Profil Firestore introuvable pour UID:', user.uid);
              // Afficher quand même l'email Firebase dans la sidebar
              UI.updateSidebarUser({
                firstName: 'Admin',
                lastName:  '',
                email:     user.email,
              });
              resolve(false);
              return;
            }

            // ✅ Profil trouvé — charger les vraies données
            DataStore.setSchoolId(profile.schoolId ?? 'imb-platform');
            UI.updateSidebarUser(profile);
            UI.hideDemoBanner();

            const schoolId = DataStore.getSchoolId();
            const [teachers, parents] = await Promise.all([
              UserService.listByRole(schoolId, 'teacher'),
              UserService.listByRole(schoolId, 'parent'),
            ]);

            DataStore.setTeachers(teachers);
            DataStore.setParents(parents);
            Tables.renderTeachers();
            Tables.renderParents();

            // Charger les élèves depuis Firebase
            await Students.loadFromFirebase(schoolId);

            UI.updateKPIs();
            UI.updateActivationStats();
            showToast(`Bienvenue ${profile.firstName} — données IMB chargées.`, 'success', 3000);
            resolve(true);

          } catch (err) {
            console.error('IMB: Erreur chargement profil Firebase:', err);
            showToast('Connexion Firebase établie mais erreur de chargement.', 'warn');
            resolve(false);
          }
        });
      });

    } catch (err) {
      console.warn('IMB: Firebase non disponible —', err.message);
      return false;
    }
  },
};

/* ══════════════════════════════════════════════════
   MODULE — Navigation
   ══════════════════════════════════════════════════ */
const Navigation = (() => {
  const _navItems  = document.querySelectorAll('.nav-item[data-page]');
  const _pages     = document.querySelectorAll('.page');
  const _subtitle  = document.getElementById('topbar-subtitle');
  const _listeners = new Set();

  const LABELS = {
    dashboard: '/ Tableau de bord',
    teachers:  '/ Enseignants',
    parents:   '/ Parents',
    students:  '/ Élèves',
    classes:   '/ Classes',
    reports:   '/ Rapports',
    settings:  '/ Paramètres',
  };

  function goTo(pageId) {
    _navItems.forEach(item => {
      item.setAttribute('aria-current', item.dataset.page === pageId ? 'page' : 'false');
    });
    _pages.forEach(page => {
      page.setAttribute('data-active', String(page.id === `page-${pageId}`));
    });
    if (_subtitle) _subtitle.textContent = LABELS[pageId] ?? '';
    _listeners.forEach(fn => fn(pageId));
    Sidebar.close();

    // Scroll vers le haut du contenu
    document.getElementById('main')?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function onNavigate(fn) { _listeners.add(fn); }

  function init() {
    _navItems.forEach(item => {
      item.addEventListener('click', () => goTo(item.dataset.page));
    });
  }

  return { init, goTo, onNavigate };
})();

/* ══════════════════════════════════════════════════
   MODULE — Sidebar responsive
   ══════════════════════════════════════════════════ */
const Sidebar = (() => {
  const _sidebar = document.getElementById('sidebar');
  const _burger  = document.getElementById('burger');
  const _overlay = document.getElementById('sidebar-overlay');

  function open() {
    _sidebar?.setAttribute('data-open', 'true');
    _burger?.setAttribute('aria-expanded', 'true');
    _overlay?.setAttribute('data-open', 'true');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    _sidebar?.setAttribute('data-open', 'false');
    _burger?.setAttribute('aria-expanded', 'false');
    _overlay?.setAttribute('data-open', 'false');
    document.body.style.overflow = '';
  }

  function init() {
    _burger?.addEventListener('click', () => {
      _sidebar?.getAttribute('data-open') === 'true' ? close() : open();
    });
    _overlay?.addEventListener('click', close);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }

  return { init, open, close };
})();

/* ══════════════════════════════════════════════════
   MODULE — UI
   ══════════════════════════════════════════════════ */
const UI = {
  updateKPIs() {
    const { teachers, parents, students } = DataStore.counts();
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('kpi-teachers',   teachers);
    set('kpi-parents',    parents);
    set('kpi-students',   students);
    set('badge-teachers', teachers);
    set('badge-parents',  parents);
    set('badge-students', students);
  },

  updateActivationStats() {
    const all    = [...DataStore.getTeachers(), ...DataStore.getParents()];
    const active = all.filter(u => u.status === 'active').length;
    const total  = all.length;
    const pct    = total ? Math.round((active / total) * 100) : 0;
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('stat-active',   active);
    set('stat-inactive', total - active);
    set('stat-total',    total);
    set('activation-pct', pct);
    const bar = document.getElementById('activation-bar');
    if (bar) {
      bar.style.inlineSize = `${pct}%`;
      bar.closest('[role="progressbar"]')?.setAttribute('aria-valuenow', pct);
    }
  },

  updateSidebarUser(profile) {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('sidebar-name',   UserFactory.fullName(profile));
    set('sidebar-email',  profile.email ?? '');
    set('sidebar-avatar', UserFactory.initials(profile));
  },

  initDemoSidebarUser() {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('sidebar-name',   'Super Admin');
    set('sidebar-email',  'admin@imb.cd');
    set('sidebar-avatar', 'SA');
  },

  hideDemoBanner() {
    document.getElementById('demo-banner')?.remove();
  },

  initDemoBanner() {
    const banner = document.createElement('div');
    banner.id = 'demo-banner';
    banner.style.cssText = `
      background: linear-gradient(135deg, #0B1F3A, #132D52);
      color: rgba(255,255,255,.85);
      font-size: .82rem;
      padding: .6rem 1.75rem;
      display: flex;
      align-items: center;
      gap: .6rem;
      border-block-end: 1px solid rgba(0,196,140,.3);
    `;
    banner.innerHTML = `
      <i class="fa-solid fa-circle-info" style="color:#00C48C;" aria-hidden="true"></i>
      <span>Mode démo — Configurez <code style="background:rgba(255,255,255,.1);padding:.1rem .4rem;border-radius:4px;">firebase.js</code> pour utiliser vos vraies données.</span>
    `;
    document.querySelector('.main-layout')?.prepend(banner);
  },

  addFeedItem(type, text, time = 'À l\'instant') {
    const feed = document.getElementById('activity-feed');
    if (!feed) return;
    const li = document.createElement('li');
    li.className = 'feed-item';
    li.setAttribute('role', 'listitem');
    li.innerHTML = `
      <span class="feed-dot feed-dot--${type}" aria-hidden="true"></span>
      <div>
        <p class="feed-text">${text}</p>
        <time class="feed-time">${time}</time>
      </div>`;
    feed.prepend(li);
    while (feed.children.length > 10) feed.lastElementChild?.remove();
  },

  initDemoFeed() {
    const times = ['Il y a 3 min', 'Il y a 8 min', 'Il y a 25 min', 'Il y a 42 min', 'Il y a 1 heure'];
    DEMO_FEED.forEach((item, i) => UI.addFeedItem(item.type, item.text, times[i]));
  },

  initNotifPanel() {
    const btn = document.querySelector('.topbar__icon-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      showToast('3 nouvelles activités depuis votre dernière connexion.', 'info', 3500);
    });
  },
};

/* ══════════════════════════════════════════════════
   MODULE — Tableaux
   ══════════════════════════════════════════════════ */
const Tables = (() => {
  let _pendingDelete = null;

  function _avatarCell(user) {
    const { bg, fg } = UserFactory.avatarColor(user);
    return `
      <div class="user-cell">
        <div class="user-cell__avatar"
          style="background-color:${bg};color:${fg};"
          aria-hidden="true">${UserFactory.initials(user)}</div>
        <div>
          <p class="user-cell__name">${UserFactory.fullName(user)}</p>
          <p class="user-cell__email">${user.email}</p>
        </div>
      </div>`;
  }

  function _statusBtn(user, role) {
    const active = user.status === 'active';
    return `
      <button class="badge badge--${active ? 'active' : 'inactive'}"
        type="button" style="cursor:pointer;border:none;"
        data-toggle="${role}:${user.id}"
        aria-label="${active ? 'Désactiver' : 'Activer'} ${UserFactory.fullName(user)}">
        <i class="fa-solid fa-circle" aria-hidden="true"></i>
        ${active ? 'Actif' : 'Inactif'}
      </button>`;
  }

  function _actionBtns(user, role) {
    const phone = user.phone?.replace(/\D/g, '') ?? '';
    const name  = UserFactory.fullName(user);
    return `
      <div class="row-actions">
        <button class="action-btn action-btn--wa" type="button"
          data-wa="${phone}" aria-label="WhatsApp ${name}" title="WhatsApp">
          <i class="fa-brands fa-whatsapp" aria-hidden="true"></i>
        </button>
        <button class="action-btn action-btn--edit" type="button"
          aria-label="Modifier ${name}" title="Modifier">
          <i class="fa-solid fa-pen" aria-hidden="true"></i>
        </button>
        <button class="action-btn action-btn--delete" type="button"
          data-delete="${role}|${user.id}|${name}"
          aria-label="Supprimer ${name}" title="Supprimer">
          <i class="fa-solid fa-trash" aria-hidden="true"></i>
        </button>
      </div>`;
  }

  function _bindEvents(tbody) {
    tbody.querySelectorAll('[data-toggle]').forEach(btn => {
      btn.addEventListener('click', () => {
        const [role, id] = btn.dataset.toggle.split(':');
        DataStore.toggleStatus(role, id);
        renderTeachers(); renderParents();
        UI.updateKPIs(); UI.updateActivationStats();
        showToast('Statut mis à jour.', 'info');
      });
    });

    tbody.querySelectorAll('[data-wa]').forEach(btn => {
      btn.addEventListener('click', () => {
        const phone = btn.dataset.wa;
        if (phone) window.open(`https://wa.me/${phone}`, '_blank', 'noopener,noreferrer');
        else showToast('Numéro WhatsApp non renseigné.', 'warn');
      });
    });

    tbody.querySelectorAll('[data-delete]').forEach(btn => {
      btn.addEventListener('click', () => {
        const [role, id, name] = btn.dataset.delete.split('|');
        _pendingDelete = { role, id, name };
        const el = document.getElementById('confirm-name');
        if (el) el.textContent = name;
        openModal('modal-confirm');
      });
    });
  }

  function _emptyRow(cols, icon, title, desc) {
    return `<tr><td colspan="${cols}">
      <div class="empty-state">
        <i class="fa-solid ${icon}" aria-hidden="true"></i>
        <p class="empty-state__title">${title}</p>
        <p class="empty-state__desc">${desc}</p>
      </div>
    </td></tr>`;
  }

  function renderTeachers() {
    const tbody   = document.getElementById('teachers-tbody');
    const countEl = document.getElementById('teachers-count');
    const list    = DataStore.getTeachers();
    if (!tbody) return;

    const n = list.length;
    if (countEl) countEl.textContent = `${n} enseignant${n > 1 ? 's' : ''}`;

    if (!n) {
      tbody.innerHTML = _emptyRow(6, 'fa-chalkboard-user',
        'Aucun enseignant',
        'Cliquez sur "Ajouter" pour créer votre premier compte enseignant.');
      return;
    }

    tbody.innerHTML = list.map(t => `
      <tr>
        <td>${_avatarCell(t)}</td>
        <td>
          ${t.schoolName ? `<p style="font-size:.82rem;font-weight:600;color:var(--color-primary);margin-block-end:.2rem;">${t.schoolName}</p>` : ''}
          <span class="badge badge--info">
            <i class="fa-solid fa-chalkboard" aria-hidden="true"></i>
            ${t.assignedClass ?? '—'}
          </span>
        </td>
        <td style="color:var(--color-text-muted);">${t.studentCount ?? 0} élèves</td>
        <td>${_statusBtn(t, 'teacher')}</td>
        <td style="color:var(--color-text-muted);font-size:.82rem;">${t.createdAt ?? '—'}</td>
        <td>${_actionBtns(t, 'teacher')}</td>
      </tr>`).join('');

    _bindEvents(tbody);
  }

  function renderParents() {
    const tbody   = document.getElementById('parents-tbody');
    const countEl = document.getElementById('parents-count');
    const list    = DataStore.getParents();
    if (!tbody) return;

    const n = list.length;
    if (countEl) countEl.textContent = `${n} parent${n > 1 ? 's' : ''}`;

    if (!n) {
      tbody.innerHTML = _emptyRow(6, 'fa-users',
        'Aucun parent',
        'Cliquez sur "Ajouter" pour créer votre premier compte parent.');
      return;
    }

    tbody.innerHTML = list.map(p => {
      const kids = Array.isArray(p.children) && p.children.length
        ? p.children.map(c => `<div style="font-size:.78rem;color:var(--color-text-muted);margin-block:.1rem;">${c}</div>`).join('')
        : '<span style="color:var(--color-text-muted);">—</span>';

      return `
        <tr>
          <td>${_avatarCell(p)}</td>
          <td>
            <code style="font-size:.75rem;background:var(--color-surface-soft);padding:.2rem .5rem;border-radius:var(--radius-sm);color:var(--color-accent);font-family:monospace;">
              ${p.parentId ?? '—'}
            </code>
          </td>
          <td style="font-size:.84rem;">${p.phone ?? '—'}</td>
          <td>${kids}</td>
          <td>${_statusBtn(p, 'parent')}</td>
          <td>${_actionBtns(p, 'parent')}</td>
        </tr>`;
    }).join('');

    _bindEvents(tbody);
  }

  // Confirmer la suppression
  document.getElementById('btn-confirm-delete')?.addEventListener('click', async () => {
    if (!_pendingDelete) return;
    const { role, id, name } = _pendingDelete;

    // Supprimer dans Firestore si Firebase configuré
    if (!DataStore.isDemo()) {
      try {
        const { UserService } = await import('./services/firebase.js');
        await UserService.deleteProfile(id);
      } catch (err) {
        console.error(err);
        showToast('Erreur Firebase lors de la suppression.', 'error');
        return;
      }
    }

    const delta = role === 'teacher' ? { teachers: -1 } : { parents: -1 };
    if (role === 'teacher') DataStore.deleteTeacher(id);
    else                    DataStore.deleteParent(id);

    closeModal('modal-confirm');
    renderTeachers(); renderParents();
    UI.updateKPIs(); UI.updateActivationStats();
    UI.addFeedItem('delete', `<strong>Compte supprimé</strong> — ${name}`);
    showToast(`Compte de ${name} supprimé.`, 'error');
    // Mettre à jour les stats publiques
    try {
      const { StatsService } = await import('./services/firebase.js');
      await StatsService.update(delta);
    } catch {}
    _pendingDelete = null;
  });

  // Observer les changements
  DataStore.subscribe(() => {
    renderTeachers();
    renderParents();
    UI.updateKPIs();
    UI.updateActivationStats();
  });

  return { renderTeachers, renderParents };
})();

/* ══════════════════════════════════════════════════
   MODULE — Création de compte
   ══════════════════════════════════════════════════ */
const CreateAccount = (() => {
  let _activeTab = 'teacher';

  const _tabs = document.querySelectorAll('.modal__tab');

  function _switchTab(tab) {
    _activeTab = tab;
    _tabs.forEach(t => t.setAttribute('aria-selected', String(t.dataset.tab === tab)));
    document.getElementById('tab-panel-teacher')
      ?.setAttribute('data-active', String(tab === 'teacher'));
    document.getElementById('tab-panel-parent')
      ?.setAttribute('data-active', String(tab === 'parent'));

    // Générer un parentId auto pour l'onglet parent
    if (tab === 'parent') {
      const pidEl = document.getElementById('p-parentid');
      if (pidEl && !pidEl.value) pidEl.value = UserFactory.generateParentId();
    }
  }

  // Afficher/masquer le mot de passe
  function _initPasswordToggles() {
    document.querySelectorAll('.form-field__eye').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = document.getElementById(btn.dataset.target);
        if (!input) return;
        const isHidden = input.type === 'password';
        input.type = isHidden ? 'text' : 'password';
        const icon = btn.querySelector('i');
        if (icon) {
          icon.className = isHidden ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
        }
        btn.setAttribute('aria-label', isHidden ? 'Masquer le mot de passe' : 'Afficher le mot de passe');
      });
    });
  }

  // Indicateur de force du mot de passe
  function _initPasswordStrength() {
    const pairs = [
      { inputId: 't-pass', strengthId: 't-pass-strength' },
      { inputId: 'p-pass', strengthId: 'p-pass-strength' },
    ];
    pairs.forEach(({ inputId, strengthId }) => {
      const input    = document.getElementById(inputId);
      const strength = document.getElementById(strengthId);
      if (!input || !strength) return;
      input.addEventListener('input', () => {
        const val = input.value;
        if (!val) { strength.textContent = ''; strength.removeAttribute('data-level'); return; }
        const hasUpper  = /[A-Z]/.test(val);
        const hasNumber = /[0-9]/.test(val);
        const hasSymbol = /[^A-Za-z0-9]/.test(val);
        const len = val.length;
        let level, label;
        if (len < 8) {
          level = 'weak'; label = 'Trop court — minimum 8 caractères';
        } else if (len >= 12 && hasUpper && hasNumber && hasSymbol) {
          level = 'strong'; label = 'Fort';
        } else if (len >= 8 && (hasNumber || hasUpper)) {
          level = 'medium'; label = 'Moyen — ajoutez des chiffres ou symboles';
        } else {
          level = 'weak'; label = 'Faible';
        }
        strength.setAttribute('data-level', level);
        strength.textContent = label;
      });
    });
  }

  function _val(id) { return (document.getElementById(id)?.value ?? '').trim(); }

  function _showError(msg) {
    const box = document.getElementById('modal-error');
    const txt = document.getElementById('modal-error-msg');
    if (box) box.style.display = 'flex';
    if (txt) txt.textContent = msg;
  }

  function _hideError() {
    const box = document.getElementById('modal-error');
    if (box) box.style.display = 'none';
  }

  function _validate() {
    if (_activeTab === 'teacher') {
      if (!_val('t-first') || !_val('t-last') || !_val('t-school') ||
          !_val('t-email') || !_val('t-phone') || !_val('t-class') || !_val('t-pass')) {
        _showError('Veuillez remplir tous les champs obligatoires.'); return false;
      }
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(_val('t-email'));
      if (!emailOk) { _showError('Adresse email invalide.'); return false; }
      if (_val('t-pass').length < 8) {
        _showError('Le mot de passe doit contenir au moins 8 caractères.'); return false;
      }
      if (_val('t-pass') !== _val('t-pass2')) {
        _showError('Les mots de passe ne correspondent pas.'); return false;
      }
    } else {
      if (!_val('p-first') || !_val('p-last') || !_val('p-email') ||
          !_val('p-phone') || !_val('p-pass')) {
        _showError('Veuillez remplir tous les champs obligatoires.'); return false;
      }
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(_val('p-email'));
      if (!emailOk) { _showError('Adresse email invalide.'); return false; }
      if (_val('p-pass').length < 8) {
        _showError('Le mot de passe doit contenir au moins 8 caractères.'); return false;
      }
      if (_val('p-pass') !== _val('p-pass2')) {
        _showError('Les mots de passe ne correspondent pas.'); return false;
      }
    }
    return true;
  }

  async function _submit() {
    _hideError();
    if (!_validate()) return;

    const btn = document.getElementById('btn-submit-account');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin" aria-hidden="true"></i> Création…';
    }

    try {
      const schoolId = DataStore.getSchoolId();

      if (_activeTab === 'teacher') {
        const userData = {
          role: 'teacher',
          firstName:     _val('t-first'),
          lastName:      _val('t-last'),
          schoolName:    _val('t-school'),
          email:         _val('t-email'),
          phone:         _val('t-phone'),
          assignedClass: _val('t-class'),
          studentCount:  0,
          schoolId,
          status:        'active',
          createdAt:     new Date().toLocaleDateString('fr-FR'),
        };

        let newUser;

        if (!DataStore.isDemo()) {
          // Mode Firebase réel
          const { UserService } = await import('./services/firebase.js');
          const docRef = await UserService.createProfileDirect(userData);
          newUser = { id: docRef.id, ...userData };
        } else {
          // Mode démo
          newUser = { id: `demo-t${Date.now()}`, ...userData };
        }

        DataStore.addTeacher(newUser);
        UI.addFeedItem('create', `<strong>Enseignant créé</strong> — ${UserFactory.fullName(newUser)}, ${_val('t-class')}`);
        showToast(`${UserFactory.fullName(newUser)} créé avec succès.`, 'success');
        // Mettre à jour les stats publiques
        try {
          const { StatsService } = await import('./services/firebase.js');
          await StatsService.update({ teachers: 1 });
        } catch {}

      } else {
        const parentId = _val('p-parentid') || UserFactory.generateParentId();
        const userData = {
          role:      'parent',
          firstName: _val('p-first'),
          lastName:  _val('p-last'),
          email:     _val('p-email'),
          phone:     _val('p-phone'),
          parentId,
          children:  [],
          schoolId,
          status:    'active',
          createdAt: new Date().toLocaleDateString('fr-FR'),
        };

        let newUser;

        if (!DataStore.isDemo()) {
          const { UserService } = await import('./services/firebase.js');
          const docRef = await UserService.createProfileDirect(userData);
          newUser = { id: docRef.id, ...userData };
        } else {
          newUser = { id: `demo-p${Date.now()}`, ...userData };
        }

        DataStore.addParent(newUser);
        UI.addFeedItem('create', `<strong>Parent créé</strong> — ${UserFactory.fullName(newUser)} · ID: ${parentId}`);
        showToast(`${UserFactory.fullName(newUser)} créé avec succès.`, 'success');
        // Mettre à jour les stats publiques
        try {
          const { StatsService } = await import('./services/firebase.js');
          await StatsService.update({ parents: 1 });
        } catch {}
      }

      closeModal('modal-create');
      _resetForm();

    } catch (err) {
      console.error('CreateAccount._submit:', err);
      _showError('Erreur lors de la création. Vérifiez la console pour plus de détails.');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-check" aria-hidden="true"></i> Créer le compte';
      }
    }
  }

  function _resetForm() {
    ['t-first','t-last','t-school','t-email','t-phone','t-class','t-pass','t-pass2',
     'p-first','p-last','p-email','p-phone','p-parentid','p-pass','p-pass2']
      .forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.value = '';
        // Remettre les inputs password masqués
        if (el.type === 'text' && el.id.includes('pass')) el.type = 'password';
      });
    // Remettre les icônes œil
    document.querySelectorAll('.form-field__eye i').forEach(icon => {
      icon.className = 'fa-solid fa-eye';
    });
    // Effacer les indicateurs de force
    document.querySelectorAll('.password-strength').forEach(el => {
      el.textContent = '';
      el.removeAttribute('data-level');
    });
    _hideError();
  }

  function openCreate(tab = 'teacher') {
    _switchTab(tab);
    _resetForm();
    openModal('modal-create');
  }

  function init() {
    _tabs.forEach(t => t.addEventListener('click', () => _switchTab(t.dataset.tab)));
    document.getElementById('btn-submit-account')?.addEventListener('click', _submit);

    document.getElementById('btn-create-main')?.addEventListener('click',  () => openCreate('teacher'));
    document.getElementById('btn-add-teacher')?.addEventListener('click',  () => openCreate('teacher'));
    document.getElementById('btn-add-parent')?.addEventListener('click',   () => openCreate('parent'));
    // btn-add-student géré par Students.init()
    document.getElementById('btn-add-class')?.addEventListener('click',    () => showToast('Module classes disponible prochainement.', 'info'));

    // Initialiser après ouverture de la modal
    document.getElementById('modal-create')?.addEventListener('click', () => {
      _initPasswordToggles();
      _initPasswordStrength();
    }, { once: true });
  }

  return { init, openCreate };
})();

/* ══════════════════════════════════════════════════
   MODULE — Settings
   ══════════════════════════════════════════════════ */
function initSettings() {
  document.getElementById('btn-save-settings')?.addEventListener('click', () => {
    showToast('Paramètres sauvegardés avec succès.', 'success');
  });
}

/* ══════════════════════════════════════════════════
   MODULE — Déconnexion
   ══════════════════════════════════════════════════ */
function initLogout() {
  document.getElementById('btn-logout')?.addEventListener('click', async () => {
    try {
      const { AuthService } = await import('./services/firebase.js');
      await AuthService.logout();
    } catch { /* Firebase non configuré */ }
    window.location.href = '../index.html';
  });
}

/* ══════════════════════════════════════════════════
   MODULE — Footer
   ══════════════════════════════════════════════════ */
function initFooterYear() {
  const el = document.getElementById('footer-year');
  if (el) el.textContent = new Date().getFullYear();
}

/* ══════════════════════════════════════════════════
   MODULE — Élèves (Firebase réel + fallback démo)
   ══════════════════════════════════════════════════ */
const Students = (() => {

  // Données démo (fallback si Firebase non configuré)
  const DEMO_STUDENTS = [
    { id: 's1', firstName: 'Lucas',     lastName: 'Tshibanda', schoolName: 'École Primaire IMB',  assignedClass: 'CM2 A',         teacherName: 'Alphonsine Imbanzia', parentId: 'IMB-PAR-10042', isDemo: true },
    { id: 's2', firstName: 'Marie',     lastName: 'Tshibanda', schoolName: 'École Primaire IMB',  assignedClass: 'CE2 A',         teacherName: 'Joséphine Kambayolo', parentId: 'IMB-PAR-10042', isDemo: true },
    { id: 's3', firstName: 'Junior',    lastName: 'Mbulu',     schoolName: 'École Primaire IMB',  assignedClass: 'CM1 B',         teacherName: 'Patient Tshibangu',   parentId: 'IMB-PAR-10043', isDemo: true },
    { id: 's4', firstName: 'Espoir',    lastName: 'Bimbakila', schoolName: 'École Primaire IMB',  assignedClass: 'CP A',          teacherName: 'Théodore Mboti',      parentId: 'IMB-PAR-10044', isDemo: true },
    { id: 's5', firstName: 'Prince',    lastName: 'Maghoma',   schoolName: 'Institut Mampu',      assignedClass: 'CM2 A',         teacherName: 'Alphonsine Imbanzia', parentId: 'IMB-PAR-10045', isDemo: true },
    { id: 's6', firstName: 'Gloire',    lastName: 'Maghoma',   schoolName: 'Institut Mampu',      assignedClass: 'CM1 B',         teacherName: 'Patient Tshibangu',   parentId: 'IMB-PAR-10045', isDemo: true },
    { id: 's7', firstName: 'Séraphine', lastName: 'Maghoma',   schoolName: 'Institut Mampu',      assignedClass: 'CE2 A',         teacherName: 'Joséphine Kambayolo', parentId: 'IMB-PAR-10045', isDemo: true },
    { id: 's8', firstName: 'David',     lastName: 'Imbanzia',  schoolName: 'École Sainte-Marie',  assignedClass: '3ème Primaire', teacherName: '—',                  parentId: 'IMB-PAR-10046', isDemo: true },
  ];

  let _students    = [];  // Vide au départ — Firebase ou démo selon connexion
  let _isFirebase  = false;
  let _firebaseAttempted = false; // Firebase a-t-il été tenté ?

  const AVATAR_COLORS = [
    { bg: '#DBEAFE', fg: '#1D4ED8' }, { bg: '#D1FAE5', fg: '#065F46' },
    { bg: '#FFF4D6', fg: '#92570A' }, { bg: '#EDE9FE', fg: '#5B21B6' },
    { bg: '#CCFBF1', fg: '#0F766E' }, { bg: '#FEE2E2', fg: '#991B1B' },
  ];

  function _avatarCell(s) {
    const { bg, fg } = AVATAR_COLORS[(s.id?.charCodeAt(s.id.length - 1) ?? 0) % AVATAR_COLORS.length];
    const initials = `${s.firstName?.[0] ?? ''}${s.lastName?.[0] ?? ''}`.toUpperCase();
    return `
      <div class="user-cell">
        <div class="user-cell__avatar" style="background-color:${bg};color:${fg};" aria-hidden="true">${initials}</div>
        <div>
          <p class="user-cell__name">${s.firstName} ${s.lastName}</p>
          <p class="user-cell__email">${s.schoolName ?? '—'}</p>
        </div>
      </div>`;
  }

  function _updateCounters(n) {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('students-count', `${n} élève${n > 1 ? 's' : ''}`);
    set('badge-students', n);
    set('kpi-students',   n);
  }

  async function _deleteFromFirebase(id) {
    try {
      const { StudentService } = await import('./services/firebase.js');
      await StudentService.delete(id);
      return true;
    } catch (err) {
      console.error('Erreur suppression élève Firebase:', err);
      return false;
    }
  }

  function render() {
    const tbody = document.getElementById('students-tbody');
    if (!tbody) return;

    const n = _students.length;
    _updateCounters(n);

    if (!n) {
      tbody.innerHTML = `<tr><td colspan="5">
        <div class="empty-state">
          <i class="fa-solid fa-user-graduate" aria-hidden="true"></i>
          <p class="empty-state__title">Aucun élève enregistré</p>
          <p class="empty-state__desc">Ajoutez des élèves pour les associer aux enseignants et parents.</p>
        </div>
      </td></tr>`;
      return;
    }

    tbody.innerHTML = _students.map(s => `
      <tr>
        <td>${_avatarCell(s)}</td>
        <td>
          <span class="badge badge--info">
            <i class="fa-solid fa-chalkboard" aria-hidden="true"></i>
            ${s.assignedClass ?? '—'}
          </span>
        </td>
        <td>
          <code style="font-size:.75rem;background:var(--color-surface-soft);padding:.2rem .5rem;border-radius:var(--radius-sm);color:var(--color-accent);font-family:monospace;">
            ${s.parentId ?? '—'}
          </code>
        </td>
        <td style="font-size:.84rem;color:var(--color-text-muted);">${s.teacherName ?? '—'}</td>
        <td>
          <div class="row-actions">
            <button class="action-btn action-btn--edit" type="button"
              aria-label="Modifier ${s.firstName} ${s.lastName}" title="Modifier">
              <i class="fa-solid fa-pen" aria-hidden="true"></i>
            </button>
            <button class="action-btn action-btn--delete" type="button"
              data-student-delete="${s.id}"
              data-student-name="${s.firstName} ${s.lastName}"
              data-is-demo="${s.isDemo ?? false}"
              aria-label="Supprimer ${s.firstName} ${s.lastName}">
              <i class="fa-solid fa-trash" aria-hidden="true"></i>
            </button>
          </div>
        </td>
      </tr>`).join('');

    // Bind suppression
    tbody.querySelectorAll('[data-student-delete]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id     = btn.dataset.studentDelete;
        const name   = btn.dataset.studentName;
        const isDemo = btn.dataset.isDemo === 'true';

        if (!isDemo && _isFirebase) {
          const ok = await _deleteFromFirebase(id);
          if (!ok) { showToast('Erreur suppression Firebase.', 'error'); return; }
        }

        _students = _students.filter(s => s.id !== id);
        render();
        showToast(`Élève ${name} supprimé.`, 'error');
        UI.addFeedItem('delete', `<strong>Élève supprimé</strong> — ${name}`);
      });
    });
  }

  /**
   * Charger les vrais élèves depuis Firebase
   */
  async function loadFromFirebase(schoolId) {
    _firebaseAttempted = true;
    try {
      const { StudentService } = await import('./services/firebase.js');
      const students = await StudentService.listBySchool(schoolId);
      // Toujours utiliser Firebase — même si 0 élèves (liste vide = vide réel)
      _students   = students;
      _isFirebase = true;
      render();
      console.info(`IMB: ${students.length} élève(s) chargé(s) depuis Firebase`);
    } catch (err) {
      console.warn('IMB: Erreur chargement élèves Firebase:', err.message);
      // Seulement si Firebase échoue → afficher les démo
      if (!_isFirebase) {
        _students = [...DEMO_STUDENTS];
        render();
      }
    }
  }

  /**
   * Ajouter un élève (Firebase ou démo)
   */
  async function addStudent(data) {
    if (_isFirebase) {
      // Mode Firebase réel — sauvegarder dans Firestore
      try {
        const { StudentService } = await import('./services/firebase.js');
        const docRef = await StudentService.create(data);
        const newStudent = { id: docRef.id, ...data, isDemo: false };
        _students.push(newStudent);
        render();
        return true;
      } catch (err) {
        console.error('Erreur création élève Firebase:', err);
        showToast('Erreur Firebase lors de la création.', 'error');
        return false;
      }
    } else {
      // Firebase non disponible — avertir l'utilisateur
      showToast('Connectez-vous d\'abord via login.html pour sauvegarder les élèves.', 'warn', 5000);
      return false;
    }
  }

  function _showStudentError(msg) {
    const box = document.getElementById('student-error');
    const txt = document.getElementById('student-error-msg');
    if (box) box.style.display = 'flex';
    if (txt) txt.textContent = msg;
  }

  function _hideStudentError() {
    const box = document.getElementById('student-error');
    if (box) box.style.display = 'none';
  }

  function _val(id) { return (document.getElementById(id)?.value ?? '').trim(); }

  function init() {
    document.getElementById('btn-add-student')?.addEventListener('click', () => {
      _hideStudentError();
      openModal('modal-add-student');
    });

    document.getElementById('btn-submit-student')?.addEventListener('click', async () => {
      _hideStudentError();

      const firstName = _val('s-first');
      const lastName  = _val('s-last');
      const schoolName = _val('s-school');
      const assignedClass = _val('s-class');

      if (!firstName || !lastName || !schoolName || !assignedClass) {
        _showStudentError('Veuillez remplir tous les champs obligatoires.');
        return;
      }

      const btn = document.getElementById('btn-submit-student');
      if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Ajout…'; }

      const studentData = {
        firstName,
        lastName,
        schoolName,
        assignedClass,
        parentId:    _val('s-parent-id')  || '—',
        teacherName: _val('s-teacher')    || '—',
        schoolId:    DataStore.getSchoolId(),
        classId:     assignedClass,
      };

      const ok = await addStudent(studentData);

      if (ok) {
        closeModal('modal-add-student');
        // Vider le formulaire
        ['s-first','s-last','s-school','s-class','s-parent-id','s-teacher']
          .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
        UI.addFeedItem('create', `<strong>Élève ajouté</strong> — ${firstName} ${lastName}`);
        showToast(`Élève ${firstName} ${lastName} ajouté avec succès.`, 'success');
        // Mettre à jour les stats publiques
        try {
          const { StatsService } = await import('./services/firebase.js');
          await StatsService.update({ students: 1 });
        } catch {}
      }

      if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-plus"></i> Ajouter l\'élève'; }
    });
  }

  return { render, init, loadFromFirebase, addStudent, getCount: () => _students.length };
})();

/* ══════════════════════════════════════════════════
/* ══════════════════════════════════════════════════
   BOOTSTRAP — Démarre immédiatement, sans attendre Firebase
   ══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {

  // 1. Initialiser TOUS les modules UI immédiatement
  initModals();
  Navigation.init();
  Sidebar.init();
  CreateAccount.init();
  Students.init();
  initSettings();
  initLogout();
  initFooterYear();
  UI.initNotifPanel();

  Navigation.onNavigate(page => {
    if (page === 'teachers') Tables.renderTeachers();
    if (page === 'parents')  Tables.renderParents();
  });

  // 2. Tenter Firebase d'abord (si connecté → vraies données)
  const firebaseLoaded = await DataLoader.tryLoadFirebase();

  if (!firebaseLoaded) {
    // Mode démo — afficher données locales
    UI.initDemoSidebarUser();
    UI.initDemoBanner();
    UI.initDemoFeed();
    Tables.renderTeachers();
    Tables.renderParents();
    // NE PAS charger les démo élèves ici — attendons Firebase
    // Students.render() sera appelé après loadFromFirebase()
    UI.updateKPIs();
    UI.updateActivationStats();
    showToast('Mode démo — configurez Firebase pour vos vraies données.', 'info', 3500);
  }
});
