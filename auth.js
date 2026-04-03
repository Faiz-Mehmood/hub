// ─── FIREBASE CONFIG ──────────────────────────────────────────────────────────
// Replace this entire object with your Firebase project config
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCdu2TI0_uGBbR7yvOM_c604nxg3Ms3P8s",
  authDomain: "faiz-hub.firebaseapp.com",
  projectId: "faiz-hub",
  storageBucket: "faiz-hub.firebasestorage.app",
  messagingSenderId: "235247285762",
  appId: "1:235247285762:web:15bd1336d2727e8b05d91b"
};
// ─────────────────────────────────────────────────────────────────────────────

// Password hash (SHA-256). Default password is "123"
const PASS_HASH = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';

async function hashPassword(pw) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pw));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}
async function checkLogin(pw) { return (await hashPassword(pw)) === PASS_HASH; }
function isLoggedIn() { return sessionStorage.getItem('faiz_auth') === 'true'; }
function logout() { sessionStorage.removeItem('faiz_auth'); window.location.href = 'index.html'; }

// ── Firebase / Firestore helpers ──────────────────────────────────────────────
let _db = null;
function _initFirebase() {
  if (_db) return _db;
  try {
    if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
    _db = firebase.firestore();
  } catch(e) { console.warn('Firebase not ready – localStorage fallback active.', e); }
  return _db;
}

async function dbGet(col, doc) {
  const db = _initFirebase();
  if (db) {
    try { const s = await db.collection(col).doc(doc).get(); return s.exists ? s.data() : null; }
    catch(e) { console.warn('dbGet error', e); }
  }
  const raw = localStorage.getItem(col+'_'+doc);
  return raw ? JSON.parse(raw) : null;
}

async function dbSet(col, doc, data) {
  const db = _initFirebase();
  if (db) {
    try { await db.collection(col).doc(doc).set(data); return; }
    catch(e) { console.warn('dbSet error', e); }
  }
  localStorage.setItem(col+'_'+doc, JSON.stringify(data));
}

function dbListen(col, doc, callback) {
  const db = _initFirebase();
  if (db) {
    return db.collection(col).doc(doc).onSnapshot(s => callback(s.exists ? s.data() : null),
      e => console.warn('dbListen error', e));
  }
  const raw = localStorage.getItem(col+'_'+doc);
  callback(raw ? JSON.parse(raw) : null);
  return () => {};
}

function applyAuthUI() {
  const loggedIn = isLoggedIn();
  document.querySelectorAll('.owner-only').forEach(el => { el.style.display = loggedIn ? '' : 'none'; });
  document.querySelectorAll('[contenteditable]').forEach(el => {
    el.contentEditable = loggedIn ? 'true' : 'false';
    if (!loggedIn) el.style.borderBottom = 'none';
  });
  document.querySelectorAll('.edit-hint').forEach(el => { el.style.display = loggedIn ? '' : 'none'; });
  const nav = document.querySelector('nav');
  if (!nav) return;
  const existing = nav.querySelector('.auth-btn');
  if (existing) existing.remove();
  const btn = document.createElement('button');
  btn.className = 'auth-btn';
  btn.style.cssText = `font-family:'Space Mono',monospace;font-size:0.6rem;letter-spacing:3px;padding:0.4rem 0.9rem;border-radius:6px;cursor:none;transition:all 0.2s;background:transparent;`;
  if (loggedIn) {
    btn.textContent = 'LOGOUT';
    btn.style.cssText += 'border:1px solid #2a3040;color:#4a6080;';
    btn.onmouseover = () => { btn.style.borderColor='#ff4d6d'; btn.style.color='#ff4d6d'; };
    btn.onmouseout  = () => { btn.style.borderColor='#2a3040'; btn.style.color='#4a6080'; };
    btn.onclick = logout;
  } else {
    btn.textContent = 'OWNER LOGIN';
    btn.style.cssText += 'border:1px solid #1e2a38;color:#4a6080;';
    btn.onmouseover = () => { btn.style.borderColor='var(--accent,#00d4ff)'; btn.style.color='var(--accent,#00d4ff)'; };
    btn.onmouseout  = () => { btn.style.borderColor='#1e2a38'; btn.style.color='#4a6080'; };
    btn.onclick = () => window.location.href = 'login.html?from=' + encodeURIComponent(window.location.pathname.split('/').pop());
  }
  nav.appendChild(btn);
}
