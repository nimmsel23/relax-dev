/**
 * firestore/sessions.js — Relax Session CRUD für Firestore.
 * Collection: relax/{uid}/sessions/{date}
 *
 * Namensraum "Relax*" ist Absicht: relax-dev embeddet in die vitalos-Shell
 * über den globalen '@db'-Alias, dessen Barrel bereits generische Namen wie
 * getSession/saveSession/exportCsv als fitness-dev-SSOT vergeben hat.
 */

import {
  doc,
  collection,
  query,
  orderBy,
  startAfter,
  limit as fbLimit,
  serverTimestamp,
} from "firebase/firestore";
import { setDoc, getDoc, getDocs } from "./offline.js";
import { db } from "../../../firebase.js";
import { getUid } from "./core.js";
import { localToday, lastDates, TECHNIQUES, computeSummary } from "../shared/utils.js";

export async function getRelaxSession(date = localToday()) {
  const snap = await getDoc(doc(db, "relax", getUid(), "sessions", date));
  if (!snap.exists()) return null;
  const data = snap.data() || {};
  return { date: data.date || date, items: Array.isArray(data.items) ? data.items : [] };
}

export async function saveRelaxSession(date = localToday(), items = []) {
  await setDoc(doc(db, "relax", getUid(), "sessions", date), {
    date,
    items,
    saved_at: serverTimestamp(),
  });
  return { ok: true };
}

// Für die journal-dev Timeline-Aggregation (Journal zeigt alle Pillars).
export async function getRelaxSessionHistory(n = 30, before = null) {
  const constraints = [orderBy("date", "desc")];
  if (before) constraints.push(startAfter(before));
  constraints.push(fbLimit(n));
  const q = query(collection(db, "relax", getUid(), "sessions"), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data() || {};
    return { date: data.date || d.id, items: Array.isArray(data.items) ? data.items : [], saved_at: data.saved_at };
  });
}

export async function getRelaxTechniques() {
  return TECHNIQUES;
}

export async function getRelaxStatsSummary(days = 14) {
  const dates = lastDates(days);
  const sessionsByDate = {};
  for (const date of dates) {
    sessionsByDate[date] = await getRelaxSession(date);
  }
  return computeSummary(sessionsByDate, days);
}

export async function exportRelaxCsv(days = 14) {
  const dates = lastDates(days);
  const rows = [["date", "technique", "minutes", "focus", "arrival_minutes", "practice_minutes", "return_minutes", "setting", "mood_before", "mood_after", "reflection", "transfer", "note"]];
  for (const date of dates) {
    const sess = await getRelaxSession(date);
    for (const it of (sess?.items || [])) {
      rows.push([
        date, it.technique || "", it.minutes || "", it.focus || "",
        it.arrival_minutes ?? "", it.practice_minutes ?? "", it.return_minutes ?? "",
        it.setting || "", it.mood_before ?? "", it.mood_after ?? "",
        it.reflection || it.note || "", it.transfer || "", it.note || "",
      ]);
    }
  }
  const csv = rows.map((r) => r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(",")).join("\n");
  return { filename: `relax-${days}d-${localToday()}.csv`, csv };
}
