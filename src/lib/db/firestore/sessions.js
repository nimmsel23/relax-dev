/**
 * firestore/sessions.js — Relax Session CRUD für Firestore.
 * Collection: relax/{uid}/sessions/{date}
 *
 * Namensraum "Relax*" ist Absicht: relax-dev embeddet in die vitalos-Shell
 * über den globalen '@db'-Alias, dessen Barrel bereits generische Namen wie
 * getSession/saveSession/exportCsv als fitness-dev-SSOT vergeben hat.
 */

import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
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
  const rows = [["date", "technique", "minutes", "mood_before", "mood_after", "note"]];
  for (const date of dates) {
    const sess = await getRelaxSession(date);
    for (const it of (sess?.items || [])) {
      rows.push([date, it.technique || "", it.minutes || "", it.mood_before ?? "", it.mood_after ?? "", it.note || ""]);
    }
  }
  const csv = rows.map((r) => r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(",")).join("\n");
  return { filename: `relax-${days}d-${localToday()}.csv`, csv };
}
