import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
} from "firebase/firestore";

// Semua nilai ini diisi lewat environment variable (lihat .env.example).
// Config Firebase untuk web memang PUBLIC by design (bukan rahasia seperti
// API key Gemini) — keamanan data diatur lewat Firestore Security Rules,
// bukan dengan menyembunyikan config ini.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();

export function loginWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

export function logout() {
  return signOut(auth);
}

// callback(user | null)
export function watchAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

// ---- Data personal per member: koleksi users/{uid}/data/{key} ----
export async function fsGet(uid, key) {
  const ref = doc(db, "users", uid, "data", key);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data().value : null;
}

export async function fsSet(uid, key, value) {
  const ref = doc(db, "users", uid, "data", key);
  await setDoc(ref, { value, updatedAt: Date.now() });
}

// ---- Leaderboard publik: koleksi leaderboard/{docId} ----
export async function fsSetShared(key, value) {
  const ref = doc(db, "leaderboard", key);
  await setDoc(ref, { value, updatedAt: Date.now() });
}

export async function fsListShared(prefix = "") {
  const snap = await getDocs(collection(db, "leaderboard"));
  return snap.docs
    .map((d) => ({ key: d.id, value: d.data().value }))
    .filter((e) => e.key.startsWith(prefix));
}
