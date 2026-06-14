/**
 * IMB — Pattern Factory : UserFactory
 * Crée et normalise les objets utilisateur
 * Génère les IDs parents uniques IMB
 */

'use strict';

/** Palette de couleurs pour les avatars (déterministe par ID) */
const AVATAR_PALETTE = [
  { bg: '#DBEAFE', fg: '#1D4ED8' },
  { bg: '#D1FAE5', fg: '#065F46' },
  { bg: '#FFF4D6', fg: '#92570A' },
  { bg: '#EDE9FE', fg: '#5B21B6' },
  { bg: '#FEE2E2', fg: '#991B1B' },
  { bg: '#CCFBF1', fg: '#0F766E' },
  { bg: '#FCE7F3', fg: '#9D174D' },
  { bg: '#F0FDF4', fg: '#166534' },
];

/**
 * Génère un ID parent unique IMB
 * Format : IMB-PAR-XXXXX
 * @returns {string}
 */
function generateParentId() {
  const num = Math.floor(10000 + Math.random() * 90000);
  return `IMB-PAR-${num}`;
}

export const UserFactory = {
  /**
   * Crée un objet utilisateur normalisé
   * @param {'admin'|'teacher'|'parent'} role
   * @param {Object} data
   * @returns {Object}
   */
  create(role, data) {
    const base = {
      role,
      firstName:  (data.firstName  ?? '').trim(),
      lastName:   (data.lastName   ?? '').trim(),
      email:      (data.email      ?? '').trim().toLowerCase(),
      phone:      (data.phone      ?? '').trim(),
      schoolId:   data.schoolId    ?? '',
      status:     'active',
      createdAt:  new Date().toLocaleDateString('fr-FR'),
    };

    switch (role) {
      case 'teacher':
        return {
          ...base,
          classId:       data.classId       ?? '',
          assignedClass: data.assignedClass ?? '—',
          studentCount:  0,
        };

      case 'parent':
        return {
          ...base,
          parentId: data.parentId ?? generateParentId(),
          children: [],
        };

      case 'admin':
      default:
        return base;
    }
  },

  /**
   * Retourne les initiales d'un utilisateur
   * @param {{ firstName: string, lastName: string }} user
   * @returns {string} Ex: "AD"
   */
  initials(user) {
    const f = user.firstName?.[0] ?? '';
    const l = user.lastName?.[0]  ?? '';
    return `${f}${l}`.toUpperCase();
  },

  /**
   * Retourne le nom complet
   * @param {{ firstName: string, lastName: string }} user
   * @returns {string}
   */
  fullName(user) {
    return `${user.firstName} ${user.lastName}`.trim();
  },

  /**
   * Retourne la couleur d'avatar de façon déterministe
   * @param {{ id: string }} user
   * @returns {{ bg: string, fg: string }}
   */
  avatarColor(user) {
    const charCode = user.id?.charCodeAt(0) ?? 0;
    return AVATAR_PALETTE[charCode % AVATAR_PALETTE.length];
  },

  /** Expose la fonction de génération d'ID parent */
  generateParentId,
};
