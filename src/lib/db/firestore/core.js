/**
 * firestore/core.js — Firebase init + auth re-export.
 * getUid() liest den aktuell eingeloggten User der VitalOS-Shell (Auth ist
 * shell-global, siehe cloud/firebase.js — relax-dev hat kein eigenes Auth-Gate).
 */

import { onAuthStateChanged } from "firebase/auth";
import { db, auth, googleProvider } from "../../../firebase.js";

export { db, auth, googleProvider };

export function isLocalMode() { return false; }

let currentUid = null;

export function watchAuth(callback) {
  return onAuthStateChanged(auth, (user) => {
    currentUid = user ? user.uid : null;
    callback?.(user);
  });
}

export function getUid() {
  if (!currentUid && auth.currentUser) currentUid = auth.currentUser.uid;
  if (!currentUid) throw new Error("Nicht eingeloggt");
  return currentUid;
}
