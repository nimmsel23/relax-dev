import { test } from "node:test";
import assert from "node:assert/strict";
import { isBreathTechnique, breathByDate, currentStreak, longestStreak, lastDays, suggestionForHour } from "../src/lib/breath/stats.js";
import { getPattern } from "../src/lib/breath/patterns.js";

const s = (date, ...items) => ({ date, items: items.map(([technique, minutes]) => ({ technique, minutes })) });

test("Atem-Erkennung: Tab-Techniken und Katalog-Namen, nicht andere", () => {
  assert.ok(isBreathTechnique("Atemübung 4-7-8"));
  assert.ok(isBreathTechnique("Atemübung: Physiologischer Seufzer"));
  assert.ok(isBreathTechnique("Box Breathing (4-4-4-4)"));
  assert.ok(!isBreathTechnique("Body Scan"));
  assert.ok(!isBreathTechnique("Spaziergang (low stress)"));
  assert.ok(!isBreathTechnique(undefined));
});

test("breathByDate summiert nur Atem-Items und lässt leere Tage weg", () => {
  const by = breathByDate([
    s("2026-10-27", ["Atemübung 4-7-8", 3], ["Body Scan", 20], ["Box Breathing (4-4-4-4)", 5]),
    s("2026-10-26", ["Body Scan", 10]),
    s("2026-10-25"),
  ]);
  assert.deepEqual(by, { "2026-10-27": 8 });
});

test("currentStreak: zählt rückwärts, heute leer wahrt die Serie ab gestern", () => {
  const by = { "2026-10-28": 3, "2026-10-27": 5, "2026-10-26": 1, "2026-10-24": 4 };
  assert.equal(currentStreak(by, "2026-10-28"), 3);
  assert.equal(currentStreak({ "2026-10-27": 5, "2026-10-26": 1 }, "2026-10-28"), 2); // heute noch offen
  assert.equal(currentStreak({ "2026-10-26": 5 }, "2026-10-28"), 0); // gestern fehlt → gerissen
  assert.equal(currentStreak({}, "2026-10-28"), 0);
});

test("currentStreak: Monats- und Jahreswechsel", () => {
  const by = { "2026-11-01": 1, "2026-10-31": 1, "2026-10-30": 1 };
  assert.equal(currentStreak(by, "2026-11-01"), 3);
  assert.equal(currentStreak({ "2027-01-01": 1, "2026-12-31": 1 }, "2027-01-01"), 2);
});

test("longestStreak findet die längste Lauffolge", () => {
  const by = { "2026-10-01": 1, "2026-10-02": 1, "2026-10-04": 1, "2026-10-05": 1, "2026-10-06": 1, "2026-10-09": 1 };
  assert.equal(longestStreak(by), 3);
  assert.equal(longestStreak({}), 0);
});

test("lastDays liefert n Tage, ältester zuerst, heute zuletzt", () => {
  const d = lastDays({ "2026-10-28": 4, "2026-10-26": 2 }, "2026-10-28", 7);
  assert.equal(d.length, 7);
  assert.equal(d[0].date, "2026-10-22");
  assert.equal(d[6].date, "2026-10-28");
  assert.equal(d[6].minutes, 4);
  assert.equal(d[4].minutes, 2);
});

test("suggestionForHour verweist über alle Stunden auf existierende Muster", () => {
  for (let h = 0; h < 24; h++) {
    const sug = suggestionForHour(h);
    assert.ok(getPattern(sug.patternId), `Stunde ${h}: ${sug.patternId}`);
    assert.ok(sug.reason);
  }
});
