/**
 * IMB — Firebase Service
 * Configuration, Auth, Firestore
 *
 * Remplacer les valeurs ci-dessous par vos vraies clés Firebase.
 * Console : https://console.firebase.google.com
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  getCountFromServer,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

/* ── Configuration Firebase — Projet IMB Platform ── */
const firebaseConfig = {
  apiKey: 'AIzaSyC_91KMCxvnfCGCThsI4CBKzSWDBboPe18',
  authDomain: 'imb-platform.firebaseapp.com',
  projectId: 'imb-platform',
  storageBucket: 'imb-platform.firebasestorage.app',
  messagingSenderId: '565701598562',
  appId: '1:565701598562:web:5b4a43ce65e6dbfabb203b',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* ════════ AUTH SERVICE ════════ */
export const AuthService = {
  async login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  },
  async logout() { return signOut(auth); },
  currentUser() { return auth.currentUser; },
  onAuthChange(cb) { return onAuthStateChanged(auth, cb); },
};

/* ════════ USER SERVICE ════════ */
export const UserService = {
  async createProfile(uid, data) {
    await setDoc(doc(db, 'users', uid), {
      ...data, status: 'active', createdAt: serverTimestamp(),
    });
  },

  async createProfileDirect(data) {
    return addDoc(collection(db, 'users'), {
      ...data, status: 'active', createdAt: serverTimestamp(),
    });
  },

  async getProfile(uid) {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },

  async getProfileByParentId(parentId) {
    const q = query(collection(db, 'users'), where('parentId', '==', parentId));
    const snap = await getDocs(q);
    return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
  },

  async listByRole(schoolId, role) {
    // Note : pas de orderBy pour éviter l'index composite Firestore
    // Le tri est fait côté client après récupération
    const q = query(
      collection(db, 'users'),
      where('schoolId', '==', schoolId),
      where('role', '==', role),
    );
    const snap = await getDocs(q);
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    // Tri alphabétique côté client
    return docs.sort((a, b) =>
      (a.lastName ?? '').localeCompare(b.lastName ?? '', 'fr')
    );
  },

  async updateStatus(uid, status) {
    await updateDoc(doc(db, 'users', uid), { status });
  },

  async deleteProfile(uid) {
    await deleteDoc(doc(db, 'users', uid));
  },
};

/* ════════ STUDENT SERVICE ════════ */
export const StudentService = {
  async create(data) {
    return addDoc(collection(db, 'students'), {
      ...data, createdAt: serverTimestamp(),
    });
  },

  async getById(id) {
    const snap = await getDoc(doc(db, 'students', id));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },

  async listBySchool(schoolId) {
    const q = query(
      collection(db, 'students'),
      where('schoolId', '==', schoolId),
    );
    const snap = await getDocs(q);
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return docs.sort((a, b) => (a.lastName ?? '').localeCompare(b.lastName ?? '', 'fr'));
  },

  async listByClass(classId) {
    const q = query(
      collection(db, 'students'),
      where('classId', '==', classId),
    );
    const snap = await getDocs(q);
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return docs.sort((a, b) => (a.lastName ?? '').localeCompare(b.lastName ?? '', 'fr'));
  },

  async listByParentId(parentId) {
    const q = query(
      collection(db, 'students'),
      where('parentIds', 'array-contains', parentId),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async update(id, data) {
    await updateDoc(doc(db, 'students', id), data);
  },

  async delete(id) {
    await deleteDoc(doc(db, 'students', id));
  },
};

/* ════════ REPORT SERVICE ════════ */
export const ReportService = {
  /**
   * Enregistrer un rapport journalier (enseignant)
   * ou une notification maladie (parent)
   */
  async save(studentId, dateKey, data) {
    const ref = doc(db, 'reports', `${studentId}_${dateKey}`);
    await setDoc(ref, {
      ...data,
      studentId,
      dateKey,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  },

  async get(studentId, dateKey) {
    const snap = await getDoc(doc(db, 'reports', `${studentId}_${dateKey}`));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },

  /** Écoute temps réel — tableau de bord parent */
  onStudentReports(studentId, callback) {
    const q = query(
      collection(db, 'reports'),
      where('studentId', '==', studentId),
      orderBy('dateKey', 'desc'),
    );
    return onSnapshot(q, snap => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  },

  /** Rapport du jour d'un élève — temps réel */
  onTodayReport(studentId, dateKey, callback) {
    const ref = doc(db, 'reports', `${studentId}_${dateKey}`);
    return onSnapshot(ref, snap => {
      callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    });
  },

  async getHistory(studentId, limit = 30) {
    const q = query(
      collection(db, 'reports'),
      where('studentId', '==', studentId),
      orderBy('dateKey', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.slice(0, limit).map(d => ({ id: d.id, ...d.data() }));
  },
};

/* ════════ CLASS SERVICE ════════ */
export const ClassService = {
  async list(schoolId) {
    const q = query(
      collection(db, 'classes'),
      where('schoolId', '==', schoolId),
      orderBy('name'),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async create(data) {
    return addDoc(collection(db, 'classes'), {
      ...data, createdAt: serverTimestamp(),
    });
  },
};

/* ════════ SCHOOL SERVICE ════════ */
export const SchoolService = {
  async get(schoolId) {
    const snap = await getDoc(doc(db, 'schools', schoolId));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },

  async create(data) {
    return addDoc(collection(db, 'schools'), {
      ...data, createdAt: serverTimestamp(),
    });
  },

  async getStats() {
    const [students, parents, schools] = await Promise.all([
      getCountFromServer(collection(db, 'students')),
      getCountFromServer(collection(db, 'users')),
      getCountFromServer(collection(db, 'schools')),
    ]);
    return {
      students: students.data().count,
      parents: parents.data().count,
      schools: schools.data().count,
    };
  },
};

export { auth, db, serverTimestamp };